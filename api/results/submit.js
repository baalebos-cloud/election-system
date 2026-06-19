const crypto = require('crypto');
const db = require('../db');
const { verifyToken } = require('../lib/auth');

function integrityHash(data) {
  return crypto.createHash('sha256')
    .update(JSON.stringify(data))
    .digest('hex')
    .slice(0, 16)
    .toUpperCase();
}

function generateRefId() {
  const timestamp = Date.now().toString(36);
  const random = crypto.randomBytes(4).toString('hex');
  return `EK-${timestamp}-${random}`.toUpperCase();
}

module.exports = async (req, res) => {
  // Set CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  // Verify token
  const auth = verifyToken(req.headers['authorization']);
  if (!auth.valid) {
    return res.status(401).json({ error: auth.error });
  }

  try {
    const {
      unitCode, votes, lat, lng, evidenceBase64,
      officerName, registeredVoters, accreditedVoters, rejectedBallots, remarks
    } = req.body;

    if (!unitCode || !votes || lat === undefined || lng === undefined)
      return res.status(400).json({ error: 'unitCode, votes, lat, lng are required' });

    if (!evidenceBase64)
      return res.status(400).json({ error: 'Evidence image (EC8A sheet) is required' });

    if (lat < 6.5 || lat > 9.0 || lng < 4.0 || lng > 6.5)
      return res.status(400).json({ error: 'Coordinates outside Ekiti State bounds' });

    const agentId = auth.agent.id;
    const total = Object.values(votes).reduce((s, v) => s + (parseInt(v) || 0), 0);

    if (total === 0)
      return res.status(400).json({ error: 'Total votes cannot be zero' });

    const hash = integrityHash({ votes, unit: unitCode, agent: agentId, ts: Date.now() });
    const refId = generateRefId();

    await db.query(
      `INSERT INTO results
        (ref_id, unit_code, agent_id, votes, total_votes, lat, lng, evidence_url, officer_name,
         registered_voters, accredited_voters, rejected_ballots, remarks, integrity_hash)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14)`,
      [
        refId, unitCode, agentId, JSON.stringify(votes), total, lat, lng,
        evidenceBase64, officerName || null, registeredVoters || null,
        accreditedVoters || null, rejectedBallots || 0, remarks || null, hash
      ]
    );

    res.status(201).json({
      success: true,
      refId,
      hash,
      total,
      submittedAt: new Date().toISOString(),
      message: 'Results sealed and recorded',
    });
  } catch (err) {
    if (err.code === '23505')
      return res.status(409).json({ error: 'Results already submitted for this unit' });
    console.error('[submit]', err.message);
    res.status(500).json({ error: 'Submission failed: ' + err.message });
  }
};
