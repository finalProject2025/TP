const express = require('express');
const { authenticateToken } = require('../middleware/auth');
const messagesController = require('../controllers/messagesController');
const router = express.Router();

// Spezifischere Route zuerst!
router.get('/messages/unread-count', authenticateToken, messagesController.getUnreadCount);
router.get('/messages/:otherUserId', authenticateToken, messagesController.getMessages);
router.get('/conversations', authenticateToken, messagesController.getConversations);
router.post('/conversations/start', authenticateToken, messagesController.sendMessage);
router.delete('/conversations/:otherUserId', authenticateToken, messagesController.deleteConversation);

module.exports = router; 