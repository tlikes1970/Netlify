// qa/discover-layout-validation.js
// Comprehensive discover tab layout parity validation with home tab

(async () => {
  const out = { ok: true, notes: [], errors: [] };
  const $ = s => document.querySelector(s);
  const $$ = s => document.querySelectorAll(s);

  console.log('[DISCOVER LAYOUT VALIDATION] Starting comprehensive validation...');

  // 1) Tab Structure Check
  console.log('[DISCOVER] Checking tab structure...');
  
  const discoverTab = $('#discoverTab');
  const homeTab = $('#homeTab');
  
  if (discoverTab) {
    out.notes.push('✅ Discover tab found');
    
    // Check tab attributes
    const tabAttributes = {
      role: discoverTab.getAttribute('role'),
      ariaControls: discoverTab.getAttribute('aria-controls'),
      ariaSelected: discoverTab.getAttribute('aria-selected'),
      tabindex: discoverTab.getAttribute('tabindex')
    };
    
    out.notes.push(`📊 Discover tab attributes: ${JSON.stringify(tabAttributes)}`);
    
    if (tabAttributes.role === 'tab' && tabAttributes.ariaControls === 'discoverSection') {
      out.notes.push('✅ Discover tab has proper ARIA attributes');
    } else {
      out.errors.push('❌ Discover tab missing proper ARIA attributes');
    }
  } else {
    out.errors.push('❌ Discover tab not found');
  }

  // 2) Section Structure Check
  console.log('[DISCOVER] Checking section structure...');
  
  const discoverSection = $('#discoverSection');
  const homeSection = $('#homeSection');
  
  if (discoverSection) {
    out.notes.push('✅ Discover section found');
    
    // Check section attributes
    const sectionAttributes = {
      role: discoverSection.getAttribute('role'),
      ariaLabelledby: discoverSection.getAttribute('aria-labelledby'),
      className: discoverSection.className,
      style: discoverSection.style.display
    };
    
    out.notes.push(`📊 Discover section attributes: ${JSON.stringify(sectionAttributes)}`);
    
    if (sectionAttributes.role === 'tabpanel' && sectionAttributes.ariaLabelledby === 'discoverTab') {
      out.notes.push('✅ Discover section has proper ARIA attributes');
    } else {
      out.errors.push('❌ Discover section missing proper ARIA attributes');
    }
  } else {
    out.errors.push('❌ Discover section not found');
  }

  // 3) Layout Structure Comparison
  console.log('[DISCOVER] Comparing layout structure...');
  
  if (homeSection && discoverSection) {
    // Check if both sections are in the same container
    const homeParent = homeSection.parentElement;
    const discoverParent = discoverSection.parentElement;
    
    if (homeParent === discoverParent) {
      out.notes.push('✅ Both sections in same parent container');
    } else {
      out.errors.push('❌ Sections in different parent containers');
    }
    
    // Check CSS classes
    const homeClasses = homeSection.className.split(' ');
    const discoverClasses = discoverSection.className.split(' ');
    
    out.notes.push(`📊 Home section classes: ${homeClasses.join(', ')}`);
    out.notes.push(`📊 Discover section classes: ${discoverClasses.join(', ')}`);
    
    // Check for common classes
    const commonClasses = homeClasses.filter(cls => discoverClasses.includes(cls));
    out.notes.push(`📊 Common classes: ${commonClasses.join(', ')}`);
    
    if (commonClasses.includes('tab-section')) {
      out.notes.push('✅ Both sections have tab-section class');
    } else {
      out.errors.push('❌ Missing tab-section class on discover section');
    }
  }

  // 4) Content Structure Analysis
  console.log('[DISCOVER] Analyzing content structure...');
  
  if (discoverSection) {
    const discoverContent = discoverSection.innerHTML;
    const discoverChildren = discoverSection.children;
    
    out.notes.push(`📊 Discover section children: ${discoverChildren.length}`);
    
    // Check for basic structure elements
    const hasH3 = discoverSection.querySelector('h3');
    const hasP = discoverSection.querySelector('p');
    const hasListContainer = discoverSection.querySelector('.list-container');
    
    if (hasH3) {
      out.notes.push('✅ Discover section has h3 title');
    } else {
      out.errors.push('❌ Discover section missing h3 title');
    }
    
    if (hasP) {
      out.notes.push('✅ Discover section has description paragraph');
    } else {
      out.errors.push('❌ Discover section missing description paragraph');
    }
    
    if (hasListContainer) {
      out.notes.push('✅ Discover section has list container');
    } else {
      out.errors.push('❌ Discover section missing list container');
    }
  }

  // 5) Home Section Structure Analysis (for comparison)
  console.log('[DISCOVER] Analyzing home section structure for comparison...');
  
  if (homeSection) {
    const homeGroups = homeSection.querySelectorAll('.home-group');
    const homeRows = homeSection.querySelectorAll('.preview-row-container');
    
    out.notes.push(`📊 Home section groups: ${homeGroups.length}`);
    out.notes.push(`📊 Home section rows: ${homeRows.length}`);
    
    // Check home section complexity
    const homeChildren = homeSection.children;
    out.notes.push(`📊 Home section children: ${homeChildren.length}`);
    
    // Check for specific home elements
    const hasGroup1 = homeSection.querySelector('#group-1-your-shows');
    const hasGroup2 = homeSection.querySelector('#group-2-community');
    const hasGroup3 = homeSection.querySelector('#group-3-curated');
    
    if (hasGroup1) out.notes.push('✅ Home has group-1-your-shows');
    if (hasGroup2) out.notes.push('✅ Home has group-2-community');
    if (hasGroup3) out.notes.push('✅ Home has group-3-curated');
  }

  // 6) Layout Complexity Comparison
  console.log('[DISCOVER] Comparing layout complexity...');
  
  if (homeSection && discoverSection) {
    const homeComplexity = {
      groups: homeSection.querySelectorAll('.home-group').length,
      rows: homeSection.querySelectorAll('.preview-row-container').length,
      cards: homeSection.querySelectorAll('.card, .unified-card').length,
      children: homeSection.children.length
    };
    
    const discoverComplexity = {
      groups: discoverSection.querySelectorAll('.home-group').length,
      rows: discoverSection.querySelectorAll('.preview-row-container').length,
      cards: discoverSection.querySelectorAll('.card, .unified-card').length,
      children: discoverSection.children.length
    };
    
    out.notes.push(`📊 Home complexity: ${JSON.stringify(homeComplexity)}`);
    out.notes.push(`📊 Discover complexity: ${JSON.stringify(discoverComplexity)}`);
    
    // Check if discover is significantly simpler
    if (discoverComplexity.children < homeComplexity.children / 3) {
      out.notes.push('ℹ️ Discover section is significantly simpler than home (may be intentional)');
    } else {
      out.notes.push('✅ Discover section has reasonable complexity');
    }
  }

  // 7) CSS Styling Check
  console.log('[DISCOVER] Checking CSS styling...');
  
  if (discoverSection) {
    const discoverStyles = getComputedStyle(discoverSection);
    const homeStyles = homeSection ? getComputedStyle(homeSection) : null;
    
    // Check key CSS properties
    const keyProperties = ['display', 'position', 'padding', 'margin', 'background', 'border'];
    
    keyProperties.forEach(prop => {
      const discoverValue = discoverStyles[prop];
      out.notes.push(`📊 Discover ${prop}: ${discoverValue}`);
      
      if (homeStyles) {
        const homeValue = homeStyles[prop];
        if (discoverValue === homeValue) {
          out.notes.push(`✅ ${prop} matches home section`);
        } else {
          out.notes.push(`ℹ️ ${prop} differs from home: ${homeValue} vs ${discoverValue}`);
        }
      }
    });
  }

  // 8) Responsive Behavior Check
  console.log('[DISCOVER] Checking responsive behavior...');
  
  const viewportWidth = window.innerWidth;
  const isMobile = viewportWidth <= 640;
  
  out.notes.push(`📱 Viewport: ${viewportWidth}px (${isMobile ? 'Mobile' : 'Desktop'})`);
  
  if (discoverSection) {
    const discoverStyles = getComputedStyle(discoverSection);
    const discoverDisplay = discoverStyles.display;
    
    out.notes.push(`📊 Discover display: ${discoverDisplay}`);
    
    if (discoverDisplay === 'none') {
      out.notes.push('ℹ️ Discover section is hidden (normal if not active tab)');
    } else {
      out.notes.push('✅ Discover section is visible');
    }
  }

  // 9) Content Loading Check
  console.log('[DISCOVER] Checking content loading...');
  
  const discoverList = $('#discoverList');
  if (discoverList) {
    const listChildren = discoverList.children;
    out.notes.push(`📊 Discover list children: ${listChildren.length}`);
    
    if (listChildren.length > 0) {
      out.notes.push('✅ Discover list has content');
    } else {
      out.notes.push('ℹ️ Discover list is empty (may be normal)');
    }
  } else {
    out.errors.push('❌ Discover list container not found');
  }

  // 10) Functionality Check
  console.log('[DISCOVER] Checking functionality...');
  
  // Check if discover tab is clickable
  if (discoverTab) {
    const tabClickable = !discoverTab.disabled && discoverTab.style.display !== 'none';
    out.notes.push(`📊 Discover tab clickable: ${tabClickable}`);
    
    if (tabClickable) {
      out.notes.push('✅ Discover tab is clickable');
    } else {
      out.errors.push('❌ Discover tab is not clickable');
    }
  }

  // 11) Accessibility Check
  console.log('[DISCOVER] Checking accessibility...');
  
  if (discoverSection) {
    // Check for proper heading hierarchy
    const headings = discoverSection.querySelectorAll('h1, h2, h3, h4, h5, h6');
    out.notes.push(`📊 Discover headings: ${headings.length}`);
    
    // Check for proper focus management
    const focusableElements = discoverSection.querySelectorAll('button, input, select, textarea, [tabindex]');
    out.notes.push(`📊 Focusable elements: ${focusableElements.length}`);
    
    if (focusableElements.length > 0) {
      out.notes.push('✅ Discover section has focusable elements');
    } else {
      out.notes.push('ℹ️ Discover section has no focusable elements (may be normal)');
    }
  }

  // Summary
  console.log('[DISCOVER LAYOUT VALIDATION]', out.ok ? '✅ PASS' : '❌ FAIL');
  console.log('[DISCOVER LAYOUT VALIDATION] Notes:', out.notes);
  if (out.errors.length > 0) {
    console.log('[DISCOVER LAYOUT VALIDATION] Errors:', out.errors);
    out.ok = false;
  }
  
  // Return result for external use
  window.discoverLayoutValidationResult = out;
  return out;
})();
