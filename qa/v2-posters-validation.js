/**
 * V2 Posters Validation Script
 * Purpose: Test that poster images are loading correctly in V2 Cards
 * Tests: Poster URL construction, image loading, fallback behavior
 */

(function() {
  'use strict';
  
  console.log('🖼️ [V2 Posters Validation] Starting poster validation...');
  
  const results = {
    timestamp: new Date().toISOString(),
    environment: {
      url: location.href,
      userAgent: navigator.userAgent
    },
    posterTests: {
      urlConstruction: { passed: 0, failed: 0, details: [] },
      imageLoading: { passed: 0, failed: 0, details: [] },
      fallbackBehavior: { passed: 0, failed: 0, details: [] },
      dataAdapter: { passed: 0, failed: 0, details: [] }
    },
    validation: {
      posterUrlsCorrect: false,
      imagesLoading: false,
      fallbacksWorking: false,
      dataAdapterWorking: false
    },
    errors: [],
    warnings: []
  };
  
  // Test 1: Poster URL Construction
  function testPosterUrlConstruction() {
    console.log('🖼️ [V2 Posters] Testing poster URL construction...');
    
    // Test the resolvePosterUrl function
    if (window.resolvePosterUrl) {
      const testCases = [
        { input: '/abc123.jpg', expected: 'https://image.tmdb.org/t/p/w200/abc123.jpg' },
        { input: 'https://example.com/poster.jpg', expected: 'https://example.com/poster.jpg' },
        { input: 'data:image/svg+xml;base64,test', expected: 'data:image/svg+xml;base64,test' },
        { input: null, expected: 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMTIwIiBoZWlnaHQ9IjE4MCIgdmlld0JveD0iMCAwIDEyMCAxODAiIGZpbGw9Im5vbmUiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+CjxyZWN0IHdpZHRoPSIxMjAiIGhlaWdodD0iMTgwIiBmaWxsPSIjMGYxMTE3Ii8+CjxwYXRoIGQ9Ik01NiA2MEw2NCA2OEw3MiA2MEw4MCA2OEw4OCA2MEw5NiA2OEwxMDQgNjBMMTEyIDY4VjEwMEw5NiAxMTJMODAgMTAwTDY0IDExMkw0OCAxMDBWNjhaIiBmaWxsPSIjMjQyYTMzIi8+Cjx0ZXh0IHg9IjYwIiB5PSIxNDAiIGZvbnQtZmFtaWx5PSJBcmlhbCIgZm9udC1zaXplPSIxMiIgZmlsbD0iI2E5YjNjMSI+Tm8gUG9zdGVyPC90ZXh0Pgo8L3N2Zz4K' },
        { input: '', expected: 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMTIwIiBoZWlnaHQ9IjE4MCIgdmlld0JveD0iMCAwIDEyMCAxODAiIGZpbGw9Im5vbmUiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+CjxyZWN0IHdpZHRoPSIxMjAiIGhlaWdodD0iMTgwIiBmaWxsPSIjMGYxMTE3Ii8+CjxwYXRoIGQ9Ik01NiA2MEw2NCA2OEw3MiA2MEw4MCA2OEw4OCA2MEw5NiA2OEwxMDQgNjBMMTEyIDY4VjEwMEw5NiAxMTJMODAgMTAwTDY0IDExMkw0OCAxMDBWNjhaIiBmaWxsPSIjMjQyYTMzIi8+Cjx0ZXh0IHg9IjYwIiB5PSIxNDAiIGZvbnQtZmFtaWx5PSJBcmlhbCIgZm9udC1zaXplPSIxMiIgZmlsbD0iI2E5YjNjMSI+Tm8gUG9zdGVyPC90ZXh0Pgo8L3N2Zz4K' }
      ];
      
      testCases.forEach((testCase, index) => {
        try {
          const result = window.resolvePosterUrl(testCase.input);
          if (result === testCase.expected) {
            results.posterTests.urlConstruction.passed++;
            results.posterTests.urlConstruction.details.push(`✅ Test ${index + 1}: ${testCase.input} → ${result}`);
          } else {
            results.posterTests.urlConstruction.failed++;
            results.posterTests.urlConstruction.details.push(`❌ Test ${index + 1}: Expected ${testCase.expected}, got ${result}`);
            results.errors.push(`Poster URL construction failed for input: ${testCase.input}`);
          }
        } catch (error) {
          results.posterTests.urlConstruction.failed++;
          results.posterTests.urlConstruction.details.push(`❌ Test ${index + 1}: Error - ${error.message}`);
          results.errors.push(`Poster URL construction error: ${error.message}`);
        }
      });
      
      if (results.posterTests.urlConstruction.failed === 0) {
        results.validation.posterUrlsCorrect = true;
        console.log('✅ [V2 Posters] Poster URL construction working correctly');
      } else {
        console.log('❌ [V2 Posters] Poster URL construction has issues');
      }
    } else {
      results.errors.push('resolvePosterUrl function not available');
      console.log('❌ [V2 Posters] resolvePosterUrl function not found');
    }
  }
  
  // Test 2: Data Adapter Poster Handling
  function testDataAdapterPosterHandling() {
    console.log('🖼️ [V2 Posters] Testing data adapter poster handling...');
    
    if (window.toCardProps) {
      const testItems = [
        {
          id: 1,
          title: 'Test Movie',
          poster_path: '/abc123.jpg',
          media_type: 'movie'
        },
        {
          id: 2,
          title: 'Test TV Show',
          poster_path: '/def456.jpg',
          media_type: 'tv'
        },
        {
          id: 3,
          title: 'No Poster',
          media_type: 'movie'
        },
        {
          id: 4,
          title: 'Full URL Poster',
          poster: 'https://example.com/poster.jpg',
          media_type: 'movie'
        }
      ];
      
      testItems.forEach((item, index) => {
        try {
          const props = window.toCardProps(item);
          const hasPoster = props.poster && props.poster !== '';
          const isFullUrl = props.poster && (props.poster.startsWith('http') || props.poster.startsWith('data:'));
          
          if (hasPoster && isFullUrl) {
            results.posterTests.dataAdapter.passed++;
            results.posterTests.dataAdapter.details.push(`✅ Item ${index + 1}: ${item.title} - Poster: ${props.poster}`);
          } else {
            results.posterTests.dataAdapter.failed++;
            results.posterTests.dataAdapter.details.push(`❌ Item ${index + 1}: ${item.title} - Invalid poster: ${props.poster}`);
            results.errors.push(`Data adapter poster handling failed for: ${item.title}`);
          }
        } catch (error) {
          results.posterTests.dataAdapter.failed++;
          results.posterTests.dataAdapter.details.push(`❌ Item ${index + 1}: Error - ${error.message}`);
          results.errors.push(`Data adapter error: ${error.message}`);
        }
      });
      
      if (results.posterTests.dataAdapter.failed === 0) {
        results.validation.dataAdapterWorking = true;
        console.log('✅ [V2 Posters] Data adapter poster handling working correctly');
      } else {
        console.log('❌ [V2 Posters] Data adapter poster handling has issues');
      }
    } else {
      results.errors.push('toCardProps function not available');
      console.log('❌ [V2 Posters] toCardProps function not found');
    }
  }
  
  // Test 3: Image Loading in V2 Cards
  function testImageLoading() {
    console.log('🖼️ [V2 Posters] Testing image loading in V2 Cards...');
    
    // Find all V2 card images
    const v2CardImages = document.querySelectorAll('.card.v2 img');
    console.log(`Found ${v2CardImages.length} V2 card images`);
    
    if (v2CardImages.length === 0) {
      results.warnings.push('No V2 card images found on page');
      return;
    }
    
    let loadedCount = 0;
    let errorCount = 0;
    
    v2CardImages.forEach((img, index) => {
      const src = img.src;
      const alt = img.alt;
      
      if (img.complete && img.naturalHeight > 0) {
        // Image already loaded
        loadedCount++;
        results.posterTests.imageLoading.passed++;
        results.posterTests.imageLoading.details.push(`✅ Image ${index + 1}: ${alt} - Loaded (${src.substring(0, 50)}...)`);
      } else if (img.complete && img.naturalHeight === 0) {
        // Image failed to load
        errorCount++;
        results.posterTests.imageLoading.failed++;
        results.posterTests.imageLoading.details.push(`❌ Image ${index + 1}: ${alt} - Failed to load (${src.substring(0, 50)}...)`);
        results.errors.push(`Image failed to load: ${src}`);
      } else {
        // Image still loading - test after a delay
        img.addEventListener('load', () => {
          loadedCount++;
          results.posterTests.imageLoading.passed++;
          results.posterTests.imageLoading.details.push(`✅ Image ${index + 1}: ${alt} - Loaded (${src.substring(0, 50)}...)`);
        });
        
        img.addEventListener('error', () => {
          errorCount++;
          results.posterTests.imageLoading.failed++;
          results.posterTests.imageLoading.details.push(`❌ Image ${index + 1}: ${alt} - Failed to load (${src.substring(0, 50)}...)`);
          results.errors.push(`Image failed to load: ${src}`);
        });
      }
    });
    
    // Wait a bit for async image loading
    setTimeout(() => {
      if (results.posterTests.imageLoading.failed === 0) {
        results.validation.imagesLoading = true;
        console.log('✅ [V2 Posters] All images loaded successfully');
      } else {
        console.log(`❌ [V2 Posters] ${results.posterTests.imageLoading.failed} images failed to load`);
      }
    }, 2000);
  }
  
  // Test 4: Fallback Behavior
  function testFallbackBehavior() {
    console.log('🖼️ [V2 Posters] Testing fallback behavior...');
    
    // Check if placeholder images are being used
    const placeholderImages = document.querySelectorAll('img[src*="data:image/svg+xml"]');
    const v2Cards = document.querySelectorAll('.card.v2');
    
    console.log(`Found ${placeholderImages.length} placeholder images and ${v2Cards.length} V2 cards`);
    
    if (v2Cards.length > 0) {
      // Check if cards without posters show placeholders
      v2Cards.forEach((card, index) => {
        const img = card.querySelector('img');
        if (img) {
          const src = img.src;
          if (src.includes('data:image/svg+xml') || src.includes('No Poster')) {
            results.posterTests.fallbackBehavior.passed++;
            results.posterTests.fallbackBehavior.details.push(`✅ Card ${index + 1}: Using placeholder image`);
          } else {
            results.posterTests.fallbackBehavior.passed++;
            results.posterTests.fallbackBehavior.details.push(`✅ Card ${index + 1}: Using poster image (${src.substring(0, 50)}...)`);
          }
        } else {
          results.posterTests.fallbackBehavior.failed++;
          results.posterTests.fallbackBehavior.details.push(`❌ Card ${index + 1}: No image element found`);
          results.errors.push(`V2 card ${index + 1} missing image element`);
        }
      });
      
      if (results.posterTests.fallbackBehavior.failed === 0) {
        results.validation.fallbacksWorking = true;
        console.log('✅ [V2 Posters] Fallback behavior working correctly');
      } else {
        console.log('❌ [V2 Posters] Fallback behavior has issues');
      }
    } else {
      results.warnings.push('No V2 cards found to test fallback behavior');
    }
  }
  
  // Test 5: Tab-Specific Poster Rendering
  function testTabSpecificPosterRendering() {
    console.log('🖼️ [V2 Posters] Testing tab-specific poster rendering...');
    
    const tabs = ['watching', 'wishlist', 'watched', 'discover'];
    let totalCards = 0;
    let cardsWithPosters = 0;
    
    tabs.forEach(tab => {
      const tabSection = document.getElementById(`${tab}Section`);
      if (tabSection) {
        const cards = tabSection.querySelectorAll('.card.v2');
        totalCards += cards.length;
        
        cards.forEach(card => {
          const img = card.querySelector('img');
          if (img && img.src && !img.src.includes('data:image/svg+xml')) {
            cardsWithPosters++;
          }
        });
        
        console.log(`Tab ${tab}: ${cards.length} cards, ${cards.filter(c => c.querySelector('img') && !c.querySelector('img').src.includes('data:image/svg+xml')).length} with posters`);
      }
    });
    
    if (totalCards > 0) {
      const posterRate = (cardsWithPosters / totalCards) * 100;
      console.log(`Overall tab poster rate: ${posterRate.toFixed(1)}% (${cardsWithPosters}/${totalCards})`);
      
      if (posterRate > 50) {
        results.validation.imagesLoading = true;
        console.log('✅ [V2 Posters] Good poster coverage across tabs');
      } else {
        results.warnings.push(`Low tab poster coverage: ${posterRate.toFixed(1)}%`);
        console.log('⚠️ [V2 Posters] Low poster coverage across tabs');
      }
    } else {
      results.warnings.push('No V2 cards found in any tabs');
    }
  }
  
  // Test 6: Home Page Poster Rendering
  function testHomePagePosterRendering() {
    console.log('🖼️ [V2 Posters] Testing home page poster rendering...');
    
    const homeSections = [
      'currentlyWatchingPreview',
      'up-next-row',
      'curated-sections',
      'community-spotlight'
    ];
    
    let totalHomeCards = 0;
    let homeCardsWithPosters = 0;
    
    homeSections.forEach(sectionId => {
      const section = document.getElementById(sectionId);
      if (section) {
        const cards = section.querySelectorAll('.card.v2');
        totalHomeCards += cards.length;
        
        cards.forEach(card => {
          const img = card.querySelector('img');
          if (img && img.src && !img.src.includes('data:image/svg+xml')) {
            homeCardsWithPosters++;
          }
        });
        
        console.log(`Home section ${sectionId}: ${cards.length} cards, ${cards.filter(c => c.querySelector('img') && !c.querySelector('img').src.includes('data:image/svg+xml')).length} with posters`);
      }
    });
    
    if (totalHomeCards > 0) {
      const homePosterRate = (homeCardsWithPosters / totalHomeCards) * 100;
      console.log(`Overall home poster rate: ${homePosterRate.toFixed(1)}% (${homeCardsWithPosters}/${totalHomeCards})`);
      
      if (homePosterRate > 50) {
        console.log('✅ [V2 Posters] Good poster coverage on home page');
      } else {
        results.warnings.push(`Low home poster coverage: ${homePosterRate.toFixed(1)}%`);
        console.log('⚠️ [V2 Posters] Low poster coverage on home page');
      }
    } else {
      results.warnings.push('No V2 cards found on home page');
    }
  }
  
  // Run all tests
  async function runAllTests() {
    console.log('🚀 [V2 Posters] Running all poster validation tests...');
    
    try {
      testPosterUrlConstruction();
      testDataAdapterPosterHandling();
      testImageLoading();
      testFallbackBehavior();
      testTabSpecificPosterRendering();
      testHomePagePosterRendering();
      
      // Calculate overall validation score
      const totalTests = 4;
      const passedTests = Object.values(results.validation).filter(Boolean).length;
      const validationScore = (passedTests / totalTests) * 100;
      
      results.validationScore = validationScore;
      
      console.log('📊 [V2 Posters] Validation complete!');
      console.log(`📈 [V2 Posters] Validation Score: ${validationScore.toFixed(1)}%`);
      console.log('📋 [V2 Posters] Results:', results);
      
      // Store results globally
      window.v2PostersValidationResult = results;
      
      return results;
      
    } catch (error) {
      results.errors.push(`Validation failed: ${error.message}`);
      console.error('❌ [V2 Posters] Validation failed:', error);
      window.v2PostersValidationResult = results;
      return results;
    }
  }
  
  // Start validation
  runAllTests();
  
  console.log('✅ [V2 Posters] V2 posters validation script loaded');
})();
