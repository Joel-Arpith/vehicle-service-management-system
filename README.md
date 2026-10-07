# Vehicle Service Centre Management System

Full-stack project plan lives in [`docs/vehicle_service_centre_mongodb_plan.md`](docs/vehicle_service_centre_mongodb_plan.md).
Agent/session context: [`HANDOFF.md`](HANDOFF.md).

## Stack

FastAPI + Motor + MongoDB (single-node replica set) API, with a Vite + React + TypeScript + Tailwind frontend in `web/`.

## Setup

```bash
# MongoDB as a service with replica set enabled (one-time)
brew tap mongodb/brew && brew install mongodb-community mongosh
echo -e "\nreplication:\n  replSetName: rs0" >> /opt/homebrew/etc/mongod.conf
brew services start mongodb-community
mongosh --eval "rs.initiate()"   # once; errors with 'already initialized' afterwards

# Python env via uv
uv venv --python 3.12 .venv
uv pip install -r requirements.txt

# Verify
python scripts/init_indexes.py
uvicorn app.main:app --reload    # health at http://localhost:8000/health, docs at /docs
```

## Hosting

Live: <https://autocare-web.pages.dev>

- **Frontend:** Cloudflare Pages (`web/`, `npx wrangler pages deploy` from `web/`, config in `web/wrangler.toml`).
- **API:** runs on this Mac and is reached through a Cloudflare quick tunnel. `web/functions/api/[[path]].ts`
  forwards `/api/*` to the tunnel URL it reads from KV (`api_origin`), so the browser stays same-origin.
- **`scripts/tunnel.sh`** starts MongoDB, uvicorn and `cloudflared`, publishes the new tunnel URL to KV, and
  exits if anything dies or the tunnel stops answering for 2 minutes.
- **`scripts/install-service.sh`** installs that as the launchd agent `com.autocare.tunnel` (starts at login,
  restarts on failure, `caffeinate -s` keeps the Mac awake on mains power). macOS blocks background agents from
  reading `~/Documents`, so it copies the backend to `~/Library/Application Support/AutoCare`.
  **Re-run it after changing backend code.** `scripts/install-service.sh remove` uninstalls.
- Logs: `~/Library/Logs/autocare/` (`run.log`, `api.log`, `tunnel.log`).
- The public API signs tokens with `JWT_SECRET` from `.env` (generated, gitignored), not the dev default.

Limits: the site only works while this Mac is on, awake and online. A quick tunnel's URL changes on every
restart (handled via KV, ~1–2 min gap). For a fixed hostname, use a named tunnel on a domain in the
Cloudflare account.
