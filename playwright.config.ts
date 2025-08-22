import { defineConfig, devices } from '@playwright/test';

export default defineConfig({
  testDir: './tests',
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 1 : undefined,
  reporter: 'html',

  use: {
    // Use Netlify by default; override locally with PLAYWRIGHT_BASE_URL
    baseURL: process.env.PLAYWRIGHT_BASE_URL || 'https://flicklet.netlify.app',
    trace: 'on-first-retry',
  },

  projects: [
    { name: 'chromium', use: { ...devices['Desktop Chrome'] } },
    { name: 'firefox',  use: { ...devices['Desktop Firefox'] } },
    { name: 'webkit',   use: { ...devices['Desktop Safari'] } },
  ],

  // If you want to run against a local dev server instead of Netlify:
  // webServer: {
  //   command: 'npm run start',
  //   url: 'http://localhost:8888',
  //   reuseExistingServer: !process.env.CI,
  // },
});
