# Flicklet runtime map (post-simplification)

Authoritative entrypoints after community/backend removal. Use this instead of legacy `www/` or root Vite assumptions.

## Local development

```bash
npm install --legacy-peer-deps   # repo root
cp .env.example .env             # secrets — never commit
npx netlify dev                  # or: npm run dev
```

| Piece | Path | Port / URL |
|-------|------|------------|
| Netlify dev (proxy) | `netlify.toml` `[dev]` | http://localhost:8888 |
| Vite (SPA) | `apps/web/` via `npm run dev --prefix apps/web` | 4173 (proxied) |
| Env | Repo-root `.env` | Injected by Netlify CLI |

Bare Vite without Netlify (no TMDB proxy): `npm run dev --prefix apps/web` → usually http://localhost:5173

## Production build (web)

| Step | Command | Output |
|------|---------|--------|
| Build | `npm run build --prefix apps/web` | `apps/web/dist/` |
| Netlify deploy | `netlify.toml` `base = apps/web`, `publish = dist` | Hosted SPA |

Config: `apps/web/vite.config.ts` (not repo-root `vite.config.js`).

## Netlify Functions (serverless)

| Item | Path |
|------|------|
| Config | `netlify.toml` → `directory = "netlify/functions"` (repo root) |
| Handlers | `netlify/functions/*.cjs`, `netlify/functions/billing/*.cjs` |
| Redirects | `/api/*` → `/.netlify/functions/*` in `netlify.toml` |

Active handlers: `tmdb-proxy`, `dict-proxy`, `goofs-fetch`, `feedback`, `send-email`, `billing/*`, `origin-validation`.

`@sendgrid/mail` and `firebase-admin` resolve from `apps/web/node_modules` (Netlify build base).

**Removed:** duplicate `apps/web/netlify/functions/` tree (was stale; feedback now lives under repo-root `netlify/functions/`).

## Firebase (Cloud Functions)

| Item | Path |
|------|------|
| Source | `functions/src/` |
| Deploy | `firebase deploy --only functions` |
| Exports | `setAdminRole`, `manageAdminRole`, `manageProStatus`, `ingestGoofs` |

Firestore rules/indexes: `firestore.rules`, `firestore.indexes.json` (Firebase CLI, not Netlify).

## Capacitor (mobile — not required for web dev)

| Item | Path |
|------|------|
| Config | `capacitor.config.json` → `webDir: apps/web/dist` |
| Android | `android/` |
| iOS | `ios/` |
| Refresh web assets | `npm run mobile:sync` (build + `cap sync`) — run when resuming mobile work |

Tracked `android/app/src/main/assets/public/` may lag until `cap sync`.

## Explicitly not part of runtime

| Path | Status |
|------|--------|
| `www/` | Gone (legacy v1) |
| `web/` | Dead Next.js community scaffold — **not** built or deployed |
| `_legacy_v1/` | Archive only |
| Root `vite.config.js` | Removed ( pointed at `www/` ) |
