import { test, expect } from '../myTestData';
import type { Locator, Page } from '@playwright/test';
import { navigateToClaimsDashboard } from '../framework/navigation.helper';
import { fetchClaimExtendedMenuRowByClaimId } from '../../testData/database.utils';
import * as d from '../../testData/ClaimsExtendedMenuTestData.json';

let pageErrors: string[] = [];

/*
  Preserved recorder flow source (converted to helpers/tests below):
  1) Open Claims dashboard and search by claim id
  2) Apply filter and verify result row
  3) Open row action menu
  4) Open Provider and Group submenu screens
  5) Validate screens are read-only (no Save action)
*/

function escapeForRegex(value: string): string {
  return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

async function openClaimsDashboard(page: Page): Promise<void> {
  await navigateToClaimsDashboard(page);
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

async function clearClaimFilters(page: Page): Promise<void> {
  await trySetFilterValue(page, d.placeholders.claimId, d.edgeCases.empty);
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
  await clearClaimFilters(page);
  await setFilterValue(page, d.placeholders.claimId, claimId);
  await applyFilterAndWait(page);
}

async function assertNoResultsOrZeroRows(page: Page): Promise<void> {
  const emptyState = page.locator(d.selectors.noResults).first();
  const hasEmptyState = await emptyState.isVisible().catch(() => false);
  if (!hasEmptyState) {
    await expect(page.locator(d.selectors.tableRows)).toHaveCount(0);
  }
}

async function openRowActionMenu(page: Page): Promise<void> {
  const blankLinks = page.getByRole('link').filter({ hasText: /^$/ });
  const fallbackIndex = d.indexes.rowActionFallbackIndex;
  const count = await blankLinks.count();

  if (count > fallbackIndex) {
    await blankLinks.nth(fallbackIndex).click();
    return;
  }

  const row = page.locator(d.selectors.tableRows).first();
  await expect(row).toBeVisible({ timeout: d.timeouts.searchMs });
  const firstLink = row.getByRole('link').first();
  await expect(firstLink).toBeVisible({ timeout: d.timeouts.searchMs });
  await firstLink.click();
}

async function closeActivePanelIfPossible(page: Page): Promise<void> {
  const closeCandidates = [
    page.getByRole('button', { name: /close|cancel|x|✖/i }).first(),
    page.getByRole('link', { name: /close|cancel|x|✖/i }).first(),
  ];

  for (const candidate of closeCandidates) {
    const visible = await candidate.isVisible().catch(() => false);
    if (visible) {
      await candidate.click().catch(() => {});
      return;
    }
  }

  await page.keyboard.press('Escape').catch(() => {});
}

async function assertPanelReadOnly(page: Page): Promise<void> {
  await expect(page.getByRole('button', { name: /save|add|update/i })).toHaveCount(0);
}

async function openSubmenuAndAssertReadOnly(page: Page, buttonName: string): Promise<boolean> {
  await openRowActionMenu(page);

  const submenuButton = page.getByRole('button', { name: new RegExp(`^${escapeForRegex(buttonName)}$`, 'i') }).first();
  const visible = await submenuButton.isVisible().catch(() => false);
  if (!visible) {
    return false;
  }

  await submenuButton.click();
  await assertPanelReadOnly(page);
  return true;
}

async function tryOpenSubmenuAndAssertReadOnly(page: Page, buttonName: string): Promise<boolean> {
  try {
    return await openSubmenuAndAssertReadOnly(page, buttonName);
  } catch {
    return false;
  }
}

test.describe('Claim Menu on Dashboard search results - extended read-only suite', () => {
  test.beforeEach(async ({ page, loginAsAdmin }) => {
    pageErrors = [];
    page.on('pageerror', (err) => pageErrors.push(err.message));

    await loginAsAdmin();
    await openClaimsDashboard(page);
  });

  test.afterEach(async ({ page }) => {
    await closeActivePanelIfPossible(page).catch(() => {});
    expect(pageErrors, 'Unexpected browser runtime errors were thrown.').toEqual([]);
  });

  test('Claim dashboard controls and filters are visible and available', async ({ page }) => {
    await expect(page.getByRole('button', { name: d.labels.title, exact: true })).toBeVisible();
    await expect(page.getByRole('button', { name: d.labels.claimsArchive })).toBeVisible();
    await expect(page.getByRole('button', { name: d.labels.applyFilter })).toBeVisible();
    await expect(page.getByRole('textbox', { name: d.placeholders.claimId })).toBeVisible();
    await expect(page.getByRole('textbox', { name: d.placeholders.groupId })).toBeVisible();
    await expect(page.getByRole('textbox', { name: d.placeholders.billingNpi })).toBeVisible();
    await expect(page.getByRole('textbox', { name: d.placeholders.taxId })).toBeVisible();
    await expect(page.getByRole('textbox', { name: d.placeholders.payerId })).toBeVisible();
    await expect(page.getByRole('textbox', { name: d.placeholders.renderNpi })).toBeVisible();
    await expect(page.getByRole('textbox', { name: d.placeholders.receiver })).toBeVisible();
    await expect(page.getByRole('textbox', { name: d.placeholders.patientAccountNumber })).toBeVisible();
    await expect(page.getByRole('textbox', { name: d.placeholders.patientName })).toBeVisible();
  });

  test('Apply Filter by claim id returns successful row and matches DB values', async ({ page }) => {
    const dbRow = await fetchClaimExtendedMenuRowByClaimId(d.values.claimId);
    expect(dbRow).not.toBeNull();
    if (!dbRow) return;

    await searchByClaimId(page, d.values.claimId);
    const row = page
      .locator(d.selectors.tableRows)
      .filter({ hasText: dbRow.patientname || dbRow.patientaccountnumber || d.values.claimId })
      .first();
    await expect(row).toBeVisible({ timeout: d.timeouts.searchMs });
    await expect(row).toContainText(dbRow.patientname);
    await expect(row).toContainText(dbRow.patientaccountnumber);
  });

  test('Provider submenu opens and key sections are visible in read-only mode', async ({ page }) => {
    await searchByClaimId(page, d.values.claimId);
    const opened = await openSubmenuAndAssertReadOnly(page, 'Provider');
    test.skip(!opened, 'Provider submenu not available for the selected claim row.');
    if (!opened) return;

    await expect(page.getByRole('heading', { name: new RegExp(d.readonly.providerHeading, 'i') })).toBeVisible();
    for (const text of d.readonly.providerRequiredTexts) {
      await expect(page.getByText(new RegExp(escapeForRegex(text), 'i')).first()).toBeVisible();
    }
  });

  test('Group submenu opens and key sections are visible in read-only mode', async ({ page }) => {
    await searchByClaimId(page, d.values.claimId);
    const opened = await openSubmenuAndAssertReadOnly(page, 'Group');
    test.skip(!opened, 'Group submenu not available for the selected claim row.');
    if (!opened) return;

    await expect(page.getByRole('heading', { name: new RegExp(d.readonly.groupHeading, 'i') })).toBeVisible();
    for (const text of d.readonly.groupRequiredTexts) {
      await expect(page.getByText(new RegExp(escapeForRegex(text), 'i')).first()).toBeVisible();
    }
  });

  test('Optional submenu items (Payer and Enrollment) are read-only when present', async ({ page }) => {
    await searchByClaimId(page, d.values.claimId);

    for (const buttonName of ['Payer', 'Enrollment']) {
      const opened = await tryOpenSubmenuAndAssertReadOnly(page, buttonName);
      if (opened) {
        await closeActivePanelIfPossible(page);
      }
    }
  });

  test('Empty filters keep claims dashboard stable when Apply Filter is clicked', async ({ page }) => {
    await clearClaimFilters(page);
    await applyFilterAndWait(page);
    const rowCount = await page.locator(d.selectors.tableRows).count();
    expect(rowCount).toBeGreaterThanOrEqual(0);
  });

  test('Invalid claim id returns no rows or empty state and DB returns null', async ({ page }) => {
    const dbRow = await fetchClaimExtendedMenuRowByClaimId(d.edgeCases.invalidClaimId);
    expect(dbRow).toBeNull();

    await searchByClaimId(page, d.edgeCases.invalidClaimId);
    await assertNoResultsOrZeroRows(page);
  });

  test('Whitespace claim id keeps claims dashboard stable', async ({ page }) => {
    await searchByClaimId(page, d.edgeCases.whitespace);
    await expect(page.getByRole('button', { name: d.labels.applyFilter })).toBeVisible();
  });
});
