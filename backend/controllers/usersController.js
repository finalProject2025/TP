const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const pool = require('../database/pool');
const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key-change-in-production';
const nodemailer = require('nodemailer');
const crypto = require('crypto');


exports.register = async (req, res) => {
  try {
    const { email, password, first_name, last_name, postal_code } = req.body;
    if (!email || !password || !first_name || !last_name || !postal_code) {
      return res.status(400).json({
        error: 'Alle Felder sind erforderlich: E-Mail, Passwort, Vor- und Nachname, Postleitzahl',
      });
    }
    if (password.length < 6) {
      return res.status(400).json({ error: 'Das Passwort muss mindestens 6 Zeichen lang sein' });
    }
    const existingUser = await pool.query('SELECT id FROM users WHERE email = $1', [email.toLowerCase()]);
    if (existingUser.rows.length > 0) {
      return res.status(400).json({ error: 'Ein Benutzer mit dieser E-Mail-Adresse existiert bereits' });
    }
    const hashedPassword = await bcrypt.hash(password, 10);
    const result = await pool.query(
      `INSERT INTO users (email, password_hash, first_name, last_name, postal_code, created_at, updated_at)
       VALUES ($1, $2, $3, $4, $5, NOW(), NOW())
       RETURNING id, email, first_name, last_name, created_at`,
      [email.toLowerCase(), hashedPassword, first_name, last_name, postal_code]
    );
    const user = result.rows[0];
    const token = jwt.sign({ userId: user.id, email: user.email, postal_code }, JWT_SECRET, { expiresIn: '7d' });
    res.status(201).json({
      message: 'Benutzer erfolgreich registriert',
      user: {
        id: user.id,
        email: user.email,
        first_name: user.first_name,
        last_name: user.last_name,
        postal_code,
        created_at: user.created_at,
      },
      token,
    });
  } catch (error) {
    console.error('Database error:', error);
    res.status(500).json({ error: 'Fehler bei der Registrierung' });
  }
};

exports.login = async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) {
      return res.status(400).json({ error: 'E-Mail und Passwort sind erforderlich' });
    }
    const result = await pool.query('SELECT id, email, password_hash, first_name, last_name, postal_code FROM users WHERE email = $1', [email.toLowerCase()]);
    if (result.rows.length === 0) {
      return res.status(401).json({ error: 'Ungültige E-Mail oder Passwort' });
    }
    const user = result.rows[0];
    let isValidPassword = false;
    try {
      isValidPassword = await bcrypt.compare(password, user.password_hash);
    } catch (error) {
      console.error('Password verification error:', error.message);
      return res.status(500).json({ error: 'Fehler bei der Passwort-Überprüfung' });
    }
    if (!isValidPassword) {
      return res.status(401).json({ error: 'Ungültige E-Mail oder Passwort' });
    }
    const token = jwt.sign({ userId: user.id, email: user.email, postal_code: user.postal_code }, JWT_SECRET, { expiresIn: '7d' });
    res.json({
      message: 'Anmeldung erfolgreich',
      user: {
        id: user.id,
        email: user.email,
        first_name: user.first_name,
        last_name: user.last_name,
        postal_code: user.postal_code,
      },
      token,
    });
  } catch (error) {
    console.error('Database error:', error);
    res.status(500).json({ error: 'Fehler bei der Anmeldung' });
  }
};

exports.getProfile = async (req, res) => {
  try {
    const result = await pool.query(
      'SELECT id, email, first_name, last_name, postal_code, profile_image_url, created_at FROM users WHERE id = $1',
      [req.user.userId]
    );
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Benutzer nicht gefunden' });
    }
    const user = result.rows[0];
    res.json({
      user: {
        id: user.id,
        email: user.email,
        first_name: user.first_name,
        last_name: user.last_name,
        postal_code: user.postal_code,
        profile_image_url: user.profile_image_url,
        created_at: user.created_at,
      },
    });
  } catch (error) {
    console.error('Database error:', error);
    res.status(500).json({ error: 'Fehler beim Laden des Profils' });
  }
};

exports.updateProfile = async (req, res) => {
  try {
    const userId = req.user.userId;
    const { first_name, last_name, postal_code, profile_image_url } = req.body;
    if (!first_name || !last_name || !postal_code) {
      return res.status(400).json({ error: 'Vorname, Nachname und Postleitzahl sind erforderlich' });
    }
    const result = await pool.query(
      `UPDATE users SET first_name = $1, last_name = $2, postal_code = $3, profile_image_url = $4, updated_at = NOW()
       WHERE id = $5 RETURNING id, email, first_name, last_name, postal_code, profile_image_url, created_at` ,
      [first_name, last_name, postal_code, profile_image_url || null, userId]
    );
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Benutzer nicht gefunden' });
    }
    const updatedUser = result.rows[0];
    const token = jwt.sign({ userId: updatedUser.id, email: updatedUser.email, postal_code: updatedUser.postal_code }, JWT_SECRET, { expiresIn: '7d' });
    res.json({
      message: 'Profil erfolgreich aktualisiert',
      user: updatedUser,
      token,
    });
  } catch (error) {
    console.error('Database error:', error);
    res.status(500).json({ error: 'Fehler beim Aktualisieren des Profils' });
  }
};

exports.forgotPassword = async (req, res) => {
  const { email } = req.body;
  if (!email) {
    return res.status(400).json({ error: 'E-Mail ist erforderlich' });
  }
  try {
    const userResult = await pool.query('SELECT id, email FROM users WHERE email = $1', [email.toLowerCase()]);
    if (userResult.rows.length === 0) {
      // Kein Hinweis, ob E-Mail existiert (Datenschutz)
      return res.status(200).json({ message: 'Wenn die E-Mail existiert, wurde eine Nachricht versendet.' });
    }
    const user = userResult.rows[0];
    const token = crypto.randomBytes(32).toString('hex');
    const expires = new Date(Date.now() + 1000 * 60 * 30); // 30 Minuten gültig
    await pool.query('UPDATE users SET reset_password_token = $1, reset_password_expires = $2 WHERE id = $3', [token, expires, user.id]);

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

exports.resetPassword = async (req, res) => {
  const { email, token, newPassword } = req.body;
  if (!email || !token || !newPassword) {
    return res.status(400).json({ error: 'E-Mail, Token und neues Passwort sind erforderlich' });
  }
  if (newPassword.length < 6) {
    return res.status(400).json({ error: 'Das Passwort muss mindestens 6 Zeichen lang sein' });
  }
  try {
    const userResult = await pool.query('SELECT id, reset_password_token, reset_password_expires FROM users WHERE email = $1', [email.toLowerCase()]);
    if (userResult.rows.length === 0) {
      return res.status(400).json({ error: 'Ungültiger Link oder Benutzer nicht gefunden' });
    }
    const user = userResult.rows[0];
    if (!user.reset_password_token || user.reset_password_token !== token) {
      return res.status(400).json({ error: 'Ungültiger oder abgelaufener Token' });
    }
    if (!user.reset_password_expires || new Date(user.reset_password_expires) < new Date()) {
      return res.status(400).json({ error: 'Token ist abgelaufen' });
    }
    const hashedPassword = await bcrypt.hash(newPassword, 10);
    await pool.query('UPDATE users SET password_hash = $1, reset_password_token = NULL, reset_password_expires = NULL WHERE id = $2', [hashedPassword, user.id]);
    res.status(200).json({ message: 'Passwort erfolgreich zurückgesetzt' });
  } catch (error) {
    console.error('Fehler beim Zurücksetzen des Passworts:', error);
    res.status(500).json({ error: 'Fehler beim Zurücksetzen des Passworts' });
  }
};

exports.changePassword = async (req, res) => {
  try {
    const userId = req.user.userId;
    const { currentPassword, newPassword } = req.body;
    if (!currentPassword || !newPassword) {
      return res.status(400).json({ error: 'Aktuelles und neues Passwort sind erforderlich' });
    }
    if (newPassword.length < 6) {
      return res.status(400).json({ error: 'Das neue Passwort muss mindestens 6 Zeichen lang sein' });
    }
    const userResult = await pool.query('SELECT password_hash FROM users WHERE id = $1', [userId]);
    if (userResult.rows.length === 0) {
      return res.status(404).json({ error: 'Benutzer nicht gefunden' });
    }
    const user = userResult.rows[0];
    const isValid = await bcrypt.compare(currentPassword, user.password_hash);
    if (!isValid) {
      return res.status(401).json({ error: 'Das aktuelle Passwort ist falsch' });
    }
    const hashedPassword = await bcrypt.hash(newPassword, 10);
    await pool.query('UPDATE users SET password_hash = $1, updated_at = NOW() WHERE id = $2', [hashedPassword, userId]);
    res.json({ message: 'Passwort erfolgreich geändert' });
  } catch (error) {
    console.error('Fehler beim Ändern des Passworts:', error);
    res.status(500).json({ error: 'Fehler beim Ändern des Passworts' });
  }
}; 