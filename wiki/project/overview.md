---
title: BATC System Overview
domain: project
type: overview
tags: [batc, django, react, distribution, agriculture, bauang, la-union]
updated: 2026-05-12
---

# BATC System Overview

**Bauang Agricultural Trade Center (BATC)** — Centralized Distribution and Allocation Management System for Bauang, La Union, Philippines. Digitizes the workflow for distributing agricultural interventions (seeds, fertilizers, inputs) to registered farmers across Bauang's 39 barangays.

## System Purpose

BATC solves a critical rural logistics problem: **connecting farmer applications for agricultural inputs to inventory management and distribution**.

**Before BATC:** Farmers didn't know what programs existed. Programs couldn't efficiently track who applied or verify eligibility. Inventory was manually tracked on paper. Distribution was ad-hoc and not auditable.

**After BATC:**
- Farmers self-register once; apply to programs online
- Staff manages applications with a consistent workflow
- Inventory tracks lot numbers, expiry dates (FEFO allocation)
- Every transaction is logged; audit trail is complete
- Reports show what happened (who received what, when, why)

## Stack & Architecture

| Layer | Technology | Purpose |
|---|---|---|
| **Frontend** | React + Vite + TypeScript | Fast UI iteration; TanStack Query (server state) + Zustand (auth) |
| **Backend** | Django REST Framework | Mature ORM, atomic transactions, admin interface for ops |
| **Database** | SQLite (prototype) | Single-file; no DevOps needed; scales to ~100 concurrent users |
| **Auth** | SimpleJWT | 15min access tokens + 7day refresh (rotation + blacklist) |
| **Validation** | React Hook Form + Zod (frontend), DRF Serializers (backend) | Type-safe forms; prevent garbage data early |
| **Styling** | Tailwind CSS + Lucide icons | Consistent design system; BATC brand colors embedded |

**Design System:** See [[design-system.md]] for color tokens, status pills, layout specs, component design.

## Roles & Permissions

| Role | Access | Permissions |
|---|---|---|
| **ADMIN** | Full | User CRUD, Program CRUD, Inventory manage (receive/adjust), Archive, Reset passwords, View all reports |
| **STAFF** | Operational | Register farmers, Review applications (approve/reject), Allocate distributions, Mark delivered, View staff-filtered reports |
| **CLIENT** (Farmer) | Personal | Apply to programs, View own application status, View own active claims, Submit feedback, Manage own profile |

**Decision record:** [[2026-05-12-rbac.md]] — Why three roles are sufficient.

## Core Workflows

### 1. Farmer Registration (Staff-led, Client-initiated)
**Actor:** Staff or Client  
**Flow:** 3-step form → Personal info → Address (barangay) → Farm details + DPA consent  
**Output:** Farmer profile created; eligible for programs based on criteria

### 2. Program Definition (Admin-led)
**Actor:** Admin  
**Flow:** Create Program → Add items + quantities → Define barangays → Set eligibility criteria  
**Example:** "Rice seeds for farmers with ≥0.5ha farm area in barangays 1–10"  
**Output:** Program is ACTIVE and accepting applications

### 3. Farmer Application (Client-initiated)
**Actor:** Farmer  
**Flow:** Browse available programs → View eligibility criteria → Apply → Receive confirmation  
**Output:** Application in SUBMITTED state; Staff notified to review

### 4. Application Review (Staff-led)
**Actor:** Staff  
**Flow:** View pending applications → Verify eligibility → Approve or Reject → Farmer notified  
**Output:** Application moves to APPROVED or REJECTED state

### 5. Distribution (Staff-led, FEFO-driven)
**Actor:** Staff  
**Flow:** Create distribution for approved application → System allocates FEFO batches → Schedule → Dispatch → Deliver → Inventory decremented  
**Key:** [[2026-05-12-fefo-batches.md]] — Automatic earliest-expiry-first batch selection  
**Atomicity:** [[2026-05-12-atomic-distribution.md]] — All steps succeed or rollback together  
**Output:** Farmer receives goods; stock count updated; audit trail complete

## Build Status

**Phases 0–6 complete.** System is a **working prototype** (all core workflows functional).

| Phase | Focus | Status |
|---|---|---|
| 0 | Foundation — scaffolding, auth, layouts | ✅ Complete |
| 1 | User management — CRUD, permissions | ✅ Complete |
| 2 | Farmer registration — 3-step wizard, DPA consent | ✅ Complete |
| 3 | Programs + Inventory — eligibility engine, FEFO batches | ✅ Complete |
| 4 | Applications + Distribution — full lifecycle, atomic delivery | ✅ Complete |
| 5 | Announcements, Feedback, Reports — CSV exports | ✅ Complete |
| 6 | Dashboards + Seed data — demo data, real-count dashboards | ✅ Complete |

**Detailed progress:** See [[build-progress-phases-0-6.md]]

## Prototype Scope

**What's included:**
- ✅ 3-step farmer registration with DPA consent
- ✅ Eligibility criteria engine (ad-hoc rule builder)
- ✅ FEFO inventory allocation (deterministic, auditable)
- ✅ Atomic distribution delivery (prevents race conditions)
- ✅ Role-based access control (ADMIN/STAFF/CLIENT)
- ✅ Complete audit trail (ActionLog + StockMovement)
- ✅ CSV exports for reports

**What's deliberately excluded:**
- ❌ No Celery/Redis (async tasks are sync)
- ❌ No PostgreSQL (SQLite only; upgrade path exists)
- ❌ No internationalization (English only)
- ❌ No PWA/offline (internet required)
- ❌ No real-time subscriptions (polling only)
- ❌ No tests (functional validation only)

See [[prototype-scope.md]] for full decision matrix and rationale.

## Demo Credentials

| Role | Username | Password | Use Case |
|---|---|---|---|
| ADMIN | admin | admin1234 | System setup, inventory, reports |
| STAFF | staff01 | staff1234 | Farmer registration, application review |
| CLIENT | farmer01 | farmer1234 | Apply to programs, view claims |

**Demo data:** Run `python manage.py seed_demo` to populate 10 farmers + 5 programs + inventory.

## Architecture Highlights

### Authentication: JWT with 15-Minute Access Tokens
[[2026-05-12-authentication-jwt-15min.md]] — Access tokens expire in 15 minutes; refresh tokens (7 days) rotate on each use; logout immediately blacklists refresh token.

### Inventory: FEFO Batch Selection
[[2026-05-12-fefo-batches.md]] — When allocating to a distribution, automatically select the earliest-expiring batch first. No manual staff selection; deterministic and auditable.

### Distribution: Atomic Delivery
[[2026-05-12-atomic-distribution.md]] — When distribution is marked DELIVERED, atomically allocate stock + decrement inventory + log movement + mark application fulfilled. All-or-nothing transaction; prevents race conditions.

### Technology Stack Decision
[[2026-05-12-stack-choice.md]] — Why React + Vite, Django, and SQLite. Includes options considered and future migration paths.

## Data Model (High-Level)

```
User (ADMIN/STAFF/CLIENT role) ←→ Farmer (profile + farm details + barangay)
Program (name, dates, items, target_barangays)
  ├── ProgramItem (links to InventoryItem)
  └── EligibilityCriterion (rule: field op value)
InventoryItem (name, unit, low-stock threshold)
  └── StockBatch (lot, qty, expiry_date, received_date)
      └── StockMovement (audit ledger: RECEIVE/ADJUST/RELEASE + qty + reason)
InterventionApplication (farmer + program, status: SUBMITTED→FULFILLED)
  ├── Distribution (item + qty + batch allocations, status: DRAFT→DELIVERED)
  └── ActionLog (user + action + old/new values + timestamp)
Announcement (title, content, target_roles)
Feedback (user, rating, comment)
```

## Deployment & Running

### Development
```bash
# Backend
cd batc-backend
python -m venv venv
source venv/bin/activate  # (or venv\Scripts\activate on Windows)
pip install -r requirements/local.txt
python manage.py migrate
python manage.py seed_demo
python manage.py runserver

# Frontend
cd batc-frontend
npm install
npm run dev  # Vite dev server on http://localhost:5173
```

### Demo Reset
```bash
# Clean demo
rm db.sqlite3
python manage.py migrate
python manage.py seed_demo
```

---

**Last updated:** 2026-05-12  
**Related:** [[design-system.md]] · [[prototype-scope.md]] · [[build-progress-phases-0-6.md]] · [[2026-05-12-stack-choice.md]]

## Key Architectural Decisions

Full records in `project/decisions/`. Summary of non-negotiable rules:

| Concern | Decision | Why |
|---|---|---|
| Stock quantity | Only via `StockMovement` + `F()` update — never direct field assignment | Prevents race conditions, maintains full audit ledger |
| Approval flow | All steps wrapped in `transaction.atomic()` | All-or-nothing — no partial approval state |
| FEFO batch selection | Order by `expiry_date ASC` then `received_date ASC` | Reduces spoilage; core business requirement |
| Status transitions | Dedicated service method + `ActionLog` entry every time | Enforces state machine, full audit trail |
| Eligibility criteria | Separate `EligibilityCriterion` rows per criterion | Enables per-criterion querying and UI rendering |
| DPA consent | Required checkbox, not pre-checked, timestamp auto-set | Legal compliance (Data Privacy Act) |
| SQLite | Prototype only — no PostgreSQL, Celery, or Redis | Speed of development; swap at production stage |

## Project Structure

```
batc/
├── batc-backend/
│   ├── config/settings/   (base · local · production)
│   └── apps/              (core, accounts, farmers, programs, inventory,
│                           applications, distribution, announcements,
│                           feedback, reports, audit)
└── batc-frontend/
    └── src/
        ├── features/      (domain modules)
        ├── pages/         (admin/ · staff/ · client/ · public/)
        ├── layouts/       (AdminLayout, StaffLayout, ClientLayout)
        ├── components/    (shared UI)
        ├── services/api/  (axios client + per-domain api files)
        └── stores/        (authStore — Zustand)
```

## Related Wiki Pages

- [[research/concepts/rsbsa]] — farmer identification system underpinning registration
- [[research/concepts/fefo]] — inventory rotation method used in batch selection
- [[research/concepts/dpa]] — Data Privacy Act requirements driving consent flow
- [[research/concepts/4ps-program]] — poverty targeting program used in eligibility criteria

*These concept pages will be created on first research ingest.*
