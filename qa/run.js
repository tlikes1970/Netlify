const fs = require('fs');
const path = require('path');
const { grep } = require('./tools/grep');
const { RuntimeTester } = require('./tools/runtime');

class QAAuditor {
  constructor() {
    this.results = [];
    this.timestamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, 19);
    this.reportDir = `reports/assets/${this.timestamp}`;
    this.serverUrl = null;
    this.runtimeTester = null;
  }

  async init() {
    // Create report directory
    if (!fs.existsSync('reports')) {
      fs.mkdirSync('reports', { recursive: true });
    }
    if (!fs.existsSync(this.reportDir)) {
      fs.mkdirSync(this.reportDir, { recursive: true });
    }

    // Probe for server
    this.serverUrl = await this.probeServer();
    if (this.serverUrl) {
      this.runtimeTester = new RuntimeTester();
      await this.runtimeTester.init();
    }
  }

  async probeServer() {
    const urls = ['http://localhost:8888', 'http://localhost:8080', 'http://localhost:8000'];

    for (const url of urls) {
      try {
        const response = await fetch(url, {
          method: 'HEAD',
          cache: 'no-store',
          signal: AbortSignal.timeout(2000),
        });
        if (response.ok) {
          console.log(`✓ Server found at ${url}`);
          return url;
        }
      } catch (error) {
        // Continue to next URL
      }
    }

    console.log('⚠ No server found, running in static mode');
    return null;
  }

  addResult(id, kind, pass, evidence, path = '', screenshot = '') {
    this.results.push({
      id,
      kind,
      status: pass ? 'PASS' : 'FAIL',
      evidence,
      path,
      screenshot,
      timestamp: new Date().toISOString(),
    });
  }

  addSkip(id, kind, reason) {
    this.results.push({
      id,
      kind,
      status: 'SKIP',
      evidence: reason,
      path: '',
      screenshot: '',
      timestamp: new Date().toISOString(),
    });
  }

  async runStaticChecks() {
    console.log('Running static checks...');

    // 1. File presence checks
    const newFiles = [
      'www/js/settings-schema.json',
      'www/js/settings-schema.js',
      'www/js/settings-renderer.js',
      'www/js/settings-state.js',
      'www/js/settings-validate.js',
      'www/js/settings-effects.js',
      'www/js/settings-pro-gate.js',
      'www/js/layout/search-sticky.js',
      'scripts/dev/validate-sticky.js',
    ];

    const modifiedFiles = [
      'www/index.html',
      'www/js/app.js',
      'www/styles/main.css',
      'www/styles/mobile-hotfix.css',
    ];

    [...newFiles, ...modifiedFiles].forEach((file) => {
      const exists = fs.existsSync(file);
      this.addResult(
        `file-${file.replace(/[^a-zA-Z0-9]/g, '-')}`,
        'File Presence',
        exists,
        exists ? `File exists` : `File missing`,
        file,
      );
    });

    // 2. Schema sanity check
    try {
      const schemaPath = 'www/js/settings-schema.json';
      if (fs.existsSync(schemaPath)) {
        const schema = JSON.parse(fs.readFileSync(schemaPath, 'utf8'));
        const hasSettings = Array.isArray(schema.settings);
        const hasValidSettings = schema.settings.every(
          (s) => s.id && s.storageKey && s.type && (s.default !== undefined || s.options),
        );

        this.addResult(
          'schema-sanity',
          'Schema Validation',
          hasSettings && hasValidSettings,
          hasSettings && hasValidSettings
            ? `Schema valid with ${schema.settings.length} settings`
            : 'Schema invalid structure',
          schemaPath,
        );
      } else {
        this.addResult(
          'schema-sanity',
          'Schema Validation',
          false,
          'Schema file missing',
          schemaPath,
        );
      }
    } catch (error) {
      this.addResult(
        'schema-sanity',
        'Schema Validation',
        false,
        `Schema parse error: ${error.message}`,
        'www/js/settings-schema.json',
      );
    }

    // 3. Import wiring checks
    const importChecks = [
      { file: 'www/index.html', pattern: 'settings-schema\\.js', desc: 'Schema module import' },
      { file: 'www/index.html', pattern: 'settings-effects\\.js', desc: 'Effects module import' },
      { file: 'www/index.html', pattern: 'settings-pro-gate\\.js', desc: 'Pro gate module import' },
      { file: 'www/js/app.js', pattern: 'toggle-theme', desc: 'Toggle theme handler' },
    ];

    importChecks.forEach((check) => {
      const hits = grep([check.file], [check.pattern]);
      this.addResult(
        `import-${check.desc.replace(/\s+/g, '-').toLowerCase()}`,
        'Import Wiring',
        hits.length > 0,
        hits.length > 0 ? `Found ${hits.length} matches` : 'Not found',
        check.file,
      );
    });

    // 4. CSS variables check
    const cssVarChecks = [
      { file: 'www/styles/main.css', pattern: '--header-h', desc: 'Header height variable' },
      { file: 'www/styles/main.css', pattern: '--tabs-h', desc: 'Tabs height variable' },
      { file: 'www/styles/main.css', pattern: '--search-h', desc: 'Search height variable' },
      { file: 'www/styles/main.css', pattern: 'position:\\s*sticky', desc: 'Sticky positioning' },
    ];

    cssVarChecks.forEach((check) => {
      const hits = grep([check.file], [check.pattern]);
      this.addResult(
        `css-${check.desc.replace(/\s+/g, '-').toLowerCase()}`,
        'CSS Variables',
        hits.length > 0,
        hits.length > 0 ? `Found ${hits.length} matches` : 'Not found',
        check.file,
      );
    });

    // 5. Functions.js syntax check
    try {
      const functionsPath = 'www/js/functions.js';
      if (fs.existsSync(functionsPath)) {
        const content = fs.readFileSync(functionsPath, 'utf8');
        const lines = content.split('\n');
        const startLine = Math.max(0, 3850);
        const endLine = Math.min(lines.length, 3950);
        const slice = lines.slice(startLine, endLine);

        const issues = [];
        slice.forEach((line, index) => {
          const lineNum = startLine + index + 1;
          const singleQuotes = (line.match(/'/g) || []).length;
          const doubleQuotes = (line.match(/"/g) || []).length;
          const backticks = (line.match(/`/g) || []).length;
          const braces = (line.match(/\{/g) || []).length - (line.match(/\}/g) || []).length;
          const parens = (line.match(/\(/g) || []).length - (line.match(/\)/g) || []).length;

          if (singleQuotes % 2 !== 0) issues.push(`Line ${lineNum}: unbalanced single quotes`);
          if (doubleQuotes % 2 !== 0) issues.push(`Line ${lineNum}: unbalanced double quotes`);
          if (backticks % 2 !== 0) issues.push(`Line ${lineNum}: unbalanced backticks`);
          if (braces !== 0) issues.push(`Line ${lineNum}: unbalanced braces (${braces})`);
          if (parens !== 0) issues.push(`Line ${lineNum}: unbalanced parentheses (${parens})`);
        });

        this.addResult(
          'functions-syntax',
          'Functions.js Syntax',
          issues.length === 0,
          issues.length === 0
            ? `Syntax OK in lines ${startLine}-${endLine}`
            : `Issues: ${issues.join('; ')}`,
          functionsPath,
        );
      } else {
        this.addResult(
          'functions-syntax',
          'Functions.js Syntax',
          false,
          'Functions.js file missing',
          functionsPath,
        );
      }
    } catch (error) {
      this.addResult(
        'functions-syntax',
        'Functions.js Syntax',
        false,
        `Error: ${error.message}`,
        'www/js/functions.js',
      );
    }

    // 6. Prettier check
    try {
      const { execSync } = require('child_process');
      const result = execSync('npx prettier --check www/', { encoding: 'utf8' });
      this.addResult('prettier-check', 'Code Formatting', true, 'Prettier check passed', 'www/');
    } catch (error) {
      this.addResult(
        'prettier-check',
        'Code Formatting',
        false,
        `Prettier issues: ${error.message}`,
        'www/',
      );
    }
  }

  async runRuntimeChecks() {
    if (!this.runtimeTester) {
      console.log('Skipping runtime checks - no server available');
      return;
    }

    console.log('Running runtime checks...');

    try {
      // Navigate to the app
      await this.runtimeTester.page.goto(this.serverUrl, {
        waitUntil: 'networkidle',
        timeout: 10000,
      });

      // Set up console logging
      await this.runtimeTester.page.evaluate(() => {
        window.consoleLogs = [];
        const originalLog = console.log;
        console.log = (...args) => {
          window.consoleLogs.push(args.join(' '));
          originalLog.apply(console, args);
        };
      });

      // 1. Sticky search test
      const stickyResult = await this.runtimeTester.expectStickySearch();
      this.addResult(
        'runtime-sticky-search',
        'Sticky Search',
        stickyResult.pass,
        stickyResult.evidence,
        'runtime',
        stickyResult.pass ? await this.runtimeTester.takeScreenshot('sticky-search') : '',
      );

      // 2. Z-index order test
      const zIndexResult = await this.runtimeTester.expectZIndexOrder();
      this.addResult(
        'runtime-z-index',
        'Z-Index Order',
        zIndexResult.pass,
        zIndexResult.evidence,
        'runtime',
      );

      // 3. Counts parity test
      const countsResult = await this.runtimeTester.expectCountsParity();
      this.addResult(
        'runtime-counts-parity',
        'Counts Parity',
        countsResult.pass,
        countsResult.evidence,
        'runtime',
      );

      // 4. Spanish translation test
      const spanishResult = await this.runtimeTester.expectSpanish();
      this.addResult(
        'runtime-spanish',
        'Spanish Translation',
        spanishResult.pass,
        spanishResult.evidence,
        'runtime',
      );

      // 5. Discover layout test
      const discoverResult = await this.runtimeTester.expectDiscoverLayout();
      this.addResult(
        'runtime-discover',
        'Discover Layout',
        discoverResult.pass,
        discoverResult.evidence,
        'runtime',
      );

      // 6. Auth modal stability test
      const authResult = await this.runtimeTester.expectAuthModalStable();
      this.addResult(
        'runtime-auth-modal',
        'Auth Modal',
        authResult.pass,
        authResult.evidence,
        'runtime',
        authResult.pass ? await this.runtimeTester.takeScreenshot('auth-modal') : '',
      );

      // 7. FlickWord modal test
      const flickWordResult = await this.runtimeTester.expectFlickWordUsable();
      this.addResult(
        'runtime-flickword',
        'FlickWord Modal',
        flickWordResult.pass,
        flickWordResult.evidence,
        'runtime',
        flickWordResult.pass ? await this.runtimeTester.takeScreenshot('flickword-modal') : '',
      );

      // 8. Functions.js syntax check (runtime)
      const functionsResult = await this.runtimeTester.checkFunctionsJSSyntax();
      this.addResult(
        'runtime-functions-syntax',
        'Functions.js Syntax (Runtime)',
        functionsResult.pass,
        functionsResult.evidence,
        'runtime',
      );
    } catch (error) {
      console.error('Runtime check error:', error);
      this.addResult('runtime-error', 'Runtime Error', false, error.message, 'runtime');
    }
  }

  async generateReport() {
    const reportPath = `reports/status_${this.timestamp}.md`;
    const jsonPath = `reports/status_${this.timestamp}.json`;

    // Generate Markdown report
    const mdReport = this.generateMarkdownReport();
    fs.writeFileSync(reportPath, mdReport);

    // Generate JSON report
    const jsonReport = {
      timestamp: this.timestamp,
      serverUrl: this.serverUrl,
      environment: {
        node: process.version,
        platform: process.platform,
        arch: process.arch,
      },
      git: await this.getGitInfo(),
      results: this.results,
      summary: this.getSummary(),
    };
    fs.writeFileSync(jsonPath, JSON.stringify(jsonReport, null, 2));

    return { reportPath, jsonPath };
  }

  generateMarkdownReport() {
    const summary = this.getSummary();
    const passCount = this.results.filter((r) => r.status === 'PASS').length;
    const failCount = this.results.filter((r) => r.status === 'FAIL').length;
    const skipCount = this.results.filter((r) => r.status === 'SKIP').length;

    let md = `# QA Audit Report - ${this.timestamp}\n\n`;
    md += `**Environment:** Node ${process.version} on ${process.platform}\n`;
    md += `**Server:** ${this.serverUrl || 'None (static mode)'}\n`;
    md += `**Git:** ${this.getGitInfoSync()}\n\n`;
    md += `## Summary\n\n`;
    md += `- ✅ **PASS:** ${passCount}\n`;
    md += `- ❌ **FAIL:** ${failCount}\n`;
    md += `- ⏭️ **SKIP:** ${skipCount}\n\n`;

    if (failCount > 0) {
      md += `## ❌ Failures\n\n`;
      const failures = this.results.filter((r) => r.status === 'FAIL');
      failures.forEach((result) => {
        md += `### ${result.id}\n`;
        md += `**Kind:** ${result.kind}\n`;
        md += `**Evidence:** ${result.evidence}\n`;
        md += `**Path:** ${result.path}\n\n`;
      });
    }

    md += `## 📊 Detailed Results\n\n`;
    md += `| ID | Kind | Status | Evidence | Path | Screenshot |\n`;
    md += `|----|------|--------|----------|------|------------|\n`;

    this.results.forEach((result) => {
      const status = result.status === 'PASS' ? '✅' : result.status === 'FAIL' ? '❌' : '⏭️';
      const screenshot = result.screenshot ? `[📷](${result.screenshot})` : '';
      md += `| ${result.id} | ${result.kind} | ${status} | ${result.evidence} | ${result.path} | ${screenshot} |\n`;
    });

    return md;
  }

  getSummary() {
    const passCount = this.results.filter((r) => r.status === 'PASS').length;
    const failCount = this.results.filter((r) => r.status === 'FAIL').length;
    const skipCount = this.results.filter((r) => r.status === 'SKIP').length;
    const total = this.results.length;

    return {
      total,
      pass: passCount,
      fail: failCount,
      skip: skipCount,
      successRate: total > 0 ? Math.round((passCount / total) * 100) : 0,
    };
  }

  getGitInfoSync() {
    try {
      const { execSync } = require('child_process');
      const branch = execSync('git branch --show-current', { encoding: 'utf8' }).trim();
      const commit = execSync('git rev-parse HEAD', { encoding: 'utf8' }).trim().slice(0, 8);
      return `${branch}@${commit}`;
    } catch {
      return 'Unknown';
    }
  }

  async getGitInfo() {
    try {
      const { execSync } = require('child_process');
      const branch = execSync('git branch --show-current', { encoding: 'utf8' }).trim();
      const commit = execSync('git rev-parse HEAD', { encoding: 'utf8' }).trim();
      const message = execSync('git log -1 --pretty=%s', { encoding: 'utf8' }).trim();
      return { branch, commit, message };
    } catch {
      return { branch: 'Unknown', commit: 'Unknown', message: 'Unknown' };
    }
  }

  async cleanup() {
    if (this.runtimeTester) {
      await this.runtimeTester.cleanup();
    }
  }
}

async function main() {
  const auditor = new QAAuditor();

  try {
    await auditor.init();
    await auditor.runStaticChecks();
    await auditor.runRuntimeChecks();

    const { reportPath, jsonPath } = await auditor.generateReport();
    const summary = auditor.getSummary();

    console.log(`\n📊 QA Audit Complete:`);
    console.log(`   ✅ PASS: ${summary.pass}`);
    console.log(`   ❌ FAIL: ${summary.fail}`);
    console.log(`   ⏭️ SKIP: ${summary.skip}`);
    console.log(`   📈 Success Rate: ${summary.successRate}%`);
    console.log(`\n📄 Reports:`);
    console.log(`   📝 Markdown: ${reportPath}`);
    console.log(`   📊 JSON: ${jsonPath}`);

    if (summary.fail > 0) {
      console.log(`\n❌ ${summary.fail} failures detected. Check the report for details.`);
      process.exit(1);
    } else {
      console.log(`\n✅ All checks passed!`);
      process.exit(0);
    }
  } catch (error) {
    console.error('QA Audit failed:', error);
    process.exit(1);
  } finally {
    await auditor.cleanup();
  }
}

if (require.main === module) {
  main();
}

module.exports = { QAAuditor };
