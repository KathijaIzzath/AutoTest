 import { test, expect, Page } from '@playwright/test';
import * as userData from '../testData/UserInfo.json';
import { getTodaysDate, getTodaysDateWithYr } from '../testData/database.utils';
import LoginPage from '../testData/LoginPage';

import {  isActiveAccount } from '../testData/database.utils';
import { ifError } from 'assert';
// G00016 - Provider Group Dashboard test cases - Filter and Sorting test cases

let page: Page;
test.beforeEach(async ({ browser }) => {
  // Initialize the page instance before each test
  page = await browser.newPage();
  });


test('ProviderGroupDashboard control/elements verification test execution', async ({ page }) => {
  let loginPage = new LoginPage(page);
  await loginPage.navigate();
  await loginPage.login(userData.admin.username, userData.admin.password);
  await expect(page).toHaveURL(userData.admin.dashboardUrl);
  await page.getByRole('listitem').filter({ hasText: 'AccountsProviders' }).getByRole('button').click();
  await expect(page.getByRole('link', { name: ' Providers' })).toBeVisible();
  await page.getByRole('link', { name: ' Providers' }).click();
  await expect(page.locator('app-providers').getByText('Providers', { exact: true })).toBeVisible();
  await page.getByRole('link').filter({ hasText: /^$/ }).click();
  // Try to assert 'Provider ID' is visible; if not, click the fallback link
  try {
    await expect(page.getByText('Provider ID')).toBeVisible({ timeout: 2000 });
  } catch (e) {
    await page.getByRole('link').filter({ hasText: /^$/ }).click();
  }
   
  await page.getByRole('textbox', { name: 'Enter Provider ID' }).click();
  await page.getByRole('textbox', { name: 'Enter Provider ID' }).fill('T00068');
  await page.getByRole('button', { name: 'Apply Filter' }).click();
  await expect(page.getByRole('columnheader', { name: 'name' })).toBeVisible();
  await expect(page.getByRole('cell', { name: 'DESIREE SCHROEDER' })).toBeVisible();
  await expect(page.getByRole('columnheader', { name: 'provider ID ' })).toBeVisible();
  await expect(page.getByRole('cell', { name: 'T00068' })).toBeVisible();
 // await expect(page.locator('form').getByText('Group ID')).toBeVisible();
  await page.getByRole('textbox', { name: 'Enter Group ID' }).click();
  await page.getByRole('textbox', { name: 'Enter Group ID' }).fill('G00016');
  await page.getByRole('button', { name: 'Apply Filter' }).click();
  await expect(page.getByRole('columnheader', { name: 'Group ID' })).toBeVisible();
  await expect(page.getByRole('cell', { name: 'G00016' })).toBeVisible();
  await page.getByRole('textbox', { name: 'Enter Group ID' }).click();
  await page.getByRole('textbox', { name: 'Enter Group ID' }).fill('');
  await expect(page.getByText('Group Name')).toBeVisible();
  await page.getByRole('textbox', { name: 'Enter Group Name' }).click();
  await page.getByRole('textbox', { name: 'Enter Group Name' }).fill('WUCKERT');
  await page.getByRole('button', { name: 'Apply Filter' }).click();
  await expect(page.getByRole('columnheader', { name: 'provider ID ' })).toBeVisible();
  await expect(page.getByRole('cell', { name: 'T00068' })).toBeVisible();
  await page.getByRole('textbox', { name: 'Enter Group Name' }).click();
  await page.getByRole('textbox', { name: 'Enter Group Name' }).fill('');
  await expect(page.locator('form').getByText('Account Number')).toBeVisible();
  await page.getByRole('textbox', { name: 'Enter Account Number' }).click();
  await page.getByRole('textbox', { name: 'Enter Account Number' }).fill('VMCTEST');
  await page.getByRole('button', { name: 'Apply Filter' }).click();
  await expect(page.getByRole('columnheader', { name: 'Account Number' })).toBeVisible();
  await expect(page.getByRole('cell', { name: 'VMCTEST' })).toBeVisible();
  await page.getByRole('textbox', { name: 'Enter Account Number' }).click();
  await page.getByRole('textbox', { name: 'Enter Account Number' }).fill('');
  await expect(page.getByText('Account Name')).toBeVisible();
  await page.getByRole('textbox', { name: 'Enter Account Name' }).click();
  await page.getByRole('textbox', { name: 'Enter Account Name' }).fill('HAGENES');
  await page.getByRole('button', { name: 'Apply Filter' }).click();
  await expect(page.getByRole('columnheader', { name: 'provider ID ' })).toBeVisible();
  await expect(page.getByRole('cell', { name: 'T00068' })).toBeVisible();
  await page.getByRole('textbox', { name: 'Enter Account Name' }).dblclick();
  await page.getByRole('textbox', { name: 'Enter Account Name' }).fill('');

  await expect(page.getByText('Contact Name')).toBeVisible();
  await page.getByRole('textbox', { name: 'Enter Contact Name' }).click();
  await page.getByRole('textbox', { name: 'Enter Contact Name' }).fill('CATERINA');
  await page.getByRole('button', { name: 'Apply Filter' }).click();
  await expect(page.getByRole('columnheader', { name: 'provider ID ' })).toBeVisible();
  await expect(page.getByRole('cell', { name: 'T00068' })).toBeVisible();
  await page.getByRole('textbox', { name: 'Enter Contact Name' }).click();
  await page.getByRole('textbox', { name: 'Enter Contact Name' }).fill('');
  await expect(page.locator('div').filter({ hasText: /^City$/ }).nth(1)).toBeVisible();
  await page.getByRole('textbox', { name: 'Enter City' }).click();
  await page.getByRole('textbox', { name: 'Enter City' }).fill('lake');
  await page.getByRole('button', { name: 'Apply Filter' }).click();
  await expect(page.getByRole('columnheader', { name: 'provider ID' })).toBeVisible();
  await expect(page.getByRole('cell', { name: 'T00068' })).toBeVisible();
  await page.getByRole('textbox', { name: 'Enter City' }).click();
  await page.getByRole('textbox', { name: 'Enter City' }).fill('');
  await expect(page.getByText('State', { exact: true })).toBeVisible();
  await page.getByRole('button', { name: 'Apply Filter' }).click();
  await expect(page.getByRole('columnheader', { name: 'provider ID' })).toBeVisible();
  await expect(page.getByRole('cell', { name: 'T00068' })).toBeVisible();
  await expect(page.getByText('Practice Management', { exact: true })).toBeVisible();
  await page.locator('dropdown-filter-item').getByRole('combobox').selectOption('77: T');
  await page.getByRole('button', { name: 'Apply Filter' }).click();
  await expect(page.getByRole('columnheader', { name: 'provider ID' })).toBeVisible();
  await expect(page.getByRole('cell', { name: 'T00068' })).toBeVisible();
  await page.locator('dropdown-filter-item').getByRole('combobox').selectOption('');
});



test('ProviderGroup search results sort verification test execution', async ({ page }) => {
  let loginPage = new LoginPage(page);
  await loginPage.navigate();
  await loginPage.login(userData.admin.username, userData.admin.password);
  await expect(page).toHaveURL(userData.admin.dashboardUrl);
  await page.getByRole('listitem').filter({ hasText: 'AccountsProviders' }).getByRole('button').click();
  await expect(page.getByRole('link', { name: ' Providers' })).toBeVisible();
 await page.getByRole('link', { name: ' Providers' }).click();
  await expect(page.locator('app-providers').getByText('Providers', { exact: true })).toBeVisible();
  await page.getByRole('link').filter({ hasText: /^$/ }).click();
  // Try to assert 'Provider ID' is visible; if not, click the fallback link
  try {
    await expect(page.getByText('Provider ID')).toBeVisible({ timeout: 2000 });
  } catch (e) {
    await page.getByRole('link').filter({ hasText: /^$/ }).click();
  }

 await page.getByRole('button', { name: 'Apply Filter' }).click();
  await expect(page.getByRole('columnheader', { name: 'name' })).toBeVisible();
  await page.getByRole('columnheader', { name: 'name' }).click();
  await expect(page.getByRole('cell', { name: 'PROVIDER 01TEST' })).toBeVisible();
  await expect(page.getByRole('columnheader', { name: 'email' })).toBeVisible();
  await page.getByRole('columnheader', { name: 'email' }).click();
  await expect(page.getByRole('cell', { name: 'N/A' })).toBeVisible();
  await expect(page.getByRole('columnheader', { name: 'status' })).toBeVisible();
  await page.getByRole('columnheader', { name: 'status' }).click();
  await expect(page.getByRole('cell', { name: 'A' }).nth(1)).toBeVisible();
  await expect(page.getByRole('columnheader', { name: 'address' })).toBeVisible();
  await page.getByRole('columnheader', { name: 'address' }).click();
  await expect(page.getByRole('cell', { name: '04843 COLTEN FERRY SUITE 674' })).toBeVisible();
  await expect(page.getByRole('columnheader', { name: 'provider ID' })).toBeVisible();
  await page.getByRole('columnheader', { name: 'provider ID' }).click();
  await expect(page.getByRole('cell', { name: 'H02492' })).toBeVisible();
  await expect(page.getByRole('columnheader', { name: 'Group ID' })).toBeVisible();
  await page.getByRole('columnheader', { name: 'Group ID' }).click();
  await expect(page.getByRole('cell', { name: 'G00012' }).first()).toBeVisible();
  await expect(page.getByRole('columnheader', { name: 'Account Number' })).toBeVisible();
  await page.getByRole('columnheader', { name: 'Account Number' }).click();
  await expect(page.getByRole('cell', { name: '000VMTEST' }).first()).toBeVisible();
});
