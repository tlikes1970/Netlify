/* ============== DOM Element Caching System ==============
   Centralized DOM element caching to reduce repeated queries
   Maintains all existing functionality while improving performance
*/

(function () {
  'use strict';

  // DOM element cache
  const elementCache = new Map();

  // Cache invalidation timer
  let cacheInvalidationTimer = null;

  // Cache TTL (time to live) in milliseconds
  const CACHE_TTL = 5000; // 5 seconds

  // Function to invalidate cache
  function invalidateCache() {
    elementCache.clear();
    FlickletDebug.debug('🗑️ DOM cache invalidated');
  }

  // Function to get element with caching
  function getElement(id, forceRefresh = false) {
    // Check if we should force refresh
    if (forceRefresh) {
      elementCache.delete(id);
    }

    // Check cache first
    if (elementCache.has(id)) {
      const cached = elementCache.get(id);

      // Check if element still exists in DOM
      if (cached.element && document.contains(cached.element)) {
        FlickletDebug.debug(`📋 Cache hit for element: ${id}`);
        return cached.element;
      } else {
        // Element was removed from DOM, remove from cache
        elementCache.delete(id);
        FlickletDebug.debug(`🗑️ Removed stale cache entry for: ${id}`);
      }
    }

    // Query DOM for element
    const element = document.getElementById(id);

    if (element) {
      // Cache the element with timestamp
      elementCache.set(id, {
        element: element,
        timestamp: Date.now(),
      });

      FlickletDebug.debug(`💾 Cached element: ${id}`);
    } else {
      FlickletDebug.warn(`❌ Element not found: ${id}`);
    }

    return element;
  }

  // Function to get multiple elements with caching
  function getElements(ids, forceRefresh = false) {
    const elements = {};

    ids.forEach((id) => {
      const element = getElement(id, forceRefresh);
      if (element) {
        elements[id] = element;
      }
    });

    return elements;
  }

  // Function to get element by selector with caching
  function getElementBySelector(selector, forceRefresh = false) {
    const cacheKey = `selector:${selector}`;

    if (!forceRefresh && elementCache.has(cacheKey)) {
      const cached = elementCache.get(cacheKey);
      if (cached.element && document.contains(cached.element)) {
        FlickletDebug.debug(`📋 Cache hit for selector: ${selector}`);
        return cached.element;
      } else {
        elementCache.delete(cacheKey);
      }
    }

    const element = document.querySelector(selector);

    if (element) {
      elementCache.set(cacheKey, {
        element: element,
        timestamp: Date.now(),
      });
      FlickletDebug.debug(`💾 Cached selector: ${selector}`);
    }

    return element;
  }

  // Function to get multiple elements by selector with caching
  function getElementsBySelector(selector, forceRefresh = false) {
    const cacheKey = `selectorAll:${selector}`;

    if (!forceRefresh && elementCache.has(cacheKey)) {
      const cached = elementCache.get(cacheKey);
      if (cached.elements && cached.elements.length > 0) {
        // Check if all elements still exist
        const allExist = cached.elements.every((el) => document.contains(el));
        if (allExist) {
          FlickletDebug.debug(`📋 Cache hit for selectorAll: ${selector}`);
          return cached.elements;
        } else {
          elementCache.delete(cacheKey);
        }
      }
    }

    const elements = document.querySelectorAll(selector);
    const elementsArray = Array.from(elements);

    if (elementsArray.length > 0) {
      elementCache.set(cacheKey, {
        elements: elementsArray,
        timestamp: Date.now(),
      });
      FlickletDebug.debug(`💾 Cached selectorAll: ${selector}`);
    }

    return elementsArray;
  }

  // Function to clear specific cache entry
  function clearCacheEntry(id) {
    elementCache.delete(id);
    FlickletDebug.debug(`🗑️ Cleared cache entry: ${id}`);
  }

  // Function to get cache statistics
  function getCacheStats() {
    return {
      size: elementCache.size,
      entries: Array.from(elementCache.keys()),
    };
  }

  // Set up automatic cache invalidation
  function setupCacheInvalidation() {
    if (cacheInvalidationTimer) {
      clearInterval(cacheInvalidationTimer);
    }

    cacheInvalidationTimer = setInterval(() => {
      const now = Date.now();
      let invalidated = 0;

      for (const [key, value] of elementCache.entries()) {
        if (now - value.timestamp > CACHE_TTL) {
          elementCache.delete(key);
          invalidated++;
        }
      }

      if (invalidated > 0) {
        FlickletDebug.debug(`🗑️ Auto-invalidated ${invalidated} stale cache entries`);
      }
    }, CACHE_TTL);
  }

  // Initialize cache invalidation
  setupCacheInvalidation();

  // Expose the DOM cache API
  window.DOMCache = {
    get: getElement,
    getMultiple: getElements,
    getBySelector: getElementBySelector,
    getMultipleBySelector: getElementsBySelector,
    clear: clearCacheEntry,
    invalidate: invalidateCache,
    stats: getCacheStats,
  };

  // Also expose as shorter aliases for convenience
  window.$ = getElement;
  window.$$ = getElements;
  window.$s = getElementBySelector;
  window.$$s = getElementsBySelector;

  FlickletDebug.info('💾 DOM Cache system initialized');
})();
