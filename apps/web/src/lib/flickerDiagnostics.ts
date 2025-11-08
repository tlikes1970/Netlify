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

const MAX_LOGS = 500; // Increased to capture more data for root cause analysis

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

  logMount(component: string, data?: any) {
    log(component, 'MOUNT', data);
  },

  logUnmount(component: string, data?: any) {
    log(component, 'UNMOUNT', data);
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
  },

  downloadLogs() {
    if (!ENABLED) {
      console.log('[FlickerDiag] Diagnostics not enabled. Add ?diagnostics=flicker to URL or set localStorage.setItem("flicker-diagnostics", "enabled")');
      return;
    }
    
    const report = this.exportLogs();
    const json = JSON.stringify(report, null, 2);
    const blob = new Blob([json], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `flicker-diagnostics-${new Date().toISOString().replace(/[:.]/g, '-')}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    console.log('[FlickerDiag] Logs downloaded as JSON file');
  },

  analyzeRootCause() {
    if (!ENABLED) {
      console.log('[FlickerDiag] Diagnostics not enabled. Add ?diagnostics=flicker to URL or set localStorage.setItem("flicker-diagnostics", "enabled")');
      return;
    }

    const report = this.exportLogs();
    const logs = report.logs;
    
    // Question 1: Are components mounting/unmounting or just re-rendering?
    const mounts = logs.filter(l => l.event === 'MOUNT');
    const unmounts = logs.filter(l => l.event === 'UNMOUNT');
    const renders = logs.filter(l => l.event === 'RENDER');
    
    // Group by mountId to track lifecycle
    const mountIds = new Map<string, { mounts: number, unmounts: number, renders: number }>();
    mounts.forEach(m => {
      const mountId = m.data?.mountId || 'unknown';
      if (!mountIds.has(mountId)) {
        mountIds.set(mountId, { mounts: 0, unmounts: 0, renders: 0 });
      }
      mountIds.get(mountId)!.mounts++;
    });
    unmounts.forEach(u => {
      const mountId = u.data?.mountId || 'unknown';
      if (!mountIds.has(mountId)) {
        mountIds.set(mountId, { mounts: 0, unmounts: 0, renders: 0 });
      }
      mountIds.get(mountId)!.unmounts++;
    });
    renders.forEach(r => {
      const mountId = r.data?.mountId || 'unknown';
      if (!mountIds.has(mountId)) {
        mountIds.set(mountId, { mounts: 0, unmounts: 0, renders: 0 });
      }
      mountIds.get(mountId)!.renders++;
    });
    
    // Question 2: Are subscriptions causing re-renders?
    const subscriptions = logs.filter(l => l.event === 'SUBSCRIPTION');
    const stateChanges = logs.filter(l => l.event === 'STATE_CHANGE');
    
    // Find subscription -> render patterns
    const subscriptionToRenderPairs: Array<{ subscription: typeof logs[0], render: typeof logs[0], timeDiff: number }> = [];
    subscriptions.forEach(sub => {
      const subsequentRenders = renders.filter(r => 
        r.timestamp >= sub.timestamp && 
        r.timestamp <= sub.timestamp + 100 && // Within 100ms
        r.component === sub.component
      );
      subsequentRenders.forEach(render => {
        subscriptionToRenderPairs.push({
          subscription: sub,
          render,
          timeDiff: render.timestamp - sub.timestamp
        });
      });
    });
    
    // Question 3: Rapid event sequences (potential flicker)
    const rapidSequences: Array<{ start: number, end: number, events: typeof logs, components: Set<string> }> = [];
    for (let i = 0; i < logs.length; i++) {
      const windowStart = logs[i].timestamp;
      const windowEnd = windowStart + 50; // 50ms window
      const windowEvents = logs.filter(l => l.timestamp >= windowStart && l.timestamp <= windowEnd);
      if (windowEvents.length >= 5) { // 5+ events in 50ms = rapid
        rapidSequences.push({
          start: windowStart,
          end: windowEnd,
          events: windowEvents,
          components: new Set(windowEvents.map(e => e.component))
        });
      }
    }
    
    // Build analysis report
    const analysis = {
      question1_mountVsRender: {
        totalMounts: mounts.length,
        totalUnmounts: unmounts.length,
        totalRenders: renders.length,
        mountIdLifecycles: Array.from(mountIds.entries()).map(([id, stats]) => ({
          mountId: id,
          mounts: stats.mounts,
          unmounts: stats.unmounts,
          renders: stats.renders,
          isUnmounting: stats.unmounts > 0,
          renderToMountRatio: stats.mounts > 0 ? stats.renders / stats.mounts : 0
        })),
        conclusion: mounts.length === 0 && unmounts.length === 0 
          ? 'NO MOUNT/UNMOUNT - Components are only re-rendering, not mounting/unmounting'
          : unmounts.length > 0
          ? `COMPONENTS ARE UNMOUNTING - ${unmounts.length} unmount events detected. This is likely causing flicker.`
          : `COMPONENTS ARE MOUNTING - ${mounts.length} mount events. Check if mounts are happening repeatedly.`
      },
      question2_subscriptionCascade: {
        totalSubscriptions: subscriptions.length,
        totalStateChanges: stateChanges.length,
        subscriptionToRenderPairs: subscriptionToRenderPairs.length,
        averageTimeBetweenSubscriptionAndRender: subscriptionToRenderPairs.length > 0
          ? subscriptionToRenderPairs.reduce((sum, p) => sum + p.timeDiff, 0) / subscriptionToRenderPairs.length
          : 0,
        componentsWithSubscriptionCascades: Array.from(new Set(subscriptionToRenderPairs.map(p => p.subscription.component))),
        conclusion: subscriptionToRenderPairs.length > 0
          ? `SUBSCRIPTIONS ARE CAUSING RE-RENDERS - ${subscriptionToRenderPairs.length} subscription->render pairs found. Average delay: ${Math.round(subscriptionToRenderPairs.reduce((sum, p) => sum + p.timeDiff, 0) / subscriptionToRenderPairs.length)}ms`
          : 'No clear subscription->render pattern detected'
      },
      question3_rapidSequences: {
        totalRapidSequences: rapidSequences.length,
        sequences: rapidSequences.map(seq => ({
          startTime: seq.start,
          duration: seq.end - seq.start,
          eventCount: seq.events.length,
          components: Array.from(seq.components),
          events: seq.events.map(e => `${e.component}:${e.event}`)
        })),
        conclusion: rapidSequences.length > 0
          ? `RAPID EVENT SEQUENCES DETECTED - ${rapidSequences.length} sequences with 5+ events in 50ms. These likely cause visible flicker.`
          : 'No rapid event sequences detected'
      },
      summary: {
        primaryIssue: 
          unmounts.length > 0 ? 'COMPONENTS UNMOUNTING/REMOUNTING' :
          rapidSequences.length > 0 ? 'RAPID EVENT CASCADES' :
          subscriptionToRenderPairs.length > 0 ? 'SUBSCRIPTION CASCADES' :
          'UNKNOWN - Need more data',
        recommendations: [
          unmounts.length > 0 ? 'Investigate why components are unmounting. Check React key props, conditional rendering, or parent component remounts.' : null,
          rapidSequences.length > 0 ? 'Batch state updates and debounce subscription notifications to prevent rapid cascades.' : null,
          subscriptionToRenderPairs.length > 0 ? 'Optimize subscription callbacks to prevent unnecessary re-renders. Use useMemo/useCallback or conditional state updates.' : null
        ].filter(Boolean)
      }
    };
    
    console.group('[FlickerDiag] Root Cause Analysis');
    console.log('Question 1: Mount vs Render', analysis.question1_mountVsRender);
    console.log('Question 2: Subscription Cascades', analysis.question2_subscriptionCascade);
    console.log('Question 3: Rapid Sequences', analysis.question3_rapidSequences);
    console.log('Summary', analysis.summary);
    console.groupEnd();
    
    return analysis;
  }
};

// Auto-export to window for easy access
if (typeof window !== 'undefined') {
  (window as any).flickerDiagnostics = flickerDiagnostics;
  
  // Track ALL custom events that could cause re-renders
  const eventsToTrack = [
    'library:updated',
    'library:changed',
    'auth:changed',
    'auth:ready',
    'customLists:updated',
    'force-refresh',
    'pushstate',
    'cards:changed',
    'library:reloaded',
  ];
  
  eventsToTrack.forEach(eventName => {
    window.addEventListener(eventName, (e: any) => {
      flickerDiagnostics.logEvent(eventName, e.detail || {});
    });
  });
  
  // Also track pushstate events (history changes)
  const originalPushState = window.history.pushState;
  window.history.pushState = function(...args) {
    flickerDiagnostics.logEvent('history:pushstate', { url: args[2] });
    return originalPushState.apply(window.history, args);
  };
}



