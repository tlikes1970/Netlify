/**
 * Process: CSS Purge Analysis
 * Purpose: Identify unused CSS classes and styles
 * Data Source: HTML content and CSS files
 * Update Path: Run when CSS changes
 * Dependencies: DOM API, fs (Node.js)
 */

export function analyzeCSSUsage() {
  // Get all CSS classes used in HTML
  const usedClasses = new Set();
  const allElements = document.querySelectorAll('*');
  
  allElements.forEach(element => {
    if (element.className) {
      const classes = element.className.split(/\s+/);
      classes.forEach(cls => {
        if (cls.trim()) {
          usedClasses.add(cls.trim());
        }
      });
    }
  });

  // Get all CSS classes defined in stylesheets
  const definedClasses = new Set();
  const styleSheets = Array.from(document.styleSheets);
  
  styleSheets.forEach(sheet => {
    try {
      const rules = Array.from(sheet.cssRules || []);
      rules.forEach(rule => {
        if (rule.type === CSSRule.STYLE_RULE) {
          const selector = rule.selectorText;
          if (selector) {
            // Extract class selectors
            const classMatches = selector.match(/\.([a-zA-Z0-9_-]+)/g);
            if (classMatches) {
              classMatches.forEach(match => {
                const className = match.substring(1); // Remove the dot
                definedClasses.add(className);
              });
            }
          }
        }
      });
    } catch (e) {
      // Skip stylesheets that can't be accessed (CORS)
      console.warn('⚠️ Could not analyze stylesheet:', sheet.href);
    }
  });

  // Find unused classes
  const unusedClasses = Array.from(definedClasses).filter(cls => !usedClasses.has(cls));
  const missingClasses = Array.from(usedClasses).filter(cls => !definedClasses.has(cls));

  console.log('📊 CSS Usage Analysis:');
  console.log(`Used classes: ${usedClasses.size}`);
  console.log(`Defined classes: ${definedClasses.size}`);
  console.log(`Unused classes: ${unusedClasses.length}`);
  console.log(`Missing classes: ${missingClasses.length}`);

  if (unusedClasses.length > 0) {
    console.log('🗑️ Unused classes:', unusedClasses.slice(0, 20));
  }

  if (missingClasses.length > 0) {
    console.log('❌ Missing classes:', missingClasses.slice(0, 20));
  }

  return {
    used: Array.from(usedClasses),
    defined: Array.from(definedClasses),
    unused: unusedClasses,
    missing: missingClasses
  };
}

// Auto-run analysis
if (typeof window !== 'undefined') {
  document.addEventListener('DOMContentLoaded', analyzeCSSUsage);
}








