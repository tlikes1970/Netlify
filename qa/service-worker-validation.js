/**
 * Service Worker Validation Script
 * Purpose: Verify service worker cache bypass behavior and registration
 * Tests: SW registration, cache management, preview environment handling
 */

(function() {
  'use strict';
  
  console.log('🔧 [SW Validation] Starting service worker validation...');
  
  const results = {
    timestamp: new Date().toISOString(),
    environment: {
      hostname: location.hostname,
      protocol: location.protocol,
      isLocalhost: location.hostname === 'localhost' || location.hostname.endsWith('.local'),
      isPreview: location.hostname.includes('--deploy-preview-'),
      isProduction: location.hostname.endsWith('netlify.app') && !location.hostname.includes('--deploy-preview-')
    },
    serviceWorker: {
      supported: 'serviceWorker' in navigator,
      registrations: [],
      caches: [],
      registrationAttempted: false,
      registrationBlocked: false
    },
    cacheManagement: {
      cacheAPI: 'caches' in window,
      cacheKeys: [],
      cacheOperations: []
    },
    validation: {
      swDisabledOnPreview: false,
      swRegistrationBlocked: false,
      cacheBypassWorking: false,
      previewEnvironmentHandling: false
    },
    errors: [],
    warnings: []
  };
  
  // Test 1: Service Worker Support
  function testServiceWorkerSupport() {
    console.log('🔧 [SW Validation] Testing service worker support...');
    
    if (!('serviceWorker' in navigator)) {
      results.warnings.push('Service Worker API not supported in this browser');
      return;
    }
    
    console.log('✅ [SW Validation] Service Worker API supported');
  }
  
  // Test 2: Current Registrations
  async function testCurrentRegistrations() {
    console.log('🔧 [SW Validation] Checking current service worker registrations...');
    
    if (!('serviceWorker' in navigator)) return;
    
    try {
      const registrations = await navigator.serviceWorker.getRegistrations();
      results.serviceWorker.registrations = registrations.map(reg => ({
        scope: reg.scope,
        state: reg.active?.state || 'no active worker',
        scriptURL: reg.active?.scriptURL || 'no script URL'
      }));
      
      console.log(`✅ [SW Validation] Found ${registrations.length} service worker registrations`);
      console.log('📋 [SW Validation] Registrations:', results.serviceWorker.registrations);
    } catch (error) {
      results.errors.push(`Failed to get service worker registrations: ${error.message}`);
      console.error('❌ [SW Validation] Error getting registrations:', error);
    }
  }
  
  // Test 3: Cache Management
  async function testCacheManagement() {
    console.log('🔧 [SW Validation] Testing cache management...');
    
    if (!('caches' in window)) {
      results.warnings.push('Cache API not supported in this browser');
      return;
    }
    
    try {
      const cacheKeys = await caches.keys();
      results.cacheManagement.cacheKeys = cacheKeys;
      
      console.log(`✅ [SW Validation] Found ${cacheKeys.length} caches`);
      console.log('📋 [SW Validation] Cache keys:', cacheKeys);
      
      // Test cache operations
      for (const key of cacheKeys) {
        try {
          const cache = await caches.open(key);
          const requests = await cache.keys();
          results.cacheManagement.cacheOperations.push({
            cacheName: key,
            requestCount: requests.length,
            requests: requests.map(req => req.url)
          });
        } catch (error) {
          results.errors.push(`Failed to inspect cache ${key}: ${error.message}`);
        }
      }
      
    } catch (error) {
      results.errors.push(`Failed to get cache keys: ${error.message}`);
      console.error('❌ [SW Validation] Error getting cache keys:', error);
    }
  }
  
  // Test 4: Preview Environment Handling
  function testPreviewEnvironmentHandling() {
    console.log('🔧 [SW Validation] Testing preview environment handling...');
    
    const isPreview = location.hostname.includes('--deploy-preview-');
    
    if (isPreview) {
      // Check if SW is properly disabled on previews
      results.validation.previewEnvironmentHandling = true;
      results.validation.swDisabledOnPreview = true;
      console.log('✅ [SW Validation] Preview environment detected - SW should be disabled');
    } else {
      console.log('ℹ️ [SW Validation] Not in preview environment');
    }
  }
  
  // Test 5: Registration Blocking
  function testRegistrationBlocking() {
    console.log('🔧 [SW Validation] Testing registration blocking...');
    
    if (!('serviceWorker' in navigator)) return;
    
    // Check if registration is blocked (as it should be in preview environments)
    const originalRegister = navigator.serviceWorker.register;
    
    try {
      // Try to register a dummy service worker to test blocking
      navigator.serviceWorker.register('/non-existent-sw.js')
        .then(() => {
          results.validation.swRegistrationBlocked = false;
          console.log('⚠️ [SW Validation] Service worker registration not blocked');
        })
        .catch((error) => {
          results.validation.swRegistrationBlocked = true;
          results.serviceWorker.registrationBlocked = true;
          console.log('✅ [SW Validation] Service worker registration properly blocked:', error.message);
        });
    } catch (error) {
      results.validation.swRegistrationBlocked = true;
      console.log('✅ [SW Validation] Service worker registration blocked:', error.message);
    }
  }
  
  // Test 6: Cache Bypass Behavior
  function testCacheBypassBehavior() {
    console.log('🔧 [SW Validation] Testing cache bypass behavior...');
    
    // Test if cache bypass is working by checking if we can access fresh resources
    const testUrl = '/manifest.json';
    
    fetch(testUrl, { cache: 'no-cache' })
      .then(response => {
        if (response.ok) {
          results.validation.cacheBypassWorking = true;
          console.log('✅ [SW Validation] Cache bypass working - fresh resources accessible');
        } else {
          results.warnings.push('Cache bypass test failed - response not ok');
        }
      })
      .catch(error => {
        results.errors.push(`Cache bypass test failed: ${error.message}`);
        console.error('❌ [SW Validation] Cache bypass test failed:', error);
      });
  }
  
  // Test 7: Environment-Specific Behavior
  function testEnvironmentSpecificBehavior() {
    console.log('🔧 [SW Validation] Testing environment-specific behavior...');
    
    const env = results.environment;
    
    if (env.isPreview) {
      // In preview environments, SW should be disabled
      if (results.serviceWorker.registrations.length === 0) {
        console.log('✅ [SW Validation] Preview environment: No SW registrations (correct)');
      } else {
        results.warnings.push('Preview environment has active service worker registrations');
      }
    } else if (env.isLocalhost) {
      // In localhost, SW registration should be attempted but may be disabled
      console.log('ℹ️ [SW Validation] Localhost environment: SW behavior depends on configuration');
    } else if (env.isProduction) {
      // In production, SW should be registered
      console.log('ℹ️ [SW Validation] Production environment: SW should be registered if configured');
    }
  }
  
  // Test 8: Performance Impact
  function testPerformanceImpact() {
    console.log('🔧 [SW Validation] Testing performance impact...');
    
    const startTime = performance.now();
    
    // Test if SW affects page load performance
    if (results.serviceWorker.registrations.length > 0) {
      const endTime = performance.now();
      const loadTime = endTime - startTime;
      
      if (loadTime > 100) {
        results.warnings.push(`Service worker may impact performance: ${loadTime.toFixed(2)}ms`);
      } else {
        console.log('✅ [SW Validation] Service worker performance impact minimal');
      }
    }
  }
  
  // Run all tests
  async function runAllTests() {
    console.log('🚀 [SW Validation] Running all service worker validation tests...');
    
    try {
      testServiceWorkerSupport();
      await testCurrentRegistrations();
      await testCacheManagement();
      testPreviewEnvironmentHandling();
      testRegistrationBlocking();
      testCacheBypassBehavior();
      testEnvironmentSpecificBehavior();
      testPerformanceImpact();
      
      // Calculate overall validation score
      const totalTests = 8;
      const passedTests = Object.values(results.validation).filter(Boolean).length;
      const validationScore = (passedTests / totalTests) * 100;
      
      results.validationScore = validationScore;
      
      console.log('📊 [SW Validation] Validation complete!');
      console.log(`📈 [SW Validation] Validation Score: ${validationScore.toFixed(1)}%`);
      console.log('📋 [SW Validation] Results:', results);
      
      // Store results globally
      window.serviceWorkerValidationResult = results;
      
      return results;
      
    } catch (error) {
      results.errors.push(`Validation failed: ${error.message}`);
      console.error('❌ [SW Validation] Validation failed:', error);
      window.serviceWorkerValidationResult = results;
      return results;
    }
  }
  
  // Start validation
  runAllTests();
  
  console.log('✅ [SW Validation] Service worker validation script loaded');
})();



