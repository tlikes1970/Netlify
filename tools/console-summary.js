/**
 * Process: Console Summary Generator
 * Purpose: Generate a concise console summary of baseline audit results
 * Data Source: Existing reports in /reports/ directory
 * Update Path: Run via node tools/console-summary.js
 * Dependencies: Node.js fs module
 */

const fs = require('fs');
const path = require('path');

const reportsDir = path.join(__dirname, '..', 'reports');

function readJSON(filePath) {
  try {
    const content = fs.readFileSync(filePath, 'utf8');
    return JSON.parse(content);
  } catch (error) {
    return null;
  }
}

function readText(filePath) {
  try {
    return fs.readFileSync(filePath, 'utf8');
  } catch (error) {
    return '';
  }
}

console.log('📊 BASELINE AUDIT SUMMARY');
console.log('='.repeat(80));

// Lighthouse Desktop Results
console.log('\n🔍 LIGHTHOUSE DESKTOP RESULTS:');
try {
  const desktopLighthouse = readJSON(path.join(reportsDir, 'lighthouse', 'desktop.json'));
  if (desktopLighthouse && desktopLighthouse.categories) {
    console.log(
      `   Performance: ${Math.round(desktopLighthouse.categories.performance.score * 100)}`,
    );
    console.log(
      `   Accessibility: ${Math.round(desktopLighthouse.categories.accessibility.score * 100)}`,
    );
    console.log(
      `   Best Practices: ${Math.round(desktopLighthouse.categories['best-practices'].score * 100)}`,
    );
    console.log(`   SEO: ${Math.round(desktopLighthouse.categories.seo.score * 100)}`);

    // Key metrics
    const audits = desktopLighthouse.audits;
    if (audits['first-contentful-paint']) {
      console.log(
        `   First Contentful Paint: ${Math.round(audits['first-contentful-paint'].numericValue)}ms`,
      );
    }
    if (audits['largest-contentful-paint']) {
      console.log(
        `   Largest Contentful Paint: ${Math.round(audits['largest-contentful-paint'].numericValue)}ms`,
      );
    }
    if (audits['cumulative-layout-shift']) {
      console.log(`   Cumulative Layout Shift: ${audits['cumulative-layout-shift'].numericValue}`);
    }
    if (audits['total-blocking-time']) {
      console.log(
        `   Total Blocking Time: ${Math.round(audits['total-blocking-time'].numericValue)}ms`,
      );
    }
  } else {
    console.log('   ❌ Desktop Lighthouse results not available');
  }
} catch (error) {
  console.log('   ❌ Desktop Lighthouse results not available');
}

// Axe Accessibility Results
console.log('\n♿ AXE ACCESSIBILITY RESULTS:');
try {
  const axeResults = readJSON(path.join(reportsDir, 'axe', 'axe.json'));
  if (axeResults && Array.isArray(axeResults) && axeResults.length > 0) {
    const result = axeResults[0];
    const violations = result.violations || [];
    const serious = violations.filter((v) => v.impact === 'serious').length;
    const critical = violations.filter((v) => v.impact === 'critical').length;
    const moderate = violations.filter((v) => v.impact === 'moderate').length;
    const minor = violations.filter((v) => v.impact === 'minor').length;

    console.log(`   Total Violations: ${violations.length}`);
    console.log(`   Critical: ${critical}`);
    console.log(`   Serious: ${serious}`);
    console.log(`   Moderate: ${moderate}`);
    console.log(`   Minor: ${minor}`);
  } else {
    console.log('   ✅ No accessibility violations found');
  }
} catch (error) {
  console.log('   ❌ Axe results not available');
}

// Bundle Analysis
console.log('\n📦 BUNDLE ANALYSIS:');
try {
  const bundleData = readJSON(path.join(reportsDir, 'bundle', 'bundle.json'));
  if (bundleData) {
    console.log(`   JavaScript Files: ${bundleData.jsFiles}`);
    console.log(`   CSS Files: ${bundleData.cssFiles}`);
    console.log(`   JavaScript Size: ${bundleData.jsTotalMB} MB`);
    console.log(`   CSS Size: ${bundleData.cssTotalMB} MB`);
    console.log(`   Total Bundle Size: ${bundleData.totalMB} MB`);
  } else {
    console.log('   ❌ Bundle analysis not available');
  }
} catch (error) {
  console.log('   ❌ Bundle analysis not available');
}

// Duplication Analysis
console.log('\n🔄 DUPLICATION ANALYSIS:');
try {
  const jscpdData = readJSON(path.join(reportsDir, 'jscpd', 'jscpd-report.json'));
  if (jscpdData && jscpdData.statistics && jscpdData.statistics.total) {
    const total = jscpdData.statistics.total;
    const duplicationPercentage = Math.round((total.duplicatedLines / total.lines) * 100);
    console.log(`   Total Lines: ${total.lines.toLocaleString()}`);
    console.log(`   Duplicated Lines: ${total.duplicatedLines.toLocaleString()}`);
    console.log(`   Duplication Percentage: ${duplicationPercentage}%`);
    console.log(`   Clones Found: ${total.clones.toLocaleString()}`);
  } else {
    console.log('   ❌ Duplication analysis not available');
  }
} catch (error) {
  console.log('   ❌ Duplication analysis not available');
}

// Dependency Analysis
console.log('\n📋 DEPENDENCY ANALYSIS:');
try {
  const depcheckData = readJSON(path.join(reportsDir, 'depcheck.json'));
  if (depcheckData) {
    const unusedDeps = Object.keys(depcheckData.dependencies || {}).length;
    const unusedDevDeps = Object.keys(depcheckData.devDependencies || {}).length;
    const missing = Object.keys(depcheckData.missing || {}).length;

    console.log(`   Unused Dependencies: ${unusedDeps}`);
    console.log(`   Unused Dev Dependencies: ${unusedDevDeps}`);
    console.log(`   Missing Dependencies: ${missing}`);
  } else {
    console.log('   ❌ Dependency analysis not available');
  }
} catch (error) {
  console.log('   ❌ Dependency analysis not available');
}

// Security Scan
console.log('\n🔒 SECURITY SCAN:');
try {
  const securityOutput = readText(path.join(reportsDir, 'security-scan.txt'));
  if (securityOutput) {
    const lines = securityOutput.split('\n').filter((line) => line.trim());
    console.log(`   Potential Security Issues: ${lines.length}`);
  } else {
    console.log('   ✅ No security issues found');
  }
} catch (error) {
  console.log('   ❌ Security scan not available');
}

console.log('\n' + '='.repeat(80));
console.log('✅ Baseline audit summary complete!');
console.log('='.repeat(80));
