import { defineConfig } from '@playwright/test';

export default defineConfig({
  use: {
    baseURL: process.env.E2E_BASE_URL || 'http://localhost:8888',
    viewport: { width: 375, height: 667 },
    serviceWorkers: 'block',
    ignoreHTTPSErrors: true,
  },
  reporter: [['list']],
  // Prevent Vitest from interfering with Playwright
  testDir: './tests',
  testMatch: /.*\.spec\.ts$/,
  // Exclude Vitest test files and config
  testIgnore: [
    '**/node_modules/**',
    '**/src/**/*.test.ts',
    '**/src/**/*.test.tsx',
    '**/src/**/*.spec.ts',
    '**/src/**/*.spec.tsx',
    '**/vitest.config.ts',
    '**/src/test-setup.ts',
  ],
});
