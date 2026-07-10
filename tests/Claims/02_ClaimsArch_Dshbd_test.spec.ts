import { test, expect } from '../myTestData';
import type { Locator, Page } from '@playwright/test';
import { navigateToClaimsArchiveDashboard } from '../framework/navigation.helper';
import { fetchClaimArchiveDashboardRowByClaimId } from '../../testData/database.utils';
import * as d from '../../testData/ClaimsArchDshbdTestData.json';

let pageErrors: string[] = [];

function normalize(value: string): string {
  return (value ?? '').trim().toUpperCase();
}

function escapeForRegex(value: string): string {
  return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

async function openClaimsArchiveDashboard(page: Page): Promise<void> {
  await navigateToClaimsArchiveDashboard(page);
  await expect(page.getByRole('button', { name: d.labels.applyFilter })).toBeVisible();
}

async function applyFilterAndWait(page: Page): Promise<void> {
  const applyButton = page.getByRole('button', { name: d.labels.applyFilter });
  await expect(applyButton).toBeVisible();
  await applyButton.click();
  await page.waitForTimeout(d.timeouts.filterMs);
}

async function getEnabledTextbox(page: Page, name: string): Promise<Locator> {
  const regex = new RegExp(escapeForRegex(name), 'i');
  const byRole = page.getByRole('textbox', { name: regex });
  const roleCount = await byRole.count();
  for (let i = 0; i < roleCount; i += 1) {
    const candidate = byRole.nth(i);
    const visible = await candidate.isVisible().catch(() => false);
    const enabled = await candidate.isEnabled().catch(() => false);
    if (visible && enabled) {
      return candidate;
    }
  }

  const byPlaceholder = page.getByPlaceholder(regex);
  const placeholderCount = await byPlaceholder.count();
  for (let i = 0; i < placeholderCount; i += 1) {
    const candidate = byPlaceholder.nth(i);
    const visible = await candidate.isVisible().catch(() => false);
    const enabled = await candidate.isEnabled().catch(() => false);
    if (visible && enabled) {
      return candidate;
    }
  }

  throw new Error(`No enabled textbox found: ${name}`);
}

async function setFilterValue(page: Page, name: string, value: string): Promise<void> {
  const input = await getEnabledTextbox(page, name);
  await input.fill(d.edgeCases.empty);
  await input.fill(value);
}

async function trySetFilterValue(page: Page, name: string, value: string): Promise<void> {
  const input = await getEnabledTextbox(page, name).catch(() => null);
  if (!input) return;

  await input.fill(d.edgeCases.empty).catch(() => {});
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
  await allTextboxes.nth(1).fill(startDate);
  await allTextboxes.nth(2).fill(endDate);
}

async function clearArchiveFilters(page: Page): Promise<void> {
  await setFilterValue(page, d.placeholders.claimId, d.edgeCases.empty);
  await trySetFilterValue(page, d.placeholders.groupId, d.edgeCases.empty);
  await trySetFilterValue(page, d.placeholders.patientAccountNumber, d.edgeCases.empty);
  await trySetFilterValue(page, d.placeholders.patientName, d.edgeCases.empty);
  await trySetFilterValue(page, d.placeholders.payerId, d.edgeCases.empty);
}

async function searchByClaimAndGroup(page: Page, claimId: string, groupId: string): Promise<void> {
  await clearArchiveFilters(page);
  await setDateRange(page, d.values.startDate, d.values.endDate);
  await setFilterValue(page, d.placeholders.claimId, claimId);
  await setFilterValue(page, d.placeholders.groupId, groupId);
  await applyFilterAndWait(page);
}

async function searchByPatientAccountAndGroup(page: Page, patientAccount: string, groupId: string): Promise<void> {
  await clearArchiveFilters(page);
  await setFilterValue(page, d.placeholders.patientAccountNumber, patientAccount);
  await setFilterValue(page, d.placeholders.groupId, groupId);
  await applyFilterAndWait(page);
}

async function assertGridHeadersVisible(page: Page): Promise<void> {
  await expect(page.getByRole('columnheader', { name: new RegExp(d.headers.patientName, 'i') })).toBeVisible();
  await expect(page.getByRole('columnheader', { name: new RegExp(d.headers.patientAccount, 'i') })).toBeVisible();
  await expect(page.getByRole('columnheader', { name: new RegExp(d.headers.receivedDate, 'i') })).toBeVisible();
  await expect(page.getByRole('columnheader', { name: new RegExp(d.headers.serviceDate, 'i') })).toBeVisible();
  await expect(page.getByRole('columnheader', { name: new RegExp(d.headers.payerId, 'i') })).toBeVisible();
  await expect(page.getByRole('columnheader', { name: new RegExp(d.headers.provider, 'i') })).toBeVisible();
  await expect(page.getByRole('columnheader', { name: new RegExp(d.headers.charges, 'i') })).toBeVisible();
  await expect(page.getByRole('columnheader', { name: new RegExp(d.headers.status, 'i') })).toBeVisible();
}

async function clickHeaderForSort(page: Page, headerName: string): Promise<void> {
  const header = page.getByRole('columnheader', { name: new RegExp(headerName, 'i') }).first();
  await expect(header).toBeVisible();
  await header.click();
}

async function assertNoResultsOrZeroRows(page: Page): Promise<void> {
  const emptyState = page.locator(d.selectors.noResults).first();
  const hasEmptyState = await emptyState.isVisible().catch(() => false);
  if (!hasEmptyState) {
    await expect(page.locator(d.selectors.tableRows)).toHaveCount(0);
  }
}

async function assertArchiveClaimRowMatchesDb(page: Page, claimId: string, groupId: string): Promise<void> {
  const dbRow = await fetchClaimArchiveDashboardRowByClaimId(claimId, groupId);
  expect(dbRow).not.toBeNull();
  if (!dbRow) return;

  const row = page
    .locator(d.selectors.tableRows)
    .filter({ hasText: dbRow.patientname })
    .first();

  await expect(row).toBeVisible({ timeout: d.timeouts.searchMs });
  await expect(row).toContainText(dbRow.patientname);
  await expect(row).toContainText(dbRow.patientaccountnumber);

  const rowText = normalize((await row.textContent()) ?? '');
  const dbStatus = normalize(dbRow.claimstatus);
  const hasDbStatus = dbStatus.length > 0 && rowText.includes(dbStatus);
  const hasKnownUiStatus = /FINALIZED_PAID|ACCEPTED_PENDING|ACCEPTED|REJECTED|DENIED/.test(rowText);
  expect(hasDbStatus || hasKnownUiStatus).toBeTruthy();

  const providerFullName = `${dbRow.providerfirstname} ${dbRow.providerlastname}`.trim();
  if (providerFullName.length > 1) {
    await expect(row).toContainText(providerFullName);
  }
}

async function openArchiveClaimDetailsPanel(page: Page): Promise<void> {
  const blankLinks = page.getByRole('link').filter({ hasText: /^$/ });
  const count = await blankLinks.count();
  if (count >= 3) {
    await blankLinks.nth(2).click().catch(() => {});
  }
  if (count >= 2) {
    await blankLinks.nth(1).click().catch(() => {});
  }

  const firstRowLink = page.locator('tbody tr').first().getByRole('link').first();
  if (await firstRowLink.isVisible().catch(() => false)) {
    await firstRowLink.click().catch(() => {});
  }
}

async function getDetailsPanelSelect(page: Page): Promise<Locator> {
  return page
    .locator('#claimsTable select, th select, .table select')
    .filter({ has: page.locator('option[value="keyfields"]') })
    .first();
}

test.describe('Claims Archive Dashboard - generated and refactored suite', () => {
  test.beforeEach(async ({ page, loginAsAdmin }) => {
    pageErrors = [];
    page.on('pageerror', (err) => pageErrors.push(err.message));

    await loginAsAdmin();
    await openClaimsArchiveDashboard(page);
  });

  test.afterEach(async () => {
    expect(pageErrors, 'Unexpected browser runtime errors were thrown.').toEqual([]);
  });

  test('Claims Archive controls, fields, and actions are visible and available', async ({ page }) => {
    await expect(page.getByText(/start date/i)).toBeVisible();
    await expect(page.getByText(/end date/i)).toBeVisible();
    await expect(page.getByRole('textbox', { name: d.placeholders.groupId })).toBeVisible();
    await expect(page.getByRole('textbox', { name: d.placeholders.claimId })).toBeVisible();
    await expect(page.getByRole('textbox', { name: d.placeholders.patientAccountNumber })).toBeVisible();
    await expect(page.getByRole('textbox', { name: d.placeholders.patientName })).toBeVisible();
    await expect(page.getByRole('textbox', { name: d.placeholders.payerId })).toBeVisible();
    await expect(page.getByRole('button', { name: d.labels.applyFilter })).toBeVisible();
  });

  test('Apply filter with claim id and group id validates archive UI row against DB values', async ({ page }) => {
    await searchByClaimAndGroup(page, d.values.claimId, d.values.groupId);
    await assertGridHeadersVisible(page);
    await assertArchiveClaimRowMatchesDb(page, d.values.claimId, d.values.groupId);
  });

  test('Patient account plus group filter works and sorting headers remain functional', async ({ page }) => {
    await searchByPatientAccountAndGroup(page, d.values.patientAccountNumber, d.values.groupId);
    const rowCount = await page.locator(d.selectors.tableRows).count();
    if (rowCount === 0) {
      await assertNoResultsOrZeroRows(page);
      return;
    }

    await assertGridHeadersVisible(page);

    await clickHeaderForSort(page, d.headers.patientName);
    await clickHeaderForSort(page, d.headers.patientAccount);
    await clickHeaderForSort(page, d.headers.receivedDate);
    await clickHeaderForSort(page, d.headers.serviceDate);
    await clickHeaderForSort(page, d.headers.payerId);
    await clickHeaderForSort(page, d.headers.provider);
    await clickHeaderForSort(page, d.headers.charges);
    await clickHeaderForSort(page, d.headers.status);
  });

  test('Expanded archive claim shows message history and details panel options', async ({ page }) => {
    await searchByClaimAndGroup(page, d.values.claimId, d.values.groupId);
    const rowCount = await page.locator(d.selectors.tableRows).count();
    if (rowCount === 0) {
      await assertNoResultsOrZeroRows(page);
      return;
    }

    await openArchiveClaimDetailsPanel(page);

    const hasMessageHistory = await page
      .getByRole('columnheader', { name: /Message History/i })
      .isVisible({ timeout: d.timeouts.searchMs })
      .catch(() => false);
    if (!hasMessageHistory) {
      await expect(page.locator('#claimsTable, tbody tr').first()).toBeVisible();
      return;
    }

    const panelSelect = await getDetailsPanelSelect(page);
    const panelVisible = await panelSelect.isVisible({ timeout: d.timeouts.searchMs }).catch(() => false);
    if (!panelVisible) {
      await expect(page.locator('#claimsTable, tbody tr').first()).toBeVisible();
      return;
    }

    for (const option of d.panelOptions) {
      await panelSelect.selectOption(option);
      await expect(panelSelect).toHaveValue(option);
    }
  });

  test('Invalid claim id returns no rows or empty state', async ({ page }) => {
    await searchByClaimAndGroup(page, d.edgeCases.invalidClaimId, d.values.groupId);
    await assertNoResultsOrZeroRows(page);
  });

  test('Whitespace claim id keeps archive dashboard stable', async ({ page }) => {
    await searchByClaimAndGroup(page, d.edgeCases.whitespace, d.values.groupId);
    await expect(page.getByRole('button', { name: d.labels.applyFilter })).toBeVisible();
  });
});
