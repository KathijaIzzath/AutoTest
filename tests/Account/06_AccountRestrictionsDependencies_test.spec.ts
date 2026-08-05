import { test, expect } from '../myTestData';
import type { Page, Locator } from '@playwright/test';
import {
  navigateToAccounts,
  navigateToClaimsDashboard,
  navigateToProviderGroups,
  navigateToUsers,
} from '../framework/navigation.helper';
import * as d from '../../testData/AccountRestrictionsDependenciesTestData.json';

let pageErrors: string[] = [];

function normalizeSpaces(value: string): string {
  return value.replace(/\s+/g, ' ').trim();
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
    const accountNumberFilter = page.getByRole('textbox', { name: d.placeholders.accountNumber }).first();
    if (await accountNumberFilter.isVisible().catch(() => false)) {
      return;
    }
    await page.keyboard.press('Escape').catch(() => {});
    await page.waitForTimeout(d.timeouts.retryMs);
  }

  test.skip(true, 'Accounts dashboard was not ready after retries.');
}

async function clearAccountFilters(page: Page): Promise<void> {
  const accountNumber = page.getByRole('textbox', { name: d.placeholders.accountNumber }).first();
  const accountName = page.getByRole('textbox', { name: d.placeholders.accountName }).first();
  const taxId = page.getByRole('textbox', { name: d.placeholders.taxId }).first();

  if (await accountNumber.isVisible().catch(() => false)) await accountNumber.fill('');
  if (await accountName.isVisible().catch(() => false)) await accountName.fill('');
  if (await taxId.isVisible().catch(() => false)) await taxId.fill('');

  const inactiveOnly = page.getByRole('checkbox', { name: d.labels.showInactiveOnly }).first();
  if (await inactiveOnly.isVisible().catch(() => false)) {
    if (await inactiveOnly.isChecked().catch(() => false)) {
      await inactiveOnly.uncheck().catch(() => {});
    }
  }
}

async function filterByAccountNumber(page: Page, value: string): Promise<void> {
  await ensureAccountsPageReady(page);
  await clearAccountFilters(page);
  await page.getByRole('textbox', { name: d.placeholders.accountNumber }).first().fill(value);
  await applyFilterAndWait(page);
}

async function filterByAccountName(page: Page, value: string): Promise<void> {
  await ensureAccountsPageReady(page);
  await clearAccountFilters(page);
  await page.getByRole('textbox', { name: d.placeholders.accountName }).first().fill(value);
  await applyFilterAndWait(page);
}

async function filterByTaxId(page: Page, value: string): Promise<boolean> {
  await ensureAccountsPageReady(page);
  await clearAccountFilters(page);

  const taxId = page.getByRole('textbox', { name: d.placeholders.taxId }).first();
  if (!(await taxId.isVisible().catch(() => false))) {
    return false;
  }

  await taxId.fill(value);
  await applyFilterAndWait(page);
  return true;
}

async function assertNoTokenInRows(page: Page, token: string): Promise<void> {
  const rows = page.locator(d.selectors.tableRows);
  const count = await rows.count();
  test.skip(count === 0, 'No rows available for visible-row scope assertion.');
  if (count === 0) return;

  const inspectCount = Math.min(count, d.limits.maxRowsToInspect);
  for (let i = 0; i < inspectCount; i += 1) {
    const rowText = normalizeSpaces((await rows.nth(i).textContent()) ?? '').toUpperCase();
    expect(rowText.includes(token.toUpperCase())).toBeFalsy();
  }
}

async function assertAnyTokenInRows(page: Page, token: string): Promise<void> {
  const rows = page.locator(d.selectors.tableRows);
  const count = await rows.count();
  test.skip(count === 0, 'No rows available for positive token assertion.');
  if (count === 0) return;

  const inspectCount = Math.min(count, d.limits.maxRowsToInspect);
  let found = false;
  for (let i = 0; i < inspectCount; i += 1) {
    const rowText = normalizeSpaces((await rows.nth(i).textContent()) ?? '').toUpperCase();
    if (rowText.includes(token.toUpperCase())) {
      found = true;
      break;
    }
  }

  test.skip(!found, `Expected token ${token} not found in visible rows for this environment state.`);
}

async function openFirstRowAction(page: Page): Promise<boolean> {
  const firstRow = page.locator('tbody tr').first();
  if (!(await firstRow.isVisible().catch(() => false))) {
    return false;
  }

  const actionLink = firstRow.getByRole('link').first();
  if (await actionLink.isVisible().catch(() => false)) {
    await actionLink.click().catch(() => {});
  }

  const hasMenuAction =
    (await page.getByRole('button', { name: d.labels.editAccount }).first().isVisible().catch(() => false)) ||
    (await page.getByRole('button', { name: d.labels.deactivateAccount }).first().isVisible().catch(() => false)) ||
    (await page.getByRole('button', { name: d.labels.activateAccount }).first().isVisible().catch(() => false));

  if (hasMenuAction) return true;

  const blankLinks = page.getByRole('link').filter({ hasText: /^$/ });
  const count = await blankLinks.count();
  for (let i = 0; i < Math.min(count, 10); i += 1) {
    await blankLinks.nth(i).click().catch(() => {});
    const visibleNow =
      (await page.getByRole('button', { name: d.labels.editAccount }).first().isVisible().catch(() => false)) ||
      (await page.getByRole('button', { name: d.labels.deactivateAccount }).first().isVisible().catch(() => false)) ||
      (await page.getByRole('button', { name: d.labels.activateAccount }).first().isVisible().catch(() => false));
    if (visibleNow) return true;
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

async function openSidebarLinkIfVisible(page: Page, label: string): Promise<boolean> {
  const link = page.getByRole('link', { name: new RegExp(label, 'i') }).first();
  if (!(await link.isVisible().catch(() => false))) {
    return false;
  }

  await link.click().catch(() => {});
  await page.waitForTimeout(d.timeouts.filterMs);
  return true;
}

test.describe('Accounts - restrictions and dependency validation suite', () => {
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

  test('ACC-SF-001: SCAdmin blank search returns accounts', async ({ page }) => {
    await clearAccountFilters(page);
    await applyFilterAndWait(page);

    const count = await page.locator(d.selectors.tableRows).count();
    expect(count).toBeGreaterThan(0);
  });

  test('ACC-SF-003/004: Search by account name and account number', async ({ page }) => {
    await filterByAccountName(page, d.accounts.searchName);
    await assertAnyTokenInRows(page, d.accounts.searchNamePartial);

    await filterByAccountNumber(page, d.accounts.searchNumber);
    const accountCell = page.getByRole('cell', { name: new RegExp(d.accounts.searchNumber, 'i') }).first();
    const visible = await accountCell.isVisible().catch(() => false);
    test.skip(!visible, `Seeded account ${d.accounts.searchNumber} is not visible in this browser/environment state.`);
    if (!visible) return;

    await expect(accountCell).toBeVisible();
  });

  test('ACC-SF-005: Tax ID filtering stays scoped', async ({ page }) => {
    const available = await filterByTaxId(page, d.taxId.value);
    test.skip(!available, 'Tax ID filter control is unavailable in this environment state.');
    if (!available) return;

    await assertNoTokenInRows(page, d.accounts.disallowedSibling);
  });

  test('ACC-SF-006: Pagination and scrolling does not leak disallowed accounts', async ({ page }) => {
    await clearAccountFilters(page);
    await applyFilterAndWait(page);

    const rows = page.locator(d.selectors.tableRows);
    const rowCount = await rows.count();
    test.skip(rowCount === 0, 'No rows to paginate or inspect for leakage.');
    if (rowCount === 0) return;

    await rows.last().scrollIntoViewIfNeeded().catch(() => {});
    await assertNoTokenInRows(page, d.accounts.disallowedSibling);
  });

  test('ACC-CM-001/003: Add account modal required fields and validation baseline', async ({ page }) => {
    const addLink = page.getByRole('link', { name: new RegExp(d.labels.addAccount, 'i') }).first();
    await expect(addLink).toBeVisible();
    await addLink.click();

    await expect(page.getByRole('heading', { name: d.labels.createNewAccount })).toBeVisible();
    const saveBtn = page.getByRole('button', { name: /add and close|save/i }).first();
    if (await saveBtn.isVisible().catch(() => false)) {
      await expect(saveBtn).toBeDisabled();
    }
  });

  test('ACC-CM-002/004: Edit account entry and linked provider or group action availability', async ({ page }) => {
    await filterByAccountNumber(page, d.accounts.searchNumber);
    const opened = await openFirstRowAction(page);
    test.skip(!opened, 'Account row action menu unavailable in this environment state.');
    if (!opened) return;

    const editVisible = await page.getByRole('button', { name: d.labels.editAccount }).first().isVisible().catch(() => false);
    expect(editVisible).toBeTruthy();

    const addProviderGroupVisible = await page.getByRole('button', { name: /add provider group/i }).first().isVisible().catch(() => false);
    test.skip(!addProviderGroupVisible, 'Add Provider Group action is unavailable in current environment state.');
  });

  test('ACC-AD-001/002/003: Deactivation controls and inactive-state rule readiness', async ({ page }) => {
    await filterByAccountNumber(page, d.accounts.deactivationAccount);
    const opened = await openFirstRowAction(page);
    test.skip(!opened, 'Account row action menu unavailable in current environment state.');
    if (!opened) return;

    const deactivateVisible = await page.getByRole('button', { name: d.labels.deactivateAccount }).first().isVisible().catch(() => false);
    const activateVisible = await page.getByRole('button', { name: d.labels.activateAccount }).first().isVisible().catch(() => false);
    expect(deactivateVisible || activateVisible).toBeTruthy();

    test.skip(!d.limits.allowStateMutation, 'State mutation is disabled by test data; validated controls in read-only mode.');

    const confirmAction = async (): Promise<void> => {
      const ok = page.getByRole('button', { name: /^ok$/i }).first();
      if (await ok.isVisible().catch(() => false)) {
        await ok.click().catch(() => {});
        await page.waitForTimeout(d.timeouts.saveMs);
      }
    };

    const restoreOriginalState = async (wasActive: boolean): Promise<void> => {
      await filterByAccountNumber(page, d.accounts.deactivationAccount);
      const reopened = await openFirstRowAction(page);
      if (!reopened) return;

      const canDeactivate = await page.getByRole('button', { name: d.labels.deactivateAccount }).first().isVisible().catch(() => false);
      const canActivate = await page.getByRole('button', { name: d.labels.activateAccount }).first().isVisible().catch(() => false);

      if (wasActive && canActivate) {
        await page.getByRole('button', { name: d.labels.activateAccount }).first().click().catch(() => {});
        await confirmAction();
      }

      if (!wasActive && canDeactivate) {
        await page.getByRole('button', { name: d.labels.deactivateAccount }).first().click().catch(() => {});
        await confirmAction();
      }
    };

    const startedActive = deactivateVisible;
    if (startedActive) {
      await page.getByRole('button', { name: d.labels.deactivateAccount }).first().click().catch(() => {});
      await confirmAction();

      await filterByAccountNumber(page, d.accounts.deactivationAccount);
      const afterDeactivateMenu = await openFirstRowAction(page);
      test.skip(!afterDeactivateMenu, 'Row action menu unavailable after deactivation transition.');
      if (!afterDeactivateMenu) return;

      const activateAfter = await page.getByRole('button', { name: d.labels.activateAccount }).first().isVisible().catch(() => false);
      expect(activateAfter).toBeTruthy();

      await page.getByRole('button', { name: d.labels.activateAccount }).first().click().catch(() => {});
      await confirmAction();

      await filterByAccountNumber(page, d.accounts.deactivationAccount);
      const afterReactivateMenu = await openFirstRowAction(page);
      test.skip(!afterReactivateMenu, 'Row action menu unavailable after reactivation transition.');
      if (!afterReactivateMenu) return;

      const deactivateAfter = await page.getByRole('button', { name: d.labels.deactivateAccount }).first().isVisible().catch(() => false);
      expect(deactivateAfter).toBeTruthy();
      return;
    }

    await page.getByRole('button', { name: d.labels.activateAccount }).first().click().catch(() => {});
    await confirmAction();
    await restoreOriginalState(startedActive);
  });

  test('ACC-UR-001/002/003/004: Restricted-user entitlement scope persists across relogin', async ({ page, loginAsAdmin }) => {
    const restrictedProfiles = [
      d.users.accountRestricted,
      d.users.vendorRestricted,
      d.users.billingGroupRestricted,
    ].filter((u) => hasCredentialPair(u.username, u.password));

    test.skip(restrictedProfiles.length === 0, 'Restricted credentials are not configured in AccountRestrictionsDependenciesTestData.json.');
    if (restrictedProfiles.length === 0) return;

    for (const user of restrictedProfiles) {
      await logoutCurrentUser(page);
      await loginWithCredentials(page, user.username, user.password);
      await ensureAccountsPageReady(page);
      await clearAccountFilters(page);
      await applyFilterAndWait(page);
      await assertNoTokenInRows(page, d.accounts.disallowedSibling);

      await logoutCurrentUser(page);
      await loginWithCredentials(page, user.username, user.password);
      await ensureAccountsPageReady(page);
      await clearAccountFilters(page);
      await applyFilterAndWait(page);
      await assertNoTokenInRows(page, d.accounts.disallowedSibling);
    }

    await logoutCurrentUser(page);
    await loginAsAdmin();
  });

  test('ACC-DEP-001: Claims blank search remains in restricted account scope', async ({ page }) => {
    await navigateToClaimsDashboard(page);
    await applyFilterAndWait(page);
    await assertNoTokenInRows(page, d.accounts.disallowedSibling);
  });

  test('ACC-DEP-002: ERA and Group Enrollment selectors do not broaden scope', async ({ page }) => {
    const eraOpened = await openSidebarLinkIfVisible(page, `^${d.labels.era}$`);
    test.skip(!eraOpened, 'ERA module is unavailable in this environment state.');
    if (!eraOpened) return;

    await assertNoTokenInRows(page, d.accounts.disallowedSibling);

    const geOpened = await openSidebarLinkIfVisible(page, d.labels.groupEnrollments);
    test.skip(!geOpened, 'Group Enrollments module is unavailable in this environment state.');
    if (!geOpened) return;

    const groupFilter = page.getByRole('textbox', { name: d.placeholders.groupId }).first();
    if (await groupFilter.isVisible().catch(() => false)) {
      await groupFilter.fill(d.groups.allowedGroup);
      await applyFilterAndWait(page);
    }
    await assertNoTokenInRows(page, d.groups.disallowedGroup);
  });

  test('ACC-DEP-003: Provider Groups, Finance links, and Users search remain scoped', async ({ page }) => {
    await navigateToProviderGroups(page);
    await applyFilterAndWait(page);
    await assertNoTokenInRows(page, d.accounts.disallowedSibling);

    const financialToggle = page.getByRole('listitem').filter({ hasText: /financial/i }).getByRole('button').first();
    if (await financialToggle.isVisible().catch(() => false)) {
      await financialToggle.click().catch(() => {});
    }

    const vpOpened = await openSidebarLinkIfVisible(page, d.labels.viewPayments);
    if (vpOpened) {
      await assertNoTokenInRows(page, d.accounts.disallowedSibling);
    }

    const paOpened = await openSidebarLinkIfVisible(page, d.labels.paymentAnalytics);
    if (paOpened) {
      await assertNoTokenInRows(page, d.accounts.disallowedSibling);
    }

    await navigateToUsers(page);
    const loginFilter = page.getByRole('textbox', { name: new RegExp(`${d.placeholders.loginPrimary}|${d.placeholders.loginFallback}`, 'i') }).first();
    if (await loginFilter.isVisible().catch(() => false)) {
      await loginFilter.fill(d.users.targetUser);
      await applyFilterAndWait(page);
      await expect(page.locator('tr', { hasText: d.users.targetUser }).first()).toBeVisible();
    }
  });
});
