const pool = require('../database/pool');

exports.getConversations = async (req, res) => {
  try {
    const result = await pool.query(
      `WITH conversation_partners AS (
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
      ORDER BY last_message_time DESC`,
      [req.user.userId]
    );
    res.json({ conversations: result.rows });
  } catch (error) {
    console.error('Database error:', error);
    res.status(500).json({ error: 'Fehler beim Laden der Unterhaltungen' });
  }
};

exports.getMessages = async (req, res) => {
  try {
    const { otherUserId } = req.params;
    if (!otherUserId) {
      return res.status(400).json({ error: 'Benutzer-ID ist erforderlich' });
    }
    const result = await pool.query(
      `SELECT
        m.id, m.content, m.created_at, m.sender_id, m.receiver_id,
        u.first_name, u.last_name,
        CASE WHEN m.sender_id = $1 THEN true ELSE false END as is_own_message
      FROM messages m
      LEFT JOIN users u ON m.sender_id = u.id
      WHERE (m.sender_id = $1 AND m.receiver_id = $2)
         OR (m.sender_id = $2 AND m.receiver_id = $1)
      ORDER BY m.created_at ASC`,
      [req.user.userId, otherUserId]
    );
    await pool.query(
      'UPDATE messages SET is_read = true WHERE receiver_id = $1 AND sender_id = $2',
      [req.user.userId, otherUserId]
    );
    res.json({ messages: result.rows });
  } catch (error) {
    console.error('Database error:', error);
    res.status(500).json({ error: 'Fehler beim Laden der Nachrichten' });
  }
};

exports.getUnreadCount = async (req, res) => {
  try {
    const messagesResult = await pool.query(
      'SELECT COUNT(*) as unread_count FROM messages WHERE receiver_id = $1 AND is_read = false',
      [req.user.userId]
    );
    const helpOffersResult = await pool.query(
      'SELECT COUNT(*) as unread_count FROM help_offers WHERE post_owner_id = $1 AND is_read = false',
      [req.user.userId]
    );
    const totalUnread =
      parseInt(messagesResult.rows[0].unread_count) +
      parseInt(helpOffersResult.rows[0].unread_count);
    res.json({ unread_count: totalUnread });
  } catch (error) {
    console.error('Database error:', error);
    res.status(500).json({ error: 'Fehler beim Laden der ungelesenen Nachrichten' });
  }
};

exports.sendMessage = async (req, res) => {
  try {
    const { other_user_id, post_id, initial_message } = req.body;
    if (!other_user_id) {
      return res.status(400).json({ error: 'Benutzer-ID ist erforderlich' });
    }
    const userCheck = await pool.query('SELECT id FROM users WHERE id = $1', [other_user_id]);
    if (userCheck.rows.length === 0) {
      return res.status(400).json({ error: 'Benutzer nicht gefunden' });
    }
    const result = await pool.query(
      `INSERT INTO messages (sender_id, receiver_id, post_id, subject, content)
       VALUES ($1, $2, $3, $4, $5)
       RETURNING id, created_at`,
      [
        req.user.userId,
        other_user_id,
        post_id || null,
        'Chat über Post',
        initial_message || 'Hallo! Ich interessiere mich für Ihren Post.',
      ]
    );
    res.status(201).json({ message: 'Chat-Nachricht gesendet', message_id: result.rows[0].id });
  } catch (error) {
    console.error('Database error:', error);
    res.status(500).json({ error: 'Fehler beim Starten der Unterhaltung: ' + error.message });
  }
};

exports.deleteConversation = async (req, res) => {
  try {
    const { otherUserId } = req.params;
    const currentUserId = req.user.userId;
    const deleteResult = await pool.query(
      `DELETE FROM messages
       WHERE (sender_id = $1 AND receiver_id = $2)
          OR (sender_id = $2 AND receiver_id = $1)`,
      [currentUserId, otherUserId]
    );
    res.json({
      success: true,
      message: 'Unterhaltung erfolgreich gelöscht',
      deletedCount: deleteResult.rowCount,
    });
  } catch (error) {
    console.error('Database error:', error);
    res.status(500).json({ error: 'Fehler beim Löschen der Unterhaltung' });
  }
}; 