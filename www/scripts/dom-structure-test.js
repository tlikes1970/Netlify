(function() {
    'use strict';
    console.log('🔍 [DOM TEST] Starting DOM structure test...');

    function analyzeDOMStructure() {
        const cleanRoot = document.getElementById('clean-root');
        if (!cleanRoot) {
            console.warn('🔍 [DOM TEST] #clean-root not found, skipping DOM analysis.');
            return;
        }
        console.log('🔍 [DOM TEST] ✅ Found clean-root');

        const cards = cleanRoot.querySelectorAll('.card');
        console.log(`🔍 [DOM TEST] Found cards: ${cards.length}`);

        cards.forEach((card, index) => {
            if (index < 2) { // Limit to first 2 cards
                console.log(`🔍 [DOM TEST] === CARD ${index + 1} ANALYSIS ===`);
                console.log(`🔍 [DOM TEST] Card class: ${card.className}`);
                console.log(`🔍 [DOM TEST] Card children count: ${card.children.length}`);
                
                // List all direct children
                Array.from(card.children).forEach((child, childIndex) => {
                    console.log(`🔍 [DOM TEST] Child ${childIndex + 1}: ${child.tagName} - ${child.className}`);
                    
                    // If it's the content div, show its children
                    if (child.classList.contains('card-content')) {
                        console.log(`🔍 [DOM TEST]   Content children count: ${child.children.length}`);
                        Array.from(child.children).forEach((contentChild, contentIndex) => {
                            console.log(`🔍 [DOM TEST]   Content child ${contentIndex + 1}: ${contentChild.tagName} - ${contentChild.className}`);
                        });
                    }
                    
                    // If it's the actions div, show its children
                    if (child.classList.contains('cw-actions')) {
                        console.log(`🔍 [DOM TEST]   Actions children count: ${child.children.length}`);
                        Array.from(child.children).forEach((actionChild, actionIndex) => {
                            console.log(`🔍 [DOM TEST]   Action child ${actionIndex + 1}: ${actionChild.tagName} - ${actionChild.className}`);
                        });
                    }
                });
                
                // Check for actions anywhere in the card
                const actionsInCard = card.querySelectorAll('.cw-actions, .fy-actions');
                console.log(`🔍 [DOM TEST] Actions containers found in card: ${actionsInCard.length}`);
                
                actionsInCard.forEach((actionsContainer, actionsIndex) => {
                    console.log(`🔍 [DOM TEST] Actions container ${actionsIndex + 1}: ${actionsContainer.className}`);
                    console.log(`🔍 [DOM TEST] Actions container parent: ${actionsContainer.parentElement?.tagName} - ${actionsContainer.parentElement?.className}`);
                    console.log(`🔍 [DOM TEST] Actions container children: ${actionsContainer.children.length}`);
                    
                    // Check computed styles
                    const computedStyle = window.getComputedStyle(actionsContainer);
                    console.log(`🔍 [DOM TEST] Actions container styles: {display: '${computedStyle.display}', visibility: '${computedStyle.visibility}', opacity: '${computedStyle.opacity}', position: '${computedStyle.position}', top: '${computedStyle.top}', left: '${computedStyle.left}'}`);
                });
                
                console.log(`🔍 [DOM TEST] === END CARD ${index + 1} ===`);
            }
        });

        console.log('🔍 [DOM TEST] ✅ DOM structure analysis complete!');
    }

    // Run the DOM analysis after a short delay to ensure rendering is complete
    setTimeout(analyzeDOMStructure, 2000);
})();
