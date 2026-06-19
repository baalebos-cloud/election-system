// ============================================================
//  api/db.js
//  PostgreSQL connection pool (Neon compatible)
// ============================================================

require('dotenv').config();
const { Pool } = require('pg');

if (!process.env.DATABASE_URL) {
  console.error('❌ FATAL: DATABASE_URL is not set in .env file');
  process.exit(1);
}

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: {
    rejectUnauthorized: false
  },
  max: 10,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 10000,
});

pool.on('connect', () => {
  console.log('✅ Connected to Neon PostgreSQL database');
});

pool.on('error', (err) => {
  console.error('❌ Database pool error:', err.message);
});

// Test connection on startup
pool.query('SELECT NOW()')
  .then(() => console.log('✅ Database connection verified'))
  .catch(err => console.error('❌ Database connection failed:', err.message));

module.exports = {
  query: (text, params) => pool.query(text, params),
  getClient: () => pool.connect(),
  pool,
};
