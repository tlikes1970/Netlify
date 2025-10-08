// www/dev/probes/home-audit.js
// DevTools verification probe for Home page container sizing
// Run this in browser console to verify the surgical changes

(() => {
  'use strict';
  
  console.log('🔍 Home Page Container Sizing Audit');
  console.log('=====================================');
  
  const Q = s => [...document.querySelectorAll(s)];
  const read = el => {
    if (!el) return null;
    const r = el.getBoundingClientRect();
    const cs = getComputedStyle(el);
    return {
      w: Math.round(r.width), 
      h: Math.round(r.height),
      disp: cs.display, 
      gap: cs.gap || cs.gridGap || '',
      minw: cs.minWidth, 
      maxw: cs.maxWidth,
      gtc: cs.gridTemplateColumns || '',
      gac: cs.gridAutoColumns || ''
    };
  };
  
  // Check Home page rails
  console.log('📏 Home Rail Sizing:');
  const rails = [
    '#currentlyWatchingScroll',
    '.up-next-scroll', 
    '.curated-row',
    '.preview-row-scroll',
    '.row-inner'
  ];
  
  rails.forEach(sel => {
    const el = document.querySelector(sel);
    if (!el) {
      console.log(`❌ MISSING: ${sel}`);
      return;
    }
    const info = read(el);
    console.log(`✅ ${sel}:`, info);
  });
  
  // Check Home page cards
  console.log('\n🎴 Home Card Samples:');
  const homeCards = Q('#homeSection .card.v2').slice(0, 5);
  if (homeCards.length === 0) {
    console.log('⚠️ No Home cards found - may need to navigate to Home tab');
  } else {
    homeCards.forEach((el, i) => {
      const info = read(el);
      console.log(`Card ${i + 1}:`, info);
    });
  }
  
  // Check actions layout
  console.log('\n🎯 Actions Layout (2x2 Grid Check):');
  const actionElements = Q('#homeSection .card.v2 .actions').slice(0, 5);
  if (actionElements.length === 0) {
    console.log('⚠️ No action elements found');
  } else {
    actionElements.forEach((el, i) => {
      const cs = getComputedStyle(el);
      console.log(`Actions ${i + 1}:`, {
        display: cs.display,
        gtc: cs.gridTemplateColumns,
        gap: cs.gap,
        is2x2: cs.gridTemplateColumns === '1fr 1fr'
      });
    });
  }
  
  // Check CSS variable values
  console.log('\n🎨 CSS Variable Values:');
  const root = document.documentElement;
  const cssVars = [
    '--home-card-w-sm',
    '--home-card-w-md', 
    '--home-card-w-lg',
    '--home-card-w-xl',
    '--home-row-gap-sm',
    '--home-row-gap-md',
    '--home-row-gap-lg'
  ];
  
  cssVars.forEach(varName => {
    const value = getComputedStyle(root).getPropertyValue(varName).trim();
    console.log(`${varName}: ${value || 'not set'}`);
  });
  
  // Check for inline width styles (should be none)
  console.log('\n🚫 Inline Width Check:');
  const cardsWithInlineWidth = Q('#homeSection .card.v2').filter(card => {
    const style = card.style;
    return style.width || style.minWidth || style.maxWidth;
  });
  
  if (cardsWithInlineWidth.length === 0) {
    console.log('✅ No inline width styles found on Home cards');
  } else {
    console.log(`❌ Found ${cardsWithInlineWidth.length} cards with inline width styles:`);
    cardsWithInlineWidth.forEach((card, i) => {
      console.log(`Card ${i + 1}:`, {
        width: card.style.width,
        minWidth: card.style.minWidth,
        maxWidth: card.style.maxWidth
      });
    });
  }
  
  // Summary
  console.log('\n📊 Summary:');
  console.log(`- Home rails found: ${rails.filter(sel => document.querySelector(sel)).length}/${rails.length}`);
  console.log(`- Home cards found: ${homeCards.length}`);
  console.log(`- Action elements found: ${actionElements.length}`);
  console.log(`- Cards with inline width: ${cardsWithInlineWidth.length}`);
  
  console.log('\n✅ Audit complete! Check the results above.');
})();




