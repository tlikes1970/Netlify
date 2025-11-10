/**
 * I18N Diagnostics - Unified Report System
 * 
 * Collects all translation-related metrics into a single structured JSON report.
 * Saves to both localStorage and downloads as JSON file.
 */

import { APP_VERSION } from '../version';
// ⚠️ REMOVED: Diagnostic imports disabled
import { isI18nContainmentEnabled, getI18nDiagnosticsDuration } from '../i18n/featureFlags';
import { mode as getTranslationBusMode } from '../i18n/translationBus';

// Lazy access to languageManager to avoid circular dependency
// Access it from the module after initialization
function getLanguageManager() {
  // Access via dynamic import to break circular dependency
  // This will be called after modules are initialized (via setTimeout)
  try {
    // In ES modules, we can't use require, so we'll access it from window
    // or use a getter that's set after initialization
    if (typeof window !== 'undefined' && (window as any).__languageManager) {
      return (window as any).__languageManager;
    }
    // Fallback: try to import dynamically (async, but we'll handle it)
    // For now, we'll set this up in language.ts
    return null;
  } catch (e) {
    console.warn('[I18N Diagnostics] Could not access languageManager:', e);
    return null;
  }
}

// ⚠️ DISABLED: I18N Diagnostics completely disabled
// All diagnostic functionality removed per user request
const I18N_DIAGNOSTICS_ENABLED = false;

// Report structure
interface I18NDiagnosticsReport {
  meta: {
    timestamp: string;
    version: string;
    strictMode: boolean;
    duration: number; // seconds
  };
  strictModeSummary: {
    mounts: number;
    unmounts: number;
    mountUnmountPairs: number;
  };
  providerIdentitySummary: {
    changesWhileIdle: number;
    languageChanges: number;
    identityChanges: number;
    lastProviderRef: string | null;
  };
  subscriberSummary: {
    totalSubscriptions: number;
    totalRenders: number;
    rendersPerSubscription: number;
    uniqueMountIds: number;
    subscriptionToRenderPairs: number;
    averageTimeBetweenSubscriptionAndRender: number;
  };
  multipleProviders: {
    count: number;
    locations: Array<{ component: string; stack: string }>;
  };
  keyViolations: Array<{
    component: string;
    detail: string;
    stack?: string;
  }>;
  batchingSummary: {
    burstsDetected: number;
    maxEventsIn50ms: number;
    totalEventsInBursts: number;
  };
  containmentResults: {
    flagEnabled: boolean;
    impact: string;
    rendersBefore: number;
    rendersAfter: number;
    improvement: number;
  };
  containment: {
    enabled: boolean;
    mode: 'off' | 'raf';
    stats: {
      burstsDetected: number;
      maxEventsIn50ms: number;
      totalEventsInBursts: number;
      emitCallsPerSecond: number;
      framesWithMultipleEmits: number;
    };
    deltas?: {
      off: { burstsDetected: number; maxEventsIn50ms: number };
      on: { burstsDetected: number; maxEventsIn50ms: number };
    };
  };
}

// Data collectors
class I18NDiagnosticsCollector {
  private enabled = I18N_DIAGNOSTICS_ENABLED;
  private startTime = Date.now();
  
  // Strict Mode tracking
  private mounts = new Set<string>();
  private unmounts = new Set<string>();
  private mountUnmountPairs = 0;
  
  // Provider identity tracking
  private providerRefHistory: Array<{ timestamp: number; ref: string; language: string }> = [];
  private identityChanges = 0;
  private languageChanges = 0;
  private changesWhileIdle = 0;
  
  // Subscriber tracking
  private subscriptions = new Map<string, { timestamp: number; mountId: string }>();
  private renders = new Map<string, Array<{ timestamp: number; mountId: string }>>();
  private subscriptionToRenderPairs: Array<{ subscriptionTime: number; renderTime: number; timeDiff: number }> = [];
  
  // Multiple providers tracking
  private providerLocations: Array<{ component: string; stack: string }> = [];
  
  // Key violations tracking
  private keyViolations: Array<{ component: string; detail: string; stack?: string }> = [];
  
  // Batching tracking
  private eventTimeline: Array<{ timestamp: number; type: string }> = [];
  
  // Containment tracking
  private containmentEnabled = false;
  private rendersBeforeContainment = 0;
  private rendersAfterContainment = 0;
  private containmentStats = {
    burstsDetected: 0,
    maxEventsIn50ms: 0,
    totalEventsInBursts: 0,
    emitCallsPerSecond: 0,
    framesWithMultipleEmits: 0
  };
  
  // Emit tracking for diagnostics
  private emitTimestamps: number[] = [];
  private frameEmitCounts = new Map<number, number>(); // frame number -> emit count
  
  constructor() {
    if (!this.enabled) return;
    
    // Track containment state
    this.containmentEnabled = isI18nContainmentEnabled();
    
    // Delay provider identity tracking to avoid circular dependency
    // Wait for next tick so all modules are initialized
    if (typeof window !== 'undefined') {
      setTimeout(() => {
        this.trackProviderIdentity();
        this.wireEmitTracking();
      }, 0);
      
      // Auto-generate report after configured duration
      const duration = getI18nDiagnosticsDuration();
      setTimeout(() => this.generateReport(), duration);
      
      // Also expose manual trigger
      (window as any).generateI18NReport = () => this.generateReport();
    }
  }
  
  private wireEmitTracking() {
    if (!this.enabled) return;
    
    // Set up global callback for emit tracking
    // The translationBus will call this callback when emits occur
    if (typeof window !== 'undefined') {
      (window as any).__i18nEmitTracker = (timestamp: number) => {
        this.logEmit(timestamp);
      };
    }
  }
  
  logEmit(timestamp: number) {
    if (!this.enabled) return;
    this.emitTimestamps.push(timestamp);
    
    // Track frame-based emit counts (approximate 60fps = 16.67ms per frame)
    const frameNumber = Math.floor(timestamp / 16.67);
    const currentCount = this.frameEmitCounts.get(frameNumber) || 0;
    this.frameEmitCounts.set(frameNumber, currentCount + 1);
  }
  
  private trackProviderIdentity() {
    if (!this.enabled) return;
    
    // Lazy access to avoid circular dependency
    const languageManager = getLanguageManager();
    if (!languageManager) {
      console.warn('[I18N Diagnostics] languageManager not available yet, skipping provider identity tracking');
      return;
    }
    
    let lastRef = languageManager.getTranslations();
    let lastLanguage = languageManager.getLanguage();
    
    const checkInterval = setInterval(() => {
      if (!this.enabled) {
        clearInterval(checkInterval);
        return;
      }
      
      const currentRef = languageManager.getTranslations();
      const currentLanguage = languageManager.getLanguage();
      const now = Date.now();
      
      // Check if identity changed
      if (currentRef !== lastRef) {
        this.identityChanges++;
        this.providerRefHistory.push({
          timestamp: now,
          ref: String(currentRef),
          language: currentLanguage
        });
        
        // Check if language actually changed (don't double-count - language changes are tracked via logEvent)
        if (currentLanguage !== lastLanguage) {
          // Language change already tracked via logEvent('language-change')
          // Don't increment here to avoid double counting
        } else {
          // Identity changed but language didn't - this is a problem
          this.changesWhileIdle++;
        }
        
        lastRef = currentRef;
        lastLanguage = currentLanguage;
      }
    }, 100);
  }
  
  logMount(mountId: string) {
    if (!this.enabled) return;
    this.mounts.add(mountId);
    
    // Check for mount/unmount pairs (Strict Mode)
    if (this.unmounts.has(mountId)) {
      this.mountUnmountPairs++;
    }
  }
  
  logUnmount(mountId: string) {
    if (!this.enabled) return;
    this.unmounts.add(mountId);
  }
  
  logSubscription(mountId: string, timestamp: number = Date.now()) {
    if (!this.enabled) return;
    this.subscriptions.set(mountId, { timestamp, mountId });
  }
  
  logRender(mountId: string, timestamp: number = Date.now()) {
    if (!this.enabled) return;
    
    if (!this.renders.has(mountId)) {
      this.renders.set(mountId, []);
    }
    this.renders.get(mountId)!.push({ timestamp, mountId });
    
    // Check for subscription->render pairs
    const subscription = this.subscriptions.get(mountId);
    if (subscription && timestamp >= subscription.timestamp && timestamp <= subscription.timestamp + 100) {
      this.subscriptionToRenderPairs.push({
        subscriptionTime: subscription.timestamp,
        renderTime: timestamp,
        timeDiff: timestamp - subscription.timestamp
      });
    }
    
    this.eventTimeline.push({ timestamp, type: 'render' });
  }
  
  logEvent(type: string, timestamp: number = Date.now()) {
    if (!this.enabled) return;
    this.eventTimeline.push({ timestamp, type });
    
    // Track language changes specifically
    if (type === 'language-change') {
      this.languageChanges++;
    }
  }
  
  logProviderLocation(component: string, stack?: string) {
    if (!this.enabled) return;
    this.providerLocations.push({
      component,
      stack: stack || new Error().stack?.split('\n').slice(2, 6).join('\n') || ''
    });
  }
  
  logKeyViolation(component: string, detail: string, stack?: string) {
    if (!this.enabled) return;
    this.keyViolations.push({ component, detail, stack });
  }
  
  private calculateBatching(): { burstsDetected: number; maxEventsIn50ms: number; totalEventsInBursts: number } {
    if (this.eventTimeline.length === 0) {
      return { burstsDetected: 0, maxEventsIn50ms: 0, totalEventsInBursts: 0 };
    }
    
    const sortedEvents = [...this.eventTimeline].sort((a, b) => a.timestamp - b.timestamp);
    let burstsDetected = 0;
    let maxEventsIn50ms = 0;
    let totalEventsInBursts = 0;
    
    for (let i = 0; i < sortedEvents.length; i++) {
      const windowStart = sortedEvents[i].timestamp;
      const windowEnd = windowStart + 50;
      const windowEvents = sortedEvents.filter(e => e.timestamp >= windowStart && e.timestamp <= windowEnd);
      
      if (windowEvents.length >= 5) {
        burstsDetected++;
        maxEventsIn50ms = Math.max(maxEventsIn50ms, windowEvents.length);
        totalEventsInBursts += windowEvents.length;
      }
    }
    
    return { burstsDetected, maxEventsIn50ms, totalEventsInBursts };
  }
  
  generateReport(): I18NDiagnosticsReport {
    const duration = (Date.now() - this.startTime) / 1000;
    const batching = this.calculateBatching();
    
    // Calculate emit metrics
    const emitCallsPerSecond = duration > 0 ? this.emitTimestamps.length / duration : 0;
    const framesWithMultipleEmits = Array.from(this.frameEmitCounts.values()).filter(count => count > 1).length;
    
    // Update containment stats from batching and emit tracking
    this.containmentStats = {
      burstsDetected: batching.burstsDetected,
      maxEventsIn50ms: batching.maxEventsIn50ms,
      totalEventsInBursts: batching.totalEventsInBursts,
      emitCallsPerSecond,
      framesWithMultipleEmits
    };
    
    const totalRenders = Array.from(this.renders.values()).reduce((sum, renders) => sum + renders.length, 0);
    const uniqueMountIds = new Set([
      ...Array.from(this.subscriptions.keys()),
      ...Array.from(this.renders.keys())
    ]).size;
    
    const avgTimeBetweenSubscriptionAndRender = this.subscriptionToRenderPairs.length > 0
      ? this.subscriptionToRenderPairs.reduce((sum, p) => sum + p.timeDiff, 0) / this.subscriptionToRenderPairs.length
      : 0;
    
    const report: I18NDiagnosticsReport = {
      meta: {
        timestamp: new Date().toISOString(),
        version: APP_VERSION,
        strictMode: typeof window !== 'undefined' && (window as any).__REACT_STRICT_MODE__ !== false,
        duration
      },
      strictModeSummary: {
        mounts: this.mounts.size,
        unmounts: this.unmounts.size,
        mountUnmountPairs: this.mountUnmountPairs
      },
      providerIdentitySummary: {
        changesWhileIdle: this.changesWhileIdle,
        languageChanges: this.languageChanges,
        identityChanges: this.identityChanges,
        lastProviderRef: this.providerRefHistory.length > 0 
          ? this.providerRefHistory[this.providerRefHistory.length - 1].ref 
          : null
      },
      subscriberSummary: {
        totalSubscriptions: this.subscriptions.size,
        totalRenders,
        rendersPerSubscription: this.subscriptions.size > 0 ? totalRenders / this.subscriptions.size : 0,
        uniqueMountIds,
        subscriptionToRenderPairs: this.subscriptionToRenderPairs.length,
        averageTimeBetweenSubscriptionAndRender: avgTimeBetweenSubscriptionAndRender
      },
      multipleProviders: {
        count: this.providerLocations.length,
        locations: this.providerLocations
      },
      keyViolations: this.keyViolations,
      batchingSummary: batching,
      containmentResults: {
        flagEnabled: this.containmentEnabled,
        impact: this.containmentEnabled ? 'tested' : 'not_tested',
        rendersBefore: this.rendersBeforeContainment,
        rendersAfter: this.rendersAfterContainment,
        improvement: this.rendersAfterContainment > 0 
          ? ((this.rendersBeforeContainment - this.rendersAfterContainment) / this.rendersBeforeContainment) * 100
          : 0
      },
      containment: {
        enabled: this.containmentEnabled,
        mode: getTranslationBusMode(), // Get actual mode from translation bus
        stats: this.containmentStats,
        // deltas would be populated if we had before/after comparison
        // For now, this is a single run
        deltas: undefined
      }
    };
    
    // Save to localStorage
    if (typeof window !== 'undefined') {
      localStorage.setItem('i18n:diagnosticsReport', JSON.stringify(report, null, 2));
    }
    
    // ⚠️ REMOVED: Auto-download functionality disabled
    // Diagnostics are now disabled - no downloads
    {
      // No download; expose for dev access
      if (typeof window !== 'undefined') {
        (window as any).__i18nDiagLast = report;
      }
      if (import.meta.env.DEV) {
        console.info('[i18n:diag] captured (no download)', report);
      }
    }
    
    const actualMode = getTranslationBusMode();
    console.info(`[I18N] Diagnostics complete (mode=${actualMode}). Report written.`);
    
    return report;
  }
  
  // ⚠️ REMOVED: downloadReport method disabled (no auto-download)
  // Method removed to prevent JSON file downloads
}

// Singleton instance
export const i18nDiagnostics = I18N_DIAGNOSTICS_ENABLED ? new I18NDiagnosticsCollector() : null;

// Export for manual triggering and global access
if (typeof window !== 'undefined') {
  if (i18nDiagnostics) {
    (window as any).i18nDiagnostics = i18nDiagnostics;
    (window as any).generateI18NReport = () => i18nDiagnostics.generateReport();
  }
}

