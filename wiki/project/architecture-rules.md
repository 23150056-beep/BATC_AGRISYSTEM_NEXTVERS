---
title: Architectural Rules & Non-Negotiables
domain: project
type: overview
tags: [architecture, rules, constraints, non-negotiable, patterns]
updated: 2026-05-12
---

# Architectural Rules & Non-Negotiables

These are patterns and constraints that must be maintained across all sessions to preserve system integrity. Do not deviate without explicit decision in [[project/decisions]].

## Database & Models

| Rule | Correct | Wrong | Why |
|---|---|---|---|
| Custom User model | Set BEFORE first migrate | Altering after migrate | Django caches AUTH_USER_MODEL; changing after is near-impossible |
| Stock quantity edits | Only via `StockMovement` + `F()` update | Direct field assignment | Preserves audit trail; `F()` prevents race conditions |
| Approval flow | Wrap ALL steps in `@transaction.atomic()` | Separate saves | Prevents half-committed approval (allocation ✅ but app ❌) |
| Eligibility criteria | Separate `EligibilityCriterion` rows | JSON blob on Program | Allows criteria reuse, querying, future extensibility |
| SPI fields | Plain `CharField` (prototype) | Using django-cryptography now | Encryption can be added at deploy; unblock prototype |

## Permission Model

| Rule | Correct | Wrong | Why |
|---|---|---|---|
| Role-based access | `@permission_classes([IsAdmin])` on viewsets | Hardcoded role checks in views | Declarative intent; reusable; testable |
| Data scoping | Filter queryset in `get_queryset()` | Don't filter; restrict in serializer | Filters at source; prevents accidental leaks |
| Client isolation | `farmer__linked_user=request.user` | `farmer__encoded_by=request.user` | `encoded_by` means "encoder"; `linked_user` means "owner" |

## Inventory & Distribution

| Rule | Correct | Wrong | Why |
|---|---|---|---|
| Batch selection | FEFO (earliest expiry first, mandatory) | Manual staff selection | Deterministic; auditable; minimizes waste |
| FEFO query | `order_by(F("expiry_date").asc(nulls_last=True))` | `order_by("expiry_date")` | DB-independent; SQLite vs. Postgres differ on NULL sort |
| Release on DELIVERED | Atomic: allocate + decrement + log + fulfill together | Sequential saves | Prevents inventory corruption on concurrent operations |
| Concurrent safety | Use `select_for_update()` + `@transaction.atomic` | Lock-free reads | Prevents over-allocation of same batch |

## State Machines

| Rule | Correct | Wrong | Why |
|---|---|---|---|
| Application lifecycle | One row per farmer+program; status changes | Multi-row for each application | Preserves audit history; unique constraint enforces 1 active app per pair |
| Distribution lifecycle | `can_transition_to(new_status)` guards transitions | No validation | Prevents invalid state transitions (e.g., DELIVERED → DRAFT) |
| Failed transitions | Raise `ValueError` (caught as 400) | Silently allow or 500 | Client knows request was wrong, not server error |
| Rejection reason | Required when moving to REJECTED | Optional field | Farmers need to know why; audit trail complete |

## API & Frontend

| Rule | Correct | Wrong | Why |
|---|---|---|---|
| JWT tokens | 15min access + 7day refresh (rotation + blacklist) | Long-lived tokens | Limits exposure; logout immediate; mobile-friendly |
| Auto-refresh | Axios interceptor on 401 | Manual token management | User never sees 401; seamless UX |
| Role redirect | `RoleRedirect` wrapper on login | Manual route guards | Prevents race condition between auth state + route |
| API contract | Versioned endpoints (`/api/v1/...`) | Unversioned (`/api/...`) | Allows schema evolution without breaking clients |

## Data Integrity

| Rule | Correct | Wrong | Why |
|---|---|---|---|
| Audit logging | `ActionLog` on every state change | Sporadic logging | Compliance; debugging; audit trail is continuous |
| Soft deletes | Use `is_archived` + `archived_at` | Hard deletes | Preserves referential integrity; audit trail survives |
| Unique constraints | Enforced at DB level + validated at serializer | Serializer-only | DB protects against concurrent violations |
| Composite uniqueness | Partial unique indexes with `condition=Q(...)` | `unique_together` without condition | Allows re-submission after cancellation/rejection |

## Code Organization

| Rule | Correct | Wrong | Why |
|---|---|---|---|
| Business logic | In `services.py` (not views) | Mixed in views | Testable; reusable; single responsibility |
| Queries | In `selectors.py` or `get_queryset()` | Scattered across views | Centralized; easier to optimize |
| Permissions | In `core/permissions.py` + `@permission_classes` decorator | Inline in views | Reusable; declarative; testable |
| Constants | In `constants.py` per app (e.g., `farmers/constants.py`) | Hardcoded strings | Maintainable; catchable via grep |

## Migration & Deployment

| Rule | Correct | Wrong | Why |
|---|---|---|---|
| Custom User before migrate | Set in `settings.py` BEFORE `makemigrations` | Try to migrate then add custom User | Django caches AUTH_USER_MODEL at import; already baked |
| Deployment path | PostgreSQL for production (later) | SQLite in production | Single-writer limit; no concurrency; too risky |
| Secrets management | `.env` file (local), environment variables (prod) | Committed API keys | Prevents credential leaks |

## Style & UX

| Rule | Correct | Wrong | Why |
|---|---|---|---|
| Color tokens | CSS variables (`--batc-green-primary`) + Tailwind config | Inline hex literals | Consistency; themability; maintainability |
| Layouts | One `AppShell` with role-based density | Three separate layout components | Visual coherence; reduces duplication |
| Empty states | Illustration + action button | Plain text "No X yet" | UX credibility; shows intent |
| Loading | Skeleton with shimmer | Plain "Loading..." | Professional appearance; perceived responsiveness |

---

## Quick Checklist for New Contributors

Before submitting code:

- [ ] Does this change violate any rule in the table above?
- [ ] Is there a corresponding [[project/decisions/]] page that justifies this approach?
- [ ] Are there tests that would catch violations of these rules?
- [ ] Is the audit trail preserved (ActionLog + StockMovement)?
- [ ] Are permissions enforced at the viewset level (not in the serializer)?
- [ ] Is the transaction boundary correct (`@transaction.atomic` wrapping atomic operations)?

---

**Rationale:** These rules emerged from Phases 0–6 build experience. They prevent common pitfalls (race conditions, audit gaps, permission leaks, state corruption). They are NOT absolute dogma — they can be revised with new [[project/decisions]] records. But do not deviate casually.

**Updated:** 2026-05-12  
**Source:** `BATC_BUILD_PLAN.md` (QUICK REFERENCE section)
