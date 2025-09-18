/**
 * Process: Enhanced Share System
 * Purpose: Generate shareable links and improve copy-to-clipboard functionality
 * Data Source: window.appData for list data, URL generation for sharing
 * Update Path: Modify share format or add new sharing methods in this file
 * Dependencies: navigator.clipboard, window.appData, URL encoding
 */

(function(){
  'use strict';
  
  if (window.ShareEnhanced) return; // Prevent double initialization
  
  console.log('🔗 Initializing enhanced share system...');
  
  // Generate shareable URL for selected items
  function generateShareableURL(selectedItems) {
    try {
      // Create a compressed data structure
      const shareData = {
        v: '1.0', // version
        t: Date.now(), // timestamp
        items: selectedItems
      };
      
      // Compress the data
      const jsonString = JSON.stringify(shareData);
      const compressed = btoa(unescape(encodeURIComponent(jsonString)));
      
      // Create shareable URL
      const baseUrl = window.location.origin + window.location.pathname;
      const shareUrl = `${baseUrl}?share=${compressed}`;
      
      return shareUrl;
    } catch (error) {
      console.error('🔗 Failed to generate shareable URL:', error);
      return null;
    }
  }
  
  // Parse shareable URL
  function parseShareableURL() {
    try {
      const urlParams = new URLSearchParams(window.location.search);
      const shareData = urlParams.get('share');
      
      if (!shareData) return null;
      
      const jsonString = decodeURIComponent(escape(atob(shareData)));
      const data = JSON.parse(jsonString);
      
      return data;
    } catch (error) {
      console.error('🔗 Failed to parse shareable URL:', error);
      return null;
    }
  }
  
  // Generate share text with URL
  function generateShareText(selectedItems, includeUrl = true) {
    let shareText = "📺 My TV & Movie Lists\n\n";
    
    // Add items by list with clear headers
    if (selectedItems.watching.length > 0) {
      shareText += "🔴 Currently Watching:\n";
      selectedItems.watching.forEach(item => {
        const network = item.networks?.[0] || "Unknown Service";
        shareText += `  • ${item.title} (${network})\n`;
      });
      shareText += "\n";
    }
    
    if (selectedItems.wishlist.length > 0) {
      shareText += "🟡 Want to Watch:\n";
      selectedItems.wishlist.forEach(item => {
        const network = item.networks?.[0] || "Unknown Service";
        shareText += `  • ${item.title} (${network})\n`;
      });
      shareText += "\n";
    }
    
    if (selectedItems.watched.length > 0) {
      shareText += "🟢 Already Watched:\n";
      selectedItems.watched.forEach(item => {
        const network = item.networks?.[0] || "Unknown Service";
        shareText += `  • ${item.title} (${network})\n`;
      });
      shareText += "\n";
    }
    
    if (includeUrl) {
      const shareUrl = generateShareableURL(selectedItems);
      if (shareUrl) {
        shareText += `\n🔗 View this list online: ${shareUrl}`;
      }
    }
    
    return shareText;
  }
  
  // Copy to clipboard with fallback
  function copyToClipboard(text) {
    return new Promise((resolve, reject) => {
      if (navigator.clipboard && window.isSecureContext) {
        // Modern clipboard API
        navigator.clipboard.writeText(text).then(() => {
          resolve(true);
        }).catch(err => {
          console.warn('🔗 Clipboard API failed, trying fallback:', err);
          fallbackCopyToClipboard(text) ? resolve(true) : reject(err);
        });
      } else {
        // Fallback for older browsers or non-secure contexts
        fallbackCopyToClipboard(text) ? resolve(true) : reject(new Error('Copy failed'));
      }
    });
  }
  
  // Fallback copy method
  function fallbackCopyToClipboard(text) {
    try {
      const textArea = document.createElement('textarea');
      textArea.value = text;
      textArea.style.position = 'fixed';
      textArea.style.left = '-999999px';
      textArea.style.top = '-999999px';
      document.body.appendChild(textArea);
      textArea.focus();
      textArea.select();
      
      const successful = document.execCommand('copy');
      document.body.removeChild(textArea);
      
      return successful;
    } catch (err) {
      console.error('🔗 Fallback copy failed:', err);
      return false;
    }
  }
  
  // Enhanced copy function
  function copyShareList(selectedItems, includeUrl = true) {
    console.log('🔗 Copying share list...');
    
    if (!selectedItems || Object.values(selectedItems).every(arr => arr.length === 0)) {
      if (window.showNotification) {
        window.showNotification('No items selected to share', 'warning');
      }
      return Promise.reject(new Error('No items selected'));
    }
    
    const shareText = generateShareText(selectedItems, includeUrl);
    
    return copyToClipboard(shareText).then(() => {
      console.log('🔗 Share text copied to clipboard');
      
      if (window.showNotification) {
        window.showNotification('List copied to clipboard!', 'success');
      }
      
      return shareText;
    }).catch(err => {
      console.error('🔗 Failed to copy:', err);
      
      if (window.showNotification) {
        window.showNotification('Failed to copy list. Please try again.', 'error');
      }
      
      throw err;
    });
  }
  
  // Generate shareable link
  function generateShareableLink(selectedItems) {
    console.log('🔗 Generating shareable link...');
    
    if (!selectedItems || Object.values(selectedItems).every(arr => arr.length === 0)) {
      if (window.showNotification) {
        window.showNotification('No items selected to share', 'warning');
      }
      return null;
    }
    
    const shareUrl = generateShareableURL(selectedItems);
    
    if (shareUrl) {
      // Copy URL to clipboard
      copyToClipboard(shareUrl).then(() => {
        if (window.showNotification) {
          window.showNotification('Shareable link copied to clipboard!', 'success');
        }
      }).catch(err => {
        console.error('🔗 Failed to copy URL:', err);
        if (window.showNotification) {
          window.showNotification('Link generated but failed to copy. Check the text area.', 'info');
        }
      });
    }
    
    return shareUrl;
  }
  
  // Load shared list
  function loadSharedList() {
    const shareData = parseShareableURL();
    
    if (!shareData) return false;
    
    console.log('🔗 Loading shared list:', shareData);
    
    // Show shared list in a modal or dedicated view
    if (window.showNotification) {
      window.showNotification(`Loading shared list with ${Object.values(shareData.items || {}).flat().length} items...`, 'info');
    }
    
    // You could implement a shared list viewer here
    // For now, just show the data in console
    console.log('🔗 Shared list data:', shareData);
    
    return true;
  }
  
  // Public API
  window.ShareEnhanced = {
    generateShareText: generateShareText,
    generateShareableLink: generateShareableLink,
    copyShareList: copyShareList,
    copyToClipboard: copyToClipboard,
    loadSharedList: loadSharedList,
    parseShareableURL: parseShareableURL
  };
  
  // Auto-load shared list on page load
  if (window.location.search.includes('share=')) {
    loadSharedList();
  }
  
  console.log('🔗 Enhanced share system initialized');
  
})();
