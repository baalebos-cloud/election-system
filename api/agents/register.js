const bcrypt = require('bcrypt');
const db = require('../db');

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

    console.log(`✅ Agent registered: ${agentId}`);

    res.status(201).json({
      success: true,
      agentId,
      message: 'Agent registered successfully',
    });
  } catch (err) {
    if (err.code === '23505')
      return res.status(409).json({ error: 'Agent already registered for this unit' });
    console.error('[register]', err.message);
    res.status(500).json({ error: 'Registration failed: ' + err.message });
  }
};
