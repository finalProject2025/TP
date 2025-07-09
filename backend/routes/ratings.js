const express = require('express');
const { authenticateToken } = require('../middleware/auth');
const ratingsController = require('../controllers/ratingsController');
const router = express.Router();

router.post('/', authenticateToken, ratingsController.createRating);
router.get('/user/:userId/summary', ratingsController.getUserRatingSummary);
router.get('/user/:userId', ratingsController.getUserRatings);

module.exports = router; 