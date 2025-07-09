const pool = require('../database/pool');

exports.getPosts = async (req, res) => {
  try {
    // Auto-close expired posts first
    await pool.query(`
      UPDATE posts
      SET status = 'auto_closed', is_active = false
      WHERE status = 'active'
      AND auto_close_date < NOW()
    `);

    const userPostalCode = req.user && req.user.postal_code ? req.user.postal_code : null;
    console.log('[getPosts] User:', req.user ? req.user.email : 'unbekannt', '| PLZ:', userPostalCode);
    const result = await pool.query(`
      SELECT
        p.id, p.user_id, p.type, p.title, p.description,
        p.location, p.created_at, p.updated_at, p.category,
        p.status, p.auto_close_date, p.postal_code,
        u.first_name, u.last_name
      FROM posts p
      LEFT JOIN users u ON p.user_id = u.id
      WHERE p.is_active = true AND p.status IN ('active', 'in_progress')
        ${userPostalCode ? 'AND p.postal_code = $1' : ''}
      ORDER BY p.created_at DESC
    `, userPostalCode ? [userPostalCode] : []);

    const posts = result.rows.map((row) => {
      const first_name = row.first_name || 'Unbekannt';
      const last_name = row.last_name || '';
      return {
        id: row.id,
        user_id: row.user_id,
        type: row.type,
        category: row.category || 'Sonstiges',
        title: row.title,
        description: row.description,
        location: row.location || 'Nicht angegeben',
        postal_code: row.postal_code,
        is_active: true,
        status: row.status || 'active',
        auto_close_date: row.auto_close_date,
        created_at: row.created_at,
        updated_at: row.updated_at,
        user: {
          id: row.user_id,
          first_name,
          last_name,
          postal_code: row.postal_code,
          initials:
            first_name.charAt(0) +
            (last_name.charAt(0) || first_name.charAt(1) || ''),
        },
      };
    });
    res.json({ posts });
  } catch (error) {
    console.error('Database error:', error);
    res.status(500).json({ error: 'Fehler beim Laden der Posts' });
  }
};

exports.getCategories = async (req, res) => {
  try {
    const result = await pool.query(
      'SELECT name FROM categories WHERE is_active = true ORDER BY name'
    );
    const categories = result.rows.map((row) => row.name);
    res.json({ categories });
  } catch (error) {
    console.error('Database error:', error);
    res.status(500).json({ error: 'Fehler beim Laden der Kategorien' });
  }
};

exports.createPost = async (req, res) => {
  try {
    const { type, category, title, description, location, postal_code } = req.body;
    if (!type || !category || !title || !description) {
      return res.status(400).json({
        error: 'Typ, Kategorie, Titel und Beschreibung sind erforderlich',
      });
    }
    // Validate category exists
    const categoryResult = await pool.query(
      'SELECT name FROM categories WHERE name = $1',
      [category]
    );
    if (categoryResult.rows.length === 0) {
      return res.status(400).json({ error: 'Ungültige Kategorie' });
    }
    console.log('[createPost] User:', req.user ? req.user.email : 'unbekannt', '| PLZ im Token:', req.user ? req.user.postal_code : 'unbekannt', '| PLZ im Body:', postal_code);
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
        location || 'Nicht angegeben',
        postal_code ,
      ]
    );
    const newPost = result.rows[0];
    const userResult = await pool.query(
      'SELECT first_name, last_name FROM users WHERE id = $1',
      [req.user.userId]
    );
    const user = userResult.rows[0];
    const first_name = user?.first_name || 'Unbekannt';
    const last_name = user?.last_name || '';
    const post = {
      id: newPost.id,
      user_id: req.user.userId,
      type,
      category,
      title,
      description,
      location: location || 'Nicht angegeben',
      postal_code: postal_code,
      is_active: true,
      status: 'active',
      auto_close_date: newPost.auto_close_date,
      created_at: newPost.created_at,
      updated_at: newPost.updated_at,
      user: {
        id: req.user.userId,
        first_name,
        last_name,
        postal_code: postal_code,
        initials:
          first_name.charAt(0) +
          (last_name.charAt(0) || first_name.charAt(1) || ''),
      },
    };
    res.status(201).json({ message: 'Post erfolgreich erstellt', post });
  } catch (error) {
    console.error('Database error:', error);
    res.status(500).json({ error: 'Fehler beim Erstellen des Posts' });
  }
};

exports.closePost = async (req, res) => {
  try {
    const { postId } = req.params;
    // Check if user owns the post
    const postResult = await pool.query(
      'SELECT user_id FROM posts WHERE id = $1',
      [postId]
    );
    if (postResult.rows.length === 0) {
      return res.status(404).json({ error: 'Post nicht gefunden' });
    }
    if (postResult.rows[0].user_id !== req.user.userId) {
      return res.status(403).json({ error: 'Nicht berechtigt, diesen Post zu schließen' });
    }
    const result = await pool.query(
      "UPDATE posts SET status = 'closed', is_active = false, updated_at = NOW() WHERE id = $1 RETURNING *",
      [postId]
    );
    res.json({ success: true, message: 'Post erfolgreich geschlossen', post: result.rows[0] });
  } catch (error) {
    console.error('Database error:', error);
    res.status(500).json({ error: 'Fehler beim Schließen des Posts' });
  }
};

exports.offerHelp = async (req, res) => {
  try {
    const { postId } = req.params;
    const { message } = req.body;
    const helperId = req.user.userId;
    // Post und Post-Ersteller laden
    const postResult = await pool.query(
      'SELECT id, user_id, title, type FROM posts WHERE id = $1 AND is_active = true',
      [postId]
    );
    if (postResult.rows.length === 0) {
      return res.status(404).json({ error: 'Post nicht gefunden' });
    }
    const post = postResult.rows[0];
    const postOwnerId = post.user_id;
    if (helperId === postOwnerId) {
      return res.status(400).json({ error: 'Sie können nicht Ihre eigenen Posts beantworten' });
    }
    const existingOffer = await pool.query(
      'SELECT id FROM help_offers WHERE post_id = $1 AND helper_id = $2',
      [postId, helperId]
    );
    if (existingOffer.rows.length > 0) {
      return res.status(400).json({ error: 'Sie haben bereits Hilfe für diesen Post angeboten' });
    }
    const helpOfferResult = await pool.query(
      `INSERT INTO help_offers (post_id, helper_id, post_owner_id, message, created_at, updated_at)
       VALUES ($1, $2, $3, $4, NOW(), NOW())
       RETURNING *`,
      [postId, helperId, postOwnerId, message || null]
    );
    res.status(201).json({
      success: true,
      message: 'Hilfe-Angebot erfolgreich gesendet',
      help_offer: helpOfferResult.rows[0],
    });
  } catch (error) {
    console.error('Database error:', error);
    res.status(500).json({ error: 'Fehler beim Senden des Hilfe-Angebots' });
  }
};

exports.getHelpOffers = async (req, res) => {
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
    console.error('Database error:', error);
    res.status(500).json({ error: 'Fehler beim Laden der Hilfe-Angebote' });
  }
};

exports.markHelpOfferAsRead = async (req, res) => {
  try {
    const { offerId } = req.params;
    const result = await pool.query(
      'UPDATE help_offers SET is_read = true WHERE id = $1 AND post_owner_id = $2 RETURNING *',
      [offerId, req.user.userId]
    );
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Hilfe-Angebot nicht gefunden' });
    }
    res.json({ success: true, help_offer: result.rows[0] });
  } catch (error) {
    console.error('Database error:', error);
    res.status(500).json({ error: 'Fehler beim Markieren als gelesen' });
  }
};

exports.acceptHelpOffer = async (req, res) => {
  try {
    const { offerId } = req.params;
    const offerResult = await pool.query(
      'SELECT * FROM help_offers WHERE id = $1 AND post_owner_id = $2',
      [offerId, req.user.userId]
    );
    if (offerResult.rows.length === 0) {
      return res.status(404).json({ error: 'Hilfe-Angebot nicht gefunden' });
    }
    const offer = offerResult.rows[0];
    if (offer.status !== 'pending') {
      return res.status(400).json({ error: 'Hilfe-Angebot wurde bereits bearbeitet' });
    }
    const result = await pool.query(
      "UPDATE help_offers SET status = 'accepted', is_read = true, updated_at = NOW() WHERE id = $1 RETURNING *",
      [offerId]
    );
    res.json({ success: true, message: 'Hilfe-Angebot angenommen', help_offer: result.rows[0] });
  } catch (error) {
    console.error('Database error:', error);
    res.status(500).json({ error: 'Fehler beim Annehmen des Hilfe-Angebots' });
  }
};

exports.declineHelpOffer = async (req, res) => {
  try {
    const { offerId } = req.params;
    const offerResult = await pool.query(
      'SELECT * FROM help_offers WHERE id = $1 AND post_owner_id = $2',
      [offerId, req.user.userId]
    );
    if (offerResult.rows.length === 0) {
      return res.status(404).json({ error: 'Hilfe-Angebot nicht gefunden' });
    }
    const offer = offerResult.rows[0];
    if (offer.status !== 'pending') {
      return res.status(400).json({ error: 'Hilfe-Angebot wurde bereits bearbeitet' });
    }
    const result = await pool.query(
      "UPDATE help_offers SET status = 'declined', is_read = true, updated_at = NOW() WHERE id = $1 RETURNING *",
      [offerId]
    );
    res.json({ success: true, message: 'Hilfe-Angebot abgelehnt', help_offer: result.rows[0] });
  } catch (error) {
    console.error('Database error:', error);
    res.status(500).json({ error: 'Fehler beim Ablehnen des Hilfe-Angebots' });
  }
}; 