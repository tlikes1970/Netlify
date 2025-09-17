# Style Inventory Report
*Generated: 2025-01-12*

## Button System Analysis

### Current Button Classes Found
1. **Base Button (`.btn`)**
   - Location: `www/styles/components.css:72-78`
   - Properties: `display:inline-flex`, `align-items:center`, `justify-content:center`
   - Height: `var(--btn-h)`, Padding: `0 var(--gap-4)`
   - Border-radius: `var(--btn-radius)`, Border: `1px solid var(--color-border)`
   - Background: `var(--color-surface)`, Color: `var(--color-text)`

2. **Button Variants**
   - `.btn.primary` - Gradient background, white text, no border
   - `.btn.secondary` - `var(--color-surface-2)` background
   - `.btn.ghost` - Transparent background, border only
   - `.btn.danger` - `var(--color-danger)` background, white text
   - `.btn.success` - Green gradient background
   - `.btn--sm` - Smaller variant (36px height, 6px 10px padding)

### Button Usage Patterns
- **Long Labels Found:**
  - "Manage Not Interested List" (28 chars)
  - "Select what to share" (20 chars)
  - "Generate Share Link" (18 chars)
  - "Report a Bug" (12 chars)
  - "Suggest a Feature" (17 chars)

### Button Issues Identified
1. **Inconsistent Sizing**: Multiple height definitions (36px, 40px, 44px)
2. **Text Wrapping**: No max-width or text truncation rules
3. **Mobile Overrides**: Conflicting mobile-specific button styles
4. **Theme Inconsistency**: Dark mode overrides scattered across files

## Card Anatomy Analysis

### Current Card Classes
1. **Game Cards (`.game-card`)**
   - Structure: `.gc-bg`, `.gc-head`, `.gc-cta`
   - Usage: FlickWord and Trivia tiles

2. **Feedback Cards (`.feedback-card`)**
   - Structure: `.feedback-actions` container
   - Usage: Settings page feedback section

3. **Settings Cards (`.card-surface`)**
   - Structure: Used for settings blocks
   - Usage: Advanced notifications, select all controls

### Card Issues Identified
1. **Inconsistent Spacing**: No standardized spacing scale
2. **Missing Action Slots**: No "Not interested" placeholder slot
3. **Mobile Responsiveness**: Cards break on small screens
4. **Media Aspect Ratios**: No standardized poster/image sizing

## Modal/Toast System Analysis

### Current Modal Classes
1. **Modal Backdrop (`.modal-backdrop`)**
   - Position: `fixed`, `inset:0`
   - Background: `rgba(0,0,0,.6)`
   - Z-index: `var(--z-overlay)`

2. **Modal Container (`.modal`)**
   - Position: `fixed`, `inset:0`
   - Display: `flex`, `align-items:center`, `justify-content:center`
   - Z-index: `var(--z-modal)`

3. **Game Modals (`.game-modal`)**
   - Structure: `.gm-overlay`, `.gm-dialog`
   - Usage: FlickWord and Trivia games

### Modal Issues Identified
1. **Inconsistent Styling**: Multiple modal implementations
2. **No Toast System**: No dedicated toast notification component
3. **Theme Integration**: Modals don't properly inherit theme tokens
4. **Accessibility**: Missing proper ARIA attributes

## Settings UI Analysis

### Current Settings Structure
1. **Settings Tabs (`.settings-tabs`)**
   - Role: `tablist`
   - Sections: General, Notifications, Layout

2. **Settings Controls (`.settings-control-group`)**
   - Structure: Label + Input/Button + Hint
   - Usage: All settings form elements

3. **Settings Inputs (`.settings-input`)**
   - Types: Text, number, checkbox, select
   - Styling: Inconsistent across input types

### Settings Issues Identified
1. **Missing FOBs**: No "First Order Buttons" visible
2. **Broken Auto-Detect**: "Auto-detect dark mode" option present but non-functional
3. **Theme Toggle Issues**: Theme toggles don't visually switch
4. **Episode Tracking**: "Enable episode tracking" not visually present
5. **Pro Features**: Pro-gated features not clearly indicated

## Quote Bar Analysis

### Current Quote Bar Structure
1. **Quote Bar (`.quote-bar`)**
   - Role: `region`, `aria-label="Quote of the moment"`
   - Display: `none` (hidden by default)

2. **Quote Marquee (`.quote-marquee`)**
   - Contains: `.quote-text` with loading message
   - Styling: No specific CSS found

### Quote Bar Issues Identified
1. **No Container Sizing**: No width/height constraints
2. **No Line Clamp**: No text overflow handling
3. **No Ellipsis**: No text truncation styling
4. **Layout Shift**: No stable container dimensions

## CSS File Structure
- `components.css` - Main component styles (3,443 lines)
- `main.css` - Theme and layout styles
- `mobile.css` - Mobile-specific overrides
- `consolidated-layout.css` - Layout consolidation
- `action-bar.css` - Action bar specific styles

## Recommendations
1. **Standardize Button System**: Create consistent btn base + variants
2. **Implement Card Anatomy**: Standardize spacing, media, actions
3. **Unify Modal System**: Single modal shell + toast component
4. **Fix Settings UI**: Add FOBs, fix theme toggles, show episode tracking
5. **Stabilize Quote Bar**: Add container sizing and text overflow handling
