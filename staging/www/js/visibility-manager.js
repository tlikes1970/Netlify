/* ============== Unified Visibility Management System ==============
   Centralized visibility management that replaces scattered show/hide logic
   Maintains all existing functionality while providing consistent behavior
*/

(function() {
  'use strict';
  
  // Visibility states
  const VISIBILITY_STATES = {
    VISIBLE: 'visible',
    HIDDEN: 'hidden',
    NONE: 'none',
    BLOCK: 'block',
    FLEX: 'flex',
    INLINE: 'inline',
    INLINE_BLOCK: 'inline-block'
  };
  
  // Visibility contexts
  const VISIBILITY_CONTEXTS = {
    TAB_SWITCH: 'tab-switch',
    SEARCH_ACTIVE: 'search-active',
    SEARCH_CLEAR: 'search-clear',
    MODAL_OPEN: 'modal-open',
    MODAL_CLOSE: 'modal-close',
    FEATURE_TOGGLE: 'feature-toggle'
  };
  
  // Visibility manager configuration
  const config = {
    useTransitions: true,
    transitionDuration: 200,
    respectExistingStyles: true,
    logChanges: false
  };
  
  // Track visibility state
  const visibilityState = new Map();
  
  // Function to get element visibility
  function getElementVisibility(element) {
    if (!element) return VISIBILITY_STATES.HIDDEN;
    
    const computedStyle = window.getComputedStyle(element);
    const display = computedStyle.display;
    const visibility = computedStyle.visibility;
    const opacity = computedStyle.opacity;
    
    if (display === 'none') return VISIBILITY_STATES.NONE;
    if (visibility === 'hidden') return VISIBILITY_STATES.HIDDEN;
    if (opacity === '0') return VISIBILITY_STATES.HIDDEN;
    
    return VISIBILITY_STATES.VISIBLE;
  }
  
  // Function to set element visibility
  function setElementVisibility(element, state, context = '') {
    if (!element) {
      FlickletDebug.warn('Cannot set visibility: element not found');
      return false;
    }
    
    const previousState = getElementVisibility(element);
    
    try {
      switch (state) {
        case VISIBILITY_STATES.VISIBLE:
        case VISIBILITY_STATES.BLOCK:
          element.style.display = 'block';
          element.style.visibility = 'visible';
          element.style.opacity = '1';
          break;
          
        case VISIBILITY_STATES.HIDDEN:
          element.style.visibility = 'hidden';
          element.style.opacity = '0';
          // Don't change display for hidden
          break;
          
        case VISIBILITY_STATES.NONE:
          element.style.display = 'none';
          break;
          
        case VISIBILITY_STATES.FLEX:
          element.style.display = 'flex';
          element.style.visibility = 'visible';
          element.style.opacity = '1';
          break;
          
        case VISIBILITY_STATES.INLINE:
          element.style.display = 'inline';
          element.style.visibility = 'visible';
          element.style.opacity = '1';
          break;
          
        case VISIBILITY_STATES.INLINE_BLOCK:
          element.style.display = 'inline-block';
          element.style.visibility = 'visible';
          element.style.opacity = '1';
          break;
          
        default:
          FlickletDebug.warn('Unknown visibility state:', state);
          return false;
      }
      
      // Track state change
      visibilityState.set(element.id || element, {
        state: state,
        context: context,
        timestamp: Date.now(),
        previousState: previousState
      });
      
      if (config.logChanges) {
        FlickletDebug.debug(`👁️ Visibility changed: ${element.id || element} -> ${state} (${context})`);
      }
      
      return true;
    } catch (error) {
      ErrorHandler.handle(error, `Visibility change for ${element.id || element}`, ERROR_TYPES.WARNING);
      return false;
    }
  }
  
  // Function to show element
  function showElement(element, displayType = 'block', context = '') {
    return setElementVisibility(element, displayType, context);
  }
  
  // Function to hide element
  function hideElement(element, hideType = 'none', context = '') {
    return setElementVisibility(element, hideType, context);
  }
  
  // Function to toggle element visibility
  function toggleElement(element, showState = 'block', hideState = 'none', context = '') {
    const currentState = getElementVisibility(element);
    
    if (currentState === VISIBILITY_STATES.VISIBLE || currentState === showState) {
      return hideElement(element, hideState, context);
    } else {
      return showElement(element, showState, context);
    }
  }
  
  // Function to show multiple elements
  function showElements(elements, displayType = 'block', context = '') {
    const results = [];
    
    if (Array.isArray(elements)) {
      elements.forEach(element => {
        results.push(showElement(element, displayType, context));
      });
    } else if (typeof elements === 'object') {
      Object.values(elements).forEach(element => {
        results.push(showElement(element, displayType, context));
      });
    }
    
    return results;
  }
  
  // Function to hide multiple elements
  function hideElements(elements, hideType = 'none', context = '') {
    const results = [];
    
    if (Array.isArray(elements)) {
      elements.forEach(element => {
        results.push(hideElement(element, hideType, context));
      });
    } else if (typeof elements === 'object') {
      Object.values(elements).forEach(element => {
        results.push(hideElement(element, hideType, context));
      });
    }
    
    return results;
  }
  
  // Function to manage home sections visibility
  function manageHomeSections(visible, context = '') {
    const homeSections = window.HomeSectionsConfig.getSections('tab-switch');
    const sectionElements = window.HomeSectionsConfig.getSectionElements('tab-switch');
    
    const results = [];
    
    homeSections.forEach(sectionId => {
      const element = sectionElements[sectionId];
      if (element) {
        const result = visible ? 
          showElement(element, 'block', context) : 
          hideElement(element, 'none', context);
        results.push({ sectionId, success: result });
      } else {
        FlickletDebug.warn(`Home section not found: ${sectionId}`);
        results.push({ sectionId, success: false });
      }
    });
    
    return results;
  }
  
  // Function to manage search visibility
  function manageSearchVisibility(active, context = '') {
    const searchSections = window.HomeSectionsConfig.getSections('search-hide');
    const sectionElements = window.HomeSectionsConfig.getSectionElements('search-hide');
    
    const results = [];
    
    searchSections.forEach(sectionId => {
      const element = sectionElements[sectionId];
      if (element) {
        const result = active ? 
          hideElement(element, 'none', context) : 
          showElement(element, 'block', context);
        results.push({ sectionId, success: result });
      }
    });
    
    return results;
  }
  
  // Function to get visibility statistics
  function getVisibilityStats() {
    const stats = {
      totalElements: visibilityState.size,
      byState: {},
      byContext: {},
      recentChanges: []
    };
    
    for (const [elementId, data] of visibilityState.entries()) {
      stats.byState[data.state] = (stats.byState[data.state] || 0) + 1;
      stats.byContext[data.context] = (stats.byContext[data.context] || 0) + 1;
      
      if (Date.now() - data.timestamp < 60000) { // Last minute
        stats.recentChanges.push({ elementId, ...data });
      }
    }
    
    return stats;
  }
  
  // Function to clear visibility history
  function clearVisibilityHistory() {
    visibilityState.clear();
    FlickletDebug.info('🗑️ Visibility history cleared');
  }
  
  // Expose the visibility manager API
  window.VisibilityManager = {
    show: showElement,
    hide: hideElement,
    toggle: toggleElement,
    showMultiple: showElements,
    hideMultiple: hideElements,
    manageHomeSections: manageHomeSections,
    manageSearchVisibility: manageSearchVisibility,
    getState: getElementVisibility,
    getStats: getVisibilityStats,
    clearHistory: clearVisibilityHistory,
    states: VISIBILITY_STATES,
    contexts: VISIBILITY_CONTEXTS,
    config: config
  };
  
  // Shorter aliases for convenience
  window.show = showElement;
  window.hide = hideElement;
  window.toggle = toggleElement;
  
  FlickletDebug.info('👁️ Visibility Manager system initialized');
})();
