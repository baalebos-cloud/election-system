// ============================================================
//  api/middleware/auth.js
//  JWT verification + role-based access control
// ============================================================

const jwt = require('jsonwebtoken');

const JWT_SECRET = process.env.JWT_SECRET || 'CHANGE_THIS_IN_PRODUCTION';

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
    return res.status(401).json({ error: 'Invalid or expired token' });
  }
}

function requireAdmin(req, res, next) {
  if (!req.agent || req.agent.role !== 'admin')
    return res.status(403).json({ error: 'Admin access required' });
  next();
}

function generateToken(agent) {
  return jwt.sign(
    { id: agent.id, party: agent.party, lga: agent.lga, unit: agent.unit, role: 'agent' },
    JWT_SECRET,
    { expiresIn: '12h' }
  );
}

module.exports = { verifyToken, requireAdmin, generateToken };