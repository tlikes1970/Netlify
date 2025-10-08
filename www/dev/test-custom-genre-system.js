/* ========== test-custom-genre-system.js ==========
   Test script for the custom genre selection system
   Verifies that all components work together correctly
*/

(function () {
  'use strict';

  console.log('🧪 Testing Custom Genre System...');

  // Test 1: Check if all required modules are loaded
  function testModuleLoading() {
    console.log('🧪 Test 1: Module Loading');
    
    const modules = {
      'CustomGenreSelector': !!window.CustomGenreSelector,
      'CustomCuratedRows': !!window.CustomCuratedRows,
      'tmdbGet': !!window.tmdbGet,
      'Card': !!window.Card
    };

    console.log('🧪 Module status:', modules);
    
    const allLoaded = Object.values(modules).every(Boolean);
    console.log(allLoaded ? '✅ All modules loaded' : '❌ Some modules missing');
    
    return allLoaded;
  }

  // Test 2: Check if settings UI elements exist
  function testSettingsUI() {
    console.log('🧪 Test 2: Settings UI');
    
    const elements = {
      'Custom Rows Count Input': !!document.getElementById('settingCustomRowsCount'),
      'Genre Dropdowns Container': !!document.getElementById('genreDropdownsContainer'),
      'Custom Genre Selection Section': !!document.getElementById('customGenreSelection')
    };

    console.log('🧪 UI elements status:', elements);
    
    const allPresent = Object.values(elements).every(Boolean);
    console.log(allPresent ? '✅ All UI elements present' : '❌ Some UI elements missing');
    
    return allPresent;
  }

  // Test 3: Check if home page elements exist
  function testHomePageUI() {
    console.log('🧪 Test 3: Home Page UI');
    
    const elements = {
      'Curated Sections Container': !!document.getElementById('curatedSections'),
      'Curated Sections Title': !!document.getElementById('curatedSectionsTitle')
    };

    console.log('🧪 Home page elements status:', elements);
    
    const allPresent = Object.values(elements).every(Boolean);
    console.log(allPresent ? '✅ All home page elements present' : '❌ Some home page elements missing');
    
    return allPresent;
  }

  // Test 4: Test genre data fetching
  async function testGenreDataFetching() {
    console.log('🧪 Test 4: Genre Data Fetching');
    
    if (!window.CustomGenreSelector) {
      console.log('❌ CustomGenreSelector not available');
      return false;
    }

    try {
      const success = await window.CustomGenreSelector.fetchGenreData();
      console.log(success ? '✅ Genre data fetched successfully' : '❌ Failed to fetch genre data');
      return success;
    } catch (error) {
      console.error('❌ Error fetching genre data:', error);
      return false;
    }
  }

  // Test 5: Test genre selection export
  function testGenreSelectionExport() {
    console.log('🧪 Test 5: Genre Selection Export');
    
    if (!window.CustomGenreSelector) {
      console.log('❌ CustomGenreSelector not available');
      return false;
    }

    try {
      const selections = window.CustomGenreSelector.exportSelections();
      console.log('🧪 Current selections:', selections);
      console.log('✅ Genre selection export working');
      return true;
    } catch (error) {
      console.error('❌ Error exporting selections:', error);
      return false;
    }
  }

  // Test 6: Test custom curated rows rendering
  function testCustomCuratedRowsRendering() {
    console.log('🧪 Test 6: Custom Curated Rows Rendering');
    
    if (!window.CustomCuratedRows) {
      console.log('❌ CustomCuratedRows not available');
      return false;
    }

    try {
      window.CustomCuratedRows.render();
      console.log('✅ Custom curated rows rendering triggered');
      return true;
    } catch (error) {
      console.error('❌ Error rendering custom curated rows:', error);
      return false;
    }
  }

  // Run all tests
  async function runAllTests() {
    console.log('🧪 Running Custom Genre System Tests...');
    console.log('='.repeat(50));

    const results = {
      moduleLoading: testModuleLoading(),
      settingsUI: testSettingsUI(),
      homePageUI: testHomePageUI(),
      genreDataFetching: await testGenreDataFetching(),
      genreSelectionExport: testGenreSelectionExport(),
      customCuratedRowsRendering: testCustomCuratedRowsRendering()
    };

    console.log('='.repeat(50));
    console.log('🧪 Test Results Summary:');
    console.log(results);

    const allPassed = Object.values(results).every(Boolean);
    console.log(allPassed ? '🎉 All tests passed!' : '⚠️ Some tests failed');

    return results;
  }

  // Expose test function
  window.testCustomGenreSystem = runAllTests;

  // Auto-run tests if in development mode
  if (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1') {
    setTimeout(runAllTests, 3000); // Wait 3 seconds for everything to load
  }

})();

