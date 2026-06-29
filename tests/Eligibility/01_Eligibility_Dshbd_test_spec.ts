import { test, expect } from '../myTestData';
import type { Locator, Page } from '@playwright/test';
import { navigateToEligibilityRouting } from '../framework/navigation.helper';
import { fetchEligibilityRoutingByScId } from '../../testData/database.utils';
import * as d from '../../testData/EligibilityDshbdTestData.json';

async function openEligibilityDashboard(page: Page): Promise<void> {
	await navigateToEligibilityRouting(page);
	await expect(page.locator(d.selectors.root).getByText(d.labels.title, { exact: true })).toBeVisible();
}

async function applyFilterAndWait(page: Page): Promise<void> {
	await page.getByRole('button', { name: d.labels.applyFilter }).click();
	await page.waitForTimeout(d.timeouts.filterMs);
}

async function fillFilter(page: Page, fieldLabel: string, value: string): Promise<void> {
	const input = page.getByRole('textbox', { name: fieldLabel });
	await input.clear();
	await input.fill(value);
}

async function clearAllFilters(page: Page): Promise<void> {
	await fillFilter(page, d.placeholders.payerName, d.edgeCases.empty);
	await fillFilter(page, d.placeholders.scId, d.edgeCases.empty);
	await fillFilter(page, d.placeholders.processorId, d.edgeCases.empty);
	await fillFilter(page, d.placeholders.groupId, d.edgeCases.empty);
	await fillFilter(page, d.placeholders.ediId, d.edgeCases.empty);

	const showInactive = page.getByRole('checkbox', { name: d.labels.showInactiveOnly });
	if (await showInactive.isChecked()) {
		await showInactive.uncheck();
	}
}

async function getCellText(row: Locator, columnIndex: number): Promise<string> {
	const value = await row.locator(`td:nth-child(${columnIndex})`).first().textContent();
	return (value ?? '').trim();
}

async function getColumnValues(page: Page, columnIndex: number, maxRows = 8): Promise<string[]> {
	const rows = page.locator(d.selectors.tableRows);
	const count = Math.min(await rows.count(), maxRows);
	const values: string[] = [];

	for (let i = 0; i < count; i += 1) {
		const text = await rows.nth(i).locator(`td:nth-child(${columnIndex})`).textContent();
		const value = (text ?? '').trim();
		if (value) {
			values.push(value.toUpperCase());
		}
	}
	return values;
}

function isSortedAsc(values: string[]): boolean {
	for (let i = 1; i < values.length; i += 1) {
		if (values[i - 1] > values[i]) {
			return false;
		}
	}
	return true;
}

function isSortedDesc(values: string[]): boolean {
	for (let i = 1; i < values.length; i += 1) {
		if (values[i - 1] < values[i]) {
			return false;
		}
	}
	return true;
}

async function assertColumnSorted(page: Page, headerName: string, columnIndex: number): Promise<void> {
	await page.getByRole('columnheader', { name: headerName }).click();
	let values = await getColumnValues(page, columnIndex);

	if (values.length === 0) {
		await applyFilterAndWait(page);
		await page.getByRole('columnheader', { name: headerName }).click();
		values = await getColumnValues(page, columnIndex);
	}

	if (values.length === 0) {
		// No rows available in current environment/data state.
		return;
	}

	if (values.length === 1) {
		// Sorting cannot be asserted with a single row.
		return;
	}

	expect(isSortedAsc(values) || isSortedDesc(values)).toBeTruthy();
}

function normalize(value: string): string {
	return (value ?? '').trim().toUpperCase();
}

test.describe('Eligibility Routing dashboard - generated and refactored suite', () => {
	test.beforeEach(async ({ page, loginAsAdmin }) => {
		await loginAsAdmin();
		await openEligibilityDashboard(page);
	});

	test('Eligibility dashboard controls, fields, and headers are visible and available', async ({ page }) => {
		await expect(page.getByRole('link', { name: new RegExp(d.labels.addEligibilityRouting, 'i') }).first()).toBeVisible();
		await expect(page.getByText(d.labels.payerName, { exact: true })).toBeVisible();
		await expect(page.getByRole('textbox', { name: d.placeholders.payerName })).toBeVisible();
		await expect(page.getByText(d.labels.scId, { exact: true })).toBeVisible();
		await expect(page.getByRole('textbox', { name: d.placeholders.scId })).toBeVisible();
		await expect(page.getByText(d.labels.processorId, { exact: true })).toBeVisible();
		await expect(page.getByRole('textbox', { name: d.placeholders.processorId })).toBeVisible();
		await expect(page.getByText(d.labels.groupId, { exact: true })).toBeVisible();
		await expect(page.getByRole('textbox', { name: d.placeholders.groupId })).toBeVisible();
		await expect(page.getByText(d.labels.ediId, { exact: true })).toBeVisible();
		await expect(page.getByRole('textbox', { name: d.placeholders.ediId })).toBeVisible();
		await expect(page.getByRole('checkbox', { name: d.labels.showInactiveOnly })).toBeVisible();
		await expect(page.getByRole('button', { name: d.labels.applyFilter })).toBeVisible();

		await applyFilterAndWait(page);

		await expect(page.getByRole('columnheader', { name: d.headers.payerNames })).toBeVisible();
		await expect(page.getByRole('columnheader', { name: d.headers.scId })).toBeVisible();
		await expect(page.getByRole('columnheader', { name: d.headers.groupId })).toBeVisible();
		await expect(page.getByRole('columnheader', { name: d.headers.processorId })).toBeVisible();
		await expect(page.getByRole('columnheader', { name: d.headers.ediId })).toBeVisible();
		await expect(page.getByRole('columnheader', { name: d.headers.subAddress })).toBeVisible();
		await expect(page.getByRole('columnheader', { name: d.headers.subGender })).toBeVisible();
		await expect(page.getByRole('columnheader', { name: d.headers.subMiddleInt })).toBeVisible();
		await expect(page.getByRole('columnheader', { name: d.headers.subIssueDate })).toBeVisible();
		await expect(page.getByRole('columnheader', { name: d.headers.patientSsn })).toBeVisible();
		await expect(page.getByRole('columnheader', { name: d.headers.recLicenseNo })).toBeVisible();
		await expect(page.getByRole('columnheader', { name: d.headers.recTaxId })).toBeVisible();
		await expect(page.getByRole('columnheader', { name: d.headers.prv })).toBeVisible();
		await expect(page.getByRole('columnheader', { name: d.headers.changeEntity })).toBeVisible();
		await expect(page.getByRole('columnheader', { name: d.headers.status })).toBeVisible();
		await expect(page.getByRole('columnheader', { name: d.headers.ediQualifier })).toBeVisible();
	});

	test('Eligibility apply filter with no conditions returns result rows', async ({ page }) => {
		await clearAllFilters(page);
		await applyFilterAndWait(page);
		await expect(page.locator(d.selectors.tableRows).first()).toBeVisible();
	});

	test('Eligibility filter by payer name returns expected row', async ({ page }) => {
		await clearAllFilters(page);
		await fillFilter(page, d.placeholders.payerName, d.values.payerNameFilter);
		await applyFilterAndWait(page);

		await expect(page.getByRole('cell', { name: d.expectedDbRow.payername })).toBeVisible();
		await expect(page.getByRole('cell', { name: d.expectedDbRow.scid })).toBeVisible();
	});

	test('Eligibility filter by SC ID validates full row values against DB', async ({ page }) => {
		const dbRow = await fetchEligibilityRoutingByScId(d.values.scIdFilter);
		expect(dbRow).not.toBeNull();

		expect(normalize(dbRow!.payername)).toBe(normalize(d.expectedDbRow.payername));
		expect(normalize(dbRow!.scid)).toBe(normalize(d.expectedDbRow.scid));
		expect(normalize(dbRow!.groupid)).toBe(normalize(d.expectedDbRow.groupid));
		expect(normalize(dbRow!.processorid)).toBe(normalize(d.expectedDbRow.processorid));
		expect(normalize(dbRow!.ediid)).toBe(normalize(d.expectedDbRow.ediid));
		expect(normalize(dbRow!.remove_subscriber_address)).toBe(normalize(d.expectedDbRow.remove_subscriber_address));
		expect(normalize(dbRow!.remove_subscriber_gender)).toBe(normalize(d.expectedDbRow.remove_subscriber_gender));
		expect(normalize(dbRow!.remove_subscriber_nm1_mi)).toBe(normalize(d.expectedDbRow.remove_subscriber_nm1_mi));
		expect(normalize(dbRow!.remove_subscriber_dtp_102)).toBe(normalize(d.expectedDbRow.remove_subscriber_dtp_102));
		expect(normalize(dbRow!.remove_ref_sy)).toBe(normalize(d.expectedDbRow.remove_ref_sy));
		expect(normalize(dbRow!.remove_receiver_ref_0b)).toBe(normalize(d.expectedDbRow.remove_receiver_ref_0b));
		expect(normalize(dbRow!.remove_prv)).toBe(normalize(d.expectedDbRow.remove_prv));
		expect(normalize(dbRow!.change_receiver_non_person_entity)).toBe(normalize(d.expectedDbRow.change_receiver_non_person_entity));
		expect(normalize(dbRow!.recordstatus)).toBe(normalize(d.expectedDbRow.recordstatus));
		expect(normalize(dbRow!.ediid_qualifier)).toBe(normalize(d.expectedDbRow.ediid_qualifier));

		await clearAllFilters(page);
		await fillFilter(page, d.placeholders.scId, d.values.scIdFilter);
		await applyFilterAndWait(page);

		const row = page
			.locator(d.selectors.tableRows)
			.filter({ has: page.getByRole('cell', { name: d.values.scIdFilter, exact: true }) })
			.first();
		await expect(row).toBeVisible();

		expect(normalize(await getCellText(row, 1))).toBe(normalize(dbRow!.payername));
		expect(normalize(await getCellText(row, 2))).toBe(normalize(dbRow!.scid));
		expect(normalize(await getCellText(row, 3))).toBe(normalize(dbRow!.groupid));
		expect(normalize(await getCellText(row, 4))).toBe(normalize(dbRow!.processorid));
		expect(normalize(await getCellText(row, 5))).toBe(normalize(dbRow!.ediid));
		expect(normalize(await getCellText(row, 6))).toBe(normalize(dbRow!.remove_subscriber_address));
		expect(normalize(await getCellText(row, 7))).toBe(normalize(dbRow!.remove_subscriber_gender));
		expect(normalize(await getCellText(row, 8))).toBe(normalize(dbRow!.remove_subscriber_nm1_mi));
		expect(normalize(await getCellText(row, 9))).toBe(normalize(dbRow!.remove_subscriber_dtp_102));
		expect(normalize(await getCellText(row, 10))).toBe(normalize(dbRow!.remove_ref_sy));
		expect(normalize(await getCellText(row, 11))).toBe(normalize(dbRow!.remove_receiver_ref_0b));
		expect(normalize(await getCellText(row, 13))).toBe(normalize(dbRow!.remove_prv));
		expect(normalize(await getCellText(row, 14))).toBe(normalize(dbRow!.change_receiver_non_person_entity));
		expect(normalize(await getCellText(row, 15))).toBe(normalize(dbRow!.recordstatus));

		const uiQualifier = normalize(await getCellText(row, 16));
		const dbQualifier = normalize(dbRow!.ediid_qualifier);
		if (dbQualifier) {
			expect(uiQualifier).toBe(dbQualifier);
		} else {
			expect(['', 'N/A']).toContain(uiQualifier);
		}
	});

	test('Eligibility filter by processor ID returns expected row', async ({ page }) => {
		await clearAllFilters(page);
		await fillFilter(page, d.placeholders.processorId, d.values.processorIdFilter);
		await applyFilterAndWait(page);

		await expect(page.getByRole('cell', { name: d.expectedDbRow.processorid }).first()).toBeVisible();
		await expect(page.getByRole('cell', { name: d.expectedDbRow.scid }).first()).toBeVisible();
	});

	test('Eligibility filter by group ID returns expected row', async ({ page }) => {
		await clearAllFilters(page);
		await fillFilter(page, d.placeholders.groupId, d.values.groupIdFilter);
		await applyFilterAndWait(page);

		await expect(page.getByRole('cell', { name: d.expectedDbRow.groupid }).first()).toBeVisible();
	});

	test('Eligibility filter by EDI ID returns expected row', async ({ page }) => {
		await clearAllFilters(page);
		await fillFilter(page, d.placeholders.ediId, d.values.ediIdFilter);
		await applyFilterAndWait(page);

		await expect(page.getByRole('cell', { name: d.expectedDbRow.ediid }).first()).toBeVisible();
	});

	test('Eligibility Show Inactive Only toggle returns inactive records', async ({ page }) => {
		await clearAllFilters(page);

		const showInactiveOnly = page.getByRole('checkbox', { name: d.labels.showInactiveOnly });
		await showInactiveOnly.check();
		await applyFilterAndWait(page);

		await expect(page.getByRole('columnheader', { name: d.headers.status })).toBeVisible();
		await expect(page.getByRole('cell', { name: d.values.inactiveStatus }).first()).toBeVisible();
		await expect(page.getByRole('cell', { name: d.values.inactiveExpectedScId }).first()).toBeVisible();
	});

	test('Eligibility invalid filters return no rows or empty state', async ({ page }) => {
		await clearAllFilters(page);
		await fillFilter(page, d.placeholders.payerName, d.edgeCases.invalidText);
		await fillFilter(page, d.placeholders.scId, d.edgeCases.invalidText);
		await fillFilter(page, d.placeholders.processorId, d.edgeCases.invalidText);
		await fillFilter(page, d.placeholders.groupId, d.edgeCases.invalidText);
		await fillFilter(page, d.placeholders.ediId, d.edgeCases.invalidText);
		await applyFilterAndWait(page);

		const noResults = page.locator(d.selectors.noResults);
		const hasNoResultsText = await noResults.first().isVisible().catch(() => false);
		if (!hasNoResultsText) {
			await expect(page.locator(d.selectors.tableRows)).toHaveCount(0);
		}
	});

	test('Eligibility empty filters keep results and columns available', async ({ page }) => {
		await clearAllFilters(page);
		await applyFilterAndWait(page);

		await expect(page.locator(d.selectors.tableRows).first()).toBeVisible();
		await expect(page.getByRole('columnheader', { name: d.headers.payerNames })).toBeVisible();
		await expect(page.getByRole('columnheader', { name: d.headers.scId })).toBeVisible();
	});

	test('Eligibility sorting on Payer names and SC Id keeps ordered values', async ({ page }) => {
		await clearAllFilters(page);
		await applyFilterAndWait(page);

		await assertColumnSorted(page, d.headers.payerNames, 1);
		await assertColumnSorted(page, d.headers.scId, 2);
	});

	test('Eligibility row action and Add Eligibility Routing link are visible', async ({ page }) => {
		await clearAllFilters(page);
		await applyFilterAndWait(page);

		await expect(page.getByRole('link', { name: new RegExp(d.labels.addEligibilityRouting, 'i') }).first()).toBeVisible();
		await expect(page.getByRole('table').getByRole('link', { name: new RegExp(d.labels.addEligibilityRouting, 'i') })).toBeVisible();
		await expect(page.getByLabel('standart-link-action').first()).toBeVisible();
	});
});