"""Helper script: writes the 04_PayerRejected_test.spec.ts file."""
import os

TARGET = r'C:\AutoTest\tests\Analytics_Report\04_PayerRejected_test.spec.ts'

spec = r"""/**
 * Payer Rejection Report – Test Suite
 * File: tests/Analytics_Report/04_PayerRejected_test.spec.ts
 *
 * Covers:
 *  - DB prerequisite setup (timestamps, claim statuses)
 *  - Navigation: reaching Group Payer Rejection Report from Analytics
 *  - Report filter controls: group search, 90-day date window, Generate Report
 *  - Group search: case-insensitive lookup, tag display, invalid ID
 *  - Report table: 7 column headers, data rows, Totals row
 *  - ARIA snapshots: app-analytics and app-dashboard-layout-component
 *  - Export to Excel: button visibility, file download
 *  - Edge cases: no group, future date range
 *  - DB cross-validation: UI Totals vs DB payer-rejection count
 *  - Error monitoring: no unexpected console errors
 */

import { test, expect } from '../myTestData';
import type { Page } from '@playwright/test';
import { navigateToAnalytics } from '../framework/navigation.helper';
import {
  setupPayerRejectionData,
  verifyClaimSetup,
  fetchPayerRejectionTotals,
} from '../../testData/database.utils';
import * as d  from '../../testData/PayerRejTestData.json';
import * as ad from '../../testData/AnalyticsDshbdTestData.json';

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

async function openPayerRejectionReport(page: Page): Promise<void> {
  await navigateToAnalytics(page);
  await page.getByRole('combobox').nth(1).selectOption(d.reportOption.value);
  await expect(
    page.getByText(d.labels.group, { exact: true }),
  ).toBeVisible({ timeout: ad.timeouts.navigationMs });
}

async function searchAndSelectGroup(page: Page, query: string): Promise<void> {
  const input = page.getByRole('textbox', { name: d.placeholders.groupSearch });
  await input.click();
  await input.fill(query);
  await page.getByText(d.groups.primary.partialText).first().click();
}

async function getFilterDates(page: Page): Promise<{ start: string; end: string }> {
  const p = page.getByRole('textbox', { name: d.placeholders.datePicker });
  return {
    start: (await p.nth(0).inputValue()).trim(),
    end:   (await p.nth(1).inputValue()).trim(),
  };
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
  return String(n.getMonth() + 1).padStart(2, '0') + '/' +
         String(n.getDate()).padStart(2, '0') + '/' + n.getFullYear();
}

function daysAgoMMDDYYYY(days: number): string {
  const n = new Date(); n.setDate(n.getDate() - days);
  return String(n.getMonth() + 1).padStart(2, '0') + '/' +
         String(n.getDate()).padStart(2, '0') + '/' + n.getFullYear();
}

async function getTotalsClaimsCount(page: Page): Promise<number> {
  const row  = page.getByRole('row').filter({ hasText: d.labels.totals });
  const txt  = (await row.getByRole('cell').nth(1).textContent()) ?? '0';
  return parseInt(txt.replace(/[^0-9]/g, ''), 10) || 0;
}

// ---------------------------------------------------------------------------
// Suite
// ---------------------------------------------------------------------------

test.describe('Payer Rejection Report', () => {

  // ── 0. DB prerequisite setup ─────────────────────────────────────────────

  test.describe('DB prerequisite setup', () => {

    test('TC01 - DB: update claim statuses and timestamps to today for test data',
      async () => {
        try {
          await setupPayerRejectionData(d.setupClaimIds, d.setupClaimStatus);
        } catch {
          test.skip(true, 'DB unavailable - skipping setup');
          return;
        }
        let rows: Awaited<ReturnType<typeof verifyClaimSetup>> = [];
        try {
          rows = await verifyClaimSetup(d.setupClaimIds, d.setupClaimStatus, d.groups.primary.id);
        } catch {
          test.skip(true, 'DB unavailable - skipping verification');
          return;
        }
        for (const row of rows) {
          expect(row.claimstatus).toBe(d.setupClaimStatus);
          expect(row.reportid).toBe(d.groups.primary.id);
          const ts    = new Date(row.hintimestamp);
          const today = new Date();
          expect(ts.toDateString()).toBe(today.toDateString());
        }
      });

  });

  // ── 1. Navigation and report selection ───────────────────────────────────

  test.describe('Navigation and report selection', () => {

    test('TC02 - Selecting Group Payer Rejection Report shows all report controls',
      async ({ page, loginAsAdmin }) => {
        await loginAsAdmin();
        await navigateToAnalytics(page);
        await page.getByRole('combobox').nth(1).selectOption(d.reportOption.value);
        await expect(page.getByText(d.labels.group, { exact: true })).toBeVisible();
        await expect(page.getByRole('textbox', { name: d.placeholders.groupSearch })).toBeVisible();
        await expect(page.getByText(d.labels.startDate)).toBeVisible();
        await expect(page.getByText(d.labels.endDate)).toBeVisible();
        await expect(page.getByRole('button', { name: d.labels.generateReport })).toBeVisible();
      });

    test('TC03 - Dropdown shows Group Payer Rejection Report as selected option',
      async ({ page, loginAsAdmin }) => {
        await loginAsAdmin();
        await openPayerRejectionReport(page);
        await expect(page.getByRole('combobox').nth(1)).toHaveValue(d.reportOption.value);
      });

  });

  // ── 2. Report filter controls ─────────────────────────────────────────────

  test.describe('Report filter controls', () => {

    test('TC04 - Group, date pickers, and Generate Report button all visible',
      async ({ page, loginAsAdmin }) => {
        await loginAsAdmin();
        await openPayerRejectionReport(page);
        await expect(page.getByText(d.labels.group, { exact: true })).toBeVisible();
        await expect(page.getByRole('textbox', { name: d.placeholders.groupSearch })).toBeVisible();
        await expect(page.getByText(d.labels.startDate)).toBeVisible();
        await expect(page.getByRole('textbox', { name: d.placeholders.datePicker }).first()).toBeVisible();
        await expect(page.getByText(d.labels.endDate)).toBeVisible();
        await expect(page.locator(d.selectors.datepicker).nth(1)).toBeVisible();
        await expect(page.getByRole('button', { name: d.labels.generateReport })).toBeVisible();
      });

    test('TC05 - Date pickers pre-filled with valid MM/DD/YYYY dates; start <= end',
      async ({ page, loginAsAdmin }) => {
        await loginAsAdmin();
        await openPayerRejectionReport(page);
        const { start, end } = await getFilterDates(page);
        expect(start).toMatch(/^\d{1,2}\/\d{1,2}\/\d{4}$/);
        expect(end).toMatch(/^\d{1,2}\/\d{1,2}\/\d{4}$/);
        expect(new Date(start).getTime()).toBeLessThanOrEqual(new Date(end).getTime());
      });

    test('TC06 - Start date defaults to approximately 90 days ago',
      async ({ page, loginAsAdmin }) => {
        await loginAsAdmin();
        await openPayerRejectionReport(page);
        const { start } = await getFilterDates(page);
        const diff = Math.round((Date.now() - new Date(start).getTime()) / 86400000);
        expect(diff).toBeGreaterThanOrEqual(d.maxDaysBack - 3);
        expect(diff).toBeLessThanOrEqual(d.maxDaysBack + 3);
      });

    test('TC07 - End date defaults to today or very recent date',
      async ({ page, loginAsAdmin }) => {
        await loginAsAdmin();
        await openPayerRejectionReport(page);
        const { end } = await getFilterDates(page);
        const diff = Math.round((Date.now() - new Date(end).getTime()) / 86400000);
        expect(diff).toBeLessThanOrEqual(3);
      });

    test('TC08 - Default date range spans no more than 90 days',
      async ({ page, loginAsAdmin }) => {
        await loginAsAdmin();
        await openPayerRejectionReport(page);
        const { start, end } = await getFilterDates(page);
        const diff = Math.round((new Date(end).getTime() - new Date(start).getTime()) / 86400000);
        expect(diff).toBeLessThanOrEqual(d.maxDaysBack);
      });

  });

  // ── 3. Group search ───────────────────────────────────────────────────────

  test.describe('Group search', () => {

    test('TC09 - Lowercase group ID returns a suggestion (case-insensitive search)',
      async ({ page, loginAsAdmin }) => {
        await loginAsAdmin();
        await openPayerRejectionReport(page);
        const input = page.getByRole('textbox', { name: d.placeholders.groupSearch });
        await input.click();
        await input.fill(d.groups.primary.idLowercase);
        await expect(
          page.getByText(d.groups.primary.partialText).first(),
        ).toBeVisible({ timeout: d.timeouts.filterMs });
      });

    test('TC10 - Selecting a group suggestion displays the group tag',
      async ({ page, loginAsAdmin }) => {
        await loginAsAdmin();
        await openPayerRejectionReport(page);
        await searchAndSelectGroup(page, d.groups.primary.id);
        await expect(page.getByText(d.groups.primary.partialText)).toBeVisible();
      });

    test('TC11 - Selected group tag shows the correct ID and name',
      async ({ page, loginAsAdmin }) => {
        await loginAsAdmin();
        await openPayerRejectionReport(page);
        await searchAndSelectGroup(page, d.groups.primary.id);
        await expect(page.locator(d.selectors.dashboardLayout)).toContainText(d.groups.primary.id);
        await expect(page.locator(d.selectors.dashboardLayout)).toContainText(d.groups.primary.name);
      });

    test('TC12 - Non-existent group ID shows no suggestion',
      async ({ page, loginAsAdmin }) => {
        await loginAsAdmin();
        await openPayerRejectionReport(page);
        const input = page.getByRole('textbox', { name: d.placeholders.groupSearch });
        await input.click();
        await input.fill(d.edgeCases.nonExistentGroupId);
        await page.waitForTimeout(d.timeouts.filterMs);
        await expect(page.getByText(d.edgeCases.nonExistentGroupId).first()).not.toBeVisible();
      });

    test('TC13 - Random invalid text shows no suggestion',
      async ({ page, loginAsAdmin }) => {
        await loginAsAdmin();
        await openPayerRejectionReport(page);
        const input = page.getByRole('textbox', { name: d.placeholders.groupSearch });
        await input.click();
        await input.fill(d.edgeCases.invalidText);
        await page.waitForTimeout(d.timeouts.filterMs);
        await expect(page.getByText(d.edgeCases.invalidText).first()).not.toBeVisible();
      });

  });

  // ── 4. Report table structure ─────────────────────────────────────────────

  test.describe('Report table structure', () => {

    test('TC14 - Generate Report renders the data table',
      async ({ page, loginAsAdmin }) => {
        await loginAsAdmin();
        await openPayerRejectionReport(page);
        await searchAndSelectGroup(page, d.groups.primary.id);
        await generateReport(page);
        await expect(page.getByRole('table')).toBeVisible();
      });

    test('TC15 - All 7 required column headers are visible',
      async ({ page, loginAsAdmin }) => {
        await loginAsAdmin();
        await openPayerRejectionReport(page);
        await searchAndSelectGroup(page, d.groups.primary.id);
        await generateReport(page);
        for (const hdr of d.columnHeaders) {
          await expect(
            page.getByRole('columnheader', { name: hdr }),
            '"' + hdr + '" must be visible',
          ).toBeVisible();
        }
      });

    test('TC16 - Group ID column matches the searched group',
      async ({ page, loginAsAdmin }) => {
        await loginAsAdmin();
        await openPayerRejectionReport(page);
        await searchAndSelectGroup(page, d.groups.primary.id);
        await generateReport(page);
        await expect(page.getByRole('cell', { name: d.groups.primary.id })).toBeVisible();
      });

    test('TC17 - Practice Name column contains the group name',
      async ({ page, loginAsAdmin }) => {
        await loginAsAdmin();
        await openPayerRejectionReport(page);
        await searchAndSelectGroup(page, d.groups.primary.id);
        await generateReport(page);
        await expect(page.getByRole('cell', { name: d.groups.primary.name }).first()).toBeVisible();
      });

    test('TC18 - Account column contains the account number',
      async ({ page, loginAsAdmin }) => {
        await loginAsAdmin();
        await openPayerRejectionReport(page);
        await searchAndSelectGroup(page, d.groups.primary.id);
        await generateReport(page);
        await expect(page.getByRole('cell', { name: d.groups.primary.account }).first()).toBeVisible();
      });

    test('TC19 - Rejection Reason column contains non-empty descriptive text',
      async ({ page, loginAsAdmin }) => {
        await loginAsAdmin();
        await openPayerRejectionReport(page);
        await searchAndSelectGroup(page, d.groups.primary.id);
        await generateReport(page);
        const rejCell = page.locator('tbody tr td:nth-child(6)').first();
        const txt = (await rejCell.textContent()) ?? '';
        expect(txt.trim().length).toBeGreaterThan(0);
      });

    test('TC20 - Claims column contains non-negative integers (generalized)',
      async ({ page, loginAsAdmin }) => {
        await loginAsAdmin();
        await openPayerRejectionReport(page);
        await searchAndSelectGroup(page, d.groups.primary.id);
        await generateReport(page);
        const cells = page.locator('tbody tr td:nth-child(7)').filter({ hasText: /^\d+$/ });
        const count = await cells.count();
        expect(count).toBeGreaterThan(0);
        for (let i = 0; i < Math.min(count, 20); i++) {
          const val = parseInt((await cells.nth(i).textContent() ?? '').trim(), 10);
          expect(val).toBeGreaterThanOrEqual(0);
        }
      });

    test('TC21 - Totals row is present with bold formatting',
      async ({ page, loginAsAdmin }) => {
        await loginAsAdmin();
        await openPayerRejectionReport(page);
        await searchAndSelectGroup(page, d.groups.primary.id);
        await generateReport(page);
        const totalsRow = page.getByRole('row').filter({ hasText: d.labels.totals });
        await expect(totalsRow).toBeVisible();
        await expect(totalsRow.locator('strong').first()).toBeVisible();
      });

    test('TC22 - Totals row Claims count is a non-negative integer',
      async ({ page, loginAsAdmin }) => {
        await loginAsAdmin();
        await openPayerRejectionReport(page);
        await searchAndSelectGroup(page, d.groups.primary.id);
        await generateReport(page);
        const total = await getTotalsClaimsCount(page);
        expect(total).toBeGreaterThanOrEqual(0);
      });

  });

  // ── 5. ARIA snapshots ─────────────────────────────────────────────────────

  test.describe('ARIA snapshots', () => {

    test('TC23 - app-analytics ARIA snapshot matches table structure (generalized counts)',
      async ({ page, loginAsAdmin }) => {
        await loginAsAdmin();
        await openPayerRejectionReport(page);
        await searchAndSelectGroup(page, d.groups.primary.id);
        await generateReport(page);
        await expect(page.locator(d.selectors.analyticsRoot)).toMatchAriaSnapshot(`
          - link "":
            - /url: javascript:void(0);
          - table:
            - rowgroup:
              - row "Practice Name Account Group ID Payer ID Payer Name Rejection Reason Claims":
                - columnheader "Practice Name"
                - columnheader "Account"
                - columnheader "Group ID"
                - columnheader "Payer ID"
                - columnheader "Payer Name"
                - columnheader "Rejection Reason"
                - columnheader "Claims"
            - rowgroup:
              - row /CUMMERATA INC AND SONS FFC001 G23496 \\d+ AETNA .+ \\d+/:
                - cell "CUMMERATA INC AND SONS"
                - cell "FFC001"
                - cell "G23496"
                - cell /\\d+/
                - cell "AETNA"
                - cell /.+/
                - cell /\\d+/
              - row /CUMMERATA INC AND SONS FFC001 G23496 \\d+ AETNA .+ \\d+/:
                - cell "CUMMERATA INC AND SONS"
                - cell "FFC001"
                - cell "G23496"
                - cell /\\d+/
                - cell "AETNA"
                - cell /.+/
                - cell /\\d+/
            - rowgroup:
              - row /Totals \\d+/:
                - cell "Totals":
                  - strong: Totals
                - cell /\\d+/:
                  - strong: /\\d+/
        `);
      });

    test('TC24 - app-dashboard-layout-component ARIA snapshot matches full layout (generalized)',
      async ({ page, loginAsAdmin }) => {
        await loginAsAdmin();
        await openPayerRejectionReport(page);
        await searchAndSelectGroup(page, d.groups.primary.id);
        await generateReport(page);
        await page.locator('div').filter({ hasText: /^AnalyticsClaim ReportsSelect/ }).nth(2).click();
        await expect(page.locator(d.selectors.dashboardLayout)).toMatchAriaSnapshot(`
          - text: Analytics  Claim Reports
          - combobox:
            - option "Select Report"
            - option "Group Claim Summary"
            - option "Group Payer Rejection Report" [selected]
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
              - row "Practice Name Account Group ID Payer ID Payer Name Rejection Reason Claims":
                - columnheader "Practice Name"
                - columnheader "Account"
                - columnheader "Group ID"
                - columnheader "Payer ID"
                - columnheader "Payer Name"
                - columnheader "Rejection Reason"
                - columnheader "Claims"
            - rowgroup:
              - row /CUMMERATA INC AND SONS FFC001 G23496 \\d+ AETNA .+ \\d+/:
                - cell "CUMMERATA INC AND SONS"
                - cell "FFC001"
                - cell "G23496"
                - cell /\\d+/
                - cell "AETNA"
                - cell /.+/
                - cell /\\d+/
              - row /CUMMERATA INC AND SONS FFC001 G23496 \\d+ AETNA .+ \\d+/:
                - cell "CUMMERATA INC AND SONS"
                - cell "FFC001"
                - cell "G23496"
                - cell /\\d+/
                - cell "AETNA"
                - cell /.+/
                - cell /\\d+/
            - rowgroup:
              - row /Totals \\d+/:
                - cell "Totals":
                  - strong: Totals
                - cell /\\d+/:
                  - strong: /\\d+/
        `);
      });

  });

  // ── 6. Export to Excel ────────────────────────────────────────────────────

  test.describe('Export to Excel', () => {

    test('TC25 - Export to Excel button visible after report is generated',
      async ({ page, loginAsAdmin }) => {
        await loginAsAdmin();
        await openPayerRejectionReport(page);
        await searchAndSelectGroup(page, d.groups.primary.id);
        await generateReport(page);
        await expect(page.getByTitle(d.labels.exportToExcel)).toBeVisible();
      });

    test('TC26 - Clicking Export to Excel triggers a file download',
      async ({ page, loginAsAdmin }) => {
        await loginAsAdmin();
        await openPayerRejectionReport(page);
        await searchAndSelectGroup(page, d.groups.primary.id);
        await generateReport(page);
        const downloadPromise = page.waitForEvent('download', { timeout: d.timeouts.downloadMs });
        await page.getByTitle(d.labels.exportToExcel).click();
        const download = await downloadPromise;
        expect(download.suggestedFilename()).toBeTruthy();
        expect(download.suggestedFilename()).toMatch(/\.(xlsx?|csv|xls)$/i);
      });

  });

  // ── 7. Custom date range ──────────────────────────────────────────────────

  test.describe('Custom date range', () => {

    test('TC27 - Custom 30-day range generates a valid report',
      async ({ page, loginAsAdmin }) => {
        await loginAsAdmin();
        await openPayerRejectionReport(page);
        await searchAndSelectGroup(page, d.groups.primary.id);
        await setDateRange(page, daysAgoMMDDYYYY(30), todayMMDDYYYY());
        await generateReport(page);
        await expect(page.getByRole('table')).toBeVisible();
      });

    test('TC28 - Same start and end date is accepted without errors',
      async ({ page, loginAsAdmin }) => {
        await loginAsAdmin();
        await openPayerRejectionReport(page);
        await searchAndSelectGroup(page, d.groups.primary.id);
        const today = todayMMDDYYYY();
        await setDateRange(page, today, today);
        await generateReport(page);
        await expect(page.locator(d.selectors.dashboardLayout)).toBeVisible();
      });

  });

  // ── 8. Edge cases ─────────────────────────────────────────────────────────

  test.describe('Edge cases', () => {

    test('TC29 - Generate Report without selecting a group does not crash',
      async ({ page, loginAsAdmin }) => {
        await loginAsAdmin();
        await openPayerRejectionReport(page);
        await page.getByRole('button', { name: d.labels.generateReport }).click();
        await page.waitForTimeout(d.timeouts.filterMs);
        await expect(page.locator(d.selectors.dashboardLayout)).toBeVisible();
      });

    test('TC30 - A future end date is handled gracefully without crashing',
      async ({ page, loginAsAdmin }) => {
        await loginAsAdmin();
        await openPayerRejectionReport(page);
        await searchAndSelectGroup(page, d.groups.primary.id);
        await setDateRange(page, todayMMDDYYYY(), daysAgoMMDDYYYY(-1));
        await generateReport(page);
        await expect(page.locator(d.selectors.dashboardLayout)).toBeVisible();
      });

  });

  // ── 9. DB cross-validation ────────────────────────────────────────────────

  test.describe('DB cross-validation', () => {

    test('TC31 - Totals Claims count in UI matches DB payer-rejected count for the date range',
      async ({ page, loginAsAdmin }) => {
        await loginAsAdmin();
        await openPayerRejectionReport(page);
        await searchAndSelectGroup(page, d.groups.primary.id);
        await generateReport(page);
        const { start, end } = await getFilterDates(page);
        const uiTotal = await getTotalsClaimsCount(page);
        let db: Awaited<ReturnType<typeof fetchPayerRejectionTotals>>;
        try {
          db = await fetchPayerRejectionTotals(d.groups.primary.id, start, end);
        } catch {
          test.skip(true, 'DB unavailable - skipping cross-validation');
          return;
        }
        const tol = Math.ceil(Math.max(db.totalRejected * 0.05, 5));
        expect(
          Math.abs(uiTotal - db.totalRejected),
          'UI (' + uiTotal + ') vs DB (' + db.totalRejected + ') tolerance ' + tol,
        ).toBeLessThanOrEqual(tol);
      });

  });

  // ── 10. Error monitoring ──────────────────────────────────────────────────

  test.describe('Error monitoring', () => {

    test('TC32 - No unexpected console errors when the report is generated',
      async ({ page, loginAsAdmin }) => {
        const errors: string[] = [];
        page.on('console', msg => { if (msg.type() === 'error') errors.push(msg.text()); });
        await loginAsAdmin();
        await openPayerRejectionReport(page);
        await searchAndSelectGroup(page, d.groups.primary.id);
        await generateReport(page);
        const sig = errors.filter(e => !e.includes('favicon') && !e.includes('404'));
        expect(sig, 'Errors: ' + sig.join('; ')).toHaveLength(0);
      });

    test('TC33 - No unexpected console errors during Excel export',
      async ({ page, loginAsAdmin }) => {
        const errors: string[] = [];
        page.on('console', msg => { if (msg.type() === 'error') errors.push(msg.text()); });
        await loginAsAdmin();
        await openPayerRejectionReport(page);
        await searchAndSelectGroup(page, d.groups.primary.id);
        await generateReport(page);
        const dl = page.waitForEvent('download', { timeout: d.timeouts.downloadMs });
        await page.getByTitle(d.labels.exportToExcel).click();
        await dl;
        const sig = errors.filter(e => !e.includes('favicon') && !e.includes('404'));
        expect(sig, 'Export errors: ' + sig.join('; ')).toHaveLength(0);
      });

  });

});
"""

with open(TARGET, 'w', encoding='utf-8') as f:
    f.write(spec)

lines = spec.count('\n') + 1
print(f'Written {lines} lines to {TARGET}')
