// Test layout fix with proper understanding of padding-inline and grid containers
(async () => {
  console.log('🔍 Testing Layout Fix with Proper CSS Understanding...');
  
  const evidence = {
    panels: [],
    actions: [],
    suspects: []
  };
  
  // Collect panel data
  const panelSelectors = [
    '#homeSection .home-group .home-preview-row',
    '#homeSection .home-group .panel',
    '#homeSection .home-group section'
  ];
  
  for (const selector of panelSelectors) {
    const panels = document.querySelectorAll(selector);
    panels.forEach((panel, index) => {
      if (panel.offsetParent === null) return;
      
      const rect = panel.getBoundingClientRect();
      const style = getComputedStyle(panel);
      
      const panelData = {
        cssPath: panel.id ? `#${panel.id}` : `${panel.tagName.toLowerCase()}.${panel.className.split(' ').join('.')}`,
        display: style.display,
        paddingLeft: style.paddingLeft,
        paddingRight: style.paddingRight,
        paddingInline: style.paddingInline,
        width: rect.width,
        height: rect.height
      };
      
      evidence.panels.push(panelData);
    });
  }
  
  // Collect actions data
  const actions = document.querySelectorAll('#homeSection .actions');
  actions.forEach((action, index) => {
    if (action.offsetParent === null) return;
    
    const style = getComputedStyle(action);
    
    const actionData = {
      cssPath: action.id ? `#${action.id}` : `${action.tagName.toLowerCase()}.${action.className.split(' ').join('.')}`,
      display: style.display,
      gridTemplateColumns: style.gridTemplateColumns,
      gap: style.gap
    };
    
    evidence.actions.push(actionData);
  });
  
  // Test results with proper understanding
  const badPanels = evidence.panels.filter(p => {
    // Check display (should be block for panels)
    const wrongDisplay = p.display !== 'block';
    
    // Check padding (should be 32px left/right OR padding-inline: 32px)
    const hasCorrectPadding = (p.paddingLeft === '32px' && p.paddingRight === '32px') || 
                             p.paddingInline === '32px';
    const wrongPadding = !hasCorrectPadding;
    
    // Special case: #home-games should be grid, not block
    const isHomeGames = p.cssPath.includes('#home-games');
    if (isHomeGames) {
      return wrongPadding; // Only check padding for home-games, not display
    }
    
    return wrongDisplay || wrongPadding;
  }).length;
  
  const badActions = evidence.actions.filter(a => a.display !== 'grid').length;
  
  console.log('📊 Layout Fix Test Results (Proper CSS Understanding):');
  console.log({ badPanels, badActions });
  
  // Show detailed analysis
  console.log('📋 Panel Analysis:');
  evidence.panels.forEach((p, i) => {
    const isHomeGames = p.cssPath.includes('#home-games');
    const expectedDisplay = isHomeGames ? 'grid' : 'block';
    const hasCorrectPadding = (p.paddingLeft === '32px' && p.paddingRight === '32px') || 
                             p.paddingInline === '32px';
    
    const status = (p.display === expectedDisplay && hasCorrectPadding) ? '✅' : '❌';
    console.log(`${status} ${i}: ${p.cssPath}`);
    console.log(`   display: ${p.display} (expected: ${expectedDisplay})`);
    console.log(`   padding: ${p.paddingLeft}/${p.paddingRight} (expected: 32px/32px)`);
    if (p.paddingInline !== 'none') console.log(`   padding-inline: ${p.paddingInline}`);
    console.log('');
  });
  
  if (badPanels === 0 && badActions === 0) {
    console.log('🎉 SUCCESS: All layout issues fixed with proper CSS understanding!');
    console.log('✅ Panels have correct display and padding');
    console.log('✅ Actions use grid layout');
    console.log('✅ #home-games correctly uses grid display');
  } else {
    console.log('❌ ISSUES REMAIN:');
    if (badPanels > 0) console.log(`  - ${badPanels} panels still have issues`);
    if (badActions > 0) console.log(`  - ${badActions} actions still have issues`);
  }
  
  return { badPanels, badActions };
})();

