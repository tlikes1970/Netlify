const { chromium } = require('playwright');

/**
 * Runtime testing helpers using Playwright
 */
class RuntimeTester {
  constructor() {
    this.browser = null;
    this.page = null;
    this.screenshots = [];
  }

  async init() {
    this.browser = await chromium.launch({ headless: true });
    this.page = await this.browser.newPage();

    // Set cache bypass for all requests
    await this.page.route('**/*', (route) => {
      route.continue({
        headers: {
          ...route.request().headers(),
          'Cache-Control': 'no-store, no-cache, must-revalidate',
          Pragma: 'no-cache',
        },
      });
    });
  }

  async cleanup() {
    if (this.browser) {
      await this.browser.close();
    }
  }

  async takeScreenshot(name) {
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const filename = `reports/assets/${timestamp}/${name}.png`;
    await this.page.screenshot({ path: filename, fullPage: true });
    this.screenshots.push(filename);
    return filename;
  }

  async expectStickySearch() {
    const result = { pass: false, evidence: '', error: null };

    try {
      // Find header and search elements
      const header = await this.page.$('header.header');
      const search = await this.page.$('.top-search, #search-container');

      if (!header || !search) {
        result.evidence = 'Header or search element not found';
        return result;
      }

      // Check computed styles
      const headerHeight = await this.page.evaluate(
        (el) => el.getBoundingClientRect().height,
        header,
      );
      const searchStyles = await this.page.evaluate((el) => {
        const computed = getComputedStyle(el);
        return {
          position: computed.position,
          top: computed.top,
          zIndex: computed.zIndex,
        };
      }, search);

      // Verify sticky positioning
      if (searchStyles.position !== 'sticky') {
        result.evidence = `Search position is ${searchStyles.position}, expected sticky`;
        return result;
      }

      // Verify top offset is reasonable (should be close to header height)
      const topValue = parseFloat(searchStyles.top);
      if (topValue < headerHeight * 0.8) {
        result.evidence = `Search top offset ${topValue}px is too small for header height ${headerHeight}px`;
        return result;
      }

      // Test scrolling behavior
      await this.page.evaluate(() => window.scrollTo(0, 100));
      await this.page.waitForTimeout(100);

      const searchRect = await this.page.evaluate((el) => el.getBoundingClientRect(), search);
      const headerRect = await this.page.evaluate((el) => el.getBoundingClientRect(), header);

      if (searchRect.top < headerRect.bottom) {
        result.evidence = 'Search does not stick properly under header when scrolling';
        return result;
      }

      result.pass = true;
      result.evidence = `Sticky search working: position=${searchStyles.position}, top=${searchStyles.top}, z-index=${searchStyles.zIndex}`;
    } catch (error) {
      result.error = error.message;
    }

    return result;
  }

  async expectZIndexOrder() {
    const result = { pass: false, evidence: '', error: null };

    try {
      const zIndexes = await this.page.evaluate(() => {
        const header = document.querySelector('header.header');
        const search = document.querySelector('.top-search, #search-container');
        const tabs = document.querySelector('.tab-container, #navigation');

        return {
          header: header ? getComputedStyle(header).zIndex : null,
          search: search ? getComputedStyle(search).zIndex : null,
          tabs: tabs ? getComputedStyle(tabs).zIndex : null,
        };
      });

      const expected = { header: '100', search: '95', tabs: '90' };
      const actual = {
        header: zIndexes.header,
        search: zIndexes.search,
        tabs: zIndexes.tabs,
      };

      if (
        actual.header !== expected.header ||
        actual.search !== expected.search ||
        actual.tabs !== expected.tabs
      ) {
        result.evidence = `Z-index mismatch: expected ${JSON.stringify(expected)}, got ${JSON.stringify(actual)}`;
        return result;
      }

      result.pass = true;
      result.evidence = `Z-index order correct: header=${actual.header}, search=${actual.search}, tabs=${actual.tabs}`;
    } catch (error) {
      result.error = error.message;
    }

    return result;
  }

  async expectCountsParity() {
    const result = { pass: false, evidence: '', error: null };

    try {
      const counts = await this.page.evaluate(() => {
        // Get adapter data
        const wl = window.__wl || {};
        const adapterCounts = {
          watching: (wl.watching || []).length,
          wishlist: (wl.wishlist || []).length,
          watched: (wl.watched || []).length,
        };

        // Get UI counts
        const uiCounts = {
          watching: document.querySelector('#watchingCount')?.textContent || '0',
          wishlist: document.querySelector('#wishlistCount')?.textContent || '0',
          watched: document.querySelector('#watchedCount')?.textContent || '0',
        };

        // Get badge counts
        const badgeCounts = {
          watching: document.querySelector('[data-tab="watching"] .badge')?.textContent || '0',
          wishlist: document.querySelector('[data-tab="wishlist"] .badge')?.textContent || '0',
          watched: document.querySelector('[data-tab="watched"] .badge')?.textContent || '0',
        };

        return { adapterCounts, uiCounts, badgeCounts };
      });

      const mismatches = [];

      // Check adapter vs UI counts
      Object.keys(counts.adapterCounts).forEach((key) => {
        const adapter = counts.adapterCounts[key];
        const ui = parseInt(counts.uiCounts[key]) || 0;
        if (adapter !== ui) {
          mismatches.push(`${key}: adapter=${adapter}, ui=${ui}`);
        }
      });

      // Check adapter vs badge counts
      Object.keys(counts.adapterCounts).forEach((key) => {
        const adapter = counts.adapterCounts[key];
        const badge = parseInt(counts.badgeCounts[key]) || 0;
        if (adapter !== badge) {
          mismatches.push(`${key}: adapter=${adapter}, badge=${badge}`);
        }
      });

      if (mismatches.length > 0) {
        result.evidence = `Count mismatches: ${mismatches.join('; ')}`;
        return result;
      }

      result.pass = true;
      result.evidence = `Counts parity verified: adapter=${JSON.stringify(counts.adapterCounts)}`;
    } catch (error) {
      result.error = error.message;
    }

    return result;
  }

  async expectSpanish() {
    const result = { pass: false, evidence: '', error: null, missingKeys: [] };

    try {
      // Switch to Spanish
      await this.page.evaluate(() => {
        document.documentElement.lang = 'es';
        if (window.i18n && typeof window.i18n.setLanguage === 'function') {
          window.i18n.setLanguage('es');
        }
      });

      await this.page.waitForTimeout(500);

      // Check for translated elements
      const translations = await this.page.evaluate(() => {
        const elements = document.querySelectorAll('[data-i18n]');
        const results = [];

        elements.forEach((el) => {
          const key = el.getAttribute('data-i18n');
          const text = el.textContent.trim();
          results.push({ key, text, element: el.tagName });
        });

        return results;
      });

      // Check for common card action translations
      const cardActions = await this.page.evaluate(() => {
        const actions = document.querySelectorAll('[data-action]');
        const results = [];

        actions.forEach((el) => {
          const action = el.getAttribute('data-action');
          const text = el.textContent.trim();
          const hasI18n = el.hasAttribute('data-i18n');
          results.push({ action, text, hasI18n });
        });

        return results;
      });

      // Find missing i18n keys
      const missingKeys = cardActions
        .filter((action) => !action.hasI18n && action.text.length > 0)
        .map((action) => action.action);

      result.missingKeys = [...new Set(missingKeys)];
      result.pass = translations.length > 0;
      result.evidence = `Found ${translations.length} i18n elements, ${result.missingKeys.length} missing keys: ${result.missingKeys.join(', ')}`;
    } catch (error) {
      result.error = error.message;
    }

    return result;
  }

  async expectDiscoverLayout() {
    const result = { pass: false, evidence: '', error: null };

    try {
      // Navigate to Discover tab
      const discoverTab = await this.page.$('[data-tab="discover"]');
      if (!discoverTab) {
        result.evidence = 'Discover tab not found';
        return result;
      }

      await discoverTab.click();
      await this.page.waitForTimeout(500);

      // Check for discover section
      const discoverSection = await this.page.$('#discoverSection');
      if (!discoverSection) {
        result.evidence = 'Discover section not found';
        return result;
      }

      // Check for containers and actions
      const containers = await this.page.evaluate(() => {
        const section = document.querySelector('#discoverSection');
        if (!section) return { containers: 0, actions: 0 };

        const containers = section.querySelectorAll('.preview-row-container, .card, .tab-section');
        const actions = section.querySelectorAll('[data-action]');

        return {
          containers: containers.length,
          actions: actions.length,
          containerTypes: Array.from(containers).map((c) => c.className),
        };
      });

      if (containers.containers === 0) {
        result.evidence = 'No containers found in Discover section';
        return result;
      }

      result.pass = true;
      result.evidence = `Discover layout OK: ${containers.containers} containers, ${containers.actions} actions`;
    } catch (error) {
      result.error = error.message;
    }

    return result;
  }

  async expectAuthModalStable() {
    const result = { pass: false, evidence: '', error: null };

    try {
      // Clear console logs
      await this.page.evaluate(() => console.clear());

      // Click account button
      const accountButton = await this.page.$('#accountButton');
      if (!accountButton) {
        result.evidence = 'Account button not found';
        return result;
      }

      await accountButton.click();
      await this.page.waitForTimeout(1000);

      // Check for provider modal
      const providerModal = await this.page.$('#providerModal');
      if (!providerModal) {
        result.evidence = 'Provider modal did not open';
        return result;
      }

      // Check console for "alreadyOpen" loop
      const logs = await this.page.evaluate(() => {
        return window.consoleLogs || [];
      });

      const alreadyOpenLogs = logs.filter(
        (log) => log.includes('alreadyOpen') || log.includes('already open'),
      );

      if (alreadyOpenLogs.length > 1) {
        result.evidence = `Found ${alreadyOpenLogs.length} "alreadyOpen" logs: ${alreadyOpenLogs.join('; ')}`;
        return result;
      }

      result.pass = true;
      result.evidence = `Auth modal opened successfully, ${alreadyOpenLogs.length} alreadyOpen logs`;
    } catch (error) {
      result.error = error.message;
    }

    return result;
  }

  async expectFlickWordUsable() {
    const result = { pass: false, evidence: '', error: null };

    try {
      // Find and click FlickWord button
      const flickWordButton = await this.page.$(
        '[data-action="flickword"], #flickwordButton, .flickword-button',
      );
      if (!flickWordButton) {
        result.evidence = 'FlickWord button not found';
        return result;
      }

      await flickWordButton.click();
      await this.page.waitForTimeout(1000);

      // Check for modal
      const modal = await this.page.$('#modal-flickword, .game-modal');
      if (!modal) {
        result.evidence = 'FlickWord modal did not open';
        return result;
      }

      // Check modal visibility and size
      const modalInfo = await this.page.evaluate((el) => {
        const rect = el.getBoundingClientRect();
        const computed = getComputedStyle(el);
        return {
          visible: rect.width > 0 && rect.height > 0,
          width: rect.width,
          height: rect.height,
          display: computed.display,
          visibility: computed.visibility,
          zIndex: computed.zIndex,
        };
      }, modal);

      if (!modalInfo.visible) {
        result.evidence = `Modal not visible: ${JSON.stringify(modalInfo)}`;
        return result;
      }

      // Check for buttons
      const buttons = await this.page.evaluate(() => {
        const modal = document.querySelector('#modal-flickword, .game-modal');
        if (!modal) return { count: 0, clickable: 0 };

        const buttons = modal.querySelectorAll('button');
        const clickable = Array.from(buttons).filter((btn) => !btn.disabled);

        return { count: buttons.length, clickable: clickable.length };
      });

      if (buttons.count === 0) {
        result.evidence = 'No buttons found in FlickWord modal';
        return result;
      }

      result.pass = true;
      result.evidence = `FlickWord modal OK: ${modalInfo.width}x${modalInfo.height}, ${buttons.clickable}/${buttons.count} buttons clickable`;
    } catch (error) {
      result.error = error.message;
    }

    return result;
  }

  async checkFunctionsJSSyntax() {
    const result = { pass: false, evidence: '', error: null };

    try {
      // Read functions.js and check around line 3896
      const content = await this.page.evaluate(() => {
        // Try to get the content via fetch with cache bypass
        return fetch('/js/functions.js', { cache: 'no-store' })
          .then((r) => r.text())
          .catch(() => null);
      });

      if (!content) {
        result.evidence = 'Could not fetch functions.js content';
        return result;
      }

      const lines = content.split('\n');
      const startLine = Math.max(0, 3850);
      const endLine = Math.min(lines.length, 3950);
      const slice = lines.slice(startLine, endLine);

      // Check for unbalanced quotes, backticks, braces
      const issues = [];
      let quoteCount = 0;
      let backtickCount = 0;
      let braceCount = 0;
      let parenCount = 0;

      slice.forEach((line, index) => {
        const lineNum = startLine + index + 1;

        // Count quotes (simple check)
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

      if (issues.length > 0) {
        result.evidence = `Syntax issues found: ${issues.join('; ')}`;
        return result;
      }

      result.pass = true;
      result.evidence = `Functions.js syntax OK in lines ${startLine}-${endLine}`;
    } catch (error) {
      result.error = error.message;
    }

    return result;
  }
}

module.exports = { RuntimeTester };
