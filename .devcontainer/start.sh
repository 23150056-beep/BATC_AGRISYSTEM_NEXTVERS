#!/usr/bin/env bash
# Runs every time the Codespace starts (including after resume/rebuild).
# Migrates the DB, seeds demo data, then starts both dev servers.

ROOT=$(pwd)
BACKEND="$ROOT/batc/batc-backend"
FRONTEND="$ROOT/batc/batc-frontend"

echo "============================================"
echo "  BATC — Starting servers"
echo "============================================"

# ── Database ───────────────────────────────────
cd "$BACKEND"
source venv/bin/activate

echo ""
echo ">>> Migrating database..."
python manage.py migrate --noinput

echo ">>> Seeding demo accounts and data..."
python manage.py seed_demo
python manage.py seed_rich_demo

# ── Django dev server ──────────────────────────
# Bind to 0.0.0.0 so Codespaces port forwarding can reach it.
echo ""
echo ">>> Starting Django on port 8000..."
nohup python manage.py runserver 0.0.0.0:8000 > /tmp/django.log 2>&1 &
echo "    PID $! — logs: /tmp/django.log"

# ── Vite dev server ────────────────────────────
# --host binds Vite to 0.0.0.0 (required for Codespaces port forwarding).
echo ""
echo ">>> Starting Vite on port 5173..."
cd "$FRONTEND"
nohup npm run dev -- --host > /tmp/vite.log 2>&1 &
echo "    PID $! — logs: /tmp/vite.log"

echo ""
echo "============================================"
echo "  Both servers are running in the background."
echo "  Django log : /tmp/django.log"
echo "  Vite log   : /tmp/vite.log"
echo ""
echo "  Demo accounts:"
echo "    admin   / admin1234"
echo "    staff01 / staff1234"
echo "    farmer01/ farmer1234"
echo "============================================"
