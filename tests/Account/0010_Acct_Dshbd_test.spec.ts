import { test, expect } from '../myTestData';
import { Page } from '@playwright/test';
import * as d from '../../testData/AcctDshbdTestData.json';
import { navigateToAccounts } from '../framework/navigation.helper';

// Jira created filter by TAXID not working. To be automated once the issue is resolved.

async function openAccountsDashboard(page: Page) {
  await navigateToAccounts(page);
  await page.locator(d.selectors.accountsContainer).getByText(d.labels.accountsNav, { exact: true }).click();
  await page.locator(d.selectors.accountsDashboardLink).click();
}

async function applyFilters(page: Page) {
  await page.getByRole('button', { name: d.labels.applyFilter }).click();
}

async function fillTextboxByName(page: Page, placeholderName: string, value: string) {
  const input = page.getByRole('textbox', { name: placeholderName });
  await input.click();
  await input.fill(value);
}

test('AccountDashboard control/elements verification test execution', async ({ page, loginAsAdmin }) => {
  await loginAsAdmin();

  await openAccountsDashboard(page);

  await applyFilters(page);
  await expect(page.getByRole('columnheader', { name: d.headers.accountNumberAsc })).toBeVisible();
  await expect(page.getByRole('columnheader', { name: d.headers.name, exact: true })).toBeVisible();
  await expect(page.getByRole('columnheader', { name: d.headers.state })).toBeVisible();
  await expect(page.getByRole('columnheader', { name: d.headers.city })).toBeVisible();
  await expect(page.getByRole('columnheader', { name: d.headers.address })).toBeVisible();
  await expect(page.getByRole('columnheader', { name: d.headers.contactName })).toBeVisible();
  await expect(page.getByRole('link').filter({ hasText: /^$/ }).nth(1)).toBeVisible();
  await expect(page.getByRole('cell', { name: d.values.accountNumber })).toBeVisible();
  await expect(page.getByRole('cell', { name: d.values.accountNameExact })).toBeVisible();
  await expect(page.getByRole('cell', { name: d.values.state }).first()).toBeVisible();
  await expect(page.getByRole('cell', { name: d.values.cityExpected })).toBeVisible();
  await expect(page.getByRole('cell', { name: 'MR. JEWEL KEELING I' })).toBeVisible();
  await expect(page.getByRole('cell').filter({ hasText: 'Edit AccountDeactivate' }).first()).toBeVisible();

  await expect(page.getByText(d.labels.accountNumber, { exact: true })).toBeVisible();
  await fillTextboxByName(page, d.placeholders.accountNumber, d.values.accountNumber);
  await applyFilters(page);
  await expect(page.getByRole('cell', { name: d.values.accountNumber })).toBeVisible();
  await expect(page.getByRole('columnheader', { name: d.headers.name, exact: true })).toBeVisible();
  await expect(page.getByRole('cell', { name: d.values.accountNameExact })).toBeVisible();

  await fillTextboxByName(page, d.placeholders.accountNumber, '');
  await expect(page.getByText(d.labels.accountName)).toBeVisible();
  await fillTextboxByName(page, d.placeholders.accountName, d.values.accountNameContains);
  await applyFilters(page);
  await expect(page.getByRole('columnheader', { name: d.headers.name, exact: true })).toBeVisible();
  await expect(page.getByRole('cell', { name: d.values.accountNameExact })).toBeVisible();

  await fillTextboxByName(page, d.placeholders.accountName, '');
  await expect(page.locator('form').getByText(d.labels.city)).toBeVisible();
  await expect(page.getByRole('textbox', { name: d.placeholders.city })).toBeVisible();
  await fillTextboxByName(page, d.placeholders.city, d.values.city);
  await applyFilters(page);
  await expect(page.getByRole('columnheader', { name: d.headers.city })).toBeVisible();
  await expect(page.getByRole('cell', { name: d.values.cityExpected })).toBeVisible();

  await fillTextboxByName(page, d.placeholders.city, '');
  await expect(page.locator('span').filter({ hasText: d.labels.state })).toBeVisible();
  await page.locator(d.selectors.stateContainer).getByRole('combobox').selectOption(d.values.state);
  await applyFilters(page);
  await expect(page.getByRole('columnheader', { name: d.headers.state })).toBeVisible();
  await expect(page.getByRole('cell', { name: d.values.state }).first()).toBeVisible();
  await page.locator(d.selectors.stateContainer).getByRole('combobox').selectOption('');

  await expect(page.getByText(d.labels.vendor, { exact: true })).toBeVisible();
  await expect(page.locator(d.selectors.vendorFilter)).toContainText('Select Vendor');
  await page.locator(d.selectors.vendorFilter).getByRole('combobox').selectOption(d.values.vendorOption);
  await applyFilters(page);
  await expect(page.getByRole('cell', { name: d.values.vendorExpectedAccount })).toBeVisible();
  await expect(page.getByRole('cell', { name: d.values.vendorExpectedName })).toBeVisible();
  await page.locator(d.selectors.vendorFilter).getByRole('combobox').selectOption('');

  await expect(page.getByText(d.labels.npi)).toBeVisible();
  await fillTextboxByName(page, d.placeholders.npi, d.values.npi);
  await applyFilters(page);
  await expect(page.getByRole('columnheader', { name: d.headers.accountNumberAsc })).toBeVisible();
  await expect(page.getByRole('cell', { name: d.values.npiExpectedAccount })).toBeVisible();
  await expect(page.getByRole('columnheader', { name: d.headers.name, exact: true })).toBeVisible();
  await expect(page.getByRole('cell', { name: d.values.npiExpectedName })).toBeVisible();
  await fillTextboxByName(page, d.placeholders.npi, '');
});

test('Account Sorting search results control/elements verification test execution', async ({ page, loginAsAdmin }) => {
  await loginAsAdmin();

  await openAccountsDashboard(page);

  await applyFilters(page);
  await expect(page.getByText(d.labels.accountNumber)).toBeVisible();

  await fillTextboxByName(page, d.placeholders.providerGroupId, d.values.providerGroupId);
  await applyFilters(page);
  await page.getByRole('link').filter({ hasText: /^$/ }).nth(1).click();
  await expect(page.getByRole('cell', { name: d.values.providerGroupId, exact: true })).toBeVisible();
  await expect(page.getByRole('columnheader', { name: d.headers.groupId })).toBeVisible();

  await fillTextboxByName(page, d.placeholders.providerGroupId, '');
  await expect(page.getByText(d.labels.providerId, { exact: true })).toBeVisible();
  await fillTextboxByName(page, d.placeholders.providerId, d.values.providerId);
  await applyFilters(page);
  await page.getByRole('cell').filter({ hasText: /^$/ }).click();
  await page.getByRole('link').filter({ hasText: /^$/ }).nth(3).click();
  await expect(page.getByRole('columnheader', { name: d.headers.providerId })).toBeVisible();
  await expect(page.getByRole('cell', { name: d.values.providerId, exact: true })).toBeVisible();

  await fillTextboxByName(page, d.placeholders.providerId, '');
  await expect(page.getByText(d.labels.showInactiveOnly)).toBeVisible();
  await page.getByRole('checkbox', { name: d.labels.showInactiveOnly }).check();
  await applyFilters(page);
  await expect(page.getByRole('cell', { name: d.values.inactiveOnlyExpectedAccount, exact: true })).toBeVisible();
  await page.getByRole('link').filter({ hasText: /^$/ }).nth(4).click();
  await expect(page.getByRole('link').filter({ hasText: /^$/ }).nth(4)).toBeVisible();
  await page.getByRole('link').filter({ hasText: /^$/ }).nth(4).click();
  await page.getByRole('link').filter({ hasText: /^$/ }).nth(4).click();

  await page.getByRole('checkbox', { name: d.labels.showInactiveOnly }).uncheck();
  await applyFilters(page);
  await page.getByRole('columnheader', { name: d.headers.accountNumberAsc }).click();
  await page.getByRole('columnheader', { name: d.headers.accountNumberDesc }).click();
  await expect(page.getByRole('columnheader', { name: d.headers.accountNumberAsc })).toBeVisible();
  await expect(page.getByRole('cell', { name: d.values.accountNumber })).toBeVisible();

  await page.getByRole('columnheader', { name: d.headers.name, exact: true }).click();
  await expect(page.getByRole('columnheader', { name: d.headers.nameAsc })).toBeVisible();
  await expect(page.getByRole('cell', { name: d.values.sortExpectedFirstName })).toBeVisible();

  await page.getByRole('columnheader', { name: d.headers.state }).click();
  await expect(page.getByRole('columnheader', { name: d.headers.stateAsc })).toBeVisible();
  await expect(page.getByRole('cell', { name: d.values.sortExpectedState, exact: true })).toBeVisible();

  await expect(page.getByRole('columnheader', { name: d.headers.city })).toBeVisible();
  await page.getByRole('columnheader', { name: d.headers.city }).click();
  await expect(page.getByRole('cell', { name: d.values.sortExpectedCity }).first()).toBeVisible();

  await page.getByRole('columnheader', { name: d.headers.address }).click();
  await expect(page.getByRole('columnheader', { name: d.headers.addressAsc })).toBeVisible();
  await page.getByRole('columnheader', { name: d.headers.addressAsc }).click();
  await page.getByRole('columnheader', { name: d.headers.addressDesc }).click();
  await expect(page.getByRole('cell', { name: d.values.sortExpectedAddress })).toBeVisible();

  await page.getByRole('columnheader', { name: d.headers.contactName }).click();
  await page.getByRole('columnheader', { name: d.headers.contactNameAsc }).click();
  await expect(page.getByRole('columnheader', { name: d.headers.contactNameDesc })).toBeVisible();
  await expect(page.getByRole('cell', { name: d.values.sortExpectedContact }).first()).toBeVisible();

  await page.getByRole('columnheader', { name: 'account number' }).click();
  await page.getByRole('link').filter({ hasText: /^$/ }).nth(2).click();
  await expect(page.getByRole('link').filter({ hasText: /^$/ }).nth(2)).toBeVisible();
});

test('Account dashboard filter controls visibility and availability', async ({ page, loginAsAdmin }) => {
  await loginAsAdmin();
  await openAccountsDashboard(page);

  await expect(page.getByText(d.labels.accountNumber, { exact: true })).toBeVisible();
  await expect(page.getByRole('textbox', { name: d.placeholders.accountNumber })).toBeVisible();
  await expect(page.getByText(d.labels.accountName, { exact: true })).toBeVisible();
  await expect(page.getByRole('textbox', { name: d.placeholders.accountName })).toBeVisible();
  await expect(page.getByText(d.labels.city, { exact: true })).toBeVisible();
  await expect(page.getByRole('textbox', { name: d.placeholders.city })).toBeVisible();
  await expect(page.getByText(d.labels.npi, { exact: true })).toBeVisible();
  await expect(page.getByRole('textbox', { name: d.placeholders.npi })).toBeVisible();
  await expect(page.locator(d.selectors.stateContainer).getByRole('combobox')).toBeVisible();
  await expect(page.locator(d.selectors.vendorFilter).getByRole('combobox')).toBeVisible();
  await expect(page.getByRole('checkbox', { name: d.labels.showInactiveOnly })).toBeVisible();
  await expect(page.getByRole('button', { name: d.labels.applyFilter })).toBeVisible();
});

test('Account dashboard invalid filters should not show known seeded account rows', async ({ page, loginAsAdmin }) => {
  await loginAsAdmin();
  await openAccountsDashboard(page);

  await fillTextboxByName(page, d.placeholders.accountNumber, d.edgeCases.invalidAccountNumber);
  await fillTextboxByName(page, d.placeholders.accountName, d.edgeCases.invalidAccountName);
  await fillTextboxByName(page, d.placeholders.city, d.edgeCases.invalidCity);
  await applyFilters(page);

  await expect(page.getByRole('cell', { name: d.values.accountNumber })).toHaveCount(0);
  await expect(page.getByRole('cell', { name: d.values.accountNameExact })).toHaveCount(0);
});
