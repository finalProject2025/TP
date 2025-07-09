const express = require('express');
const { register, login, getProfile, updateProfile, changePassword } = require('../controllers/usersController');
const { authenticateToken } = require('../middleware/auth');
const ratingsController = require('../controllers/ratingsController');
const router = express.Router();

router.post('/register', register);
router.post('/login', login);
router.get('/profile', authenticateToken, getProfile);

// Bewertungs-Zusammenfassung für einen User
router.get('/:userId/rating-summary', ratingsController.getUserRatingSummary);

// Profil-Update (Controllerfunktion folgt)
router.put('/profile', authenticateToken, updateProfile);
router.put('/profile/password', authenticateToken, changePassword);
router.post('/forgot-password', require('../controllers/usersController').forgotPassword);
router.post('/reset-password', require('../controllers/usersController').resetPassword);

module.exports = router; 