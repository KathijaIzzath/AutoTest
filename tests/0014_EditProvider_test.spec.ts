import { test, expect } from './myTestData';
import { Locator, Page } from '@playwright/test';
import * as userData from '../testData/UserInfo.json';
import LoginPage from '../testData/LoginPage';
import { deleteProviderAndBillingIdsByGroupId, getTodaysDateWithYr } from '../testData/database.utils';





let providerId: string | undefined;
let statementsChecked: boolean | undefined;
let eligibilityChecked: boolean | undefined;
let claimStatusChecked: boolean | undefined;

test.beforeEach(async ({ browser }) => {
});

// Common toggle function: if not checked -> check, else -> uncheck
async function toggleCheckbox(
  page: Page,
  name: string,
  opts?: { exact?: boolean; nth?: number }
): Promise<void> {
  let locator = page.getByRole('checkbox', { name, exact: !!opts?.exact });
  if (typeof opts?.nth === 'number') {
    locator = locator.nth(opts.nth);
  }
  const checked = await locator.isChecked();
  if (checked) {
    await locator.uncheck();
  } else {
    await locator.check();
  }
}
test('Edit provider via dashboard functionality & control/elements verification test execution', async ({ page, loginAsAdmin }) => {
  await deleteProviderAndBillingIdsByGroupId(userData.addProvider.groupeditInAcct);
  await loginAsAdmin();

  await page.getByRole('listitem').filter({ hasText: 'AccountsProviders' }).getByRole('button').click();
  await expect(page.getByRole('link', { name: ' Providers' })).toBeVisible();
  await page.getByRole('link', { name: ' Providers' }).click();
  await expect(page.locator('app-providers').getByText('Providers', { exact: true })).toBeVisible();
  await page.getByRole('button', { name: 'Apply Filter' }).click();

 // await expect(page.getByRole('link').filter({ hasText: /^$/ }).nth(1)).toBeVisible();
  await page.getByRole('link').filter({ hasText: /^$/ }).nth(1).click();
  await page.getByRole('button', { name: 'Edit' }).click();

  // Capture providerId from heading text
  const headingText = await page.getByRole('heading', { name: /EditProvider \([A-Za-z0-9]+\)/ }).textContent();
  const match = headingText && headingText.match(/EditProvider \(([A-Za-z0-9]+)\)/);
  providerId = match ? match[1] : undefined;
  await expect(page.getByRole('heading', { name: new RegExp(`EditProvider \\(${providerId}\\)`) })).toBeVisible();
  await expect(page.getByText('Title')).toBeVisible();
  await page.getByRole('textbox', { name: 'Enter Title' }).click();
  await page.getByRole('textbox', { name: 'Enter Title' }).fill('test');
  await expect(page.getByText('degree')).toBeVisible();
  await page.getByRole('textbox', { name: 'Enter Degree' }).click();
  await page.getByRole('textbox', { name: 'Enter Degree' }).fill('grad');
  await expect(page.getByText('mi', { exact: true })).toBeVisible();
  await page.getByRole('textbox', { name: 'Enter MI' }).click();
  await page.getByRole('textbox', { name: 'Enter MI' }).fill('m');
  await expect(page.getByText('* certification status')).toBeVisible();
  await expect(page.getByText('* certification status ProductionTest')).toBeVisible();
  await page.getByText('* certification status ProductionTest').click();
  await expect(page.getByText('Statements')).toBeVisible();
  // Toggle and store state for Statements
  statementsChecked = await page.getByRole('checkbox', { name: 'Statements' }).isChecked();
  await toggleCheckbox(page, 'Statements');
  statementsChecked = !statementsChecked;
  await expect(page.getByText('Eligibility', { exact: true })).toBeVisible();
  await expect(page.getByRole('checkbox', { name: 'Eligibility' })).toBeVisible();
  // Toggle and store state for Eligibility
  eligibilityChecked = await page.getByRole('checkbox', { name: 'Eligibility' }).isChecked();
  await toggleCheckbox(page, 'Eligibility');
  eligibilityChecked = !eligibilityChecked;
  await expect(page.getByText('Claim Status')).toBeVisible();
  await expect(page.getByRole('checkbox', { name: 'Claim Status' })).toBeVisible();
  // Toggle and store state for Claim Status
  claimStatusChecked = await page.getByRole('checkbox', { name: 'Claim Status' }).isChecked();
  await toggleCheckbox(page, 'Claim Status');
  claimStatusChecked = !claimStatusChecked;
  await expect(page.getByLabel('Provider Details').getByText('ERA', { exact: true })).toBeVisible();
  await expect(page.getByRole('checkbox', { name: 'ERA' })).toBeVisible();
  await toggleCheckbox(page, 'ERA');
  await page.getByText('* certification status ProductionTest').click();
  await expect(page.getByRole('button', { name: 'Save' })).toBeVisible();
  await page.getByRole('button', { name: 'Save' }).click();
});

test('Edit provider functionality verification', async ({ page, loginAsAdmin }) => {
  await loginAsAdmin();
  await deleteProviderAndBillingIdsByGroupId(userData.addProvider.groupeditInAcct);

 
  await page.getByRole('listitem').filter({ hasText: 'AccountsProviders' }).getByRole('button').click();
  await expect(page.getByRole('link', { name: ' Providers' })).toBeVisible();
  await page.getByRole('link', { name: ' Providers' }).click();
  await expect(page.locator('app-providers').getByText('Providers', { exact: true })).toBeVisible();
  await page.getByRole('button', { name: 'Apply Filter' }).click();


  const date = getTodaysDateWithYr();
  // Use the providerId captured from the previous test
  if (!providerId) throw new Error('No providerId captured from previous test');
  await page.getByRole('textbox', { name: 'Enter Provider ID' }).click();
  await page.getByRole('textbox', { name: 'Enter Provider ID' }).fill(providerId);
  await page.getByRole('button', { name: 'Apply Filter' }).click(); 
  await page.getByRole('link').filter({ hasText: /^$/ }).nth(1).click();
  await page.getByRole('button', { name: 'Edit' }).click();

  await expect(page.getByRole('textbox', { name: 'Enter MI' })).toBeVisible();
  await expect(page.getByRole('textbox', { name: 'Enter MI' })).toHaveValue('M');
  await expect(page.getByRole('textbox', { name: 'Enter Degree' })).toHaveValue('GRAD');
  await expect(page.getByRole('textbox', { name: 'Enter Title' })).toHaveValue('TEST');
  await expect(page.getByText(date).first()).toBeVisible();
  await expect(page.getByText(date).nth(1)).toBeVisible();
  await expect(page.getByText(date).nth(2)).toBeVisible();
  await expect(page.getByText(date).nth(3)).toBeVisible();
  await expect(page.getByRole('checkbox', { name: 'Statements' })).toBeVisible();
  await expect(page.getByRole('checkbox', { name: 'Eligibility' })).toBeVisible();
  await expect(page.getByRole('checkbox', { name: 'Claim Status' })).toBeVisible();

  // Assert checkbox state based on previous toggle
  if (statementsChecked) {
    await expect(page.getByRole('checkbox', { name: 'Statements' })).toBeChecked();
  } else {
    await expect(page.getByRole('checkbox', { name: 'Statements' })).not.toBeChecked();
  }
  if (eligibilityChecked) {
    await expect(page.getByRole('checkbox', { name: 'Eligibility' })).toBeChecked();
  } else {
    await expect(page.getByRole('checkbox', { name: 'Eligibility' })).not.toBeChecked();
  }
  if (claimStatusChecked) {
    await expect(page.getByRole('checkbox', { name: 'Claim Status' })).toBeChecked();
  } else {
    await expect(page.getByRole('checkbox', { name: 'Claim Status' })).not.toBeChecked();
  }
  
  await page.getByRole('link').click();
});