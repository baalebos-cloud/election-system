# INEC Ekiti State — Secure Election Results System

Real-time election result management system for all 905 polling units across 16 LGAs in Ekiti State, Nigeria.

---

## Project Structure

```
ekiti-election-system/
├── index.html          ← Situation Room Dashboard
├── agent.html          ← Agent login + result submission portal
├── register.html       ← Party agent registration (5-step)
├── results.html        ← Public live results by polling unit
├── security.html       ← Security Operations Centre (admin)
│
├── assets/
│   ├── css/
│   │   └── main.css    ← All shared styles (212 classes)
│   └── img/
│       └── party-logos/ ← APC.png, PDP.png, etc.
│
├── js/
│   ├── data/
│   │   ├── polling-units.js  ← 905 units across 16 LGAs
│   │   └── parties.js        ← 8 registered parties
│   ├── security.js    ← SEC engine (brute force, CAPTCHA, hashing)
│   ├── map.js         ← Leaflet maps, GPS, manual coord entry
│   ├── auth.js        ← Login, logout, registration flow
│   ├── results.js     ← Form, evidence upload, submit, rendering
│   └── app.js         ← Bootstrap, screen router, shared utils
│
├── api/
│   ├── server.js              ← Express entry point
│   ├── middleware/
│   │   └── auth.js            ← JWT verification + RBAC
│   └── routes/
│       ├── agents.js          ← POST /register, POST /login
│       └── results.js         ← POST /submit, GET /live
│
├── database/
│   ├── schema.sql     ← agents, results, audit_log, polling_units
│   └── seed.sql       ← Demo agents seed data
│
├── .env               ← Secrets (never commit)
├── .gitignore
├── package.json
└── README.md
```

---

## Quick Start

### Option A — Frontend only (no backend)
Just open `index.html` in any browser. All data is in-memory (demo mode).

### Option B — Full production stack

**1. Install dependencies**
```bash
npm install
```

**2. Set up environment**
```bash
cp .env .env.local
# Edit .env.local with your real DB URL and JWT secret
```

**3. Create PostgreSQL database**
```bash
createdb ekiti_election
npm run db:init
npm run db:seed
```

**4. Start server**
```bash
npm start          # production
npm run dev        # development (auto-reload)
```
Server runs at `http://localhost:3000`

---

## Security Features

| Layer | Mechanism |
|---|---|
| Brute force | 5-attempt lockout · 5-min cooldown |
| CAPTCHA | Math CAPTCHA activates at 3rd failed attempt |
| Anomaly detection | SQL injection, XSS, overflow pattern matching |
| Honeypots | Common bad credentials silently flagged |
| Rate limiting | 10 login attempts/min · 100 API req/15min |
| Session tokens | Cryptographic token per session (Web Crypto API) |
| Hash chaining | FNV-1a integrity hash on every result submission |
| JWT (API) | 12-hour signed tokens for all API routes |
| bcrypt | PIN hashed with cost factor 12 |

---

## Demo Login Credentials

| Agent ID | PIN | Party | LGA |
|---|---|---|---|
| EK-APC-AD-0001 | secure1 | APC | Ado Ekiti |
| EK-PDP-EE-0002 | pass123 | PDP | Ekiti East |
| EK-LP-IK-0003  | labour7 | LP  | Ikere |
| EK-NNPP-IJ-0004| nnpp24  | NNPP| Ijero |

---

## Tech Stack

- **Frontend**: Vanilla HTML/CSS/JS · Leaflet.js · Space Grotesk font
- **Backend**: Node.js · Express · Helmet · JWT · bcrypt
- **Database**: PostgreSQL · JSONB for vote storage
- **Maps**: OpenStreetMap tiles via Leaflet
- **Deployment**: Any static host (frontend) + Node host (API)

---

*INEC Ekiti State · Governorship Election 2024 · Classified: Official Use Only*