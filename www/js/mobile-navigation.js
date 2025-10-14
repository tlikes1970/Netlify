/**
 * Mobile Navigation Module
 * Handles bottom navigation bar functionality and synchronization with main tab system
 */

(function() {
  'use strict';

  console.log('📱 Mobile Navigation module loaded');

  // Tab mapping between top and bottom navigation
  const tabMapping = {
    'homeTab': 'bottomHomeTab',
    'watchingTab': 'bottomWatchingTab', 
    'wishlistTab': 'bottomWishlistTab',
    'watchedTab': 'bottomWatchedTab',
    'discoverTab': 'bottomDiscoverTab'
  };

  const reverseTabMapping = {
    'bottomHomeTab': 'homeTab',
    'bottomWatchingTab': 'watchingTab',
    'bottomWishlistTab': 'wishlistTab', 
    'bottomWatchedTab': 'watchedTab',
    'bottomDiscoverTab': 'discoverTab'
  };

  // Badge mapping for count synchronization
  const badgeMapping = {
    'watchingBadge': 'bottomWatchingBadge',
    'wishlistBadge': 'bottomWishlistBadge',
    'watchedBadge': 'bottomWatchedBadge'
  };

  /**
   * Initialize mobile navigation
   */
  function initMobileNavigation() {
    console.log('📱 Initializing mobile navigation...');

    // Show/hide bottom nav based on screen size
    updateNavigationVisibility();
    
    // Add event listeners for bottom nav tabs
    addBottomNavListeners();
    
    // Sync badge counts
    syncBadgeCounts();
    
    // Listen for window resize to toggle navigation
    window.addEventListener('resize', updateNavigationVisibility);
    
    // Listen for tab changes to sync bottom nav
    document.addEventListener('tab:switched', syncBottomNavigation);
    
    console.log('📱 Mobile navigation initialized');
  }

  /**
   * Update navigation visibility based on screen size
   */
  function updateNavigationVisibility() {
    const isMobile = window.innerWidth <= 768;
    const bottomNav = document.getElementById('bottomNavigation');
    const topNav = document.getElementById('navigation');
    
    if (bottomNav && topNav) {
      if (isMobile) {
        bottomNav.hidden = false;
        topNav.style.display = 'none';
        console.log('📱 Showing bottom navigation for mobile');
      } else {
        bottomNav.hidden = true;
        topNav.style.display = '';
        console.log('📱 Showing top navigation for desktop');
      }
    }
  }

  /**
   * Add event listeners to bottom navigation tabs
   */
  function addBottomNavListeners() {
    Object.entries(reverseTabMapping).forEach(([bottomTabId, topTabId]) => {
      const bottomTab = document.getElementById(bottomTabId);
      if (bottomTab) {
        bottomTab.addEventListener('click', (e) => {
          e.preventDefault();
          console.log(`📱 Bottom nav clicked: ${bottomTabId} -> ${topTabId}`);
          
          // Add haptic feedback if available
          addHapticFeedback();
          
          // Add visual feedback
          addVisualFeedback(bottomTab);
          
          // Trigger the main tab system
          if (window.FlickletApp && window.FlickletApp.switchToTab) {
            const tabName = topTabId.replace('Tab', '');
            window.FlickletApp.switchToTab(tabName);
          }
        });
      }
    });
  }

  /**
   * Add haptic feedback for mobile devices
   */
  function addHapticFeedback() {
    // Check if haptic feedback is available
    if ('vibrate' in navigator) {
      navigator.vibrate(50); // Short vibration
    }
    
    // Check for newer haptic API
    if ('haptics' in navigator) {
      navigator.haptics.vibrate({ duration: 50 });
    }
  }

  /**
   * Add visual feedback for tab clicks
   */
  function addVisualFeedback(tab) {
    // Add ripple effect
    const ripple = document.createElement('div');
    ripple.style.cssText = `
      position: absolute;
      top: 50%;
      left: 50%;
      width: 0;
      height: 0;
      background: rgba(59, 130, 246, 0.3);
      border-radius: 50%;
      transform: translate(-50%, -50%);
      animation: ripple 0.6s ease-out;
      pointer-events: none;
      z-index: 1;
    `;
    
    tab.style.position = 'relative';
    tab.appendChild(ripple);
    
    // Remove ripple after animation
    setTimeout(() => {
      if (ripple.parentNode) {
        ripple.parentNode.removeChild(ripple);
      }
    }, 600);
  }

  /**
   * Sync bottom navigation with main tab system
   */
  function syncBottomNavigation(event) {
    const activeTab = event.detail?.activeTab;
    if (!activeTab) return;

    console.log(`📱 Syncing bottom nav for active tab: ${activeTab}`);

    // Update bottom nav active state
    Object.entries(tabMapping).forEach(([topTabId, bottomTabId]) => {
      const topTab = document.getElementById(topTabId);
      const bottomTab = document.getElementById(bottomTabId);
      
      if (topTab && bottomTab) {
        const isActive = topTab.classList.contains('is-active');
        
        if (isActive) {
          bottomTab.classList.add('is-active');
          bottomTab.setAttribute('aria-selected', 'true');
          bottomTab.setAttribute('tabindex', '0');
        } else {
          bottomTab.classList.remove('is-active');
          bottomTab.setAttribute('aria-selected', 'false');
          bottomTab.setAttribute('tabindex', '-1');
        }
      }
    });
  }

  /**
   * Sync badge counts between top and bottom navigation
   */
  function syncBadgeCounts() {
    Object.entries(badgeMapping).forEach(([topBadgeId, bottomBadgeId]) => {
      const topBadge = document.getElementById(topBadgeId);
      const bottomBadge = document.getElementById(bottomBadgeId);
      
      if (topBadge && bottomBadge) {
        // Copy count from top badge to bottom badge
        bottomBadge.textContent = topBadge.textContent;
        
        // Set up observer to sync future changes
        const observer = new MutationObserver((mutations) => {
          mutations.forEach((mutation) => {
            if (mutation.type === 'childList' || mutation.type === 'characterData') {
              bottomBadge.textContent = topBadge.textContent;
            }
          });
        });
        
        observer.observe(topBadge, {
          childList: true,
          characterData: true,
          subtree: true
        });
      }
    });
  }

  /**
   * Add swipe gesture support for tab navigation
   */
  function addSwipeGestures() {
    let startX = 0;
    let startY = 0;
    let isSwipeGesture = false;

    document.addEventListener('touchstart', (e) => {
      startX = e.touches[0].clientX;
      startY = e.touches[0].clientY;
      isSwipeGesture = false;
    }, { passive: true });

    document.addEventListener('touchmove', (e) => {
      if (!startX || !startY) return;
      
      const currentX = e.touches[0].clientX;
      const currentY = e.touches[0].clientY;
      const diffX = startX - currentX;
      const diffY = startY - currentY;
      
      // Determine if this is a horizontal swipe
      if (Math.abs(diffX) > Math.abs(diffY) && Math.abs(diffX) > 50) {
        isSwipeGesture = true;
        e.preventDefault(); // Prevent scrolling during swipe
      }
    }, { passive: false });

    document.addEventListener('touchend', (e) => {
      if (!startX || !startY || !isSwipeGesture) return;
      
      const endX = e.changedTouches[0].clientX;
      const endY = e.changedTouches[0].clientY;
      const diffX = startX - endX;
      const diffY = startY - endY;
      
      // Only process horizontal swipes
      if (Math.abs(diffX) > Math.abs(diffY) && Math.abs(diffX) > 50) {
        console.log(`📱 Swipe detected: ${diffX > 0 ? 'left' : 'right'}`);
        
        if (window.FlickletApp && window.FlickletApp.switchToTab) {
          const currentTab = getCurrentActiveTab();
          const nextTab = getNextTab(currentTab, diffX > 0);
          
          if (nextTab) {
            console.log(`📱 Switching from ${currentTab} to ${nextTab}`);
            window.FlickletApp.switchToTab(nextTab);
          }
        }
      }
      
      // Reset values
      startX = 0;
      startY = 0;
      isSwipeGesture = false;
    }, { passive: true });
  }

  /**
   * Get the currently active tab
   */
  function getCurrentActiveTab() {
    const activeTab = document.querySelector('.tab.is-active');
    if (activeTab) {
      const tabId = activeTab.id;
      return tabId.replace('Tab', '');
    }
    return 'home';
  }

  /**
   * Get the next tab in the sequence
   */
  function getNextTab(currentTab, isLeftSwipe) {
    const tabOrder = ['home', 'watching', 'wishlist', 'watched', 'discover'];
    const currentIndex = tabOrder.indexOf(currentTab);
    
    if (currentIndex === -1) return null;
    
    let nextIndex;
    if (isLeftSwipe) {
      // Swipe left = next tab
      nextIndex = (currentIndex + 1) % tabOrder.length;
    } else {
      // Swipe right = previous tab
      nextIndex = (currentIndex - 1 + tabOrder.length) % tabOrder.length;
    }
    
    return tabOrder[nextIndex];
  }

  // Initialize when DOM is ready
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initMobileNavigation);
  } else {
    initMobileNavigation();
  }

  // Add swipe gestures after a short delay to ensure other modules are loaded
  setTimeout(addSwipeGestures, 1000);

  // Export for testing
  window.MobileNavigation = {
    init: initMobileNavigation,
    syncBottomNavigation,
    syncBadgeCounts,
    updateNavigationVisibility,
    addHapticFeedback,
    addVisualFeedback,
    getCurrentActiveTab,
    getNextTab,
    // Testing utilities
    testBottomNav: function() {
      console.log('📱 Testing bottom navigation...');
      const bottomNav = document.getElementById('bottomNavigation');
      const isMobile = window.innerWidth <= 768;
      
      console.log('📱 Screen width:', window.innerWidth);
      console.log('📱 Is mobile:', isMobile);
      console.log('📱 Bottom nav exists:', !!bottomNav);
      console.log('📱 Bottom nav visible:', bottomNav && !bottomNav.hidden);
      
      if (bottomNav) {
        const tabs = bottomNav.querySelectorAll('.bottom-tab');
        console.log('📱 Bottom tabs found:', tabs.length);
        
        tabs.forEach((tab, index) => {
          const isActive = tab.classList.contains('is-active');
          const tabId = tab.id;
          console.log(`📱 Tab ${index + 1}: ${tabId}, active: ${isActive}`);
        });
      }
      
      return {
        isMobile,
        bottomNavExists: !!bottomNav,
        bottomNavVisible: bottomNav && !bottomNav.hidden,
        tabCount: bottomNav ? bottomNav.querySelectorAll('.bottom-tab').length : 0
      };
    }
  };

})();
