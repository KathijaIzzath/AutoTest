
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
  //const loginPage = new LoginPage(page);
  //await loginPage.navigate();
 // await loginPage.login(userData.admin.username, userData.admin.password);
  //await expect(page).toHaveURL(userData.admin.dashboardUrl);
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