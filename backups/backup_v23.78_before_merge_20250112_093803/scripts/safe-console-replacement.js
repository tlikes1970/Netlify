/* ============== Safe Console Log Replacement Script ==============
   This script safely replaces console.log statements with FlickletDebug
   while preserving all functionality and maintaining error handling
*/

(function() {
  'use strict';
  
  // Files to process (in order of importance)
  const filesToProcess = [
    'www/js/app.js',
    'www/js/functions.js', 
    'www/scripts/inline-script-02.js',
    'www/scripts/inline-script-03.js',
    'www/scripts/curated-rows.js',
    'www/scripts/community-spotlight.js'
  ];
  
  // Replacement patterns - these are safe and maintain functionality
  const replacements = [
    // Keep error logs as errors (critical)
    {
      pattern: /console\.error\(/g,
      replacement: 'FlickletDebug.error('
    },
    // Keep warn logs as warnings (important)
    {
      pattern: /console\.warn\(/g,
      replacement: 'FlickletDebug.warn('
    },
    // Convert info logs (most common)
    {
      pattern: /console\.log\(/g,
      replacement: 'FlickletDebug.info('
    }
  ];
  
  // Function to safely replace console logs in a file
  function processFile(filePath) {
    try {
      // This would be used in a Node.js environment
      // For now, we'll do manual replacements in the browser
      console.log('Processing file:', filePath);
      return true;
    } catch (error) {
      console.error('Error processing file:', filePath, error);
      return false;
    }
  }
  
  // Export for manual use
  window.SafeConsoleReplacement = {
    processFile,
    replacements,
    filesToProcess
  };
  
  console.log('🔧 Safe Console Replacement utility loaded');
})();
