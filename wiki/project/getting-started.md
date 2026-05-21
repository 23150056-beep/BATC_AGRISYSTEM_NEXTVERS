---
title: Getting Started — Developer Setup Guide
domain: project
type: overview
tags: [setup, getting-started, development, installation, local-dev]
updated: 2026-05-12
---

# Getting Started — Developer Setup Guide

This page walks you through cloning, installing, and running BATC locally for the first time.

## Prerequisites

- **Python 3.10+** (`python --version`)
- **Node.js 18+** (`node --version`)
- **pip** (comes with Python)
- **npm** (comes with Node.js)
- **Git** (`git --version`)

## Backend Setup (Django + SQLite)

### 1. Clone & Navigate
```bash
git clone <repo-url> agri_sys_next_ver
cd agri_sys_next_ver/batc-backend
```

### 2. Create Virtual Environment
```bash
python -m venv venv
# Windows:
venv\Scripts\activate
# macOS/Linux:
source venv/bin/activate
```

You should see `(venv)` prefix in terminal now.

### 3. Install Dependencies
```bash
pip install -r requirements/local.txt
```

This installs:
- Django 4.x + DRF
- SimpleJWT (for auth)
- drf-spectacular (for OpenAPI)
- SQLite driver (built-in)

### 4. Database Migration
```bash
python manage.py migrate
```

This creates `db.sqlite3` with all tables.

### 5. Populate Demo Data
```bash
python manage.py seed_demo
```

Creates:
- 7 demo users (admin, 3 staff, 3 farmers)
- 13 farmers across 5 barangays
- 1 program with eligibility criteria
- 20 inventory batches
- 5 applications in mixed statuses
- 3 announcements

### 6. Run Backend Server
```bash
python manage.py runserver
```

Backend is now live at `http://localhost:8000`.

**Test it:** Open `http://localhost:8000/api/v1/auth/login/` (you should see JSON form, not an error).

---

## Frontend Setup (React + Vite)

### 1. Navigate to Frontend Folder
```bash
# From agri_sys_next_ver (new terminal)
cd batc-frontend
```

### 2. Install Dependencies
```bash
npm install
```

Installs:
- React 19 + Vite
- TanStack Query + Zustand (state)
- React Hook Form + Zod (forms)
- Tailwind CSS + Lucide (UI)
- Axios (HTTP client)

### 3. Run Dev Server
```bash
npm run dev
```

You'll see:
```
VITE v5.x.x  ready in xxx ms

➜  Local:   http://localhost:5173/
➜  press h + enter to show help
```

### 4. Open in Browser
Navigate to `http://localhost:5173`.

You should see a login page.

---

## Demo Walkthrough

### Step 1: Log In as Admin
- **URL:** `http://localhost:5173`
- **Username:** `admin`
- **Password:** `admin1234`

You should land on `/admin/dashboard` with stats cards showing:
- Total Farmers: 13
- Active Programs: 1
- Pending Applications: 1 (or similar)

### Step 2: Create a New Program (Optional)
- Click **Programs** in the sidebar
- Click **+ New Program**
- Fill in form (name, dates, items, target barangays)
- Add eligibility criteria (e.g., farm_area >= 0.5)
- Click **Save**

### Step 3: Log Out & Log In as Staff
- Click profile menu (top-right) → Logout
- **Username:** `staff01`
- **Password:** `staff1234`

You should land on `/staff/dashboard` with pending applications.

### Step 4: Log In as Farmer & Apply
- Log out
- **Username:** `farmer01`
- **Password:** `farmer1234`

You should land on `/app/dashboard` showing:
- Available programs
- My applications (if any)
- My active claims (distributions)

- Click **Programs** → click a program → **Apply Now**
- Confirm eligibility check passes, app is submitted

### Step 5: Approve & Distribute (Back as Staff)
- Log out → log in as `staff01`
- Click **Applications** → find farmer01's application
- Click **Approve** → distribution is created automatically
- Click **Update Status** → mark as **Dispatched**, then **Delivered**
- Watch inventory stock decrease

### Step 6: Farmer Confirms Receipt
- Log out → log in as `farmer01`
- Click **Claims** → see the delivered distribution
- Click **Confirm Receipt** → status updates

---

## Common Commands

### Backend

| Command | Purpose |
|---|---|
| `python manage.py runserver` | Start dev server on 8000 |
| `python manage.py seed_demo` | Populate demo data |
| `python manage.py migrate` | Run migrations |
| `python manage.py makemigrations [app]` | Create new migrations |
| `python manage.py shell` | Interactive Python shell with Django context |
| `python manage.py createsuperuser` | Create a new user (manual) |

### Frontend

| Command | Purpose |
|---|---|
| `npm run dev` | Start Vite dev server on 5173 |
| `npm run build` | Build for production (dist/) |
| `npm run preview` | Preview production build locally |
| `npm run lint` | Check TypeScript + ESLint |
| `npm run type-check` | TypeScript strict check |

---

## API Documentation

Once backend is running:

- **OpenAPI schema:** `http://localhost:8000/api/schema/`
- **Swagger UI:** `http://localhost:8000/api/docs/`
- **ReDoc:** `http://localhost:8000/api/redoc/`

All endpoints are documented with request/response schemas.

---

## Environment Variables

### Backend (`.env`)

Create `batc-backend/.env`:
```bash
DEBUG=True
SECRET_KEY=your-secret-key-here
ALLOWED_HOSTS=localhost,127.0.0.1
CORS_ALLOWED_ORIGINS=http://localhost:5173
```

The backend reads from `.env` using `django-environ`.

### Frontend

Frontend is configured in `vite.config.ts` to proxy API calls to `http://localhost:8000`.

---

## Troubleshooting

### Backend won't start: "ModuleNotFoundError: No module named 'django'"
**Fix:** 
- Confirm virtualenv is activated: `(venv)` prefix visible?
- Reinstall: `pip install -r requirements/local.txt`

### Frontend won't start: "command not found: npm"
**Fix:** 
- Node.js not installed: https://nodejs.org/ → download LTS
- Reinstall: `npm install`

### Login fails: "Invalid credentials"
**Fix:** 
- Check credentials: admin / admin1234 (exactly)
- Ensure `python manage.py seed_demo` was run
- Check backend is running: `http://localhost:8000/api/v1/auth/login/` returns JSON

### Migrations fail: "table already exists"
**Fix:** 
- Fresh start: `rm db.sqlite3` then `python manage.py migrate` then `python manage.py seed_demo`

### CORS error in frontend console: "Access to XMLHttpRequest blocked"
**Fix:** 
- Check `CORS_ALLOWED_ORIGINS` in backend `.env` includes `http://localhost:5173`
- Restart backend: `python manage.py runserver`

---

## Project Structure Reference

See [[build-progress-phases-0-6.md]] for full folder structure.

**Key folders:**
- `batc-backend/apps/` — Django apps (farmers, programs, applications, distribution, etc.)
- `batc-backend/config/` — Django settings, URL routing
- `batc-frontend/src/features/` — React feature modules (farmers, programs, applications, etc.)
- `batc-frontend/src/pages/` — Page components (admin/, staff/, client/ routes)
- `batc-frontend/src/components/` — Shared UI components

---

## Next Steps

1. **Read the codebase** — start with [project/overview.md](project/overview.md)
2. **Understand the models** — see [[project/build-progress-phases-0-6.md]] for model details
3. **Check for bugs** — review [[known-bugs-and-issues.md]] before changing code
4. **Follow architecture rules** — see [[architecture-rules.md]] for non-negotiables
5. **Make a feature branch** — `git checkout -b feature/your-feature-name`

---

**Updated:** 2026-05-12  
**Questions?** Check [[project/overview.md]] or grep for "Getting started" in other pages.
