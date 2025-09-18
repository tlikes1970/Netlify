# Add Flow Map - TV Tracker

**Date:** 2025-01-12  
**Version:** v23.83-CONTRAST-FIX  
**Purpose:** Map the complete add functionality flow from user interaction to data persistence

## Entry Points

### 1. Card Add Buttons
- **Location:** Dynamic card generation in `scripts/inline-script-02.js`
- **Selector:** `[data-action="add"]` buttons
- **Handler:** Centralized add handler via event delegation

### 2. Pro-Gated Add Buttons
- **Location:** `scripts/pro-gate.js`
- **Selector:** `[data-pro="required"]` elements
- **Handler:** Pro gate system with upsell modal

### 3. Emergency Add Functions
- **Location:** `js/emergency-functions.js`
- **Function:** `window.addToList()`
- **Purpose:** Fallback when main functions fail

## Call Chain

### Primary Flow
```
User Click → Centralized Add Handler → addToListFromCache → Data Persistence
```

### Detailed Steps
1. **User Interaction**
   - Click on `[data-action="add"]` button
   - Button contains: `data-id`, `data-media-type`, `data-list`

2. **Event Delegation**
   - `centralized-add-handler.js` captures click
   - Checks for duplicates (500ms window)
   - Extracts item data from button attributes

3. **Data Processing**
   - Calls `addToListFromCache()` function
   - Validates item data and list name
   - Checks for existing items (deduplication)

4. **Storage Operations**
   - Updates `window.appData` structure
   - Saves to localStorage
   - Attempts Firebase sync (if available)

5. **UI Updates**
   - Triggers `updateUI()` function
   - Dispatches custom events for re-rendering
   - Shows success/error notifications

## Listeners & Event Handlers

### Centralized Add Handler
- **File:** `scripts/centralized-add-handler.js`
- **Event:** `click` on document (delegated)
- **Selector:** `[data-action="add"]`
- **Deduplication:** 500ms window per item+list combination

### Pro Gate System
- **File:** `scripts/pro-gate.js`
- **Event:** `click` on gated elements
- **Behavior:** Shows upsell modal for non-Pro users
- **Selector:** `[data-pro="required"]`

### Card Actions
- **File:** `scripts/card-actions.js`
- **Event:** Various card interactions
- **Features:** "Not interested", list management
- **Storage:** `flicklet:notInterested` key

## Data Reloaders

### Custom Events
- `curated:rerender` - Triggers curated content updates
- `currentlyWatching:rerender` - Updates currently watching section
- `add:success` - Notifies successful add operations
- `add:error` - Notifies failed add operations

### UI Update Functions
- `window.updateUI()` - General UI refresh
- `window.renderCurrentlyWatchingPreview()` - Specific section update
- `window.showNotification()` - User feedback system

## Storage Systems

### Primary Storage
- **localStorage Key:** `flicklet-data`
- **Structure:** `window.appData` object
- **Categories:** `tv`, `movies`, `settings`, `notInterested`

### Backup Storage
- **Firebase:** Real-time sync (if available)
- **Emergency:** Basic localStorage fallback
- **Cache:** Search results and API responses

## Error Handling

### Graceful Degradation
- Emergency functions provide basic functionality
- Fallback to localStorage if Firebase fails
- Silent error handling for non-critical operations

### User Feedback
- Toast notifications for success/error states
- Console logging for debugging
- Visual feedback on button interactions

## Dependencies

### Required Functions
- `addToListFromCache()` - Core add functionality
- `saveAppData()` - Data persistence
- `showNotification()` - User feedback

### Required Data
- `window.appData` - Application state
- `localStorage` - Persistent storage
- Item metadata from TMDB API

## Performance Considerations

### Deduplication
- 500ms window prevents rapid duplicate adds
- Map-based tracking with automatic cleanup
- Memory-efficient duplicate detection

### Async Operations
- Non-blocking data persistence
- Background Firebase sync
- Deferred UI updates

## Security & Validation

### Input Validation
- Item ID validation (numeric)
- Media type validation (tv/movie)
- List name validation (watching/wishlist/watched)

### Data Sanitization
- HTML escaping for user-generated content
- XSS prevention in notifications
- Safe data structure handling

## Testing Points

### Manual Testing
1. Click add button on any card
2. Verify item appears in correct list
3. Check for duplicate prevention
4. Test Pro-gated functionality
5. Verify error handling

### Automated Testing
- Event delegation coverage
- Data persistence verification
- Error state handling
- Performance metrics

## Known Issues

### Current Limitations
- Pro gating may block legitimate adds
- Emergency functions are basic fallbacks
- Firebase sync failures are silent
- No offline queue for failed operations

### Future Improvements
- Enhanced error recovery
- Offline operation support
- Better Pro gate UX
- Real-time collaboration features