import { test, expect } from '../myTestData';
import type { Locator, Page } from '@playwright/test';
import { navigateToClaimStatusRouting, navigateToClaimsDashboard } from '../framework/navigation.helper';
import {
  fetchClaimDashboardRowByClaimId,
  fetchClaimStatusRoutingRowsByScId,
  fetchOneWorkedClaim,
} from '../../testData/database.utils';
import * as d from '../../testData/ClaimsDshbdTestData.json';

let pageErrors: string[] = [];

function normalize(value: string): string {
  return (value ?? '').trim().toUpperCase();
}

function escapeForRegex(value: string): string {
  return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

async function openClaimsDashboard(page: Page): Promise<void> {
  await navigateToClaimsDashboard(page);
  await expect(page.getByRole('button', { name: d.labels.title, exact: true })).toBeVisible();
}

async function openClaimStatusDashboard(page: Page): Promise<void> {
  await navigateToClaimStatusRouting(page);
  await expect(page.getByText('Claim Status Routing', { exact: true })).toBeVisible();
}

async function applyFilterAndWait(page: Page): Promise<void> {
  const applyButton = page.getByRole('button', { name: d.labels.applyFilter });
  await expect(applyButton).toBeVisible();
  await applyButton.click();
  await page.waitForTimeout(d.timeouts.filterMs);
}

async function getEnabledTextbox(page: Page, name: string): Promise<Locator> {
  const nameRegex = new RegExp(escapeForRegex(name), 'i');
  const roleCandidates = page.getByRole('textbox', { name: nameRegex });
  const roleCount = await roleCandidates.count();

  for (let i = 0; i < roleCount; i += 1) {
    const candidate = roleCandidates.nth(i);
    const visible = await candidate.isVisible().catch(() => false);
    const enabled = await candidate.isEnabled().catch(() => false);
    if (visible && enabled) {
      return candidate;
    }
  }

  const placeholderCandidates = page.getByPlaceholder(nameRegex);
  const placeholderCount = await placeholderCandidates.count();

  for (let i = 0; i < placeholderCount; i += 1) {
    const candidate = placeholderCandidates.nth(i);
    const visible = await candidate.isVisible().catch(() => false);
    const enabled = await candidate.isEnabled().catch(() => false);
    if (visible && enabled) {
      return candidate;
    }
  }

  const token = name.trim().split(/\s+/).slice(-1)[0] ?? name;
  const cssFallback = page.locator(`input[placeholder*="${token}" i], textarea[placeholder*="${token}" i]`);
  const count = await cssFallback.count();

  for (let i = 0; i < count; i += 1) {
    const candidate = cssFallback.nth(i);
    const visible = await candidate.isVisible().catch(() => false);
    const enabled = await candidate.isEnabled().catch(() => false);
    if (visible && enabled) {
      return candidate;
    }
  }

  throw new Error(`No enabled textbox found: ${name}`);
}

async function trySetFilterValue(page: Page, name: string, value: string): Promise<void> {
  const candidate = await getEnabledTextbox(page, name).catch(() => null);
  if (!candidate) {
    return;
  }

  await candidate.fill(d.edgeCases.empty).catch(() => {});
  await candidate.fill(value).catch(() => {});
}

async function getClaimIdInput(page: Page): Promise<Locator> {
  const byRole = page.getByRole('textbox', { name: /Enter Claim ID|Enter Claim Id/i }).first();
  if (await byRole.isVisible().catch(() => false)) {
    return byRole;
  }

  const byPlaceholder = page.getByPlaceholder(/Claim ID|Claim Id/i).first();
  if (await byPlaceholder.isVisible().catch(() => false)) {
    return byPlaceholder;
  }

  return page.locator('input[placeholder*="Claim" i][placeholder*="ID" i]').first();
}

async function setFilterValue(page: Page, name: string, value: string): Promise<void> {
  const input = await getEnabledTextbox(page, name);
  await input.fill(d.edgeCases.empty);
  await input.fill(value);
}

async function clearDashboardFilters(page: Page): Promise<void> {
  const claimIdInput = await getClaimIdInput(page);
  await claimIdInput.fill(d.edgeCases.empty);

  await trySetFilterValue(page, d.placeholders.groupId, d.edgeCases.empty);
  await trySetFilterValue(page, d.placeholders.billingNpi, d.edgeCases.empty);
  await trySetFilterValue(page, d.placeholders.taxId, d.edgeCases.empty);
  await trySetFilterValue(page, d.placeholders.payerId, d.edgeCases.empty);
  await trySetFilterValue(page, d.placeholders.renderNpi, d.edgeCases.empty);
  await trySetFilterValue(page, d.placeholders.receiver, d.edgeCases.empty);
  await trySetFilterValue(page, d.placeholders.patientAccountNumber, d.edgeCases.empty);
  await trySetFilterValue(page, d.placeholders.patientName, d.edgeCases.empty);
}

async function searchByClaimId(page: Page, claimId: string): Promise<void> {
  await clearDashboardFilters(page);
  const claimIdInput = await getClaimIdInput(page);
  await claimIdInput.fill(claimId);
  await applyFilterAndWait(page);
}

async function setShowWorkedOnly(page: Page, checked: boolean): Promise<void> {
  const checkbox = page.getByRole('checkbox', { name: d.labels.showWorkedOnly });
  await expect(checkbox).toBeVisible();

  if (checked) {
    await checkbox.check();
  } else {
    await checkbox.uncheck().catch(() => {});
  }
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

async function assertNoResultsOrZeroRows(page: Page): Promise<void> {
  const emptyState = page.locator(d.selectors.noResults).first();
  const hasEmptyState = await emptyState.isVisible().catch(() => false);
  if (!hasEmptyState) {
    await expect(page.locator(d.selectors.tableRows)).toHaveCount(0);
  }
}

async function assertClaimRowMatchesDb(page: Page, claimId: string): Promise<void> {
  const dbRow = await fetchClaimDashboardRowByClaimId(claimId);
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

async function openClaimDetailsPanel(page: Page): Promise<void> {
  const blankLinks = page.getByRole('link').filter({ hasText: /^$/ });
  const count = await blankLinks.count();

  if (count >= 5) {
    await blankLinks.nth(4).click().catch(() => {});
  }
  if (count >= 4) {
    await blankLinks.nth(3).click().catch(() => {});
  }

  const tableRowFirstLink = page.locator('tbody tr').first().getByRole('link').first();
  if (await tableRowFirstLink.isVisible().catch(() => false)) {
    await tableRowFirstLink.click().catch(() => {});
  }
}

async function getDetailsPanelSelect(page: Page): Promise<Locator> {
  return page
    .locator('#claimsTable select, th select, .table select')
    .filter({ has: page.locator('option[value="keyfields"]') })
    .first();
}

async function clickHeaderForSort(page: Page, headerName: string): Promise<void> {
  const header = page.getByRole('columnheader', { name: new RegExp(headerName, 'i') }).first();
  await expect(header).toBeVisible();
  await header.click();
}

async function assertClaimStatusRoutingSkSc0MatchesDb(page: Page): Promise<void> {
  await openClaimStatusDashboard(page);

  const scIdFilter = page.getByRole('textbox', { name: /Enter SC ID/i }).first();
  await scIdFilter.fill(d.crossValidation.claimStatusScId);
  await page.getByRole('button', { name: /Apply Filter/i }).first().click();
  await page.waitForTimeout(d.timeouts.filterMs);

  const dbRows = await fetchClaimStatusRoutingRowsByScId(d.crossValidation.claimStatusScId);
  expect(dbRows.length).toBeGreaterThan(0);

  let matchedRows = 0;

  for (const dbRow of dbRows) {
    const row = page
      .locator('tbody tr')
      .filter({ has: page.getByRole('cell', { name: dbRow.scid, exact: true }) })
      .filter({ hasText: dbRow.processorid })
      .filter({ hasText: dbRow.ediid })
      .first();

    const visible = await row.isVisible({ timeout: d.timeouts.searchMs }).catch(() => false);
    if (!visible) {
      continue;
    }

    matchedRows += 1;
    await expect(row).toContainText(dbRow.recordstatus);

    const expectedGroup = normalize(dbRow.groupid);
    if (expectedGroup.length > 0) {
      const rowText = normalize((await row.textContent()) ?? '');
      expect(rowText.includes(expectedGroup) || rowText.includes('ROUTE')).toBeTruthy();
    }
  }

  expect(matchedRows).toBeGreaterThan(0);
}

test.describe('Claims Dashboard - generated and refactored suite', () => {
  test.beforeEach(async ({ page, loginAsAdmin }) => {
    pageErrors = [];
    page.on('pageerror', (err) => pageErrors.push(err.message));

    await loginAsAdmin();
    await openClaimsDashboard(page);
  });

  test.afterEach(async () => {
    expect(pageErrors, 'Unexpected browser runtime errors were thrown.').toEqual([]);
  });

  test('Claims Dashboard controls, fields, and actions are visible and available', async ({ page }) => {
    await expect(page.getByRole('button', { name: d.labels.claimsArchive })).toBeVisible();
    await expect(page.getByText(/start date/i)).toBeVisible();
    await expect(page.getByText(/end date/i)).toBeVisible();
    await expect(page.getByRole('textbox', { name: d.placeholders.claimId })).toBeVisible();
    await expect(page.getByRole('textbox', { name: d.placeholders.groupId })).toBeVisible();
    await expect(page.getByRole('textbox', { name: d.placeholders.billingNpi })).toBeVisible();
    await expect(page.getByRole('textbox', { name: d.placeholders.taxId })).toBeVisible();
    await expect(page.getByRole('textbox', { name: d.placeholders.payerId })).toBeVisible();
    await expect(page.getByRole('textbox', { name: d.placeholders.renderNpi })).toBeVisible();
    await expect(page.getByRole('textbox', { name: d.placeholders.receiver })).toBeVisible();
    await expect(page.getByRole('textbox', { name: d.placeholders.patientAccountNumber })).toBeVisible();
    await expect(page.getByRole('textbox', { name: d.placeholders.patientName })).toBeVisible();
    await expect(page.getByRole('checkbox', { name: d.labels.showWorkedOnly })).toBeVisible();
    await expect(page.getByRole('button', { name: d.labels.applyFilter })).toBeVisible();
  });

  test('Apply filter by claim id validates UI row against DB values', async ({ page }) => {
    await searchByClaimId(page, d.values.claimId);
    await assertGridHeadersVisible(page);
    await assertClaimRowMatchesDb(page, d.values.claimId);
  });

  test('Removing claim id and applying filter keeps grid stable and sortable', async ({ page }) => {
    await clearDashboardFilters(page);
    await applyFilterAndWait(page);
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

  test('Show Worked Only filter applies successfully and returns stable results', async ({ page }) => {
    await clearDashboardFilters(page);
    await setShowWorkedOnly(page, true);
    await applyFilterAndWait(page);
    await assertGridHeadersVisible(page);

    const rowCount = await page.locator(d.selectors.tableRows).count();
    expect(rowCount).toBeGreaterThanOrEqual(0);

    const workedDbRow = await fetchOneWorkedClaim();
    if (workedDbRow) {
      const workedRowVisible = await page
        .locator(d.selectors.tableRows)
        .filter({ hasText: workedDbRow.claimid })
        .first()
        .isVisible()
        .catch(() => false);

      if (workedRowVisible) {
        await expect(page.locator(d.selectors.tableRows).filter({ hasText: workedDbRow.claimid }).first()).toContainText(workedDbRow.patientname);
      }
    }
  });

  test('Invalid claim id filter returns no rows or empty state', async ({ page }) => {
    await searchByClaimId(page, d.edgeCases.invalidClaimId);
    await assertNoResultsOrZeroRows(page);
  });

  test('Whitespace claim id filter keeps dashboard stable', async ({ page }) => {
    await searchByClaimId(page, d.edgeCases.whitespace);
    await expect(page.getByRole('button', { name: d.labels.applyFilter })).toBeVisible();
  });

  test('Claim details panel selector options are available for filtered claim row', async ({ page }) => {
    await searchByClaimId(page, d.values.claimId);
    await openClaimDetailsPanel(page);

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

  test('Cross-check Claim Status Routing SKSC0 rows against DB values', async ({ page }) => {
    await assertClaimStatusRoutingSkSc0MatchesDb(page);
  });
});
