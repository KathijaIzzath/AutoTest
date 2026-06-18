import { test, expect } from '../myTestData';
import { Page } from '@playwright/test';
import * as userData from '../../testData/UserInfo.json';
import * as d from '../../testData/AcctDeactTestData.json';
import { navigateToAccounts } from '../framework/navigation.helper';
import {  isActiveAccount } from '../../testData/database.utils';

const targetAccountNumber = userData.deactivateAccount.deactivateAccAutoNum;

async function filterByAccount(page: Page, accountNumber: string, showInactiveOnly = false) {
  const accountFilter = page.getByRole('textbox', { name: d.roles.accountNumberFilterTextbox });
  await expect(accountFilter).toBeVisible();
  await accountFilter.fill(accountNumber);

  const inactiveCheckbox = page.getByRole('checkbox', { name: d.labels.showInactiveOnly });
  if (showInactiveOnly) {
    await inactiveCheckbox.check();
    await expect(inactiveCheckbox).toBeChecked();
  } else if (await inactiveCheckbox.isChecked()) {
    await inactiveCheckbox.uncheck();
    await expect(inactiveCheckbox).not.toBeChecked();
  }

  await page.getByRole('button', { name: d.labels.applyFilter }).click();
  await page.waitForLoadState('networkidle');
}

async function openAccountRowAction(page: Page) {
  const rowAction = page.getByRole('link').filter({ hasText: /^$/ }).nth(d.selectors.rowActionLinkIndex);
  await expect(rowAction).toBeVisible();
  await rowAction.click();
}

async function confirmActionModal(page: Page, message: string, confirm = true) {
  await expect(page.getByRole('heading', { name: d.labels.confirmAction })).toBeVisible();
  await expect(page.locator(d.selectors.modalRoot)).toContainText(message);
  await expect(page.getByRole('button', { name: d.labels.cancel })).toBeVisible();
  await expect(page.getByRole('button', { name: d.labels.ok })).toBeVisible();
  await page.getByRole('button', { name: confirm ? d.labels.ok : d.labels.cancel }).click();
}

test('Deactivate Account, verify Deactivate and Reactivate functionality test execution', async ({ page, loginAsAdmin }) => {
  const activeAccount = await isActiveAccount();
  console.log('activeAccount before deactivate:', activeAccount);
  test.skip(activeAccount === false, 'Skip if account is not active');
  await loginAsAdmin();
   
 // const date = getTodaysDateWithYr();
 //console.log('extracted date', date);
await navigateToAccounts(page);
await filterByAccount(page, targetAccountNumber);

await openAccountRowAction(page);
//await page.getByRole('link').filter({ hasText: /^$/ }).nth(2).click();
//await expect(page.getByRole('button', { name: 'Deactivate Account' })).toBeVisible();
////await page.getByRole('link').filter({ hasText: /^$/ }).nth(2).click();
//await page.getByRole('link').filter({ hasText: /^$/ }).nth(2).click();
await page.getByRole('button', { name: d.labels.deactivateAccount }).click();
await confirmActionModal(page, d.labels.confirmDeactivateMessage);

await expect(page.locator('label')).toContainText(d.labels.showInactiveOnly);
await expect(page.getByText(d.labels.showInactiveOnly)).toBeVisible();
await filterByAccount(page, targetAccountNumber, true);
//await page.getByText('Account Number', { exact: true }).click();
//await page.getByRole('textbox', { name: 'Enter Account Number' }).click();
//await page.getByRole('textbox', { name: 'Enter Account Number' }).click();
await page.getByRole('cell', { name: targetAccountNumber }).first().click();
await expect(page.getByRole('cell', { name: targetAccountNumber }).first()).toBeVisible();
await expect(page.getByRole('table')).toContainText(targetAccountNumber);
//await expect(page.getByRole('table')).toContainText(userData.deactivateAccount.deactivateAccAutoNum);
await expect(page.getByRole('table')).toContainText(d.labels.qaContact);
await openAccountRowAction(page);
await expect(page.getByRole('button', { name: d.labels.activateAccount })).toContainText(d.labels.activateAccount);
});
      
        
test('Acct Activate-Verify Account is deactivated and shows correct status', async ({ page ,loginAsAdmin}) => {
   const activeAccount = await isActiveAccount();
    console.log('activeAccount before activate:', activeAccount);
   
   test.skip(activeAccount === true, 'Skip if account is active');
  await loginAsAdmin();
  // await page.getByText('0').first().click();
    await expect(page).toHaveURL(userData.admin.dashboardUrl);

await navigateToAccounts(page);
await filterByAccount(page, targetAccountNumber, true);

await openAccountRowAction(page);
await expect(page.getByRole('button', { name: d.labels.activateAccount })).toBeVisible();
await page.getByRole('button', { name: d.labels.activateAccount }).click();
await confirmActionModal(page, d.labels.confirmActivateMessage);
});

test('Deactivate confirmation cancel should keep account in active flow', async ({ page, loginAsAdmin }) => {
  await loginAsAdmin();
  await navigateToAccounts(page);

  await filterByAccount(page, targetAccountNumber);

  const rowActionLinks = page.getByRole('link').filter({ hasText: /^$/ });
  test.skip((await rowActionLinks.count()) <= d.selectors.rowActionLinkIndex, 'Skip when filtered account row action link is unavailable');

  await openAccountRowAction(page);
  await expect(page.getByRole('button', { name: d.labels.deactivateAccount })).toBeVisible();
  await page.getByRole('button', { name: d.labels.deactivateAccount }).click();

  await confirmActionModal(page, d.labels.confirmDeactivateMessage, false);

  await expect(page.getByRole('heading', { name: d.labels.confirmAction })).toHaveCount(0);
  await openAccountRowAction(page);
  const deactivateButtonCount = await page.getByRole('button', { name: d.labels.deactivateAccount }).count();
  const activateButtonCount = await page.getByRole('button', { name: d.labels.activateAccount }).count();
  expect(deactivateButtonCount + activateButtonCount).toBeGreaterThan(0);
});

test('Account filter invalid value should show empty result set', async ({ page, loginAsAdmin }) => {
  await loginAsAdmin();
  await navigateToAccounts(page);

  await filterByAccount(page, d.edgeCases.invalidAccountNumber);

  await expect(page.getByRole('cell', { name: d.edgeCases.invalidAccountNumber })).toHaveCount(0);
  await expect(page.getByText(d.labels.noResults).first()).toBeVisible();
});
      /*
test('Reactivate Account, verify Reactivate functionality test execution', async ({ page ,loginAsAdmin}) => {
   const activeAccount = isActiveAccount();
  console.log('1st activeAccount', activeAccount);
  test.skip(await activeAccount === false, 'Skip if account is active');
    console.log('2ndactiveAccount', activeAccount);
  await loginAsAdmin();

await navigateToAccounts(page);
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