/**
 * Process: Translation Scanner
 * Purpose: Comprehensive tool for finding and analyzing missing translations
 * Data Source: DOM elements and translation files
 * Update Path: Run via browser console or node tools/translation-scanner.js
 * Dependencies: DOM API, fs (Node.js)
 */

console.log('🔍 Translation Scanner Starting...');

class TranslationScanner {
  constructor() {
    this.results = {
      critical: [],
      missing: [],
      suggestions: []
    };
  }

  // Critical elements that must be translated
  getCriticalSelectors() {
    return [
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
  }

  // Check if text should be translated
  shouldTranslate(text, element) {
    if (!text || !text.trim()) return false;
    
    // Skip if already has data-i18n
    if (element.hasAttribute('data-i18n')) return false;
    
    // Skip if it's just numbers or symbols
    if (/^[\d\s\-\.]+$/.test(text)) return false;
    if (text.length <= 2) return false;
    
    // Skip if it has child elements (we want leaf text)
    if (element.children.length > 0) return false;
    
    // Skip common non-translatable elements
    if (element.classList.contains('gc-stat-val')) return false;
    if (element.classList.contains('rating-value')) return false;
    if (element.classList.contains('year')) return false;
    
    return true;
  }

  // Scan for critical missing translations
  scanCritical() {
    const criticalSelectors = this.getCriticalSelectors();
    
    criticalSelectors.forEach(selector => {
      const elements = document.querySelectorAll(selector);
      elements.forEach(el => {
        const text = el.textContent?.trim();
        if (this.shouldTranslate(text, el)) {
          this.results.critical.push({
            element: el.tagName.toLowerCase(),
            text: text,
            selector: this.getSelector(el),
            priority: this.getPriority(el)
          });
        }
      });
    });
  }

  // Scan for all missing translations
  scanAll() {
    const allElements = document.querySelectorAll('*');
    
    allElements.forEach(element => {
      // Skip script and style elements
      if (element.tagName === 'SCRIPT' || element.tagName === 'STYLE') {
        return;
      }
      
      const text = element.textContent?.trim();
      if (this.shouldTranslate(text, element)) {
        this.results.missing.push({
          element: element.tagName.toLowerCase(),
          text: text,
          selector: this.getSelector(element),
          priority: this.getPriority(element)
        });
      }
    });
  }

  // Get CSS selector for element
  getSelector(element) {
    if (element.id) return `#${element.id}`;
    if (element.className) return `.${element.className.split(' ')[0]}`;
    return element.tagName.toLowerCase();
  }

  // Get priority level
  getPriority(element) {
    if (['h1', 'h2', 'h3'].includes(element.tagName.toLowerCase())) return 'high';
    if (['button', 'label'].includes(element.tagName.toLowerCase())) return 'high';
    if (element.classList.contains('tab-badge')) return 'high';
    return 'medium';
  }

  // Generate suggestions
  generateSuggestions() {
    const allItems = [...this.results.critical, ...this.results.missing];
    
    // Group by text content
    const grouped = {};
    allItems.forEach(item => {
      if (!grouped[item.text]) {
        grouped[item.text] = [];
      }
      grouped[item.text].push(item);
    });

    // Generate i18n keys
    Object.keys(grouped).forEach(text => {
      const key = this.generateKey(text);
      this.results.suggestions.push({
        key: key,
        text: text,
        elements: grouped[text],
        suggestedAttribute: `data-i18n="${key}"`
      });
    });
  }

  // Generate i18n key from text
  generateKey(text) {
    return text
      .toLowerCase()
      .replace(/[^a-z0-9\s]/g, '')
      .replace(/\s+/g, '_')
      .substring(0, 50);
  }

  // Run complete scan
  scan() {
    console.log('Scanning critical elements...');
    this.scanCritical();
    
    console.log('Scanning all elements...');
    this.scanAll();
    
    console.log('Generating suggestions...');
    this.generateSuggestions();
    
    return this.results;
  }

  // Print results
  printResults() {
    console.log('\n📊 Translation Scan Results:');
    console.log(`Critical missing: ${this.results.critical.length}`);
    console.log(`Total missing: ${this.results.missing.length}`);
    console.log(`Suggestions: ${this.results.suggestions.length}`);
    
    if (this.results.critical.length > 0) {
      console.log('\n🚨 Critical Missing Translations:');
      this.results.critical.forEach((item, index) => {
        console.log(`${index + 1}. [${item.priority}] ${item.element}: "${item.text}"`);
        console.log(`   Selector: ${item.selector}`);
      });
    }
    
    if (this.results.suggestions.length > 0) {
      console.log('\n💡 Suggested i18n Attributes:');
      this.results.suggestions.slice(0, 10).forEach((suggestion, index) => {
        console.log(`${index + 1}. ${suggestion.suggestedAttribute}`);
        console.log(`   Text: "${suggestion.text}"`);
      });
    }
  }
}

// Run scanner if in browser
if (typeof window !== 'undefined') {
  const scanner = new TranslationScanner();
  const results = scanner.scan();
  scanner.printResults();
  
  // Make results available globally
  window.translationResults = results;
  console.log('\n✅ Results available as window.translationResults');
}

// Export for Node.js
if (typeof module !== 'undefined' && module.exports) {
  module.exports = TranslationScanner;
}
