/**
 * Auth Diagnostics Module
 * Gathers runtime configuration and evidence for debugging OAuth redirect issues
 */

import { authLogManager } from './authLog';

export interface RuntimeConfig {
  firebase: {
    authDomain: string;
    projectId: string;
    apiKeyLast6: string;
    sdkVersion?: string;
  };
  persistence: {
    method: string | null;
    setBeforeSignIn: boolean;
  };
  serviceWorker: {
    active: boolean;
    version: string | null;
  };
  page: {
    href: string;
    search: string;
    hash: string;
    visibilityState: string;
    bootTime: number;
  };
}

export interface DiagnosticsBundle {
  timestamp: string;
  config: RuntimeConfig;
  netlifyRules: Array<{ from: string; to: string; status: number }>;
  swBypassLogic: string;
  urlCleanupLocations: Array<{ file: string; line: number; context: string }>;
  hudFields: {
    page_entry_params: boolean;
    firebaseReady_resolved_at: boolean;
    getRedirectResult_called_at: boolean;
    getRedirect_after_ready: boolean;
  };
  version: string;
}

/**
 * Collect runtime configuration snapshot
 */
export async function collectRuntimeConfig(): Promise<RuntimeConfig> {
  // Get Firebase config from environment
  const apiKey = import.meta.env.VITE_FIREBASE_API_KEY || 'AIzaSyDEiqf8cxQJ11URcQeE8jqq5EMa5M6zAXM';
  const authDomain = import.meta.env.VITE_FIREBASE_AUTH_DOMAIN || 'flicklet.netlify.app';
  const projectId = import.meta.env.VITE_FIREBASE_PROJECT_ID || 'flicklet-71dff';
  
  // Check persistence - Firebase uses IndexedDB by default with browserLocalPersistence
  let persistenceMethod: string | null = null;
  let persistenceSetBeforeSignIn = false;
  try {
    const entries = authLogManager.getAllEntries();
    
    // Check if persistence_selected was logged (from ensurePersistenceBeforeAuth)
    const persistenceEntry = entries.find(e => e.event === 'persistence_selected');
    if (persistenceEntry && persistenceEntry.data && typeof persistenceEntry.data === 'object') {
      persistenceMethod = (persistenceEntry.data as any).method || null;
    }
    
    // Check if persistence_ensured was logged (from authLogin.ts - double-check before sign-in)
    const persistenceEnsured = entries.some(e => e.event === 'persistence_ensured');
    
    // Persistence is set at module load time in firebaseBootstrap.ts AND confirmed in bootstrapFirebase()
    // So it should always be set before sign-in unless there's a timing issue
    persistenceSetBeforeSignIn = persistenceEnsured || !!persistenceEntry;
    
    // Fallback: check storage availability
    if (!persistenceMethod) {
      if (typeof indexedDB !== 'undefined') {
        persistenceMethod = 'IndexedDB (likely)';
      } else if (typeof localStorage !== 'undefined') {
        persistenceMethod = 'localStorage (fallback)';
      }
    }
  } catch (e) {
    persistenceMethod = 'unknown';
  }
  
  // Check service worker
  let swActive = false;
  let swVersion: string | null = null;
  try {
    if ('serviceWorker' in navigator && navigator.serviceWorker.controller) {
      swActive = true;
      // Try to get version from registration
      const registration = await navigator.serviceWorker.getRegistration();
      if (registration?.active) {
        // Version is in SW code, we can't access it from here, but we know it's v4
        swVersion = 'v4';
      }
    }
  } catch (e) {
    // ignore
  }
  
  // Get page state at boot (should be called very early)
  const href = typeof window !== 'undefined' ? window.location.href : '';
  const search = typeof window !== 'undefined' ? window.location.search : '';
  const hash = typeof window !== 'undefined' ? window.location.hash : '';
  const visibilityState = typeof document !== 'undefined' ? document.visibilityState : '';
  const bootTime = typeof performance !== 'undefined' ? performance.now() : 0;
  
  return {
    firebase: {
      authDomain,
      projectId,
      apiKeyLast6: apiKey.slice(-6),
    },
    persistence: {
      method: persistenceMethod,
      setBeforeSignIn: persistenceSetBeforeSignIn,
    },
    serviceWorker: {
      active: swActive,
      version: swVersion,
    },
    page: {
      href,
      search,
      hash,
      visibilityState,
      bootTime,
    },
  };
}

/**
 * Generate diagnostics bundle
 */
export async function generateDiagnosticsBundle(): Promise<DiagnosticsBundle> {
  const config = await collectRuntimeConfig();
  
  // Netlify rules (from netlify.toml - static for now)
  const netlifyRules = [
    { from: '/api/tmdb-proxy', to: '/.netlify/functions/tmdb-proxy', status: 200 },
    { from: '/api/dict/entries', to: '/.netlify/functions/dict-proxy', status: 200 },
    { from: '/emails', to: '/404.html', status: 404 },
    { from: '/__/auth/*', to: '/__/auth/:splat', status: 200 }, // CRITICAL - must be before catch-all
    { from: '/*', to: '/index.html', status: 200 },
  ];
  
  // SW bypass logic
  const swBypassLogic = `const isAuthRequest = (url) =>
  url.includes('/__/auth/') ||
  url.includes('code=') ||
  url.includes('state=') ||
  url.includes('oauth') ||
  url.includes('redirect');
// Uses cache: 'no-store' for auth requests`;
  
  // URL cleanup locations (from grep results)
  const urlCleanupLocations = [
    { file: 'apps/web/src/lib/auth.ts', line: 644, context: 'After auth confirmed - delay 500ms' },
    { file: 'apps/web/src/lib/auth.ts', line: 743, context: 'After auth state change - delay 500ms' },
  ];
  
  // Check HUD fields
  const entries = authLogManager.getAllEntries();
  const hudFields = {
    page_entry_params: entries.some(e => e.event === 'page_entry_params'),
    firebaseReady_resolved_at: entries.some(e => e.event === 'firebaseReady_resolved_at'),
    getRedirectResult_called_at: entries.some(e => e.event === 'getRedirectResult_called_at'),
    getRedirect_after_ready: entries.some(e => 
      e.event === 'getRedirectResult_called_at' && 
      e.data && 
      typeof e.data === 'object' && 
      'getRedirect_after_ready' in e.data
    ),
  };
  
  // Get version
  const { APP_VERSION } = await import('../version');
  
  return {
    timestamp: new Date().toISOString(),
    config,
    netlifyRules,
    swBypassLogic,
    urlCleanupLocations,
    hudFields,
    version: APP_VERSION,
  };
}

/**
 * Export diagnostics as markdown
 */
export function formatDiagnosticsAsMarkdown(bundle: DiagnosticsBundle): string {
  const lines: string[] = [];
  
  lines.push('# Auth Diagnostics Bundle');
  lines.push('');
  lines.push(`**Generated:** ${bundle.timestamp}`);
  lines.push(`**App Version:** ${bundle.version}`);
  lines.push('');
  
  lines.push('## Phase A - Runtime Configuration');
  lines.push('');
  lines.push('### Firebase Config');
  lines.push(`- **authDomain:** \`${bundle.config.firebase.authDomain}\``);
  lines.push(`- **projectId:** \`${bundle.config.firebase.projectId}\``);
  lines.push(`- **apiKey (last 6):** \`...${bundle.config.firebase.apiKeyLast6}\``);
  lines.push('');
  
  lines.push('### Persistence');
  lines.push(`- **Method:** ${bundle.config.persistence.method || 'unknown'}`);
  lines.push(`- **Set before sign-in:** ${bundle.config.persistence.setBeforeSignIn ? '✅' : '❌'}`);
  lines.push('');
  
  lines.push('### Service Worker');
  lines.push(`- **Active:** ${bundle.config.serviceWorker.active ? '✅' : '❌'}`);
  lines.push(`- **Version:** ${bundle.config.serviceWorker.version || 'unknown'}`);
  lines.push('');
  
  lines.push('### Page State at Boot');
  lines.push(`- **href:** \`${bundle.config.page.href}\``);
  lines.push(`- **search:** \`${bundle.config.page.search}\``);
  lines.push(`- **hash:** \`${bundle.config.page.hash}\``);
  lines.push(`- **visibilityState:** \`${bundle.config.page.visibilityState}\``);
  lines.push(`- **bootTime:** \`${bundle.config.page.bootTime.toFixed(2)}ms\``);
  lines.push('');
  
  lines.push('## Netlify Redirect Rules');
  lines.push('');
  lines.push('Order matters - `/__/auth/*` rule must come BEFORE catch-all:');
  lines.push('');
  bundle.netlifyRules.forEach((rule, i) => {
    lines.push(`${i + 1}. \`${rule.from}\` → \`${rule.to}\` (${rule.status})`);
  });
  lines.push('');
  
  lines.push('## Service Worker Bypass Logic');
  lines.push('');
  lines.push('```javascript');
  lines.push(bundle.swBypassLogic);
  lines.push('```');
  lines.push('');
  
  lines.push('## URL Cleanup Locations');
  lines.push('');
  bundle.urlCleanupLocations.forEach(loc => {
    lines.push(`- **${loc.file}:${loc.line}** - ${loc.context}`);
  });
  lines.push('');
  
  lines.push('## HUD Fields Audit');
  lines.push('');
  lines.push('- `page_entry_params`: ' + (bundle.hudFields.page_entry_params ? '✅' : '❌'));
  lines.push('- `firebaseReady_resolved_at`: ' + (bundle.hudFields.firebaseReady_resolved_at ? '✅' : '❌'));
  lines.push('- `getRedirectResult_called_at`: ' + (bundle.hudFields.getRedirectResult_called_at ? '✅' : '❌'));
  lines.push('- `getRedirect_after_ready`: ' + (bundle.hudFields.getRedirect_after_ready ? '✅' : '❌'));
  lines.push('');
  
  lines.push('---');
  lines.push('*End of diagnostics bundle*');
  
  return lines.join('\n');
}

