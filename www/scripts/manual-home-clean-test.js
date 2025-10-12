/**
 * Manual Home Clean Test Script
 * Forces the home-clean component to mount for testing
 */

(function() {
    'use strict';
    
    console.log('🧪 [MANUAL TEST] Starting home-clean test...');
    
    // Wait for everything to load
    setTimeout(() => {
        console.log('🧪 [MANUAL TEST] Checking system state...');
        
        // Check if home-clean is available
        console.log('🧪 [MANUAL TEST] HomeClean class available:', !!window.HomeClean);
        console.log('🧪 [MANUAL TEST] mountHomeClean function available:', !!window.mountHomeClean);
        console.log('🧪 [MANUAL TEST] FLAGS state:', window.FLAGS);
        
        // Find home section
        const homeSection = document.getElementById('homeSection');
        console.log('🧪 [MANUAL TEST] Home section found:', !!homeSection);
        
        if (homeSection) {
            console.log('🧪 [MANUAL TEST] Home section content length:', homeSection.innerHTML.length);
            console.log('🧪 [MANUAL TEST] Home section has clean-root:', !!homeSection.querySelector('#clean-root'));
        }
        
        // Force mount if not already mounted
        if (window.mountHomeClean && homeSection && !homeSection.querySelector('#clean-root')) {
            console.log('🧪 [MANUAL TEST] Forcing mount...');
            
            // Set flags
            window.FLAGS = window.FLAGS || {};
            window.FLAGS.homeClean = true;
            window.FLAGS.legacyHome = false;
            
            // Mount the component
            window.mountHomeClean(homeSection)
                .then(success => {
                    console.log('🧪 [MANUAL TEST] Mount result:', success);
                    if (success) {
                        console.log('🧪 [MANUAL TEST] ✅ Home-clean mounted successfully!');
                        console.log('🧪 [MANUAL TEST] Home section new content length:', homeSection.innerHTML.length);
                        console.log('🧪 [MANUAL TEST] Clean-root found:', !!homeSection.querySelector('#clean-root'));
                    } else {
                        console.log('🧪 [MANUAL TEST] ❌ Failed to mount home-clean');
                    }
                })
                .catch(error => {
                    console.error('🧪 [MANUAL TEST] ❌ Mount error:', error);
                });
        } else if (homeSection && homeSection.querySelector('#clean-root')) {
            console.log('🧪 [MANUAL TEST] ✅ Home-clean already mounted!');
        } else {
            console.log('🧪 [MANUAL TEST] ❌ Cannot mount - missing dependencies');
        }
        
    }, 2000); // Wait 2 seconds for everything to load
    
})();
