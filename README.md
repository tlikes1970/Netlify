## Running with Netlify dev (proxy)
1. Install the CLI if needed: `npm i -g netlify-cli` (or use `npx netlify dev`).
2. At the repo root, create `.env` with your server key:
TMDB_KEY=YOUR_REAL_TMDB_KEY

3. From the repo root, run: `netlify dev`
4. App will be on http://localhost:8888, proxying Vite (5173) and exposing functions at `/.netlify/functions/*`.
