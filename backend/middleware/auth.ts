import jwt from 'jsonwebtoken';
import { Request, Response, NextFunction } from 'express';
import { JWTPayload } from '../types/index.js';

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key-change-in-production';

function verifyToken(token: string): JWTPayload | null {
  try {
    return jwt.verify(token, JWT_SECRET) as JWTPayload;
  } catch {
    return null;
  }
}

// Extend Express Request interface to include user
declare global {
  namespace Express {
    interface Request {
      user?: JWTPayload;
    }
  }
}

const authenticateToken = (req: Request, res: Response, next: NextFunction): void => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    res.status(401).json({ error: 'Authentifizierung erforderlich' });
    return;
  }

  const decoded = verifyToken(token);
  if (!decoded) {
    res.status(401).json({ error: 'Ungültiger Token' });
    return;
  }

  req.user = decoded;
  next();
};

// Middleware für Google-User ohne vollständige Daten
const checkGoogleUserComplete = (req: Request, res: Response, next: NextFunction): void => {
  // Prüfe ob User Google-Authentifizierung verwendet und keine PLZ hat
  if (req.user && !req.user.postal_code) {
    res.status(403).json({ 
      error: 'Profil nicht vollständig - Postleitzahl erforderlich',
      requiresProfileCompletion: true 
    });
    return;
  }
  
  next();
};

export { authenticateToken, checkGoogleUserComplete }; 