import { test as base, expect } from '@playwright/test';
import * as userData from '../testData/UserInfo.json';
import LoginPage from '../testData/LoginPage';

async function isDashboardReady(page: any): Promise<boolean> {
  const dashboardUrlPattern = /\/SecureConnectWeb\/dashboard(\/home)?/i;

  const byUrl = await page
    .waitForURL(dashboardUrlPattern, { timeout: 45000 })
    .then(() => true)
    .catch(() => false);
  if (byUrl) {
    return true;
  }

  const byClaimsLink = await page
    .getByRole('link', { name: /Claims/i })
    .first()
    .isVisible({ timeout: 5000 })
    .catch(() => false);
  if (byClaimsLink) {
    return true;
  }

  return page.url().includes('/dashboard');
}

export const test = base.extend<{
  loginAsAdmin: () => Promise<void>;
}>({
  loginAsAdmin: async ({ page }, use) => {
    const loginPage = new LoginPage(page);
    let ready = false;

    for (let attempt = 1; attempt <= 3; attempt += 1) {
      await loginPage.navigate();
      await loginPage.login(userData.admin.username, userData.admin.password);
      ready = await isDashboardReady(page);
      if (ready) {
        break;
      }
    }

    expect(ready, 'Admin login did not reach dashboard after retries.').toBeTruthy();
    await expect(page).toHaveURL(/\/SecureConnectWeb\/dashboard(\/home)?/i);
    await use(async () => {});
  },
});

export { expect };