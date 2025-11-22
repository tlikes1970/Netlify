# Cold-Start Diagnostics

This document describes how to use the cold-start recorder and other diagnostic tools.

## Cold-Start Recorder

The cold-start recorder captures the first ~5 seconds of resource timings, paint/LCP/CLS metrics, and attribute changes on html/body/root elements. It runs only when explicitly enabled.

### Enable/Disable

**Enable:**
```javascript
localStorage.setItem('cold:probe', '1');
location.reload();
```

**Disable:**
```javascript
localStorage.removeItem('cold:probe');
location.reload();
```

### Options

**Auto-download:**
```javascript
localStorage.setItem('cold:download', '1'); // Enable auto-download
localStorage.removeItem('cold:download');   // Disable auto-download
```

**Label (for identification):**
```javascript
localStorage.setItem('cold:label', 'AFTER_DEPLOY');
```

### Data Access

When the recorder completes (after ~5 seconds):

- **With download enabled**: A JSON file is automatically downloaded
- **Without download**: The data is stored in `window.__coldStartLast` and logged to console

To access manually:
```javascript
// In browser console
window.__coldStartLast
```

### Example Usage

```javascript
// Enable with label and auto-download
localStorage.setItem('cold:probe', '1');
localStorage.setItem('cold:download', '1');
localStorage.setItem('cold:label', 'AFTER_DEPLOY');
location.reload();

// After ~5 seconds, check the data
console.log(window.__coldStartLast);
```

## i18n Diagnostics

The i18n diagnostics system captures translation-related metrics. By default, it captures data but does not auto-download.

### Enable/Disable

**Enable capture:**
```javascript
localStorage.setItem('i18n:diagnostics:autoRun', 'true');
location.reload();
```

**Disable:**
```javascript
localStorage.removeItem('i18n:diagnostics:autoRun');
location.reload();
```

### Auto-Download (Opt-In)

**Enable auto-download:**
```javascript
localStorage.setItem('i18n:diagnostics:autoDownload', '1');
```

**Disable auto-download:**
```javascript
localStorage.removeItem('i18n:diagnostics:autoDownload');
```

### Data Access

- **With auto-download enabled**: A JSON file is automatically downloaded when the report is generated
- **Without auto-download**: The report is stored in `window.__i18nDiagLast` and logged to console (dev mode only)

To access manually:
```javascript
// In browser console
window.__i18nDiagLast
```

### Example Usage

```javascript
// Enable capture only (no download)
localStorage.setItem('i18n:diagnostics:autoRun', 'true');
location.reload();

// Enable capture with auto-download
localStorage.setItem('i18n:diagnostics:autoRun', 'true');
localStorage.setItem('i18n:diagnostics:autoDownload', '1');
location.reload();
```

## Verbose Debug Logging

Many debug logs are gated behind a single flag to keep the console clean for normal users.

### Enable/Disable

**Enable verbose debug logs:**
```javascript
localStorage.setItem('debug:verbose', '1');
location.reload();
```

**Disable:**
```javascript
localStorage.removeItem('debug:verbose');
location.reload();
```

### What Gets Gated

When `debug:verbose` is enabled, the following logs become visible:

- Scroll logger initialization messages
- Touch event auditor initialization messages
- i18n translation bus mode logs
- Show status backfill logs

These logs are suppressed by default to keep the console clean.

## Quick Reference

| Feature | Enable | Disable | Data Location |
|---------|--------|---------|---------------|
| Cold-start recorder | `localStorage.setItem('cold:probe', '1')` | `localStorage.removeItem('cold:probe')` | `window.__coldStartLast` |
| Cold-start auto-download | `localStorage.setItem('cold:download', '1')` | `localStorage.removeItem('cold:download')` | Auto-downloads JSON |
| i18n diagnostics | `localStorage.setItem('i18n:diagnostics:autoRun', 'true')` | `localStorage.removeItem('i18n:diagnostics:autoRun')` | `window.__i18nDiagLast` |
| i18n auto-download | `localStorage.setItem('i18n:diagnostics:autoDownload', '1')` | `localStorage.removeItem('i18n:diagnostics:autoDownload')` | Auto-downloads JSON |
| Verbose debug logs | `localStorage.setItem('debug:verbose', '1')` | `localStorage.removeItem('debug:verbose')` | Console output |

## Notes

- All flags require a page reload to take effect
- Default behavior: All diagnostics are OFF, no auto-downloads, minimal logs
- All diagnostics are opt-in only - they never run unless explicitly enabled
- Data is always captured when enabled, but downloads are opt-in separately
















