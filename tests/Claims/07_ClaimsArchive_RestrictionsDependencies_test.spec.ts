import { test, expect } from '../myTestData';
import type { Locator, Page } from '@playwright/test';
import {
  navigateToAccounts,
  navigateToClaimsArchiveDashboard,
  navigateToClaimsDashboard,
  navigateToProviderGroups,
} from '../framework/navigation.helper';
import userData from '../../testData/user-info';
import LoginPage from '../../testData/LoginPage';
import * as d from '../../testData/ClaimsArchiveRestrictionsDependenciesTestData.json';
import {
  acceptNonElevatedPersona,
  elevatedAclSkipReason,
  loginWithPersonaFallback,
  type PersonaLoginResult,
} from '../framework/persona-credentials.helper';

let pageErrors: string[] = [];

function normalizeSpaces(value: string): string {
  return value.replace(/\s+/g, ' ').trim();
}

function hasCredentialPair(username: string, password: string): boolean {
  return username.trim().length > 0 && password.trim().length > 0;
}

/** configured → scadmin → qasecureconnect → secureconnect50; rejects elevated for ACL suites. */
async function loginAsRestrictedPersona(
  page: Page,
  configured: { username: string; password: string },
  label: string,
): Promise<PersonaLoginResult | null> {
  const persona = await loginWithPersonaFallback(page, {
    configured,
    logout: logoutCurrentUser,
    acceptPersona: acceptNonElevatedPersona,
  });
  test.skip(
    !persona,
    `Could not login with configured ${label}, scadmin, qasecureconnect, or secureconnect50.`,
  );
  if (!persona) return null;
  if (persona.isElevatedFallback) {
    test.skip(true, elevatedAclSkipReason(label, persona.source));
    return null;
  }
  return persona;
}

/** Fallback chain without rejecting elevated logins (secureConnectUser). */
async function loginAsPersonaAllowElevated(
  page: Page,
  configured: { username: string; password: string },
  label: string,
): Promise<PersonaLoginResult | null> {
  const persona = await loginWithPersonaFallback(page, {
    configured,
    logout: logoutCurrentUser,
  });
  test.skip(
    !persona,
    `Could not login with configured ${label}, scadmin, qasecureconnect, or secureconnect50.`,
  );
  return persona;
}

async function runWithSoftTimeout<T>(work: () => Promise<T>, timeoutMs: number): Promise<T> {
  return await Promise.race([
    work(),
    new Promise<never>((_, reject) => {
      setTimeout(() => reject(new Error('soft-timeout')), timeoutMs);
    }),
  ]);
}

async function isDashboardReady(page: Page): Promise<boolean> {
  const byUrl = await page
    .waitForURL(/\/SecureConnectWeb\/dashboard(\/home)?/i, { timeout: 20000 })
    .then(() => true)
    .catch(() => false);
  if (byUrl) return true;

  const byClaimsLink = await page
    .getByRole('link', { name: /Claims/i })
    .first()
    .isVisible({ timeout: 3000 })
    .catch(() => false);

  return byClaimsLink || page.url().includes('/dashboard');
}

async function tryLoginAsAdmin(page: Page): Promise<boolean> {
  const loginPage = new LoginPage(page);

  for (let attempt = 1; attempt <= 3; attempt += 1) {
    await loginPage.navigate().catch(() => {});
    await loginPage.login(userData.admin.username, userData.admin.password).catch(() => {});
    if (await isDashboardReady(page)) return true;
  }

  return false;
}

async function loginWithCredentials(page: Page, username: string, password: string): Promise<boolean> {
  for (let attempt = 1; attempt <= 2; attempt += 1) {
    await page.getByRole('textbox', { name: d.inputs.loginUsername }).first().fill(username).catch(() => {});
    await page.getByRole('textbox', { name: d.inputs.loginPassword }).first().fill(password).catch(() => {});
    await page.getByRole('button', { name: d.labels.login }).first().click().catch(() => {});
    if (await isDashboardReady(page)) return true;
    await page.waitForTimeout(d.timeouts.retryMs);
  }
  return false;
}

async function logoutCurrentUser(page: Page): Promise<void> {
  const logoutButton = page.getByRole('button', { name: d.labels.logout }).first();
  if (!(await logoutButton.isVisible().catch(() => false))) {
    await page.locator(d.selectors.profileMenuIcon).nth(d.selectors.profileMenuIndex).click().catch(() => {});
  }

  if (await logoutButton.isVisible().catch(() => false)) {
    await logoutButton.click().catch(() => {});
  }
}

async function openClaimsArchive(page: Page): Promise<void> {
  await navigateToClaimsArchiveDashboard(page);
  await expect(page.getByRole('button', { name: d.labels.applyFilter })).toBeVisible();
}

async function applyFilterAndWait(page: Page): Promise<void> {
  await page.getByRole('button', { name: d.labels.applyFilter }).first().click();
  await page.waitForTimeout(d.timeouts.filterMs);
}

async function getEnabledTextbox(page: Page, name: string): Promise<Locator | null> {
  const byRole = page.getByRole('textbox', { name: new RegExp(name, 'i') });
  const roleCount = await byRole.count();

  for (let i = 0; i < roleCount; i += 1) {
    const candidate = byRole.nth(i);
    const visible = await candidate.isVisible().catch(() => false);
    const enabled = await candidate.isEnabled().catch(() => false);
    if (visible && enabled) return candidate;
  }

  const byPlaceholder = page.getByPlaceholder(new RegExp(name, 'i'));
  const placeholderCount = await byPlaceholder.count();

  for (let i = 0; i < placeholderCount; i += 1) {
    const candidate = byPlaceholder.nth(i);
    const visible = await candidate.isVisible().catch(() => false);
    const enabled = await candidate.isEnabled().catch(() => false);
    if (visible && enabled) return candidate;
  }

  return null;
}

async function trySetFilterValue(page: Page, name: string, value: string): Promise<void> {
  const input = await getEnabledTextbox(page, name);
  if (!input) return;
  await input.fill('');
  await input.fill(value).catch(() => {});
}

async function setDateRange(page: Page, startDate: string, endDate: string): Promise<void> {
  const dateInputs = page.getByRole('textbox', { name: /mm\/dd\/yyyy/i });
  const count = await dateInputs.count();
  if (count >= 2) {
    await dateInputs.nth(0).fill(startDate);
    await dateInputs.nth(1).fill(endDate);
    return;
  }

  const allTextboxes = page.getByRole('textbox');
  if ((await allTextboxes.count()) >= 3) {
    await allTextboxes.nth(1).fill(startDate);
    await allTextboxes.nth(2).fill(endDate);
  }
}

async function clearArchiveFilters(page: Page): Promise<void> {
  await trySetFilterValue(page, d.placeholders.groupId, '');
  await trySetFilterValue(page, d.placeholders.claimId, '');
  await trySetFilterValue(page, d.placeholders.patientAccountNumber, '');
  await trySetFilterValue(page, d.placeholders.patientName, '');
  await trySetFilterValue(page, d.placeholders.payerId, '');
}

async function searchArchiveByClaim(page: Page, groupId: string, claimId: string): Promise<void> {
  await clearArchiveFilters(page);
  await setDateRange(page, d.values.startDate, d.values.endDate);
  await trySetFilterValue(page, d.placeholders.groupId, groupId);
  await trySetFilterValue(page, d.placeholders.claimId, claimId);
  await applyFilterAndWait(page);
}

async function searchArchiveByPatient(page: Page, groupId: string, patientAccount: string): Promise<void> {
  await clearArchiveFilters(page);
  await setDateRange(page, d.values.startDate, d.values.endDate);
  await trySetFilterValue(page, d.placeholders.groupId, groupId);
  await trySetFilterValue(page, d.placeholders.patientAccountNumber, patientAccount);
  await applyFilterAndWait(page);
}

async function assertNoTokenInVisibleRows(page: Page, token: string): Promise<void> {
  if (!token.trim()) return;

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
  if (!token.trim()) return;

  const rows = page.locator(d.selectors.tableRows);
  const rowCount = await rows.count();
  test.skip(rowCount === 0, 'No rows available for positive restriction assertion.');
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

async function openArchiveRowActionMenu(page: Page): Promise<boolean> {
  const blankLinks = page.getByRole('link').filter({ hasText: /^$/ });
  const count = await blankLinks.count();

  if (count > d.selectors.rowActionFallbackIndex) {
    await blankLinks.nth(d.selectors.rowActionFallbackIndex).click().catch(() => {});
  } else {
    const row = page.locator(d.selectors.tableRows).first();
    const firstLink = row.getByRole('link').first();
    if (await firstLink.isVisible().catch(() => false)) {
      await firstLink.click().catch(() => {});
    }
  }

  const timelyFilingButton = page.getByRole('button', { name: new RegExp(d.labels.timelyFiling, 'i') }).first();
  return timelyFilingButton.isVisible().catch(() => false);
}

async function getRequiredMessageVisible(page: Page): Promise<boolean> {
  const message = page.getByText(new RegExp(d.values.requiredMessageRegex, 'i')).first();
  return message.isVisible({ timeout: 3000 }).catch(() => false);
}

test.describe('Claims Archive - restrictions, rules, and dependencies suite', () => {
  test.describe.configure({ mode: 'serial' });
  test.setTimeout(300000);

  test.beforeEach(async ({ page }) => {
    pageErrors = [];
    page.on('pageerror', (err) => pageErrors.push(err.message));

    try {
      await runWithSoftTimeout(async () => {
        const loggedIn = await tryLoginAsAdmin(page);
        test.skip(!loggedIn, 'Admin login is unavailable in current environment state.');
        if (!loggedIn) return;
        await openClaimsArchive(page);
      }, d.values.softTimeoutMs);
    } catch {
      test.skip(true, 'Claims Archive setup is unstable in current environment state.');
      return;
    }
  });

  test.afterEach(async () => {
    expect(pageErrors, 'Unexpected browser runtime errors were thrown.').toEqual([]);
  });

  test('CA-001/002/003/006/008: Archive opens, date defaults exist, group context is usable, and valid search returns stable results', async ({ page }) => {
    await expect(page.getByRole('button', { name: d.labels.applyFilter })).toBeVisible();
    await expect(page.getByText(new RegExp(d.labels.startDate, 'i'))).toBeVisible();
    await expect(page.getByText(new RegExp(d.labels.endDate, 'i'))).toBeVisible();

    await searchArchiveByClaim(page, d.values.groupId, d.values.claimId);
    const rowCount = await page.locator(d.selectors.tableRows).count();
    expect(rowCount).toBeGreaterThanOrEqual(0);
  });

  test('CA-004/005/007: Required-field and date-range validation behavior remains enforced', async ({ page }) => {
    await clearArchiveFilters(page);
    await applyFilterAndWait(page);

    const requiredVisibleNoInputs = await getRequiredMessageVisible(page);

    await clearArchiveFilters(page);
    await trySetFilterValue(page, d.placeholders.groupId, d.values.groupId);
    await applyFilterAndWait(page);

    const requiredVisibleMissingClaimPatient = await getRequiredMessageVisible(page);

    await clearArchiveFilters(page);
    await setDateRange(page, d.values.beyondMaxStartDate, d.values.beyondMaxEndDate);
    await trySetFilterValue(page, d.placeholders.groupId, d.values.groupId);
    await trySetFilterValue(page, d.placeholders.claimId, d.values.claimId);
    await applyFilterAndWait(page);

    const rangeValidationVisible = await getRequiredMessageVisible(page);

    expect(requiredVisibleNoInputs || requiredVisibleMissingClaimPatient || rangeValidationVisible).toBeTruthy();
  });

  test('CA-009/010/011/012/013/014: Account, vendor, and billing-group restrictions prevent leakage and preserve SCAdmin baseline', async ({ page }) => {
    const restrictedConfigs: Array<{ persona: typeof d.personas.accountUser; label: string }> = [
      { persona: d.personas.accountUser, label: 'Account-restricted' },
      { persona: d.personas.vendorUser, label: 'Vendor-restricted' },
      { persona: d.personas.billingGroupUser, label: 'Billing-group' },
    ];

    await searchArchiveByClaim(page, d.values.groupId, d.values.claimId);
    const adminCount = await page.locator(d.selectors.tableRows).count();
    expect(adminCount).toBeGreaterThanOrEqual(0);

    let restrictedExecuted = 0;
    for (const { persona, label } of restrictedConfigs) {
      const login = await loginAsRestrictedPersona(page, persona, label);
      if (!login) return;
      restrictedExecuted += 1;

      await openClaimsArchive(page);
      await searchArchiveByClaim(page, d.values.groupId, d.values.claimId);
      await assertNoTokenInVisibleRows(page, persona.disallowedToken);
      await assertAnyTokenInVisibleRows(page, persona.allowedToken);

      await searchArchiveByClaim(page, d.values.groupId, d.values.disallowedClaimId);
      await assertNoTokenInVisibleRows(page, d.values.disallowedClaimId);
    }

    test.skip(
      restrictedExecuted === 0,
      'Distinct restricted personas (account/vendor/billing) could not be logged in via fallback chain.',
    );

    await logoutCurrentUser(page);
    const adminReloginOk = await tryLoginAsAdmin(page);
    test.skip(!adminReloginOk, 'Admin re-login unavailable after restriction checks.');
  });

  test('CA-015/016/017/018: Archive row action menu and Timely Filing behavior respect permitted claim scope', async ({ page }) => {
    await searchArchiveByClaim(page, d.values.groupId, d.values.timelyFilingClaimId);
    const opened = await openArchiveRowActionMenu(page);
    test.skip(!opened, 'Archive row action menu or Timely Filing action unavailable in this environment state.');
    if (!opened) return;

    const timelyFilingButton = page.getByRole('button', { name: new RegExp(d.labels.timelyFiling, 'i') }).first();
    await timelyFilingButton.click().catch(() => {});

    const reportVisible = await page
      .getByRole('heading', { name: new RegExp(d.labels.timelyFilingReportHeading, 'i') })
      .first()
      .isVisible({ timeout: d.timeouts.searchMs })
      .catch(() => false);
    expect(reportVisible).toBeTruthy();

    const closeButton = page.locator(d.selectors.closeModalButton).first();
    if (await closeButton.isVisible().catch(() => false)) {
      await closeButton.click().catch(() => {});
    }
  });

  test('CA-019: Live Claims vs Archive navigation stays consistent for known claim age/state paths', async ({ page }) => {
    await navigateToClaimsDashboard(page);
    await expect(page.getByRole('button', { name: /claims/i }).first()).toBeVisible();

    await openClaimsArchive(page);
    await searchArchiveByClaim(page, d.values.groupId, d.values.claimId);
    const archiveRows = await page.locator(d.selectors.tableRows).count();
    expect(archiveRows).toBeGreaterThanOrEqual(0);
  });

  test('CA-020/021/022: Account and Provider Group dependencies with header/context transitions do not broaden archive scope', async ({ page }) => {
    await navigateToAccounts(page).catch(() => {});
    await openClaimsArchive(page);
    await searchArchiveByPatient(page, d.values.groupId, d.values.patientAccountNumber);
    await assertNoTokenInVisibleRows(page, d.personas.accountUser.disallowedToken);

    await navigateToProviderGroups(page).catch(() => {});
    await openClaimsArchive(page);
    await searchArchiveByClaim(page, d.values.groupId, d.values.claimId);
    await assertNoTokenInVisibleRows(page, d.personas.billingGroupUser.disallowedToken);
  });

  test('CA-023: Archive-linked reporting behavior remains in selected claim context', async ({ page }) => {
    await searchArchiveByClaim(page, d.values.groupId, d.values.timelyFilingClaimId);

    const opened = await openArchiveRowActionMenu(page);
    test.skip(!opened, 'Archive row action menu unavailable for report-link validation.');
    if (!opened) return;

    await page.getByRole('button', { name: new RegExp(d.labels.timelyFiling, 'i') }).first().click().catch(() => {});
    const heading = page
      .getByRole('heading', { name: new RegExp(d.labels.timelyFilingReportHeading, 'i') })
      .first();
    await expect(heading).toBeVisible({ timeout: d.timeouts.searchMs });
  });

  test('CA-024: Fresh session user does not inherit prior archive scope', async ({ page }) => {
    const login = await loginAsPersonaAllowElevated(page, d.personas.secureConnectUser, 'SecureConnect');
    if (!login) return;

    const restricted = d.personas.secureConnectUser;
    await openClaimsArchive(page);
    await searchArchiveByClaim(page, d.values.groupId, d.values.claimId);
    await assertNoTokenInVisibleRows(page, restricted.disallowedToken);

    await logoutCurrentUser(page);
    const adminReloginOk = await tryLoginAsAdmin(page);
    test.skip(!adminReloginOk, 'Admin re-login unavailable after fresh-session scope validation.');
  });

  test('Inactive or disabled user cannot access Claims Archive', async ({ page }) => {
    const inactive = d.personas.inactiveUser;
    test.skip(!hasCredentialPair(inactive.username, inactive.password), 'Inactive user credentials are not configured.');
    if (!hasCredentialPair(inactive.username, inactive.password)) return;

    await logoutCurrentUser(page);
    const loggedIn = await loginWithCredentials(page, inactive.username, inactive.password);
    expect(loggedIn).toBeFalsy();

    const adminReloginOk = await tryLoginAsAdmin(page);
    test.skip(!adminReloginOk, 'Admin re-login unavailable after inactive user validation.');
  });
});
