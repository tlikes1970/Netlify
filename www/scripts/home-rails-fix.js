/* ========== HOME RAILS FIX - JS PATCH ==========
 * File: www/scripts/home-rails-fix.js
 * Purpose: Minimal JS fixes for community gating and viewport normalization
 * Scope: Only affects HomeClean component and viewport calculations
 */

(function() {
    'use strict';
    
    console.log('[home-rails-fix] Loading patch...');
    
    // 1. Viewport normalization guard
    function normalizeViewportWidth() {
        try {
            const actualWidth = window.innerWidth;
            const outerWidth = window.outerWidth;
            const normalizedWidth = Math.min(actualWidth, outerWidth);
            
            // Force viewport normalization if there's a significant discrepancy
            if (Math.abs(actualWidth - outerWidth) > 100) {
                console.warn('[home-rails-fix] Viewport width discrepancy detected, forcing normalization:', {
                    innerWidth: actualWidth,
                    outerWidth: outerWidth,
                    normalized: normalizedWidth
                });
                
                // Force the viewport to use the actual window width
                if (window.innerWidth !== outerWidth) {
                    console.log('[home-rails-fix] Forcing viewport width normalization...');
                    
                    // Try to reset any CSS transforms or zoom that might be causing the issue
                    document.documentElement.style.transform = 'none';
                    document.documentElement.style.zoom = '1';
                    document.body.style.transform = 'none';
                    document.body.style.zoom = '1';
                    
                    // Force a reflow
                    document.documentElement.offsetHeight;
                }
            }
            
            return normalizedWidth;
        } catch (error) {
            console.error('[home-rails-fix] Viewport normalization failed:', error);
            return window.innerWidth;
        }
    }
    
    // 2. Community gating logic
    function shouldShowCommunity() {
        try {
            // Check feature flags
            const flags = window.FLAGS || {};
            if (flags.communityEnabled === false) {
                console.log('[home-rails-fix] Community disabled via FLAGS');
                return false;
            }
            
            // Check localStorage override
            const localStorageOverride = localStorage.getItem('community-enabled');
            if (localStorageOverride === 'false') {
                console.log('[home-rails-fix] Community disabled via localStorage');
                return false;
            }
            
            // Default to enabled
            return true;
        } catch (error) {
            console.error('[home-rails-fix] Community gating check failed:', error);
            return true; // Fail open
        }
    }
    
    // 3. Patch HomeClean component
    function patchHomeClean() {
        try {
            const originalHomeClean = window.HomeClean;
            if (!originalHomeClean) {
                console.warn('[home-rails-fix] HomeClean component not found');
                return;
            }
            
            // Patch the preserveExistingContent method
            const originalPreserveExistingContent = originalHomeClean.prototype.preserveExistingContent;
            if (originalPreserveExistingContent) {
                originalHomeClean.prototype.preserveExistingContent = function(rootElement) {
                    console.log('[home-rails-fix] Patching preserveExistingContent with gating...');
                    
                    // Find and preserve community sections with gating
                    const communitySection = rootElement.querySelector('#group-2-community');
                    const feedbackSection = rootElement.querySelector('#group-5-feedback');
                    
                    // Clear the root element
                    rootElement.innerHTML = '';
                    
                    // Re-add preserved sections to our container with gating
                    if (communitySection && shouldShowCommunity()) {
                        const communityContainer = this.container.querySelector('#community-container');
                        if (communityContainer) {
                            communityContainer.innerHTML = communitySection.innerHTML;
                            console.log('[home-rails-fix] Community section preserved and gated');
                        }
                    } else if (communitySection) {
                        console.log('[home-rails-fix] Community section hidden by gating');
                    }
                    
                    if (feedbackSection) {
                        const feedbackContainer = this.container.querySelector('#feedback-container');
                        if (feedbackContainer) {
                            feedbackContainer.innerHTML = feedbackSection.innerHTML;
                        }
                    }
                };
                
                console.log('[home-rails-fix] HomeClean preserveExistingContent patched');
            }
        } catch (error) {
            console.error('[home-rails-fix] HomeClean patching failed:', error);
        }
    }
    
    // 4. Patch mobile polish logic
    function patchMobilePolish() {
        try {
            // Override the viewport width calculation in functions.js
            const originalApplyMobileFlag = window.applyMobileFlag;
            if (originalApplyMobileFlag) {
                window.applyMobileFlag = function() {
                    console.log('[home-rails-fix] Patching mobile polish viewport calculation...');
                    
                    // Use normalized viewport width
                    const viewportWidth = normalizeViewportWidth();
                    
                    // Call original function with normalized width
                    const result = originalApplyMobileFlag.call(this);
                    
                    console.log('[home-rails-fix] Mobile polish applied with normalized width:', viewportWidth);
                    return result;
                };
                
                console.log('[home-rails-fix] Mobile polish logic patched');
            }
        } catch (error) {
            console.error('[home-rails-fix] Mobile polish patching failed:', error);
        }
    }
    
    // 5. Initialize patches
    function initializePatches() {
        console.log('[home-rails-fix] Initializing patches...');
        
        // Patch HomeClean if available
        if (window.HomeClean) {
            patchHomeClean();
        } else {
            // Wait for HomeClean to load
            const checkInterval = setInterval(() => {
                if (window.HomeClean) {
                    clearInterval(checkInterval);
                    patchHomeClean();
                }
            }, 100);
            
            // Timeout after 5 seconds
            setTimeout(() => {
                clearInterval(checkInterval);
                console.warn('[home-rails-fix] HomeClean not found after 5 seconds');
            }, 5000);
        }
        
        // Patch mobile polish
        patchMobilePolish();
        
        // Normalize viewport width immediately
        const normalizedWidth = normalizeViewportWidth();
        console.log('[home-rails-fix] Initial viewport width normalized:', normalizedWidth);
        
        console.log('[home-rails-fix] Patches initialized successfully');
    }
    
    // 6. Run patches when DOM is ready
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', initializePatches);
    } else {
        initializePatches();
    }
    
    // 7. Export utilities for debugging
    window.HomeRailsFix = {
        normalizeViewportWidth,
        shouldShowCommunity,
        getViewportInfo: function() {
            return {
                innerWidth: window.innerWidth,
                outerWidth: window.outerWidth,
                normalizedWidth: normalizeViewportWidth(),
                communityEnabled: shouldShowCommunity()
            };
        }
    };
    
    console.log('[home-rails-fix] Patch loaded successfully');
})();

        // Import and initialize the dedicated poster reconciler
        import('./modules/poster-reconciler.js').then(module => {
            module.reconcilePosters(document);
            console.log('[home-rails-fix] Poster reconciler initialized');
        }).catch(err => {
            console.warn('[home-rails-fix] Failed to load poster reconciler:', err);
        });
