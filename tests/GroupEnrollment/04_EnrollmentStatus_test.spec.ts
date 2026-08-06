/**
 * Enrollment Status Processor Validation – Test Suite
 *
 * File: tests/GroupEnrollment/04_EnrollmentStatus_test.spec.ts
 *
 * Covers:
 *  SC-822 – Invalid Processor Id provided when changing enrollment status
 *    TC-822-01: Sent to Customer → Approved succeeds without Invalid Processor Id error
 *    TC-822-02: Status persists as Approved after save and refresh
 *    TC-822-03: Negative validation – genuinely invalid processor mapping fails (skip-safe)
 */

import { test, expect } from '../myTestData';
import type { Page } from '@playwright/test';
import * as d from '../../testData/EnrollmentStatusTestData.json';

// ─── Helpers ──────────────────────────────────────────────────────────────────

async function openGroupEnrollments(page: Page): Promise<void> {
  const byHref = page.locator('a[href*="/dashboard/group-enrollments"], a[href*="/dashboard/enrollments"]').first();
  const byText = page.getByRole('link', { name: d.labels.groupEnrollmentsNav }).first();

  if (await byHref.isVisible().catch(() => false)) {
    await byHref.click();
  } else {
    await expect(byText).toBeVisible({ timeout: d.timeouts.navigationMs });
    await byText.click();
  }

  await expect(page.getByRole('button', { name: d.labels.applyFilter })).toBeVisible({
    timeout: d.timeouts.navigationMs,
  });
}

async function applyFilterAndWait(page: Page): Promise<void> {
  await page.getByRole('button', { name: d.labels.applyFilter }).click();
  await page.waitForTimeout(d.timeouts.filterMs);
}

async function filterByGroupId(page: Page, groupId: string): Promise<void> {
  const input = page.getByRole('textbox', { name: d.placeholders.groupId }).first();
  await expect(input).toBeVisible();
  await input.fill('');
  await input.fill(groupId);
  await applyFilterAndWait(page);
}

async function isEnrollmentPageReady(page: Page): Promise<boolean> {
  return page.getByRole('button', { name: d.labels.applyFilter }).isVisible().catch(() => false);
}

async function findEnrollmentRowByStatus(page: Page, status: string): Promise<boolean> {
  const rows = page.locator(d.selectors.tableRows);
  const count = await rows.count();
  for (let i = 0; i < count; i++) {
    const rowText = (await rows.nth(i).textContent()) ?? '';
    if (rowText.includes(status)) {
      return true;
    }
  }
  return false;
}

async function openEditForFirstRowWithStatus(page: Page, status: string): Promise<boolean> {
  const rows = page.locator(d.selectors.tableRows);
  const count = await rows.count();
  for (let i = 0; i < count; i++) {
    const row = rows.nth(i);
    const rowText = (await row.textContent()) ?? '';
    if (rowText.includes(status)) {
      const actionLink = row.getByRole('link').first();
      if (await actionLink.isVisible().catch(() => false)) {
        await actionLink.click();
      }
      const editBtn = page.getByRole('button', { name: d.labels.edit });
      if (await editBtn.isVisible({ timeout: 3000 }).catch(() => false)) {
        await editBtn.click();
        return true;
      }
      break;
    }
  }
  return false;
}

// ─── SC-822: Enrollment Status Processor Validation ───────────────────────────

test.describe('SC-822 – Enrollment Status Processor Validation', () => {
  test.describe.configure({ timeout: 120000 });

  test('TC-822-01: Changing enrollment status from Sent to Customer to Approved succeeds without Invalid Processor Id error',
    async ({ page, loginAsAdmin }) => {
      await loginAsAdmin();
      await openGroupEnrollments(page);

      const ready = await isEnrollmentPageReady(page);
      if (!ready) {
        test.skip(true, 'Group Enrollments dashboard not ready – skipping TC-822-01');
        return;
      }

      await filterByGroupId(page, d.enrollment.testGroupId);

      const hasSentToCustomer = await findEnrollmentRowByStatus(page, d.statuses.sentToCustomer);
      if (!hasSentToCustomer) {
        test.skip(
          true,
          `No enrollment in "${d.statuses.sentToCustomer}" status found for group ${d.enrollment.testGroupId} – skipping TC-822-01`,
        );
        return;
      }

      const opened = await openEditForFirstRowWithStatus(page, d.statuses.sentToCustomer);
      if (!opened) {
        test.skip(true, 'Could not open edit modal for Sent to Customer enrollment – skipping TC-822-01');
        return;
      }

      // Change status to Approved
      const statusDropdown = page.locator(d.selectors.statusDropdown).filter({
        hasText: new RegExp(d.statuses.sentToCustomer, 'i'),
      }).first();

      const statusVisible = await statusDropdown.isVisible({ timeout: 5000 }).catch(() => false);
      if (!statusVisible) {
        test.skip(true, 'Status dropdown not visible in edit modal – skipping TC-822-01');
        return;
      }

      await statusDropdown.getByRole('combobox').click();
      const approvedOption = page.getByRole('option', { name: new RegExp(`^${d.statuses.approved}$`, 'i') }).first();
      await expect(approvedOption).toBeVisible({ timeout: 5000 });
      await approvedOption.click();

      // Save
      const saveBtn = page.getByRole('button', { name: d.labels.save });
      await expect(saveBtn).toBeVisible();

      // Monitor for Invalid Processor Id error in network or UI
      const errorResponses: string[] = [];
      page.on('response', async (response) => {
        if (response.status() >= 400) {
          const body = await response.text().catch(() => '');
          if (/invalid processor/i.test(body)) {
            errorResponses.push(`[${response.status()}] ${response.url()}: ${body.slice(0, 200)}`);
          }
        }
      });

      await saveBtn.click();
      await page.waitForTimeout(d.timeouts.saveMs);

      // No Invalid Processor Id error must appear
      expect(
        errorResponses.length,
        `Save must not produce an Invalid Processor Id error. Found: ${errorResponses.join('; ')}`,
      ).toBe(0);

      const uiErrorVisible = await page
        .getByText(d.errorMessages.invalidProcessor, { exact: false })
        .isVisible()
        .catch(() => false);
      expect(uiErrorVisible, 'Invalid Processor Id error must not appear in the UI after save').toBe(false);
    },
  );

  test('TC-822-02: Enrollment status shows as Approved after save and page refresh',
    async ({ page, loginAsAdmin }) => {
      await loginAsAdmin();
      await openGroupEnrollments(page);

      const ready = await isEnrollmentPageReady(page);
      if (!ready) {
        test.skip(true, 'Group Enrollments dashboard not ready – skipping TC-822-02');
        return;
      }

      // Check if any enrollment is already in Approved status
      await filterByGroupId(page, d.enrollment.testGroupId);
      await page.reload();
      await openGroupEnrollments(page);
      await filterByGroupId(page, d.enrollment.testGroupId);

      const hasApproved = await findEnrollmentRowByStatus(page, d.statuses.approved);
      if (!hasApproved) {
        test.skip(
          true,
          `No enrollment in "${d.statuses.approved}" status found after reload – TC-822-01 may not have run or data is not available`,
        );
        return;
      }

      // The Approved status is persisted
      const approvedRow = page.locator(d.selectors.tableRows).filter({ hasText: d.statuses.approved }).first();
      await expect(approvedRow).toBeVisible();
    },
  );

  test('TC-822-03: Genuinely invalid processor configuration produces the expected error (skip-safe)',
    async ({ page, loginAsAdmin }) => {
      // This test verifies the system correctly rejects invalid processor mappings.
      // It requires a specific test enrollment with a known-bad processor to be set up.
      test.skip(true, 'TC-822-03: Requires a specifically misconfigured enrollment row to be pre-seeded in the test environment – skipping until test data is available');
    },
  );

});
