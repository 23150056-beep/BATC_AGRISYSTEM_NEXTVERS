---
title: Stack & Technology Choices
domain: project
type: decision
tags: [stack, frontend, backend, database, django, react, vite, sqlite]
updated: 2026-05-12
---

# Stack & Technology Choices

## Decision
Use **React + Vite** (frontend), **Django REST Framework** (backend), and **SQLite** (database) for the BATC prototype.

## Context
The BATC system needs rapid iteration on a distributed agriculture management workflow. The architecture must support:
- Three distinct user roles with different data access patterns (ADMIN, STAFF, CLIENT/Farmer)
- Real-time inventory and application state tracking
- Form-heavy registration and application workflows
- Role-based access control across all endpoints

## Options Considered

| Option | Frontend | Backend | Database | Decision |
|---|---|---|---|---|
| A (chosen) | React + Vite | Django REST Framework | SQLite | ✅ Selected |
| B | Vue + Nuxt | FastAPI | PostgreSQL | Rejected — overkill for prototype |
| C | Next.js | Node + Express | MongoDB | Rejected — unnecessary SSR overhead |
| D | Plain HTML/CSS | Django (template rendering) | SQLite | Rejected — misses modern UX patterns |

## Rationale

### Frontend: React + Vite
- **Vite** — Fast HMR, rapid feedback loop critical for UI iteration
- **React** — Mature ecosystem; TanStack Query + Zustand provide fine-grained state management without Redux boilerplate
- **TypeScript** — Eliminates runtime type errors in complex form logic (eligibility criteria, FEFO allocation)
- **Tailwind + Lucide** — Consistent, maintainable design system without CSS fatigue

### Backend: Django REST Framework
- **Familiar** — strong ORM, admin interface reduces CRUD boilerplate
- **Atomic operations** — distribution allocation + inventory release must be transactional
- **SimpleJWT** — built-in token rotation, refresh blacklist, 15min/7day lifecycle
- **drf-spectacular** — auto-generated OpenAPI schema for frontend client generation

### Database: SQLite (Prototype)
- **No DevOps overhead** — single file; no separate database server in development or initial deployment
- **Sufficient capacity** — Bauang has ~39 barangays; farmer count < 10k; transactions per day < 1k
- **Transition path** — schema is database-agnostic; swap PostgreSQL later if scaling beyond one small municipality
- **Trade-off** — no concurrent writes, but perfect for proof-of-concept

## Consequences

### Enabled
✅ Fast local development without Docker/PostgreSQL setup  
✅ TypeScript catches form schema mismatches before runtime  
✅ JWT auth supports future mobile app (no session cookies)  
✅ Atomic distribution transactions prevent double-allocation  

### Constrained
⚠️ Cannot horizontally scale — SQLite is single-writer  
⚠️ No background jobs — Celery/Redis not included (async tasks done synchronously)  
⚠️ No real-time subscriptions — polling only  
⚠️ Media uploads stored locally — no S3, no CDN (OK for barangay photos for now)  

## Future Migrations
When constraints become blockers:
1. **Scale to multi-writer:** Switch to PostgreSQL; add pgBouncer connection pooling
2. **Add background jobs:** Introduce Celery + Redis for bulk reports, email digests
3. **Real-time features:** Add Django Channels + WebSocket support
4. **Media at scale:** Move uploads to S3; add CDN proxy

---

**Session:** Phase 0 foundation
