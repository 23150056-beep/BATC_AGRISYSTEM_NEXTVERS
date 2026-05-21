# Wiki Index

*Pages: 16 | Decisions: 5 | References: 6 | Last updated: 2026-05-12*

---

## Project — Overview & Reference

| Page | Summary | Updated |
|---|---|---|
| [[project/overview]] | BATC system: purpose, stack, roles, workflows, build status, demo credentials | 2026-05-12 |
| [[project/design-system]] | Color tokens, status pills, layout specs (Admin/Staff/Client), component design | 2026-05-12 |
| [[project/prototype-scope]] | Feature decision matrix: what's in, what's out, performance targets, future roadmap | 2026-05-12 |
| [[project/build-progress-phases-0-6]] | Build history: Phase 0–6 detailed breakdown, current system capabilities, gaps | 2026-05-12 |
| [[project/entity-relationship-diagram]] | Complete ERD: 20+ entities, relationships, constraints, cardinality, critical fixes needed | 2026-05-12 |
| [[project/architecture-rules]] | Non-negotiable patterns: database, permissions, inventory, state machines, API design | 2026-05-12 |
| [[project/known-bugs-and-issues]] | Critical (10), Major (10), and Minor (2) issues with severity, impact, and fixes | 2026-05-12 |
| [[project/prototype-gaps]] | UX/demo credibility gaps, incomplete flows, "feels real" improvements, Phase 7–10 roadmap | 2026-05-12 |
| [[project/getting-started]] | Developer setup guide: backend/frontend installation, demo walkthrough, troubleshooting | 2026-05-12 |
| [[project/management-commands]] | Django CLI commands: seed_demo, migrate, createsuperuser, shell, custom commands | 2026-05-12 |

## Project — Decisions

| Page | Summary | Decision | Updated |
|---|---|---|---|
| [[project/decisions/2026-05-12-stack-choice]] | React + Vite, Django REST Framework, SQLite | Tech stack for prototype | 2026-05-12 |
| [[project/decisions/2026-05-12-authentication-jwt-15min]] | SimpleJWT with 15min access + 7day refresh + rotation + blacklist | Auth mechanism | 2026-05-12 |
| [[project/decisions/2026-05-12-rbac]] | Three-role RBAC (ADMIN/STAFF/CLIENT) with @permission_classes decorators | Access control | 2026-05-12 |
| [[project/decisions/2026-05-12-atomic-distribution]] | Atomic transaction: allocate FEFO + decrement inventory + log + fulfill application | Distribution lifecycle | 2026-05-12 |
| [[project/decisions/2026-05-12-fefo-batches]] | Automatic earliest-expiry-first batch selection (no manual override) | Inventory allocation | 2026-05-12 |

## Project — Sessions

| Page | Summary | What Was Built | Updated |
|---|---|---|---|
| *(Phase 0–6 documented in build-progress)* | | | |

## Research — Overview

| Page | Summary | Updated |
|---|---|---|
| [[research/overview]] | Philippine agriculture domain synthesis (stub — grows with each ingest) | 2026-05-09 |

## Research — Entities

*No entity pages yet. Created automatically during research source ingest.*

## Research — Concepts

*No concept pages yet. Created automatically during research source ingest.*

## Sources

*No sources ingested yet. Add by saying: "ingest raw/<filename>"*
