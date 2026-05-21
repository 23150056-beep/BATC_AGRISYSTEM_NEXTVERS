---
title: Management Commands Reference
domain: project
type: overview
tags: [management, commands, cli, django, scripts, automation]
updated: 2026-05-12
---

# Management Commands Reference

Django management commands (`python manage.py <command>`) for BATC operations.

## Data & Seeding

### `seed_demo`
**Purpose:** Populate database with minimal demo data.

**Usage:**
```bash
python manage.py seed_demo
```

**Creates:**
- 7 users: admin + 3 staff + 3 farmers
- 13 farmers across 5 barangays with parcels
- 1 InventoryItem (Certified Rice Seeds)
- 2 StockBatches with different expiry dates
- 1 active Program with eligibility criteria
- 5 applications in mixed statuses
- 3 announcements (various target roles)

**Idempotent:** Safe to run multiple times; uses `get_or_create` to skip duplicates.

**When to use:** First-time setup, demo reset, testing.

---

### `seed_rich_demo`
**Purpose:** Populate with realistic/richer demo data (if it exists).

**Usage:**
```bash
python manage.py seed_rich_demo
```

**Likely creates:** More farmers, more programs, more applications in various states, more inventory batches.

**Check if exists:** Look in `apps/core/management/commands/seed_rich_demo.py`.

---

## Inventory Management

### `receive_stock` (if custom command exists)
**Purpose:** Record incoming inventory batch.

**Check:** `apps/inventory/management/commands/receive_stock.py`

**Usage** (example):
```bash
python manage.py receive_stock --item-id 1 --lot-number LOT-2026-A --qty 100 --expiry 2026-06-15
```

---

## User Management

### `createsuperuser` (Django built-in)
**Purpose:** Create a new admin user interactively.

**Usage:**
```bash
python manage.py createsuperuser
# Prompts: username, email, password
```

**Creates:** User with `role=ADMIN` (if custom User model).

---

## Development & Maintenance

### `migrate`
**Purpose:** Apply pending database migrations.

**Usage:**
```bash
python manage.py migrate
# Or specific app:
python manage.py migrate farmers
```

**When to use:** After git pull, after creating new migrations.

---

### `makemigrations`
**Purpose:** Create new migrations based on model changes.

**Usage:**
```bash
python manage.py makemigrations
# Or specific app:
python manage.py makemigrations farmers
```

**When to use:** After editing `models.py`, before committing.

---

### `shell`
**Purpose:** Interactive Python REPL with Django context.

**Usage:**
```bash
python manage.py shell
```

**Example session:**
```python
from apps.farmers.models import Farmer
farmer = Farmer.objects.first()
print(farmer.first_name, farmer.mobile_number)
```

---

### `runserver`
**Purpose:** Start development server.

**Usage:**
```bash
python manage.py runserver
# Or custom port:
python manage.py runserver 0.0.0.0:9000
```

**Runs on:** `http://localhost:8000` (default)

---

## Testing & Debugging

### `test` (Django built-in)
**Purpose:** Run test suite (when tests are added).

**Usage:**
```bash
python manage.py test
# Or specific app:
python manage.py test apps.farmers
```

**Note:** Prototype has no tests yet; this will be populated in Phase 7.

---

### `dbshell`
**Purpose:** Open database shell (SQLite CLI).

**Usage:**
```bash
python manage.py dbshell
```

**Example SQLite query:**
```sql
SELECT COUNT(*) FROM farmers_farmer;
SELECT * FROM applications_interventionapplication;
```

---

## Utility Commands

### `clearsessions` (Django built-in)
**Purpose:** Clear expired session data (if using session authentication).

**Usage:**
```bash
python manage.py clearsessions
```

**Note:** BATC uses JWT; sessions are not used.

---

### `collectstatic` (Django built-in)
**Purpose:** Collect static files for production.

**Usage:**
```bash
python manage.py collectstatic --noinput
```

**Note:** Not needed for development (Vite handles frontend statics).

---

## Custom Commands (To Be Implemented)

These don't exist yet but are planned:

### `reset_demo` (Phase 7)
**Purpose:** Destructively reset demo data and reseed.

**Proposed usage:**
```bash
python manage.py reset_demo --execute
# --execute required to prevent accidents
# Deletes all users, farmers, applications, distributions, inventory
# Then re-seeds fresh demo data
```

**Benefit:** One command to reset state mid-demo.

---

### `fix_bautista` (Phase 6 Critical Fix)
**Purpose:** One-off fix for specific data corruption (currently ad-hoc script).

**Current:** `batc-backend/fix_bautista.py` (not a management command)

**Should be:** `apps/core/management/commands/fix_bautista.py`

**Proposed usage:**
```bash
python manage.py fix_bautista --execute --farmer-id 123 --program-id 5
# Dry-run: shows what would happen
# --execute: actually applies changes
```

---

### `audit_inventory` (Future)
**Purpose:** Check inventory consistency (no negative qty, FEFO order, etc.).

**Proposed usage:**
```bash
python manage.py audit_inventory --fix
```

---

## Common Workflows

### Fresh Start
```bash
rm db.sqlite3                  # Delete old database
python manage.py migrate       # Create new database
python manage.py seed_demo     # Populate demo data
python manage.py runserver     # Start server
```

### Add a New Model
```bash
# Edit apps/farmers/models.py
python manage.py makemigrations farmers
python manage.py migrate
python manage.py runserver
```

### Debug a Query
```bash
python manage.py shell
>>> from apps.farmers.models import Farmer
>>> farmer = Farmer.objects.filter(mobile_number="09171234567").first()
>>> farmer.program_applications.all()
```

### Reset Demo Before Showing Reviewer
```bash
rm db.sqlite3
python manage.py migrate
python manage.py seed_demo
python manage.py runserver
# Start frontend in another terminal: npm run dev
```

---

## Troubleshooting

| Error | Fix |
|---|---|
| `CommandError: App 'farmers' doesn't have a 'migrations' folder` | Create `apps/farmers/migrations/__init__.py` |
| `IntegrityError: UNIQUE constraint failed` | Likely `seed_demo` called twice; run `rm db.sqlite3 && migrate && seed_demo` |
| `No such table` | Migration not applied; run `python manage.py migrate` |
| `ModuleNotFoundError` | Virtualenv not activated or dependency not installed; check `.venv/bin/activate` or `pip install -r requirements/local.txt` |

---

**Updated:** 2026-05-12  
**Source:** Django CLI + BATC custom commands in `batc-backend/apps/*/management/commands/`
