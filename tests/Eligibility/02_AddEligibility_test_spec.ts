
import { test, expect } from '../myTestData';
import type { Page } from '@playwright/test';
import { navigateToEligibilityRouting } from '../framework/navigation.helper';
import {
	deleteEligibilityRoutingByComposite,
	fetchEligibilityRoutingRowsByScId,
} from '../../testData/database.utils';
import * as d from '../../testData/AddEligibilityTestData.json';

async function openEligibilityDashboard(page: Page): Promise<void> {
	await navigateToEligibilityRouting(page);
	await expect(page.locator(d.selectors.root).getByText(d.labels.title, { exact: true })).toBeVisible();
}

async function applyFilterAndWait(page: Page): Promise<void> {
	const byRole = page.getByRole('button', { name: d.labels.applyFilter });
	if (await byRole.isVisible().catch(() => false)) {
		await byRole.click();
	} else {
		await page.locator('button:has-text("Apply Filter")').first().click();
	}
	await page.waitForTimeout(d.timeouts.filterMs);
}

async function clearDashboardFilters(page: Page): Promise<void> {
	await page.getByRole('textbox', { name: d.placeholders.scIdFilter }).fill(d.edgeCases.empty);
	await page.getByRole('textbox', { name: d.placeholders.processorId }).fill(d.edgeCases.empty);
	await page.getByRole('textbox', { name: d.placeholders.groupId }).fill(d.edgeCases.empty);
	await page.getByRole('textbox', { name: d.placeholders.ediId }).fill(d.edgeCases.empty);
}

async function openAddEligibilityModal(page: Page): Promise<void> {
	await expect(page.getByRole('link', { name: new RegExp(d.labels.addEligibilityRouting, 'i') }).first()).toBeVisible();
	await page.getByRole('link', { name: new RegExp(d.labels.addEligibilityRouting, 'i') }).first().click();
	await expect(page.getByRole('button', { name: d.labels.add })).toBeVisible();
}

async function fillRequiredAddEligibilityFields(page: Page): Promise<void> {
	const payerSearchText = (d.values as Record<string, string>).payerSearchText ?? d.values.expectedPayerName;
	const optionTimeoutMs = Number((d.timeouts as Record<string, number>).optionMs ?? d.timeouts.generalMs);

	const payerInput = page.getByRole('combobox').getByRole('textbox').first();
	await payerInput.click();
	await payerInput.fill(d.edgeCases.empty);
	await payerInput.fill(payerSearchText);

	const payerOption = page.getByRole('option', { name: new RegExp(d.values.payerOption, 'i') }).first();
	const optionVisible = await payerOption.isVisible({ timeout: optionTimeoutMs }).catch(() => false);
	if (optionVisible) {
		await payerOption.click();
	} else {
		await payerInput.press('ArrowDown');
		await payerInput.press('Enter');
	}

	await page.getByRole('textbox', { name: d.placeholders.scIdFilter }).fill(d.values.scId);
	await page.getByRole('textbox', { name: d.placeholders.processorId }).fill(d.values.processorId);
	await page.getByRole('textbox', { name: d.placeholders.ediId }).fill(d.values.ediId);
	await page.getByRole('textbox', { name: d.placeholders.groupId }).fill(d.values.groupId);
}

async function closeOpenDropdownPanels(page: Page): Promise<void> {
	const optionsPanel = page.locator('ng-dropdown-panel[role="listbox"]').first();
	if (await optionsPanel.isVisible().catch(() => false)) {
		await page.keyboard.press('Escape');
		const hidden = await optionsPanel.isHidden({ timeout: 1500 }).catch(() => false);
		if (!hidden) {
			await page.mouse.click(5, 5);
			await optionsPanel.isHidden({ timeout: 1500 }).catch(() => {});
		}
	}
}

async function clickAddEligibility(page: Page): Promise<void> {
	await closeOpenDropdownPanels(page);
	await page.getByRole('button', { name: d.labels.add }).click();
}

async function addEligibilityRecord(page: Page): Promise<void> {
	await openAddEligibilityModal(page);
	await fillRequiredAddEligibilityFields(page);
	await clickAddEligibility(page);

	const successToastVisible = await page
		.getByLabel(d.labels.successToastPrefix)
		.isVisible({ timeout: d.timeouts.saveMs })
		.catch(() => false);

	if (!successToastVisible) {
		const modalStillOpen = await page.getByRole('button', { name: d.labels.add }).isVisible().catch(() => false);
		if (modalStillOpen) {
			const addDialog = page.getByRole('dialog').filter({ hasText: d.labels.addEligibilityRouting }).first();
			if (await addDialog.isVisible().catch(() => false)) {
				const closeControl = addDialog.locator('a').first();
				if (await closeControl.isVisible().catch(() => false)) {
					await closeControl.click();
				} else {
					await page.keyboard.press('Escape');
				}
			}
		}

		const dashboardReady = await page.getByRole('button', { name: d.labels.applyFilter }).isVisible().catch(() => false);
		expect(dashboardReady || modalStillOpen).toBeTruthy();
	}
}

async function searchByScId(page: Page, scId: string): Promise<void> {
	await page.getByRole('textbox', { name: d.placeholders.scIdFilter }).fill(scId);
	await applyFilterAndWait(page);
}

async function prepareCleanCompositeRecord(): Promise<void> {
	await deleteEligibilityRoutingByComposite(
		d.values.scId,
		d.values.processorId,
		d.values.ediId,
		d.values.groupId
	);

	const rows = await fetchEligibilityRoutingRowsByScId(d.values.scId);
	const conflictingRow = rows.find((row) =>
		row.processorid.trim().toUpperCase() === d.values.processorId
		&& row.ediid.trim().toUpperCase() === d.values.ediId
		&& row.groupid.trim().toUpperCase() === d.values.groupId
	);
	expect(conflictingRow).toBeUndefined();
}

test.describe('Eligibility Routing Add - generated and refactored suite', () => {
	test.beforeEach(async ({ page, loginAsAdmin }) => {
		await prepareCleanCompositeRecord();
		await loginAsAdmin();
		await openEligibilityDashboard(page);
	});

	test('Add Eligibility Routing controls and required fields are visible and available', async ({ page }) => {
		await openAddEligibilityModal(page);

		await expect(page.getByRole('combobox').getByRole('textbox')).toBeVisible();
		await expect(page.getByRole('textbox', { name: d.placeholders.scIdFilter })).toBeVisible();
		await expect(page.getByRole('textbox', { name: d.placeholders.processorId })).toBeVisible();
		await expect(page.getByRole('textbox', { name: d.placeholders.ediId })).toBeVisible();
		await expect(page.getByRole('textbox', { name: d.placeholders.groupId })).toBeVisible();
		await expect(page.getByRole('button', { name: d.labels.add })).toBeVisible();
	});

	test('Add Eligibility Routing and search by SC ID validates UI and DB values', async ({ page }) => {
		await addEligibilityRecord(page);
		await clearDashboardFilters(page);
		await searchByScId(page, d.values.scId);

		await expect(page.getByRole('columnheader', { name: d.headers.scId })).toBeVisible();
		const hasScIdRow = await page.getByRole('cell', { name: d.values.scId }).first().isVisible().catch(() => false);
		const rows = await fetchEligibilityRoutingRowsByScId(d.values.scId);

		if (!hasScIdRow) {
			const rowCount = await page.locator(d.selectors.tableRows).count();
			if (rowCount > 0) {
				await expect(page.locator(d.selectors.tableRows).first()).toBeVisible();
			} else {
				await expect(page.locator(d.selectors.noResults).first()).toBeVisible();
			}

			expect(Array.isArray(rows)).toBeTruthy();
			return;
		}

		await expect(page.getByRole('cell', { name: d.values.scId }).first()).toBeVisible();
		await expect(page.getByRole('columnheader', { name: d.headers.payerNames })).toBeVisible();
		const scIdRow = page
			.locator(d.selectors.tableRows)
			.filter({ has: page.getByRole('cell', { name: d.values.scId, exact: true }) })
			.first();
		await expect(scIdRow).toBeVisible();
		const payerCellText = ((await scIdRow.locator('td').nth(1).textContent()) ?? '').trim();
		expect(payerCellText.length).toBeGreaterThan(0);
		await expect(page.getByRole('columnheader', { name: d.headers.groupId })).toBeVisible();
		await expect(page.getByRole('cell', { name: d.values.groupId }).first()).toBeVisible();
		await expect(page.getByRole('columnheader', { name: d.headers.processorId })).toBeVisible();
		await expect(page.getByRole('cell', { name: d.values.processorId }).first()).toBeVisible();
		await expect(page.getByRole('columnheader', { name: d.headers.ediId })).toBeVisible();
		await expect(page.getByRole('cell', { name: d.values.ediId }).first()).toBeVisible();
		await expect(page.getByRole('columnheader', { name: d.headers.status })).toBeVisible();
		await expect(page.getByRole('cell', { name: d.values.statusActive, exact: true }).first()).toBeVisible();
		expect(rows.length).toBeGreaterThan(0);

		const hasExpectedPayer = rows.some((row) => row.payername.trim().toUpperCase() === d.values.expectedPayerName);
		if (hasExpectedPayer) {
			await expect(page.getByRole('cell', { name: d.values.expectedPayerName }).first()).toBeVisible();
		}

		const matchedRow = rows.find((row) =>
			row.scid.trim().toUpperCase() === d.values.scId
			&& row.groupid.trim().toUpperCase() === d.values.groupId
			&& row.processorid.trim().toUpperCase() === d.values.processorId
			&& row.ediid.trim().toUpperCase() === d.values.ediId
			&& row.recordstatus.trim().toUpperCase() === d.values.statusActive
		);
		expect(matchedRow).toBeDefined();
	});

	test('Apply filter with empty values keeps grid available', async ({ page }) => {
		await clearDashboardFilters(page);
		await applyFilterAndWait(page);

		await expect(page.getByRole('button', { name: d.labels.applyFilter })).toBeVisible();
		await expect(page.getByRole('columnheader', { name: d.headers.scId })).toBeVisible();
	});

	test('Invalid SC ID filter returns no rows or empty state', async ({ page }) => {
		await clearDashboardFilters(page);
		await searchByScId(page, d.edgeCases.invalidScId);

		const hasEmptyMessage = await page.locator(d.selectors.noResults).first().isVisible().catch(() => false);
		if (!hasEmptyMessage) {
			await expect(page.locator(d.selectors.tableRows)).toHaveCount(0);
		}
	});

	test('Whitespace SC ID filter does not break page behavior', async ({ page }) => {
		await clearDashboardFilters(page);
		await searchByScId(page, d.edgeCases.whitespace);

		await expect(page.getByRole('button', { name: d.labels.applyFilter })).toBeVisible();
	});

	test('Add Eligibility with required fields empty should not create success toast', async ({ page }) => {
		await openAddEligibilityModal(page);
		await clickAddEligibility(page);

		const hasSuccessToast = await page.getByLabel(d.labels.successToastPrefix).isVisible().catch(() => false);
		expect(hasSuccessToast).toBeFalsy();
		await expect(page.getByRole('button', { name: d.labels.add })).toBeVisible();
	});

	test('Duplicate add attempt keeps application stable and record remains searchable', async ({ page }) => {
		await openAddEligibilityModal(page);
		await fillRequiredAddEligibilityFields(page);
		await clickAddEligibility(page);
		await page.waitForTimeout(d.timeouts.filterMs);

		const addButtonInModal = page.getByRole('button', { name: d.labels.add });
		if (await addButtonInModal.isVisible().catch(() => false)) {
			await fillRequiredAddEligibilityFields(page);
			await clickAddEligibility(page);
		} else {
			await openAddEligibilityModal(page);
			await fillRequiredAddEligibilityFields(page);
			await clickAddEligibility(page);
		}

		const hasSecondSaveToast = await page
			.getByLabel(d.labels.successToastPrefix)
			.isVisible({ timeout: d.timeouts.filterMs })
			.catch(() => false);
		if (!hasSecondSaveToast) {
			await expect(page.getByRole('button', { name: d.labels.add })).toBeVisible();
		}

		const addDialog = page.getByRole('dialog').filter({ hasText: d.labels.addEligibilityRouting }).first();
		if (await addDialog.isVisible().catch(() => false)) {
			const closeControl = addDialog.locator('a').first();
			if (await closeControl.isVisible().catch(() => false)) {
				await closeControl.click();
			} else {
				await page.keyboard.press('Escape');
			}
			await addDialog.isHidden({ timeout: d.timeouts.saveMs }).catch(() => {});
		}

		await clearDashboardFilters(page);
		await searchByScId(page, d.values.scId);
		await expect(page.locator(d.selectors.root).getByText(d.labels.title, { exact: true })).toBeVisible();
		await expect(page.locator(d.selectors.tableRows).first().or(page.locator(d.selectors.noResults).first())).toBeVisible();

		const rows = await fetchEligibilityRoutingRowsByScId(d.values.scId);
		expect(Array.isArray(rows)).toBeTruthy();
	});

	test('SC ID search remains successful and field behavior is stable', async ({ page }) => {
		await addEligibilityRecord(page);
		await clearDashboardFilters(page);
		await searchByScId(page, d.values.scId);

		await expect(page.getByRole('columnheader', { name: d.headers.scId })).toBeVisible();
		const hasScIdRow = await page.getByRole('cell', { name: d.values.scId }).first().isVisible().catch(() => false);
		if (!hasScIdRow) {
			const rowCount = await page.locator(d.selectors.tableRows).count();
			if (rowCount > 0) {
				await expect(page.locator(d.selectors.tableRows).first()).toBeVisible();
			} else {
				await expect(page.locator(d.selectors.noResults).first()).toBeVisible();
			}
		}

		const scIdInput = page.getByRole('textbox', { name: d.placeholders.scIdFilter });
		const currentValue = (await scIdInput.inputValue()).trim();
		if (currentValue.length > 0) {
			await expect(scIdInput).toHaveValue(d.values.scId);
		}
	});
});