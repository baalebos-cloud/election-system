// ============================================================
//  api/server.js
//  Express server — REST API for agents, results, audit log
//  Run: node api/server.js
// ============================================================

require('dotenv').config();
const express    = require('express');
const cors       = require('cors');
const helmet     = require('helmet');
const rateLimit  = require('express-rate-limit');
const path       = require('path');

const agentsRouter  = require('./routes/agents');
const resultsRouter = require('./routes/results');

const app  = express();
const PORT = process.env.PORT || 3000;

// Security headers
app.use(helmet({ contentSecurityPolicy: false }));

// CORS — restrict to your domain in production
app.use(cors({ origin: process.env.ALLOWED_ORIGIN || '*' }));

// Body parsing
app.use(express.json({ limit: '15mb' }));  // 15MB allows base64 evidence images

// Global rate limiter — 100 requests per 15 minutes per IP
app.use(rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 100,
  message: { error: 'Too many requests — please try again later' },
}));

// Serve frontend static files
app.use(express.static(path.join(__dirname, '..')));

// API routes
app.use('/api/agents',  agentsRouter);
app.use('/api/results', resultsRouter);

// Health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', ts: new Date().toISOString(), env: process.env.NODE_ENV || 'development' });
});

// 404 fallback
app.use((req, res) => res.status(404).json({ error: 'Route not found' }));

// Global error handler
app.use((err, req, res, next) => {
  console.error('[ERROR]', err.message);
  res.status(500).json({ error: 'Internal server error' });
});

app.listen(PORT, () => {
  console.log(`✅ INEC Ekiti Election Server running on http://localhost:${PORT}`);
  console.log(`   Environment : ${process.env.NODE_ENV || 'development'}`);
  console.log(`   DB URL      : ${process.env.DATABASE_URL ? '***set***' : 'NOT SET'}`);
});