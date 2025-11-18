# Card Variants Inventory - React V2 App

## Card Components Found

### 1. CardV2 (Primary Card Component)
- **File**: `apps/web/src/components/cards/CardV2.tsx`
- **Props**: 
  - `item: MediaItem` (required)
  - `context: CardContext` (required) - 'home' | 'tab-watching' | 'tab-foryou' | 'search' | 'holiday'
  - `actions?: CardActionHandlers` (optional)
  - `compact?: boolean` (optional) - smaller text, still 2:3 poster
  - `showRating?: boolean` (optional, default true)
  - `disableSwipe?: boolean` (optional) - disable swipe actions
- **Where Rendered**:
  - Home page rails (`HomeYourShowsRail.tsx`)
  - Discovery page (`DiscoveryPage.tsx`)
  - My Lists page (`MyListsPage.tsx`)
- **Actions Present**: Want/Watched/Not Interested/Delete/Open (context-dependent)
- **Layout**: 2:3 poster aspect ratio, 120px mobile / 154px desktop width
- **Features**: Swipeable wrapper, MyListToggle integration, holiday chip support

### 2. TabCard (Horizontal Layout Card)
- **File**: `apps/web/src/components/cards/TabCard.tsx`
- **Props**:
  - `item: MediaItem` (required)
  - `actions?: CardActionHandlers` (optional)
  - `tabType?: 'watching' | 'want' | 'watched' | 'discovery'` (optional)
  - `index?: number` (optional)
  - `dragState?: object` (optional) - drag and drop state
  - `onDragStart/End/Over/Leave/Drop?: function` (optional) - drag handlers
- **Where Rendered**:
  - List pages (`ListPage.tsx`) - for tab-based list views
- **Actions Present**: Want/Watched/Not Interested/Delete/Open, drag and drop
- **Layout**: Horizontal layout - 160px poster on left, content on right
- **Features**: Drag and drop support, mobile ellipsis handling, star ratings

### 3. UpNextCard (Special Episode Card)
- **File**: `apps/web/src/components/cards/UpNextCard.tsx`
- **Props**:
  - `item: MediaItem` (required)
- **Where Rendered**:
  - Home page "Up Next" rail (`HomeUpNextRail.tsx`)
- **Actions Present**: None (display only)
- **Layout**: Larger size (220px vs 154px), shows "Up Next: [date]" instead of actions
- **Features**: Episode information display, date formatting, no interactive actions

### 4. SearchCard (Legacy Search Card)
- **File**: `apps/web/src/components/SearchCard.tsx`
- **Props**:
  - `id: string` (required)
  - `kind: 'movie'|'tv'` (required)
  - `title: string` (required)
  - `poster: string` (required)
- **Where Rendered**:
  - Search results (legacy implementation)
- **Actions Present**: Want/Watching/Not Interested, Holiday assignment
- **Layout**: 154px width, 2:3 poster aspect ratio
- **Features**: Holiday modal integration, simple action buttons

### 5. Card (Legacy Base Card)
- **File**: `apps/web/src/components/Card.tsx`
- **Props**:
  - `id?: string` (optional)
  - `kind?: 'movie'|'tv'` (optional)
  - `title?: string` (optional)
  - `poster?: string` (optional)
  - `mode?: 'catalog' | 'watching'` (optional)
  - `showHolidayTag?: boolean` (optional)
- **Where Rendered**:
  - Legacy implementations (likely deprecated)
- **Actions Present**: Want/Watched/Not Interested/Delete, Holiday assignment
- **Layout**: Variable based on mode
- **Features**: Holiday modal integration, legacy Library integration

### 6. SwipeableCard (Wrapper Component)
- **File**: `apps/web/src/components/SwipeableCard.tsx`
- **Props**:
  - `item: MediaItem` (required)
  - `actions?: CardActionHandlers` (optional)
  - `context: CardContext` (required)
  - `children: React.ReactNode` (required)
  - `className?: string` (optional)
  - `style?: React.CSSProperties` (optional)
  - `disableSwipe?: boolean` (optional)
- **Where Rendered**:
  - Wraps CardV2 and TabCard components
- **Actions Present**: Swipe gestures (left/right), auto-disabled on desktop
- **Layout**: Transparent wrapper, provides swipe functionality
- **Features**: Touch gesture handling, desktop auto-disable, swipe state management

## Card Usage Patterns

### Home Page
- **CardV2**: Used in "Your Shows" rail with context='home'
- **UpNextCard**: Used in "Up Next" rail for episode information

### Tab Pages (List Pages)
- **TabCard**: Used for horizontal list layout with drag and drop

### Discovery Page
- **CardV2**: Used with context='tab-foryou' for discovery content

### Search Results
- **SearchCard**: Legacy implementation (may be deprecated)

### My Lists Page
- **CardV2**: Used with context='home' for custom list display

## Action Handler Types

All cards use the `CardActionHandlers` interface:
- `onWant?: (item: MediaItem) => void`
- `onWatched?: (item: MediaItem) => void`
- `onNotInterested?: (item: MediaItem) => void`
- `onDelete?: (item: MediaItem) => void`
- `onOpen?: (item: MediaItem) => void`
- `onRate?: (item: MediaItem, rating: number) => void`

## Card Context Types

Cards adapt their behavior based on `CardContext`:
- `'home'`: Home page rails
- `'tab-watching'`: Watching tab
- `'tab-foryou'`: Discovery/For You tab
- `'search'`: Search results
- `'holiday'`: Holiday-themed content

## Recommendations

1. **Consolidation**: Consider consolidating SearchCard and Card into CardV2
2. **Context Expansion**: CardV2 handles most contexts well, could replace legacy cards
3. **Swipe Integration**: SwipeableCard wrapper provides consistent swipe behavior
4. **Drag and Drop**: Only TabCard supports drag and drop - consider extending to other contexts
5. **Responsive Design**: All cards use responsive sizing (mobile/desktop breakpoints)















































