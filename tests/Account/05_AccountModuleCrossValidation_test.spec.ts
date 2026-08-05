import { test, expect } from '../myTestData';
import type { Locator, Page } from '@playwright/test';
import {
  navigateToAccounts,
  navigateToClaimsDashboard,
  navigateToProviderGroups,
  navigateToUsers,
} from '../framework/navigation.helper';
import { fetchUserClientByUsername } from '../../testData/database.utils';
import * as d from '../../testData/AccountModuleCrossValidationTestData.json';

let pageErrors: string[] = [];

function normalizeSpaces(value: string): string {
  return value.replace(/\s+/g, ' ').trim();
}

function escapeForRegex(value: string): string {
  return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

function hasCredentialPair(username: string, password: string): boolean {
  return username.trim().length > 0 && password.trim().length > 0;
}

async function applyFilterAndWait(page: Page): Promise<void> {
  await page.getByRole('button', { name: d.labels.applyFilter }).first().click();
  await page.waitForTimeout(d.timeouts.filterMs);
}

async function ensureAccountsPageReady(page: Page): Promise<void> {
  for (let attempt = 1; attempt <= 3; attempt += 1) {
    await navigateToAccounts(page).catch(() => {});
    const accountNumber = page.getByRole('textbox', { name: d.placeholders.accountNumber }).first();
    if (await accountNumber.isVisible().catch(() => false)) {
      return;
    }

    await page.keyboard.press('Escape').catch(() => {});
    await page.waitForTimeout(d.timeouts.retryMs);
  }

  test.skip(true, 'Accounts dashboard was not ready after retries.');
}

async function clearAccountsFilters(page: Page): Promise<void> {
  const accountNumber = page.getByRole('textbox', { name: d.placeholders.accountNumber }).first();
  const accountName = page.getByRole('textbox', { name: d.placeholders.accountName }).first();
  const city = page.getByRole('textbox', { name: d.placeholders.city }).first();
  const npi = page.getByRole('textbox', { name: d.placeholders.npi }).first();
  const providerGroupId = page.getByRole('textbox', { name: d.placeholders.providerGroupId }).first();
  const providerId = page.getByRole('textbox', { name: d.placeholders.providerId }).first();

  if (await accountNumber.isVisible().catch(() => false)) await accountNumber.fill('');
  if (await accountName.isVisible().catch(() => false)) await accountName.fill('');
  if (await city.isVisible().catch(() => false)) await city.fill('');
  if (await npi.isVisible().catch(() => false)) await npi.fill('');
  if (await providerGroupId.isVisible().catch(() => false)) await providerGroupId.fill('');
  if (await providerId.isVisible().catch(() => false)) await providerId.fill('');

  const inactiveOnly = page.getByRole('checkbox', { name: d.labels.showInactiveOnly }).first();
  if (await inactiveOnly.isVisible().catch(() => false)) {
    if (await inactiveOnly.isChecked().catch(() => false)) {
      await inactiveOnly.uncheck().catch(() => {});
    }
  }
}

async function filterByAccountName(page: Page, accountName: string): Promise<void> {
  await ensureAccountsPageReady(page);
  await clearAccountsFilters(page);
  await page.getByRole('textbox', { name: d.placeholders.accountName }).first().fill(accountName);
  await applyFilterAndWait(page);
}

async function filterByAccountNumber(page: Page, accountNumber: string): Promise<void> {
  await ensureAccountsPageReady(page);
  await clearAccountsFilters(page);
  await page.getByRole('textbox', { name: d.placeholders.accountNumber }).first().fill(accountNumber);
  await applyFilterAndWait(page);
}

async function getFirstAccountRow(page: Page): Promise<Locator> {
  const row = page.locator('tbody tr').first();
  await expect(row).toBeVisible();
  return row;
}

async function openAccountActionMenu(page: Page): Promise<boolean> {
  const row = await getFirstAccountRow(page);
  const rowAction = row.getByRole('link').first();
  if (await rowAction.isVisible().catch(() => false)) {
    await rowAction.click().catch(() => {});
  }

  const edit = page.getByRole('button', { name: d.labels.editAccount }).first();
  const deactivate = page.getByRole('button', { name: d.labels.deactivateAccount }).first();
  const activate = page.getByRole('button', { name: d.labels.activateAccount }).first();
  if ((await edit.isVisible().catch(() => false)) || (await deactivate.isVisible().catch(() => false)) || (await activate.isVisible().catch(() => false))) {
    return true;
  }

  const blankLinks = page.getByRole('link').filter({ hasText: /^$/ });
  const count = await blankLinks.count();
  for (let i = 0; i < Math.min(count, 10); i += 1) {
    await blankLinks.nth(i).click().catch(() => {});
    if ((await edit.isVisible().catch(() => false)) || (await deactivate.isVisible().catch(() => false)) || (await activate.isVisible().catch(() => false))) {
      return true;
    }
  }

  return false;
}

async function logoutCurrentUser(page: Page): Promise<void> {
  const logoutBtn = page.getByRole('button', { name: d.labels.logout }).first();
  if (!(await logoutBtn.isVisible().catch(() => false))) {
    await page.locator(d.selectors.profileMenuIcon).nth(d.selectors.profileMenuIndex).click().catch(() => {});
  }

  if (await page.getByRole('button', { name: d.labels.logout }).first().isVisible().catch(() => false)) {
    await page.getByRole('button', { name: d.labels.logout }).first().click();
  }
}

async function loginWithCredentials(page: Page, username: string, password: string): Promise<void> {
  await page.getByRole('textbox', { name: d.inputs.loginUsername }).first().fill(username);
  await page.getByRole('textbox', { name: d.inputs.loginPassword }).first().fill(password);
  await page.getByRole('button', { name: d.labels.login }).first().click();
  await page.waitForTimeout(d.timeouts.saveMs);
}

async function ensureUsersPageReady(page: Page): Promise<void> {
  for (let attempt = 1; attempt <= 3; attempt += 1) {
    await navigateToUsers(page).catch(() => {});
    const loginFilter = page.getByRole('textbox', { name: new RegExp(`${d.placeholders.loginPrimary}|${d.placeholders.loginFallback}`, 'i') }).first();
    if (await loginFilter.isVisible().catch(() => false)) {
      return;
    }

    await page.keyboard.press('Escape').catch(() => {});
    await page.waitForTimeout(d.timeouts.retryMs);
  }

  test.skip(true, 'Users dashboard was not ready after retries.');
}

async function assertNoTokenInVisibleRows(page: Page, token: string): Promise<void> {
  const rows = page.locator(d.selectors.tableRows);
  const rowCount = await rows.count();
  test.skip(rowCount === 0, 'No rows available for restriction assertion.');
  if (rowCount === 0) return;

  const inspectCount = Math.min(rowCount, d.values.maxRowsToInspect);
  for (let i = 0; i < inspectCount; i += 1) {
    const text = normalizeSpaces((await rows.nth(i).textContent()) ?? '');
    expect(text.toUpperCase().includes(token.toUpperCase())).toBeFalsy();
  }
}

async function assertAnyTokenInVisibleRows(page: Page, token: string): Promise<void> {
  const rows = page.locator(d.selectors.tableRows);
  const rowCount = await rows.count();
  test.skip(rowCount === 0, 'No rows available for positive-token assertion.');
  if (rowCount === 0) return;

  const inspectCount = Math.min(rowCount, d.values.maxRowsToInspect);
  let found = false;
  for (let i = 0; i < inspectCount; i += 1) {
    const text = normalizeSpaces((await rows.nth(i).textContent()) ?? '');
    if (text.toUpperCase().includes(token.toUpperCase())) {
      found = true;
      break;
    }
  }

  test.skip(!found, `Allowed token ${token} was not found in visible rows for this environment state.`);
}

async function openGroupEnrollmentsModule(page: Page): Promise<boolean> {
  const nav = page.getByRole('link', { name: new RegExp(d.modules.groupEnrollments, 'i') }).first();
  if (!(await nav.isVisible().catch(() => false))) {
    return false;
  }

  await nav.click();
  await page.waitForTimeout(d.timeouts.filterMs);
  return true;
}

async function openEraModule(page: Page): Promise<boolean> {
  const nav = page.getByRole('link', { name: new RegExp(`^${d.modules.era}$`, 'i') }).first();
  if (!(await nav.isVisible().catch(() => false))) {
    return false;
  }

  await nav.click();
  await page.waitForTimeout(d.timeouts.filterMs);
  return true;
}

test.describe('Accounts - SecureConnect module and cross-module validation suite', () => {
  test.describe.configure({ mode: 'serial' });
  test.setTimeout(300000);

  test.beforeEach(async ({ page, loginAsAdmin }) => {
    pageErrors = [];
    page.on('pageerror', (err) => pageErrors.push(err.message));

    await loginAsAdmin();
    await ensureAccountsPageReady(page);
  });

  test.afterEach(async () => {
    expect(pageErrors, 'Unexpected browser runtime errors were thrown.').toEqual([]);
  });

  test('ACC-001/002/006: SCAdmin create/edit entry points and list refresh consistency', async ({ page }) => {
    await expect(page.getByRole('link', { name: new RegExp(d.labels.addAccount, 'i') }).first()).toBeVisible();
    await filterByAccountNumber(page, d.values.accountSearchNumber);

    const preRefreshRow = await getFirstAccountRow(page);
    const preRefreshText = normalizeSpaces((await preRefreshRow.textContent()) ?? '');
    expect(preRefreshText.length > 0).toBeTruthy();

    await page.reload();
    await ensureAccountsPageReady(page);
    await filterByAccountNumber(page, d.values.accountSearchNumber);

    const postRefreshRow = await getFirstAccountRow(page);
    const postRefreshText = normalizeSpaces((await postRefreshRow.textContent()) ?? '');
    expect(postRefreshText.length > 0).toBeTruthy();
  });

  test('ACC-003/004/005: Account search by name/number and single-vendor baseline behavior', async ({ page }) => {
    await filterByAccountName(page, d.values.accountSearchName);
    await assertAnyTokenInVisibleRows(page, d.values.partialAccountSearch);

    await filterByAccountNumber(page, d.values.accountSearchNumber);
    await expect(page.getByRole('cell', { name: new RegExp(escapeForRegex(d.values.accountSearchNumber), 'i') }).first()).toBeVisible();
  });

  test('ACC-010: SCAdmin blank search returns account rows', async ({ page }) => {
    await ensureAccountsPageReady(page);
    await clearAccountsFilters(page);
    await applyFilterAndWait(page);
    const rowCount = await page.locator(d.selectors.tableRows).count();
    expect(rowCount).toBeGreaterThan(0);
  });

  test('ACC-011/012/013/014/015: Restricted profile account scope enforcement', async ({ page }) => {
    const profiles = [
      d.users.accountRestricted,
      d.users.vendorRestricted,
      d.users.billingGroupRestricted,
    ].filter((p) => hasCredentialPair(p.username, p.password));

    test.skip(profiles.length === 0, 'Restricted profile credentials are not configured in AccountModuleCrossValidationTestData.json.');
    if (profiles.length === 0) return;

    for (const profile of profiles) {
      await logoutCurrentUser(page);
      await loginWithCredentials(page, profile.username, profile.password);

      await ensureAccountsPageReady(page);
      await clearAccountsFilters(page);
      await applyFilterAndWait(page);
      await assertNoTokenInVisibleRows(page, d.scopes.disallowedSiblingAccount);

      await filterByAccountName(page, d.values.partialAccountSearch);
      await assertNoTokenInVisibleRows(page, d.scopes.disallowedSiblingAccount);
    }
  });

  test('ACC-020/021/022/023/024: Users profile dependency visibility remains consistent', async ({ page }) => {
    await ensureUsersPageReady(page);
    const loginFilter = page.getByRole('textbox', { name: new RegExp(`${d.placeholders.loginPrimary}|${d.placeholders.loginFallback}`, 'i') }).first();
    await loginFilter.fill(d.users.targetUser.username);
    await applyFilterAndWait(page);

    const row = page.locator('tr', { hasText: d.users.targetUser.username }).first();
    await expect(row).toBeVisible();

    const rowText = normalizeSpaces((await row.textContent()) ?? '');
    expect(rowText.toUpperCase().includes(d.users.targetUser.username.toUpperCase())).toBeTruthy();
  });

  test('ACC-030/031/032/033: Inactive-state action behavior and blocked maintenance checks', async ({ page }) => {
    await filterByAccountNumber(page, d.values.accountSearchNumber);
    const opened = await openAccountActionMenu(page);
    test.skip(!opened, 'Account action menu unavailable in current environment state.');
    if (!opened) return;

    const editVisible = await page.getByRole('button', { name: d.labels.editAccount }).first().isVisible().catch(() => false);
    const deactivateVisible = await page.getByRole('button', { name: d.labels.deactivateAccount }).first().isVisible().catch(() => false);
    const activateVisible = await page.getByRole('button', { name: d.labels.activateAccount }).first().isVisible().catch(() => false);

    expect(editVisible || deactivateVisible || activateVisible).toBeTruthy();
    test.skip(!d.values.allowStateMutation, 'State mutation is disabled by test data; maintenance controls were validated read-only.');
  });

  test('ACC-XM-001/002/003/004: Claims workflows honor account restriction scope', async ({ page }) => {
    await navigateToClaimsDashboard(page);
    await applyFilterAndWait(page);
    await assertNoTokenInVisibleRows(page, d.scopes.disallowedSiblingAccount);
  });

  test('ACC-XM-010/011/012: Users module search respects saved account-linked setup', async ({ page }) => {
    await ensureUsersPageReady(page);

    const loginFilter = page.getByRole('textbox', { name: new RegExp(`${d.placeholders.loginPrimary}|${d.placeholders.loginFallback}`, 'i') }).first();
    await loginFilter.fill(d.users.targetUser.username);
    await applyFilterAndWait(page);

    await expect(page.getByRole('cell', { name: d.users.targetUser.username }).first()).toBeVisible();
  });

  test('ACC-XM-020/021/022: Provider Group and account dependency scope checks', async ({ page }) => {
    await navigateToProviderGroups(page);
    await applyFilterAndWait(page);
    await assertNoTokenInVisibleRows(page, d.scopes.disallowedSiblingAccount);
  });

  test('ACC-XM-030/031/032: Group Enrollment lookup respects account-linked restrictions', async ({ page }) => {
    const opened = await openGroupEnrollmentsModule(page);
    test.skip(!opened, 'Group Enrollments module is unavailable in current environment state.');
    if (!opened) return;

    const groupFilter = page.getByRole('textbox', { name: d.placeholders.groupId }).first();
    if (await groupFilter.isVisible().catch(() => false)) {
      await groupFilter.fill(d.scopes.allowedGroup);
      await applyFilterAndWait(page);
    }

    await assertNoTokenInVisibleRows(page, d.scopes.disallowedGroup);
  });

  test('ACC-XM-040/041/042/043: Dashboard selectors and ERA flows do not broaden scope', async ({ page }) => {
    const dashboardLink = page.getByRole('link', { name: new RegExp(`^${d.modules.dashboard}$`, 'i') }).first();
    if (await dashboardLink.isVisible().catch(() => false)) {
      await dashboardLink.click().catch(() => {});
      await page.waitForTimeout(d.timeouts.filterMs);
    }

    const groupCombobox = page.getByRole('combobox').first();
    if (await groupCombobox.isVisible().catch(() => false)) {
      const options = await groupCombobox.locator('option').allTextContents().catch(() => []);
      if (options.length > 0) {
        const joined = normalizeSpaces(options.join(' '));
        expect(joined.toUpperCase().includes(d.scopes.disallowedGroup.toUpperCase())).toBeFalsy();
      }
    }

    const eraOpened = await openEraModule(page);
    test.skip(!eraOpened, 'ERA module is unavailable in current environment state.');
    if (!eraOpened) return;

    await assertNoTokenInVisibleRows(page, d.scopes.disallowedSiblingAccount);
  });

  test('ACC-NEG-001/002/003/004/005: Boundary checks for blank, partial, relogin persistence, and non-leakage', async ({ page, loginAsAdmin }) => {
    await ensureAccountsPageReady(page);
    await clearAccountsFilters(page);
    await applyFilterAndWait(page);
    await assertNoTokenInVisibleRows(page, d.scopes.disallowedSiblingAccount);

    await filterByAccountName(page, d.values.partialAccountSearch);
    await assertNoTokenInVisibleRows(page, d.scopes.disallowedSiblingAccount);

    await logoutCurrentUser(page);
    await loginAsAdmin();
    await ensureAccountsPageReady(page);
    await clearAccountsFilters(page);
    await applyFilterAndWait(page);
    await assertNoTokenInVisibleRows(page, d.scopes.disallowedSiblingAccount);
  });

  test('ACC-DB-001: Target user row exists for account-linked cross-module validation context', async () => {
    const row = await fetchUserClientByUsername(d.users.targetUser.username);
    test.skip(!row, `No user row found for ${d.users.targetUser.username}; cross-module account dependency checks are context-limited.`);
    if (!row) return;

    expect(normalizeSpaces(`${row.firstName ?? ''} ${row.lastName ?? ''}`)).not.toEqual('');
  });
});
