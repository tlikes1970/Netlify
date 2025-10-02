// qa/auth-modal-validation.js
// Comprehensive auth modal validation and alreadyOpen loop prevention test

(async () => {
  const out = { ok: true, notes: [], errors: [] };
  const $ = s => document.querySelector(s);
  const $$ = s => document.querySelectorAll(s);

  console.log('[AUTH MODAL VALIDATION] Starting comprehensive validation...');

  // 1) Auth Manager Check
  console.log('[AUTH] Checking AuthManager availability...');
  
  if (window.AUTH_MANAGER) {
    out.notes.push('✅ AUTH_MANAGER available');
    
    // Check key methods
    const requiredMethods = ['init', 'showProviderModal', 'showEmailModal', 'startLogin'];
    const missingMethods = [];
    
    requiredMethods.forEach(method => {
      if (typeof window.AUTH_MANAGER[method] !== 'function') {
        missingMethods.push(method);
      }
    });
    
    if (missingMethods.length > 0) {
      out.errors.push(`❌ Missing AuthManager methods: ${missingMethods.join(', ')}`);
    } else {
      out.notes.push('✅ All required AuthManager methods available');
    }
  } else {
    out.errors.push('❌ AUTH_MANAGER not available');
  }

  // 2) Auth Modal Manager Check
  console.log('[AUTH] Checking AuthModalManager...');
  
  if (window.AUTH_MANAGER?._authModalManager) {
    out.notes.push('✅ AuthModalManager available');
    
    const modalManager = window.AUTH_MANAGER._authModalManager;
    
    // Check state management
    out.notes.push(`📊 Modal state: isOpen=${modalManager.isOpen}`);
    
    if (modalManager.modalElement) {
      out.notes.push('✅ Modal element exists');
    } else {
      out.notes.push('ℹ️ No modal element (normal if not open)');
    }
  } else {
    out.errors.push('❌ AuthModalManager not available');
  }

  // 3) Modal Elements Check
  console.log('[AUTH] Checking modal elements...');
  
  const modalSelectors = [
    '#providerModal',
    '#emailAuthModal', 
    '#signInModal',
    '.modal-backdrop[data-modal="login"]',
    '.auth-modal-backdrop'
  ];

  const existingModals = [];
  modalSelectors.forEach(selector => {
    const modal = $(selector);
    if (modal) {
      existingModals.push(selector);
      out.notes.push(`✅ Modal found: ${selector}`);
    }
  });

  if (existingModals.length === 0) {
    out.notes.push('ℹ️ No auth modals currently open (normal)');
  } else {
    out.notes.push(`📊 ${existingModals.length} auth modals currently open`);
  }

  // 4) Account Button Check
  console.log('[AUTH] Checking account button...');
  
  const accountButton = $('#accountButton');
  if (accountButton) {
    out.notes.push('✅ Account button found');
    
    // Check for click listeners
    const listeners = getEventListeners ? getEventListeners(accountButton).click : null;
    if (listeners) {
      out.notes.push(`📊 Account button has ${listeners.length} click listeners`);
      
      if (listeners.length === 1) {
        out.notes.push('✅ Account button has exactly 1 click listener (correct)');
      } else if (listeners.length > 1) {
        out.errors.push('❌ Account button has multiple click listeners (potential issue)');
      }
    } else {
      out.notes.push('ℹ️ Cannot check click listeners (getEventListeners not available)');
    }
  } else {
    out.errors.push('❌ Account button not found');
  }

  // 5) AlreadyOpen Loop Prevention Test
  console.log('[AUTH] Testing alreadyOpen loop prevention...');
  
  if (window.AUTH_MANAGER?._authModalManager) {
    const modalManager = window.AUTH_MANAGER._authModalManager;
    
    // Test opening modal multiple times
    let openAttempts = 0;
    let successfulOpens = 0;
    
    for (let i = 0; i < 3; i++) {
      openAttempts++;
      const result = modalManager.open();
      if (result) {
        successfulOpens++;
      }
    }
    
    out.notes.push(`📊 Open attempts: ${openAttempts}, Successful opens: ${successfulOpens}`);
    
    if (successfulOpens === 1) {
      out.notes.push('✅ AlreadyOpen loop prevention working correctly');
    } else if (successfulOpens > 1) {
      out.errors.push('❌ AlreadyOpen loop prevention failed - multiple modals opened');
    } else {
      out.notes.push('ℹ️ No modals opened (may be normal)');
    }
    
    // Clean up
    modalManager.close();
  }

  // 6) Provider Modal Check
  console.log('[AUTH] Checking provider modal...');
  
  if (typeof window.AUTH_MANAGER?.showProviderModal === 'function') {
    out.notes.push('✅ showProviderModal function available');
  } else {
    out.errors.push('❌ showProviderModal function not available');
  }

  // 7) Email Modal Check
  console.log('[AUTH] Checking email modal...');
  
  if (typeof window.AUTH_MANAGER?.showEmailModal === 'function') {
    out.notes.push('✅ showEmailModal function available');
  } else {
    out.errors.push('❌ showEmailModal function not available');
  }

  // 8) Login Methods Check
  console.log('[AUTH] Checking login methods...');
  
  const loginMethods = ['startGoogleLogin', 'startAppleLogin', 'handleEmailSubmit'];
  const availableMethods = [];
  const missingMethods = [];
  
  loginMethods.forEach(method => {
    if (typeof window.AUTH_MANAGER?.[method] === 'function') {
      availableMethods.push(method);
    } else {
      missingMethods.push(method);
    }
  });
  
  if (availableMethods.length > 0) {
    out.notes.push(`✅ Available login methods: ${availableMethods.join(', ')}`);
  }
  
  if (missingMethods.length > 0) {
    out.errors.push(`❌ Missing login methods: ${missingMethods.join(', ')}`);
  }

  // 9) Session Storage Check
  console.log('[AUTH] Checking session storage...');
  
  const authKeys = [
    'auth:redirectPending',
    'flicklet_auth_pending_email'
  ];
  
  authKeys.forEach(key => {
    const value = sessionStorage.getItem(key);
    if (value) {
      out.notes.push(`📊 Session storage ${key}: ${value}`);
    } else {
      out.notes.push(`ℹ️ Session storage ${key}: not set`);
    }
  });

  // 10) Firebase Auth Check
  console.log('[AUTH] Checking Firebase auth...');
  
  if (window.firebaseAuth) {
    out.notes.push('✅ Firebase auth available');
    
    const currentUser = window.firebaseAuth.currentUser;
    if (currentUser) {
      out.notes.push(`📊 Current user: ${currentUser.email || currentUser.displayName || 'Unknown'}`);
    } else {
      out.notes.push('ℹ️ No current user (not signed in)');
    }
  } else {
    out.notes.push('ℹ️ Firebase auth not available');
  }

  // 11) Modal Cleanup Function Check
  console.log('[AUTH] Checking modal cleanup function...');
  
  if (typeof window.clearAllAuthModals === 'function') {
    out.notes.push('✅ clearAllAuthModals function available');
  } else {
    out.notes.push('ℹ️ clearAllAuthModals function not available');
  }

  // 12) Race Condition Protection Check
  console.log('[AUTH] Checking race condition protection...');
  
  if (window.AUTH_MANAGER) {
    const hasActiveLoginRequests = window.AUTH_MANAGER._activeLoginRequests instanceof Set;
    const hasProcessUserSignInLock = typeof window.AUTH_MANAGER._processUserSignInLock === 'boolean';
    
    if (hasActiveLoginRequests) {
      out.notes.push('✅ Active login requests protection available');
    } else {
      out.errors.push('❌ Active login requests protection missing');
    }
    
    if (hasProcessUserSignInLock) {
      out.notes.push('✅ Process user sign-in lock available');
    } else {
      out.errors.push('❌ Process user sign-in lock missing');
    }
  }

  // Summary
  console.log('[AUTH MODAL VALIDATION]', out.ok ? '✅ PASS' : '❌ FAIL');
  console.log('[AUTH MODAL VALIDATION] Notes:', out.notes);
  if (out.errors.length > 0) {
    console.log('[AUTH MODAL VALIDATION] Errors:', out.errors);
    out.ok = false;
  }
  
  // Return result for external use
  window.authModalValidationResult = out;
  return out;
})();
