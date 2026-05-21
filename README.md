# BATC Agricultural Management System

Centralized Distribution and Allocation Management System for the
Bauang Agricultural Trade Center (La Union, Philippines) — prototype.

**Stack:** React + Vite (frontend) · Django REST Framework (backend) · SQLite

---

## Requirements

Install these before setup:

- **Python 3.11+** — https://www.python.org/downloads/
- **Node.js 18+** (includes npm) — https://nodejs.org/

---

## Setup

The project has two parts: `batc/batc-backend` and `batc/batc-frontend`.
Set up the backend first.

### 1. Backend (Django)

Open a terminal in the project root and run:

```bat
cd batc\batc-backend

REM Create and activate a virtual environment
python -m venv venv
call venv\Scripts\activate

REM Install dependencies
pip install -r requirements\local.txt

REM Create the .env file from the template
copy .env.example .env
```

Open `batc\batc-backend\.env` and set `SECRET_KEY` to any long random
string. The other values can be left as-is for local use.

Then create the database and demo data:

```bat
python manage.py migrate
python manage.py seed_demo
```

### 2. Frontend (React + Vite)

Open a **second** terminal in the project root:

```bat
cd batc\batc-frontend
npm install
```

---

## Running the system

### Option A — automated (Windows)

From the project root, double-click **`START_BATC.bat`** (or run it in a
terminal). It opens both servers in separate windows.

### Option B — manual

**Terminal 1 — backend:**
```bat
cd batc\batc-backend
call venv\Scripts\activate
python manage.py runserver
```

**Terminal 2 — frontend:**
```bat
cd batc\batc-frontend
npm run dev
```

Then open **http://localhost:5173** in your browser.

- Frontend: http://localhost:5173
- Backend API: http://localhost:8000
- API docs: http://localhost:8000/api/docs/

---

## Demo accounts

| Role   | Username | Password   |
|--------|----------|------------|
| Admin  | admin    | admin1234  |
| Staff  | staff01  | staff1234  |
| Farmer | farmer01 | farmer1234 |

---

## Why TypeScript?

The frontend is written in **TypeScript** (a typed superset of JavaScript)
rather than plain JavaScript, for a few practical reasons:

- **Catches errors before the app runs** — mismatched fields, wrong
  function arguments, and typos are flagged in the editor instead of
  causing crashes during a demo.
- **Fits a form-heavy system** — BATC has complex registration,
  eligibility, and inventory (FEFO) logic; typed data shapes keep that
  logic consistent.
- **Keeps frontend and backend in sync** — API responses from Django are
  given defined types, so any drift between the two is caught early.
- **Better tooling** — reliable autocomplete, safe renaming, and
  go-to-definition across a large component codebase.

TypeScript compiles down to plain JavaScript before the browser runs it,
so nothing is lost — it is simply a stricter, safer way to write it.

## Notes

- `.env`, the SQLite database, `venv/`, and `node_modules/` are not
  included in the repository — they are created by the steps above.
- Re-run `python manage.py seed_demo` at any time to reset the demo data.
