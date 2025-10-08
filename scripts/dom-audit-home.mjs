/**
 * Home Layout Evidence Collector
 * DOM probe to identify layout violations and CSS rule origins
 */

// CSS path helper
function getCSSPath(element) {
  const path = [];
  let current = element;
  
  while (current && current !== document.documentElement) {
    let selector = current.tagName.toLowerCase();
    
    if (current.id) {
      selector += `#${current.id}`;
    } else if (current.className) {
      const classes = current.className.split(' ').filter(c => c.trim());
      if (classes.length > 0) {
        selector += '.' + classes.join('.');
      }
    }
    
    // Add nth-child if needed for uniqueness
    const siblings = Array.from(current.parentNode?.children || [])
      .filter(sibling => sibling.tagName === current.tagName);
    if (siblings.length > 1) {
      const index = siblings.indexOf(current) + 1;
      selector += `:nth-child(${index})`;
    }
    
    path.unshift(selector);
    current = current.parentElement;
  }
  
  return path.join(' > ');
}

// Get winning CSS rule for a property
function getWinningRule(element, property) {
  const rules = [];
  
  try {
    for (const sheet of document.styleSheets) {
      try {
        for (const rule of sheet.cssRules) {
          if (rule.type === CSSRule.STYLE_RULE) {
            if (rule.selectorText && element.matches(rule.selectorText)) {
              const value = rule.style.getPropertyValue(property);
              const priority = rule.style.getPropertyPriority(property);
              if (value) {
                rules.push({
                  selector: rule.selectorText,
                  value: value,
                  important: priority === 'important',
                  href: sheet.href || 'inline',
                  index: Array.from(sheet.cssRules).indexOf(rule)
                });
              }
            }
          }
        }
      } catch (e) {
        // Cross-origin stylesheet access denied
        console.warn('Cannot access stylesheet:', sheet.href, e.message);
      }
    }
  } catch (e) {
    console.warn('Error accessing stylesheets:', e.message);
  }
  
  // Sort by specificity and importance
  rules.sort((a, b) => {
    if (a.important !== b.important) {
      return b.important - a.important;
    }
    // Simple specificity calculation (not perfect but good enough)
    const aSpecificity = (a.selector.match(/#/g) || []).length * 1000 + 
                        (a.selector.match(/\./g) || []).length * 100 + 
                        (a.selector.match(/[^#.>+\s]/g) || []).length;
    const bSpecificity = (b.selector.match(/#/g) || []).length * 1000 + 
                        (b.selector.match(/\./g) || []).length * 100 + 
                        (b.selector.match(/[^#.>+\s]/g) || []).length;
    return bSpecificity - aSpecificity;
  });
  
  return rules[0] || null;
}

// Check for ancestor constraints
function getAncestorConstraints(element) {
  const constraints = [];
  let current = element.parentElement;
  
  while (current && current !== document.documentElement) {
    const style = getComputedStyle(current);
    const rect = current.getBoundingClientRect();
    
    const constraint = {
      element: getCSSPath(current),
      overflow: style.overflow,
      transform: style.transform !== 'none' ? style.transform : null,
      contain: style.contain !== 'none' ? style.contain : null,
      filter: style.filter !== 'none' ? style.filter : null,
      backdropFilter: style.backdropFilter !== 'none' ? style.backdropFilter : null,
      position: style.position,
      top: style.top,
      width: rect.width,
      height: rect.height
    };
    
    // Only include if it has a constraint
    if (constraint.overflow !== 'visible' || 
        constraint.transform || 
        constraint.contain || 
        constraint.filter || 
        constraint.backdropFilter ||
        (constraint.position === 'sticky' && constraint.top !== 'auto')) {
      constraints.push(constraint);
    }
    
    current = current.parentElement;
  }
  
  return constraints;
}

// Main evidence collection function
async function collectHomeLayoutEvidence() {
  console.log('[EVIDENCE] Starting home layout evidence collection...');
  
  const evidence = {
    panels: [],
    actions: [],
    rails: [],
    variables: {},
    suspects: [],
    stylesheets: [],
    skipped: [],
    findings: []
  };
  
  // Collect stylesheet load order
  console.log('[EVIDENCE] Collecting stylesheet load order...');
  const stylesheets = Array.from(document.querySelectorAll('link[rel="stylesheet"], style'));
  evidence.stylesheets = stylesheets.map((sheet, index) => ({
    index,
    type: sheet.tagName.toLowerCase(),
    href: sheet.href || 'inline',
    media: sheet.media || 'all',
    dataAttrs: Array.from(sheet.attributes)
      .filter(attr => attr.name.startsWith('data-'))
      .reduce((acc, attr) => ({ ...acc, [attr.name]: attr.value }), {})
  }));
  
  // Collect CSS variables
  console.log('[EVIDENCE] Collecting CSS variables...');
  const rootStyle = getComputedStyle(document.documentElement);
  const cssVars = [
    '--home-gutter',
    '--rail-col-w', 
    '--card-w',
    '--home-card-height-desktop',
    '--card-height-mobile',
    '--home-panel-padding'
  ];
  
  cssVars.forEach(varName => {
    evidence.variables[varName] = rootStyle.getPropertyValue(varName).trim();
  });
  
  // Collect panel wrappers
  console.log('[EVIDENCE] Collecting panel wrappers...');
  const panelSelectors = [
    '#homeSection .home-group .home-preview-row',
    '#homeSection .home-group .panel',
    '#homeSection .home-group > div'
  ];
  
  for (const selector of panelSelectors) {
    const panels = document.querySelectorAll(selector);
    panels.forEach((panel, index) => {
      if (panel.offsetParent === null) {
        evidence.skipped.push({
          element: getCSSPath(panel),
          reason: 'display:none or not visible',
          selector
        });
        return;
      }
      
      const rect = panel.getBoundingClientRect();
      const style = getComputedStyle(panel);
      
      const panelData = {
        cssPath: getCSSPath(panel),
        groupId: panel.closest('.home-group')?.id || 'unknown',
        index,
        display: style.display,
        paddingLeft: style.paddingLeft,
        paddingRight: style.paddingRight,
        boxSizing: style.boxSizing,
        width: rect.width,
        height: rect.height,
        clientWidth: panel.clientWidth,
        clientHeight: panel.clientHeight,
        scrollWidth: panel.scrollWidth,
        scrollHeight: panel.scrollHeight,
        inlineStyles: panel.style.cssText,
        visibility: {
          display: style.display,
          visibility: style.visibility,
          opacity: style.opacity,
          contentVisibility: style.contentVisibility
        },
        ancestorConstraints: getAncestorConstraints(panel),
        winningDisplayRule: getWinningRule(panel, 'display'),
        winningPaddingLeftRule: getWinningRule(panel, 'padding-left'),
        winningPaddingRightRule: getWinningRule(panel, 'padding-right')
      };
      
      // Check for violations
      const violations = [];
      if (panelData.display !== 'block') {
        violations.push(`display: ${panelData.display} (expected: block)`);
      }
      if (panelData.paddingLeft !== '32px' && panelData.paddingLeft !== '2rem') {
        violations.push(`padding-left: ${panelData.paddingLeft} (expected: 32px)`);
      }
      if (panelData.paddingRight !== '32px' && panelData.paddingRight !== '2rem') {
        violations.push(`padding-right: ${panelData.paddingRight} (expected: 32px)`);
      }
      
      if (violations.length > 0) {
        panelData.violations = violations;
        evidence.suspects.push({
          type: 'panel',
          element: panelData.cssPath,
          violations
        });
      }
      
      evidence.panels.push(panelData);
    });
  }
  
  // Collect .actions nodes
  console.log('[EVIDENCE] Collecting .actions nodes...');
  const actions = document.querySelectorAll('#homeSection .actions');
  actions.forEach((action, index) => {
    if (action.offsetParent === null) {
      evidence.skipped.push({
        element: getCSSPath(action),
        reason: 'display:none or not visible',
        selector: '.actions'
      });
      return;
    }
    
    const rect = action.getBoundingClientRect();
    const style = getComputedStyle(action);
    const buttons = action.querySelectorAll('button, [role="button"]');
    
    const actionData = {
      cssPath: getCSSPath(action),
      index,
      display: style.display,
      gridTemplateColumns: style.gridTemplateColumns,
      gridAutoFlow: style.gridAutoFlow,
      gap: style.gap,
      width: rect.width,
      height: rect.height,
      buttonCount: buttons.length,
      buttonWidths: Array.from(buttons).map(btn => btn.getBoundingClientRect().width),
      inlineStyles: action.style.cssText,
      winningDisplayRule: getWinningRule(action, 'display'),
      winningGridRule: getWinningRule(action, 'grid-template-columns'),
      ancestorConstraints: getAncestorConstraints(action)
    };
    
    // Check for violations
    const violations = [];
    if (actionData.display !== 'grid') {
      violations.push(`display: ${actionData.display} (expected: grid)`);
    }
    
    if (violations.length > 0) {
      actionData.violations = violations;
      evidence.suspects.push({
        type: 'actions',
        element: actionData.cssPath,
        violations
      });
    }
    
    evidence.actions.push(actionData);
  });
  
  // Collect rail sizing
  console.log('[EVIDENCE] Collecting rail sizing...');
  const railSelectors = [
    '.preview-row-scroll.row-inner',
    '.cw-row #currentlyWatchingScroll',
    '.up-next-scroll',
    '.home-preview-row .preview-row-scroll'
  ];
  
  for (const selector of railSelectors) {
    const rails = document.querySelectorAll(selector);
    rails.forEach((rail, index) => {
      if (rail.offsetParent === null) {
        evidence.skipped.push({
          element: getCSSPath(rail),
          reason: 'display:none or not visible',
          selector
        });
        return;
      }
      
      const rect = rail.getBoundingClientRect();
      const style = getComputedStyle(rail);
      const cards = rail.querySelectorAll('.card, [class*="card"]');
      
      const railData = {
        cssPath: getCSSPath(rail),
        selector,
        index,
        display: style.display,
        gridAutoFlow: style.gridAutoFlow,
        gridAutoColumns: style.gridAutoColumns,
        gap: style.gap,
        width: rect.width,
        height: rect.height,
        clientWidth: rail.clientWidth,
        scrollWidth: rail.scrollWidth,
        cardCount: cards.length,
        cardWidths: Array.from(cards).map(card => card.getBoundingClientRect().width),
        inlineStyles: rail.style.cssText,
        winningDisplayRule: getWinningRule(rail, 'display'),
        winningGridRule: getWinningRule(rail, 'grid-auto-columns'),
        ancestorConstraints: getAncestorConstraints(rail)
      };
      
      evidence.rails.push(railData);
    });
  }
  
  // Generate findings summary
  console.log('[EVIDENCE] Generating findings summary...');
  evidence.findings = {
    totalPanels: evidence.panels.length,
    panelViolations: evidence.panels.filter(p => p.violations).length,
    totalActions: evidence.actions.length,
    actionViolations: evidence.actions.filter(a => a.violations).length,
    totalRails: evidence.rails.length,
    skippedElements: evidence.skipped.length,
    suspectCount: evidence.suspects.length
  };
  
  console.log('[EVIDENCE] Evidence collection complete:', evidence.findings);
  
  return evidence;
}

// Self-invoking loader
if (typeof window !== 'undefined') {
  window.__HOME_EVIDENCE__ = await collectHomeLayoutEvidence();
  
  // Console output for verification
  console.table({
    panels: window.__HOME_EVIDENCE__.panels.length,
    actions: window.__HOME_EVIDENCE__.actions.length,
    rails: window.__HOME_EVIDENCE__.rails.length,
    suspects: window.__HOME_EVIDENCE__.suspects?.length || 0,
    skipped: window.__HOME_EVIDENCE__.skipped?.length || 0
  });
  
  console.log('[EVIDENCE] Evidence available at window.__HOME_EVIDENCE__');
  console.log('[EVIDENCE] Suspects:', window.__HOME_EVIDENCE__.suspects);
}

export { collectHomeLayoutEvidence, getCSSPath, getWinningRule, getAncestorConstraints };

