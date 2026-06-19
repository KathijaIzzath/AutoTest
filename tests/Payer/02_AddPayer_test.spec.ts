import { test, expect } from '../myTestData';
import type { Locator, Page } from '@playwright/test';
import { navigateToPayer } from '../framework/navigation.helper';
import * as d from '../../testData/AddPayerTestData.json';
import { deletePayerByIdAndNeicId, fetchPayerByIdAndNeicId } from '../../testData/database.utils';

async function openAddPayerModal(page: Page): Promise<void> {
  await navigateToPayer(page);
  await expect(page.getByRole('link', { name: d.labels.addPayerLink })).toBeVisible();
  await page.getByRole('link', { name: d.labels.addPayerLink }).click();
  await expect(page.getByRole('heading', { name: d.labels.addPayerSetup })).toBeVisible({
    timeout: d.timeouts.modalVisibleMs,
  });
}

async function ensureChecked(checkbox: Locator): Promise<void> {
  if (!(await checkbox.isChecked())) {
    await checkbox.check();
  }
}

async function prepareUniquePayerRecord(): Promise<void> {
  await deletePayerByIdAndNeicId(d.values.scInsuranceId, d.values.neicidWithLeadingSpace);
  const existing = await fetchPayerByIdAndNeicId(d.values.scInsuranceId, d.values.neicidWithLeadingSpace);
  expect(existing.length).toBe(0);
}

async function fillRequiredAddPayerFields(page: Page): Promise<void> {
  await page.getByRole('textbox', { name: d.placeholders.scInsuranceId }).fill(d.values.scInsuranceId);
  await page.getByRole('textbox', { name: d.placeholders.payerId }).fill(d.values.neicidUi);
  await page.locator(d.selectors.claimFilingSelect).getByRole('combobox').selectOption(d.values.claimFilingOption);
  await ensureChecked(page.getByRole('checkbox', { name: d.labels.active }));
  await page.getByRole('combobox').nth(1).selectOption(d.values.stateOption);
  await page.getByRole('textbox', { name: d.placeholders.payerName }).fill(d.values.payerName);
  await page.getByRole('textbox', { name: d.placeholders.payerContact }).fill(d.values.payerContact);
  await page.getByRole('textbox', { name: d.placeholders.phone }).fill(d.values.phone);
  await page.getByLabel(d.labels.billingIndicator).selectOption(d.values.billingIndicator);
}

async function fillOptionalAddPayerFields(page: Page): Promise<void> {
  await ensureChecked(page.getByRole('checkbox', { name: d.labels.professional }));
  await ensureChecked(page.getByRole('checkbox', { name: d.labels.eligibility }));
  await ensureChecked(page.getByRole('checkbox', { name: d.labels.era }));
  await ensureChecked(page.getByRole('checkbox', { name: d.labels.institutional }));
  await ensureChecked(page.getByRole('checkbox', { name: d.labels.claimStatus, exact: true }));
  await ensureChecked(page.getByRole('checkbox', { name: d.labels.attachments }));
  await ensureChecked(page.getByRole('checkbox', { name: d.labels.allowBulkEnrollments }));
  await ensureChecked(page.getByRole('checkbox', { name: d.labels.secondaryClaims }));
  await ensureChecked(page.getByRole('checkbox', { name: d.labels.batchClaimStatus }));

  await page.getByRole('textbox', { name: d.placeholders.notes }).fill(d.values.notes);
  await page.getByRole('textbox', { name: d.placeholders.followupDays }).fill(d.values.followupDays);
  await page.getByRole('textbox', { name: d.placeholders.professionalProcessor }).fill(d.values.professionalProcessor);
  await page.getByRole('textbox', { name: d.placeholders.eligibility }).fill(d.values.eligibilityId);
}

async function addPayerAndReturnToDashboard(page: Page): Promise<void> {
  await fillRequiredAddPayerFields(page);
  await fillOptionalAddPayerFields(page);
  await Promise.all([
    page.waitForResponse(
      resp => resp.request().method() === 'POST' && resp.url().includes(d.api.host) && resp.status() < 400,
      { timeout: d.timeouts.modalVisibleMs }
    ),
    page.getByRole('button', { name: d.labels.addPayerButton }).click(),
  ]);
  await page.getByRole('link', { name: d.labels.javascript }).click();
  await expect(page.locator(d.selectors.dashboardRoot)).toBeVisible();
}

async function searchByDashboardName(page: Page, name: string): Promise<void> {
  await page.getByRole('textbox', { name: d.placeholders.dashboardName }).fill(name);
  await page.getByRole('button', { name: d.labels.applyFilter }).click();
}

test.describe('Add Payer - Generated Flow Refactor', () => {
  test.beforeEach(async ({ loginAsAdmin }) => {
    await prepareUniquePayerRecord();
    await loginAsAdmin();
  });

  test('Add Payer modal controls are visible and available', async ({ page }) => {
    await openAddPayerModal(page);

    await expect(page.getByRole('textbox', { name: d.placeholders.scInsuranceId })).toBeVisible();
    await expect(page.getByRole('textbox', { name: d.placeholders.payerId })).toBeVisible();
    await expect(page.getByRole('textbox', { name: d.placeholders.altPayerId })).toBeVisible();
    await expect(page.locator(d.selectors.claimFilingSelect).getByRole('combobox')).toBeVisible();
    await expect(page.getByRole('checkbox', { name: d.labels.active })).toBeVisible();
    await expect(page.getByRole('checkbox', { name: d.labels.legacy })).toBeVisible();
    await expect(page.getByRole('textbox', { name: d.placeholders.payerName })).toBeVisible();
    await expect(page.getByRole('textbox', { name: d.placeholders.payerContact })).toBeVisible();
    await expect(page.getByRole('textbox', { name: d.placeholders.phone })).toBeVisible();
    await expect(page.getByLabel(d.labels.billingIndicator)).toBeVisible();
    await expect(page.getByRole('checkbox', { name: d.labels.professional })).toBeVisible();
    await expect(page.getByRole('checkbox', { name: d.labels.eligibility })).toBeVisible();
    await expect(page.getByRole('checkbox', { name: d.labels.era })).toBeVisible();
    await expect(page.getByRole('checkbox', { name: d.labels.institutional })).toBeVisible();
    await expect(page.getByRole('checkbox', { name: d.labels.claimStatus, exact: true })).toBeVisible();
    await expect(page.getByRole('checkbox', { name: d.labels.attachments })).toBeVisible();
    await expect(page.getByRole('checkbox', { name: d.labels.allowBulkEnrollments })).toBeVisible();
    await expect(page.getByRole('checkbox', { name: d.labels.secondaryClaims })).toBeVisible();
    await expect(page.getByRole('checkbox', { name: d.labels.batchClaimStatus })).toBeVisible();
    await expect(page.getByRole('textbox', { name: d.placeholders.notes })).toBeVisible();
    await expect(page.getByRole('textbox', { name: d.placeholders.followupDays })).toBeVisible();
    await expect(page.getByRole('button', { name: d.labels.addPayerButton })).toBeVisible();
  });

  test('Add payer flow saves and appears in dashboard search results', async ({ page }) => {
    await openAddPayerModal(page);
    await addPayerAndReturnToDashboard(page);

    await searchByDashboardName(page, d.values.payerNameSearch);

    await expect(page.getByRole('columnheader', { name: d.headers.payerNameAsc })).toBeVisible({
      timeout: d.timeouts.searchMs,
    });
    await expect(page.getByRole('cell', { name: d.values.payerNameExpectedCell })).toBeVisible({
      timeout: d.timeouts.searchMs,
    });

    const existing = await fetchPayerByIdAndNeicId(d.values.scInsuranceId, d.values.neicidWithLeadingSpace);
    expect(existing.length).toBeGreaterThan(0);
  });

  test('Dashboard invalid name filter returns no rows', async ({ page }) => {
    await navigateToPayer(page);
    await searchByDashboardName(page, d.edgeCases.invalidDashboardName);

    const rowCount = await page.locator('tbody tr').count();
    expect(rowCount).toBe(0);
  });

  test('Dashboard empty filters execute successfully and keep grid available', async ({ page }) => {
    await navigateToPayer(page);
    await searchByDashboardName(page, d.edgeCases.empty);

    await expect(page.getByRole('button', { name: d.labels.applyFilter })).toBeVisible();
    await expect(page.locator('tbody')).toBeVisible();
  });

  test('Dashboard whitespace filter does not break search', async ({ page }) => {
    await navigateToPayer(page);
    await searchByDashboardName(page, d.edgeCases.whitespace);

    await expect(page.getByRole('button', { name: d.labels.applyFilter })).toBeVisible();
  });

  test('Add payer with only required fields remains functional for iterative runs', async ({ page }) => {
    await openAddPayerModal(page);
    await fillRequiredAddPayerFields(page);

    await Promise.all([
      page.waitForResponse(
        resp => resp.request().method() === 'POST' && resp.url().includes(d.api.host) && resp.status() < 400,
        { timeout: d.timeouts.modalVisibleMs }
      ),
      page.getByRole('button', { name: d.labels.addPayerButton }).click(),
    ]);
    await page.getByRole('link', { name: d.labels.javascript }).click();
    await searchByDashboardName(page, d.values.payerNameSearch);

    await expect(page.getByRole('cell', { name: d.values.payerNameExpectedCell })).toBeVisible({
      timeout: d.timeouts.searchMs,
    });
  });

  test('DB cleanup helper removes target payer row when present', async ({ page }) => {
    await openAddPayerModal(page);
    await fillRequiredAddPayerFields(page);
    await Promise.all([
      page.waitForResponse(
        resp => resp.request().method() === 'POST' && resp.url().includes(d.api.host) && resp.status() < 400,
        { timeout: d.timeouts.modalVisibleMs }
      ),
      page.getByRole('button', { name: d.labels.addPayerButton }).click(),
    ]);
    await page.getByRole('link', { name: d.labels.javascript }).click();

    const beforeDelete = await fetchPayerByIdAndNeicId(d.values.scInsuranceId, d.values.neicidWithLeadingSpace);
    expect(beforeDelete.length).toBeGreaterThan(0);

    await deletePayerByIdAndNeicId(d.values.scInsuranceId, d.values.neicidWithLeadingSpace);
    const afterDelete = await fetchPayerByIdAndNeicId(d.values.scInsuranceId, d.values.neicidWithLeadingSpace);
    expect(afterDelete.length).toBe(0);

    await navigateToPayer(page);
  });
});
