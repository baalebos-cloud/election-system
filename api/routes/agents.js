// ============================================================
//  api/routes/agents.js
//  POST /api/agents/register   — register new party agent
//  POST /api/agents/login      — authenticate, return JWT
//  GET  /api/agents/:id        — fetch agent profile (admin)
// ============================================================

const express = require('express');
const bcrypt = require('bcrypt');
const router = express.Router();
const db = require('../db');
const { generateToken, verifyToken, requireAdmin } = require('../middleware/auth');

// ── POST /api/agents/register ─────────────────────────────
router.post('/register', async (req, res) => {
  try {
    const { name, party, lga, town, unit, ward, pin, securityQuestion, securityAnswer } = req.body;

    // Validate required fields
    const required = { name, party, lga, town, unit, ward, pin };
    for (const [k, v] of Object.entries(required)) {
      if (!v || String(v).trim() === '')
        return res.status(400).json({ error: `Field "${k}" is required` });
    }

    if (pin.length < 6)
      return res.status(400).json({ error: 'PIN must be at least 6 characters' });

    // Generate agent ID from party and LGA
    const countResult = await db.query('SELECT COUNT(*) FROM agents WHERE lga = $1', [lga]);
    const count = parseInt(countResult.rows[0].count) + 1;
    const lgaCode = unit.split('/')[1] || 'XX';
    const agentId = `EK-${party}-${lgaCode}-${String(count).padStart(4, '0')}`;

    // Hash PIN and security answer
    const pinHash = await bcrypt.hash(pin, 12);
    const securityAHash = securityAnswer ? await bcrypt.hash(securityAnswer.toLowerCase().trim(), 10) : null;

    await db.query(
      `INSERT INTO agents (id, name, party, lga, town, unit_code, ward, pin_hash, security_q, security_a_hash)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)`,
      [agentId, name, party, lga, town, unit, ward, pinHash, securityQuestion || null, securityAHash]
    );

    res.status(201).json({
      success: true,
      agentId,
      message: 'Agent registered successfully',
    });
  } catch (err) {
    if (err.code === '23505')
      return res.status(409).json({ error: 'Agent already registered for this unit' });
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

    // Fetch agent from database
    const result = await db.query('SELECT * FROM agents WHERE id = $1 AND is_active = TRUE', [agentId]);
    const agent = result.rows[0];

    if (!agent)
      return res.status(401).json({ error: 'Invalid credentials' });

    // Compare PIN hash
    const match = await bcrypt.compare(pin, agent.pin_hash);
    if (!match)
      return res.status(401).json({ error: 'Invalid credentials' });

    // Update last login timestamp
    await db.query('UPDATE agents SET last_login = NOW() WHERE id = $1', [agentId]);

    const token = generateToken(agent);

    res.json({
      success: true,
      token,
      agent: {
        id: agent.id,
        name: agent.name,
        party: agent.party,
        lga: agent.lga,
        town: agent.town,
        unit: agent.unit_code,
        ward: agent.ward,
      },
    });
  } catch (err) {
    console.error('[login]', err.message);
    res.status(500).json({ error: 'Login failed' });
  }
});

// ── GET /api/agents/:id  (admin only) ─────────────────────
router.get('/:id', verifyToken, requireAdmin, async (req, res) => {
  try {
    const result = await db.query(
      'SELECT id, name, party, lga, town, unit_code, ward, registered_at, last_login, is_active FROM agents WHERE id = $1',
      [req.params.id]
    );
    if (!result.rows.length)
      return res.status(404).json({ error: 'Agent not found' });
    res.json(result.rows[0]);
  } catch (err) {
    console.error('[get agent]', err.message);
    res.status(500).json({ error: 'Failed to fetch agent' });
  }
});

module.exports = router;
