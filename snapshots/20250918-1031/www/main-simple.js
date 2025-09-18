/**
 * Simple Main Application Entry Point
 * Purpose: Basic entry point for essential modules only
 * Data Source: Application requirements
 * Update Path: Add new modules here
 * Dependencies: Essential application modules
 */

// Import configuration first
import "./js/config.js";

// Import core utilities
import "./js/utils.js";
import "./js/common-utils.js";

// Import application modules
import "./js/app.js";

console.log("Flicklet TV Tracker v26.0 - Simple main module loaded");

// Export for global access
window.FlickletApp = {
  version: "26.0",
  initialized: true,
  config: window.Config,
};
