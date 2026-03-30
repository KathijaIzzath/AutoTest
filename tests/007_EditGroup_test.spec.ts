import { test, expect, Locator, Page } from '@playwright/test';
import * as userData from '../testData/UserInfo.json';
import LoginPage from '../testData/LoginPage';
import helperFunction from '../testData/helperFunction';
import { getTodaysDate } from '../testData/database.utils';

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

// Ensure input has value
async function ensureInputHasValue(
  page: Page,
  roleName: string,
  value: string
): Promise<void> {
  const textbox = page.getByRole('textbox', { name: roleName });
  const current = await textbox.inputValue();
  if (!current) {
    await textbox.fill(value);
  }
}

let page: Page;

test.beforeEach(async ({ browser }) => {
  // Initialize the page instance before each test
  page = await browser.newPage();
});

test('Edit provider group functionality verification', async ({ page }) => {
  const loginPage = new LoginPage(page);
  //const helper = new helperFunction();

  await loginPage.navigate();
  await loginPage.login(userData.admin.username, userData.admin.password);
  await expect(page).toHaveURL(userData.admin.dashboardUrl);

  await page.getByRole('link', { name: ' Accounts' }).click();
  await page.getByRole('textbox', { name: 'Enter Account Number' }).click();
  await page.getByRole('textbox', { name: 'Enter Account Number' }).fill(userData.editGroup.accountNum);
  await page.getByRole('button', { name: 'Apply Filter' }).click();
  await page.getByRole('link').filter({ hasText: /^$/ }).nth(1).click();
  await page.getByRole('link').filter({ hasText: /^$/ }).nth(3).click();
  await page.getByRole('button', { name: 'Edit Provider Group' }).click();

  await expect(page.getByRole('heading', { name: 'Edit Provider Group: G31927' })).toBeVisible();
  await expect(page.getByText('* fee schedule')).toBeVisible();
  await page.getByLabel('feeSchedule').selectOption('F0256');

  await expect(page.getByText('Address 1')).toBeVisible();
  await expect(page.getByRole('textbox', { name: 'Enter Address' }).first()).toBeVisible();
  await page.getByRole('textbox', { name: 'Enter Address' }).first().click();
  await page.getByRole('textbox', { name: 'Enter Address' }).first().fill('123 Silver Fang Lane');

  await expect(page.getByRole('checkbox', { name: 'Claim Status' })).toBeVisible();
  await expect(page.getByText('Claim Status')).toBeVisible();
  await toggleCheckbox(page, 'Claim Status');

  await expect(page.getByRole('checkbox', { name: 'Eligibility' })).toBeVisible();
  await expect(page.getByText('Eligibility', { exact: true })).toBeVisible();
  await toggleCheckbox(page, 'Eligibility');

  await expect(page.getByRole('checkbox', { name: 'XML' }).first()).toBeVisible();
  await toggleCheckbox(page, 'XML', { nth: 0 });

  await expect(page.getByRole('checkbox', { name: 'Generate' })).toBeVisible();
  await toggleCheckbox(page, 'Generate');

  await expect(page.getByRole('checkbox', { name: 'Machine Readable' }).first()).toBeVisible();
  await toggleCheckbox(page, 'Machine Readable', { nth: 0 });
  await toggleCheckbox(page, 'Human Readable', { nth: 0 });
  await toggleCheckbox(page, 'Pulse CSV', { exact: true });
  await toggleCheckbox(page, '277u', { nth: 0 });
  await toggleCheckbox(page, '277u', { nth: 1 });
  await toggleCheckbox(page, 'CSV', { exact: true });
  await toggleCheckbox(page, 'ERA Summary');
  await toggleCheckbox(page, 'Human Readable', { nth: 1 });
  await toggleCheckbox(page, 'Machine Readable', { nth: 1 });
  await toggleCheckbox(page, 'XML', { nth: 1 });
  await toggleCheckbox(page, 'Daily Pulse CSV');
  await toggleCheckbox(page, 'Human Readable 271');
  await toggleCheckbox(page, 'Alphall');
  await toggleCheckbox(page, 'New Statements');
  await toggleCheckbox(page, 'Combine ERA');

  await page.getByText('Combine ALL').click();
  await page.getByRole('checkbox', { name: 'RCM' }).check();

  await page.getByRole('textbox', { name: 'Enter Phone' }).click();
  await page.getByRole('textbox', { name: 'Enter Phone' }).fill('(444) 555-6666');

  await expect(page.getByRole('button', { name: 'Save & Close' })).toBeVisible();
  await page.getByRole('button', { name: 'Save & Close' }).click();
  await page.getByLabel('Edit provider group').click();
});

test('Edit provider group details and verify the changes are saved successfully', async ({ page }) => {
  // Test steps to edit provider group details and verify changes
  await page.getByRole('link').filter({ hasText: /^$/ }).nth(3).click();
  await page.getByRole('button', { name: 'Edit Provider Group' }).click();
  await page.getByRole('textbox', { name: 'Enter Address' }).first().click();
  await expect(page.getByRole('textbox', { name: 'Enter Address' }).first()).toBeVisible();

  await expect(page.getByRole('checkbox', { name: 'Claim Status' })).toBeChecked();
  await expect(page.getByRole('checkbox', { name: 'Eligibility' })).toBeChecked();
  await expect(page.getByRole('textbox', { name: 'Enter Address' }).first()).toHaveValue(
    '123 SILVER FANG LANE'
  );
  await expect(page.getByRole('textbox', { name: 'Enter Phone' })).toHaveValue('(444) 555-6666');
  await expect(page.getByLabel('feeSchedule')).toHaveValue('F0256');
  await expect(page.getByLabel('feeSchedule')).toBeVisible();

  await expect(page.getByRole('checkbox', { name: '277u' }).first()).toBeChecked();
  await expect(page.getByRole('checkbox', { name: 'Pulse CSV', exact: true })).toBeChecked();
  await expect(page.getByRole('checkbox', { name: 'Human Readable' }).first()).toBeChecked();
  await expect(page.getByRole('checkbox', { name: 'Machine Readable' }).first()).toBeChecked();
  await expect(page.getByRole('checkbox', { name: 'XML' }).first()).toBeChecked();
  await expect(page.getByRole('checkbox', { name: 'Generate' })).toBeChecked();
  await expect(page.getByRole('checkbox', { name: '277ca' }).nth(1)).toBeChecked();
  await expect(page.getByRole('checkbox', { name: '277u' }).nth(1)).toBeChecked();
  await expect(page.getByRole('checkbox', { name: 'CSV', exact: true })).toBeChecked();
  await expect(page.getByRole('checkbox', { name: 'ERA Summary' })).not.toBeChecked();
  await expect(page.getByRole('checkbox', { name: 'Human Readable' }).nth(1)).toBeChecked();
  await expect(page.getByRole('checkbox', { name: 'Machine Readable' }).nth(1)).toBeChecked();
  await expect(page.getByRole('checkbox', { name: 'XML' }).nth(1)).toBeChecked();
  await expect(page.getByRole('checkbox', { name: 'Daily Pulse CSV' })).toBeChecked();
  await expect(page.getByRole('checkbox', { name: 'Human Readable 271' })).toBeChecked();
  await expect(page.getByRole('checkbox', { name: 'Reject Print Claims' })).toBeChecked();
  await expect(page.getByRole('checkbox', { name: 'Alphall' })).toBeChecked();
  await expect(page.getByRole('checkbox', { name: 'New Statements' })).toBeChecked();
  await expect(page.getByRole('checkbox', { name: 'Combine ERA' })).toBeChecked();

  await page.getByText('Combine ALL').click();
  await page.getByText('Combine ALL').click();
  await expect(page.getByText('Combine ALL')).toBeVisible();

  await page
    .locator('app-create-provider-group-modal div')
    .filter({ hasText: 'Edit Provider Group: G31927' })
    .click();
  await page.getByRole('textbox', { name: 'Enter Email' }).click();
  await expect(page.getByRole('textbox', { name: 'Enter Email' })).toHaveValue(
    'kmohamed@harriscomputer.com'
  );

  await page.getByRole('checkbox', { name: 'RCM' }).uncheck();
  await expect(page.getByRole('checkbox', { name: 'RCM' })).not.toBeChecked();
  await page.getByRole('checkbox', { name: 'RCM' }).check();
  await expect(page.getByRole('checkbox', { name: 'RCM' })).toBeChecked();
});