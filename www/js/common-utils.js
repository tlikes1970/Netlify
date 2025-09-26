/* ============== Common Utilities (Reduced Duplication) ==============
   Centralized utilities that replace repeated patterns across the codebase
   Maintains all existing functionality while reducing code duplication
*/

(function () {
  'use strict';

  // Common utility functions
  window.FlickletUtils = {
    // ============== DOM Utilities ==============

    // Safe element creation with error handling
    createElement: function (tag, attributes = {}, textContent = '') {
      return ErrorHandler.safe(
        () => {
          const element = document.createElement(tag);

          // Set attributes
          Object.entries(attributes).forEach(([key, value]) => {
            if (key === 'className') {
              element.className = value;
            } else if (key === 'innerHTML') {
              element.innerHTML = value;
            } else {
              element.setAttribute(key, value);
            }
          });

          // Set text content
          if (textContent) {
            element.textContent = textContent;
          }

          return element;
        },
        'createElement',
        null,
      );
    },

    // Safe element query with caching
    queryElement: function (selector, useCache = true) {
      if (useCache && window.DOMCache) {
        return window.DOMCache.getBySelector(selector);
      }
      return ErrorHandler.safe(() => document.querySelector(selector), 'queryElement', null);
    },

    // Safe multiple element query with caching
    queryElements: function (selector, useCache = true) {
      if (useCache && window.DOMCache) {
        return window.DOMCache.getMultipleBySelector(selector);
      }
      return ErrorHandler.safe(
        () => Array.from(document.querySelectorAll(selector)),
        'queryElements',
        [],
      );
    },

    // ============== Event Utilities ==============

    // Safe event listener with cleanup tracking
    addEventListener: function (element, event, handler, options = {}) {
      if (!element) {
        FlickletDebug.warn('Cannot add event listener: element not found');
        return false;
      }

      return ErrorHandler.safe(
        () => {
          element.addEventListener(event, handler, options);

          // Track for cleanup
          if (!element._flickletListeners) {
            element._flickletListeners = [];
          }
          element._flickletListeners.push({ event, handler, options });

          return true;
        },
        'addEventListener',
        false,
      );
    },

    // Remove all tracked event listeners
    removeAllListeners: function (element) {
      if (!element || !element._flickletListeners) return;

      element._flickletListeners.forEach(({ event, handler, options }) => {
        element.removeEventListener(event, handler, options);
      });

      element._flickletListeners = [];
    },

    // ============== Data Utilities ==============

    // Safe localStorage operations
    storage: {
      get: function (key, defaultValue = null) {
        return ErrorHandler.safe(
          () => {
            const value = localStorage.getItem(key);
            return value ? JSON.parse(value) : defaultValue;
          },
          `storage.get(${key})`,
          defaultValue,
        );
      },

      set: function (key, value) {
        return ErrorHandler.safe(
          () => {
            localStorage.setItem(key, JSON.stringify(value));
            return true;
          },
          `storage.set(${key})`,
          false,
        );
      },

      remove: function (key) {
        return ErrorHandler.safe(
          () => {
            localStorage.removeItem(key);
            return true;
          },
          `storage.remove(${key})`,
          false,
        );
      },

      clear: function () {
        return ErrorHandler.safe(
          () => {
            localStorage.clear();
            return true;
          },
          'storage.clear',
          false,
        );
      },
    },

    // ============== Async Utilities ==============

    // Safe delay function
    delay: function (ms) {
      return new Promise((resolve) => setTimeout(resolve, ms));
    },

    // Safe timeout with cleanup
    timeout: function (fn, ms) {
      const timeoutId = setTimeout(fn, ms);
      return () => clearTimeout(timeoutId);
    },

    // Safe interval with cleanup
    interval: function (fn, ms) {
      const intervalId = setInterval(fn, ms);
      return () => clearInterval(intervalId);
    },

    // ============== Validation Utilities ==============

    // Check if value is valid
    isValid: function (value) {
      return value !== null && value !== undefined && value !== '';
    },

    // Check if element exists and is visible
    isElementVisible: function (element) {
      if (!element) return false;

      return ErrorHandler.safe(
        () => {
          const style = window.getComputedStyle(element);
          return style.display !== 'none' && style.visibility !== 'hidden' && style.opacity !== '0';
        },
        'isElementVisible',
        false,
      );
    },

    // ============== String Utilities ==============

    // Safe string truncation
    truncate: function (str, length, suffix = '...') {
      if (!str || str.length <= length) return str;
      return str.substring(0, length - suffix.length) + suffix;
    },

    // Safe HTML escaping
    escapeHtml: function (str) {
      if (!str) return '';
      return str.replace(
        /[&<>"']/g,
        (match) =>
          ({
            '&': '&amp;',
            '<': '&lt;',
            '>': '&gt;',
            '"': '&quot;',
            "'": '&#39;',
          })[match],
      );
    },

    // ============== Array Utilities ==============

    // Safe array operations
    array: {
      // Remove duplicates
      unique: function (arr) {
        return [...new Set(arr)];
      },

      // Group by key
      groupBy: function (arr, key) {
        return arr.reduce((groups, item) => {
          const group = item[key];
          groups[group] = groups[group] || [];
          groups[group].push(item);
          return groups;
        }, {});
      },

      // Safe array access
      get: function (arr, index, defaultValue = null) {
        return arr && arr[index] !== undefined ? arr[index] : defaultValue;
      },
    },

    // ============== Object Utilities ==============

    // Safe object operations
    object: {
      // Deep merge objects
      merge: function (target, ...sources) {
        if (!sources.length) return target;
        const source = sources.shift();

        if (this.isObject(target) && this.isObject(source)) {
          for (const key in source) {
            if (this.isObject(source[key])) {
              if (!target[key]) Object.assign(target, { [key]: {} });
              this.merge(target[key], source[key]);
            } else {
              Object.assign(target, { [key]: source[key] });
            }
          }
        }

        return this.merge(target, ...sources);
      },

      // Check if value is object
      isObject: function (item) {
        return item && typeof item === 'object' && !Array.isArray(item);
      },

      // Safe property access
      get: function (obj, path, defaultValue = null) {
        return path.split('.').reduce((current, key) => {
          return current && current[key] !== undefined ? current[key] : defaultValue;
        }, obj);
      },
    },

    // ============== Performance Utilities ==============

    // Debounce function
    debounce: function (func, wait, immediate = false) {
      let timeout;
      return function executedFunction(...args) {
        const later = () => {
          timeout = null;
          if (!immediate) func.apply(this, args);
        };
        const callNow = immediate && !timeout;
        clearTimeout(timeout);
        timeout = setTimeout(later, wait);
        if (callNow) func.apply(this, args);
      };
    },

    // Throttle function
    throttle: function (func, limit) {
      let inThrottle;
      return function (...args) {
        if (!inThrottle) {
          func.apply(this, args);
          inThrottle = true;
          setTimeout(() => (inThrottle = false), limit);
        }
      };
    },

    // ============== Notification Utilities ==============

    // Safe notification display
    notify: function (message, type = 'info', duration = 5000) {
      return ErrorHandler.safe(
        () => {
          if (window.showNotification && typeof window.showNotification === 'function') {
            window.showNotification(message, type);
            return true;
          }

          // Fallback notification
          const notification = this.createElement(
            'div',
            {
              style: `
            position: fixed;
            top: 20px;
            right: 20px;
            background: ${type === 'error' ? '#ff4444' : type === 'success' ? '#44ff44' : '#4444ff'};
            color: white;
            padding: 12px 20px;
            border-radius: 8px;
            z-index: 100000;
            font-size: 14px;
            max-width: 300px;
            box-shadow: 0 4px 12px rgba(0,0,0,0.3);
          `,
            },
            message,
          );

          document.body.appendChild(notification);

          // Auto-remove
          setTimeout(() => {
            if (notification.parentNode) {
              notification.parentNode.removeChild(notification);
            }
          }, duration);

          return true;
        },
        'notify',
        false,
      );
    },
  };

  // Shorter aliases for common functions
  window.$ = window.FlickletUtils.queryElement;
  window.$$ = window.FlickletUtils.queryElements;
  window.createEl = window.FlickletUtils.createElement;
  window.notify = window.FlickletUtils.notify;

  FlickletDebug.info('🔧 Common Utilities loaded');
})();
