// ============================================================
//  api/middleware/auth.js
//  JWT verification + role-based access control
// ============================================================

require('dotenv').config();
const jwt = require('jsonwebtoken');
const crypto = require('crypto');

// Get JWT secret from environment or generate one (with warning)
let JWT_SECRET = process.env.JWT_SECRET;

if (!JWT_SECRET) {
  JWT_SECRET = crypto.randomBytes(32).toString('hex');
  console.warn('⚠️  WARNING: JWT_SECRET not set in .env file');
  console.warn('   Using auto-generated secret. Sessions will reset on server restart.');
}

function verifyToken(req, res, next) {
  const header = req.headers['authorization'];
  if (!header || !header.startsWith('Bearer '))
    return res.status(401).json({ error: 'Missing or malformed Authorization header' });

  const token = header.split(' ')[1];
  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    req.agent = decoded;
    next();
  } catch (err) {
    if (err.name === 'TokenExpiredError') {
      return res.status(401).json({ error: 'Token expired — please login again' });
    }
    return res.status(401).json({ error: 'Invalid token' });
  }
}

function requireAdmin(req, res, next) {
  if (!req.agent || req.agent.role !== 'admin')
    return res.status(403).json({ error: 'Admin access required' });
  next();
}

function generateToken(agent) {
  return jwt.sign(
    { id: agent.id, party: agent.party, lga: agent.lga, unit: agent.unit_code, role: agent.role || 'agent' },
    JWT_SECRET,
    { expiresIn: '12h' }
  );
}

module.exports = { verifyToken, requireAdmin, generateToken, JWT_SECRET };
