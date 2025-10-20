/**
 * Debug HomeClean Implementation
 * Check which version is loaded and why buttons aren't showing
 */

console.log('🔍 [DEBUG] Checking HomeClean implementation...');

// Check if HomeClean class exists
if (window.HomeClean) {
    console.log('✅ [DEBUG] HomeClean class found');
    
    // Check if it has the new methods
    const instance = new window.HomeClean();
    console.log('🔍 [DEBUG] HomeClean methods:', {
        hasCreateCWCardContent: typeof instance.createCWCardContent === 'function',
        hasGetRealCurrentlyWatching: typeof instance.getRealCurrentlyWatching === 'function',
        hasTransformItemToCardData: typeof instance.transformItemToCardData === 'function'
    });
    
    // Check if it's the old or new implementation
    if (instance.createCWCardContent) {
        console.log('✅ [DEBUG] Using NEW HomeClean implementation');
        
        // Test the createCWCardContent method
        const testItem = {
            id: 'test-123',
            title: 'Test Show',
            meta: 'S1 E1',
            posterUrl: '/assets/img/poster-placeholder.png'
        };
        
        const cardContent = instance.createCWCardContent(testItem);
        console.log('🔍 [DEBUG] Card content preview:', cardContent.substring(0, 200) + '...');
        
        // Check if buttons are in the content
        if (cardContent.includes('Want to Watch') && cardContent.includes('Watched') && 
            cardContent.includes('Not Interested') && cardContent.includes('Delete')) {
            console.log('✅ [DEBUG] All 4 buttons found in card content');
        } else {
            console.error('❌ [DEBUG] Missing buttons in card content');
        }
        
    } else {
        console.error('❌ [DEBUG] Using OLD HomeClean implementation');
    }
    
} else {
    console.error('❌ [DEBUG] HomeClean class not found');
}

// Check if component is mounted
if (window.homeCleanState) {
    console.log('🔍 [DEBUG] HomeClean state:', window.homeCleanState);
} else {
    console.warn('⚠️ [DEBUG] No homeCleanState found');
}

// Check if clean-root exists
const cleanRoot = document.querySelector('#clean-root');
if (cleanRoot) {
    console.log('✅ [DEBUG] #clean-root found');
    
    // Check if cards exist
    const cards = cleanRoot.querySelectorAll('.card');
    console.log(`🔍 [DEBUG] Found ${cards.length} cards`);
    
    if (cards.length > 0) {
        const firstCard = cards[0];
        console.log('🔍 [DEBUG] First card classes:', firstCard.className);
        
        // Check if buttons exist
        const buttons = firstCard.querySelectorAll('button');
        console.log(`🔍 [DEBUG] Found ${buttons.length} buttons in first card`);
        
        if (buttons.length > 0) {
            buttons.forEach((btn, i) => {
                console.log(`🔍 [DEBUG] Button ${i}:`, btn.textContent, btn.className);
            });
        } else {
            console.error('❌ [DEBUG] No buttons found in first card');
            
            // Check card HTML
            console.log('🔍 [DEBUG] First card HTML:', firstCard.innerHTML);
        }
        
        // Check for holiday chip
        const holidayChip = firstCard.querySelector('.holiday-chip');
        if (holidayChip) {
            console.log('✅ [DEBUG] Holiday chip found');
        } else {
            console.warn('⚠️ [DEBUG] No holiday chip found');
        }
    }
} else {
    console.error('❌ [DEBUG] #clean-root not found');
}

// Check CSS
const homeCleanCSS = document.querySelector('link[href*="home-clean.css"]');
if (homeCleanCSS) {
    console.log('✅ [DEBUG] home-clean.css loaded');
} else {
    console.error('❌ [DEBUG] home-clean.css not loaded');
}

console.log('🎉 [DEBUG] Debug check completed');
