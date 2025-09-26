#!/usr/bin/env node

/**
 * Process: Simple Baseline Audit Runner
 * Purpose: Generate basic audit reports for the TV Tracker project
 * Data Source: Local www directory
 * Update Path: Run via node tools/simple-audit.mjs
 * Dependencies: Basic Node.js modules only
 */

import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';

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
    path.join(reportsDir, 'bundle'),
  ];

  for (const dir of dirs) {
    await fs.mkdir(dir, { recursive: true });
  }
}

// Find files recursively
async function findFiles(dir, extension) {
  const files = [];

  async function scanDir(currentDir) {
    try {
      const entries = await fs.readdir(currentDir, { withFileTypes: true });

      for (const entry of entries) {
        const fullPath = path.join(currentDir, entry.name);

        if (entry.isDirectory()) {
          // Skip excluded directories
          const skipDirs = ['node_modules', 'dist', 'build', 'out', '.next', '.cache', 'coverage'];
          if (!skipDirs.some((skip) => entry.name.includes(skip))) {
            await scanDir(fullPath);
          }
        } else if (entry.name.endsWith(extension)) {
          files.push(fullPath);
        }
      }
    } catch (error) {
      // Skip directories that can't be read
    }
  }

  await scanDir(dir);
  return files;
}

// Run bundle analysis
async function runBundleAnalysis() {
  console.log('📦 Running bundle analysis...');

  try {
    // Find all JS and CSS files in www directory
    const jsFiles = await findFiles(wwwDir, '.js');
    const cssFiles = await findFiles(wwwDir, '.css');

    // Calculate JS and CSS totals
    let jsTotalMB = 0;
    let cssTotalMB = 0;

    for (const file of jsFiles) {
      try {
        const stats = await fs.stat(file);
        jsTotalMB += stats.size / (1024 * 1024);
      } catch (error) {
        // Skip files that can't be read
      }
    }

    for (const file of cssFiles) {
      try {
        const stats = await fs.stat(file);
        cssTotalMB += stats.size / (1024 * 1024);
      } catch (error) {
        // Skip files that can't be read
      }
    }

    // Create bundle report
    const bundleReport = {
      jsFiles: jsFiles.length,
      cssFiles: cssFiles.length,
      jsTotalMB: Math.round(jsTotalMB * 100) / 100,
      cssTotalMB: Math.round(cssTotalMB * 100) / 100,
      totalMB: Math.round((jsTotalMB + cssTotalMB) * 100) / 100,
      jsFilesList: jsFiles.map((f) => path.relative(wwwDir, f)),
      cssFilesList: cssFiles.map((f) => path.relative(wwwDir, f)),
    };

    await fs.writeFile(
      path.join(reportsDir, 'bundle', 'bundle.json'),
      JSON.stringify(bundleReport, null, 2),
    );

    console.log('✅ Bundle analysis complete');
    return { jsTotalMB, cssTotalMB };
  } catch (error) {
    console.error('❌ Bundle analysis failed:', error.message);
    return { jsTotalMB: 0, cssTotalMB: 0 };
  }
}

// Run basic security scan
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
      'onload=',
    ];

    let totalMatches = 0;
    const results = [];

    // Find all JS and HTML files
    const jsFiles = await findFiles(wwwDir, '.js');
    const htmlFiles = await findFiles(wwwDir, '.html');
    const allFiles = [...jsFiles, ...htmlFiles];

    for (const file of allFiles) {
      try {
        const content = await fs.readFile(file, 'utf8');

        for (const pattern of securityPatterns) {
          const regex = new RegExp(pattern, 'gi');
          const matches = content.match(regex);
          if (matches) {
            totalMatches += matches.length;
            results.push(`${file}:${pattern} (${matches.length} matches)`);
          }
        }
      } catch (error) {
        // Skip files that can't be read
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

// Generate summary report
async function generateSummary(bundleData, securityMatches) {
  console.log('\n' + '='.repeat(80));
  console.log('📊 BASELINE AUDIT SUMMARY');
  console.log('='.repeat(80));

  // Bundle analysis
  console.log(`\n📦 BUNDLE ANALYSIS:`);
  console.log(`   JavaScript: ${bundleData.jsTotalMB} MB`);
  console.log(`   CSS: ${bundleData.cssTotalMB} MB`);
  console.log(`   Total: ${(bundleData.jsTotalMB + bundleData.cssTotalMB).toFixed(2)} MB`);

  // Security scan
  console.log(`\n🔒 SECURITY SCAN:`);
  console.log(`   Potential Issues: ${securityMatches} matches`);

  console.log('\n' + '='.repeat(80));
  console.log('✅ Baseline audit complete! Reports generated in /reports/');
  console.log('='.repeat(80));
}

// Main execution
async function main() {
  console.log('🚀 Starting baseline audit...\n');

  // Ensure directories exist
  await ensureDirectories();

  // Run audits
  const bundleData = await runBundleAnalysis();
  const securityMatches = await runSecurityScan();

  // Generate summary
  await generateSummary(bundleData, securityMatches);
}

// Run the audit
main().catch(console.error);
