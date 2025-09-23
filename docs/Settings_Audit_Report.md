# Settings Audit Report
**Flicklet TV Tracker v27.36**  
*Generated: January 17, 2025*

## Table of Contents
- [Summary](#summary)
- [Settings Architecture](#settings-architecture)
- [Tab Structure & UI Markup](#tab-structure--ui-markup)
- [Settings Controls & Storage Mapping](#settings-controls--storage-mapping)
- [Pro Gating System](#pro-gating-system)
- [Persistence Layer](#persistence-layer)
- [Data Management Features](#data-management-features)
- [Routing & Navigation](#routing--navigation)
- [Internationalization](#internationalization)
- [Styling & CSS](#styling--css)
- [Testing Coverage](#testing-coverage)
- [Dependencies & Side Effects](#dependencies--side-effects)
- [Risks & Recommendations](#risks--recommendations)

## Summary

The Flicklet TV Tracker Settings system is a comprehensive configuration interface built as a vanilla JavaScript SPA with the following characteristics:

**✅ What's Working:**
- Complete 6-tab settings interface (General, Notifications, Layout, Data, Pro, About)
- Deterministic settings wiring system with JSON configuration
- Comprehensive Pro gating with preview mode
- Full data management (export/import/reset/share)
- Multi-language support (EN/ES)
- Responsive design with theme support
- Extensive test coverage

**⚠️ Areas of Concern:**
- Some settings controls lack proper validation
- Inconsistent autosave behavior across controls
- Limited error handling in data management functions
- Some dead code and unused preference keys

## Settings Architecture

### Framework & Tooling
- **Framework**: Vanilla JavaScript SPA
- **Build System**: Vite v5.4.20
- **Testing**: Playwright v1.55.0
- **Styling**: CSS with CSS custom properties
- **Storage**: localStorage + Firebase Firestore
- **i18n**: Custom translation system

### Entry Points
- **Main Tab**: `#settingsTab` (requires authentication)
- **Section Container**: `#settingsSection`
- **Tab Navigation**: `.settings-tabs` with `role="tablist"`
- **Content Area**: `.settings-container`

## Tab Structure & UI Markup

### 1. General Tab (`#general`)
```html
<section id="general" class="settings-section active">
  <h3 class="settings-title">⚙️ General</h3>
  
  <!-- Display Name -->
  <div class="settings-control-group">
    <input id="displayNameInput" class="settings-input" />
    <button id="saveNameBtn" onclick="saveDisplayName()">💾 Save</button>
  </div>
  
  <!-- Statistics Display -->
  <div id="statsContent" class="settings-stats">
    <div class="loading">Loading stats...</div>
  </div>
  
  <!-- Not Interested Management -->
  <button id="manageNotInterestedBtn" onclick="openNotInterestedModal()">
    🚫 Manage Not Interested List
  </button>
</section>
```

### 2. Notifications Tab (`#notifications`)
```html
<section id="notifications" class="settings-section">
  <h3 class="settings-title">🔔 Notifications</h3>
  
  <!-- Basic Notifications -->
  <input type="checkbox" id="notifEpisodes" class="settings-checkbox" />
  <input type="checkbox" id="notifDiscover" class="settings-checkbox" />
  <input type="checkbox" id="notifDigest" class="settings-checkbox" />
  
  <!-- Pro Notifications -->
  <div class="settings-subsection">
    <h4>⭐ Pro Notifications</h4>
    <input type="checkbox" id="advOn" disabled />
    <select id="advLead" disabled>
      <option value="6">6</option>
      <option value="12">12</option>
      <option value="24" selected>24</option>
      <option value="48">48</option>
    </select>
  </div>
</section>
```

### 3. Layout Tab (`#layout`)
```html
<section id="layout" class="settings-section">
  <h3 class="settings-title">🎨 Layout Settings</h3>
  
  <!-- Core Features -->
  <input type="checkbox" id="condensedMode" class="settings-checkbox" />
  <input type="checkbox" id="showPosters" class="settings-checkbox" checked />
  
  <!-- Theme Toggle -->
  <button id="themeToggleBtn" data-action="toggle-theme">
    <span id="themeToggleIcon">🌙</span>
    <span id="themeToggleText">Dark Mode</span>
  </button>
  
  <!-- Home Page Lists Count -->
  <input type="number" id="settingCuratedRows" min="1" max="3" value="3" />
  
  <!-- Currently Watching Preview Limit -->
  <input type="number" id="settingCurrentlyWatchingLimit" min="5" max="20" value="12" />
  
  <!-- Episode Tracking -->
  <input type="checkbox" id="enableEpisodeTracking" class="settings-checkbox" />
  
  <!-- Pro Theme Packs -->
  <select id="themePackSelect">
    <option value="classic" selected>Classic</option>
    <option value="dark" disabled>Dark Pro 🔒</option>
    <option value="neon" disabled>Neon Pro 🔒</option>
    <option value="minimal" disabled>Minimal Pro 🔒</option>
  </select>
</section>
```

### 4. Data Tab (`#data`)
```html
<section id="data" class="settings-section">
  <h3 class="settings-title">💾 Data Management</h3>
  
  <!-- Export/Import -->
  <button id="exportBtn">📤 Export JSON</button>
  <button id="importBtn">📥 Import JSON</button>
  <input type="file" id="importInput" accept=".json,application/json" hidden />
  
  <!-- Not Interested Management -->
  <button id="viewNotInterestedBtn">👁️ View Not Interested Items</button>
  <button id="clearNotInterestedBtn">🗑️ Clear All</button>
  
  <!-- Share Lists -->
  <button id="shareOpenBtn" data-action="share-lists">🔗 Share Lists</button>
  
  <!-- Reset All Data -->
  <button id="resetBtn">🗑️ Reset All Data</button>
  
  <!-- Pro CSV Export -->
  <button id="exportCsvBtn" data-pro="required">📊 Export CSV (Pro)</button>
</section>
```

### 5. Pro Tab (`#pro`)
```html
<section id="pro" class="settings-section">
  <h3 class="settings-title">⭐ Pro Features</h3>
  
  <!-- Preview Pro Features -->
  <button id="previewProBtn" onclick="toggleProPreview()">
    ⭐ Preview Pro Features
  </button>
  
  <!-- Pro Features List -->
  <div id="proFeaturesList" class="settings-pro-features">
    <!-- Dynamic Pro features list -->
  </div>
</section>
```

### 6. About Tab (`#about`)
```html
<section id="about" class="settings-section">
  <h3 class="settings-title">🏠 About Unique4U</h3>
  <h3 class="settings-title">👥 About the Creators</h3>
  <h3 class="settings-title">📱 About the App</h3>
  
  <!-- Feedback Form -->
  <form name="feedback" method="POST" data-netlify="true">
    <textarea id="feedbackMessage" name="message" required></textarea>
    <button type="submit">📤 Share It!</button>
  </form>
</section>
```

## Settings Controls & Storage Mapping

### Complete Preference Keys Table

| Control | Storage Key | Default | Type | Auto-save | Pro Gate |
|---------|-------------|---------|------|-----------|----------|
| `#displayNameInput` | `pref_displayName` | `''` | text | ❌ | ❌ |
| `#notifEpisodes` | `pref_epAlerts` | `false` | toggle | ✅ | ❌ |
| `#notifDiscover` | `pref_weeklyDiscover` | `false` | toggle | ✅ | ❌ |
| `#notifDigest` | `pref_monthlyDigest` | `false` | toggle | ✅ | ❌ |
| `#advOn` | `pref_proNotifToggle` | `false` | toggle | ✅ | ✅ |
| `#advLead` | `pref_proNotifLeadTime` | `24` | select | ✅ | ✅ |
| `#advListWatching` | `pref_proNotifLists_watching` | `true` | multiselect | ✅ | ✅ |
| `#advListWishlist` | `pref_proNotifLists_wishlist` | `false` | multiselect | ✅ | ✅ |
| `#advListWatched` | `pref_proNotifLists_watched` | `false` | multiselect | ✅ | ✅ |
| `#condensedMode` | `pref_condensed` | `false` | toggle | ✅ | ❌ |
| `#showPosters` | `pref_showPosters` | `true` | toggle | ✅ | ❌ |
| `#settingCuratedRows` | `pref_homeListsCount` | `3` | number | ✅ | ❌ |
| `#settingCurrentlyWatchingLimit` | `pref_watchingPreviewMax` | `12` | number | ✅ | ❌ |
| `#enableEpisodeTracking` | `pref_episodeTracking` | `false` | toggle | ✅ | ❌ |
| `#themePackSelect` | `pref_proThemePack` | `classic` | select | ✅ | ✅ |

### Settings Wiring System

The settings system uses a deterministic wiring approach via `www/js/settings-wire-strict.js`:

```javascript
// Configuration-driven binding
const config = {
  "groups": [
    {
      "key": "general",
      "controls": [
        { "key": "displayName", "type": "text", "selector": "#displayNameInput", "storageKey": "pref_displayName" }
      ]
    }
  ]
};

// Handler types: toggle, select, text, button, file, multiselect, label
const handlers = {
  toggle: (element, config) => {
    element.addEventListener('change', () => {
      localStorage.setItem(config.storageKey, element.checked.toString());
    });
  }
};
```

## Pro Gating System

### Pro Status Detection
```javascript
// Source of truth for Pro status
const isPro = window.appData?.settings?.pro || false;

// Pro preview mode
function toggleProPreview() {
  // Toggles Pro features on/off for testing
}
```

### Pro-Gated Features
1. **Advanced Notifications** (`#advOn`, `#advLead`, `#advList*`)
   - Custom lead times
   - List monitoring
   - Disabled by default for non-Pro users

2. **Theme Packs** (`#themePackSelect`)
   - Classic (free)
   - Dark Pro, Neon Pro, Minimal Pro (locked)

3. **CSV Export** (`#exportCsvBtn`)
   - JSON export available to all
   - CSV export requires Pro

4. **Extra Trivia** (in games)
   - 5 questions/day (free)
   - 50 questions/day (Pro)

### Pro UI States
```css
/* Pro-locked elements */
[data-pro="required"] {
  opacity: 0.6;
  pointer-events: none;
}

.meta-muted {
  color: var(--fg-muted);
  font-style: italic;
}
```

## Persistence Layer

### Storage Architecture
```javascript
// Global app data structure
window.appData = {
  settings: {
    displayName: '',
    lang: 'en',
    theme: 'light',
    pro: false,
    notif: {}
  },
  tv: { watching: [], wishlist: [], watched: [] },
  movies: { watching: [], wishlist: [], watched: [] }
};

// Persistence functions
window.saveAppData = function() {
  localStorage.setItem('flicklet-data', JSON.stringify(window.appData));
};

window.loadAppData = function() {
  const saved = localStorage.getItem('flicklet-data');
  if (saved) {
    Object.assign(window.appData, JSON.parse(saved));
  }
};
```

### Firebase Integration
```javascript
// Firestore settings sync
async readSettings(uid) {
  const ref = db.collection('users').doc(uid).collection('settings').doc('app');
  const snap = await ref.get();
  return snap.exists ? snap.data() : { theme: "system", lang: "en" };
}

async writeSettings(uid, data) {
  const ref = db.collection('users').doc(uid).collection('settings').doc('app');
  await ref.set(data, { merge: true });
}
```

## Data Management Features

### Export Functions
```javascript
// JSON Export
function exportDataJson() {
  const data = {
    settings: window.appData.settings,
    tv: window.appData.tv,
    movies: window.appData.movies,
    exportedAt: new Date().toISOString()
  };
  
  const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `flicklet-backup-${new Date().toISOString().split('T')[0]}.json`;
  a.click();
}

// CSV Export (Pro only)
function exportToCSV() {
  if (!window.appData?.settings?.pro) {
    alert('CSV export requires Pro subscription');
    return;
  }
  // CSV export logic
}
```

### Import Functions
```javascript
function importDataJson(file) {
  const reader = new FileReader();
  reader.onload = (e) => {
    try {
      const data = JSON.parse(e.target.result);
      Object.assign(window.appData, data);
      window.saveAppData();
      location.reload();
    } catch (error) {
      alert('Invalid backup file');
    }
  };
  reader.readAsText(file);
}
```

### Reset Functions
```javascript
function resetAllData() {
  if (confirm('⚠️ Permanently delete all data? This cannot be undone.')) {
    localStorage.removeItem('flicklet-data');
    localStorage.removeItem('flicklet-language');
    // Clear other related keys
    location.reload();
  }
}
```

### Share Functions
```javascript
function shareLists() {
  // Generate shareable text list
  const watching = window.appData.tv.watching.map(item => `📺 ${item.title}`);
  const wishlist = window.appData.tv.wishlist.map(item => `📖 ${item.title}`);
  const watched = window.appData.tv.watched.map(item => `✅ ${item.title}`);
  
  const shareText = `My Flicklet Lists:\n\nCurrently Watching:\n${watching.join('\n')}\n\nWant to Watch:\n${wishlist.join('\n')}\n\nAlready Watched:\n${watched.join('\n')}`;
  
  navigator.clipboard.writeText(shareText);
}
```

## Routing & Navigation

### Settings Tab Navigation
```javascript
// Tab switching logic
setupSettingsTabs() {
  const settingsTabs = document.querySelectorAll('.settings-tabs button[data-target]');
  settingsTabs.forEach(tab => {
    tab.addEventListener('click', (e) => {
      const targetId = tab.getAttribute('data-target');
      
      // Update tab states
      settingsTabs.forEach(btn => {
        btn.classList.remove('active');
        btn.setAttribute('aria-selected', 'false');
      });
      tab.classList.add('active');
      tab.setAttribute('aria-selected', 'true');
      
      // Show target section
      const sections = document.querySelectorAll('.settings-section');
      sections.forEach(section => {
        section.classList.remove('active');
        section.style.display = 'none';
      });
      
      const targetSection = document.querySelector(targetId);
      if (targetSection) {
        targetSection.classList.add('active');
        targetSection.style.display = 'block';
      }
    });
  });
}
```

### Deep Link Support
- No URL hash support for settings tabs
- Settings tab requires authentication (`data-requires-auth`)
- No direct navigation to specific settings sections

## Internationalization

### Translation Keys Used
```html
<!-- Settings Tab Labels -->
<span data-i18n="general">General</span>
<span data-i18n="notifications">Notifications</span>
<span data-i18n="layout">Layout</span>
<span data-i18n="data">Data</span>
<span data-i18n="pro">Pro</span>
<span data-i18n="about">About</span>

<!-- Control Labels -->
<span data-i18n="display_name">Display Name</span>
<span data-i18n="episode_alerts">Upcoming episode alerts</span>
<span data-i18n="condensed_list_view">Condensed list view</span>
<span data-i18n="export_json">Export JSON</span>
<span data-i18n="preview_pro_features">Preview Pro Features</span>
```

### Language Switching
```javascript
// Language persistence
const savedLang = localStorage.getItem('flicklet-language') || 'en';
window.appData.settings.lang = savedLang;

// Translation application
function applyTranslations(lang) {
  document.querySelectorAll('[data-i18n]').forEach(el => {
    const key = el.getAttribute('data-i18n');
    el.textContent = translations[lang][key] || key;
  });
}
```

## Styling & CSS

### Settings-Specific Styles
```css
/* Settings Tabs */
.settings-tabs {
  display: flex;
  gap: 8px;
  margin-bottom: 20px;
  border-bottom: 1px solid var(--border);
}

.settings-tabs button {
  padding: 12px 16px;
  border: none;
  background: transparent;
  cursor: pointer;
  border-bottom: 2px solid transparent;
}

.settings-tabs button.active {
  border-bottom-color: var(--primary);
  color: var(--primary);
}

/* Settings Sections */
.settings-section {
  display: none;
  padding: 20px;
}

.settings-section.active {
  display: block;
}

/* Settings Controls */
.settings-control-group {
  margin-bottom: 24px;
}

.settings-checkbox-label {
  display: flex;
  align-items: center;
  gap: 8px;
  cursor: pointer;
}

.settings-input {
  padding: 8px 12px;
  border: 1px solid var(--border);
  border-radius: 4px;
  font-size: 14px;
}

/* Pro Gating Styles */
[data-pro="required"] {
  opacity: 0.6;
  pointer-events: none;
}

.meta-muted {
  font-size: 0.8rem;
  font-style: italic;
  color: var(--fg-muted);
}
```

### Theme Support
```css
/* Dark Mode */
.dark-mode .settings-section {
  background: var(--card);
  border-color: var(--border);
  color: var(--text);
}

/* Mardi Gras Theme */
.mardi .settings-tabs button {
  background: linear-gradient(45deg, var(--mardi1), var(--mardi3));
  color: white;
  border: 2px solid var(--mardi2);
}
```

## Testing Coverage

### Playwright Tests
1. **Language Validation** (`tests/language-validation.spec.ts`)
   - Tests language switching across all settings elements
   - Validates persistence after page reload
   - Checks data-i18n attribute handling

2. **Not Interested Feature** (`tests/not-interested-feature.spec.ts`)
   - Tests Not Interested management in settings
   - Validates modal functionality
   - Tests list management controls

3. **Community Player** (`tests/community-player.spec.ts`)
   - Tests settings-related community features
   - Validates accessibility attributes

### Test Selectors Used
```javascript
// Settings navigation
'#settingsTab'
'#settingsSection'
'.settings-tabs button[data-target="#about"]'

// Settings controls
'#manageNotInterestedBtn'
'#notInterestedModal'
'#displayNameInput'
'#condensedMode'
'#showPosters'

// Language switching
'#langToggle'
'[data-i18n]'
'[data-i18n-placeholder]'
```

## Dependencies & Side Effects

### Settings Dependencies
```
Settings UI Files:
├── www/index.html (settings markup)
├── www/js/settings-wire-strict.js (wiring system)
├── www/config/settings-wiring.json (configuration)
├── www/js/app.js (tab switching logic)
└── www/styles/components.css (settings styles)

Helpers:
├── www/js/utils.js (appData, saveAppData, loadAppData)
├── www/js/functions.js (data management functions)
├── www/js/i18n.js (translation system)
└── www/js/language-manager.js (language switching)

Storage:
├── localStorage (preferences)
├── Firebase Firestore (cloud sync)
└── www/js/firebase-init.js (Firebase setup)

Tests:
├── tests/language-validation.spec.ts
├── tests/not-interested-feature.spec.ts
└── tests/community-player.spec.ts
```

### Cross-Module Side Effects
1. **Theme Changes** → Updates CSS custom properties globally
2. **Language Changes** → Re-renders all translated elements
3. **Layout Settings** → Affects home page rendering
4. **Pro Status** → Enables/disables Pro features across app
5. **Data Reset** → Clears all user data and reloads page

## Risks & Recommendations

### ⚠️ Critical Issues
1. **Inconsistent Autosave**: Some controls auto-save, others require manual save
2. **Limited Validation**: Number inputs lack proper bounds checking
3. **Error Handling**: Data management functions lack comprehensive error handling
4. **Dead Code**: Some preference keys are defined but never used

### 🔧 Quick Wins
1. **Standardize Autosave**: Make all controls auto-save consistently
2. **Add Input Validation**: Implement proper bounds checking for number inputs
3. **Improve Error Handling**: Add try-catch blocks and user feedback
4. **Clean Up Dead Code**: Remove unused preference keys and handlers

### 📈 Enhancement Opportunities
1. **URL Hash Support**: Add deep linking to specific settings tabs
2. **Settings Search**: Add search functionality within settings
3. **Bulk Operations**: Allow bulk enable/disable of notification settings
4. **Settings Backup**: Auto-backup settings before major changes
5. **Pro Trial**: Add time-limited Pro trial functionality

### 🧪 Testing Gaps
1. **Settings Tab Switching**: No tests for tab navigation
2. **Data Management**: Limited tests for export/import/reset functions
3. **Pro Gating**: No tests for Pro feature enable/disable
4. **Theme Switching**: No tests for theme changes
5. **Error Scenarios**: No tests for invalid data handling

---

**Report Generated**: January 17, 2025  
**Total Settings Controls**: 15  
**Pro-Gated Features**: 4  
**Test Files**: 3  
**Storage Keys**: 15  
**i18n Keys**: 25+
