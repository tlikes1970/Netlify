/* ============== Debug Utilities (Safe Console Management) ==============
   Centralized logging system that can be easily toggled for production
   Maintains all existing functionality while allowing performance optimization
*/

(function() {
  'use strict';
  
  // Debug levels - can be easily modified
  const DEBUG_LEVELS = {
    ERROR: 0,    // Always show errors
    WARN: 1,     // Show warnings and errors
    INFO: 2,     // Show info, warnings, and errors  
    DEBUG: 3     // Show everything
  };
  
  // Current debug level - set to INFO for development, ERROR for production
  let currentLevel = DEBUG_LEVELS.INFO;
  
  // Check if we're in development mode
  const isDev = window.location.hostname === 'localhost' || 
                window.location.hostname === '127.0.0.1' || 
                window.location.hostname.includes('dev');
  
  // Set level based on environment
  if (!isDev) {
    currentLevel = DEBUG_LEVELS.ERROR;
  }
  
  // Safe console wrapper that respects debug levels
  window.FlickletDebug = {
    error: function(...args) {
      if (currentLevel >= DEBUG_LEVELS.ERROR) {
        console.error(...args);
      }
    },
    
    warn: function(...args) {
      if (currentLevel >= DEBUG_LEVELS.WARN) {
        console.warn(...args);
      }
    },
    
    info: function(...args) {
      if (currentLevel >= DEBUG_LEVELS.INFO) {
        console.log(...args);
      }
    },
    
    debug: function(...args) {
      if (currentLevel >= DEBUG_LEVELS.DEBUG) {
        console.log(...args);
      }
    },
    
    // Set debug level at runtime
    setLevel: function(level) {
      currentLevel = level;
    },
    
    // Get current level
    getLevel: function() {
      return currentLevel;
    },
    
    // Enable all logging (for debugging)
    enableAll: function() {
      currentLevel = DEBUG_LEVELS.DEBUG;
    },
    
    // Disable all logging except errors
    disableAll: function() {
      currentLevel = DEBUG_LEVELS.ERROR;
    }
  };
  
  // Expose debug levels for external use
  window.FlickletDebug.LEVELS = DEBUG_LEVELS;
  
  console.log('🔧 FlickletDebug initialized - Level:', currentLevel, 'Environment:', isDev ? 'Development' : 'Production');
})();
