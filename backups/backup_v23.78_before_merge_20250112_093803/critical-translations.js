/**
 * Critical Translations Scanner
 * Focuses on the most important user-facing elements that need translation
 */

console.log('🔍 Scanning for CRITICAL missing translations...');

function findCriticalTranslations() {
  const critical = [];
  
  // Focus on the most important elements users see
  const criticalSelectors = [
    'h1, h2, h3, h4, h5, h6', // All headings
    'button', // All buttons
    'span.tab-badge', // Tab badges
    'div.preview-row-title', // Section titles
    'p.section-subtitle', // Section subtitles
    'div.placeholder-message', // Placeholder messages
    'span.gc-stat-label', // Game stat labels
    'button.gc-cta', // Game action buttons
    'div.feedback-actions button', // Feedback buttons
    'label', // Form labels
    'input[placeholder]', // Input placeholders
    'div.search-help', // Search help text
    'div.quote-text' // Quote text
  ];
  
  criticalSelectors.forEach(selector => {
    const elements = document.querySelectorAll(selector);
    elements.forEach(el => {
      // Skip if already has data-i18n
      if (el.hasAttribute('data-i18n')) return;
      
      // Skip if no text or just whitespace
      const text = el.textContent?.trim();
      if (!text) return;
      
      // Skip if it's just numbers or symbols
      if (/^[\d\s\-\.]+$/.test(text)) return;
      if (text.length <= 2) return;
      
      // Skip common non-translatable elements
      if (el.classList.contains('gc-stat-val')) return;
      if (el.classList.contains('count')) return;
      if (el.classList.contains('version-display')) return;
      
      // Skip if it's just punctuation or symbols
      if (/^[^\w\s]+$/.test(text)) return;
      
      // Skip if element has child elements (we want leaf text)
      if (el.children.length > 0) return;
      
      critical.push({
        text: text,
        tag: el.tagName,
        id: el.id || 'no-id',
        classes: el.className || 'no-class',
        selector: selector,
        context: getElementContext(el)
      });
    });
  });
  
  return critical;
}

function getElementContext(element) {
  if (!element) return 'unknown';
  
  const context = [];
  let current = element;
  
  // Walk up to find parent section
  for (let i = 0; i < 4 && current; i++) {
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

function generateCriticalKeys(critical) {
  const keys = [];
  
  critical.forEach((item, index) => {
    // Generate a better key from the text
    let key = item.text
      .toLowerCase()
      .replace(/[^\w\s]/g, '') // Remove punctuation
      .replace(/\s+/g, '_') // Replace spaces with underscores
      .replace(/^_+|_+$/g, '') // Remove leading/trailing underscores
      .substring(0, 30); // Limit length
    
    // Make sure it's unique
    let originalKey = key;
    let counter = 1;
    while (keys.some(k => k.key === key)) {
      key = `${originalKey}_${counter}`;
      counter++;
    }
    
    // Add priority based on element type
    let priority = 'medium';
    if (item.tag === 'H1' || item.tag === 'H2' || item.tag === 'H3') priority = 'high';
    if (item.tag === 'BUTTON') priority = 'high';
    if (item.classes.includes('tab-badge')) priority = 'high';
    if (item.classes.includes('preview-row-title')) priority = 'high';
    
    keys.push({
      key: key,
      text: item.text,
      tag: item.tag,
      id: item.id,
      classes: item.classes,
      context: item.context,
      priority: priority
    });
  });
  
  return keys.sort((a, b) => {
    const priorityOrder = { 'high': 0, 'medium': 1, 'low': 2 };
    return priorityOrder[a.priority] - priorityOrder[b.priority];
  });
}

function runCriticalScan() {
  console.log('\n=== CRITICAL TRANSLATIONS SCAN ===');
  
  const missing = findCriticalTranslations();
  console.log(`Found ${missing.length} critical elements that need translation`);
  
  if (missing.length === 0) {
    console.log('✅ All critical elements are translated!');
    return;
  }
  
  const keys = generateCriticalKeys(missing);
  
  console.log('\n=== HIGH PRIORITY MISSING TRANSLATIONS ===');
  const highPriority = keys.filter(k => k.priority === 'high');
  highPriority.forEach(item => {
    console.log(`🔥 ${item.text} (${item.tag}) - ${item.context}`);
  });
  
  console.log('\n=== SUGGESTED KEYS FOR i18n.js ===');
  console.log('// Add these to your i18n.js file:');
  console.log('\n// English translations');
  keys.forEach(item => {
    console.log(`    ${item.key}: "${item.text}",`);
  });
  
  console.log('\n// Spanish translations (translate these)');
  keys.forEach(item => {
    console.log(`    ${item.key}: "${item.text}", // TODO: Translate to Spanish`);
  });
  
  console.log('\n=== HTML ELEMENTS TO UPDATE ===');
  console.log('Add data-i18n attributes to these elements:');
  keys.forEach(item => {
    console.log(`<${item.tag} data-i18n="${item.key}">${item.text}</${item.tag}>`);
    console.log(`  Context: ${item.context}`);
    console.log('');
  });
  
  console.log('\n=== PRIORITY SUMMARY ===');
  const highCount = keys.filter(k => k.priority === 'high').length;
  const mediumCount = keys.filter(k => k.priority === 'medium').length;
  console.log(`🔥 High Priority: ${highCount} elements`);
  console.log(`⚡ Medium Priority: ${mediumCount} elements`);
  console.log(`📊 Total: ${keys.length} elements`);
  
  return keys;
}

// Run the scan
const results = runCriticalScan();

// Expose for manual use
window.scanCriticalTranslations = runCriticalScan;

console.log('✅ Critical scan complete! Use window.scanCriticalTranslations() to run again.');
