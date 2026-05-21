# BATC Setup Checklist — 2026-05-12

✅ **All systems ready for launch**

## Backend Status

| Check | Status | Details |
|---|---|---|
| Virtual environment | ✅ Ready | Located in `batc/batc-backend/venv/` |
| Dependencies installed | ✅ Done | Django, DRF, JWT, drf-spectacular, SQLite |
| Database migrations | ✅ Applied | 15 apps migrated; no pending migrations |
| Demo data seeded | ✅ Complete | 7 users, 13 farmers, programs, applications, inventory |
| Backend server | ✅ Ready | Run: `cd batc\batc-backend && call venv\Scripts\activate && python manage.py runserver` |

**Backend runs on:** `http://localhost:8000`  
**API docs:** `http://localhost:8000/api/docs/`

## Frontend Status

| Check | Status | Details |
|---|---|---|
| Node packages | ✅ Installed | 307 packages; 0 vulnerabilities |
| React + Vite | ✅ Ready | TypeScript strict mode enabled |
| Tailwind CSS | ✅ Configured | Design tokens embedded |
| Frontend server | ✅ Ready | Run: `cd batc\batc-frontend && npm run dev` |

**Frontend runs on:** `http://localhost:5173`

## Demo Credentials

| Role | Username | Password |
|---|---|---|
| Admin | admin | admin1234 |
| Staff | staff01 | staff1234 |
| Farmer | farmer01 | farmer1234 |

## Quick Start

### Option 1: Automated (Windows Batch)
```bash
START_BATC.bat
```
Starts both servers in separate windows automatically.

### Option 2: Manual (Control Each Server)

**Terminal 1 — Backend:**
```bash
cd batc\batc-backend
call venv\Scripts\activate
python manage.py runserver
```

**Terminal 2 — Frontend:**
```bash
cd batc\batc-frontend
npm run dev
```

Then open `http://localhost:5173` in browser.

## Useful Commands

```bash
# Backend
python manage.py seed_demo          # Repopulate demo data
python manage.py shell              # Interactive Python with Django context
python manage.py migrate            # Apply migrations
python manage.py makemigrations     # Create new migrations after model changes

# Frontend
npm run build                        # Build for production
npm run type-check                  # TypeScript strict check
npm run lint                         # ESLint check
```

## Documentation

Before making changes, check:
- [.instructions.md](.instructions.md) — Workspace rules & wiki references
- [wiki/project/overview.md](wiki/project/overview.md) — System overview
- [wiki/project/architecture-rules.md](wiki/project/architecture-rules.md) — Non-negotiables
- [wiki/project/known-bugs-and-issues.md](wiki/project/known-bugs-and-issues.md) — Known issues to fix

## Known Blockers

These bugs block demo (fix before showing stakeholders):
1. **#1**: `encoded_by` field conflation (farmer visibility)
2. **#2**: `FarmerViewSet.me` crashes on multi-farmer staff
3. **#3**: Login throttling not configured
4. **#7**: Cancelled apps cannot be resubmitted
5. **#10**: `db.sqlite3` in git (PII leak)

See [wiki/project/known-bugs-and-issues.md](wiki/project/known-bugs-and-issues.md) for details + fixes.

## Next Steps

1. **Test the system**: Start servers, log in as admin/staff01/farmer01
2. **Walk through a demo scenario**: Register farmer → apply → approve → distribute → confirm receipt
3. **Check [wiki/project/prototype-gaps.md](wiki/project/prototype-gaps.md)** for demo polish opportunities
4. **Review [wiki/project/known-bugs-and-issues.md](wiki/project/known-bugs-and-issues.md)** before adding features

---

**Setup completed:** 2026-05-12  
**Status:** Ready for development & demo  
**Last action:** Installed dependencies, seeded demo data, fixed START_BATC.bat paths
