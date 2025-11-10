/**
 * Cold-Start Recorder
 * 
 * Captures the first ~5s of resource timings, paint/LCP/CLS, and attribute changes
 * on html/body/root. Runs only when explicitly enabled via flag.
 */

interface ColdStartReport {
  ts: number;
  url: string;
  label: string;
  entries: {
    resources: PerformanceResourceTiming[];
    paint: PerformancePaintTiming[];
    lcp: PerformanceEntry[];
    cls: PerformanceEntry[];
  };
  mutations: Array<{
    target: string;
    type: string;
    attributeName: string | null;
    oldValue: string | null;
    timestamp: number;
  }>;
  errors: Array<{
    message: string;
    timestamp: number;
  }>;
}

export function startColdStartRecorder(opts?: {
  durationMs?: number;
  download?: boolean;
  label?: string;
}): void {
  const durationMs = opts?.durationMs ?? 5000;
  const shouldDownload = opts?.download ?? false;
  const label = opts?.label || '';

  if (typeof window === 'undefined' || typeof document === 'undefined') {
    return;
  }

  const startTime = performance.now();
  const report: ColdStartReport = {
    ts: Date.now(),
    url: window.location.href,
    label,
    entries: {
      resources: [],
      paint: [],
      lcp: [],
      cls: [],
    },
    mutations: [],
    errors: [],
  };

  // Resource timings (CSS/JS/font/img/fetch/xhr)
  const resourceTypes = ['css', 'js', 'font', 'img', 'fetch', 'xhr'];
  const collectResources = () => {
    const entries = performance.getEntriesByType('resource') as PerformanceResourceTiming[];
    report.entries.resources = entries.filter(entry => {
      const initiatorType = entry.initiatorType || '';
      return resourceTypes.some(type => initiatorType.includes(type));
    });
  };

  // PerformanceObserver for paint, LCP, CLS
  let paintObserver: PerformanceObserver | null = null;
  let lcpObserver: PerformanceObserver | null = null;
  let clsObserver: PerformanceObserver | null = null;

  try {
    // Paint observer
    if ('PerformanceObserver' in window) {
      paintObserver = new PerformanceObserver((list) => {
        const entries = list.getEntries() as PerformancePaintTiming[];
        report.entries.paint.push(...entries);
      });
      paintObserver.observe({ entryTypes: ['paint'] });
    }

    // LCP observer
    if ('PerformanceObserver' in window) {
      lcpObserver = new PerformanceObserver((list) => {
        const entries = list.getEntries();
        report.entries.lcp.push(...entries);
      });
      lcpObserver.observe({ entryTypes: ['largest-contentful-paint'] });
    }

    // CLS observer
    if ('PerformanceObserver' in window) {
      clsObserver = new PerformanceObserver((list) => {
        const entries = list.getEntries();
        report.entries.cls.push(...entries);
      });
      clsObserver.observe({ entryTypes: ['layout-shift'] });
    }
  } catch (e) {
    // PerformanceObserver not supported or failed
  }

  // MutationObserver for attribute changes on html/body/root
  const mutationObserver = new MutationObserver((mutations) => {
    mutations.forEach((mutation) => {
      const target = mutation.target;
      const targetName = target === document.documentElement ? 'html' :
                         target === document.body ? 'body' :
                         target.id === 'root' || target.id === 'app' ? `#${target.id}` :
                         null;

      if (targetName && mutation.type === 'attributes') {
        report.mutations.push({
          target: targetName,
          type: mutation.type,
          attributeName: mutation.attributeName,
          oldValue: mutation.oldValue,
          timestamp: performance.now() - startTime,
        });
      }
    });
  });

  // Observe html, body, and root
  const root = document.getElementById('root') || document.getElementById('app');
  if (document.documentElement) {
    mutationObserver.observe(document.documentElement, {
      attributes: true,
      attributeOldValue: true,
      attributeFilter: ['class', 'style'],
    });
  }
  if (document.body) {
    mutationObserver.observe(document.body, {
      attributes: true,
      attributeOldValue: true,
      attributeFilter: ['class', 'style'],
    });
  }
  if (root) {
    mutationObserver.observe(root, {
      attributes: true,
      attributeOldValue: true,
      attributeFilter: ['class', 'style'],
    });
  }

  // Window error events
  const errorHandler = (event: ErrorEvent) => {
    report.errors.push({
      message: event.message || String(event.error),
      timestamp: performance.now() - startTime,
    });
  };
  window.addEventListener('error', errorHandler);

  // Finalize after duration
  setTimeout(() => {
    // Collect final resource timings
    collectResources();

    // Disconnect observers
    paintObserver?.disconnect();
    lcpObserver?.disconnect();
    clsObserver?.disconnect();
    mutationObserver.disconnect();
    window.removeEventListener('error', errorHandler);

    // Serialize report (convert PerformanceEntry objects to plain objects)
    const serializedReport = {
      ...report,
      entries: {
        resources: report.entries.resources.map(entry => ({
          name: entry.name,
          entryType: entry.entryType,
          startTime: entry.startTime,
          duration: entry.duration,
          initiatorType: entry.initiatorType,
          transferSize: entry.transferSize,
          encodedBodySize: entry.encodedBodySize,
          decodedBodySize: entry.decodedBodySize,
        })),
        paint: report.entries.paint.map(entry => ({
          name: entry.name,
          entryType: entry.entryType,
          startTime: entry.startTime,
          duration: entry.duration,
        })),
        lcp: report.entries.lcp.map(entry => ({
          name: (entry as any).element?.tagName || 'unknown',
          entryType: entry.entryType,
          startTime: entry.startTime,
          duration: entry.duration,
          size: (entry as any).size,
          renderTime: (entry as any).renderTime,
        })),
        cls: report.entries.cls.map(entry => ({
          entryType: entry.entryType,
          startTime: entry.startTime,
          duration: entry.duration,
          value: (entry as any).value,
        })),
      },
    };

    const json = JSON.stringify(serializedReport, null, 2);

    if (shouldDownload) {
      // Download as JSON file
      const blob = new Blob([json], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `cold-start-${label || Date.now()}-${new Date().toISOString().replace(/[:.]/g, '-')}.json`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } else {
      // Store to window and log
      (window as any).__coldStartLast = serializedReport;
      console.info('[coldStart]', serializedReport);
    }
  }, durationMs);
}

