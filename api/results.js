const crypto = require('crypto');
const jwt = require('jsonwebtoken');
const db = require('./db');

const JWT_SECRET = process.env.JWT_SECRET || 'dev-secret-change-in-production';

function verifyToken(authHeader) {
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return { valid: false, error: 'Missing or malformed Authorization header' };
  }
  const token = authHeader.split(' ')[1];
  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    return { valid: true, agent: decoded };
  } catch (err) {
    return { valid: false, error: err.name === 'TokenExpiredError' ? 'Token expired' : 'Invalid token' };
  }
}

module.exports = async (req, res) => {
  // CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  if (req.method === 'OPTIONS') return res.status(200).end();

  const url = req.url;

  // ── GET /api/results/live ─────────────────────────────────
  if (req.method === 'GET' && url.includes('/live')) {
    try {
      const { rows } = await db.query('SELECT * FROM results ORDER BY submitted_at DESC');
      return res.status(200).json({ count: rows.length, results: rows });
    } catch (err) {
      console.error('[live]', err);
      return res.status(500).json({ error: 'Failed to fetch results' });
    }
  }

  // ── POST /api/results/submit ──────────────────────────────
  if (req.method === 'POST' && url.includes('/submit')) {
    const auth = verifyToken(req.headers['authorization']);
    if (!auth.valid) return res.status(401).json({ error: auth.error });

    try {
      const { unitCode, votes, lat, lng, evidenceBase64, officerName, registeredVoters, accreditedVoters, rejectedBallots, remarks } = req.body;

      if (!unitCode || !votes || lat === undefined || lng === undefined)
        return res.status(400).json({ error: 'unitCode, votes, lat, lng are required' });

      if (!evidenceBase64) return res.status(400).json({ error: 'Evidence image required' });

      const agentId = auth.agent.id;
      const total = Object.values(votes).reduce((s, v) => s + (parseInt(v) || 0), 0);
      if (total === 0) return res.status(400).json({ error: 'Total votes cannot be zero' });

      const hash = crypto.createHash('sha256').update(JSON.stringify({ votes, unitCode, agentId })).digest('hex').slice(0, 16).toUpperCase();
      const refId = `EK-${Date.now().toString(36)}-${crypto.randomBytes(4).toString('hex')}`.toUpperCase();

      await db.query(
        `INSERT INTO results (ref_id, unit_code, agent_id, votes, total_votes, lat, lng, evidence_url, officer_name, registered_voters, accredited_voters, rejected_ballots, remarks, integrity_hash)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14)`,
        [refId, unitCode, agentId, JSON.stringify(votes), total, lat, lng, evidenceBase64, officerName || null, registeredVoters || null, accreditedVoters || null, rejectedBallots || 0, remarks || null, hash]
      );

      return res.status(201).json({ success: true, refId, hash, total, submittedAt: new Date().toISOString() });
    } catch (err) {
      if (err.code === '23505') return res.status(409).json({ error: 'Results already submitted for this unit' });
      console.error('[submit]', err);
      return res.status(500).json({ error: 'Submission failed: ' + err.message });
    }
  }

  return res.status(404).json({ error: 'Not found' });
};
