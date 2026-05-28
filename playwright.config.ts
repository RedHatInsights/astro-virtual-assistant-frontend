import { defineConfig, devices } from '@playwright/test';

/**
 * See https://playwright.dev/docs/test-configuration.
 */
export default defineConfig({
  testDir: './playwright',

  // CRITICAL: Sequential execution to prevent race conditions in CI
  fullyParallel: false,
  workers: 1,

  // Fail the build on CI if you accidentally left test.only in the source code
  forbidOnly: !!process.env.CI,

  // Retry on CI only
  retries: process.env.CI ? 2 : 0,

  // Reporter to use
  reporter: 'html',

  // Shared settings for all the projects below
  use: {
    // Base URL to use in actions like `await page.goto('/')`
    // IMPORTANT: Use PLAYWRIGHT_BASE_URL, NOT HCC_ENV_URL (which is for pipeline infrastructure)
    baseURL: process.env.PLAYWRIGHT_BASE_URL || 'http://localhost:8004',

    // Collect trace when retrying the failed test
    trace: 'on-first-retry',

    // Screenshot on failure
    screenshot: 'only-on-failure',
  },

  // Configure projects for major browsers
  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
  ],

  // Run your local dev server before starting the tests
  // Uncomment if you want Playwright to start the dev server automatically
  // webServer: {
  //   command: 'npm run start',
  //   url: 'http://localhost:8004',
  //   reuseExistingServer: !process.env.CI,
  // },
});
