/**
 * Iframe Authentication Helper
 * Provides postMessage communication for iframe-to-parent auth requests
 */

(function () {
  'use strict';

  const IFRAME_AUTH_HELPER = {
    init() {
      console.log('📨 Iframe Auth Helper initializing...');
      this.setupAuthRequestHandler();
      this.setupAuthStateListener();
      console.log('✅ Iframe Auth Helper ready');
    },

    /**
     * Request authentication from parent window
     * @param {string} provider - 'google', 'apple', or 'email'
     * @param {string} method - 'popup' or 'redirect' (optional)
     */
    requestAuth(provider, method = null) {
      console.log(`📨 Requesting ${provider} auth from parent${method ? ` (${method})` : ''}`);

      const message = {
        type: 'FLICKLET_START_LOGIN',
        provider: provider,
        method: method,
      };

      // Send to parent window
      if (window.parent && window.parent !== window) {
        window.parent.postMessage(message, '*');
      } else {
        console.warn('⚠️ Not in iframe context, cannot request auth from parent');
      }
    },

    /**
     * Setup click handler for auth buttons
     */
    setupAuthRequestHandler() {
      // Handle Google auth requests
      const googleBtns = document.querySelectorAll('[data-auth-provider="google"]');
      googleBtns.forEach((btn) => {
        btn.addEventListener('click', (e) => {
          e.preventDefault();
          this.requestAuth('google');
        });
      });

      // Handle Apple auth requests
      const appleBtns = document.querySelectorAll('[data-auth-provider="apple"]');
      appleBtns.forEach((btn) => {
        btn.addEventListener('click', (e) => {
          e.preventDefault();
          this.requestAuth('apple');
        });
      });

      // Handle Email auth requests
      const emailBtns = document.querySelectorAll('[data-auth-provider="email"]');
      emailBtns.forEach((btn) => {
        btn.addEventListener('click', (e) => {
          e.preventDefault();
          this.requestAuth('email');
        });
      });

      // Handle generic sign-in requests
      const signInBtns = document.querySelectorAll('[data-auth-action="signin"]');
      signInBtns.forEach((btn) => {
        btn.addEventListener('click', (e) => {
          e.preventDefault();
          this.showSignInPrompt();
        });
      });
    },

    /**
     * Show sign-in prompt in iframe
     */
    showSignInPrompt() {
      // Create a simple prompt in the iframe
      const prompt = document.createElement('div');
      prompt.style.cssText = `
        position: fixed;
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;
        background: rgba(0, 0, 0, 0.8);
        display: flex;
        align-items: center;
        justify-content: center;
        z-index: 1000;
        color: white;
        font-family: sans-serif;
      `;

      prompt.innerHTML = `
        <div style="
          background: white;
          color: #333;
          padding: 24px;
          border-radius: 8px;
          max-width: 400px;
          text-align: center;
        ">
          <h3 style="margin: 0 0 16px;">Sign in to save progress</h3>
          <p style="margin: 0 0 20px; color: #666;">Choose your preferred sign-in method:</p>
          <div style="display: flex; flex-direction: column; gap: 12px;">
            <button onclick="window.iframeAuthHelper.requestAuth('google')" style="
              padding: 12px 18px;
              background: #4285f4;
              color: white;
              border: none;
              border-radius: 8px;
              cursor: pointer;
            ">Continue with Google</button>
            <button onclick="window.iframeAuthHelper.requestAuth('apple')" style="
              padding: 12px 18px;
              background: #000;
              color: white;
              border: none;
              border-radius: 8px;
              cursor: pointer;
            ">Continue with Apple</button>
            <button onclick="window.iframeAuthHelper.requestAuth('email')" style="
              padding: 12px 18px;
              background: #f5f5f5;
              color: #333;
              border: 1px solid #ddd;
              border-radius: 8px;
              cursor: pointer;
            ">Continue with Email</button>
          </div>
          <button onclick="this.closest('.iframe-auth-prompt').remove()" style="
            margin-top: 16px;
            padding: 8px 16px;
            background: #f5f5f5;
            color: #333;
            border: 1px solid #ddd;
            border-radius: 4px;
            cursor: pointer;
          ">Cancel</button>
        </div>
      `;

      prompt.className = 'iframe-auth-prompt';
      document.body.appendChild(prompt);
    },

    /**
     * Setup listener for auth state changes from parent
     */
    setupAuthStateListener() {
      window.addEventListener('message', (event) => {
        if (event.data && event.data.type) {
          switch (event.data.type) {
            case 'FLICKLET_AUTH_SUCCESS':
              this.handleAuthSuccess(event.data);
              break;
            case 'FLICKLET_AUTH_SIGNOUT':
              this.handleAuthSignOut();
              break;
            case 'FLICKLET_AUTH_ERROR':
              this.handleAuthError(event.data);
              break;
          }
        }
      });
    },

    /**
     * Handle successful authentication
     */
    handleAuthSuccess(data) {
      console.log('✅ Auth success in iframe:', data);

      // Remove any auth prompts
      const prompts = document.querySelectorAll('.iframe-auth-prompt');
      prompts.forEach((prompt) => prompt.remove());

      // Update UI to reflect signed-in state
      this.updateSignedInState(data.user, data.provider);

      // Dispatch custom event for iframe-specific handling
      window.dispatchEvent(
        new CustomEvent('flicklet-auth-success', {
          detail: data,
        }),
      );
    },

    /**
     * Handle sign out
     */
    handleAuthSignOut() {
      console.log('👋 Auth sign out in iframe');

      // Update UI to reflect signed-out state
      this.updateSignedOutState();

      // Dispatch custom event for iframe-specific handling
      window.dispatchEvent(new CustomEvent('flicklet-auth-signout'));
    },

    /**
     * Handle auth error
     */
    handleAuthError(data) {
      console.error('❌ Auth error in iframe:', data);

      // Show error message
      this.showError(data.message || 'Authentication failed');

      // Dispatch custom event for iframe-specific handling
      window.dispatchEvent(
        new CustomEvent('flicklet-auth-error', {
          detail: data,
        }),
      );
    },

    /**
     * Update UI for signed-in state
     */
    updateSignedInState(user, provider) {
      // Update any user info displays
      const userElements = document.querySelectorAll('[data-user-info]');
      userElements.forEach((el) => {
        el.textContent = user || 'Signed in';
        el.style.display = 'block';
      });

      // Hide sign-in buttons
      const signInElements = document.querySelectorAll('[data-auth-action="signin"]');
      signInElements.forEach((el) => {
        el.style.display = 'none';
      });

      // Show sign-out buttons
      const signOutElements = document.querySelectorAll('[data-auth-action="signout"]');
      signOutElements.forEach((el) => {
        el.style.display = 'block';
      });
    },

    /**
     * Update UI for signed-out state
     */
    updateSignedOutState() {
      // Hide user info displays
      const userElements = document.querySelectorAll('[data-user-info]');
      userElements.forEach((el) => {
        el.style.display = 'none';
      });

      // Show sign-in buttons
      const signInElements = document.querySelectorAll('[data-auth-action="signin"]');
      signInElements.forEach((el) => {
        el.style.display = 'block';
      });

      // Hide sign-out buttons
      const signOutElements = document.querySelectorAll('[data-auth-action="signout"]');
      signOutElements.forEach((el) => {
        el.style.display = 'none';
      });
    },

    /**
     * Show error message
     */
    showError(message) {
      // Create temporary error display
      const error = document.createElement('div');
      error.style.cssText = `
        position: fixed;
        top: 20px;
        right: 20px;
        background: #d32f2f;
        color: white;
        padding: 12px 16px;
        border-radius: 4px;
        z-index: 1001;
        font-family: sans-serif;
        font-size: 14px;
      `;
      error.textContent = message;
      document.body.appendChild(error);

      // Remove after 3 seconds
      setTimeout(() => {
        if (error.parentNode) {
          error.parentNode.removeChild(error);
        }
      }, 3000);
    },
  };

  // Expose globally
  window.iframeAuthHelper = IFRAME_AUTH_HELPER;

  // Initialize when DOM is ready
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => IFRAME_AUTH_HELPER.init());
  } else {
    IFRAME_AUTH_HELPER.init();
  }
})();
