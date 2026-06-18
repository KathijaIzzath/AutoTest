import { test, expect } from '../myTestData';
import * as userData from '../../testData/UserInfo.json';
import * as d from '../../testData/AcctEditTestData.json';
import { getTodaysDateWithYr } from '../../testData/database.utils';
import { navigateToAccounts } from '../framework/navigation.helper';

test('Edit Newly created Account, verify Edit Screen elements test execution', async ({ page ,loginAsAdmin}) => {
  await loginAsAdmin();
   const date = getTodaysDateWithYr();
  console.log('extracted date', date);

  await navigateToAccounts(page);
  await page.getByRole('textbox', { name: d.roles.accountNumberFilter }).click();
  await page.getByRole('textbox', { name: d.roles.accountNumberFilter }).fill(d.values.firstAccountNumber);
  await page.getByRole('button', { name: d.labels.applyFilter }).click();
  await page.waitForLoadState('networkidle');

  // Click on the account row (cell or link in the filtered results)
  await page.getByRole('link').filter({ hasText: /^$/ }).nth(d.selectors.rowActionLinkIndex).click();
  await page.getByRole('button', { name: d.labels.editAccount }).click();

  await expect(page.getByRole('heading', { name: d.labels.editAccount })).toBeVisible();

  // Wait for the modal loading overlay to disappear before interacting with checkboxes
  await page.locator(d.selectors.modalLoadingOverlay).waitFor({ state: 'hidden', timeout: d.timeouts.modalHiddenMs });

  if (await page.getByRole('checkbox', { name: d.labels.claimStatus }).isChecked()) {
    await page.getByRole('checkbox', { name: d.labels.claimStatus }).uncheck();
  }
  await page.getByRole('checkbox', { name: d.labels.claimStatus }).check();

  if (await page.getByRole('checkbox', { name: d.labels.eligibility }).isChecked()) {
    await page.getByRole('checkbox', { name: d.labels.eligibility }).uncheck();
  }
  await page.getByRole('checkbox', { name: d.labels.eligibility }).check();

  if (await page.getByRole('checkbox', { name: d.labels.statements }).isChecked()) {
    await page.getByRole('checkbox', { name: d.labels.statements }).uncheck();
  }
  await page.getByRole('checkbox', { name: d.labels.statements }).check();

  await page.getByText(date).first().click();
  await page.getByText(date).nth(1).click();
  await page.getByText(date).nth(2).click();

  await page.locator(d.selectors.zipInput).first().click();
  await page.getByText(d.values.zipCityOption).click();

  await page.getByRole('textbox', { name: d.roles.emailTextbox }).click();
  await page.getByRole('textbox', { name: d.roles.emailTextbox }).fill(d.values.email);

  await page.getByRole('textbox', { name: d.roles.phoneTextbox }).click();
  await page.getByRole('textbox', { name: d.roles.phoneTextbox }).fill(d.values.phone);

  await page.getByRole('textbox', { name: d.roles.contactTextbox }).click();
  await page.getByRole('textbox', { name: d.roles.contactTextbox }).fill(d.values.contact);

  await page.getByRole('textbox', { name: d.roles.last4DigitsTextbox }).click();
  await page.getByRole('textbox', { name: d.roles.last4DigitsTextbox }).fill(d.values.last4Digits);

  await page.getByRole('textbox', { name: d.roles.expirationTextbox }).click();
  await page.getByRole('textbox', { name: d.roles.expirationTextbox }).fill(d.values.expiry);

  await page.getByRole('button', { name: d.labels.saveAndClose }).click();

  await page.getByRole('columnheader', { name: d.columnHeaders.state }).click();
  await page.getByRole('cell', { name: d.values.stateCell }).click();
  await page.getByRole('columnheader', { name: d.columnHeaders.city }).click();
  await page.getByRole('cell', { name: d.values.cityCell }).click();
  await page.getByRole('columnheader', { name: d.columnHeaders.contactName }).click();
});

test('Edit existing Account and test Edit Screen elements', async ({ page ,loginAsAdmin}) => {
  await loginAsAdmin();

  await navigateToAccounts(page);
  await page.getByRole('textbox', { name: d.roles.accountNumberFilter }).click();
  await page.getByRole('textbox', { name: d.roles.accountNumberFilter }).fill(userData.editAccount.editAccAutoNum);
  await page.getByRole('button', { name: d.labels.applyFilter }).click();
  await page.waitForLoadState('networkidle');

  const date = getTodaysDateWithYr();

  await page.getByRole('link').filter({ hasText: /^$/ }).nth(d.selectors.rowActionLinkIndex).click();
  await page.getByRole('button', { name: d.labels.editAccount }).click();

  await expect(page.getByRole('heading', { name: d.labels.editAccount })).toBeVisible();

  // Wait for the modal loading overlay to disappear before interacting with elements
  await page.locator(d.selectors.modalLoadingOverlay).waitFor({ state: 'hidden', timeout: d.timeouts.modalHiddenMs });

  await page.getByText(d.labels.phone).click();
  await expect(page.getByRole('textbox', { name: d.roles.emailTextbox })).toBeVisible();
  await expect(page.getByRole('textbox', { name: d.roles.phoneTextbox })).toBeVisible();
  await expect(page.getByRole('checkbox', { name: d.labels.claimStatus })).toBeVisible();
  await expect(page.getByText(d.values.datePatternSuffix).first()).toBeVisible();

  await page.getByRole('checkbox', { name: d.labels.eligibility }).uncheck();
  await expect(page.getByRole('checkbox', { name: d.labels.statements })).toBeVisible();
  await page.getByRole('checkbox', { name: d.labels.eligibility }).check();
  await expect(page.getByRole('checkbox', { name: d.labels.eligibility })).toBeVisible();

  await expect(page.getByText(d.labels.zip, { exact: true })).toBeVisible();
  await expect(page.locator(d.selectors.zipInput).first()).toBeVisible();
  await expect(page.getByText(d.labels.contact, { exact: true })).toBeVisible();
  await page.getByRole('textbox', { name: d.roles.contactTextbox }).fill(d.values.contact);
  await expect(page.getByRole('textbox', { name: d.roles.contactTextbox })).toBeVisible();

  await expect(page.getByRole('textbox', { name: d.roles.nameTextbox })).toBeVisible();
  await expect(page.getByText(d.labels.practiceManagementSelect)).toBeVisible();
  await expect(page.locator(d.selectors.ecsCheckbox).filter({ hasText: d.labels.ecs })).toBeVisible();
  await expect(page.getByRole('checkbox', { name: d.labels.era })).toBeVisible();

  await expect(page.getByText(d.labels.dateTerminated)).toBeVisible();
  await page.getByText(d.labels.na).click();
  await expect(page.getByText(d.labels.na)).toBeVisible();

  await expect(page.getByText(d.labels.dateSetup)).toBeVisible();
  await expect(page.getByText(d.values.datePatternSuffix).nth(2)).toBeVisible();
  await expect(page.getByText(d.labels.lastUpdatedBy)).toBeVisible();
  await expect(page.getByText(d.values.updatedBy, { exact: true })).toBeVisible();

  await page.getByText(d.labels.lastUpdate, { exact: true }).click();
  await page.getByText(d.values.datePatternSuffix).nth(3).click();
  await expect(page.getByRole('button', { name: d.labels.saveAndClose })).toBeVisible();
  await page.getByRole('button', { name: d.labels.saveAndClose }).click();
});

test('Account Edit modal should show key controls availability before save', async ({ page, loginAsAdmin }) => {
  await loginAsAdmin();
  await navigateToAccounts(page);

  await page.getByRole('textbox', { name: d.roles.accountNumberFilter }).fill(userData.editAccount.editAccAutoNum);
  await page.getByRole('button', { name: d.labels.applyFilter }).click();
  await page.getByRole('link').filter({ hasText: /^$/ }).nth(d.selectors.rowActionLinkIndex).click();
  await page.getByRole('button', { name: d.labels.editAccount }).click();

  await expect(page.getByRole('heading', { name: d.labels.editAccount })).toBeVisible();
  await page.locator(d.selectors.modalLoadingOverlay).waitFor({ state: 'hidden', timeout: d.timeouts.modalHiddenMs });

  await expect(page.getByRole('textbox', { name: d.roles.emailTextbox })).toBeVisible();
  await expect(page.getByRole('textbox', { name: d.roles.emailTextbox })).toBeEditable();
  await expect(page.getByRole('textbox', { name: d.roles.phoneTextbox })).toBeVisible();
  await expect(page.getByRole('textbox', { name: d.roles.phoneTextbox })).toBeEditable();
  await expect(page.getByRole('checkbox', { name: d.labels.claimStatus })).toBeVisible();
  await expect(page.getByRole('checkbox', { name: d.labels.eligibility })).toBeVisible();
  await expect(page.getByRole('checkbox', { name: d.labels.statements })).toBeVisible();
  await expect(page.getByRole('button', { name: d.labels.saveAndClose })).toBeVisible();
  await expect(page.getByRole('button', { name: d.labels.saveAndClose })).toBeEnabled();
});

test('Accounts filter should handle invalid account number with no-results state', async ({ page, loginAsAdmin }) => {
  await loginAsAdmin();
  await navigateToAccounts(page);

  await expect(page.getByRole('textbox', { name: d.roles.accountNumberFilter })).toBeVisible();
  await page.getByRole('textbox', { name: d.roles.accountNumberFilter }).fill(d.edgeCases.invalidAccountNumber);
  await page.getByRole('button', { name: d.labels.applyFilter }).click();

  await expect(page.getByRole('cell', { name: d.edgeCases.invalidAccountNumber })).toHaveCount(0);
  await expect(page.getByText(d.labels.noResults).first()).toBeVisible();
});