# Flicklet Alpha Ship Log

**Goal**: Get to TestFlight in 10 days (no new features, only integration & polish)

---

## Day 0: Pre-Merge Validation (2025-01-15)

### Completed
- ✅ Tested auth flow on mobile simulator (Google/Apple)
- ✅ Tested drag bars on touch (working)
- ✅ **REMOVED marquee entirely** - cleaned all references, deleted files, no lint errors

### Next Action
- Merge branch to main (pending confirmation app runs clean)

### Blockers
- None

---

## Day 1: Post-Merge P0 Fixes

### Planned
- Fix comments on PostDetail (add CommentComposer & CommentList)
- Fix Firestore security rule (users collection read access)

### Dependencies
- Must be on main branch

---

## Day 2-3: Personality Injection

### Planned
- Add snarky empty states to CommunityPanel
- Add snarky loading messages
- Spanish translation review for humor

---

## Day 4-5: Pro Infrastructure

### Planned
- Stripe MVP integration
- Pro feature gating (email notifications, advanced trivia)

---

## Day 6-7: Analytics

### Planned
- PostHog integration
- Track core funnel: app_opened → rated → posted → commented → pro_purchased

---

## Day 8-9: Platform Builds

### Planned
- iOS TestFlight build
- Android Internal Track build

---

## Day 10: Alpha Launch

### Planned
- Distribute to 10-20 testers
- Send onboarding email
- Monitor PostHog funnel

---

## Notes
- **Rule**: One thing at a time, complete before moving on
- **Personality Level**: Severely sarcastic (but Spanish needs comedy translator)
- **Pro Status**: Currently a flag, will be real subscription via Stripe