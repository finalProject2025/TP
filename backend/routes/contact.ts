import express from 'express';
import nodemailer from 'nodemailer';
import dotenv from 'dotenv';

// XSS-Schutz: HTML-Escaping-Funktion
const escapeHtml = (text: string): string => {
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#x27;')
    .replace(/\//g, '&#x2F;');
};

dotenv.config();

const router = express.Router();

// E-Mail-Transporter konfigurieren
const createTransporter = () => {
  return nodemailer.createTransport({
    service: 'gmail',
    auth: {
      user: process.env.GMAIL_USER || process.env.EMAIL_USER || 'norply.neighborly@gmail.com',
      pass: process.env.GMAIL_PASS || process.env.EMAIL_PASSWORD // App-Passwort für Gmail
    }
  });
};

// Kontaktformular-E-Mail senden
router.post('/', async (req, res) => {
  try {
    const { name, email, subject, message } = req.body;

    // Validierung
    if (!name || !email || !subject || !message) {
      return res.status(400).json({ 
        error: 'Alle Felder sind erforderlich' 
      });
    }

    // E-Mail-Format validieren
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return res.status(400).json({ 
        error: 'Ungültige E-Mail-Adresse' 
      });
    }

    const transporter = createTransporter();

    // E-Mail-Inhalt
    const mailOptions = {
      from: process.env.GMAIL_USER || process.env.EMAIL_USER || 'kontakt.neighborly@gmail.com',
      to: process.env.GMAIL_USER || process.env.EMAIL_USER || 'kontakt.neighborly@gmail.com', // Empfänger
      subject: `Kontaktformular: ${subject}`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #2563eb; border-bottom: 2px solid #2563eb; padding-bottom: 10px;">
            Neue Nachricht über das Kontaktformular
          </h2>
          
          <div style="background-color: #f8fafc; padding: 20px; border-radius: 8px; margin: 20px 0;">
            <h3 style="color: #374151; margin-top: 0;">Nachrichtendetails:</h3>
            
            <div style="margin-bottom: 15px;">
              <strong style="color: #374151;">Name:</strong>
              <span style="color: #6b7280;"> ${escapeHtml(name)}</span>
            </div>
            
            <div style="margin-bottom: 15px;">
              <strong style="color: #374151;">E-Mail:</strong>
              <span style="color: #6b7280;"> ${escapeHtml(email)}</span>
            </div>
            
            <div style="margin-bottom: 15px;">
              <strong style="color: #374151;">Betreff:</strong>
              <span style="color: #6b7280;"> ${escapeHtml(subject)}</span>
            </div>
            
            <div style="margin-bottom: 15px;">
              <strong style="color: #374151;">Nachricht:</strong>
              <div style="background-color: white; padding: 15px; border-radius: 4px; margin-top: 5px; border-left: 4px solid #2563eb;">
                ${escapeHtml(message).replace(/\n/g, '<br>')}
              </div>
            </div>
          </div>
          
          <div style="text-align: center; color: #6b7280; font-size: 12px; margin-top: 30px;">
            <p>Diese Nachricht wurde über das Kontaktformular von Neighborly gesendet.</p>
            <p>Zeitstempel: ${new Date().toLocaleString('de-DE')}</p>
          </div>
        </div>
      `,
      text: `
Neue Nachricht über das Kontaktformular

Name: ${name}
E-Mail: ${email}
Betreff: ${subject}

Nachricht:
${message}

---
Gesendet über Neighborly Kontaktformular
Zeitstempel: ${new Date().toLocaleString('de-DE')}
      `
    };

    // E-Mail senden
    await transporter.sendMail(mailOptions);

    res.json({ 
      message: 'Nachricht erfolgreich gesendet',
      success: true 
    });

  } catch (error) {
    console.error('Error sending contact email:', error);
    
    // Spezifische Fehlermeldungen basierend auf dem Fehlertyp
    let errorMessage = 'Fehler beim Senden der E-Mail. Bitte versuchen Sie es später erneut.';
    
    if (error instanceof Error) {
      if (error.message.includes('Invalid login')) {
        errorMessage = 'E-Mail-Konfiguration fehlerhaft. Bitte überprüfen Sie die E-Mail-Einstellungen.';
      } else if (error.message.includes('Authentication failed')) {
        errorMessage = 'E-Mail-Authentifizierung fehlgeschlagen. Bitte überprüfen Sie das App-Passwort.';
      } else if (error.message.includes('ENOTFOUND')) {
        errorMessage = 'E-Mail-Server nicht erreichbar. Bitte überprüfen Sie die Internetverbindung.';
      }
    }
    
    res.status(500).json({ 
      error: errorMessage 
    });
  }
});

export default router; 