const bcrypt = require('bcrypt');
const db = require('../db');
const { generateToken } = require('../lib/auth');

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

    console.log(`✅ Agent logged in: ${agentId}`);

    res.status(200).json({
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
    res.status(500).json({ error: 'Login failed: ' + err.message });
  }
};
