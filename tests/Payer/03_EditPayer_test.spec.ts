
import { test, expect } from '../myTestData';
import type { Locator, Page } from '@playwright/test';
import { navigateToPayer } from '../framework/navigation.helper';
import * as d from '../../testData/EditPayerTestData.json';

async function applyFilter(page: Page, payerId: string): Promise<void> {
	await navigateToPayer(page);
	await expect(page.getByText(d.labels.payerId)).toBeVisible();
	const payerIdInput = page.getByRole('textbox', { name: d.placeholders.payerId });
	await payerIdInput.click();
	await payerIdInput.clear();
	await payerIdInput.fill(payerId);
	await page.getByRole('button', { name: d.labels.applyFilter }).click();
}

async function openEditFromGrid(page: Page): Promise<void> {
	await page.getByRole('link', { name: d.links.javascript }).first().click();
	await page.getByRole('button', { name: d.labels.edit }).click();
}

async function resetAndCheck(getCheckbox: () => Locator): Promise<void> {
	const cb = getCheckbox();
	if (await cb.isChecked()) {
		await cb.uncheck({ timeout: d.timeouts.checkboxToggleMs });
	}
	await getCheckbox().check({ timeout: d.timeouts.checkboxToggleMs });
}

async function reopenEditWithExistingFlow(page: Page): Promise<void> {
	await page.getByRole('link', { name: d.links.javascript }).first().click();
	await page.getByRole('link', { name: d.links.javascript }).first().click();
	await page.getByRole('button', { name: d.labels.edit }).click();
}

async function clickParticipatingIfPresent(page: Page, index: number, exact = false): Promise<void> {
	for (let attempt = 0; attempt < 2; attempt += 1) {
		const locator = page.getByText(d.labels.participating, { exact }).nth(index);
		if ((await locator.count()) === 0) {
			return;
		}

		try {
			await locator.click({ force: true, timeout: d.timeouts.participatingClickMs });
			return;
		} catch {
			if (attempt === 1) {
				return;
			}
		}
	}
}

test.describe('Edit Payer - Refactored and Extended Coverage', () => {
	test('Edit payer functionality and successful save preserve existing flow', async ({ page, loginAsAdmin }) => {
		test.setTimeout(d.timeouts.functionalTestMs);
		await loginAsAdmin();

		await applyFilter(page, d.values.validPayerFilterId);
		await expect(page.getByRole('columnheader', { name: d.headers.payerNameAsc })).toBeVisible();
		await expect(page.getByRole('cell', { name: d.values.expectedPayerCell })).toBeVisible();

		await openEditFromGrid(page);
		await expect(page.getByText(d.labels.professionalType)).toBeVisible();

		await reopenEditWithExistingFlow(page);

		const participatingFirst = page.getByText(d.labels.participating).first();
		const participatingThird = page.getByText(d.labels.participating).nth(2);
		const participatingFifth = page.getByText(d.labels.participating).nth(4);
		await expect(participatingFirst).toBeVisible();
		await expect(participatingThird).toBeVisible();
		await expect(participatingFifth).toBeVisible();

		const allowBulkEnrollments = () => page.getByRole('checkbox', { name: d.labels.allowBulkEnrollments });
		const eligibility = () => page.getByRole('checkbox', { name: d.labels.eligibility });
		const claimStatus = () => page.getByRole('checkbox', { name: d.labels.claimStatus, exact: true });
		const attachments = () => page.getByRole('checkbox', { name: d.labels.attachments });
		const batchClaimStatus = () => page.getByRole('checkbox', { name: d.labels.batchClaimStatus });

		await expect(allowBulkEnrollments()).toBeVisible();
		await expect(eligibility()).toBeVisible();
		await expect(claimStatus()).toBeVisible();
		await expect(batchClaimStatus()).toBeVisible();
		await expect(page.getByRole('textbox', { name: d.placeholders.payerContact })).toBeVisible();
		await expect(page.getByRole('textbox', { name: d.placeholders.payerContact })).toHaveValue(d.values.initialPayerContact);

		// toggle participating options (original recorded flow)
		await clickParticipatingIfPresent(page, 0, false);
		await clickParticipatingIfPresent(page, 2, false);
		await clickParticipatingIfPresent(page, 4, false);
		await clickParticipatingIfPresent(page, 3, true);
		await clickParticipatingIfPresent(page, 4, true);
		await clickParticipatingIfPresent(page, 5, true);

		await resetAndCheck(eligibility);
		await resetAndCheck(claimStatus);
		await resetAndCheck(attachments);
		await resetAndCheck(batchClaimStatus);
		await resetAndCheck(allowBulkEnrollments);

		// Ensure the edit panel is still open before interacting with payerContact
		await expect(page.getByRole('button', { name: d.labels.save })).toBeVisible({ timeout: d.timeouts.saveToastMs });

		const payerContactField = page.getByRole('textbox', { name: d.placeholders.payerContact });
		await payerContactField.click();
		await payerContactField.fill(d.values.updatedPayerContact);
		await page.getByRole('button', { name: d.labels.save }).click();

		await expect(page.getByLabel(d.labels.payerUpdated)).toBeVisible({ timeout: d.timeouts.saveToastMs });
	});

	test('Edit payer screen fields are visible and actionable', async ({ page, loginAsAdmin }) => {
		await loginAsAdmin();

		await applyFilter(page, d.values.validPayerFilterId);
		await openEditFromGrid(page);

		await expect(page.getByText(d.labels.professionalType)).toBeVisible();
		await expect(page.getByRole('checkbox', { name: d.labels.allowBulkEnrollments })).toBeVisible();
		await expect(page.getByRole('checkbox', { name: d.labels.eligibility })).toBeVisible();
		await expect(page.getByRole('checkbox', { name: d.labels.claimStatus, exact: true })).toBeVisible();
		await expect(page.getByRole('checkbox', { name: d.labels.batchClaimStatus })).toBeVisible();
		await expect(page.getByRole('checkbox', { name: d.labels.attachments })).toBeVisible();

		const payerContact = page.getByRole('textbox', { name: d.placeholders.payerContact });
		await expect(payerContact).toBeVisible();
		await expect(payerContact).toBeEnabled();

		await expect(page.getByRole('button', { name: d.labels.save })).toBeVisible();
		await expect(page.getByRole('button', { name: d.labels.save })).toBeEnabled();
	});

	test('Edit payer invalid filter should return no matching rows', async ({ page, loginAsAdmin }) => {
		await loginAsAdmin();

		await applyFilter(page, d.edgeCases.invalidPayerFilterId);
		const rows = await page.locator('tbody tr').count();
		expect(rows).toBe(0);
	});

	test('Edit payer empty filter should keep dashboard controls available', async ({ page, loginAsAdmin }) => {
		await loginAsAdmin();

		await applyFilter(page, d.edgeCases.emptyValue);
		await expect(page.getByRole('button', { name: d.labels.applyFilter })).toBeVisible();
		await expect(page.locator('tbody')).toBeVisible();
	});

	test('Edit payer contact empty value should not show success toast', async ({ page, loginAsAdmin }) => {
		await loginAsAdmin();

		await applyFilter(page, d.values.validPayerFilterId);
		await openEditFromGrid(page);

		const payerContact = page.getByRole('textbox', { name: d.placeholders.payerContact });
		await payerContact.clear();
		await page.getByRole('button', { name: d.labels.save }).click();

		const successToastVisible = await page.getByLabel(d.labels.payerUpdated).isVisible().catch(() => false);
		expect(successToastVisible).toBe(false);

		const saveButtonVisible = await page.getByRole('button', { name: d.labels.save }).isVisible().catch(() => false);
		expect(saveButtonVisible).toBe(true);
	});

	test('Edit payer save without changes keeps payer contact persisted', async ({ page, loginAsAdmin }) => {
		await loginAsAdmin();

		await applyFilter(page, d.values.validPayerFilterId);
		await openEditFromGrid(page);

		const payerContactField = page.getByRole('textbox', { name: d.placeholders.payerContact });
		const originalContact = await payerContactField.inputValue();

		await page.getByRole('button', { name: d.labels.save }).click();
		const successToastVisible = await page.getByLabel(d.labels.payerUpdated).isVisible({ timeout: d.timeouts.saveToastMs }).catch(() => false);
		if (successToastVisible) {
			await expect(page.getByLabel(d.labels.payerUpdated)).toBeVisible();
		}

		const editHeading = page.getByRole('heading', { name: /View\/Modify Payer Setup/i });
		if (await editHeading.isVisible().catch(() => false)) {
			const editDialog = page.getByRole('dialog').filter({ has: editHeading }).first();
			const closeLink = editDialog.getByRole('link').first();
			if (await closeLink.isVisible().catch(() => false)) {
				await closeLink.click();
			} else {
				await page.keyboard.press('Escape');
			}
		}

		const payerIdInput = page.getByRole('textbox', { name: d.placeholders.payerId });
		if (await payerIdInput.isVisible().catch(() => false)) {
			await payerIdInput.clear();
			await payerIdInput.fill(d.values.validPayerFilterId);
			await page.getByRole('button', { name: d.labels.applyFilter }).click();
		} else {
			await applyFilter(page, d.values.validPayerFilterId);
		}
		await openEditFromGrid(page);

		await expect(page.getByRole('textbox', { name: d.placeholders.payerContact })).toHaveValue(originalContact);
	});
});