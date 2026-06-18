import { chromium } from '@playwright/test';
import * as userData from './testData/UserInfo.json';

async function globalSetup() {
  const browser = await chromium.launch();
  const page = await browser.newPage();
  await page.goto(userData.admin.url);
  console.log('Global setup: opening admin login page');

    await page.getByRole('textbox', { name: 'Enter Username' }).click();
    await page.getByRole('textbox', { name: 'Enter Username' }).fill(userData.admin.username);
    await page.getByRole('textbox', { name: 'Enter Password' }).click();
    await page.getByRole('textbox', { name: 'Enter Password' }).fill(userData.admin.password);

    await page.getByRole('button', { name: 'Log In' }).click();
    await page.waitForURL(userData.admin.dashboardUrl, { timeout: 120000 });
  await page.context().storageState({ path: 'storageState.json' });
  await browser.close();
}


export default globalSetup;
