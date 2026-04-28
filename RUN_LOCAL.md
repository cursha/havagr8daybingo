# Run Locally (Frontend + Local Python Backend)

This project has **two** runnable pieces:

- `app/backend/`  — Python / FastAPI (runs on **http://localhost:8000**)
- `app/frontend/` — React + Vite (runs on **http://localhost:3000** and proxies `/api/*` to the backend)

Because `vite.config.ts` already contains a dev proxy for `/api` → `http://localhost:8000`, you do **not** need to set any env vars or touch CORS. Just start both services.

---

## 1. Start the backend (terminal 1)

```bash
cd app/backend

# Create/activate a virtualenv (first time only)
python3 -m venv .venv
source .venv/bin/activate

# Install dependencies (first time only)
pip install -r requirements.txt

# Run the API
uvicorn main:app --reload --host 0.0.0.0 --port 8000
```

The backend is now live at `http://localhost:8000`. Quick health check:

```bash
curl http://localhost:8000/health
```

---

## 2. Start the frontend (terminal 2)

```bash
cd app/frontend

# Install deps (first time only)
pnpm install

# Start dev server
pnpm run dev
```

Open **http://localhost:3000** in your browser. Any request to `/api/v1/...` is transparently proxied to `http://localhost:8000`.

---

## 3. Test registration end-to-end

1. Navigate to `http://localhost:3000/register`.
2. Fill in email + password and submit.
3. You should land on the authenticated home page.
4. In terminal 1 you should see the `POST /api/v1/auth/register` request logged by uvicorn.

If you want to see the raw API in action:

```bash
curl -X POST http://localhost:8000/api/v1/auth/register \
  -H 'Content-Type: application/json' \
  -d '{"email":"test@example.com","password":"secret123"}'
```

---

## How API URL resolution works

`app/frontend/src/lib/config.ts` resolves `API_BASE_URL` in this order:

1. **Runtime config** from `/api/config` — used on deployed Lambda only.
2. **`VITE_API_BASE_URL`** — optional build-time env var. Leave it **unset** for local dev.
3. **Empty string (`""`)** — the default fallback. The frontend then issues **same-origin relative URLs** like `/api/v1/auth/register`, which the Vite proxy forwards to `localhost:8000`.

The config module also auto-rejects unresolved template placeholders (e.g. `https://$$backend_domain$$`) and falls back to the empty-string same-origin mode, so a mis-configured deploy environment cannot break the app.

---

## Troubleshooting

| Symptom | Fix |
|---|---|
| `ECONNREFUSED` when calling `/api/...` | Backend not running. Start uvicorn on port 8000. |
| CORS error in browser console | You bypassed the Vite proxy by setting `VITE_API_BASE_URL` to a different host. Either unset it, or set it to exactly `http://localhost:8000` (backend already allows all origins via `allow_origin_regex=r".*"`). |
| Port 8000 already in use | Run `uvicorn main:app --reload --port 8001` and update `vite.config.ts`'s proxy `target` to `http://localhost:8001`. |
| Port 3000 already in use | Run `VITE_PORT=3001 pnpm run dev`. |
| `500 Internal Server Error` on `/api/v1/auth/register` in the browser, but the backend is reachable | (a) Re-install deps — the `email-validator` package is required by `EmailStr` and must be present: `pip install -r requirements.txt`. (b) Restart uvicorn after installing. (c) Confirm the frontend is talking to your **local** backend and not a stale deployed one — open DevTools → Network, click the failing request, and check the request URL host. It should be `localhost:3000` (proxied) or `localhost:8000`. If it points to a deployed domain, unset `VITE_API_BASE_URL` and restart `pnpm run dev`. |
| Sign up fails on a **deployed** site | The deployment must be re-deployed after the `email-validator` requirement was added, otherwise the auth router fails to import and `/api/v1/auth/register` returns 404/500. Redeploy the backend so it installs the updated `requirements.txt`. |

---

## Database

The backend uses **Neon Postgres** (serverless Postgres in the cloud) via SQLAlchemy async with the `asyncpg` driver. The connection string is read from the `DATABASE_URL` environment variable, for example:

```
DATABASE_URL=postgresql+asyncpg://<user>:<password>@<host>/<db>?ssl=require
```

- Tables are auto-created on backend startup by `DatabaseManager.create_tables()` — no manual migration step is required for local dev.
- The `users` table in particular is created/patched by the auth module's migration on startup, so a fresh Neon database works out of the box as long as `DATABASE_URL` is set.
- If you want to point local dev at a different Postgres instance, just export your own `DATABASE_URL` before starting uvicorn:
  ```bash
  export DATABASE_URL='postgresql+asyncpg://user:pass@host/db?ssl=require'
  uvicorn main:app --reload --port 8000
  ```