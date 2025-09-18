/**
 * Main Application Entry Point
 * Purpose: Central entry point for all application modules
 * Data Source: Application requirements
 * Update Path: Add new modules here
 * Dependencies: All application modules
 */

// Import configuration first
import "./js/config.js";

// Import core utilities
import "./js/utils.js";
import "./js/common-utils.js";
import "./js/error-handler.js";
import "./js/dom-cache.js";

// Import authentication
import "./js/auth.js";
import "./js/firebase-init.js";

// Import application modules
import "./js/app.js";
import "./js/bootstrap.js";
import "./js/functions.js";

// Import UI components
import "./js/layout-enhancements.js";
import "./js/visibility-manager.js";
import "./js/language-manager.js";
import "./js/i18n.js";

// Import inline scripts
import "./js/inline-script-1.js";
import "./js/inline-script-2.js";
import "./js/inline-script-3.js";
import "./js/inline-script-4.js";
import "./js/inline-script-5.js";
import "./js/inline-script-6.js";
import "./js/inline-script-7.js";
import "./js/inline-script-8.js";
import "./js/inline-script-9.js";
import "./js/inline-script-10.js";
import "./js/inline-script-11.js";
import "./js/inline-script-12.js";
import "./js/inline-script-13.js";
import "./js/inline-script-14.js";
import "./js/inline-script-15.js";
import "./js/inline-script-16.js";

// Initialize application
console.log("Flicklet TV Tracker v26.0 - Main module loaded");

// Export for global access
window.FlickletApp = {
  version: "26.0",
  initialized: true,
  config: window.Config,
};
