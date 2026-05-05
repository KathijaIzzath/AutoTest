import { test, expect } from './myTestData';
import * as userData from '../testData/UserInfo.json';
import { getTodaysDate, getTodaysDateWithYr } from '../testData/database.utils';
import LoginPage from '../testData/LoginPage';
import {  isActiveAccount } from '../testData/database.utils';
// G00016 - Provider Group Dashboard test cases - Filter and Sorting test cases

test.beforeEach(async ({ browser }) => {
  });


test('ProviderGroupDashboard control/elements verification test execution', async ({ page, loginAsAdmin }) => {
  await loginAsAdmin();

  await page.getByRole('listitem').filter({ hasText: 'AccountsProviders' }).getByRole('button').click();
  await page.getByRole('link', { name: 'Providers Group' }).click();
  await expect(page.getByText('Provider Groups', { exact: true })).toBeVisible();
  await expect(page.getByText('Group ID')).toBeVisible();
  await page.getByRole('textbox', { name: 'Enter Group ID' }).click();
  await page.getByRole('textbox', { name: 'Enter Group ID' }).fill('G00016');
  await page.getByRole('button', { name: 'Apply Filter' }).click();
  await expect(page.getByRole('columnheader', { name: 'Name ' })).toBeVisible();
  await expect(page.getByRole('cell', { name: 'WUCKERT LLC' })).toBeVisible();
  await expect(page.getByRole('columnheader', { name: 'Group Id' })).toBeVisible();
  await expect(page.getByRole('cell', { name: 'G00016' })).toBeVisible();
  await expect(page.getByText('Group Name')).toBeVisible();
  await page.getByRole('textbox', { name: 'Enter Group Name' }).click();
  await page.getByRole('textbox', { name: 'Enter Group Name' }).fill('WUCKERT LLC');
  await page.getByRole('button', { name: 'Apply Filter' }).click();
  await expect(page.getByRole('columnheader', { name: 'Name ' })).toBeVisible();
  await expect(page.getByRole('cell', { name: 'WUCKERT LLC' })).toBeVisible();
  await expect(page.getByRole('columnheader', { name: 'Group Id' })).toBeVisible();
  await expect(page.getByRole('cell', { name: 'G00016' })).toBeVisible();
  await page.getByRole('textbox', { name: 'Enter Group Name' }).click();
  await page.getByRole('textbox', { name: 'Enter Group Name' }).dblclick();
  await page.getByRole('textbox', { name: 'Enter Group Name' }).press('ControlOrMeta+a');
  await page.getByRole('textbox', { name: 'Enter Group Name' }).click();
  await page.getByRole('textbox', { name: 'Enter Group Name' }).click();
  await page.getByRole('textbox', { name: 'Enter Group Name' }).fill('');
  await page.getByRole('textbox', { name: 'Enter Account Number' }).click();
  await expect(page.locator('form').getByText('Account Number')).toBeVisible();
  await page.getByRole('textbox', { name: 'Enter Account Number' }).click();
  await page.getByRole('textbox', { name: 'Enter Account Number' }).fill('VMCTEST');
  await page.getByRole('button', { name: 'Apply Filter' }).click();
  await expect(page.getByRole('cell', { name: 'WUCKERT LLC' })).toBeVisible();
  await expect(page.getByRole('columnheader', { name: 'Group Id' })).toBeVisible();
  await expect(page.getByRole('cell', { name: 'G00016' })).toBeVisible();
  await expect(page.getByRole('columnheader', { name: 'Name ' })).toBeVisible();
  await page.getByRole('textbox', { name: 'Enter Account Number' }).click();
  await page.getByRole('textbox', { name: 'Enter Account Number' }).click();
  await page.getByRole('textbox', { name: 'Enter Account Number' }).fill('');
  await expect(page.getByText('Account Name')).toBeVisible();
  await page.getByRole('textbox', { name: 'Enter Account Name' }).click();
  await page.getByRole('textbox', { name: 'Enter Account Name' }).fill('HAGENES-WEISSNAT');
  await page.getByRole('button', { name: 'Apply Filter' }).click();
  await expect(page.getByRole('columnheader', { name: 'Name ' })).toBeVisible();
  await expect(page.getByRole('cell', { name: 'WUCKERT LLC' })).toBeVisible();
  await expect(page.getByRole('columnheader', { name: 'Group Id' })).toBeVisible();
  await page.getByRole('cell', { name: 'G00016' }).click();
  await page.getByRole('textbox', { name: 'Enter Account Name' }).click();
  await page.getByRole('textbox', { name: 'Enter Account Name' }).press('ControlOrMeta+a');
  await page.getByRole('textbox', { name: 'Enter Account Name' }).fill('');
  await expect(page.getByText('Contact Name')).toBeVisible();
  await page.getByRole('textbox', { name: 'Enter Contact Name' }).click();
  await page.getByRole('textbox', { name: 'Enter Contact Name' }).fill('SHELDON KIHN');
  await page.getByRole('button', { name: 'Apply Filter' }).click();
  await expect(page.getByRole('columnheader', { name: 'Name ' })).toBeVisible();
  await expect(page.getByRole('cell', { name: 'WUCKERT LLC' })).toBeVisible();
  await expect(page.getByRole('columnheader', { name: 'Group Id' })).toBeVisible();
  await expect(page.getByRole('cell', { name: 'G00016' })).toBeVisible();
 await page.getByRole('textbox', { name: 'Enter Contact Name' }).click();
  await page.getByRole('textbox', { name: 'Enter Contact Name' }).fill('');
  await expect(page.getByText('State', { exact: true })).toBeVisible();
  await page.locator('states').getByRole('combobox').selectOption('KS');
  await page.getByRole('button', { name: 'Apply Filter' }).click();
  await expect(page.getByRole('columnheader', { name: 'Name ' })).toBeVisible();
  await expect(page.getByRole('cell', { name: 'WUCKERT LLC' })).toBeVisible();
  await expect(page.getByRole('columnheader', { name: 'Group Id' })).toBeVisible();
  await expect(page.getByRole('cell', { name: 'G00016' })).toBeVisible();
  await page.locator('states').getByRole('combobox').selectOption('');
  
  await expect(page.locator('dropdown-filter-item').getByRole('combobox')).toContainText('Select Vendor');
  await expect(page.getByText('Vendor', { exact: true })).toBeVisible();
await page.locator('dropdown-filter-item').getByRole('combobox').selectOption('78: T');

 // await page.locator('dropdown-filter-item').getByRole('combobox').selectOption('77: T');
  await page.getByRole('button', { name: 'Apply Filter' }).click();
  await expect(page.getByRole('columnheader', { name: 'Name ' })).toBeVisible();
  await expect(page.getByRole('cell', { name: 'WUCKERT LLC' })).toBeVisible();
  await expect(page.getByRole('columnheader', { name: 'Group Id' })).toBeVisible();
  await expect(page.getByRole('cell', { name: 'G00016' })).toBeVisible();
  await page.getByRole('textbox', { name: 'Enter Contact Name' }).click();
  await page.getByRole('textbox', { name: 'Enter Contact Name' }).fill('');
  await expect(page.getByText('City')).toBeVisible();
  await page.getByRole('textbox', { name: 'Enter City' }).click();
  await page.getByRole('textbox', { name: 'Enter City' }).fill('stark');
  await page.getByRole('button', { name: 'Apply Filter' }).click();
  await expect(page.getByRole('columnheader', { name: 'Name ' })).toBeVisible();
  await expect(page.getByRole('cell', { name: 'WUCKERT LLC' })).toBeVisible();
  await expect(page.getByRole('columnheader', { name: 'Group Id' })).toBeVisible();
  await expect(page.getByRole('cell', { name: 'G00016' })).toBeVisible();
  await page.getByRole('textbox', { name: 'Enter City' }).click();
  await page.getByRole('textbox', { name: 'Enter City' }).fill('');
  
});


test('ProviderGroups Sorting search results control/elements verification test execution', async ({ page }) => {
  let loginPage = new LoginPage(page);
  await loginPage.navigate();
  await loginPage.login(userData.admin.username, userData.admin.password);
  await expect(page).toHaveURL(userData.admin.dashboardUrl);
  
  await page.getByRole('listitem').filter({ hasText: 'AccountsProviders' }).getByRole('button').click();
  await page.getByRole('link', { name: 'Providers Group' }).click();
  await expect(page.getByText('Provider Groups', { exact: true })).toBeVisible();
  await expect(page.getByText('Group ID')).toBeVisible();

  await page.locator('dropdown-filter-item').getByRole('combobox').selectOption('');
  await page.getByRole('textbox', { name: 'Enter Group ID' }).click();
  await page.getByRole('textbox', { name: 'Enter Group ID' }).fill('');
  await page.getByRole('button', { name: 'Apply Filter' }).click();
   // Delay for 500 seconds as requested
  await page.waitForTimeout(5000); // 500,000 ms = 500 seconds
  await expect(page.getByRole('columnheader', { name: 'Name ' })).toBeVisible();
  await expect(page.getByRole('columnheader', { name: 'Group Id' })).toBeVisible();
  await page.getByRole('columnheader', { name: 'Name ' }).click();
  await expect(page.getByRole('cell', { name: 'ZULAUF, SCHADEN AND MRAZ' })).toBeVisible();
  await page.getByRole('columnheader', { name: 'Group Id' }).click();
  await expect(page.getByRole('columnheader', { name: 'Group Id ' })).toBeVisible();
  await expect(page.getByRole('cell', { name: 'G00012' })).toBeVisible();
  await expect(page.getByRole('link').filter({ hasText: /^$/ }).first()).toBeVisible();

  //click of filter to collapse the filter section and verify the filter values are retained
  await page.getByRole('link').filter({ hasText: /^$/ }).first().click();
  await expect(page.locator('div').filter({ hasText: 'Provider GroupsGroup IDGroup' }).nth(2)).toBeVisible();
  await expect(page.getByRole('columnheader', { name: 'Name' })).toBeVisible();
  await expect(page.getByRole('columnheader', { name: 'Group Id ' })).toBeVisible();
  await expect(page.getByRole('cell', { name: 'G00012' })).toBeVisible();

});