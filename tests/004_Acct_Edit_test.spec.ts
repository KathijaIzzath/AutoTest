import { test, expect, Page } from '@playwright/test';
import * as userData from '../testData/UserInfo.json';
import { getTodaysDate, getTodaysDateWithYr } from '../testData/database.utils';
import LoginPage from '../testData/LoginPage';

let page: Page;

test.beforeEach(async ({ browser }) => {
  // Initialize the page instance before each test
  page = await browser.newPage();
});

test('Edit Newly created Account, verify Edit Screen elements test execution', async ({ page }) => {
  let loginPage = new LoginPage(page);
  await loginPage.navigate();
  await loginPage.login(userData.admin.username, userData.admin.password);
  await expect(page).toHaveURL(userData.admin.dashboardUrl);

  const date = getTodaysDateWithYr();
  console.log('extracted date', date);

  await page.getByRole('link', { name: ' Accounts' }).click();
  await page.getByRole('textbox', { name: 'Enter Account Number' }).click();
  await page.getByRole('textbox', { name: 'Enter Account Number' }).fill('SCAUTOACCTNUM-01');
  await page.getByRole('button', { name: 'Apply Filter' }).click();
  await page.waitForLoadState('networkidle');

  // Click on the account row (cell or link in the filtered results)
  await page.getByRole('link').filter({ hasText: /^$/ }).nth(2).click();
  await page.getByRole('button', { name: 'Edit Account' }).click();

  await expect(page.getByRole('heading', { name: 'Edit Account' })).toBeVisible();

  // Wait for the modal loading overlay to disappear before interacting with checkboxes
  await page.locator('.modal-body.loading').waitFor({ state: 'hidden', timeout: 5000 });

  if (await page.getByRole('checkbox', { name: 'Claim Status' }).isChecked()) {
    await page.getByRole('checkbox', { name: 'Claim Status' }).uncheck();
  }
  await page.getByRole('checkbox', { name: 'Claim Status' }).check();

  if (await page.getByRole('checkbox', { name: 'Eligibility' }).isChecked()) {
    await page.getByRole('checkbox', { name: 'Eligibility' }).uncheck();
  }
  await page.getByRole('checkbox', { name: 'Eligibility' }).check();

  if (await page.getByRole('checkbox', { name: 'Statements' }).isChecked()) {
    await page.getByRole('checkbox', { name: 'Statements' }).uncheck();
  }
  await page.getByRole('checkbox', { name: 'Statements' }).check();

  await page.getByText(date).first().click();
  await page.getByText(date).nth(1).click();
  await page.getByText(date).nth(2).click();

  await page.locator('.address-wrapper > div > .ng-select-searchable > .ng-select-container > .ng-value-container > .ng-input > input').first().click();
  await page.getByText('70510 (Abbeville - LA)').click();

  await page.getByRole('textbox', { name: 'Enter Email' }).click();
  await page.getByRole('textbox', { name: 'Enter Email' }).fill('kmohamed@harriscomputer.com');

  await page.getByRole('textbox', { name: 'Enter Phone' }).click();
  await page.getByRole('textbox', { name: 'Enter Phone' }).fill('(444) 555-2322');

  await page.getByRole('textbox', { name: 'Enter Contact' }).click();
  await page.getByRole('textbox', { name: 'Enter Contact' }).fill('SCQA_AUTO');

  await page.getByRole('textbox', { name: 'Last 4 Digits' }).click();
  await page.getByRole('textbox', { name: 'Last 4 Digits' }).fill('1234');

  await page.getByRole('textbox', { name: 'Enter expiration date' }).click();
  await page.getByRole('textbox', { name: 'Enter expiration date' }).fill('12/35');

  await page.getByRole('button', { name: 'Save & Close' }).click();

  await page.getByRole('columnheader', { name: 'State' }).click();
  await page.getByRole('cell', { name: 'LA' }).click();
  await page.getByRole('columnheader', { name: 'City' }).click();
  await page.getByRole('cell', { name: 'ABBEVILLE' }).click();
  await page.getByRole('columnheader', { name: 'contact Name' }).click();
});

test('Edit existing Account and test Edit Screen elements', async ({ page }) => {
  let loginPage = new LoginPage(page);
  await loginPage.navigate();
  await loginPage.login(userData.admin.username, userData.admin.password);
  await expect(page).toHaveURL(userData.admin.dashboardUrl);

  await page.getByRole('link', { name: ' Accounts' }).click();
  await page.getByRole('textbox', { name: 'Enter Account Number' }).click();
  await page.getByRole('textbox', { name: 'Enter Account Number' }).fill(userData.editAccount.editAccAutoNum);
  await page.getByRole('button', { name: 'Apply Filter' }).click();
  await page.waitForLoadState('networkidle');

  const date = getTodaysDate();

  await page.getByRole('link').filter({ hasText: /^$/ }).nth(2).click();
  await page.getByRole('button', { name: 'Edit Account' }).click();

  await expect(page.getByRole('heading', { name: 'Edit Account' })).toBeVisible();

  // Wait for the modal loading overlay to disappear before interacting with elements
  await page.locator('.modal-body.loading').waitFor({ state: 'hidden', timeout: 5000 });

  await page.getByText('Phone').click();
  await expect(page.getByRole('textbox', { name: 'Enter Email' })).toBeVisible();
  await expect(page.getByRole('textbox', { name: 'Enter Phone' })).toBeVisible();
  await expect(page.getByRole('checkbox', { name: 'Claim Status' })).toBeVisible();
  await expect(page.getByText('/09/26').first()).toBeVisible();

  await page.getByRole('checkbox', { name: 'Eligibility' }).uncheck();
  await expect(page.getByRole('checkbox', { name: 'Statements' })).toBeVisible();
  await page.getByRole('checkbox', { name: 'Eligibility' }).check();
  await expect(page.getByRole('checkbox', { name: 'Eligibility' })).toBeVisible();

  await expect(page.getByText('Zip', { exact: true })).toBeVisible();
  await expect(page.locator('.address-wrapper > div > .ng-select-searchable > .ng-select-container > .ng-value-container > .ng-input > input').first()).toBeVisible();
  await expect(page.getByText('Contact', { exact: true })).toBeVisible();
  await page.getByRole('textbox', { name: 'Enter Contact' }).fill('SCQA_AUTO');
  await expect(page.getByRole('textbox', { name: 'Enter Contact' })).toBeVisible();

  await expect(page.getByRole('textbox', { name: 'Enter Name' })).toBeVisible();
  await expect(page.getByText('* Practice Management Select')).toBeVisible();
  await expect(page.locator('checkbox').filter({ hasText: 'ECS' })).toBeVisible();
  await expect(page.getByRole('checkbox', { name: 'ERA' })).toBeVisible();

  await expect(page.getByText('Date terminated')).toBeVisible();
  await page.getByText('N/A').click();
  await expect(page.getByText('N/A')).toBeVisible();

  await expect(page.getByText('date setup')).toBeVisible();
  await expect(page.getByText('/09/26').nth(2)).toBeVisible();
  await expect(page.getByText('last updated by')).toBeVisible();
  await expect(page.getByText('1', { exact: true })).toBeVisible();

  await page.getByText('Last update', { exact: true }).click();
  await page.getByText('/09/26').nth(3).click();
  await expect(page.getByRole('button', { name: 'Save & Close' })).toBeVisible();
  await page.getByRole('button', { name: 'Save & Close' }).click();
});