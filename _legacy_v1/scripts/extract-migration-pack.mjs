#!/usr/bin/env node

/**
 * Migration Pack Extractor
 * 
 * Extracts a portable migration pack from the legacy V1 repo structure.
 * Reads www/ directory and generates structured JSON outputs for V2 migration.
 * 
 * Usage: node scripts/extract-migration-pack.mjs
 */

import { readFile, writeFile, mkdir, readdir, stat } from 'fs/promises';
import { join, extname, basename, dirname, resolve } from 'path';
import { createHash } from 'crypto';
import { fileURLToPath } from 'url';

// Get the directory where this script is located
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Configuration - resolve paths relative to project root
const PROJECT_ROOT = resolve(__dirname, '..');
const WWW_DIR = join(PROJECT_ROOT, 'www');
const OUTPUT_DIR = join(PROJECT_ROOT, 'migration-pack');
const FILE_EXTENSIONS = ['.js', '.mjs', '.ts', '.tsx', '.css', '.html'];
const MAX_STRING_LENGTH = 120;

// Global state
const stats = {
  filesScanned: 0,
  keysFound: 0,
  endpointsDiscovered: 0,
  selectorsFound: 0,
  tokensFound: 0,
  stringsFound: 0,
  dependenciesFound: 0
};

const data = {
  contracts: new Map(),
  storageKeys: new Map(),
  tmdbEndpoints: new Map(),
  dependencies: new Map(),
  strings: new Set(),
  selectors: new Map(),
  tokens: new Map(),
  checksums: new Map()
};

/**
 * Main execution function
 */
async function main() {
  try {
    console.log('🔍 Starting migration pack extraction...\n');
    console.log(`📁 Project root: ${PROJECT_ROOT}`);
    console.log(`📁 WWW directory: ${WWW_DIR}`);
    console.log(`📁 Output directory: ${OUTPUT_DIR}\n`);
    
    // Create output directory structure
    await createOutputStructure();
    
    // Walk the www directory
    await walkDirectory(WWW_DIR);
    
    // Process and write outputs
    await writeOutputs();
    
    // Generate summary
    printSummary();
    
    console.log('\n✅ Migration pack extraction completed successfully!');
    process.exit(0);
    
  } catch (error) {
    console.error('❌ Extraction failed:', error.message);
    process.exit(1);
  }
}

/**
 * Create the output directory structure
 */
async function createOutputStructure() {
  const dirs = [
    OUTPUT_DIR,
    join(OUTPUT_DIR, 'models'),
    join(OUTPUT_DIR, 'api'),
    join(OUTPUT_DIR, 'deps'),
    join(OUTPUT_DIR, 'ui'),
    join(OUTPUT_DIR, 'styles')
  ];
  
  for (const dir of dirs) {
    try {
      await mkdir(dir, { recursive: true });
    } catch (error) {
      // Directory might already exist, ignore error
    }
  }
}

/**
 * Recursively walk directory and process files
 */
async function walkDirectory(dirPath) {
  try {
    const entries = await readdir(dirPath, { withFileTypes: true });
    
    for (const entry of entries) {
      const fullPath = join(dirPath, entry.name);
      
      if (entry.isDirectory()) {
        await walkDirectory(fullPath);
      } else if (entry.isFile() && FILE_EXTENSIONS.includes(extname(entry.name))) {
        await processFile(fullPath);
      }
    }
  } catch (error) {
    console.warn(`⚠️  Could not read directory ${dirPath}:`, error.message);
  }
}

/**
 * Process individual file
 */
async function processFile(filePath) {
  try {
    const content = await readFile(filePath, 'utf8');
    const ext = extname(filePath);
    const relativePath = filePath.replace(WWW_DIR + '\\', '').replace(WWW_DIR + '/', '');
    
    // Calculate checksum
    const checksum = createHash('sha1').update(content).digest('hex');
    data.checksums.set(relativePath, checksum);
    
    stats.filesScanned++;
    
    // Process based on file type
    switch (ext) {
      case '.js':
      case '.mjs':
      case '.ts':
      case '.tsx':
        await processJavaScriptFile(content, relativePath);
        break;
      case '.css':
        await processCssFile(content, relativePath);
        break;
      case '.html':
        await processHtmlFile(content, relativePath);
        break;
    }
    
  } catch (error) {
    console.warn(`⚠️  Could not process file ${filePath}:`, error.message);
  }
}

/**
 * Process JavaScript files
 */
async function processJavaScriptFile(content, filePath) {
  // Extract data contracts
  extractDataContracts(content, filePath);
  
  // Extract storage keys
  extractStorageKeys(content, filePath);
  
  // Extract TMDB endpoints
  extractTmdbEndpoints(content, filePath);
  
  // Extract dependencies
  extractDependencies(content, filePath);
  
  // Extract strings
  extractStrings(content, filePath);
}

/**
 * Extract data contracts from JavaScript
 */
function extractDataContracts(content, filePath) {
  // Look for appData, watchlists, settings patterns
  const patterns = [
    /(?:appData|watchlists|settings)\s*[:=]\s*\{[^}]*\}/g,
    /function\s+createCardData[^{]*\{[^}]*\}/g,
    /(?:movies|tv)\s*[:=]\s*\{[^}]*\}/g
  ];
  
  patterns.forEach(pattern => {
    const matches = content.match(pattern);
    if (matches) {
      matches.forEach(match => {
        const key = `${filePath}:${match.substring(0, 50)}`;
        data.contracts.set(key, {
          file: filePath,
          pattern: match,
          type: inferContractType(match)
        });
      });
    }
  });
  
  // Look for list structures
  const listPattern = /(?:watching|wishlist|watched)\s*[:=]\s*\[/g;
  const listMatches = content.match(listPattern);
  if (listMatches) {
    listMatches.forEach(match => {
      const key = `${filePath}:list:${match}`;
      data.contracts.set(key, {
        file: filePath,
        pattern: match,
        type: 'list_structure'
      });
    });
  }
}

/**
 * Infer contract type from pattern
 */
function inferContractType(pattern) {
  if (pattern.includes('appData')) return 'app_data';
  if (pattern.includes('watchlists')) return 'watchlists';
  if (pattern.includes('settings')) return 'settings';
  if (pattern.includes('createCardData')) return 'card_data';
  if (pattern.includes('movies') || pattern.includes('tv')) return 'media_lists';
  return 'unknown';
}

/**
 * Extract localStorage keys
 */
function extractStorageKeys(content, filePath) {
  const patterns = [
    /localStorage\.getItem\(['"`]([^'"`]+)['"`]\)/g,
    /localStorage\.setItem\(['"`]([^'"`]+)['"`]/g,
    /sessionStorage\.getItem\(['"`]([^'"`]+)['"`]\)/g,
    /sessionStorage\.setItem\(['"`]([^'"`]+)['"`]/g
  ];
  
  patterns.forEach(pattern => {
    const matches = content.matchAll(pattern);
    for (const match of matches) {
      const key = match[1];
      const operation = match[0].includes('getItem') ? 'read' : 'write';
      const storage = match[0].includes('session') ? 'sessionStorage' : 'localStorage';
      
      data.storageKeys.set(key, {
        key,
        operation,
        storage,
        file: filePath,
        context: extractContext(content, match.index)
      });
      stats.keysFound++;
    }
  });
}

/**
 * Extract TMDB endpoints
 */
function extractTmdbEndpoints(content, filePath) {
  const patterns = [
    /api\.themoviedb\.org\/3\/([^'"`\s]+)/g,
    /tmdbGet\(['"`]([^'"`]+)['"`]\)/g,
    /tmdb\.get\(['"`]([^'"`]+)['"`]\)/g,
    /fetch\(['"`]https?:\/\/api\.themoviedb\.org\/3\/([^'"`]+)['"`]/g
  ];
  
  patterns.forEach(pattern => {
    const matches = content.matchAll(pattern);
    for (const match of matches) {
      const endpoint = match[1];
      const key = `${filePath}:${endpoint}`;
      
      data.tmdbEndpoints.set(key, {
        endpoint,
        file: filePath,
        method: inferHttpMethod(match[0]),
        params: extractParams(endpoint)
      });
      stats.endpointsDiscovered++;
    }
  });
}

/**
 * Infer HTTP method from code pattern
 */
function inferHttpMethod(code) {
  if (code.includes('tmdbGet') || code.includes('.get(')) return 'GET';
  if (code.includes('tmdbPost') || code.includes('.post(')) return 'POST';
  if (code.includes('tmdbPut') || code.includes('.put(')) return 'PUT';
  if (code.includes('tmdbDelete') || code.includes('.delete(')) return 'DELETE';
  return 'GET';
}

/**
 * Extract parameters from endpoint
 */
function extractParams(endpoint) {
  const params = [];
  const paramPattern = /\{([^}]+)\}/g;
  let match;
  
  while ((match = paramPattern.exec(endpoint)) !== null) {
    params.push(match[1]);
  }
  
  return params;
}

/**
 * Extract dependencies
 */
function extractDependencies(content, filePath) {
  const patterns = [
    /import\s+.*?\s+from\s+['"`]([^'"`]+)['"`]/g,
    /require\(['"`]([^'"`]+)['"`]\)/g,
    /import\(['"`]([^'"`]+)['"`]\)/g
  ];
  
  patterns.forEach(pattern => {
    const matches = content.matchAll(pattern);
    for (const match of matches) {
      const dep = match[1];
      if (!dep.startsWith('.') && !dep.startsWith('/')) {
        // External dependency
        data.dependencies.set(`${filePath}:${dep}`, {
          file: filePath,
          dependency: dep,
          type: 'external'
        });
        stats.dependenciesFound++;
      }
    }
  });
}

/**
 * Extract user-visible strings
 */
function extractStrings(content, filePath) {
  // Extract string literals that are likely user-facing
  const stringPattern = /['"`]([^'"`]{3,120})['"`]/g;
  const matches = content.matchAll(stringPattern);
  
  for (const match of matches) {
    const str = match[1];
    
    // Filter out likely non-user strings
    if (isUserVisibleString(str)) {
      data.strings.add(str);
      stats.stringsFound++;
    }
  }
}

/**
 * Check if string is likely user-visible
 */
function isUserVisibleString(str) {
  // Skip URLs, identifiers, technical strings
  if (str.includes('http') || str.includes('www.')) return false;
  if (str.includes('api.') || str.includes('.js') || str.includes('.css')) return false;
  if (str.includes('_') && str.length < 10) return false; // Likely identifiers
  if (/^[A-Z_]+$/.test(str)) return false; // Constants
  
  // Include strings with spaces, punctuation, or common UI words
  return str.includes(' ') || 
         str.includes('.') || 
         str.includes('!') || 
         str.includes('?') ||
         ['Add', 'Remove', 'Save', 'Cancel', 'Edit', 'Delete', 'Search', 'Filter'].some(word => str.includes(word));
}

/**
 * Process CSS files
 */
async function processCssFile(content, filePath) {
  // Extract CSS tokens
  extractCssTokens(content, filePath);
  
  // Extract selectors
  extractSelectors(content, filePath);
}

/**
 * Extract CSS custom properties
 */
function extractCssTokens(content, filePath) {
  const rootPattern = /:root\s*\{([^}]+)\}/g;
  const matches = content.matchAll(rootPattern);
  
  for (const match of matches) {
    const rootContent = match[1];
    const tokenPattern = /--([^:]+):\s*([^;]+);/g;
    let tokenMatch;
    
    while ((tokenMatch = tokenPattern.exec(rootContent)) !== null) {
      const key = tokenMatch[1].trim();
      const value = tokenMatch[2].trim();
      
      data.tokens.set(`${filePath}:${key}`, {
        token: key,
        value,
        file: filePath,
        context: 'root'
      });
      stats.tokensFound++;
    }
  }
  
  // Also look for standalone -- variables
  const standalonePattern = /--([^:]+):\s*([^;]+);/g;
  let standaloneMatch;
  
  while ((standaloneMatch = standalonePattern.exec(content)) !== null) {
    const key = standaloneMatch[1].trim();
    const value = standaloneMatch[2].trim();
    
    if (!data.tokens.has(`${filePath}:${key}`)) {
      data.tokens.set(`${filePath}:${key}`, {
        token: key,
        value,
        file: filePath,
        context: 'standalone'
      });
      stats.tokensFound++;
    }
  }
}

/**
 * Extract CSS selectors
 */
function extractSelectors(content, filePath) {
  const selectorPattern = /([.#][^{]+)\s*\{/g;
  const matches = content.matchAll(selectorPattern);
  
  for (const match of matches) {
    const selector = match[1].trim();
    
    // Focus on key selectors
    if (isKeySelector(selector)) {
      data.selectors.set(`${filePath}:${selector}`, {
        selector,
        file: filePath,
        type: inferSelectorType(selector)
      });
      stats.selectorsFound++;
    }
  }
}

/**
 * Check if selector is key/important
 */
function isKeySelector(selector) {
  const keyPatterns = [
    /home/i, /card/i, /fab/i, /modal/i, /button/i, /nav/i, /tab/i,
    /header/i, /footer/i, /main/i, /sidebar/i, /content/i
  ];
  
  return keyPatterns.some(pattern => pattern.test(selector)) ||
         selector.includes('--') || // CSS custom properties
         selector.split(',').length > 1; // Multiple selectors
}

/**
 * Infer selector type
 */
function inferSelectorType(selector) {
  if (selector.startsWith('#')) return 'id';
  if (selector.startsWith('.')) return 'class';
  if (selector.includes(':')) return 'pseudo';
  if (selector.includes('[')) return 'attribute';
  return 'element';
}

/**
 * Process HTML files
 */
async function processHtmlFile(content, filePath) {
  // Extract script dependencies
  extractScriptDependencies(content, filePath);
  
  // Extract strings from HTML
  extractHtmlStrings(content, filePath);
}

/**
 * Extract script dependencies from HTML
 */
function extractScriptDependencies(content, filePath) {
  const scriptPattern = /<script[^>]*src=['"`]([^'"`]+)['"`][^>]*>/g;
  const matches = content.matchAll(scriptPattern);
  
  for (const match of matches) {
    const src = match[1];
    data.dependencies.set(`${filePath}:${src}`, {
      file: filePath,
      dependency: src,
      type: 'script'
    });
    stats.dependenciesFound++;
  }
}

/**
 * Extract strings from HTML
 */
function extractHtmlStrings(content, filePath) {
  // Extract text content from HTML tags
  const textPattern = />([^<]{3,120})</g;
  const matches = content.matchAll(textPattern);
  
  for (const match of matches) {
    const str = match[1].trim();
    if (str && isUserVisibleString(str)) {
      data.strings.add(str);
      stats.stringsFound++;
    }
  }
}

/**
 * Extract context around a match
 */
function extractContext(content, index, length = 100) {
  const start = Math.max(0, index - length);
  const end = Math.min(content.length, index + length);
  return content.substring(start, end);
}

/**
 * Write all outputs to files
 */
async function writeOutputs() {
  // Write README
  await writeFile(
    join(OUTPUT_DIR, 'README.md'),
    generateReadme()
  );
  
  // Write checksums
  await writeFile(
    join(OUTPUT_DIR, 'checksums.json'),
    JSON.stringify(Object.fromEntries(data.checksums), null, 2)
  );
  
  // Write data contracts
  await writeFile(
    join(OUTPUT_DIR, 'models', 'data-contracts.json'),
    JSON.stringify(Array.from(data.contracts.values()), null, 2)
  );
  
  // Write storage keys
  await writeFile(
    join(OUTPUT_DIR, 'models', 'storage-keys.json'),
    JSON.stringify(Array.from(data.storageKeys.values()), null, 2)
  );
  
  // Write TMDB endpoints
  await writeFile(
    join(OUTPUT_DIR, 'api', 'tmdb-endpoints.json'),
    JSON.stringify(Array.from(data.tmdbEndpoints.values()), null, 2)
  );
  
  // Write dependencies
  await writeFile(
    join(OUTPUT_DIR, 'deps', 'dependency-graph.json'),
    JSON.stringify(Array.from(data.dependencies.values()), null, 2)
  );
  
  // Write strings
  await writeFile(
    join(OUTPUT_DIR, 'ui', 'strings.json'),
    JSON.stringify(Array.from(data.strings), null, 2)
  );
  
  // Write selectors
  await writeFile(
    join(OUTPUT_DIR, 'ui', 'selectors-map.json'),
    JSON.stringify(Array.from(data.selectors.values()), null, 2)
  );
  
  // Write CSS tokens
  await writeFile(
    join(OUTPUT_DIR, 'styles', 'css-tokens.json'),
    JSON.stringify(Array.from(data.tokens.values()), null, 2)
  );
}

/**
 * Generate README content
 */
function generateReadme() {
  return `# Migration Pack

This migration pack was extracted from the legacy V1 repository structure.

## Contents

- **models/**: Data contracts and storage key mappings
- **api/**: TMDB endpoint definitions and usage patterns  
- **deps/**: Dependency graph and script loading order
- **ui/**: User-visible strings and CSS selector mappings
- **styles/**: CSS custom properties and design tokens
- **checksums.json**: SHA-1 checksums of all processed files

## Statistics

- Files scanned: ${stats.filesScanned}
- Storage keys found: ${stats.keysFound}
- TMDB endpoints discovered: ${stats.endpointsDiscovered}
- CSS selectors mapped: ${stats.selectorsFound}
- CSS tokens extracted: ${stats.tokensFound}
- User strings collected: ${stats.stringsFound}
- Dependencies tracked: ${stats.dependenciesFound}

## Usage

This pack provides a structured view of the legacy codebase to inform V2 migration decisions.

Generated on: ${new Date().toISOString()}
`;
}

/**
 * Print summary statistics
 */
function printSummary() {
  console.log('\n📊 EXTRACTION SUMMARY');
  console.log('='.repeat(50));
  console.log(`Files scanned:        ${stats.filesScanned}`);
  console.log(`Storage keys found:   ${stats.keysFound}`);
  console.log(`TMDB endpoints:       ${stats.endpointsDiscovered}`);
  console.log(`CSS selectors:        ${stats.selectorsFound}`);
  console.log(`CSS tokens:           ${stats.tokensFound}`);
  console.log(`User strings:         ${stats.stringsFound}`);
  console.log(`Dependencies:         ${stats.dependenciesFound}`);
  console.log('='.repeat(50));
  
  // Key highlights
  console.log('\n🔍 KEY HIGHLIGHTS:');
  
  if (stats.keysFound > 0) {
    const topKeys = Array.from(data.storageKeys.keys()).slice(0, 3);
    console.log(`• Top storage keys: ${topKeys.join(', ')}`);
  }
  
  if (stats.endpointsDiscovered > 0) {
    const topEndpoints = Array.from(data.tmdbEndpoints.values()).slice(0, 3).map(e => e.endpoint);
    console.log(`• TMDB endpoints: ${topEndpoints.join(', ')}`);
  }
  
  if (stats.tokensFound > 0) {
    const topTokens = Array.from(data.tokens.values()).slice(0, 3).map(t => t.token);
    console.log(`• CSS tokens: ${topTokens.join(', ')}`);
  }
  
  console.log(`\n📁 Output written to: ${OUTPUT_DIR}/`);
}

// Run the main function
main().catch(console.error);
