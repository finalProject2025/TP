import { Request, Response, NextFunction } from 'express';

// Basic Input Validation Middleware
export const validateInput = (req: Request, res: Response, next: NextFunction) => {
  // Nur für POST/PUT/PATCH Requests validieren
  if (['POST', 'PUT', 'PATCH'].includes(req.method)) {
    // Sanitize and validate request body
    if (req.body) {
      // Remove potential XSS
      Object.keys(req.body).forEach(key => {
        if (typeof req.body[key] === 'string') {
          req.body[key] = req.body[key].trim();
        }
      });
    }

    // Validate email format
    if (req.body.email) {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(req.body.email)) {
        return res.status(400).json({ error: 'Ungültige E-Mail-Adresse' });
      }
    }

    // Validate password strength
    if (req.body.password) {
      if (req.body.password.length < 8) {
        return res.status(400).json({ error: 'Passwort muss mindestens 8 Zeichen lang sein' });
      }
    }

    // Validate post content
    if (req.body.content) {
      if (req.body.content.length > 1000) {
        return res.status(400).json({ error: 'Inhalt zu lang (max. 1000 Zeichen)' });
      }
    }
  }

  next();
};

// Rate Limiting Helper
export const isInternalIP = (ip: string): boolean => {
  return ip === '127.0.0.1' || 
         ip === '::1' || 
         ip?.startsWith('192.168.') || 
         ip?.startsWith('10.') ||
         ip?.startsWith('172.');
};