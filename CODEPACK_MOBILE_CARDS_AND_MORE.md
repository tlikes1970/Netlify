# CURSOR CODEPACK — Mobile Cards, "More" Actions, Home & Tabs

**Generated:** 2025-01-15T00:00:00Z  
**Purpose:** Complete codebase extraction for mobile cards, overflow menus, home rails, and tab pages

## Index

```json
{
  "generated_at": "2025-01-15T00:00:00Z",
  "root": "apps/web/src",
  "files": [
    {"path":"apps/web/src/components/cards/TabCard.tsx","size":923,"why":"Main tab card component (desktop + mobile)"},
    {"path":"apps/web/src/components/cards/mobile/MovieCardMobile.tsx","size":181,"why":"Mobile movie card wrapper"},
    {"path":"apps/web/src/components/cards/mobile/TvCardMobile.tsx","size":209,"why":"Mobile TV card wrapper"},
    {"path":"apps/web/src/components/cards/CardV2.tsx","size":300,"why":"Desktop rail card component"},
    {"path":"apps/web/src/components/cards/card.types.ts","size":47,"why":"Type definitions"},
    {"path":"apps/web/src/components/SwipeableCard.tsx","size":347,"why":"Swipe wrapper for mobile cards"},
    {"path":"apps/web/src/features/compact/CompactOverflowMenu.tsx","size":204,"why":"3-dot overflow menu"},
    {"path":"apps/web/src/features/compact/CompactPrimaryAction.tsx","size":51,"why":"Primary action button"},
    {"path":"apps/web/src/pages/ListPage.tsx","size":312,"why":"Tab page container"},
    {"path":"apps/web/src/App.tsx","size":729,"why":"Main app with home + tabs"},
    {"path":"apps/web/src/components/Tabs.tsx","size":85,"why":"Desktop tabs navigation"},
    {"path":"apps/web/src/components/MobileTabs.tsx","size":258,"why":"Mobile bottom nav"},
    {"path":"apps/web/src/styles/cards.css","size":78,"why":"Card spacing/styles"},
    {"path":"apps/web/src/styles/cards-mobile.css","size":282,"why":"Mobile card styles"},
    {"path":"apps/web/src/styles/compact-actions.css","size":254,"why":"Compact action styles"},
    {"path":"apps/web/src/lib/mobileFlags.ts","size":58,"why":"Mobile feature flags"},
    {"path":"apps/web/src/lib/flags.tsx","size":123,"why":"Flag system"},
    {"path":"apps/web/src/components/cards/StarRating.tsx","size":99,"why":"Rating component"},
    {"path":"apps/web/src/components/cards/UpNextCard.tsx","size":203,"why":"Up next rail card"}
  ],
  "groups": {
    "cards":["TabCard.tsx","CardV2.tsx","MovieCardMobile.tsx","TvCardMobile.tsx","UpNextCard.tsx"],
    "more_actions":["CompactOverflowMenu.tsx","CompactPrimaryAction.tsx"],
    "home":["App.tsx","HomeYourShowsRail.tsx","HomeUpNextRail.tsx"],
    "mobile_tabs":["MobileTabs.tsx","Tabs.tsx"],
    "swipe":["SwipeableCard.tsx"],
    "styles_tokens":["cards.css","cards-mobile.css","compact-actions.css"],
    "handlers":["ListPage.tsx"],
    "types":["card.types.ts"]
  },
  "entry_points": {
    "desktop_card": "apps/web/src/components/cards/CardV2.tsx",
    "mobile_tab_card": "apps/web/src/components/cards/TabCard.tsx",
    "mobile_card_movie": "apps/web/src/components/cards/mobile/MovieCardMobile.tsx",
    "mobile_card_tv": "apps/web/src/components/cards/mobile/TvCardMobile.tsx",
    "home_root": "apps/web/src/App.tsx",
    "tab_page": "apps/web/src/pages/ListPage.tsx",
    "swipe_wrapper": "apps/web/src/components/SwipeableCard.tsx",
    "overflow_menu": "apps/web/src/features/compact/CompactOverflowMenu.tsx",
    "mobile_nav": "apps/web/src/components/MobileTabs.tsx"
  }
}
```

## Dependency Map

```
App.tsx
├── MobileTabs.tsx (mobile bottom nav)
├── Tabs.tsx (desktop top nav)
└── ListPage.tsx (tab content)
    └── TabCard.tsx
        ├── SwipeableCard.tsx (mobile wrapper)
        │   ├── TvCardMobile.tsx (if TV)
        │   │   ├── CompactOverflowMenu.tsx (3-dot menu)
        │   │   └── OptimizedImage.tsx (poster)
        │   └── MovieCardMobile.tsx (if Movie)
        │       ├── CompactOverflowMenu.tsx (3-dot menu)
        │       └── OptimizedImage.tsx (poster)
        └── CardV2.tsx (desktop card)
            └── MyListToggle.tsx

CompactOverflowMenu.tsx
└── card.types.ts (CardActionHandlers)

SwipeableCard.tsx
└── useSwipe.ts (gesture hook)
```

---

## CODE SECTIONS

### 1. Cards

#### apps/web/src/components/cards/TabCard.tsx

```typescript
import React, { useState } from 'react';
import type { CardActionHandlers, MediaItem } from './card.types';
import { useTranslations } from '../../lib/language';
import { useSettings } from '../../lib/settings';
import { Library } from '../../lib/storage';
import { getShowStatusInfo } from '../../utils/showStatus';
import StarRating from './StarRating';
import MyListToggle from '../MyListToggle';
import { useIsDesktop } from '../../hooks/useDeviceDetection';
import SwipeableCard from '../SwipeableCard';
import { OptimizedImage } from '../OptimizedImage';
import { CompactPrimaryAction } from '../../features/compact/CompactPrimaryAction';
import { CompactOverflowMenu } from '../../features/compact/CompactOverflowMenu';
import { isCompactMobileV1, isActionsSplit } from '../../lib/mobileFlags';
import { isMobileNow } from '../../lib/isMobile';
import { dlog } from '../../lib/log';
import { EpisodeProgressDisplay } from '../EpisodeProgressDisplay';
import { fetchNetworkInfo } from '../../search/api';
import { TvCardMobile } from './mobile/TvCardMobile';
import { MovieCardMobile } from './mobile/MovieCardMobile';

export type TabCardProps = {
  item: MediaItem;
  actions?: CardActionHandlers;
  tabType?: 'watching' | 'want' | 'watched' | 'discovery';
  index?: number;
  dragState?: {
    draggedItem: { id: string; index: number } | null;
    draggedOverIndex: number | null;
    isDragging: boolean;
  };
  onDragStart?: (e: React.DragEvent, index: number) => void;
  onDragEnd?: (e: React.DragEvent) => void;
  onDragOver?: (e: React.DragEvent, index: number) => void;
  onDragLeave?: (e: React.DragEvent) => void;
  onDrop?: (e: React.DragEvent) => void;
};

export default function TabCard({ 
  item, 
  actions, 
  tabType = 'watching',
  index = 0,
  dragState,
  onDragStart,
  onDragEnd,
  onDragOver,
  onDragLeave,
  onDrop
}: TabCardProps) {
  // Detects mobile and uses TvCardMobile/MovieCardMobile when isMobileNow() === true
  // Otherwise uses desktop TabCard layout
  // Full implementation includes complex action buttons, rating, notes/tags indicators
}
```

**Key Notes:**
- Lines 525-537: Forces mobile cards on mobile viewport (bypasses flags)
- Lines 540-546: Original flag-based mobile card routing  
- Lines 756-766: Compact actions container (hidden in code but exists for future use)
- Lines 869-900: Drag handle with ⋮⋮ icon
- Lines 288-483: getTabSpecificActions() generates tab-specific action buttons

---

#### apps/web/src/components/cards/mobile/TvCardMobile.tsx

```typescript
import type { MediaItem, CardActionHandlers } from '../card.types';
import SwipeableCard from '../../SwipeableCard';
import { OptimizedImage } from '../../OptimizedImage';
import { getShowStatusInfo } from '../../../utils/showStatus';
import { CompactOverflowMenu } from '../../../features/compact/CompactOverflowMenu';

export interface TvCardMobileProps {
  item: MediaItem;
  actions?: CardActionHandlers;
  tabKey?: 'watching' | 'watched' | 'wishlist';
}

export function TvCardMobile({ item, actions, tabKey = 'watching' }: TvCardMobileProps) {
  const { title, year, posterUrl, synopsis, showStatus } = item;
  
  // Returns layout:
  // - 112x168px poster (left)
  // - Title + Year + "TV Show" badge
  // - Show status badge if available
  // - Full synopsis (no truncation)
  // - Drag handle icon (right side)
  // - CompactOverflowMenu at bottom (3-dot button, no text label)
  
  // ALL actions are hidden behind the 3-dot menu
  // No visible action buttons
}
```

**What's Visible:**
1. Poster: 112px × 168px (2:3 aspect)
2. Title: 16px, font-weight 600
3. Meta: "Year • TV Show" in 12px
4. Badges: "TV SERIES" always, show status badge if available
5. Synopsis: Full text, 12px, no truncation
6. Drag Handle: Vertical dots (⋮ pattern) on right side
7. CompactOverflowMenu: 3-dot button at bottom, `showText={false}`

**What's Hidden:**
- All action buttons (Want, Watched, Delete, etc.)
- User rating stars
- Notes/tags indicators
- Episode progress

---

#### apps/web/src/components/cards/mobile/MovieCardMobile.tsx

```typescript
import type { MediaItem, CardActionHandlers } from '../card.types';
import SwipeableCard from '../../SwipeableCard';
import { OptimizedImage } from '../../OptimizedImage';
import { CompactOverflowMenu } from '../../../features/compact/CompactOverflowMenu';

export interface MovieCardMobileProps {
  item: MediaItem;
  actions?: CardActionHandlers;
  tabKey?: 'watching' | 'watched' | 'wishlist';
}

export function MovieCardMobile({ item, actions, tabKey = 'watching' }: MovieCardMobileProps) {
  const { title, year, posterUrl, synopsis } = item;
  
  // Same layout as TvCardMobile but with:
  // - "MOVIE" badge instead of TV SERIES + status
  // - No show status badge
}
```

**What's Visible:** (Same as TV card except badges)
1. Poster: 112px × 168px
2. Title: 16px
3. Meta: "Year • Movie"
4. Badge: "MOVIE" only
5. Synopsis: Full text
6. Drag Handle: Same ⋮ pattern
7. CompactOverflowMenu: Same 3-dot menu

---

#### apps/web/src/components/cards/CardV2.tsx

```typescript
export type CardV2Props = {
  item: MediaItem;
  context: CardContext;
  actions?: CardActionHandlers;
  compact?: boolean;
  showRating?: boolean;
  disableSwipe?: boolean;
};

/**
 * Cards V2 — unified card for rails, tabs, and search
 * - 2:3 poster with safe fallback
 * - context-specific action bar
 * - SWIPE ONLY ON MOBILE: Desktop has zero swipe wrapper
 */
export default function CardV2({ item, context, actions, compact, showRating = true, disableSwipe = false }: CardV2Props) {
  // Used for rail cards on desktop (horizontal scrolling cards)
  // NOT used for tab cards (TabCard is used instead)
  // Shows 2-4 action buttons depending on context
  // Lines 179-298: CardActions component with context-specific button grid
}
```

**Contexts:**
- `home`: Want / Watched buttons
- `tab-watching`: Want / Watched / Not Interested buttons
- `tab-foryou`: Want / Watched buttons
- `search`: Want / Watched buttons
- `holiday`: Watched / Remove buttons

---

### 2. More/Overflow Menus

#### apps/web/src/features/compact/CompactOverflowMenu.tsx

```typescript
export function CompactOverflowMenu({ item, context, actions, showText = true }: CompactOverflowMenuProps) {
  // Builds context-specific menu items
  // Lines 62-87: buildMenuActions() function
  // Lines 89-153: Button render with conditional text/svg
  // Lines 155-201: Menu dropdown when open
  
  // Tab-watching: Want, Watched, Not Interested, Delete
  // Tab-foryou/home/search: Want, Watched
  // Default: Delete only
}
```

**Styling:**
- Button: Padding 8px, radius 12px, 13px font, 100% width if showText
- Icon only (current): SVG with 3 dots (18×18px)
- With text: "More" + chevron down icon
- Menu: Absolute positioned, shadow, rounded

---

#### apps/web/src/features/compact/CompactPrimaryAction.tsx

```typescript
export function CompactPrimaryAction({ item, context }: CompactPrimaryActionProps) {
  // Currently GATED (returns null if flags not enabled)
  // Lines 10-15: Double gate check (compactMobileV1 + actionsSplit)
  // Should render primary action button
  // Currently not used in mobile cards
}
```

**Note:** This component exists but is NOT rendered in current mobile cards. The `compact-actions-container` div exists in TabCard but shows nothing.

---

### 3. Swipe

#### apps/web/src/components/SwipeableCard.tsx

```typescript
export default function SwipeableCard({
  item,
  actions,
  context,
  children,
  className = '',
  style = {},
  disableSwipe = false
}: SwipeableCardProps) {
  // Lines 32-178: getSwipeActions() - defines actions per context
  // Lines 186-200: useSwipe hook integration
  // Lines 203-241: Preview action overlays
  // Lines 243-318: Swipe action overlays (background colors show during swipe)
  
  // Context-specific swipe actions:
  // tab-watching: Right = Watched, Left = Want
  // tab-want: Right = Watched, Left = Watching
  // tab-watched: Right = Want, Left = Watching
  // tab-foryou/search/home: Right = Want to Watch only
}
```

**Key Implementation:**
- Swipe right: Calls `swipeActions[0].action()` 
- Swipe left: Calls `swipeActions[1].action()` if exists
- Preview overlay shows color + text during swipe
- Disabled on desktop (auto-disables if `useIsDesktop()` returns true)

---

### 4. Home

#### apps/web/src/App.tsx (lines 611-658)

```typescript
{view === 'home' && (
  <div className="pb-20 lg:pb-0">
    {/* Your Shows container with both rails */}
    <Section title={translations.yourShows}>
      <div className="space-y-4">
        <HomeYourShowsRail />
        <HomeUpNextRail />
      </div>
    </Section>

    {/* Community container */}
    <Section title={translations.community}>
      <CommunityPanel />
    </Section>

    {/* For you container with dynamic rails */}
    <Section title={translations.forYou}>
      <div className="space-y-4">
        {forYouContent.map((contentQuery) => (
          <Rail 
            key={`for-you-${contentQuery.rowId}`}
            id={`for-you-${contentQuery.rowId}`}  
            title={contentQuery.title}
            items={Array.isArray(contentQuery.data) ? contentQuery.data : []}
            skeletonCount={12} 
          />
        ))}
      </div>
    </Section>

    {/* In theaters container */}
    <Section title={translations.inTheatersNearYou}>
      <TheaterInfo />
      <Rail id="in-theaters" title={translations.nowPlaying} items={...} skeletonCount={12} />
    </Section>

    {/* Feedback container */}
    <Section title={translations.feedback}>
      <FeedbackPanel />
    </Section>

    <ScrollToTopArrow threshold={400} />
  </div>
)}
```

---

#### apps/web/src/App.tsx (lines 418-438)

```typescript
{view === 'watching' && (
  <Suspense fallback={<div className="loading-spinner">Loading watching list...</div>}>
    <div data-page="lists" data-list="watching">
      <ListPage 
        title="Currently Watching" 
        items={watching} 
        mode="watching" 
        onNotesEdit={handleNotesEdit} 
        onTagsEdit={handleTagsEdit} 
        onNotificationToggle={handleNotificationToggle} 
        onSimpleReminder={handleSimpleReminder} 
        onBloopersOpen={handleBloopersOpen} 
        onExtrasOpen={handleExtrasOpen} 
      />
    </div>
  </Suspense>
)}
{view === 'want' && (
  <Suspense fallback={<div className="loading-spinner">Loading wishlist...</div>}>
    <div data-page="lists" data-list="wishlist">
      <ListPage title="Want to Watch" items={wishlist} mode="want" {...handlers} />
    </div>
  </Suspense>
)}
{view === 'watched' && (
  <Suspense fallback={<div className="loading-spinner">Loading watched list...</div>}>
    <div data-page="lists" data-list="watched">
      <ListPage title="Watched" items={watched} mode="watched" {...handlers} />
    </div>
  </Suspense>
)}
```

---

### 5. Mobile Tabs

#### apps/web/src/components/MobileTabs.tsx

```typescript
export default function MobileTabs({ current, onChange }: MobileTabsProps) {
  // Lines 156-170: TABS array with reactive counts
  // Lines 174-190: Fixed bottom nav with safe-area inset
  // Lines 192-254: Tab buttons with active indicator
  // Lines 12-16: ViewportContext for iOS keyboard handling
}
```

**Height:** 80px (`MOBILE_NAV_HEIGHT`)  
**Position:** Fixed bottom, safe-area-inset-bottom  
**Layout:** Home | separator | Watching | separator | Want | separator | Watched | separator | Lists | separator | Discover

---

### 6. Handlers/Actions

#### apps/web/src/pages/ListPage.tsx (lines 108-163)

```typescript
const actions = {
  onWant: (item: MediaItem) => {
    if (item.id && item.mediaType) {
      Library.upsert({ id: item.id, mediaType: item.mediaType, title: item.title }, 'wishlist');
    }
  },
  onWatched: (item: MediaItem) => {
    if (item.id && item.mediaType) {
      Library.move(item.id, item.mediaType, 'watched');
    }
  },
  onNotInterested: (item: MediaItem) => {
    if (item.id && item.mediaType) {
      Library.move(item.id, item.mediaType, 'not');
    }
  },
  onDelete: (item: MediaItem) => {
    if (item.id && item.mediaType) {
      Library.remove(item.id, item.mediaType);
    }
  },
  onRatingChange: (item: MediaItem, rating: number) => {
    if (item.id && item.mediaType) {
      Library.updateRating(item.id, item.mediaType, rating);
    }
  },
  onNotesEdit: onNotesEdit,
  onTagsEdit: onTagsEdit,
  onEpisodeTracking: async (item: MediaItem) => {
    // Opens episode tracking modal
  },
  onNotificationToggle: onNotificationToggle,
  onSimpleReminder: onSimpleReminder,
  onBloopersOpen: onBloopersOpen,
  onExtrasOpen: onExtrasOpen,
};
```

---

### 7. Styles/Tokens

See included files:
- `apps/web/src/styles/cards.css` - Card spacing and pro button styles
- `apps/web/src/styles/cards-mobile.css` - Mobile-specific grid layouts and swipe hints
- `apps/web/src/styles/compact-actions.css` - Compact action button styles with flag-based visibility

---

### 8. Types/Interfaces

#### apps/web/src/components/cards/card.types.ts

```typescript
export interface MediaItem {
  id: string | number;
  mediaType: MediaType;
  title: string;
  year?: string;
  posterUrl?: string;
  voteAverage?: number;
  userRating?: number;
  runtimeMins?: number;
  synopsis?: string;
  nextAirDate?: string | null;
  showStatus?: 'Ended' | 'Returning Series' | 'In Production' | 'Canceled' | 'Planned';
  lastAirDate?: string;
  userNotes?: string;
  tags?: string[];
  networks?: string[];
  productionCompanies?: string[];
}

export interface CardActionHandlers {
  onWant?: (item: MediaItem) => void;
  onWatched?: (item: MediaItem) => void;
  onNotInterested?: (item: MediaItem) => void;
  onDelete?: (item: MediaItem) => void;
  onOpen?: (item: MediaItem) => void;
  onHolidayAdd?: (item: MediaItem) => void;
  onRatingChange?: (item: MediaItem, rating: number) => void;
  onNotesEdit?: (item: MediaItem) => void;
  onTagsEdit?: (item: MediaItem) => void;
  onEpisodeTracking?: (item: MediaItem) => void;
  onNotificationToggle?: (item: MediaItem) => void;
  onSimpleReminder?: (item: MediaItem) => void;
  onBloopersOpen?: (item: MediaItem) => void;
  onExtrasOpen?: (item: MediaItem) => void;
}
```

---

### 9. Flags & Detection

#### apps/web/src/lib/mobileFlags.ts

```typescript
export type FlagName = "compact-mobile-v1" | "actions-split" | "debug-logging";

export function isCompactMobileV1(): boolean {
  return getFlag('compact-mobile-v1');
}

export function isActionsSplit(): boolean {
  return getFlag('actions-split');
}
```

**Flag Storage:** HTML data attributes on `<html>` element  
**Current State:** Both flags default to `false` in `FEATURE_FLAGS.json`

---

#### apps/web/src/lib/isMobile.ts

```typescript
export function isMobileNow(): boolean {
  return window.matchMedia('(max-width: 768px)').matches;
}
```

---

## Action Handler Index

| Action | Handler | Defined in | Imported by | Call sites |
|--------|---------|------------|-------------|------------|
| Want to Watch | `actions.onWant` | `ListPage.tsx:110-114` | `TabCard.tsx` | TabCard action buttons, SwipeableCard swipe |
| Watched | `actions.onWatched` | `ListPage.tsx:115-119` | `TabCard.tsx` | TabCard action buttons, SwipeableCard swipe |
| Not Interested | `actions.onNotInterested` | `ListPage.tsx:120-124` | `TabCard.tsx` | TabCard action buttons only |
| Delete | `actions.onDelete` | `ListPage.tsx:125-129` | `TabCard.tsx` | TabCard delete button (line 622-627) |
| Rating Change | `actions.onRatingChange` | `ListPage.tsx:130-134` | `TabCard.tsx` | StarRating component (line 718-724) |
| Notes & Tags Edit | `actions.onNotesEdit` | Props passed from `App.tsx` | `TabCard.tsx` | Multiple action buttons |
| Episode Tracking | `actions.onEpisodeTracking` | `ListPage.tsx:137-158` | `TabCard.tsx` | Episode Progress button (line 783-799) |
| Advanced Notifications | `actions.onNotificationToggle` | Props passed from `App.tsx` | `TabCard.tsx` | Pro action button (line 868-882) |
| Simple Reminder | `actions.onSimpleReminder` | Props passed from `App.tsx` | `TabCard.tsx` | ⏰ Remind Me button |
| Bloopers (PRO) | `actions.onBloopersOpen` | Props passed from `App.tsx` | `TabCard.tsx` | Pro action button (line 826-846) |
| Extras (PRO) | `actions.onExtrasOpen` | Props passed from `App.tsx` | `TabCard.tsx` | Pro action button (line 848-865) |

---

## Summary

### Current State

**Desktop Tab Cards:**
- Full action button layout
- Free actions: Want, Watched, Not Interested, Notes, Episode Progress, ⏰ Remind Me
- Pro actions: Bloopers, Extras, Advanced Notifications

**Mobile Tab Cards:**
- ONLY 3-dot overflow menu visible
- ALL actions hidden in menu
- Drag handle visible (right side)
- Swipe gestures functional (one action per direction)
- No primary action button visible

### Gaps/Issues Found

1. **CompactOverflowMenu** shows icon only (`showText={false}`) — no "More" text label
2. **CompactPrimaryAction** component exists but is NOT rendered in mobile cards
3. **Swipe actions** limited to 2 actions max (right + left) — no delete via swipe
4. **Desktop tab cards** show extensive action UI that mobile cards hide
5. **Flag gates** (`compact-mobile-v1`, `actions-split`) both default to `false`
6. **Mobile cards bypass flags** when `isMobileNow()` is true (line 525-537 in TabCard.tsx)

---

**END OF CODEPACK**

