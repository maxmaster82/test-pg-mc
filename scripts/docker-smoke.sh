#!/usr/bin/env sh
# Builds the image, starts a container and verifies it serves the SPA (root + deep link) and is healthy.
set -eu

IMAGE="${IMAGE:-ticket-admin-portal:smoke}"
PORT="${PORT:-8089}"
NAME="ticket-admin-smoke-$$"

cleanup() { docker rm -f "$NAME" >/dev/null 2>&1 || true; }
trap cleanup EXIT

[ "${SKIP_BUILD:-0}" = "1" ] || docker build -t "$IMAGE" .
docker run -d --name "$NAME" -p "$PORT:8080" "$IMAGE" >/dev/null

echo "Waiting for container health..."
i=0
until [ "$(docker inspect -f '{{.State.Health.Status}}' "$NAME")" = "healthy" ]; do
  i=$((i + 1))
  if [ "$i" -gt 30 ]; then echo "Container did not become healthy"; docker logs "$NAME"; exit 1; fi
  sleep 1
done

check() {
  path="$1"; expected="$2"
  body="$(curl -fsS "http://localhost:$PORT$path")" || { echo "FAIL $path (HTTP error)"; exit 1; }
  echo "$body" | grep -q "$expected" || { echo "FAIL $path (missing '$expected')"; exit 1; }
  echo "ok   $path"
}

check / '<div id="app">'
check /tickets/123 '<div id="app">'
check /mockServiceWorker.js 'Mock Service Worker'
check /healthz 'ok'

user="$(docker exec "$NAME" id -u)"
[ "$user" != "0" ] || { echo "FAIL container runs as root"; exit 1; }
echo "ok   runs as non-root user (uid $user)"
echo "Docker smoke check passed."
