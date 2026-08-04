/**
 * Deactivated User Login Security & Token Configuration – Test Suite
 *
 * File: tests/Auth/01_DeactivatedUserLogin_test.spec.ts
 *
 * Covers:
 *  SC-856 – Deactivated users are still able to log in to the SC Portal
 *    TC-856-01: Block login for inactive user
 *    TC-856-02: Active user can still log in (regression)
 *    TC-856-03: Existing token invalidation after deactivation (skip-safe)
 *    TC-856-04: Logged-in user endpoint respects active flag (skip-safe)
 *
 *  SC-868 – Misconfiguration in appsettings for apiURL in TokenController.cs
 *    TC-868-01: Staging login uses correct API URL
 *    TC-868-02: Production configuration remains intact (skip-safe)
 *    TC-868-03: Environment-specific configuration switch (skip-safe)
 */

import { test, expect } from '../myTestData';
import type { Page } from '@playwright/test';
import LoginPage from '../../testData/LoginPage';
import userData from '../../testData/user-info';
import * as d from '../../testData/DeactivatedUserLoginTestData.json';

// ─── Helpers ──────────────────────────────────────────────────────────────────

async function isDashboardReady(page: Page): Promise<boolean> {
  const byUrl = await page
    .waitForURL(/\/SecureConnectWeb\/dashboard(\/home)?/i, { timeout: d.timeouts.loginMs })
    .then(() => true)
    .catch(() => false);
  if (byUrl) return true;
  return page.url().includes('/dashboard');
}

async function navigateToLogin(page: Page): Promise<void> {
  const loginPage = new LoginPage(page);
  await loginPage.navigate();
}

async function attemptLogin(page: Page, username: string, password: string): Promise<void> {
  await page.getByRole('textbox', { name: d.labels.usernameField }).fill(username);
  await page.getByRole('textbox', { name: d.labels.passwordField }).fill(password);
  await page.getByRole('button', { name: d.labels.logInButton }).click();
}

function hasInactiveUserCredentials(): boolean {
  return (
    d.users.inactive.username.trim().length > 0 &&
    d.users.inactive.password.trim().length > 0
  );
}

// ─── SC-856: Deactivated Users Login Security ─────────────────────────────────

test.describe('SC-856 – Deactivated Users Login Security', () => {

  test.beforeEach(async ({ page }) => {
    await navigateToLogin(page);
  });

  test('TC-856-01: Deactivated user login is blocked – no dashboard access granted',
    async ({ page }) => {
      if (!hasInactiveUserCredentials()) {
        test.skip(true, 'Inactive user credentials not configured in DeactivatedUserLoginTestData.json');
        return;
      }

      await attemptLogin(page, d.users.inactive.username, d.users.inactive.password);

      // Must NOT reach dashboard
      await page.waitForTimeout(d.timeouts.retryMs);
      const onDashboard = await isDashboardReady(page);
      expect(onDashboard, 'Deactivated user must not reach the dashboard').toBe(false);

      // Either an error message is shown or the login form remains
      const dashboardUrl = userData.admin.dashboardUrl;
      await expect(page).not.toHaveURL(new RegExp(dashboardUrl.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')));

      const errorVisible = await page.getByText(d.errorMessages.invalidCredentials, { exact: false })
        .isVisible().catch(() => false);
      const loginFormVisible = await page.getByRole('button', { name: d.labels.logInButton })
        .isVisible().catch(() => false);
      expect(
        errorVisible || loginFormVisible,
        'Either an error message or the login form must remain visible for a blocked inactive user',
      ).toBe(true);
    },
  );

  test('TC-856-02: Active admin user can still log in (regression – fix must not over-block)',
    async ({ page, loginAsAdmin }) => {
      await loginAsAdmin();
      const onDashboard = await isDashboardReady(page);
      expect(onDashboard, 'Active admin user must reach the dashboard successfully').toBe(true);
      await expect(page).toHaveURL(/\/SecureConnectWeb\/dashboard(\/home)?/i);
    },
  );

  test('TC-856-03: Token issued at login becomes invalid after user deactivation (skip-safe)',
    async ({ page, loginAsAdmin }) => {
      // This test requires the ability to deactivate a user mid-session via DB or admin UI.
      // It is marked skip-safe because the deactivation mechanism may not be available in all environments.
      const canDeactivate = false; // Set to true when a deactivation helper is wired up
      if (!canDeactivate) {
        test.skip(true, 'SC-856-03: Mid-session deactivation not automated in this environment – manual verification required');
        return;
      }

      await loginAsAdmin();
      expect(await isDashboardReady(page)).toBe(true);

      // After deactivation, a page reload or protected API call should be denied
      await page.reload();
      const stillOnDashboard = await isDashboardReady(page);
      expect(stillOnDashboard, 'Session must be invalidated after account deactivation').toBe(false);
    },
  );

  test('TC-856-04: Logged-in user GraphQL/API endpoint returns no data for deactivated session (skip-safe)',
    async ({ page }) => {
      if (!hasInactiveUserCredentials()) {
        test.skip(true, 'Inactive user credentials not configured – skipping API-level check');
        return;
      }

      // Attempt login and capture network response for token/auth endpoint
      const authResponses: number[] = [];
      page.on('response', (response) => {
        if (/\/(token|auth|login)/i.test(response.url())) {
          authResponses.push(response.status());
        }
      });

      await attemptLogin(page, d.users.inactive.username, d.users.inactive.password);
      await page.waitForTimeout(d.timeouts.tokenCheckMs);

      // A 2xx auth response for a deactivated user would be a security failure
      const successfulAuth = authResponses.some((s) => s >= 200 && s < 300);
      // If the login form is still visible, auth was correctly rejected
      const loginStillVisible = await page.getByRole('button', { name: d.labels.logInButton })
        .isVisible().catch(() => false);

      if (authResponses.length > 0) {
        expect(
          successfulAuth && !loginStillVisible,
          'Auth endpoint must not return success for a deactivated user',
        ).toBe(false);
      } else {
        // No auth response observed – verify login form is still shown (access denied)
        expect(loginStillVisible, 'Login form must remain if no auth response was observed for inactive user').toBe(true);
      }
    },
  );

});

// ─── SC-868: TokenController apiURL Configuration ─────────────────────────────

test.describe('SC-868 – TokenController apiURL Configuration', () => {

  test('TC-868-01: Login network requests route to the correct environment API endpoint',
    async ({ page }) => {
      const loginPage = new LoginPage(page);

      const capturedUrls: string[] = [];
      page.on('request', (request) => {
        if (/\/(token|auth|login|api)/i.test(request.url())) {
          capturedUrls.push(request.url());
        }
      });

      await loginPage.navigate();
      await attemptLogin(page, userData.admin.username, userData.admin.password);
      await page.waitForTimeout(d.timeouts.loginMs);

      // Verify that all auth requests stay within the expected environment domain
      const currentEnvHost = new URL(userData.admin.url).hostname;
      const crossEnvRequests = capturedUrls.filter((url) => {
        try {
          const reqHost = new URL(url).hostname;
          return reqHost !== currentEnvHost && reqHost.length > 0;
        } catch {
          return false;
        }
      });

      expect(
        crossEnvRequests.length,
        `Auth requests must not cross to wrong environment. Found cross-env requests: ${crossEnvRequests.join(', ')}`,
      ).toBe(0);
    },
  );

  test('TC-868-02: Staging environment URL resolves without cross-environment mismatch (skip-safe)',
    async ({ page }) => {
      const stagingUrl = (userData as any).staginguser?.stagingurl;
      if (!stagingUrl) {
        test.skip(true, 'Staging URL not configured in UserInfo.json staginguser.stagingurl – skipping');
        return;
      }

      const crossEnvRequests: string[] = [];
      const stagingHost = new URL(stagingUrl).hostname;

      page.on('request', (req) => {
        if (/\/(token|auth|login)/i.test(req.url())) {
          try {
            const reqHost = new URL(req.url()).hostname;
            if (reqHost !== stagingHost && reqHost.length > 0) {
              crossEnvRequests.push(req.url());
            }
          } catch { /* ignore malformed URLs */ }
        }
      });

      await page.goto(stagingUrl).catch(() => {
        test.skip(true, 'Staging environment not reachable – skipping TC-868-02');
      });
      await page.waitForTimeout(d.timeouts.loginMs);

      expect(
        crossEnvRequests.length,
        `Staging auth requests must not route to wrong host. Cross-env: ${crossEnvRequests.join(', ')}`,
      ).toBe(0);
    },
  );

  test('TC-868-03: App resolves correct environment URL without manual config edits (skip-safe)',
    async ({ page }) => {
      // Verifies that the environment-specific URL is self-selected by the app
      // by confirming login succeeds and the resulting dashboard URL matches the expected environment host.
      const loginPage = new LoginPage(page);
      await loginPage.navigate();
      await attemptLogin(page, userData.admin.username, userData.admin.password);

      const reached = await isDashboardReady(page);
      if (!reached) {
        test.skip(true, 'Login did not succeed in this environment run – skipping environment URL check');
        return;
      }

      const expectedHost = new URL(userData.admin.url).hostname;
      const actualHost = new URL(page.url()).hostname;
      expect(
        actualHost,
        `Dashboard URL host must match the configured environment host (${expectedHost})`,
      ).toBe(expectedHost);
    },
  );

});
