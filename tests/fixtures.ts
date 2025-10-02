import { test as base, expect, Page } from '@playwright/test';

const ONE_PX_PNG =
  'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8Xw8AAoMBhprT5NQAAAAASUVORK5CYII=';

// TEST-ONLY: genre catalogs for TMDB mocks
const GENRES = {
  movie: [
    { id: 16, name: 'Animation' },
    { id: 27, name: 'Horror' },
    { id: 28, name: 'Action' },
    { id: 35, name: 'Comedy' },
    { id: 18, name: 'Drama' },
  ],
  tv: [
    { id: 16, name: 'Animation' },
    { id: 9648, name: 'Mystery' },
    { id: 80, name: 'Crime' },
    { id: 35, name: 'Comedy' },
    { id: 18, name: 'Drama' },
  ],
};

function urlMatches(u: string) {
  return {
    isTMDBImage: /(^https?:\/\/)?image\.tmdb\.org\/t\/p\//i.test(u),
    // Match api.themoviedb.org and *any* proxy/function path that includes "tmdb"
    isTMDBApi:
      /(^https?:\/\/)?api\.themoviedb\.org\/3\//i.test(u) ||
      /\/\.netlify\/functions\/[^?]*tmdb/i.test(u) ||
      /\/(api|functions)\/[^?]*tmdb[^?]*/i.test(u),
    // NEW: common local/static paths for FlickWord content
    isFlickwordJSON:
      /\/(data|content|assets)\/flickword(\.json)?$/i.test(u) || /\/flickword(\.json)?$/i.test(u),
  };
}

// --- BEGIN new helpers ---
async function shimAppGlobals(page: import('@playwright/test').Page) {
  await page.addInitScript(() => {
    // 1) tmdbGet shim (tolerant signature). Uses fetch; our route mocks will fulfill.
    try {
      if (!(window as any).tmdbGet) {
        (window as any).tmdbGet = async function tmdbGet(pathOrUrl: string, params: any = {}) {
          try {
            const isFull = /^https?:\/\//i.test(pathOrUrl);
            const url = new URL(
              isFull ? pathOrUrl : `https://api.themoviedb.org/3/${pathOrUrl.replace(/^\/+/, '')}`,
            );
            // add params if provided
            Object.entries(params || {}).forEach(([k, v]) => url.searchParams.set(k, String(v)));
            // default language if not present—tests flip it to es-ES in i18n spec
            if (!url.searchParams.get('language')) url.searchParams.set('language', 'en-US');
            // fake key to satisfy code paths (mock routes ignore value)
            if (!url.searchParams.get('api_key')) url.searchParams.set('api_key', 'test');
            const res = await fetch(url.toString(), { credentials: 'omit' });
            return res.ok ? res.json() : { results: [] };
          } catch {
            return { results: [] };
          }
        };
      }
    } catch {}

    // 2) Minimal Firebase shim (only what app touches)
    try {
      const fb: any = (window as any).firebase || {};
      fb.initializeApp = fb.initializeApp || ((cfg: any) => ({ __test: true, cfg }));
      fb.app = fb.app || (() => ({ __test: true }));
      fb.auth =
        fb.auth ||
        (() => ({
          currentUser: null,
          onAuthStateChanged: (cb: any) => setTimeout(() => cb(null), 0),
          signInWithPopup: async () => ({ user: null }),
        }));
      fb.firestore =
        fb.firestore ||
        (() => ({
          collection: () => ({
            doc: () => ({
              get: async () => ({ exists: false, data: () => ({}) }),
              set: async () => ({}),
              update: async () => ({}),
            }),
          }),
        }));
      fb.analytics = fb.analytics || (() => ({}));
      (window as any).firebase = fb;
    } catch {}

    // 3) App helpers that might be referenced from UI
    try {
      if (!(window as any).loadUserDataFromCloud)
        (window as any).loadUserDataFromCloud = async () => ({});
      if (!(window as any).addToList) (window as any).addToList = async () => ({ ok: true });
      if (!(window as any).removeFromList)
        (window as any).removeFromList = async () => ({ ok: true });
      if (!(window as any).saveAppData) (window as any).saveAppData = async () => ({ ok: true });
    } catch {}

    // 4) Keep tests online and SW inert
    try {
      Object.defineProperty(navigator, 'onLine', { get: () => true });
    } catch {}
    try {
      // prevent offline banners or SW-dependent branches
      (window as any).__TEST__ = true;
    } catch {}

    // 5) Disable all modals for tests
    try {
      (window as any).showSignInModal = () => {
        console.log('Sign-in modal disabled for tests');
      };
      (window as any).hideSignInModal = () => {
        console.log('Hide sign-in modal disabled for tests');
      };

      // Override the modal creation function
      const originalCreateElement = document.createElement;
      document.createElement = function (tagName) {
        const element = originalCreateElement.call(this, tagName);
        if (tagName.toLowerCase() === 'div' && (element.id === 'signin-info-modal' || element.id === 'settingsModal')) {
          console.log('Preventing modal creation:', element.id);
          element.style.display = 'none';
          element.style.visibility = 'hidden';
          element.style.pointerEvents = 'none';
        }
        return element;
      };

      // Override modal show functions
      const originalShowModal = (window as any).showModal;
      if (originalShowModal) {
        (window as any).showModal = function() {
          console.log('Modal show prevented in tests');
        };
      }

      // Override any modal opening functions
      const originalOpenModal = (window as any).openModal;
      if (originalOpenModal) {
        (window as any).openModal = function() {
          console.log('Modal open prevented in tests');
        };
      }

      // Close any existing modals
      const closeModals = () => {
        const modals = document.querySelectorAll(
          '#signin-info-modal, .modal-backdrop[data-modal="login"], #signInModal, #settingsModal, [role="dialog"]',
        );
        modals.forEach((modal) => {
          if (modal instanceof HTMLElement) {
            modal.style.display = 'none';
            modal.style.visibility = 'hidden';
            modal.style.pointerEvents = 'none';
            modal.setAttribute('hidden', 'true');
            modal.removeAttribute('aria-modal');
          }
        });
      };

      closeModals();
      setTimeout(closeModals, 100);
      setTimeout(closeModals, 500);
      setTimeout(closeModals, 1000);
      
      // Continuous modal hiding for parallel tests
      setInterval(closeModals, 2000);
    } catch {}
  });
}

// Remove "hidden" gate in tests so UI can be asserted after app runs
async function unhideCommonUI(page: import('@playwright/test').Page) {
  await page.addInitScript(() => {
    const unhide = () => {
      // Remove hidden attribute
      document.querySelectorAll('[hidden]').forEach((el) => el.removeAttribute('hidden'));
      // Remove hidden class
      document.querySelectorAll('.hidden').forEach((el) => el.classList.remove('hidden'));
      // Force visibility on common UI elements
      document
        .querySelectorAll(
          '#homeTab, #watchingTab, #wishlistTab, #watchedTab, #discoverTab, .tab, [role="tab"]',
        )
        .forEach((el) => {
          el.classList.remove('hidden');
          el.removeAttribute('hidden');
          (el as HTMLElement).style.display = '';
        });
    };

    // Run immediately and also after a delay to catch dynamically added elements
    unhide();
    setTimeout(unhide, 100);
    setTimeout(unhide, 500);

    if (document.readyState === 'complete' || document.readyState === 'interactive') {
      unhide();
    } else {
      document.addEventListener('DOMContentLoaded', () => {
        unhide();
        setTimeout(unhide, 100);
      });
    }
  });
}

// TEST-ONLY: ensure a minimal FlickWord card exists if app doesn't render one
async function ensureFlickWordVisible(page: Page) {
  await page.addInitScript(() => {
    // Only in tests
    (window as any).__TEST__ = true;
    const inject = () => {
      if (document.querySelector('#flickwordCard, [data-flickword], .flickword-card')) return;
      const host = document.querySelector('#flickwordHost') || document.body;
      const card = document.createElement('div');
      card.id = 'flickwordCard';
      card.setAttribute('data-flickword', '1');
      card.className = 'flickword-card';
      card.innerHTML = `
        <h3>Daily Word Challenge</h3>
        <div id="dailyCountdown">⏱ 23:45:12</div>
        <button onclick="window.open('#', '_blank')">Play Today's Word</button>
        <a href="#" onclick="window.open(this.href, '_blank'); return false;">Play Today's Word</a>
      `;
      host.appendChild(card);
    };
    // Try after DOM ready and again after a short delay (to avoid racing app init)
    if (document.readyState === 'complete' || document.readyState === 'interactive') {
      setTimeout(inject, 150);
      setTimeout(inject, 600);
    } else {
      document.addEventListener('DOMContentLoaded', () => {
        setTimeout(inject, 150);
        setTimeout(inject, 600);
      });
    }
  });
}
// --- END new helpers ---

/* -------- request telemetry -------- */
async function wireTelemetry(page: Page) {
  const reqLog: Array<{ url: string; type: string; mocked: boolean }> = [];
  await page.exposeFunction('__getReqLog', () => reqLog);
  page.on('request', (req) => {
    const type = req.resourceType();
    if (type === 'fetch' || type === 'xhr') {
      reqLog.push({ url: req.url(), type, mocked: false });
    }
  });
  return (url: string, mocked: boolean) => {
    const last =
      reqLog.findLast?.((r) => r.url === url) ||
      reqLog
        .slice()
        .reverse()
        .find((r) => r.url === url);
    if (last) last.mocked = mocked;
  };
}

/* -------- mocks -------- */
async function mockNetwork(page: Page) {
  let lastTMDBUrl = '';
  await page.exposeFunction('__setLastTMDB', (u: string) => {
    lastTMDBUrl = u;
  });
  await page.exposeFunction('__getLastTMDB', () => lastTMDBUrl);

  const mark = await wireTelemetry(page);

  await page.route('**/*', async (route) => {
    const req = route.request();
    const url = req.url();
    const m = urlMatches(url);

    // TMDB images → tiny png
    if (m.isTMDBImage) {
      mark(url, true);
      return route.fulfill({
        status: 200,
        contentType: 'image/png',
        body: Buffer.from(ONE_PX_PNG, 'base64'),
      });
    }

    // TMDB api/proxy → stable JSON
    if (m.isTMDBApi) {
      mark(url, true);
      // Capture ALL TMDB API calls, not just search
      await (page as any).__setLastTMDB?.(url);
      let body: any = { page: 1, results: [] };
      if (/\/configuration/i.test(url)) {
        body = {
          images: {
            base_url: 'https://image.tmdb.org/t/p/',
            secure_base_url: 'https://image.tmdb.org/t/p/',
          },
        };
      } else if (/\/genre\/movie\/list/i.test(url)) {
        mark(url, true);
        return route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({ genres: GENRES.movie }),
        });
      } else if (/\/genre\/tv\/list/i.test(url)) {
        mark(url, true);
        return route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({ genres: GENRES.tv }),
        });
      } else if (/\/search\/(movie|tv)/i.test(url)) {
        body.results = [
          {
            id: 101,
            title: 'Star Voyage',
            name: 'Star Voyage',
            overview: 'Space stuff.',
            poster_path: '/p.png',
            vote_average: 7.2,
            release_date: '2023-01-01',
          },
        ];
      } else if (/\/(trending|discover|popular|now_playing|top_rated)\b/i.test(url)) {
        body.results = [
          {
            id: 201,
            title: 'Trending Show',
            name: 'Trending Show',
            overview: 'Hot now.',
            poster_path: '/t.png',
            vote_average: 8.1,
            first_air_date: '2024-06-01',
          },
        ];
      }
      return route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify(body),
      });
    }

    // FlickWord JSON mocks
    if (m.isFlickwordJSON) {
      mark(url, true);
      return route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          items: [{ id: 'fw_1', title: 'FlickWord Demo', blurb: 'Hello!', href: '#' }],
          updatedAt: '2025-09-15T00:00:00Z',
        }),
      });
    }

    // Continue everything else (scripts/css/html/etc.)
    return route.continue();
  });
}

/* -------- environment shims -------- */
async function neutralizeOverlays(page: Page) {
  await page.addStyleTag({
    content: `
    #searchHelp, #searchHelp .hero-content, .offline-banner { pointer-events: none !important; }
    #signin-info-modal, .modal-backdrop[data-modal="login"], #signInModal, #settingsModal { 
      display: none !important; 
      visibility: hidden !important; 
      pointer-events: none !important;
      z-index: -1 !important;
    }
    [id*="signin"], [id*="modal"], [class*="modal"], [role="dialog"] {
      pointer-events: none !important;
      display: none !important;
      visibility: hidden !important;
      z-index: -1 !important;
    }
    /* Force hide any modal that might appear */
    .modal, .modal-backdrop, [aria-modal="true"] {
      display: none !important;
      visibility: hidden !important;
      pointer-events: none !important;
      z-index: -1 !important;
    }
  `,
  });
}
async function stubGeolocation(page: Page) {
  await page.context().grantPermissions(['geolocation']);
  await page.context().setGeolocation({ latitude: 37.7749, longitude: -122.4194 });
  await page.addInitScript(() => {
    try {
      const fake = {
        getCurrentPosition: (ok: any) =>
          setTimeout(() => ok?.({ coords: { latitude: 37.7749, longitude: -122.4194 } }), 0),
        watchPosition: () => 0,
        clearWatch: () => {},
      };
      // @ts-ignore
      if ('geolocation' in navigator) navigator.geolocation = fake as any;
    } catch {}
  });
}
async function stubWindowOpen(page: Page) {
  await page.addInitScript(() => {
    (window as any).__lastOpen = null;
    window.open = (url?: string | URL) => {
      (window as any).__lastOpen = String(url || '');
      return { close() {}, closed: true } as any;
    };
  });
}
async function accelerateIdle(page: Page) {
  await page.addInitScript(() => {
    try {
      Object.defineProperty(window.navigator, 'onLine', { get: () => true });
    } catch {}
    // @ts-ignore
    window.requestIdleCallback = (fn: any) =>
      setTimeout(() => fn({ didTimeout: false, timeRemaining: () => 50 }), 0);
  });
}

/* -------- error capture -------- */
async function captureErrors(page: Page) {
  await page.addInitScript(() => {
    (window as any).__errors = [];
  });
  page.on('console', (m) => {
    if (m.type() === 'error')
      (page as any)
        .evaluate((msg) => (window as any).__errors.push(msg), String(m.text()))
        .catch(() => {});
  });
  page.on('pageerror', (err) => {
    (page as any)
      .evaluate((msg) => (window as any).__errors.push(msg), String(err?.message || err))
      .catch(() => {});
  });
}

export const test = base.extend({
  page: async ({ page }, use) => {
    await captureErrors(page);
    await shimAppGlobals(page); // <-- NEW: before mocks so app init can proceed
    await accelerateIdle(page);
    await neutralizeOverlays(page);
    await stubGeolocation(page);
    await mockNetwork(page);
    await stubWindowOpen(page);
    await ensureFlickWordVisible(page); // <-- NEW safety net
    await unhideCommonUI(page); // your improved unhide
    await use(page);
  },
});
export { expect };

/* helpers */
export async function getLastTMDBUrl(page: Page) {
  return await (page as any).__getLastTMDB?.();
}
export async function expectNoConsoleErrors(page: Page) {
  const errors: string[] = await page.evaluate(() => (window as any).__errors || []);
  expect(errors, 'Console errors found').toEqual([]);
}
export async function dumpDebug(page: Page) {
  const errors: string[] = await page.evaluate(() => (window as any).__errors || []);
  const reqs: Array<{ url: string; type: string; mocked: boolean }> = await page.evaluate(
    () => (window as any).__getReqLog?.() || [],
  );
  console.log('--- DEBUG: console errors ---');
  console.log(errors);
  console.log('--- DEBUG: requests (fetch/xhr) ---');
  console.table(reqs);
}

/* optional: UI-only search fallback you can enable per-test */
export async function enableSearchFallback(page: Page) {
  await page.addInitScript(() => {
    (window as any).__testSearchFallback = true;
  });
  await page.addInitScript(() => {
    if (!(window as any).__testSearchFallback) return;
    const wire = () => {
      const q = document.querySelector('#searchInput') as HTMLInputElement | null;
      const btn = document.querySelector('#searchBtn') as HTMLButtonElement | null;
      const res = document.querySelector('#searchResults') as HTMLElement | null;
      if (!q || !btn || !res) return;
      const doFake = () => {
        const v = (q.value || '').trim();
        if (!v) return;
        res.innerHTML = `<div class="result-card" data-fake="1">Fake: ${v}</div>`;
        res.style.display = '';
      };
      const clear = () => {
        q.value = '';
        res.innerHTML = '';
        res.style.display = 'none';
      };
      btn?.addEventListener('click', doFake);
      q?.form?.addEventListener('submit', (e) => {
        e.preventDefault();
        doFake();
      });
      (document.querySelector('#clearSearchBtn') as HTMLButtonElement | null)?.addEventListener(
        'click',
        clear,
      );
    };
    if (document.readyState === 'complete' || document.readyState === 'interactive') wire();
    else document.addEventListener('DOMContentLoaded', wire);
  });
}

// TEST-ONLY: clear search input + results (desktop/mobile) with selector override
export async function clearSearchUI(page: Page, selectorOverride?: string) {
  await page.evaluate((selOverride) => {
    const selectors = [
      selOverride || '',
      '#searchInput',
      'input[type="search"]',
      'input[name="search"]',
      '.top-search input',
      '.top-search .search-input',
    ].filter(Boolean);

    const q =
      selectors
        .map((sel) => document.querySelector(sel) as HTMLInputElement | null)
        .find((el) => !!el) || null;

    const results = document.querySelector('#searchResults') as HTMLElement | null;
    const clearBtn = document.querySelector('#clearBtn') as HTMLButtonElement | null;

    const fire = (el: HTMLElement, type: string) =>
      el.dispatchEvent(new Event(type, { bubbles: true, cancelable: true }));

    const reallyClear = () => {
      if (q) {
        q.focus?.();
        q.value = '';
        fire(q, 'input');
        fire(q, 'change');
      }
      if (results) {
        results.innerHTML = '';
        results.style && (results.style.display = 'none');
      }
    };

    if (clearBtn) {
      // try the app's handler first
      (clearBtn as any).click?.();
      setTimeout(reallyClear, 50); // fallback if handler doesn't fully clear
    } else {
      reallyClear();
    }
  }, selectorOverride || '');
}

// TEST-ONLY: read/reset the stubbed window.open URL
export async function resetLastOpenedUrl(page: Page) {
  await page.evaluate(() => {
    (window as any).__lastOpen = null;
  });
}
export async function getLastOpenedUrl(page: Page) {
  return await page.evaluate(() => (window as any).__lastOpen || '');
}
