# Local development runtime

## Current stack (simplified)

| Layer | Purpose |
|-------|---------|
| **Netlify CLI** (`npx netlify dev`) | Single local entry point — SPA + function proxies |
| **Vite** (`apps/web`) | Frontend dev/build (proxied by Netlify on port 4173) |
| **Netlify Functions** (`netlify/functions/` at repo root) | TMDB proxy, billing, feedback, goofs, dict, send-email |
| **Firebase** (client SDK) | Auth, Firestore sync for signed-in users |
| **Firebase Functions** (`functions/`) | Admin role, Pro status, goofs ingest (deployed separately) |
| **localStorage** | Offline-first library and settings |

## Start the app

```bash
# From repo root
npm install --legacy-peer-deps
npx netlify dev   # same as npm run dev
```

See [RUNTIME.md](RUNTIME.md) for the full post-simplification map.

Open http://localhost:8888

## Environment variables

Use repo-root `.env` (from `.env.example`) for `npx netlify dev`. Optional `apps/web/.env` is **VITE_* only** for bare Vite.

- `TMDB_TOKEN` — required for search/discovery/posters (TMDB proxy)
- `VITE_FIREBASE_*` — required for auth/sync when testing signed-in flows
- Billing/goofs/feedback function secrets — only when testing those features

Details: [ENV.md](ENV.md)

## Removed runtime (community backend)

The following are **gone** and not needed locally:

- Express community API (`server/`, port 4000)
- PostgreSQL via Docker (`docker-compose.yml`)
- Prisma schema/migrations
- `/api/v1` backend proxy

## When you still need Firebase CLI

- Deploying Cloud Functions: `firebase deploy --only functions`
- Firestore rules/indexes changes
- Firebase emulators (optional, not required for normal app dev)

## Troubleshooting

- **Search returns nothing** — check `TMDB_TOKEN` is set in repo-root `.env` and `npx netlify dev` is running (not plain `vite` alone).
- **Billing validate fails locally** — billing handlers must be under `netlify/functions/billing/`.
- **Auth works but sync fails** — verify Firebase env vars and signed-in user.
