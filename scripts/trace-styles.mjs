/**
 * CSS Rule Tracer - Node.js Fallback
 * Parses CSS files to extract rule origins when ripgrep is unavailable
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Simple CSS parser (basic implementation)
function parseCSS(cssText, filePath) {
  const rules = [];
  const lines = cssText.split('\n');
  
  let currentRule = null;
  let braceCount = 0;
  let inRule = false;
  
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    const lineNumber = i + 1;
    
    // Skip comments
    if (line.trim().startsWith('/*') || line.trim().startsWith('//')) {
      continue;
    }
    
    // Look for selector start
    if (!inRule && line.includes('{')) {
      const selectorMatch = line.match(/^([^{]+)\s*\{/);
      if (selectorMatch) {
        currentRule = {
          selector: selectorMatch[1].trim(),
          declarations: [],
          lineNumber,
          file: filePath
        };
        inRule = true;
        braceCount = 1;
      }
    }
    
    // Collect declarations
    if (inRule && currentRule) {
      // Count braces
      braceCount += (line.match(/\{/g) || []).length;
      braceCount -= (line.match(/\}/g) || []).length;
      
      // Look for property: value declarations
      const declMatch = line.match(/([^:]+):\s*([^;!]+)(!important)?\s*;?/);
      if (declMatch) {
        currentRule.declarations.push({
          property: declMatch[1].trim(),
          value: declMatch[2].trim(),
          important: !!declMatch[3],
          lineNumber
        });
      }
      
      // Rule complete
      if (braceCount === 0) {
        rules.push(currentRule);
        currentRule = null;
        inRule = false;
      }
    }
  }
  
  return rules;
}

// Scan directory for CSS files
function findCSSFiles(dir) {
  const files = [];
  
  function scanDir(currentDir) {
    const entries = fs.readdirSync(currentDir, { withFileTypes: true });
    
    for (const entry of entries) {
      const fullPath = path.join(currentDir, entry.name);
      
      if (entry.isDirectory() && !entry.name.startsWith('.') && entry.name !== 'node_modules') {
        scanDir(fullPath);
      } else if (entry.isFile() && entry.name.endsWith('.css')) {
        files.push(fullPath);
      }
    }
  }
  
  scanDir(dir);
  return files;
}

// Main scanning function
async function traceStyles() {
  console.log('=== CSS Rule Tracer (Node.js Fallback) ===');
  console.log('Scanning for CSS rules affecting home layout...\n');
  
  const wwwDir = path.join(__dirname, '..', 'www');
  const cssFiles = findCSSFiles(wwwDir);
  
  console.log(`Found ${cssFiles.length} CSS files:`);
  cssFiles.forEach(file => console.log(`  - ${path.relative(wwwDir, file)}`));
  console.log('');
  
  const allRules = [];
  const targetProperties = [
    'display',
    'padding-left',
    'padding-right',
    'grid-template-columns',
    'grid-auto-flow',
    'grid-auto-columns',
    'flex-direction',
    'flex-wrap',
    'overflow',
    'contain',
    'transform'
  ];
  
  const targetSelectors = [
    '.actions',
    '#homeSection',
    '.home-group',
    '.home-preview-row',
    '.panel'
  ];
  
  const targetValues = [
    'flex',
    'grid',
    'block',
    '32px',
    '2rem',
    '!important'
  ];
  
  for (const file of cssFiles) {
    try {
      const cssText = fs.readFileSync(file, 'utf8');
      const rules = parseCSS(cssText, path.relative(process.cwd(), file));
      
      for (const rule of rules) {
        // Check if rule is relevant
        const isRelevant = targetSelectors.some(selector => 
          rule.selector.includes(selector)
        ) || rule.declarations.some(decl => 
          targetProperties.includes(decl.property) || 
          targetValues.some(value => decl.value.includes(value))
        );
        
        if (isRelevant) {
          allRules.push(rule);
        }
      }
    } catch (error) {
      console.warn(`Error reading ${file}:`, error.message);
    }
  }
  
  // Generate reports
  const reportsDir = path.join(__dirname, '..', 'reports');
  if (!fs.existsSync(reportsDir)) {
    fs.mkdirSync(reportsDir, { recursive: true });
  }
  
  // Text report
  const textReport = [
    '=== CSS Rule Sources (Node.js Fallback) ===',
    `Generated: ${new Date().toISOString()}`,
    `Files scanned: ${cssFiles.length}`,
    `Relevant rules found: ${allRules.length}`,
    '',
    '=== Rules by File ==='
  ];
  
  const rulesByFile = {};
  allRules.forEach(rule => {
    if (!rulesByFile[rule.file]) {
      rulesByFile[rule.file] = [];
    }
    rulesByFile[rule.file].push(rule);
  });
  
  Object.keys(rulesByFile).sort().forEach(file => {
    textReport.push(`\n--- ${file} ---`);
    rulesByFile[file].forEach(rule => {
      textReport.push(`Line ${rule.lineNumber}: ${rule.selector} {`);
      rule.declarations.forEach(decl => {
        const important = decl.important ? ' !important' : '';
        textReport.push(`  ${decl.property}: ${decl.value}${important};`);
      });
      textReport.push('}');
    });
  });
  
  fs.writeFileSync(
    path.join(reportsDir, 'home-layout-sources.txt'), 
    textReport.join('\n')
  );
  
  // JSON report
  const jsonReport = allRules.map(rule => ({
    file: rule.file,
    line: rule.lineNumber,
    selector: rule.selector,
    declarations: rule.declarations.map(decl => ({
      property: decl.property,
      value: decl.value,
      important: decl.important,
      line: decl.lineNumber
    }))
  }));
  
  fs.writeFileSync(
    path.join(reportsDir, 'home-layout-sources.json'),
    JSON.stringify(jsonReport, null, 2)
  );
  
  console.log('=== Scan Complete ===');
  console.log(`Relevant rules found: ${allRules.length}`);
  console.log(`Reports generated:`);
  console.log(`  - ${path.join(reportsDir, 'home-layout-sources.txt')}`);
  console.log(`  - ${path.join(reportsDir, 'home-layout-sources.json')}`);
  
  return jsonReport;
}

// Run if called directly
if (import.meta.url === `file://${process.argv[1]}`) {
  traceStyles().catch(console.error);
}

export { traceStyles, parseCSS, findCSSFiles };

