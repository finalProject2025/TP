import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import { Request, Response } from 'express';
import pool from '../database/pool';
import nodemailer from 'nodemailer';
import crypto from 'crypto';
import {
  RegisterRequest,
  LoginRequest,
  UpdateProfileRequest,
  ChangePasswordRequest,
  ForgotPasswordRequest,
  ResetPasswordRequest,
  UserRow
} from '../types/index';
import { validatePostalCode } from '../utils/postalCodeValidator';
import { encryptPostalCode, decryptPostalCode } from '../utils/encryption';

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key-change-in-production';

// In-Memory Token Storage für E-Mail-Validierung
const emailVerificationTokens = new Map<string, { token: string; expires: Date; userId: string }>();

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

export const register = async (req: Request<{}, Record<string, unknown>, RegisterRequest>, res: Response): Promise<void> => {
  try {
    const { email, password, first_name, last_name, postal_code } = req.body;
    
    if (!email || !password || !first_name || !last_name || !postal_code) {
      res.status(400).json({
        error: 'Alle Felder sind erforderlich: E-Mail, Passwort, Vor- und Nachname, Postleitzahl',
      });
      return;
    }
    
    if (password.length < 6) {
      res.status(400).json({ error: 'Das Passwort muss mindestens 6 Zeichen lang sein' });
      return;
    }
    
    const existingUser = await pool.query<UserRow>('SELECT id FROM users WHERE email = $1', [email.toLowerCase()]);
    if (existingUser.rows.length > 0) {
      res.status(400).json({ error: 'Ein Benutzer mit dieser E-Mail-Adresse existiert bereits' });
      return;
    }
    
    const hashedPassword = await bcrypt.hash(password, 10);
    
    // PLZ verschlüsseln
    const encryptedPostalCode = encryptPostalCode(postal_code);
    
    const result = await pool.query<UserRow>(
      `INSERT INTO users (email, password_hash, first_name, last_name, postal_code, email_verified, created_at, updated_at)
       VALUES ($1, $2, $3, $4, $5, false, NOW(), NOW())
       RETURNING id, email, first_name, last_name, created_at`,
      [email.toLowerCase(), hashedPassword, first_name, last_name, encryptedPostalCode]
    );
    
    const user = result.rows[0];
    
    // E-Mail-Validierung Token generieren
    const verificationToken = crypto.randomBytes(32).toString('hex');
    const expires = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 Stunden
    
    emailVerificationTokens.set(verificationToken, {
      token: verificationToken,
      expires,
      userId: user.id.toString()
    });
    
    // Verifizierungs-E-Mail senden
    await sendVerificationEmail(email, verificationToken);
    
    res.status(201).json({
      message: 'Registrierung erfolgreich! Bitte überprüfen Sie Ihre E-Mails, um Ihr Konto zu aktivieren.',
      user: {
        id: user.id,
        email: user.email,
        first_name: user.first_name,
        last_name: user.last_name,
        postal_code,
        created_at: user.created_at,
      },
      requiresEmailVerification: true,
    });
  } catch (error) {
    console.error('Database error:', error);
    res.status(500).json({ error: 'Fehler bei der Registrierung' });
  }
};

export const login = async (req: Request<{}, Record<string, unknown>, LoginRequest>, res: Response): Promise<void> => {
  try {
    const { email, password } = req.body;
    
    if (!email || !password) {
      res.status(400).json({ error: 'E-Mail und Passwort sind erforderlich' });
      return;
    }
    
    const result = await pool.query<UserRow>('SELECT id, email, password_hash, first_name, last_name, postal_code, email_verified FROM users WHERE email = $1', [email.toLowerCase()]);
    if (result.rows.length === 0) {
      res.status(401).json({ error: 'Ungültige E-Mail oder Passwort' });
      return;
    }
    
    const user = result.rows[0];
    let isValidPassword = false;
    
    try {
      isValidPassword = await bcrypt.compare(password, user.password_hash || '');
    } catch (error) {
      console.error('Password verification error:', error);
      res.status(500).json({ error: 'Fehler bei der Passwort-Überprüfung' });
      return;
    }
    
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
    
    const token = jwt.sign({ userId: user.id, email: user.email, postal_code: decryptedPostalCode }, JWT_SECRET, { expiresIn: '7d' });
    
    res.json({
      message: 'Anmeldung erfolgreich',
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
    console.error('Database error:', error);
    res.status(500).json({ error: 'Fehler bei der Anmeldung' });
  }
};

export const getProfile = async (req: Request, res: Response): Promise<void> => {
  try {
    if (!req.user?.userId) {
      res.status(401).json({ error: 'Nicht authentifiziert' });
      return;
    }
    
    const result = await pool.query<UserRow>(
      'SELECT id, email, first_name, last_name, postal_code, profile_image_url, created_at FROM users WHERE id = $1',
      [req.user.userId]
    );
    
    if (result.rows.length === 0) {
      res.status(404).json({ error: 'Benutzer nicht gefunden' });
      return;
    }
    
    const user = result.rows[0];
    
    // PLZ entschlüsseln falls verschlüsselt
    const decryptedPostalCode = user.postal_code && user.postal_code.includes(':') ? 
      decryptPostalCode(user.postal_code) : user.postal_code;
    
    res.json({
      user: {
        id: user.id,
        email: user.email,
        first_name: user.first_name,
        last_name: user.last_name,
        postal_code: decryptedPostalCode,
        profile_image_url: user.profile_image_url,
        created_at: user.created_at,
      },
    });
  } catch (error) {
    console.error('Database error:', error);
    res.status(500).json({ error: 'Fehler beim Laden des Profils' });
  }
};

export const updateProfile = async (req: Request<{}, Record<string, unknown>, UpdateProfileRequest>, res: Response): Promise<void> => {
  try {
    if (!req.user?.userId) {
      res.status(401).json({ error: 'Nicht authentifiziert' });
      return;
    }
    
    const userId = req.user.userId;
    const { first_name, last_name, postal_code, profile_image_url } = req.body;
    
    if (!first_name || !last_name || !postal_code) {
      res.status(400).json({ error: 'Vorname, Nachname und Postleitzahl sind erforderlich' });
      return;
    }

    // PLZ-Validierung mit echter deutscher PLZ-Liste
    if (!validatePostalCode(postal_code)) {
      res.status(400).json({ error: 'Bitte geben Sie eine gültige deutsche Postleitzahl ein' });
      return;
    }
    
    // PLZ verschlüsseln
    const encryptedPostalCode = encryptPostalCode(postal_code);
    
    const result = await pool.query<UserRow>(
      `UPDATE users SET first_name = $1, last_name = $2, postal_code = $3, profile_image_url = $4, updated_at = NOW()
       WHERE id = $5 RETURNING id, email, first_name, last_name, postal_code, profile_image_url, created_at`,
      [first_name, last_name, encryptedPostalCode, profile_image_url || null, userId]
    );
    
    if (result.rows.length === 0) {
      res.status(404).json({ error: 'Benutzer nicht gefunden' });
      return;
    }
    
    const updatedUser = result.rows[0];
    const token = jwt.sign({ userId: updatedUser.id, email: updatedUser.email, postal_code }, JWT_SECRET, { expiresIn: '7d' });
    
    res.json({
      message: 'Profil erfolgreich aktualisiert',
      user: {
        id: updatedUser.id,
        email: updatedUser.email,
        first_name: updatedUser.first_name,
        last_name: updatedUser.last_name,
        postal_code,
        profile_image_url: updatedUser.profile_image_url,
        created_at: updatedUser.created_at,
      },
      token,
    });
  } catch (error) {
    console.error('Database error:', error);
    res.status(500).json({ error: 'Fehler beim Aktualisieren des Profils' });
  }
};

export const changePassword = async (req: Request<{}, Record<string, unknown>, ChangePasswordRequest>, res: Response): Promise<void> => {
  try {
    if (!req.user?.userId) {
      res.status(401).json({ error: 'Nicht authentifiziert' });
      return;
    }
    
    const { current_password, new_password } = req.body;
    
    if (!current_password || !new_password) {
      res.status(400).json({ error: 'Aktuelles und neues Passwort sind erforderlich' });
      return;
    }
    
    if (new_password.length < 6) {
      res.status(400).json({ error: 'Das neue Passwort muss mindestens 6 Zeichen lang sein' });
      return;
    }
    
    const userResult = await pool.query<UserRow>('SELECT password_hash FROM users WHERE id = $1', [req.user.userId]);
    if (userResult.rows.length === 0) {
      res.status(404).json({ error: 'Benutzer nicht gefunden' });
      return;
    }
    
    const user = userResult.rows[0];
    const isValidCurrentPassword = await bcrypt.compare(current_password, user.password_hash || '');
    
    if (!isValidCurrentPassword) {
      res.status(400).json({ error: 'Aktuelles Passwort ist falsch' });
      return;
    }
    
    const hashedNewPassword = await bcrypt.hash(new_password, 10);
    await pool.query('UPDATE users SET password_hash = $1, updated_at = NOW() WHERE id = $2', [hashedNewPassword, req.user.userId]);
    
    res.json({ message: 'Passwort erfolgreich geändert' });
  } catch (error) {
    console.error('Database error:', error);
    res.status(500).json({ error: 'Fehler beim Ändern des Passworts' });
  }
};

export const forgotPassword = async (req: Request<{}, Record<string, unknown>, ForgotPasswordRequest>, res: Response): Promise<void> => {
  try {
    const { email } = req.body;
    
    if (!email) {
      res.status(400).json({ error: 'E-Mail ist erforderlich' });
      return;
    }
    
    const userResult = await pool.query<UserRow>('SELECT id, email FROM users WHERE email = $1', [email.toLowerCase()]);
    if (userResult.rows.length === 0) {
      // Kein Hinweis, ob E-Mail existiert (Datenschutz)
      res.status(200).json({ message: 'Wenn die E-Mail existiert, wurde eine Nachricht versendet.' });
      return;
    }
    
    const user = userResult.rows[0];
    const token = crypto.randomBytes(32).toString('hex');
    const expires = new Date(Date.now() + 1000 * 60 * 30); // 30 Minuten gültig
    
    await pool.query('UPDATE users SET reset_password_token = $1, reset_password_expires = $2 WHERE id = $3', [token, expires, user.id]);

    // Überprüfe Umgebungsvariablen
    if (!process.env.GMAIL_USER || !process.env.GMAIL_PASS || !process.env.FRONTEND_URL) {
      console.error('Fehlende Umgebungsvariablen für E-Mail-System');
      res.status(500).json({ error: 'E-Mail-System nicht konfiguriert' });
      return;
    }

    // Transporter für Gmail
    const transporter = nodemailer.createTransport({
      service: 'gmail',
      auth: {
        user: process.env.GMAIL_USER,
        pass: process.env.GMAIL_PASS,
      },
    });
    
    const resetUrl = `${process.env.FRONTEND_URL}/reset-password?token=${token}&email=${encodeURIComponent(email)}`;
    const mailOptions = {
      from: process.env.GMAIL_USER,
      to: email,
      subject: 'Passwort zurücksetzen',
      text: `Du hast eine Passwort-Zurücksetzung angefordert. Klicke auf den folgenden Link, um ein neues Passwort zu setzen (gültig für 30 Minuten):\n${resetUrl}`,
      html: `<p>Du hast eine Passwort-Zurücksetzung angefordert.</p><p><a href="${resetUrl}">Passwort zurücksetzen</a></p><p>Der Link ist 30 Minuten gültig.</p>`
    };
    
    await transporter.sendMail(mailOptions);
    res.status(200).json({ message: 'Wenn die E-Mail existiert, wurde eine Nachricht versendet.' });
  } catch (error) {
    console.error('Fehler beim Senden der Reset-Mail:', error);
    res.status(500).json({ error: 'Fehler beim Senden der E-Mail' });
  }
};

export const resetPassword = async (req: Request<{}, Record<string, unknown>, ResetPasswordRequest>, res: Response): Promise<void> => {
  try {
    const { email, token, new_password } = req.body;
    
    if (!email || !token || !new_password) {
      res.status(400).json({ error: 'E-Mail, Token und neues Passwort sind erforderlich' });
      return;
    }
    
    if (new_password.length < 6) {
      res.status(400).json({ error: 'Das Passwort muss mindestens 6 Zeichen lang sein' });
      return;
    }
    
    const userResult = await pool.query<UserRow>('SELECT id, reset_password_token, reset_password_expires FROM users WHERE email = $1', [email.toLowerCase()]);
    if (userResult.rows.length === 0) {
      res.status(400).json({ error: 'Ungültiger Link oder Benutzer nicht gefunden' });
      return;
    }
    
    const user = userResult.rows[0];
    if (!user.reset_password_token || user.reset_password_token !== token) {
      res.status(400).json({ error: 'Ungültiger oder abgelaufener Token' });
      return;
    }
    
    if (user.reset_password_expires && new Date() > new Date(user.reset_password_expires)) {
      res.status(400).json({ error: 'Token ist abgelaufen' });
      return;
    }
    
    const hashedPassword = await bcrypt.hash(new_password, 10);
    await pool.query(
      'UPDATE users SET password_hash = $1, reset_password_token = NULL, reset_password_expires = NULL, updated_at = NOW() WHERE id = $2',
      [hashedPassword, user.id]
    );
    
    res.json({ message: 'Passwort erfolgreich zurückgesetzt' });
  } catch (error) {
    console.error('Database error:', error);
    res.status(500).json({ error: 'Fehler beim Zurücksetzen des Passworts' });
  }
};

// PLZ Update für Google-Nutzer
// E-Mail-Validierung
export const verifyEmail = async (req: Request<{}, Record<string, unknown>, { email: string; token: string }>, res: Response): Promise<void> => {
  try {
    const { email, token } = req.body;
    
    if (!email || !token) {
      res.status(400).json({ error: 'E-Mail und Token sind erforderlich' });
      return;
    }
    
    const tokenData = emailVerificationTokens.get(token);
    if (!tokenData) {
      res.status(400).json({ error: 'Ungültiger oder abgelaufener Token' });
      return;
    }
    
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

export const updatePostalCode = async (req: Request<{}, Record<string, unknown>, { postal_code: string }>, res: Response): Promise<void> => {
  try {
    if (!req.user?.userId) {
      res.status(401).json({ error: 'Nicht authentifiziert' });
      return;
    }
    
    const { postal_code } = req.body;
    
    if (!postal_code) {
      res.status(400).json({ error: 'Postleitzahl ist erforderlich' });
      return;
    }

    // PLZ-Validierung mit echter deutscher PLZ-Liste
    if (!validatePostalCode(postal_code)) {
      res.status(400).json({ error: 'Bitte geben Sie eine gültige deutsche Postleitzahl ein' });
      return;
    }
    
    // PLZ verschlüsseln
    const encryptedPostalCode = encryptPostalCode(postal_code);
    
    const result = await pool.query<UserRow>(
      `UPDATE users SET postal_code = $1, updated_at = NOW()
       WHERE id = $2 RETURNING id, email, first_name, last_name, postal_code, created_at`,
      [encryptedPostalCode, req.user.userId]
    );
    
    if (result.rows.length === 0) {
      res.status(404).json({ error: 'Benutzer nicht gefunden' });
      return;
    }
    
    const updatedUser = result.rows[0];
    const token = jwt.sign(
      { 
        userId: updatedUser.id, 
        email: updatedUser.email, 
        postal_code 
      }, 
      JWT_SECRET, 
      { expiresIn: '7d' }
    );
    
    res.json({
      message: 'Postleitzahl erfolgreich aktualisiert',
      user: {
        id: updatedUser.id,
        email: updatedUser.email,
        first_name: updatedUser.first_name,
        last_name: updatedUser.last_name,
        postal_code,
        created_at: updatedUser.created_at,
      },
      token,
    });
  } catch (error) {
    console.error('Database error:', error);
    res.status(500).json({ error: 'Fehler beim Aktualisieren der Postleitzahl' });
  }
}; 