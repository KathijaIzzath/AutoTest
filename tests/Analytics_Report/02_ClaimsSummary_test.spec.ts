/**
 * Claims Summary Report - Test Suite
 *
 * File: tests/Analytics_Report/02_ClaimsSummary_test.spec.ts
 */

import { test, expect } from '../myTestData';
import type { Page } from '@playwright/test';
import { navigateToAnalytics } from '../framework/navigation.helper';
import { fetchClaimSummaryTotals } from '../../testData/database.utils';
import * as d  from '../../testData/ClaimsSummaryTestData.json';
import * as ad from '../../testData/AnalyticsDshbdTestData.json';

async function openClaimsSummaryReport(page: Page): Promise<void> {
  await navigateToAnalytics(page);
  await page.getByRole('combobox').nth(1).selectOption(d.reportOption.value);
  await expect(page.getByText(d.labels.group, { exact: true })).toBeVisible({ timeout: ad.timeouts.navigationMs });
}

async function searchAndSelectGroup(page: Page, groupId: string): Promise<void> {
  const input = page.getByRole('textbox', { name: d.placeholders.groupSearch });
  await input.click();
  await input.fill(groupId);
  await page.getByText(groupId).first().click();
}

async function getFilterDates(page: Page): Promise<{ start: string; end: string }> {
  const p = page.getByRole('textbox', { name: d.placeholders.datePicker });
  return { start: (await p.nth(0).inputValue()).trim(), end: (await p.nth(1).inputValue()).trim() };
}

async function setDateRange(page: Page, start: string, end: string): Promise<void> {
  const p = page.getByRole('textbox', { name: d.placeholders.datePicker });
  await p.nth(0).fill(start);
  await p.nth(1).fill(end);
}

async function generateReport(page: Page): Promise<void> {
  await page.getByRole('button', { name: d.labels.generateReport }).click();
  await page.waitForTimeout(d.timeouts.reportGenerateMs);
}

function todayMMDDYYYY(): string {
  const n = new Date();
  return `${String(n.getMonth()+1).padStart(2,'0')}/${String(n.getDate()).padStart(2,'0')}/${n.getFullYear()}`;
}

function daysAgoMMDDYYYY(days: number): string {
  const n = new Date(); n.setDate(n.getDate() - days);
  return `${String(n.getMonth()+1).padStart(2,'0')}/${String(n.getDate()).padStart(2,'0')}/${n.getFullYear()}`;
}

async function getTotalsCell(page: Page, colIndex: number): Promise<number> {
  const row = page.getByRole('row').filter({ hasText: d.labels.totals });
  const txt = (await row.getByRole('cell').nth(colIndex).textContent()) ?? '0';
  return parseInt(txt.replace(/[^0-9]/g,''),10) || 0;
}

test.describe('Claims Summary Report', () => {

  test.describe('Navigation and report selection', () => {

    test('TC01 - Claim Reports section with chart-bar icon visible on Analytics', async ({ page, loginAsAdmin }) => {
      await loginAsAdmin();
      await navigateToAnalytics(page);
      await expect(page.getByText(ad.labels.claimReports)).toBeVisible();
      await expect(page.locator(d.selectors.reportTileIcon)).toBeVisible();
    });

    test('TC02 - Selecting Group Claim Summary shows report controls', async ({ page, loginAsAdmin }) => {
      await loginAsAdmin();
      await navigateToAnalytics(page);
      await page.getByRole('combobox').nth(1).selectOption(d.reportOption.value);
      await expect(page.getByText(d.labels.group, { exact: true })).toBeVisible();
      await expect(page.getByRole('textbox', { name: d.placeholders.groupSearch })).toBeVisible();
      await expect(page.getByText(d.labels.startDate)).toBeVisible();
      await expect(page.getByText(d.labels.endDate)).toBeVisible();
      await expect(page.getByRole('button', { name: d.labels.generateReport })).toBeVisible();
    });

    test('TC03 - Claim Reports dropdown shows Group Claim Summary as selected', async ({ page, loginAsAdmin }) => {
      await loginAsAdmin();
      await openClaimsSummaryReport(page);
      await expect(page.getByRole('combobox').nth(1)).toHaveValue(d.reportOption.value);
    });

  });

  test.describe('Report filter controls', () => {

    test('TC04 - Group label and search textbox visible', async ({ page, loginAsAdmin }) => {
      await loginAsAdmin();
      await openClaimsSummaryReport(page);
      await expect(page.getByText(d.labels.group, { exact: true })).toBeVisible();
      await expect(page.getByRole('textbox', { name: d.placeholders.groupSearch })).toBeVisible();
    });

    test('TC05 - START DATE and END DATE pickers visible and pre-filled with valid dates', async ({ page, loginAsAdmin }) => {
      await loginAsAdmin();
      await openClaimsSummaryReport(page);
      await expect(page.getByText(d.labels.startDate)).toBeVisible();
      await expect(page.getByRole('textbox', { name: d.placeholders.datePicker }).first()).toBeVisible();
      await expect(page.getByText(d.labels.endDate)).toBeVisible();
      await expect(page.locator(d.selectors.datepicker).nth(1)).toBeVisible();
      const { start, end } = await getFilterDates(page);
      expect(start).toMatch(/^\d{1,2}\/\d{1,2}\/\d{4}$/);
      expect(end).toMatch(/^\d{1,2}\/\d{1,2}\/\d{4}$/);
      expect(new Date(start).getTime()).toBeLessThanOrEqual(new Date(end).getTime());
    });

    test('TC06 - Generate Report button visible', async ({ page, loginAsAdmin }) => {
      await loginAsAdmin();
      await openClaimsSummaryReport(page);
      await expect(page.getByRole('button', { name: d.labels.generateReport })).toBeVisible();
    });

    test('TC07 - Start date defaults to approximately 90 days ago', async ({ page, loginAsAdmin }) => {
      await loginAsAdmin();
      await openClaimsSummaryReport(page);
      const { start } = await getFilterDates(page);
      const diffDays = Math.round((Date.now() - new Date(start).getTime()) / 86400000);
      expect(diffDays).toBeGreaterThanOrEqual(d.maxDaysBack - 3);
      expect(diffDays).toBeLessThanOrEqual(d.maxDaysBack + 3);
    });

    test('TC08 - End date defaults to today or a very recent date', async ({ page, loginAsAdmin }) => {
      await loginAsAdmin();
      await openClaimsSummaryReport(page);
      const { end } = await getFilterDates(page);
      const diffDays = Math.round((Date.now() - new Date(end).getTime()) / 86400000);
      expect(diffDays).toBeLessThanOrEqual(3);
    });

    test('TC09 - Default date range spans no more than 90 days', async ({ page, loginAsAdmin }) => {
      await loginAsAdmin();
      await openClaimsSummaryReport(page);
      const { start, end } = await getFilterDates(page);
      const diffDays = Math.round((new Date(end).getTime() - new Date(start).getTime()) / 86400000);
      expect(diffDays).toBeLessThanOrEqual(d.maxDaysBack);
    });

  });

  test.describe('Group search', () => {

    test('TC10 - Typing a valid group ID shows a matching suggestion', async ({ page, loginAsAdmin }) => {
      await loginAsAdmin();
      await openClaimsSummaryReport(page);
      const input = page.getByRole('textbox', { name: d.placeholders.groupSearch });
      await input.click();
      await input.fill(d.groups.primary.id);
      await expect(page.getByText(d.groups.primary.id).first()).toBeVisible({ timeout: d.timeouts.filterMs });
    });

    test('TC11 - Selecting a group from suggestions displays the group tag', async ({ page, loginAsAdmin }) => {
      await loginAsAdmin();
      await openClaimsSummaryReport(page);
      await searchAndSelectGroup(page, d.groups.primary.id);
      await expect(
        page.locator('div').filter({ hasText: new RegExp('^' + d.groups.primary.displayText.replace(/[.*+?^${}()|[\]\\]/g,'\\$&') + '$') }).nth(1),
      ).toBeVisible();
    });

    test('TC12 - Selected group tag shows the correct ID and name', async ({ page, loginAsAdmin }) => {
      await loginAsAdmin();
      await openClaimsSummaryReport(page);
      await searchAndSelectGroup(page, d.groups.primary.id);
      await expect(page.locator(d.selectors.dashboardLayout)).toContainText(d.groups.primary.id);
      await expect(page.locator(d.selectors.dashboardLayout)).toContainText(d.groups.primary.name);
    });

    test('TC13 - Searching for a non-existent group shows no suggestion', async ({ page, loginAsAdmin }) => {
      await loginAsAdmin();
      await openClaimsSummaryReport(page);
      const input = page.getByRole('textbox', { name: d.placeholders.groupSearch });
      await input.click();
      await input.fill(d.edgeCases.nonExistentGroupId);
      await page.waitForTimeout(d.timeouts.filterMs);
      await expect(page.getByText(d.edgeCases.nonExistentGroupId).first()).not.toBeVisible();
    });

    test('TC14 - Searching with random invalid text shows no suggestion', async ({ page, loginAsAdmin }) => {
      await loginAsAdmin();
      await openClaimsSummaryReport(page);
      const input = page.getByRole('textbox', { name: d.placeholders.groupSearch });
      await input.click();
      await input.fill(d.edgeCases.invalidText);
      await page.waitForTimeout(d.timeouts.filterMs);
      await expect(page.getByText(d.edgeCases.invalidText).first()).not.toBeVisible();
    });

  });

  test.describe('Report table structure', () => {

    test('TC15 - Generate Report with valid group and default dates renders the table', async ({ page, loginAsAdmin }) => {
      await loginAsAdmin();
      await openClaimsSummaryReport(page);
      await searchAndSelectGroup(page, d.groups.primary.id);
      await generateReport(page);
      await expect(page.locator(d.selectors.datepicker).nth(1)).toBeVisible();
      await expect(page.getByRole('table')).toBeVisible();
    });

    test('TC16 - All required column headers visible after report generation', async ({ page, loginAsAdmin }) => {
      await loginAsAdmin();
      await openClaimsSummaryReport(page);
      await searchAndSelectGroup(page, d.groups.primary.id);
      await generateReport(page);
      for (const header of d.columnHeaders) {
        await expect(page.getByRole('columnheader', { name: header }), `"${header}" must be visible`).toBeVisible();
      }
    });

    test('TC17 - Data rows belong to the searched group (Group ID column matches)', async ({ page, loginAsAdmin }) => {
      await loginAsAdmin();
      await openClaimsSummaryReport(page);
      await searchAndSelectGroup(page, d.groups.primary.id);
      await generateReport(page);
      await expect(page.getByRole('cell', { name: d.groups.primary.id })).toBeVisible();
    });

    test('TC18 - Practice Name column contains the group name', async ({ page, loginAsAdmin }) => {
      await loginAsAdmin();
      await openClaimsSummaryReport(page);
      await searchAndSelectGroup(page, d.groups.primary.id);
      await generateReport(page);
      await expect(page.getByRole('cell', { name: d.groups.primary.name }).first()).toBeVisible();
    });

    test('TC19 - Account column contains the expected account number', async ({ page, loginAsAdmin }) => {
      await loginAsAdmin();
      await openClaimsSummaryReport(page);
      await searchAndSelectGroup(page, d.groups.primary.id);
      await generateReport(page);
      await expect(page.getByRole('cell', { name: d.groups.primary.account }).first()).toBeVisible();
    });

    test('TC20 - Numeric data cells contain non-negative integers (generalized)', async ({ page, loginAsAdmin }) => {
      await loginAsAdmin();
      await openClaimsSummaryReport(page);
      await searchAndSelectGroup(page, d.groups.primary.id);
      await generateReport(page);
      const cells = page.locator('tbody tr td').filter({ hasText: /^\d+$/ });
      const count = await cells.count();
      expect(count).toBeGreaterThan(0);
      for (let i = 0; i < Math.min(count, 30); i++) {
        expect(parseInt((await cells.nth(i).textContent() ?? '').trim(), 10)).toBeGreaterThanOrEqual(0);
      }
    });

    test('TC21 - Totals row is present and shows bold-formatted values', async ({ page, loginAsAdmin }) => {
      await loginAsAdmin();
      await openClaimsSummaryReport(page);
      await searchAndSelectGroup(page, d.groups.primary.id);
      await generateReport(page);
      const totalsRow = page.getByRole('row').filter({ hasText: d.labels.totals });
      await expect(totalsRow).toBeVisible();
      await expect(totalsRow.locator('strong').first()).toBeVisible();
    });

    test('TC22 - Totals row numeric values are all non-negative', async ({ page, loginAsAdmin }) => {
      await loginAsAdmin();
      await openClaimsSummaryReport(page);
      await searchAndSelectGroup(page, d.groups.primary.id);
      await generateReport(page);
      for (let col = 5; col <= 9; col++) {
        expect(await getTotalsCell(page, col), `Totals col ${col} >= 0`).toBeGreaterThanOrEqual(0);
      }
    });

    test('TC23 - Claims Sent total >= sum of all rejection/pass columns', async ({ page, loginAsAdmin }) => {
      await loginAsAdmin();
      await openClaimsSummaryReport(page);
      await searchAndSelectGroup(page, d.groups.primary.id);
      await generateReport(page);
      const sent = await getTotalsCell(page, 5);
      const sc   = await getTotalsCell(page, 6);
      const nr   = await getTotalsCell(page, 7);
      const pr   = await getTotalsCell(page, 8);
      const pass = await getTotalsCell(page, 9);
      expect(sent).toBeGreaterThanOrEqual(sc + nr + pr + pass);
    });

  });

  test.describe('Layout snapshot', () => {

    test('TC24 - Full ARIA snapshot matches expected report layout with generalized counts', async ({ page, loginAsAdmin }) => {
      await loginAsAdmin();
      await openClaimsSummaryReport(page);
      await searchAndSelectGroup(page, d.groups.primary.id);
      await generateReport(page);
      await expect(page.locator(d.selectors.dashboardLayout)).toMatchAriaSnapshot(`
        - text: Analytics  Claim Reports
        - combobox:
          - option "Select Report"
          - option "Group Claim Summary" [selected]
          - option "Group Payer Rejection Report"
          - option "Group SC Rejection Report"
        - text:  Enrollment Reports
        - combobox:
          - option "Select Report" [selected]
        - text:  ERA Reports
        - combobox:
          - option "Select Report" [selected]
        - text:  Admin Reports
        - combobox:
          - option "Select Report" [selected]
        - text:  Other Reports
        - combobox:
          - option "Select Report" [selected]
        - button ""
        - text: Group
        - textbox "Search group..."
        - text:  G23496 – CUMMERATA INC AND SONS
        - button ""
        - text: START DATE
        - textbox "mm/dd/yyyy": /\\d+\\/\\d+\\/\\d+/
        - button ""
        - text: END DATE
        - textbox "mm/dd/yyyy": /\\d+\\/\\d+\\/\\d+/
        - button ""
        - button "Generate Report"
        - link "":
          - /url: javascript:void(0);
        - table:
          - rowgroup:
            - row "Practice Name Account Group ID Payer ID Insurance Plan Claims Sent SC Rejected No Response Payer Rejected Passed":
              - columnheader "Practice Name"
              - columnheader "Account"
              - columnheader "Group ID"
              - columnheader "Payer ID"
              - columnheader "Insurance Plan"
              - columnheader "Claims Sent"
              - columnheader "SC Rejected"
              - columnheader "No Response"
              - columnheader "Payer Rejected"
              - columnheader "Passed"
          - rowgroup:
            - row /CUMMERATA INC AND SONS FFC001 G23496 \\d+ AETNA \\d+ \\d+ \\d+ \\d+ \\d+/:
              - cell "CUMMERATA INC AND SONS"
              - cell "FFC001"
              - cell "G23496"
              - cell /\\d+/
              - cell "AETNA"
              - cell /\\d+/
              - cell /\\d+/
              - cell /\\d+/
              - cell /\\d+/
              - cell /\\d+/
            - row /CUMMERATA INC AND SONS FFC001 G23496 \\S+ AFTRA \\d+ \\d+ \\d+ \\d+ \\d+/:
              - cell "CUMMERATA INC AND SONS"
              - cell "FFC001"
              - cell "G23496"
              - cell /\\S+/
              - cell "AFTRA"
              - cell /\\d+/
              - cell /\\d+/
              - cell /\\d+/
              - cell /\\d+/
              - cell /\\d+/
          - rowgroup:
            - row /Totals \\d+ \\d+ \\d+ \\d+ \\d+/:
              - cell "Totals":
                - strong: Totals
              - cell /\\d+/:
                - strong: /\\d+/
              - cell /\\d+/:
                - strong: /\\d+/
              - cell /\\d+/:
                - strong: /\\d+/
              - cell /\\d+/:
                - strong: /\\d+/
              - cell /\\d+/:
                - strong: /\\d+/
      `);
    });

  });

  test.describe('Export to Excel', () => {

    test('TC25 - Export to Excel button visible after report is generated', async ({ page, loginAsAdmin }) => {
      await loginAsAdmin();
      await openClaimsSummaryReport(page);
      await searchAndSelectGroup(page, d.groups.primary.id);
      await generateReport(page);
      await expect(page.getByTitle(d.labels.exportToExcel)).toBeVisible();
    });

    test('TC26 - Clicking Export to Excel triggers a file download', async ({ page, loginAsAdmin }) => {
      await loginAsAdmin();
      await openClaimsSummaryReport(page);
      await searchAndSelectGroup(page, d.groups.primary.id);
      await generateReport(page);
      const downloadPromise = page.waitForEvent('download', { timeout: d.timeouts.downloadMs });
      await page.getByTitle(d.labels.exportToExcel).click();
      const download = await downloadPromise;
      expect(download.suggestedFilename()).toBeTruthy();
      expect(download.suggestedFilename()).toMatch(/\.(xlsx?|csv|xls)$/i);
    });

  });

  test.describe('Custom date range', () => {

    test('TC27 - Generate Report with a custom 30-day range returns data', async ({ page, loginAsAdmin }) => {
      await loginAsAdmin();
      await openClaimsSummaryReport(page);
      await searchAndSelectGroup(page, d.groups.primary.id);
      await setDateRange(page, daysAgoMMDDYYYY(30), todayMMDDYYYY());
      await generateReport(page);
      await expect(page.getByRole('table')).toBeVisible();
    });

    test('TC28 - Same start and end date accepted without errors', async ({ page, loginAsAdmin }) => {
      await loginAsAdmin();
      await openClaimsSummaryReport(page);
      await searchAndSelectGroup(page, d.groups.primary.id);
      const today = todayMMDDYYYY();
      await setDateRange(page, today, today);
      await generateReport(page);
      await expect(page.locator(d.selectors.dashboardLayout)).toBeVisible();
    });

  });

  test.describe('Edge cases', () => {

    test('TC29 - Generate Report without selecting a group does not crash', async ({ page, loginAsAdmin }) => {
      await loginAsAdmin();
      await openClaimsSummaryReport(page);
      await page.getByRole('button', { name: d.labels.generateReport }).click();
      await page.waitForTimeout(d.timeouts.filterMs);
      await expect(page.locator(d.selectors.dashboardLayout)).toBeVisible();
    });

    test('TC30 - A future end date is handled gracefully without crashing', async ({ page, loginAsAdmin }) => {
      await loginAsAdmin();
      await openClaimsSummaryReport(page);
      await searchAndSelectGroup(page, d.groups.primary.id);
      await setDateRange(page, todayMMDDYYYY(), daysAgoMMDDYYYY(-1));
      await generateReport(page);
      await expect(page.locator(d.selectors.dashboardLayout)).toBeVisible();
    });

  });

  test.describe('DB cross-validation', () => {

    test('TC31 - Claims Sent total in UI Totals row matches database count', async ({ page, loginAsAdmin }) => {
      await loginAsAdmin();
      await openClaimsSummaryReport(page);
      await searchAndSelectGroup(page, d.groups.primary.id);
      await generateReport(page);
      const { start, end } = await getFilterDates(page);
      const uiSent = await getTotalsCell(page, 5);
      let db: Awaited<ReturnType<typeof fetchClaimSummaryTotals>>;
      try { db = await fetchClaimSummaryTotals(d.groups.primary.id, start, end); }
      catch { test.skip(true, 'DB unavailable'); return; }
      const tol = Math.ceil(Math.max(db.claimsSent * 0.05, 5));
      expect(Math.abs(uiSent - db.claimsSent), `UI ${uiSent} vs DB ${db.claimsSent}`).toBeLessThanOrEqual(tol);
    });

    test('TC32 - SC Rejected total in UI Totals row matches database count', async ({ page, loginAsAdmin }) => {
      await loginAsAdmin();
      await openClaimsSummaryReport(page);
      await searchAndSelectGroup(page, d.groups.primary.id);
      await generateReport(page);
      const { start, end } = await getFilterDates(page);
      const uiSC = await getTotalsCell(page, 6);
      let db: Awaited<ReturnType<typeof fetchClaimSummaryTotals>>;
      try { db = await fetchClaimSummaryTotals(d.groups.primary.id, start, end); }
      catch { test.skip(true, 'DB unavailable'); return; }
      const tol = Math.ceil(Math.max(db.scRejected * 0.05, 5));
      expect(Math.abs(uiSC - db.scRejected), `UI ${uiSC} vs DB ${db.scRejected}`).toBeLessThanOrEqual(tol);
    });

    test('TC33 - Payer Rejected total in UI Totals row matches database count', async ({ page, loginAsAdmin }) => {
      await loginAsAdmin();
      await openClaimsSummaryReport(page);
      await searchAndSelectGroup(page, d.groups.primary.id);
      await generateReport(page);
      const { start, end } = await getFilterDates(page);
      const uiPR = await getTotalsCell(page, 8);
      let db: Awaited<ReturnType<typeof fetchClaimSummaryTotals>>;
      try { db = await fetchClaimSummaryTotals(d.groups.primary.id, start, end); }
      catch { test.skip(true, 'DB unavailable'); return; }
      const tol = Math.ceil(Math.max(db.payerRejected * 0.05, 5));
      expect(Math.abs(uiPR - db.payerRejected), `UI ${uiPR} vs DB ${db.payerRejected}`).toBeLessThanOrEqual(tol);
    });

  });

  test.describe('Error monitoring', () => {

    test('TC34 - No unexpected console errors when the report is generated', async ({ page, loginAsAdmin }) => {
      const errors: string[] = [];
      page.on('console', msg => { if (msg.type() === 'error') errors.push(msg.text()); });
      await loginAsAdmin();
      await openClaimsSummaryReport(page);
      await searchAndSelectGroup(page, d.groups.primary.id);
      await generateReport(page);
      const sig = errors.filter(e => !e.includes('favicon') && !e.includes('404'));
      expect(sig, `Errors: ${sig.join('; ')}`).toHaveLength(0);
    });

    test('TC35 - No unexpected console errors during Excel export', async ({ page, loginAsAdmin }) => {
      const errors: string[] = [];
      page.on('console', msg => { if (msg.type() === 'error') errors.push(msg.text()); });
      await loginAsAdmin();
      await openClaimsSummaryReport(page);
      await searchAndSelectGroup(page, d.groups.primary.id);
      await generateReport(page);
      const dl = page.waitForEvent('download', { timeout: d.timeouts.downloadMs });
      await page.getByTitle(d.labels.exportToExcel).click();
      await dl;
      const sig = errors.filter(e => !e.includes('favicon') && !e.includes('404'));
      expect(sig, `Errors: ${sig.join('; ')}`).toHaveLength(0);
    });

  });

});
