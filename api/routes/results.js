// ============================================================
//  api/routes/results.js
//  POST /api/results/submit   — submit EC8A result (agent)
//  GET  /api/results/live     — all submitted results (public)
//  GET  /api/results/:unit    — single unit result
// ============================================================

const express = require('express');
const crypto = require('crypto');
const router = express.Router();
const db = require('../db');
const { verifyToken } = require('../middleware/auth');

// Cryptographic hash for integrity verification (SHA-256, truncated)
function integrityHash(data) {
  return crypto.createHash('sha256')
    .update(JSON.stringify(data))
    .digest('hex')
    .slice(0, 16)
    .toUpperCase();
}

// Generate unique reference ID
function generateRefId(agentId, unitCode) {
  const timestamp = Date.now().toString(36);
  const random = crypto.randomBytes(4).toString('hex');
  return `EK-${timestamp}-${random}`.toUpperCase();
}

// ── POST /api/results/submit ──────────────────────────────
router.post('/submit', verifyToken, async (req, res) => {
  try {
    const {
      unitCode, votes, lat, lng, evidenceBase64,
      officerName, registeredVoters, accreditedVoters, rejectedBallots, remarks
    } = req.body;

    if (!unitCode || !votes || lat === undefined || lng === undefined)
      return res.status(400).json({ error: 'unitCode, votes, lat, lng are required' });

    if (!evidenceBase64)
      return res.status(400).json({ error: 'Evidence image (EC8A sheet) is required' });

    // Validate coordinates within Ekiti State bounding box
    if (lat < 6.5 || lat > 9.0 || lng < 4.0 || lng > 6.5)
      return res.status(400).json({ error: 'Coordinates outside Ekiti State bounds' });

    const agentId = req.agent.id;
    const total = Object.values(votes).reduce((s, v) => s + (parseInt(v) || 0), 0);

    if (total === 0)
      return res.status(400).json({ error: 'Total votes cannot be zero' });

    const hash = integrityHash({ votes, unit: unitCode, agent: agentId, ts: Date.now() });
    const refId = generateRefId(agentId, unitCode);

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
    res.status(500).json({ error: 'Submission failed' });
  }
});

// ── GET /api/results/live ─────────────────────────────────
router.get('/live', async (req, res) => {
  try {
    const { rows } = await db.query(`
      SELECT r.*, p.name as unit_name, p.ward, p.lga
      FROM results r
      JOIN polling_units p ON r.unit_code = p.code
      ORDER BY r.submitted_at DESC
    `);
    res.json({ count: rows.length, results: rows });
  } catch (err) {
    console.error('[live results]', err.message);
    res.status(500).json({ error: 'Failed to fetch results' });
  }
});

// ── GET /api/results/:unit ────────────────────────────────
router.get('/:unit', async (req, res) => {
  try {
    const { unit } = req.params;
    const { rows } = await db.query(`
      SELECT r.*, p.name as unit_name, p.ward, p.lga
      FROM results r
      JOIN polling_units p ON r.unit_code = p.code
      WHERE r.unit_code = $1
    `, [unit]);

    if (!rows.length)
      return res.status(404).json({ error: 'No results for this unit' });

    res.json(rows[0]);
  } catch (err) {
    console.error('[unit result]', err.message);
    res.status(500).json({ error: 'Failed to fetch unit result' });
  }
});

module.exports = router;
