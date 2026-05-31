# Environment variables (local development)

## Which file to use

| File | Purpose |
|------|---------|
| **`.env`** (repo root) | Primary local config for `npx netlify dev` — Netlify injects these into Functions and the Vite dev server. |
| **`apps/web/.env`** | Optional **frontend-only** `VITE_*` overrides when running Vite from `apps/web` without Netlify CLI. |
| **`.env.example`** / **`apps/web/.env.example`** | Committed templates — copy and rename; never put real secrets in examples. |

Production values live in the **Netlify dashboard** (and Firebase console for rules/functions). This pass does not change deployed config.

## Variable classes

### Required for typical local dev (root `.env`)

- `TMDB_TOKEN` — TMDB v4 read token for `/.netlify/functions/tmdb-proxy` (search, posters, discovery).
- `VITE_FIREBASE_*` — Firebase web app config (auth, Firestore sync).

### Frontend (`VITE_*` only)

Loaded by Vite from repo root and `apps/web/` (app directory wins). Exposed in the client bundle by design.

Common keys: `VITE_FIREBASE_*`, `VITE_TMDB_KEY`, `VITE_PUBLIC_BASE_URL`, `VITE_FCM_VAPID_KEY`, `VITE_GOOGLE_WEB_CLIENT_ID`, `VITE_YOUTUBE_API_KEY`, `VITE_API_BASE_URL`.

### Server / Netlify Functions only (root `.env`, not `apps/web/.env`)

- `TMDB_TOKEN` — TMDB proxy (do not duplicate in `apps/web/.env`).
- `SENDGRID_*`, `FEEDBACK_EMAIL`, `FROM_EMAIL` — feedback / email.
- `GOOFS_INGESTION_ADMIN_TOKEN`, `FIREBASE_SERVICE_ACCOUNT_JSON` — goofs ingest.
- `FIREBASE_SERVICE_ACCOUNT` — billing validate.
- `WORDNIK_API_KEY` — dictionary proxy (if used).

## Setup

```bash
cp .env.example .env
# Edit .env with your real values (never commit .env)

# Optional: frontend-only overrides for bare Vite
cp apps/web/.env.example apps/web/.env
```

```bash
npx netlify dev
```

Open http://localhost:8888

## Git safety

- `.env` and `apps/web/.env` are **gitignored**.
- If `.env` was previously tracked, it is removed from the index with `git rm --cached` while keeping your local file.
- Only `*.example` files are committed.
