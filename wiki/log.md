# Wiki Log

Append-only. Do not edit existing entries. Always append at the bottom.

Format: `## [YYYY-MM-DD] <operation> | <description>`
Valid operations: `init`, `ingest`, `session`, `query`, `lint`, `audit`

---

## [2026-05-09] init | Wiki scaffolded — two-domain structure (project + research) created

## [2026-05-12] audit | Comprehensive audit: documented all 6 build phases + 5 architectural decisions + design system + prototype scope
- Added `project/overview.md` expansion (workflows, core capabilities, deployment)
- Created `project/build-progress-phases-0-6.md` (detailed phase-by-phase breakdown)
- Created `project/design-system.md` (color tokens, status pills, layout specs, components)
- Created `project/prototype-scope.md` (feature decision matrix, performance targets, roadmap)
- Created 5 decision records:
  - `2026-05-12-stack-choice.md` (React+Vite, Django, SQLite)
  - `2026-05-12-authentication-jwt-15min.md` (JWT auth, 15min tokens)
  - `2026-05-12-rbac.md` (three-role RBAC with permission decorators)
  - `2026-05-12-atomic-distribution.md` (atomic delivery transaction)
  - `2026-05-12-fefo-batches.md` (FEFO batch selection)
- Updated `wiki/index.md` (10 pages, 5 decisions now cataloged)

## [2026-05-12] audit-extended | Added missing critical documentation: bugs, gaps, architecture rules, setup guide
- Created `project/known-bugs-and-issues.md` (22 findings: 10 critical, 10 major, 2 minor with fixes)
- Created `project/prototype-gaps.md` (24 gaps across UX, flows, demo credibility, with Phase 7–10 roadmap)
- Created `project/architecture-rules.md` (non-negotiable patterns: database, permissions, inventory, state machines, API, code org)
- Created `project/getting-started.md` (developer setup, demo walkthrough, common commands, troubleshooting)
- Created `project/management-commands.md` (Django CLI reference, current + planned commands)
- Updated `wiki/index.md` (now 15 pages + 5 decisions + 5 references cataloged)
