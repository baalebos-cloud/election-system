const db = require('../db');
const { verifyToken } = require('../lib/auth');

module.exports = async (req, res) => {
  // Set CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  // Verify token
  const auth = verifyToken(req.headers['authorization']);
  if (!auth.valid) {
    return res.status(401).json({ error: auth.error });
  }

  // Check admin role
  if (auth.agent.role !== 'admin') {
    return res.status(403).json({ error: 'Admin access required' });
  }

  try {
    const { id } = req.query;
    const result = await db.query(
      'SELECT id, name, party, lga, town, unit_code, ward, registered_at, last_login, is_active FROM agents WHERE id = $1',
      [id]
    );
    if (!result.rows.length)
      return res.status(404).json({ error: 'Agent not found' });
    res.status(200).json(result.rows[0]);
  } catch (err) {
    console.error('[get agent]', err.message);
    res.status(500).json({ error: 'Failed to fetch agent' });
  }
};
