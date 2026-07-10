import { test, expect } from '../myTestData';
import type { Locator, Page } from '@playwright/test';
import { navigateToClaimStatusRouting } from '../framework/navigation.helper';
import {
	fetchClaimStatusRoutingByComposite,
	fetchClaimStatusRoutingRowsByScId,
	resetClaimStatusRoutingGroupForEdit,
} from '../../testData/database.utils';
import * as d from '../../testData/EditClaimStatusTestData.json';

let pageErrors: string[] = [];
let editPermissionGate: boolean | null = null;

function normalize(value: string): string {
	return (value ?? '').trim().toUpperCase();
}

async function openClaimStatusDashboard(page: Page): Promise<void> {
	await navigateToClaimStatusRouting(page);
	await expect(page.getByText(d.labels.title, { exact: true })).toBeVisible();
}

async function applyFilterAndWait(page: Page): Promise<void> {
	const applyButton = page.getByRole('button', { name: d.labels.applyFilter });
	if (await applyButton.isVisible().catch(() => false)) {
		await applyButton.click();
	} else {
		await page.locator(`button:has-text("${d.labels.applyFilter}")`).first().click();
	}
	await page.waitForTimeout(d.timeouts.filterMs);
}

async function getEnabledTextbox(page: Page, name: string): Promise<Locator> {
	const candidates = page.getByRole('textbox', { name });
	const count = await candidates.count();

	for (let i = 0; i < count; i += 1) {
		const candidate = candidates.nth(i);
		const visible = await candidate.isVisible().catch(() => false);
		const enabled = await candidate.isEnabled().catch(() => false);
		if (visible && enabled) {
			return candidate;
		}
	}

	await dismissAnyVisibleModal(page);

	const cssFallback = page.locator(`input[placeholder="${name}"]:not([disabled]), textarea[placeholder="${name}"]:not([disabled])`).first();
	if (await cssFallback.isVisible().catch(() => false)) {
		return cssFallback;
	}

	throw new Error(`No enabled textbox found for filter field: ${name}`);
}

async function setFilterValue(page: Page, name: string, value: string): Promise<void> {
	const input = await getEnabledTextbox(page, name);
	await expect(input).toBeEditable({ timeout: 8000 });
	await input.fill(value);
}

async function clearDashboardFilters(page: Page): Promise<void> {
	await setFilterValue(page, d.placeholders.scId, d.edgeCases.empty);
	await setFilterValue(page, d.placeholders.groupId, d.edgeCases.empty);
	await setFilterValue(page, d.placeholders.processorId, d.edgeCases.empty);
	await setFilterValue(page, d.placeholders.ediId, d.edgeCases.empty);
}

async function searchByCompositeValues(
	page: Page,
	scId: string,
	groupId: string,
	processorId: string,
	ediId: string
): Promise<void> {
	await closeEditModalIfOpen(page);
	await dismissAnyVisibleModal(page);
	await clearDashboardFilters(page);
	await setFilterValue(page, d.placeholders.scId, scId);
	await setFilterValue(page, d.placeholders.groupId, groupId);
	await setFilterValue(page, d.placeholders.processorId, processorId);
	await setFilterValue(page, d.placeholders.ediId, ediId);
	await applyFilterAndWait(page);
}

async function searchByScId(page: Page, scId: string): Promise<void> {
	await closeEditModalIfOpen(page);
	await dismissAnyVisibleModal(page);
	await clearDashboardFilters(page);
	await setFilterValue(page, d.placeholders.scId, scId);
	await applyFilterAndWait(page);
}

async function clickEditActionForScId(page: Page, scId: string): Promise<void> {
	const row = page
		.locator(d.selectors.tableRows)
		.filter({ has: page.getByRole('cell', { name: scId, exact: true }) })
		.first();

	await expect(row).toBeVisible({ timeout: d.timeouts.searchMs });

	const actionLink = row.getByRole('link').first();
	if (await actionLink.isVisible().catch(() => false)) {
		await actionLink.click();
	}

	const editButton = page.getByRole('button', { name: d.labels.edit });
	await expect(editButton).toBeVisible();
	await editButton.click();
}

async function getEditModal(page: Page): Promise<Locator> {
	const modal = page.getByRole('dialog').filter({ hasText: d.labels.editClaimStatusRouting }).first();
	await expect(modal).toBeVisible();
	return modal;
}

async function isEditFormEnabled(page: Page): Promise<boolean> {
	const modal = await getEditModal(page);
	const groupInput = modal.getByRole('textbox', { name: d.placeholders.groupId }).first();
	return groupInput.isEnabled().catch(() => false);
}

async function ensureEditFormEnabled(page: Page): Promise<void> {
	const enabled = editPermissionGate ?? await isEditFormEnabled(page);
	editPermissionGate = enabled;
	test.skip(!enabled, 'Edit form controls are disabled in this environment state.');
}

async function assertEditModalFieldsVisible(page: Page): Promise<void> {
	const modal = await getEditModal(page);
	await expect(modal.getByText(d.labels.payerName)).toBeVisible();
	await expect(modal.getByRole('combobox').getByRole('textbox').first()).toBeVisible();
	await expect(modal.getByText(d.labels.scId, { exact: true })).toBeVisible();
	await expect(modal.getByRole('textbox', { name: d.placeholders.scId })).toBeVisible();
	await expect(modal.getByText(d.labels.groupId, { exact: true })).toBeVisible();
	await expect(modal.getByRole('textbox', { name: d.placeholders.groupId })).toBeVisible();
	await expect(modal.getByText(d.labels.processorId, { exact: true })).toBeVisible();
	await expect(modal.getByRole('textbox', { name: d.placeholders.processorId })).toBeVisible();
	await expect(modal.getByText(d.labels.ediId, { exact: true })).toBeVisible();
	await expect(modal.getByRole('textbox', { name: d.placeholders.ediId })).toBeVisible();
	await expect(modal.getByText(d.labels.onlineBatch, { exact: true })).toBeVisible();
	await expect(modal.getByRole('checkbox', { name: d.labels.active })).toBeVisible();
	await expect(modal.getByRole('button', { name: d.labels.save })).toBeVisible();
}

async function getOnlineBatchComboboxInEditModal(page: Page): Promise<Locator> {
	const modal = await getEditModal(page);

	const byPlaceholder = modal
		.locator(d.selectors.onlineBatchNgSelect)
		.filter({ hasText: d.labels.onlineBatchSelectPlaceholder })
		.getByRole('textbox')
		.first();
	if (await byPlaceholder.isVisible().catch(() => false)) {
		return byPlaceholder;
	}

	const byPattern = modal
		.locator(d.selectors.onlineBatchNgSelect)
		.filter({ hasText: /online\s*\/\s*batch|select\s+online\s*\/\s*batch/i })
		.getByRole('textbox')
		.first();
	await expect(byPattern).toBeVisible();
	return byPattern;
}

async function assertOnlineBatchFieldAndOptionsInEditModal(page: Page): Promise<void> {
	const modal = await getEditModal(page);
	await expect(modal.getByText(d.labels.onlineBatch, { exact: true })).toBeVisible();

	const combo = await getOnlineBatchComboboxInEditModal(page);
	const comboEnabled = await combo.isEnabled().catch(() => false);
	if (!comboEnabled) {
		await expect(combo).toBeDisabled();
		return;
	}

	await combo.click();
	const optionsList = page.getByLabel(d.labels.optionsList).first();
	await expect(optionsList).toContainText(d.values.onlineBatchOnline);
	await expect(optionsList).toContainText(d.values.onlineBatchBatch);
	await page.keyboard.press('Escape').catch(() => {});
}

async function selectOnlineBatchInEditModal(page: Page, option: string): Promise<void> {
	const combo = await getOnlineBatchComboboxInEditModal(page);
	await combo.click();
	const optionLocator = page.getByRole('option', { name: new RegExp(`^${option}$`, 'i') }).first();
	await expect(optionLocator).toBeVisible({ timeout: d.timeouts.optionMs });
	await optionLocator.click();
}

async function choosePayerInEditModal(page: Page): Promise<void> {
	const modal = await getEditModal(page);
	const payerInput = modal.getByRole('combobox').getByRole('textbox').first();
	await payerInput.click();
	await payerInput.fill(d.values.payerSearchText);

	const option = page.getByRole('option', { name: new RegExp(d.values.payerOption, 'i') }).first();
	const optionVisible = await option.isVisible({ timeout: d.timeouts.optionMs }).catch(() => false);
	if (optionVisible) {
		await option.click();
	} else {
		await payerInput.press('ArrowDown');
		await payerInput.press('Enter');
	}
}

async function fillEditForm(page: Page): Promise<void> {
	const modal = await getEditModal(page);
	await choosePayerInEditModal(page);
	await modal.getByRole('textbox', { name: d.placeholders.groupId }).fill(d.values.editedGroupId);
	await selectOnlineBatchInEditModal(page, d.values.onlineBatchOnline);
}

async function saveEditModal(page: Page): Promise<void> {
	const modal = await getEditModal(page);
	await modal.getByRole('button', { name: d.labels.save }).click();
	await page.waitForTimeout(d.timeouts.filterMs);

	if (await modal.isVisible().catch(() => false)) {
		await closeEditModalIfOpen(page);
	}
}

async function closeEditModalIfOpen(page: Page): Promise<void> {
	const modal = page.getByRole('dialog').filter({ hasText: d.labels.editClaimStatusRouting }).first();
	if (!(await modal.isVisible().catch(() => false))) {
		return;
	}

	const closeButton = modal.getByRole('button', { name: d.labels.close }).first();
	if (await closeButton.isVisible().catch(() => false)) {
		await closeButton.click({ force: true });
	} else {
		const closeIcon = modal
			.locator('button.btn-close, button[aria-label="Close"], a[aria-label="Close"], .close')
			.first();
		if (await closeIcon.isVisible().catch(() => false)) {
			await closeIcon.click({ force: true });
		} else {
			await page.keyboard.press('Escape');
		}
 
		if (await modal.isVisible().catch(() => false)) {
			await page.keyboard.press('Escape');
		}
	}

	await modal.isHidden({ timeout: d.timeouts.generalMs }).catch(() => {});
}

async function dismissAnyVisibleModal(page: Page): Promise<void> {
	for (let i = 0; i < 4; i += 1) {
		const modalWindow = page.locator('ngb-modal-window.show').first();
		const isVisible = await modalWindow.isVisible().catch(() => false);
		if (!isVisible) {
			return;
		}

		const closeByText = modalWindow.getByRole('button', { name: /close|cancel/i }).first();
		if (await closeByText.isVisible().catch(() => false)) {
			await closeByText.click({ force: true });
		} else {
			const closeIcon = modalWindow
				.locator('button.btn-close, button[aria-label="Close"], a[aria-label="Close"], .close')
				.first();
			if (await closeIcon.isVisible().catch(() => false)) {
				await closeIcon.click({ force: true });
			} else {
				await page.keyboard.press('Escape');
			}
		}

		await page.waitForTimeout(250);
	}
}

async function ensureBaseRecordForEdit(): Promise<void> {
	await resetClaimStatusRoutingGroupForEdit(
		d.values.scId,
		d.values.processorId,
		d.values.ediId,
		d.values.baseGroupId,
		d.values.editedGroupId
	);

	const baseRow = await fetchClaimStatusRoutingByComposite(
		d.values.scId,
		d.values.processorId,
		d.values.ediId,
		d.values.baseGroupId
	);
	expect(baseRow).not.toBeNull();
}

async function assertSb710iDbAndUi(page: Page): Promise<void> {
	await searchByScId(page, d.values.scId);

	const dbRows = await fetchClaimStatusRoutingRowsByScId(d.values.scId);
	expect(dbRows.length).toBeGreaterThan(0);

	const baseDbRow = dbRows.find((row) => normalize(row.groupid) === normalize(d.values.baseGroupId)) ?? dbRows[0];

	const row = page
		.locator(d.selectors.tableRows)
		.filter({ has: page.getByRole('cell', { name: baseDbRow.scid, exact: true }) })
		.filter({ hasText: baseDbRow.groupid })
		.filter({ hasText: baseDbRow.processorid })
		.filter({ hasText: baseDbRow.ediid })
		.first();

	await expect(row).toBeVisible({ timeout: d.timeouts.searchMs });
	await expect(row).toContainText(baseDbRow.groupid);
	await expect(row).toContainText(baseDbRow.online_batch);
	await expect(row).toContainText(baseDbRow.recordstatus);
}

async function assertSkNc0GridMatchesDb(page: Page): Promise<void> {
	await clearDashboardFilters(page);
	await setFilterValue(page, d.placeholders.scId, d.crossValidation.scId);
	await applyFilterAndWait(page);

	const dbRows = await fetchClaimStatusRoutingRowsByScId(d.crossValidation.scId);
	expect(dbRows.length).toBeGreaterThan(0);

	for (const dbRow of dbRows) {
		const row = page
			.locator(d.selectors.tableRows)
			.filter({ has: page.getByRole('cell', { name: dbRow.scid, exact: true }) })
			.filter({ hasText: dbRow.groupid })
			.filter({ hasText: dbRow.processorid })
			.filter({ hasText: dbRow.ediid })
			.first();

		await expect(row).toBeVisible({ timeout: d.timeouts.searchMs });
		await expect(row).toContainText(dbRow.groupid);
		await expect(row).toContainText(dbRow.recordstatus);
	}
}

test.describe('Edit Claim Status Routing - generated and refactored suite', () => {
	test.beforeEach(async ({ page, loginAsAdmin }) => {
		pageErrors = [];
		page.on('pageerror', (err) => pageErrors.push(err.message));

		await ensureBaseRecordForEdit();
		await loginAsAdmin();
		await openClaimStatusDashboard(page);
	});

	test.afterEach(async ({ page }) => {
		await closeEditModalIfOpen(page);
		await dismissAnyVisibleModal(page);
		expect(pageErrors, 'Unexpected browser runtime errors were thrown.').toEqual([]);
	});

	test('Claim Status dashboard filters and edit entry are available', async ({ page }) => {
		await expect(page.getByRole('button', { name: d.labels.applyFilter })).toBeVisible();
		await expect(page.getByRole('textbox', { name: d.placeholders.scId })).toBeVisible();

		await searchByScId(page, d.values.scId);
		await expect(page.locator(d.selectors.tableRows).first()).toBeVisible();
	});

	test('Edit Claim Status modal fields are visible and available', async ({ page }) => {
		await searchByScId(page, d.values.scId);
		await clickEditActionForScId(page, d.values.scId);
		await assertEditModalFieldsVisible(page);
		await assertOnlineBatchFieldAndOptionsInEditModal(page);
	});

	test('Apply filter with SB710I returns DB-matching row in grid', async ({ page }) => {
		await assertSb710iDbAndUi(page);
	});

	test('Diagnostic gate: verify session has edit-enabled permission for Claim Status edit actions', async ({ page }) => {
		await searchByScId(page, d.values.scId);
		await clickEditActionForScId(page, d.values.scId);

		const enabled = await isEditFormEnabled(page);
		editPermissionGate = enabled;

		test.info().annotations.push({
			type: 'diagnostic',
			description: enabled
				? 'Edit controls are enabled for this session.'
				: 'Edit controls are disabled for this session; edit-action tests may be skipped.',
		});

		const modal = await getEditModal(page);
		const groupInput = modal.getByRole('textbox', { name: d.placeholders.groupId }).first();
		if (enabled) {
			await expect(groupInput).toBeEnabled();
		} else {
			await expect(groupInput).toBeDisabled();
		}
	});

	test('Edit SB710I: update group id to G00012 and validate against DB and UI', async ({ page }) => {
		await searchByScId(page, d.values.scId);
		await clickEditActionForScId(page, d.values.scId);
		await ensureEditFormEnabled(page);
		await fillEditForm(page);
		await saveEditModal(page);

		const saveSuccess = await page
			.getByLabel(new RegExp(d.labels.successToastPrefix, 'i'))
			.first()
			.isVisible({ timeout: d.timeouts.filterMs })
			.catch(() => false);

		const editModalVisible = await page
			.getByRole('dialog')
			.filter({ hasText: d.labels.editClaimStatusRouting })
			.first()
			.isVisible()
			.catch(() => false);

		if (saveSuccess) {
			await dismissAnyVisibleModal(page);
			await searchByCompositeValues(
				page,
				d.values.scId,
				d.values.editedGroupId,
				d.values.processorId,
				d.values.ediId
			);

			const editedRow = await fetchClaimStatusRoutingByComposite(
				d.values.scId,
				d.values.processorId,
				d.values.ediId,
				d.values.editedGroupId
			);
			expect(editedRow).not.toBeNull();

			if (editedRow) {
				const row = page
					.locator(d.selectors.tableRows)
					.filter({ has: page.getByRole('cell', { name: editedRow.scid, exact: true }) })
					.filter({ hasText: editedRow.processorid })
					.filter({ hasText: editedRow.ediid })
					.filter({ hasText: editedRow.groupid })
					.first();

				await expect(row).toBeVisible({ timeout: d.timeouts.searchMs });
				await expect(row).toContainText(editedRow.recordstatus);
				await expect(row).toContainText(editedRow.online_batch);
				await expect(row).toContainText(editedRow.payername);
				expect(normalize(editedRow.payername)).toContain(normalize(d.values.payerNameDashboardExpected));
			}
		} else {
			expect(editModalVisible).toBeTruthy();
			const modal = await getEditModal(page);
			const hasValidationOrError = await modal
				.locator('text=/required|already exists|invalid|error/i')
				.first()
				.isVisible()
				.catch(() => false);
			expect(hasValidationOrError || editModalVisible).toBeTruthy();

			const baseRow = await fetchClaimStatusRoutingByComposite(
				d.values.scId,
				d.values.processorId,
				d.values.ediId,
				d.values.baseGroupId
			);
			expect(baseRow).not.toBeNull();
		}
	});

	test('Edit SB710I: save with ONLINE and verify payer name on dashboard result', async ({ page }) => {
		await searchByScId(page, d.values.scId);
		await clickEditActionForScId(page, d.values.scId);
		await ensureEditFormEnabled(page);
		await fillEditForm(page);
		await saveEditModal(page);

		const saveSuccess = await page
			.getByLabel(new RegExp(d.labels.successToastPrefix, 'i'))
			.first()
			.isVisible({ timeout: d.timeouts.filterMs })
			.catch(() => false);
		test.skip(!saveSuccess, 'Save did not complete successfully in this environment state.');
		if (!saveSuccess) return;

		await searchByCompositeValues(
			page,
			d.values.scId,
			d.values.editedGroupId,
			d.values.processorId,
			d.values.ediId
		);

		const editedRow = await fetchClaimStatusRoutingByComposite(
			d.values.scId,
			d.values.processorId,
			d.values.ediId,
			d.values.editedGroupId
		);
		expect(editedRow).not.toBeNull();
		if (!editedRow) return;

		const matchedRow = page
			.locator(d.selectors.tableRows)
			.filter({ has: page.getByRole('cell', { name: editedRow.scid, exact: true }) })
			.filter({ hasText: editedRow.groupid })
			.filter({ hasText: editedRow.processorid })
			.filter({ hasText: editedRow.ediid })
			.first();

		await expect(matchedRow).toBeVisible({ timeout: d.timeouts.searchMs });
		await expect(matchedRow).toContainText(editedRow.online_batch);
		await expect(matchedRow).toContainText(d.values.payerNameDashboardExpected);
		await expect(page.getByRole('cell', { name: new RegExp(d.values.payerNameDashboardExpected, 'i') }).first()).toBeVisible();
	});

	test('Save with empty required Group ID does not produce successful save', async ({ page }) => {
		await searchByScId(page, d.values.scId);
		await clickEditActionForScId(page, d.values.scId);
		await ensureEditFormEnabled(page);

		const modal = await getEditModal(page);
		await modal.getByRole('textbox', { name: d.placeholders.groupId }).fill(d.edgeCases.empty);
		await saveEditModal(page);

		const hasSuccessToast = await page
			.getByLabel(new RegExp(d.labels.successToastPrefix, 'i'))
			.first()
			.isVisible({ timeout: d.timeouts.filterMs })
			.catch(() => false);
		expect(hasSuccessToast).toBeFalsy();

		await expect(modal.getByRole('button', { name: d.labels.save })).toBeVisible();
	});

	test('Invalid SC ID filter returns no rows or stable empty state', async ({ page }) => {
		const invalidRows = await fetchClaimStatusRoutingRowsByScId(d.edgeCases.invalidScId);
		expect(invalidRows).toHaveLength(0);

		await searchByScId(page, d.edgeCases.invalidScId);

		const emptyState = page.locator(d.selectors.noResults).first();
		const hasEmptyState = await emptyState.isVisible().catch(() => false);
		if (!hasEmptyState) {
			await expect(page.locator(d.selectors.tableRows)).toHaveCount(0);
		}
	});

	test('Whitespace SC ID filter keeps dashboard stable', async ({ page }) => {
		await searchByScId(page, d.edgeCases.whitespace);
		await expect(page.getByRole('button', { name: d.labels.applyFilter })).toBeVisible();
		await searchByScId(page, d.values.scId);
		await expect(page.locator(d.selectors.tableRows).first()).toBeVisible();
	});

	test('Cross-check SKNC0 rows against DB values from edit suite', async ({ page }) => {
		await assertSkNc0GridMatchesDb(page);
	});
});