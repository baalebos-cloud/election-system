// ============================================================
//  api/db.js
//  PostgreSQL connection pool
// ============================================================

const { Pool } = require('pg');

// Validate required environment variables in production
if (process.env.NODE_ENV === 'production' && !process.env.DATABASE_URL) {
  console.error('❌ FATAL: DATABASE_URL must be set in production');
  process.exit(1);
}

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false,
  max: 20,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 2000,
});

pool.on('error', (err) => {
  console.error('Unexpected database pool error:', err);
});

module.exports = {
  query: (text, params) => pool.query(text, params),
  getClient: () => pool.connect(),
  pool,
};
