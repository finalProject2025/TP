const express = require('express');
const { authenticateToken } = require('../middleware/auth');
const postsController = require('../controllers/postsController');
const router = express.Router();

router.get('/', authenticateToken, postsController.getPosts);
router.get('/categories', postsController.getCategories);
router.post('/', authenticateToken, postsController.createPost);
router.put('/:postId/close', authenticateToken, postsController.closePost);
router.post('/:postId/help', authenticateToken, postsController.offerHelp);
router.get('/help-offers', authenticateToken, postsController.getHelpOffers);
router.put('/help-offers/:offerId/read', authenticateToken, postsController.markHelpOfferAsRead);
router.put('/help-offers/:offerId/accept', authenticateToken, postsController.acceptHelpOffer);
router.put('/help-offers/:offerId/decline', authenticateToken, postsController.declineHelpOffer);

module.exports = router; 