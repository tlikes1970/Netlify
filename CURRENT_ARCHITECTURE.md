# Current Architecture — Flicklet TV Tracker

Last updated: 2026-06-02

This document is the **source of truth for how the repo is organized and deployed today**. Update it when folders, deploy branches, or service boundaries change.

---

## AI workflow (standing instruction)

**AI assistants working on this repo must act as mentors, reviewers, coaches, and goalkeepers.** Do not blindly implement the user’s requested solution if there is a safer, simpler, more standard, or more scalable approach. Push back with evidence. Prefer globally accepted app-development best practices over one-off hacks. Explain risks in plain language. Keep the app focused, stable, low-support, and ready for Play Store testing.

When proposing changes, cite what you verified in the repo (paths, configs, runtime behavior) rather than assumptions.

---

## Product model (terminology)

| Term | Meaning |
|------|---------|
| **Trial** | 21-day full access trial |
| **Read-Only** | After trial: browse/export; limited write actions |
| **Full Access** | Paid unlock (Google Play Billing on Android) |

**Deprecated:** “Pro” — do not introduce new Pro labels; migrate remnants to Trial / Read-Only / Full Access.

**Billing:** Google Play Billing for Android is planned/active path. Apple billing deferred until iOS is revived.

**Auth (Android-first):** Google login only for now. Apple login should be removed for Android-first release. Username is optional forever; **full legal names must not appear anywhere in the UI**.

---

## Active folders (source of truth)

| Path | Role |
|------|------|
| `apps/web/` | **Active frontend** — React + Vite SPA, primary app code |
| `apps/web/.env` | **Local dev env source of truth** for Vite/`import.meta.env` (not committed) |
| `netlify/functions/` | **Production serverless functions** deployed with the site |
| `netlify.toml` | Netlify build, dev, redirects, function directory |
| `android/` | Capacitor Android shell (`com.TravisL.tvtracker`) |
| `capacitor.config.json` | Capacitor app id, `webDir`: `apps/web/dist` |
| `docs/` | Maintainer docs (env, local dev, runtime) |
| `package.json` (repo root) | Root scripts; `npx netlify dev` entry |

### `apps/web` internals (high level)

- `src/` — pages, components, hooks, lib (Firebase, TMDB client, discovery, billing UI)
- `public/` — static assets, FlickWord shards, SW
- `tests/` — Playwright / unit tests
- Build output: `apps/web/dist` → published as `dist` per `netlify.toml`

### `netlify/functions` (production)

| Function | Purpose |
|----------|---------|
| `tmdb-proxy.cjs` | TMDB API proxy (live) |
| `dict-proxy.cjs` | Dictionary / FlickWord support |
| `goofs-fetch.cjs` | Goofs/extras fetch |
| `feedback.cjs` | User feedback → **SendGrid email** |
| `send-email.cjs` | Legacy/alternate email path (audit if duplicate) |
| `billing/*` | Google Play products, purchase, validate |
| `origin-validation.cjs` | Request origin checks |

API routes are wired in `netlify.toml` (e.g. `/api/tmdb-proxy` → `tmdb-proxy`).

---

## Uncertain / legacy folders (do not treat as active without audit)

| Path | Status | Notes |
|------|--------|-------|
| `functions/` | **Needs audit before deletion** | Separate tree; README references Firebase Functions for admin, Pro, goofs ingestion. May overlap with or predate `netlify/functions`. |
| `_legacy_v1/` | Legacy | Old vanilla/www implementation |
| `legacy/` | Legacy | mobile-compact-v1-vanilla experiments |
| `ios/` | Deferred | iOS/Capacitor present but not current release target |
| `migration/`, `migration-pack/` | Historical | Migration artifacts |
| `SUBMISSION/`, `tools/`, `scripts/` (root) | Mixed | May contain one-off scripts; verify before use |
| `_repo_cleanup_archive/` | Quarantine | Archived docs/scripts moved during cleanup — not runtime |

---

## Deployment model

| Environment | Branch | Build | Publish |
|-------------|--------|-------|---------|
| **Netlify production** | `simplify/try-before-buy-v1` | `npm run build` in `apps/web` | `apps/web/dist` |
| Functions | Same deploy | `netlify/functions` | Bundled via Netlify (esbuild) |

- **Firebase** is live (auth, Firestore, etc.).
- **TMDB** is live via `tmdb-proxy` (not direct browser keys in production).
- **SendGrid** is used for feedback email (`feedback.cjs`); requires `SENDGRID_API_KEY`, `FEEDBACK_EMAIL`, `FROM_EMAIL` (or `SENDGRID_FROM`) in Netlify dashboard. Netlify Forms is **not** the primary feedback path (SPA catch-all breaks form POST reliability).

---

## Local development model

**Always run from repo root:**

```bash
npx netlify dev
# or: npm run dev
```

| Item | Value |
|------|-------|
| App URL | http://localhost:8888 |
| Vite (behind Netlify) | port 4173 (`netlify.toml` `[dev]`) |
| Functions locally | `netlify/functions` |
| Proxies | Same `/api/*` redirects as production |

**Do not** assume Express/Postgres/Docker — removed stack (see `docs/ARCHIVE_NOTE_2026-05-30.md`).

Optional: Firebase Functions in `functions/` require separate `npm install --prefix functions` and deploy — not required for typical web/Android dev loop.

---

## Environment variable rules

| Context | Source of truth |
|---------|-----------------|
| **Local frontend (Vite)** | `apps/web/.env` |
| **Local Netlify CLI / functions** | Repo-root `.env` (for `TMDB_TOKEN`, function secrets) — align with `docs/ENV.md` |
| **Production** | **Netlify dashboard only** — never commit production `.env` |

Rules:

1. Never commit real secrets (`.env`, service account JSON, API keys).
2. `VITE_*` vars are baked at build time; changing them in Netlify requires a **redeploy**.
3. Function env vars (`SENDGRID_*`, `TMDB_TOKEN`, billing secrets) live in Netlify **Functions** env scope.
4. If local behavior differs from production, compare `apps/web/.env` + root `.env` against Netlify dashboard — document fixes here rather than one-off hacks.

---

## External services

| Service | Status | Integration |
|---------|--------|-------------|
| Firebase | Live | Auth (Google), Firestore, hosting auth paths `__/auth/*` |
| TMDB | Live | `netlify/functions/tmdb-proxy.cjs` |
| SendGrid | Live (feedback) | `netlify/functions/feedback.cjs` → inbox (e.g. Travis via `FEEDBACK_EMAIL`) |
| Google Play Billing | Planned / in progress | `netlify/functions/billing/*` + Android app |
| Apple Sign-In / IAP | Deferred | Remove from Android-first UX |

---

## Android / Capacitor notes

- Capacitor wraps the built web app: `webDir` = `apps/web/dist`.
- Package: `com.TravisL.tvtracker` (`capacitor.config.json`, `android/`).
- Build flow: build web (`apps/web`) → `npx cap sync` / Android Studio as per project scripts.
- **Google login only** for Play Store testing target.
- Billing validation goes through Netlify billing functions, not client-only checks.

---

## Known path confusion risks

1. **Two function trees:** `netlify/functions` (production) vs `functions/` (Firebase / admin — audit before delete).
2. **Two env locations:** `apps/web/.env` vs repo-root `.env` — frontend vs Netlify CLI/functions.
3. **Legacy roots:** `_legacy_v1/www`, `legacy/` — easy to edit wrong file; always confirm path under `apps/web/src`.
4. **`netlify.toml` `[functions].directory`:** Uses relative path from `apps/web` build context (`../../netlify/functions`); dev section uses `netlify/functions` from repo root — both intentional but confusing.
5. **README vs this doc:** README may mention root `.env.example`; **local Vite truth is `apps/web/.env`** per current policy.
6. **Archived docs:** Moved under `_repo_cleanup_archive/` — not authoritative for current behavior.

---

## Source-of-truth rules (quick reference)

| Question | Answer |
|----------|--------|
| Where is the app UI? | `apps/web/src` |
| Where do I run dev? | Repo root → `npx netlify dev` |
| Where are production functions? | `netlify/functions` |
| Where are prod env vars? | Netlify dashboard |
| Where are local frontend env vars? | `apps/web/.env` |
| What branch is production? | `simplify/try-before-buy-v1` |
| What terms do we use? | Trial / Read-Only / Full Access (not Pro) |

---

## App direction

Lightweight TV/movie tracking utility with strong personality, minimal friction, low support burden. Near-term milestone: **Play Store testing within ~one week**.

Areas requiring architectural audit (not blocking doc accuracy):

- **For You / Discovery** — ratings, Not Interested, genres/subgenres, watch history, list membership
- **TMDB/caching** — reduce runtime fragility (posters, rate limits)
- **Admin** — likely removable unless proven necessary
- **Coming Soon** — should be removed
- **Goofs** → rename concept to “Shows Like This”; keep **Extras** separate
