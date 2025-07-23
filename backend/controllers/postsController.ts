import { Request, Response } from 'express';
import pool from '../database/pool';
import {
  ExtendedPost,
  CreatePostRequest
} from '../types/index';
import { validatePostalCode } from '../utils/postalCodeValidator';
import { encryptPostalCode, decryptPostalCode } from '../utils/encryption';

// GET /posts
export const getPosts = async (req: Request, res: Response): Promise<void> => {
  try {
    // Auto-close expired posts first (only 'active' posts, not 'in_progress')
    await pool.query(`
      UPDATE posts
      SET status = 'auto_closed', is_active = false
      WHERE status = 'active'
      AND auto_close_date < NOW()
    `);

    const userPostalCode = req.user && req.user.postal_code ? req.user.postal_code : null;
    
    // Alle Posts laden (ohne PLZ-Filter, da wir sie entschlüsseln müssen)
    const result = await pool.query(
      `SELECT
        p.id, p.user_id, p.type, p.title, p.description,
        p.location, p.created_at, p.updated_at, p.category,
        p.status, p.auto_close_date, p.postal_code,
        u.first_name, u.last_name,
        CASE 
          WHEN EXISTS (
            SELECT 1 FROM help_offers 
            WHERE post_id = p.id 
            AND status IN ('accepted', 'completed')
          ) THEN true 
          ELSE false 
        END as has_active_collaboration
      FROM posts p
      LEFT JOIN users u ON p.user_id = u.id
      WHERE p.is_active = true AND p.status IN ('active', 'in_progress', 'rated')
      ORDER BY p.created_at DESC`
    );

    const posts: ExtendedPost[] = result.rows
      .map((row: Record<string, unknown>) => {
        const first_name = String(row.first_name || 'Unbekannt');
        const last_name = String(row.last_name || '');
        const encryptedPostalCode = String(row.postal_code);
        
        // PLZ entschlüsseln falls verschlüsselt
        const postal_code = encryptedPostalCode.includes(':') ? 
          decryptPostalCode(encryptedPostalCode) : encryptedPostalCode;
        
        return {
          id: String(row.id),
          user_id: String(row.user_id),
          type: String(row.type) as 'offer' | 'request',
          category: String(row.category || 'Sonstiges'),
          title: String(row.title),
          description: String(row.description),
          location: String(row.location || 'Nicht angegeben'),
          postal_code,
          is_active: true,
          status: String(row.status || 'active') as 'active' | 'in_progress' | 'rated' | 'closed' | 'auto_closed',
          auto_close_date: String(row.auto_close_date),
          created_at: String(row.created_at),
          updated_at: String(row.updated_at),
          has_active_collaboration: Boolean(row.has_active_collaboration),
          user: {
            id: String(row.user_id),
            email: '', // Placeholder - wird nicht aus DB geladen
            first_name,
            last_name,
            postal_code,
            initials:
              first_name.charAt(0) +
              (last_name.charAt(0) || first_name.charAt(1) || ''),
          },
        };
      })
      // PLZ-Filterung nach Entschlüsselung
      .filter(post => !userPostalCode || post.postal_code === userPostalCode);
    
    res.json({ posts });
  } catch (error) {
    console.error('Database error:', error);
    res.status(500).json({ error: 'Fehler beim Laden der Posts' });
  }
};

// GET /posts/categories
export const getCategories = async (req: Request, res: Response): Promise<void> => {
  try {
    const result = await pool.query(
      'SELECT name FROM categories WHERE is_active = true ORDER BY name'
    );
    const categories = result.rows.map((row: { name: string }) => row.name);
    res.json({ categories });
  } catch (error) {
    console.error('Database error:', error);
    res.status(500).json({ error: 'Fehler beim Laden der Kategorien' });
  }
};

// POST /posts
export const createPost = async (req: Request<{}, Record<string, unknown>, CreatePostRequest>, res: Response): Promise<void> => {
  try {
    const { type, category, title, description, location, postal_code } = req.body;
    if (!type || !category || !title || !description) {
      res.status(400).json({
        error: 'Typ, Kategorie, Titel und Beschreibung sind erforderlich',
      });
      return;
    }

    // PLZ-Validierung
    if (postal_code && !validatePostalCode(postal_code)) {
      res.status(400).json({ error: 'Bitte geben Sie eine gültige deutsche Postleitzahl ein' });
      return;
    }
    
    // PLZ verschlüsseln falls vorhanden
    const encryptedPostalCode = postal_code ? encryptPostalCode(postal_code) : null;
    
    // Validate category exists
    const categoryResult = await pool.query(
      'SELECT name FROM categories WHERE name = $1',
      [category]
    );
    if (categoryResult.rows.length === 0) {
      res.status(400).json({ error: 'Ungültige Kategorie' });
      return;
    }
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
        encryptedPostalCode,
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
    const post: ExtendedPost = {
      id: newPost.id,
      user_id: req.user.userId,
      type,
      category,
      title,
      description,
      location: location || 'Nicht angegeben',
      postal_code,
      is_active: true,
      status: 'active',
      auto_close_date: newPost.auto_close_date,
      created_at: newPost.created_at,
      updated_at: newPost.updated_at,
      user: {
        id: req.user.userId,
        email: '', // Placeholder - wird nicht aus DB geladen
        first_name,
        last_name,
        postal_code,
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

// PUT /posts/:postId/close
export const closePost = async (req: Request, res: Response): Promise<void> => {
  try {
    const { postId } = req.params;
    // Check if user owns the post
    const postResult = await pool.query(
      'SELECT user_id FROM posts WHERE id = $1',
      [postId]
    );
    if (postResult.rows.length === 0) {
      res.status(404).json({ error: 'Post nicht gefunden' });
      return;
    }
    if (postResult.rows[0].user_id !== req.user.userId) {
      res.status(403).json({ error: 'Nicht berechtigt, diesen Post zu schließen' });
      return;
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

// POST /posts/:postId/help-offers
export const offerHelp = async (req: Request, res: Response): Promise<void> => {
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
      res.status(404).json({ error: 'Post nicht gefunden' });
      return;
    }
    const post = postResult.rows[0];
    const postOwnerId = post.user_id;
    if (helperId === postOwnerId) {
      res.status(400).json({ error: 'Sie können nicht Ihre eigenen Posts beantworten' });
      return;
    }
    const existingOffer = await pool.query(
      'SELECT id FROM help_offers WHERE post_id = $1 AND helper_id = $2',
      [postId, helperId]
    );
    if (existingOffer.rows.length > 0) {
      res.status(400).json({ error: 'Sie haben bereits Hilfe für diesen Post angeboten' });
      return;
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

// GET /help-offers
export const getHelpOffers = async (req: Request, res: Response): Promise<void> => {
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

    // PLZ entschlüsseln
    const helpOffers = result.rows.map(row => ({
      ...row,
      postal_code: row.postal_code && row.postal_code.includes(':') ? 
        decryptPostalCode(row.postal_code) : row.postal_code
    }));

    res.json({ help_offers: helpOffers });
  } catch (error) {
    console.error('Database error:', error);
    res.status(500).json({ error: 'Fehler beim Laden der Hilfe-Angebote' });
  }
};

// PUT /help-offers/:offerId/read
export const markHelpOfferAsRead = async (req: Request, res: Response): Promise<void> => {
  try {
    const { offerId } = req.params;
    const result = await pool.query(
      'UPDATE help_offers SET is_read = true WHERE id = $1 AND post_owner_id = $2 RETURNING *',
      [offerId, req.user.userId]
    );
    if (result.rows.length === 0) {
      res.status(404).json({ error: 'Hilfe-Angebot nicht gefunden' });
      return;
    }
    res.json({ success: true, help_offer: result.rows[0] });
  } catch (error) {
    console.error('Database error:', error);
    res.status(500).json({ error: 'Fehler beim Markieren als gelesen' });
  }
};

// PUT /help-offers/:offerId/accept
export const acceptHelpOffer = async (req: Request, res: Response): Promise<void> => {
  try {
    const { offerId } = req.params;
    
    // First, get the help offer and post information
    const helpOfferResult = await pool.query(
      'SELECT post_id FROM help_offers WHERE id = $1 AND post_owner_id = $2',
      [offerId, req.user.userId]
    );
    
    if (helpOfferResult.rows.length === 0) {
      res.status(404).json({ error: 'Hilfe-Angebot nicht gefunden' });
      return;
    }
    
    const postId = helpOfferResult.rows[0].post_id;
    
    // Update help offer status
    const result = await pool.query(
      "UPDATE help_offers SET status = 'accepted', is_read = true, updated_at = NOW() WHERE id = $1 AND post_owner_id = $2 RETURNING *",
      [offerId, req.user.userId]
    );
    
    // Update post status to 'in_progress'
    await pool.query(
      "UPDATE posts SET status = 'in_progress', updated_at = NOW() WHERE id = $1",
      [postId]
    );
    
    res.json({ success: true, help_offer: result.rows[0] });
  } catch (error) {
    console.error('Database error:', error);
    res.status(500).json({ error: 'Fehler beim Akzeptieren des Hilfe-Angebots' });
  }
};

// PUT /help-offers/:offerId/decline
export const declineHelpOffer = async (req: Request, res: Response): Promise<void> => {
  try {
    const { offerId } = req.params;
    const result = await pool.query(
      "UPDATE help_offers SET status = 'declined', is_read = true, updated_at = NOW() WHERE id = $1 AND post_owner_id = $2 RETURNING *",
      [offerId, req.user.userId]
    );
    if (result.rows.length === 0) {
      res.status(404).json({ error: 'Hilfe-Angebot nicht gefunden' });
      return;
    }
    res.json({ success: true, help_offer: result.rows[0] });
  } catch (error) {
    console.error('Database error:', error);
    res.status(500).json({ error: 'Fehler beim Ablehnen des Hilfe-Angebots' });
  }
}; 

// GET /help-offers/my-made-offers
export const getMyMadeHelpOffers = async (req: Request, res: Response): Promise<void> => {
  try {
    const result = await pool.query(
      'SELECT * FROM help_offers WHERE helper_id = $1',
      [req.user.userId]
    );
    res.json(result.rows);
  } catch (error) {
    console.error('Database error:', error);
    res.status(500).json({ error: 'Fehler beim Laden der gemachten Hilfe-Angebote' });
  }
};