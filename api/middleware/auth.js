// ============================================================
//  api/middleware/auth.js
//  JWT verification + role-based access control
// ============================================================

const jwt = require('jsonwebtoken');
const crypto = require('crypto');

// CRITICAL: Fail fast if JWT_SECRET is not set in production
if (process.env.NODE_ENV === 'production' && !process.env.JWT_SECRET) {
  console.error('❌ FATAL: JWT_SECRET must be set in production');
  process.exit(1);
}

const JWT_SECRET = process.env.JWT_SECRET || crypto.randomBytes(32).toString('hex');

// Warn in development if using auto-generated secret
if (!process.env.JWT_SECRET && process.env.NODE_ENV !== 'production') {
  console.warn('⚠️  WARNING: Using auto-generated JWT_SECRET. Set JWT_SECRET env var for consistent sessions.');
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
