# Style Plan - Token/Utility Classes to Reconcile
*Generated: 2025-01-12*

## Design Token System

### Color Tokens
```css
:root {
  /* Primary Colors */
  --color-primary: #e91e63;
  --color-primary-dark: #c2185b;
  --color-primary-light: #f8bbd9;
  
  /* Surface Colors */
  --color-surface: #ffffff;
  --color-surface-2: #f5f5f5;
  --color-surface-3: #eeeeee;
  
  /* Text Colors */
  --color-text: #333333;
  --color-text-secondary: #666666;
  --color-text-muted: #999999;
  
  /* Border Colors */
  --color-border: #e0e0e0;
  --color-border-light: #f0f0f0;
  --color-border-dark: #cccccc;
  
  /* Status Colors */
  --color-success: #2ed573;
  --color-warning: #ffa726;
  --color-danger: #f06292;
  --color-info: #42a5f5;
  
  /* Dark Mode Overrides */
  --color-surface-dark: #1a1a1a;
  --color-surface-2-dark: #2a2a2a;
  --color-text-dark: #ffffff;
  --color-text-secondary-dark: #cccccc;
  --color-border-dark: #404040;
}
```

### Spacing Tokens
```css
:root {
  /* Spacing Scale */
  --space-1: 4px;
  --space-2: 8px;
  --space-3: 12px;
  --space-4: 16px;
  --space-5: 20px;
  --space-6: 24px;
  --space-8: 32px;
  --space-10: 40px;
  --space-12: 48px;
  --space-16: 64px;
  
  /* Component Spacing */
  --btn-padding-x: var(--space-4);
  --btn-padding-y: var(--space-2);
  --card-padding: var(--space-6);
  --modal-padding: var(--space-8);
}
```

### Typography Tokens
```css
:root {
  /* Font Sizes */
  --text-xs: 12px;
  --text-sm: 14px;
  --text-base: 16px;
  --text-lg: 18px;
  --text-xl: 20px;
  --text-2xl: 24px;
  --text-3xl: 30px;
  
  /* Font Weights */
  --font-normal: 400;
  --font-medium: 500;
  --font-semibold: 600;
  --font-bold: 700;
  
  /* Line Heights */
  --leading-tight: 1.25;
  --leading-normal: 1.5;
  --leading-relaxed: 1.75;
}
```

### Component Tokens
```css
:root {
  /* Button Tokens */
  --btn-height: 44px;
  --btn-height-sm: 36px;
  --btn-height-lg: 52px;
  --btn-radius: 8px;
  --btn-radius-sm: 6px;
  --btn-radius-lg: 12px;
  
  /* Card Tokens */
  --card-radius: 12px;
  --card-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
  --card-shadow-hover: 0 4px 16px rgba(0, 0, 0, 0.15);
  
  /* Modal Tokens */
  --modal-radius: 16px;
  --modal-shadow: 0 8px 32px rgba(0, 0, 0, 0.3);
  --modal-backdrop: rgba(0, 0, 0, 0.6);
  
  /* Z-Index Scale */
  --z-dropdown: 100;
  --z-sticky: 200;
  --z-fixed: 300;
  --z-modal-backdrop: 400;
  --z-modal: 500;
  --z-popover: 600;
  --z-tooltip: 700;
}
```

## Button System Standardization

### Base Button Class
```css
.btn {
  /* Layout */
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: var(--space-2);
  
  /* Sizing */
  height: var(--btn-height);
  padding: var(--btn-padding-y) var(--btn-padding-x);
  min-width: var(--btn-height);
  
  /* Typography */
  font-size: var(--text-sm);
  font-weight: var(--font-semibold);
  line-height: var(--leading-tight);
  text-decoration: none;
  
  /* Visual */
  border: 1px solid var(--color-border);
  border-radius: var(--btn-radius);
  background: var(--color-surface);
  color: var(--color-text);
  
  /* Interaction */
  cursor: pointer;
  transition: all 0.2s ease;
  
  /* Accessibility */
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}
```

### Button Variants
```css
/* Primary Button */
.btn--primary {
  background: linear-gradient(135deg, var(--color-primary), var(--color-primary-dark));
  color: white;
  border: none;
  box-shadow: 0 2px 4px rgba(233, 30, 99, 0.3);
}

.btn--primary:hover {
  transform: translateY(-1px);
  box-shadow: 0 4px 8px rgba(233, 30, 99, 0.4);
}

/* Secondary Button */
.btn--secondary {
  background: var(--color-surface-2);
  color: var(--color-text);
  border-color: var(--color-border-dark);
}

.btn--secondary:hover {
  background: var(--color-surface-3);
}

/* Ghost Button */
.btn--ghost {
  background: transparent;
  color: var(--color-text);
  border-color: var(--color-border);
}

.btn--ghost:hover {
  background: var(--color-surface-2);
}

/* Danger Button */
.btn--danger {
  background: var(--color-danger);
  color: white;
  border: none;
}

.btn--danger:hover {
  background: #e91e63;
  transform: translateY(-1px);
}

/* Success Button */
.btn--success {
  background: var(--color-success);
  color: white;
  border: none;
}

.btn--success:hover {
  background: #26a69a;
  transform: translateY(-1px);
}
```

### Button Sizes
```css
.btn--sm {
  height: var(--btn-height-sm);
  padding: var(--space-1) var(--space-3);
  font-size: var(--text-xs);
}

.btn--lg {
  height: var(--btn-height-lg);
  padding: var(--space-3) var(--space-6);
  font-size: var(--text-lg);
}

.btn--icon {
  width: var(--btn-height);
  padding: 0;
}

.btn--icon.btn--sm {
  width: var(--btn-height-sm);
}
```

### Button States
```css
.btn:disabled {
  opacity: 0.6;
  cursor: not-allowed;
  transform: none !important;
}

.btn:focus-visible {
  outline: 2px solid var(--color-primary);
  outline-offset: 2px;
}

.btn.loading {
  pointer-events: none;
  opacity: 0.8;
}

.btn.loading .btn-content {
  display: none;
}

.btn.loading .btn-loading {
  display: inline-flex;
  align-items: center;
  gap: var(--space-2);
}
```

## Card Anatomy Standardization

### Base Card Class
```css
.card {
  /* Layout */
  display: flex;
  flex-direction: column;
  
  /* Sizing */
  width: 100%;
  min-height: 200px;
  
  /* Visual */
  background: var(--color-surface);
  border: 1px solid var(--color-border);
  border-radius: var(--card-radius);
  box-shadow: var(--card-shadow);
  
  /* Spacing */
  padding: var(--card-padding);
  gap: var(--space-4);
  
  /* Interaction */
  transition: all 0.2s ease;
  cursor: pointer;
}

.card:hover {
  box-shadow: var(--card-shadow-hover);
  transform: translateY(-2px);
}
```

### Card Components
```css
/* Card Header */
.card__header {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: var(--space-3);
}

.card__title {
  font-size: var(--text-lg);
  font-weight: var(--font-semibold);
  color: var(--color-text);
  line-height: var(--leading-tight);
  margin: 0;
}

.card__subtitle {
  font-size: var(--text-sm);
  color: var(--color-text-secondary);
  margin: var(--space-1) 0 0 0;
}

/* Card Media */
.card__media {
  width: 100%;
  aspect-ratio: 16/9;
  object-fit: cover;
  border-radius: var(--btn-radius);
  background: var(--color-surface-2);
}

.card__media--poster {
  aspect-ratio: 2/3;
}

/* Card Body */
.card__body {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: var(--space-3);
}

.card__description {
  font-size: var(--text-sm);
  color: var(--color-text-secondary);
  line-height: var(--leading-normal);
  margin: 0;
}

/* Card Actions */
.card__actions {
  display: flex;
  gap: var(--space-2);
  flex-wrap: wrap;
  margin-top: auto;
}

.card__actions .btn {
  flex: 1;
  min-width: 0;
}

/* Not Interested Placeholder */
.card__not-interested {
  display: none;
  padding: var(--space-4);
  text-align: center;
  color: var(--color-text-muted);
  font-style: italic;
}

.card__not-interested.visible {
  display: block;
}
```

## Modal System Standardization

### Base Modal Classes
```css
/* Modal Backdrop */
.modal-backdrop {
  position: fixed;
  inset: 0;
  background: var(--modal-backdrop);
  z-index: var(--z-modal-backdrop);
  display: none;
  opacity: 0;
  transition: opacity 0.2s ease;
}

.modal-backdrop.visible {
  display: block;
  opacity: 1;
}

/* Modal Container */
.modal {
  position: fixed;
  inset: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: var(--z-modal);
  pointer-events: none;
  padding: var(--space-4);
}

.modal.visible {
  pointer-events: auto;
}

/* Modal Dialog */
.modal__dialog {
  background: var(--color-surface);
  border-radius: var(--modal-radius);
  box-shadow: var(--modal-shadow);
  max-width: 90vw;
  max-height: 90vh;
  overflow: hidden;
  transform: scale(0.9);
  transition: transform 0.2s ease;
}

.modal.visible .modal__dialog {
  transform: scale(1);
}

/* Modal Header */
.modal__header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: var(--space-6);
  border-bottom: 1px solid var(--color-border);
}

.modal__title {
  font-size: var(--text-xl);
  font-weight: var(--font-semibold);
  color: var(--color-text);
  margin: 0;
}

.modal__close {
  background: none;
  border: none;
  font-size: var(--text-2xl);
  color: var(--color-text-secondary);
  cursor: pointer;
  padding: var(--space-2);
  line-height: 1;
}

/* Modal Body */
.modal__body {
  padding: var(--space-6);
  overflow-y: auto;
  max-height: 60vh;
}

/* Modal Actions */
.modal__actions {
  display: flex;
  gap: var(--space-3);
  justify-content: flex-end;
  padding: var(--space-6);
  border-top: 1px solid var(--color-border);
  background: var(--color-surface-2);
}
```

### Toast System
```css
/* Toast Container */
.toast-container {
  position: fixed;
  top: var(--space-4);
  right: var(--space-4);
  z-index: var(--z-tooltip);
  display: flex;
  flex-direction: column;
  gap: var(--space-2);
}

/* Toast */
.toast {
  display: flex;
  align-items: center;
  gap: var(--space-3);
  padding: var(--space-4);
  background: var(--color-surface);
  border: 1px solid var(--color-border);
  border-radius: var(--btn-radius);
  box-shadow: var(--card-shadow);
  min-width: 300px;
  max-width: 400px;
  transform: translateX(100%);
  transition: transform 0.3s ease;
}

.toast.visible {
  transform: translateX(0);
}

.toast__icon {
  font-size: var(--text-lg);
}

.toast__content {
  flex: 1;
}

.toast__title {
  font-weight: var(--font-semibold);
  color: var(--color-text);
  margin: 0 0 var(--space-1) 0;
}

.toast__message {
  font-size: var(--text-sm);
  color: var(--color-text-secondary);
  margin: 0;
}

.toast__close {
  background: none;
  border: none;
  color: var(--color-text-secondary);
  cursor: pointer;
  padding: var(--space-1);
}
```

## Settings UI Standardization

### Settings Container
```css
.settings-container {
  max-width: 800px;
  margin: 0 auto;
  padding: var(--space-6);
}

.settings-tabs {
  display: flex;
  gap: var(--space-2);
  margin-bottom: var(--space-8);
  border-bottom: 1px solid var(--color-border);
}

.settings-tab {
  padding: var(--space-3) var(--space-4);
  background: none;
  border: none;
  color: var(--color-text-secondary);
  cursor: pointer;
  border-bottom: 2px solid transparent;
  transition: all 0.2s ease;
}

.settings-tab.active {
  color: var(--color-primary);
  border-bottom-color: var(--color-primary);
}

.settings-section {
  display: none;
}

.settings-section.active {
  display: block;
}
```

### Settings Controls
```css
.settings-control-group {
  margin-bottom: var(--space-6);
}

.settings-label {
  display: block;
  font-weight: var(--font-semibold);
  color: var(--color-text);
  margin-bottom: var(--space-2);
}

.settings-input {
  width: 100%;
  padding: var(--space-3);
  border: 1px solid var(--color-border);
  border-radius: var(--btn-radius);
  font-size: var(--text-base);
  background: var(--color-surface);
  color: var(--color-text);
  transition: border-color 0.2s ease;
}

.settings-input:focus {
  outline: none;
  border-color: var(--color-primary);
  box-shadow: 0 0 0 3px rgba(233, 30, 99, 0.1);
}

.settings-hint {
  font-size: var(--text-sm);
  color: var(--color-text-secondary);
  margin: var(--space-2) 0 0 0;
}

/* FOBs (First Order Buttons) */
.settings-fobs {
  display: flex;
  gap: var(--space-3);
  margin-bottom: var(--space-8);
  padding: var(--space-4);
  background: var(--color-surface-2);
  border-radius: var(--btn-radius);
}

.settings-fob {
  flex: 1;
}

/* Theme Toggle */
.theme-toggle {
  display: flex;
  align-items: center;
  gap: var(--space-3);
  padding: var(--space-4);
  background: var(--color-surface-2);
  border-radius: var(--btn-radius);
  border: 1px solid var(--color-border);
}

.theme-toggle__label {
  font-weight: var(--font-medium);
  color: var(--color-text);
}

.theme-toggle__switch {
  position: relative;
  width: 48px;
  height: 24px;
  background: var(--color-border);
  border-radius: 12px;
  cursor: pointer;
  transition: background-color 0.2s ease;
}

.theme-toggle__switch.active {
  background: var(--color-primary);
}

.theme-toggle__slider {
  position: absolute;
  top: 2px;
  left: 2px;
  width: 20px;
  height: 20px;
  background: white;
  border-radius: 50%;
  transition: transform 0.2s ease;
}

.theme-toggle__switch.active .theme-toggle__slider {
  transform: translateX(24px);
}
```

## Quote Bar Standardization

### Quote Bar Container
```css
.quote-bar {
  /* Layout */
  display: block;
  width: 100%;
  height: 48px;
  
  /* Visual */
  background: var(--color-surface-2);
  border: 1px solid var(--color-border);
  border-radius: var(--btn-radius);
  
  /* Spacing */
  margin: var(--space-4) 0;
  padding: 0 var(--space-4);
  
  /* Overflow */
  overflow: hidden;
  white-space: nowrap;
}

.quote-marquee {
  display: flex;
  align-items: center;
  height: 100%;
  animation: marquee 20s linear infinite;
}

.quote-text {
  font-size: var(--text-sm);
  color: var(--color-text-secondary);
  font-style: italic;
  margin: 0;
  white-space: nowrap;
}

@keyframes marquee {
  0% { transform: translateX(100%); }
  100% { transform: translateX(-100%); }
}

/* Pause animation on hover */
.quote-bar:hover .quote-marquee {
  animation-play-state: paused;
}
```

## Implementation Priority

### Phase 1: Critical Fixes
1. Define missing CSS variables
2. Standardize button heights and padding
3. Fix modal z-index conflicts
4. Remove inline styles

### Phase 2: Component Standardization
1. Implement unified button system
2. Create consistent card anatomy
3. Standardize modal/toast system
4. Fix settings UI coherence

### Phase 3: Polish and Optimization
1. Implement quote bar stabilization
2. Add responsive design tokens
3. Create component documentation
4. Performance optimization
