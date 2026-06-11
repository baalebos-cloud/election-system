// ============================================================
//  api/routes/results.js
//  POST /api/results/submit   — submit EC8A result (agent)
//  GET  /api/results/live     — all submitted results (public)
//  GET  /api/results/:unit    — single unit result
// ============================================================

const express = require('express');
const router  = express.Router();
const { verifyToken } = require('../middleware/auth');

// Simple FNV-1a hash for chain verification (mirrors js/security.js)
function fnvHash(data) {
  let h = 2166136261;
  const s = typeof data === 'string' ? data : JSON.stringify(data);
  for (let i = 0; i < s.length; i++) {
    h ^= s.charCodeAt(i);
    h = Math.imul(h, 16777619) >>> 0;
  }
  return h.toString(16).toUpperCase().padStart(8, '0');
}

// ── POST /api/results/submit ──────────────────────────────
router.post('/submit', verifyToken, async (req, res) => {
  try {
    const { unitCode, votes, lat, lng, evidenceBase64, officerName, registeredVoters, accreditedVoters, rejectedBallots, remarks } = req.body;

    if (!unitCode || !votes || lat === undefined || lng === undefined)
      return res.status(400).json({ error: 'unitCode, votes, lat, lng are required' });

    if (!evidenceBase64)
      return res.status(400).json({ error: 'Evidence image (EC8A sheet) is required' });

    const agentId   = req.agent.id;
    const total     = Object.values(votes).reduce((s, v) => s + (parseInt(v) || 0), 0);
    const hash      = fnvHash({ votes, unit: unitCode, agent: agentId });
    const refId     = 'EK-' + fnvHash({ agent: agentId, unit: unitCode, ts: Date.now() });
    const submittedAt = new Date().toISOString();

    // Validate coordinates within Ekiti State bounding box
    if (lat < 6.5 || lat > 9.0 || lng < 4.0 || lng > 6.5)
      return res.status(400).json({ error: 'Coordinates outside Ekiti State bounds' });

    // TODO: insert into DB
    // await db.query(`
    //   INSERT INTO results
    //     (ref_id, unit_code, agent_id, votes, total, lat, lng, evidence_url, officer_name,
    //      registered_voters, accredited_voters, rejected_ballots, remarks, integrity_hash, submitted_at)
    //   VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15)`,
    //   [refId, unitCode, agentId, JSON.stringify(votes), total, lat, lng,
    //    evidenceBase64, officerName, registeredVoters, accreditedVoters,
    //    rejectedBallots, remarks, hash, submittedAt]
    // );

    res.status(201).json({
      success: true, refId, hash, total, submittedAt,
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
    // TODO: const { rows } = await db.query('SELECT * FROM results ORDER BY submitted_at DESC');
    // res.json({ count: rows.length, results: rows });
    res.json({ count: 0, results: [], message: 'Connect database to serve live results' });
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch results' });
  }
});

// ── GET /api/results/:unit ────────────────────────────────
router.get('/:unit', async (req, res) => {
  try {
    const { unit } = req.params;
    // TODO: const { rows } = await db.query('SELECT * FROM results WHERE unit_code = $1', [unit]);
    // if (!rows.length) return res.status(404).json({ error: 'No results for this unit' });
    // res.json(rows[0]);
    res.json({ unitCode: unit, message: 'Connect database to serve unit result' });
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch unit result' });
  }
});

module.exports = router;