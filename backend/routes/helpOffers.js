const express = require('express');
const { authenticateToken } = require('../middleware/auth');
const postsController = require('../controllers/postsController');
const router = express.Router();

// Gibt alle Hilfeangebote für den eingeloggten Nutzer zurück
router.get('/', authenticateToken, postsController.getHelpOffers);
router.put('/:offerId/accept', authenticateToken, postsController.acceptHelpOffer);
router.put('/:offerId/decline', authenticateToken, postsController.declineHelpOffer);
router.put('/:offerId/read', authenticateToken, postsController.markHelpOfferAsRead);

module.exports = router; 