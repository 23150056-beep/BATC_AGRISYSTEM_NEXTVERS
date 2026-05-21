---
title: Known Bugs & Critical Issues
domain: project
type: overview
tags: [bugs, issues, critical, major, defects, risk]
updated: 2026-05-12
---

# Known Bugs & Critical Issues

This page documents code-level defects that will manifest during demo or pilot. Severity tiers help prioritize fixes before going live.

## 🔴 Critical Issues (Will Fail in Demo)

### #1: `encoded_by` Field is Overloaded (Client/Encoder Conflation)
**Where:** `apps/farmers/api/views.py` · `apps/farmers/models.py`  
**Problem:** `encoded_by` is set to the staff who created the record, BUT when `linked_user_id` is supplied, it's overwritten with the CLIENT user. This conflates two roles:
- Encoder: "Which staff member registered this farmer?"
- Owner: "Which farmer is this profile?"

Every query using `farmer__encoded_by=user` only works for clients whose record had `linked_user_id` set. Seeded farmers (encoded_by=encoder user) are invisible to their client login.

**Impact:** `/farmers/me/` returns nothing for seeded clients; Admin "Encoded By" column shows wrong names.

**Fix:** 
- Add separate `linked_user` FK (distinct from `encoded_by`)
- Migration: move existing `encoded_by` CLIENT values to `linked_user`
- Update queries: client-mine uses `linked_user=user`; audit uses `encoded_by`

---

### #2: `FarmerViewSet.me` Crashes on Multi-Farmer Staff Accounts
**Where:** `apps/farmers/api/views.py` line: `.get(encoded_by=request.user)`  
**Problem:** Any STAFF/ADMIN who encoded 2+ farmers triggers `MultipleObjectsReturned` exception (uncaught). Only `DoesNotExist` is handled.

**Impact:** STAFF accessing `/farmers/me/` crashes with HTTP 500 if they have multiple farmers on file.

**Fix:** 
- Restrict `/me/` to CLIENT role
- Or: use `.filter(...).first()` instead of `.get()`
- Add try/except for both `DoesNotExist` and `MultipleObjectsReturned`

---

### #3: Login Rate-Limiting Declared but Not Configured
**Where:** `apps/accounts/api/views.py` · `config/settings/base.py`  
**Problem:** `LoginView` declares `throttle_scope = "login"` but `REST_FRAMEWORK` in settings has NO `DEFAULT_THROTTLE_CLASSES` or rates. The throttle is a silent no-op.

**Impact:** Login endpoint is fully open to brute-force attacks.

**Fix:** Add to `REST_FRAMEWORK`:
```python
DEFAULT_THROTTLE_CLASSES = [
    "rest_framework.throttling.ScopedRateThrottle",
    "rest_framework.throttling.AnonRateThrottle",
]
DEFAULT_THROTTLE_RATES = {
    "login": "5/min",
    "anon": "30/min",
    "user": "1000/min",
}
```

---

### #4: Bulk-Allocate is Dead Code
**Where:** `apps/distribution/api/views.py` · `apps/applications/services.py`  
**Problem:** `approve_application` auto-creates a Distribution as a side effect. `bulk_allocate` filters on `status=APPROVED` + `.exclude(distribution__isnull=False)` — i.e., approved-but-not-distributed, which is **always empty**.

**Impact:** Demo shows "0 created" with no errors; UI button appears to do nothing.

**Fix:** Either:
- Remove auto-distribution from `approve_application`; let `bulk_allocate` be the only path, OR
- Repurpose `bulk_allocate` to bulk-set `scheduled_date` on existing distributions for a program

---

### #5: Distribution `scheduled_date` Persists Before State Validation
**Where:** `apps/distribution/api/views.py` update_status action  
**Problem:** View writes `scheduled_date` to DB, then calls `services.update_status`. If state-machine validation fails, a 400 error returns — but the date change is already committed. User sees error; in reality, the date moved.

**Impact:** Data corruption on failed transitions.

**Fix:** Move `scheduled_date` assignment into `services.update_status` (inside `@transaction.atomic`) AFTER validating the transition.

---

### #6: `fix_bautista.py` is Destructive Ad-Hoc Script at Repo Root
**Where:** `batc-backend/fix_bautista.py`  
**Problem:** Script deletes farmer applications, creates distribution, marks DELIVERED (releases real stock). No transaction wrapper. Running twice creates duplicate distributions + duplicate stock releases. Easily fired by accident.

**Impact:** Data corruption; stock count unreliable.

**Fix:** 
- Move to `apps/core/management/commands/fix_bautista.py`
- Wrap body in `@transaction.atomic`
- Make idempotent (check if delivered distribution exists)
- Add `--execute` flag (defaults to dry-run)

---

### #7: Cancelled/Rejected Applications Cannot Be Re-Submitted
**Where:** `apps/applications/models.py` · `Meta.unique_together = [("farmer", "program")]`  
**Problem:** `unique_together` blocks a new SUBMITTED row even if a CANCELLED/REJECTED row exists for the same pair. Check skips CANCELLED/REJECTED, but unique constraint still fires. Results in `IntegrityError` on re-apply.

**Impact:** "Apply again after rejection" demo scenario immediately fails with generic 400 error.

**Fix:** Replace `unique_together` with partial unique index:
```python
UniqueConstraint(
    fields=["farmer", "program"],
    condition=Q(status__in=["SUBMITTED", "UNDER_REVIEW", "APPROVED", "FULFILLED"]),
    name="uniq_active_app"
)
```

---

### #8: Feedback Creation by Staff Attaches to Random Farmer
**Where:** `apps/feedback/api/views.py` FeedbackViewSet.perform_create  
**Problem:** `perform_create` gates with `IsAuthenticated` (not `IsClient`). Uses `request.user.encoded_farmers.filter(...).first()`. For STAFF/ADMIN this returns one of many encoded farmers arbitrarily. Staff testing the form silently writes feedback under random farmer names.

**Impact:** Data corruption; feedback audit trail meaningless.

**Fix:** 
- Restrict POST to CLIENT role
- Use `linked_user` FK from Finding #1
- Validate farmer belongs to user before save

---

### #9: CRYPTOGRAPHY_KEY Default is None
**Where:** `config/settings/base.py` · `CRYPTOGRAPHY_KEY = env("CRYPTOGRAPHY_KEY", default=None)`  
**Problem:** `django-cryptography` is in `INSTALLED_APPS`. If any `EncryptedXField` is added (and `.env.example` hints at this), reads/writes throw because key is None. No startup check.

**Impact:** Silent encryption failures if someone adds encrypted fields.

**Fix:** Either:
- Remove `django-cryptography` from `INSTALLED_APPS` until needed, OR
- Add Django system check that fails on startup if encrypted fields exist and key is None

---

### #10: `db.sqlite3` is Committed with PII
**Where:** `batc-backend/db.sqlite3` (376 KB)  
**Problem:** Dev database contains farmer mobile numbers and personal data. Anyone cloning the repo, or if repo is shared, leaks PII. Also: shared DB means all contributors mutate the same demo data.

**Impact:** PII exposure; no isolated demo environment per developer.

**Fix:** 
- Add `db.sqlite3` to `.gitignore`
- Remove from any commits
- Use `seed_demo.py` to repopulate locally
- Add `reset_demo` management command for teammates

---

## 🟠 Major Issues (Data Corruption / Incorrect Behavior)

### #11: FEFO Allocation Doesn't Lock Batches — Concurrent Over-Allocation
**Where:** `apps/inventory/selectors.py` get_fefo_batches  
**Problem:** Two concurrent `approve_application` calls read the same batch quantities without `select_for_update()`. Both plan against the same available qty. Error surfaces only later in `release_stock` as "Cannot release X — only Y available".

**Impact:** Inventory state becomes inconsistent on concurrent operations.

**Fix:** Use `select_for_update()` inside `@transaction.atomic` before computing allocation; validate `current_qty` has not changed.

---

### #12: NULL `expiry_date` Sort Order is DB-Dependent
**Where:** `apps/inventory/selectors.py` order_by("expiry_date","received_date")  
**Problem:** SQLite sorts NULLs first (default); PostgreSQL sorts NULLs last. Non-perishable items (NULL expiry) get released first on SQLite (dev) and last on Postgres (prod). Behavior differs by environment.

**Impact:** FEFO works on dev, breaks on production.

**Fix:** Use `F("expiry_date").asc(nulls_last=True)` explicitly.

---

### #13: No Uniqueness on `(item, lot_number)` — Duplicate Lots
**Where:** `apps/inventory/models.py` StockBatch  
**Problem:** Two batches with same `lot_number` for same `InventoryItem` can be received.

**Impact:** Lot traceability is broken; cannot recall by lot.

**Fix:** Add `Meta: unique_together = [("item", "lot_number")]` + migration + friendly serializer error.

---

### #14: FarmerWriteSerializer Destroys All Parcels on Update
**Where:** `apps/farmers/api/serializers.py` FarmerWriteSerializer.update  
**Problem:** When `parcels` is included in PATCH (even if unrelated field changed), `instance.parcels.all().delete()` runs, then recreates. Future FK references (plot history, photos) would be wiped. Parcel IDs change on every save.

**Impact:** Cannot safely add future parcel-related features.

**Fix:** Diff incoming parcels by ID: keep matching, update fields, create missing, delete only removed.

---

### #15: Mobile Number Not Normalized — Duplicates in Different Formats
**Where:** `apps/farmers/models.py` · `apps/farmers/api/serializers.py`  
**Problem:** `mobile_number` is `unique=True` but stored verbatim. "09171234567", "+639171234567", "9171234567" can coexist as distinct rows.

**Impact:** Lookup by number is unreliable; duplicates possible.

**Fix:** Add normalizer (convert to E.164 with +63), update unique key to canonical form, migration to normalize existing rows.

---

### #16: Eligibility Criteria Editor Accepts Incoherent Combinations
**Where:** `apps/programs/services.py` _apply_criterion  
**Problem:** Criterion with `field="livelihood_type"` and `operator="is_true"` is accepted. `_apply_criterion` runs `qs.filter(livelihood_type=True)` which compares string to boolean — always returns empty. Eligibility shrinks to zero silently.

**Impact:** Admin creates criteria expecting results; gets none without error.

**Fix:** Validate at serializer: `is_true` only on boolean fields; `gte/lte` only numeric; `eq` requires non-empty value.

---

### #17: `submit_application` is Not Transactional
**Where:** `apps/applications/services.py`  
**Problem:** Unlike `approve_application` / `reject_application`, `submit_application` has no `@transaction.atomic`. Application created, then `log_action` called separately. If `log_action` fails, application exists but is unaudited.

**Impact:** Audit trail gaps; incomplete transactions.

**Fix:** Wrap function body in `@transaction.atomic`.

---

### #18: Program Eligibility Uses N+1 Queries
**Where:** `apps/programs/services.py` get_eligible_programs_for  
**Problem:** For each program, function calls `get_eligible_farmers(program)` which runs all criteria. With dozens of programs + criteria each, dozens of round-trips on `/app/programs`.

**Impact:** Client page loads slowly; usability degradation.

**Fix:** Build single composite query; evaluate eligibility per-farmer once; cache if needed.

---

### #19: Login Redirects to Different Page Than Route Default
**Where:** `src/pages/public/LoginPage.tsx` · `src/app/router.tsx`  
**Problem:** LoginPage navigates STAFF to `/staff/farmers`; router default is `/staff/dashboard`. Refresh after login lands on Dashboard, but immediate post-login lands on Farmers.

**Impact:** Demo flow inconsistency; confusing UX.

**Fix:** Send STAFF to `/staff/dashboard` on login.

---

### #20: Distribution Mine-and-Confirm Uses `encoded_by` as Owner
**Where:** `apps/distribution/api/views.py` mine, confirm_receipt  
**Problem:** Filters on `application__farmer__encoded_by=request.user`. Same root cause as #1 — only farmers with `linked_user_id` set are visible to their owner.

**Impact:** Seeded farmers cannot confirm their own distributions.

**Fix:** Switch to `linked_user=request.user` after #1 is fixed.

---

## 🟡 Minor Issues (Wrong But Unlikely)

### #21: `is_staff` (Django) vs. `is_staff_member` (BATC) Ambiguous
**Where:** `apps/accounts/models.py`  
**Problem:** `AbstractUser.is_staff` (Django admin) vs. custom `is_staff_member` property (BATC role). Easy to confuse.

**Fix:** Rename to `is_staff_role` for unambiguous semantics.

---

### #22: Logout Endpoint Silently Swallows Blacklist Errors
**Where:** `apps/accounts/api/views.py` LogoutView  
**Problem:** If refresh token blacklist fails, endpoint still returns 200. User thinks they are logged out; token may still be valid.

**Fix:** Let blacklist errors propagate; return 400 if blacklist fails.

---

## Triage Priority for Next Session

**Fix first (blocks demo):** #1, #2, #3, #7, #10  
**Fix second (data correctness):** #4, #5, #6, #11, #12  
**Fix before production:** #8, #9, #13, #14, #15, #16, #17, #18  
**Fix nice-to-have:** #19, #20, #21, #22  

---

**Updated:** 2026-05-12  
**Source:** `batc/_bugs.txt` (code-level audit)
