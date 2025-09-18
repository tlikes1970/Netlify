// Settings Self-Test - Verifies DOM matches config at runtime
// Shows visible red banner if anything mismatches so drift cannot be ignored

(async function () {
  async function loadConfig() {
    const res = await fetch('/config/settings-wiring.json', { cache: 'no-store' });
    if (!res.ok) throw new Error(`settings-wiring.json ${res.status}`);
    return res.json();
  }

  function norm(s){ return (s||'').trim().toLowerCase().replace(/\s+/g,' '); }

  function showBanner(lines) {
    const bar = document.createElement('div');
    bar.style.cssText = 'position:fixed;z-index:99999;left:0;right:0;bottom:0;background:#ffeded;color:#b00020;border-top:2px solid #b00020;font:12px/1.4 system-ui;padding:8px 12px;';
    bar.innerHTML = `<strong>Settings wiring check failed</strong><br>${lines.map(l=>`• ${l}`).join('<br>')}`;
    document.body.appendChild(bar);
  }

  const cfg = await loadConfig();
  const errs = [];

  // Check tabs
  cfg.tabs.forEach(tabName => {
    const tab = document.querySelector(`[data-target="#${tabName.toLowerCase()}"]`);
    if (!tab) {
      errs.push(`Missing tab: ${tabName}`);
    }
  });

  // Check groups and controls
  cfg.groups.forEach(group => {
    const groupSection = document.querySelector(`#${group.key}`);
    if (!groupSection) {
      errs.push(`Missing group section: #${group.key} for "${group.title}"`);
    }

    group.controls.forEach(control => {
      if (!control.selector) {
        errs.push(`Empty selector for control: ${control.key} in ${group.title}`);
        return;
      }

      const element = document.querySelector(control.selector);
      if (!element) {
        errs.push(`Missing control element: ${control.selector} for "${control.label}" in ${group.title}`);
      } else {
        // Verify element type matches control type
        const expectedTag = {
          'toggle': 'input',
          'select': 'select',
          'text': 'input',
          'button': 'button',
          'file': 'input',
          'multiselect': 'input',
          'label': 'h3,h4,h5,div,span,form'
        }[control.type];

        if (expectedTag && !element.matches(expectedTag)) {
          errs.push(`Type mismatch for ${control.key}: expected ${expectedTag}, found ${element.tagName.toLowerCase()}`);
        }
      }
    });
  });

  if (errs.length) {
    console.group('[settings-selftest] ERRORS');
    errs.forEach(e => console.error(e));
    console.groupEnd();
    showBanner(errs);
  } else {
    console.info('[settings-selftest] OK — Settings matches config');
  }
})().catch(e => console.error('[settings-selftest] failed', e));
