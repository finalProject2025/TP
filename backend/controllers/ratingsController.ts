const pool = require('../database/pool');

// Hilfsfunktion: Prüft, ob eine Zusammenarbeit zwischen zwei Nutzern für einen Post existiert
const checkCollaboration = async (postId: string, user1Id: string, user2Id: string) => {
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