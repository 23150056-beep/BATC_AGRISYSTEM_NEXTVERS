---
title: BATC System Overview
domain: project
type: overview
tags: [batc, django, react, distribution, agriculture, bauang, la-union]
updated: 2026-05-09
---

# BATC System Overview

Bauang Agricultural Trade Center (BATC) — Centralized Distribution and Allocation Management System for Bauang, La Union, Philippines. Digitizes the workflow for distributing agricultural interventions (seeds, fertilizers, inputs) to registered farmers across Bauang's 39 barangays.

## Stack

| Layer | Technology |
|---|---|
| Frontend | React + Vite (TypeScript), TanStack Query, Zustand, React Hook Form + Zod, Tailwind CSS, Lucide, Sonner |
| Backend | Django REST Framework, SimpleJWT (15 min access / 7 day refresh with rotation + blacklist), drf-spectacular |
| Database | SQLite (prototype — no PostgreSQL) |
| State | Zustand (auth), TanStack Query (server state), React Hook Form + Zod (forms) |

## Roles

| Role | Key Responsibilities |
|---|---|
| ADMIN | User management, program definition, inventory receive/adjust, reports, announcements |
| STAFF | Farmer registration, application review, distribution management |
| CLIENT (Farmer) | Apply to programs, view claim status, submit feedback |

## Build Status (2026-05-09)

Phases 0–6 complete. System is a working prototype.

| Phase | Description | Status |
|---|---|---|
| 0 | Foundation — Django + React scaffolded, JWT auth, 3 layouts | ✅ Done |
| 1 | User management — CRUD, role-based access | ✅ Done |
| 2 | Farmer registration — 3-step wizard, 39 barangays, DPA consent | ✅ Done |
| 3 | Programs + Inventory — eligibility criteria engine, FEFO batch selection | ✅ Done |
| 4 | Applications + Distribution — full lifecycle apply→approve→distribute→deliver→stock decremented | ✅ Done |
| 5 | Announcements, Feedback, Reports — role-targeted, CSV exports | ✅ Done |
| 6 | Dashboards + Seed data — real-count dashboards, `seed_demo` command | ✅ Done |

## Demo Credentials

| Role | Username | Password |
|---|---|---|
| ADMIN | admin | admin1234 |
| STAFF | staff01 | staff1234 |
| CLIENT | farmer01 | farmer1234 |

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
