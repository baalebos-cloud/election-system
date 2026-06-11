// ============================================================
//  api/routes/agents.js
//  POST /api/agents/register   — register new party agent
//  POST /api/agents/login      — authenticate, return JWT
//  GET  /api/agents/:id        — fetch agent profile (admin)
// ============================================================

const express  = require('express');
const bcrypt   = require('bcrypt');
const router   = express.Router();
const { generateToken, verifyToken, requireAdmin } = require('../middleware/auth');

// In production replace with real DB queries
// e.g. const db = require('../db');

// ── POST /api/agents/register ─────────────────────────────
router.post('/register', async (req, res) => {
  try {
    const { agentId, name, party, lga, town, unit, ward, pin } = req.body;

    // Validate required fields
    const required = { agentId, name, party, lga, town, unit, ward, pin };
    for (const [k, v] of Object.entries(required)) {
      if (!v || String(v).trim() === '')
        return res.status(400).json({ error: `Field "${k}" is required` });
    }

    if (pin.length < 6)
      return res.status(400).json({ error: 'PIN must be at least 6 characters' });

    // Hash PIN before storing
    const pinHash = await bcrypt.hash(pin, 12);

    // TODO: insert into DB
    // await db.query(
    //   'INSERT INTO agents (id, name, party, lga, town, unit, ward, pin_hash) VALUES ($1,$2,$3,$4,$5,$6,$7,$8)',
    //   [agentId, name, party, lga, town, unit, ward, pinHash]
    // );

    res.status(201).json({
      success: true,
      agentId,
      message: 'Agent registered successfully',
    });
  } catch (err) {
    if (err.code === '23505')   // Postgres unique violation
      return res.status(409).json({ error: 'Agent ID already registered' });
    console.error('[register]', err.message);
    res.status(500).json({ error: 'Registration failed' });
  }
});

// ── POST /api/agents/login ────────────────────────────────
router.post('/login', async (req, res) => {
  try {
    const { agentId, pin } = req.body;
    if (!agentId || !pin)
      return res.status(400).json({ error: 'agentId and pin are required' });

    // TODO: fetch from DB
    // const result = await db.query('SELECT * FROM agents WHERE id = $1', [agentId]);
    // const agent  = result.rows[0];
    // if (!agent) return res.status(401).json({ error: 'Invalid credentials' });
    // const match  = await bcrypt.compare(pin, agent.pin_hash);
    // if (!match)  return res.status(401).json({ error: 'Invalid credentials' });

    // Placeholder success for demo
    const agent = { id: agentId, party: 'APC', lga: 'Ado Ekiti', unit: 'EKS/AD/0001', ward: 'Adebayo' };
    const token = generateToken(agent);

    res.json({ success: true, token, agent });
  } catch (err) {
    console.error('[login]', err.message);
    res.status(500).json({ error: 'Login failed' });
  }
});

// ── GET /api/agents/:id  (admin only) ─────────────────────
router.get('/:id', verifyToken, requireAdmin, async (req, res) => {
  try {
    // TODO: const result = await db.query('SELECT * FROM agents WHERE id = $1', [req.params.id]);
    res.json({ agentId: req.params.id, message: 'DB query placeholder' });
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch agent' });
  }
});

module.exports = router;