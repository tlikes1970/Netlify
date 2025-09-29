// qa/dev-asserts.js
// Lightweight dev QA runner for the three fixes

(async () => {
  const out = { ok: true, notes: [] };
  const $ = s => document.querySelector(s);

  console.log('[DEV ASSERTS] Starting validation...');

  // 1) Back-to-top safety
  const btt = $('button.back-to-top');
  if (btt) {
    const cs = getComputedStyle(btt);
    if (cs.opacity === '0' && cs.pointerEvents !== 'none') {
      out.ok = false; 
      out.notes.push('BTT hidden but intercepting clicks');
    } else if (cs.opacity === '0' && cs.pointerEvents === 'none') {
      out.notes.push('✅ BTT safely hidden (no click interception)');
    } else {
      out.notes.push('✅ BTT visible and interactive');
    }
  } else {
    out.notes.push('ℹ️ BTT not present (info)');
  }

  // 2) Tabs + panels
  const tabbar = $('nav[role="tablist"], #navigation, .tab-container');
  if (!tabbar) { 
    out.ok = false; 
    out.notes.push('❌ No tab bar found');
  } else {
    out.notes.push('✅ Tab bar found');
    
    const tabs = tabbar ? [...tabbar.querySelectorAll('[role="tab"], button, a')].slice(0,5) : [];
    const panels = [...document.querySelectorAll('[role="tabpanel"], section[id$="Section"]')];
    
    if (!panels.length) { 
      out.ok = false; 
      out.notes.push('❌ No panels found');
    } else {
      out.notes.push(`✅ Found ${panels.length} panels`);
    }
    
    if (tabs.length === 0) {
      out.ok = false;
      out.notes.push('❌ No tabs found');
    } else {
      out.notes.push(`✅ Found ${tabs.length} tabs`);
      
      // Check ARIA attributes
      const tabsWithAria = tabs.filter(t => t.getAttribute('aria-controls') && t.getAttribute('role') === 'tab');
      if (tabsWithAria.length === tabs.length) {
        out.notes.push('✅ All tabs have proper ARIA attributes');
      } else {
        out.ok = false;
        out.notes.push(`❌ Only ${tabsWithAria.length}/${tabs.length} tabs have proper ARIA`);
      }
    }
  }

  // 3) Sticky search
  const search = $('#desktop-search-row, .search-row');
  if (search) {
    const scs = getComputedStyle(search);
    if (scs.position !== 'sticky') { 
      out.ok = false; 
      out.notes.push('❌ Search is not sticky');
    } else {
      out.notes.push('✅ Search row is sticky');
      
      // Check if it has proper top offset
      if (scs.top && scs.top !== 'auto') {
        out.notes.push(`✅ Search has top offset: ${scs.top}`);
      } else {
        out.notes.push('⚠️ Search sticky but no top offset set');
      }
    }
  } else {
    out.notes.push('ℹ️ Search row not found (info)');
  }

  // Summary
  console.log('[DEV ASSERTS]', out.ok ? '✅ PASS' : '❌ FAIL', out.notes);
  
  // Return result for external use
  window.devAssertsResult = out;
  return out;
})();
