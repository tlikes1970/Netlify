/**
 * Visual Card Test Script
 * Adds visible indicators to see if CSS fixes are working
 */

(function() {
    'use strict';
    
    console.log('🎨 [VISUAL TEST] Starting visual card test...');
    
    // Wait for home-clean to be ready
    setTimeout(() => {
        const cleanRoot = document.querySelector('#clean-root');
        if (!cleanRoot) {
            console.log('🎨 [VISUAL TEST] ❌ No clean-root found');
            return;
        }
        
        console.log('🎨 [VISUAL TEST] ✅ Found clean-root');
        
        // Find all cards
        const cards = cleanRoot.querySelectorAll('.card');
        console.log('🎨 [VISUAL TEST] Found cards:', cards.length);
        
        if (cards.length === 0) {
            console.log('🎨 [VISUAL TEST] ❌ No cards found');
            return;
        }
        
        // Add visual indicators to first few cards
        cards.forEach((card, index) => {
            if (index < 3) { // Only test first 3 cards
                console.log(`🎨 [VISUAL TEST] Testing card ${index + 1}:`);
                
                // Get computed styles
                const styles = window.getComputedStyle(card);
                const width = styles.width;
                const height = styles.height;
                const flexBasis = styles.flexBasis;
                
                console.log(`🎨 [VISUAL TEST] Card ${index + 1} styles:`, {
                    width,
                    height,
                    flexBasis,
                    className: card.className
                });
                
                // Add a visible border to see the card boundaries
                card.style.border = '3px solid red';
                card.style.boxShadow = '0 0 10px rgba(255,0,0,0.5)';
                
                // Add a label showing the dimensions
                const label = document.createElement('div');
                label.style.position = 'absolute';
                label.style.top = '5px';
                label.style.left = '5px';
                label.style.background = 'red';
                label.style.color = 'white';
                label.style.padding = '2px 4px';
                label.style.fontSize = '10px';
                label.style.borderRadius = '3px';
                label.style.zIndex = '9999';
                label.textContent = `${width} × ${height}`;
                card.style.position = 'relative';
                card.appendChild(label);
                
                console.log(`🎨 [VISUAL TEST] ✅ Added visual indicators to card ${index + 1}`);
            }
        });
        
        // Check rails
        const rails = cleanRoot.querySelectorAll('.rail');
        console.log('🎨 [VISUAL TEST] Found rails:', rails.length);
        
        rails.forEach((rail, index) => {
            const styles = window.getComputedStyle(rail);
            console.log(`🎨 [VISUAL TEST] Rail ${index + 1} styles:`, {
                overflowX: styles.overflowX,
                overflowY: styles.overflowY,
                display: styles.display,
                flexWrap: styles.flexWrap
            });
            
            // Add visual indicator to rails
            rail.style.border = '2px solid blue';
            rail.style.boxShadow = '0 0 5px rgba(0,0,255,0.3)';
        });
        
        console.log('🎨 [VISUAL TEST] ✅ Visual indicators added! Look for red-bordered cards and blue-bordered rails');
        
    }, 3000); // Wait 3 seconds for everything to load
    
})();




