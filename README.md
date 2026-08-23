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
