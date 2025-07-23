import express, { Router } from 'express';
import { authenticateToken, checkGoogleUserComplete } from '../middleware/auth';
import * as postsController from '../controllers/postsController';

const router: Router = express.Router();

router.get('/', authenticateToken, postsController.getPosts);
router.get('/categories', postsController.getCategories);
router.post('/', authenticateToken, checkGoogleUserComplete, postsController.createPost);
router.put('/:postId/close', authenticateToken, checkGoogleUserComplete, postsController.closePost);
router.post('/:postId/help', authenticateToken, checkGoogleUserComplete, postsController.offerHelp);
router.get('/help-offers', authenticateToken, postsController.getHelpOffers);
router.put('/help-offers/:offerId/read', authenticateToken, postsController.markHelpOfferAsRead);
router.put('/help-offers/:offerId/accept', authenticateToken, checkGoogleUserComplete, postsController.acceptHelpOffer);
router.put('/help-offers/:offerId/decline', authenticateToken, checkGoogleUserComplete, postsController.declineHelpOffer);

export default router; 