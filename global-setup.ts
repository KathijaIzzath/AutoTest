import { chromium } from '@playwright/test';
import * as fs from 'fs';
import * as userData from './testData/UserInfo.json';

async function submitAdminLogin(page: any): Promise<void> {
  await page.getByRole('textbox', { name: 'Enter Username' }).click();
  await page.getByRole('textbox', { name: 'Enter Username' }).fill(userData.admin.username);
  await page.getByRole('textbox', { name: 'Enter Password' }).click();
  await page.getByRole('textbox', { name: 'Enter Password' }).fill(userData.admin.password);
  await page.getByRole('button', { name: 'Log In' }).click();
}

async function waitForDashboardReady(page: any): Promise<boolean> {
  const dashboardUrlPattern = /\/SecureConnectWeb\/dashboard(\/home)?/i;

  const urlReady = await page
    .waitForURL(dashboardUrlPattern, { timeout: 45000 })
    .then(() => true)
    .catch(() => false);
  if (urlReady) {
    return true;
  }

  const claimsLinkReady = await page
    .getByRole('link', { name: /Claims/i })
    .first()
    .isVisible({ timeout: 5000 })
    .catch(() => false);
  if (claimsLinkReady) {
    return true;
  }

  const applyFilterReady = await page
    .getByRole('button', { name: /Apply Filter/i })
    .first()
    .isVisible({ timeout: 5000 })
    .catch(() => false);

  return applyFilterReady;
}

async function globalSetup() {
  const browser = await chromium.launch();
  const page = await browser.newPage();
  await page.goto(userData.admin.url, { waitUntil: 'domcontentloaded' });
  console.log('Global setup: opening admin login page');

  let ready = false;
  let lastError: unknown = null;

  for (let attempt = 1; attempt <= 3; attempt += 1) {
    try {
      await page.goto(userData.admin.url, { waitUntil: 'domcontentloaded' });
      await submitAdminLogin(page);
      ready = await waitForDashboardReady(page);
      if (ready) {
        break;
      }
    } catch (error) {
      lastError = error;
    }
  }

  if (!ready) {
    const hasExistingStorageState = fs.existsSync('storageState.json');
    if (hasExistingStorageState) {
      console.warn('Global setup: login retries failed, reusing existing storageState.json as fallback.');
      await browser.close();
      return;
    }

    await browser.close();
    throw new Error(`Global setup login failed after retries. Last error: ${String(lastError ?? 'dashboard did not become ready')}`);
  }

  await page.context().storageState({ path: 'storageState.json' });
  await browser.close();
}


export default globalSetup;
