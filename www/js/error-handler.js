/* ============== Centralized Error Handling System ==============
   Safe error handling that maintains all existing functionality
   while providing better error management and user feedback
*/

(function() {
  'use strict';
  
  // Error types for categorization
  const ERROR_TYPES = {
    CRITICAL: 'critical',     // App-breaking errors
    WARNING: 'warning',       // Non-critical issues
    INFO: 'info',            // Informational messages
    NETWORK: 'network',      // Network-related errors
    VALIDATION: 'validation' // Input validation errors
  };
  
  // Error handler configuration
  const config = {
    showUserNotifications: true,
    logToConsole: true,
    maxRetries: 3,
    retryDelay: 1000
  };
  
  // Error tracking
  const errorHistory = [];
  const maxErrorHistory = 50;
  
  // Function to add error to history
  function addToHistory(error) {
    errorHistory.push({
      ...error,
      timestamp: Date.now(),
      userAgent: navigator.userAgent,
      url: window.location.href
    });
    
    // Keep only recent errors
    if (errorHistory.length > maxErrorHistory) {
      errorHistory.shift();
    }
  }
  
  // Function to show user notification
  function showUserNotification(message, type = 'error') {
    if (!config.showUserNotifications) return;
    
    // Use existing notification system if available
    if (window.showNotification && typeof window.showNotification === 'function') {
      window.showNotification(message, type);
      return;
    }
    
    // Fallback notification
    const notification = document.createElement('div');
    notification.style.cssText = `
      position: fixed;
      top: 20px;
      right: 20px;
      background: ${type === 'error' ? '#ff4444' : type === 'warning' ? '#ffaa00' : '#4444ff'};
      color: white;
      padding: 12px 20px;
      border-radius: 8px;
      z-index: 100000;
      font-size: 14px;
      max-width: 300px;
      box-shadow: 0 4px 12px rgba(0,0,0,0.3);
    `;
    notification.textContent = message;
    document.body.appendChild(notification);
    
    // Auto-remove after 5 seconds
    setTimeout(() => {
      if (notification.parentNode) {
        notification.parentNode.removeChild(notification);
      }
    }, 5000);
  }
  
  // Main error handler function
  function handleError(error, context = '', type = ERROR_TYPES.CRITICAL) {
    const errorInfo = {
      message: error.message || 'Unknown error',
      stack: error.stack || '',
      context: context,
      type: type,
      originalError: error
    };
    
    // Add to history
    addToHistory(errorInfo);
    
    // Log to console
    if (config.logToConsole) {
      switch (type) {
        case ERROR_TYPES.CRITICAL:
          FlickletDebug.error(`🚨 CRITICAL ERROR [${context}]:`, errorInfo);
          break;
        case ERROR_TYPES.WARNING:
          FlickletDebug.warn(`⚠️ WARNING [${context}]:`, errorInfo);
          break;
        case ERROR_TYPES.NETWORK:
          FlickletDebug.error(`🌐 NETWORK ERROR [${context}]:`, errorInfo);
          break;
        case ERROR_TYPES.VALIDATION:
          FlickletDebug.warn(`✅ VALIDATION ERROR [${context}]:`, errorInfo);
          break;
        default:
          FlickletDebug.error(`❌ ERROR [${context}]:`, errorInfo);
      }
    }
    
    // Show user notification for critical errors
    if (type === ERROR_TYPES.CRITICAL || type === ERROR_TYPES.NETWORK) {
      const userMessage = context ? 
        `Error in ${context}: ${errorInfo.message}` : 
        errorInfo.message;
      showUserNotification(userMessage, 'error');
    }
    
    return errorInfo;
  }
  
  // Safe function wrapper that catches errors
  function safeExecute(fn, context = '', fallback = null) {
    try {
      return fn();
    } catch (error) {
      handleError(error, context, ERROR_TYPES.CRITICAL);
      return fallback;
    }
  }
  
  // Safe async function wrapper
  async function safeExecuteAsync(fn, context = '', fallback = null) {
    try {
      return await fn();
    } catch (error) {
      handleError(error, context, ERROR_TYPES.CRITICAL);
      return fallback;
    }
  }
  
  // Retry mechanism for failed operations
  async function retryOperation(operation, context = '', maxRetries = config.maxRetries) {
    let lastError;
    
    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      try {
        return await operation();
      } catch (error) {
        lastError = error;
        
        if (attempt < maxRetries) {
          FlickletDebug.warn(`🔄 Retry ${attempt}/${maxRetries} for ${context}`);
          await new Promise(resolve => setTimeout(resolve, config.retryDelay * attempt));
        }
      }
    }
    
    handleError(lastError, `${context} (after ${maxRetries} retries)`, ERROR_TYPES.CRITICAL);
    throw lastError;
  }
  
  // Function to get error history
  function getErrorHistory() {
    return [...errorHistory];
  }
  
  // Function to clear error history
  function clearErrorHistory() {
    errorHistory.length = 0;
    FlickletDebug.info('🗑️ Error history cleared');
  }
  
  // Function to get error statistics
  function getErrorStats() {
    const stats = {
      total: errorHistory.length,
      byType: {},
      byContext: {},
      recent: errorHistory.slice(-10)
    };
    
    errorHistory.forEach(error => {
      stats.byType[error.type] = (stats.byType[error.type] || 0) + 1;
      stats.byContext[error.context] = (stats.byContext[error.context] || 0) + 1;
    });
    
    return stats;
  }
  
  // Expose the error handler API
  window.ErrorHandler = {
    handle: handleError,
    safe: safeExecute,
    safeAsync: safeExecuteAsync,
    retry: retryOperation,
    types: ERROR_TYPES,
    history: getErrorHistory,
    clearHistory: clearErrorHistory,
    stats: getErrorStats,
    config: config
  };
  
  // Global error handler for uncaught errors
  window.addEventListener('error', (event) => {
    // Filter out chrome extension errors that we can't control
    if (event.error && event.error.message && 
        (event.error.message.includes('chrome-extension://') || 
         event.error.message.includes('pageViewId') ||
         event.error.message.includes('message port closed'))) {
      // Log but don't treat as critical
      console.warn('Chrome extension error (ignored):', event.error.message);
      return;
    }
    handleError(event.error, 'Global Error Handler', ERROR_TYPES.CRITICAL);
  });
  
  // Global handler for unhandled promise rejections
  window.addEventListener('unhandledrejection', (event) => {
    handleError(event.reason, 'Unhandled Promise Rejection', ERROR_TYPES.CRITICAL);
  });
  
  FlickletDebug.info('🛡️ Error Handler system initialized');
})();
