---
title: Prototype Scope — What's In & Out
domain: project
type: overview
tags: [scope, prototype, constraints, mvp, decisions]
updated: 2026-05-12
---

# Prototype Scope — What's In & Out

This is a **working prototype**, not production. The scope below defines what's included and what's deliberately excluded (with rationale).

## Feature Decision Matrix

| Feature | Included? | Rationale | Future? |
|---|---|---|---|
| **Database: SQLite** | ✅ Yes | Single-file, no DevOps for prototype | Upgrade to PostgreSQL at scale |
| **Background Tasks (Celery/Redis)** | ❌ No | Async tasks done synchronously; OK for <1k daily operations | Add if batch processing emerges |
| **File Uploads** | ✅ Simple local media | Photos for farmers, no compression/optimization | Add S3 + CDN when scaling |
| **File Signing & Encryption** | ❌ No SPI encryption | SPI data in CharField, plaintext (dev/demo only) | Encrypt at rest in production |
| **Farmer Registration** | ✅ 3-step form | Personal → Address → Farm, DPA consent required | Add signature pad/biometric later |
| **Address/Geolocation** | ✅ Hardcoded 39 barangays | Hardcoded Bauang barangay list (no PSGC API) | Add dynamic barangay management |
| **Inventory Alerts** | ✅ API only | Low-stock flag in JSON response | Email digests in Phase 7 |
| **Reports** | ✅ Simple CSV sync | Synchronous downloads, no streaming/pagination | PDF + streaming downloads later |
| **Announcements** | ✅ Role-targeted | Global + targeted by role (ADMIN/STAFF/CLIENT) | Per-barangay targeting in Phase 7 |
| **Feedback** | ✅ Basic form | Rating + comment, staff view | Rating distribution chart later |
| **Audit Log** | ✅ Simple ActionLog | Custom ActionLog model, all actions logged | Add django-simple-history for versioning |
| **PWA / Offline** | ❌ No | Service Worker not included; requires internet | Add for field workers later |
| **Internationalization (i18n)** | ❌ No | English only | Add Filipino (Tagalog) in Phase 7 |
| **Automated Tests** | ❌ No | Functional testing only; no unit/integration tests | Add pytest + coverage in Phase 7 |
| **Deployment** | ❌ No | Docker not included; manual deployment docs | Add Docker + GitHub Actions in Phase 7 |
| **DPA Consent** | ✅ Kept | Checkbox required, timestamp recorded | Core to domain — must stay |
| **FEFO Batch Selection** | ✅ Kept | Automatic earliest-expiry-first allocation | Core business logic — must stay |
| **Atomic Approval** | ✅ Kept | Distribution delivery is transactional (inventory release atomic) | Core to data integrity — must stay |
| **Status State Machines** | ✅ Kept | Application states (SUBMITTED→FULFILLED), Distribution states | Core workflow — must stay |
| **StockMovement Ledger** | ✅ Kept | Every receive/adjust/release creates movement record | Core to audit trail — must stay |
| **Role-Based Access Control** | ✅ Kept | ADMIN/STAFF/CLIENT roles with permission checks | Core to domain — must stay |

## Performance Targets (Prototype)

| Metric | Target | Rationale |
|---|---|---|
| **User base** | < 100 farmers | Single admin/staff, hand-curated |
| **Concurrent users** | < 5 | Not multiplayer; SQLite single-writer |
| **Requests per day** | < 1000 | Lightweight farmer operations |
| **API response time** | < 500ms | Tolerable on mobile networks |
| **Page load** | < 2s | Vite fast refresh supports quick iteration |

## Known Limitations

### Data Consistency
- **No horizontal scaling** — SQLite is single-writer; database is a bottleneck at scale
- **No distributed transactions** — if we scale to multiple backends, atomic operations fail
- **No read replicas** — all queries hit the single SQLite file

### Real-Time Features
- **No subscriptions** — polling only (TanStack Query with 30s intervals)
- **No WebSockets** — no live updates; farmer sees data on page refresh
- **No notifications** — staff doesn't get alert when new app submitted; they check manually

### Media & File Handling
- **Local storage only** — photos stored in `media/` folder; no CDN
- **No compression** — large photos uploaded as-is (OK for small barangay, not for 100+ barangays)
- **No signed URLs** — media paths are predictable (any authenticated user can guess farmer photo URL)

### Security
- **Plain SPI data** — Social security/RSBSA stored as CharField (not encrypted at rest)
- **No rate limiting** — no throttle on login attempts or API calls (demo-only)
- **No CORS restrictions** — CORS allows all origins (for development)

## Phase 7+ Roadmap

When these become blockers:

1. **Database scaling** → PostgreSQL + pgBouncer
2. **Background jobs** → Celery + Redis
3. **Media CDN** → S3 + CloudFront
4. **Encryption** → django-cryptography for SPI fields
5. **Localization** → Filipino (Tagalog) + English
6. **Real-time** → Django Channels + WebSocket
7. **Testing** → pytest + 70%+ coverage
8. **Deployment** → Docker + CI/CD (GitHub Actions)

---

**Decision context:** [[2026-05-12-stack-choice.md]]  
**Updated:** 2026-05-12
