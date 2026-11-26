import { defineConfig } from '@playwright/test';

const remote = process.env.PLAYWRIGHT_BASE_URL;
const baseURL = remote ?? 'http://127.0.0.1:4173/flags-of-the-world/';

export default defineConfig({
  testDir: './tests/e2e',
  timeout: 45_000,
  fullyParallel: true,
  workers: process.env.CI ? 3 : 2,
  use: { baseURL, trace: 'retain-on-failure' },
  projects: (['chromium', 'firefox', 'webkit'] as const).map(browserName => ({
    name: browserName,
    use: { browserName },
  })),
  webServer: remote ? undefined : {
    command: 'npm run preview -- --host 127.0.0.1 --strictPort',
    url: baseURL,
    reuseExistingServer: !process.env.CI,
  },
});
