/**
 * Process: Chrome Extension Messaging Polyfill
 * Purpose: Handle Chrome extension messaging errors gracefully when extensions are not available
 * Data Source: Chrome runtime API availability
 * Update Path: This file handles runtime.lastError suppression
 * Dependencies: YouTube embeds, Chrome extension communication
 */

(function() {
  'use strict';
  
  // Suppress Chrome extension messaging errors
  if (typeof chrome !== 'undefined' && chrome.runtime) {
    // Override sendMessage to handle errors gracefully
    const originalSendMessage = chrome.runtime.sendMessage;
    if (originalSendMessage) {
      chrome.runtime.sendMessage = function(...args) {
        try {
          return originalSendMessage.apply(this, args);
        } catch (error) {
          // Suppress "Could not establish connection" errors
          if (error.message && error.message.includes('Could not establish connection')) {
            console.debug('Chrome extension messaging suppressed:', error.message);
            return;
          }
          throw error;
        }
      };
    }
    
    // Handle runtime.lastError suppression
    const originalGetLastError = chrome.runtime.lastError;
    Object.defineProperty(chrome.runtime, 'lastError', {
      get: function() {
        const error = originalGetLastError;
        if (error && error.message && error.message.includes('Could not establish connection')) {
          console.debug('Chrome runtime.lastError suppressed:', error.message);
          return null;
        }
        return error;
      },
      configurable: true
    });
  }
  
  // Global error handler for unhandled promise rejections from messaging
  window.addEventListener('unhandledrejection', function(event) {
    if (event.reason && 
        typeof event.reason === 'object' && 
        event.reason.message && 
        event.reason.message.includes('Could not establish connection')) {
      console.debug('Unhandled promise rejection suppressed:', event.reason.message);
      event.preventDefault();
    }
  });
  
  // Handle YouTube iframe messaging errors
  window.addEventListener('message', function(event) {
    // Suppress errors from YouTube embeds trying to communicate with extensions
    if (event.origin && event.origin.includes('youtube.com')) {
      try {
        // Let YouTube messages pass through but catch any errors
        if (event.data && typeof event.data === 'object') {
          // Suppress specific YouTube extension communication errors
          if (event.data.type && event.data.type.includes('extension')) {
            console.debug('YouTube extension message suppressed:', event.data.type);
            return;
          }
        }
      } catch (error) {
        console.debug('YouTube message error suppressed:', error.message);
      }
    }
  });
  
  // Wrapped sendMessage callback for polyfill compatibility
  window.wrappedSendMessageCallback = function(callback) {
    return function(response) {
      try {
        if (callback) {
          callback(response);
        }
      } catch (error) {
        if (error.message && error.message.includes('Could not establish connection')) {
          console.debug('Wrapped sendMessage callback error suppressed:', error.message);
          return;
        }
        throw error;
      }
    };
  };
  
  console.log('🔧 Chrome extension messaging polyfill loaded');
})();






