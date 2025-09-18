# KISS Responsive System Documentation

## 🎯 **Core Philosophy**
- **Mobile-first** approach (start small, scale up)
- **KISS principle** (Keep It Simple, Stupid)
- **Intuitive sizing** (no complex calculations)
- **Touch-friendly** (44px minimum touch targets)

## 📱 **Breakpoints**
```css
/* Mobile: 0-767px (default) */
/* Tablet: 768px-1023px */
/* Desktop: 1024px+ */
```

## 🏗️ **Container System**
```css
:root {
  --container-max: 1200px;
  --container-pad-mobile: 16px;
  --container-pad-tablet: 24px;
  --container-pad-desktop: 32px;
}
```

## 🎴 **Card Sizing System**
```css
:root {
  /* Mobile-first card sizes */
  --card-width-mobile: 64px;
  --card-height-mobile: 96px;
  --card-width-tablet: 120px;
  --card-height-tablet: 180px;
  --card-width-desktop: 184px;
  --card-height-desktop: 276px;
}
```

## 🔧 **How to Use**

### **For Containers:**
```css
.my-container {
  max-width: var(--container-max);
  padding: var(--container-pad-mobile); /* Mobile-first */
}

@media (min-width: 768px) {
  .my-container {
    padding: var(--container-pad-tablet);
  }
}

@media (min-width: 1024px) {
  .my-container {
    padding: var(--container-pad-desktop);
  }
}
```

### **For Cards:**
```css
.my-card {
  width: var(--card-width-mobile); /* Mobile-first */
  height: var(--card-height-mobile);
}

@media (min-width: 768px) {
  .my-card {
    width: var(--card-width-tablet);
    height: var(--card-height-tablet);
  }
}

@media (min-width: 1024px) {
  .my-card {
    width: var(--card-width-desktop);
    height: var(--card-height-desktop);
  }
}
```

## ✅ **Benefits**
- **Consistent sizing** across all screen sizes
- **Easy to maintain** (change one variable, affects everywhere)
- **Mobile-optimized** (starts with mobile, scales up)
- **Touch-friendly** (proper touch targets)
- **Intuitive** (clear breakpoints and naming)

## 🚫 **What NOT to Do**
- Don't use fixed pixel values
- Don't mix different sizing systems
- Don't forget mobile-first approach
- Don't make touch targets smaller than 44px
- Don't overcomplicate with too many breakpoints

## 📝 **Quick Reference**
- **Mobile**: 64px × 96px cards, 16px padding
- **Tablet**: 120px × 180px cards, 24px padding  
- **Desktop**: 184px × 276px cards, 32px padding
- **Touch targets**: Minimum 44px × 44px
- **Aspect ratio**: 2:3 for all cards

