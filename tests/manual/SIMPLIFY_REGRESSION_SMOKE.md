# Flicklet Simplify Branch — Manual Regression Smoke Checklist

**Branch:** `simplify/try-before-buy-v1`  
**Environment:** `npx netlify dev` at repo root → http://localhost:8888 (not plain Vite)  
**Date:** 2026-05-31  
**Tester:** _______________

Mark each: **P** Pass · **F** Fail · **B** Blocked · **N/A**

---

## Setup

- [ ] Working tree clean; on `simplify/try-before-buy-v1`
- [ ] Root `.env` present (Firebase `VITE_*`, `TMDB_TOKEN`, optional SendGrid for feedback)
- [ ] `npx netlify dev` running; port 8888 reachable
- [ ] Browser DevTools → Console + Network open
- [ ] Test Google account available (or email auth)

---

## 1. App startup

| # | Steps | Expected | P/F/B |
|---|--------|----------|-------|
| 1.1 | Open http://localhost:8888 | Shell loads; no white screen hang | |
| 1.2 | First visit / clear `app:primed` | First-paint gate then content | |
| 1.3 | Check console on load | No red errors (warnings OK) | |

---

## 2. Firebase login / logout

| # | Steps | Expected | P/F/B |
|---|--------|----------|-------|
| 2.1 | Sign in (Google or email) | Auth completes; library loads | |
| 2.2 | Refresh while signed in | Still signed in | |
| 2.3 | Sign out | Returns to signed-out state; no crash | |

---

## 3. TMDB search

| # | Steps | Expected | P/F/B |
|---|--------|----------|-------|
| 3.1 | Search “Breaking Bad” | Results with posters | |
| 3.2 | Network: `/api/tmdb-proxy` | 200 JSON (not 403 origin-rejected) | |
| 3.3 | Open a result detail | Metadata loads | |

---

## 4–7. Library lists (add / move / remove)

| # | Steps | Expected | P/F/B |
|---|--------|----------|-------|
| 4.1 | From search, add show to **Watching** | Appears on Watching tab | |
| 4.2 | Add another to **Want** | Appears on Want tab | |
| 4.3 | Mark item **Watched** | Moves to Watched | |
| 5.1 | Move Watching → Want (card action) | Single item; correct tab | |
| 5.2 | Move Want → Watching | Correct tab | |
| 6.1 | Remove / not-interested from list | Item leaves list | |

---

## 8. Returning tab & dates

| # | Steps | Expected | P/F/B |
|---|--------|----------|-------|
| 8.1 | Open **Returning** tab | List or empty state (not blank crash) | |
| 8.2 | TV with `nextAirDate` in Watching | Shows on Returning when eligible | |

---

## 9. Up Next rail

| # | Steps | Expected | P/F/B |
|---|--------|----------|-------|
| 9.1 | Home → Up Next rail | Renders or empty state | |
| 9.2 | Tap item action | Navigates / updates list as designed | |

---

## 10. Settings save / refresh

| # | Steps | Expected | P/F/B |
|---|--------|----------|-------|
| 10.1 | Open Settings | Sheet opens | |
| 10.2 | Change theme / notification toggle | Saves without error | |
| 10.3 | Refresh page | Settings persist (local + cloud if signed in) | |

---

## 11. Notes / ratings / summaries

| # | Steps | Expected | P/F/B |
|---|--------|----------|-------|
| 11.1 | Set star rating on tab card | Rating visible | |
| 11.2 | Add note on item | Note persists after refresh | |
| 11.3 | Synopsis on card | Displays when available | |

---

## 12. Custom lists (if used)

| # | Steps | Expected | P/F/B |
|---|--------|----------|-------|
| 12.1 | Settings or My Lists → create list | List created | |
| 12.2 | Add item to custom list | Item appears in list | |

---

## 13. Feedback function

| # | Steps | Expected | P/F/B |
|---|--------|----------|-------|
| 13.1 | Submit feedback from app | Success toast (needs `SENDGRID_*` locally) | |
| 13.2 | Network POST `/api/feedback` | 200 or clear error if misconfigured | |

---

## 14. Pro / billing screen

| # | Steps | Expected | P/F/B |
|---|--------|----------|-------|
| 14.1 | Free user: open Pro upgrade | CTA / paywall (no crash) | |
| 14.2 | Pro user (if available): extras unlock | Goofs/games gates behave | |

---

## 15. Goofs / insights (if present)

| # | Steps | Expected | P/F/B |
|---|--------|----------|-------|
| 15.1 | Open Goofs on a title with data | Modal content loads from Firestore | |
| 15.2 | Title without data | Graceful empty / upgrade message | |

---

## 16. Browser refresh persistence

| # | Steps | Expected | P/F/B |
|---|--------|----------|-------|
| 16.1 | Add items while signed in; hard refresh | Library still present | |
| 16.2 | Tab state (last tab) | Reasonable restore | |

---

## 17. Console / network hygiene

| # | Steps | Expected | P/F/B |
|---|--------|----------|-------|
| 17.1 | Normal session 5 min | No repeating 403 on TMDB proxy | |
| 17.2 | No requests to removed `/api/v1` backend | |

---

## 18. Android asset sanity (static)

| # | Check | Expected | P/F/B |
|---|--------|----------|-------|
| 18.1 | `android/.../index.html` | No `community-*.js` preload | |
| 18.2 | No `UnsubscribePage-*.js` in assets | |
| 18.3 | Entry bundle matches latest `apps/web/dist` hashes | |

---

## Sign-off

| Area | Result | Notes |
|------|--------|-------|
| Core web | | |
| Functions | | |
| Android static | | |
| Blockers | | |
