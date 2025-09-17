# Renderer Map - Card vs List View Analysis

**Date:** January 15, 2025  
**Analysis:** Template/renderer system causing card→list shift  

## 🎯 **RENDERER SYSTEM OVERVIEW**

### **Current Architecture**
```
Personalized Rows System
├── personalized.js (main renderer)
├── Card v2 System (preferred)
└── Legacy Card System (fallback)
```

## 🔍 **RENDERER SELECTION LOGIC**

### **1. Card v2 Detection**
**Location:** `www/scripts/rows/personalized.js:15`  
**Logic:**
```javascript
const USE_CARD_V2 = !!(window.FLAGS && window.FLAGS.cards_v2 && window.Card);
```

**Issue:** Card v2 availability depends on:
- `window.FLAGS.cards_v2` flag
- `window.Card` function availability
- Script loading order

### **2. Renderer Selection**
**Location:** `www/scripts/rows/personalized.js:212-216`  
**Logic:**
```javascript
function createCardElement(item) {
  if (!item) return null;
  
  try {
    if (USE_CARD_V2) {
      return createCardV2(item);  // Uses 'compact' variant
    } else {
      return createLegacyCard(item);  // Uses traditional card
    }
  } catch (error) {
    console.error('❌ Failed to create card element:', error);
    return null;
  }
}
```

## 🚨 **ROOT CAUSE: CARD V2 VARIANT ISSUE**

### **Card v2 Configuration**
**Location:** `www/scripts/rows/personalized.js:235-252`  
**Current State:**
```javascript
return window.Card({
  variant: 'compact',  // ❌ This renders as list item
  id: item.id,
  posterUrl: posterUrl,
  title: title,
  subtitle: year,
  rating: rating,
  badges: [],
  primaryAction: {
    label: window.t ? window.t('common.add') : 'Add',
    onClick: () => addToList(item)
  },
  overflowActions: [{
    label: window.t ? window.t('common.more') : 'More',
    onClick: () => openMore(item)
  }],
  onOpenDetails: () => openDetails(item)
});
```

**Problem:** `variant: 'compact'` renders cards as list items instead of poster cards

## 🔧 **RENDERER CALL GRAPH**

### **Current Flow**
```
mountPersonalizedSection()
├── renderPresetRow()
│   ├── loadPresetContent()
│   │   └── createCardElement()
│   │       ├── USE_CARD_V2 ? createCardV2() : createLegacyCard()
│   │       └── Card({ variant: 'compact' })  // ❌ List view
│   └── scrollerEl.appendChild(cardElement)
└── Card rendered as list item
```

### **Desired Flow**
```
mountPersonalizedSection()
├── renderPresetRow()
│   ├── loadPresetContent()
│   │   └── createCardElement()
│   │       ├── USE_CARD_V2 ? createCardV2() : createLegacyCard()
│   │       └── Card({ variant: 'poster' })  // ✅ Grid view
│   └── scrollerEl.appendChild(cardElement)
└── Card rendered as poster grid
```

## 📊 **CARD V2 VARIANTS ANALYSIS**

### **Available Variants**
Based on code analysis, Card v2 supports:
- `'compact'` - List item layout (current)
- `'poster'` - Poster card layout (needed)
- `'grid'` - Grid item layout (alternative)

### **Variant Behavior**
| Variant | Layout | Use Case | Current Issue |
|---------|--------|----------|---------------|
| `compact` | List item | Search results | Used for home rows |
| `poster` | Poster card | Home rows | Not used |
| `grid` | Grid item | Grid layouts | Not used |

## 🎯 **FIX STRATEGIES**

### **Strategy 1: Change Card v2 Variant (Recommended)**
**File:** `www/scripts/rows/personalized.js:236`  
**Change:**
```javascript
return window.Card({
  variant: 'poster',  // ✅ Change from 'compact' to 'poster'
  // ... rest of config
});
```

**Pros:**
- Simple one-line fix
- Maintains Card v2 system
- Preserves all functionality

**Cons:**
- Depends on Card v2 implementation
- May need CSS adjustments

### **Strategy 2: Force Legacy Cards**
**File:** `www/scripts/rows/personalized.js:15`  
**Change:**
```javascript
const USE_CARD_V2 = false;  // ✅ Force legacy cards
```

**Pros:**
- Guaranteed poster layout
- No Card v2 dependencies
- Known working system

**Cons:**
- Loses Card v2 features
- May break other functionality
- Temporary solution

### **Strategy 3: CSS Override**
**File:** `www/styles/consolidated.css`  
**Add:**
```css
.card[data-variant="compact"] {
  display: grid !important;
  grid-template-columns: repeat(auto-fill, minmax(150px, 1fr)) !important;
  gap: 12px !important;
}
```

**Pros:**
- No JavaScript changes
- Works with current system
- Easy to implement

**Cons:**
- CSS override approach
- May conflict with Card v2 styles
- Not semantic solution

## 🔍 **CARD V2 SYSTEM ANALYSIS**

### **Card v2 Dependencies**
**Required:**
- `window.FLAGS.cards_v2` - Feature flag
- `window.Card` - Card constructor function
- Card v2 CSS styles
- Action handlers

### **Card v2 Loading Order**
```
1. Firebase init
2. Utils/App loading
3. Card v2 component loading
4. Personalized rows loading
5. Card v2 availability check
```

### **Potential Loading Issues**
- Card v2 may not be loaded when personalized rows initialize
- Feature flag may not be set
- CSS may not be loaded
- Action handlers may not be wired

## 🎯 **RECOMMENDED FIX**

### **Primary Fix: Change Variant**
**File:** `www/scripts/rows/personalized.js:236`  
**Change:**
```javascript
return window.Card({
  variant: 'poster',  // ✅ Change from 'compact'
  id: item.id,
  posterUrl: posterUrl,
  title: title,
  subtitle: year,
  rating: rating,
  badges: [],
  primaryAction: {
    label: window.t ? window.t('common.add') : 'Add',
    onClick: () => addToList(item)
  },
  overflowActions: [{
    label: window.t ? window.t('common.more') : 'More',
    onClick: () => openMore(item)
  }],
  onOpenDetails: () => openDetails(item)
});
```

### **Backup Fix: CSS Grid Override**
**File:** `www/styles/consolidated.css`  
**Add:**
```css
/* Force card grid layout for all card containers */
.curated-row .row__scroller,
.preview-row-scroll {
  display: grid !important;
  grid-template-columns: repeat(auto-fill, minmax(150px, 1fr)) !important;
  gap: 12px !important;
  overflow-x: auto;
  padding: 8px 0;
}

/* Ensure cards maintain aspect ratio */
.card {
  aspect-ratio: 2/3;
  min-height: 200px;
  display: flex;
  flex-direction: column;
  overflow: hidden;
}
```

## 📋 **TESTING CHECKLIST**

After renderer fixes:
- [ ] Cards display as poster grid
- [ ] No list items in home rows
- [ ] Card aspect ratios consistent
- [ ] Three-dots menus work
- [ ] Add buttons work
- [ ] Card hover effects work
- [ ] Mobile layout preserved
- [ ] No JavaScript errors

## 🔄 **ROLLBACK PLAN**

If Card v2 variant change causes issues:
1. Revert to `variant: 'compact'`
2. Implement CSS grid override
3. Force legacy card system
4. Debug Card v2 loading issues

## 📊 **IMPACT ASSESSMENT**

| Fix Strategy | Complexity | Risk | Effectiveness |
|--------------|------------|------|---------------|
| Change Variant | Low | Low | High |
| Force Legacy | Low | Medium | High |
| CSS Override | Medium | Low | Medium |
| Debug Loading | High | Low | High |


