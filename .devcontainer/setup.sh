#!/usr/bin/env bash
# Runs ONCE when the Codespace is first created.
# Sets up the Python venv, generates .env, and installs npm deps.
set -e

ROOT=$(pwd)   # postCreateCommand runs from the workspace root
BACKEND="$ROOT/batc/batc-backend"
FRONTEND="$ROOT/batc/batc-frontend"

echo "============================================"
echo "  BATC — Codespace setup"
echo "============================================"

# ── Backend ────────────────────────────────────
echo ""
echo ">>> [1/3] Creating Python virtual environment..."
cd "$BACKEND"
python -m venv venv
source venv/bin/activate
pip install --quiet --upgrade pip
pip install --quiet -r requirements/local.txt
echo "    Done."

# Generate .env (it's gitignored, so we create it fresh each Codespace)
if [ ! -f .env ]; then
  echo ""
  echo ">>> [2/3] Generating .env for Codespaces..."
  SECRET=$(python -c "import secrets; print(secrets.token_urlsafe(50))")
  cat > .env <<ENVEOF
SECRET_KEY=${SECRET}
DEBUG=True
CRYPTOGRAPHY_KEY=
ALLOWED_HOSTS=*
CORS_ALLOWED_ORIGINS=http://localhost:5173
ENVEOF
  echo "    .env written."
else
  echo ">>> [2/3] .env already exists — skipping."
fi

# ── Frontend ───────────────────────────────────
echo ""
echo ">>> [3/3] Installing npm dependencies..."
cd "$FRONTEND"
npm ci --silent
echo "    Done."

echo ""
echo "============================================"
echo "  Setup complete! The servers will start"
echo "  automatically. Look for port 5173 to open."
echo "============================================"
