import { test, expect } from './myTestData';
import { Page } from '@playwright/test';
import * as userData from '../testData/UserInfo.json';
import { getTodaysDate, getTodaysDateWithYr } from '../testData/database.utils';
import LoginPage from '../testData/LoginPage';

import {  isActiveAccount } from '../testData/database.utils';

test('Deactivate Account, verify Deactivate and Reactivate functionality test execution', async ({ page, loginAsAdmin }) => {
  const activeAccount = isActiveAccount();
    console.log('1st activeAccount', activeAccount);
 test.skip(await activeAccount === false, 'Skip if account is not active');
     console.log('2nd activeAccount', activeAccount);
  await loginAsAdmin();
   
 // const date = getTodaysDateWithYr();
 //console.log('extracted date', date);
await page.getByRole('link', { name: ' Accounts' }).click();
await page.getByRole('textbox', { name: 'Enter Account Number' }).click();
await page.getByRole('textbox', { name: 'Enter Account Number' }).fill(userData.deactivateAccount.deactivateAccAutoNum);
await page.getByRole('button', { name: 'Apply Filter' }).click();

await expect(page.getByRole('link').filter({ hasText: /^$/ }).nth(2)).toBeVisible();
await page.getByRole('link').filter({ hasText: /^$/ }).nth(2).click();
//await page.getByRole('link').filter({ hasText: /^$/ }).nth(2).click();
//await expect(page.getByRole('button', { name: 'Deactivate Account' })).toBeVisible();
////await page.getByRole('link').filter({ hasText: /^$/ }).nth(2).click();
//await page.getByRole('link').filter({ hasText: /^$/ }).nth(2).click();
await page.getByRole('button', { name: 'Deactivate Account' }).click();
await expect(page.getByRole('heading', { name: 'Confirm action' })).toBeVisible();
await expect(page.locator('app-modal')).toContainText('Are you sure you want to deactivate this account?');
await expect(page.locator('app-modal')).toContainText('Cancel');
await expect(page.locator('app-modal')).toContainText('Ok');
await page.getByRole('button', { name: 'Ok' }).click();

await expect(page.locator('label')).toContainText('Show Inactive Only');
await expect(page.getByText('Show Inactive Only')).toBeVisible();
await page.getByRole('checkbox', { name: 'Show Inactive Only' }).check();
await expect(page.getByRole('checkbox', { name: 'Show Inactive Only' })).toBeChecked();
await page.getByRole('button', { name: 'Apply Filter' }).click();
//await page.getByText('Account Number', { exact: true }).click();
//await page.getByRole('textbox', { name: 'Enter Account Number' }).click();
//await page.getByRole('textbox', { name: 'Enter Account Number' }).click();
await page.getByRole('cell', { name: userData.deactivateAccount.deactivateAccAutoNum }).first().click();
await expect(page.getByRole('cell', { name: userData.deactivateAccount.deactivateAccAutoNum }).first()).toBeVisible();
await expect(page.getByRole('table')).toContainText(userData.deactivateAccount.deactivateAccAutoNum);
//await expect(page.getByRole('table')).toContainText(userData.deactivateAccount.deactivateAccAutoNum);
await expect(page.getByRole('table')).toContainText('QA_CONTACT');
await expect(page.getByRole('link').filter({ hasText: /^$/ }).nth(2)).toBeVisible();
await page.getByRole('link').filter({ hasText: /^$/ }).nth(2).click();
await expect(page.getByRole('button', { name: 'Activate Account' })).toContainText('Activate Account');
});
      
        
test('Acct Activate-Verify Account is deactivated and shows correct status', async ({ page ,loginAsAdmin}) => {
   const activeAccount = isActiveAccount();
    console.log('1st activeAccount', activeAccount);
   
   test.skip(await activeAccount === true, 'Skip if account is  active');
   console.log('2nd activeAccount', activeAccount);
  await loginAsAdmin();
  // await page.getByText('0').first().click();
    await expect(page).toHaveURL(userData.admin.dashboardUrl);

await page.getByRole('link', { name: ' Accounts' }).click();
await page.getByRole('textbox', { name: 'Enter Account Number' }).click();
await page.getByRole('textbox', { name: 'Enter Account Number' }).fill(userData.deactivateAccount.deactivateAccAutoNum);
await page.getByRole('checkbox', { name: 'Show Inactive Only' }).check();
await page.getByRole('button', { name: 'Apply Filter' }).click();

await expect(page.getByRole('link').filter({ hasText: /^$/ }).nth(2)).toBeVisible();
await page.getByRole('link').filter({ hasText: /^$/ }).nth(2).click();
await expect(page.getByRole('button', { name: 'Activate Account' })).toBeVisible();
await page.getByRole('button', { name: 'Activate Account' }).click();
await expect(page.getByRole('heading', { name: 'Confirm action' })).toBeVisible();
await expect(page.locator('app-modal')).toContainText('Are you sure you want to activate this account?');
await expect(page.getByRole('button', { name: 'Cancel' })).toBeVisible();
await expect(page.getByRole('button', { name: 'Ok' })).toBeVisible();
await page.getByRole('button', { name: 'Ok' }).click();
});
      /*
test('Reactivate Account, verify Reactivate functionality test execution', async ({ page ,loginAsAdmin}) => {
   const activeAccount = isActiveAccount();
  console.log('1st activeAccount', activeAccount);
  test.skip(await activeAccount === false, 'Skip if account is active');
    console.log('2ndactiveAccount', activeAccount);
  await loginAsAdmin();

await page.getByRole('link', { name: ' Accounts' }).click();
await page.getByRole('textbox', { name: 'Enter Account Number' }).click();
await page.getByRole('textbox', { name: 'Enter Account Number' }).fill(userData.deactivateAccount.deactivateAccAutoNum);
//await page.getByRole('checkbox', { name: 'Show Inactive Only' }).check();
await page.getByRole('button', { name: 'Apply Filter' }).click();

await expect(page.getByRole('link').filter({ hasText: /^$/ }).nth(2)).toBeVisible();
await page.getByRole('link').filter({ hasText: /^$/ }).nth(2).click();
await expect(page.getByRole('button', { name: 'Deactivate Account' })).toBeVisible();
await page.getByRole('button', { name: 'Deactivate Account' }).click();
await expect(page.getByRole('heading', { name: 'Confirm action' })).toBeVisible();
await expect(page.getByText('Are you sure you want to')).toContainText(' Are you sure you want to deactivate this account? ');
await expect(page.getByRole('button', { name: 'Cancel' })).toBeVisible();
await expect(page.getByRole('button', { name: 'Ok' })).toBeVisible();
await page.getByRole('button', { name: 'Ok' }).click();
await page.getByLabel('Account has been sucessfully').click();
await  expect(page.getByText('Show Inactive Only')).toBeVisible();
await expect(page.getByRole('checkbox', { name: 'Show Inactive Only' })).toBeVisible();
await page.getByRole('checkbox', { name: 'Show Inactive Only' }).uncheck();
await page.getByRole('button', { name: 'Apply Filter' }).click();
await expect(page.getByRole('table')).toContainText(userData.deactivateAccount.deactivateAccAutoNum);
await expect(page.getByRole('cell', { name: userData.deactivateAccount.deactivateAccAutoNum }).first()).toBeVisible();
await expect(page.locator('td').filter({ hasText: /^QAACCOUNTAUTOTEST001$/ })).toBeVisible();
await expect(page.getByRole('table')).toContainText(userData.deactivateAccount.deactivateAccAutoNum);
await expect(page.getByRole('link').filter({ hasText: /^$/ }).nth(2)).toBeVisible();
await page.getByRole('link').filter({ hasText: /^$/ }).nth(2).click();
await page.getByRole('button', { name: 'Edit Account' }).click();
await expect(page.getByRole('heading', { name: 'Edit Account' })).toBeVisible();
await expect(page.getByRole('heading')).toContainText('Edit Account');
await expect(page.getByRole('dialog').getByText(userData.deactivateAccount.deactivateAccAutoNum)).toBeVisible();
await expect(page.locator('app-create-account-modal')).toContainText(userData.deactivateAccount.deactivateAccAutoNum);
await expect(page.getByText('Date terminated')).toBeVisible();
await expect(page.locator('section-status-dates')).toContainText('N/A');
await expect(page.locator('section-status-dates')).toContainText('ECS');
await expect(page.locator('checkbox').filter({ hasText: 'ECS' })).toBeVisible();
await page.getByRole('link', { name: 'javascript' }).click();
await page.getByRole('link').filter({ hasText: /^$/ }).nth(2).click();

await expect(page.getByRole('button', { name: 'Deactivate Account' })).toBeVisible();
await page.getByRole('button', { name: 'Deactivate Account' }).click();
await expect(page.getByRole('heading', { name: 'Confirm action' })).toBeVisible();
await expect(page.locator('app-modal')).toContainText('Are you sure you want to deactivate this account?');
await expect(page.getByRole('button', { name: 'Ok' })).toBeVisible();
await page.getByRole('button', { name: 'Ok' }).click();
await page.getByRole('checkbox', { name: 'Show Inactive Only' }).check();
await page.getByRole('button', { name: 'Apply Filter' }).click();
await page.getByRole('link').filter({ hasText: /^$/ }).nth(2).click();
await page.getByRole('button', { name: 'Edit Account' }).click();
await expect(page.getByRole('checkbox', { name: 'ECS' })).toBeVisible();
await page.getByText('ECS').click();
await expect(page.locator('label').filter({ hasText: 'ECS' })).toBeVisible();
await expect(page.getByText('Date terminated')).toBeVisible();
await expect(page.locator('section-status-dates')).toContainText('02/10/26');
await expect(page.locator('app-create-account-modal')).toContainText(userData.deactivateAccount.deactivateAccAutoNum);
await expect(page.getByRole('dialog').getByText(userData.deactivateAccount.deactivateAccAutoNum)).toBeVisible();
await page.getByRole('link', { name: 'javascript' }).click();
});
*/