## B2 – Settings Architecture Consolidation

### Summary

Completed consolidation of Settings architecture to reduce duplication and create single sources of truth for Pro features, upgrade CTAs, and community settings.

---

### ✅ Pro features config: Implemented

**File:** `apps/web/src/components/settingsProConfig.ts`

- Created centralized configuration module with typed `ProFeature` interface
- Exported `PRO_FEATURES_AVAILABLE` and `PRO_FEATURES_COMING_SOON` arrays
- Includes helper functions: `getAllProFeatures()`, `getProFeaturesByStatus()`
- Features defined:
  - **Available Now:** Bloopers & Behind-the-Scenes, Advanced Notifications
  - **Coming Soon:** Premium Themes

**Updated:** `apps/web/src/components/settingsSections.tsx`
- `ProSection` now renders features from config instead of hardcoded markup
- Uses `.map()` to iterate over feature arrays
- Preserves existing visual styling and layout

---

### ✅ Unified Upgrade CTA: Implemented

**File:** `apps/web/src/components/UpgradeToProCTA.tsx`

- Created reusable component with 4 variants:
  - `banner`: Small banner with icon and text link (NotificationsSection)
  - `panel`: Larger panel with icon, heading, description, and button (NotificationSettings modal)
  - `inline`: Inline text link (DisplaySection)
  - `button`: Button-only style (ProSection)
- Automatically hides for Pro users (`useProStatus` hook)
- Consistent messaging and styling across all variants

**Replaced CTAs in:**
- `apps/web/src/components/settingsSections.tsx`
  - NotificationsSection: banner variant
  - DisplaySection: inline variant  
  - ProSection: button variant
- `apps/web/src/components/modals/NotificationSettings.tsx`
  - Panel variant

---

### ✅ Community Settings section: Implemented

**Files:**
- `apps/web/src/components/settingsConfig.ts`: Added `'community'` to `SettingsSectionId` type and `SETTINGS_SECTIONS` array
- `apps/web/src/components/settingsSections.tsx`: Created `CommunitySection` component

**Route/hash:** `#settings/community` (handled automatically by existing Settings navigation)

**Features:**
- **Weekly Email Digest:** Moved from NotificationsSection to CommunitySection
  - Email subscription toggle (Firestore-backed)
  - Shows subscription status and schedule
- **Topic Following:** Placeholder section explaining topic management
- **Community Activity:** Shows count of followed topics (if any)

**Removed:** Weekly Email Digest from NotificationsSection (no longer duplicated)

---

### ✅ Stats duplication: Verified - No duplication found

**Current state:**
- Account stats (TV/Movie counts) only appear in `AccountSection`
- Community stats (followed topics count) only appear in `CommunitySection`
- Game stats (FlickWord, Trivia) are separate components and not duplicated

**No action needed** - Stats are already properly scoped to their respective sections.

---

### Build & Runtime

- ✅ TypeScript passes (no linter errors)
- ✅ All imports resolved correctly
- ✅ Settings navigation supports new Community section automatically
- ✅ Both desktop (`SettingsPage`) and mobile (`SettingsSheet`) UIs updated

---

### Follow-ups

- [ ] Consider extracting stats rendering into shared `StatsBlock` component if more sections need stats in future
- [ ] Future Pro features can be added to `settingsProConfig.ts` as needed
- [ ] Community section ready for additional settings (e.g., feed preferences, notification settings for community)

---

### Files Changed

**New files:**
- `apps/web/src/components/settingsProConfig.ts`
- `apps/web/src/components/UpgradeToProCTA.tsx`

**Modified files:**
- `apps/web/src/components/settingsConfig.ts`
- `apps/web/src/components/settingsSections.tsx`
- `apps/web/src/components/modals/NotificationSettings.tsx`




