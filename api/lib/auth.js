const jwt = require('jsonwebtoken');
const crypto = require('crypto');

const JWT_SECRET = process.env.JWT_SECRET || crypto.randomBytes(32).toString('hex');

function verifyToken(authHeader) {
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return { valid: false, error: 'Missing or malformed Authorization header' };
  }

  const token = authHeader.split(' ')[1];
  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    return { valid: true, agent: decoded };
  } catch (err) {
    if (err.name === 'TokenExpiredError') {
      return { valid: false, error: 'Token expired — please login again' };
    }
    return { valid: false, error: 'Invalid token' };
  }
}

function generateToken(agent) {
  return jwt.sign(
    { id: agent.id, party: agent.party, lga: agent.lga, unit: agent.unit_code, role: agent.role || 'agent' },
    JWT_SECRET,
    { expiresIn: '12h' }
  );
}

module.exports = { verifyToken, generateToken, JWT_SECRET };
