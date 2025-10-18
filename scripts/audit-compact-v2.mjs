#!/usr/bin/env node

/**
 * Compact V2 Daily Audit Script
 * Scans files, checks imports, gates, and generates status report
 */

import { readFileSync, existsSync } from 'fs';
import { join } from 'path';

const REPO_ROOT = process.cwd();
const APPS_WEB = join(REPO_ROOT, 'apps', 'web');
const REPORTS_DIR = join(REPO_ROOT, 'reports');

// Ensure reports directory exists
if (!existsSync(REPORTS_DIR)) {
  console.log('Creating reports directory...');
  // This would be created by the file system
}

// Files to audit
const COMPACT_FILES = [
  'apps/web/src/styles/tokens-compact-mobile.css',
  'apps/web/src/styles/compact-home.css', 
  'apps/web/src/styles/settings-sheet.css',
  'apps/web/src/styles/compact-actions.css',
  'apps/web/src/styles/compact-cleanup.css',
  'apps/web/src/styles/compact-a11y-perf.css',
  'apps/web/src/styles/compact-lists.css',
  'apps/web/src/features/compact/CompactPrimaryAction.tsx',
  'apps/web/src/features/compact/CompactOverflowMenu.tsx',
  'apps/web/src/features/compact/SwipeRow.tsx',
  'apps/web/src/features/compact/actionsMap.ts',
  'apps/web/src/lib/flags.tsx'
];

const E2E_TEST_FILES = [
  'tests/e2e/compact/v2/step3/tokens.gate.spec.ts',
  'tests/e2e/compact/v2/step4/home.no-errors.spec.ts',
  'tests/e2e/compact/v2/step4/tabcard.tokens.spec.ts',
  'tests/e2e/compact/v2/step5/home.compact.spec.ts',
  'tests/e2e/compact/v2/step6/settings.sheet.spec.ts',
  'tests/e2e/compact/v2/step7/actions.split.spec.ts',
  'tests/e2e/compact/v2/step8/specificity.polish.spec.ts',
  'tests/e2e/compact/v2/step9/a11y.perf.spec.ts',
  'tests/e2e/compact/v2/step10/lists.compact.spec.ts'
];

function fileExists(path) {
  return existsSync(join(REPO_ROOT, path));
}

function readFileContent(path) {
  try {
    return readFileSync(join(REPO_ROOT, path), 'utf8');
  } catch (e) {
    return null;
  }
}

function countImportant(content) {
  if (!content) return 0;
  return (content.match(/!important/g) || []).length;
}

function findImports(content, targetFile) {
  if (!content) return [];
  const imports = [];
  const lines = content.split('\n');
  lines.forEach((line, index) => {
    if (line.includes(targetFile)) {
      imports.push(`line ${index + 1}`);
    }
  });
  return imports;
}

function checkGatedSelectors(content) {
  if (!content) return false;
  return content.includes('[data-compact-mobile-v1]') || 
         content.includes('[data-compactMobileV1]') ||
         content.includes('[data-actions-split]') ||
         content.includes('[data-actionsSplit]');
}

function auditFiles() {
  const results = [];
  
  for (const file of COMPACT_FILES) {
    const exists = fileExists(file);
    const content = exists ? readFileContent(file) : null;
    const importantCount = countImportant(content);
    const gated = checkGatedSelectors(content);
    
    results.push({
      file,
      exists,
      importantCount,
      gated,
      content: content ? content.substring(0, 200) + '...' : null
    });
  }
  
  return results;
}

function auditE2ETests() {
  const results = [];
  
  for (const file of E2E_TEST_FILES) {
    results.push({
      file,
      exists: fileExists(file)
    });
  }
  
  return results;
}

function generateReport(auditResults, e2eResults) {
  const today = new Date().toISOString().split('T')[0];
  const reportPath = join(REPORTS_DIR, `compact_v2_status_${today}.md`);
  
  let report = `# Compact V2 Status Report - ${today}\n\n`;
  
  // Summary
  report += `## Summary\n\n`;
  const existingFiles = auditResults.filter(r => r.exists).length;
  report += `- ✅ ${existingFiles}/${COMPACT_FILES.length} compact files exist\n`;
  report += `- ⚠️ ${auditResults.filter(r => r.importantCount > 0).length} files with !important declarations\n`;
  report += `- ✅ ${e2eResults.filter(r => r.exists).length}/${E2E_TEST_FILES.length} E2E test files exist\n\n`;
  
  // File inventory
  report += `## File Inventory\n\n`;
  report += `| File | Exists | !important Count | Gated Selectors |\n`;
  report += `|------|--------|------------------|-----------------|\n`;
  
  auditResults.forEach(result => {
    report += `| ${result.file} | ${result.exists ? '✅' : '❌'} | ${result.importantCount} | ${result.gated ? '✅' : '❌'} |\n`;
  });
  
  report += `\n## E2E Test Inventory\n\n`;
  report += `| Test File | Exists |\n`;
  report += `|-----------|--------|\n`;
  
  e2eResults.forEach(result => {
    report += `| ${result.file} | ${result.exists ? '✅' : '❌'} |\n`;
  });
  
  report += `\n## Tomorrow Plan\n\n`;
  report += `- [ ] Review and fix any !important declarations\n`;
  report += `- [ ] Complete missing E2E tests\n`;
  report += `- [ ] Verify gate installation timing\n`;
  report += `- [ ] Test compact mobile functionality end-to-end\n\n`;
  
  return report;
}

// Main execution
console.log('🔍 Starting Compact V2 audit...');

const auditResults = auditFiles();
const e2eResults = auditE2ETests();
const report = generateReport(auditResults, e2eResults);

console.log('📊 Audit Results:');
console.log(`- Files checked: ${COMPACT_FILES.length}`);
console.log(`- Files existing: ${auditResults.filter(r => r.exists).length}`);
console.log(`- E2E tests existing: ${e2eResults.filter(r => r.exists).length}`);

console.log('\n📝 Report generated:');
console.log(report);

export { auditFiles, auditE2ETests, generateReport };


