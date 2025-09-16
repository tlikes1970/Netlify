import { defineConfig, devices } from '@playwright/test';

/**
 * Env controls:
 *  - PLAYWRIGHT_BASE_URL: if set, tests run against that URL and no local server is started.
 *  - PORT: local port for the dev server (default 8080).
 *  - CI: standard Playwright flags (forbidOnly, retries, workers).
 */
const PORT = Number(process.env.PORT || 8080);
const BASE_URL = process.env.PLAYWRIGHT_BASE_URL || `http://localhost:${PORT}`;

// If BASE_URL is provided, we won’t spawn a local server.
const WEB_SERVER = process.env.PLAYWRIGHT_BASE_URL
  ? undefined
  : {
      // Static SPA server with history fallback; quotes handle Windows paths w/ spaces.
      command: `npx serve -s "www" -l ${PORT}`,
      url: `http://localhost:${PORT}`,
      reuseExistingServer: true,
      timeout: 120 * 1000, // 2 minutes
    };

export default defineConfig({
  testDir: './tests',
  fullyParallel: true,

  // CI hardening
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 1 : undefined,

  // Reporters
  reporter: [
    ['list'],
    ['html', { outputFolder: 'playwright-report', open: 'never' }],
  ],

  // Global expectations
  expect: { timeout: 5_000 },

  use: {
    baseURL: BASE_URL,
    trace: 'retain-on-failure',
    screenshot: 'only-on-failure',
    video: 'off',
    serviceWorkers: 'block',
    permissions: ['geolocation'],
    geolocation: { latitude: 37.7749, longitude: -122.4194 },
  },

  projects: [
    // Desktop profile (matches your Lighthouse desktop checks)
    {
      name: 'chromium-desktop',
      use: { ...devices['Desktop Chrome'] },
    },
    // Mobile profile (Pixel 7 is a solid modern baseline)
    {
      name: 'chromium-mobile',
      use: { ...devices['Pixel 7'] },
    },
    // You can re-enable Firefox/WebKit later if needed:
    // { name: 'firefox', use: { ...devices['Desktop Firefox'] } },
    // { name: 'webkit',  use: { ...devices['Desktop Safari'] } },
  ],

  // Start local SPA server unless PLAYWRIGHT_BASE_URL is set
  webServer: WEB_SERVER,
});
