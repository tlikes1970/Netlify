// qa/flickword-modal-validation.js
// Comprehensive FlickWord modal usability and overflow validation

(async () => {
  const out = { ok: true, notes: [], errors: [] };
  const $ = s => document.querySelector(s);
  const $$ = s => document.querySelectorAll(s);

  console.log('[FLICKWORD MODAL VALIDATION] Starting comprehensive validation...');

  // 1) Modal Element Check
  console.log('[FLICKWORD] Checking modal element...');
  
  const flickwordModal = $('#modal-flickword');
  if (flickwordModal) {
    out.notes.push('✅ FlickWord modal element found');
    
    // Check modal attributes
    const modalAttributes = {
      id: flickwordModal.id,
      className: flickwordModal.className,
      ariaHidden: flickwordModal.getAttribute('aria-hidden'),
      role: flickwordModal.getAttribute('role'),
      style: flickwordModal.style.display
    };
    
    out.notes.push(`📊 Modal attributes: ${JSON.stringify(modalAttributes)}`);
    
    if (modalAttributes.role === 'dialog' && modalAttributes.ariaHidden === 'true') {
      out.notes.push('✅ Modal has proper ARIA attributes');
    } else {
      out.errors.push('❌ Modal missing proper ARIA attributes');
    }
  } else {
    out.errors.push('❌ FlickWord modal element not found');
  }

  // 2) Modal Structure Check
  console.log('[FLICKWORD] Checking modal structure...');
  
  if (flickwordModal) {
    // Check overlay
    const overlay = flickwordModal.querySelector('.gm-overlay');
    if (overlay) {
      out.notes.push('✅ Modal overlay found');
      
      const overlayAttributes = {
        className: overlay.className,
        dataClose: overlay.getAttribute('data-close')
      };
      out.notes.push(`📊 Overlay attributes: ${JSON.stringify(overlayAttributes)}`);
    } else {
      out.errors.push('❌ Modal overlay not found');
    }
    
    // Check dialog
    const dialog = flickwordModal.querySelector('.gm-dialog');
    if (dialog) {
      out.notes.push('✅ Modal dialog found');
      
      const dialogAttributes = {
        className: dialog.className,
        role: dialog.getAttribute('role')
      };
      out.notes.push(`📊 Dialog attributes: ${JSON.stringify(dialogAttributes)}`);
    } else {
      out.errors.push('❌ Modal dialog not found');
    }
    
    // Check header
    const header = flickwordModal.querySelector('.gm-header');
    if (header) {
      out.notes.push('✅ Modal header found');
      
      const title = header.querySelector('h3');
      const closeButton = header.querySelector('.gm-close');
      
      if (title) {
        out.notes.push(`📊 Modal title: "${title.textContent}"`);
      }
      
      if (closeButton) {
        out.notes.push('✅ Modal close button found');
        
        const closeAttributes = {
          type: closeButton.getAttribute('type'),
          ariaLabel: closeButton.getAttribute('aria-label'),
          dataClose: closeButton.getAttribute('data-close')
        };
        out.notes.push(`📊 Close button attributes: ${JSON.stringify(closeAttributes)}`);
      } else {
        out.errors.push('❌ Modal close button not found');
      }
    } else {
      out.errors.push('❌ Modal header not found');
    }
    
    // Check body
    const body = flickwordModal.querySelector('.gm-body');
    if (body) {
      out.notes.push('✅ Modal body found');
    } else {
      out.errors.push('❌ Modal body not found');
    }
  }

  // 3) Iframe Check
  console.log('[FLICKWORD] Checking iframe...');
  
  const flickwordIframe = $('#flickword-game-frame');
  if (flickwordIframe) {
    out.notes.push('✅ FlickWord iframe found');
    
    const iframeAttributes = {
      id: flickwordIframe.id,
      src: flickwordIframe.src,
      sandbox: flickwordIframe.sandbox,
      width: flickwordIframe.width,
      height: flickwordIframe.height
    };
    
    out.notes.push(`📊 Iframe attributes: ${JSON.stringify(iframeAttributes)}`);
    
    if (iframeAttributes.src === '/features/flickword-v2.html') {
      out.notes.push('✅ Iframe has correct source');
    } else {
      out.errors.push('❌ Iframe has incorrect source');
    }
    
    // Check iframe dimensions
    const iframeStyles = getComputedStyle(flickwordIframe);
    const iframeWidth = iframeStyles.width;
    const iframeHeight = iframeStyles.height;
    
    out.notes.push(`📊 Iframe dimensions: ${iframeWidth} x ${iframeHeight}`);
    
    if (iframeWidth !== '0px' && iframeHeight !== '0px') {
      out.notes.push('✅ Iframe has proper dimensions');
    } else {
      out.errors.push('❌ Iframe has zero dimensions');
    }
  } else {
    out.errors.push('❌ FlickWord iframe not found');
  }

  // 4) CSS Styling Check
  console.log('[FLICKWORD] Checking CSS styling...');
  
  if (flickwordModal) {
    const modalStyles = getComputedStyle(flickwordModal);
    const keyProperties = ['position', 'zIndex', 'display', 'width', 'height'];
    
    keyProperties.forEach(prop => {
      const value = modalStyles[prop];
      out.notes.push(`📊 Modal ${prop}: ${value}`);
    });
    
    // Check z-index
    const zIndex = parseInt(modalStyles.zIndex);
    if (zIndex >= 15000) {
      out.notes.push('✅ Modal has high z-index (above other content)');
    } else {
      out.errors.push('❌ Modal z-index too low');
    }
    
    // Check dialog styles
    const dialog = flickwordModal.querySelector('.gm-dialog');
    if (dialog) {
      const dialogStyles = getComputedStyle(dialog);
      const dialogWidth = dialogStyles.width;
      const dialogHeight = dialogStyles.height;
      const dialogMaxWidth = dialogStyles.maxWidth;
      const dialogMaxHeight = dialogStyles.maxHeight;
      
      out.notes.push(`📊 Dialog dimensions: ${dialogWidth} x ${dialogHeight}`);
      out.notes.push(`📊 Dialog max dimensions: ${dialogMaxWidth} x ${dialogMaxHeight}`);
      
      // Check responsive sizing
      if (dialogWidth.includes('min(') && dialogHeight.includes('min(')) {
        out.notes.push('✅ Dialog has responsive sizing');
      } else {
        out.notes.push('ℹ️ Dialog may not have responsive sizing');
      }
    }
  }

  // 5) Overflow and Usability Check
  console.log('[FLICKWORD] Checking overflow and usability...');
  
  if (flickwordModal) {
    const dialog = flickwordModal.querySelector('.gm-dialog');
    if (dialog) {
      const dialogStyles = getComputedStyle(dialog);
      const overflow = dialogStyles.overflow;
      
      out.notes.push(`📊 Dialog overflow: ${overflow}`);
      
      if (overflow === 'hidden') {
        out.notes.push('✅ Dialog prevents content overflow');
      } else {
        out.notes.push('ℹ️ Dialog may allow content overflow');
      }
      
      // Check if dialog fits in viewport
      const viewportWidth = window.innerWidth;
      const viewportHeight = window.innerHeight;
      const dialogRect = dialog.getBoundingClientRect();
      
      out.notes.push(`📊 Viewport: ${viewportWidth} x ${viewportHeight}`);
      out.notes.push(`📊 Dialog rect: ${dialogRect.width} x ${dialogRect.height}`);
      
      if (dialogRect.width <= viewportWidth && dialogRect.height <= viewportHeight) {
        out.notes.push('✅ Dialog fits within viewport');
      } else {
        out.errors.push('❌ Dialog exceeds viewport dimensions');
      }
    }
  }

  // 6) Feature Flag Check
  console.log('[FLICKWORD] Checking feature flags...');
  
  if (window.FLAGS) {
    const flickwordEnabled = window.FLAGS.flickwordModalEnabled;
    const flickwordBoostEnabled = window.FLAGS.flickwordBoostEnabled;
    
    out.notes.push(`📊 flickwordModalEnabled: ${flickwordEnabled}`);
    out.notes.push(`📊 flickwordBoostEnabled: ${flickwordBoostEnabled}`);
    
    if (flickwordEnabled) {
      out.notes.push('✅ FlickWord modal feature enabled');
    } else {
      out.notes.push('ℹ️ FlickWord modal feature disabled');
    }
  } else {
    out.notes.push('ℹ️ Feature flags not available');
  }

  // 7) Modal Initialization Check
  console.log('[FLICKWORD] Checking modal initialization...');
  
  // Check if initialization function exists
  if (typeof window.App?.initializeFlickWordModal === 'function') {
    out.notes.push('✅ FlickWord modal initialization function available');
  } else {
    out.notes.push('ℹ️ FlickWord modal initialization function not available');
  }
  
  // Check if modal module exists
  const modalModulePath = '/scripts/modules/flickword-modal.js';
  out.notes.push(`📊 Expected modal module: ${modalModulePath}`);

  // 8) Accessibility Check
  console.log('[FLICKWORD] Checking accessibility...');
  
  if (flickwordModal) {
    // Check focus management
    const focusableElements = flickwordModal.querySelectorAll('button, input, select, textarea, [tabindex]');
    out.notes.push(`📊 Focusable elements: ${focusableElements.length}`);
    
    // Check ARIA attributes
    const ariaHidden = flickwordModal.getAttribute('aria-hidden');
    const role = flickwordModal.getAttribute('role');
    
    if (ariaHidden === 'true' && role === 'dialog') {
      out.notes.push('✅ Modal has proper ARIA attributes for accessibility');
    } else {
      out.errors.push('❌ Modal missing proper ARIA attributes');
    }
    
    // Check close button accessibility
    const closeButton = flickwordModal.querySelector('.gm-close');
    if (closeButton) {
      const ariaLabel = closeButton.getAttribute('aria-label');
      if (ariaLabel) {
        out.notes.push('✅ Close button has aria-label');
      } else {
        out.errors.push('❌ Close button missing aria-label');
      }
    }
  }

  // 9) Responsive Behavior Check
  console.log('[FLICKWORD] Checking responsive behavior...');
  
  const viewportWidth = window.innerWidth;
  const isMobile = viewportWidth <= 640;
  
  out.notes.push(`📱 Viewport: ${viewportWidth}px (${isMobile ? 'Mobile' : 'Desktop'})`);
  
  if (flickwordModal) {
    const dialog = flickwordModal.querySelector('.gm-dialog');
    if (dialog) {
      const dialogStyles = getComputedStyle(dialog);
      const dialogWidth = dialogStyles.width;
      
      if (isMobile) {
        if (dialogWidth.includes('96vw') || dialogWidth.includes('98%')) {
          out.notes.push('✅ Dialog responsive on mobile');
        } else {
          out.notes.push('ℹ️ Dialog may not be fully responsive on mobile');
        }
      } else {
        if (dialogWidth.includes('1200px') || dialogWidth.includes('min(')) {
          out.notes.push('✅ Dialog responsive on desktop');
        } else {
          out.notes.push('ℹ️ Dialog may not be fully responsive on desktop');
        }
      }
    }
  }

  // 10) Modal State Check
  console.log('[FLICKWORD] Checking modal state...');
  
  if (flickwordModal) {
    const isHidden = flickwordModal.style.display === 'none' || 
                     flickwordModal.getAttribute('aria-hidden') === 'true';
    
    out.notes.push(`📊 Modal hidden: ${isHidden}`);
    
    if (isHidden) {
      out.notes.push('✅ Modal is properly hidden by default');
    } else {
      out.notes.push('ℹ️ Modal may be visible (check if intentional)');
    }
  }

  // 11) Game Stats Check
  console.log('[FLICKWORD] Checking game stats...');
  
  const flickwordTile = $('#flickwordTile');
  if (flickwordTile) {
    out.notes.push('✅ FlickWord tile found');
    
    const gameStats = flickwordTile.querySelector('.game-stats');
    if (gameStats) {
      out.notes.push('✅ Game stats section found');
      
      const statItems = gameStats.querySelectorAll('.stat-item');
      out.notes.push(`📊 Stat items: ${statItems.length}`);
      
      if (statItems.length >= 6) {
        out.notes.push('✅ Game stats have expected number of items');
      } else {
        out.notes.push('ℹ️ Game stats may be missing items');
      }
    } else {
      out.notes.push('ℹ️ Game stats section not found');
    }
  } else {
    out.notes.push('ℹ️ FlickWord tile not found');
  }

  // Summary
  console.log('[FLICKWORD MODAL VALIDATION]', out.ok ? '✅ PASS' : '❌ FAIL');
  console.log('[FLICKWORD MODAL VALIDATION] Notes:', out.notes);
  if (out.errors.length > 0) {
    console.log('[FLICKWORD MODAL VALIDATION] Errors:', out.errors);
    out.ok = false;
  }
  
  // Return result for external use
  window.flickwordModalValidationResult = out;
  return out;
})();
