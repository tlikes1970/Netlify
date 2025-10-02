/**
 * Comprehensive Runtime Testing Script
 * Purpose: Execute all validation scripts in sequence and provide summary
 * Tests: All 11 validation scripts with comprehensive reporting
 */

(function() {
  'use strict';
  
  console.log('🚀 [Comprehensive Runtime Test] Starting comprehensive testing...');
  
  const testResults = {
    timestamp: new Date().toISOString(),
    environment: {
      url: location.href,
      userAgent: navigator.userAgent,
      timestamp: Date.now()
    },
    scripts: {
      highPriority: [
        { name: 'Basic Fixes', path: '/qa/dev-asserts.js', status: 'pending', result: null },
        { name: 'V2 Cards System', path: '/qa/v2-cards-validation.js', status: 'pending', result: null },
        { name: 'Sticky Layout', path: '/qa/sticky-layout-validation.js', status: 'pending', result: null },
        { name: 'Counts Parity', path: '/qa/counts-parity-validation.js', status: 'pending', result: null },
        { name: 'Auth Modal', path: '/qa/auth-modal-validation.js', status: 'pending', result: null }
      ],
      mediumPriority: [
        { name: 'Spanish Translation', path: '/qa/spanish-translation-validation.js', status: 'pending', result: null },
        { name: 'Discover Layout', path: '/qa/discover-layout-validation.js', status: 'pending', result: null },
        { name: 'FlickWord Modal', path: '/qa/flickword-modal-validation.js', status: 'pending', result: null },
        { name: 'Functions Syntax', path: '/qa/functions-syntax-validation.js', status: 'pending', result: null }
      ],
      lowPriority: [
        { name: 'Service Worker', path: '/qa/service-worker-validation.js', status: 'pending', result: null },
        { name: 'Performance', path: '/qa/performance-validation.js', status: 'pending', result: null }
      ]
    },
    summary: {
      totalScripts: 11,
      completed: 0,
      failed: 0,
      warnings: 0,
      errors: 0,
      overallScore: 0
    },
    results: {},
    errors: [],
    warnings: []
  };
  
  // Load and execute a single validation script
  function loadValidationScript(scriptInfo) {
    return new Promise((resolve, reject) => {
      console.log(`🔧 [Comprehensive Test] Loading ${scriptInfo.name}...`);
      
      const script = document.createElement('script');
      script.src = scriptInfo.path;
      script.onload = () => {
        console.log(`✅ [Comprehensive Test] ${scriptInfo.name} loaded successfully`);
        scriptInfo.status = 'loaded';
        
        // Wait a bit for the script to execute and store results
        setTimeout(() => {
          const resultKey = scriptInfo.name.toLowerCase().replace(/\s+/g, '') + 'ValidationResult';
          const result = window[resultKey];
          
          if (result) {
            scriptInfo.result = result;
            scriptInfo.status = 'completed';
            testResults.summary.completed++;
            
            // Count errors and warnings
            if (result.errors && result.errors.length > 0) {
              testResults.summary.errors += result.errors.length;
              testResults.errors.push(...result.errors.map(err => `${scriptInfo.name}: ${err}`));
            }
            if (result.warnings && result.warnings.length > 0) {
              testResults.summary.warnings += result.warnings.length;
              testResults.warnings.push(...result.warnings.map(warn => `${scriptInfo.name}: ${warn}`));
            }
            
            console.log(`✅ [Comprehensive Test] ${scriptInfo.name} completed with results`);
          } else {
            scriptInfo.status = 'no-results';
            testResults.summary.failed++;
            testResults.errors.push(`${scriptInfo.name}: No results found`);
            console.log(`⚠️ [Comprehensive Test] ${scriptInfo.name} completed but no results found`);
          }
          
          resolve(scriptInfo);
        }, 1000); // Wait 1 second for script execution
      };
      
      script.onerror = (error) => {
        scriptInfo.status = 'failed';
        testResults.summary.failed++;
        testResults.errors.push(`${scriptInfo.name}: Failed to load - ${error.message || 'Unknown error'}`);
        console.error(`❌ [Comprehensive Test] ${scriptInfo.name} failed to load:`, error);
        reject(error);
      };
      
      document.head.appendChild(script);
    });
  }
  
  // Execute all validation scripts
  async function runAllValidationScripts() {
    console.log('🚀 [Comprehensive Test] Starting validation script execution...');
    
    const allScripts = [
      ...testResults.scripts.highPriority,
      ...testResults.scripts.mediumPriority,
      ...testResults.scripts.lowPriority
    ];
    
    // Execute scripts sequentially to avoid conflicts
    for (const scriptInfo of allScripts) {
      try {
        await loadValidationScript(scriptInfo);
        
        // Small delay between scripts
        await new Promise(resolve => setTimeout(resolve, 500));
        
      } catch (error) {
        console.error(`❌ [Comprehensive Test] Failed to execute ${scriptInfo.name}:`, error);
        testResults.errors.push(`${scriptInfo.name}: Execution failed - ${error.message}`);
      }
    }
    
    console.log('✅ [Comprehensive Test] All validation scripts executed');
  }
  
  // Generate comprehensive summary
  function generateSummary() {
    console.log('📊 [Comprehensive Test] Generating summary...');
    
    // Calculate overall score
    const totalPossible = testResults.summary.totalScripts * 100;
    const completedScore = testResults.summary.completed * 100;
    const errorPenalty = testResults.summary.errors * 10;
    const warningPenalty = testResults.summary.warnings * 5;
    
    testResults.summary.overallScore = Math.max(0, (completedScore - errorPenalty - warningPenalty) / totalPossible * 100);
    
    // Generate detailed results
    testResults.results = {
      highPriority: testResults.scripts.highPriority.map(script => ({
        name: script.name,
        status: script.status,
        hasErrors: script.result?.errors?.length > 0,
        hasWarnings: script.result?.warnings?.length > 0,
        score: script.result?.validationScore || script.result?.performanceScore || 0
      })),
      mediumPriority: testResults.scripts.mediumPriority.map(script => ({
        name: script.name,
        status: script.status,
        hasErrors: script.result?.errors?.length > 0,
        hasWarnings: script.result?.warnings?.length > 0,
        score: script.result?.validationScore || script.result?.performanceScore || 0
      })),
      lowPriority: testResults.scripts.lowPriority.map(script => ({
        name: script.name,
        status: script.status,
        hasErrors: script.result?.errors?.length > 0,
        hasWarnings: script.result?.warnings?.length > 0,
        score: script.result?.validationScore || script.result?.performanceScore || 0
      }))
    };
    
    console.log('📈 [Comprehensive Test] Summary generated');
  }
  
  // Display results
  function displayResults() {
    console.log('📋 [Comprehensive Test] ===== COMPREHENSIVE TEST RESULTS =====');
    console.log(`📊 Overall Score: ${testResults.summary.overallScore.toFixed(1)}%`);
    console.log(`✅ Completed: ${testResults.summary.completed}/${testResults.summary.totalScripts}`);
    console.log(`❌ Failed: ${testResults.summary.failed}`);
    console.log(`⚠️ Warnings: ${testResults.summary.warnings}`);
    console.log(`🚨 Errors: ${testResults.summary.errors}`);
    
    console.log('\n📋 [Comprehensive Test] ===== DETAILED RESULTS =====');
    
    // High Priority Results
    console.log('\n🔴 HIGH PRIORITY:');
    testResults.results.highPriority.forEach(result => {
      const status = result.status === 'completed' ? '✅' : '❌';
      const score = result.score > 0 ? ` (${result.score.toFixed(1)}%)` : '';
      console.log(`  ${status} ${result.name}${score}`);
      if (result.hasErrors) console.log(`    🚨 Has errors`);
      if (result.hasWarnings) console.log(`    ⚠️ Has warnings`);
    });
    
    // Medium Priority Results
    console.log('\n🟡 MEDIUM PRIORITY:');
    testResults.results.mediumPriority.forEach(result => {
      const status = result.status === 'completed' ? '✅' : '❌';
      const score = result.score > 0 ? ` (${result.score.toFixed(1)}%)` : '';
      console.log(`  ${status} ${result.name}${score}`);
      if (result.hasErrors) console.log(`    🚨 Has errors`);
      if (result.hasWarnings) console.log(`    ⚠️ Has warnings`);
    });
    
    // Low Priority Results
    console.log('\n🟢 LOW PRIORITY:');
    testResults.results.lowPriority.forEach(result => {
      const status = result.status === 'completed' ? '✅' : '❌';
      const score = result.score > 0 ? ` (${result.score.toFixed(1)}%)` : '';
      console.log(`  ${status} ${result.name}${score}`);
      if (result.hasErrors) console.log(`    🚨 Has errors`);
      if (result.hasWarnings) console.log(`    ⚠️ Has warnings`);
    });
    
    // Errors and Warnings
    if (testResults.errors.length > 0) {
      console.log('\n🚨 ERRORS:');
      testResults.errors.forEach(error => console.log(`  - ${error}`));
    }
    
    if (testResults.warnings.length > 0) {
      console.log('\n⚠️ WARNINGS:');
      testResults.warnings.forEach(warning => console.log(`  - ${warning}`));
    }
    
    console.log('\n📋 [Comprehensive Test] ===== END RESULTS =====');
  }
  
  // Main execution function
  async function runComprehensiveTest() {
    console.log('🚀 [Comprehensive Test] Starting comprehensive runtime testing...');
    
    try {
      // Execute all validation scripts
      await runAllValidationScripts();
      
      // Generate summary
      generateSummary();
      
      // Display results
      displayResults();
      
      // Store results globally
      window.comprehensiveTestResult = testResults;
      
      console.log('✅ [Comprehensive Test] Comprehensive testing complete!');
      console.log('📋 [Comprehensive Test] Results stored in window.comprehensiveTestResult');
      
      return testResults;
      
    } catch (error) {
      console.error('❌ [Comprehensive Test] Comprehensive testing failed:', error);
      testResults.errors.push(`Comprehensive test failed: ${error.message}`);
      window.comprehensiveTestResult = testResults;
      return testResults;
    }
  }
  
  // Start comprehensive testing
  runComprehensiveTest();
  
  console.log('✅ [Comprehensive Test] Comprehensive runtime testing script loaded');
})();
