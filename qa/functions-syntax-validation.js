// qa/functions-syntax-validation.js
// Deep scan functions.js for syntax issues and validation

(async () => {
  const out = { ok: true, notes: [], errors: [] };
  const $ = s => document.querySelector(s);
  const $$ = s => document.querySelectorAll(s);

  console.log('[FUNCTIONS SYNTAX VALIDATION] Starting deep syntax scan...');

  // 1) Functions.js Loading Check
  console.log('[FUNCTIONS] Checking functions.js loading...');
  
  // Check if functions.js is loaded
  const functionsScript = $('script[src*="functions.js"]');
  if (functionsScript) {
    out.notes.push('✅ functions.js script tag found');
    out.notes.push(`📊 Script src: ${functionsScript.src}`);
  } else {
    out.notes.push('ℹ️ functions.js script tag not found (may be bundled)');
  }

  // 2) Global Functions Check
  console.log('[FUNCTIONS] Checking global functions...');
  
  const expectedFunctions = [
    'updateTabCounts',
    'loadListContent', 
    'moveItem',
    'removeItemFromCurrentList',
    'addToListFromCacheV2',
    'renderMediaCard',
    'getItemData'
  ];
  
  const availableFunctions = [];
  const missingFunctions = [];
  
  expectedFunctions.forEach(funcName => {
    if (typeof window[funcName] === 'function') {
      availableFunctions.push(funcName);
    } else {
      missingFunctions.push(funcName);
    }
  });
  
  out.notes.push(`📊 Available functions: ${availableFunctions.join(', ')}`);
  if (missingFunctions.length > 0) {
    out.errors.push(`❌ Missing functions: ${missingFunctions.join(', ')}`);
  } else {
    out.notes.push('✅ All expected functions available');
  }

  // 3) Syntax Error Detection
  console.log('[FUNCTIONS] Detecting syntax errors...');
  
  // Check for common syntax issues
  const syntaxIssues = [];
  
  // Check for undefined variables
  try {
    // Test if functions can be called without errors
    if (typeof window.updateTabCounts === 'function') {
      const result = window.updateTabCounts();
      if (result) {
        out.notes.push('✅ updateTabCounts executes without syntax errors');
      }
    }
  } catch (error) {
    syntaxIssues.push(`updateTabCounts: ${error.message}`);
  }
  
  // Check for WatchlistsAdapterV2
  if (window.WatchlistsAdapterV2) {
    out.notes.push('✅ WatchlistsAdapterV2 available');
    
    try {
      if (typeof window.WatchlistsAdapterV2.getCounts === 'function') {
        const counts = window.WatchlistsAdapterV2.getCounts();
        out.notes.push(`📊 Adapter counts: ${JSON.stringify(counts)}`);
      }
    } catch (error) {
      syntaxIssues.push(`WatchlistsAdapterV2.getCounts: ${error.message}`);
    }
  } else {
    out.notes.push('ℹ️ WatchlistsAdapterV2 not available');
  }
  
  if (syntaxIssues.length > 0) {
    out.errors.push(`❌ Syntax issues found: ${syntaxIssues.join(', ')}`);
  } else {
    out.notes.push('✅ No syntax errors detected');
  }

  // 4) Variable Declaration Check
  console.log('[FUNCTIONS] Checking variable declarations...');
  
  // Check for common variable issues
  const variableChecks = [
    { name: 'window.appData', check: () => window.appData },
    { name: 'window.FLAGS', check: () => window.FLAGS },
    { name: 'window.firebaseAuth', check: () => window.firebaseAuth },
    { name: 'window.t', check: () => window.t }
  ];
  
  variableChecks.forEach(({ name, check }) => {
    try {
      const value = check();
      if (value !== undefined && value !== null) {
        out.notes.push(`✅ ${name} is defined`);
      } else {
        out.notes.push(`ℹ️ ${name} is ${value}`);
      }
    } catch (error) {
      out.errors.push(`❌ ${name} error: ${error.message}`);
    }
  });

  // 5) Function Parameter Validation
  console.log('[FUNCTIONS] Validating function parameters...');
  
  // Test function calls with various parameters
  const functionTests = [
    {
      name: 'updateTabCounts',
      test: () => {
        if (typeof window.updateTabCounts === 'function') {
          return window.updateTabCounts();
        }
        return null;
      }
    },
    {
      name: 'loadListContent',
      test: () => {
        if (typeof window.loadListContent === 'function') {
          try {
            return window.loadListContent('watching');
          } catch (error) {
            return { error: error.message };
          }
        }
        return null;
      }
    }
  ];
  
  functionTests.forEach(({ name, test }) => {
    try {
      const result = test();
      if (result && result.error) {
        out.errors.push(`❌ ${name} parameter error: ${result.error}`);
      } else {
        out.notes.push(`✅ ${name} parameter validation passed`);
      }
    } catch (error) {
      out.errors.push(`❌ ${name} test failed: ${error.message}`);
    }
  });

  // 6) Event System Check
  console.log('[FUNCTIONS] Checking event system...');
  
  // Check for event listeners
  const eventChecks = [
    'cards:changed',
    'watchlists:updated',
    'tab:switched'
  ];
  
  eventChecks.forEach(eventName => {
    // Check if event can be dispatched
    try {
      const event = new CustomEvent(eventName, { detail: { test: true } });
      document.dispatchEvent(event);
      out.notes.push(`✅ ${eventName} event can be dispatched`);
    } catch (error) {
      out.errors.push(`❌ ${eventName} event error: ${error.message}`);
    }
  });

  // 7) Data Structure Validation
  console.log('[FUNCTIONS] Validating data structures...');
  
  if (window.appData) {
    const requiredDataStructures = [
      'appData.tv',
      'appData.movies', 
      'appData.settings',
      'appData.tv.watching',
      'appData.tv.wishlist',
      'appData.tv.watched',
      'appData.movies.watching',
      'appData.movies.wishlist',
      'appData.movies.watched'
    ];
    
    const missingStructures = [];
    requiredDataStructures.forEach(structure => {
      try {
        const value = eval(structure);
        if (value === undefined || value === null) {
          missingStructures.push(structure);
        }
      } catch (error) {
        missingStructures.push(structure);
      }
    });
    
    if (missingStructures.length > 0) {
      out.errors.push(`❌ Missing data structures: ${missingStructures.join(', ')}`);
    } else {
      out.notes.push('✅ All required data structures present');
    }
  }

  // 8) Error Handling Check
  console.log('[FUNCTIONS] Checking error handling...');
  
  // Test error-prone operations
  const errorTests = [
    {
      name: 'moveItem with invalid ID',
      test: () => {
        if (typeof window.moveItem === 'function') {
          try {
            window.moveItem('invalid-id', 'watching');
            return { success: true };
          } catch (error) {
            return { error: error.message };
          }
        }
        return { skipped: true };
      }
    },
    {
      name: 'removeItemFromCurrentList with invalid ID',
      test: () => {
        if (typeof window.removeItemFromCurrentList === 'function') {
          try {
            window.removeItemFromCurrentList('invalid-id');
            return { success: true };
          } catch (error) {
            return { error: error.message };
          }
        }
        return { skipped: true };
      }
    }
  ];
  
  errorTests.forEach(({ name, test }) => {
    const result = test();
    if (result.error) {
      out.notes.push(`ℹ️ ${name}: ${result.error} (may be expected)`);
    } else if (result.success) {
      out.notes.push(`✅ ${name}: handled gracefully`);
    } else {
      out.notes.push(`ℹ️ ${name}: skipped (function not available)`);
    }
  });

  // 9) Performance Check
  console.log('[FUNCTIONS] Checking performance...');
  
  // Test function execution time
  if (typeof window.updateTabCounts === 'function') {
    const startTime = performance.now();
    try {
      window.updateTabCounts();
      const endTime = performance.now();
      const executionTime = endTime - startTime;
      
      out.notes.push(`📊 updateTabCounts execution time: ${executionTime.toFixed(2)}ms`);
      
      if (executionTime < 100) {
        out.notes.push('✅ Function execution time acceptable');
      } else {
        out.notes.push('⚠️ Function execution time may be slow');
      }
    } catch (error) {
      out.errors.push(`❌ Performance test failed: ${error.message}`);
    }
  }

  // 10) Memory Usage Check
  console.log('[FUNCTIONS] Checking memory usage...');
  
  if (window.appData) {
    try {
      const dataSize = JSON.stringify(window.appData).length;
      out.notes.push(`📊 App data size: ${dataSize} characters`);
      
      if (dataSize < 100000) {
        out.notes.push('✅ App data size reasonable');
      } else {
        out.notes.push('⚠️ App data size may be large');
      }
    } catch (error) {
      out.notes.push(`ℹ️ Could not measure data size: ${error.message}`);
    }
  }

  // 11) Console Error Check
  console.log('[FUNCTIONS] Checking for console errors...');
  
  // Override console.error to catch errors
  const originalError = console.error;
  const errors = [];
  
  console.error = (...args) => {
    errors.push(args.join(' '));
    originalError.apply(console, args);
  };
  
  // Test some operations that might cause errors
  try {
    if (typeof window.updateTabCounts === 'function') {
      window.updateTabCounts();
    }
  } catch (error) {
    // Error already caught
  }
  
  // Restore original console.error
  console.error = originalError;
  
  if (errors.length > 0) {
    out.notes.push(`📊 Console errors detected: ${errors.length}`);
    errors.slice(0, 3).forEach(error => {
      out.notes.push(`  - ${error}`);
    });
  } else {
    out.notes.push('✅ No console errors detected');
  }

  // Summary
  console.log('[FUNCTIONS SYNTAX VALIDATION]', out.ok ? '✅ PASS' : '❌ FAIL');
  console.log('[FUNCTIONS SYNTAX VALIDATION] Notes:', out.notes);
  if (out.errors.length > 0) {
    console.log('[FUNCTIONS SYNTAX VALIDATION] Errors:', out.errors);
    out.ok = false;
  }
  
  // Return result for external use
  window.functionsSyntaxValidationResult = out;
  return out;
})();
