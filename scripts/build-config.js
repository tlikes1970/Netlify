// build-config.js - Build script to inject environment variables
const fs = require('fs');
const path = require('path');

// Load environment variables
require('dotenv').config();

// Configuration template
const configTemplate = `// config.js - Secure configuration management
(function() {
  'use strict';
  
  // Environment-based configuration
  const CONFIG = {
    // API Keys - these should be set via environment variables in production
    TMDB_API_KEY: process.env.TMDB_API_KEY || '${process.env.TMDB_API_KEY || 'b7247bb415b50f25b5e35e2566430b96'}',
    FIREBASE_API_KEY: process.env.FIREBASE_API_KEY || '${process.env.FIREBASE_API_KEY || 'AIzaSyDEiqf8cxQJ11URcQeE8jqq5EMa5M6zAXM'}',
    
    // API Endpoints
    TMDB_BASE_URL: 'https://api.themoviedb.org/3',
    TMDB_IMAGE_BASE: 'https://image.tmdb.org/t/p/',
    
    // Firebase Configuration
    FIREBASE_CONFIG: {
      apiKey: process.env.FIREBASE_API_KEY || '${process.env.FIREBASE_API_KEY || 'AIzaSyDEiqf8cxQJ11URcQeE8jqq5EMa5M6zAXM'}',
      authDomain: process.env.FIREBASE_AUTH_DOMAIN || '${process.env.FIREBASE_AUTH_DOMAIN || 'flicklet-71dff.firebaseapp.com'}',
      projectId: process.env.FIREBASE_PROJECT_ID || '${process.env.FIREBASE_PROJECT_ID || 'flicklet-71dff'}',
      storageBucket: process.env.FIREBASE_STORAGE_BUCKET || '${process.env.FIREBASE_STORAGE_BUCKET || 'flicklet-71dff.firebasestorage.app'}',
      messagingSenderId: process.env.FIREBASE_MESSAGING_SENDER_ID || '${process.env.FIREBASE_MESSAGING_SENDER_ID || '1034923556763'}',
      appId: process.env.FIREBASE_APP_ID || '${process.env.FIREBASE_APP_ID || '1:1034923556763:web:bba5489cd1d9412c9c2b3e'}',
      measurementId: process.env.FIREBASE_MEASUREMENT_ID || '${process.env.FIREBASE_MEASUREMENT_ID || 'G-YL4TJ4FHJC'}'
    },
    
    // Security settings
    MAX_INPUT_LENGTH: ${process.env.MAX_INPUT_LENGTH || 1000},
    ALLOWED_HTML_TAGS: ['b', 'i', 'em', 'strong'],
    
    // Rate limiting
    API_RATE_LIMIT: 100, // requests per minute
    CACHE_DURATION: 300000, // 5 minutes in milliseconds
  };
  
  // Input sanitization function
  function sanitizeInput(input) {
    if (typeof input !== 'string') return '';
    
    // Remove potentially dangerous characters
    return input
      .replace(/[<>]/g, '') // Remove < and >
      .replace(/javascript:/gi, '') // Remove javascript: protocol
      .replace(/on\\w+=/gi, '') // Remove event handlers
      .substring(0, CONFIG.MAX_INPUT_LENGTH); // Limit length
  }
  
  // Safe HTML rendering (only allows specific tags)
  function safeHTML(html) {
    if (typeof html !== 'string') return '';
    
    // Create a temporary div to parse HTML
    const temp = document.createElement('div');
    temp.textContent = html; // This escapes all HTML
    
    return temp.innerHTML;
  }
  
  // API key validation
  function validateAPIKey(key) {
    if (!key || typeof key !== 'string') return false;
    if (key.length < 10) return false;
    if (key.includes('undefined') || key.includes('null')) return false;
    return true;
  }
  
  // Expose safe configuration
  window.AppConfig = {
    get: function(key) {
      return CONFIG[key];
    },
    
    getTMDBKey: function() {
      const key = CONFIG.TMDB_API_KEY;
      if (!validateAPIKey(key)) {
        console.error('Invalid TMDB API key');
        return null;
      }
      return key;
    },
    
    getFirebaseConfig: function() {
      return { ...CONFIG.FIREBASE_CONFIG };
    },
    
    sanitizeInput: sanitizeInput,
    safeHTML: safeHTML,
    
    // Development mode check
    isDevelopment: function() {
      return window.location.hostname === 'localhost' || 
             window.location.hostname === '127.0.0.1' ||
             window.location.hostname.includes('netlify.app');
    }
  };
  
  // Log security warnings in development
  if (window.AppConfig.isDevelopment()) {
    console.warn('🔒 SECURITY WARNING: Running in development mode with exposed API keys');
    console.warn('🔒 In production, set environment variables for all API keys');
  }
  
})();`;

// Write the configuration file
const configPath = path.join(__dirname, '..', 'www', 'js', 'config.js');
fs.writeFileSync(configPath, configTemplate);

console.log('✅ Configuration file built successfully');
console.log('🔒 API keys injected from environment variables');








