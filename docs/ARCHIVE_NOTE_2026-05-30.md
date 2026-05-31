# Flicklet Full-Featured Archive — 2026-05-30

## Why this archive exists

On **May 30, 2026**, the Flicklet project entered a deliberate product transition: from a **full-featured** TV/movie tracker (community, games, Pro subscriptions, discovery rails, admin tooling, and multiple backends) toward a **simplified “try before you buy”** personal utility (time-limited full trial, then one-time unlock, no subscriptions, no social surface).

This archive preserves the **exact codebase state** before any simplification, deletion, or refactor work. Nothing in the archive branch should be treated as disposable without an explicit decision.

## What was preserved

### Core product (React + Vite)

- Primary app: `apps/web/` (React 18, TypeScript, Vite)
- SPA routing via `App.tsx` views + pathname routes (`/admin`, `/posts/:slug`, `/unsubscribe`, `/debug/auth`)
- Local-first library: `flicklet.library.v2` in `apps/web/src/lib/storage.ts`
- Lists: watching, wishlist (`want` tab), watched, not interested, custom lists, returning shows

### Cloud & sync

- Firebase Auth (Google, Apple, email), Firestore user docs, watchlist sync (`firebaseSync.ts`)
- Firebase Cloud Functions (`functions/`)
- FCM / push messaging paths

### Community & social

- `CommunityPanel`, posts, comments, voting, topics, moderation
- Express + Prisma community server (`server/`)
- Netlify `backend-proxy` for `/api/v1/*`

### Games & extras

- FlickWord, Trivia (modals, APIs, lexicon shards)
- Goofs, bloopers, extras modals (Pro-gated)

### Discovery & content

- TMDB integration, smart discovery scoring (`smartDiscovery.ts`)
- For You genre rails, in-theaters, home marquee/rails

### Pro / billing

- Subscription-oriented Play products (`pro_subscription_monthly` / `yearly`)
- `proStatus.ts`, `proUpgrade.ts`, Netlify billing functions
- Admin Pro toggle (`AdminExtrasPage`, `manageProStatus`)

### Mobile & deploy

- Capacitor Android/iOS (`android/`, `ios/`, `capacitor.config.json`)
- Netlify deploy (`netlify.toml`, `netlify/functions/`)
- Built web assets synced into Android `assets/public/`

### Legacy & experiments

- `_legacy_v1/www/` vanilla app
- `legacy/mobile-compact-v1-vanilla/`
- `web/` Next.js scaffold
- Extensive docs and forensic reports

### Tooling & reference

- Pre-simplification architecture audits (removed in May 2026 doc cleanup; this note is the canonical archive summary)
- Tests: Vitest, Playwright, server Jest

## Architecture summary (snapshot)

| Layer | Location |
|-------|----------|
| Web UI | `apps/web/src/` |
| Netlify functions | `netlify/functions/` |
| Community API | `server/` |
| Firebase functions | `functions/` |
| Native shells | `android/`, `ios/` |

**State:** Library in `localStorage` with optional Firestore sync when signed in. Settings singleton + feature flags JSON. No React Router.

## Intent of the simplified version (future work)

Target product on branch `simplify/try-before-buy-v1`:

- Full-feature **trial** for a limited period
- **One-time unlock** (~$4.99), no subscriptions
- **No** social/community, games, AI-heavy features, or advanced power-user surfaces
- **Stable** local-first tracker: search, lists, ratings, notes, backup/restore
- Minimal support burden after launch

The archive exists so this scope reduction can proceed **without losing** the ability to restore or cherry-pick from the full-featured era.

## Git preservation references

| Artifact | Name |
|----------|------|
| **Archive branch** | `archive/full-featured-flicklet-before-simplification` |
| **Permanent tag** | `flicklet-full-featured-archive-2026-05-30` |
| **ZIP backup** | `Flicklet_Full_Featured_Archive_2026-05-30.zip` (parent of repo; excludes `node_modules`, `dist`, caches) |
| **Working branch for simplification** | `simplify/try-before-buy-v1` |

## ⚠️ Do not delete

- **Do not delete** branch `archive/full-featured-flicklet-before-simplification`
- **Do not delete** tag `flicklet-full-featured-archive-2026-05-30`
- **Do not force-push** over this tag without team agreement
- Keep the ZIP backup until simplification is shipped and validated

To restore or inspect this era:

```bash
git fetch --all
git checkout archive/full-featured-flicklet-before-simplification
# or
git checkout flicklet-full-featured-archive-2026-05-30
```

---

*Archive created as part of preservation-only setup. No feature removal was performed on this branch commit beyond documenting intent.*
