# BATC Master Build Plan — PROTOTYPE
## Centralized Distribution and Allocation Management System
### Bauang Agricultural Trade Center — La Union, Philippines

---

## HOW TO USE THIS FILE

This is the master build plan for the BATC prototype.
Stack: React + Vite · Django REST Framework · SQLite (prototype)

Items marked `[x]` are DONE. Items marked `[ ]` are NOT YET DONE.
The last completed task is marked with `← RESUME HERE`.
Mark tasks as done by changing `[ ]` to `[x]`.

---

## PROTOTYPE SCOPE — WHAT IS IN AND OUT

| Feature | Prototype decision |
|---|---|
| Database | SQLite (no PostgreSQL) |
| Background tasks | None (no Celery, no Redis) |
| File uploads | Simple local media, no compression, no signed URLs |
| SPI encryption | Plain CharField (no django-cryptography) |
| Farmer registration | 3-step form (personal → address → farm), no signature pad |
| Address/Geo | Hardcoded Bauang barangay list (no PSGC management command) |
| Inventory alerts | Low-stock flag in API response only (no email digests) |
| Reports | Simple synchronous CSV download (no streaming, no PDF) |
| Announcements | Role-based targeting only (no per-barangay or per-program filter) |
| Feedback | Rating + comment form, basic staff view |
| Audit log | Simple ActionLog model (no django-simple-history) |
| PWA / offline | Not in prototype |
| i18n / locales | English only |
| Tests | Not in prototype |
| Deployment | Not in prototype |
| DPA consent | Checkbox required, timestamp recorded (kept — core to the domain) |
| FEFO batch selection | Kept — core business logic |
| Atomic approval | Kept — core business logic |
| Status state machines | Kept — core business logic |
| StockMovement ledger | Kept — core business logic |
| Role-based access | Kept — core to the system |

---

## MODEL & THINKING GUIDE (per task type)

| Task type | Recommended model |
|---|---|
| Boilerplate setup, installs, config files | Sonnet 4.6 |
| Simple CRUD views, serializers | Sonnet 4.6 |
| React components, layouts, styling | Sonnet 4.6 |
| Form validation, Zod schemas | Sonnet 4.6 |
| Complex business logic (eligibility engine, FEFO, atomic approval) | Opus 4.7 |
| Debugging complex errors | Opus 4.7 |

---

## DESIGN SYSTEM REFERENCE

```
Color tokens:
--batc-green-primary:     #3B6D11  (buttons, active nav, CTA)
--batc-green-interactive: #639922  (hover, links, focus rings)
--batc-green-surface:     #EAF3DE  (active rows, selected states)
--batc-navy-sidebar:      #162036  (admin sidebar bg, client topbar)
--batc-navy-hover:        #1e2f4a  (sidebar item hover/active bg)
--batc-navy-text:         #8aa0bb  (sidebar inactive text)
--batc-navy-text-active:  #E8F0E0  (sidebar active item text)

Status pills:
Delivered    → bg:#EAF3DE  text:#27500A
Scheduled    → bg:#E6F1FB  text:#0C447C
Delayed      → bg:#FAEEDA  text:#633806
Out of stock → bg:#FCEBEB  text:#791F1F
Rescheduled  → bg:#F1EFE8  text:#444441
Unavailable  → bg:#FCEBEB  text:#791F1F
Active       → bg:#EAF3DE  text:#27500A
Draft        → bg:#F1EFE8  text:#5F5E5A
Suspended    → bg:#FAEEDA  text:#633806
Completed    → bg:#E6F1FB  text:#0C447C

Layouts:
Admin  → dark sidebar (#162036, 160px) + topbar + Outlet
Staff  → icon sidebar (44px) + breadcrumb topbar + Outlet
Client → dark topbar + Outlet + 4-tab bottom nav (Home/Programs/Claims/Profile)
```

---

## PROJECT STRUCTURE

```
batc/
├── batc-backend/
│   ├── config/
│   │   ├── settings/base.py · local.py · production.py
│   │   ├── urls.py
│   │   ├── api_v1_urls.py
│   │   └── wsgi.py
│   ├── apps/
│   │   ├── core/          ← TimeStampedModel, AuditableModel, ArchivableModel, permissions
│   │   ├── accounts/      ← custom User (ADMIN/STAFF/CLIENT), auth views
│   │   ├── farmers/       ← Farmer, FarmParcel (barangay as text choice)
│   │   ├── programs/      ← Program, ProgramItem, EligibilityCriterion
│   │   ├── inventory/     ← InventoryItem, StockBatch, StockMovement
│   │   ├── applications/  ← InterventionApplication (5 states)
│   │   ├── distribution/  ← Distribution (6 states), DistributionItem
│   │   ├── announcements/ ← Announcement (role-targeted)
│   │   ├── feedback/      ← Feedback
│   │   ├── reports/       ← simple CSV exporters
│   │   └── audit/         ← ActionLog
│   ├── db.sqlite3
│   ├── manage.py
│   └── .env
│
└── batc-frontend/
    └── src/
        ├── app/           ← providers, router, queryClient
        ├── features/      ← domain modules
        ├── pages/         ← admin/ · staff/ · client/ · public/
        ├── layouts/       ← AdminLayout, StaffLayout, ClientLayout
        ├── components/    ← shared UI
        ├── services/api/  ← axios client + per-domain api files
        ├── stores/        ← authStore (Zustand)
        └── types/
```

---

## PHASE 0 — Foundation & Project Setup ✅ COMPLETE

### Backend — done
- [x] Project folder, virtualenv, packages installed (SQLite, no psycopg)
- [x] Django project with `config/settings/` split (base · local · production)
- [x] `AUTH_USER_MODEL = "accounts.User"` set before first migrate
- [x] All app skeletons created (core, accounts, farmers, programs, inventory, applications, distribution, announcements, feedback, reports, audit)
- [x] `core/models.py` — TimeStampedModel, AuditableModel, ArchivableModel
- [x] `accounts/models.py` — custom User with Role.ADMIN/STAFF/CLIENT
- [x] First migration run, SQLite db created
- [x] DRF, SimpleJWT (15min/7day, rotation, blacklist), CORS, drf-spectacular configured
- [x] Auth endpoints: login, logout, refresh, me
- [x] Test: POST `/api/v1/auth/login/` returns JWT ✓

### Frontend — done
- [x] Vite + React + TypeScript scaffolded
- [x] TanStack Query, Axios, Zustand, RHF, Zod, Tailwind, Lucide, Sonner installed
- [x] BATC design tokens in `index.css`
- [x] axios client with JWT interceptor + auto-refresh
- [x] authStore (Zustand) — tokens + user
- [x] LoginPage with Zod validation
- [x] ProtectedRoute, RoleRoute, RoleRedirect
- [x] AdminLayout (dark sidebar 160px), StaffLayout (icon 44px), ClientLayout (bottom nav)
- [x] Full router for all 3 roles
- [x] Test: TypeScript 0 errors ✓

### Demo users
- admin / admin1234 (ADMIN)
- staff01 / staff1234 (STAFF)
- farmer01 / farmer1234 (CLIENT)

---

## PHASE 1 — User Management ✅ COMPLETE

**Goal:** Admin can CRUD all users. Staff can view users (read-only).

### Backend
- [x] Create `core/permissions.py` — IsAdmin, IsStaffOrAdmin, IsClient
- [x] Create `accounts/api/serializers.py` — UserListSerializer, UserDetailSerializer, UserWriteSerializer
- [x] Create `accounts/api/views.py` — UserViewSet (list, retrieve, create, partial_update, archive, unarchive, reset_password)
- [x] Wire `accounts/api/urls.py` into `api_v1_urls.py`
- [x] Test: Staff GET `/users/` returns 200; Staff POST `/users/` returns 403 ✓

### Frontend — Admin
- [x] Create `src/features/users/api/users.api.ts`
- [x] Create `src/features/users/components/UserRoleBadge.tsx`
- [x] Create `src/features/users/components/UserTable.tsx` — searchable, filter by role, paginated
- [x] Create `src/features/users/components/UserFormModal.tsx` — add/edit dialog (role dropdown)
- [x] Create `src/pages/admin/AdminUsersPage.tsx` — table + Add + archive + reset password
- [x] Wire into AdminLayout nav + router

### Frontend — Staff
- [x] Create `src/pages/staff/StaffUsersPage.tsx` — read-only table, no write actions
- [x] Wire into StaffLayout nav + router

**Phase 1 complete when:** Admin adds a user, changes role, archives. Staff sees list but has no write actions.

---

## PHASE 2 — Farmer Registration ✅ COMPLETE

**Goal:** Staff registers farmers with a 3-step form. Admin can archive. Client sees own profile.

### Backend
- [x] Create `apps/farmers/` models:
  - `Farmer` — first_name, last_name, sex, dob, civil_status, mobile_number (unique), rsbsa_reference (unique, nullable), barangay (CharField with BAUANG_BARANGAYS choices), sitio, livelihood_type, farm_area_ha, household_size, is_4ps, is_pwd, is_ip, consent_dpa (BooleanField), consent_dpa_at (DateTimeField, auto on consent), encoded_by (FK User), is_archived, archived_at
  - `FarmParcel` — FK Farmer, area_ha, commodity, land_type, ownership_type
- [x] Create `farmers/api/serializers.py` — FarmerListSerializer, FarmerDetailSerializer, FarmerWriteSerializer
- [x] Create `farmers/api/views.py` — FarmerViewSet (list/retrieve: Staff+Admin; create/update: Staff+Admin; archive/unarchive: Admin; /me/ client)
- [x] Wire `farmers/api/urls.py` into `api_v1_urls.py`
- [x] Create `farmers/constants.py` — BAUANG_BARANGAYS (39 barangays)
- [x] Test: POST with consent_dpa=True succeeds; False returns 400 ✓

### Frontend — shared
- [x] Create `src/components/form/BarangaySelect.tsx`

### Frontend — Farmer wizard (3 steps)
- [x] Create `src/features/farmers/schemas/farmerSchema.ts` — full Zod schema
- [x] Create `Step1Personal.tsx` — name, sex, dob, civil status, mobile, 4Ps/PWD/IP flags
- [x] Create `Step2Address.tsx` — barangay dropdown + sitio + RSBSA ref
- [x] Create `Step3Farm.tsx` — livelihood, area, household, parcels repeater, DPA consent (not pre-checked)
- [x] Create `WizardShell.tsx` — step indicator, back/next, per-step validation
- [x] Create `FarmerTable.tsx` — search by name/mobile, filter by barangay, click row to open drawer
- [x] Create `FarmerDetailDrawer.tsx` — full profile + parcels + edit (opens wizard) + archive (Admin)
- [x] Create `AdminFarmersPage.tsx` — table + Register Farmer button
- [x] Create `StaffFarmersPage.tsx` — same, edit available, no archive
- [x] Update `ClientProfilePage.tsx` — own farmer profile read-only via /farmers/me/

**Phase 2 complete when:** Staff registers a farmer via wizard; farmer appears in searchable table; client sees own profile.

---

## PHASE 3 — Programs and Inventory ✅ COMPLETE

**Goal:** Admin defines programs with eligibility rules. Inventory tracked with FEFO batches.

### Backend — Programs
- [x] Create `apps/programs/` models: Program, ProgramItem, EligibilityCriterion
- [x] Create `programs/services.py` — `get_eligible_farmers(program)` running criterion loop
- [x] Create `programs/api/` — ProgramViewSet (Admin CRUD + activate/suspend/complete actions)
- [x] Wire into `api_v1_urls.py`
- [x] Test: Program with criterion filters only matching farmers ✓

### Backend — Inventory
- [x] Create `apps/inventory/` models: InventoryItem, StockBatch, StockMovement
- [x] Create `inventory/selectors.py` — `get_fefo_batches(item_id, qty_needed)` → FEFO-ordered tuples
- [x] Create `inventory/services.py` — `receive_stock()`, `adjust_stock()`, `release_stock()` with F() update
- [x] Create `inventory/api/` — InventoryItemViewSet, StockBatchViewSet with /receive/ /adjust/ actions
- [x] Wire into `api_v1_urls.py`
- [x] Test: FEFO returns earliest-expiring batch first ✓; current_qty never negative ✓

### Frontend — Programs
- [x] Create `src/features/programs/components/ProgramStatusBadge.tsx`
- [x] Create `src/features/programs/components/ProgramForm.tsx` — name, dates, items, barangays, eligibility criteria builder
- [x] Create `src/features/programs/components/ProgramsTable.tsx` — list + activate/suspend/complete buttons
- [x] Create `src/pages/admin/AdminProgramsPage.tsx` — list + create/edit + status actions
- [x] Create `src/pages/staff/StaffProgramsPage.tsx` — read-only list

### Frontend — Inventory
- [x] Create `src/features/inventory/components/InventoryTable.tsx` — item list with low-stock badge
- [x] Create `src/features/inventory/components/StockBatchList.tsx` — batches sorted FEFO with Adjust button
- [x] Create `src/features/inventory/components/ReceiveStockDialog.tsx` — lot, qty, expiry, date
- [x] Create `src/features/inventory/components/AdjustStockDialog.tsx` — signed qty + reason note
- [x] Create `src/features/inventory/components/MovementLedger.tsx` — paginated log with type badges
- [x] Create `src/features/inventory/components/ItemDetailPanel.tsx` — tabbed panel (batches + movements)
- [x] Create `src/pages/admin/AdminInventoryPage.tsx`
- [x] Create `src/pages/staff/StaffInventoryPage.tsx` (read-only batches, no receive/adjust)
- [x] Wire /admin/inventory, /admin/programs, /staff/inventory, /staff/programs into router.tsx
- [x] TypeScript 0 errors ✓

**Phase 3 complete when:** Admin creates an Active program with 1 item + 1 criterion. Inventory shows FEFO-ordered batches.

---

## PHASE 4 — Applications and Distribution (CORE) ✅ COMPLETE

**Goal:** End-to-end lifecycle — apply → approve → distribute → mark delivered → stock decremented.

### Backend — Applications
- [x] Create `apps/applications/` models: InterventionApplication (SUBMITTED/UNDER_REVIEW/APPROVED/REJECTED/CANCELLED/FULFILLED)
- [x] Create `apps/audit/models.py` — ActionLog + log_action() helper
- [x] Create `applications/services.py` — submit_application, approve_application (atomic), reject_application, cancel_application
- [x] Create `applications/api/` — ApplicationViewSet with approve/reject/cancel/mine actions
- [x] Wire into `api_v1_urls.py`
- [x] Migrations run ✓

### Backend — Distribution
- [x] Create `apps/distribution/` models: Distribution (6 statuses + can_transition_to()), DistributionItem
- [x] Create `distribution/services.py` — create_distribution (FEFO allocation), update_status (DELIVERED releases stock + fulfills application)
- [x] Create `distribution/api/` — DistributionViewSet with update-status, bulk-allocate, mine actions
- [x] Wire into `api_v1_urls.py`
- [x] Migrations run ✓

### Frontend
- [x] Create `src/features/applications/api/applications.api.ts`
- [x] Create `src/features/applications/components/ApplicationStatusBadge.tsx`
- [x] Create `src/features/applications/components/ApplicationReviewPanel.tsx` — split list + detail with approve/reject/cancel
- [x] Create `src/features/distribution/api/distribution.api.ts`
- [x] Create `src/features/distribution/components/DistributionStatusBadge.tsx`
- [x] Create `src/features/distribution/components/DistributionTable.tsx`
- [x] Create `src/features/distribution/components/StatusUpdateDialog.tsx`
- [x] Create `src/features/distribution/components/BulkAllocateDialog.tsx`
- [x] Create `src/pages/admin/AdminDistributionPage.tsx`
- [x] Create `src/pages/staff/StaffApplicationsPage.tsx`
- [x] Create `src/pages/staff/StaffDistributionPage.tsx`
- [x] Update `src/pages/client/ClientProgramsPage.tsx` — list active programs + Apply button
- [x] Update `src/pages/client/ClientClaimsPage.tsx` — own distributions with status pills + items
- [x] Wire all routes into router.tsx
- [x] TypeScript 0 errors ✓ ← RESUME HERE

**Phase 4 complete when:** farmer01 applies → staff01 approves → distribution created → staff01 marks Delivered → stock decremented → farmer01 sees Delivered status.

---

## PHASE 5 — Announcements, Feedback, and Reports ✅ COMPLETE

**Goal:** Admin publishes announcements. Farmers give feedback. CSV exports work.

### Backend — Announcements
- [x] Create `apps/announcements/` models: Announcement (title, body, target_roles JSONField, published_at, created_by)
- [x] Create announcements API — list filtered by request.user.role; create/delete Admin only
- [x] Wire into `api_v1_urls.py`; migrations run ✓

### Backend — Feedback
- [x] Create `apps/feedback/` models: Feedback (FK Farmer, optional FK Distribution, rating 1-5, comment, status NEW/ACKNOWLEDGED/RESOLVED)
- [x] Create feedback API — Client POST own; Staff/Admin list + update-status action
- [x] Wire into `api_v1_urls.py`; migrations run ✓

### Backend — Reports
- [x] Create CSV views: FarmersReportView, DistributionsReportView, InventoryReportView (auth-protected, synchronous)
- [x] Wire into `api_v1_urls.py` (path-based, not router)

### Frontend — Announcements
- [x] Create `src/features/announcements/api/announcements.api.ts`
- [x] Create `src/features/announcements/components/AnnouncementCard.tsx`
- [x] Create `src/features/announcements/components/AnnouncementComposer.tsx`
- [x] Create `src/pages/admin/AdminAnnouncementsPage.tsx`
- [x] Updated `ClientHomePage.tsx` — shows next distribution card + announcements feed

### Frontend — Feedback
- [x] Create `src/features/feedback/api/feedback.api.ts`
- [x] Create `src/features/feedback/components/FeedbackForm.tsx` — star rating + comment
- [x] Create `src/features/feedback/components/FeedbackList.tsx` — Staff/Admin view with status update
- [x] Create `src/pages/client/ClientFeedbackPage.tsx` — submit per-distribution + history
- [x] Create `src/pages/admin/AdminFeedbackPage.tsx`
- [x] Added Feedback tab to ClientLayout nav + route wired

### Frontend — Reports
- [x] Create `src/features/reports/components/ReportDownloadBar.tsx` — fetch-as-blob download preserving auth header
- [x] Create `src/pages/admin/AdminReportsPage.tsx` — farmers + distributions + inventory
- [x] Create `src/pages/staff/StaffReportsPage.tsx` — farmers + distributions
- [x] Wire all routes; TypeScript 0 errors ✓ ← RESUME HERE

**Phase 5 complete when:** Admin publishes announcement → client sees it on home. Client submits feedback. Admin downloads farmers CSV.

---

## PHASE 6 — Dashboard and Seed Data (Prototype Wrap-Up) ✅ COMPLETE

**Goal:** Dashboards populated with real counts. Seed data makes the demo convincing.

### Backend — Dashboard summary endpoints
- [x] Create `GET /dashboard/admin/` — total_farmers, active_programs, pending_applications, distributions_today, low_stock_items, total_distributions, fulfilled_applications
- [x] Create `GET /dashboard/staff/` — pending_applications, distributions_today, scheduled_today, delivered_today
- [x] Wire into `api_v1_urls.py` via `apps.core.api.urls`

### Backend — Seed data command
- [x] Create `apps/core/management/commands/seed_demo.py`:
  - 7 users total (admin + 3 staff + 3 farmer accounts) — idempotent get_or_create
  - 13 farmers across 5 barangays with parcels
  - 1 InventoryItem (Certified Rice Seeds, kg) with 2 StockBatches (LOT-2026-A/B, different expiry dates)
  - 1 active Program (RSA-2026-Q1) with 1 ProgramItem + 2 EligibilityCriteria (livelihood=RICE + is_4ps)
  - 5 applications in mixed statuses (FULFILLED×2, APPROVED, SUBMITTED, REJECTED) with matching distributions
  - 3 Announcements (all-roles, CLIENT-only, STAFF+ADMIN)
  - Safe to re-run — second run is a no-op ✓

### Frontend — Dashboards
- [x] Create `src/features/dashboard/api/dashboard.api.ts`
- [x] Rewrite `src/pages/admin/AdminDashboardPage.tsx` — 6 stat cards + announcements feed + quick stats table; auto-refreshes every 60s
- [x] Create `src/pages/staff/StaffDashboardPage.tsx` — 4 stat cards (pending apps, today total, scheduled, delivered) + announcements; auto-refreshes
- [x] Staff default landing updated to `/staff/dashboard`; dashboard icon added to StaffLayout nav
- [x] RoleRedirect updated: STAFF → `/staff/dashboard`
- [x] TypeScript 0 errors ✓ ← RESUME HERE

**Phase 6 complete when:** `python manage.py seed_demo` populates all data. Dashboards show real numbers. All 3 roles can complete their core workflows without errors.

---

## QUICK REFERENCE — Prototype Architecture Rules

These are non-negotiable across all sessions.

| Decision | Correct | Wrong |
|---|---|---|
| Database | SQLite (prototype) | PostgreSQL |
| Custom User model | Set before first migrate — never change | Altering after migrate |
| Stock quantity edits | Only via StockMovement + F() update | Direct field assignment |
| Approval flow | `transaction.atomic()` all steps together | Separate saves |
| Eligibility criteria | Separate EligibilityCriterion rows | JSON blob on Program |
| SPI fields | Plain CharField (prototype — no encryption) | Adding django-cryptography now |
| DPA consent | Required checkbox, not pre-checked, timestamp auto-set | Pre-checked or skippable |
| FEFO | Order by expiry_date ASC then received_date ASC | Manual batch pick |
| Status transitions | Dedicated service method + ActionLog entry | Direct model .save() |
| Frontend server state | TanStack Query | useState + useEffect |
| Frontend auth state | Zustand | TanStack Query |
| Form state | React Hook Form + Zod | Controlled inputs |
| No Celery/Redis | No background tasks in prototype | Adding async task queues |
| No PWA/offline | No service workers | Adding vite-plugin-pwa |
| No tests | Skip in prototype | Writing test suites now |
