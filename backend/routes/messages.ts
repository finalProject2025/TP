import express, { Router } from 'express';
import { authenticateToken, checkGoogleUserComplete } from '../middleware/auth';
import * as messagesController from '../controllers/messagesController';

const router: Router = express.Router();

// Conversations-Routen
router.get('/conversations', authenticateToken, checkGoogleUserComplete, messagesController.getConversations);
router.post('/conversations/start', authenticateToken, checkGoogleUserComplete, messagesController.sendMessage);
router.delete('/conversations/:otherUserId', authenticateToken, checkGoogleUserComplete, messagesController.deleteConversation);

// Unread count - MUSS VOR der dynamischen Route stehen!
router.get('/messages/unread-count', authenticateToken, messagesController.getUnreadCount);

// Messages-Routen
router.get('/messages/:otherUserId', authenticateToken, checkGoogleUserComplete, messagesController.getMessages);
router.put('/messages/:messageId/read', authenticateToken, checkGoogleUserComplete, messagesController.markAsRead);

export default router; 