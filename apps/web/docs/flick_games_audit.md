# FlickWord & Trivia Games - Complete System Audit

**Generated:** 2025-11-16  
**Scope:** All files related to FlickWord and Trivia game systems

---

## 1. TRIVIA GAME FILES

### 1.1 Core Game Components

#### `apps/web/src/components/games/TriviaGame.tsx`
- **Purpose:** Main trivia game component with question display, answer selection, and scoring
- **Key Features:**
  - Pro vs Regular game logic (10 questions for Pro, 5 for Regular)
  - Multiple game sessions per day for Pro users (gameNumber tracking)
  - Question loading from API with hardcoded fallback
  - Answer validation and scoring
  - Game completion tracking
  - Stats persistence to localStorage
- **Dependencies:**
  - `triviaApi.ts` - `getCachedTrivia()`
  - `dailyTriviaApi.ts` - Legacy single-question API (deprecated)
  - `useSettings()` - Pro user detection
  - `getTodaysQuestions()` - Hardcoded fallback questions
- **Data Sources:**
  - OpenTriviaDB API (via `triviaApi.ts`)
  - Hardcoded fallback questions (in `getTodaysQuestions()`)
  - localStorage for game state and stats

#### `apps/web/src/components/games/TriviaModal.tsx`
- **Purpose:** Modal wrapper for TriviaGame with drag functionality
- **Key Features:**
  - Draggable modal interface
  - Scroll locking when open
  - Escape key handling
- **Dependencies:**
  - `TriviaGame.tsx`
  - `Portal.tsx`
  - `scrollLock.ts` utilities

#### `apps/web/src/components/games/TriviaStats.tsx`
- **Purpose:** Display trivia game statistics
- **Key Features:**
  - Games played, accuracy, streak tracking
  - Reads from `localStorage` key: `trivia:stats`
  - Listens for `trivia:statsUpdated` custom event
- **Dependencies:**
  - `useTranslations()` for i18n
  - localStorage API

### 1.2 API & Data Layer

#### `apps/web/src/lib/triviaApi.ts`
- **Purpose:** Primary trivia API service - fetches multiple questions from OpenTriviaDB
- **Key Features:**
  - Multiple API endpoints (Movies medium, TV Shows medium, Movies easy, TV Shows easy)
  - Question parsing and shuffling
  - Daily caching in localStorage (`flicklet:daily-trivia`)
  - Fallback to empty array if all APIs fail
- **Data Sources:**
  - OpenTriviaDB API (https://opentdb.com/api.php)
  - Categories: 11 (Film), 14 (Television)
- **Dependencies:**
  - localStorage for caching
  - Fetch API

#### `apps/web/src/lib/dailyTriviaApi.ts`
- **Purpose:** Legacy single-question trivia API (deprecated/unused)
- **Key Features:**
  - Fetches single question from OpenTriviaDB
  - Cache key: `flicklet:trivia-question`
  - Fallback trivia questions hardcoded
- **Status:** Appears to be legacy code, not actively used by TriviaGame

#### `apps/web/netlify/functions/trivia-proxy.cjs`
- **Purpose:** Netlify serverless function to proxy OpenTriviaDB API requests
- **Key Features:**
  - Parameter validation and allowlisting
  - Adds caching headers (5 min)
  - Same-origin requests (avoids CORS)
- **Dependencies:**
  - OpenTriviaDB API
  - Netlify Functions runtime

### 1.3 Question Generation Logic

**Location:** `TriviaGame.tsx` - `getTodaysQuestions()` function (lines 633+)

- **Pro Users:**
  - 10 questions per game
  - Multiple games per day (gameNumber 1, 2, 3...)
  - Questions offset by `(gameNumber - 1) * 10` from cached API questions
  - Falls back to hardcoded questions if API insufficient

- **Regular Users:**
  - 5 questions per game
  - 1 game per day
  - Uses first 5 questions from cached API
  - Falls back to hardcoded questions if API fails

- **Hardcoded Fallback:**
  - Defined in `getTodaysQuestions()` function
  - Mix of Film and TV questions
  - Used when API fails or returns insufficient questions

---

## 2. FLICKWORD GAME FILES

### 2.1 Core Game Components

#### `apps/web/src/components/games/FlickWordGame.tsx`
- **Purpose:** Main FlickWord game component (Wordle-style word guessing)
- **Key Features:**
  - 6-guess word guessing game
  - Letter input handling (keyboard + on-screen keyboard)
  - Used-letter tracking and visual feedback (correct/present/absent)
  - Game state persistence to localStorage
  - Pro vs Regular limits (3 games/day Pro, 1 game/day Regular)
  - Daily word selection (same word for all players)
  - Share functionality (Wordle-style grid)
- **Dependencies:**
  - `dailyWordApi.ts` - `getTodaysWord()`
  - `validateWord.ts` - `validateWord()` for guess validation
  - `useSettings()` - Pro user detection
  - `flickword.css` - Styling
- **Data Sources:**
  - Deterministic daily word (from `commonWords.ts` or `accepted.json`)
  - Word validation (local + dictionary API)
  - localStorage for game state and stats

#### `apps/web/src/components/games/FlickWordModal.tsx`
- **Purpose:** Modal wrapper for FlickWordGame with drag functionality and stats display
- **Key Features:**
  - Draggable modal interface
  - Header stats (streak, next word timer)
  - Stats view toggle
  - Game completion handler
  - Scroll locking
- **Dependencies:**
  - `FlickWordGame.tsx`
  - `FlickWordStats.tsx`
  - `Portal.tsx`
  - `scrollLock.ts` utilities

#### `apps/web/src/components/games/FlickWordStats.tsx`
- **Purpose:** Display FlickWord game statistics
- **Key Features:**
  - Games played, wins, losses, streak, max streak, win rate
  - Reads from multiple localStorage keys: `flickword:stats`, `flicklet-data`
  - Listens for `flickword:stats-updated` custom event
  - Cross-tab synchronization via storage events
- **Dependencies:**
  - `useTranslations()` for i18n
  - localStorage API

### 2.2 Word Generation & Validation

#### `apps/web/src/lib/dailyWordApi.ts`
- **Purpose:** Daily word selection service (same word for all players each day)
- **Key Features:**
  - Deterministic word selection based on date
  - Uses `commonWords.ts` (curated familiar words) as primary source
  - Falls back to `accepted.json` if commonWords unavailable
  - Filters out excluded words
  - Daily caching in localStorage (`flicklet:daily-word`)
  - Date-based seed for consistent selection
- **Data Sources:**
  - `commonWords.ts` - Curated list of ~500 familiar words
  - `accepted.json` - Full list of 2,175 accepted words
  - `excludedWords.ts` - Exclusion filter
- **Dependencies:**
  - `commonWords.ts`
  - `excludedWords.ts`
  - localStorage for caching

#### `apps/web/src/lib/words/validateWord.ts`
- **Purpose:** Validates user guesses (5-letter words)
- **Key Features:**
  - Primary check: `accepted.json` via `isAcceptedLocal()`
  - Fallback: Dictionary API via Netlify function proxy
  - Exclusion list check (rejects non-words)
  - Memoization for performance
  - Format validation (charset, length)
- **Data Sources:**
  - `accepted.json` - 2,175 accepted words (primary)
  - Dictionary API (via `/.netlify/functions/dict-proxy`) - Fallback
  - `excludedWords.ts` - Exclusion filter
- **Dependencies:**
  - `localWords.ts` - `isAcceptedLocal()`
  - `excludedWords.ts` - `isExcluded()`
  - `lexicon.ts` - `normalize()`, `isFiveLetters()`
  - Netlify function `dict-proxy`

#### `apps/web/src/lib/words/commonWords.ts`
- **Purpose:** Curated list of ~500 familiar 5-letter words
- **Key Features:**
  - Used for daily word selection (ensures familiar words)
  - Exported as Set for fast lookups
  - `getCommonWordsArray()` helper function
- **Dependencies:** None (standalone data file)

#### `apps/web/src/lib/words/excludedWords.ts`
- **Purpose:** Exclusion list for non-words or uncommon alternate spellings
- **Key Features:**
  - Prevents excluded words from being daily words
  - Prevents excluded words from being accepted as guesses
  - Single source of truth for exclusions
- **Current Exclusions:**
  - `hollo`, `heres`, `drily`, `gonif`
- **Dependencies:** None (standalone data file)

#### `apps/web/src/lib/words/localWords.ts`
- **Purpose:** Local word list utilities (reads `accepted.json`)
- **Key Features:**
  - `isAcceptedLocal()` - Checks if word is in accepted.json
  - Loads word list from `/words/accepted.json`
- **Data Sources:**
  - `apps/web/public/words/accepted.json` - 2,175 words
- **Dependencies:**
  - Fetch API

#### `apps/web/public/words/accepted.json`
- **Purpose:** Master list of 2,175 accepted 5-letter words
- **Usage:**
  - Primary source for guess validation
  - Fallback source for daily word selection
- **Format:** JSON array of strings

### 2.3 Styling

#### `apps/web/src/styles/flickword.css`
- **Purpose:** Main FlickWord game styles
- **Features:** Grid layout, tile animations, keyboard styling

#### `apps/web/src/styles/flickword-mobile.css`
- **Purpose:** Mobile-specific FlickWord styles
- **Features:** Responsive adjustments for mobile devices

---

## 3. SHARED COMPONENTS

### 3.1 Game Routing & Navigation

#### `apps/web/src/App.tsx`
- **Purpose:** Main app component with game modal state management
- **Key Features:**
  - `showFlickWordModal` state
  - Hash-based routing: `#games/flickword` opens FlickWord modal
  - Game modal state management
- **Dependencies:**
  - `FlickWordModal.tsx`
  - `TriviaModal.tsx` (via CommunityPanel)

#### `apps/web/src/components/CommunityPanel.tsx`
- **Purpose:** Community panel displaying game cards
- **Key Features:**
  - FlickWord game card with stats
  - Trivia game card (opens TriviaModal)
  - `openFlickWord()` function
- **Dependencies:**
  - `FlickWordStats.tsx`
  - `TriviaModal.tsx`
  - `FlickWordModal.tsx` (via global function)

### 3.2 Shared Utilities

#### `apps/web/src/components/Portal.tsx`
- **Purpose:** React Portal component for modals
- **Usage:** Used by both FlickWordModal and TriviaModal
- **Dependencies:** React DOM

#### `apps/web/src/utils/scrollLock.ts`
- **Purpose:** Scroll locking utilities for modals
- **Functions:**
  - `lockScroll()` - Prevents body scrolling
  - `unlockScroll()` - Restores body scrolling
- **Usage:** Used by both game modals

### 3.3 Shared Data Storage

**localStorage Keys:**
- `flicklet-data` - Main app data (includes flickword stats)
- `flickword:stats` - FlickWord statistics
- `flickword:game-state` - FlickWord game state
- `flickword:games-completed:{date}` - Daily game completion tracking
- `trivia:stats` - Trivia statistics
- `flicklet:daily-word` - Cached daily word
- `flicklet:daily-trivia` - Cached trivia questions

---

## 4. DATA SOURCES SUMMARY

### 4.1 External APIs

**Trivia:**
- **OpenTriviaDB** (https://opentdb.com/api.php)
  - Categories: 11 (Film), 14 (Television)
  - Proxied via: `trivia-proxy.cjs` Netlify function
  - Cached: localStorage (`flicklet:daily-trivia`)

**FlickWord:**
- **Dictionary API** (via Netlify function proxy)
  - Endpoint: `/.netlify/functions/dict-proxy`
  - Used for: Fallback word validation
  - Cached: In-memory memoization

### 4.2 Local JSON Files

**FlickWord:**
- `apps/web/public/words/accepted.json` - 2,175 accepted words
  - Primary source for guess validation
  - Fallback for daily word selection

### 4.3 TypeScript Data Files

**FlickWord:**
- `apps/web/src/lib/words/commonWords.ts` - ~500 curated familiar words
  - Primary source for daily word selection
- `apps/web/src/lib/words/excludedWords.ts` - Exclusion list
  - Prevents non-words from being daily words or accepted guesses

### 4.4 Hardcoded Data

**Trivia:**
- `getTodaysQuestions()` function in `TriviaGame.tsx`
  - Fallback questions when API fails
  - Mix of Film and TV questions

**FlickWord:**
- Final fallback word: `'HOUSE'` (in `dailyWordApi.ts`)

### 4.5 Caching Layers

**Trivia:**
- localStorage: `flicklet:daily-trivia` (daily cache)
- In-memory: None

**FlickWord:**
- localStorage: `flicklet:daily-word` (daily cache)
- In-memory: Memoization Map in `validateWord.ts`

---

## 5. PRO VS REGULAR LOGIC

### 5.1 Trivia

**Pro Users:**
- 10 questions per game
- Multiple games per day (gameNumber tracking)
- Questions offset: `(gameNumber - 1) * 10` from cached API questions

**Regular Users:**
- 5 questions per game
- 1 game per day
- Uses first 5 questions from cached API

**Detection:** `useSettings()` hook checks Pro status

### 5.2 FlickWord

**Pro Users:**
- 3 games per day (`MAX_GAMES_PRO = 3`)
- Tracked via: `flickword:games-completed:{date}` localStorage key

**Regular Users:**
- 1 game per day (`MAX_GAMES_FREE = 1`)
- Tracked via: `flickword:games-completed:{date}` localStorage key

**Detection:** `useSettings()` hook checks Pro status

---

## 6. GAME SESSION LIFECYCLE

### 6.1 Trivia

1. **Initialization:**
   - Check Pro status
   - Determine gameNumber (Pro: multiple, Regular: 1)
   - Load questions from API cache or fetch fresh
   - Supplement with hardcoded if needed

2. **Gameplay:**
   - Display question with shuffled options
   - User selects answer
   - Validate answer
   - Show explanation
   - Move to next question

3. **Completion:**
   - Calculate score
   - Save stats to localStorage
   - Dispatch `trivia:statsUpdated` event
   - Show completion screen

### 6.2 FlickWord

1. **Initialization:**
   - Check Pro status
   - Check games completed today
   - Load daily word from cache or generate
   - Restore game state from localStorage if exists

2. **Gameplay:**
   - User types guess (5 letters)
   - Validate word (local + dictionary API)
   - Score guess (correct/present/absent)
   - Update keyboard visual feedback
   - Save state to localStorage

3. **Completion:**
   - Win: Show win screen with share button
   - Loss: Show loss screen with word reveal
   - Save stats to localStorage
   - Dispatch `flickword:stats-updated` event
   - Track game completion count

---

## 7. KNOWN DEPENDENCIES

### 7.1 External Dependencies
- React (hooks, components)
- OpenTriviaDB API (trivia questions)
- Dictionary API (word validation fallback)
- Netlify Functions (API proxying)

### 7.2 Internal Dependencies
- `useSettings()` - Pro user detection
- `useTranslations()` - i18n
- `Portal.tsx` - Modal rendering
- `scrollLock.ts` - Scroll management
- localStorage API - State persistence

### 7.3 Data File Dependencies
- `accepted.json` → `localWords.ts` → `validateWord.ts`
- `commonWords.ts` → `dailyWordApi.ts`
- `excludedWords.ts` → `dailyWordApi.ts`, `validateWord.ts`

---

## 8. TEST FILES

### Trivia Tests
- `apps/web/tests/e2e/trivia-ui-fixes.spec.ts`
- `apps/web/tests/manual/trivia-ui-fixes-checklist.md`
- `apps/web/tests/TRIVIA_UI_TEST_GUIDE.md`

### FlickWord Tests
- `apps/web/tests/e2e/flickword-mobile-layout.spec.ts`
- `apps/web/tests/e2e/flickword-ui-fixes.spec.ts`
- `apps/web/tests/manual/flickword-ui-fixes-checklist.md`
- `FLICKWORD_VALIDATION_TEST_GUIDE.md`
- `test-flickword-validation.js`
- `test-flickword-debug.js`

---

## 9. LEGACY FILES (Not Used)

### Legacy Trivia
- `_legacy_v1/www/scripts/trivia.js`
- `_legacy_v1/www/scripts/modules/trivia-modal.js`
- `_legacy_v1/www/scripts/modules/daily-trivia-bridge.js`
- `_legacy_v1/www/scripts/components/TriviaTab.js`
- `_legacy_v1/www/features/trivia.html`
- `_legacy_v1/www/features/trivia-safe.js`

**Note:** These are in the legacy V1 directory and not used by the current React V2 app.

---

## 10. SUMMARY STATISTICS

**Trivia Files:** 6 active files
- 3 components (Game, Modal, Stats)
- 2 API services (triviaApi, dailyTriviaApi)
- 1 Netlify function (proxy)

**FlickWord Files:** 10+ active files
- 3 components (Game, Modal, Stats)
- 1 API service (dailyWordApi)
- 4 word utilities (validateWord, commonWords, excludedWords, localWords)
- 2 style files (flickword.css, flickword-mobile.css)
- 1 JSON data file (accepted.json)

**Shared Files:** 3
- Portal.tsx
- scrollLock.ts
- CommunityPanel.tsx (game routing)

**Total Active Files:** ~19 files
