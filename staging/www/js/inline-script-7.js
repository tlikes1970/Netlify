
    (function() {
      'use strict';
      
      console.log('🏠 Home Layout Guardrails loaded');
      
      // Immovable Home Layout Contract - Exact 6 Section Order
      const REQUIRED_HOME_SECTIONS = [
        'quote-bar',
        'group-1-your-shows',
        'group-2-community', 
        'group-3-for-you',
        'group-4-theaters',
        'group-5-feedback'
      ];
      
      // Runtime Order Assertion
      function assertHomeOrder() {
        const homeRoot = document.getElementById('homeSection');
        if (!homeRoot) {
          console.error('❌ HOME ORDER VIOLATION: homeSection not found');
          return false;
        }
        
        const children = Array.from(homeRoot.children);
        const sectionIds = children.map(child => child.id).filter(id => id);
        
        console.log('🏠 Home sections found:', sectionIds);
        
        // Check if all required sections exist in correct order
        let orderViolation = false;
        REQUIRED_HOME_SECTIONS.forEach((requiredId, index) => {
          const foundIndex = sectionIds.indexOf(requiredId);
          if (foundIndex === -1) {
            console.error(`❌ HOME ORDER VIOLATION: Missing required section "${requiredId}"`);
            orderViolation = true;
          } else if (foundIndex !== index) {
            console.error(`❌ HOME ORDER VIOLATION: Section "${requiredId}" at position ${foundIndex}, expected ${index}`);
            orderViolation = true;
          }
        });
        
        // Check for unexpected sections
        sectionIds.forEach((id, index) => {
          if (!REQUIRED_HOME_SECTIONS.includes(id)) {
            console.error(`❌ HOME ORDER VIOLATION: Unexpected section "${id}" at position ${index}`);
            orderViolation = true;
          }
        });
        
        if (orderViolation) {
          console.error('❌ HOME ORDER VIOLATION: Removing unexpected nodes');
          // Remove unexpected nodes
          children.forEach((child, index) => {
            if (!REQUIRED_HOME_SECTIONS.includes(child.id)) {
              console.log(`🗑️ Removing unexpected section: ${child.id}`);
              child.remove();
            }
          });
        }
        
        return !orderViolation;
      }
      
      // Purge Legacy Sections
      function purgeLegacySections() {
        const legacySelectors = [
          '#bingeMeter',
          '.stats',
          '#upcomingEpisodes', 
          '#quote-flickword-container',
          '#quoteCard',
          '#randomQuoteCard',
          '#bingeBanner'
        ];
        
        legacySelectors.forEach(selector => {
          const element = document.querySelector(selector);
          if (element) {
            console.log(`🗑️ Purging legacy section: ${selector}`);
            element.remove();
          }
        });
      }
      
      // Initialize Quote Bar with Enhanced Quotes System
      function initQuoteBar() {
        const quoteBar = document.getElementById('quote-bar');
        if (!quoteBar) return;
        
        // Set loading state
        quoteBar.setAttribute('data-state', 'loading');
        quoteBar.style.display = 'block';
        
        // Wait for enhanced quotes system to load, then initialize
        const waitForEnhancedQuotes = () => {
          if (window.QuotesEnhanced && typeof window.QuotesEnhanced.drawQuote === 'function') {
            // Enhanced quotes system is ready
            const quote = window.QuotesEnhanced.drawQuote();
            const quoteText = document.getElementById('quoteText');
            if (quoteText) {
              quoteText.textContent = quote;
              quoteBar.setAttribute('data-state', 'loaded');
              
              // Add smooth transition
              quoteBar.style.opacity = '0';
              requestAnimationFrame(() => {
                quoteBar.style.transition = 'opacity 0.3s ease';
                quoteBar.style.opacity = '1';
              });
            }
          } else {
            // Fallback to basic quotes if enhanced system not ready
            const basicQuotes = [
              "The best way to predict the future is to create it. - Peter Drucker",
              "Life is what happens to you while you're busy making other plans. - John Lennon", 
              "The only way to do great work is to love what you do. - Steve Jobs",
              "Innovation distinguishes between a leader and a follower. - Steve Jobs",
              "Your time is limited, don't waste it living someone else's life. - Steve Jobs",
              "Stay hungry, stay foolish. - Steve Jobs",
              "The future belongs to those who believe in the beauty of their dreams. - Eleanor Roosevelt",
              "It is during our darkest moments that we must focus to see the light. - Aristotle"
            ];
            const quote = basicQuotes[Math.floor(Math.random() * basicQuotes.length)];
            const quoteText = document.getElementById('quoteText');
            if (quoteText) {
              quoteText.textContent = quote;
              quoteBar.setAttribute('data-state', 'loaded');
              
              // Add smooth transition
              quoteBar.style.opacity = '0';
              requestAnimationFrame(() => {
                quoteBar.style.transition = 'opacity 0.3s ease';
                quoteBar.style.opacity = '1';
              });
            }
          }
        };
        
        // Try immediately, then retry after a short delay if needed
        waitForEnhancedQuotes();
        setTimeout(waitForEnhancedQuotes, 500);
      }
      
      // Disable Auto-Inject Systems
      function disableAutoInjectSystems() {
        // Disable MP-Playlists v1
        if (window.FLAGS) {
          window.FLAGS.spotlight_enabled = false;
          window.FLAGS.quotes_enabled = false;
          window.FLAGS.curated_rows_auto_inject = false;
          window.FLAGS.personalized_rows_auto_inject = false;
        }
        
        // Disable Quote System
        if (window.ensureBlocks) {
          window.ensureBlocks = function() { return false; };
        }
        
        // Disable MP-Playlists v1 boot
        if (window.MP_PLAYLISTS_V1) {
          window.MP_PLAYLISTS_V1.enabled = false;
        }
        
        console.log('🚫 Auto-inject systems disabled');
      }
      
            // Override FlickWord mount point to target our specific container
            function overrideFlickWordMount() {
              // Override the findHomeMount function to target our FlickWord container
              window.findHomeMount = function() {
                const flickwordMount = document.querySelector('.flickword-mount');
                if (flickwordMount) {
                  console.log('🎯 FlickWord mount found: .flickword-mount');
                  return flickwordMount;
                }
                // Fallback to original home section
                const homeSection = document.querySelector('#homeSection');
                console.log('🎯 FlickWord mount fallback: #homeSection');
                return homeSection;
              };
              
              // FlickFact feature removed - no longer needed
              
              console.log('🎯 FlickWord system overridden for new layout');
            }
      
      // Handle player container resizing
      function handlePlayerResizing() {
        const communityContent = document.querySelector('.community-content');
        const communityLeft = document.querySelector('.community-left');
        const communityRight = document.querySelector('.community-right');
        
        if (!communityContent || !communityLeft || !communityRight) return;
        
        // Force recalculation of container sizes
        function resizeContainers() {
          // Trigger reflow
          communityContent.style.display = 'none';
          communityContent.offsetHeight; // Force reflow
          communityContent.style.display = 'flex';
          
          // Ensure proper sizing
          communityLeft.style.width = '100%';
          communityRight.style.width = '100%';
          
          console.log('🔄 Community containers resized');
        }
        
        // Resize on window resize
        window.addEventListener('resize', resizeContainers);
        
        // Resize when iframe loads
        const iframe = communityLeft.querySelector('iframe');
        if (iframe) {
          iframe.addEventListener('load', resizeContainers);
        }
        
        // Initial resize
        setTimeout(resizeContainers, 100);
      }
      
      // Initialize when DOM is ready
      function initHomeGuardrails() {
        console.log('🏠 Initializing Home Layout Guardrails...');
        
        // Disable auto-inject systems first
        disableAutoInjectSystems();
        
        // Purge legacy sections
        purgeLegacySections();
        
        // Initialize quote bar
        initQuoteBar();
        
        // Override FlickWord mount point
        overrideFlickWordMount();
        
        // Handle player container resizing
        handlePlayerResizing();
        
        // Initialize Community Games
        function initCommunityGames() {
          console.log('🎮 Initializing Community Games...');
          
          // Check if game scripts loaded
          console.log('🎮 Game script check:', {
            triviaScript: typeof window.FlickletTrivia !== 'undefined',
            flickwordScript: typeof window.flickword !== 'undefined',
            triviaTile: !!document.getElementById('triviaTile'),
            flickwordCard: !!document.getElementById('flickwordCard')
          });
          
          // Try to manually trigger trivia if it exists
          if (typeof window.FlickletTrivia !== 'undefined') {
            console.log('🎮 FlickletTrivia found, checking for init function...');
            console.log('🎮 Available methods:', Object.keys(window.FlickletTrivia));
          }
          
          // Check if trivia is already loaded by the original script
          const triviaTile = document.getElementById('triviaTile');
          const questionEl = document.getElementById('triviaQuestion');
          const choicesEl = document.getElementById('triviaChoices');
          
          if (triviaTile && questionEl && choicesEl) {
            console.log('🎮 Trivia elements found:', {
              hasQuestion: !!questionEl.textContent,
              hasChoices: !!choicesEl.innerHTML,
              questionText: questionEl.textContent
            });
            
            // If trivia is already loaded, just ensure it fits in the container
            if (questionEl.textContent && questionEl.textContent !== '') {
              console.log('🎮 Trivia already loaded by original script');
              // Apply compact styling to existing content
              questionEl.style.fontSize = '13px';
              questionEl.style.lineHeight = '1.3';
              questionEl.style.marginBottom = '8px';
              
              // Style existing choice buttons
              const existingButtons = choicesEl.querySelectorAll('button, li, div');
              existingButtons.forEach(btn => {
                btn.style.padding = '6px 8px';
                btn.style.fontSize = '12px';
                btn.style.marginBottom = '4px';
                btn.style.borderRadius = '4px';
              });
            }
          }
          
          // The games should load automatically via their respective systems
          // FlickWord and Trivia are separate game systems that will populate their containers
          console.log('🎮 Community games containers ready');
        }
        
        // Trivia answer selection is handled by the trivia.js script
        // No need for a separate selectAnswer function here
        
        // Initialize games after a delay
        setTimeout(initCommunityGames, 2000);
        setTimeout(initCommunityGames, 5000);
        
        // Also try when DOM is fully ready
        document.addEventListener('DOMContentLoaded', () => {
          setTimeout(initCommunityGames, 1000);
          
          // Initialize theme system
          (function ensureTheme() {
            const k = 'flicklet-theme';
            const t = localStorage.getItem(k) || 'light';
            document.documentElement.setAttribute('data-theme', t);
            // Optional: wire buttons if present
            document.querySelectorAll('[data-set-theme]').forEach(btn=>{
              btn.addEventListener('click', e=>{
                const v = btn.getAttribute('data-set-theme');
                if (!v) return;
                localStorage.setItem(k, v);
                document.documentElement.setAttribute('data-theme', v);
              }, { once: false });
            });
          })();
        });
        
        // Assert order after a short delay to allow other scripts to run
        setTimeout(() => {
          const isValid = assertHomeOrder();
          if (isValid) {
            console.log('✅ Home layout order validated');
          }
        }, 100);
      }
      
      // Run immediately and on DOM ready
      if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', initHomeGuardrails);
      } else {
        initHomeGuardrails();
      }
      
      // Re-assert order after any major DOM changes
      const observer = new MutationObserver((mutations) => {
        mutations.forEach((mutation) => {
          if (mutation.type === 'childList' && mutation.target.id === 'homeSection') {
            console.log('🏠 Home section DOM changed, re-asserting order...');
            setTimeout(assertHomeOrder, 50);
          }
        });
      });
      
      // Start observing when homeSection is available
      const checkHomeSection = setInterval(() => {
        const homeSection = document.getElementById('homeSection');
        if (homeSection) {
          observer.observe(homeSection, { childList: true, subtree: true });
          clearInterval(checkHomeSection);
        }
      }, 100);
      
    })();
    