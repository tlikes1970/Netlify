/**
 * Advanced Main Application Entry Point
 * Purpose: Entry point with code splitting and lazy loading
 * Data Source: Application requirements
 * Update Path: Add new modules here
 * Dependencies: All application modules with lazy loading
 */

// Import configuration first (critical)
import "./js/config.js";

// Import debug utilities first (needed by other modules)
import "./js/debug-utils.js";

// Import core utilities (critical)
import "./js/utils.js";
import "./js/common-utils.js";

// Import monitoring systems
import "./js/performance-monitor.js";
import "./js/security-scanner.js";

console.log("Flicklet TV Tracker v26.1 - Advanced main module loaded");

// Lazy load non-critical modules
const lazyLoadModules = async () => {
  try {
    // Load error handling
    const { default: errorHandler } = await import("./js/error-handler.js");

    // Load DOM utilities
    const { default: domCache } = await import("./js/dom-cache.js");

    // Load authentication (when needed)
    const authModule = () => import("./js/auth.js");
    const firebaseModule = () => import("./js/firebase-init.js");

    // Load application modules (when needed)
    const appModule = () => import("./js/app.js");
    const bootstrapModule = () => import("./js/bootstrap.js");
    const functionsModule = () => import("./js/functions.js");

    // Load UI components (when needed)
    const layoutModule = () => import("./js/layout-enhancements.js");
    const visibilityModule = () => import("./js/visibility-manager.js");
    const languageModule = () => import("./js/language-manager.js");
    const i18nModule = () => import("./js/i18n.js");

    // Store lazy loaders on window for global access
    window.FlickletModules = {
      auth: authModule,
      firebase: firebaseModule,
      app: appModule,
      bootstrap: bootstrapModule,
      functions: functionsModule,
      layout: layoutModule,
      visibility: visibilityModule,
      language: languageModule,
      i18n: i18nModule,
    };

    console.log("✅ Lazy loaders initialized");
  } catch (error) {
    console.error("❌ Error initializing lazy loaders:", error);
  }
};

// Load critical modules immediately
const loadCriticalModules = async () => {
  try {
    // Load inline scripts that are critical for initial render
    await import("./js/inline-script-1.js");
    await import("./js/inline-script-2.js");
    await import("./js/inline-script-3.js");

    console.log("✅ Critical modules loaded");
  } catch (error) {
    console.error("❌ Error loading critical modules:", error);
  }
};

// Performance monitoring
const performanceMonitor = {
  startTime: performance.now(),

  markLoadComplete() {
    const loadTime = performance.now() - this.startTime;
    console.log(`🚀 Initial load completed in ${loadTime.toFixed(2)}ms`);

    // Send to analytics if available
    if (window.gtag) {
      window.gtag("event", "page_load_time", {
        value: Math.round(loadTime),
      });
    }
  },

  measureModuleLoad(moduleName, startTime) {
    const loadTime = performance.now() - startTime;
    console.log(`📦 ${moduleName} loaded in ${loadTime.toFixed(2)}ms`);

    // Track slow module loads
    if (loadTime > 100) {
      console.warn(
        `⚠️ Slow module load: ${moduleName} (${loadTime.toFixed(2)}ms)`
      );
    }
  },
};

// Initialize application
const initializeApp = async () => {
  console.log("🚀 Initializing Flicklet application...");

  // Load critical modules first
  await loadCriticalModules();

  // Initialize lazy loaders
  await lazyLoadModules();

  // Mark load complete
  performanceMonitor.markLoadComplete();

  // Export for global access
  window.FlickletApp = {
    version: "26.1",
    initialized: true,
    config: window.Config,
    modules: window.FlickletModules,
    performance: performanceMonitor,

    // Utility methods
    loadModule: async (moduleName) => {
      if (window.FlickletModules && window.FlickletModules[moduleName]) {
        const startTime = performance.now();
        const module = await window.FlickletModules[moduleName]();
        performanceMonitor.measureModuleLoad(moduleName, startTime);
        return module;
      }
      throw new Error(`Module ${moduleName} not found`);
    },

    // Preload modules for better performance
    preloadModules: async (moduleNames) => {
      const promises = moduleNames.map((name) =>
        window.FlickletApp.loadModule(name).catch((err) =>
          console.warn(`Failed to preload ${name}:`, err)
        )
      );
      await Promise.all(promises);
      console.log(`✅ Preloaded modules: ${moduleNames.join(", ")}`);
    },
  };

  console.log("🎉 Flicklet application initialized successfully!");
};

// Start initialization
initializeApp().catch((error) => {
  console.error("❌ Failed to initialize application:", error);
});
