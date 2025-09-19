/**
 * Configuration Management
 * Purpose: Centralized configuration with environment variable support
 * Data Source: Environment variables and fallback defaults
 * Update Path: Modify .env file or environment variables
 * Dependencies: None (standalone configuration)
 */

export class Config {
  constructor() {
    this.config = this.loadConfig();
  }

  loadConfig() {
    // Try to load from environment variables first
    const envConfig = this.loadFromEnvironment();

    // Fallback to default configuration
    const defaultConfig = {
      tmdbApiKey: "",
      firebase: {
        apiKey: "",
        authDomain: "",
        projectId: "",
      },
      google: {
        clientId: "",
      },
      app: {
        version: "27.31",
        name: "Flicklet - TV & Movie Tracker",
      },
    };

    return { ...defaultConfig, ...envConfig };
  }

  loadFromEnvironment() {
    const config = {};

    // Browser environment - try to get from meta tags or window
    if (typeof document !== "undefined") {
      const metaKey = document.querySelector('meta[name="tmdb-api-key"]');
      config.tmdbApiKey = metaKey ? metaKey.getAttribute("content") : "";

      // Try to get from window object if available
      if (window.ENV) {
        config.tmdbApiKey = window.ENV.TMDB_API_KEY || config.tmdbApiKey;
        config.firebase = window.ENV.FIREBASE || config.firebase;
        config.google = window.ENV.GOOGLE || config.google;
      }
    } else if (typeof process !== "undefined" && process.env) {
      // Node.js environment
      config.tmdbApiKey = process.env.TMDB_API_KEY || "";
      config.firebase = {
        apiKey: process.env.FIREBASE_API_KEY || "",
        authDomain: process.env.FIREBASE_AUTH_DOMAIN || "",
        projectId: process.env.FIREBASE_PROJECT_ID || "",
      };
      config.google = {
        clientId: process.env.GOOGLE_CLIENT_ID || "",
      };
    }

    return config;
  }

  get(key) {
    return this.getNestedValue(this.config, key);
  }

  getNestedValue(obj, path) {
    return path.split(".").reduce((current, key) => {
      return current && current[key] !== undefined ? current[key] : undefined;
    }, obj);
  }

  set(key, value) {
    this.setNestedValue(this.config, key, value);
  }

  setNestedValue(obj, path, value) {
    const keys = path.split(".");
    const lastKey = keys.pop();
    const target = keys.reduce((current, key) => {
      if (!current[key]) current[key] = {};
      return current[key];
    }, obj);
    target[lastKey] = value;
  }

  // Validation methods
  validate() {
    const errors = [];

    if (!this.config.tmdbApiKey) {
      errors.push("TMDB API key is required");
    }

    if (this.config.tmdbApiKey && this.config.tmdbApiKey.length < 32) {
      errors.push("TMDB API key appears to be invalid (too short)");
    }

    return {
      isValid: errors.length === 0,
      errors,
    };
  }

  // Get API key with validation
  getApiKey() {
    const validation = this.validate();
    if (!validation.isValid) {
      console.warn("Configuration validation failed:", validation.errors);
      return "";
    }
    return this.config.tmdbApiKey;
  }
}

// Create global instance
const configInstance = new Config();
window.Config = configInstance;

// Export for module systems
export default configInstance;
