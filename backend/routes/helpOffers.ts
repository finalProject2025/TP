import express, { Router } from 'express';
import { authenticateToken } from '../middleware/auth';
import * as postsController from '../controllers/postsController';

const router: Router = express.Router();

// Hilfe-Angebote-Routen
router.get('/help-offers', authenticateToken, postsController.getHelpOffers);
router.post('/help-offers', authenticateToken, postsController.offerHelp);
router.put('/help-offers/:offerId/accept', authenticateToken, postsController.acceptHelpOffer);
router.put('/help-offers/:offerId/decline', authenticateToken, postsController.declineHelpOffer);
router.put('/help-offers/:offerId/read', authenticateToken, postsController.markHelpOfferAsRead);

// NEUE ROUTE: Gemachte Hilfe-Angebote des aktuellen Users
router.get('/help-offers/my-made-offers', authenticateToken, postsController.getMyMadeHelpOffers);

export default router;