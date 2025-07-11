const pool = require('../database/pool');

// Hilfsfunktion: Prüft, ob eine Zusammenarbeit zwischen zwei Nutzern für einen Post existiert
const checkCollaboration = async (postId, user1Id, user2Id) => {
  const result = await pool.query(
    `SELECT id FROM help_offers 
     WHERE post_id = $1 
     AND ((helper_id = $2 AND post_owner_id = $3) OR (helper_id = $3 AND post_owner_id = $2))
     AND status IN ('accepted', 'completed')`,
    [postId, user1Id, user2Id]
  );
  return result.rows.length > 0;
};

exports.checkExistingRating = async (req, res) => {
  try {
    const { postId } = req.params;
    const raterId = req.user.userId;

    // Prüfe ob der Benutzer bereits eine Bewertung für diesen Post abgegeben hat
    const existingRating = await pool.query(
      'SELECT id FROM ratings WHERE rater_id = $1 AND post_id = $2',
      [raterId, postId]
    );

    const hasRated = existingRating.rows.length > 0;

    // Hole Post-Informationen für weitere Prüfungen
    const postResult = await pool.query(
      'SELECT user_id FROM posts WHERE id = $1',
      [postId]
    );

    if (postResult.rows.length === 0) {
      return res.status(404).json({ error: 'Post nicht gefunden' });
    }

    const postOwnerId = postResult.rows[0].user_id;
    let canRate = false;
    let reason = '';

    // Prüfe, ob der Bewertende der Post-Ersteller ist
    if (raterId === postOwnerId) {
      // Post-Ersteller kann nur bewerten, wenn er Hilfe erhalten hat
      const hasReceivedHelp = await checkCollaboration(postId, raterId, raterId);
      if (hasReceivedHelp) {
        canRate = true;
      } else {
        reason = 'Sie können nur bewerten, wenn Sie Hilfe erhalten haben';
      }
    } else {
      // Andere Nutzer können nur bewerten, wenn sie dem Post-Ersteller geholfen haben
      const hasHelped = await checkCollaboration(postId, raterId, postOwnerId);
      if (hasHelped) {
        canRate = true;
      } else {
        reason = 'Sie können nur bewerten, wenn Sie an einer Zusammenarbeit beteiligt waren';
      }
    }

    res.json({
      hasRated,
      canRate,
      reason,
      postId: parseInt(postId),
      raterId
    });
  } catch (error) {
    console.error('Database error:', error);
    res.status(500).json({ error: 'Fehler beim Prüfen der Bewertung' });
  }
};

exports.createRating = async (req, res) => {
  try {
    const { rated_user_id, post_id, rating, comment } = req.body;
    const rater_id = req.user.userId;
    
    if (!rated_user_id || !post_id || !rating) {
      return res.status(400).json({ error: 'rated_user_id, post_id und rating sind erforderlich' });
    }
    
    if (rating < 1 || rating > 5) {
      return res.status(400).json({ error: 'Rating muss zwischen 1 und 5 liegen' });
    }
    
    if (rater_id === rated_user_id) {
      return res.status(400).json({ error: 'Sie können sich nicht selbst bewerten' });
    }

    // Prüfe, ob bereits eine Bewertung existiert
    const existingRating = await pool.query(
      'SELECT id FROM ratings WHERE rater_id = $1 AND rated_user_id = $2 AND post_id = $3',
      [rater_id, rated_user_id, post_id]
    );
    
    if (existingRating.rows.length > 0) {
      return res.status(400).json({ error: 'Sie haben diesen Benutzer für diesen Post bereits bewertet' });
    }

    // Prüfe, ob eine Zusammenarbeit existiert
    const hasCollaboration = await checkCollaboration(post_id, rater_id, rated_user_id);
    if (!hasCollaboration) {
      return res.status(403).json({ error: 'Sie können nur bewerten, wenn Sie an einer Zusammenarbeit beteiligt waren' });
    }

    const result = await pool.query(
      `INSERT INTO ratings (rater_id, rated_user_id, post_id, rating, comment)
       VALUES ($1, $2, $3, $4, $5)
       RETURNING id, created_at`,
      [rater_id, rated_user_id, post_id, rating, comment || null]
    );
    
    res.json({
      success: true,
      message: 'Bewertung erfolgreich erstellt',
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
    console.error('Database error:', error);
    res.status(500).json({ error: 'Fehler beim Erstellen der Bewertung' });
  }
};

exports.getUserRatingSummary = async (req, res) => {
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
      average_rating: summary.average_rating ? parseFloat(summary.average_rating) : 0,
      rating_distribution: {
        5: parseInt(summary.five_stars),
        4: parseInt(summary.four_stars),
        3: parseInt(summary.three_stars),
        2: parseInt(summary.two_stars),
        1: parseInt(summary.one_star),
      },
    });
  } catch (error) {
    console.error('Database error:', error);
    res.status(500).json({ error: 'Fehler beim Abrufen der Bewertungsübersicht' });
  }
};

exports.getUserRatings = async (req, res) => {
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
    console.error('Database error:', error);
    res.status(500).json({ error: 'Fehler beim Abrufen der Bewertungen' });
  }
}; 