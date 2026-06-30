
import { test, expect } from '../myTestData';
import type { Locator, Page } from '@playwright/test';
import { navigateToEligibilityRouting } from '../framework/navigation.helper';
import {
	deleteEligibilityRoutingByComposite,
	fetchEligibilityRoutingRowsByScId,
} from '../../testData/database.utils';
import * as d from '../../testData/EditEligibilityTestData.json';

async function openEligibilityDashboard(page: Page): Promise<void> {
	await navigateToEligibilityRouting(page);
	await expect(page.locator(d.selectors.root).getByText(d.labels.title, { exact: true })).toBeVisible();
}

async function applyFilterAndWait(page: Page): Promise<void> {
	await page.getByRole('button', { name: d.labels.applyFilter }).click();
	await page.waitForTimeout(d.timeouts.filterMs);
}

async function searchByScId(page: Page, scId: string): Promise<void> {
	await page.getByRole('textbox', { name: d.placeholders.scIdFilter }).fill(scId);
	await applyFilterAndWait(page);
}

async function selectPayerOption(page: Page, optionText: string, searchText: string): Promise<void> {
	const payerInput = page.getByRole('combobox').getByRole('textbox').first();
	await payerInput.click();
	await payerInput.fill(d.edgeCases.empty);
	await payerInput.fill(searchText);

	const option = page.getByRole('option', { name: new RegExp(optionText, 'i') }).first();
	const optionVisible = await option.isVisible({ timeout: d.timeouts.optionMs }).catch(() => false);
	if (optionVisible) {
		await option.click();
	} else {
		await payerInput.press('ArrowDown');
		await payerInput.press('Enter');
	}
}

async function openRowActionAndEdit(page: Page): Promise<void> {
	const targetRow = page
		.locator(d.selectors.tableRows)
		.filter({ has: page.getByRole('cell', { name: d.values.scId, exact: true }) })
		.first();
	await expect(targetRow).toBeVisible();

	const rowAction = targetRow.getByLabel(d.selectors.rowActionLabel).first();
	const editControl = page
		.getByRole('button', { name: d.labels.edit })
		.or(page.getByRole('link', { name: d.labels.edit }))
		.first();

	for (let attempt = 0; attempt < 3; attempt += 1) {
		await rowAction.click();
		if (await editControl.isVisible({ timeout: 2000 }).catch(() => false)) {
			break;
		}
	}

	await expect(editControl).toBeVisible();
	await editControl.click();
	await expect(page.getByRole('heading', { name: d.labels.editHeading })).toBeVisible();
}

async function openSpecificRowActionAndEdit(page: Page, row: Locator): Promise<void> {
	const rowAction = row.getByLabel(d.selectors.rowActionLabel).first();
	const editControl = page
		.getByRole('button', { name: d.labels.edit })
		.or(page.getByRole('link', { name: d.labels.edit }))
		.first();

	for (let attempt = 0; attempt < 3; attempt += 1) {
		await rowAction.click();
		if (await editControl.isVisible({ timeout: 2000 }).catch(() => false)) {
			break;
		}
	}

	await expect(editControl).toBeVisible();
	await editControl.click();
	await expect(page.getByRole('heading', { name: d.labels.editHeading })).toBeVisible();
}

async function closeEditDialog(page: Page): Promise<void> {
	const dialog = page.getByRole('dialog').first();
	const closeLink = dialog.getByRole('link').first();
	if (await closeLink.isVisible().catch(() => false)) {
		await closeLink.click();
	} else {
		await page.keyboard.press('Escape');
	}
}

async function ensureRecordExistsForEdit(page: Page): Promise<void> {
	const existingRows = await fetchEligibilityRoutingRowsByScId(d.values.scId);
	if (existingRows.length > 0) {
		return;
	}

	await deleteEligibilityRoutingByComposite(
		d.values.scId,
		d.values.processorId,
		d.values.seedEdiId,
		d.values.groupId
	);

	await page.getByRole('link', { name: new RegExp(d.labels.addEligibilityRouting, 'i') }).first().click();
	await selectPayerOption(page, d.values.seedPayerOption, d.values.seedPayerSearchText);
	await page.getByRole('textbox', { name: d.placeholders.scIdFilter }).fill(d.values.scId);
	await page.getByRole('textbox', { name: d.placeholders.processorId }).fill(d.values.processorId);
	await page.getByRole('textbox', { name: d.placeholders.ediId }).fill(d.values.seedEdiId);
	await page.getByRole('textbox', { name: d.placeholders.groupId }).fill(d.values.groupId);
	await page.getByRole('button', { name: d.labels.add }).click();
	await expect(page.getByLabel(d.labels.successToastPrefix)).toBeVisible({ timeout: d.timeouts.saveMs });
}

async function assertEditDialogFieldsVisible(page: Page): Promise<void> {
	await expect(page.getByRole('heading', { name: d.labels.editHeading })).toBeVisible();
	await expect(page.getByRole('dialog').getByText('payer name')).toBeVisible();
	await expect(page.getByRole('combobox').getByRole('textbox').first()).toBeVisible();
	await expect(page.getByRole('dialog').getByText('SC ID')).toBeVisible();
	await expect(page.getByRole('dialog').getByText('group ID')).toBeVisible();
	await expect(page.getByText('Processor ID', { exact: true })).toBeVisible();
	await expect(page.getByRole('dialog').getByText('edi ID')).toBeVisible();
	await expect(page.getByRole('checkbox', { name: d.labels.active })).toBeVisible();
	await expect(page.getByText(d.labels.active, { exact: true })).toBeVisible();
	await expect(page.getByRole('button', { name: d.labels.save })).toBeVisible();
}

test.describe('Eligibility Routing Edit - generated and refactored suite', () => {
	test.beforeEach(async ({ page, loginAsAdmin }) => {
		await loginAsAdmin();
		await openEligibilityDashboard(page);
		await ensureRecordExistsForEdit(page);
	});

	test('Edit Eligibility Routing functional flow with successful save and validations', async ({ page }) => {
		await searchByScId(page, d.values.scId);
		await expect(page.getByRole('cell', { name: d.values.scId, exact: true }).first()).toBeVisible();
		await openRowActionAndEdit(page);

		await selectPayerOption(page, d.values.editPayerOption, d.values.editPayerSearchText);
		await page.getByRole('textbox', { name: d.placeholders.ediId }).fill(d.values.editedEdiId);
		await page.getByRole('button', { name: d.labels.save }).click();
		await expect(page.getByLabel(d.labels.updatedSuccessToast)).toBeVisible({ timeout: d.timeouts.saveMs });

		await applyFilterAndWait(page);
		await expect(page.getByRole('columnheader', { name: d.headers.ediId })).toBeVisible();
		await expect(page.getByRole('cell', { name: d.values.editedEdiId }).first()).toBeVisible();
		await expect(page.getByRole('columnheader', { name: d.headers.payerNames })).toBeVisible();
		await expect(page.getByRole('cell', { name: d.values.editedPayerName }).first()).toBeVisible();
		await expect(page.getByRole('columnheader', { name: d.headers.status })).toBeVisible();
		await expect(page.getByRole('cell', { name: d.values.activeStatus, exact: true }).first()).toBeVisible();

		const editedRow = page.getByRole('row', { name: new RegExp(`${d.values.editedPayerName}\\s+${d.values.scId}`, 'i') });
		await openSpecificRowActionAndEdit(page, editedRow);
		await assertEditDialogFieldsVisible(page);
		await closeEditDialog(page);
	});

	test('DB validation confirms edited SX176 record exists with expected values', async ({ page }) => {
		await searchByScId(page, d.values.scId);
		await openRowActionAndEdit(page);

		await selectPayerOption(page, d.values.editPayerOption, d.values.editPayerSearchText);
		await page.getByRole('textbox', { name: d.placeholders.ediId }).fill(d.values.editedEdiId);
		await page.getByRole('button', { name: d.labels.save }).click();
		await expect(page.getByLabel(d.labels.updatedSuccessToast)).toBeVisible({ timeout: d.timeouts.saveMs });

		const rows = await fetchEligibilityRoutingRowsByScId(d.values.scId);
		expect(rows.length).toBeGreaterThan(0);

		const matchedRow = rows.find((row) =>
			row.scid.trim().toUpperCase() === d.values.scId
			&& row.payername.trim().toUpperCase() === d.values.editedPayerName
			&& row.groupid.trim().toUpperCase() === d.values.groupId
			&& row.processorid.trim().toUpperCase() === d.values.processorId
			&& row.ediid.trim().toUpperCase() === d.values.editedEdiId
			&& row.recordstatus.trim().toUpperCase() === d.values.activeStatus
		);
		expect(matchedRow).toBeTruthy();
	});

	test('Edit modal fields are visible and available', async ({ page }) => {
		await searchByScId(page, d.values.scId);
		await openRowActionAndEdit(page);
		await assertEditDialogFieldsVisible(page);
		await closeEditDialog(page);
	});

	test('Active checkbox is unselected when preselected and then restored', async ({ page }) => {
		await searchByScId(page, d.values.scId);
		await openRowActionAndEdit(page);

		const activeCheckbox = page.getByRole('checkbox', { name: d.labels.active });
		if (await activeCheckbox.isChecked()) {
			await activeCheckbox.uncheck();
			await expect(activeCheckbox).not.toBeChecked();
			await activeCheckbox.check();
		}

		await expect(activeCheckbox).toBeChecked();
		await closeEditDialog(page);
	});

	test('Invalid SC ID filter returns no rows or empty state', async ({ page }) => {
		await searchByScId(page, d.edgeCases.invalidScId);
		const hasEmptyMessage = await page.locator(d.selectors.noResults).first().isVisible().catch(() => false);
		if (!hasEmptyMessage) {
			await expect(page.locator(d.selectors.tableRows)).toHaveCount(0);
		}
	});

	test('Empty SC ID filter keeps apply controls and grid available', async ({ page }) => {
		await searchByScId(page, d.edgeCases.empty);
		await expect(page.getByRole('button', { name: d.labels.applyFilter })).toBeVisible();
		await expect(page.getByRole('columnheader', { name: d.headers.scId })).toBeVisible();
	});

	test('Whitespace SC ID filter does not break behavior', async ({ page }) => {
		await searchByScId(page, d.edgeCases.whitespace);
		await expect(page.getByRole('button', { name: d.labels.applyFilter })).toBeVisible();
	});

	test('Edit save without changes keeps record values stable', async ({ page }) => {
		await searchByScId(page, d.values.scId);
		await openRowActionAndEdit(page);

		const ediInput = page.getByRole('textbox', { name: d.placeholders.ediId });
		const initialEdiValue = (await ediInput.inputValue()).trim();
		await page.getByRole('button', { name: d.labels.save }).click();
		await expect(page.getByLabel(d.labels.updatedSuccessToast)).toBeVisible({ timeout: d.timeouts.saveMs });

		await searchByScId(page, d.values.scId);
		const firstRow = page
			.locator(d.selectors.tableRows)
			.filter({ has: page.getByRole('cell', { name: d.values.scId, exact: true }) })
			.first();
		await expect(firstRow).toBeVisible();

		if (initialEdiValue.length > 0) {
			await expect(firstRow.getByRole('cell', { name: initialEdiValue })).toBeVisible();
		}
	});
});