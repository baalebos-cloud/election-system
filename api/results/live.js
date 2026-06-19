const db = require('../db');

module.exports = async (req, res) => {
  // Set CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { rows } = await db.query(`
      SELECT * FROM results ORDER BY submitted_at DESC
    `);
    res.status(200).json({ count: rows.length, results: rows });
  } catch (err) {
    console.error('[live results]', err.message);
    res.status(500).json({ error: 'Failed to fetch results' });
  }
};
