/**
 * Flicker Diagnostics - Track re-renders and state changes in production
 * 
 * This diagnostic system helps identify what's causing flicker by tracking:
 * - Component render cycles
 * - State changes
 * - Effect triggers
 * - Library subscription triggers
 * - Event dispatches
 * 
 * Enable in production by adding ?diagnostics=flicker to URL or setting localStorage flag
 */

const ENABLED = 
  typeof window !== 'undefined' && (
    new URLSearchParams(window.location.search).get('diagnostics') === 'flicker' ||
    localStorage.getItem('flicker-diagnostics') === 'enabled'
  );

const logs: Array<{
  timestamp: number;
  component: string;
  event: string;
  data?: any;
  stack?: string;
}> = [];

const MAX_LOGS = 200;

function log(component: string, event: string, data?: any) {
  if (!ENABLED) return;
  
  const entry = {
    timestamp: Date.now(),
    component,
    event,
    data,
    stack: new Error().stack?.split('\n').slice(2, 6).join('\n')
  };
  
  logs.push(entry);
  if (logs.length > MAX_LOGS) {
    logs.shift();
  }
  
  console.log(`[FlickerDiag] ${component} - ${event}`, data || '');
}

export const flickerDiagnostics = {
  enabled: ENABLED,
  
  log,
  
  logRender(component: string, props?: any) {
    log(component, 'RENDER', { props: props ? Object.keys(props) : [] });
  },
  
  logStateChange(component: string, stateName: string, oldValue: any, newValue: any) {
    log(component, 'STATE_CHANGE', { stateName, oldValue, newValue });
  },
  
  logEffect(component: string, effectName: string, deps?: any[]) {
    log(component, 'EFFECT', { effectName, deps });
  },
  
  logSubscription(component: string, subscriptionName: string, data?: any) {
    log(component, 'SUBSCRIPTION', { subscriptionName, data });
  },
  
  logEvent(eventName: string, data?: any) {
    log('EVENT', eventName, data);
  },
  
  getLogs() {
    return [...logs];
  },
  
  clearLogs() {
    logs.length = 0;
  },
  
  exportLogs() {
    const summary = {
      total: logs.length,
      byComponent: {} as Record<string, number>,
      byEvent: {} as Record<string, number>,
      timeline: logs.map(l => ({
        time: l.timestamp,
        component: l.component,
        event: l.event
      }))
    };
    
    logs.forEach(log => {
      summary.byComponent[log.component] = (summary.byComponent[log.component] || 0) + 1;
      summary.byEvent[log.event] = (summary.byEvent[log.event] || 0) + 1;
    });
    
    return {
      summary,
      logs: [...logs]
    };
  },
  
  printReport() {
    if (!ENABLED) {
      console.log('[FlickerDiag] Diagnostics not enabled. Add ?diagnostics=flicker to URL or set localStorage.setItem("flicker-diagnostics", "enabled")');
      return;
    }
    
    const report = this.exportLogs();
    console.group('[FlickerDiag] Report');
    console.log('Total events:', report.summary.total);
    console.log('By component:', report.summary.byComponent);
    console.log('By event:', report.summary.byEvent);
    console.log('Timeline:', report.summary.timeline);
    console.log('Full logs:', report.logs);
    console.groupEnd();
    
    return report;
  }
};

// Auto-export to window for easy access
if (typeof window !== 'undefined') {
  (window as any).flickerDiagnostics = flickerDiagnostics;
  
  // Listen for library:updated events
  window.addEventListener('library:updated', () => {
    flickerDiagnostics.logEvent('library:updated');
  });
  
  // Listen for library:changed events
  window.addEventListener('library:changed', (e: any) => {
    flickerDiagnostics.logEvent('library:changed', e.detail);
  });
}



