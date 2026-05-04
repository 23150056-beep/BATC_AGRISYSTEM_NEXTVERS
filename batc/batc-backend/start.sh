#!/usr/bin/env bash
# Render startup script — runs on every deploy/restart.
# SQLite is ephemeral on Render free tier, so we always migrate + seed fresh.
set -e

echo "==> Running migrations..."
python manage.py migrate --noinput

echo "==> Seeding demo data..."
python manage.py seed_demo
python manage.py seed_rich_demo

echo "==> Starting gunicorn..."
exec gunicorn config.wsgi:application \
  --bind 0.0.0.0:"${PORT:-8000}" \
  --workers 2 \
  --timeout 120
