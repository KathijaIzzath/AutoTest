import { defineConfig, devices } from '@playwright/test';

/**
 * Read environment variables from file.
 * https://github.com/motdotla/dotenv
 */
// import dotenv from 'dotenv';
// import path from 'path';
// dotenv.config({ path: path.resolve(__dirname, '.env') });
export const testConfig = {
  // QA under parallel workers regularly exceeds 60s for login + filter + assert flows.
  globalTimeoutMs: 120000,
  };

const isoNow = new Date().toISOString();
const runDate = isoNow.slice(0, 10);
const runTime = isoNow.slice(11, 19).replace(/:/g, '-');
const runId = `${runDate}_${runTime}-pid${process.pid}`;
const runOutputDir = `test-results/run-${runId}`;
const blobOutputFile = `blob-report/${runDate}/report-${runId}.zip`;
const includeSummaryEmailReporter = process.env.AUTOTEST_ENABLE_SUMMARY_EMAIL === '1';
/**
 * See https://playwright.dev/docs/test-configuration.
 */
export default defineConfig({
  timeout: testConfig.globalTimeoutMs,
  // Local full-suite runs must finish every module; CI stays within the 60-min job limit.
  globalTimeout: process.env.CI && process.env.AUTOTEST_DETACHED !== '1' ? 55 * 60 * 1000 : 0,
  expect: { timeout: 15000 },
  testDir: './tests',
  testMatch: ['**/*.spec.ts', '**/*_spec.ts'],
  // Use per-process output folders so concurrent runs do not delete each other's artifacts.
  outputDir: runOutputDir,
  /* Run tests in files in parallel */
  fullyParallel: true,
  /* Fail the build on CI if you accidentally left test.only in the source code. */
  forbidOnly: !!process.env.CI,
  /* Never abort early — finish every module even when tests fail/time out */
  maxFailures: 0,
  /**
   * Retry once on failure/timeout. After a second consecutive timeout the result
   * stays failed (Playwright has no "convert to skipped"), but the suite continues.
   */
  retries: process.env.CI ? 2 : 1,
  /* Run up to 4 workers in parallel to keep full-suite runtime practical */
  workers: process.env.CI ? 4 : 4,
  /* Reporter to use. See https://playwright.dev/docs/test-reporters */
  reporter: [
    ['html', { outputFolder: 'playwright-report', open: 'never' }],
    ['blob', { outputFile: blobOutputFile }],
    ['list'],
    // Generates the Desktop daily summary HTML after every run
    ['./scripts/daily-reporter.cjs'],
    ...(includeSummaryEmailReporter ? [['./scripts/summary-reporter.ts'] as const] : []),
  ],
  globalSetup: require.resolve('./global-setup'),
  globalTeardown: require.resolve('./global-teardown'),
  
  /* Shared settings for all the projects below. See https://playwright.dev/docs/api/class-testoptions. */
  use: {
    /* Base URL to use in actions like `await page.goto('')`. */
    // baseURL: 'http://localhost:3000',
    storageState: 'storageState.json',
    /* Collect trace when retrying the failed test. See https://playwright.dev/docs/trace-viewer */
    trace: 'on-first-retry',
  },

  /* Configure projects for major browsers */
  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },

    {
      name: 'firefox',
      use: { ...devices['Desktop Firefox'] },
    },

    {
      name: 'webkit',
      use: { ...devices['Desktop Safari'] },
    }

    /* Test against mobile viewports. */
    // {
    //   name: 'Mobile Chrome',
    //   use: { ...devices['Pixel 5'] },
    // },
    // {
    //   name: 'Mobile Safari',
    //   use: { ...devices['iPhone 12'] },
    // },

    /* Test against branded browsers. */
    // {
    //   name: 'Microsoft Edge',
    //   use: { ...devices['Desktop Edge'], channel: 'msedge' },
    // },
    // {
    //   name: 'Google Chrome',
    //   use: { ...devices['Desktop Chrome'], channel: 'chrome' },
    // },
  ]

  /* Run your local dev server before starting the tests */
  // webServer: {
  //   command: 'npm run start',
  //   url: 'http://localhost:3000',
  //   reuseExistingServer: !process.env.CI,
  // },

});
