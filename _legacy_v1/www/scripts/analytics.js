/**
 * Process: Analytics Tracking
 * Purpose: Track user interactions and feature usage for personalized rows
 * Data Source: User actions and feature usage events
 * Update Path: Add new tracking calls throughout the application
 * Dependencies: Console logging, future analytics service integration
 */

(function () {
  'use strict';

  console.log('📊 Analytics module loaded');

  // Simple analytics tracking (can be enhanced with real analytics service later)
  window.analytics = {
    /**
     * Track an event
     * @param {string} event - Event name
     * @param {Object} payload - Event data
     */
    track: function (event, payload = {}) {
      try {
        // Log to console for development
        console.log(`📊 Analytics: ${event}`, payload);

        // Add timestamp
        const eventData = {
          event,
          payload,
          timestamp: new Date().toISOString(),
          userAgent: navigator.userAgent,
          url: window.location.href,
        };

        // Store in localStorage for debugging (remove in production)
        if (typeof Storage !== 'undefined') {
          const analyticsLog = JSON.parse(localStorage.getItem('flicklet_analytics') || '[]');
          analyticsLog.push(eventData);

          // Keep only last 100 events
          if (analyticsLog.length > 100) {
            analyticsLog.splice(0, analyticsLog.length - 100);
          }

          localStorage.setItem('flicklet_analytics', JSON.stringify(analyticsLog));
        }

        // Future: Send to analytics service
        // Example: sendToAnalyticsService(eventData);
      } catch (error) {
        console.error('❌ Analytics tracking failed:', error);
      }
    },

    /**
     * Track page view
     * @param {string} page - Page name
     */
    page: function (page) {
      this.track('page_view', { page });
    },

    /**
     * Track feature usage
     * @param {string} feature - Feature name
     * @param {Object} data - Additional data
     */
    feature: function (feature, data = {}) {
      this.track('feature_used', { feature, ...data });
    },

    /**
     * Track error
     * @param {string} error - Error message
     * @param {Object} context - Error context
     */
    error: function (error, context = {}) {
      this.track('error', { error, context });
    },
  };

  // Track page load
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
      window.analytics.page('home');
    });
  } else {
    window.analytics.page('home');
  }
})();
