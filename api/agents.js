const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const db = require('./db');

const JWT_SECRET = process.env.JWT_SECRET || 'dev-secret-change-in-production';

function generateToken(agent) {
  return jwt.sign(
    { id: agent.id, party: agent.party, lga: agent.lga, unit: agent.unit_code, role: 'agent' },
    JWT_SECRET,
    { expiresIn: '12h' }
  );
}

module.exports = async (req, res) => {
  // CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  if (req.method === 'OPTIONS') return res.status(200).end();

  const url = req.url;

  // ── GET /api/agents/list — Get all agents with online status ──
  if (req.method === 'GET' && url.includes('/list')) {
    try {
      const { rows } = await db.query(`
        SELECT 
          id, name, party, lga, town, unit_code, ward, registered_at, last_login, is_active,
          CASE 
            WHEN last_login > NOW() - INTERVAL '15 minutes' THEN 'on'
            WHEN last_login > NOW() - INTERVAL '1 hour' THEN 'pend'
            ELSE 'off'
          END as status
        FROM agents 
        WHERE is_active = TRUE 
        ORDER BY last_login DESC NULLS LAST
      `);
      return res.status(200).json({ count: rows.length, agents: rows });
    } catch (err) {
      console.error('[list agents]', err);
      return res.status(500).json({ error: 'Failed to fetch agents' });
    }
  }

  // ── GET /api/agents/stats — Get agent statistics ──
  if (req.method === 'GET' && url.includes('/stats')) {
    try {
      const { rows } = await db.query(`
        SELECT 
          COUNT(*) as total,
          COUNT(CASE WHEN last_login > NOW() - INTERVAL '15 minutes' THEN 1 END) as online,
          COUNT(CASE WHEN last_login > NOW() - INTERVAL '1 hour' AND last_login <= NOW() - INTERVAL '15 minutes' THEN 1 END) as connecting,
          COUNT(CASE WHEN last_login IS NULL OR last_login <= NOW() - INTERVAL '1 hour' THEN 1 END) as offline
        FROM agents 
        WHERE is_active = TRUE
      `);
      return res.status(200).json(rows[0]);
    } catch (err) {
      console.error('[agent stats]', err);
      return res.status(500).json({ error: 'Failed to fetch stats' });
    }
  }

  // ── POST /api/agents/register ─────────────────────────────
  if (req.method === 'POST' && url.includes('/register')) {
    try {
      const { name, party, lga, town, unit, ward, pin, securityQuestion, securityAnswer } = req.body;

      const required = { name, party, lga, town, unit, ward, pin };
      for (const [k, v] of Object.entries(required)) {
        if (!v || String(v).trim() === '') return res.status(400).json({ error: `Field "${k}" is required` });
      }
      if (pin.length < 6) return res.status(400).json({ error: 'PIN must be at least 6 characters' });

      const countResult = await db.query('SELECT COUNT(*) FROM agents WHERE lga = $1', [lga]);
      const count = parseInt(countResult.rows[0].count) + 1;
      const lgaCode = unit.split('/')[1] || 'XX';
      const agentId = `EK-${party}-${lgaCode}-${String(count).padStart(4, '0')}`;

      const pinHash = await bcrypt.hash(pin, 12);
      const securityAHash = securityAnswer ? await bcrypt.hash(securityAnswer.toLowerCase().trim(), 10) : null;

      await db.query(
        `INSERT INTO agents (id, name, party, lga, town, unit_code, ward, pin_hash, security_q, security_a_hash)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)`,
        [agentId, name, party, lga, town, unit, ward, pinHash, securityQuestion || null, securityAHash]
      );

      return res.status(201).json({ success: true, agentId, message: 'Agent registered successfully' });
    } catch (err) {
      if (err.code === '23505') return res.status(409).json({ error: 'Agent already registered' });
      console.error('[register]', err);
      return res.status(500).json({ error: 'Registration failed: ' + err.message });
    }
  }

  // ── POST /api/agents/login ────────────────────────────────
  if (req.method === 'POST' && url.includes('/login')) {
    try {
      const { agentId, pin } = req.body;
      if (!agentId || !pin) return res.status(400).json({ error: 'agentId and pin are required' });

      const result = await db.query('SELECT * FROM agents WHERE id = $1 AND is_active = TRUE', [agentId]);
      const agent = result.rows[0];

      if (!agent) return res.status(401).json({ error: 'Invalid credentials' });

      const match = await bcrypt.compare(pin, agent.pin_hash);
      if (!match) return res.status(401).json({ error: 'Invalid credentials' });

      await db.query('UPDATE agents SET last_login = NOW() WHERE id = $1', [agentId]);

      const token = generateToken(agent);

      return res.status(200).json({
        success: true,
        token,
        agent: {
          id: agent.id,
          name: agent.name,
          party: agent.party,
          lga: agent.lga,
          town: agent.town,
          unit: agent.unit_code,
          ward: agent.ward
        }
      });
    } catch (err) {
      console.error('[login]', err);
      return res.status(500).json({ error: 'Login failed: ' + err.message });
    }
  }

  return res.status(404).json({ error: 'Not found' });
};
