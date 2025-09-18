# Style Drift Report
*Generated: 2025-01-12*

## Component Divergence Analysis

### Button System Drift

#### Height Inconsistencies
- **components.css**: `var(--btn-h)` (undefined variable)
- **main.css**: `min-height: 44px` (line 1439)
- **mobile.css**: `min-height: 40px` (line 198)
- **mobile.css**: `min-height: 32px` (line 602)
- **Result**: 4 different height definitions across files

#### Padding Inconsistencies
- **components.css**: `0 var(--gap-4)` (undefined variable)
- **main.css**: `8px 16px` (line 1431)
- **mobile.css**: `6px 12px` (line 196)
- **mobile.css**: `4px 8px` (line 208)
- **Result**: 4 different padding schemes

#### Background Inconsistencies
- **components.css**: `var(--color-surface)` (undefined variable)
- **main.css**: `linear-gradient(45deg, var(--primary), var(--purple))` (line 1428)
- **mobile.css**: No background override
- **Result**: Undefined CSS variables causing fallback issues

### Modal System Drift

#### Multiple Modal Implementations
1. **Standard Modal (`.modal-backdrop` + `.modal`)**
   - Z-index: `var(--z-overlay)` (999)
   - Background: `rgba(0,0,0,.6)`

2. **Game Modal (`.game-modal` + `.gm-overlay` + `.gm-dialog`)**
   - Different structure entirely
   - No consistent z-index management

3. **Share Modal (`.modal-backdrop` + `.modal.share-modal`)**
   - Inline styles: `max-width: 800px; max-height: 80vh`
   - Breaks modal system consistency

#### Z-Index Conflicts
- **Overlay**: `var(--z-overlay)` (999)
- **Modal**: `var(--z-modal)` (1000)
- **Header**: `var(--z-header)` (200)
- **Result**: Potential stacking context issues

### Card System Drift

#### Spacing Inconsistencies
- **Game Cards**: No standardized spacing
- **Feedback Cards**: `margin: 0 0 var(--space-3, 12px) 0` (line 633)
- **Settings Cards**: `padding: 15px` (inline styles)
- **Result**: No consistent spacing scale

#### Media Aspect Ratios
- **Game Cards**: No aspect ratio constraints
- **Show Cards**: No standardized poster sizing
- **Result**: Inconsistent visual hierarchy

### Settings UI Drift

#### Control Group Inconsistencies
- **Standard Controls**: `.settings-control-group` class
- **Advanced Notifications**: Inline styles `display: flex; flex-direction: column; gap: 15px; padding: 15px;`
- **Select All Controls**: Inline styles `margin-bottom: 20px; padding: 15px;`
- **Result**: Mix of CSS classes and inline styles

#### Input Styling Inconsistencies
- **Standard Inputs**: `.settings-input` class
- **Advanced Controls**: Inline styles `padding: 4px 8px; border: 1px solid #ccc; border-radius: 4px;`
- **Result**: No unified input system

### Theme System Drift

#### Dark Mode Implementation
- **components.css**: `.dark-mode .btn` overrides (lines 252-267)
- **main.css**: Theme-specific button styles (lines 410-644)
- **Result**: Scattered theme implementations

#### CSS Variable Usage
- **Defined Variables**: `--z-header`, `--z-modal`, `--z-overlay`
- **Undefined Variables**: `--btn-h`, `--gap-4`, `--color-surface`, `--color-border`
- **Result**: Fallback values not defined, causing inconsistent rendering

### Mobile Responsiveness Drift

#### Breakpoint Inconsistencies
- **Mobile Detection**: `window.innerWidth <= 768` (JavaScript)
- **CSS Media Queries**: `@media (max-width: 640px)`
- **Result**: JavaScript and CSS using different breakpoints

#### Mobile Override Conflicts
- **components.css**: Mobile-specific button styles
- **mobile.css**: Additional mobile overrides
- **main.css**: More mobile overrides
- **Result**: Conflicting mobile styles

## Root Causes

### 1. Undefined CSS Variables
- `--btn-h`, `--gap-4`, `--color-surface`, `--color-border` referenced but not defined
- Causes fallback to browser defaults or inheritance

### 2. Inline Style Pollution
- 51 instances of `style="..."` in HTML
- Bypasses CSS cascade and creates maintenance issues

### 3. Multiple CSS Files
- 5 separate CSS files with overlapping concerns
- No clear separation of responsibilities

### 4. Mobile-First vs Desktop-First
- Mixed approaches to responsive design
- JavaScript and CSS using different breakpoints

### 5. Theme System Fragmentation
- Dark mode styles scattered across multiple files
- No centralized theme token system

## Impact Assessment

### High Impact Issues
1. **Button Height Inconsistencies**: Visual jarring across components
2. **Undefined CSS Variables**: Unpredictable fallback behavior
3. **Modal Z-Index Conflicts**: Potential layering issues

### Medium Impact Issues
1. **Card Spacing Inconsistencies**: Poor visual hierarchy
2. **Settings UI Inline Styles**: Maintenance nightmare
3. **Mobile Breakpoint Mismatch**: Responsive design failures

### Low Impact Issues
1. **Theme System Fragmentation**: Cosmetic inconsistencies
2. **Input Styling Variations**: Minor visual differences

## Recommendations

### Immediate Fixes
1. **Define Missing CSS Variables**: Create comprehensive variable system
2. **Consolidate Button Heights**: Single height definition across all files
3. **Remove Inline Styles**: Move to CSS classes

### Medium-term Fixes
1. **Unify Modal System**: Single modal implementation
2. **Standardize Card Anatomy**: Consistent spacing and structure
3. **Fix Mobile Breakpoints**: Align JavaScript and CSS breakpoints

### Long-term Fixes
1. **Consolidate CSS Files**: Merge into logical structure
2. **Implement Design Tokens**: Centralized theme system
3. **Create Component Library**: Reusable, consistent components
