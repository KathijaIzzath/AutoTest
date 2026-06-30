import { test, expect } from '../myTestData';
import { Page } from '@playwright/test';
import * as d from '../../testData/ProviderDshbdTestData.json';
import { navigateToProviders } from '../framework/navigation.helper';

// Provider Dashboard test cases - Filter and Sorting test cases

async function openProvidersDashboard(page: Page) {
  await navigateToProviders(page);
  const providerIdInput = page.getByRole('textbox', { name: d.placeholders.providerId });

  if (!(await providerIdInput.isVisible())) {
    await page.getByRole('link', { name: d.labels.filterToggle }).click();
  }

  if (!(await providerIdInput.isVisible())) {
    await page.getByRole('link').filter({ hasText: /^$/ }).first().click();
  }

  await expect(providerIdInput).toBeVisible({ timeout: d.timeouts.providerLabelCheckMs });
}

async function applyFilters(page: Page) {
  await page.getByRole('button', { name: d.labels.applyFilter }).click();
}

async function fillTextboxByName(page: Page, placeholderName: string, value: string) {
  const input = page.getByRole('textbox', { name: placeholderName });
  await expect(input).toBeVisible();
  await input.fill(value);
}

function normalizeSortValue(value: string): string {
  return value.trim().toUpperCase();
}

function isSortedAscending(values: string[]): boolean {
  for (let i = 1; i < values.length; i += 1) {
    if (normalizeSortValue(values[i - 1]).localeCompare(normalizeSortValue(values[i])) > 0) {
      return false;
    }
  }
  return true;
}

function isSortedDescending(values: string[]): boolean {
  for (let i = 1; i < values.length; i += 1) {
    if (normalizeSortValue(values[i - 1]).localeCompare(normalizeSortValue(values[i])) < 0) {
      return false;
    }
  }
  return true;
}

async function getColumnValues(page: Page, headerPattern: RegExp): Promise<string[]> {
  const headers = await page.locator('thead th').allTextContents();
  const targetIdx = headers.findIndex((h) => headerPattern.test(h));
  const columnIndex = targetIdx >= 0 ? targetIdx + 1 : 1;

  return (await page.locator(`tbody tr td:nth-child(${columnIndex})`).allTextContents())
    .map((v) => v.trim())
    .filter((v) => v.length > 0 && v !== d.values.na);
}

test('ProviderGroupDashboard control/elements verification test execution', async ({ page, loginAsAdmin }) => {
  await loginAsAdmin();
  await openProvidersDashboard(page);

  await fillTextboxByName(page, d.placeholders.providerId, d.values.providerId);
  await applyFilters(page);
  await expect(page.getByRole('columnheader', { name: d.headers.name })).toBeVisible();
  await expect(page.getByRole('cell', { name: d.values.providerName })).toBeVisible();
  await expect(page.getByRole('columnheader', { name: d.headers.providerIdAsc })).toBeVisible();
  await expect(page.getByRole('cell', { name: d.values.providerId })).toBeVisible();

  await fillTextboxByName(page, d.placeholders.groupId, d.values.groupId);
  await applyFilters(page);
  await expect(page.getByRole('columnheader', { name: d.headers.groupId })).toBeVisible();
  await expect(page.getByRole('cell', { name: d.values.groupId })).toBeVisible();

  await fillTextboxByName(page, d.placeholders.groupId, '');
  await expect(page.getByText(d.labels.groupName)).toBeVisible();
  await fillTextboxByName(page, d.placeholders.groupName, d.values.groupNameFilter);
  await applyFilters(page);
  await expect(page.getByRole('columnheader', { name: d.headers.providerIdAsc })).toBeVisible();
  await expect(page.getByRole('cell', { name: d.values.providerId })).toBeVisible();

  await fillTextboxByName(page, d.placeholders.groupName, '');
  await expect(page.locator('form').getByText(d.labels.accountNumber)).toBeVisible();
  await fillTextboxByName(page, d.placeholders.accountNumber, d.values.accountNumber);
  await applyFilters(page);
  await expect(page.getByRole('columnheader', { name: d.headers.accountNumber })).toBeVisible();
  await expect(page.getByRole('cell', { name: d.values.accountNumber })).toBeVisible();

  await fillTextboxByName(page, d.placeholders.accountNumber, '');
  await expect(page.getByText(d.labels.accountName)).toBeVisible();
  await fillTextboxByName(page, d.placeholders.accountName, d.values.accountNameFilter);
  await applyFilters(page);
  await expect(page.getByRole('columnheader', { name: d.headers.providerIdAsc })).toBeVisible();
  await expect(page.getByRole('cell', { name: d.values.providerId })).toBeVisible();
  await page.getByRole('textbox', { name: d.placeholders.accountName }).dblclick();
  await fillTextboxByName(page, d.placeholders.accountName, '');

  await expect(page.getByText(d.labels.contactName)).toBeVisible();
  await fillTextboxByName(page, d.placeholders.contactName, d.values.contactNameFilter);
  await applyFilters(page);
  await expect(page.getByRole('columnheader', { name: d.headers.providerIdAsc })).toBeVisible();
  await expect(page.getByRole('cell', { name: d.values.providerId })).toBeVisible();

  await fillTextboxByName(page, d.placeholders.contactName, '');
  await expect(page.getByText(d.labels.city, { exact: true })).toBeVisible();
  await fillTextboxByName(page, d.placeholders.city, d.values.cityFilter);
  await applyFilters(page);
  await expect(page.getByRole('columnheader', { name: d.headers.providerId })).toBeVisible();
  await expect(page.getByRole('cell', { name: d.values.providerId })).toBeVisible();

  await fillTextboxByName(page, d.placeholders.city, '');
  await expect(page.getByText(d.labels.state, { exact: true })).toBeVisible();
  await applyFilters(page);
  await expect(page.getByRole('columnheader', { name: d.headers.providerId })).toBeVisible();
  await expect(page.getByRole('cell', { name: d.values.providerId })).toBeVisible();

  await expect(page.getByText(d.labels.practiceManagement, { exact: true })).toBeVisible();
  await page.locator(d.selectors.vendorFilter).getByRole('combobox').selectOption(d.values.vendorOption);
  await applyFilters(page);
  await expect(page.getByRole('columnheader', { name: d.headers.providerId })).toBeVisible();
  await expect(page.getByRole('cell', { name: d.values.providerId })).toBeVisible();
  await page.locator(d.selectors.vendorFilter).getByRole('combobox').selectOption('');
});

test('ProviderGroup search results sort verification test execution', async ({ page, loginAsAdmin }) => {
  await loginAsAdmin();
  await openProvidersDashboard(page);

  await applyFilters(page);
  await expect(page.getByRole('columnheader', { name: d.headers.name })).toBeVisible();
  await page.getByRole('columnheader', { name: d.headers.name }).click();
  await expect(page.getByRole('cell', { name: d.values.sortedName })).toBeVisible();

  await expect(page.getByRole('columnheader', { name: d.headers.email })).toBeVisible();
  await page.getByRole('columnheader', { name: d.headers.email }).click();
  await expect(page.getByRole('cell', { name: d.values.na }).first()).toBeVisible();
  await expect(page.locator(d.selectors.gridBody)).toContainText(d.values.na);

  await expect(page.getByRole('columnheader', { name: d.headers.status })).toBeVisible();
  await page.getByRole('columnheader', { name: d.headers.status }).click();
  await expect(page.getByRole('cell', { name: d.values.statusActive }).nth(1)).toBeVisible();

  await expect(page.getByRole('columnheader', { name: d.headers.address })).toBeVisible();
  await page.getByRole('columnheader', { name: d.headers.address }).click();
  await expect(page.getByRole('cell', { name: d.values.sortedAddress })).toBeVisible();

  await expect(page.getByRole('columnheader', { name: d.headers.providerId })).toBeVisible();
  await page.getByRole('columnheader', { name: d.headers.providerId }).click();
  await expect(page.getByRole('cell', { name: d.values.sortedProviderId })).toBeVisible();

  await expect(page.getByRole('columnheader', { name: d.headers.groupId })).toBeVisible();
  await page.getByRole('columnheader', { name: d.headers.groupId }).click();
  await expect(page.getByRole('cell', { name: d.values.sortedGroupId }).first()).toBeVisible();

  await expect(page.getByRole('columnheader', { name: d.headers.accountNumber })).toBeVisible();
  await page.getByRole('columnheader', { name: d.headers.accountNumber }).click();
  await expect(page.getByRole('cell', { name: d.values.sortedAccountNumber }).first()).toBeVisible();
});

test('Provider dashboard filter controls visibility and availability', async ({ page, loginAsAdmin }) => {
  await loginAsAdmin();
  await openProvidersDashboard(page);

  await expect(page.getByText(d.labels.providerId)).toBeVisible();
  await expect(page.getByRole('textbox', { name: d.placeholders.providerId })).toBeVisible();
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
  await expect(page.locator(d.selectors.vendorFilter).getByRole('combobox')).toBeVisible();
  await expect(page.getByRole('button', { name: d.labels.applyFilter })).toBeVisible();
});

test('Provider dashboard invalid filters should not show known seeded row', async ({ page, loginAsAdmin }) => {
  await loginAsAdmin();
  await openProvidersDashboard(page);

  await fillTextboxByName(page, d.placeholders.providerId, d.edgeCases.invalidProviderId);
  await fillTextboxByName(page, d.placeholders.groupId, d.edgeCases.invalidGroupId);
  await applyFilters(page);

  await expect(page.getByRole('cell', { name: d.values.providerId })).toHaveCount(0);
  await expect(page.getByRole('cell', { name: d.values.providerName })).toHaveCount(0);
});

test('Provider dashboard empty filters should load default grid successfully', async ({ page, loginAsAdmin }) => {
  await loginAsAdmin();
  await openProvidersDashboard(page);

  await fillTextboxByName(page, d.placeholders.providerId, '');
  await fillTextboxByName(page, d.placeholders.groupId, '');
  await fillTextboxByName(page, d.placeholders.groupName, '');
  await fillTextboxByName(page, d.placeholders.accountNumber, '');
  await fillTextboxByName(page, d.placeholders.accountName, '');
  await fillTextboxByName(page, d.placeholders.contactName, '');
  await fillTextboxByName(page, d.placeholders.city, '');
  await page.locator(d.selectors.vendorFilter).getByRole('combobox').selectOption('');
  await applyFilters(page);
  await page.waitForTimeout(d.timeouts.gridRefreshMs);

  await expect(page.getByRole('columnheader', { name: d.headers.name })).toBeVisible();
  await expect(page.getByRole('columnheader', { name: d.headers.providerId })).toBeVisible();
});

test('Provider dashboard invalid city should not show known seeded row', async ({ page, loginAsAdmin }) => {
  await loginAsAdmin();
  await openProvidersDashboard(page);

  await fillTextboxByName(page, d.placeholders.city, d.edgeCases.invalidCity);
  await applyFilters(page);

  await expect(page.getByRole('cell', { name: d.values.providerId })).toHaveCount(0);
  await expect(page.getByRole('cell', { name: d.values.providerName })).toHaveCount(0);
});

test('Provider dashboard Provider ID sorting explicitly toggles ascending and descending', async ({ page, loginAsAdmin }) => {
  test.setTimeout(120000);

  await loginAsAdmin();
  await openProvidersDashboard(page);
  await applyFilters(page);

  const rowCount = await page.locator('tbody tr').count();
  if (rowCount < 2) {
    await expect(page.locator('tbody')).toBeVisible();
    return;
  }

  const providerIdHeader = page.getByRole('columnheader', { name: /provider ID/i }).first();
  await expect(providerIdHeader).toBeVisible();

  await providerIdHeader.click();
  await page.waitForTimeout(d.timeouts.gridRefreshMs);
  const firstPassValues = await getColumnValues(page, /provider\s*ID/i);
  let firstDirection: 'asc' | 'desc' | 'single' = 'single';
  if (firstPassValues.length > 1) {
    const firstAsc = isSortedAscending(firstPassValues);
    const firstDesc = isSortedDescending(firstPassValues);
    expect(firstAsc || firstDesc).toBeTruthy();
    firstDirection = firstAsc ? 'asc' : 'desc';
  }

  await providerIdHeader.click({ force: true });
  await page.waitForTimeout(d.timeouts.gridRefreshMs);
  const secondPassValues = await getColumnValues(page, /provider\s*ID/i);
  if (secondPassValues.length > 1) {
    const secondAsc = isSortedAscending(secondPassValues);
    const secondDesc = isSortedDescending(secondPassValues);
    expect(secondAsc || secondDesc).toBeTruthy();
    if (firstDirection !== 'single') {
      expect((firstDirection === 'asc' && secondDesc) || (firstDirection === 'desc' && secondAsc)).toBeTruthy();
    }
  }
});
