// Home Self-Test - Verifies DOM matches config at runtime
// Shows visible red banner if anything mismatches so drift cannot be ignored

(async function () {
  async function loadConfig() {
    const res = await fetch('/config/home-wiring.json', { cache: 'no-store' });
    if (!res.ok) throw new Error(`home-wiring.json ${res.status}`);
    return res.json();
  }

  function norm(s) {
    return (s || '').trim().toLowerCase().replace(/\s+/g, ' ');
  }

  function showBanner(lines) {
    const bar = document.createElement('div');
    bar.style.cssText =
      'position:fixed;z-index:99999;left:0;right:0;bottom:0;background:#ffeded;color:#b00020;border-top:2px solid #b00020;font:12px/1.4 system-ui;padding:8px 12px;';
    bar.innerHTML = `<strong>Home wiring check failed</strong><br>${lines.map((l) => `• ${l}`).join('<br>')}`;
    document.body.appendChild(bar);
  }

  const cfg = await loadConfig();
  const errs = [];

  cfg.rails.forEach((r) => {
    const head = r.headingSelector ? document.querySelector(r.headingSelector) : null;
    const cont = document.querySelector(r.containerSelector);
    if (!cont) errs.push(`Missing container: ${r.containerSelector} for "${r.title}"`);
    if (!head) errs.push(`Missing heading: ${r.headingSelector} for "${r.title}"`);
    if (head && norm(head.textContent) !== norm(r.title)) {
      errs.push(
        `Heading text mismatch for "${r.key}": expected "${r.title}", found "${head.textContent.trim()}"`,
      );
    }
  });

  if (errs.length) {
    console.group('[home-selftest] ERRORS');
    errs.forEach((e) => console.error(e));
    console.groupEnd();
    showBanner(errs);
  } else {
    console.info('[home-selftest] OK — Home matches config');
  }
})().catch((e) => console.error('[home-selftest] failed', e));
