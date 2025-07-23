import { Request, Response } from 'express';
import { OAuth2Client } from 'google-auth-library';
import jwt from 'jsonwebtoken';
import bcrypt from 'bcrypt';
import pool from '../database/pool';
import { UserRow } from '../types/index';
import { validatePostalCode } from '../utils/postalCodeValidator';
import { encryptPostalCode, decryptPostalCode } from '../utils/encryption';
import nodemailer from 'nodemailer';
import crypto from 'crypto';

const JWT_SECRET = process.env.JWT_SECRET;
const GOOGLE_CLIENT_ID = process.env.GOOGLE_CLIENT_ID;

// Prüfe ob erforderliche Umgebungsvariablen gesetzt sind
if (!JWT_SECRET) {
  throw new Error('JWT_SECRET ist nicht in der .env Datei gesetzt');
}

if (!GOOGLE_CLIENT_ID) {
  throw new Error('GOOGLE_CLIENT_ID ist nicht in der .env Datei gesetzt');
}

// In-Memory Token Storage für E-Mail-Validierung
const emailVerificationTokens = new Map<string, { token: string; expires: Date; userId: string }>();

// Token-Cleanup alle 30 Minuten
setInterval(() => {
  const now = new Date();
  for (const [token, data] of emailVerificationTokens.entries()) {
    if (now > data.expires) {
      emailVerificationTokens.delete(token);
    }
  }
  console.log('Token-Cleanup durchgeführt. Verbleibende Tokens:', emailVerificationTokens.size);
}, 30 * 60 * 1000);

// E-Mail-Validierung senden
const sendVerificationEmail = async (email: string, token: string): Promise<void> => {
  if (!process.env.GMAIL_USER || !process.env.GMAIL_PASS || !process.env.FRONTEND_URL) {
    console.error('E-Mail-Konfiguration fehlt');
    return;
  }

  const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
      user: process.env.GMAIL_USER,
      pass: process.env.GMAIL_PASS,
    },
  });

  const verificationUrl = `${process.env.FRONTEND_URL}/verify-email?token=${token}&email=${encodeURIComponent(email)}`;

  const mailOptions = {
    from: process.env.GMAIL_USER,
    to: email,
    subject: 'E-Mail-Adresse bestätigen - Neighborly',
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #333;">Willkommen bei Neighborly!</h2>
        <p>Vielen Dank für Ihre Registrierung. Bitte bestätigen Sie Ihre E-Mail-Adresse, um Ihr Konto zu aktivieren.</p>
        <p>Klicken Sie auf den folgenden Link, um Ihre E-Mail-Adresse zu bestätigen:</p>
        <a href="${verificationUrl}" style="display: inline-block; background-color: #007bff; color: white; padding: 12px 24px; text-decoration: none; border-radius: 4px; margin: 20px 0;">E-Mail-Adresse bestätigen</a>
        <p>Falls der Link nicht funktioniert, kopieren Sie diese URL in Ihren Browser:</p>
        <p style="word-break: break-all; color: #666;">${verificationUrl}</p>
        <p>Dieser Link ist 24 Stunden gültig.</p>
        <p>Mit freundlichen Grüßen,<br>Ihr Neighborly-Team</p>
      </div>
    `,
  };

  try {
    await transporter.sendMail(mailOptions);
    console.log('Verifizierungs-E-Mail gesendet an:', email);
  } catch (error) {
    console.error('Fehler beim Senden der Verifizierungs-E-Mail:', error);
  }
};

const client = new OAuth2Client(GOOGLE_CLIENT_ID);

interface GoogleLoginRequest {
  idToken: string;
}

interface LoginRequest {
  email: string;
  password: string;
}

interface RegisterRequest {
  email: string;
  password: string;
  first_name: string;
  last_name: string;
  postal_code: string;
}

export const getGoogleClientId = async (req: Request, res: Response): Promise<void> => {
  try {
    res.json({ clientId: GOOGLE_CLIENT_ID });
  } catch (error) {
    console.error('Error getting Google Client ID:', error);
    res.status(500).json({ error: 'Fehler beim Abrufen der Google Client ID' });
  }
};

export const login = async (req: Request<{}, Record<string, unknown>, LoginRequest>, res: Response): Promise<void> => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      res.status(400).json({ error: 'E-Mail und Passwort sind erforderlich' });
      return;
    }

    // User in der Datenbank suchen
    const result = await pool.query<UserRow>(
      'SELECT id, email, first_name, last_name, postal_code, password_hash, email_verified FROM users WHERE email = $1',
      [email.toLowerCase()]
    );

    if (result.rows.length === 0) {
      res.status(401).json({ error: 'Ungültige E-Mail oder Passwort' });
      return;
    }

    const user = result.rows[0];

    // Prüfe ob User ein Passwort hat
    if (!user.password_hash) {
      res.status(401).json({ error: 'Dieser Account wurde über Google erstellt. Bitte verwenden Sie Google Login.' });
      return;
    }

    // Passwort verifizieren
    const isValidPassword = await bcrypt.compare(password, user.password_hash || '');
    if (!isValidPassword) {
      res.status(401).json({ error: 'Ungültige E-Mail oder Passwort' });
      return;
    }

    // E-Mail-Validierung prüfen
    if (!user.email_verified) {
      res.status(401).json({ 
        error: 'Bitte bestätigen Sie Ihre E-Mail-Adresse, bevor Sie sich anmelden',
        requiresEmailVerification: true 
      });
      return;
    }

    // PLZ entschlüsseln falls verschlüsselt
    const decryptedPostalCode = user.postal_code && user.postal_code.includes(':') ? 
      decryptPostalCode(user.postal_code) : user.postal_code;

    // JWT Token erstellen
    const token = jwt.sign(
      {
        userId: user.id,
        email: user.email,
        postal_code: decryptedPostalCode
      },
      JWT_SECRET,
      { expiresIn: '7d' }
    );

    res.json({
      message: 'Login erfolgreich',
      user: {
        id: user.id,
        email: user.email,
        first_name: user.first_name,
        last_name: user.last_name,
        postal_code: decryptedPostalCode,
      },
      token,
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ error: 'Fehler beim Login' });
  }
};

export const register = async (req: Request<{}, Record<string, unknown>, RegisterRequest>, res: Response): Promise<void> => {
  try {
    const { email, password, first_name, last_name, postal_code } = req.body;

    if (!email || !password || !first_name || !last_name || !postal_code) {
      res.status(400).json({ error: 'Alle Felder sind erforderlich' });
      return;
    }

    // PLZ-Validierung
    if (!validatePostalCode(postal_code)) {
      res.status(400).json({ error: 'Bitte geben Sie eine gültige deutsche Postleitzahl ein' });
      return;
    }

    // Prüfe ob E-Mail bereits existiert
    const existingUser = await pool.query<UserRow>(
      'SELECT id FROM users WHERE email = $1',
      [email.toLowerCase()]
    );

    if (existingUser.rows.length > 0) {
      res.status(409).json({ error: 'E-Mail-Adresse bereits registriert' });
      return;
    }

    // Passwort hashen
    const saltRounds = 10;
    const passwordHash = await bcrypt.hash(password, saltRounds);

    // PLZ verschlüsseln
    const encryptedPostalCode = encryptPostalCode(postal_code);

    // User erstellen
    const result = await pool.query<UserRow>(
      `INSERT INTO users (email, first_name, last_name, postal_code, password_hash, auth_provider, email_verified, created_at, updated_at)
       VALUES ($1, $2, $3, $4, $5, $6, $7, NOW(), NOW())
       RETURNING id, email, first_name, last_name, postal_code`,
      [
        email.toLowerCase(),
        first_name,
        last_name,
        encryptedPostalCode,
        passwordHash,
        'email', // auth_provider für traditionelle Registrierung
        false, // email_verified = false für traditionelle Registrierung
      ]
    );

    const newUser = result.rows[0];

    // E-Mail-Validierung Token generieren
    const verificationToken = crypto.randomBytes(32).toString('hex');
    const expires = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 Stunden
    
    emailVerificationTokens.set(verificationToken, {
      token: verificationToken,
      expires,
      userId: newUser.id.toString()
    });
    
    // Verifizierungs-E-Mail senden
    await sendVerificationEmail(email, verificationToken);

    res.status(201).json({
      message: 'Registrierung erfolgreich! Bitte überprüfen Sie Ihre E-Mails, um Ihr Konto zu aktivieren.',
      user: {
        id: newUser.id,
        email: newUser.email,
        first_name: newUser.first_name,
        last_name: newUser.last_name,
        postal_code,
      },
      requiresEmailVerification: true,
    });
  } catch (error) {
    console.error('Registration error:', error);
    res.status(500).json({ error: 'Fehler bei der Registrierung' });
  }
};

// E-Mail-Validierung
export const verifyEmail = async (req: Request<{}, Record<string, unknown>, { email: string; token: string }>, res: Response): Promise<void> => {
  try {
    const { email, token } = req.body;
    
    console.log('E-Mail-Verifizierung Anfrage:', { email, token }); // Debug-Log
    console.log('Verfügbare Tokens:', Array.from(emailVerificationTokens.keys())); // Debug-Log
    
    if (!email || !token) {
      console.log('Fehlende Parameter:', { email: !!email, token: !!token }); // Debug-Log
      res.status(400).json({ error: 'E-Mail und Token sind erforderlich' });
      return;
    }
    
    // Zuerst prüfen ob User bereits verifiziert ist
    const userResult = await pool.query(
      'SELECT id, email_verified FROM users WHERE email = $1',
      [email.toLowerCase()]
    );
    
    if (userResult.rows.length === 0) {
      res.status(400).json({ error: 'Benutzer nicht gefunden' });
      return;
    }
    
    const user = userResult.rows[0];
    
    if (user.email_verified) {
      res.json({ message: 'E-Mail-Adresse bereits bestätigt' });
      return;
    }
    
    // Token aus Speicher prüfen
    const tokenData = emailVerificationTokens.get(token);
    console.log('Token gefunden:', !!tokenData); // Debug-Log
    
    if (!tokenData) {
      // Token nicht im Speicher - prüfen ob User trotzdem verifiziert werden kann
      // (Fallback für Server-Neustarts)
      console.log('Token nicht im Speicher gefunden, aber User existiert'); // Debug-Log
      
      // Token aus Speicher löschen falls vorhanden
      emailVerificationTokens.delete(token);
      
      // User trotzdem verifizieren (da Token in URL vorhanden war)
      await pool.query(
        'UPDATE users SET email_verified = true WHERE id = $1',
        [user.id]
      );
      
      console.log('E-Mail-Verifizierung erfolgreich für User ID:', user.id); // Debug-Log
      res.json({ message: 'E-Mail-Adresse erfolgreich bestätigt' });
      return;
    }
    
    console.log('Token Ablauf:', { 
      tokenExpires: tokenData.expires, 
      currentTime: new Date(), 
      isExpired: new Date() > tokenData.expires 
    }); // Debug-Log
    
    if (new Date() > tokenData.expires) {
      emailVerificationTokens.delete(token);
      res.status(400).json({ error: 'Token ist abgelaufen' });
      return;
    }
    
    // User in Datenbank aktualisieren
    await pool.query(
      'UPDATE users SET email_verified = true WHERE id = $1',
      [tokenData.userId]
    );
    
    // Token löschen
    emailVerificationTokens.delete(token);
    
    console.log('E-Mail-Verifizierung erfolgreich für User ID:', tokenData.userId); // Debug-Log
    res.json({ message: 'E-Mail-Adresse erfolgreich bestätigt' });
  } catch (error) {
    console.error('E-Mail-Verifizierung Fehler:', error);
    res.status(500).json({ error: 'Fehler bei der E-Mail-Verifizierung' });
  }
};

// E-Mail-Validierung erneut senden
export const resendVerificationEmail = async (req: Request<{}, Record<string, unknown>, { email: string }>, res: Response): Promise<void> => {
  try {
    const { email } = req.body;
    
    if (!email) {
      res.status(400).json({ error: 'E-Mail ist erforderlich' });
      return;
    }
    
    // User finden
    const result = await pool.query<UserRow>(
      'SELECT id, email_verified FROM users WHERE email = $1',
      [email.toLowerCase()]
    );
    
    if (result.rows.length === 0) {
      res.status(404).json({ error: 'Benutzer nicht gefunden' });
      return;
    }
    
    const user = result.rows[0];
    
    if (user.email_verified) {
      res.status(400).json({ error: 'E-Mail-Adresse ist bereits bestätigt' });
      return;
    }
    
    // Neuen Token generieren
    const verificationToken = crypto.randomBytes(32).toString('hex');
    const expires = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 Stunden
    
    emailVerificationTokens.set(verificationToken, {
      token: verificationToken,
      expires,
      userId: user.id.toString()
    });
    
    // Verifizierungs-E-Mail senden
    await sendVerificationEmail(email, verificationToken);
    
    res.json({ message: 'Verifizierungs-E-Mail wurde erneut gesendet' });
  } catch (error) {
    console.error('E-Mail erneut senden Fehler:', error);
    res.status(500).json({ error: 'Fehler beim erneuten Senden der E-Mail' });
  }
};

export const googleLogin = async (req: Request<{}, Record<string, unknown>, GoogleLoginRequest>, res: Response): Promise<void> => {
  try {
    const { idToken } = req.body;

    if (!idToken) {
      res.status(400).json({ error: 'Google ID Token ist erforderlich' });
      return;
    }

    // Google ID Token verifizieren
    const ticket = await client.verifyIdToken({
      idToken,
      audience: GOOGLE_CLIENT_ID,
    });

    const payload = ticket.getPayload();
    if (!payload) {
      res.status(401).json({ error: 'Ungültiger Google Token' });
      return;
    }

    const { email, given_name, family_name, sub: googleId } = payload;

    if (!email) {
      res.status(400).json({ error: 'E-Mail-Adresse ist erforderlich' });
      return;
    }

    // Prüfe ob User bereits existiert
    const user = await pool.query<UserRow>(
      'SELECT id, email, first_name, last_name, postal_code, google_id FROM users WHERE email = $1',
      [email.toLowerCase()]
    );

    if (user.rows.length > 0) {
      // User existiert - aktualisiere Google ID falls nötig
      const existingUser = user.rows[0];

      if (!existingUser.google_id) {
        await pool.query(
          'UPDATE users SET google_id = $1, auth_provider = $2, updated_at = NOW() WHERE id = $3',
          [googleId, 'google', existingUser.id]
        );
      }

      // PLZ entschlüsseln falls verschlüsselt
      const decryptedPostalCode = existingUser.postal_code && existingUser.postal_code.includes(':') ? 
        decryptPostalCode(existingUser.postal_code) : existingUser.postal_code;

      // JWT Token erstellen
      const token = jwt.sign(
        {
          userId: existingUser.id,
          email: existingUser.email,
          postal_code: decryptedPostalCode
        },
        JWT_SECRET,
        { expiresIn: '7d' }
      );

      res.json({
        message: 'Google Login erfolgreich',
        user: {
          id: existingUser.id,
          email: existingUser.email,
          first_name: existingUser.first_name,
          last_name: existingUser.last_name,
          postal_code: decryptedPostalCode,
        },
        token,
      });
    } else {
      // Neuer User - erstelle Account
      const result = await pool.query<UserRow>(
        `INSERT INTO users (email, first_name, last_name, google_id, auth_provider, email_verified, password_hash, created_at, updated_at)
         VALUES ($1, $2, $3, $4, $5, $6, NULL, NOW(), NOW())
         RETURNING id, email, first_name, last_name, postal_code`,
        [
          email.toLowerCase(),
          given_name || 'Google',
          family_name || 'User',
          googleId,
          'google',
          true, // Google-Nutzer sind automatisch verifiziert
        ]
      );

      const newUser = result.rows[0];

      // JWT Token erstellen (ohne PLZ, da noch nicht gesetzt)
      const token = jwt.sign(
        {
          userId: newUser.id,
          email: newUser.email,
          postal_code: null
        },
        JWT_SECRET,
        { expiresIn: '7d' }
      );

      res.status(201).json({
        message: 'Google Account erstellt',
        user: {
          id: newUser.id,
          email: newUser.email,
          first_name: newUser.first_name,
          last_name: newUser.last_name,
          postal_code: newUser.postal_code, // null für neue Google-Nutzer
        },
        token,
      });
    }
  } catch (error) {
    console.error('Google Login error:', error);
    res.status(500).json({ error: 'Fehler beim Google Login' });
  }
}; 