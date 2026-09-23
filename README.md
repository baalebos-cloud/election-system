# NICERES — Nigeria Election Results Integrity System

> Verifiable election-observation infrastructure for Nigeria's 176,846 polling units across 36 States + FCT.

**Live Prototype:** [niceres.baalebo.xyz](https://niceres.baalebo.xyz) 
**Track:** Election Observation & Data · Transparency & Trust  
**Target:** Nigeria 2027 General Elections  
**Sandbox:** AI and Democracy Forum — YIAGA Africa 2026

---

## What is NICERES?

NICERES enables accredited party agents to transmit cryptographically sealed election results directly from polling units — GPS-verified, with photo evidence of the signed EC8A result sheet, and with an AI anomaly detection engine that flags statistical irregularities in real time before any result is accepted into the system.

The system is positioned as **verifiable election-observation infrastructure**, not a fraud-detection oracle. AI assists investigation and explanation. It does not independently declare fraud, invalidate an election, or replace human review.

```
REAL POLLING UNIT
       ↓
AUTHORIZED AGENT
       ↓
LOCATION CONTEXT
       ↓
DIGITAL RESULT
       ↓
EC8A EVIDENCE
       ↓
SERVER VALIDATION
       ↓
STATISTICAL ANALYSIS
       ↓
AI-ASSISTED INVESTIGATION
       ↓
AUDIT TRAIL
       ↓
HUMAN REVIEW
       ↓
VERIFIABLE OBSERVATION
```

---

## Current Status

| Layer | Status |
|---|---|
| Static proof-of-concept (v1) | ✅ Complete — frozen as baseline |
| Agent Portal (login, GPS, EC8A, submit) | ✅ Working |
| Situation Room (national map, state progress, party totals) | ✅ Working |
| Live Results (filterable unit cards, AI flag badges) | ✅ Working |
| Security Operations Centre (audit log, threat gauges) | ✅ Working |
| Agent Registration (5-step, national ID format) | ✅ Working |
| AI anomaly engine (statistical, client-side) | ✅ Working |
| Backend API + PostgreSQL | 🔧 Phase 2 — in progress |
| Evidence intelligence (OCR, document comparison) | 📋 Phase 4 — planned |
| Production deployment at scale | 📋 Phase 5 — planned |

---

## Architecture Overview

```
INTERNET
    ↓
CDN / WAF / TLS
    ↓
Frontend: Agent Portal / Situation Room / Public Verification
    ↓
API Gateway: Authentication / RBAC / Rate Limiting
    ↓
Backend Services
├── Auth & Agent Service
├── Polling Unit Service
├── Result Service
├── Evidence Service
└── Audit Service
    ↓
Validation & Integrity Engine
    ↓
Statistical Anomaly Engine
    ↓
AI Orchestrator
    ↓
9-Provider LLM Gateway
    ↓
Human Review / Case Management
    ↓
Verified Observation + Audit Trail
```

---

## Repository Structure

```
niceres/
├── frontend/          # Agent Portal, Situation Room, Public Verification
├── backend/           # API, services, repositories, validators
├── ai/                # Anomaly engine, LLM orchestration, evaluation
├── data/              # Polling unit datasets, state/LGA/ward hierarchy
├── security/          # Threat model, security tests, audit controls
├── database/          # PostgreSQL schema, migrations
├── docs/              # Architecture, API, AI, security, operations, team
├── tests/             # Unit, integration, E2E, security tests
├── scripts/           # Seed, migration, deploy, data pipeline
├── .github/           # CI/CD workflows, PR templates, CODEOWNERS
├── APPLICATION.md     # AI and Democracy Forum Sandbox submission
├── CONTRIBUTING.md    # Contribution guide and branch conventions
└── README.md
```

---

## Six-Member Team & Ownership

| Member | Role | Primary Ownership | Supporting |
|---|---|---|---|
| **Oluwadare Jayeola** | Project Lead / Cloud & DevOps Engineer | Overall architecture, CI/CD, deployment, observability, release management, AI gateway infrastructure, technical documentation | All areas |
| **Member 2** | Backend & Database Engineer | APIs, PostgreSQL schema, authentication, RBAC, result submission, evidence metadata, validation services, audit APIs | Security · Data |
| **Member 3** | Frontend & UX Engineer | Agent Portal, Situation Room, Live Results, investigation interfaces, public verification, mobile/offline UX, mapping UX | Data |
| **Member 4** | AI/ML & LLM Intelligence Engineer | Statistical anomaly detection, AI orchestration, 9-provider LLM gateway, model routing, structured output validation, evaluation, explainability, responsible AI controls | Oluwadare · Security |
| **Member 5** | Election Data & Verification Engineer | Polling unit datasets, state/LGA/ward hierarchy, result schemas, geographic validation, data normalisation, provenance, versioning, evidence verification | Backend · Frontend |
| **Member 6** | Cybersecurity & Privacy Engineer | Threat modelling, application & API security, authentication security, privacy, evidence protection, audit integrity, vulnerability assessment, AI gateway security, incident response | Oluwadare · Backend |

### Detailed Ownership Matrix

| Concern | Owner | Reviewers |
|---|---|---|
| Overall architecture | Oluwadare | All |
| CI/CD & deployment | Oluwadare | All |
| Observability & operations | Oluwadare | Member 2 |
| Backend / PostgreSQL | Member 2 | Member 6 · Member 5 |
| Authentication implementation | Member 2 | Member 6 |
| Frontend / UX | Member 3 | Member 5 |
| Offline / low-bandwidth UX | Member 3 | Member 5 |
| AI / LLM gateway | Member 4 | Oluwadare · Member 6 |
| AI evaluation & monitoring | Member 4 | Member 5 · Member 6 |
| Election datasets & pipeline | Member 5 | Member 2 · Member 3 |
| Geographic validation | Member 5 | Member 2 |
| Cybersecurity & privacy | Member 6 | Oluwadare · Member 2 |
| Evidence security | Member 6 | Member 2 |
| AI gateway security | Member 6 | Oluwadare · Member 4 |
| Testing (all layers) | All members | Assigned owner per area |
| Documentation | All members | Oluwadare |

---

## AI Architecture — Three Layers

```
Layer 1 — Deterministic Validation
Invalid polling unit, invalid party, duplicate submission,
missing fields, impossible totals, data type errors.

Layer 2 — Statistical Anomaly Detection
Turnout anomaly, margin anomaly (>95% winner share),
round-number patterns, zero-vote patterns, geographic
outliers, temporal outliers, coordinated duplicate patterns.

Layer 3 — LLM Investigation (9-Provider Gateway)
Contextual explanation, evidence summarisation,
missing-information detection, recommended human-review actions.
```

> **Responsible AI principle:** An anomaly is a review signal, not proof of fraud. The system uses language such as "requires human review" rather than making unsupported allegations.

**AI output structure per submission:**
- Observed anomalies (with supporting data points)
- Evidence vs inference separation
- Missing information identified
- Recommended human-review action
- No determination of election validity

---

## Branch Conventions

```
main
└── develop
    ├── feature/backend-*
    ├── feature/frontend-*
    ├── feature/ai-*
    ├── feature/data-*
    ├── feature/security-*
    └── feature/devops-*
```

No direct pushes to `main`. All changes go through:

```
Pull Request → Lint → Unit Tests → Security Checks
→ Build → Integration Tests → Review → Merge
→ Deployment → Smoke Tests
```

---

## Implementation Roadmap

### Phase 1 — Prototype Stabilisation ✅
Freeze v1 POC as proof-of-concept baseline. Establish repository governance, CI, environment separation, backend schema, componentised frontend, anomaly-engine interfaces, data provenance, and security threat model.

### Phase 2 — Backend Foundation 🔧
Implement authentication, agent management, polling-unit service, result service, evidence service, audit service, PostgreSQL persistence, and server-side validation.

> **Trust model shift:**  
> Prototype: `Browser → application logic → demo state`  
> Production: `Browser → authenticated API → server validation → database → audit → AI services`

### Phase 3 — AI Intelligence 📋
Deterministic rules, statistical detection, contextual data engine, 9-provider LLM gateway, structured AI outputs, evaluation framework, responsible-AI controls, cost and latency monitoring.

### Phase 4 — Evidence Intelligence 📋
Multimodal pipeline: `EC8A image → validation → OCR / document extraction → numerical comparison → discrepancy detection → human review`

### Phase 5 — National Scale 📋
36 States + FCT, 774 LGAs, 176,846 polling units, large evidence volumes, concurrent reporting, queue processing, caching, object storage, horizontal workers, observability, and disaster recovery.

---

## Core API Surface

```
POST   /api/v1/auth/register
POST   /api/v1/auth/login
POST   /api/v1/auth/logout
POST   /api/v1/auth/refresh
GET    /api/v1/agents/me
GET    /api/v1/polling-units/:code
POST   /api/v1/results
GET    /api/v1/results/:id
POST   /api/v1/evidence/upload
POST   /api/v1/ai/analyse
GET    /api/v1/audit/events
```

---

## Security

Primary threats addressed: credential theft, agent impersonation, fake submissions, result modification, evidence replacement, replay attacks, API abuse, injection attacks, malicious uploads, GPS spoofing, prompt injection, AI data leakage, insider abuse, and audit manipulation.

**Evidence pipeline:**
```
Upload → MIME/type validation → size limits → malware scanning
→ SHA-256 hash → encrypted storage → metadata → audit event
```

**GPS context:** Latitude, longitude, accuracy radius, timestamp, device context, and distance to registered polling-unit coordinates are recorded. Suspicious distance is a review signal, not a disqualification.

**Production integrity:** SHA-256 server-side hashing, authenticated storage controls, append-only audit architecture, and key management. (The v1 FNV-1a client-side hash is a proof-of-concept demonstration only.)

---

## Demo Credentials (v1 Prototype)

| Agent ID | PIN | State |
|---|---|---|
| `NG-APC-EK-AD-0001` | `secure1` | Ekiti |
| `NG-PDP-LA-IK-0001` | `pass123` | Lagos |
| `NG-LP-AB-AI-0001` | `labour7` | Abia |
| `NG-NNPP-KN-DC-0001` | `nnpp24` | Kano |

---

## Observability Metrics

```
http_requests_total            auth_failures_total
http_request_duration          result_submissions_total
result_validation_failures_total
anomalies_detected_total       ai_requests_total
ai_failures_total              ai_latency
evidence_upload_total          audit_events_total
security_events_total          queue_depth
database_latency
```

---

## Contributing

See [CONTRIBUTING.md](./CONTRIBUTING.md) for branch naming, PR conventions, commit message format, and area ownership. Each pull request must be reviewed by the area owner listed in the ownership matrix above before merge to `develop`.

---

## Licence

All rights reserved — NICERES / Baalebos Cloud. Contact [jayeolaoluwadamilare@gmail.com](mailto:jayeolaoluwadamilare@gmail.com) for collaboration inquiries.

---

*AI and Democracy Forum Sandbox — YIAGA Africa 2026*  
*Focus Areas: 03 Election Observation & Data · 04 Transparency & Trust*
