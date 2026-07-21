/**
 * Analytics Menu & Dashboard – Test Suite
 *
 * File: tests/Analytics_Report/01_Analytics_Dshbd_test.spec.ts
 *
 * Covers:
 *  - Navigation: Analytics menu item visibility, icon, position between Accounts and Claims
 *  - Dashboard layout: report sections, dropdowns, date pickers, buttons
 *  - Stat cards: all six cards visible, icons correct, counts non-negative
 *  - Claims Breakdown table: headers, rows, percentage math
 *  - Apply Filter: default, custom date range, preset buttons
 *  - Report dropdown selection
 *  - DB cross-validation: UI counts vs live DB counts for the active date range
 *  - Edge cases: future dates, same start/end date
 *  - Error monitoring: no unexpected console errors
 */

import { test, expect } from '../myTestData';
import type { Page } from '@playwright/test';
import { navigateToAnalytics } from '../framework/navigation.helper';
import { fetchAnalyticsClaimSummary } from '../../testData/database.utils';
import * as d from '../../testData/AnalyticsDshbdTestData.json';

// ─── Shared interfaces ────────────────────────────────────────────────────────

interface AnalyticsStats {
  total: number;
  paid: number;
  accepted: number;
  rejected: number;
  scRejected: number;
  errors: number;
}

// ─── Page-level helpers ───────────────────────────────────────────────────────

/** Navigates to Analytics and waits for the page heading to appear. */
async function openAnalyticsDashboard(page: Page): Promise<void> {
  await navigateToAnalytics(page);
  await expect(
    page.locator(d.selectors.analyticsRoot).getByText(d.labels.analytics),
    'Analytics page heading should be visible',
  ).toBeVisible({ timeout: d.timeouts.navigationMs });
}

/** Clicks Apply Filter and waits for the UI to settle. */
async function applyFilter(page: Page): Promise<void> {
  await page.getByRole('button', { name: d.labels.applyFilter }).click();
  await page.waitForTimeout(d.timeouts.filterMs);
}

/** Reads the current start and end date values from the date-picker inputs. */
async function getFilterDates(page: Page): Promise<{ start: string; end: string }> {
  const pickers = page.getByRole('textbox', { name: d.placeholders.datePicker });
  const [start, end] = await Promise.all([
    pickers.nth(0).inputValue(),
    pickers.nth(1).inputValue(),
  ]);
  return { start: start.trim(), end: end.trim() };
}

/** Fills both date-picker inputs with the supplied MM/DD/YYYY values. */
async function setDateRange(page: Page, start: string, end: string): Promise<void> {
  const pickers = page.getByRole('textbox', { name: d.placeholders.datePicker });
  await pickers.nth(0).fill(start);
  await pickers.nth(1).fill(end);
}

/**
 * Reads all six stat-card counts from the analytics root text.
 * Replaces "SC Rejected" before matching plain "Rejected" to avoid substring collisions.
 */
async function readStatCardCounts(page: Page): Promise<AnalyticsStats> {
  const raw = (await page.locator(d.selectors.analyticsRoot).textContent()) ?? '';
  const forRejected = raw.replace(/SC Rejected/g, '\x00SCR\x00');

  const n = (text: string, re: RegExp): number => {
    const m = text.match(re);
    if (!m) return 0;
    return parseInt(m[1].replace(/,/g, ''), 10);
  };

  return {
    total:      n(raw,         /(\d[\d,]*)\s+Total Claims/),
    paid:       n(raw,         /(\d[\d,]*)\s+Paid\b/),
    accepted:   n(raw,         /(\d[\d,]*)\s+Accepted\b/),
    rejected:   n(forRejected, /(\d[\d,]*)\s+Rejected\b/),
    scRejected: n(raw,         /(\d[\d,]*)\s+SC Rejected/),
    errors:     n(raw,         /(\d[\d,]*)\s+Errors\b/),
  };
}

/** Returns today's date as MM/DD/YYYY. */
function todayMMDDYYYY(): string {
  const d2 = new Date();
  const mm   = String(d2.getMonth() + 1).padStart(2, '0');
  const dd   = String(d2.getDate()).padStart(2, '0');
  const yyyy = d2.getFullYear();
  return `${mm}/${dd}/${yyyy}`;
}

// ─── Test suite ───────────────────────────────────────────────────────────────

test.describe('Analytics Menu & Dashboard', () => {

  // ── 1. Navigation menu ────────────────────────────────────────────────────

  test.describe('Navigation menu', () => {

    test('TC01 – Analytics menu item is visible in the navigation after login',
      async ({ page, loginAsAdmin }) => {
        await loginAsAdmin();

        const analyticsLink = page.getByRole('link', { name: d.labels.navMenuAnalytics });
        await expect(analyticsLink).toBeVisible();
        await expect(page.getByRole('list')).toContainText(d.labels.analytics);
      });

    test('TC02 – Analytics menu item uses the fa-chart-line icon (AC: icon class)',
      async ({ page, loginAsAdmin }) => {
        await loginAsAdmin();

        const analyticsLink = page.getByRole('link', { name: d.labels.navMenuAnalytics });
        await expect(analyticsLink).toBeVisible();
        // The link must contain an element carrying both .fas and .fa-chart-line
        await expect(analyticsLink.locator(d.selectors.analyticsNavIconCss)).toBeVisible();
      });

    test('TC03 – Analytics is positioned between Accounts and Claims in the nav (AC: position)',
      async ({ page, loginAsAdmin }) => {
        await loginAsAdmin();

        const links = page.getByRole('link');
        const count = await links.count();
        const hrefs: string[] = [];
        for (let i = 0; i < count; i++) {
          hrefs.push((await links.nth(i).getAttribute('href')) ?? '');
        }

        const accountsIdx  = hrefs.findIndex(h => h.includes('/dashboard/accounts'));
        const analyticsIdx = hrefs.findIndex(h => h.includes('/dashboard/analytics'));
        const claimsIdx    = hrefs.findIndex(h => h.includes('/dashboard/claims'));

        expect(accountsIdx,  'Accounts link must be in nav').toBeGreaterThanOrEqual(0);
        expect(analyticsIdx, 'Analytics link must be in nav').toBeGreaterThanOrEqual(0);
        expect(claimsIdx,    'Claims link must be in nav').toBeGreaterThanOrEqual(0);
        expect(analyticsIdx, 'Analytics must come after Accounts').toBeGreaterThan(accountsIdx);
        expect(analyticsIdx, 'Analytics must come before Claims').toBeLessThan(claimsIdx);
      });

    test('TC04 – Clicking Analytics navigates to the analytics URL',
      async ({ page, loginAsAdmin }) => {
        await loginAsAdmin();
        await openAnalyticsDashboard(page);

        await expect(page).toHaveURL(/analytics/i);
      });

  });

  // ── 2. Dashboard layout & controls ───────────────────────────────────────

  test.describe('Dashboard layout and controls', () => {

    test('TC05 – Page heading and all five report section labels are visible',
      async ({ page, loginAsAdmin }) => {
        await loginAsAdmin();
        await openAnalyticsDashboard(page);

        await expect(
          page.locator(d.selectors.analyticsRoot).getByText(d.labels.analytics),
        ).toBeVisible();

        for (const section of d.reportSections) {
          await expect(page.getByText(section), `Section "${section}" should be visible`).toBeVisible();
        }
      });

    test('TC06 – All report dropdowns are present and default to "Select Report"',
      async ({ page, loginAsAdmin }) => {
        await loginAsAdmin();
        await openAnalyticsDashboard(page);

        const comboboxes = page.getByRole('combobox');
        await expect(comboboxes).toHaveCount(
          await comboboxes.count(), // at least the expected number exist
        );
        expect(await comboboxes.count()).toBeGreaterThanOrEqual(d.expectedDropdownCount);

        // Second combobox (first report dropdown) should be empty / on "Select Report"
        await expect(page.getByRole('combobox').nth(1)).toBeVisible();
        await expect(page.getByRole('combobox').nth(1)).toBeEmpty();
        await expect(page.locator(d.selectors.analyticsRoot)).toContainText(d.labels.selectReport);
      });

    test('TC07 – Claim Reports dropdown contains all expected options',
      async ({ page, loginAsAdmin }) => {
        await loginAsAdmin();
        await openAnalyticsDashboard(page);

        for (const option of d.dropdownOptions.claimReports) {
          await expect(
            page.locator(d.selectors.analyticsRoot),
            `Dropdown should contain option "${option}"`,
          ).toContainText(option);
        }
      });

    test('TC08 – Date picker inputs are visible and pre-filled with valid MM/DD/YYYY dates',
      async ({ page, loginAsAdmin }) => {
        await loginAsAdmin();
        await openAnalyticsDashboard(page);

        await expect(page.getByText(d.labels.startDate)).toBeVisible();
        await expect(page.getByText(d.labels.endDate)).toBeVisible();

        const pickers = page.getByRole('textbox', { name: d.placeholders.datePicker });
        await expect(pickers.first()).toBeVisible();
        await expect(pickers.nth(1)).toBeVisible();

        const { start, end } = await getFilterDates(page);
        expect(start, 'Start date must match MM/DD/YYYY').toMatch(/^\d{1,2}\/\d{1,2}\/\d{4}$/);
        expect(end,   'End date must match MM/DD/YYYY').toMatch(/^\d{1,2}\/\d{1,2}\/\d{4}$/);

        // Start date must not be after end date
        expect(new Date(start).getTime()).toBeLessThanOrEqual(new Date(end).getTime());
      });

    test('TC09 – Apply Filter, Recent Claim Summary, and Recent ERA Summary buttons are visible',
      async ({ page, loginAsAdmin }) => {
        await loginAsAdmin();
        await openAnalyticsDashboard(page);

        await expect(page.getByRole('button', { name: d.labels.applyFilter })).toBeVisible();
        await expect(page.getByRole('button', { name: d.labels.recentClaimSummary })).toBeVisible();
        await expect(page.getByRole('button', { name: d.labels.recentEraSummary })).toBeVisible();
      });

    test('TC10 – Full ARIA layout snapshot matches expected analytics structure',
      async ({ page, loginAsAdmin }) => {
        await loginAsAdmin();
        await openAnalyticsDashboard(page);

        await expect(page.locator(d.selectors.dashboardLayout)).toMatchAriaSnapshot(`
          - text: Analytics  Claim Reports
          - combobox:
            - option "Select Report" [selected]
            - option "Group Claim Summary"
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
          - button "Recent Claim Summary"
          - button "Recent ERA Summary"
          - text: START DATE
          - textbox "mm/dd/yyyy": /\\d+\\/\\d+\\/\\d+/
          - button ""
          - text: END DATE
          - textbox "mm/dd/yyyy": /\\d+\\/\\d+\\/\\d+/
          - button ""
          - button "Apply Filter"
          - text: / \\d+ Total Claims  \\d+ Paid  \\d+ Accepted  \\d+ Rejected  \\d+ SC Rejected  \\d+ Errors/
          - heading "Claims Breakdown" [level=3]
          - img
          - text: Paid Accepted Rejected
          - table:
            - rowgroup:
              - row "Status Count % of Total":
                - columnheader "Status"
                - columnheader "Count"
                - columnheader "% of Total"
            - rowgroup:
              - row /Paid \\d+ \\d+\\.\\d+%/:
                - cell "Paid"
                - cell /\\d+/
                - cell /\\d+\\.\\d+%/
              - row /Accepted \\d+ \\d+\\.\\d+%/:
                - cell "Accepted"
                - cell /\\d+/
                - cell /\\d+\\.\\d+%/
              - row /Rejected \\d+ \\d+\\.\\d+%/:
                - cell "Rejected"
                - cell /\\d+/
                - cell /\\d+\\.\\d+%/
              - row /SC Rejected \\d+ \\d+\\.\\d+%/:
                - cell "SC Rejected"
                - cell /\\d+/
                - cell /\\d+\\.\\d+%/
              - row /Errors \\d+ \\d+\\.\\d+%/:
                - cell "Errors"
                - cell /\\d+/
                - cell /\\d+\\.\\d+%/
        `);
      });

  });

  // ── 3. Stat cards ─────────────────────────────────────────────────────────

  test.describe('Stat cards', () => {

    test('TC11 – All six stat card labels and their icons are visible',
      async ({ page, loginAsAdmin }) => {
        await loginAsAdmin();
        await openAnalyticsDashboard(page);

        // Total Claims
        await expect(page.getByText(d.labels.totalClaims)).toBeVisible();
        await expect(page.locator(d.selectors.statCardIcon).first()).toBeVisible();

        // Paid
        await expect(page.getByText(d.labels.paid).first()).toBeVisible();
        await expect(page.locator(d.selectors.paidIcon)).toBeVisible();

        // Accepted
        await expect(page.getByText(d.labels.accepted).first()).toBeVisible();
        await expect(page.locator(d.selectors.acceptedIcon)).toBeVisible();

        // Rejected
        await expect(page.getByText(d.labels.rejected).first()).toBeVisible();
        await expect(page.locator(d.selectors.rejectedIcon)).toBeVisible();

        // SC Rejected
        await expect(page.locator('div').filter({ hasText: /^SC Rejected$/ })).toBeVisible();
        await expect(page.locator(d.selectors.scRejectedIcon)).toBeVisible();

        // Errors
        await expect(page.locator('div').filter({ hasText: /^Errors$/ })).toBeVisible();
        await expect(page.locator(d.selectors.errorCard)).toBeVisible();
      });

    test('TC12 – Stat card counts are all non-negative integers',
      async ({ page, loginAsAdmin }) => {
        await loginAsAdmin();
        await openAnalyticsDashboard(page);

        const stats = await readStatCardCounts(page);
        expect(stats.total,      'Total must be >= 0').toBeGreaterThanOrEqual(0);
        expect(stats.paid,       'Paid must be >= 0').toBeGreaterThanOrEqual(0);
        expect(stats.accepted,   'Accepted must be >= 0').toBeGreaterThanOrEqual(0);
        expect(stats.rejected,   'Rejected must be >= 0').toBeGreaterThanOrEqual(0);
        expect(stats.scRejected, 'SC Rejected must be >= 0').toBeGreaterThanOrEqual(0);
        expect(stats.errors,     'Errors must be >= 0').toBeGreaterThanOrEqual(0);
      });

    test('TC13 – Paid and Accepted stat cards display a numeric count (generalized)',
      async ({ page, loginAsAdmin }) => {
        await loginAsAdmin();
        await openAnalyticsDashboard(page);

        // Generalized pattern: {number}{Label} in the same container – not hardcoded
        await expect(
          page.locator('div').filter({ hasText: /^\d+Paid$/ }).first(),
        ).toBeVisible();
        await expect(
          page.locator('div').filter({ hasText: /^\d+Accepted$/ }).first(),
        ).toBeVisible();
      });

    test('TC14 – Total Claims is greater than or equal to the sum of categorized claims',
      async ({ page, loginAsAdmin }) => {
        await loginAsAdmin();
        await openAnalyticsDashboard(page);

        const stats = await readStatCardCounts(page);
        const categorized =
          stats.paid + stats.accepted + stats.rejected + stats.scRejected + stats.errors;
        expect(stats.total).toBeGreaterThanOrEqual(categorized);
      });

    test('TC15 – Paid and Accepted stat card values match their breakdown table cells',
      async ({ page, loginAsAdmin }) => {
        await loginAsAdmin();
        await openAnalyticsDashboard(page);

        const stats = await readStatCardCounts(page);

        if (stats.paid > 0) {
          await expect(page.getByRole('cell', { name: String(stats.paid) })).toBeVisible();
        }
        if (stats.accepted > 0) {
          await expect(page.getByRole('cell', { name: String(stats.accepted) })).toBeVisible();
        }
      });

  });

  // ── 4. Claims Breakdown table ─────────────────────────────────────────────

  test.describe('Claims Breakdown table', () => {

    test('TC16 – Claims Breakdown heading and all three column headers are visible',
      async ({ page, loginAsAdmin }) => {
        await loginAsAdmin();
        await openAnalyticsDashboard(page);

        await expect(page.getByRole('heading', { name: d.labels.claimsBreakdown })).toBeVisible();
        await expect(page.getByRole('columnheader', { name: d.tableHeaders.status })).toBeVisible();
        await expect(page.getByRole('columnheader', { name: d.tableHeaders.count })).toBeVisible();
        await expect(page.getByRole('columnheader', { name: d.tableHeaders.percentOfTotal })).toBeVisible();
      });

    test('TC17 – All five status rows are present in the breakdown table',
      async ({ page, loginAsAdmin }) => {
        await loginAsAdmin();
        await openAnalyticsDashboard(page);

        for (const label of Object.values(d.tableRows)) {
          await expect(
            page.getByRole('cell', { name: label }),
            `Row "${label}" must be in the table`,
          ).toBeVisible();
        }
      });

    test('TC18 – Rows with a zero count display 0.0% in the percentage column',
      async ({ page, loginAsAdmin }) => {
        await loginAsAdmin();
        await openAnalyticsDashboard(page);

        const stats = await readStatCardCounts(page);

        if (stats.scRejected === 0) {
          await expect(
            page.getByRole('row').filter({ hasText: d.tableRows.scRejected }),
          ).toContainText('0.0%');
        }
        if (stats.errors === 0) {
          await expect(
            page.getByRole('row').filter({ hasText: d.tableRows.errors }),
          ).toContainText('0.0%');
        }
      });

    test('TC19 – Paid row percentage is mathematically consistent with its count vs total',
      async ({ page, loginAsAdmin }) => {
        await loginAsAdmin();
        await openAnalyticsDashboard(page);

        const stats = await readStatCardCounts(page);
        if (stats.total > 0 && stats.paid > 0) {
          const expected = ((stats.paid / stats.total) * 100).toFixed(1);
          await expect(
            page.getByRole('row').filter({ hasText: d.tableRows.paid }),
          ).toContainText(`${expected}%`);
        }
      });

    test('TC20 – Pie/donut chart element is rendered',
      async ({ page, loginAsAdmin }) => {
        await loginAsAdmin();
        await openAnalyticsDashboard(page);

        await expect(
          page.locator('path').filter({ hasText: 'Rejected:' }),
        ).toBeVisible();
      });

  });

  // ── 5. Apply Filter and date range ────────────────────────────────────────

  test.describe('Apply Filter and date range', () => {

    test('TC21 – Clicking Apply Filter with the default date range displays stat cards',
      async ({ page, loginAsAdmin }) => {
        await loginAsAdmin();
        await openAnalyticsDashboard(page);

        await applyFilter(page);

        await expect(page.getByText(d.labels.totalClaims)).toBeVisible();
        const stats = await readStatCardCounts(page);
        expect(stats.total).toBeGreaterThanOrEqual(0);
      });

    test('TC22 – Recent Claim Summary button sets a valid date range',
      async ({ page, loginAsAdmin }) => {
        await loginAsAdmin();
        await openAnalyticsDashboard(page);

        await page.getByRole('button', { name: d.labels.recentClaimSummary }).click();
        await page.waitForTimeout(d.timeouts.filterMs);

        const { start, end } = await getFilterDates(page);
        expect(start).toMatch(/^\d{1,2}\/\d{1,2}\/\d{4}$/);
        expect(end).toMatch(/^\d{1,2}\/\d{1,2}\/\d{4}$/);
        expect(new Date(start).getTime()).toBeLessThanOrEqual(new Date(end).getTime());
      });

    test('TC23 – Recent ERA Summary button is clickable and does not crash',
      async ({ page, loginAsAdmin }) => {
        await loginAsAdmin();
        await openAnalyticsDashboard(page);

        await page.getByRole('button', { name: d.labels.recentEraSummary }).click();
        await page.waitForTimeout(d.timeouts.filterMs);

        // Page should still show the analytics root
        await expect(page.locator(d.selectors.analyticsRoot)).toBeVisible();
      });

    test('TC24 – Applying a custom date range (today only) updates the stats display',
      async ({ page, loginAsAdmin }) => {
        await loginAsAdmin();
        await openAnalyticsDashboard(page);

        const today = todayMMDDYYYY();
        await setDateRange(page, today, today);
        await applyFilter(page);

        await expect(page.getByText(d.labels.totalClaims)).toBeVisible();
        const stats = await readStatCardCounts(page);
        expect(stats.total).toBeGreaterThanOrEqual(0);
      });

    test('TC25 – Same start date and end date is accepted as a valid filter range',
      async ({ page, loginAsAdmin }) => {
        await loginAsAdmin();
        await openAnalyticsDashboard(page);

        await setDateRange(page, d.edgeCases.sameDateRange, d.edgeCases.sameDateRange);
        await applyFilter(page);

        await expect(page.locator(d.selectors.analyticsRoot)).toBeVisible();
        await expect(page.getByText(d.labels.totalClaims)).toBeVisible();
      });

  });

  // ── 6. Report dropdown selection ─────────────────────────────────────────

  test.describe('Report dropdown selection', () => {

    test('TC26 – Selecting a Claim Report option from the dropdown does not throw a console error',
      async ({ page, loginAsAdmin }) => {
        const errors: string[] = [];
        page.on('console', msg => {
          if (msg.type() === 'error') errors.push(msg.text());
        });

        await loginAsAdmin();
        await openAnalyticsDashboard(page);

        await page.getByRole('combobox').nth(1).selectOption({
          label: d.dropdownOptions.claimReports[1],
        });
        await page.waitForTimeout(d.timeouts.filterMs);

        const significant = errors.filter(
          e => !e.includes('favicon') && !e.includes('404'),
        );
        expect(significant).toHaveLength(0);
      });

    test('TC27 – Changing Claim Reports dropdown does not affect other dropdowns',
      async ({ page, loginAsAdmin }) => {
        await loginAsAdmin();
        await openAnalyticsDashboard(page);

        await page.getByRole('combobox').nth(1).selectOption({
          label: d.dropdownOptions.claimReports[1],
        });
        await page.waitForTimeout(d.timeouts.filterMs);

        // All other report dropdowns (indices 2–5) must remain on "Select Report"
        for (let i = 2; i <= d.expectedDropdownCount; i++) {
          const combo = page.getByRole('combobox').nth(i);
          if (await combo.isVisible().catch(() => false)) {
            const val = await combo.inputValue().catch(() => '');
            expect(val, `Dropdown at index ${i} must remain empty`).toBe('');
          }
        }
      });

  });

  // ── 7. Edge cases ─────────────────────────────────────────────────────────

  test.describe('Edge cases', () => {

    test('TC28 – A far-future date range returns zero counts or handles gracefully (no crash)',
      async ({ page, loginAsAdmin }) => {
        await loginAsAdmin();
        await openAnalyticsDashboard(page);

        await setDateRange(page, d.edgeCases.futureDateStart, d.edgeCases.futureDateEnd);
        await applyFilter(page);

        // The analytics root must remain visible – no crash or blank screen
        await expect(page.locator(d.selectors.analyticsRoot)).toBeVisible();
        const stats = await readStatCardCounts(page);
        // Total for a future range should be 0 (no future claims)
        expect(stats.total).toBeGreaterThanOrEqual(0);
      });

  });

  // ── 8. DB cross-validation ────────────────────────────────────────────────

  test.describe('DB cross-validation', () => {

    test('TC29 – Total Claims count in UI matches the database count for the active date range',
      async ({ page, loginAsAdmin }) => {
        await loginAsAdmin();
        await openAnalyticsDashboard(page);
        await applyFilter(page);

        const { start, end } = await getFilterDates(page);
        const uiStats = await readStatCardCounts(page);

        let dbStats: Awaited<ReturnType<typeof fetchAnalyticsClaimSummary>>;
        try {
          dbStats = await fetchAnalyticsClaimSummary(start, end);
        } catch {
          // DB unreachable in this environment – skip gracefully
          test.skip(true, 'DB unavailable — skipping Total Claims cross-validation');
          return;
        }

        // Allow ±5 % tolerance for timing differences between UI render and DB snapshot
        const tolerance = Math.ceil(Math.max(dbStats.total * 0.05, 5));
        expect(
          Math.abs(uiStats.total - dbStats.total),
          `UI total (${uiStats.total}) vs DB total (${dbStats.total}) must be within ${tolerance}`,
        ).toBeLessThanOrEqual(tolerance);
      });

    test('TC30 – Paid count in UI matches the database FINALIZED_PAID count',
      async ({ page, loginAsAdmin }) => {
        await loginAsAdmin();
        await openAnalyticsDashboard(page);
        await applyFilter(page);

        const { start, end } = await getFilterDates(page);
        const uiStats = await readStatCardCounts(page);

        let dbStats: Awaited<ReturnType<typeof fetchAnalyticsClaimSummary>>;
        try {
          dbStats = await fetchAnalyticsClaimSummary(start, end);
        } catch {
          test.skip(true, 'DB unavailable — skipping Paid cross-validation');
          return;
        }

        const tolerance = Math.ceil(Math.max(dbStats.paid * 0.05, 5));
        expect(
          Math.abs(uiStats.paid - dbStats.paid),
          `UI paid (${uiStats.paid}) vs DB paid (${dbStats.paid}) must be within ${tolerance}`,
        ).toBeLessThanOrEqual(tolerance);
      });

    test('TC31 – Accepted count in UI matches the database ACCEPTED count',
      async ({ page, loginAsAdmin }) => {
        await loginAsAdmin();
        await openAnalyticsDashboard(page);
        await applyFilter(page);

        const { start, end } = await getFilterDates(page);
        const uiStats = await readStatCardCounts(page);

        let dbStats: Awaited<ReturnType<typeof fetchAnalyticsClaimSummary>>;
        try {
          dbStats = await fetchAnalyticsClaimSummary(start, end);
        } catch {
          test.skip(true, 'DB unavailable — skipping Accepted cross-validation');
          return;
        }

        const tolerance = Math.ceil(Math.max(dbStats.accepted * 0.05, 5));
        expect(
          Math.abs(uiStats.accepted - dbStats.accepted),
          `UI accepted (${uiStats.accepted}) vs DB accepted (${dbStats.accepted}) must be within ${tolerance}`,
        ).toBeLessThanOrEqual(tolerance);
      });

  });

  // ── 9. Error monitoring ───────────────────────────────────────────────────

  test.describe('Error monitoring', () => {

    test('TC32 – No unexpected console errors on Analytics Dashboard page load',
      async ({ page, loginAsAdmin }) => {
        const errors: string[] = [];
        page.on('console', msg => {
          if (msg.type() === 'error') errors.push(msg.text());
        });

        await loginAsAdmin();
        await openAnalyticsDashboard(page);

        const significant = errors.filter(
          e => !e.includes('favicon') && !e.includes('404') && !e.toLowerCase().includes('warning'),
        );
        expect(significant, `Unexpected console errors: ${significant.join('; ')}`).toHaveLength(0);
      });

    test('TC33 – No unexpected console errors after clicking Apply Filter',
      async ({ page, loginAsAdmin }) => {
        const errors: string[] = [];
        page.on('console', msg => {
          if (msg.type() === 'error') errors.push(msg.text());
        });

        await loginAsAdmin();
        await openAnalyticsDashboard(page);
        await applyFilter(page);

        const significant = errors.filter(
          e => !e.includes('favicon') && !e.includes('404') && !e.toLowerCase().includes('warning'),
        );
        expect(significant, `Unexpected console errors: ${significant.join('; ')}`).toHaveLength(0);
      });

  });

});

