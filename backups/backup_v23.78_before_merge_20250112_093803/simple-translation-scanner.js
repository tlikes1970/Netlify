/**
 * Simple Translation Scanner
 * Finds text that needs translation
 */

console.log('🔍 Simple Translation Scanner Starting...');

function scanForMissingTranslations() {
  const results = [];
  
  // Get all elements with text content
  const elements = document.querySelectorAll('h1, h2, h3, h4, h5, h6, p, span, div, button, a, label');
  
  elements.forEach(el => {
    // Skip if already has data-i18n
    if (el.hasAttribute('data-i18n')) return;
    
    // Skip if no text or just whitespace
    const text = el.textContent?.trim();
    if (!text) return;
    
    // Skip if it's just numbers or symbols
    if (/^[\d\s\-\.]+$/.test(text)) return;
    if (text.length <= 2) return;
    
    // Skip if it has child elements (we want leaf text)
    if (el.children.length > 0) return;
    
    // Skip common non-translatable elements
    if (el.classList.contains('gc-stat-val')) return;
    if (el.classList.contains('tab-badge')) return;
    if (el.classList.contains('count')) return;
    
    results.push({
      text: text,
      tag: el.tagName,
      id: el.id || 'no-id',
      classes: el.className || 'no-class'
    });
  });
  
  return results;
}

function generateKeys(results) {
  return results.map((item, index) => {
    const key = item.text
      .toLowerCase()
      .replace(/[^\w\s]/g, '')
      .replace(/\s+/g, '_')
      .substring(0, 25);
    
    return {
      key: key || `item_${index}`,
      text: item.text,
      tag: item.tag,
      id: item.id,
      classes: item.classes
    };
  });
}

function runSimpleScan() {
  console.log('\n=== SIMPLE TRANSLATION SCAN ===');
  
  const missing = scanForMissingTranslations();
  console.log(`Found ${missing.length} elements that might need translation`);
  
  if (missing.length === 0) {
    console.log('✅ No missing translations found!');
    return;
  }
  
  const keys = generateKeys(missing);
  
  console.log('\n=== MISSING TRANSLATIONS ===');
  keys.forEach(item => {
    console.log(`"${item.text}" (${item.tag})`);
  });
  
  console.log('\n=== SUGGESTED KEYS ===');
  console.log('// Add to i18n.js:');
  keys.forEach(item => {
    console.log(`    ${item.key}: "${item.text}",`);
  });
  
  console.log('\n=== HTML TO UPDATE ===');
  console.log('Add data-i18n attributes:');
  keys.forEach(item => {
    console.log(`<${item.tag} data-i18n="${item.key}">${item.text}</${item.tag}>`);
  });
  
  return keys;
}

// Run the scan
runSimpleScan();

// Expose for manual use
window.scanTranslations = runSimpleScan;

console.log('✅ Scan complete! Use window.scanTranslations() to run again.');
