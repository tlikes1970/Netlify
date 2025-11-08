# Auth Fixes - Version 0.1.125

## Rollback Instructions

If auth breaks after this update, rollback by reverting to version 0.1.124:

```bash
git revert <commit-hash>
# OR
git checkout 0.1.124 -- apps/web/src/main.tsx apps/web/src/lib/auth.ts apps/web/src/hooks/useUsername.ts apps/web/src/version.ts
```

---

## Critical Fixes Applied

### 1. ✅ Fixed Triple `getRedirectResult()` Calls

**Problem:** Three places were calling `getRedirectResult()`:
- `main.tsx:327` (no guard)
- `authFlow.ts:34` (primary handler)
- `auth.ts:220` (fallback with guard)

**Fix:** Removed duplicate call from `main.tsx`. Now only `authFlow.ts` calls it, with `auth.ts` as guarded fallback.

**Files Changed:**
- `apps/web/src/main.tsx` - Removed duplicate `getRedirectResult()` call

**Risk:** Low - This was causing auth failures, removing it should fix them.

---

### 2. ✅ Fixed displayName vs Username Confusion

**Problem:** Code was using `existingUsername` as `displayName`, which is wrong:
- **displayName**: Comes from Google/Apple, shown on sign-in button, can only be changed via provider
- **username**: User enters in prompt, stored in `settings.username`, used in greetings

**Fix:** 
- `displayName` now ALWAYS comes from Firebase Auth (Google/Apple)
- Never uses `username` as `displayName`
- Clear separation: `profile.displayName` = from provider, `settings.username` = from user prompt

**Files Changed:**
- `apps/web/src/lib/auth.ts:495-518` - Fixed `ensureUserDocument()` to use Firebase Auth displayName only

**Risk:** Low - This fixes data flow correctness.

---

### 3. ✅ Fixed Race Condition: Document Creation vs Username Loading

**Problem:** `loadUsername()` could read Firestore before `ensureUserDocument()` write was visible (Firestore eventual consistency).

**Fix:**
1. Ensure document is created BEFORE notifying listeners
2. Add 100ms delay after document creation to ensure write is readable
3. Add retry logic in `loadUsername()` (3 retries, 200ms delay)

**Files Changed:**
- `apps/web/src/lib/auth.ts:430-445` - Added delay after document creation
- `apps/web/src/hooks/useUsername.ts:133-198` - Added retry logic

**Risk:** Low - Adds safety delays and retries without breaking functionality.

---

### 4. ✅ Added Retry Logic for Firestore Reads

**Problem:** If document doesn't exist yet (new user), `loadUsername()` would fail immediately.

**Fix:** Added retry loop:
- 3 retries maximum
- 200ms delay between retries
- Logs retry attempts for debugging

**Files Changed:**
- `apps/web/src/hooks/useUsername.ts:136-154` - Added retry loop

**Risk:** Low - Only adds resilience, doesn't change behavior.

---

## Data Flow Clarification

### displayName (From Google/Apple)
- **Source:** Firebase Auth `user.displayName`
- **Storage:** `users/{uid}/profile.displayName`
- **Usage:** Shown on AccountButton (sign-in button)
- **Change:** Only via Google/Apple account settings
- **Never:** Mixed with username

### username (From User Prompt)
- **Source:** User enters in username prompt modal
- **Storage:** `users/{uid}/settings.username`
- **Usage:** Shown in SnarkDisplay (greeting), used throughout app
- **Change:** User can change in-app
- **Never:** Used as displayName

---

## Testing Checklist

After deploying, verify:

- [ ] Sign in with Google works
- [ ] Sign in with Apple works  
- [ ] Sign in with Email works
- [ ] Sign out works
- [ ] New user sees username prompt
- [ ] Username prompt works correctly
- [ ] Display name shows on sign-in button (from Google/Apple)
- [ ] Username shows in greeting (from prompt)
- [ ] Existing users' data loads correctly
- [ ] No console errors during sign-in flow

---

## Version Info

- **Version:** 0.1.125
- **Date:** $(date)
- **Changes:** Critical auth fixes
- **Rollback:** Revert to 0.1.124 if issues occur

---

## Known Limitations

1. **100ms delay** after document creation - Small performance cost for safety
2. **Retry logic** adds up to 600ms delay (3 retries × 200ms) if document not found
3. **Multiple Firestore reads** still occur (optimization for future version)

---

## Future Optimizations (Not in this fix)

- Batch Firestore reads (combine `loadFromFirebase` and `getUserSettings`)
- Cache document after first read
- Reduce retry delays if document creation is faster

