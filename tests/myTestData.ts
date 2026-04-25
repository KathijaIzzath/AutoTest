import { test as base, expect, Page } from '@playwright/test';
import * as userData from '../testData/UserInfo.json';
import LoginPage from '../testData/LoginPage';

export const test = base.extend<{
  loginAsAdmin: () => Promise<void>;
}>({
  loginAsAdmin: async ({ page }, use) => {
    const loginPage = new LoginPage(page);
    await loginPage.navigate();
    await loginPage.login(userData.admin.username, userData.admin.password);
    await expect(page).toHaveURL(userData.admin.dashboardUrl);
    await use(async () => {});
  },
});

export { expect };