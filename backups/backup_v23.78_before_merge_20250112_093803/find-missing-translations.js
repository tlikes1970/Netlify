/**
 * Find Missing Translations Script
 * Automatically scans the page for untranslated text and shows what needs i18n attributes
 */

console.log('🔍 Scanning for missing translations...');

// Get all text elements that might need translation
function findMissingTranslations() {
  const missing = [];
  
  // Find all elements with text content
  const allElements = document.querySelectorAll('*');
  
  allElements.forEach(element => {
    // Skip script and style elements
    if (element.tagName === 'SCRIPT' || element.tagName === 'STYLE') {
      return;
    }
    
    // Skip if already has data-i18n
    if (element.hasAttribute('data-i18n')) {
      return;
    }
    
    // Skip if no text content
    if (!element.textContent || !element.textContent.trim()) {
      return;
    }
    
    // Skip if it's just whitespace
    const text = element.textContent.trim();
    if (!text) {
      return;
    }
    
    // Skip if it's just a number or single character
    if (/^[\d\s\-\.]+$/.test(text) || text.length <= 1) {
      return;
    }
    
    // Skip common elements that shouldn't be translated
    if (element.tagName === 'INPUT' && element.type !== 'text') return;
    if (element.classList.contains('gc-stat-val')) return; // Game stats
    if (element.classList.contains('tab-badge')) return; // Tab badges
    if (element.classList.contains('count')) return; // Count numbers
    
    // Skip if it's already a translation key (contains underscores and lowercase)
    if (/^[a-z_]+$/.test(text)) return;
    
    // Skip if it's just punctuation or symbols
    if (/^[^\w\s]+$/.test(text)) return;
    
    // Skip if element has child elements (we only want leaf text nodes)
    if (element.children.length > 0) {
      return;
    }
    
    missing.push({
      text: text,
      element: element.tagName,
      classes: element.className,
      id: element.id,
      context: getContext(element)
    });
  });
  
  return missing;
}

function getContext(element) {
  if (!element) return 'unknown';
  
  const context = [];
  let current = element;
  
  // Walk up the DOM tree to get context
  for (let i = 0; i < 3 && current; i++) {
    if (current.id) {
      context.unshift(`#${current.id}`);
    } else if (current.className) {
      context.unshift(`.${current.className.split(' ')[0]}`);
    } else {
      context.unshift(current.tagName ? current.tagName.toLowerCase() : 'unknown');
    }
    current = current.parentElement;
  }
  
  return context.join(' > ');
}

function generateTranslationKeys(missing) {
  const keys = [];
  
  missing.forEach(item => {
    // Generate a key from the text
    let key = item.text
      .toLowerCase()
      .replace(/[^\w\s]/g, '') // Remove punctuation
      .replace(/\s+/g, '_') // Replace spaces with underscores
      .substring(0, 30); // Limit length
    
    // Make sure it's unique
    let originalKey = key;
    let counter = 1;
    while (keys.some(k => k.key === key)) {
      key = `${originalKey}_${counter}`;
      counter++;
    }
    
    keys.push({
      key: key,
      text: item.text,
      context: item.context,
      element: item.element,
      classes: item.classes
    });
  });
  
  return keys;
}

function runScan() {
  try {
    console.log('\n=== MISSING TRANSLATIONS SCAN ===');
    
    const missing = findMissingTranslations();
    console.log(`Found ${missing.length} potentially untranslated text elements`);
    
    if (missing.length === 0) {
      console.log('✅ All text appears to be translated!');
      return [];
    }
    
    const keys = generateTranslationKeys(missing);
  
  console.log('\n=== MISSING TRANSLATION KEYS ===');
  console.log('Add these to your i18n.js file:');
  console.log('\n// English translations');
  keys.forEach(item => {
    console.log(`    ${item.key}: "${item.text}",`);
  });
  
  console.log('\n// Spanish translations (you\'ll need to translate these)');
  keys.forEach(item => {
    console.log(`    ${item.key}: "${item.text}", // TODO: Translate to Spanish`);
  });
  
  console.log('\n=== HTML ELEMENTS TO UPDATE ===');
  console.log('Add data-i18n attributes to these elements:');
  keys.forEach(item => {
    console.log(`<${item.element} class="${item.classes}" data-i18n="${item.key}">${item.text}</${item.element}>`);
    console.log(`  Context: ${item.context}`);
    console.log('');
  });
  
    console.log('\n=== SUMMARY ===');
    console.log(`Total missing translations: ${keys.length}`);
    console.log('Copy the generated keys above to your i18n.js file');
    console.log('Then add data-i18n attributes to the HTML elements');
    
    return keys;
  } catch (error) {
    console.error('❌ Error scanning for missing translations:', error);
    return [];
  }
}

// Run the scan
const results = runScan();

// Expose for manual use
window.findMissingTranslations = runScan;

console.log('\n🔍 Scan complete! Use window.findMissingTranslations() to run again.');
