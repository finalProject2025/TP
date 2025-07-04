import express from "express";
import cors from "cors";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import pkg from "pg"; // weil pg kein ESM-Export hat
const { Pool } = pkg;
import dotenv from "dotenv";
dotenv.config();

// Initialize Express app
const app = express();

// Environment variables with defaults
const NODE_ENV = process.env.NODE_ENV;
const PORT = process.env.PORT;
const JWT_SECRET =
  process.env.JWT_SECRET;
const BCRYPT_ROUNDS = parseInt(process.env.BCRYPT_ROUNDS);

// Database configuration
const pool = new Pool({
  user: process.env.DB_USER,
  host: process.env.DB_HOST,
  database: process.env.DB_NAME,
  password: process.env.DB_PASSWORD,
  port: parseInt(process.env.DB_PORT),
});

// Test database connection
async function testConnection() {
  try {
    const client = await pool.connect();
    if (NODE_ENV === "development") {
      console.log("✅ Database connected successfully");
    }
    client.release();
    return true;
  } catch (err) {
    console.error("❌ Database connection failed:", err.message);
    console.log("⚠️ Server will start without database (some features disabled)");
    return false;
  }
}

// CORS Configuration
const corsOrigins = process.env.CORS_ORIGINS

// Middleware
app.use(
  cors({
    origin: corsOrigins,
    credentials: true,
    methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization"],
  })
);

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Helper function to verify JWT token
function verifyToken(token) {
  try {
    return jwt.verify(token, JWT_SECRET);
  } catch (error) {
    return null;
  }
}

// Middleware to authenticate requests
const authenticateToken = (req, res, next) => {
  const authHeader = req.headers["authorization"];
  const token = authHeader && authHeader.split(" ")[1];

  if (!token) {
    return res.status(401).json({ error: "Authentifizierung erforderlich" });
  }

  const decoded = verifyToken(token);
  if (!decoded) {
    return res.status(401).json({ error: "Ungültiger Token" });
  }

  req.user = decoded;
  next();
};

// Health check route
app.get("/health", (req, res) => {
  res.json({
    status: "OK",
    message: "Server is running",
    database: global.dbConnected ? "Connected" : "Disconnected",
  });
});

// Auth Routes
app.post("/api/auth/register", async (req, res) => {
  try {
    const { email, password, first_name, last_name, postal_code } = req.body;

    if (!email || !password || !first_name || !last_name || !postal_code) {
      return res.status(400).json({
        error:
          "Alle Felder sind erforderlich: E-Mail, Passwort, Vor- und Nachname, Postleitzahl",
      });
    }

    if (password.length < 6) {
      return res.status(400).json({
        error: "Das Passwort muss mindestens 6 Zeichen lang sein",
      });
    }

    // Check if user already exists
    const existingUser = await pool.query(
      "SELECT id FROM users WHERE email = $1",
      [email.toLowerCase()]
    );

    if (existingUser.rows.length > 0) {
      return res.status(400).json({
        error: "Ein Benutzer mit dieser E-Mail-Adresse existiert bereits",
      });
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Insert new user
    const result = await pool.query(
      `INSERT INTO users (email, password_hash, first_name, last_name, postal_code, created_at, updated_at)
       VALUES ($1, $2, $3, $4, $5, NOW(), NOW())
       RETURNING id, email, first_name, last_name, created_at`,
      [email.toLowerCase(), hashedPassword, first_name, last_name, postal_code]
    );

    const user = result.rows[0];

    // Generate JWT token
    const token = jwt.sign({ userId: user.id, email: user.email }, JWT_SECRET, {
      expiresIn: "7d",
    });

    res.status(201).json({
      message: "Benutzer erfolgreich registriert",
      user: {
        id: user.id,
        email: user.email,
        first_name: user.first_name,
        last_name: user.last_name,
        postal_code,
        created_at: user.created_at,
      },
      token,
    });
  } catch (error) {
    console.error("Database error:", error);
    res.status(500).json({ error: "Fehler bei der Registrierung" });
  }
});

app.post("/api/auth/login", async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({
        error: "E-Mail und Passwort sind erforderlich",
      });
    }

    // Find user
    const result = await pool.query(
      "SELECT id, email, password_hash, first_name, last_name FROM users WHERE email = $1",
      [email.toLowerCase()]
    );

    if (result.rows.length === 0) {
      return res.status(401).json({
        error: "Ungültige E-Mail oder Passwort",
      });
    }

    const user = result.rows[0];

    // Verify password using bcrypt
    let isValidPassword = false;
    try {
      isValidPassword = await bcrypt.compare(password, user.password_hash);
    } catch (error) {
      console.error("Password verification error:", error.message);
      return res.status(500).json({
        error: "Fehler bei der Passwort-Überprüfung",
      });
    }

    if (!isValidPassword) {
      return res.status(401).json({
        error: "Ungültige E-Mail oder Passwort",
      });
    }

    // Generate JWT token
    const token = jwt.sign({ userId: user.id, email: user.email }, JWT_SECRET, {
      expiresIn: "7d",
    });

    res.json({
      message: "Anmeldung erfolgreich",
      user: {
        id: user.id,
        email: user.email,
        first_name: user.first_name,
        last_name: user.last_name,
        postal_code: user.postal_code,
      },
      token,
    });
  } catch (error) {
    console.error("Database error:", error);
    res.status(500).json({ error: "Fehler bei der Anmeldung" });
  }
});

// Posts Routes
app.get("/api/posts", async (req, res) => {
  try {
    console.log("🔍 GET /api/posts called");

    // Auto-close expired posts first
    await pool.query(`
      UPDATE posts
      SET status = 'auto_closed', is_active = false
      WHERE status = 'active'
      AND auto_close_date < NOW()
    `);

    const result = await pool.query(`
      SELECT
        p.id, p.user_id, p.type, p.title, p.description,
        p.location, p.created_at, p.updated_at, p.category,
        p.status, p.auto_close_date,
        u.first_name, u.last_name
      FROM posts p
      LEFT JOIN users u ON p.user_id = u.id
      WHERE p.is_active = true AND p.status IN ('active', 'in_progress')
      ORDER BY p.created_at DESC
    `);

    console.log("📊 Found posts:", result.rows.length);
    console.log("📊 First post status:", result.rows[0]?.status);

    const posts = result.rows.map((row) => {
      const first_name = row.first_name || "Unbekannt";
      const last_name = row.last_name || "";

      return {
        id: row.id,
        user_id: row.user_id,
        type: row.type,
        category: row.category || "Sonstiges",
        title: row.title,
        description: row.description,
        location: row.location || "Nicht angegeben",
        postal_code: "12345",
        is_active: true,
        status: row.status || "active",
        auto_close_date: row.auto_close_date,
        created_at: row.created_at,
        updated_at: row.updated_at,
        user: {
          id: row.user_id,
          first_name,
          last_name,
          postal_code: "12345",
          initials:
            first_name.charAt(0) +
            (last_name.charAt(0) || first_name.charAt(1) || ""),
        },
      };
    });

    res.json({ posts });
  } catch (error) {
    console.error("Database error:", error);
    res.status(500).json({ error: "Fehler beim Laden der Posts" });
  }
});

app.get("/api/posts/categories", async (req, res) => {
  try {
    const result = await pool.query(
      "SELECT name FROM categories WHERE is_active = true ORDER BY name"
    );
    const categories = result.rows.map((row) => row.name);
    res.json({ categories });
  } catch (error) {
    console.error("Database error:", error);
    res.status(500).json({ error: "Fehler beim Laden der Kategorien" });
  }
});

app.post("/api/posts", authenticateToken, async (req, res) => {
  try {
    const { type, category, title, description, location, postal_code } =
      req.body;

    if (!type || !category || !title || !description) {
      return res.status(400).json({
        error: "Typ, Kategorie, Titel und Beschreibung sind erforderlich",
      });
    }

    // Validate category exists
    const categoryResult = await pool.query(
      "SELECT name FROM categories WHERE name = $1",
      [category]
    );

    if (categoryResult.rows.length === 0) {
      return res.status(400).json({ error: "Ungültige Kategorie" });
    }

    // Insert new post with auto_close_date (3 days from now)
    const result = await pool.query(
      `INSERT INTO posts (user_id, category, title, description, type, location, postal_code, status, auto_close_date, created_at, updated_at)
       VALUES ($1, $2, $3, $4, $5, $6, $7, 'active', NOW() + INTERVAL '3 days', NOW(), NOW())
       RETURNING id, created_at, updated_at, auto_close_date`,
      [
        req.user.userId,
        category,
        title,
        description,
        type,
        location || "Nicht angegeben",
        postal_code || "12345",
      ]
    );

    const newPost = result.rows[0];

    // Get user info for response
    const userResult = await pool.query(
      "SELECT first_name, last_name FROM users WHERE id = $1",
      [req.user.userId]
    );

    const user = userResult.rows[0];
    const first_name = user?.first_name || "Unbekannt";
    const last_name = user?.last_name || "";

    const post = {
      id: newPost.id,
      user_id: req.user.userId,
      type,
      category,
      title,
      description,
      location: location || "Nicht angegeben",
      postal_code: postal_code || "12345",
      is_active: true,
      status: "active",
      auto_close_date: newPost.auto_close_date,
      created_at: newPost.created_at,
      updated_at: newPost.updated_at,
      user: {
        id: req.user.userId,
        first_name,
        last_name,
        postal_code: "12345",
        initials:
          first_name.charAt(0) +
          (last_name.charAt(0) || first_name.charAt(1) || ""),
      },
    };

    res.status(201).json({
      message: "Post erfolgreich erstellt",
      post,
    });
  } catch (error) {
    console.error("Database error:", error);
    res.status(500).json({ error: "Fehler beim Erstellen des Posts" });
  }
});

// Close Post Route
app.put("/api/posts/:postId/close", authenticateToken, async (req, res) => {
  try {
    const { postId } = req.params;

    // Check if user owns the post
    const postResult = await pool.query(
      "SELECT user_id FROM posts WHERE id = $1",
      [postId]
    );

    if (postResult.rows.length === 0) {
      return res.status(404).json({ error: "Post nicht gefunden" });
    }

    if (postResult.rows[0].user_id !== req.user.userId) {
      return res
        .status(403)
        .json({ error: "Nicht berechtigt, diesen Post zu schließen" });
    }

    // Close the post
    const result = await pool.query(
      "UPDATE posts SET status = 'closed', is_active = false, updated_at = NOW() WHERE id = $1 RETURNING *",
      [postId]
    );

    res.json({
      success: true,
      message: "Post erfolgreich geschlossen",
      post: result.rows[0],
    });
  } catch (error) {
    console.error("Database error:", error);
    res.status(500).json({ error: "Fehler beim Schließen des Posts" });
  }
});

// Close Post Route
app.put("/api/posts/:postId/close", authenticateToken, async (req, res) => {
  try {
    console.log("🔧 Close post request received");
    console.log("🔧 postId:", req.params.postId);
    console.log("🔧 userId:", req.user.userId);

    const { postId } = req.params;
    const userId = req.user.userId;

    // Check if user owns the post
    const postResult = await pool.query(
      "SELECT user_id, type, status FROM posts WHERE id = $1",
      [postId]
    );

    console.log("🔧 Post found:", postResult.rows[0]);

    if (postResult.rows.length === 0) {
      console.log("🔧 Post not found");
      return res.status(404).json({ error: "Post nicht gefunden" });
    }

    if (postResult.rows[0].user_id !== userId) {
      console.log("🔧 Permission denied - not owner");
      return res
        .status(403)
        .json({ error: "Sie können nur Ihre eigenen Posts schließen" });
    }

    console.log("🔧 Closing post...");
    // Close the post
    const updateResult = await pool.query(
      "UPDATE posts SET status = 'closed', is_active = false, updated_at = NOW() WHERE id = $1",
      [postId]
    );

    console.log("🔧 Update result:", updateResult.rowCount);

    res.json({
      success: true,
      message: "Post erfolgreich geschlossen",
    });
  } catch (error) {
    console.error("Database error:", error);
    res.status(500).json({ error: "Fehler beim Schließen des Posts" });
  }
});

// Contact Help Offer Route (for when someone wants to contact a help offer)
app.post("/api/posts/:postId/contact", authenticateToken, async (req, res) => {
  try {
    const { postId } = req.params;
    const { message } = req.body;
    const contacterId = req.user.userId;

    // Get post details
    const postResult = await pool.query(
      "SELECT user_id, title, type FROM posts WHERE id = $1",
      [postId]
    );

    if (postResult.rows.length === 0) {
      return res.status(404).json({ error: "Post nicht gefunden" });
    }

    const post = postResult.rows[0];

    // Only allow contact for help offers
    if (post.type !== "offer") {
      return res
        .status(400)
        .json({ error: "Kontakt nur bei Hilfe-Angeboten möglich" });
    }

    // Don't allow contacting own posts
    if (post.user_id === contacterId) {
      return res
        .status(400)
        .json({ error: "Sie können nicht Ihren eigenen Post kontaktieren" });
    }

    // Get contacter details
    const contacterResult = await pool.query(
      "SELECT first_name, last_name FROM users WHERE id = $1",
      [contacterId]
    );

    if (contacterResult.rows.length === 0) {
      return res.status(404).json({ error: "Benutzer nicht gefunden" });
    }

    const contacter = contacterResult.rows[0];

    // Create help offer entry (similar to help requests)
    const helpOfferResult = await pool.query(
      `INSERT INTO help_offers (post_id, helper_id, post_creator_id, message, created_at)
       VALUES ($1, $2, $3, $4, NOW())
       RETURNING id`,
      [
        postId,
        contacterId,
        post.user_id,
        message ||
          `${contacter.first_name} ${contacter.last_name} möchte Kontakt aufnehmen`,
      ]
    );

    res.json({
      success: true,
      message: "Kontaktanfrage gesendet",
      helpOfferId: helpOfferResult.rows[0].id,
    });
  } catch (error) {
    console.error("Database error:", error);
    res.status(500).json({ error: "Fehler beim Senden der Kontaktanfrage" });
  }
});

// Help Offers Routes
app.post("/api/posts/:postId/help", authenticateToken, async (req, res) => {
  try {
    const { postId } = req.params;
    const { message } = req.body;
    const helperId = req.user.userId;

    // Post und Post-Ersteller laden
    const postResult = await pool.query(
      "SELECT id, user_id, title, type FROM posts WHERE id = $1 AND is_active = true",
      [postId]
    );

    if (postResult.rows.length === 0) {
      return res.status(404).json({ error: "Post nicht gefunden" });
    }

    const post = postResult.rows[0];
    const postOwnerId = post.user_id;

    // Prüfen ob User versucht sich selbst zu helfen
    if (helperId === postOwnerId) {
      return res
        .status(400)
        .json({ error: "Sie können nicht Ihre eigenen Posts beantworten" });
    }

    // Prüfen ob bereits Hilfe angeboten wurde
    const existingOffer = await pool.query(
      "SELECT id FROM help_offers WHERE post_id = $1 AND helper_id = $2",
      [postId, helperId]
    );

    if (existingOffer.rows.length > 0) {
      return res
        .status(400)
        .json({ error: "Sie haben bereits Hilfe für diesen Post angeboten" });
    }

    // Hilfe-Angebot erstellen
    const helpOfferResult = await pool.query(
      `INSERT INTO help_offers (post_id, helper_id, post_owner_id, message, created_at, updated_at)
       VALUES ($1, $2, $3, $4, NOW(), NOW())
       RETURNING *`,
      [postId, helperId, postOwnerId, message || null]
    );

    res.status(201).json({
      success: true,
      message: "Hilfe-Angebot erfolgreich gesendet",
      help_offer: helpOfferResult.rows[0],
    });
  } catch (error) {
    console.error("Database error:", error);
    res.status(500).json({ error: "Fehler beim Senden des Hilfe-Angebots" });
  }
});

// Get help offers for user's posts
app.get("/api/help-offers", authenticateToken, async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT
        ho.id, ho.post_id, ho.helper_id, ho.message, ho.status, ho.is_read, ho.created_at,
        p.title as post_title, p.type as post_type, p.category as post_category,
        u.first_name, u.last_name, u.postal_code
       FROM help_offers ho
       JOIN posts p ON ho.post_id = p.id
       JOIN users u ON ho.helper_id = u.id
       WHERE ho.post_owner_id = $1
       ORDER BY ho.created_at DESC`,
      [req.user.userId]
    );

    res.json({ help_offers: result.rows });
  } catch (error) {
    console.error("Database error:", error);
    res.status(500).json({ error: "Fehler beim Laden der Hilfe-Angebote" });
  }
});

// Mark help offer as read
app.put(
  "/api/help-offers/:offerId/read",
  authenticateToken,
  async (req, res) => {
    try {
      const { offerId } = req.params;

      const result = await pool.query(
        "UPDATE help_offers SET is_read = true WHERE id = $1 AND post_owner_id = $2 RETURNING *",
        [offerId, req.user.userId]
      );

      if (result.rows.length === 0) {
        return res.status(404).json({ error: "Hilfe-Angebot nicht gefunden" });
      }

      res.json({ success: true, help_offer: result.rows[0] });
    } catch (error) {
      console.error("Database error:", error);
      res.status(500).json({ error: "Fehler beim Markieren als gelesen" });
    }
  }
);

// Accept help offer
app.put(
  "/api/help-offers/:offerId/accept",
  authenticateToken,
  async (req, res) => {
    try {
      const { offerId } = req.params;

      // Hilfe-Angebot laden und prüfen
      const offerResult = await pool.query(
        "SELECT * FROM help_offers WHERE id = $1 AND post_owner_id = $2",
        [offerId, req.user.userId]
      );

      if (offerResult.rows.length === 0) {
        return res.status(404).json({ error: "Hilfe-Angebot nicht gefunden" });
      }

      const offer = offerResult.rows[0];

      if (offer.status !== "pending") {
        return res
          .status(400)
          .json({ error: "Hilfe-Angebot wurde bereits bearbeitet" });
      }

      // Status auf 'accepted' setzen und als gelesen markieren
      const result = await pool.query(
        "UPDATE help_offers SET status = 'accepted', is_read = true, updated_at = NOW() WHERE id = $1 RETURNING *",
        [offerId]
      );

      res.json({
        success: true,
        message: "Hilfe-Angebot angenommen",
        help_offer: result.rows[0],
      });
    } catch (error) {
      console.error("Database error:", error);
      res
        .status(500)
        .json({ error: "Fehler beim Annehmen des Hilfe-Angebots" });
    }
  }
);

// Decline help offer
app.put(
  "/api/help-offers/:offerId/decline",
  authenticateToken,
  async (req, res) => {
    try {
      const { offerId } = req.params;

      // Hilfe-Angebot laden und prüfen
      const offerResult = await pool.query(
        "SELECT * FROM help_offers WHERE id = $1 AND post_owner_id = $2",
        [offerId, req.user.userId]
      );

      if (offerResult.rows.length === 0) {
        return res.status(404).json({ error: "Hilfe-Angebot nicht gefunden" });
      }

      const offer = offerResult.rows[0];

      if (offer.status !== "pending") {
        return res
          .status(400)
          .json({ error: "Hilfe-Angebot wurde bereits bearbeitet" });
      }

      // Status auf 'declined' setzen und als gelesen markieren
      const result = await pool.query(
        "UPDATE help_offers SET status = 'declined', is_read = true, updated_at = NOW() WHERE id = $1 RETURNING *",
        [offerId]
      );

      res.json({
        success: true,
        message: "Hilfe-Angebot abgelehnt",
        help_offer: result.rows[0],
      });
    } catch (error) {
      console.error("Database error:", error);
      res
        .status(500)
        .json({ error: "Fehler beim Ablehnen des Hilfe-Angebots" });
    }
  }
);

// Chat/Messages Routes
app.get("/api/conversations", authenticateToken, async (req, res) => {
  try {
    // Get conversations using a simplified approach
    const result = await pool.query(
      `
      WITH conversation_partners AS (
        SELECT DISTINCT
          CASE
            WHEN sender_id = $1 THEN receiver_id
            ELSE sender_id
          END as other_user_id,
          (
            SELECT post_id
            FROM messages
            WHERE ((sender_id = $1 AND receiver_id = CASE WHEN sender_id = $1 THEN receiver_id ELSE sender_id END)
                OR (sender_id = CASE WHEN sender_id = $1 THEN receiver_id ELSE sender_id END AND receiver_id = $1))
              AND post_id IS NOT NULL
            ORDER BY created_at ASC
            LIMIT 1
          ) as related_post_id
        FROM messages
        WHERE sender_id = $1 OR receiver_id = $1
      )
      SELECT
        cp.other_user_id,
        u.first_name || ' ' || u.last_name as other_user_name,
        cp.related_post_id,
        p.title as post_title,
        p.type as post_type,
        (SELECT content FROM messages
         WHERE (sender_id = $1 AND receiver_id = cp.other_user_id)
            OR (sender_id = cp.other_user_id AND receiver_id = $1)
         ORDER BY created_at DESC LIMIT 1) as last_message,
        (SELECT created_at FROM messages
         WHERE (sender_id = $1 AND receiver_id = cp.other_user_id)
            OR (sender_id = cp.other_user_id AND receiver_id = $1)
         ORDER BY created_at DESC LIMIT 1) as last_message_time,
        (SELECT COUNT(*) FROM messages
         WHERE receiver_id = $1 AND sender_id = cp.other_user_id AND is_read = false) as unread_count
      FROM conversation_partners cp
      LEFT JOIN users u ON cp.other_user_id = u.id
      LEFT JOIN posts p ON p.id = cp.related_post_id
      ORDER BY last_message_time DESC
    `,
      [req.user.userId]
    );

    res.json({ conversations: result.rows });
  } catch (error) {
    console.error("Database error:", error);
    res.status(500).json({ error: "Fehler beim Laden der Unterhaltungen" });
  }
});

app.get("/api/messages/unread-count", authenticateToken, async (req, res) => {
  try {
    console.log(
      "Counting unread messages and help offers for user:",
      req.user.userId
    );

    // Ungelesene Nachrichten zählen
    const messagesResult = await pool.query(
      "SELECT COUNT(*) as unread_count FROM messages WHERE receiver_id = $1 AND is_read = false",
      [req.user.userId]
    );

    // Ungelesene Hilfe-Angebote zählen (für Post-Ersteller)
    const helpOffersResult = await pool.query(
      "SELECT COUNT(*) as unread_count FROM help_offers WHERE post_owner_id = $1 AND is_read = false",
      [req.user.userId]
    );

    const totalUnread =
      parseInt(messagesResult.rows[0].unread_count) +
      parseInt(helpOffersResult.rows[0].unread_count);

    console.log("Unread messages:", messagesResult.rows[0].unread_count);
    console.log("Unread help offers:", helpOffersResult.rows[0].unread_count);
    console.log("Total unread:", totalUnread);

    res.json({ unread_count: totalUnread });
  } catch (error) {
    console.error("Database error:", error);
    res
      .status(500)
      .json({ error: "Fehler beim Laden der ungelesenen Nachrichten" });
  }
});

app.get("/api/messages/:otherUserId", authenticateToken, async (req, res) => {
  try {
    const { otherUserId } = req.params;

    if (!otherUserId) {
      return res.status(400).json({ error: "Benutzer-ID ist erforderlich" });
    }

    // Get all messages between the two users
    const result = await pool.query(
      `
      SELECT
        m.id, m.content, m.created_at, m.sender_id, m.receiver_id,
        u.first_name, u.last_name,
        CASE WHEN m.sender_id = $1 THEN true ELSE false END as is_own_message
      FROM messages m
      LEFT JOIN users u ON m.sender_id = u.id
      WHERE (m.sender_id = $1 AND m.receiver_id = $2)
         OR (m.sender_id = $2 AND m.receiver_id = $1)
      ORDER BY m.created_at ASC
    `,
      [req.user.userId, otherUserId]
    );

    // Mark messages as read (messages received by current user)
    await pool.query(
      "UPDATE messages SET is_read = true WHERE receiver_id = $1 AND sender_id = $2",
      [req.user.userId, otherUserId]
    );

    res.json({ messages: result.rows });
  } catch (error) {
    console.error("Database error:", error);
    res.status(500).json({ error: "Fehler beim Laden der Nachrichten" });
  }
});

app.post("/api/conversations/start", authenticateToken, async (req, res) => {
  try {
    const { other_user_id, post_id, initial_message } = req.body;

    if (!other_user_id) {
      return res.status(400).json({ error: "Benutzer-ID ist erforderlich" });
    }

    // Check if other user exists
    const userCheck = await pool.query("SELECT id FROM users WHERE id = $1", [
      other_user_id,
    ]);

    if (userCheck.rows.length === 0) {
      return res.status(400).json({ error: "Benutzer nicht gefunden" });
    }

    // Send initial message using existing messages table structure
    const result = await pool.query(
      `
      INSERT INTO messages (sender_id, receiver_id, post_id, subject, content)
      VALUES ($1, $2, $3, $4, $5)
      RETURNING id, created_at
    `,
      [
        req.user.userId,
        other_user_id,
        post_id || null,
        "Chat über Post",
        initial_message || `Hallo! Ich interessiere mich für Ihren Post.`,
      ]
    );

    res.status(201).json({
      message: "Chat-Nachricht gesendet",
      message_id: result.rows[0].id,
    });
  } catch (error) {
    console.error("Database error:", error);
    res.status(500).json({
      error: "Fehler beim Starten der Unterhaltung: " + error.message,
    });
  }
});

// Profile Routes
app.get("/api/profile", authenticateToken, async (req, res) => {
  try {
    const result = await pool.query(
      "SELECT id, email, first_name, last_name, postal_code, profile_image_url, created_at FROM users WHERE id = $1",
      [req.user.userId]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: "Benutzer nicht gefunden" });
    }

    const user = result.rows[0];
    res.json({
      user: {
        id: user.id,
        email: user.email,
        first_name: user.first_name,
        last_name: user.last_name,
        postal_code: user.postal_code,
        profile_image_url: user.profile_image_url,
        created_at: user.created_at,
      },
    });
  } catch (error) {
    console.error("Database error:", error);
    res.status(500).json({ error: "Fehler beim Laden des Profils" });
  }
});

app.put("/api/profile", authenticateToken, async (req, res) => {
  try {
    const { first_name, last_name, postal_code, profile_image_url } = req.body;

    if (!first_name || !last_name) {
      return res.status(400).json({
        error: "Vor- und Nachname sind erforderlich",
      });
    }

    const result = await pool.query(
      `UPDATE users
       SET first_name = $1, last_name = $2, postal_code = $3, profile_image_url = $4, updated_at = NOW()
       WHERE id = $5
       RETURNING id, email, first_name, last_name, postal_code, profile_image_url`,
      [first_name, last_name, postal_code, profile_image_url, req.user.userId]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: "Benutzer nicht gefunden" });
    }

    res.json({
      message: "Profil erfolgreich aktualisiert",
      user: result.rows[0],
    });
  } catch (error) {
    console.error("Database error:", error);
    res.status(500).json({ error: "Fehler beim Aktualisieren des Profils" });
  }
});

app.put("/api/profile/password", authenticateToken, async (req, res) => {
  try {
    const { current_password, new_password, confirm_password } = req.body;

    if (!current_password || !new_password || !confirm_password) {
      return res.status(400).json({
        error: "Alle Passwort-Felder sind erforderlich",
      });
    }

    if (new_password !== confirm_password) {
      return res.status(400).json({
        error: "Neues Passwort und Bestätigung stimmen nicht überein",
      });
    }

    if (new_password.length < 6) {
      return res.status(400).json({
        error: "Das neue Passwort muss mindestens 6 Zeichen lang sein",
      });
    }

    // Get current user
    const userResult = await pool.query(
      "SELECT password_hash FROM users WHERE id = $1",
      [req.user.userId]
    );

    if (userResult.rows.length === 0) {
      return res.status(404).json({ error: "Benutzer nicht gefunden" });
    }

    const user = userResult.rows[0];

    // Verify current password using bcrypt
    let isValidPassword = false;
    try {
      isValidPassword = await bcrypt.compare(
        current_password,
        user.password_hash
      );
    } catch (error) {
      console.error("Password verification error:", error.message);
      return res.status(500).json({
        error: "Fehler bei der Passwort-Überprüfung",
      });
    }

    if (!isValidPassword) {
      return res.status(401).json({
        error: "Aktuelles Passwort ist falsch",
      });
    }

    // Hash new password
    const hashedPassword = await bcrypt.hash(new_password, 10);

    // Update password
    await pool.query(
      "UPDATE users SET password_hash = $1, updated_at = NOW() WHERE id = $2",
      [hashedPassword, req.user.userId]
    );

    res.json({
      message: "Passwort erfolgreich geändert",
    });
  } catch (error) {
    console.error("Database error:", error);
    res.status(500).json({ error: "Fehler beim Ändern des Passworts" });
  }
});

app.post("/api/auth/logout", authenticateToken, async (req, res) => {
  try {
    // In a real app, you might want to blacklist the token
    // For now, we just return success and let the frontend handle token removal
    res.json({
      message: "Erfolgreich abgemeldet",
    });
  } catch (error) {
    console.error("Logout error:", error);
    res.status(500).json({ error: "Fehler beim Abmelden" });
  }
});

// Delete conversation (all messages between two users)
app.delete(
  "/api/conversations/:otherUserId",
  authenticateToken,
  async (req, res) => {
    try {
      const { otherUserId } = req.params;
      const currentUserId = req.user.userId;

      console.log("🗑️ Delete conversation request:");
      console.log("🗑️ currentUserId:", currentUserId);
      console.log("🗑️ otherUserId:", otherUserId);

      // Delete all messages between the two users
      const deleteResult = await pool.query(
        `DELETE FROM messages
       WHERE (sender_id = $1 AND receiver_id = $2)
          OR (sender_id = $2 AND receiver_id = $1)`,
        [currentUserId, otherUserId]
      );

      console.log("🗑️ Deleted messages count:", deleteResult.rowCount);

      res.json({
        success: true,
        message: "Unterhaltung erfolgreich gelöscht",
        deletedCount: deleteResult.rowCount,
      });
    } catch (error) {
      console.error("Database error:", error);
      res.status(500).json({ error: "Fehler beim Löschen der Unterhaltung" });
    }
  }
);

// Rating Routes
// Create a rating
app.post("/api/ratings", authenticateToken, async (req, res) => {
  try {
    const { rated_user_id, post_id, rating, comment } = req.body;
    const rater_id = req.user.userId;

    console.log("⭐ Create rating request:");
    console.log("⭐ rater_id:", rater_id);
    console.log("⭐ rated_user_id:", rated_user_id);
    console.log("⭐ post_id:", post_id);
    console.log("⭐ rating:", rating);

    // Validation
    if (!rated_user_id || !post_id || !rating) {
      return res
        .status(400)
        .json({ error: "rated_user_id, post_id und rating sind erforderlich" });
    }

    if (rating < 1 || rating > 5) {
      return res
        .status(400)
        .json({ error: "Rating muss zwischen 1 und 5 liegen" });
    }

    if (rater_id === rated_user_id) {
      return res
        .status(400)
        .json({ error: "Sie können sich nicht selbst bewerten" });
    }

    // Check if rating already exists
    const existingRating = await pool.query(
      "SELECT id FROM ratings WHERE rater_id = $1 AND rated_user_id = $2 AND post_id = $3",
      [rater_id, rated_user_id, post_id]
    );

    if (existingRating.rows.length > 0) {
      return res
        .status(400)
        .json({
          error: "Sie haben diesen Benutzer für diesen Post bereits bewertet",
        });
    }

    // Create rating
    const result = await pool.query(
      `INSERT INTO ratings (rater_id, rated_user_id, post_id, rating, comment)
       VALUES ($1, $2, $3, $4, $5)
       RETURNING id, created_at`,
      [rater_id, rated_user_id, post_id, rating, comment || null]
    );

    console.log("⭐ Rating created:", result.rows[0]);

    res.json({
      success: true,
      message: "Bewertung erfolgreich erstellt",
      rating: {
        id: result.rows[0].id,
        rater_id,
        rated_user_id,
        post_id,
        rating,
        comment,
        created_at: result.rows[0].created_at,
      },
    });
  } catch (error) {
    console.error("Database error:", error);
    res.status(500).json({ error: "Fehler beim Erstellen der Bewertung" });
  }
});

// Get user rating summary
app.get("/api/users/:userId/rating-summary", async (req, res) => {
  try {
    const { userId } = req.params;

    const result = await pool.query(
      `SELECT
        COUNT(*) as total_ratings,
        AVG(rating)::DECIMAL(3,1) as average_rating,
        COUNT(CASE WHEN rating = 5 THEN 1 END) as five_stars,
        COUNT(CASE WHEN rating = 4 THEN 1 END) as four_stars,
        COUNT(CASE WHEN rating = 3 THEN 1 END) as three_stars,
        COUNT(CASE WHEN rating = 2 THEN 1 END) as two_stars,
        COUNT(CASE WHEN rating = 1 THEN 1 END) as one_star
       FROM ratings
       WHERE rated_user_id = $1`,
      [userId]
    );

    const summary = result.rows[0];

    res.json({
      user_id: userId,
      total_ratings: parseInt(summary.total_ratings),
      average_rating: summary.average_rating
        ? parseFloat(summary.average_rating)
        : 0,
      rating_distribution: {
        5: parseInt(summary.five_stars),
        4: parseInt(summary.four_stars),
        3: parseInt(summary.three_stars),
        2: parseInt(summary.two_stars),
        1: parseInt(summary.one_star),
      },
    });
  } catch (error) {
    console.error("Database error:", error);
    res
      .status(500)
      .json({ error: "Fehler beim Abrufen der Bewertungsübersicht" });
  }
});

// Get user ratings (with comments)
app.get("/api/users/:userId/ratings", async (req, res) => {
  try {
    const { userId } = req.params;
    const limit = parseInt(req.query.limit) || 10;

    const result = await pool.query(
      `SELECT
        r.id, r.rating, r.comment, r.created_at,
        u.first_name, u.last_name,
        p.title as post_title, p.type as post_type
       FROM ratings r
       JOIN users u ON r.rater_id = u.id
       JOIN posts p ON r.post_id = p.id
       WHERE r.rated_user_id = $1
       ORDER BY r.created_at DESC
       LIMIT $2`,
      [userId, limit]
    );

    res.json({
      user_id: userId,
      ratings: result.rows.map((row) => ({
        id: row.id,
        rating: row.rating,
        comment: row.comment,
        created_at: row.created_at,
        rater_name: `${row.first_name} ${row.last_name}`,
        post_title: row.post_title,
        post_type: row.post_type,
      })),
    });
  } catch (error) {
    console.error("Database error:", error);
    res.status(500).json({ error: "Fehler beim Abrufen der Bewertungen" });
  }
});

// Start server
async function startServer() {
  global.dbConnected = await testConnection();
  
    const server = app.listen(PORT, "0.0.0.0", () => {
    console.log(`🚀 Server running on port ${PORT}`);
    console.log(`📊 Environment: ${NODE_ENV}`);
    if (NODE_ENV === "production") {
      console.log(
        `CORS enabled for: ${process.env.CORS_ORIGINS}`
      );
    }
    console.log(`🗄️ Database: ${global.dbConnected ? "PostgreSQL connected" : "Not connected"}`);
  });

  return server;
}

startServer().catch(console.error);

export default app;

