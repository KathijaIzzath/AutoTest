import { test, expect } from '../myTestData';
import { Page } from '@playwright/test';
import * as d from '../../testData/GroupDshbdTestData.json';
import { navigateToProviderGroups } from '../framework/navigation.helper';

// G00016 - Provider Group Dashboard test cases - Filter and Sorting test cases

async function openProviderGroupsDashboard(page: Page) {
  await navigateToProviderGroups(page);
  await expect(page.getByText(d.labels.groupId)).toBeVisible();
}

async function applyFilters(page: Page) {
  await page.getByRole('button', { name: d.labels.applyFilter }).click();
}

async function fillTextboxByName(page: Page, placeholderName: string, value: string) {
  const input = page.getByRole('textbox', { name: placeholderName });
  await input.click();
  await input.fill(value);
}

test('ProviderGroupDashboard control/elements verification test execution', async ({ page, loginAsAdmin }) => {
  await loginAsAdmin();

  await openProviderGroupsDashboard(page);
  await fillTextboxByName(page, d.placeholders.groupId, d.values.groupId);
  await applyFilters(page);
  await expect(page.getByRole('columnheader', { name: d.headers.nameAsc })).toBeVisible();
  await expect(page.getByRole('cell', { name: d.values.groupName })).toBeVisible();
  await expect(page.getByRole('columnheader', { name: d.headers.groupId })).toBeVisible();
  await expect(page.getByRole('cell', { name: d.values.groupId })).toBeVisible();

  await expect(page.getByText(d.labels.groupName)).toBeVisible();
  await fillTextboxByName(page, d.placeholders.groupName, d.values.groupName);
  await applyFilters(page);
  await expect(page.getByRole('columnheader', { name: d.headers.nameAsc })).toBeVisible();
  await expect(page.getByRole('cell', { name: d.values.groupName })).toBeVisible();
  await expect(page.getByRole('columnheader', { name: d.headers.groupId })).toBeVisible();
  await expect(page.getByRole('cell', { name: d.values.groupId })).toBeVisible();

  await page.getByRole('textbox', { name: d.placeholders.groupName }).click();
  await page.getByRole('textbox', { name: d.placeholders.groupName }).dblclick();
  await page.getByRole('textbox', { name: d.placeholders.groupName }).press('ControlOrMeta+a');
  await page.getByRole('textbox', { name: d.placeholders.groupName }).click();
  await page.getByRole('textbox', { name: d.placeholders.groupName }).click();
  await fillTextboxByName(page, d.placeholders.groupName, '');

  await page.getByRole('textbox', { name: d.placeholders.accountNumber }).click();
  await expect(page.locator('form').getByText(d.labels.accountNumber)).toBeVisible();
  await page.getByRole('textbox', { name: d.placeholders.accountNumber }).click();
  await fillTextboxByName(page, d.placeholders.accountNumber, d.values.accountNumber);
  await applyFilters(page);
  await expect(page.getByRole('cell', { name: d.values.groupName })).toBeVisible();
  await expect(page.getByRole('columnheader', { name: d.headers.groupId })).toBeVisible();
  await expect(page.getByRole('cell', { name: d.values.groupId })).toBeVisible();
  await expect(page.getByRole('columnheader', { name: d.headers.nameAsc })).toBeVisible();

  await page.getByRole('textbox', { name: d.placeholders.accountNumber }).click();
  await page.getByRole('textbox', { name: d.placeholders.accountNumber }).click();
  await fillTextboxByName(page, d.placeholders.accountNumber, '');
  await expect(page.getByText(d.labels.accountName)).toBeVisible();
  await page.getByRole('textbox', { name: d.placeholders.accountName }).click();
  await fillTextboxByName(page, d.placeholders.accountName, d.values.accountName);
  await applyFilters(page);
  await expect(page.getByRole('columnheader', { name: d.headers.nameAsc })).toBeVisible();
  await expect(page.getByRole('cell', { name: d.values.groupName })).toBeVisible();
  await expect(page.getByRole('columnheader', { name: d.headers.groupId })).toBeVisible();
  await page.getByRole('cell', { name: d.values.groupId }).click();

  await page.getByRole('textbox', { name: d.placeholders.accountName }).click();
  await page.getByRole('textbox', { name: d.placeholders.accountName }).press('ControlOrMeta+a');
  await fillTextboxByName(page, d.placeholders.accountName, '');
  await expect(page.getByText(d.labels.contactName)).toBeVisible();
  await page.getByRole('textbox', { name: d.placeholders.contactName }).click();
  await fillTextboxByName(page, d.placeholders.contactName, d.values.contactName);
  await applyFilters(page);
  await expect(page.getByRole('columnheader', { name: d.headers.nameAsc })).toBeVisible();
  await expect(page.getByRole('cell', { name: d.values.groupName })).toBeVisible();
  await expect(page.getByRole('columnheader', { name: d.headers.groupId })).toBeVisible();
  await expect(page.getByRole('cell', { name: d.values.groupId })).toBeVisible();

  await page.getByRole('textbox', { name: d.placeholders.contactName }).click();
  await fillTextboxByName(page, d.placeholders.contactName, '');
  await expect(page.getByText(d.labels.state, { exact: true })).toBeVisible();
  await page.locator(d.selectors.stateContainer).getByRole('combobox').selectOption(d.values.state);
  await applyFilters(page);
  await expect(page.getByRole('columnheader', { name: d.headers.nameAsc })).toBeVisible();
  await expect(page.getByRole('cell', { name: d.values.groupName })).toBeVisible();
  await expect(page.getByRole('columnheader', { name: d.headers.groupId })).toBeVisible();
  await expect(page.getByRole('cell', { name: d.values.groupId })).toBeVisible();
  await page.locator(d.selectors.stateContainer).getByRole('combobox').selectOption('');

  await expect(page.locator(d.selectors.vendorFilter).getByRole('combobox')).toContainText(d.labels.selectVendor);
  await expect(page.getByText(d.labels.vendor, { exact: true })).toBeVisible();
  await page.locator(d.selectors.vendorFilter).getByRole('combobox').selectOption(d.values.vendorOption);
  await applyFilters(page);
  await expect(page.getByRole('columnheader', { name: d.headers.nameAsc })).toBeVisible();
  await expect(page.getByRole('cell', { name: d.values.groupName })).toBeVisible();
  await expect(page.getByRole('columnheader', { name: d.headers.groupId })).toBeVisible();
  await expect(page.getByRole('cell', { name: d.values.groupId })).toBeVisible();

  await page.getByRole('textbox', { name: d.placeholders.contactName }).click();
  await fillTextboxByName(page, d.placeholders.contactName, '');
  await expect(page.getByText(d.labels.city)).toBeVisible();
  await page.getByRole('textbox', { name: d.placeholders.city }).click();
  await fillTextboxByName(page, d.placeholders.city, d.values.city);
  await applyFilters(page);
  await expect(page.getByRole('columnheader', { name: d.headers.nameAsc })).toBeVisible();
  await expect(page.getByRole('cell', { name: d.values.groupName })).toBeVisible();
  await expect(page.getByRole('columnheader', { name: d.headers.groupId })).toBeVisible();
  await expect(page.getByRole('cell', { name: d.values.groupId })).toBeVisible();
  await page.getByRole('textbox', { name: d.placeholders.city }).click();
  await fillTextboxByName(page, d.placeholders.city, '');
});

test('ProviderGroups Sorting search results control/elements verification test execution', async ({ page, loginAsAdmin }) => {
  await loginAsAdmin();

  await openProviderGroupsDashboard(page);

  await page.locator(d.selectors.vendorFilter).getByRole('combobox').selectOption('');
  await fillTextboxByName(page, d.placeholders.groupId, '');
  await applyFilters(page);
  await page.waitForTimeout(d.timeouts.gridRefreshMs);

  await expect(page.getByRole('columnheader', { name: d.headers.nameAsc })).toBeVisible();
  await expect(page.getByRole('columnheader', { name: d.headers.groupId })).toBeVisible();
  await page.getByRole('columnheader', { name: d.headers.nameAsc }).click();
  await expect(page.getByRole('cell', { name: d.values.sortedName })).toBeVisible();
  await page.getByRole('columnheader', { name: d.headers.groupId }).click();
  await expect(page.getByRole('columnheader', { name: d.headers.groupIdAsc })).toBeVisible();
  await expect(page.getByRole('cell', { name: d.values.sortedGroupId })).toBeVisible();
  await expect(page.getByRole('link').filter({ hasText: /^$/ }).first()).toBeVisible();

  // Click filter toggle and verify loaded results are retained.
  await page.getByRole('link').filter({ hasText: /^$/ }).first().click();
  await expect(page.locator('div').filter({ hasText: d.labels.providerGroups }).nth(2)).toBeVisible();
  await expect(page.getByRole('columnheader', { name: d.headers.name })).toBeVisible();
  await expect(page.getByRole('columnheader', { name: d.headers.groupIdAsc })).toBeVisible();
  await expect(page.getByRole('cell', { name: d.values.sortedGroupId })).toBeVisible();
});

test('Provider groups dashboard filter controls visibility and availability', async ({ page, loginAsAdmin }) => {
  await loginAsAdmin();
  await openProviderGroupsDashboard(page);

  await expect(page.getByText(d.labels.groupId)).toBeVisible();
  await expect(page.getByRole('textbox', { name: d.placeholders.groupId })).toBeVisible();
  await expect(page.getByText(d.labels.groupName)).toBeVisible();
  await expect(page.getByRole('textbox', { name: d.placeholders.groupName })).toBeVisible();
  await expect(page.getByText(d.labels.accountNumber)).toBeVisible();
  await expect(page.getByRole('textbox', { name: d.placeholders.accountNumber })).toBeVisible();
  await expect(page.getByText(d.labels.accountName)).toBeVisible();
  await expect(page.getByRole('textbox', { name: d.placeholders.accountName })).toBeVisible();
  await expect(page.getByText(d.labels.contactName)).toBeVisible();
  await expect(page.getByRole('textbox', { name: d.placeholders.contactName })).toBeVisible();
  await expect(page.getByText(d.labels.city)).toBeVisible();
  await expect(page.getByRole('textbox', { name: d.placeholders.city })).toBeVisible();
  await expect(page.locator(d.selectors.stateContainer).getByRole('combobox')).toBeVisible();
  await expect(page.locator(d.selectors.vendorFilter).getByRole('combobox')).toBeVisible();
  await expect(page.getByRole('button', { name: d.labels.applyFilter })).toBeVisible();
});

test('Provider groups invalid filters should not show known seeded group row', async ({ page, loginAsAdmin }) => {
  await loginAsAdmin();
  await openProviderGroupsDashboard(page);

  await fillTextboxByName(page, d.placeholders.groupId, d.edgeCases.invalidGroupId);
  await fillTextboxByName(page, d.placeholders.groupName, d.edgeCases.invalidGroupName);
  await applyFilters(page);

  await expect(page.getByRole('cell', { name: d.values.groupId })).toHaveCount(0);
  await expect(page.getByRole('cell', { name: d.values.groupName })).toHaveCount(0);
});

test('Provider groups empty filters should load default grid successfully', async ({ page, loginAsAdmin }) => {
  await loginAsAdmin();
  await openProviderGroupsDashboard(page);

  await fillTextboxByName(page, d.placeholders.groupId, '');
  await fillTextboxByName(page, d.placeholders.groupName, '');
  await fillTextboxByName(page, d.placeholders.accountNumber, '');
  await fillTextboxByName(page, d.placeholders.accountName, '');
  await fillTextboxByName(page, d.placeholders.contactName, '');
  await fillTextboxByName(page, d.placeholders.city, '');
  await page.locator(d.selectors.stateContainer).getByRole('combobox').selectOption('');
  await page.locator(d.selectors.vendorFilter).getByRole('combobox').selectOption('');
  await applyFilters(page);
  await page.waitForTimeout(d.timeouts.gridRefreshMs);

  await expect(page.getByRole('columnheader', { name: d.headers.nameAsc })).toBeVisible();
  await expect(page.getByRole('columnheader', { name: d.headers.groupId })).toBeVisible();
});

test('Provider groups invalid city should not show known seeded group row', async ({ page, loginAsAdmin }) => {
  await loginAsAdmin();
  await openProviderGroupsDashboard(page);

  await fillTextboxByName(page, d.placeholders.city, d.edgeCases.invalidCity);
  await applyFilters(page);

  await expect(page.getByRole('cell', { name: d.values.groupId })).toHaveCount(0);
  await expect(page.getByRole('cell', { name: d.values.groupName })).toHaveCount(0);
});
