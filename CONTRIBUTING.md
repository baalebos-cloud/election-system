# Contributing to NICERES

> Nigeria Election Results Integrity System  
> Six-member engineering team guide — branch conventions, PR process, commit format, and area ownership.

---

## Table of Contents

- [Team & Area Ownership](#team--area-ownership)
- [Repository Structure](#repository-structure)
- [Branch Naming Conventions](#branch-naming-conventions)
- [Commit Message Format](#commit-message-format)
- [Pull Request Process](#pull-request-process)
- [Code Review Rules](#code-review-rules)
- [Testing Requirements](#testing-requirements)
- [Environment Setup](#environment-setup)
- [Security Rules](#security-rules)
- [Definition of Done](#definition-of-done)

---

## Team & Area Ownership

Every file and folder in this repository has a designated owner. Pull requests that touch an area must be reviewed and approved by that area's owner before merge.

| Area | Folder(s) | Owner | Reviewer(s) |
|---|---|---|---|
| Overall architecture & integration | `/` root, `docs/architecture/` | Oluwadare | All |
| CI/CD & deployment | `.github/`, `scripts/deploy/` | Oluwadare | All |
| Observability & operations | `docs/operations/`, `scripts/ops/` | Oluwadare | Member 2 |
| Backend API & services | `backend/src/` | Member 2 | Member 6, Member 5 |
| Database schema & migrations | `database/` | Member 2 | Member 6 |
| Authentication implementation | `backend/src/services/auth/` | Member 2 | Member 6 |
| Frontend — Agent Portal | `frontend/app/agent/` | Member 3 | Member 5 |
| Frontend — Situation Room | `frontend/app/situation-room/` | Member 3 | Member 5 |
| Frontend — Live Results | `frontend/app/results/` | Member 3 | Member 5 |
| Frontend — Investigations | `frontend/app/investigations/` | Member 3 | Member 5 |
| Frontend — Public Verification | `frontend/app/verification/` | Member 3 | Member 5 |
| Frontend — components & state | `frontend/components/`, `frontend/state/` | Member 3 | Member 5 |
| Offline / low-bandwidth UX | `frontend/services/sync/` | Member 3 | Member 5 |
| AI anomaly engine | `ai/anomaly/` | Member 4 | Oluwadare, Member 6 |
| LLM orchestration & gateway | `ai/orchestrator/`, `ai/gateway/` | Member 4 | Oluwadare, Member 6 |
| AI evaluation & monitoring | `ai/evaluation/` | Member 4 | Member 5, Member 6 |
| Election datasets & pipeline | `data/` | Member 5 | Member 2, Member 3 |
| Geographic validation | `data/validation/` | Member 5 | Member 2 |
| Threat model & security tests | `security/` | Member 6 | Oluwadare, Member 2 |
| Evidence security pipeline | `backend/src/services/evidence/` | Member 6 | Member 2 |
| AI gateway security | `ai/gateway/security/` | Member 6 | Oluwadare, Member 4 |
| Unit tests | `tests/unit/` | Area owner | Assigned reviewer |
| Integration tests | `tests/integration/` | Area owner | Assigned reviewer |
| End-to-end tests | `tests/e2e/` | All | Oluwadare |
| Security tests | `tests/security/` | Member 6 | Oluwadare |
| Documentation | `docs/` | All | Oluwadare |
| Application document | `APPLICATION.md` | Oluwadare | All |

---

## Repository Structure

```
niceres/
├── frontend/          # Agent Portal, Situation Room, Public Verification
│   ├── app/
│   │   ├── auth/
│   │   ├── agent/
│   │   ├── results/
│   │   ├── situation-room/
│   │   ├── investigations/
│   │   ├── security/
│   │   └── verification/
│   ├── components/
│   ├── services/
│   ├── hooks/
│   ├── state/
│   └── tests/
├── backend/           # APIs, services, repositories, validators
│   ├── src/
│   │   ├── config/
│   │   ├── controllers/
│   │   ├── services/
│   │   ├── repositories/
│   │   ├── middleware/
│   │   ├── routes/
│   │   ├── validators/
│   │   ├── models/
│   │   ├── jobs/
│   │   ├── events/
│   │   └── utils/
│   └── tests/
├── ai/                # Anomaly engine, LLM orchestration, evaluation
│   ├── anomaly/
│   ├── orchestrator/
│   ├── gateway/
│   └── evaluation/
├── data/              # Polling unit datasets, state/LGA/ward hierarchy
│   ├── raw/
│   ├── normalised/
│   └── validation/
├── security/          # Threat model, security tests, audit controls
├── database/          # PostgreSQL schema, migrations
├── docs/              # Architecture, API, AI, security, ops, team, demo
│   ├── architecture/
│   ├── api/
│   ├── database/
│   ├── ai/
│   ├── security/
│   ├── election-data/
│   ├── operations/
│   ├── team/
│   └── demo/
├── tests/             # Unit, integration, E2E, security
├── scripts/           # Seed, migration, deploy, data pipeline, ops
├── .github/           # CI/CD workflows, PR templates, CODEOWNERS
├── APPLICATION.md
├── CONTRIBUTING.md
└── README.md
```

---

## Branch Naming Conventions

All work happens on feature branches off `develop`. No direct pushes to `main` or `develop`.

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

### Branch name format

```
feature/{area}-{short-description}
fix/{area}-{short-description}
hotfix/{area}-{short-description}
docs/{area}-{short-description}
test/{area}-{short-description}
```

### Area prefixes

| Prefix | Used by |
|---|---|
| `backend` | Member 2 |
| `frontend` | Member 3 |
| `ai` | Member 4 |
| `data` | Member 5 |
| `security` | Member 6 |
| `devops` | Oluwadare |
| `docs` | Any member |
| `test` | Any member |

### Examples

```bash
feature/backend-result-submission-api
feature/frontend-agent-portal-offline-queue
feature/ai-statistical-anomaly-engine
feature/data-polling-unit-normalisation
feature/security-evidence-upload-pipeline
feature/devops-github-actions-ci
fix/backend-auth-token-refresh
hotfix/frontend-gps-picker-crash
docs/architecture-api-contracts
test/integration-result-api
```

### Creating a branch

```bash
# Always branch from develop, never from main
git checkout develop
git pull origin develop
git checkout -b feature/backend-result-submission-api
```

---

## Commit Message Format

Follow the Conventional Commits standard. Every commit message must have a type, an optional scope, and a short description.

```
<type>(<scope>): <short description>

[optional body — explain WHY, not WHAT]

[optional footer — breaking changes, issue refs]
```

### Types

| Type | When to use |
|---|---|
| `feat` | New feature or capability |
| `fix` | Bug fix |
| `docs` | Documentation only |
| `style` | Formatting, no logic change |
| `refactor` | Code restructure, no feature or fix |
| `test` | Adding or updating tests |
| `chore` | Build, deps, config, scripts |
| `security` | Security fix or hardening |
| `perf` | Performance improvement |
| `ci` | CI/CD workflow changes |

### Scopes

Use the area prefix as scope: `backend`, `frontend`, `ai`, `data`, `security`, `devops`, `db`, `auth`, `evidence`, `anomaly`, `gateway`, `ux`, `api`.

### Examples

```
feat(backend): implement result submission endpoint with server-side validation
fix(frontend): resolve GPS picker crash on low-memory Android devices
docs(api): add result submission request/response schema
security(evidence): add SHA-256 hash verification on evidence upload
test(integration): add agent login and result submission E2E test
feat(ai): implement statistical anomaly detection — margin and round-number rules
chore(devops): add GitHub Actions workflow for lint and unit tests on PR
refactor(db): normalise polling unit table — add stable code index
```

### Rules

- Subject line max 72 characters
- Use present tense: "add feature" not "added feature"
- No period at end of subject line
- Body explains why, not what — the diff already shows what
- Reference issues in footer: `Closes #12`, `Refs #7`
- Breaking changes in footer: `BREAKING CHANGE: result schema updated`

---

## Pull Request Process

### Before opening a PR

```bash
# 1. Make sure your branch is up to date with develop
git checkout develop
git pull origin develop
git checkout feature/your-branch
git rebase develop

# 2. Run tests for your area
# Backend
cd backend && npm test

# Frontend
cd frontend && npm test

# AI
cd ai && python -m pytest

# 3. Run linting
npm run lint        # JS/TS areas
flake8 .            # Python areas

# 4. Push
git push origin feature/your-branch
```

### PR checklist

Every PR must satisfy these before requesting review:

- [ ] Branch is rebased on latest `develop`
- [ ] All existing tests pass
- [ ] New tests written for new functionality
- [ ] Linting passes with zero errors
- [ ] No secrets, tokens, API keys, or credentials in any file
- [ ] No direct database credentials in application code
- [ ] `console.log` / `print` debug statements removed
- [ ] Documentation updated if API, schema, or behaviour changed
- [ ] PR description explains what changed and why
- [ ] Area owner is assigned as reviewer

### PR title format

Same as commit message format:

```
feat(backend): implement result submission API
fix(frontend): resolve offline queue sync failure
security(evidence): add malware scan to upload pipeline
```

### PR description template

```markdown
## What
Brief description of what this PR changes.

## Why
Why this change is needed — problem being solved or feature being added.

## How
Key implementation decisions made and why.

## Testing
How you tested this. What tests were added.

## Checklist
- [ ] Tests pass
- [ ] Linting clean
- [ ] No secrets committed
- [ ] Docs updated
- [ ] Area owner assigned as reviewer
```

---

## Code Review Rules

- The area owner listed in the ownership matrix must approve before merge
- Oluwadare must approve any PR touching root config, CI/CD, or cross-service integration
- Member 6 must approve any PR touching authentication, evidence handling, or AI gateway security
- Reviewers should respond within 48 hours
- Authors should address review comments within 48 hours
- A PR with unresolved blocking comments cannot be merged
- Approvals are invalidated by any subsequent commit to the PR branch — re-request review after changes

---

## Testing Requirements

### What each member is responsible for

| Member | Must write |
|---|---|
| Oluwadare | CI/CD pipeline tests, smoke tests, integration test infrastructure |
| Member 2 | Unit tests for all backend services, API integration tests |
| Member 3 | Component tests, frontend integration tests, accessibility checks |
| Member 4 | Unit tests for anomaly rules, AI output schema validation tests, provider mock tests |
| Member 5 | Data pipeline tests, geographic validation tests, dataset integrity checks |
| Member 6 | Security tests — injection, auth bypass, file-upload abuse, rate-limit bypass |

### Test coverage minimum

- Backend services: 80% line coverage
- Anomaly engine rules: 100% — every rule must have a passing and a failing case
- Authentication flows: 100%
- Evidence upload pipeline: 100%

### Test categories

**Unit** — validate, authenticate, calculate votes, hash, anomaly rules, data parsing, AI schema validation  
**Integration** — Agent → API, API → database, result → validation, result → AI, evidence → storage, AI gateway → provider abstraction  
**End-to-end** — registration → login → polling unit → GPS → result → EC8A → analysis → submission → receipt → Situation Room → public verification  
**Security** — SQL injection, XSS, CSRF, authentication bypass, privilege escalation, file-upload abuse, rate-limit bypass, session attacks, API abuse, prompt injection

---

## Environment Setup

### Prerequisites

```bash
# Node.js 20+
node --version

# Python 3.11+
python3 --version

# PostgreSQL 15+
psql --version

# Git
git --version
```

### Clone and install

```bash
git clone https://github.com/baalebos-cloud/niceres.git
cd niceres

# Backend
cd backend && npm install

# Frontend
cd ../frontend && npm install

# AI (Python)
cd ../ai && pip install -r requirements.txt

# Copy environment template
cp .env.example .env
# Fill in your local values — never commit .env
```

### Environment variables

Never commit `.env` files or any file containing secrets. Use `.env.example` with placeholder values as the template. All secrets in production are managed through environment variables injected at deploy time — never hardcoded.

```bash
# .env.example — safe to commit, no real values
DATABASE_URL=postgresql://user:password@localhost:5432/niceres
JWT_SECRET=replace-with-strong-secret
EVIDENCE_STORAGE_BUCKET=replace-with-bucket-name
AI_GATEWAY_URL=replace-with-gateway-url
```

### Running locally

```bash
# Database
psql -f database/schema.sql

# Backend
cd backend && npm run dev

# Frontend
cd frontend && npm run dev

# AI service
cd ai && python -m uvicorn main:app --reload
```

---

## Security Rules

These are non-negotiable for every member on every PR:

1. **Never commit secrets.** No API keys, tokens, passwords, database URLs with credentials, or private keys in any file — including test files, scripts, and documentation.

2. **No client-side trust for election-integrity decisions.** Validation, hashing, and fraud-signal logic must run server-side. The browser is untrusted.

3. **SHA-256 minimum for all integrity hashing.** The v1 FNV-1a client-side hash is a proof-of-concept demonstration. Production code must use SHA-256 or stronger, server-side.

4. **Evidence files must be scanned.** Every upload goes through MIME validation → size check → malware scan → hash → encrypted storage → audit event. No exceptions.

5. **AI outputs must not declare fraud.** Language like "fraud detected" or "result invalid" is not permitted in AI outputs. Use "requires human review" and "anomaly flagged for investigation".

6. **GPS is supporting context, not proof.** Record coordinates, accuracy, and distance to registered unit. Flag suspicious distance as a review signal. Never use GPS alone to reject a submission.

7. **Provider API keys stay server-side.** LLM provider credentials must never appear in frontend code, client-side scripts, or repository files.

8. **Prompt injection is a threat.** AI inputs derived from user-submitted data (vote counts, remarks, evidence text) must be structured and sanitised before being passed to LLM providers.

If you find a security issue in another member's PR, mark the comment as blocking and tag Member 6 and Oluwadare immediately.

---

## Definition of Done

A feature is done when all of the following are true:

- [ ] Code complete and passing in `develop`
- [ ] Unit tests written and passing
- [ ] Integration tests written and passing (where applicable)
- [ ] Security review passed (Member 6 signed off if touching auth, evidence, or AI gateway)
- [ ] Linting clean
- [ ] No secrets committed
- [ ] API documentation updated if endpoints changed
- [ ] Database migration script included if schema changed
- [ ] README or docs updated if behaviour changed
- [ ] Deployed to staging environment
- [ ] Smoke tests passing on staging
- [ ] Area owner approved the PR
- [ ] Oluwadare approved for cross-service or architecture changes
- [ ] Merged to `develop` by PR author after all approvals

---

## Questions

Raise questions in the team channel or open a GitHub Discussion. Tag the area owner for anything specific to their domain.

For security concerns, contact Member 6 and Oluwadare directly — do not open a public issue.

---

*NICERES — Baalebos Cloud · AI and Democracy Forum Sandbox 2026*
