/**
 * Process: Touch Event Audit Tool
 * Purpose: Audit and document touch event listeners for proper passive/non-passive configuration
 * Data Source: DOM event listeners, code analysis
 * Update Path: Run audit manually or via flag:touch-event-audit
 * Dependencies: None (runs on-demand)
 */

/**
 * Touch event listener configuration
 */
interface TouchEventListenerInfo {
  element: HTMLElement | Document | Window;
  eventType: 'touchstart' | 'touchmove' | 'touchend' | 'touchcancel';
  passive: boolean | null; // null = unknown (can't determine from native listener)
  capture: boolean;
  handler: EventListener | null;
  source: string; // File/component name if available
  reason?: string; // Why passive/non-passive
}

/**
 * Audit results
 */
interface TouchEventAuditResult {
  listeners: TouchEventListenerInfo[];
  violations: Array<{
    listener: TouchEventListenerInfo;
    issue: string;
    recommendation: string;
  }>;
  summary: {
    total: number;
    passive: number;
    nonPassive: number;
    unknown: number;
    violations: number;
  };
}

class TouchEventAuditor {
  private listeners: TouchEventListenerInfo[] = [];
  private enabled = false;

  constructor() {
    // Enable when flag is set
    if (typeof window !== 'undefined') {
      try {
        this.enabled = localStorage.getItem('flag:touch-event-audit') === 'true';
      } catch {
        this.enabled = false;
      }
    }
  }

  /**
   * Enable audit mode
   */
  enable(): void {
    this.enabled = true;
    if (typeof window !== 'undefined') {
      localStorage.setItem('flag:touch-event-audit', 'true');
    }
    this.warnAboutNonPassiveListeners();
  }

  /**
   * Disable audit mode
   */
  disable(): void {
    this.enabled = false;
    if (typeof window !== 'undefined') {
      localStorage.removeItem('flag:touch-event-audit');
    }
  }

  /**
   * Warn about non-passive listeners that might cause performance issues
   */
  private warnAboutNonPassiveListeners(): void {
    if (!this.enabled) return;

    const touchEvents = ['touchstart', 'touchmove', 'touchend'];
    
    touchEvents.forEach(eventType => {
      // Note: We can't directly inspect native event listeners
      // But we can warn about known patterns in our codebase
      console.warn(`🔍 Touch Event Audit: Checking for ${eventType} listeners...`);
      console.warn(`⚠️ Note: Native addEventListener listeners cannot be fully audited programmatically.`);
      console.warn(`📝 Please review code manually for proper passive flag usage.`);
    });
  }

  /**
   * Document a touch event listener (for manual audit)
   */
  documentListener(
    element: HTMLElement | Document | Window,
    eventType: 'touchstart' | 'touchmove' | 'touchend' | 'touchcancel',
    passive: boolean,
    capture: boolean,
    source: string,
    reason?: string
  ): void {
    this.listeners.push({
      element,
      eventType,
      passive,
      capture,
      handler: null,
      source,
      reason
    });

    if (this.enabled) {
      console.log(`📝 Touch Event Audit: Documented ${eventType} listener`, {
        passive,
        capture,
        source,
        reason
      });
    }
  }

  /**
   * Check if a listener configuration is recommended
   */
  checkConfiguration(
    eventType: 'touchstart' | 'touchmove' | 'touchend' | 'touchcancel',
    passive: boolean,
    needsPreventDefault: boolean
  ): { valid: boolean; warning?: string; recommendation?: string } {
    // touchmove with preventDefault usually needs non-passive
    if (eventType === 'touchmove' && needsPreventDefault && !passive) {
      return { valid: true }; // Non-passive is correct
    }

    // touchmove without preventDefault should be passive
    if (eventType === 'touchmove' && !needsPreventDefault && !passive) {
      return {
        valid: false,
        warning: 'touchmove listener should be passive when preventDefault is not needed',
        recommendation: 'Set { passive: true } for better scroll performance'
      };
    }

    // touchstart and touchend can usually be passive unless preventDefault is needed
    if ((eventType === 'touchstart' || eventType === 'touchend') && !passive && !needsPreventDefault) {
      return {
        valid: false,
        warning: `${eventType} listener may benefit from being passive`,
        recommendation: 'Consider using { passive: true } if preventDefault is not needed'
      };
    }

    return { valid: true };
  }

  /**
   * Get audit report
   */
  getReport(): TouchEventAuditResult {
    const violations: TouchEventAuditResult['violations'] = [];

    this.listeners.forEach(listener => {
      // Check for potential issues
      if (listener.eventType === 'touchmove' && listener.passive === null) {
        violations.push({
          listener,
          issue: 'touchmove listener passive status unknown',
          recommendation: 'Document whether preventDefault is needed. If not, use passive: true for performance.'
        });
      }
    });

    const summary = {
      total: this.listeners.length,
      passive: this.listeners.filter(l => l.passive === true).length,
      nonPassive: this.listeners.filter(l => l.passive === false).length,
      unknown: this.listeners.filter(l => l.passive === null).length,
      violations: violations.length
    };

    return {
      listeners: this.listeners,
      violations,
      summary
    };
  }

  /**
   * Export audit report as JSON
   */
  exportReport(): string {
    return JSON.stringify(this.getReport(), null, 2);
  }

  /**
   * Clear audit data
   */
  clear(): void {
    this.listeners = [];
  }
}

// Singleton instance
export const touchEventAuditor = new TouchEventAuditor();

// Expose to window for debugging
if (typeof window !== 'undefined') {
  (window as any).touchEventAuditor = touchEventAuditor;
  
  if (process.env.NODE_ENV === 'development') {
    console.log('🔧 Touch event auditor available: window.touchEventAuditor');
    console.log('Usage: window.touchEventAuditor.enable()');
  }
}

