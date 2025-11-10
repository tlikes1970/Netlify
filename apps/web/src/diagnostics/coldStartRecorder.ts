/**
 * Cold-Start Recorder
 * 
 * Captures the first ~5s of resource timings, paint/LCP/CLS, and attribute changes
 * on html/body/root. Runs only when explicitly enabled via flag.
 */

type HeaderSample = {
  t: number;
  installW: number;
  installOn: boolean;
  versionW: number;
  versionOn: boolean;
  helpW: number;
  helpOn: boolean;
  avatarW: number;
  avatarOn: boolean;
  searchW: number;
  searchOn: boolean;
};

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
  header?: {
    samples: HeaderSample[];
  };
  theme?: {
    vars: string[];
    samples: Array<{
      t: number;
      htmlClass: string;
      bodyClass: string;
      dataTheme: string;
      prefersDark: boolean;
      vars: Record<string, string>;
    }>;
    mutations: Array<{
      t: number;
      node: string;
      attr: string;
      val: string;
    }>;
  };
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

  // Parse var list from localStorage or default
  const varList = (localStorage.getItem('probe:vars') || '--bg,--text,--accent,--card').split(',').map(s => s.trim()).filter(Boolean);

  // Header/theme series
  const headerSeries: HeaderSample[] = [];
  const themeSeries: Array<{
    t: number;
    htmlClass: string;
    bodyClass: string;
    dataTheme: string;
    prefersDark: boolean;
    vars: Record<string, string>;
  }> = [];

  // Helper functions
  function pick(el: Element | null) {
    const n = el as HTMLElement | null;
    return { w: n?.offsetWidth || 0, on: !!n && (n.offsetParent !== null || !!n?.offsetWidth) };
  }

  function sampleHeader(): HeaderSample {
    const install = document.getElementById('install-slot') || document.querySelector('[data-role="install"]');
    const version = document.querySelector('[data-role="version"], [data-testid="app-version"]');
    const help = document.querySelector('[data-role="help"], [data-testid="help-button"]');
    const avatar = document.querySelector('[data-role="avatar"], [data-testid="account-button"]');
    const search = document.querySelector('[data-role="searchbar"], [data-testid="search-row"]');

    const i = pick(install);
    const v = pick(version);
    const h = pick(help);
    const a = pick(avatar);
    const s = pick(search);

    return {
      t: performance.now() - startTime,
      installW: i.w,
      installOn: i.on,
      versionW: v.w,
      versionOn: v.on,
      helpW: h.w,
      helpOn: h.on,
      avatarW: a.w,
      avatarOn: a.on,
      searchW: s.w,
      searchOn: s.on,
    };
  }

  function getThemeSnapshot(varNames: string[]) {
    const root = document.documentElement;
    const cs = getComputedStyle(root);
    const vars: Record<string, string> = {};
    varNames.forEach(n => {
      vars[n] = cs.getPropertyValue(n).trim();
    });
    return {
      t: performance.now() - startTime,
      htmlClass: root.className || '',
      bodyClass: document.body?.className || '',
      dataTheme: root.getAttribute('data-theme') || document.body?.getAttribute('data-theme') || '',
      prefersDark: !!window.matchMedia?.('(prefers-color-scheme: dark)').matches,
      vars,
    };
  }

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
      const targetElement = target as Element;
      const targetName = target === document.documentElement ? 'html' :
                         target === document.body ? 'body' :
                         (targetElement.id === 'root' || targetElement.id === 'app') ? `#${targetElement.id}` :
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

  // Sample header and theme at 50Hz (every 20ms)
  const hz = 50; // 50 samples per second = every 20ms
  const headerInt = window.setInterval(() => {
    headerSeries.push(sampleHeader());
  }, 1000 / hz);

  const themeInt = window.setInterval(() => {
    themeSeries.push(getThemeSnapshot(varList));
  }, 1000 / hz);

  // Record attribute changes for theme nodes
  const themeMutations: Array<{ t: number; node: string; attr: string; val: string }> = [];
  const themeObservers: MutationObserver[] = [];

  ['html', 'body'].forEach(sel => {
    const node = sel === 'html' ? document.documentElement : document.body;
    if (!node) return;

    const observer = new MutationObserver(ms => {
      ms.forEach(m => {
        if (m.type === 'attributes' && (m.attributeName === 'class' || m.attributeName === 'data-theme' || m.attributeName === 'style')) {
          themeMutations.push({
            t: performance.now() - startTime,
            node: sel,
            attr: m.attributeName!,
            val: (m.target as Element).getAttribute(m.attributeName!) || '',
          });
        }
      });
    });

    observer.observe(node, {
      attributes: true,
      attributeFilter: ['class', 'data-theme', 'style'],
    });

    themeObservers.push(observer);
  });

  // Finalize after duration
  setTimeout(() => {
    // Collect final resource timings
    collectResources();

    // Stop sampling intervals
    clearInterval(headerInt);
    clearInterval(themeInt);

    // Disconnect observers
    paintObserver?.disconnect();
    lcpObserver?.disconnect();
    clsObserver?.disconnect();
    mutationObserver.disconnect();
    themeObservers.forEach(obs => obs.disconnect());
    window.removeEventListener('error', errorHandler);

    // Add header and theme data
    report.header = { samples: headerSeries };
    report.theme = { vars: varList, samples: themeSeries, mutations: themeMutations };

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

