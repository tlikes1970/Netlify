# Boot Initialization Inventory

## Step 0 — Inventory

### i18n Provider
- **File:** `apps/web/src/lib/language.ts`
- **Symbol:** `LanguageManager` class
- **Method:** `emitChange()` (lines 40-72)
- **Initialization:** Module-level initialization at lines 117-121

### Translation Store/Queue
- **File:** `apps/web/src/i18n/translationStore.ts`
- **Symbol:** `queueUpdate()` (line 108)
- **Symbol:** `initializeStore()` (line 30)
- **Current behavior:** Queues updates with microtask+RAF coalescing

### useTranslations Hook
- **File:** `apps/web/src/lib/language.ts`
- **Symbol:** `useTranslations()` (line 190)
- **Subscription:** Uses `useTranslationSelector` from store (line 231)

### Boot Initializers
- **File:** `apps/web/src/main.tsx`
- **Symbol:** `initFlags()` (line 144)
- **Symbol:** `installCompactMobileGate()` (line 151)
- **Symbol:** `installActionsSplitGate()` (line 154)
- **Symbol:** `bootstrapFirebase()` (line 128)

### Early Text Components (High Impact)
- **File:** `apps/web/src/components/FlickletHeader.tsx` - Header with title
- **File:** `apps/web/src/components/Tabs.tsx` - Tab labels
- **File:** `apps/web/src/components/MobileTabs.tsx` - Mobile tab labels
- **File:** `apps/web/src/components/AccountButton.tsx` - Account button text
- **File:** `apps/web/src/components/Header.tsx` - Header component

