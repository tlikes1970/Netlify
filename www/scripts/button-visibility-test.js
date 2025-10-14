/**
 * Button Visibility Test Script
 * Checks if action buttons are being created and why they might not be visible
 */

(function() {
    'use strict';
    
    console.log('🔘 [BUTTON TEST] Starting button visibility test...');
    
    // Wait for home-clean to be ready
    setTimeout(() => {
        const cleanRoot = document.querySelector('#clean-root');
        if (!cleanRoot) {
            console.log('🔘 [BUTTON TEST] ❌ No clean-root found');
            return;
        }
        
        console.log('🔘 [BUTTON TEST] ✅ Found clean-root');
        
        // Find all cards
        const cards = cleanRoot.querySelectorAll('.card');
        console.log('🔘 [BUTTON TEST] Found cards:', cards.length);
        
        if (cards.length === 0) {
            console.log('🔘 [BUTTON TEST] ❌ No cards found');
            return;
        }
        
        // Check each card for buttons
        cards.forEach((card, index) => {
            console.log(`🔘 [BUTTON TEST] Checking card ${index + 1}:`);
            console.log(`🔘 [BUTTON TEST] Card class: ${card.className}`);
            
            // Look for action containers
            const cwActions = card.querySelector('.cw-actions');
            const fyActions = card.querySelector('.fy-actions');
            const actionBtns = card.querySelectorAll('.action-btn');
            const ctaBtns = card.querySelectorAll('.cta-btn');
            
            console.log(`🔘 [BUTTON TEST] Card ${index + 1} elements:`, {
                cwActions: !!cwActions,
                fyActions: !!fyActions,
                actionBtns: actionBtns.length,
                ctaBtns: ctaBtns.length,
                totalButtons: actionBtns.length + ctaBtns.length
            });
            
            // Check computed styles for action containers
            if (cwActions) {
                const styles = window.getComputedStyle(cwActions);
                console.log(`🔘 [BUTTON TEST] CW Actions styles:`, {
                    display: styles.display,
                    visibility: styles.visibility,
                    opacity: styles.opacity,
                    height: styles.height,
                    width: styles.width
                });
                
                // Add visual indicator
                cwActions.style.border = '2px solid green';
                cwActions.style.backgroundColor = 'rgba(0,255,0,0.1)';
            }
            
            if (fyActions) {
                const styles = window.getComputedStyle(fyActions);
                console.log(`🔘 [BUTTON TEST] FY Actions styles:`, {
                    display: styles.display,
                    visibility: styles.visibility,
                    opacity: styles.opacity,
                    height: styles.height,
                    width: styles.width
                });
                
                // Add visual indicator
                fyActions.style.border = '2px solid green';
                fyActions.style.backgroundColor = 'rgba(0,255,0,0.1)';
            }
            
            // Check button styles
            actionBtns.forEach((btn, btnIndex) => {
                const styles = window.getComputedStyle(btn);
                console.log(`🔘 [BUTTON TEST] Action button ${btnIndex + 1} styles:`, {
                    display: styles.display,
                    visibility: styles.visibility,
                    opacity: styles.opacity,
                    height: styles.height,
                    width: styles.width,
                    backgroundColor: styles.backgroundColor,
                    color: styles.color
                });
                
                // Add visual indicator
                btn.style.border = '2px solid orange';
                btn.style.backgroundColor = 'rgba(255,165,0,0.3)';
            });
            
            ctaBtns.forEach((btn, btnIndex) => {
                const styles = window.getComputedStyle(btn);
                console.log(`🔘 [BUTTON TEST] CTA button ${btnIndex + 1} styles:`, {
                    display: styles.display,
                    visibility: styles.visibility,
                    opacity: styles.opacity,
                    height: styles.height,
                    width: styles.width,
                    backgroundColor: styles.backgroundColor,
                    color: styles.color
                });
                
                // Add visual indicator
                btn.style.border = '2px solid orange';
                btn.style.backgroundColor = 'rgba(255,165,0,0.3)';
            });
            
            // Check card content structure
            const cardContent = card.querySelector('.card-content');
            if (cardContent) {
                console.log(`🔘 [BUTTON TEST] Card ${index + 1} content children:`, cardContent.children.length);
                Array.from(cardContent.children).forEach((child, childIndex) => {
                    console.log(`🔘 [BUTTON TEST] Child ${childIndex + 1}: ${child.tagName} - ${child.className}`);
                });
            }
        });
        
        console.log('🔘 [BUTTON TEST] ✅ Button visibility test complete! Look for green-bordered action containers and orange-bordered buttons');
        
    }, 3000); // Wait 3 seconds for everything to load
    
})();

