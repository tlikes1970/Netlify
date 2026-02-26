# Pre-Production Test Checklist

**Version:** 28.170.7 (0.1.174)  
**Date:** _________________  
**Tester:** _________________

Check each item before pushing to production. Mark **P** (pass) or **F** (fail).

---

## 1. Home Currently Watching Rail

| # | Test | P/F | Notes |
|---|------|-----|-------|
| 1.1 | Home page shows "Your Shows" section with watching items | | |
| 1.2 | Each card shows a single "Currently Watching" button (not 4 buttons) | | |
| 1.3 | Tapping the button switches to the Watching tab | | |
| 1.4 | No overflow menu or swipe actions on home rail cards | | |
| 1.5 | Empty state: "Add some from Search or Discovery" when no watching items | | |

---

## 2. Pro Status Propagation

| # | Test | P/F | Notes |
|---|------|-----|-------|
| 2.1 | Admin grants Pro to a test user; user sees Pro within ~60s or after refresh | | |
| 2.2 | Pro features unlock (e.g., Extras, Trivia Game 2/3, Community) | | |
| 2.3 | Admin revokes Pro; user loses Pro access on next check | | |
| 2.4 | Pro status persists across app restart / tab switch | | |

---

## 3. Trivia Repeats

| # | Test | P/F | Notes |
|---|------|-----|-------|
| 3.1 | Play 1 full Trivia game; note 2–3 question texts | | |
| 3.2 | Play a second game same day; no duplicate questions | | |
| 3.3 | (Optional) Simulate API failure; game uses fallback questions and plays without error banner | | |
| 3.4 | No error banner shown when fallback questions load successfully | | |

---

## 4. FlickWord Repeats

| # | Test | P/F | Notes |
|---|------|-----|-------|
| 4.1 | Play FlickWord; note first letter of daily word | | |
| 4.2 | Play 5+ consecutive days (or advance device date); no same-letter streaks if possible | | |
| 4.3 | Game completes and accepts valid word | | |

---

## 5. Discovery Move Bug (TabCard)

| # | Test | P/F | Notes |
|---|------|-----|-------|
| 5.1 | If Discovery uses ListPage with TabCard: "Watching" button moves item to Currently Watching (not wishlist) | | |
| 5.2 | Search results: add to Watching moves to correct list | | |
| 5.3 | ListPage (Watching, Want, Watched): all list actions work as expected | | |

---

## 6. Core Flows (Sanity)

| # | Test | P/F | Notes |
|---|------|-----|-------|
| 6.1 | Login / logout works | | |
| 6.2 | Search finds shows/movies | | |
| 6.3 | Add to Watching / Wishlist / Watched from search | | |
| 6.4 | Remove from list works | | |
| 6.5 | Tab navigation (Home, Watching, Want, Watched, Discovery, etc.) works | | |
| 6.6 | Settings open and save | | |
| 6.7 | No console errors on normal usage | | |

---

## 7. Mobile / Android (if releasing to Play Store)

| # | Test | P/F | Notes |
|---|------|-----|-------|
| 7.1 | Build succeeds: `npm run mobile:build` | | |
| 7.2 | Android build: `npx cap sync` then build in Android Studio | | |
| 7.3 | App launches on device/emulator | | |
| 7.4 | Home CW rail shows single button; tap navigates to Watching | | |
| 7.5 | Pro status reflects after admin grant | | |
| 7.6 | Games (Trivia, FlickWord) load and play | | |

---

## 8. Cloud Function

| # | Test | P/F | Notes |
|---|------|-----|-------|
| 8.1 | `manageProStatus` deployed: `firebase deploy --only functions:manageProStatus` | | |
| 8.2 | Admin can call manageProStatus; target user receives Pro | | |
| 8.3 | Non-admin cannot call manageProStatus (permission denied) | | |

---

## Sign-Off

| Role | Name | Date |
|------|------|------|
| QA | | |
| Release Owner | | |

**Go/No-Go:** _____________
