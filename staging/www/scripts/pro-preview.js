/**
 * Process: Pro Preview System
 * Purpose: Show read-only previews of Pro features and maintain definitive Pro features list
 * Data Source: Pro gating system, feature flags, settings UI
 * Update Path: Add new Pro features or modify preview behavior in this file
 * Dependencies: Pro gating system, window.FLAGS, settings UI
 */

(function(){
  'use strict';
  
  if (window.ProPreview) return; // Prevent double initialization
  
  console.log('⭐ Initializing Pro preview system...');
  
  // Check if user is Pro
  function isPro() {
    return localStorage.getItem('flicklet:pro') === '1';
  }
  
  // Pro features list - single source of truth
  const PRO_FEATURES = {
    'export-csv': {
      name: 'CSV Export',
      description: 'Export your lists to CSV format for use in spreadsheets',
      icon: '📊',
      category: 'Data Management'
    },
    'extra-trivia': {
      name: 'Extra Trivia',
      description: 'Access additional trivia questions and behind-the-scenes content',
      icon: '🧠',
      category: 'Entertainment'
    },
    'advanced-notifications': {
      name: 'Advanced Notifications',
      description: 'Customizable episode notifications with advanced scheduling',
      icon: '🔔',
      category: 'Notifications'
    },
    'theme-packs': {
      name: 'Theme Packs',
      description: 'Access to premium theme packs and customization options',
      icon: '🎨',
      category: 'Customization'
    },
    'providers': {
      name: 'Where to Watch',
      description: 'See where to stream or buy your shows and movies',
      icon: '📺',
      category: 'Discovery'
    },
    'extras': {
      name: 'Extras & Outtakes',
      description: 'Access to behind-the-scenes content and extras',
      icon: '🎬',
      category: 'Entertainment'
    },
    'playlists': {
      name: 'Curated Playlists',
      description: 'Access to curated video playlists and spotlights',
      icon: '📋',
      category: 'Discovery'
    },
    'stats': {
      name: 'Advanced Statistics',
      description: 'Detailed viewing statistics and analytics',
      icon: '📈',
      category: 'Analytics'
    }
  };
  
  // Show Pro preview modal
  function showProPreview() {
    console.log('⭐ Showing Pro preview...');
    
    const modal = document.createElement('div');
    modal.className = 'modal-backdrop';
    modal.style.cssText = `
      position: fixed;
      top: 0;
      left: 0;
      width: 100%;
      height: 100%;
      background: rgba(0,0,0,0.7);
      z-index: 10000;
      display: flex;
      align-items: center;
      justify-content: center;
      padding: 20px;
      box-sizing: border-box;
    `;
    
    const modalContent = document.createElement('div');
    modalContent.className = 'modal';
    modalContent.style.cssText = `
      background: var(--color-surface, #fff);
      border-radius: 16px;
      padding: 32px;
      max-width: 600px;
      width: 100%;
      max-height: 80vh;
      overflow-y: auto;
      box-shadow: 0 20px 60px rgba(0,0,0,0.3);
      color: var(--color-text, #333);
    `;
    
    // Group features by category
    const featuresByCategory = {};
    Object.entries(PRO_FEATURES).forEach(([key, feature]) => {
      if (!featuresByCategory[feature.category]) {
        featuresByCategory[feature.category] = [];
      }
      featuresByCategory[feature.category].push({ key, ...feature });
    });
    
    // Generate features HTML
    const featuresHTML = Object.entries(featuresByCategory).map(([category, features]) => `
      <div class="pro-category" style="margin-bottom: 24px;">
        <h3 style="margin: 0 0 16px 0; color: var(--color-primary, #007bff); font-size: 18px; font-weight: 600;">
          ${category}
        </h3>
        <div class="pro-features-grid" style="display: grid; gap: 12px;">
          ${features.map(feature => `
            <div class="pro-feature-item" style="
              display: flex;
              align-items: center;
              gap: 12px;
              padding: 12px;
              background: var(--color-surface-secondary, #f8f9fa);
              border-radius: 8px;
              border: 1px solid var(--color-border, #e9ecef);
            ">
              <span style="font-size: 24px;">${feature.icon}</span>
              <div style="flex: 1;">
                <div style="font-weight: 600; margin-bottom: 4px;">${feature.name}</div>
                <div style="font-size: 14px; color: var(--color-text-secondary, #666);">
                  ${feature.description}
                </div>
              </div>
              <div style="
                padding: 4px 8px;
                background: var(--color-primary, #007bff);
                color: white;
                border-radius: 4px;
                font-size: 12px;
                font-weight: 600;
              ">
                PRO
              </div>
            </div>
          `).join('')}
        </div>
      </div>
    `).join('');
    
    modalContent.innerHTML = `
      <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 24px;">
        <h2 style="margin: 0; color: var(--color-primary, #007bff); font-size: 24px; font-weight: 700;">
          ⭐ Pro Features Preview
        </h2>
        <button id="closeProPreview" style="
          background: none;
          border: none;
          font-size: 24px;
          cursor: pointer;
          color: var(--color-text-secondary, #666);
          padding: 4px;
          border-radius: 4px;
        ">×</button>
      </div>
      
      <p style="margin: 0 0 24px 0; color: var(--color-text-secondary, #666); line-height: 1.5;">
        Unlock advanced features and premium content with Flicklet Pro. 
        Here's what you'll get access to:
      </p>
      
      ${featuresHTML}
      
      <div style="
        margin-top: 32px;
        padding: 20px;
        background: var(--color-primary-light, #e3f2fd);
        border-radius: 8px;
        text-align: center;
      ">
        <h3 style="margin: 0 0 12px 0; color: var(--color-primary, #007bff);">
          Ready to upgrade?
        </h3>
        <p style="margin: 0 0 16px 0; color: var(--color-text-secondary, #666);">
          Pro features are coming soon! Stay tuned for the launch.
        </p>
        <button id="upgradeToPro" style="
          background: var(--color-primary, #007bff);
          color: white;
          border: none;
          padding: 12px 24px;
          border-radius: 8px;
          font-size: 16px;
          font-weight: 600;
          cursor: pointer;
          transition: background 0.2s ease;
        " onmouseover="this.style.background='var(--color-primary-dark, #0056b3)'" 
           onmouseout="this.style.background='var(--color-primary, #007bff)'">
          Get Notified When Pro Launches
        </button>
      </div>
    `;
    
    modal.appendChild(modalContent);
    document.body.appendChild(modal);
    
    // Add event listeners
    document.getElementById('closeProPreview').addEventListener('click', () => {
      document.body.removeChild(modal);
    });
    
    document.getElementById('upgradeToPro').addEventListener('click', () => {
      if (window.showNotification) {
        window.showNotification('Thanks! We\'ll notify you when Pro launches.', 'success');
      }
      document.body.removeChild(modal);
    });
    
    // Close on backdrop click
    modal.addEventListener('click', (e) => {
      if (e.target === modal) {
        document.body.removeChild(modal);
      }
    });
    
    // Close on Escape key
    const handleEscape = (e) => {
      if (e.key === 'Escape') {
        document.body.removeChild(modal);
        document.removeEventListener('keydown', handleEscape);
      }
    };
    document.addEventListener('keydown', handleEscape);
  }
  
  // Show read-only preview for a specific Pro feature
  function showFeaturePreview(featureKey) {
    const feature = PRO_FEATURES[featureKey];
    if (!feature) {
      console.warn('⭐ Unknown Pro feature:', featureKey);
      return;
    }
    
    console.log('⭐ Showing preview for feature:', feature.name);
    
    if (window.showNotification) {
      window.showNotification(`${feature.name} is a Pro feature. ${feature.description}`, 'info');
    }
  }
  
  // Enhance existing Pro gating to show previews
  function enhanceProGating() {
    // Find all Pro-gated elements
    const gatedElements = document.querySelectorAll('[data-pro="required"]');
    
    gatedElements.forEach(element => {
      // Add preview functionality
      element.addEventListener('click', (e) => {
        if (!isPro()) {
          e.preventDefault();
          e.stopPropagation();
          
          const featureKey = element.getAttribute('data-pro-feature');
          if (featureKey) {
            showFeaturePreview(featureKey);
          } else {
            showProPreview();
          }
        }
      });
      
      // Add preview indicator
      if (!isPro()) {
        const previewIndicator = document.createElement('div');
        previewIndicator.className = 'pro-preview-indicator';
        previewIndicator.style.cssText = `
          position: absolute;
          top: -8px;
          right: -8px;
          background: var(--color-primary, #007bff);
          color: white;
          font-size: 10px;
          font-weight: 600;
          padding: 2px 6px;
          border-radius: 10px;
          z-index: 10;
        `;
        previewIndicator.textContent = 'PREVIEW';
        
        // Make sure parent is positioned
        const parent = element.parentElement;
        if (parent && getComputedStyle(parent).position === 'static') {
          parent.style.position = 'relative';
        }
        
        parent?.appendChild(previewIndicator);
      }
    });
  }
  
  // Update Pro features list in settings
  function updateProFeaturesList() {
    const proFeaturesList = document.getElementById('proFeaturesList');
    if (!proFeaturesList) return;
    
    const featuresHTML = Object.entries(PRO_FEATURES).map(([key, feature]) => `
      <div class="pro-feature-item" style="
        display: flex;
        align-items: center;
        gap: 12px;
        padding: 12px;
        margin-bottom: 8px;
        background: var(--color-surface-secondary, #f8f9fa);
        border-radius: 8px;
        border: 1px solid var(--color-border, #e9ecef);
      ">
        <span style="font-size: 20px;">${feature.icon}</span>
        <div style="flex: 1;">
          <div style="font-weight: 600; margin-bottom: 4px;">${feature.name}</div>
          <div style="font-size: 14px; color: var(--color-text-secondary, #666);">
            ${feature.description}
          </div>
        </div>
        <div style="
          padding: 4px 8px;
          background: var(--color-primary, #007bff);
          color: white;
          border-radius: 4px;
          font-size: 12px;
          font-weight: 600;
        ">
          PRO
        </div>
      </div>
    `).join('');
    
    proFeaturesList.innerHTML = featuresHTML;
  }
  
  // Public API
  window.ProPreview = {
    showPreview: showProPreview,
    showFeaturePreview: showFeaturePreview,
    getFeatures: () => PRO_FEATURES,
    isPro: isPro
  };
  
  // Initialize when DOM is ready
  function init() {
    enhanceProGating();
    updateProFeaturesList();
    
    // Bind preview button if it exists
    const previewBtn = document.getElementById('previewProBtn');
    if (previewBtn) {
      previewBtn.addEventListener('click', showProPreview);
    }
    
    console.log('⭐ Pro preview system initialized');
  }
  
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
  
})();
