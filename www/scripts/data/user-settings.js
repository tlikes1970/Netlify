/**
 * Process: User Settings Data Management
 * Purpose: Manage personalized row selections and other user preferences
 * Data Source: localStorage with fallback to appData
 * Update Path: setMyRows() function and localStorage persistence
 * Dependencies: appData, localStorage, i18n
 */

(function() {
  'use strict';

  console.log('⚙️ User Settings data module loaded');

  /**
   * Get the user's personalized row selections
   * @returns {Array} Array of 2 items: [slot0, slot1] or [null, null] if not set
   */
  window.getMyRows = function getMyRows() {
    try {
      const raw = localStorage.getItem('my_rows');
      if (!raw) return [null, null];
      
      const parsed = JSON.parse(raw);
      // Normalize: always return exactly 2 slots
      return [
        parsed[0] || null,
        parsed[1] || null
      ];
    } catch (e) {
      console.error('[getMyRows] failed:', e);
      return [null, null];
    }
  };

  /**
   * Set the user's personalized row selections
   * @param {Array} rows - Array of row objects or null values
   */
  window.setMyRows = function setMyRows(rows) {
    try {
      // Normalize: always store exactly 2 slots
      const normalized = [
        rows[0] || null,
        rows[1] || null
      ];
      
      localStorage.setItem('my_rows', JSON.stringify(normalized));
      console.log('✅ My rows saved:', normalized);
      
      // Also sync to appData if available
      if (window.appData && window.appData.settings) {
        window.appData.settings.myRows = normalized;
        if (window.saveAppData) {
          window.saveAppData();
        }
      }
      
      return true;
    } catch (e) {
      console.error('[setMyRows] failed:', e);
      return false;
    }
  };

  /**
   * Clear all personalized row selections
   */
  window.clearMyRows = function clearMyRows() {
    return window.setMyRows([null, null]);
  };

})();
