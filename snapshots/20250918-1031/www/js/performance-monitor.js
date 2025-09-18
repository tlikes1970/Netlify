/**
 * Performance Monitoring System
 * Purpose: Monitor application performance and user experience
 * Data Source: Performance API and user interactions
 * Update Path: Add new metrics as needed
 * Dependencies: Performance API, Web Vitals
 */

export class PerformanceMonitor {
  constructor() {
    this.metrics = {};
    this.observers = [];
    this.isEnabled = true;
    this.thresholds = {
      LCP: 2500, // Largest Contentful Paint
      FID: 100, // First Input Delay
      CLS: 0.1, // Cumulative Layout Shift
      FCP: 1800, // First Contentful Paint
      TTFB: 600, // Time to First Byte
    };

    this.init();
  }

  init() {
    if (!this.isEnabled) return;

    // Monitor Core Web Vitals
    this.observeLCP();
    this.observeFID();
    this.observeCLS();
    this.observeFCP();
    this.observeTTFB();

    // Monitor custom metrics
    this.observeModuleLoadTimes();
    this.observeUserInteractions();
    this.observeMemoryUsage();

    console.log("📊 Performance monitoring initialized");
  }

  // Largest Contentful Paint
  observeLCP() {
    if (!("PerformanceObserver" in window)) return;

    const observer = new PerformanceObserver((list) => {
      const entries = list.getEntries();
      const lastEntry = entries[entries.length - 1];

      this.metrics.LCP = {
        value: lastEntry.startTime,
        element: lastEntry.element,
        timestamp: Date.now(),
        rating: this.getRating("LCP", lastEntry.startTime),
      };

      this.reportMetric("LCP", this.metrics.LCP);
    });

    observer.observe({ entryTypes: ["largest-contentful-paint"] });
    this.observers.push(observer);
  }

  // First Input Delay
  observeFID() {
    if (!("PerformanceObserver" in window)) return;

    const observer = new PerformanceObserver((list) => {
      const entries = list.getEntries();
      entries.forEach((entry) => {
        this.metrics.FID = {
          value: entry.processingStart - entry.startTime,
          timestamp: Date.now(),
          rating: this.getRating(
            "FID",
            entry.processingStart - entry.startTime
          ),
        };

        this.reportMetric("FID", this.metrics.FID);
      });
    });

    observer.observe({ entryTypes: ["first-input"] });
    this.observers.push(observer);
  }

  // Cumulative Layout Shift
  observeCLS() {
    if (!("PerformanceObserver" in window)) return;

    let clsValue = 0;
    const observer = new PerformanceObserver((list) => {
      const entries = list.getEntries();
      entries.forEach((entry) => {
        if (!entry.hadRecentInput) {
          clsValue += entry.value;
        }
      });

      this.metrics.CLS = {
        value: clsValue,
        timestamp: Date.now(),
        rating: this.getRating("CLS", clsValue),
      };

      this.reportMetric("CLS", this.metrics.CLS);
    });

    observer.observe({ entryTypes: ["layout-shift"] });
    this.observers.push(observer);
  }

  // First Contentful Paint
  observeFCP() {
    if (!("PerformanceObserver" in window)) return;

    const observer = new PerformanceObserver((list) => {
      const entries = list.getEntries();
      entries.forEach((entry) => {
        this.metrics.FCP = {
          value: entry.startTime,
          timestamp: Date.now(),
          rating: this.getRating("FCP", entry.startTime),
        };

        this.reportMetric("FCP", this.metrics.FCP);
      });
    });

    observer.observe({ entryTypes: ["paint"] });
    this.observers.push(observer);
  }

  // Time to First Byte
  observeTTFB() {
    if (!("PerformanceObserver" in window)) return;

    const observer = new PerformanceObserver((list) => {
      const entries = list.getEntries();
      entries.forEach((entry) => {
        if (entry.entryType === "navigation") {
          this.metrics.TTFB = {
            value: entry.responseStart - entry.requestStart,
            timestamp: Date.now(),
            rating: this.getRating(
              "TTFB",
              entry.responseStart - entry.requestStart
            ),
          };

          this.reportMetric("TTFB", this.metrics.TTFB);
        }
      });
    });

    observer.observe({ entryTypes: ["navigation"] });
    this.observers.push(observer);
  }

  // Monitor module load times
  observeModuleLoadTimes() {
    const originalImport = window.import;

    // Override dynamic imports to measure load times
    window.import = async (modulePath) => {
      const startTime = performance.now();
      try {
        const module = await originalImport(modulePath);
        const loadTime = performance.now() - startTime;

        this.recordModuleLoad(modulePath, loadTime);
        return module;
      } catch (error) {
        const loadTime = performance.now() - startTime;
        this.recordModuleError(modulePath, loadTime, error);
        throw error;
      }
    };
  }

  // Monitor user interactions
  observeUserInteractions() {
    let interactionCount = 0;
    let totalInteractionTime = 0;

    const interactionTypes = ["click", "keydown", "scroll", "touchstart"];

    interactionTypes.forEach((type) => {
      document.addEventListener(
        type,
        (event) => {
          interactionCount++;

          // Measure interaction responsiveness
          const startTime = performance.now();
          requestAnimationFrame(() => {
            const responseTime = performance.now() - startTime;
            totalInteractionTime += responseTime;

            this.recordInteraction(type, responseTime);
          });
        },
        { passive: true }
      );
    });

    // Track interaction metrics
    setInterval(() => {
      if (interactionCount > 0) {
        this.metrics.interactions = {
          count: interactionCount,
          averageResponseTime: totalInteractionTime / interactionCount,
          timestamp: Date.now(),
        };
      }
    }, 30000); // Every 30 seconds
  }

  // Monitor memory usage
  observeMemoryUsage() {
    if (!("memory" in performance)) return;

    setInterval(() => {
      const memory = performance.memory;
      this.metrics.memory = {
        used: memory.usedJSHeapSize,
        total: memory.totalJSHeapSize,
        limit: memory.jsHeapSizeLimit,
        usage: (memory.usedJSHeapSize / memory.jsHeapSizeLimit) * 100,
        timestamp: Date.now(),
      };

      // Warn if memory usage is high
      if (this.metrics.memory.usage > 80) {
        console.warn(
          "⚠️ High memory usage:",
          this.metrics.memory.usage.toFixed(2) + "%"
        );
      }
    }, 10000); // Every 10 seconds
  }

  // Record module load metrics
  recordModuleLoad(modulePath, loadTime) {
    if (!this.metrics.moduleLoads) {
      this.metrics.moduleLoads = [];
    }

    this.metrics.moduleLoads.push({
      module: modulePath,
      loadTime,
      timestamp: Date.now(),
      rating:
        loadTime > 1000
          ? "poor"
          : loadTime > 500
          ? "needs-improvement"
          : "good",
    });

    // Keep only last 50 module loads
    if (this.metrics.moduleLoads.length > 50) {
      this.metrics.moduleLoads = this.metrics.moduleLoads.slice(-50);
    }
  }

  // Record module load errors
  recordModuleError(modulePath, loadTime, error) {
    if (!this.metrics.moduleErrors) {
      this.metrics.moduleErrors = [];
    }

    this.metrics.moduleErrors.push({
      module: modulePath,
      loadTime,
      error: error.message,
      timestamp: Date.now(),
    });

    console.error(`❌ Module load error: ${modulePath}`, error);
  }

  // Record user interactions
  recordInteraction(type, responseTime) {
    if (!this.metrics.interactions) {
      this.metrics.interactions = {
        byType: {},
        total: 0,
        averageResponseTime: 0,
      };
    }

    if (!this.metrics.interactions.byType[type]) {
      this.metrics.interactions.byType[type] = {
        count: 0,
        totalTime: 0,
        averageTime: 0,
      };
    }

    const typeMetrics = this.metrics.interactions.byType[type];
    typeMetrics.count++;
    typeMetrics.totalTime += responseTime;
    typeMetrics.averageTime = typeMetrics.totalTime / typeMetrics.count;

    this.metrics.interactions.total++;
  }

  // Get performance rating
  getRating(metric, value) {
    const threshold = this.thresholds[metric];
    if (!threshold) return "unknown";

    if (value <= threshold * 0.5) return "good";
    if (value <= threshold) return "needs-improvement";
    return "poor";
  }

  // Report metric
  reportMetric(name, metric) {
    console.log(`📊 ${name}: ${metric.value.toFixed(2)}ms (${metric.rating})`);

    // Send to analytics if available
    if (window.gtag) {
      window.gtag("event", "performance_metric", {
        metric_name: name,
        metric_value: Math.round(metric.value),
        metric_rating: metric.rating,
      });
    }

    // Store in localStorage for debugging
    try {
      const stored = JSON.parse(
        localStorage.getItem("flicklet_performance") || "{}"
      );
      stored[name] = metric;
      localStorage.setItem("flicklet_performance", JSON.stringify(stored));
    } catch (error) {
      console.warn("Failed to store performance metrics:", error);
    }
  }

  // Get performance report
  getReport() {
    return {
      metrics: this.metrics,
      summary: this.getSummary(),
      recommendations: this.getRecommendations(),
      timestamp: Date.now(),
    };
  }

  // Get performance summary
  getSummary() {
    const summary = {
      overall: "good",
      issues: [],
      score: 100,
    };

    // Check each metric
    Object.keys(this.metrics).forEach((metric) => {
      if (this.metrics[metric].rating === "poor") {
        summary.issues.push(
          `${metric} is poor (${this.metrics[metric].value.toFixed(2)}ms)`
        );
        summary.score -= 20;
      } else if (this.metrics[metric].rating === "needs-improvement") {
        summary.issues.push(
          `${metric} needs improvement (${this.metrics[metric].value.toFixed(
            2
          )}ms)`
        );
        summary.score -= 10;
      }
    });

    if (summary.score < 60) summary.overall = "poor";
    else if (summary.score < 80) summary.overall = "needs-improvement";

    return summary;
  }

  // Get performance recommendations
  getRecommendations() {
    const recommendations = [];

    if (this.metrics.LCP && this.metrics.LCP.rating === "poor") {
      recommendations.push(
        "Optimize images and reduce server response time for better LCP"
      );
    }

    if (this.metrics.FID && this.metrics.FID.rating === "poor") {
      recommendations.push(
        "Reduce JavaScript execution time and optimize third-party scripts"
      );
    }

    if (this.metrics.CLS && this.metrics.CLS.rating === "poor") {
      recommendations.push(
        "Add size attributes to images and avoid inserting content above existing content"
      );
    }

    if (this.metrics.moduleLoads) {
      const slowModules = this.metrics.moduleLoads.filter(
        (m) => m.rating === "poor"
      );
      if (slowModules.length > 0) {
        recommendations.push(
          `Consider code splitting for slow modules: ${slowModules
            .map((m) => m.module)
            .join(", ")}`
        );
      }
    }

    return recommendations;
  }

  // Cleanup observers
  destroy() {
    this.observers.forEach((observer) => observer.disconnect());
    this.observers = [];
    this.isEnabled = false;
  }
}

// Create global instance
window.PerformanceMonitor = new PerformanceMonitor();

// Export for module systems
export default window.PerformanceMonitor;
