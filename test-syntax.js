(function () {
  'use strict';

  // Test minimal structure
  window.test = {};

  // Test CounterBootstrap structure
  window.CounterBootstrap = {
    observers: new Map(),
    updateThrottle: new Map(),
    lastUpdate: new Map(),
    armed: false,

    init() {
      console.log('init');
    },

    updateAllCounts() {
      console.log('updateAllCounts');
    },

    destroy() {
      console.log('destroy');
    },
  };

  // Test FlickletApp structure
  window.FlickletApp = {
    // All functions are already defined above
    // This wrapper ensures proper namespace
  };
})();

