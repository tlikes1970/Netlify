import { defineConfig } from '@playwright/test';

export default defineConfig({
  use: {
    baseURL: process.env.E2E_BASE_URL || 'http://localhost:8888',
    viewport: { width: 375, height: 667 },
    serviceWorkers: 'block',
    ignoreHTTPSErrors: true,
  },
  reporter: [['list']]
});
