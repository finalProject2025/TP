import { Request, Response } from 'express';
import pool from '../database/pool';
import { RatingInfoResponse, CreateReviewRequest } from '../types/index';

// Hilfsfunktion: Prüft, ob eine Zusammenarbeit zwischen zwei Nutzern für einen Post existiert
const checkCollaboration = async (postId: string, user1Id: string, user2Id: string): Promise<boolean> => {
  const result = await pool.query(
    `SELECT id FROM help_offers 
     WHERE post_id = $1 
     AND ((helper_id = $2 AND post_owner_id = $3) OR (helper_id = $3 AND post_owner_id = $2))
     AND status IN ('accepted', 'completed')`,
    [postId, user1Id, user2Id]
  );
  return result.rows.length > 0;
};

export const checkExistingRating = async (req: Request, res: Response): Promise<void> => {
  try {
    const { postId } = req.params;
    const raterId = req.user?.userId;

    console.log('Checking rating for postId:', postId, 'raterId:', raterId);

    if (!raterId) {
      res.status(401).json({ error: 'Nicht authentifiziert' });
      return;
    }

    // Hole Post-Informationen für weitere Prüfungen
    const postResult = await pool.query(
      'SELECT user_id FROM posts WHERE id = $1',
      [postId]
    );

    if (postResult.rows.length === 0) {
      res.status(404).json({ error: 'Post nicht gefunden' });
      return;
    }

    const postOwnerId = postResult.rows[0].user_id;
    console.log('Post owner ID:', postOwnerId);
    
    let canRate = false;
    let reason = '';
    let ratedUserId = '';
    let ratedUserName = '';

    // Prüfe, ob der Bewertende der Post-Ersteller ist
    if (raterId === postOwnerId) {
      console.log('Rater is post owner, checking for help received');
      // Post-Ersteller kann nur bewerten, wenn er Hilfe erhalten hat
      // Prüfe direkt, ob es akzeptierte oder abgeschlossene Hilfe-Angebote gibt
      const helpOffersResult = await pool.query(
        `SELECT h.helper_id, u.first_name, u.last_name 
         FROM help_offers h 
         JOIN users u ON h.helper_id = u.id 
         WHERE h.post_id = $1 AND h.post_owner_id = $2 AND h.status IN ('accepted', 'completed')
         LIMIT 1`,
        [postId, raterId]
      );
      
      console.log('Help offers found:', helpOffersResult.rows.length);
      
      if (helpOffersResult.rows.length > 0) {
        ratedUserId = helpOffersResult.rows[0].helper_id;
        ratedUserName = `${helpOffersResult.rows[0].first_name} ${helpOffersResult.rows[0].last_name}`;
        canRate = true;
        console.log('Post owner can rate helper:', ratedUserName);
      } else {
        reason = 'Sie können nur bewerten, wenn Sie Hilfe erhalten haben';
        console.log('Post owner cannot rate - no help received');
      }
    } else {
      console.log('Rater is not post owner, checking if they helped');
      // Andere Nutzer können nur bewerten, wenn sie dem Post-Ersteller geholfen haben
      const hasHelped = await checkCollaboration(postId, raterId, postOwnerId);
      console.log('Has helped:', hasHelped);
      
      if (hasHelped) {
        // Der Helfer bewertet den Post-Ersteller
        const postOwnerResult = await pool.query(
          'SELECT first_name, last_name FROM users WHERE id = $1',
          [postOwnerId]
        );
        
        if (postOwnerResult.rows.length > 0) {
          ratedUserId = postOwnerId;
          ratedUserName = `${postOwnerResult.rows[0].first_name} ${postOwnerResult.rows[0].last_name}`;
          canRate = true;
        } else {
          reason = 'Post-Ersteller nicht gefunden';
        }
      } else {
        reason = 'Sie können nur bewerten, wenn Sie an einer Zusammenarbeit beteiligt waren';
        console.log('Helper cannot rate - no collaboration');
      }
    }

    // Prüfe ob der Benutzer bereits eine Bewertung für diesen Post abgegeben hat
    const existingRating = await pool.query(
      'SELECT id FROM ratings WHERE rater_id = $1 AND post_id = $2',
      [raterId, postId]
    );

    const hasRated = existingRating.rows.length > 0;

    const response: RatingInfoResponse = {
      hasRated,
      canRate,
      reason,
      ratedUserId,
      ratedUserName,
      postId: parseInt(postId),
      raterId
    };
    res.json(response);
  } catch (error) {
    console.error('Database error:', error);
    res.status(500).json({ error: 'Fehler beim Prüfen der Bewertung' });
  }
};

export const getUserRatingSummary = async (req: Request, res: Response): Promise<void> => {
  try {
    const { userId } = req.params;
    
    // Get total ratings and average
    const summaryResult = await pool.query(
      `SELECT COUNT(*) as total_ratings, AVG(rating) as average_rating
       FROM ratings WHERE rated_user_id = $1`,
      [userId]
    );
    
    // Get rating distribution
    const distributionResult = await pool.query(
      `SELECT rating, COUNT(*) as count
       FROM ratings WHERE rated_user_id = $1
       GROUP BY rating ORDER BY rating`,
      [userId]
    );
    
    const totalRatings = parseInt(summaryResult.rows[0]?.total_ratings || '0');
    const averageRating = parseFloat(summaryResult.rows[0]?.average_rating || '0');
    
    const ratingDistribution = {
      1: 0, 2: 0, 3: 0, 4: 0, 5: 0
    };
    
    distributionResult.rows.forEach((row: Record<string, unknown>) => {
      const rating = row.rating as number;
      const count = parseInt(String(row.count));
      if (rating >= 1 && rating <= 5) {
        ratingDistribution[rating as keyof typeof ratingDistribution] = count;
      }
    });
    
    res.json({
      total_ratings: totalRatings,
      average_rating: averageRating,
      rating_distribution: ratingDistribution
    });
  } catch (error) {
    console.error('Database error:', error);
    res.status(500).json({ error: 'Fehler beim Laden der Bewertungszusammenfassung' });
  }
}; 

export const createRating = async (req: Request<{}, Record<string, unknown>, CreateReviewRequest>, res: Response): Promise<void> => {
  try {
    const { rated_user_id, post_id, rating, comment } = req.body;
    const rater_id = req.user?.userId;

    if (!rater_id) {
      res.status(401).json({ error: 'Nicht authentifiziert' });
      return;
    }

    // Prüfe, ob bereits eine Bewertung für diesen Post existiert
    const existingRating = await pool.query(
      'SELECT id FROM ratings WHERE rater_id = $1 AND post_id = $2',
      [rater_id, post_id]
    );

    if (existingRating.rows.length > 0) {
      res.status(400).json({ error: 'Sie haben bereits eine Bewertung für diesen Post abgegeben' });
      return;
    }

    // Validiere Rating-Wert
    if (rating < 1 || rating > 5) {
      res.status(400).json({ error: 'Bewertung muss zwischen 1 und 5 liegen' });
      return;
    }

    // Erstelle die Bewertung
    const result = await pool.query(
      `INSERT INTO ratings (rater_id, rated_user_id, post_id, rating, comment, created_at)
       VALUES ($1, $2, $3, $4, $5, NOW())
       RETURNING *`,
      [rater_id, rated_user_id, post_id, rating, comment || null]
    );

          // Prüfe, ob beide Parteien bewertet haben (Post-Ersteller und Helfer)
      const postResult = await pool.query(
        'SELECT user_id FROM posts WHERE id = $1',
        [post_id]
      );

      if (postResult.rows.length > 0) {
        const postOwnerId = postResult.rows[0].user_id;
        
        // Hole alle Bewertungen für diesen Post
        const allRatingsResult = await pool.query(
          'SELECT rater_id FROM ratings WHERE post_id = $1',
          [post_id]
        );

        const raterIds = allRatingsResult.rows.map((row: Record<string, unknown>) => row.rater_id as string);
        
        // Prüfe, ob sowohl Post-Ersteller als auch Helfer bewertet haben
        const hasPostOwnerRated = raterIds.includes(postOwnerId);
        const hasHelperRated = raterIds.some(id => id !== postOwnerId);
        
        if (hasPostOwnerRated && hasHelperRated) {
          // Beide haben bewertet - setze Post-Status auf 'rated'
          await pool.query(
            "UPDATE posts SET status = 'rated', updated_at = NOW() WHERE id = $1",
            [post_id]
          );
        }
      }

    res.status(201).json({
      success: true,
      message: 'Bewertung erfolgreich erstellt',
      rating: result.rows[0]
    });
  } catch (error) {
    console.error('Database error:', error);
    res.status(500).json({ error: 'Fehler beim Erstellen der Bewertung' });
  }
};

export const getUserRatings = async (req: Request, res: Response): Promise<void> => {
  try {
    const { userId } = req.params;
    
    const result = await pool.query(
      `SELECT r.*, 
              u.first_name as rater_first_name, 
              u.last_name as rater_last_name,
              p.title as post_title
       FROM ratings r
       JOIN users u ON r.rater_id = u.id
       LEFT JOIN posts p ON r.post_id = p.id
       WHERE r.rated_user_id = $1
       ORDER BY r.created_at DESC`,
      [userId]
    );
    
    res.json({ ratings: result.rows });
  } catch (error) {
    console.error('Database error:', error);
    res.status(500).json({ error: 'Fehler beim Laden der Bewertungen' });
  }
}; 