# How to Toggle Pro Status for Testing

There are several ways to toggle Pro status on/off for testing Community v1 features.

---

## Method 1: Browser Console (Easiest - Recommended)

**Quickest way to toggle Pro status:**

1. Open your app in the browser
2. Open DevTools (F12)
3. Go to **Console** tab
4. Paste and run one of these commands:

### Turn Pro ON:
```javascript
// Get settings manager
const { settingsManager } = await import('/src/lib/settings.ts');
// Or if that doesn't work, use this:
const settings = JSON.parse(localStorage.getItem('flicklet.settings.v2') || '{}');
settings.pro = {
  isPro: true,
  features: {
    advancedNotifications: true,
    themePacks: true,
    socialFeatures: true,
    bloopersAccess: true,
    extrasAccess: true,
  },
};
localStorage.setItem('flicklet.settings.v2', JSON.stringify(settings));
location.reload(); // Reload page to apply changes
```

### Turn Pro OFF:
```javascript
const settings = JSON.parse(localStorage.getItem('flicklet.settings.v2') || '{}');
settings.pro = {
  isPro: false,
  features: {
    advancedNotifications: false,
    themePacks: false,
    socialFeatures: false,
    bloopersAccess: false,
    extrasAccess: false,
  },
};
localStorage.setItem('flicklet.settings.v2', JSON.stringify(settings));
location.reload();
```

### Check Current Pro Status:
```javascript
const settings = JSON.parse(localStorage.getItem('flicklet.settings.v2') || '{}');
console.log('Pro Status:', settings.pro?.isPro || false);
```

---

## Method 2: Using SettingsManager (If Import Works)

In browser console:

```javascript
// Turn Pro ON
window.settingsManager?.updateSettings({
  pro: {
    isPro: true,
    features: {
      advancedNotifications: true,
      themePacks: true,
      socialFeatures: true,
      bloopersAccess: true,
      extrasAccess: true,
    },
  },
});
location.reload();

// Turn Pro OFF
window.settingsManager?.updateSettings({
  pro: {
    isPro: false,
    features: {
      advancedNotifications: false,
      themePacks: false,
      socialFeatures: false,
      bloopersAccess: false,
      extrasAccess: false,
    },
  },
});
location.reload();
```

---

## Method 3: Admin Page Toggle (If Available)

If you have access to the Admin page:

1. Navigate to **Settings → Admin** tab
2. Look for a "Toggle Pro" button (if implemented)
3. Click to toggle Pro status

**Note:** The `AdminExtrasPage.tsx` has a `handleTogglePro` function, but you need to check if there's a UI button for it.

---

## Method 4: Direct localStorage Manipulation

**Simplest approach - no code needed:**

1. Open DevTools (F12)
2. Go to **Application** tab (Chrome) or **Storage** tab (Firefox)
3. Expand **Local Storage**
4. Click on your domain
5. Find key: `flicklet.settings.v2`
6. Double-click the value to edit
7. Find `"isPro":true` or `"isPro":false`
8. Change `true` to `false` or vice versa
9. Press Enter to save
10. **Reload the page** (F5)

---

## Method 5: Create a Test Helper Component (For Development)

Add this temporary component to quickly toggle Pro:

```typescript
// apps/web/src/components/ProToggleHelper.tsx (temporary)
import { useSettings, settingsManager } from '../lib/settings';

export function ProToggleHelper() {
  const settings = useSettings();
  const isPro = settings.pro.isPro;

  const togglePro = () => {
    settingsManager.updateSettings({
      pro: {
        isPro: !isPro,
        features: {
          advancedNotifications: !isPro,
          themePacks: !isPro,
          socialFeatures: !isPro,
          bloopersAccess: !isPro,
          extrasAccess: !isPro,
        },
      },
    });
    window.location.reload();
  };

  return (
    <div style={{ position: 'fixed', top: 10, right: 10, zIndex: 9999, padding: '10px', background: '#000', color: '#fff', borderRadius: '8px' }}>
      <button onClick={togglePro} style={{ padding: '8px 16px', cursor: 'pointer' }}>
        {isPro ? 'Turn Pro OFF' : 'Turn Pro ON'}
      </button>
      <div style={{ fontSize: '12px', marginTop: '5px' }}>
        Status: {isPro ? '✅ Pro' : '❌ Free'}
      </div>
    </div>
  );
}
```

Then add it to your App.tsx temporarily:
```typescript
import { ProToggleHelper } from './components/ProToggleHelper';
// ... in your component:
{process.env.NODE_ENV === 'development' && <ProToggleHelper />}
```

---

## Verification

After toggling Pro status, verify it worked:

1. **Check Settings:**
   - Go to Settings → Pro tab
   - Should show "You are a Pro User!" or "Upgrade to Flicklet Pro"

2. **Check Community:**
   - Create a new post
   - PRO badge should appear next to your username (if Pro is ON)
   - No badge if Pro is OFF

3. **Check Console:**
   ```javascript
   const settings = JSON.parse(localStorage.getItem('flicklet.settings.v2') || '{}');
   console.log('Pro Status:', settings.pro?.isPro);
   ```

---

## Quick Test Script

Copy-paste this into browser console for quick testing:

```javascript
// Quick Pro Toggle Script
(function() {
  const settings = JSON.parse(localStorage.getItem('flicklet.settings.v2') || '{}');
  const currentPro = settings.pro?.isPro || false;
  const newPro = !currentPro;
  
  settings.pro = {
    isPro: newPro,
    features: {
      advancedNotifications: newPro,
      themePacks: newPro,
      socialFeatures: newPro,
      bloopersAccess: newPro,
      extrasAccess: newPro,
    },
  };
  
  localStorage.setItem('flicklet.settings.v2', JSON.stringify(settings));
  console.log(`✅ Pro status changed: ${currentPro} → ${newPro}`);
  console.log('🔄 Reloading page...');
  setTimeout(() => location.reload(), 500);
})();
```

---

## Troubleshooting

**Pro status not updating?**
- Make sure you **reload the page** after changing localStorage
- Check that the key is `flicklet.settings.v2` (not `flicklet.settings.v1`)
- Clear browser cache if needed

**Settings not persisting?**
- Check browser console for errors
- Verify localStorage is enabled in your browser
- Try incognito/private mode to test with fresh state

**Need to reset all settings?**
```javascript
localStorage.removeItem('flicklet.settings.v2');
location.reload();
```

