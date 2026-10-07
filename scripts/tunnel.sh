#!/bin/bash
# Serves the AutoCare API to https://autocare-web.pages.dev through a Cloudflare quick tunnel.
#
#   scripts/tunnel.sh            run in the foreground (Ctrl-C stops everything)
#   launchd agent                com.autocare.tunnel keeps it running across logins (see README)
#
# 1. MongoDB (brew service) -> 2. uvicorn on 127.0.0.1:8000 -> 3. cloudflared quick tunnel
# 4. the tunnel's URL is written to the Pages site's KV (`api_origin`), so the site finds it
#    without a redeploy. Exits if any piece dies or the tunnel stops answering; launchd restarts it.
#
# ponytail: quick tunnel = random *.trycloudflare.com URL per start, no account domain needed.
# Upgrade path: a named tunnel on a domain in this Cloudflare account gives a fixed hostname.
set -u
export PATH="/opt/homebrew/bin:/usr/local/bin:/usr/bin:/bin:$PATH"
cd "$(dirname "$0")/.."

KV_NAMESPACE=1d7498a9cf174a0a89fb97703871e3ca
LOGS="$HOME/Library/Logs/autocare"
mkdir -p "$LOGS"
log() { echo "$(date '+%F %T') $*"; }

# A public API must not sign tokens with the repo's default secret: anyone could forge a
# manager login. Generate one once and keep it in .env (gitignored).
if ! grep -qs '^JWT_SECRET=' .env; then
  echo "JWT_SECRET=$(openssl rand -hex 32)" >> .env
  log "generated JWT_SECRET in .env"
fi
set -a; . ./.env; set +a

brew services start mongodb-community >/dev/null 2>&1 || true
for _ in $(seq 30); do mongosh --quiet --eval 'db.runCommand({ping:1}).ok' >/dev/null 2>&1 && break; sleep 1; done

API_PID=""; TUN_PID=""
cleanup() { [ -n "$TUN_PID" ] && kill "$TUN_PID" 2>/dev/null; [ -n "$API_PID" ] && kill "$API_PID" 2>/dev/null; }
trap cleanup EXIT INT TERM

# Free the port if a previous run left uvicorn behind.
lsof -tiTCP:8000 -sTCP:LISTEN | xargs kill 2>/dev/null; sleep 1
.venv/bin/python -m uvicorn app.main:app --host 127.0.0.1 --port 8000 >>"$LOGS/api.log" 2>&1 &
API_PID=$!
for _ in $(seq 30); do curl -sf http://127.0.0.1:8000/docs >/dev/null && break; sleep 1; done
curl -sf http://127.0.0.1:8000/docs >/dev/null || { log "API did not start; see $LOGS/api.log"; exit 1; }
log "API up on 127.0.0.1:8000"

: > "$LOGS/tunnel.log"
cloudflared tunnel --no-autoupdate --url http://127.0.0.1:8000 >>"$LOGS/tunnel.log" 2>&1 &
TUN_PID=$!
URL=""
for _ in $(seq 60); do
  URL=$(grep -oE 'https://[a-z0-9-]+\.trycloudflare\.com' "$LOGS/tunnel.log" | head -1)
  [ -n "$URL" ] && break; sleep 1
done
[ -n "$URL" ] || { log "no tunnel URL; see $LOGS/tunnel.log"; exit 1; }
for _ in $(seq 60); do curl -sf "$URL/docs" >/dev/null && break; sleep 2; done
curl -sf "$URL/docs" >/dev/null || { log "tunnel $URL not answering"; exit 1; }
log "tunnel up: $URL"

npx --yes wrangler kv key put --namespace-id="$KV_NAMESPACE" api_origin "$URL" --remote >>"$LOGS/wrangler.log" 2>&1 \
  || { log "could not publish URL to KV; see $LOGS/wrangler.log"; exit 1; }
log "published api_origin=$URL"

# Watchdog: stay up while both processes live and the tunnel answers.
fails=0
while kill -0 "$API_PID" 2>/dev/null && kill -0 "$TUN_PID" 2>/dev/null; do
  sleep 30
  if curl -sf -m 10 "$URL/docs" >/dev/null; then fails=0; else fails=$((fails + 1)); fi
  [ "$fails" -ge 4 ] && { log "tunnel unreachable for 2 min; restarting"; exit 1; }
done
log "a process exited; restarting"
exit 1
