
import { test, expect, Locator, Page } from '@playwright/test';
import * as userData from '../testData/UserInfo.json';
import LoginPage from '../testData/LoginPage';
import helperFunction from '../testData/helperFunction';
import {  existsSingleGroupEnrollment, fetchNPIAndTaxIDForGroupId, getTodaysDateWithFullYear, getTodaysDateWithYr } from '../testData/database.utils';
// Adding single payer enrollment for groupid G00014
let page: Page;

// Setup: runs before each test
test.beforeEach(async ({ browser }) => {
  page = await browser.newPage();
});
test.beforeEach(async ({ page }) => {
  // No need to login, just navigate to the dashboard or required page
  await page.goto(userData.admin.dashboardUrl);
});
test('Group Enrollment Dashboard elements/controls verification test execution', async ({ page }) => {

  // --- Login ---
  const loginPage = new LoginPage(page);
  await loginPage.navigate();
 await loginPage.login(userData.admin.username, userData.admin.password);
  await expect(page).toHaveURL(userData.admin.dashboardUrl);
  const groupId = userData.groupEnroll.groupId;
  // --- Pre-checks and navigation ---
  const verifyEnrollmentExists = await existsSingleGroupEnrollment(groupId);
  await page.getByRole('link', { name: ' Group Enrollments' }).click();

  await page.getByRole('link', { name: ' Group Enrollments' }).click();
  await expect(page.getByText('Group Enrollment Add Group')).toBeVisible();
  await expect(page.getByRole('link', { name: ' Add Group Enrollment' })).toBeVisible();
  await expect(page.getByRole('link').filter({ hasText: /^$/ }).first()).toBeVisible();
  await expect(page.getByRole('link').filter({ hasText: /^$/ }).nth(1)).toBeVisible();
  await expect(page.getByText('start date')).toBeVisible();
  await expect(page.getByRole('textbox', { name: 'mm/dd/yyyy' }).first()).toBeVisible();
  await expect(page.getByRole('button').nth(4)).toBeVisible();
  await expect(page.getByText('end date')).toBeVisible();
  await expect(page.getByRole('textbox', { name: 'mm/dd/yyyy' }).nth(1)).toBeVisible();
  await expect(page.getByRole('button').nth(5)).toBeVisible();
  await expect(page.getByText('Agreement Status')).toBeVisible();
  await expect(page.locator('div').filter({ hasText: /^Select Status$/ }).nth(1)).toBeVisible();
  await expect(page.getByText('Group ID')).toBeVisible();
  await expect(page.getByRole('textbox', { name: 'Enter Group ID' })).toBeVisible();
  await expect(page.getByText('NPI')).toBeVisible();
  await expect(page.getByRole('textbox', { name: 'Enter NPI' })).toBeVisible();
  await expect(page.getByText('Tax ID')).toBeVisible();
  await expect(page.getByRole('textbox', { name: 'Enter Tax ID' })).toBeVisible();
  await expect(page.getByText('payer id')).toBeVisible();
  await expect(page.getByRole('textbox', { name: 'Enter Payer ID' })).toBeVisible();
  await expect(page.getByText('Payer Name')).toBeVisible();
  await expect(page.getByRole('textbox', { name: 'Enter Payer Name' })).toBeVisible();
  await expect(page.getByText('Routing ID')).toBeVisible();
  await expect(page.getByRole('textbox', { name: 'Enter Routing ID' })).toBeVisible();
  await expect(page.getByText('show last')).toBeVisible();
  await expect(page.locator('select')).toBeVisible();
  await expect(page.getByText('enrollment type', { exact: true })).toBeVisible();
  await expect(page.locator('div').filter({ hasText: /^Select Enrollment Type$/ }).nth(1)).toBeVisible();
  await expect(page.getByText('Case Number')).toBeVisible();
  await expect(page.getByRole('textbox', { name: 'Enter Case Number' })).toBeVisible();
  await expect(page.getByRole('button', { name: 'Apply Filter' })).toBeVisible();
  await expect(page.locator('.dropdown-toggle.button')).toBeVisible();

});

test(' Enrollment Dashboard search verification test execution', async ({ page }) => {

  
  // --- Login ---
  const loginPage = new LoginPage(page);
  await loginPage.navigate();
 await loginPage.login(userData.admin.username, userData.admin.password);
  await expect(page).toHaveURL(userData.admin.dashboardUrl);
  
await page.getByRole('link', { name: ' Group Enrollments' }).click();
await expect(page.getByText('Group ID')).toBeVisible();
await expect(page.getByRole('textbox', { name: 'Enter Group ID' })).toBeVisible();
await page.getByRole('textbox', { name: 'Enter Group ID' }).click();
await page.getByRole('textbox', { name: 'Enter Group ID' }).fill('G00016');
await page.getByRole('button', { name: 'Apply Filter' }).click();
await expect(page.getByRole('columnheader', { name: 'GROUP ID' })).toBeVisible();
await expect(page.getByRole('columnheader', { name: 'GROUP NAME' })).toBeVisible();
await expect(page.getByRole('cell', { name: 'G00016' }).first()).toBeVisible();
await expect(page.getByRole('cell', { name: 'WUCKERT LLC' }).first()).toBeVisible();
await expect(page.getByRole('columnheader', { name: 'NPI' })).toBeVisible();
await expect(page.getByRole('cell', { name: '1699873976' }).first()).toBeVisible();
await expect(page.getByRole('columnheader', { name: 'TAX ID' })).toBeVisible();
await expect(page.getByRole('cell', { name: '271673289' }).first()).toBeVisible();
await expect(page.getByRole('columnheader', { name: 'PAYER NAME' })).toBeVisible();
await expect(page.getByRole('cell', { name: 'SELECTCARE' }).first()).toBeVisible();
await expect(page.getByRole('columnheader', { name: 'TYPE' })).toBeVisible();
await expect(page.getByRole('cell', { name: 'PROFESSIONAL' })).toBeVisible();
await expect(page.getByRole('columnheader', { name: 'PAYER ID' })).toBeVisible();
await expect(page.getByRole('cell', { name: '00014' }).first()).toBeVisible();
await expect(page.getByRole('columnheader', { name: 'PROCESSOR ID' })).toBeVisible();
await expect(page.getByRole('cell', { name: 'RELAY' }).first()).toBeVisible();
await expect(page.getByRole('columnheader', { name: 'ROUTING ID' })).toBeVisible();
await expect(page.getByRole('cell', { name: '7449' })).toBeVisible();
await expect(page.getByRole('columnheader', { name: 'STATUS' })).toBeVisible();
await expect(page.getByRole('row', { name: ' G00016 WUCKERT LLC' }).getByRole('combobox')).toHaveValue('P');
await expect(page.locator('tbody')).toContainText('To be sent');
await expect(page.getByRole('columnheader', { name: 'CREATED DATE ' })).toBeVisible();
await expect(page.getByRole('cell', { name: '/10/2026' }).first()).toBeVisible();
await expect(page.locator('form').getByText('NPI')).toBeVisible();
await expect(page.getByRole('textbox', { name: 'Enter NPI' })).toBeVisible();
await page.getByRole('textbox', { name: 'Enter NPI' }).click();
await page.getByRole('textbox', { name: 'Enter NPI' }).fill('1699873976');
await page.getByRole('button', { name: 'Apply Filter' }).click();
await expect(page.getByRole('columnheader', { name: 'NPI' })).toBeVisible();
await expect(page.getByRole('cell', { name: '1699873976' }).first()).toBeVisible();
await page.getByRole('textbox', { name: 'Enter NPI' }).fill('');
await expect(page.locator('div').filter({ hasText: /^Tax ID$/ }).nth(1)).toBeVisible();
await page.getByRole('textbox', { name: 'Enter Tax ID' }).click();
await page.getByRole('textbox', { name: 'Enter Tax ID' }).fill('271673289');
await page.getByRole('button', { name: 'Apply Filter' }).click();
await expect(page.getByRole('columnheader', { name: 'TAX ID' })).toBeVisible();
await expect(page.getByRole('cell', { name: '271673289' }).first()).toBeVisible();
await page.getByRole('textbox', { name: 'Enter Tax ID' }).fill('');
await expect(page.getByText('payer id', { exact: true })).toBeVisible();
await expect(page.getByRole('textbox', { name: 'Enter Payer ID' })).toBeVisible();
await page.getByRole('textbox', { name: 'Enter Payer ID' }).click();
await page.getByRole('textbox', { name: 'Enter Payer ID' }).fill('00014');
await page.getByRole('button', { name: 'Apply Filter' }).click();
await expect(page.getByRole('columnheader', { name: 'PAYER ID' })).toBeVisible();
await expect(page.getByRole('cell', { name: '00014' }).first()).toBeVisible();
await page.getByRole('textbox', { name: 'Enter Payer ID' }).fill('');
await expect(page.getByText('Payer Name', { exact: true })).toBeVisible();
await expect(page.getByRole('textbox', { name: 'Enter Payer Name' })).toBeVisible();
await page.getByRole('textbox', { name: 'Enter Payer Name' }).click();
await page.getByRole('textbox', { name: 'Enter Payer Name' }).fill('SELECTCARE');
await page.getByRole('button', { name: 'Apply Filter' }).click();
await expect(page.getByRole('columnheader', { name: 'PAYER NAME' })).toBeVisible();
await expect(page.getByRole('cell', { name: 'SELECTCARE' }).first()).toBeVisible();
await page.getByRole('textbox', { name: 'Enter Payer Name' }).fill('');
await expect(page.getByText('Routing ID', { exact: true })).toBeVisible();
await expect(page.getByRole('textbox', { name: 'Enter Routing ID' })).toBeVisible();
await page.getByRole('textbox', { name: 'Enter Routing ID' }).click();
await page.getByRole('textbox', { name: 'Enter Routing ID' }).fill('00014');
await page.getByRole('button', { name: 'Apply Filter' }).click();
await expect(page.getByRole('columnheader', { name: 'ROUTING ID' })).toBeVisible();
await expect(page.getByRole('cell', { name: '00014' }).nth(1)).toBeVisible();
await page.getByRole('textbox', { name: 'Enter Routing ID' }).fill('');

await expect(page.getByText('Group ID', { exact: true })).toBeVisible();
await page.getByRole('textbox', { name: 'Enter Group ID' }).fill('');
await expect(page.getByText('show last')).toBeVisible();
await expect(page.locator('showlast-filter-item').getByRole('combobox')).toBeVisible();
//await expect(page.locator('showlast-filter-item').getByRole('combobox')).toBeEmpty();
await expect(page.locator('showlast-filter-item')).toContainText('Select Date 30 Days 60 Days 90 Days 120 Days');
await page.locator('showlast-filter-item').getByRole('combobox').selectOption('120');

await page.getByRole('button', { name: 'Apply Filter' }).click();
await expect(page.getByRole('columnheader', { name: 'CREATED DATE ' })).toBeVisible();

await expect(page.getByRole('cell', { name: '/10/2026' }).first()).toBeVisible();//04/10/2026
await page.getByRole('columnheader', { name: 'CREATED DATE ' }).click();
await expect(page.getByRole('cell', { name: '/09/2026' }).nth(1)).toBeVisible();//01/09/2026

await page.locator('showlast-filter-item').getByRole('combobox').selectOption('');
//await expect(page.getByText('enrollment type', { exact: true })).toBeVisible();

await expect(page.getByText('enrollment type', { exact: true })).toBeVisible();
//await page.getByText('Select Enrollment Type').click();
//await page.getByText('Select Enrollment Type').click();
await page.getByRole('checkbox', { name: 'ERA' }).check();
await page.getByRole('button', { name: 'Apply Filter' }).click();

await expect(page.getByRole('columnheader', { name: 'TYPE' })).toBeVisible();
await expect(page.getByRole('cell', { name: 'ERA' }).first()).toBeVisible();
await page.locator('form').getByTitle('Clear all').click();
await page.getByRole('button', { name: 'Apply Filter' }).click();
await expect(page.getByRole('columnheader', { name: 'TYPE' })).toBeVisible();
await expect(page.getByRole('cell', { name: 'CLAIMSTATUS' }).first()).toBeVisible();
await page.locator('form').getByTitle('Clear all').click();
await page.getByRole('button', { name: 'Apply Filter' }).click();
await expect(page.getByRole('columnheader', { name: 'TYPE' })).toBeVisible();
await expect(page.getByRole('cell', { name: 'ELIGIBILITY' }).first()).toBeVisible();
await page.locator('form').getByTitle('Clear all').click();
await page.getByRole('checkbox', { name: 'Professional' }).check();
await page.getByRole('button', { name: 'Apply Filter' }).click();
await expect(page.getByRole('columnheader', { name: 'TYPE' })).toBeVisible();
await expect(page.getByRole('cell', { name: 'PROFESSIONAL' }).first()).toBeVisible();
await page.locator('form').getByTitle('Clear all').click();
await expect(page.getByText('Agreement Status')).toBeVisible();
await page.getByRole('checkbox', { name: 'Sent to Customer' }).check();
await page.getByRole('button', { name: 'Apply Filter' }).click();
await expect(page.getByRole('columnheader', { name: 'STATUS' })).toBeVisible();
await expect(page.locator('tbody')).toContainText('Sent to Customer');
//await page.getByText('×').nth(2).click();
//await page.locator('.ng-select-multiple > .ng-select-container > .ng-arrow-wrapper').first().click();
await page.getByRole('checkbox', { name: 'Approved' }).check();
await page.getByRole('button', { name: 'Apply Filter' }).click();
await expect(page.getByRole('columnheader', { name: 'STATUS' })).toBeVisible();
await expect(page.getByRole('row', { name: ' G29232 IMPROVING LIVES' }).getByRole('combobox')).toHaveValue('A');
await expect(page.getByRole('row', { name: ' G29232 IMPROVING LIVES' }).getByRole('combobox')).toBeVisible();
await page.locator('form').getByTitle('Clear all').click();
await page.getByRole('checkbox', { name: 'To be sent' }).check();
await page.getByRole('button', { name: 'Apply Filter' }).click();
await expect(page.getByRole('columnheader', { name: 'STATUS' })).toBeVisible();
await expect(page.getByRole('row', { name: ' G00016 WUCKERT LLC' }).getByRole('combobox')).toHaveValue('P');
await expect(page.locator('tbody')).toContainText('To be sent');
await page.locator('form').getByTitle('Clear all').click();
await page.getByRole('checkbox', { name: 'Not applicable' }).check();
await page.getByRole('button', { name: 'Apply Filter' }).click();
await expect(page.getByRole('columnheader', { name: 'STATUS' })).toBeVisible();
await expect(page.getByRole('row', { name: 'G29638 SOUTHERN PAIN AND' }).getByRole('combobox')).toHaveValue('N');
await expect(page.locator('tbody')).toContainText('Not applicable');

});


test(' Enrollment Sorting results verification test execution', async ({ page }) => {

  // --- Login ---
  const loginPage = new LoginPage(page);
  await loginPage.navigate();
 await loginPage.login(userData.admin.username, userData.admin.password);
  await expect(page).toHaveURL(userData.admin.dashboardUrl);
  
await page.getByRole('link', { name: ' Group Enrollments' }).click();
await page.getByRole('button', { name: 'Apply Filter' }).click();
await page.getByRole('columnheader', { name: 'GROUP ID' }).click();
await expect(page.getByRole('cell', { name: 'G00012' }).first()).toBeVisible();
await page.getByRole('columnheader', { name: 'GROUP NAME' }).click();
await expect(page.getByRole('cell', { name: '- MAYFLOWER MEDICAL' }).first()).toBeVisible();
await page.getByRole('columnheader', { name: 'NPI' }).click();
await expect(page.getByRole('cell', { name: '0829876198' })).toBeVisible();
await page.getByRole('columnheader', { name: 'TAX ID' }).click();
await expect(page.getByRole('cell', { name: '007481793' }).first()).toBeVisible();
await page.getByRole('columnheader', { name: 'PAYER NAME' }).click();
await expect(page.getByRole('cell', { name: 'NATIONAL BENEFIT FUND' }).first()).toBeVisible();
await page.getByRole('columnheader', { name: 'TYPE' }).click();
await expect(page.getByRole('cell', { name: 'CLAIMSTATUS' }).first()).toBeVisible();
await page.getByRole('columnheader', { name: 'PAYER ID' }).click();
await expect(page.getByRole('cell', { name: '00014' }).first()).toBeVisible();
await page.getByRole('columnheader', { name: 'PROCESSOR ID' }).click();
await expect(page.getByRole('cell', { name: 'ALBC1' }).nth(1)).toBeVisible();
await page.getByRole('columnheader', { name: 'ROUTING ID' }).click();
await expect(page.getByRole('cell', { name: 'N/A' }).first()).toBeVisible();
await page.getByRole('columnheader', { name: 'STATUS' }).click();
await expect(page.getByRole('row', { name: 'G00013 ROBEL, TREUTEL AND' }).getByRole('combobox')).toBeVisible();
await page.getByRole('columnheader', { name: 'CREATED DATE' }).click();
await expect(page.getByRole('cell', { name: '/15/2008' }).first()).toBeVisible();
await page.getByRole('columnheader', { name: 'APPROVED DATE' }).click();
await expect(page.getByRole('cell', { name: '/16/2011' }).first()).toBeVisible();
await page.getByRole('columnheader', { name: 'FOLLOW UP DATE' }).click();
await expect(page.getByRole('cell', { name: '/30/1899' }).first()).toBeVisible();

});