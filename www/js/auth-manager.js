/**
 * Centralized Authentication Manager
 * Handles all auth flows from parent window only
 * Supports Google, Apple, and Email providers
 */

(function() {
  'use strict';

  const AUTH_MANAGER = {
    // Session storage keys
    REDIRECT_FLAG: 'flicklet_auth_redirect_initiated',
    PENDING_EMAIL: 'flicklet_auth_pending_email',
    
    // Provider types
    PROVIDERS: {
      GOOGLE: 'google',
      APPLE: 'apple', 
      EMAIL: 'email'
    },
    
    // Methods
    METHODS: {
      POPUP: 'popup',
      REDIRECT: 'redirect'
    },

    init() {
      console.info('[auth] apply:init');
      this.setupPostMessageListener();
      this.setupFirebaseAuth();
      this.setupAccountButton();

      const pending = sessionStorage.getItem('auth:redirectPending');
      if (!pending) {
        console.log('[auth] apply:redirect:skip (no-flag)');
      } else {
        const run = () => this.handleRedirectResult().catch((e)=>{
          console.warn('[auth] handleRedirectResult(): ERROR', e);
        });
        if (document.readyState === 'loading') {
          window.addEventListener('DOMContentLoaded', run, { once: true });
        } else {
          // Give Firebase a tick to attach its internal containers
          setTimeout(run, 0);
        }
      }

      console.log('✅ Auth Manager ready');
      console.log('[auth] AuthManager ready (top):', { 
        hasShow: typeof this.showProviderModal === 'function' 
      });
    },

    /**
     * Setup Firebase authentication listener
     */
    setupFirebaseAuth() {
      if (!window.firebase || !window.firebaseAuth) {
        console.log('⏳ Firebase not ready, waiting...');
        // Wait for Firebase to be available
        const checkFirebase = () => {
          if (window.firebase && window.firebaseAuth) {
            this.initializeAuthListener();
          } else {
            setTimeout(checkFirebase, 100);
          }
        };
        checkFirebase();
        return;
      }
      
      this.initializeAuthListener();
    },

    /**
     * Initialize Firebase auth state listener
     */
    initializeAuthListener() {
      // Ensure single auth listener
      if (window.__AUTH_LISTENER_REGISTERED__) {
        console.warn('[auth] Auth listener already registered, skipping');
        return;
      }
      
      console.log('🔥 Setting up Firebase auth listener');
      console.info('[auth] apply:single-listener:attached');
      
      window.__AUTH_LISTENER_REGISTERED__ = true;
      window.firebaseAuth.onAuthStateChanged((user) => {
        if (user) {
          console.log('👤 User signed in:', user.email);
          this.handleLoginSuccess(user, 'Firebase');
        } else {
          console.log('👋 User signed out');
          this.handleSignOut();
        }
      });
    },

    /**
     * Main entry point for starting authentication
     * @param {string} provider - 'google', 'apple', or 'email'
     * @param {string} method - 'popup' or 'redirect' (optional, auto-detected)
     */
    async startLogin(provider, method = null) {
      console.log(`🔐 Starting ${provider} login${method ? ` (${method})` : ''}`);
      
      try {
        switch (provider) {
          case this.PROVIDERS.GOOGLE:
            await this.startGoogleLogin(method);
            break;
          case this.PROVIDERS.APPLE:
            // Apple always uses redirect - ignore method parameter
            if (method === 'popup') {
              console.warn('[auth] Apple login coerced from popup to redirect');
            }
            await this.startAppleLogin();
            break;
          case this.PROVIDERS.EMAIL:
            await this.startEmailLogin();
            break;
          default:
            throw new Error(`Unknown provider: ${provider}`);
        }
      } catch (error) {
        console.error(`❌ ${provider} login failed:`, error);
        this.showError(`Sign-in failed. Please try again.`);
      }
    },

    /**
     * Google Sign-In with popup (desktop) or redirect (mobile/blocked)
     */
    async startGoogleLogin(method = null) {
      if (!window.firebase || !window.firebaseAuth) {
        throw new Error('Firebase not available');
      }

      console.log('[auth] startGoogleLogin(): Firebase methods available:', {
        signInWithPopup: typeof window.firebaseAuth.signInWithPopup,
        signInWithRedirect: typeof window.firebaseAuth.signInWithRedirect,
        GoogleAuthProvider: typeof window.firebase.auth.GoogleAuthProvider
      });

      // Use Firebase v8 syntax (compat SDK)
      const provider = new window.firebase.auth.GoogleAuthProvider();
      
      // Auto-detect method if not specified
      if (!method) {
        method = this.isMobile() ? this.METHODS.REDIRECT : this.METHODS.POPUP;
      }

      console.info(`[auth] apply:provider:start google ${method}`);

      if (method === this.METHODS.POPUP) {
        // Check if popup method is available first
        if (typeof window.firebaseAuth.signInWithPopup !== 'function') {
          console.log('[auth] signInWithPopup not available, falling back to redirect');
          await this.startGoogleLogin(this.METHODS.REDIRECT);
          return;
        }
        
        try {
          const result = await window.firebaseAuth.signInWithPopup(provider);
          if (!result) {
            throw new Error('[auth] unsupported login method for provider');
          }
          this.handleLoginSuccess(result.user, 'Google');
        } catch (error) {
          if (error.code === 'auth/popup-blocked' || error.code === 'auth/popup-closed-by-user') {
            console.log('🔄 Popup blocked, falling back to redirect');
            await this.startGoogleLogin(this.METHODS.REDIRECT);
          } else {
            throw error;
          }
        }
      } else {
        // Redirect method - set flag and use compat SDK
        this.setRedirectFlag('google');
        console.info('[auth] apply:redirect:flag:set google');
        
        if (typeof window.firebaseAuth.signInWithRedirect === 'function') {
          await window.firebaseAuth.signInWithRedirect(provider);
        } else {
          throw new Error('No redirect method available');
        }
      }
    },

    /**
     * Apple Sign-In with hard redirect (compat SDK only)
     */
    async startAppleLogin() {
      console.log('[auth] apply:provider:start apple redirect');

      // warn if running from localhost (Apple won't complete localhost flows)
      if (/^(localhost|127\.0\.0\.1)$/.test(location.hostname)) {
        console.warn('[auth] Apple cannot be tested from localhost. Use your hosted web.app/firebaseapp.com origin configured in Apple Service ID.');
      }

      // mark that we expect a redirect result
      sessionStorage.setItem('auth:redirectPending', JSON.stringify({ provider: 'apple', ts: Date.now() }));

      const provider = new firebase.auth.OAuthProvider('apple.com');
      provider.addScope('email');
      provider.addScope('name');

      try {
        await firebaseAuth.signInWithRedirect(provider);
      } catch (err) {
        console.error('[auth] apple redirect error:', err?.message || err);
        sessionStorage.removeItem('auth:redirectPending');
      }
    },

    /**
     * Email/Password Sign-In
     */
    async startEmailLogin() {
      console.info('[auth] apply:provider:start email form');
      this.showEmailModal();
    },

    /**
     * Handle successful login
     */
    handleLoginSuccess(user, provider) {
      console.log(`✅ ${provider} login successful:`, user.email);
      
      // Update UI
      this.updateAccountButton(user);
      
      // Close any modals
      this.closeProviderModal();
      this.closeEmailModal();
      
      // Show success notification
      this.showSuccess(`Signed in with ${provider}`);
      
      // Notify iframes
      this.notifyIframes('auth-success', { user: user.email, provider });
      
      // Trigger app layer post-auth pipeline
      if (window.FlickletApp && typeof window.FlickletApp.handlePostAuthSuccess === 'function') {
        window.FlickletApp.handlePostAuthSuccess(user);
      }
    },

    /**
     * Handle login error
     */
    handleLoginError(error, provider) {
      console.error(`❌ ${provider} login error:`, error);
      this.showError(`Sign-in failed. Please try again.`);
    },

    /**
     * Show email/password modal
     */
    showEmailModal() {
      console.log('[auth] showEmailModal(): ENTER');
      // Remove existing modal
      this.closeEmailModal();
      
      console.log('[auth] showEmailModal(): Creating modal element');
      const modal = document.createElement('div');
      modal.id = 'emailAuthModal';
      modal.className = 'modal-backdrop';
      modal.style.cssText = `
        position: fixed !important;
        top: 0 !important;
        left: 0 !important;
        width: 100% !important;
        height: 100% !important;
        background: rgba(0, 0, 0, 0.8) !important;
        display: flex !important;
        align-items: center !important;
        justify-content: center !important;
        z-index: 99999 !important;
        visibility: visible !important;
        opacity: 1 !important;
      `;
      
      modal.innerHTML = `
        <div class="modal-content" style="
          background: white !important;
          border-radius: 8px !important;
          padding: 24px !important;
          max-width: 400px !important;
          width: 90% !important;
          box-shadow: 0 4px 20px rgba(0, 0, 0, 0.5) !important;
          border: 3px solid #1976d2 !important;
          position: relative !important;
          z-index: 100000 !important;
        ">
          <h2 style="margin: 0 0 16px; font-size: 20px; font-weight: 600; color: #1976d2;">Sign in with Email</h2>
          <form id="emailAuthForm">
            <div style="margin-bottom: 16px;">
              <label for="emailInput" style="display: block; margin-bottom: 4px; font-weight: 500;">Email</label>
              <input type="email" id="emailInput" required style="
                width: 100%;
                padding: 12px;
                border: 1px solid #ddd;
                border-radius: 4px;
                font-size: 14px;
              ">
            </div>
            <div style="margin-bottom: 20px;">
              <label for="passwordInput" style="display: block; margin-bottom: 4px; font-weight: 500;">Password</label>
              <input type="password" id="passwordInput" required style="
                width: 100%;
                padding: 12px;
                border: 1px solid #ddd;
                border-radius: 4px;
                font-size: 14px;
              ">
            </div>
            <div id="emailAuthError" style="color: #d32f2f; margin-bottom: 16px; font-size: 14px; display: none;"></div>
            <div style="display: flex; gap: 8px; justify-content: flex-end;">
              <button type="button" id="cancelEmailAuth" style="
                padding: 8px 16px;
                background: #f5f5f5;
                color: #333;
                border: 1px solid #ddd;
                border-radius: 4px;
                cursor: pointer;
              ">Cancel</button>
              <button type="submit" id="submitEmailAuth" style="
                padding: 8px 16px;
                background: #1976d2;
                color: white;
                border: none;
                border-radius: 4px;
                cursor: pointer;
              ">Sign In</button>
            </div>
          </form>
        </div>
      `;
      
      console.log('[auth] showEmailModal(): Adding modal to DOM');
      document.body.appendChild(modal);
      console.log('[auth] Email modal added to DOM:', {
        id: modal.id,
        className: modal.className,
        style: modal.style.cssText,
        visible: modal.offsetParent !== null,
        display: window.getComputedStyle(modal).display,
        parentElement: modal.parentElement?.tagName,
        bodyChildren: document.body.children.length
      });
      
      // Force visibility check after a short delay
      setTimeout(() => {
        const stillExists = document.getElementById('emailAuthModal');
        console.log('[auth] Email modal check after 100ms:', {
          exists: !!stillExists,
          visible: stillExists ? stillExists.offsetParent !== null : false,
          display: stillExists ? window.getComputedStyle(stillExists).display : 'N/A'
        });
      }, 100);
      
      // Add event listeners
      document.getElementById('emailAuthForm').addEventListener('submit', (e) => {
        e.preventDefault();
        console.log('[auth] Email form submitted');
        this.handleEmailSubmit();
      });
      
      document.getElementById('cancelEmailAuth').addEventListener('click', () => {
        this.closeEmailModal();
      });
      
      modal.addEventListener('click', (e) => {
        if (e.target === modal) {
          this.closeEmailModal();
        }
      });
    },

    /**
     * Close email modal
     */
    closeEmailModal() {
      console.log('[auth] closeEmailModal(): ENTER');
      const modal = document.getElementById('emailAuthModal');
      if (modal) {
        console.log('[auth] closeEmailModal(): Removing email modal');
        modal.remove();
      } else {
        console.log('[auth] closeEmailModal(): No email modal found to remove');
      }
    },

    /**
     * Handle email form submission
     */
    async handleEmailSubmit() {
      console.log('[auth] handleEmailSubmit: starting email authentication');
      const email = document.getElementById('emailInput').value.trim();
      const password = document.getElementById('passwordInput').value;
      const errorEl = document.getElementById('emailAuthError');
      const submitBtn = document.getElementById('submitEmailAuth');
      
      console.log('[auth] Email form data:', { email: email ? 'provided' : 'missing', password: password ? 'provided' : 'missing' });
      
      // Clear previous error
      errorEl.style.display = 'none';
      submitBtn.disabled = true;
      submitBtn.textContent = 'Signing in...';
      
      try {
        if (!email || !password) {
          throw new Error('Email and password are required');
        }
        
        if (!email.includes('@')) {
          throw new Error('Please enter a valid email address');
        }
        
        if (password.length < 6) {
          throw new Error('Password must be at least 6 characters');
        }
        
        console.log('[auth] Calling Firebase signInWithEmailAndPassword');
        const result = await window.firebaseAuth.signInWithEmailAndPassword(email, password);
        console.log('[auth] Firebase email auth success:', result.user?.email);
        this.handleLoginSuccess(result.user, 'Email');
        
      } catch (error) {
        console.error('❌ Email login failed:', error);
        errorEl.textContent = error.message || 'Sign-in failed. Please try again.';
        errorEl.style.display = 'block';
      } finally {
        submitBtn.disabled = false;
        submitBtn.textContent = 'Sign In';
      }
    },

    /**
     * Update account button with user info
     */
    updateAccountButton(user) {
      const accountBtn = document.getElementById('accountButton');
      const accountLabel = document.getElementById('accountButtonLabel');
      const accountContext = document.getElementById('accountContext');
      
      if (accountBtn && accountLabel) {
        const displayName = user.displayName || user.email?.split('@')[0] || 'User';
        accountLabel.textContent = displayName;
        accountBtn.title = `Signed in as ${user.email}. Click to sign out.`;
        
        // Set context instruction
        if (accountContext) {
          accountContext.textContent = 'Sign out';
        }
        
        console.info(`[identity] button:displayName=${displayName}`);
        
        // Update button behavior for signed-in state
        // Remove any existing onclick to prevent conflicts
        accountBtn.onclick = null;
      }
    },

    /**
     * Show sign-out confirmation modal
     */
    showSignOutConfirmation() {
      const user = window.firebaseAuth?.currentUser;
      const displayName = user?.displayName || user?.email?.split('@')[0] || 'User';
      
      const modalHtml = `
        <div style="text-align: center; padding: 20px;">
          <p style="margin-bottom: 20px; font-size: 16px;">
            You're about to be signed out, are you sure?
          </p>
          <div style="display: flex; gap: 12px; justify-content: center;">
            <button id="confirmSignOut" class="btn btn--primary" style="background: #dc3545; border-color: #dc3545;">
              Yes, Sign Out
            </button>
            <button id="cancelSignOut" class="btn btn--secondary">
              Cancel
            </button>
          </div>
        </div>
      `;
      
      // Create modal using the app's modal system
      if (window.FlickletApp && typeof window.FlickletApp.openModal === 'function') {
        const modal = window.FlickletApp.openModal('Sign Out Confirmation', modalHtml, 'signout-modal');
        
        if (modal) {
          // Add event listeners
          const confirmBtn = document.getElementById('confirmSignOut');
          const cancelBtn = document.getElementById('cancelSignOut');
          
          if (confirmBtn) {
            confirmBtn.addEventListener('click', () => {
              console.log('[auth] User confirmed sign out');
              this.signOut();
              window.FlickletApp.closeModal();
            });
          }
          
          if (cancelBtn) {
            cancelBtn.addEventListener('click', () => {
              console.log('[auth] User cancelled sign out');
              window.FlickletApp.closeModal();
            });
          }
        }
      }
    },

    /**
     * Sign out user
     */
    async signOut() {
      try {
        await window.firebaseAuth.signOut();
        console.log('✅ Signed out successfully');
        this.handleSignOut();
        
      } catch (error) {
        console.error('❌ Sign out failed:', error);
        this.showError('Sign out failed. Please try again.');
      }
    },

    /**
     * Handle sign out (called by both manual sign out and auth state change)
     */
    handleSignOut() {
      console.log('🧹 Starting sign out process...');
      
      // Clear user data first
      if (typeof window.clearUserData === 'function') {
        console.log('🧹 Calling clearUserData function...');
        window.clearUserData();
      } else if (typeof window.loadUserDataAndReplaceCards === 'function') {
        // Fallback to data-init clearUserData
        console.log('🧹 Using data-init clearUserData...');
        window.loadUserDataAndReplaceCards();
      }
      
      // Clear FlickletApp user data
      if (window.FlickletApp && typeof window.FlickletApp.clearUserData === 'function') {
        console.log('🧹 Calling FlickletApp.clearUserData...');
        window.FlickletApp.clearUserData();
      }
      
      // Reset account button
      const accountBtn = document.getElementById('accountButton');
      const accountLabel = document.getElementById('accountButtonLabel');
      const accountContext = document.getElementById('accountContext');
      
      if (accountBtn && accountLabel) {
        accountLabel.textContent = 'Sign In';
        accountBtn.title = 'Sign in';
        accountBtn.onclick = () => this.showProviderModal();
      }
      
      // Clear context instruction
      if (accountContext) {
        accountContext.textContent = '';
      }
      
      // Close any open modals
      this.closeProviderModal();
      this.closeEmailModal();
      
      // Clear any cached data
      if (window.appData) {
        window.appData.settings = window.appData.settings || {};
        window.appData.settings.username = '';
        window.appData.settings.displayName = '';
      }
      
      // Clear render flags to allow fresh rendering
      Object.keys(window).forEach(key => {
        if (key.startsWith('render_')) {
          window[key] = false;
        }
      });
      
      // Trigger UI refresh
      if (typeof window.updateUI === 'function') {
        window.updateUI();
      }
      
      // Notify iframes
      this.notifyIframes('auth-signout');
      
      // Emit userSignedOut event for other components
      document.dispatchEvent(new CustomEvent('userSignedOut', {
        detail: { timestamp: Date.now() }
      }));
      
      console.log('✅ Sign out process completed');
    },

    /**
     * Show provider selection modal
     */
    showProviderModal() {
      console.log('[auth] showProviderModal(): ENTER (top)');
      
      try {
        // Check if already open - be more thorough
        const existingModal = document.getElementById('providerModal');
        const legacyModals = document.querySelectorAll('.modal-backdrop[data-modal="login"], #signInModal, #emailAuthModal');
        
        if (existingModal || legacyModals.length > 0) {
          console.log('[auth] showProviderModal(): blocked → alreadyOpen', {
            providerModal: !!existingModal,
            legacyModals: legacyModals.length
          });
          // Force cleanup and retry
          this.closeProviderModal();
          console.info('[auth] apply:modal:recover');
          // Small delay to ensure DOM cleanup
          setTimeout(() => this.showProviderModal(), 50);
          return;
        }
        
        // Check if user is already signed in
        if (window.firebaseAuth && window.firebaseAuth.currentUser) {
          console.log('[auth] showProviderModal(): blocked → userSignedIn');
          return;
        }
        
        // Remove existing modal
        this.closeProviderModal();
        
        const modal = document.createElement('div');
        modal.id = 'providerModal';
        modal.className = 'modal-backdrop';
        modal.removeAttribute('hidden'); // Ensure no hidden attribute
        modal.style.cssText = `
          position: fixed !important;
          top: 0 !important;
          left: 0 !important;
          width: 100% !important;
          height: 100% !important;
          background: rgba(0, 0, 0, 0.5) !important;
          display: flex !important;
          align-items: center !important;
          justify-content: center !important;
          z-index: 10000 !important;
          visibility: visible !important;
          opacity: 1 !important;
        `;
        
        console.log('[auth] showProviderModal(): CREATED modal shell');
      
      modal.innerHTML = `
        <div class="modal-content" style="
          background: white;
          border-radius: 8px;
          padding: 24px;
          max-width: 400px;
          width: 90%;
          box-shadow: 0 4px 20px rgba(0, 0, 0, 0.3);
        ">
          <h2 style="margin: 0 0 16px; font-size: 20px; font-weight: 600;">Sign in to sync</h2>
          <p style="margin: 0 0 20px; color: #666;">Continue to Flicklet</p>
          <div style="display: flex; flex-direction: column; gap: 12px;">
            <button id="googleProviderBtn" style="
              display: flex;
              align-items: center;
              justify-content: center;
              gap: 8px;
              padding: 12px 18px;
              background: #4285f4;
              color: white;
              border: none;
              border-radius: 8px;
              cursor: pointer;
              font-size: 14px;
              font-weight: 500;
            ">
              Continue with Google
            </button>
            <button id="appleProviderBtn" style="
              display: flex;
              align-items: center;
              justify-content: center;
              gap: 8px;
              padding: 12px 18px;
              background: #000;
              color: white;
              border: none;
              border-radius: 8px;
              cursor: pointer;
              font-size: 14px;
              font-weight: 500;
            ">
              Continue with Apple
            </button>
            <button id="emailProviderBtn" style="
              display: flex;
              align-items: center;
              justify-content: center;
              gap: 8px;
              padding: 12px 18px;
              background: #f5f5f5;
              color: #333;
              border: 1px solid #ddd;
              border-radius: 8px;
              cursor: pointer;
              font-size: 14px;
              font-weight: 500;
            ">
              Continue with Email
            </button>
          </div>
          <div style="display: flex; justify-content: flex-end; margin-top: 20px;">
            <button id="cancelProviderBtn" style="
              padding: 8px 16px;
              background: #f5f5f5;
              color: #333;
              border: 1px solid #ddd;
              border-radius: 4px;
              cursor: pointer;
            ">Cancel</button>
          </div>
        </div>
      `;
      
        document.body.appendChild(modal);
        
        // Force visibility after append
        modal.style.visibility = 'visible';
        modal.style.opacity = '1';
        modal.style.display = 'flex';
        
        console.info('[auth] apply:modal:open');
        
        // Add a mutation observer to prevent the modal from being hidden
        const observer = new MutationObserver((mutations) => {
          mutations.forEach((mutation) => {
            if (mutation.type === 'attributes' && 
                (mutation.attributeName === 'style' || mutation.attributeName === 'hidden')) {
              // Re-force visibility if something tries to hide it
              modal.style.visibility = 'visible';
              modal.style.opacity = '1';
              modal.style.display = 'flex';
              modal.removeAttribute('hidden');
            }
          });
        });
        
        observer.observe(modal, { 
          attributes: true, 
          attributeFilter: ['style', 'hidden', 'class'] 
        });
        
        // Store observer for cleanup
        modal._visibilityObserver = observer;
        
        // Verify modal is visible
        const computedStyle = window.getComputedStyle(modal);
        console.log('[auth] showProviderModal(): VISIBLE', {
          display: computedStyle.display,
          visibility: computedStyle.visibility,
          opacity: computedStyle.opacity,
          zIndex: computedStyle.zIndex,
          inBody: document.body.contains(modal)
        });
        
        // Add event listeners
        document.getElementById('googleProviderBtn').addEventListener('click', () => {
          console.log('[auth] START (top) provider=google method=popup');
          this.closeProviderModal();
          this.startLogin(this.PROVIDERS.GOOGLE);
          console.log('[auth] CALL ISSUED');
        });
        
        document.getElementById('appleProviderBtn').addEventListener('click', () => {
          console.log('[auth] START (top) provider=apple method=redirect');
          this.closeProviderModal();
          this.startLogin(this.PROVIDERS.APPLE);
          console.log('[auth] CALL ISSUED');
        });
        
        document.getElementById('emailProviderBtn').addEventListener('click', () => {
          console.log('[auth] START (top) provider=email method=none');
          this.closeProviderModal();
          this.startLogin(this.PROVIDERS.EMAIL);
          console.log('[auth] CALL ISSUED');
        });
        
        document.getElementById('cancelProviderBtn').addEventListener('click', () => {
          this.closeProviderModal();
        });
        
        modal.addEventListener('click', (e) => {
          if (e.target === modal) {
            this.closeProviderModal();
          }
        });
        
      } catch (error) {
        console.error('[auth] showProviderModal(): ERROR', { 
          name: error.name, 
          message: error.message, 
          stack: error.stack 
        });
        throw error;
      }
    },

    /**
     * Close provider modal
     */
    closeProviderModal() {
      const modal = document.getElementById('providerModal');
      if (modal) {
        console.log('[auth] closeProviderModal(): removing existing modal');
        console.info('[auth] apply:modal:close');
        // Clean up mutation observer
        if (modal._visibilityObserver) {
          modal._visibilityObserver.disconnect();
        }
        modal.remove();
      }
      
      // Also clean up any other auth-related modals (but not email modal)
      const authModals = document.querySelectorAll('.modal-backdrop[data-modal="login"], #signInModal');
      authModals.forEach(modal => {
        if (modal && modal.parentNode) {
          console.log('[auth] closeProviderModal(): cleaning up legacy modal');
          modal.remove();
        }
      });
    },

    /**
     * Setup account button with idempotent binding
     */
    setupAccountButton() {
      const accountBtn = document.getElementById('accountButton');
      if (accountBtn) {
        // Remove existing handler if present
        if (accountBtn.__authClickHandler) {
          accountBtn.removeEventListener('click', accountBtn.__authClickHandler);
          console.info('[auth] apply:button:bind:skipped (already)');
        }
        
        // Define single handler function
        const clickHandler = (e) => {
          console.log('[auth] CLICK (top) accountButton');
          e.preventDefault();
          
          // Ensure we're in top window
          if (window !== window.parent) {
            console.log('[auth] Forwarding to parent window');
            window.parent.postMessage({ type: 'FLICKLET_START_LOGIN', provider: 'google' }, '*');
            return;
          }
          
          // Check if user is signed in
          if (window.firebaseAuth && window.firebaseAuth.currentUser) {
            console.log('[auth] User signed in, showing sign-out confirmation');
            this.showSignOutConfirmation();
          } else {
            console.log('[auth] User not signed in, showing provider modal');
            this.showProviderModal();
          }
          console.log('[auth] Account button action completed');
        };
        
        // Store handler reference and add listener
        accountBtn.__authClickHandler = clickHandler;
        accountBtn.addEventListener('click', clickHandler);
        console.info('[auth] apply:button:bind:attached');
      }
    },

    /**
     * Setup postMessage listener for iframe communication
     */
    setupPostMessageListener() {
      window.addEventListener('message', (event) => {
        // Verify origin for security
        if (!this.isValidOrigin(event.origin)) {
          return;
        }
        
        if (event.data && event.data.type === 'FLICKLET_START_LOGIN') {
          console.log('📨 Received auth request from iframe:', event.data);
          this.startLogin(event.data.provider, event.data.method);
        }
      });
    },

    /**
     * Notify iframes of auth state changes
     */
    notifyIframes(type, data = {}) {
      const iframes = document.querySelectorAll('iframe');
      iframes.forEach(iframe => {
        try {
          iframe.contentWindow.postMessage({
            type: `FLICKLET_${type.toUpperCase()}`,
            ...data
          }, '*');
        } catch (error) {
          // Ignore cross-origin errors
        }
      });
    },

    /**
     * Handle redirect result on page load
     */
    async handleRedirectResult() {
      console.log('[auth] handleRedirectResult(): checking redirect result...');
      if (!sessionStorage.getItem('auth:redirectPending')) {
        console.log('[auth] apply:redirect:skip (flag-missing at entry)');
        return;
      }
      if (!document.body) {
        console.log('[auth] apply:redirect:defer (no body)'); 
        await new Promise(r => requestAnimationFrame(r));
      }
      console.log('[auth] apply:redirect:resolve:start');
      
      // Wait for DOM ready to avoid "No location for new iframe" error
      await this.onDomReady();
      
      // Additional check: ensure Firebase auth is ready and has redirect capability
      if (!window.firebaseAuth || typeof window.firebaseAuth.getRedirectResult !== 'function') {
        console.log('[auth] handleRedirectResult(): Firebase auth not ready for redirect');
        this.clearRedirectFlag();
        return;
      }
      
      try {
        const result = await window.firebaseAuth.getRedirectResult();
        if (result.user) {
          console.log('[auth] handleRedirectResult(): success →', result.user.email);
          this.handleLoginSuccess(result.user, 'Redirect');
        } else {
          console.log('[auth] handleRedirectResult(): no user in result');
          try {
            const info = JSON.parse(sessionStorage.getItem('auth:redirectPending') || '{}');
            if (info?.provider === 'apple') {
              console.warn('[auth] Apple returned no user. Check Apple Service ID, verified domains, and return URLs:');
              console.warn(' - Service ID must equal com.TravisL.tvtracker.web');
              console.warn(' - Domains: flicklet-71dff.web.app, flicklet-71dff.firebaseapp.com');
              console.warn(' - Return URLs: https://flicklet-71dff.web.app/__/auth/handler and https://flicklet-71dff.firebaseapp.com/__/auth/handler');
            }
          } finally {
            // fall through to finally {} to clear the flag
          }
          
          // Check if user is actually signed in (Apple login sometimes doesn't return result)
          const currentUser = window.firebaseAuth.currentUser;
          if (currentUser && this.hasRedirectFlag()) {
            console.log('[auth] Apple login completed, user is signed in:', currentUser.email);
            this.handleLoginSuccess(currentUser, 'Apple');
          }
        }
      } catch (error) {
        console.error('[auth] handleRedirectResult(): ERROR', error);
        console.error('[auth] Error details:', {
          code: error.code,
          message: error.message,
          stack: error.stack
        });
        
        // Handle specific iframe errors gracefully
        if (error.message && error.message.includes('No location for new iframe')) {
          console.log('[auth] Iframe error - likely no actual redirect in progress');
        } else if (error.code !== 'auth/no-auth-event') {
          this.showError(`Sign-in failed: ${error.message}`);
        } else {
          console.log('[auth] Apple login redirect completed without error');
        }
      } finally {
        sessionStorage.removeItem('auth:redirectPending');
        console.log('[auth] apply:redirect:clear');
        console.log('[auth] apply:redirect:resolve:done');
      }
    },

    /**
     * Set redirect flag
     */
    setRedirectFlag(provider = 'unknown') {
      const flagData = JSON.stringify({ ts: Date.now(), provider });
      sessionStorage.setItem('auth:redirectPending', flagData);
    },

    /**
     * Check if redirect was initiated
     */
    hasRedirectFlag() {
      return sessionStorage.getItem('auth:redirectPending') !== null;
    },

    /**
     * Clear redirect flag
     */
    clearRedirectFlag() {
      sessionStorage.removeItem('auth:redirectPending');
    },

    /**
     * DOM ready helper
     */
    onDomReady() {
      return new Promise((resolve) => {
        if (document.readyState === 'loading') {
          document.addEventListener('DOMContentLoaded', resolve, { once: true });
        } else {
          resolve();
        }
      });
    },

    /**
     * Check if mobile device
     */
    isMobile() {
      return /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
    },

    /**
     * Validate message origin
     */
    isValidOrigin(origin) {
      const allowedOrigins = [
        window.location.origin,
        'https://flicklet-71dff.firebaseapp.com',
        'https://flicklet-71dff.web.app'
      ];
      return allowedOrigins.includes(origin);
    },

    /**
     * Show success notification
     */
    showSuccess(message) {
      if (window.showNotification) {
        window.showNotification(message, 'success');
      } else {
        console.log('✅', message);
      }
    },

    /**
     * Show error notification
     */
    showError(message) {
      if (window.showNotification) {
        window.showNotification(message, 'error');
      } else {
        console.error('❌', message);
      }
    }
  };

  // Expose globally
  window.AuthManager = AUTH_MANAGER;
  
  // Add global cleanup function for debugging
  window.clearAllAuthModals = () => {
    console.log('[auth] clearAllAuthModals(): cleaning up all auth modals');
    const allModals = document.querySelectorAll('#providerModal, .modal-backdrop[data-modal="login"], #signInModal, #emailAuthModal, .modal-backdrop');
    allModals.forEach(modal => {
      if (modal && modal.parentNode) {
        console.log('[auth] clearAllAuthModals(): removing modal', modal.id || modal.className);
        modal.remove();
      }
    });
  };

  // Initialize when DOM is ready
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => AUTH_MANAGER.init());
  } else {
    AUTH_MANAGER.init();
  }

})();
