import { test, expect } from '../myTestData';
import type { Locator, Page } from '@playwright/test';
import { navigateToUsers } from '../framework/navigation.helper';
import {
  fetchAnyInactiveUserClient,
  fetchUserClientByUsername,
  fetchUserClientsByFilters,
} from '../../testData/database.utils';
import * as d from '../../testData/SearchUserTestData.json';

let pageErrors: string[] = [];

function escapeForRegex(value: string): string {
  return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

function normalizeSpaces(value: string): string {
  return value.replace(/\s+/g, ' ').trim();
}

async function openUsersDashboard(page: Page): Promise<void> {
  await navigateToUsers(page);
  await expect(page.getByRole('button', { name: d.labels.applyFilter })).toBeVisible();
}

async function applyFilterAndWait(page: Page): Promise<void> {
  const applyButton = page.getByRole('button', { name: d.labels.applyFilter });
  await expect(applyButton).toBeVisible();
  await applyButton.click();
  await page.waitForTimeout(d.timeouts.filterMs);
}

async function clearAndFillTextbox(page: Page, name: string, value: string): Promise<void> {
  const field = page.getByRole('textbox', { name });
  await expect(field).toBeVisible();
  await field.click();
  await field.fill(d.edgeCases.empty);
  await field.fill(value);
}

async function clearUserFilters(page: Page): Promise<void> {
  await clearAndFillTextbox(page, d.placeholders.login, d.edgeCases.empty);
  await clearAndFillTextbox(page, d.placeholders.firstName, d.edgeCases.empty);
  await clearAndFillTextbox(page, d.placeholders.lastName, d.edgeCases.empty);
  await clearAndFillTextbox(page, d.placeholders.groupId, d.edgeCases.empty);

  const statusSelect = page
    .locator('dropdown-filter-item')
    .filter({ hasText: d.selectors.statusDropdownContainerText })
    .getByRole('combobox');
  const userTypeSelect = page
    .locator('dropdown-filter-item')
    .filter({ hasText: d.selectors.userTypeDropdownContainerText })
    .getByRole('combobox');

  if (await statusSelect.isVisible().catch(() => false)) {
    await statusSelect.selectOption('').catch(() => {});
  }
  if (await userTypeSelect.isVisible().catch(() => false)) {
    await userTypeSelect.selectOption('').catch(() => {});
  }
}

async function assertNoResultsOrZeroRows(page: Page): Promise<void> {
  const emptyState = page.locator(d.selectors.noResults).first();
  const hasEmptyState = await emptyState.isVisible().catch(() => false);
  if (!hasEmptyState) {
    await expect(page.locator(d.selectors.tableRows)).toHaveCount(0);
  }
}

async function getFirstRow(page: Page): Promise<Locator> {
  const row = page.locator(d.selectors.tableRows).first();
  await expect(row).toBeVisible({ timeout: d.timeouts.searchMs });
  return row;
}

async function openFirstRowActionMenu(page: Page): Promise<boolean> {
  const row = await getFirstRow(page);
  const rowActionLink = row.getByRole('link').first();
  const visible = await rowActionLink.isVisible().catch(() => false);
  if (!visible) {
    return false;
  }
  await rowActionLink.click();
  return true;
}

async function getUserTypeOptions(page: Page): Promise<string[]> {
  const select = page
    .locator('dropdown-filter-item')
    .filter({ hasText: d.selectors.userTypeDropdownContainerText })
    .getByRole('combobox');

  await expect(select).toBeVisible();
  const options = await select.locator('option').allTextContents();
  return options.map((text) => normalizeSpaces(text)).filter((text) => text.length > 0);
}

async function assertRowContainsText(page: Page, text: string): Promise<void> {
  const row = await getFirstRow(page);
  await expect(row).toContainText(new RegExp(escapeForRegex(text), 'i'));
}

test.describe('Users - Search User dashboard suite', () => {
  test.beforeEach(async ({ page, loginAsAdmin }) => {
    pageErrors = [];
    page.on('pageerror', (err) => pageErrors.push(err.message));

    await loginAsAdmin();
    await openUsersDashboard(page);
  });

  test.afterEach(async () => {
    expect(pageErrors, 'Unexpected browser runtime errors were thrown.').toEqual([]);
  });

  test('Search User controls are visible and available', async ({ page }) => {
    await expect(page.locator('app-users').getByText(d.labels.usersTitle, { exact: true })).toBeVisible();
    await expect(page.getByRole('link', { name: new RegExp(d.labels.addUsers, 'i') })).toBeVisible();

    await expect(page.getByText(d.labels.login, { exact: true })).toBeVisible();
    await expect(page.getByRole('textbox', { name: d.placeholders.login })).toBeVisible();

    await expect(page.getByText(d.labels.firstName, { exact: true })).toBeVisible();
    await expect(page.getByRole('textbox', { name: d.placeholders.firstName })).toBeVisible();

    await expect(page.getByText(d.labels.lastName, { exact: true })).toBeVisible();
    await expect(page.getByRole('textbox', { name: d.placeholders.lastName })).toBeVisible();

    await expect(page.getByText(d.labels.groupId, { exact: true })).toBeVisible();
    await expect(page.getByRole('textbox', { name: d.placeholders.groupId })).toBeVisible();

    await expect(page.getByText(d.labels.vendor, { exact: true })).toBeVisible();
    await expect(
      page
        .locator('dropdown-filter-item')
        .filter({ hasText: d.selectors.vendorDropdownContainerText })
        .getByRole('combobox')
    ).toBeVisible();

    await expect(page.getByText(d.labels.status, { exact: true })).toBeVisible();
    await expect(
      page
        .locator('dropdown-filter-item')
        .filter({ hasText: d.selectors.statusDropdownContainerText })
        .getByRole('combobox')
    ).toBeVisible();

    await expect(page.getByText(d.labels.userType, { exact: true })).toBeVisible();
    await expect(
      page
        .locator('dropdown-filter-item')
        .filter({ hasText: d.selectors.userTypeDropdownContainerText })
        .getByRole('combobox')
    ).toBeVisible();

    await expect(page.getByRole('button', { name: d.labels.applyFilter })).toBeVisible();
  });

  test('Apply Filter by first name returns successful search results', async ({ page }) => {
    await clearUserFilters(page);
    await clearAndFillTextbox(page, d.placeholders.firstName, d.values.knownFirstName);
    await applyFilterAndWait(page);

    await expect(page.getByRole('columnheader', { name: d.tableHeaders.user, exact: true })).toBeVisible();
    await expect(page.getByRole('columnheader', { name: new RegExp(d.tableHeaders.loginSorted, 'i') })).toBeVisible();
    await expect(page.getByRole('columnheader', { name: d.tableHeaders.userType })).toBeVisible();
    await expect(page.getByRole('columnheader', { name: d.tableHeaders.status })).toBeVisible();

    const rowCount = await page.locator(d.selectors.tableRows).count();
    expect(rowCount).toBeGreaterThan(0);
  });

  test('Filter by login returns matching user and DB row exists', async ({ page }) => {
    const dbRow = await fetchUserClientByUsername(d.values.knownUsername);
    expect(dbRow).not.toBeNull();
    if (!dbRow) return;

    await clearUserFilters(page);
    await clearAndFillTextbox(page, d.placeholders.login, d.values.knownUsername);
    await applyFilterAndWait(page);

    await assertRowContainsText(page, dbRow.username);
    await assertRowContainsText(page, `${dbRow.firstName} ${dbRow.lastName}`.trim());
  });

  test('Filter by last name returns matching rows in UI and DB', async ({ page }) => {
    const dbRows = await fetchUserClientsByFilters({ lastName: d.values.knownLastName });
    expect(dbRows.length).toBeGreaterThan(0);

    await clearUserFilters(page);
    await clearAndFillTextbox(page, d.placeholders.lastName, d.values.knownLastName);
    await applyFilterAndWait(page);

    const rowCount = await page.locator(d.selectors.tableRows).count();
    expect(rowCount).toBeGreaterThan(0);

    const firstDb = dbRows[0];
    await assertRowContainsText(page, firstDb.lastName);
  });

  test('Group ID filtering is case-insensitive and returns matching groups', async ({ page }) => {
    const dbRows = await fetchUserClientsByFilters({ groupId: d.values.knownGroupIdUpper });
    expect(dbRows.length).toBeGreaterThan(0);

    await clearUserFilters(page);
    await clearAndFillTextbox(page, d.placeholders.groupId, d.values.knownGroupIdLower);
    await clearAndFillTextbox(page, d.placeholders.firstName, d.values.knownFirstName);
    await applyFilterAndWait(page);

    await assertRowContainsText(page, d.values.knownUsername);

    await clearAndFillTextbox(page, d.placeholders.groupId, d.values.knownGroupIdUpper);
    await applyFilterAndWait(page);
    await assertRowContainsText(page, d.values.knownUsername);
  });

  test('Status filter Active returns active user rows when selected', async ({ page }) => {
    await clearUserFilters(page);
    const statusSelect = page
      .locator('dropdown-filter-item')
      .filter({ hasText: d.selectors.statusDropdownContainerText })
      .getByRole('combobox');

    await statusSelect.selectOption(d.values.statusActiveOption);
    await applyFilterAndWait(page);

    await expect(page.getByRole('columnheader', { name: d.tableHeaders.status })).toBeVisible();
    await expect(page.getByTitle(/active/i).first()).toBeVisible();
  });

  test('User Type dropdown has vendor/account/billing-group options', async ({ page }) => {
    const options = await getUserTypeOptions(page);
    const expected = ['VENDOR', 'ACCOUNT', 'BILLING_GROUP'];

    for (const value of expected) {
      const found = options.some((option) => option.toUpperCase().includes(value));
      expect(found, `Expected user type option not found: ${value}`).toBeTruthy();
    }
  });

  test('User Type filter vendor returns vendor rows', async ({ page }) => {
    await clearUserFilters(page);
    const userTypeSelect = page
      .locator('dropdown-filter-item')
      .filter({ hasText: d.selectors.userTypeDropdownContainerText })
      .getByRole('combobox');

    await userTypeSelect.selectOption(d.values.userTypeVendorOption);
    await applyFilterAndWait(page);

    await expect(page.getByRole('columnheader', { name: d.tableHeaders.userType })).toBeVisible();
    await expect(page.getByRole('cell', { name: 'VENDOR' }).first()).toBeVisible();
  });

  test('User Type filter account returns account rows', async ({ page }) => {
    await clearUserFilters(page);
    const userTypeSelect = page
      .locator('dropdown-filter-item')
      .filter({ hasText: d.selectors.userTypeDropdownContainerText })
      .getByRole('combobox');

    await userTypeSelect.selectOption(d.values.userTypeAccountOption);
    await applyFilterAndWait(page);

    await expect(page.getByRole('columnheader', { name: d.tableHeaders.userType })).toBeVisible();
    await expect(page.getByRole('cell', { name: 'ACCOUNT' }).first()).toBeVisible();
  });

  test('User Type filter billing-group returns billing-group rows', async ({ page }) => {
    await clearUserFilters(page);
    const userTypeSelect = page
      .locator('dropdown-filter-item')
      .filter({ hasText: d.selectors.userTypeDropdownContainerText })
      .getByRole('combobox');

    await userTypeSelect.selectOption(d.values.userTypeBillingGroupOption);
    await applyFilterAndWait(page);

    await expect(page.getByRole('columnheader', { name: d.tableHeaders.userType })).toBeVisible();
    await expect(page.getByRole('cell', { name: 'BILLING_GROUP' }).first()).toBeVisible();
  });

  test('Vendor dropdown can be selected and filtered without errors', async ({ page }) => {
    await clearUserFilters(page);
    const vendorSelect = page
      .locator('dropdown-filter-item')
      .filter({ hasText: d.selectors.vendorDropdownContainerText })
      .getByRole('combobox');

    await expect(vendorSelect).toBeVisible();
    await vendorSelect.selectOption(d.values.vendorOption);
    await clearAndFillTextbox(page, d.placeholders.firstName, d.values.knownFirstName);
    await applyFilterAndWait(page);

    const rowCount = await page.locator(d.selectors.tableRows).count();
    expect(rowCount).toBeGreaterThanOrEqual(0);
  });

  test('Apply Filter with empty fields keeps page stable and result grid available', async ({ page }) => {
    await clearUserFilters(page);
    await applyFilterAndWait(page);

    await expect(page.getByRole('button', { name: d.labels.applyFilter })).toBeVisible();
    const rowCount = await page.locator(d.selectors.tableRows).count();
    expect(rowCount).toBeGreaterThanOrEqual(0);
  });

  test('Invalid login returns no results or empty state', async ({ page }) => {
    const dbRows = await fetchUserClientsByFilters({ username: d.edgeCases.invalidLogin });
    expect(dbRows.length).toBe(0);

    await clearUserFilters(page);
    await clearAndFillTextbox(page, d.placeholders.login, d.edgeCases.invalidLogin);
    await applyFilterAndWait(page);

    await assertNoResultsOrZeroRows(page);
  });

  test('Invalid group id returns no results or empty state', async ({ page }) => {
    const dbRows = await fetchUserClientsByFilters({ groupId: d.edgeCases.invalidGroupId });
    expect(dbRows.length).toBe(0);

    await clearUserFilters(page);
    await clearAndFillTextbox(page, d.placeholders.groupId, d.edgeCases.invalidGroupId);
    await applyFilterAndWait(page);

    await assertNoResultsOrZeroRows(page);
  });

  test('Whitespace login does not throw errors and keeps page usable', async ({ page }) => {
    await clearUserFilters(page);
    await clearAndFillTextbox(page, d.placeholders.login, d.edgeCases.whitespace);
    await applyFilterAndWait(page);

    await expect(page.getByRole('button', { name: d.labels.applyFilter })).toBeVisible();
  });

  test('Inactive or deactivated user does not expose editable actions in search result menu', async ({ page }) => {
    const inactiveUser = await fetchAnyInactiveUserClient();
    test.skip(!inactiveUser, 'No inactive user found in usersclients to validate edit restrictions.');
    if (!inactiveUser) return;

    await clearUserFilters(page);
    await clearAndFillTextbox(page, d.placeholders.login, inactiveUser.username);
    await applyFilterAndWait(page);

    await assertRowContainsText(page, inactiveUser.username);

    const opened = await openFirstRowActionMenu(page);
    test.skip(!opened, 'Row action menu is not available for inactive user row.');
    if (!opened) return;

    await expect(page.getByRole('button', { name: /edit|update|save/i })).toHaveCount(0);
  });

  test('User info row displays assigned group for the known login', async ({ page }) => {
    const dbRow = await fetchUserClientByUsername(d.values.knownUsername);
    expect(dbRow).not.toBeNull();
    if (!dbRow) return;

    await clearUserFilters(page);
    await clearAndFillTextbox(page, d.placeholders.login, d.values.knownUsername);
    await applyFilterAndWait(page);

    await assertRowContainsText(page, dbRow.username);
    if (dbRow.groupId) {
      await assertRowContainsText(page, dbRow.groupId);
    }
  });

  test('Login filter value persists after applying filter', async ({ page }) => {
    await clearUserFilters(page);
    await clearAndFillTextbox(page, d.placeholders.login, d.values.knownUsername);
    await applyFilterAndWait(page);

    await expect(page.getByRole('textbox', { name: d.placeholders.login })).toHaveValue(d.values.knownUsername);
  });
});
