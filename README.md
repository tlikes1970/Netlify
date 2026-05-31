# Flicklet TV Tracker

Personal TV and movie watchlist app (React + Vite + Netlify Functions + Firebase).

## Local development

The app no longer uses Express, Postgres, Prisma, or Docker. Local dev runs through Netlify CLI, which proxies the Vite app and serverless functions.

### Prerequisites

- Node.js 20
- [Netlify CLI](https://docs.netlify.com/cli/get-started/) (or use `npx netlify dev`)

### Setup

1. Install dependencies from the repo root:

```bash
npm install --legacy-peer-deps
```

2. Create a repo-root `.env` (or set in the Netlify dashboard for deploy) with at least:

```bash
TMDB_KEY=your_tmdb_api_key
```

Firebase client keys (`VITE_FIREBASE_*`) are configured via Netlify env for production; set locally if testing auth/sync.

### Run locally

From the repo root:

```bash
npx netlify dev
```

- App: http://localhost:8888
- Netlify functions: `/.netlify/functions/*` and `/api/*` redirects (TMDB proxy, billing, feedback, etc.)
- Vite dev server runs behind Netlify on port 4173 (configured in `netlify.toml`)

See [docs/LOCAL_DEV.md](docs/LOCAL_DEV.md) for runtime details.

### Removed stack (historical)

Express, Postgres/Prisma, Docker, and the community `/api/v1` backend are gone. See [docs/LOCAL_DEV.md](docs/LOCAL_DEV.md) and [docs/ARCHIVE_NOTE_2026-05-30.md](docs/ARCHIVE_NOTE_2026-05-30.md).

### Optional: Firebase Functions

Admin, Pro, and goofs ingestion functions live in `functions/`. Build locally with:

```bash
npm install --prefix functions
npm run build --prefix functions
```

Deploy separately with `firebase deploy --only functions` when needed.

### Build for production

```bash
npm run build --prefix apps/web
```

Netlify builds from `apps/web` per `netlify.toml`.
