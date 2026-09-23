# NICERES — Nigeria Election Results Integrity System
## AI and Democracy Forum — AI in Elections Sandbox Submission

**Applicant:** Oluwadare Jayeola  
**Organisation:** Baalebos Cloud / Independent Builder  
**Email:** jayeolaoluwadamilare@gmail.com  
**Phone:** +2347067158165  
**GitHub:** github.com/baalebos-cloud  
**Submission Date:** September 2026  
**Focus Areas:** 03 — Election Observation & Data Tools · 04 — Transparency & Trust Tech

---

## Executive Summary

NICERES (Nigeria Election Results Integrity System) is a working, deployable proof-of-concept for tamper-evident, AI-assisted election result transmission at the polling unit level. It addresses the single most critical failure point in Nigerian elections: the gap between what happens at the polling unit and what is reported at the collation centre.

The system enables accredited party agents to transmit cryptographically sealed results, with GPS verification and photo evidence, directly from 176,846 polling units across all 36 states and FCT — in real time, with an AI anomaly detection engine flagging statistical irregularities before any result is accepted.

---

## The Problem

In the 2023 Nigerian general election, INEC's own IReV (Results Viewing) portal — designed to upload polling unit results in real time — failed to function as promised. Results were uploaded late, inconsistently, or not at all. The collation process remained opaque. Public trust collapsed.

The core issue is structural: Nigeria has no working system that:
1. Verifies that a human agent physically at a polling unit submitted the result
2. Cryptographically proves the result has not been altered in transit
3. Automatically flags statistically implausible results before they enter the tally
4. Gives every citizen a way to verify their own polling unit's result

NICERES solves all four.

---

## How It Works

### Agent Registration
Party agents register through a 5-step wizard. Each agent receives a unique National Agent ID in the format `NG-{PARTY}-{STATE}-{LGA}-{XXXX}`. Registration captures biometric photos, ID documents, and device fingerprint.

### GPS-Verified Result Submission
At the polling unit, the agent opens the portal, selects their polling unit from 176,846 INEC-registered units, and picks their GPS location on the map. The system validates that the GPS coordinates are consistent with the unit's registered location. Without GPS verification, results cannot be submitted.

### EC8A Photo Evidence
The agent photographs the signed EC8A result sheet (the official INEC paper tally) and uploads it. The image is stored alongside the digital result submission as legal evidence.

### AI Anomaly Detection Engine
Before any result is accepted, the system runs four automated checks:
- **Margin anomaly:** Winner taking >95% of votes — statistically rare in competitive Nigerian elections
- **Round number inflation:** Multiple parties with suspiciously round vote counts (100, 200, 300) — a known manipulation signature
- **Capacity breach:** Total votes exceeding the typical maximum accreditation for that unit type
- **Opposition suppression:** Zero votes for multiple major parties — physically implausible

If flags are raised, the agent is shown the specific anomalies and must confirm before the system accepts the submission. All flags are logged to the tamper-evident audit trail.

### Cryptographic Integrity
Every submission is sealed with an FNV-1a hash chain. The hash covers the vote counts, the agent ID, the polling unit code, and the GPS coordinates. Any post-submission alteration to any field would produce a different hash, immediately detectable. The chain links each entry to the previous one, making selective alteration computationally infeasible.

### National Situation Room
The dashboard aggregates results across all 37 jurisdictions in real time, with a national Leaflet.js map showing reporting status per state, party totals with live bar charts, and a feed of submission activity. Each state's progress is tracked as a percentage of its total polling units.

### Security Operations Centre
A dedicated SOC screen provides full audit log visibility, blocked session tracking, brute-force detection with automatic account lockout, CAPTCHA enforcement after 3 failed attempts, and real-time threat gauges.

---

## AI Component

The AI layer in NICERES is a **statistical anomaly engine** that applies forensic election analysis techniques in real time, at the point of data entry, rather than after the fact.

**Why this matters:** Traditional election monitoring detects fraud weeks later, during legal challenges. NICERES flags it at the moment of submission, while the paper EC8A sheet is still in the agent's hand and can be re-verified immediately. Early detection enables real-time intervention, not retrospective litigation.

The engine is designed to be transparent and auditable — every flag includes a plain-English explanation, is logged with a timestamp, and is shown to the submitting agent. There is no black box. The agent retains the right to override a flag and submit, but the override itself is logged.

**Planned expansion of the AI layer:**
- Cross-unit comparison: compare a unit's results against historical patterns for that ward
- Network analysis: detect coordinated same-pattern submissions from geographically clustered units
- Natural language incident reporting: agents describe incidents in Hausa, Yoruba, Igbo or English; the system extracts structured data
- Deepfake detection on EC8A photo evidence using image forensics

---

## Technical Stack

| Layer | Technology |
|---|---|
| Frontend | HTML5, pure ES5 JavaScript, CSS3 |
| Maps | Leaflet.js with OpenStreetMap |
| Data | 8,356 sample units (5 states); full 176,846 from INEC directory |
| Security | FNV-1a hash chaining, brute-force lockout, CAPTCHA, rate limiting |
| AI | Statistical anomaly detection engine (client-side, zero latency) |
| Deployment | Static files — deployable to any server, CDN, or offline |

The system runs entirely in the browser with no backend dependency. This is deliberate: in Nigerian election conditions, connectivity is intermittent. A system that requires a live API cannot be trusted at a polling unit in a rural LGA. Results are queued locally and transmitted when connectivity is available.

---

## Proof of Concept Status

The submitted package includes:

- **5 fully functional HTML pages:** Situation Room, Agent Portal, Live Results, Security Operations Centre, Agent Registration
- **AI anomaly detection engine** running live on every submission
- **8,356 real polling units** across Abia, Ekiti, Lagos, Kano, and Rivers states
- **Full 2,195 Ekiti State polling units** extracted from official INEC PDF directory (real ward names, unit names, LGA codes)
- **4 demo agent credentials** for immediate testing
- **Complete security system:** brute-force lockout, math CAPTCHA, session tokens, hash-chained audit log
- **GPS map picker** with fallback to manual coordinate entry

**Demo credentials:**

| Agent ID | PIN | State |
|---|---|---|
| NG-APC-EK-AD-0001 | secure1 | Ekiti |
| NG-PDP-LA-IK-0001 | pass123 | Lagos |
| NG-LP-AB-AI-0001 | labour7 | Abia |
| NG-NNPP-KN-DC-0001 | nnpp24 | Kano |

---

## Alignment with Sandbox Focus Areas

**Focus Area 03 — Election Observation & Data Tools**  
NICERES is a direct implementation of real-time election observation infrastructure. Every polling unit result is independently verifiable through the cryptographic hash, the GPS record, and the EC8A photo evidence. The national dashboard gives observers, journalists, and civil society organisations a live view of the count as it happens.

**Focus Area 04 — Transparency & Trust Tech**  
The hash-chained audit log means that any tampering with any submitted result is mathematically detectable. The AI anomaly flags are shown publicly on the results screen — voters and observers can see which units raised flags and why. The system is designed so that trust does not depend on trusting any individual actor.

---

## Roadmap

**Immediate (sandbox phase):**
- Full 176,846 polling unit dataset from INEC directory
- Public result verification page (citizen enters PU code, sees result + hash)
- QR code on each agent ID tag for instant field verification

**Short term (3-6 months):**
- Multilingual interface (Hausa, Yoruba, Igbo, English)
- Offline-first mode with background sync
- Deepfake/manipulation detection on EC8A photo uploads
- API for civil society organisations to pull verified result data

**Long term:**
- Integration with INEC's official IReV portal via API
- Cross-election learning: AI model trained on historical Nigerian result patterns
- Citizen verification mobile app

---

## Why This Builder

Oluwadare Jayeola is a DevOps and Cloud Engineer based in Lagos and Ado-Ekiti, Nigeria, with hands-on experience at the Ekiti MSME ICT Hub. NICERES was built from scratch using the official INEC polling unit directory for Ekiti State as the data source — not a simulation of Nigerian election infrastructure, but a system built on its actual data.

Nigeria is home. The 2023 election was watched from here. The failure of IReV was not an abstraction. This system exists because it should have existed before that election.

---

*Submission for the AI and Democracy Forum — AI in Elections Sandbox*  
*Deadline: 24th September 2026*  
*Apply: https://aianddemocracyforum.org/sandbox*
