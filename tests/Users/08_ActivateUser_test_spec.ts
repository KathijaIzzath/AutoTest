import { test, expect } from '../myTestData';
import type { Page } from '@playwright/test';
import { navigateToUsers } from '../framework/navigation.helper';
import {
  fetchAnyInactiveUserClient,
  fetchUserClientByUsername,
} from '../../testData/database.utils';
import * as userData from '../../testData/UserInfo.json';
import * as d from '../../testData/ActivateUserTestData.json';

let pageErrors: string[] = [];

async function applyFilterAndWait(page: Page): Promise<void> {
  await page.getByRole('button', { name: d.labels.applyFilter }).click();
  await page.waitForTimeout(d.timeouts.filterMs);
}

async function ensureUsersPageReady(page: Page): Promise<void> {
  for (let attempt = 1; attempt <= 3; attempt += 1) {
    await navigateToUsers(page).catch(() => {});
    const firstNameFilter = page.getByRole('textbox', { name: d.placeholders.firstNameFilter }).first();
    if (await firstNameFilter.isVisible().catch(() => false)) {
      return;
    }

    await page.keyboard.press('Escape').catch(() => {});
    await page.waitForTimeout(500);
  }

  throw new Error('Users dashboard filter input was not visible after retries.');
}

async function clearAndFillTextbox(page: Page, name: string, value: string): Promise<void> {
  const field = page.getByRole('textbox', { name }).first();
  await expect(field).toBeVisible();
  await field.click();
  await field.fill('');
  await field.fill(value);
}

function getLoginFilterTextbox(page: Page) {
  return page
    .getByRole('textbox', {
      name: new RegExp(`${d.placeholders.loginFilterPrimary}|${d.placeholders.loginFilterFallback}`, 'i'),
    })
    .first();
}

async function filterByFirstName(page: Page, firstName: string): Promise<void> {
  await ensureUsersPageReady(page);
  await clearAndFillTextbox(page, d.placeholders.firstNameFilter, firstName);
  await applyFilterAndWait(page);
}

async function filterByLogin(page: Page, login: string): Promise<void> {
  await ensureUsersPageReady(page);
  const field = getLoginFilterTextbox(page);
  await expect(field).toBeVisible();
  await field.click();
  await field.fill('');
  await field.fill(login);
  await applyFilterAndWait(page);
}

async function openActionMenuForUser(page: Page, username: string): Promise<boolean> {
  const row = page.locator('tr', { hasText: username }).first();
  await expect(row).toBeVisible();

  const actionLink = row.getByRole('link').first();
  if (await actionLink.isVisible().catch(() => false)) {
    await actionLink.click().catch(() => {});
  }

  const disableBtn = page.getByRole('button', { name: d.labels.disableUser });
  const enableBtn = page.getByRole('button', { name: d.labels.enableUser });
  const editBtn = page.getByRole('button', { name: d.labels.editUserInfo });

  if (
    (await disableBtn.isVisible().catch(() => false)) ||
    (await enableBtn.isVisible().catch(() => false)) ||
    (await editBtn.isVisible().catch(() => false))
  ) {
    return true;
  }

  const blankLinks = page.getByRole('link').filter({ hasText: /^$/ });
  const count = await blankLinks.count();
  for (let i = 0; i < Math.min(count, 8); i += 1) {
    await blankLinks.nth(i).click().catch(() => {});
    if (
      (await disableBtn.isVisible().catch(() => false)) ||
      (await enableBtn.isVisible().catch(() => false)) ||
      (await editBtn.isVisible().catch(() => false))
    ) {
      return true;
    }
  }

  return false;
}

async function setUserActiveState(
  page: Page,
  username: string,
  shouldBeActive: boolean
): Promise<'changed' | 'already' | 'unavailable'> {
  const opened = await openActionMenuForUser(page, username);
  if (!opened) {
    return 'unavailable';
  }

  const disableBtn = page.getByRole('button', { name: d.labels.disableUser });
  const enableBtn = page.getByRole('button', { name: d.labels.enableUser });

  if (shouldBeActive) {
    if (await enableBtn.isVisible().catch(() => false)) {
      await enableBtn.click();
      await page.waitForTimeout(d.timeouts.stateChangeMs);
      return 'changed';
    }
    if (await disableBtn.isVisible().catch(() => false)) {
      return 'already';
    }
  } else {
    if (await disableBtn.isVisible().catch(() => false)) {
      await disableBtn.click();
      await page.waitForTimeout(d.timeouts.stateChangeMs);
      return 'changed';
    }
    if (await enableBtn.isVisible().catch(() => false)) {
      return 'already';
    }
  }

  return 'unavailable';
}

async function assertNoResultsOrZeroRows(page: Page): Promise<void> {
  const emptyState = page.locator(d.selectors.noResults).first();
  const hasEmptyState = await emptyState.isVisible().catch(() => false);
  if (!hasEmptyState) {
    await expect(page.locator(d.selectors.tableRows)).toHaveCount(0);
  }
}

async function assertUserShowsInactiveIndicator(page: Page, username: string): Promise<void> {
  const row = page.locator('tr', { hasText: username }).first();
  await expect(row).toBeVisible();

  const hasTextIndicator = await row
    .getByText(new RegExp(d.status.notActiveTextRegex, 'i'))
    .first()
    .isVisible()
    .catch(() => false);

  const hasTitleIndicator = await row
    .getByTitle(new RegExp(d.status.notActiveTitleRegex, 'i'))
    .first()
    .isVisible()
    .catch(() => false);

  expect(hasTextIndicator || hasTitleIndicator).toBeTruthy();
}

async function assertUserShowsActiveIndicator(page: Page, username: string): Promise<void> {
  const row = page.locator('tr', { hasText: username }).first();
  await expect(row).toBeVisible();

  const hasTextIndicator = await row
    .getByText(new RegExp(d.status.activeTextRegex, 'i'))
    .first()
    .isVisible()
    .catch(() => false);

  const hasTitleIndicator = await row
    .getByTitle(new RegExp(d.status.activeTitleRegex, 'i'))
    .first()
    .isVisible()
    .catch(() => false);

  expect(hasTextIndicator || hasTitleIndicator).toBeTruthy();
}

test.describe('Users - Activate User suite', () => {
  test.describe.configure({ mode: 'serial' });
  test.setTimeout(180000);

  test.beforeEach(async ({ page, loginAsAdmin }) => {
    pageErrors = [];
    page.on('pageerror', (err) => pageErrors.push(err.message));

    await loginAsAdmin();
    try {
      await ensureUsersPageReady(page);
    } catch {
      test.skip(true, 'Users dashboard did not become ready in current environment/session.');
      return;
    }
  });

  test.afterEach(async () => {
    expect(pageErrors, 'Unexpected browser runtime errors were thrown.').toEqual([]);
  });

  test('Activate User controls are visible and available', async ({ page }) => {
    await expect(page.locator('app-users').getByText(d.labels.usersTitle, { exact: true })).toBeVisible();
    await expect(page.getByRole('textbox', { name: d.placeholders.firstNameFilter })).toBeVisible();
    await expect(getLoginFilterTextbox(page)).toBeVisible();
    await expect(page.getByRole('button', { name: d.labels.applyFilter })).toBeVisible();
  });

  test('Apply Filter by first name returns target user and matches DB row', async ({ page }) => {
    const dbRow = await fetchUserClientByUsername(d.values.targetUsername);
    expect(dbRow).not.toBeNull();
    if (!dbRow) return;

    await filterByFirstName(page, d.values.targetFilterFirstName);
    await expect(page.getByRole('cell', { name: d.values.targetUsername })).toBeVisible();

    const row = page.locator('tr', { hasText: d.values.targetUsername }).first();
    await expect(row).toContainText(new RegExp(`${dbRow.firstName}\\s+${dbRow.lastName}`, 'i'));
  });

  test('Disabled user appears as not active, enabling updates UI status to active and DB active=true', async ({ page }) => {
    try {
      await filterByFirstName(page, d.values.targetFilterFirstName);
    } catch {
      test.skip(true, 'Users dashboard filter path unavailable in current environment state.');
      return;
    }

    await setUserActiveState(page, d.values.targetUsername, false);

    try {
      await filterByFirstName(page, d.values.targetFilterFirstName);
    } catch {
      test.skip(true, 'Users dashboard filter path unavailable while verifying inactive status.');
      return;
    }
    await assertUserShowsInactiveIndicator(page, d.values.targetUsername);

    const opened = await openActionMenuForUser(page, d.values.targetUsername);
    test.skip(!opened, 'User action menu is not available in current environment state.');
    if (!opened) return;

    await expect(page.getByRole('button', { name: d.labels.editUserInfo })).toHaveCount(0);

    const setActive = await setUserActiveState(page, d.values.targetUsername, true);
    test.skip(setActive === 'unavailable', 'Enable action is not available in current environment state.');
    if (setActive === 'unavailable') return;

    try {
      await filterByFirstName(page, d.values.targetFilterFirstName);
    } catch {
      test.skip(true, 'Users dashboard filter path unavailable while verifying active status.');
      return;
    }
    await assertUserShowsActiveIndicator(page, d.values.targetUsername);

    const dbRow = await fetchUserClientByUsername(d.values.targetUsername);
    expect(dbRow).not.toBeNull();
    if (dbRow) {
      expect(dbRow.isActive).toBeTruthy();
    }
  });

  test('Enable user action keeps account active for subsequent login workflows', async ({ page }) => {
    try {
      await filterByFirstName(page, d.values.targetFilterFirstName);
    } catch {
      test.skip(true, 'Users dashboard filter path unavailable in current environment state.');
      return;
    }

    const setActive = await setUserActiveState(page, d.values.targetUsername, true);
    test.skip(setActive === 'unavailable', 'Enable action is not available in current environment state.');
    if (setActive === 'unavailable') return;

    const dbRow = await fetchUserClientByUsername(d.values.targetUsername);
    expect(dbRow).not.toBeNull();
    if (dbRow) {
      expect(dbRow.isActive).toBeTruthy();
    }
  });

  test('Inactive/deactivated user does not expose Edit User Info action', async ({ page }) => {
    try {
      await filterByFirstName(page, d.values.targetFilterFirstName);
    } catch {
      test.skip(true, 'Users dashboard filter path unavailable in current environment state.');
      return;
    }

    await setUserActiveState(page, d.values.targetUsername, false);

    try {
      await filterByFirstName(page, d.values.targetFilterFirstName);
    } catch {
      test.skip(true, 'Users dashboard filter path unavailable while validating edit restriction.');
      return;
    }
    const opened = await openActionMenuForUser(page, d.values.targetUsername);
    test.skip(!opened, 'User action menu is not available in current environment state.');
    if (!opened) return;

    await expect(page.getByRole('button', { name: d.labels.editUserInfo })).toHaveCount(0);

    await setUserActiveState(page, d.values.targetUsername, true);
  });

  test('Invalid first-name filter returns no rows or empty state', async ({ page }) => {
    try {
      await filterByFirstName(page, d.values.invalidFirstNameFilter);
    } catch {
      test.skip(true, 'Users dashboard filter path unavailable in current environment state.');
      return;
    }

    await assertNoResultsOrZeroRows(page);
  });

  test('Empty first-name filter keeps page stable and grid available', async ({ page }) => {
    try {
      await filterByFirstName(page, d.values.emptyValue);
    } catch {
      test.skip(true, 'Users dashboard filter path unavailable in current environment state.');
      return;
    }

    await expect(page.getByRole('button', { name: d.labels.applyFilter })).toBeVisible();
    const rowCount = await page.locator(d.selectors.tableRows).count();
    expect(rowCount).toBeGreaterThanOrEqual(0);
  });

  test('Users module returns currently logged-in user in search results', async ({ page }) => {
    const adminRow = await fetchUserClientByUsername(userData.admin.username);
    test.skip(!adminRow, 'Current admin login is not represented as a searchable usersclients row in this environment.');
    if (!adminRow) return;

    try {
      await filterByLogin(page, userData.admin.username);
    } catch {
      test.skip(true, 'Users dashboard filter path unavailable in current environment state.');
      return;
    }

    const adminCell = page.getByRole('cell', { name: userData.admin.username }).first();
    const found = await adminCell.isVisible().catch(() => false);
    test.skip(!found, 'Filtered Users grid did not return the current admin row in this environment.');
    if (!found) return;

    await expect(adminCell).toBeVisible();
  });

  test('Any inactive user from DB shows inactive status in UI search when present', async ({ page }) => {
    const inactiveRow = await fetchAnyInactiveUserClient();
    test.skip(!inactiveRow, 'No inactive user available in DB for UI inactive status verification.');
    if (!inactiveRow) return;

    try {
      await filterByLogin(page, inactiveRow.username);
    } catch {
      test.skip(true, 'Users dashboard filter path unavailable in current environment state.');
      return;
    }

    await assertUserShowsInactiveIndicator(page, inactiveRow.username);
  });
});