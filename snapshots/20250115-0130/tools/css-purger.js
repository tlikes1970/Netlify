/**
 * Process: CSS Purger
 * Purpose: Remove unused CSS selectors based on coverage data
 * Data Source: CSS coverage analysis results
 * Update Path: Run via node tools/css-purger.js
 * Dependencies: Node.js fs module
 */

const fs = require('fs');
const path = require('path');

// Read CSS coverage data
const coverageData = JSON.parse(fs.readFileSync('reports/css-coverage.json', 'utf8'));

// Extract used CSS ranges
const usedRanges = new Map();
for (const file of coverageData) {
  const url = file.url;
  const ranges = file.ranges || [];
  
  if (!usedRanges.has(url)) {
    usedRanges.set(url, []);
  }
  
  usedRanges.get(url).push(...ranges);
}

console.log('📊 CSS Coverage Analysis:');
console.log(`Files analyzed: ${coverageData.length}`);
console.log(`Files with used ranges: ${usedRanges.size}`);

// Process each CSS file
for (const [url, ranges] of usedRanges) {
  if (!url.includes('localhost:64213')) continue;
  
  const filePath = url.replace('http://localhost:64213/', '');
  const fullPath = path.join(__dirname, '..', filePath);
  
  if (!fs.existsSync(fullPath)) continue;
  
  console.log(`\n🎨 Processing: ${filePath}`);
  
  try {
    const cssContent = fs.readFileSync(fullPath, 'utf8');
    const lines = cssContent.split('\n');
    
    // Calculate which lines are used
    const usedLines = new Set();
    for (const range of ranges) {
      const startLine = cssContent.substring(0, range.start).split('\n').length - 1;
      const endLine = cssContent.substring(0, range.end).split('\n').length - 1;
      
      for (let i = startLine; i <= endLine; i++) {
        usedLines.add(i);
      }
    }
    
    // Filter out unused lines
    const purgedLines = lines.filter((line, index) => {
      // Keep comments, empty lines, and used lines
      return line.trim().startsWith('/*') || 
             line.trim().startsWith('*') || 
             line.trim().startsWith('*/') ||
             line.trim() === '' ||
             usedLines.has(index);
    });
    
    const originalSize = cssContent.length;
    const purgedSize = purgedLines.join('\n').length;
    const savings = originalSize - purgedSize;
    const savingsPercent = Math.round((savings / originalSize) * 100);
    
    console.log(`  Original: ${Math.round(originalSize / 1024)} KB`);
    console.log(`  Purged: ${Math.round(purgedSize / 1024)} KB`);
    console.log(`  Savings: ${Math.round(savings / 1024)} KB (${savingsPercent}%)`);
    
    // Write purged CSS
    const purgedPath = fullPath.replace('.css', '.purged.css');
    fs.writeFileSync(purgedPath, purgedLines.join('\n'));
    
  } catch (error) {
    console.error(`❌ Error processing ${filePath}:`, error.message);
  }
}

console.log('\n✅ CSS purging complete!');
