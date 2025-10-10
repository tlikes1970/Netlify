/**
 * Home Clean Component - Main Entry Point
 * Phase 4: Modular Component Architecture
 */

// Global state - use window to avoid redeclaration issues
if (!window.homeCleanState) {
    window.homeCleanState = {
        instance: null,
        isMounted: false
    };
}

/**
 * Mount the HomeClean component
 */
async function mountHomeClean(rootElement) {
    try {
        console.log('[HomeClean] Starting mount process...');
        
        // Check if already mounted
        if (window.homeCleanState.isMounted) {
            console.log('[HomeClean] Component already mounted');
            return true;
        }
        
        // Check if root element exists
        if (!rootElement) {
            console.error('[HomeClean] No root element provided');
            return false;
        }
        
        // Load component files if not already loaded
        await loadComponentFiles();
        
        // Create HomeClean instance
        window.homeCleanState.instance = new window.HomeClean();
        
        // Initialize the component
        const success = await window.homeCleanState.instance.init(rootElement);
        
        if (success) {
            window.homeCleanState.isMounted = true;
            console.log('[HomeClean] Component mounted successfully');
            
            // Expose global functions
            window.refreshHomeClean = () => window.homeCleanState.instance.refresh();
            window.toggleMockMode = toggleMockMode;
            
            return true;
        } else {
            console.error('[HomeClean] Failed to initialize component');
            return false;
        }
        
    } catch (error) {
        console.error('[HomeClean] Mount failed:', error);
        return false;
    }
}

/**
 * Destroy the HomeClean component
 */
function destroyHomeClean() {
    try {
        console.log('[HomeClean] Starting destroy process...');
        
        if (window.homeCleanState.instance) {
            window.homeCleanState.instance.destroy();
            window.homeCleanState.instance = null;
        }
        
        window.homeCleanState.isMounted = false;
        
        // Remove global functions
        delete window.refreshHomeClean;
        delete window.toggleMockMode;
        
        console.log('[HomeClean] Component destroyed successfully');
        
    } catch (error) {
        console.error('[HomeClean] Destroy failed:', error);
    }
}

/**
 * Load all component files
 */
async function loadComponentFiles() {
    const files = [
        '/components/home-clean/HolidayModal.js',
        '/components/home-clean/CardCW.js',
        '/components/home-clean/CardNextUp.js',
        '/components/home-clean/CardForYou.js',
        '/components/home-clean/HomeClean.js',
        '/scripts/home-clean-data.js'
    ];
    
    const loadPromises = files.map(file => loadScript(file));
    
    try {
        await Promise.all(loadPromises);
        console.log('[HomeClean] All component files loaded');
    } catch (error) {
        console.error('[HomeClean] Failed to load component files:', error);
        throw error;
    }
}

/**
 * Load a script file
 */
function loadScript(src) {
    return new Promise((resolve, reject) => {
        // Check if already loaded
        if (document.querySelector(`script[src="${src}"]`)) {
            resolve();
            return;
        }
        
        const script = document.createElement('script');
        script.src = src;
        script.onload = () => resolve();
        script.onerror = () => reject(new Error(`Failed to load ${src}`));
        document.head.appendChild(script);
    });
}

/**
 * Toggle mock mode
 */
function toggleMockMode() {
    if (!window.FLAGS) {
        window.FLAGS = {};
    }
    
    window.FLAGS.mockMode = !window.FLAGS.mockMode;
    
    console.log(`[HomeClean] Mock mode ${window.FLAGS.mockMode ? 'enabled' : 'disabled'}`);
    
    // Refresh component if mounted
    if (window.homeCleanState.isMounted && window.homeCleanState.instance) {
        window.homeCleanState.instance.refresh();
    }
    
    return window.FLAGS.mockMode;
}

/**
 * Get component status
 */
function getHomeCleanStatus() {
    return {
        isMounted: window.homeCleanState.isMounted,
        hasInstance: !!window.homeCleanState.instance,
        mockMode: window.FLAGS?.mockMode || false,
        cacheStats: window.HomeCleanData ? window.HomeCleanData.getCacheStats() : null
    };
}

// Export functions to global scope
window.mountHomeClean = mountHomeClean;
window.destroyHomeClean = destroyHomeClean;
window.getHomeCleanStatus = getHomeCleanStatus;
window.toggleMockMode = toggleMockMode;

// Auto-mount if feature flag is enabled
document.addEventListener('DOMContentLoaded', () => {
    if (window.FLAGS?.homeClean) {
        const homeSection = document.getElementById('homeSection');
        if (homeSection) {
            mountHomeClean(homeSection);
        }
    }
});

console.log('[HomeClean] Entry point loaded');