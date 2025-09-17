#!/usr/bin/env node

/**
 * Process: Baseline Audit Runner
 * Purpose: Comprehensive audit tool that generates Lighthouse, axe, bundle, duplication, dead code, CSS coverage, DOM event map, and security reports
 * Data Source: Local www directory and running application
 * Update Path: Run via npm run audit:baseline
 * Dependencies: All audit tools must be installed via npm install
 */

import { spawn, exec } from 'child_process';
import { promisify } from 'util';
import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';
import puppeteer from 'puppeteer';

const execAsync = promisify(exec);
const __dirname = path.dirname(fileURLToPath(import.meta.url));
const projectRoot = path.resolve(__dirname, '..');
const wwwDir = path.join(projectRoot, 'www');
const reportsDir = path.join(projectRoot, 'reports');

// Ensure reports directories exist
async function ensureDirectories() {
  const dirs = [
    path.join(reportsDir, 'lighthouse'),
    path.join(reportsDir, 'axe'),
    path.join(reportsDir, 'jscpd'),
    path.join(reportsDir, 'bundle')
  ];
  
  for (const dir of dirs) {
    await fs.mkdir(dir, { recursive: true });
  }
}

// Run Lighthouse audit
async function runLighthouse() {
  console.log('🔍 Running Lighthouse audits...');
  
  const lighthouseCmd = 'lighthouse';
  const baseUrl = 'http://localhost:8080';
  
  // Desktop audit
  const desktopArgs = [
    baseUrl,
    '--preset=desktop',
    '--output=json',
    '--output-path=' + path.join(reportsDir, 'lighthouse', 'desktop.json'),
    '--chrome-flags=--headless'
  ];
  
  // Mobile audit (using perf preset as specified)
  const mobileArgs = [
    baseUrl,
    '--preset=perf',
    '--output=json',
    '--output-path=' + path.join(reportsDir, 'lighthouse', 'mobile.json'),
    '--chrome-flags=--headless'
  ];
  
  try {
    await execAsync(`${lighthouseCmd} ${desktopArgs.join(' ')}`);
    console.log('✅ Desktop Lighthouse complete');
    
    await execAsync(`${lighthouseCmd} ${mobileArgs.join(' ')}`);
    console.log('✅ Mobile Lighthouse complete');
  } catch (error) {
    console.error('❌ Lighthouse failed:', error.message);
  }
}

// Run axe accessibility audit
async function runAxe() {
  console.log('♿ Running axe accessibility audit...');
  
  try {
    await execAsync(`npx @axe-core/cli http://localhost:8080 --save ${path.join(reportsDir, 'axe', 'axe.json')}`);
    console.log('✅ Axe audit complete');
  } catch (error) {
    console.error('❌ Axe audit failed:', error.message);
  }
}

// Run bundle analysis
async function runBundleAnalysis() {
  console.log('📦 Running bundle analysis...');
  
  try {
    // Find all JS files in www directory
    const jsFiles = await findFiles(wwwDir, '.js');
    const cssFiles = await findFiles(wwwDir, '.css');
    
    // Calculate JS and CSS totals
    let jsTotalMB = 0;
    let cssTotalMB = 0;
    
    for (const file of jsFiles) {
      const stats = await fs.stat(file);
      jsTotalMB += stats.size / (1024 * 1024);
    }
    
    for (const file of cssFiles) {
      const stats = await fs.stat(file);
      cssTotalMB += stats.size / (1024 * 1024);
    }
    
    // Run source-map-explorer if source maps exist
    const sourceMapFiles = await findFiles(wwwDir, '.map');
    if (sourceMapFiles.length > 0) {
      await execAsync(`npx source-map-explorer ${jsFiles.join(' ')} --html ${path.join(reportsDir, 'bundle', 'bundle.html')}`);
    } else {
      // Create a simple bundle report
      const bundleReport = {
        jsFiles: jsFiles.length,
        cssFiles: cssFiles.length,
        jsTotalMB: Math.round(jsTotalMB * 100) / 100,
        cssTotalMB: Math.round(cssTotalMB * 100) / 100,
        totalMB: Math.round((jsTotalMB + cssTotalMB) * 100) / 100
      };
      
      await fs.writeFile(
        path.join(reportsDir, 'bundle', 'bundle.html'),
        generateBundleHTML(bundleReport)
      );
    }
    
    console.log('✅ Bundle analysis complete');
    return { jsTotalMB, cssTotalMB };
  } catch (error) {
    console.error('❌ Bundle analysis failed:', error.message);
    return { jsTotalMB: 0, cssTotalMB: 0 };
  }
}

// Run duplication analysis
async function runDuplicationAnalysis() {
  console.log('🔄 Running duplication analysis...');
  
  try {
    const jscpdArgs = [
      '--output', path.join(reportsDir, 'jscpd'),
      '--format', 'html,md,json',
      '--min-lines', '5',
      '--min-tokens', '50',
      '--ignore', 'node_modules/**,dist/**,build/**,out/**,.next/**,.cache/**,coverage/**,**/*.min.*,*.map,media/**',
      wwwDir
    ];
    
    const { stdout, stderr } = await execAsync(`npx jscpd ${jscpdArgs.join(' ')}`);
    console.log('✅ Duplication analysis complete');
    return { exitCode: 0, output: stdout };
  } catch (error) {
    console.error('❌ Duplication analysis failed:', error.message);
    return { exitCode: 1, output: error.message };
  }
}

// Run dependency analysis
async function runDependencyAnalysis() {
  console.log('📋 Running dependency analysis...');
  
  try {
    // Depcheck
    const { stdout: depcheckOutput } = await execAsync('npx depcheck --json');
    await fs.writeFile(path.join(reportsDir, 'depcheck.json'), depcheckOutput);
    
    // Knip
    const { stdout: knipOutput } = await execAsync('npx knip');
    await fs.writeFile(path.join(reportsDir, 'knip.txt'), knipOutput);
    
    console.log('✅ Dependency analysis complete');
    
    const depcheckData = JSON.parse(depcheckOutput);
    return {
      unusedDeps: Object.keys(depcheckData.dependencies || {}).length,
      unusedFiles: Object.keys(depcheckData.devDependencies || {}).length,
      knipLines: knipOutput.split('\n').length
    };
  } catch (error) {
    console.error('❌ Dependency analysis failed:', error.message);
    return { unusedDeps: 0, unusedFiles: 0, knipLines: 0 };
  }
}

// Run CSS coverage analysis
async function runCSSCoverage() {
  console.log('🎨 Running CSS coverage analysis...');
  
  try {
    const browser = await puppeteer.launch({ headless: true });
    const page = await browser.newPage();
    
    // Enable CSS coverage
    await page.coverage.startCSSCoverage();
    
    // Navigate to the page
    await page.goto('http://localhost:8080', { waitUntil: 'networkidle0' });
    
    // Get coverage data
    const coverage = await page.coverage.stopCSSCoverage();
    
    // Calculate unused CSS percentage
    let totalBytes = 0;
    let usedBytes = 0;
    
    for (const entry of coverage) {
      totalBytes += entry.text.length;
      for (const range of entry.ranges) {
        usedBytes += range.end - range.start;
      }
    }
    
    const unusedPercentage = totalBytes > 0 ? Math.round(((totalBytes - usedBytes) / totalBytes) * 100) : 0;
    
    const coverageData = {
      totalBytes,
      usedBytes,
      unusedBytes: totalBytes - usedBytes,
      unusedPercentage,
      files: coverage.length
    };
    
    await fs.writeFile(path.join(reportsDir, 'css-coverage.json'), JSON.stringify(coverageData, null, 2));
    
    await browser.close();
    console.log('✅ CSS coverage analysis complete');
    
    return unusedPercentage;
  } catch (error) {
    console.error('❌ CSS coverage analysis failed:', error.message);
    return 0;
  }
}

// Run DOM event analysis
async function runDOMEventAnalysis() {
  console.log('🖱️ Running DOM event analysis...');
  
  try {
    const browser = await puppeteer.launch({ headless: true });
    const page = await browser.newPage();
    
    await page.goto('http://localhost:8080', { waitUntil: 'networkidle0' });
    
    // Get event listener counts
    const eventCounts = await page.evaluate(() => {
      const events = ['click', 'input', 'change', 'keydown', 'keyup', 'submit', 'scroll', 'resize'];
      const counts = {};
      
      for (const eventType of events) {
        // Count elements with event listeners (approximation)
        const elements = document.querySelectorAll(`[on${eventType}], [data-${eventType}]`);
        counts[eventType] = elements.length;
      }
      
      return counts;
    });
    
    await fs.writeFile(path.join(reportsDir, 'dom-events.json'), JSON.stringify(eventCounts, null, 2));
    
    await browser.close();
    console.log('✅ DOM event analysis complete');
    
    return eventCounts;
  } catch (error) {
    console.error('❌ DOM event analysis failed:', error.message);
    return {};
  }
}

// Run security scan
async function runSecurityScan() {
  console.log('🔒 Running security scan...');
  
  try {
    const securityPatterns = [
      'innerHTML',
      'insertAdjacentHTML',
      'dangerouslySetInnerHTML',
      'eval\\(',
      'new Function\\(',
      'javascript:',
      'onerror=',
      'onload='
    ];
    
    let totalMatches = 0;
    const results = [];
    
    for (const pattern of securityPatterns) {
      try {
        const { stdout } = await execAsync(`grep -r "${pattern}" ${wwwDir} --include="*.js" --include="*.html" || true`);
        const matches = stdout.split('\n').filter(line => line.trim());
        totalMatches += matches.length;
        results.push(...matches);
      } catch (error) {
        // grep returns non-zero exit code when no matches found
      }
    }
    
    await fs.writeFile(path.join(reportsDir, 'security-scan.txt'), results.join('\n'));
    console.log('✅ Security scan complete');
    
    return totalMatches;
  } catch (error) {
    console.error('❌ Security scan failed:', error.message);
    return 0;
  }
}

// Helper function to find files
async function findFiles(dir, extension) {
  const files = [];
  
  async function scanDir(currentDir) {
    const entries = await fs.readdir(currentDir, { withFileTypes: true });
    
    for (const entry of entries) {
      const fullPath = path.join(currentDir, entry.name);
      
      if (entry.isDirectory()) {
        // Skip excluded directories
        const skipDirs = ['node_modules', 'dist', 'build', 'out', '.next', '.cache', 'coverage'];
        if (!skipDirs.some(skip => entry.name.includes(skip))) {
          await scanDir(fullPath);
        }
      } else if (entry.name.endsWith(extension)) {
        files.push(fullPath);
      }
    }
  }
  
  await scanDir(dir);
  return files;
}

// Generate bundle HTML report
function generateBundleHTML(data) {
  return `
<!DOCTYPE html>
<html>
<head>
    <title>Bundle Analysis Report</title>
    <style>
        body { font-family: Arial, sans-serif; margin: 20px; }
        .metric { margin: 10px 0; padding: 10px; background: #f5f5f5; border-radius: 5px; }
        .metric h3 { margin: 0 0 10px 0; color: #333; }
        .metric .value { font-size: 24px; font-weight: bold; color: #007acc; }
    </style>
</head>
<body>
    <h1>Bundle Analysis Report</h1>
    <div class="metric">
        <h3>JavaScript Files</h3>
        <div class="value">${data.jsFiles} files</div>
        <div>Total Size: ${data.jsTotalMB} MB</div>
    </div>
    <div class="metric">
        <h3>CSS Files</h3>
        <div class="value">${data.cssFiles} files</div>
        <div>Total Size: ${data.cssTotalMB} MB</div>
    </div>
    <div class="metric">
        <h3>Total Bundle Size</h3>
        <div class="value">${data.totalMB} MB</div>
    </div>
</body>
</html>`;
}

// Generate summary report
async function generateSummary(bundleData, depData, cssUnused, eventCounts, securityMatches, jscpdExitCode) {
  console.log('\n' + '='.repeat(80));
  console.log('📊 BASELINE AUDIT SUMMARY');
  console.log('='.repeat(80));
  
  // Lighthouse results
  try {
    const desktopLighthouse = JSON.parse(await fs.readFile(path.join(reportsDir, 'lighthouse', 'desktop.json'), 'utf8'));
    const mobileLighthouse = JSON.parse(await fs.readFile(path.join(reportsDir, 'lighthouse', 'mobile.json'), 'utf8'));
    
    console.log(`\n🔍 LIGHTHOUSE RESULTS:`);
    console.log(`   Desktop Performance: ${Math.round(desktopLighthouse.categories.performance.score * 100)}`);
    console.log(`   Desktop Accessibility: ${Math.round(desktopLighthouse.categories.accessibility.score * 100)}`);
    console.log(`   Mobile Performance: ${Math.round(mobileLighthouse.categories.performance.score * 100)}`);
    console.log(`   Mobile Accessibility: ${Math.round(mobileLighthouse.categories.accessibility.score * 100)}`);
    console.log(`   Desktop CLS: ${desktopLighthouse.audits['cumulative-layout-shift'].displayValue}`);
    console.log(`   Mobile CLS: ${mobileLighthouse.audits['cumulative-layout-shift'].displayValue}`);
  } catch (error) {
    console.log(`   ❌ Lighthouse results not available`);
  }
  
  // Axe results
  try {
    const axeResults = JSON.parse(await fs.readFile(path.join(reportsDir, 'axe', 'axe.json'), 'utf8'));
    const serious = axeResults.violations.filter(v => v.impact === 'serious').length;
    const critical = axeResults.violations.filter(v => v.impact === 'critical').length;
    console.log(`\n♿ AXE ACCESSIBILITY:`);
    console.log(`   Serious Issues: ${serious}`);
    console.log(`   Critical Issues: ${critical}`);
  } catch (error) {
    console.log(`   ❌ Axe results not available`);
  }
  
  // Bundle analysis
  console.log(`\n📦 BUNDLE ANALYSIS:`);
  console.log(`   JavaScript: ${bundleData.jsTotalMB} MB`);
  console.log(`   CSS: ${bundleData.cssTotalMB} MB`);
  console.log(`   Total: ${(bundleData.jsTotalMB + bundleData.cssTotalMB).toFixed(2)} MB`);
  
  // Duplication analysis
  console.log(`\n🔄 DUPLICATION ANALYSIS:`);
  console.log(`   jscpd Exit Code: ${jscpdExitCode}`);
  
  // Dependency analysis
  console.log(`\n📋 DEPENDENCY ANALYSIS:`);
  console.log(`   Unused Dependencies: ${depData.unusedDeps}`);
  console.log(`   Unused Dev Dependencies: ${depData.unusedFiles}`);
  console.log(`   Knip Issues: ${depData.knipLines} lines`);
  
  // CSS coverage
  console.log(`\n🎨 CSS COVERAGE:`);
  console.log(`   Unused CSS: ${cssUnused}%`);
  
  // DOM events
  const clickListeners = eventCounts.click || 0;
  console.log(`\n🖱️ DOM EVENTS:`);
  console.log(`   Click Listeners: ${clickListeners}`);
  
  // Security scan
  console.log(`\n🔒 SECURITY SCAN:`);
  console.log(`   Potential Issues: ${securityMatches} matches`);
  
  console.log('\n' + '='.repeat(80));
  console.log('✅ Baseline audit complete! All reports generated in /reports/');
  console.log('='.repeat(80));
}

// Main execution
async function main() {
  console.log('🚀 Starting comprehensive baseline audit...\n');
  
  // Ensure directories exist
  await ensureDirectories();
  
  // Check if server is running
  try {
    await execAsync('curl -s http://localhost:8080 > /dev/null');
    console.log('✅ Server detected at http://localhost:8080');
  } catch (error) {
    console.log('❌ No server detected at http://localhost:8080');
    console.log('   Please run: npm run serve:dist');
    console.log('   Then run this audit again.');
    process.exit(1);
  }
  
  // Run all audits
  const bundleData = await runBundleAnalysis();
  const depData = await runDependencyAnalysis();
  const cssUnused = await runCSSCoverage();
  const eventCounts = await runDOMEventAnalysis();
  const securityMatches = await runSecurityScan();
  const jscpdResult = await runDuplicationAnalysis();
  
  // Run Lighthouse and Axe (these can run in parallel)
  await Promise.all([
    runLighthouse(),
    runAxe()
  ]);
  
  // Generate summary
  await generateSummary(bundleData, depData, cssUnused, eventCounts, securityMatches, jscpdResult.exitCode);
}

// Run the audit
main().catch(console.error);










