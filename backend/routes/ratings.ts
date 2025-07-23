import express, { Router } from 'express';
import { authenticateToken, checkGoogleUserComplete } from '../middleware/auth';
import * as ratingsController from '../controllers/ratingsController';

const router: Router = express.Router();

// Bewertungs-Routen
router.post('/', authenticateToken, checkGoogleUserComplete, ratingsController.createRating);
router.get('/check/:postId', authenticateToken, checkGoogleUserComplete, ratingsController.checkExistingRating);
router.get('/:userId', ratingsController.getUserRatings);
router.get('/:userId/summary', ratingsController.getUserRatingSummary);

export default router; 