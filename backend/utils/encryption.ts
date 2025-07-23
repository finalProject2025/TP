import crypto from 'crypto';

// Erstelle einen 32-Byte Schlüssel aus der Umgebungsvariable oder einem Standard
const getEncryptionKey = (): Buffer => {
  const key = process.env.ENCRYPTION_KEY || 'your-secret-key-here-make-it-long-enough';
  // Verwende SHA-256 Hash um einen 32-Byte Schlüssel zu erstellen
  return crypto.createHash('sha256').update(key).digest();
};

const ALGORITHM = 'aes-256-cbc';

/**
 * Verschlüsselt eine Postleitzahl mit AES-256-CBC
 * @param postalCode - Die zu verschlüsselnde PLZ
 * @returns Verschlüsselte PLZ im Format iv:encrypted
 */
export const encryptPostalCode = (postalCode: string): string => {
  if (!postalCode) return '';
  
  const iv = crypto.randomBytes(16);
  const key = getEncryptionKey();
  const cipher = crypto.createCipheriv(ALGORITHM, key, iv);
  let encrypted = cipher.update(postalCode, 'utf8', 'hex');
  encrypted += cipher.final('hex');
  return `${iv.toString('hex')}:${encrypted}`;
};

/**
 * Entschlüsselt eine verschlüsselte Postleitzahl
 * @param encryptedPostalCode - Die verschlüsselte PLZ
 * @returns Entschlüsselte PLZ oder leerer String bei Fehler
 */
export const decryptPostalCode = (encryptedPostalCode: string): string => {
  if (!encryptedPostalCode) return '';
  
  try {
    const [ivHex, encrypted] = encryptedPostalCode.split(':');
    const iv = Buffer.from(ivHex, 'hex');
    const key = getEncryptionKey();
    const decipher = crypto.createDecipheriv(ALGORITHM, key, iv);
    let decrypted = decipher.update(encrypted, 'hex', 'utf8');
    decrypted += decipher.final('utf8');
    return decrypted;
  } catch (error) {
    console.error('Decryption error:', error);
    return '';
  }
}; 