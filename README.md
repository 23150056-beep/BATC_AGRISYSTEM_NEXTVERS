# BATC Agricultural Management System

**Centralized Distribution and Allocation Management System for Government
Agricultural Interventions with Integrated Farmer Registration for the
Bauang Agricultural Trade Center** (La Union, Philippines) — prototype.

**Stack:** React + Vite (frontend) · Django REST Framework (backend) · SQLite

---

## Purpose

The Bauang Agricultural Trade Center (BATC) distributes **government
agricultural interventions** — certified seeds, fertilizer, and equipment — to
registered farmers in Bauang, La Union. These operations are traditionally
handled through paper records and spreadsheets, which causes recurring
problems:

- Farmer records are scattered and difficult to search.
- There is no reliable way to verify which farmers are **eligible** for an
  intervention.
- Stock levels and expiry dates are hard to track, leading to wasted supplies.
- There is no audit trail to prove that distributions were carried out fairly.

**BATC solves this by replacing the manual process with a single web-based
system.** It centralizes farmer registration, defines interventions with
automatic eligibility rules, tracks inventory using a First-Expiry-First-Out
(FEFO) model, manages the full distribution lifecycle, and records every action
in an audit log. The goal is faster, fairer, and fully accountable distribution
of government agricultural support — with farmers able to register and track
their claims online.

The system serves **three types of users**:

- **Administrators** — manage users, design intervention programs, oversee
  inventory, and view analytics.
- **Staff** — register farmers, review applications, and process distributions.
- **Farmers (Clients)** — register themselves, apply for programs, and track
  their claims from any device.

---

## Features

A brief documentation of all the features in the system, grouped by area.

### Public / Onboarding

- **Landing page** — a public homepage describing the trade center, its
  programs, and contact information.
- **Farmer self-registration** — a 5-step registration wizard (Account →
  Personal Info → Address → Farm & Consent → Verification). Farmers create
  their own account and are logged in automatically on completion.
- **Optional document verification** — farmers may upload a 4Ps, PWD, or NCIP
  certificate; verified farmers can receive priority for certain programs.
- **Data Privacy Act consent** — a required consent step (not pre-checked) with
  the consent timestamp recorded.
- **Secure login** — JWT-based authentication with automatic token refresh.

### Administrator

- **Dashboard** — live statistics (total farmers, active programs, pending
  applications, distributions today, low-stock items) that auto-refresh.
- **User management** — create, edit, archive, and restore user accounts;
  assign roles; reset passwords.
- **Farmer management** — view, search, and manage the full farmer registry.
- **Program management** — create intervention programs, define the items
  distributed, target barangays, and set **eligibility criteria**; move
  programs through their lifecycle (Draft → Active → Suspended → Completed).
- **Inventory management** — manage inventory items and **FEFO stock batches**,
  receive and adjust stock, and view a full stock-movement ledger.
- **Application review** — review, approve, reject, or cancel farmer
  applications.
- **Distribution management** — oversee distributions through their status
  lifecycle.
- **Announcements** — publish announcements targeted to specific user roles.
- **Reports & analytics** — an analytics dashboard with KPI cards, trend
  charts, status breakdowns, a date-range filter, and CSV export.
- **Feedback management** — review and resolve farmer feedback.

### Staff

- **Dashboard** — daily operational summary (pending applications, scheduled
  and delivered distributions).
- **Staff-assisted farmer registration** — register farmers directly for those
  who need assistance.
- **Application processing** — approve, reject, or cancel applications.
- **Distribution processing** — create distributions and update their status
  (Scheduled, Delivered, etc.).
- **Inventory and programs** — read-only access to inventory and programs.
- **Reports** — generate farmer and distribution reports.
- **Feedback** — view farmer feedback.

### Farmer (Client Portal)

- **Responsive portal** — mobile-first design with bottom tab navigation on
  phones and a sidebar on desktop.
- **Home** — shows the farmer's next distribution and the latest announcements.
- **Programs** — browse active intervention programs and apply with one tap.
- **My Applications** — track every application with a clear status indicator.
- **Claims** — view distributions and their delivery status.
- **Feedback** — submit a star rating and comment after a distribution.
- **Profile** — view personal and farm information.

### System-Wide Features

- **Role-based access control** — each role only sees and can do what it is
  permitted to, enforced on both the front end and back end.
- **Eligibility engine** — automatically matches farmers to programs based on
  configurable criteria (e.g., livelihood type, 4Ps status).
- **FEFO inventory** — stock closest to expiry is always released first;
  quantities are updated only through a stock-movement ledger.
- **Atomic distribution workflow** — approval, distribution creation, stock
  release, and audit logging run in all-or-nothing database transactions.
- **In-app notifications** — every role receives a notification bell with
  alerts for relevant events.
- **Command palette** — press **Ctrl+K** anywhere to quickly navigate the app.
- **Audit log** — every significant action is recorded with the user, time,
  and details.

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
- This is a **prototype**. It uses SQLite and has no background task queue,
  offline support, or SMS notifications. A future production version would
  add a production database, deployment hardening, and farmer SMS alerts.
