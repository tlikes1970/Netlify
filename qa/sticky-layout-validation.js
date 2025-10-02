// qa/sticky-layout-validation.js
// Comprehensive sticky layout and z-index validation

(async () => {
  const out = { ok: true, notes: [], errors: [] };
  const $ = s => document.querySelector(s);
  const $$ = s => document.querySelectorAll(s);

  console.log('[STICKY LAYOUT VALIDATION] Starting comprehensive validation...');

  // 1) CSS Variables Check
  console.log('[STICKY] Checking CSS variables...');
  const rootStyles = getComputedStyle(document.documentElement);
  const headerHeight = rootStyles.getPropertyValue('--header-h');
  const tabsHeight = rootStyles.getPropertyValue('--tabs-h');
  const searchHeight = rootStyles.getPropertyValue('--search-h');

  if (headerHeight) {
    out.notes.push(`✅ --header-h: ${headerHeight}`);
  } else {
    out.errors.push('❌ --header-h CSS variable not defined');
  }

  if (tabsHeight) {
    out.notes.push(`✅ --tabs-h: ${tabsHeight}`);
  } else {
    out.notes.push('ℹ️ --tabs-h CSS variable not defined (optional)');
  }

  if (searchHeight) {
    out.notes.push(`✅ --search-h: ${searchHeight}`);
  } else {
    out.notes.push('ℹ️ --search-h CSS variable not defined (optional)');
  }

  // 2) Header Element Check
  console.log('[STICKY] Checking header element...');
  const header = $('header, .header, #header');
  if (header) {
    const headerStyles = getComputedStyle(header);
    const headerPosition = headerStyles.position;
    const headerZIndex = headerStyles.zIndex;
    
    out.notes.push(`✅ Header found - position: ${headerPosition}, z-index: ${headerZIndex}`);
    
    if (headerPosition === 'fixed' || headerPosition === 'sticky') {
      out.notes.push('✅ Header has sticky/fixed positioning');
    } else {
      out.errors.push('❌ Header should have fixed or sticky positioning');
    }
  } else {
    out.errors.push('❌ Header element not found');
  }

  // 3) Search Row Check
  console.log('[STICKY] Checking search row...');
  const searchRow = $('#desktop-search-row, .search-row');
  if (searchRow) {
    const searchStyles = getComputedStyle(searchRow);
    const searchPosition = searchStyles.position;
    const searchTop = searchStyles.top;
    const searchZIndex = searchStyles.zIndex;
    
    out.notes.push(`✅ Search row found - position: ${searchPosition}, top: ${searchTop}, z-index: ${searchZIndex}`);
    
    if (searchPosition === 'sticky') {
      out.notes.push('✅ Search row has sticky positioning');
    } else {
      out.errors.push('❌ Search row should have sticky positioning');
    }
  } else {
    out.notes.push('ℹ️ Search row not found (may be disabled)');
  }

  // 4) Tab Container Check
  console.log('[STICKY] Checking tab container...');
  const tabContainer = $('#navigation, .tab-container, [role="tablist"]');
  if (tabContainer) {
    const tabStyles = getComputedStyle(tabContainer);
    const tabPosition = tabStyles.position;
    const tabTop = tabStyles.top;
    const tabZIndex = tabStyles.zIndex;
    
    out.notes.push(`✅ Tab container found - position: ${tabPosition}, top: ${tabTop}, z-index: ${tabZIndex}`);
    
    if (tabPosition === 'sticky') {
      out.notes.push('✅ Tab container has sticky positioning');
    } else {
      out.errors.push('❌ Tab container should have sticky positioning');
    }
  } else {
    out.errors.push('❌ Tab container not found');
  }

  // 5) Z-Index Order Validation
  console.log('[STICKY] Validating z-index order...');
  const elements = [
    { name: 'Header', selector: 'header, .header, #header' },
    { name: 'Search Row', selector: '#desktop-search-row, .search-row' },
    { name: 'Tab Container', selector: '#navigation, .tab-container, [role="tablist"]' },
    { name: 'Back to Top', selector: '.back-to-top' }
  ];

  const zIndexValues = [];
  elements.forEach(({ name, selector }) => {
    const element = $(selector);
    if (element) {
      const zIndex = getComputedStyle(element).zIndex;
      if (zIndex !== 'auto') {
        zIndexValues.push({ name, zIndex: parseInt(zIndex), element });
      }
    }
  });

  // Sort by z-index
  zIndexValues.sort((a, b) => a.zIndex - b.zIndex);
  
  out.notes.push('📊 Z-Index Order (lowest to highest):');
  zIndexValues.forEach(({ name, zIndex }) => {
    out.notes.push(`  ${name}: ${zIndex}`);
  });

  // Validate expected order: Header > Search > Tabs > Content
  const headerZ = zIndexValues.find(e => e.name === 'Header')?.zIndex || 0;
  const searchZ = zIndexValues.find(e => e.name === 'Search Row')?.zIndex || 0;
  const tabsZ = zIndexValues.find(e => e.name === 'Tab Container')?.zIndex || 0;

  if (headerZ > searchZ && searchZ > tabsZ) {
    out.notes.push('✅ Z-index order is correct (Header > Search > Tabs)');
  } else {
    out.errors.push('❌ Z-index order is incorrect');
  }

  // 6) Sticky Behavior Test
  console.log('[STICKY] Testing sticky behavior...');
  const stickyElements = $$('[style*="position: sticky"], [style*="position:sticky"]');
  const cssStickyElements = [];
  
  // Check elements with sticky positioning from CSS
  const allElements = $$('*');
  allElements.forEach(el => {
    const styles = getComputedStyle(el);
    if (styles.position === 'sticky') {
      cssStickyElements.push(el);
    }
  });

  out.notes.push(`✅ Found ${cssStickyElements.length} elements with sticky positioning`);
  
  cssStickyElements.forEach((el, index) => {
    const styles = getComputedStyle(el);
    const top = styles.top;
    const zIndex = styles.zIndex;
    out.notes.push(`  ${index + 1}. ${el.tagName}${el.id ? '#' + el.id : ''}${el.className ? '.' + el.className.split(' ')[0] : ''} - top: ${top}, z-index: ${zIndex}`);
  });

  // 7) Layout Container Check
  console.log('[STICKY] Checking layout containers...');
  const appRoot = $('#appRoot');
  if (appRoot) {
    const appStyles = getComputedStyle(appRoot);
    const appOverflow = appStyles.overflow;
    out.notes.push(`✅ App root found - overflow: ${appOverflow}`);
    
    if (appOverflow === 'hidden' || appOverflow === 'auto') {
      out.notes.push('✅ App root has proper overflow for sticky positioning');
    } else {
      out.notes.push('ℹ️ App root overflow may affect sticky positioning');
    }
  } else {
    out.errors.push('❌ App root container not found');
  }

  // 8) Responsive Check
  console.log('[STICKY] Checking responsive behavior...');
  const viewportWidth = window.innerWidth;
  const isMobile = viewportWidth <= 640;
  
  out.notes.push(`📱 Viewport: ${viewportWidth}px (${isMobile ? 'Mobile' : 'Desktop'})`);
  
  if (isMobile) {
    out.notes.push('ℹ️ Mobile viewport detected - sticky behavior may differ');
  }

  // Summary
  console.log('[STICKY LAYOUT VALIDATION]', out.ok ? '✅ PASS' : '❌ FAIL');
  console.log('[STICKY LAYOUT VALIDATION] Notes:', out.notes);
  if (out.errors.length > 0) {
    console.log('[STICKY LAYOUT VALIDATION] Errors:', out.errors);
    out.ok = false;
  }
  
  // Return result for external use
  window.stickyLayoutValidationResult = out;
  return out;
})();



