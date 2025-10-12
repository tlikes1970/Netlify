/**
 * Force HomeClean Refresh with Updated Code
 * This will destroy and remount the component to ensure latest code is used
 */

console.log('🔄 [FORCE REFRESH] Starting HomeClean force refresh...');

async function forceRefreshHomeClean() {
    try {
        // Step 1: Destroy existing component
        if (window.destroyHomeClean) {
            console.log('🗑️ [FORCE REFRESH] Destroying existing component...');
            window.destroyHomeClean();
        }
        
        // Step 2: Clear any cached scripts
        const existingScripts = document.querySelectorAll('script[src*="HomeClean.js"]');
        existingScripts.forEach(script => {
            console.log('🗑️ [FORCE REFRESH] Removing cached script:', script.src);
            script.remove();
        });
        
        // Step 3: Reload the HomeClean script
        console.log('📥 [FORCE REFRESH] Reloading HomeClean script...');
        await new Promise((resolve, reject) => {
            const script = document.createElement('script');
            script.src = '/components/home-clean/HomeClean.js?v=' + Date.now(); // Cache bust
            script.onload = () => {
                console.log('✅ [FORCE REFRESH] HomeClean script reloaded');
                resolve();
            };
            script.onerror = () => {
                console.error('❌ [FORCE REFRESH] Failed to reload HomeClean script');
                reject();
            };
            document.head.appendChild(script);
        });
        
        // Step 4: Wait a moment for the script to initialize
        await new Promise(resolve => setTimeout(resolve, 100));
        
        // Step 5: Verify the new implementation
        if (window.HomeClean) {
            const instance = new window.HomeClean();
            if (instance.createCWCardContent) {
                console.log('✅ [FORCE REFRESH] New implementation loaded successfully');
                
                // Step 6: Mount the component
                const homeSection = document.getElementById('homeSection');
                if (homeSection && window.mountHomeClean) {
                    console.log('🚀 [FORCE REFRESH] Mounting component...');
                    const success = await window.mountHomeClean(homeSection);
                    
                    if (success) {
                        console.log('✅ [FORCE REFRESH] Component mounted successfully');
                        
                        // Step 7: Check if buttons are now visible
                        setTimeout(() => {
                            const cleanRoot = document.querySelector('#clean-root');
                            if (cleanRoot) {
                                const cards = cleanRoot.querySelectorAll('.card');
                                if (cards.length > 0) {
                                    const firstCard = cards[0];
                                    const buttons = firstCard.querySelectorAll('button');
                                    const holidayChip = firstCard.querySelector('.holiday-chip');
                                    
                                    console.log('🔍 [FORCE REFRESH] Final check:', {
                                        cards: cards.length,
                                        buttons: buttons.length,
                                        holidayChip: !!holidayChip,
                                        firstCardHTML: firstCard.innerHTML.substring(0, 200) + '...'
                                    });
                                    
                                    if (buttons.length >= 4) {
                                        console.log('🎉 [FORCE REFRESH] SUCCESS! Buttons are now visible');
                                    } else {
                                        console.error('❌ [FORCE REFRESH] Buttons still not visible');
                                    }
                                }
                            }
                        }, 1000);
                        
                    } else {
                        console.error('❌ [FORCE REFRESH] Failed to mount component');
                    }
                } else {
                    console.error('❌ [FORCE REFRESH] mountHomeClean not available');
                }
            } else {
                console.error('❌ [FORCE REFRESH] Old implementation still loaded');
            }
        } else {
            console.error('❌ [FORCE REFRESH] HomeClean class not found after reload');
        }
        
    } catch (error) {
        console.error('❌ [FORCE REFRESH] Force refresh failed:', error);
    }
}

// Run the force refresh
forceRefreshHomeClean().then(() => {
    console.log('🏁 [FORCE REFRESH] Force refresh completed');
});

// Export for manual testing
window.forceRefreshHomeClean = forceRefreshHomeClean;
