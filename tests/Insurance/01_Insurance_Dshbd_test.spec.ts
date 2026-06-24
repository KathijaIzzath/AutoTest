
import { test, expect } from '../myTestData';
import type { Page } from '@playwright/test';
import { navigateToInsurance } from '../framework/navigation.helper';
import {
	fetchInsuranceRowsByNeicId,
	fetchInsuranceByProcessorId,
	fetchLatestInsuranceCompanies,
} from '../../testData/database.utils';
import * as d from '../../testData/InsuranceDshbdTestData.json';

async function openInsuranceDashboard(page: Page): Promise<void> {
	await navigateToInsurance(page);
	await expect(page.locator(d.selectors.insuranceRoot).getByText(d.labels.insurance, { exact: true })).toBeVisible();
}

async function applyFilterAndWait(page: Page): Promise<void> {
	await page.getByRole('button', { name: d.labels.applyFilter }).click();
	await page.waitForTimeout(d.timeouts.filterMs);
}

async function fillTextboxFilter(page: Page, placeholder: string, value: string): Promise<void> {
	const input = page.getByRole('textbox', { name: placeholder });
	await input.clear();
	await input.fill(value);
}

async function resetBaseFilters(page: Page): Promise<void> {
	await fillTextboxFilter(page, d.placeholders.name, d.edgeCases.empty);
	await fillTextboxFilter(page, d.placeholders.processorId, d.edgeCases.empty);
	await fillTextboxFilter(page, d.placeholders.ediId, d.edgeCases.empty);
	await page.locator(d.selectors.stateSelect).selectOption('');
	const inactive = page.getByRole('checkbox', { name: d.labels.showInactiveOnly });
	if (await inactive.isChecked()) {
		await inactive.uncheck();
	}
}

test.describe('Insurance dashboard - refactored generated suite', () => {
	test('Insurance dashboard controls visibility and availability', async ({ page, loginAsAdmin }) => {
		await loginAsAdmin();
		await openInsuranceDashboard(page);

		await expect(page.getByText(d.labels.name, { exact: true })).toBeVisible();
		await expect(page.getByRole('textbox', { name: d.placeholders.name })).toBeVisible();
		await expect(page.getByText(d.labels.processorId, { exact: true })).toBeVisible();
		await expect(page.getByRole('textbox', { name: d.placeholders.processorId })).toBeVisible();
		await expect(page.getByText(d.labels.ediId, { exact: true })).toBeVisible();
		await expect(page.getByRole('textbox', { name: d.placeholders.ediId })).toBeVisible();
		await expect(page.getByText(d.labels.state, { exact: true })).toBeVisible();
		await expect(page.locator(d.selectors.stateSelect)).toBeVisible();
		await expect(page.getByRole('checkbox', { name: d.labels.showInactiveOnly })).toBeVisible();
		await expect(page.getByText(d.labels.showInactiveOnly)).toBeVisible();
		await expect(page.getByRole('button', { name: d.labels.applyFilter })).toBeVisible();
	});

	test('Insurance filter by Name (upper/lower) returns successful results', async ({ page, loginAsAdmin }) => {
		await loginAsAdmin();
		await openInsuranceDashboard(page);

		await fillTextboxFilter(page, d.placeholders.name, d.values.nameUpper);
		await applyFilterAndWait(page);
		await expect(page.getByRole('columnheader', { name: d.headers.insuranceNameAsc })).toBeVisible();
		await expect(page.getByRole('columnheader', { name: d.headers.recordStatus })).toBeVisible();
		await expect(page.getByRole('cell', { name: d.values.expectedNameByNeicId })).toBeVisible();

		await fillTextboxFilter(page, d.placeholders.name, d.values.nameLower);
		await applyFilterAndWait(page);
		await expect(page.getByRole('cell', { name: d.values.expectedNameByNeicId })).toBeVisible();
	});

	test('Insurance filter by Processor ID validates DB name and record status', async ({ page, loginAsAdmin }) => {
		await loginAsAdmin();
		await openInsuranceDashboard(page);

		const dbInsurance = await fetchInsuranceByProcessorId(d.values.processorId);
		expect(dbInsurance).not.toBeNull();
		expect(dbInsurance?.name).toBe(d.values.expectedNameByProcessorId);

		await fillTextboxFilter(page, d.placeholders.processorId, d.values.processorId);
		await applyFilterAndWait(page);

		await expect(page.getByRole('cell', { name: dbInsurance!.name })).toBeVisible();
		await expect(page.getByRole('cell', { name: dbInsurance!.recordstatus }).first()).toBeVisible();
	});

	test('Insurance filter by EDI ID validates DB name and record status', async ({ page, loginAsAdmin }) => {
		await loginAsAdmin();
		await openInsuranceDashboard(page);

		const dbRows = await fetchInsuranceRowsByNeicId(d.values.neicid);
		expect(dbRows.length).toBeGreaterThan(0);

		await fillTextboxFilter(page, d.placeholders.ediId, d.values.neicid);
		await applyFilterAndWait(page);

		const firstRow = page.locator('tbody tr').first();
		const uiName = ((await firstRow.locator('td').nth(2).textContent()) ?? '').trim();
		const uiStatus = ((await firstRow.locator('td').nth(5).textContent()) ?? '').trim();

		const matchedDbRow = dbRows.find(
			row =>
				row.recordstatus === uiStatus
				&& (
					uiName.toUpperCase().includes(row.name.toUpperCase())
					|| row.name.toUpperCase().includes(uiName.toUpperCase())
				)
		);
		expect(matchedDbRow).toBeTruthy();
		await expect(page.getByRole('cell', { name: uiName }).first()).toBeVisible();
	});

	test('Insurance latest DB row can be searched by Processor ID and validated in grid', async ({ page, loginAsAdmin }) => {
		await loginAsAdmin();
		await openInsuranceDashboard(page);

		const latestRows = await fetchLatestInsuranceCompanies(1);
		expect(latestRows.length).toBeGreaterThan(0);

		const latest = latestRows[0];
		await fillTextboxFilter(page, d.placeholders.processorId, latest.id);
		await applyFilterAndWait(page);

		await expect(page.getByRole('cell', { name: latest.name })).toBeVisible();
		await expect(page.getByRole('cell', { name: latest.recordstatus }).first()).toBeVisible();
	});

	test('Insurance filter by State validates successful search result', async ({ page, loginAsAdmin }) => {
		await loginAsAdmin();
		await openInsuranceDashboard(page);

		await page.locator(d.selectors.stateSelect).selectOption(d.values.state);
		await applyFilterAndWait(page);

		await expect(page.getByRole('columnheader', { name: d.headers.insuranceNameAsc })).toBeVisible();
		await expect(page.getByRole('cell', { name: d.values.expectedNameByNeicId })).toBeVisible();
	});

	test('Insurance Show Inactive Only toggle shows inactive then active statuses', async ({ page, loginAsAdmin }) => {
		await loginAsAdmin();
		await openInsuranceDashboard(page);

		const showInactiveOnly = page.getByRole('checkbox', { name: d.labels.showInactiveOnly });
		await expect(showInactiveOnly).toBeVisible();

		if (await showInactiveOnly.isChecked()) {
			await showInactiveOnly.uncheck();
		}
		await showInactiveOnly.check();
		await applyFilterAndWait(page);

		await expect(page.getByRole('columnheader', { name: d.headers.recordStatus })).toBeVisible();
		await expect(page.getByRole('cell', { name: d.values.inactiveStatus }).first()).toBeVisible();

		await showInactiveOnly.uncheck();
		await applyFilterAndWait(page);
		await expect(page.getByRole('cell', { name: d.values.activeStatus }).first()).toBeVisible();
	});

	test('Insurance empty filters keep grid and columns available', async ({ page, loginAsAdmin }) => {
		await loginAsAdmin();
		await openInsuranceDashboard(page);

		await resetBaseFilters(page);
		await applyFilterAndWait(page);

		await expect(page.getByRole('button', { name: d.labels.applyFilter })).toBeVisible();
		await expect(page.getByRole('columnheader', { name: d.headers.insuranceNameAsc })).toBeVisible();
		await expect(page.getByRole('columnheader', { name: d.headers.recordStatus })).toBeVisible();
	});

	test('Insurance invalid Name/Processor/EDI filters return no rows', async ({ page, loginAsAdmin }) => {
		await loginAsAdmin();
		await openInsuranceDashboard(page);

		await fillTextboxFilter(page, d.placeholders.name, d.edgeCases.invalidName);
		await fillTextboxFilter(page, d.placeholders.processorId, d.edgeCases.invalidProcessorId);
		await fillTextboxFilter(page, d.placeholders.ediId, d.edgeCases.invalidEdiId);
		await applyFilterAndWait(page);

		const rowCount = await page.locator('tbody tr').count();
		expect(rowCount).toBe(0);
	});
});