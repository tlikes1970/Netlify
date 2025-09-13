# Add Flow Map - Entry Points, Call Chains, Event Listeners, DOM Mutation Points

## A. Layout / Mount Order / Z-Index (Tabs vs Results)

### Entry Points
- **HTML Structure**: `www/index.html:190-195` - Search results container positioned outside home section
- **CSS Positioning**: `www/styles/components.css:1252-1305` - Tab container and search results z-index rules
- **JS Mount Logic**: `www/scripts/search-controller.js:10-63` - Search results show/hide logic

### Call Chains
1. **Search Initiation**: `performSearch()` → `showResultsUI()` → `#searchResults.style.display = 'block'`
2. **Tab Switching**: `switchToTab()` → `hideResultsUI()` → `#searchResults.style.display = 'none'`
3. **DOM Mount Order**: `.top-search` → `#searchResults` → `.tab-container` → content sections

### Event Listeners
- **Search Button**: `www/index.html:172` - `onclick="performSearch()"`
- **Tab Clicks**: `www/scripts/simple-tab-manager.js:85-91` - Hide search results on tab change
- **Search Input**: `www/index.html:1878-1881` - Enter key fallback

### DOM Mutation Points
- **Search Results**: `www/scripts/inline-script-02.js:3914-3918` - Show/hide search results container
- **Tab Container**: `www/scripts/tab-position-fix.js:15-17` - Tab positioning enforcement
- **Z-Index Conflicts**: `www/scripts/inline-script-02.js:1945-1966` - Modal z-index management

### Current Z-Index Stack
- `.tab-container`: `z-index: 10` (highest)
- `#searchResults`: `z-index: 5` (middle)
- Content sections: `z-index: 1` (lowest)

## B. Theming (Dark / Regular / Mardi Gras)

### Entry Points
- **Theme Switch**: `www/js/app.js:68-75` - `applyTheme()` function
- **Theme Packs**: `www/scripts/inline-script-01.js:3612-3668` - MP-ThemePacks system
- **CSS Variables**: `www/styles/components.css:3-24` - Root theme tokens

### Call Chains
1. **Theme Application**: `localStorage.getItem('flicklet-theme')` → `document.body.classList.toggle('dark-mode')`
2. **Theme Pack Switch**: `setThemePack(id)` → `document.body.dataset.theme = finalId`
3. **CSS Variable Cascade**: `:root` → `.dark-mode` → component-specific overrides

### Event Listeners
- **Theme Toggle**: `www/scripts/inline-script-03.js:13-256` - Theme switching buttons
- **Settings Change**: `www/js/app.js:68-75` - Settings-based theme application

### DOM Mutation Points
- **Body Classes**: `www/js/app.js:71` - `document.body.classList.toggle('dark-mode')`
- **Data Attributes**: `www/scripts/inline-script-01.js:3652-3656` - `document.body.dataset.theme`
- **CSS Variable Updates**: `www/styles/main.css:144-296` - Dark mode variable overrides

## C. i18n Pipeline

### Entry Points
- **Language Manager**: `www/js/language-manager.js:359-386` - Centralized language switching
- **App Language**: `www/js/app.js:77-86` - `applyLanguage()` function
- **Translation Function**: `www/scripts/inline-script-01.js:830-875` - `changeLanguage()` delegation

### Call Chains
1. **Language Change**: `changeLanguage(newLang)` → `LanguageManager.changeLanguage()` → `applyTranslations()`
2. **Search Refresh**: `handleSearchResultsLanguageChange()` → `performSearch()` → fresh results
3. **Trivia Refresh**: `__FlickletRefreshTrivia()` → `fetchTriviaQuestions(lang)` → new questions

### Event Listeners
- **Language Toggle**: `www/index.html:104` - Language select dropdown
- **Settings Change**: `www/js/app.js:77-86` - Settings-based language application

### DOM Mutation Points
- **Text Updates**: `www/js/language-manager.js:359-386` - Search results language refresh
- **Trivia Content**: `www/scripts/trivia.js:124-146` - Trivia question language refresh
- **UI Elements**: `www/scripts/inline-script-01.js:845-865` - Language change delegation

## D. Auth → Profile ViewModel

### Entry Points
- **Auth Listener**: `www/js/app.js:169-359` - `setupAuthListener()` function
- **User Data Loading**: `www/scripts/inline-script-02.js:466-566` - `loadUserDataFromCloud()`
- **Account Button**: `www/scripts/inline-script-01.js:1756-1797` - `updateAccountButton()`

### Call Chains
1. **Sign In**: `firebase.auth().onAuthStateChanged()` → `loadUserDataFromCloud()` → `updateAccountButton()`
2. **Profile Update**: `setAccountButtonLabel()` → `setLeftSnark()` → UI updates
3. **Settings Check**: `isAuthenticated` check → Settings access control

### Event Listeners
- **Auth State**: `www/js/app.js:172` - `firebase.auth().onAuthStateChanged()`
- **Account Button**: `www/scripts/inline-script-01.js:1883-1920` - Account button click handler
- **Sign Out**: `www/scripts/inline-script-01.js:2037` - Sign out button handler

### DOM Mutation Points
- **Account Button**: `www/scripts/inline-script-01.js:1758-1796` - Button text and title updates
- **Snark Text**: `www/scripts/inline-script-01.js:1790` - Left snark text updates
- **Settings Access**: `www/scripts/inline-script-02.js:2477` - "Please sign in" warning

## E. Mobile Base Layout / Cards

### Entry Points
- **Mobile Detection**: `www/index.html:71-72` - User agent and viewport detection
- **Card System**: `www/styles/components.css:86-137` - Card component tokens
- **Responsive Breakpoints**: `www/styles/components.css:1064-1143` - Mobile adjustments

### Call Chains
1. **Mobile Init**: `isMobileDevice` check → `body.classList.add('mobile')` → mobile styles apply
2. **Card Rendering**: `renderCard()` → mobile poster dimensions → responsive layout
3. **Container Resize**: `resizeContainers()` → mobile layout adjustments

### Event Listeners
- **Resize Events**: `www/index.html:1248` - Container resizing
- **Mobile Detection**: `www/index.html:71-72` - Initial mobile detection

### DOM Mutation Points
- **Body Classes**: `www/index.html:71-72` - Mobile class addition
- **Card Dimensions**: `www/styles/components.css:1107-1120` - Mobile poster standardization
- **Container Layout**: `www/styles/components.css:1064-1143` - Mobile responsive adjustments

## F. FlickWord & Daily Trivia Containers

### Entry Points
- **FlickWord Mount**: `www/index.html:1197-1265` - `overrideFlickWordMount()` function
- **Trivia Mount**: `www/index.html:1754-1777` - `DailyTriviaBridge.mount()` function
- **Container Styling**: `www/styles/main.css:1579-2459` - Game container CSS

### Call Chains
1. **FlickWord Init**: `initCommunityGames()` → `overrideFlickWordMount()` → `findHomeMount()`
2. **Trivia Init**: `initCommunityGames()` → `DailyTriviaBridge.mount()` → iframe creation
3. **Modal Open**: `modal:open` event → game mounting → iframe loading

### Event Listeners
- **Modal Events**: `www/index.html:1761-1771` - Modal open/close event listeners
- **Game Stats**: `www/index.html:1669-1683` - Game statistics updates
- **Container Resize**: `www/index.html:1248` - Container resizing for games

### DOM Mutation Points
- **FlickWord Container**: `www/index.html:1197-1265` - FlickWord mount point override
- **Trivia Container**: `www/index.html:1754-1777` - Trivia iframe creation
- **Game Modals**: `www/index.html:1602-1627` - Game modal open/close handling