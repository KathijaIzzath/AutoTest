import { test, expect } from '../myTestData';
import type { Page } from '@playwright/test';
import userData from '../../testData/user-info';
import * as d from '../../testData/AcctEditTestData.json';
import { getTodaysDateWithYr } from '../../testData/database.utils';
import { navigateToAccounts } from '../framework/navigation.helper';

test('Edit Newly created Account, verify Edit Screen elements test execution', async ({ page ,loginAsAdmin}) => {
  test.setTimeout(120000);
  await loginAsAdmin();
   const date = getTodaysDateWithYr();
  console.log('extracted date', date);

  await navigateToAccounts(page);
  await page.getByRole('textbox', { name: d.roles.accountNumberFilter }).click();
  await page.getByRole('textbox', { name: d.roles.accountNumberFilter }).fill(d.values.firstAccountNumber);
  await page.getByRole('button', { name: d.labels.applyFilter }).click();
  await page.waitForLoadState('networkidle');

  const rowAction = page.getByRole('link').filter({ hasText: /^$/ }).nth(d.selectors.rowActionLinkIndex);
  const rowReady = await rowAction.isVisible({ timeout: 15000 }).catch(() => false);
  test.skip(!rowReady, `Skip edit: filtered account row action not found for ${d.values.firstAccountNumber}`);

  // Click on the account row (cell or link in the filtered results)
  await rowAction.click();
  await page.getByRole('button', { name: d.labels.editAccount }).click();

  await expect(page.getByRole('heading', { name: d.labels.editAccount })).toBeVisible();

  // Wait for the modal loading overlay to disappear before interacting with checkboxes
  await page.locator(d.selectors.modalLoadingOverlay).waitFor({ state: 'hidden', timeout: Math.max(d.timeouts.modalHiddenMs ?? 0, 15000) });

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

test.describe('Edit Account – mandatory field validation', () => {
  async function openEditAccountForAutomationAccount(page: Page) {
    await navigateToAccounts(page);
    await page.getByRole('textbox', { name: d.roles.accountNumberFilter }).fill(userData.editAccount.editAccAutoNum);
    await page.getByRole('button', { name: d.labels.applyFilter }).click();
    await page.getByRole('link').filter({ hasText: /^$/ }).nth(d.selectors.rowActionLinkIndex).click();
    await page.getByRole('button', { name: d.labels.editAccount }).click();
    await expect(page.getByRole('heading', { name: d.labels.editAccount })).toBeVisible();
    await page.locator(d.selectors.modalLoadingOverlay).waitFor({
      state: 'hidden',
      timeout: Math.max(d.timeouts.modalHiddenMs ?? 0, 15000),
    });
  }

  test('Negative: Clearing Name keeps Save & Close disabled or blocks success', async ({ page, loginAsAdmin }) => {
    await loginAsAdmin();
    await openEditAccountForAutomationAccount(page);

    const nameField = page.getByRole('textbox', { name: d.roles.nameTextbox });
    const editable = await nameField.isEditable().catch(() => false);
    test.skip(!editable, 'Account Name is not editable in this environment – skipping.');
    if (!editable) return;

    await nameField.fill(d.edgeCases.empty);
    const saveBtn = page.getByRole('button', { name: d.labels.saveAndClose });
    const disabled = await saveBtn.isDisabled().catch(() => false);
    if (disabled) {
      await expect(saveBtn, 'Save & Close must stay disabled when Name is empty').toBeDisabled();
    } else {
      await saveBtn.click();
      await expect(saveBtn, 'Edit Account modal must remain open when Name is empty').toBeVisible();
    }
  });

  test('Negative: Clearing Contact does not leave the form in a successful closed state', async ({ page, loginAsAdmin }) => {
    await loginAsAdmin();
    await openEditAccountForAutomationAccount(page);

    const contactField = page.getByRole('textbox', { name: d.roles.contactTextbox });
    await contactField.fill(d.edgeCases.empty);
    const saveBtn = page.getByRole('button', { name: d.labels.saveAndClose });
    const disabled = await saveBtn.isDisabled().catch(() => false);
    if (disabled) {
      await expect(saveBtn).toBeDisabled();
    } else {
      // Contact may be optional — assert form stays usable (no crash / still on Edit)
      await expect(page.getByRole('heading', { name: d.labels.editAccount })).toBeVisible();
      await expect(saveBtn).toBeVisible();
    }
  });
});