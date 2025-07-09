const jwt = require('jsonwebtoken');
const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key-change-in-production';

function verifyToken(token) {
  try {
    return jwt.verify(token, JWT_SECRET);
  } catch (error) {
    return null;
  }
}

const authenticateToken = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  console.log('[auth] Authorization-Header:', authHeader);
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    console.log('[auth] Kein Token gefunden!');
    return res.status(401).json({ error: 'Authentifizierung erforderlich' });
  }

  const decoded = verifyToken(token);
  console.log('[auth] Decoded Token:', decoded);
  if (!decoded) {
    console.log('[auth] Token konnte nicht decodiert werden!');
    return res.status(401).json({ error: 'Ungültiger Token' });
  }

  req.user = decoded;
  next();
};

module.exports = { authenticateToken }; 