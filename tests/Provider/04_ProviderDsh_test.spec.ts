import { test, expect } from '../myTestData';
import { navigateToProviders } from '../framework/navigation.helper';

// ─── Provider Dashboard Tests ──────────────────────────────────────────────────
// Suite covers: field visibility, default results, column sorting, filter searches,
// edge cases (empty fields, invalid values, no-result scenarios).

test.describe('Provider Dashboard - Filter Fields Visibility', () => {

  test('should display all filter form fields on load', async ({ page, loginAsAdmin }) => {
    await loginAsAdmin();
    await navigateToProviders(page);
    await page.getByRole('button', { name: 'Apply Filter' }).click();

    await expect(page.getByText('Provider ID', { exact: true })).toBeVisible();
    await expect(page.getByRole('textbox', { name: 'Enter Provider ID' })).toBeVisible();
    await expect(page.locator('form').getByText('Group ID')).toBeVisible();
    await expect(page.getByRole('textbox', { name: 'Enter Group ID' })).toBeVisible();
    await expect(page.getByText('Group Name')).toBeVisible();
    await expect(page.getByRole('textbox', { name: 'Enter Group Name' })).toBeVisible();
    await expect(page.locator('form').getByText('Account Number')).toBeVisible();
    await expect(page.getByRole('textbox', { name: 'Enter Account Number' })).toBeVisible();
    await expect(page.getByText('Account Name')).toBeVisible();
    await expect(page.getByRole('textbox', { name: 'Enter Account Name' })).toBeVisible();
    await expect(page.getByText('Contact Name')).toBeVisible();
    await expect(page.getByRole('textbox', { name: 'Enter Contact Name' })).toBeVisible();
    await expect(page.getByText('City')).toBeVisible();
    await expect(page.getByRole('textbox', { name: 'Enter City' })).toBeVisible();
    await expect(page.getByText('State', { exact: true })).toBeVisible();
    await expect(page.getByText('State Select State AB AK AL')).toBeVisible();
    await expect(page.getByText('Practice Management', { exact: true })).toBeVisible();
    await expect(page.locator('dropdown-filter-item').getByRole('combobox')).toBeVisible();
    await expect(page.locator('dropdown-filter-item').getByRole('combobox')).toHaveValue('');
  });

  test('should display all result table column headers', async ({ page, loginAsAdmin }) => {
    await loginAsAdmin();
    await navigateToProviders(page);
    await page.getByRole('button', { name: 'Apply Filter' }).click();

    await expect(page.getByRole('columnheader', { name: 'name' })).toBeVisible();
    await expect(page.getByRole('columnheader', { name: 'email' })).toBeVisible();
    await expect(page.getByRole('columnheader', { name: 'status' })).toBeVisible();
    await expect(page.getByRole('columnheader', { name: 'address' })).toBeVisible();
    await expect(page.getByRole('columnheader', { name: 'provider ID ' })).toBeVisible();
    await expect(page.getByRole('columnheader', { name: 'Group ID' })).toBeVisible();
    await expect(page.getByRole('columnheader', { name: 'Account Number' })).toBeVisible();
  });

  test('should display default provider results after Apply Filter with no filters', async ({ page, loginAsAdmin }) => {
    await loginAsAdmin();
    await navigateToProviders(page);
    await page.getByRole('button', { name: 'Apply Filter' }).click();

    await expect(page.getByRole('cell', { name: 'AARON GIBSON' })).toBeVisible();
    await expect(page.getByRole('cell', { name: 'RANDY@DANIEL.NAME' })).toBeVisible();
    await expect(page.getByRole('cell', { name: 'A' }).nth(2)).toBeVisible();
    await expect(page.getByRole('cell', { name: '04580 MARGARITA GARDENS APT.' })).toBeVisible();
    await expect(page.getByRole('cell', { name: 'T00094' })).toBeVisible();
    await expect(page.getByRole('cell', { name: 'G00012' }).first()).toBeVisible();
    await expect(page.getByRole('cell', { name: '000VMTEST' }).first()).toBeVisible();
  });

});

test.describe('Provider Dashboard - Column Sorting', () => {

  test.beforeEach(async ({ page, loginAsAdmin }) => {
    await loginAsAdmin();
    await navigateToProviders(page);
    // Filter form is visible on page load - apply filter to load results
    await expect(page.getByRole('textbox', { name: 'Enter Provider ID' })).toBeVisible();
    await page.getByRole('button', { name: 'Apply Filter' }).click();
    await expect(page.getByRole('columnheader', { name: 'name' })).toBeVisible();
  });

  test('should sort results by name column', async ({ page }) => {
    await page.getByRole('columnheader', { name: 'name' }).click();
    await expect(page.getByRole('cell', { name: 'PROVIDER 01TEST' })).toBeVisible();
  });

  test('should sort results by email column', async ({ page }) => {
    await page.getByRole('columnheader', { name: 'email' }).click();
    await expect(page.getByRole('cell', { name: 'N/A' }).first()).toBeVisible();
  });

  test('should sort results by status column', async ({ page }) => {
    await page.getByRole('columnheader', { name: 'status' }).click();
    await expect(page.getByRole('cell', { name: 'A' }).nth(1)).toBeVisible();
  });

  test('should sort results by address column', async ({ page }) => {
    await page.getByRole('columnheader', { name: 'address' }).click();
    await expect(page.getByRole('cell', { name: '04843 COLTEN FERRY SUITE 674' })).toBeVisible();
  });

  test('should sort results by provider ID column', async ({ page }) => {
    await page.getByRole('columnheader', { name: 'provider ID' }).click();
    const firstProviderIdCell = page.getByRole('columnheader', { name: 'provider ID' })
      .locator('xpath=ancestor::thead/following-sibling::tbody')
      .getByRole('cell').first();
    await expect(firstProviderIdCell).toBeVisible();
    const cellText = await firstProviderIdCell.textContent();
    expect(cellText?.trim().length).toBeGreaterThan(0);
  });

  test('should sort results by Group ID column', async ({ page }) => {
    await page.getByRole('columnheader', { name: 'Group ID' }).click();
    await expect(page.getByRole('cell', { name: 'G00012' }).first()).toBeVisible();
  });

  test('should sort results by Account Number column', async ({ page }) => {
    await page.getByRole('columnheader', { name: 'Account Number' }).click();
    await expect(page.getByRole('cell', { name: '000VMTEST' }).first()).toBeVisible();
  });

});

test.describe('Provider Dashboard - Filter Search', () => {

  test('should return matching result when filtering by Provider ID', async ({ page, loginAsAdmin }) => {
    await loginAsAdmin();
    await navigateToProviders(page);

    await page.getByRole('textbox', { name: 'Enter Provider ID' }).click();
    await page.getByRole('textbox', { name: 'Enter Provider ID' }).fill('T00094');
    await page.getByRole('button', { name: 'Apply Filter' }).click();

    await expect(page.getByRole('columnheader', { name: 'provider ID' })).toBeVisible();
    await expect(page.getByRole('cell', { name: 'T00094' })).toBeVisible();
  });

  test('should return matching result when filtering by Group ID', async ({ page, loginAsAdmin }) => {
    await loginAsAdmin();
    await navigateToProviders(page);

    await page.getByRole('textbox', { name: 'Enter Group ID' }).click();
    await page.getByRole('textbox', { name: 'Enter Group ID' }).fill('G00012');
    await page.getByRole('button', { name: 'Apply Filter' }).click();

    await expect(page.getByRole('columnheader', { name: 'Group ID' })).toBeVisible();
    await expect(page.getByRole('cell', { name: 'G00012' }).first()).toBeVisible();
  });

  test('should return matching result when filtering by Account Number', async ({ page, loginAsAdmin }) => {
    await loginAsAdmin();
    await navigateToProviders(page);

    await page.getByRole('textbox', { name: 'Enter Account Number' }).click();
    await page.getByRole('textbox', { name: 'Enter Account Number' }).fill('000VMTEST');
    await page.getByRole('button', { name: 'Apply Filter' }).click();

    await expect(page.getByRole('columnheader', { name: 'Account Number ' })).toBeVisible();
    await expect(page.getByRole('cell', { name: '000VMTEST' }).first()).toBeVisible();
  });

  test('should return full result set after clearing Account Number filter', async ({ page, loginAsAdmin }) => {
    await loginAsAdmin();
    await navigateToProviders(page);

    await page.getByRole('textbox', { name: 'Enter Account Number' }).click();
    await page.getByRole('textbox', { name: 'Enter Account Number' }).fill('000VMTEST');
    await page.getByRole('button', { name: 'Apply Filter' }).click();

    // Clear the filter
    await page.getByRole('textbox', { name: 'Enter Account Number' }).click();
    await page.getByRole('textbox', { name: 'Enter Account Number' }).press('ControlOrMeta+a');
    await page.getByRole('textbox', { name: 'Enter Account Number' }).fill('');
    await page.getByRole('button', { name: 'Apply Filter' }).click();

    await expect(page.getByRole('columnheader', { name: 'provider ID' })).toBeVisible();
    await expect(page.getByRole('cell', { name: 'T00142' })).toBeVisible();
  });

  test('should return matching result when filtering by Practice Management dropdown', async ({ page, loginAsAdmin }) => {
    await loginAsAdmin();
    await navigateToProviders(page);

    await page.locator('dropdown-filter-item').getByRole('combobox').selectOption('4: A');
    await page.getByRole('button', { name: 'Apply Filter' }).click();

    await expect(page.getByRole('columnheader', { name: 'provider ID' })).toBeVisible();
    await expect(page.getByRole('cell', { name: 'R01104' })).toBeVisible();
  });

});

test.describe('Provider Dashboard - Edge Cases', () => {

  test('should show results when Apply Filter is clicked with all fields empty', async ({ page, loginAsAdmin }) => {
    await loginAsAdmin();
    await navigateToProviders(page);

    await page.getByRole('textbox', { name: 'Enter Provider ID' }).fill('');
    await page.getByRole('textbox', { name: 'Enter Group ID' }).fill('');
    await page.getByRole('textbox', { name: 'Enter Group Name' }).fill('');
    await page.getByRole('textbox', { name: 'Enter Account Number' }).fill('');
    await page.getByRole('textbox', { name: 'Enter Account Name' }).fill('');
    await page.getByRole('textbox', { name: 'Enter Contact Name' }).fill('');
    await page.getByRole('textbox', { name: 'Enter City' }).fill('');
    await page.getByRole('button', { name: 'Apply Filter' }).click();

    await expect(page.getByRole('columnheader', { name: 'name' })).toBeVisible();
    await expect(page.getByRole('columnheader', { name: 'provider ID ' })).toBeVisible();
  });

  test('should return no results or show empty state for invalid Provider ID', async ({ page, loginAsAdmin }) => {
    await loginAsAdmin();
    await navigateToProviders(page);

    await page.getByRole('textbox', { name: 'Enter Provider ID' }).fill('INVALID_ID_XXXXX');
    await page.getByRole('button', { name: 'Apply Filter' }).click();

    const noResults = page.getByText(/no results|no records|no data/i);
    const tableBodyRows = page.locator('tbody tr');
    const hasNoResults = await noResults.isVisible().catch(() => false);
    if (!hasNoResults) {
      const rowCount = await tableBodyRows.count();
      expect(rowCount).toBe(0);
    }
  });

  test('should return no results or show empty state for invalid Group ID', async ({ page, loginAsAdmin }) => {
    await loginAsAdmin();
    await navigateToProviders(page);

    await page.getByRole('textbox', { name: 'Enter Group ID' }).fill('ZZZZZZZZZ');
    await page.getByRole('button', { name: 'Apply Filter' }).click();

    const noResults = page.getByText(/no results|no records|no data/i);
    const tableBodyRows = page.locator('tbody tr');
    const hasNoResults = await noResults.isVisible().catch(() => false);
    if (!hasNoResults) {
      const rowCount = await tableBodyRows.count();
      expect(rowCount).toBe(0);
    }
  });

  test('should return no results or show empty state for invalid Account Number', async ({ page, loginAsAdmin }) => {
    await loginAsAdmin();
    await navigateToProviders(page);

    await page.getByRole('textbox', { name: 'Enter Account Number' }).fill('INVALID_ACCT_0000');
    await page.getByRole('button', { name: 'Apply Filter' }).click();

    const noResults = page.getByText(/no results|no records|no data/i);
    const tableBodyRows = page.locator('tbody tr');
    const hasNoResults = await noResults.isVisible().catch(() => false);
    if (!hasNoResults) {
      const rowCount = await tableBodyRows.count();
      expect(rowCount).toBe(0);
    }
  });

  test('should retain filter value in Provider ID field after applying filter', async ({ page, loginAsAdmin }) => {
    await loginAsAdmin();
    await navigateToProviders(page);

    await page.getByRole('textbox', { name: 'Enter Provider ID' }).fill('T00094');
    await page.getByRole('button', { name: 'Apply Filter' }).click();

    await expect(page.getByRole('textbox', { name: 'Enter Provider ID' })).toHaveValue('T00094');
  });

  test('Practice Management dropdown should default to empty / unselected', async ({ page, loginAsAdmin }) => {
    await loginAsAdmin();
    await navigateToProviders(page);

    const combobox = page.locator('dropdown-filter-item').getByRole('combobox');
    await expect(combobox).toBeVisible();
    await expect(combobox).toHaveValue('');
  });

  test('should reset Practice Management filter and return full result set', async ({ page, loginAsAdmin }) => {
    await loginAsAdmin();
    await navigateToProviders(page);

    await page.locator('dropdown-filter-item').getByRole('combobox').selectOption('4: A');
    await page.getByRole('button', { name: 'Apply Filter' }).click();
    await expect(page.getByRole('cell', { name: 'R01104' })).toBeVisible();

    await page.locator('dropdown-filter-item').getByRole('combobox').selectOption('');
    await page.getByRole('button', { name: 'Apply Filter' }).click();

    await expect(page.getByRole('columnheader', { name: 'provider ID' })).toBeVisible();
    await expect(page.getByRole('cell', { name: 'T00094' })).toBeVisible();
  });

}); 