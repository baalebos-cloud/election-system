-- ============================================================
--  database/schema.sql
--  INEC Ekiti State Election System — PostgreSQL Schema
--  Run: psql -d ekiti_election -f database/schema.sql
-- ============================================================

-- ── AGENTS ────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS agents (
  id              VARCHAR(30)  PRIMARY KEY,        -- e.g. EK-APC-AD-0001
  name            VARCHAR(120) NOT NULL,
  party           VARCHAR(10)  NOT NULL,
  lga             VARCHAR(60)  NOT NULL,
  town            VARCHAR(80)  NOT NULL,
  unit_code       VARCHAR(20)  NOT NULL,
  ward            VARCHAR(80)  NOT NULL,
  pin_hash        TEXT         NOT NULL,           -- bcrypt hash
  security_q      TEXT,
  security_a_hash TEXT,                            -- bcrypt hash
  registered_at   TIMESTAMPTZ  DEFAULT NOW(),
  is_active       BOOLEAN      DEFAULT TRUE,
  last_login      TIMESTAMPTZ
);

-- ── RESULTS ───────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS results (
  ref_id              VARCHAR(20)  PRIMARY KEY,
  unit_code           VARCHAR(20)  NOT NULL UNIQUE, -- one submission per unit
  agent_id            VARCHAR(30)  NOT NULL REFERENCES agents(id),
  votes               JSONB        NOT NULL,         -- { "APC": 320, "PDP": 210, ... }
  total_votes         INTEGER      NOT NULL,
  lat                 DECIMAL(10,7),
  lng                 DECIMAL(10,7),
  evidence_url        TEXT,                          -- base64 or S3 URL
  officer_name        VARCHAR(120),
  registered_voters   INTEGER,
  accredited_voters   INTEGER,
  rejected_ballots    INTEGER DEFAULT 0,
  remarks             TEXT,
  integrity_hash      VARCHAR(8)   NOT NULL,         -- FNV-1a
  submitted_at        TIMESTAMPTZ  DEFAULT NOW()
);

-- ── AUDIT LOG ─────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS audit_log (
  id          SERIAL       PRIMARY KEY,
  event_type  VARCHAR(10)  NOT NULL,               -- ok, warn, crit, info
  message     TEXT         NOT NULL,
  detail      TEXT,
  agent_id    VARCHAR(30)  REFERENCES agents(id),
  ip_address  INET,
  chain_hash  VARCHAR(16),
  logged_at   TIMESTAMPTZ  DEFAULT NOW()
);

-- ── POLLING UNITS (reference) ─────────────────────────────
CREATE TABLE IF NOT EXISTS polling_units (
  code   VARCHAR(20)  PRIMARY KEY,                 -- e.g. EKS/AD/0001
  name   VARCHAR(120) NOT NULL,
  ward   VARCHAR(80)  NOT NULL,
  lga    VARCHAR(60)  NOT NULL,
  lat    DECIMAL(10,7),
  lng    DECIMAL(10,7)
);

-- ── INDEXES ───────────────────────────────────────────────
CREATE INDEX IF NOT EXISTS idx_results_unit    ON results(unit_code);
CREATE INDEX IF NOT EXISTS idx_results_agent   ON results(agent_id);
CREATE INDEX IF NOT EXISTS idx_results_time    ON results(submitted_at DESC);
CREATE INDEX IF NOT EXISTS idx_audit_type      ON audit_log(event_type);
CREATE INDEX IF NOT EXISTS idx_audit_time      ON audit_log(logged_at DESC);
CREATE INDEX IF NOT EXISTS idx_agents_lga      ON agents(lga);
CREATE INDEX IF NOT EXISTS idx_units_lga       ON polling_units(lga);

-- ── VIEWS ─────────────────────────────────────────────────
CREATE OR REPLACE VIEW live_totals AS
SELECT
  party_vote.party,
  SUM(party_vote.votes) AS total_votes
FROM results,
  LATERAL jsonb_each_text(votes) AS party_vote(party, votes)
GROUP BY party_vote.party
ORDER BY total_votes DESC;

CREATE OR REPLACE VIEW unit_summary AS
SELECT
  r.unit_code,
  p.name       AS unit_name,
  p.ward,
  p.lga,
  r.total_votes,
  r.agent_id,
  r.submitted_at,
  r.integrity_hash
FROM results r
JOIN polling_units p ON r.unit_code = p.code;