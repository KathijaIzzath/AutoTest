import { test, expect } from '../myTestData';
import type { Page } from '@playwright/test';
import { navigateToPayer } from '../framework/navigation.helper';
import * as d from '../../testData/PayerDshbdTestData.json';

// ---------------------------------------------------------------------------
// Reusable helpers
// ---------------------------------------------------------------------------

async function applyFilterAndWait(page: Page): Promise<void> {
  await page.getByRole('button', { name: d.labels.applyFilter }).click();
  await page.waitForTimeout(d.timeouts.filterTimeout);
}

async function clearAndFillFilter(page: Page, placeholder: string, value: string): Promise<void> {
  const input = page.getByRole('textbox', { name: placeholder });
  await input.clear();
  await input.fill(value);
}

/** Navigate, apply the default filter so the grid renders. */
async function navigateAndLoadGrid(page: Page): Promise<void> {
  await navigateToPayer(page);
  await applyFilterAndWait(page);
}

export async function verifyPayerDashboardElements(page: Page): Promise<void> {
  // Check filter-form elements BEFORE applying filter (grid headers not in DOM yet,
  // so text like "Processor Id" and "Payer ID" are unambiguous)
  const filterFormElements = [
    page.locator(d.selectors.appPayers).getByText(d.labels.payer, { exact: true }),
    page.getByText(d.labels.name, { exact: true }),
    page.getByRole('textbox', { name: d.placeholders.name }),
    page.getByText(d.labels.processorId, { exact: true }),
    page.getByRole('textbox', { name: d.placeholders.processorId }),
    page.getByText(d.labels.payerId, { exact: true }),
    page.getByRole('textbox', { name: d.placeholders.payerId }),
    page.getByText(d.labels.state, { exact: true }),
    page.getByText(d.labels.showInactiveOnly),
    page.getByRole('link', { name: d.links.addPayer }),
    page.getByRole('button', { name: d.labels.applyFilter }),
  ];

  for (const element of filterFormElements) {
    await expect(element).toBeVisible({ timeout: d.timeouts.generalTimeout });
  }

  const showInactiveOnlyCheckbox = page.getByRole('checkbox', { name: d.labels.showInactiveOnly });
  await expect(showInactiveOnlyCheckbox).toBeVisible();
  if (await showInactiveOnlyCheckbox.isChecked()) {
    await showInactiveOnlyCheckbox.uncheck();
  }

  // Apply filter so the grid renders, then verify column headers via th
  await applyFilterAndWait(page);
  const columnHeaders = [
    page.locator('th').filter({ hasText: d.headers.payerName }),
    page.locator('th').filter({ hasText: d.headers.state }),
    page.locator('th').filter({ hasText: d.headers.professionalProcessorId }),
    page.locator('th').filter({ hasText: d.headers.institutionalProcessorId }),
    page.locator('th').filter({ hasText: d.headers.payerId }),
    page.locator('th').filter({ hasText: d.headers.claimEnrollment }),
  ];
  for (const header of columnHeaders) {
    await expect(header).toBeVisible({ timeout: d.timeouts.generalTimeout });
  }
}

// ---------------------------------------------------------------------------
// Test 1 – PRESERVED: Payer dashboard control/elements verification
// ---------------------------------------------------------------------------
test('Payer dashboard control/elements verification test execution', async ({ page, loginAsAdmin }) => {
  await loginAsAdmin();
  await navigateToPayer(page);
  await verifyPayerDashboardElements(page);
});

// ---------------------------------------------------------------------------
// Test 2 – Filter inputs and button availability
// ---------------------------------------------------------------------------
test('Payer dashboard - filter inputs and Apply Filter button are visible and interactive', async ({ page, loginAsAdmin }) => {
  test.setTimeout(120000);

  await loginAsAdmin();
  await navigateToPayer(page);

  const nameInput = page.getByRole('textbox', { name: d.placeholders.name });
  const processorInput = page.getByRole('textbox', { name: d.placeholders.processorId });
  const payerIdInput = page.getByRole('textbox', { name: d.placeholders.payerId });
  const applyBtn = page.getByRole('button', { name: d.labels.applyFilter });

  await expect(nameInput).toBeVisible();
  await expect(nameInput).toBeEmpty();
  await expect(processorInput).toBeVisible();
  await expect(processorInput).toBeEmpty();
  await expect(payerIdInput).toBeVisible();
  await expect(payerIdInput).toBeEmpty();
  await expect(applyBtn).toBeVisible();
  await expect(applyBtn).toBeEnabled();
  await expect(page.getByRole('checkbox', { name: d.labels.showInactiveOnly })).toBeVisible();
  await expect(page.getByRole('link', { name: d.links.addPayer })).toBeVisible();
});

// ---------------------------------------------------------------------------
// Test 3 – Column headers visible after Apply Filter
// ---------------------------------------------------------------------------
test('Payer dashboard - grid column headers are all visible after applying filter', async ({ page, loginAsAdmin }) => {
  test.setTimeout(120000);

  await loginAsAdmin();
  await navigateAndLoadGrid(page);

  await expect(page.locator('th').filter({ hasText: d.headers.payerName })).toBeVisible();
  await expect(page.locator('th').filter({ hasText: d.headers.state })).toBeVisible();
  await expect(page.locator('th').filter({ hasText: d.headers.professionalProcessorId })).toBeVisible();
  await expect(page.locator('th').filter({ hasText: d.headers.institutionalProcessorId })).toBeVisible();
  await expect(page.locator('th').filter({ hasText: d.headers.payerId })).toBeVisible();
  await expect(page.locator('th').filter({ hasText: d.headers.claimEnrollment })).toBeVisible();
});

// ---------------------------------------------------------------------------
// Test 4 – Filter by Payer ID returns matching rows
// ---------------------------------------------------------------------------
test('Payer dashboard - filter by Payer ID returns results', async ({ page, loginAsAdmin }) => {
  test.setTimeout(120000);

  await loginAsAdmin();
  await navigateToPayer(page);
  await clearAndFillFilter(page, d.placeholders.payerId, d.filterValues.validPayerId);
  await applyFilterAndWait(page);

  await expect(page.locator('tbody')).toContainText(d.filterValues.validPayerId, {
    timeout: d.timeouts.filterTimeout,
  });
  await expect(page.locator('th').filter({ hasText: d.headers.payerId })).toBeVisible();
});

// ---------------------------------------------------------------------------
// Test 5 – Filter by Processor ID returns matching rows
// ---------------------------------------------------------------------------
test('Payer dashboard - filter by Processor ID returns results', async ({ page, loginAsAdmin }) => {
  test.setTimeout(120000);

  await loginAsAdmin();
  await navigateToPayer(page);
  await clearAndFillFilter(page, d.placeholders.processorId, d.filterValues.validProcessorId);
  await applyFilterAndWait(page);

  await expect(page.locator('tbody')).toContainText(d.filterValues.validProcessorId, {
    timeout: d.timeouts.filterTimeout,
  });
});

// ---------------------------------------------------------------------------
// Test 6 – Filter by Name returns matching rows
// ---------------------------------------------------------------------------
test('Payer dashboard - filter by Name returns results', async ({ page, loginAsAdmin }) => {
  test.setTimeout(120000);

  await loginAsAdmin();
  await navigateToPayer(page);
  await clearAndFillFilter(page, d.placeholders.name, d.filterValues.validName);
  await applyFilterAndWait(page);

  const rowCount = await page.locator('tbody tr').count();
  expect(rowCount).toBeGreaterThan(0);
});

// ---------------------------------------------------------------------------
// Test 7 – Show Inactive Only checkbox toggles correctly
// ---------------------------------------------------------------------------
test('Payer dashboard - Show Inactive Only checkbox can be toggled', async ({ page, loginAsAdmin }) => {
  test.setTimeout(120000);

  await loginAsAdmin();
  await navigateToPayer(page);

  const checkbox = page.getByRole('checkbox', { name: d.labels.showInactiveOnly });
  await expect(checkbox).toBeVisible();

  if (!await checkbox.isChecked()) {
    await checkbox.check();
    await expect(checkbox).toBeChecked();
  }
  await checkbox.uncheck();
  await expect(checkbox).not.toBeChecked();
});

// ---------------------------------------------------------------------------
// Test 8 – Edge case: invalid Payer ID filter returns no rows
// ---------------------------------------------------------------------------
test('Payer dashboard - invalid Payer ID filter returns no results', async ({ page, loginAsAdmin }) => {
  test.setTimeout(120000);

  await loginAsAdmin();
  await navigateToPayer(page);
  await clearAndFillFilter(page, d.placeholders.payerId, d.filterValues.invalidPayerId);
  await applyFilterAndWait(page);

  const rowCount = await page.locator('tbody tr').count();
  expect(rowCount).toBe(0);
});

// ---------------------------------------------------------------------------
// Test 9 – Edge case: invalid Processor ID filter returns no rows
// ---------------------------------------------------------------------------
test('Payer dashboard - invalid Processor ID filter returns no results', async ({ page, loginAsAdmin }) => {
  test.setTimeout(120000);

  await loginAsAdmin();
  await navigateToPayer(page);
  await clearAndFillFilter(page, d.placeholders.processorId, d.filterValues.invalidProcessorId);
  await applyFilterAndWait(page);

  const rowCount = await page.locator('tbody tr').count();
  expect(rowCount).toBe(0);
});

// ---------------------------------------------------------------------------
// Test 10 – Edge case: invalid Name filter returns no rows
// ---------------------------------------------------------------------------
test('Payer dashboard - invalid Name filter returns no results', async ({ page, loginAsAdmin }) => {
  test.setTimeout(120000);

  await loginAsAdmin();
  await navigateToPayer(page);
  await clearAndFillFilter(page, d.placeholders.name, d.filterValues.invalidName);
  await applyFilterAndWait(page);

  const rowCount = await page.locator('tbody tr').count();
  expect(rowCount).toBe(0);
});

// ---------------------------------------------------------------------------
// Test 11 – Edge case: empty filter still shows grid results
// ---------------------------------------------------------------------------
test('Payer dashboard - empty filter still shows grid results', async ({ page, loginAsAdmin }) => {
  test.setTimeout(120000);

  await loginAsAdmin();
  await navigateToPayer(page);
  await clearAndFillFilter(page, d.placeholders.name, '');
  await clearAndFillFilter(page, d.placeholders.processorId, '');
  await clearAndFillFilter(page, d.placeholders.payerId, '');
  await applyFilterAndWait(page);

  const rowCount = await page.locator('tbody tr').count();
  expect(rowCount).toBeGreaterThan(0);
});

// ---------------------------------------------------------------------------
// Test 12 – Add Payer link is visible and enabled
// ---------------------------------------------------------------------------
test('Payer dashboard - Add Payer link is visible and clickable', async ({ page, loginAsAdmin }) => {
  test.setTimeout(120000);

  await loginAsAdmin();
  await navigateToPayer(page);

  const addPayerLink = page.getByRole('link', { name: d.links.addPayer });
  await expect(addPayerLink).toBeVisible();
  await expect(addPayerLink).toBeEnabled();
});

// ---------------------------------------------------------------------------
// Test 13 – Filtering and clearing restores a larger result set
// ---------------------------------------------------------------------------
test('Payer dashboard - clearing Payer ID filter restores full grid', async ({ page, loginAsAdmin }) => {
  test.setTimeout(120000);

  await loginAsAdmin();
  await navigateToPayer(page);

  await clearAndFillFilter(page, d.placeholders.payerId, d.filterValues.validPayerId);
  await applyFilterAndWait(page);
  const filteredRows = await page.locator('tbody tr').count();

  await clearAndFillFilter(page, d.placeholders.payerId, '');
  await applyFilterAndWait(page);
  const fullRows = await page.locator('tbody tr').count();

  expect(fullRows).toBeGreaterThanOrEqual(filteredRows);
});

// ---------------------------------------------------------------------------
// Test 14 – Show Inactive Only checkbox displays inactive payer records
// ---------------------------------------------------------------------------
test('Payer dashboard - Show Inactive Only checkbox displays inactive payer records', async ({ page, loginAsAdmin }) => {
  test.setTimeout(120000);

  await loginAsAdmin();
  await navigateToPayer(page);

  await expect(page.getByText(d.labels.showInactiveOnly)).toBeVisible();
  await expect(page.getByRole('checkbox', { name: d.labels.showInactiveOnly })).toBeVisible();

  const showInactiveCheckbox = page.getByRole('checkbox', { name: d.labels.showInactiveOnly });
  if (await showInactiveCheckbox.isChecked()) {
    await showInactiveCheckbox.uncheck();
  }
  await showInactiveCheckbox.check();
  await expect(showInactiveCheckbox).toBeChecked();

  await page.getByRole('button', { name: d.labels.applyFilter }).click();

  await expect(page.getByRole('columnheader', { name: d.headers.payerNameAsc })).toBeVisible({
    timeout: d.timeouts.filterTimeout,
  });
  await expect(page.getByRole('columnheader', { name: d.headers.professionalProcessorId })).toBeVisible({
    timeout: d.timeouts.filterTimeout,
  });
  await expect(page.getByRole('cell', { name: d.filterValues.validProcessorId }).nth(2)).toBeVisible({
    timeout: d.timeouts.filterTimeout,
  });

  // Reset checkbox so other tests are not affected
  await showInactiveCheckbox.uncheck();
});
