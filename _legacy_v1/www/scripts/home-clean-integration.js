/**
 * Home Clean Integration Script
 * Mounts the Home Clean component when feature flag is enabled
 */

(function() {
    'use strict';

    // Wait for DOM and flags to be ready
    function initializeHomeClean() {
        // Always enable homeClean feature for Phase 4
        window.FLAGS = window.FLAGS || {};
        window.FLAGS.homeClean = true;
        window.FLAGS.legacyHome = false;
        
        console.log('[home-clean] Phase 4 system enabled');
        console.log('[home-clean] FLAGS state:', window.FLAGS);
        console.log('[home-clean] HomeClean component available:', !!window.HomeClean);
        console.log('[home-clean] mountHomeClean function available:', !!window.mountHomeClean);

        // Check if component loader is available
        if (!window.mountHomeClean) {
            console.warn('[home-clean] Component loader not available, loading...');
            loadComponentLoader();
            return;
        }

        // Find home section
        const homeSection = document.getElementById('homeSection');
        if (!homeSection) {
            console.warn('[home-clean] Home section not found');
            return;
        }

        console.log('[home-clean] Found home section:', homeSection);
        console.log('[home-clean] Home section current content length:', homeSection.innerHTML.length);

        // Mount the component
        console.log('[home-clean] Mounting component...');
        window.mountHomeClean(homeSection)
            .then(success => {
                if (success) {
                    console.log('[home-clean] Component mounted successfully');
                    console.log('[home-clean] Home section new content length:', homeSection.innerHTML.length);
                    
                    // Add event listeners for action events
                    setupActionEventListeners();
                } else {
                    console.error('[home-clean] Failed to mount component');
                }
            })
            .catch(error => {
                console.error('[home-clean] Mount error:', error);
            });
    }

    /**
     * Load the component loader script
     */
    function loadComponentLoader() {
        const script = document.createElement('script');
        script.src = '/components/home-clean/index.js';
        script.onload = () => {
            console.log('[home-clean] Component loader loaded, retrying mount...');
            setTimeout(initializeHomeClean, 100);
        };
        script.onerror = () => {
            console.error('[home-clean] Failed to load component loader');
        };
        document.head.appendChild(script);
    }

    /**
     * Setup event listeners for action events
     */
    function setupActionEventListeners() {
        // Currently Watching action events
        window.addEventListener('cw:want', (event) => {
            console.log('[home-clean] Want to Watch:', event.detail);
            // TODO: Phase 3 - Hook to actual data mutations
        });

        window.addEventListener('cw:watched', (event) => {
            console.log('[home-clean] Marked as Watched:', event.detail);
            // TODO: Phase 3 - Hook to actual data mutations
        });

        window.addEventListener('cw:dismiss', (event) => {
            console.log('[home-clean] Dismissed:', event.detail);
            // TODO: Phase 3 - Hook to actual data mutations
        });

        window.addEventListener('cw:delete', (event) => {
            console.log('[home-clean] Deleted:', event.detail);
            // TODO: Phase 3 - Hook to actual data mutations
        });

        // Holiday assignment events
        window.addEventListener('holiday:assigned', (event) => {
            console.log('[home-clean] Holiday assigned:', event.detail);
            // Holiday assignments are already persisted to localStorage
        });
    }

    /**
     * Cleanup function for when component needs to be destroyed
     */
    function cleanupHomeClean() {
        if (window.destroyHomeClean) {
            window.destroyHomeClean();
            console.log('[home-clean] Component destroyed');
        }
    }

    // Export cleanup function globally
    window.cleanupHomeClean = cleanupHomeClean;
    
    // Export manual mount function for testing
    window.forceMountHomeClean = () => {
        console.log('[home-clean] Manual mount triggered...');
        const homeSection = document.getElementById('homeSection');
        if (homeSection && window.mountHomeClean) {
            return window.mountHomeClean(homeSection);
        } else {
            console.error('[home-clean] Cannot mount - missing homeSection or mountHomeClean');
            return Promise.resolve(false);
        }
    };

    // Initialize when DOM is ready
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', initializeHomeClean);
    } else {
        // DOM is already ready
        initializeHomeClean();
    }

    // Also initialize after a short delay to ensure other scripts have loaded
    setTimeout(initializeHomeClean, 1000);
    
    // Force mount after 3 seconds as backup
    setTimeout(() => {
        console.log('[home-clean] Backup mount attempt...');
        const homeSection = document.getElementById('homeSection');
        if (homeSection && window.mountHomeClean) {
            console.log('[home-clean] Forcing mount...');
            window.mountHomeClean(homeSection).then(success => {
                console.log('[home-clean] Backup mount result:', success);
            });
        }
    }, 3000);

})();
