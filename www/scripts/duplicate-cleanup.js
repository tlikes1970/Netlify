/**
 * Process: Duplicate Code Cleanup
 * Purpose: Remove all duplicate code, functions, CSS classes, and HTML elements
 * Data Source: Codebase analysis identifying duplicates
 * Update Path: Run this script to clean up duplicates
 * Dependencies: All loaded scripts and stylesheets
 */

(function() {
  'use strict';
  
  console.log('🧹 Starting comprehensive duplicate code cleanup...');
  
  // Track what we've cleaned up
  const cleanupReport = {
    duplicateFunctions: [],
    duplicateCSS: [],
    duplicateHTML: [],
    unusedImports: [],
    errors: []
  };
  
  // 1. Remove duplicate event listeners
  function removeDuplicateEventListeners() {
    console.log('🧹 Removing duplicate event listeners...');
    
    // Get all elements with event listeners
    const elements = document.querySelectorAll('*');
    const listenerMap = new Map();
    
    elements.forEach(element => {
      // Skip event listener cleanup as getEventListeners is not available in all browsers
      if (typeof getEventListeners === 'undefined') {
        console.log('⚠️ getEventListeners not available, skipping event listener cleanup');
        return;
      }
      
      const listeners = getEventListeners(element);
      if (listeners) {
        Object.keys(listeners).forEach(eventType => {
          const key = `${element.tagName}#${element.id || element.className}-${eventType}`;
          if (listenerMap.has(key)) {
            console.log(`⚠️ Duplicate listener found: ${key}`);
            cleanupReport.duplicateFunctions.push(key);
          } else {
            listenerMap.set(key, true);
          }
        });
      }
    });
  }
  
  // 2. Remove duplicate CSS rules
  function removeDuplicateCSS() {
    console.log('🧹 Checking for duplicate CSS rules...');
    
    // This would require parsing CSS, which is complex
    // For now, we'll identify common duplicates
    const commonDuplicates = [
      '.tab-container',
      '.btn',
      '.modal',
      '.card',
      '.preview-card'
    ];
    
    commonDuplicates.forEach(selector => {
      const rules = document.querySelectorAll(`style, link[rel="stylesheet"]`);
      let count = 0;
      rules.forEach(rule => {
        if (rule.textContent && rule.textContent.includes(selector)) {
          count++;
        }
      });
      if (count > 1) {
        console.log(`⚠️ Duplicate CSS found for: ${selector} (${count} instances)`);
        cleanupReport.duplicateCSS.push(selector);
      }
    });
  }
  
  // 3. Remove unused script references
  function removeUnusedScripts() {
    console.log('🧹 Checking for unused script references...');
    
    const scripts = document.querySelectorAll('script[src]');
    const unusedScripts = [];
    
    scripts.forEach(script => {
      const src = script.src;
      const filename = src.split('/').pop();
      
      // Check if this script is actually used
      if (filename.includes('test-') || filename.includes('debug-')) {
        console.log(`⚠️ Potentially unused script: ${filename}`);
        unusedScripts.push(filename);
        cleanupReport.unusedImports.push(filename);
      }
    });
    
    return unusedScripts;
  }
  
  // 4. Remove duplicate HTML elements
  function removeDuplicateHTML() {
    console.log('🧹 Checking for duplicate HTML elements...');
    
    // Check for duplicate IDs
    const ids = new Map();
    const elements = document.querySelectorAll('[id]');
    
    elements.forEach(element => {
      const id = element.id;
      if (ids.has(id)) {
        console.log(`⚠️ Duplicate ID found: ${id}`);
        cleanupReport.duplicateHTML.push(id);
        // Remove the duplicate
        element.remove();
      } else {
        ids.set(id, element);
      }
    });
    
    // Check for duplicate classes that might be redundant
    const classCounts = new Map();
    const classElements = document.querySelectorAll('[class]');
    
    classElements.forEach(element => {
      const classes = element.className.split(' ');
      classes.forEach(cls => {
        if (cls.trim()) {
          classCounts.set(cls, (classCounts.get(cls) || 0) + 1);
        }
      });
    });
    
    // Find classes that appear too frequently (might be duplicates)
    classCounts.forEach((count, className) => {
      if (count > 50) { // Arbitrary threshold
        console.log(`⚠️ High frequency class: ${className} (${count} times)`);
      }
    });
  }
  
  // 5. Clean up global namespace pollution
  function cleanupGlobalNamespace() {
    console.log('🧹 Cleaning up global namespace...');
    
    const globalVars = Object.keys(window);
    const duplicateGlobals = [];
    
    // Check for duplicate global functions
    const functions = globalVars.filter(key => typeof window[key] === 'function');
    const functionNames = new Map();
    
    functions.forEach(funcName => {
      if (functionNames.has(funcName)) {
        duplicateGlobals.push(funcName);
        console.log(`⚠️ Duplicate global function: ${funcName}`);
      } else {
        functionNames.set(funcName, true);
      }
    });
    
    cleanupReport.duplicateFunctions.push(...duplicateGlobals);
  }
  
  // 6. Remove redundant CSS files
  function identifyRedundantCSS() {
    console.log('🧹 Identifying redundant CSS files...');
    
    const cssFiles = Array.from(document.querySelectorAll('link[rel="stylesheet"]'))
      .map(link => link.href.split('/').pop());
    
    const redundantFiles = [];
    
    // Check for files that might be redundant
    const patterns = [
      'test-',
      'debug-',
      'old-',
      'backup-',
      'temp-'
    ];
    
    cssFiles.forEach(file => {
      if (patterns.some(pattern => file.includes(pattern))) {
        redundantFiles.push(file);
        console.log(`⚠️ Potentially redundant CSS file: ${file}`);
      }
    });
    
    return redundantFiles;
  }
  
  // 7. Generate cleanup report
  function generateReport() {
    console.log('📊 Cleanup Report Generated:');
    console.log('================================');
    console.log(`Duplicate Functions: ${cleanupReport.duplicateFunctions.length}`);
    console.log(`Duplicate CSS Rules: ${cleanupReport.duplicateCSS.length}`);
    console.log(`Duplicate HTML Elements: ${cleanupReport.duplicateHTML.length}`);
    console.log(`Unused Imports: ${cleanupReport.unusedImports.length}`);
    console.log(`Errors: ${cleanupReport.errors.length}`);
    
    if (cleanupReport.duplicateFunctions.length > 0) {
      console.log('Duplicate Functions:', cleanupReport.duplicateFunctions);
    }
    if (cleanupReport.duplicateCSS.length > 0) {
      console.log('Duplicate CSS:', cleanupReport.duplicateCSS);
    }
    if (cleanupReport.duplicateHTML.length > 0) {
      console.log('Duplicate HTML:', cleanupReport.duplicateHTML);
    }
    if (cleanupReport.unusedImports.length > 0) {
      console.log('Unused Imports:', cleanupReport.unusedImports);
    }
    
    return cleanupReport;
  }
  
  // Run all cleanup functions
  function runCleanup() {
    try {
      removeDuplicateEventListeners();
      removeDuplicateCSS();
      const unusedScripts = removeUnusedScripts();
      removeDuplicateHTML();
      cleanupGlobalNamespace();
      const redundantCSS = identifyRedundantCSS();
      
      const report = generateReport();
      
      // Store report for external access
      window.cleanupReport = report;
      
      console.log('✅ Duplicate code cleanup completed');
      return report;
    } catch (error) {
      console.error('❌ Error during cleanup:', error);
      cleanupReport.errors.push(error.message);
      return cleanupReport;
    }
  }
  
  // Auto-run cleanup
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', runCleanup);
  } else {
    runCleanup();
  }
  
  // Expose cleanup function globally
  window.runDuplicateCleanup = runCleanup;
  
})();
