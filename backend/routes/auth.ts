import express, { Router, Request, Response, NextFunction } from 'express';
import { login, register, getGoogleClientId, googleLogin, verifyEmail, resendVerificationEmail } from '../controllers/authController';

const router: Router = express.Router();

// Validator Funktion
const validateLogin = (req: Request, res: Response, next: NextFunction) => {
  const { email, password } = req.body;
  
  if (!email || !password) {
    return res.status(400).json({ error: 'Email und Passwort erforderlich' });
  }
  
  if (typeof email !== 'string' || typeof password !== 'string') {
    return res.status(400).json({ error: 'Ungültige Datentypen' });
  }
  
  next();
};

// Traditional Auth Routes mit Validator
router.post('/login', validateLogin, login);
router.post('/register', validateLogin, register);

// E-Mail-Validierung Routes
router.post('/verify-email', verifyEmail);
router.post('/resend-verification', resendVerificationEmail);

// Google OAuth Routes
router.get('/google/client-id', getGoogleClientId);
router.post('/google', googleLogin);

export default router;