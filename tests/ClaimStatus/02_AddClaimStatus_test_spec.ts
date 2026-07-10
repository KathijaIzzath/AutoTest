import { test, expect } from '../myTestData';
import type { Locator, Page } from '@playwright/test';
import { navigateToClaimStatusRouting } from '../framework/navigation.helper';
import {
	deleteClaimStatusRoutingByComposite,
	fetchClaimStatusRoutingByComposite,
	fetchClaimStatusRoutingRowsByScId,
} from '../../testData/database.utils';
import * as d from '../../testData/AddClaimStatusTestData.json';

let pageErrors: string[] = [];

function normalize(value: string): string {
	return (value ?? '').trim().toUpperCase();
}

async function openClaimStatusDashboard(page: Page): Promise<void> {
	await navigateToClaimStatusRouting(page);
	await expect(page.getByText(d.labels.title, { exact: true })).toBeVisible();
}

async function applyFilterAndWait(page: Page): Promise<void> {
	const applyButton = page.getByRole('button', { name: d.labels.applyFilter });
	const visible = await applyButton.isVisible().catch(() => false);
	if (!visible) {
		await closeAddModalIfOpen(page);
	}

	if (await applyButton.isVisible().catch(() => false)) {
		await applyButton.click();
	} else {
		await page.locator(`button:has-text("${d.labels.applyFilter}")`).first().click();
	}
	await page.waitForTimeout(d.timeouts.filterMs);
}

async function clearDashboardFilters(page: Page): Promise<void> {
	await setFilterValue(page, d.placeholders.scId, d.edgeCases.empty);
	await setFilterValue(page, d.placeholders.groupId, d.edgeCases.empty);
	await setFilterValue(page, d.placeholders.processorId, d.edgeCases.empty);
	await setFilterValue(page, d.placeholders.ediId, d.edgeCases.empty);

	const payerInput = page.getByRole('textbox', { name: d.placeholders.payerName });
	if (await payerInput.isVisible().catch(() => false)) {
		await payerInput.fill(d.edgeCases.empty);
	}
}

async function setFilterValue(page: Page, placeholder: string, value: string): Promise<void> {
	const input = page.getByRole('textbox', { name: placeholder });
	await input.fill(d.edgeCases.empty);
	await input.fill(value);
}

async function getOnlineBatchCombobox(page: Page): Promise<Locator> {
	const modal = await getAddModal(page);

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

async function selectOnlineBatchOption(page: Page, option: string): Promise<void> {
	const combo = await getOnlineBatchCombobox(page);
	await combo.click();
	const optionLocator = page.getByRole('option', { name: new RegExp(`^${option}$`, 'i') }).first();
	await expect(optionLocator).toBeVisible({ timeout: d.timeouts.optionMs });
	await optionLocator.click();
}

async function assertOnlineBatchFieldAndOptions(page: Page): Promise<void> {
	const modal = await getAddModal(page);
	await expect(modal.getByText(d.labels.onlineBatch, { exact: true })).toBeVisible();

	const combo = await getOnlineBatchCombobox(page);
	await combo.click();
	const optionsList = page.getByLabel(d.labels.optionsList).first();
	await expect(optionsList).toContainText(d.values.onlineBatchOnline);
	await expect(optionsList).toContainText(d.values.onlineBatchBatch);
	await page.keyboard.press('Escape').catch(() => {});
}

async function searchByComposite(page: Page): Promise<void> {
	await clearDashboardFilters(page);
	await setFilterValue(page, d.placeholders.scId, d.expectedDb.scId);
	await setFilterValue(page, d.placeholders.groupId, d.expectedDb.groupId);
	await setFilterValue(page, d.placeholders.processorId, d.expectedDb.processorId);
	await setFilterValue(page, d.placeholders.ediId, d.expectedDb.ediId);
	await applyFilterAndWait(page);
}

async function searchByCompositeValues(
	page: Page,
	scId: string,
	groupId: string,
	processorId: string,
	ediId: string
): Promise<void> {
	await clearDashboardFilters(page);
	await setFilterValue(page, d.placeholders.scId, scId);
	await setFilterValue(page, d.placeholders.groupId, groupId);
	await setFilterValue(page, d.placeholders.processorId, processorId);
	await setFilterValue(page, d.placeholders.ediId, ediId);
	await applyFilterAndWait(page);
}

async function prepareDeterministicRecord(): Promise<void> {
	await deleteClaimStatusRoutingByComposite(
		d.values.scId,
		d.values.processorId,
		d.values.ediId,
		d.values.groupId
	);
}

function getAddLinks(page: Page): Locator {
	return page.getByRole('link', { name: /Add Claim Status Routing/i });
}

async function openAddModalFromDashboard(page: Page): Promise<void> {
	const link = getAddLinks(page).first();
	await expect(link).toBeVisible();
	await link.click();
	await expect(page.getByRole('heading', { name: d.labels.addClaimStatusRouting })).toBeVisible();
}

async function openAddModalFromSearchHeader(page: Page): Promise<void> {
	await applyFilterAndWait(page);

	const tableAddLink = page.locator('table a').filter({ hasText: d.labels.addClaimStatusRouting }).first();
	if (await tableAddLink.isVisible().catch(() => false)) {
		await tableAddLink.click();
	} else {
		const addLinks = getAddLinks(page);
		const count = await addLinks.count();
		if (count > 1) {
			await addLinks.nth(1).click();
		} else {
			await addLinks.first().click();
		}
	}

	await expect(page.getByRole('heading', { name: d.labels.addClaimStatusRouting })).toBeVisible();
}

async function getAddModal(page: Page): Promise<Locator> {
	const modal = page.getByRole('dialog').filter({ hasText: d.labels.addClaimStatusRouting }).first();
	await expect(modal).toBeVisible();
	return modal;
}

async function assertAddModalFieldsVisible(page: Page): Promise<void> {
	const modal = await getAddModal(page);
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
	await expect(modal.getByRole('checkbox', { name: d.labels.active })).toBeVisible();
	await expect(modal.getByRole('button', { name: d.labels.add })).toBeVisible();
}

async function choosePayerInAddModal(page: Page): Promise<void> {
	const modal = await getAddModal(page);
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

async function fillAddForm(page: Page): Promise<void> {
	const modal = await getAddModal(page);
	await choosePayerInAddModal(page);
	await modal.getByRole('textbox', { name: d.placeholders.scId }).fill(d.values.scId);
	await modal.getByRole('textbox', { name: d.placeholders.groupId }).fill(d.values.groupId);
	await modal.getByRole('textbox', { name: d.placeholders.processorId }).fill(d.values.processorId);
	await modal.getByRole('textbox', { name: d.placeholders.ediId }).fill(d.values.ediId);
	await selectOnlineBatchOption(page, d.values.onlineBatchOnline);
}

async function clickAddInModal(page: Page): Promise<void> {
	const modal = await getAddModal(page);
	await modal.getByRole('button', { name: d.labels.add }).click();
}

async function closeAddModalIfOpen(page: Page): Promise<void> {
	const modal = page.getByRole('dialog').filter({ hasText: d.labels.addClaimStatusRouting }).first();
	if (!(await modal.isVisible().catch(() => false))) {
		return;
	}

	const closeButton = modal.getByRole('button', { name: d.labels.close }).first();
	if (await closeButton.isVisible().catch(() => false)) {
		await closeButton.click();
	} else {
		await page.keyboard.press('Escape');
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

async function searchByScId(page: Page, scId: string): Promise<void> {
	await setFilterValue(page, d.placeholders.scId, scId);
	await applyFilterAndWait(page);
}

async function assertSkNc0GridMatchesDb(page: Page): Promise<void> {
	await closeAddModalIfOpen(page);
	await dismissAnyVisibleModal(page);
	await clearDashboardFilters(page);
	await searchByScId(page, d.expectedDb.scId);

	const dbRows = await fetchClaimStatusRoutingRowsByScId(d.expectedDb.scId);
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
		await expect(row).toContainText(dbRow.online_batch);
		await expect(row).toContainText(dbRow.recordstatus);
	}
}

test.describe('Add Claim Status Routing - generated and refactored suite', () => {
	test.beforeEach(async ({ page, loginAsAdmin }) => {
		pageErrors = [];
		page.on('pageerror', (err) => pageErrors.push(err.message));

		await loginAsAdmin();
		await openClaimStatusDashboard(page);
	});

	test.afterEach(async ({ page }) => {
		await closeAddModalIfOpen(page);
		await dismissAnyVisibleModal(page);
		expect(pageErrors, 'Unexpected browser runtime errors were thrown.').toEqual([]);
	});

	test('Claim Status dashboard controls and filter action are visible and available', async ({ page }) => {
		await expect(page.getByRole('button', { name: d.labels.applyFilter })).toBeVisible();
		await expect(page.getByRole('textbox', { name: d.placeholders.scId })).toBeVisible();
		await expect(page.getByRole('textbox', { name: d.placeholders.scId })).toBeEditable();
		await expect(page.getByRole('textbox', { name: d.placeholders.groupId })).toBeVisible();
		await expect(page.getByRole('textbox', { name: d.placeholders.groupId })).toBeEditable();
		await expect(page.getByRole('textbox', { name: d.placeholders.processorId })).toBeVisible();
		await expect(page.getByRole('textbox', { name: d.placeholders.processorId })).toBeEditable();
		await expect(page.getByRole('textbox', { name: d.placeholders.ediId })).toBeVisible();
		await expect(page.getByRole('textbox', { name: d.placeholders.ediId })).toBeEditable();
		await expect(getAddLinks(page).first()).toBeVisible();

		await applyFilterAndWait(page);
		await expect(page.getByRole('columnheader', { name: d.headers.scId })).toBeVisible();
	});

	test('Add modal from dashboard shows all required fields and controls', async ({ page }) => {
		await openAddModalFromDashboard(page);
		await assertAddModalFieldsVisible(page);
		await assertOnlineBatchFieldAndOptions(page);
	});

	test('Add modal from search result header shows all required fields and controls', async ({ page }) => {
		await openAddModalFromSearchHeader(page);
		await assertAddModalFieldsVisible(page);
		await assertOnlineBatchFieldAndOptions(page);
	});

	test('Apply Filter with full composite values returns DB-matching row', async ({ page }) => {
		const dbRow = await fetchClaimStatusRoutingByComposite(
			d.expectedDb.scId,
			d.expectedDb.processorId,
			d.expectedDb.ediId,
			d.expectedDb.groupId
		);
		test.skip(!dbRow, `Composite row not present for ${d.expectedDb.scId}/${d.expectedDb.groupId}.`);
		if (!dbRow) return;

		await searchByComposite(page);

		const matchedRow = page
			.locator(d.selectors.tableRows)
			.filter({ has: page.getByRole('cell', { name: dbRow.scid, exact: true }) })
			.filter({ hasText: dbRow.groupid })
			.filter({ hasText: dbRow.processorid })
			.filter({ hasText: dbRow.ediid })
			.first();

		await expect(matchedRow).toBeVisible({ timeout: d.timeouts.searchMs });
		await expect(matchedRow).toContainText(dbRow.online_batch);
		await expect(matchedRow).toContainText(dbRow.recordstatus);
	});

	test('Add Claim Status from dashboard attempts save and keeps app stable', async ({ page }) => {
		await prepareDeterministicRecord();
		await openAddModalFromDashboard(page);
		await fillAddForm(page);
		await clickAddInModal(page);

		const successToast = page.getByLabel(new RegExp(d.labels.successToastPrefix, 'i')).first();
		const saveSucceeded = await successToast.isVisible({ timeout: d.timeouts.saveMs }).catch(() => false);

		if (!saveSucceeded) {
			const modal = await getAddModal(page);
			const hasValidationOrErrorText = await modal
				.locator('text=/required|already exists|invalid|error/i')
				.first()
				.isVisible()
				.catch(() => false);
			expect(hasValidationOrErrorText || (await modal.isVisible().catch(() => false))).toBeTruthy();
		}

		await closeAddModalIfOpen(page);
		await dismissAnyVisibleModal(page);
		await expect(page.getByText(d.labels.title, { exact: true })).toBeVisible();
	});

	test('Add Claim Status with ONLINE value is searchable and matches DB', async ({ page }) => {
		await prepareDeterministicRecord();
		await openAddModalFromDashboard(page);
		await fillAddForm(page);
		await clickAddInModal(page);

		const successToast = page.getByLabel(new RegExp(d.labels.successToastPrefix, 'i')).first();
		await expect(successToast).toBeVisible({ timeout: d.timeouts.saveMs });

		await closeAddModalIfOpen(page);
		await dismissAnyVisibleModal(page);
		await searchByCompositeValues(page, d.values.scId, d.values.groupId, d.values.processorId, d.values.ediId);

		const dbRow = await fetchClaimStatusRoutingByComposite(
			d.values.scId,
			d.values.processorId,
			d.values.ediId,
			d.values.groupId
		);
		expect(dbRow).not.toBeNull();
		if (!dbRow) return;

		const row = page
			.locator(d.selectors.tableRows)
			.filter({ has: page.getByRole('cell', { name: dbRow.scid, exact: true }) })
			.filter({ hasText: dbRow.groupid })
			.filter({ hasText: dbRow.processorid })
			.filter({ hasText: dbRow.ediid })
			.first();

		await expect(row).toBeVisible({ timeout: d.timeouts.searchMs });
		await expect(row).toContainText(dbRow.online_batch);
		await expect(row).toContainText(dbRow.recordstatus);
		expect(normalize(dbRow.online_batch)).toContain(normalize(d.values.onlineBatchOnline));
	});

	test('Add Claim Status from search result header attempts save and keeps app stable', async ({ page }) => {
		await openAddModalFromSearchHeader(page);
		await fillAddForm(page);
		await clickAddInModal(page);

		const modalStillVisible = await page
			.getByRole('dialog')
			.filter({ hasText: d.labels.addClaimStatusRouting })
			.first()
			.isVisible()
			.catch(() => false);
		const successToast = await page
			.getByLabel(new RegExp(d.labels.successToastPrefix, 'i'))
			.first()
			.isVisible({ timeout: d.timeouts.saveMs })
			.catch(() => false);

		expect(modalStillVisible || successToast).toBeTruthy();
		await closeAddModalIfOpen(page);
		await dismissAnyVisibleModal(page);
		await expect(page.getByText(d.labels.title, { exact: true })).toBeVisible();
	});

	test('Add with empty required fields does not produce successful save', async ({ page }) => {
		await openAddModalFromDashboard(page);
		await clickAddInModal(page);

		const successToastVisible = await page
			.getByLabel(new RegExp(d.labels.successToastPrefix, 'i'))
			.first()
			.isVisible({ timeout: d.timeouts.filterMs })
			.catch(() => false);
		expect(successToastVisible).toBeFalsy();

		const modal = await getAddModal(page);
		await expect(modal.getByRole('button', { name: d.labels.add })).toBeVisible();
	});

	test('Invalid SC ID filter returns no rows or stable empty state', async ({ page }) => {
		const dbRows = await fetchClaimStatusRoutingRowsByScId(d.edgeCases.invalidScId);
		expect(dbRows).toHaveLength(0);

		await clearDashboardFilters(page);
		await searchByScId(page, d.edgeCases.invalidScId);

		const emptyState = page.locator(d.selectors.noResults).first();
		const hasEmptyState = await emptyState.isVisible().catch(() => false);
		if (!hasEmptyState) {
			await expect(page.locator(d.selectors.tableRows)).toHaveCount(0);
		}
	});

	test('Whitespace SC ID filter keeps dashboard stable and searchable', async ({ page }) => {
		await clearDashboardFilters(page);
		await searchByScId(page, d.edgeCases.whitespace);

		await expect(page.getByRole('button', { name: d.labels.applyFilter })).toBeVisible();
		await searchByScId(page, d.expectedDb.scId);
		await expect(page.getByRole('columnheader', { name: d.headers.scId })).toBeVisible();
	});

	test('SKNC0 search result rows are validated against DB values for existence and correctness', async ({ page }) => {
		await assertSkNc0GridMatchesDb(page);

		const expectedComposite = await fetchClaimStatusRoutingByComposite(
			d.expectedDb.scId,
			d.expectedDb.processorId,
			d.expectedDb.ediId,
			d.expectedDb.groupId
		);
		const dbRows = await fetchClaimStatusRoutingRowsByScId(d.expectedDb.scId);
		const referenceRow = expectedComposite
			?? dbRows.find((row) =>
				normalize(row.processorid) === normalize(d.expectedDb.processorId)
				&& normalize(row.ediid) === normalize(d.expectedDb.ediId)
			)
			?? dbRows[0];

		expect(referenceRow).toBeDefined();
		if (!referenceRow) return;

		const matchedRow = page
			.locator(d.selectors.tableRows)
			.filter({ has: page.getByRole('cell', { name: normalize(referenceRow.scid), exact: true }) })
			.filter({ hasText: normalize(referenceRow.groupid) })
			.filter({ hasText: normalize(referenceRow.processorid) })
			.filter({ hasText: normalize(referenceRow.ediid) })
			.first();

		await expect(matchedRow).toBeVisible({ timeout: d.timeouts.searchMs });
		await expect(matchedRow).toContainText(referenceRow.groupid);
		await expect(matchedRow).toContainText(referenceRow.recordstatus);
		await expect(matchedRow).toContainText(referenceRow.online_batch);
	});
});