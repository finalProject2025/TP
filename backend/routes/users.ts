import express, { Router } from 'express';
import { register, login, getProfile, updateProfile, changePassword, forgotPassword, resetPassword, updatePostalCode, verifyEmail, resendVerificationEmail } from '../controllers/usersController';
import { authenticateToken, checkGoogleUserComplete } from '../middleware/auth';
import * as ratingsController from '../controllers/ratingsController';

const router: Router = express.Router();

router.post('/register', register);
router.post('/login', login);

// E-Mail-Validierung Routes
router.post('/verify-email', verifyEmail);
router.post('/resend-verification', resendVerificationEmail);

// Spezifische Routen vor parametrisierten Routen
router.get('/profile', authenticateToken, getProfile);
router.put('/profile', authenticateToken, updateProfile); // Keine checkGoogleUserComplete Middleware, da diese Route für Profil-Vervollständigung verwendet wird
router.put('/profile/password', authenticateToken, checkGoogleUserComplete, changePassword);
router.put('/postal-code', authenticateToken, updatePostalCode);
router.post('/forgot-password', forgotPassword);
router.post('/reset-password', resetPassword);

// Bewertungs-Zusammenfassung für einen User (parametrisierte Route nach spezifischen Routen)
router.get('/:userId/rating-summary', ratingsController.getUserRatingSummary);

export default router; 