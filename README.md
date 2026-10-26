# Trace — Field Reporting and Visual Verification Platform

A mobile-first construction progress reporting platform for residential sites in Kigali, Rwanda. Site workers submit structured photo reports from the field; a MobileNetV2 CNN classifier automatically verifies whether the reported construction stage matches the photographic evidence. Project managers review flagged discrepancies in real time.

**Supervisor:** Kevin Sebineza  
**Author:** Edwin Bayingana (e.bayingana@alustudent.com)  
**Institution:** African Leadership University, B.Sc. Software Engineering

---

## Walkthrough Video

[Watch the demo walkthrough](https://youtu.be/yyJdATKrcJA)

---

## Problem

Construction project managers in Kigali oversee multiple residential sites simultaneously and rely on WhatsApp photo messages for daily progress updates. These records cannot be verified, linked to project milestones, or audited retroactively. A 28% cost overrun on a Gasabo District project was attributed in part to undetected reporting discrepancies (Umurangamirwa & Bazimya, 2025).

## Solution

Trace replaces WhatsApp-based reporting with a structured mobile platform that:

- Enforces required fields (construction stage, photo, GPS location, materials, date) before submission
- Automatically classifies the submitted photo using a CNN and flags stage mismatches for manager review
- Creates a searchable, timestamped audit trail linked to each site and worker
- Runs on mid-range Android and iOS devices with no per-user subscription cost

---

## Live Deployments

| Service                      | URL                                       |
| ---------------------------- | ----------------------------------------- |
| REST API (Node.js + Express) | https://sitelog-backend-fkqs.onrender.com |
| ML Inference Server (Flask)  | https://sitelog-ml.onrender.com           |
| Manager Dashboard (Next.js)  | Deployed on Vercel                        |

---

## Tech Stack

| Layer            | Technology                                 |
| ---------------- | ------------------------------------------ |
| Mobile app       | React Native, Expo, TypeScript             |
| Navigation       | Expo Router with typed stacks              |
| State management | React Context (useReports hook)            |
| REST backend     | Node.js, Express, sql.js (SQLite WASM)     |
| ML inference     | Python, Flask, TensorFlow-CPU, MobileNetV2 |
| Web dashboard    | Next.js 14 App Router                      |
| Hosting          | Render.com (API + ML), Vercel (dashboard)  |

---

## User Roles

| Role            | Capabilities                                                                 |
| --------------- | ---------------------------------------------------------------------------- |
| Site Worker     | Submit reports with photo, view own submissions, switch active site          |
| Project Manager | Review all site reports, approve/reject flagged items, receive notifications |
| Site Owner      | View analytics and report summaries across all owned sites                   |

---

## Installation

### Prerequisites

- Node.js 18+
- Expo CLI (`npm install -g expo`)
- Android/iOS device or emulator

### Run locally

```bash
git clone https://github.com/BayinganaEdwin/trace-field-reporting.git
cd trace-field-reporting
npm install
npx expo start
```

### Switch between local and production API

Open `src/services/config.ts` and change the single ENV line:

```ts
// 'local'      → http://localhost:3000
// 'production' → https://sitelog-backend-fkqs.onrender.com
const ENV: 'local' | 'production' = 'production';
```

### Demo accounts (production)

| Role    | Email              | Password |
| ------- | ------------------ | -------- |
| Worker  | worker@trace.demo  | demo1234 |
| Manager | manager@trace.demo | demo1234 |
| Owner   | owner@trace.demo   | demo1234 |

---

## Project Structure

```
trace-field-reporting/
├── src/
│   ├── navigation/          # Typed stacks: Worker, Manager, Owner
│   ├── screens/             # One screen per feature (submit, review, analytics...)
│   ├── components/          # Reusable UI (SitePickerBanner, ReportCard, ...)
│   ├── hooks/               # useReports context hook
│   └── services/            # config.ts, api helpers
├── assets/
└── app.json
```

---

## Related Repositories

| Repository                                                               | Description                            |
| ------------------------------------------------------------------------ | -------------------------------------- |
| [trace-field-reporting-be](https://github.com/BayinganaEdwin/trace-field-reporting-be)             | Express REST API + SQLite              |
| [trace-field-reporting-dashboard](https://github.com/BayinganaEdwin/trace-field-reporting-dashboard) | Next.js manager dashboard              |
| [trace-ml-server](https://github.com/BayinganaEdwin/trace-ml-server)                               | Flask ML server + MobileNetV2 training |

---

## Technical Requirements

- **Minimum Android version:** Android 8.0 (API 26)
- **Minimum iOS version:** iOS 13
- **Camera permission:** Required for photo capture
- **Location permission:** Required for GPS tagging of reports
- **Internet connection:** Required for report submission and manager review; offline capture planned for Phase 4

---

## Research Context

This platform is the prototype component of a mixed-methods capstone research project investigating the construction progress verification gap in Gasabo District, Kigali. The research uses a six-variable Reporting Evaluation Index (REI) to compare WhatsApp-based reporting (baseline REI ~26/100) against the proposed platform (target REI >95/100).

Full proposal: _A Field-Reporting and Visual Verification Platform for Local Construction Management in Kigali, Rwanda_ — Edwin Bayingana, September 2026.
