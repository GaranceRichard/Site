#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"

BACKEND_DIR="$ROOT_DIR/backend"
FRONTEND_DIR="$ROOT_DIR/frontend"

BACKEND_LOG="$ROOT_DIR/backend-server.log"
FRONTEND_LOG="$ROOT_DIR/frontend-server.log"

BACKEND_PID=""
FRONTEND_PID=""

cleanup() {
  if [[ -n "${FRONTEND_PID}" ]] && kill -0 "${FRONTEND_PID}" 2>/dev/null; then
    kill "${FRONTEND_PID}" || true
  fi
  if [[ -n "${BACKEND_PID}" ]] && kill -0 "${BACKEND_PID}" 2>/dev/null; then
    kill "${BACKEND_PID}" || true
  fi
}
trap cleanup EXIT

echo "==> Backend tests + coverage"
cd "$BACKEND_DIR"
python -m coverage run manage.py test
python -m coverage report --fail-under=80

echo "==> Frontend lint + unit tests + coverage + build"
cd "$FRONTEND_DIR"
npm run lint
npm run test
npx vitest run --coverage \
  --coverage.thresholds.lines=80 \
  --coverage.thresholds.branches=80 \
  --coverage.thresholds.functions=80 \
  --coverage.thresholds.statements=80
npm run build

echo "==> E2E setup"
cd "$ROOT_DIR"
export DJANGO_ENV=development
export DJANGO_DEBUG=false
export DJANGO_ENABLE_JWT=true
export DJANGO_E2E_MODE=true

if [[ -f "$FRONTEND_DIR/.env.e2e.local" ]]; then
  while IFS='=' read -r key value; do
    [[ -z "$key" || "$key" =~ ^# ]] && continue
    export "$key"="${value}"
  done < "$FRONTEND_DIR/.env.e2e.local"
fi

: "${E2E_ADMIN_USER:?E2E_ADMIN_USER must be set in frontend/.env.e2e.local}"
: "${E2E_ADMIN_PASS:?E2E_ADMIN_PASS must be set in frontend/.env.e2e.local}"

echo "==> Start backend server"
cd "$BACKEND_DIR"
python manage.py migrate
python - <<'PY'
import os
os.environ.setdefault("DJANGO_SETTINGS_MODULE", "config.settings")
import django
django.setup()
from django.contrib.auth import get_user_model

user, _ = get_user_model().objects.get_or_create(
    username=os.environ["E2E_ADMIN_USER"],
    defaults={"is_staff": True, "is_superuser": True},
)
user.is_staff = True
user.is_superuser = True
user.set_password(os.environ["E2E_ADMIN_PASS"])
user.save()
print("E2E admin ready:", user.username)
PY
nohup python manage.py runserver 127.0.0.1:8000 > "$BACKEND_LOG" 2>&1 &
BACKEND_PID=$!

echo "==> Start frontend server"
cd "$FRONTEND_DIR"
nohup npm run start -- --hostname 127.0.0.1 --port 3000 > "$FRONTEND_LOG" 2>&1 &
FRONTEND_PID=$!

echo "==> Wait for servers"
python - <<'PY'
import time
import urllib.request

def wait(url, timeout=60):
    start = time.time()
    while time.time() - start < timeout:
        try:
            with urllib.request.urlopen(url, timeout=2) as r:
                if r.status == 200:
                    return True
        except Exception:
            time.sleep(2)
    raise SystemExit(f"Server not ready: {url}")

wait("http://127.0.0.1:8000/api/health")
wait("http://127.0.0.1:3000")
print("Servers are up")
PY

echo "==> E2E tests"
cd "$FRONTEND_DIR"
npm run test:e2e
