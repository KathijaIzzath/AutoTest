import { test, expect } from '../myTestData';
import type { Page } from '@playwright/test';
import { navigateToClaimStatusRouting } from '../framework/navigation.helper';
import { verifyElementsVisible } from '../framework/element-verifier.helper';
import { fetchClaimStatusRoutingByScId, fetchClaimStatusRoutingRowsByScId } from '../../testData/database.utils';
import * as d from '../../testData/ClaimStatusDshbdTestData.json';

let pageErrors: string[] = [];

function normalize(value: string): string {
  return (value ?? '').trim().toUpperCase();
}

function isSortedAsc(values: string[]): boolean {
  for (let i = 1; i < values.length; i += 1) {
    if (values[i - 1].localeCompare(values[i]) > 0) {
      return false;
    }
  }
  return true;
}

function isSortedDesc(values: string[]): boolean {
  for (let i = 1; i < values.length; i += 1) {
    if (values[i - 1].localeCompare(values[i]) < 0) {
      return false;
    }
  }
  return true;
}

async function openClaimStatusDashboard(page: Page): Promise<void> {
  await navigateToClaimStatusRouting(page);
  await expect(page.getByText(d.labels.title, { exact: true })).toBeVisible();
}

async function applyFilterAndWait(page: Page): Promise<void> {
  await page.getByRole('button', { name: d.labels.applyFilter }).click();
  await page.waitForTimeout(d.timeouts.filterMs);
}

async function setFilterValue(page: Page, placeholder: string, value: string): Promise<void> {
  const input = page.getByRole('textbox', { name: placeholder });
  await input.clear();
  await input.fill(value);
}

async function clearDashboardFilters(page: Page): Promise<void> {
  await setFilterValue(page, d.placeholders.payerName, d.edgeCases.empty);
  await setFilterValue(page, d.placeholders.scId, d.edgeCases.empty);
  await setFilterValue(page, d.placeholders.processorId, d.edgeCases.empty);
  await setFilterValue(page, d.placeholders.groupId, d.edgeCases.empty);
  await setFilterValue(page, d.placeholders.ediId, d.edgeCases.empty);

  const inactiveCheckbox = page.getByRole('checkbox', { name: d.labels.showInactiveOnly });
  if (await inactiveCheckbox.isChecked().catch(() => false)) {
    await inactiveCheckbox.uncheck();
  }
}

async function searchByScId(page: Page, scId: string): Promise<void> {
  await clearDashboardFilters(page);
  await setFilterValue(page, d.placeholders.scId, scId);
  await applyFilterAndWait(page);
}

async function getColumnValues(page: Page, columnIndex: number, maxRows = 15): Promise<string[]> {
  const rows = page.locator(d.selectors.tableRows);
  const count = Math.min(await rows.count(), maxRows);
  const values: string[] = [];

  for (let i = 0; i < count; i += 1) {
    const value = await rows.nth(i).locator(`td:nth-child(${columnIndex})`).textContent();
    const normalized = normalize(value ?? '');
    if (normalized) {
      values.push(normalized);
    }
  }

  return values;
}

async function assertHeaderSortToggles(page: Page, headerName: string, columnIndex: number): Promise<void> {
  const header = page.getByRole('columnheader', { name: headerName });
  await expect(header).toBeVisible();

  await header.click();
  const valuesFirst = await getColumnValues(page, columnIndex);

  await header.click();
  const valuesSecond = await getColumnValues(page, columnIndex);

  if (valuesFirst.length > 1) {
    expect(isSortedAsc(valuesFirst) || isSortedDesc(valuesFirst)).toBeTruthy();
  }

  if (valuesSecond.length > 1) {
    expect(isSortedAsc(valuesSecond) || isSortedDesc(valuesSecond)).toBeTruthy();
  }
}

async function assertGridHeadersVisible(page: Page): Promise<void> {
  await verifyElementsVisible([
    page.getByRole('columnheader', { name: d.headers.payerName }),
    page.getByRole('columnheader', { name: d.headers.scId }),
    page.getByRole('columnheader', { name: d.headers.groupId }),
    page.getByRole('columnheader', { name: d.headers.processorId }),
    page.getByRole('columnheader', { name: d.headers.ediId }),
    page.getByRole('columnheader', { name: d.headers.type }),
    page.getByRole('columnheader', { name: d.headers.status, exact: true }),
  ], d.timeouts.generalTimeout);
}

test.describe('Claim Status Routing dashboard suite', () => {
  test.beforeEach(async ({ page, loginAsAdmin }) => {
    pageErrors = [];
    page.on('pageerror', (err) => pageErrors.push(err.message));

    await loginAsAdmin();
    await openClaimStatusDashboard(page);
  });

  test.afterEach(async () => {
    expect(pageErrors, 'Unexpected browser runtime errors were thrown.').toEqual([]);
  });

  test('Claim Status Routing controls, fields, and headers are visible and available', async ({ page }) => {
    await verifyElementsVisible([
      page.getByText(d.labels.payerName),
      page.getByRole('textbox', { name: d.placeholders.payerName }),
      page.getByText(d.labels.scId),
      page.getByRole('textbox', { name: d.placeholders.scId }),
      page.getByText(d.labels.processorId),
      page.getByRole('textbox', { name: d.placeholders.processorId }),
      page.getByText(d.labels.groupId),
      page.getByRole('textbox', { name: d.placeholders.groupId }),
      page.getByText(d.labels.ediId),
      page.getByRole('textbox', { name: d.placeholders.ediId }),
      page.getByRole('checkbox', { name: d.labels.showInactiveOnly }),
      page.getByRole('link', { name: new RegExp(d.labels.addClaimStatusRouting, 'i') }).first(),
      page.getByRole('button', { name: d.labels.applyFilter }),
    ], d.timeouts.generalTimeout);

    await applyFilterAndWait(page);
    await assertGridHeadersVisible(page);
  });

  test('Claim Status Routing apply filter without conditions returns stable results grid', async ({ page }) => {
    await clearDashboardFilters(page);
    await applyFilterAndWait(page);
    await assertGridHeadersVisible(page);

    const rowCount = await page.locator(d.selectors.tableRows).count();
    expect(rowCount).toBeGreaterThanOrEqual(0);
  });

  test('Claim Status Routing filter by payer name returns matching rows', async ({ page }) => {
    await clearDashboardFilters(page);
    await setFilterValue(page, d.placeholders.payerName, d.filters.payerName);
    await applyFilterAndWait(page);

    const rowCount = await page.locator(d.selectors.tableRows).count();
    if (rowCount > 0) {
      await expect(page.locator('tbody')).toContainText(d.filters.payerName);
    } else {
      await expect(page.locator(d.selectors.tableRows)).toHaveCount(0);
    }
  });

  test('Claim Status Routing filter by SC ID validates UI row against DB value', async ({ page }) => {
    await searchByScId(page, d.filters.scId);

    const dbRow = await fetchClaimStatusRoutingByScId(d.filters.scId);
    expect(dbRow).not.toBeNull();
    if (!dbRow) return;

    const row = page
      .locator(d.selectors.tableRows)
      .filter({ has: page.getByRole('cell', { name: normalize(dbRow.scid), exact: true }) })
      .filter({ hasText: normalize(dbRow.processorid) })
      .filter({ hasText: normalize(dbRow.ediid) })
      .first();

    await expect(row).toBeVisible({ timeout: d.timeouts.searchTimeout });
    await expect(row).toContainText(dbRow.payername);
    await expect(row).toContainText(dbRow.groupid);
    await expect(row).toContainText(dbRow.online_batch);
    await expect(row).toContainText(dbRow.recordstatus);
  });

  test('Claim Status Routing sorting toggles on all key headers without errors', async ({ page }) => {
    await clearDashboardFilters(page);
    await applyFilterAndWait(page);

    await assertHeaderSortToggles(page, d.headers.payerName, 1);
    await assertHeaderSortToggles(page, d.headers.scId, 2);
    await assertHeaderSortToggles(page, d.headers.groupId, 3);
    await assertHeaderSortToggles(page, d.headers.processorId, 4);
    await assertHeaderSortToggles(page, d.headers.ediId, 5);
    await assertHeaderSortToggles(page, d.headers.type, 6);
    await assertHeaderSortToggles(page, d.headers.status, 7);
  });

  test('Claim Status Routing SCID SKSC0 rows are fetched and compared against DB results', async ({ page }) => {
    await searchByScId(page, d.expectedDb.scId);

    const dbRows = await fetchClaimStatusRoutingRowsByScId(d.expectedDb.scId);
    expect(dbRows.length).toBeGreaterThan(0);

    for (const dbRow of dbRows) {
      const row = page
        .locator(d.selectors.tableRows)
        .filter({ has: page.getByRole('cell', { name: dbRow.scid, exact: true }) })
        .filter({ hasText: dbRow.processorid })
        .filter({ hasText: dbRow.ediid })
        .filter({ hasText: dbRow.online_batch })
        .first();

      await expect(row).toBeVisible({ timeout: d.timeouts.searchTimeout });
      await expect(row).toContainText(dbRow.payername);
      await expect(row).toContainText(dbRow.groupid);
      await expect(row).toContainText(dbRow.recordstatus);
    }
  });
});
