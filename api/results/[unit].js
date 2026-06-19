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
    const { unit } = req.query;
    const { rows } = await db.query('SELECT * FROM results WHERE unit_code = $1', [unit]);

    if (!rows.length)
      return res.status(404).json({ error: 'No results for this unit' });

    res.status(200).json(rows[0]);
  } catch (err) {
    console.error('[unit result]', err.message);
    res.status(500).json({ error: 'Failed to fetch unit result' });
  }
};
