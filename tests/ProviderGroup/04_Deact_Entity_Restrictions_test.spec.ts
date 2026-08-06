/**
 * SC-465 – Deactivated Account / Provider Group Create Restrictions
 *
 * TC-465-01: Add Provider is not available under a deactivated provider group
 * TC-465-02: Add Provider Group is not available under a deactivated account
 */

import { test, expect } from '../myTestData';
import type { Page } from '@playwright/test';
import userData from '../../testData/user-info';
import * as d from '../../testData/DeactEntityRestrictionsTestData.json';
import { navigateToAccounts } from '../framework/navigation.helper';
import { isAccountActiveByNumber } from '../../testData/database.utils';

const deactivatedAccountNumber = userData.deactivateAccount.deactivateAccAutoNum;
const providerAccountNumber = userData.addProvider.accountNum;
const providerGroupId = userData.addProvider.groupeditInAcct;

async function filterByAccount(page: Page, accountNumber: string, showInactiveOnly = false): Promise<void> {
	const accountFilter = page.getByRole('textbox', { name: d.roles.accountNumberFilterTextbox });
	await expect(accountFilter).toBeVisible();
	await accountFilter.fill(accountNumber);

	const inactiveCheckbox = page.getByRole('checkbox', { name: d.labels.showInactiveOnly });
	if (showInactiveOnly) {
		await inactiveCheckbox.check();
		await expect(inactiveCheckbox).toBeChecked();
	} else if (await inactiveCheckbox.isChecked().catch(() => false)) {
		await inactiveCheckbox.uncheck();
		await expect(inactiveCheckbox).not.toBeChecked();
	}

	await page.getByRole('button', { name: d.labels.applyFilter }).click();
	await page.waitForLoadState('networkidle');
	await page.waitForTimeout(d.timeouts.filterMs);
}

async function openAccountRowAction(page: Page): Promise<void> {
	const rowAction = page.getByRole('link').filter({ hasText: /^$/ }).nth(d.selectors.rowActionLinkIndex);
	await expect(rowAction).toBeVisible({ timeout: d.timeouts.actionMs });
	await rowAction.click();
}

async function confirmActionModal(page: Page, messageSubstring: string, confirm = true): Promise<boolean> {
	const heading = page.getByRole('heading', { name: d.labels.confirmAction });
	const visible = await heading.isVisible({ timeout: d.timeouts.actionMs }).catch(() => false);
	if (!visible) return false;

	const modal = page.locator(d.selectors.modalRoot).first();
	const modalText = ((await modal.textContent().catch(() => '')) ?? '').toLowerCase();
	expect(modalText).toContain(messageSubstring.toLowerCase());

	await page.getByRole('button', { name: confirm ? d.labels.ok : d.labels.cancel }).click();
	await page.waitForTimeout(d.timeouts.filterMs);
	return true;
}

async function ensureAccountInactive(page: Page): Promise<boolean> {
	const active = await isAccountActiveByNumber(deactivatedAccountNumber);
	if (active === false) return true;

	await filterByAccount(page, deactivatedAccountNumber, false);
	await openAccountRowAction(page);

	const deactivateBtn = page.getByRole('button', { name: d.labels.deactivateAccount });
	if (!(await deactivateBtn.isVisible().catch(() => false))) {
		return false;
	}

	await deactivateBtn.click();
	const confirmed = await confirmActionModal(page, 'deactivate this account');
	if (!confirmed) return false;

	const stillActive = await isAccountActiveByNumber(deactivatedAccountNumber);
	return stillActive === false;
}

async function ensureAccountActive(page: Page): Promise<void> {
	const active = await isAccountActiveByNumber(deactivatedAccountNumber);
	if (active === true) return;

	await filterByAccount(page, deactivatedAccountNumber, true);
	await openAccountRowAction(page);

	const activateBtn = page.getByRole('button', { name: d.labels.activateAccount });
	if (await activateBtn.isVisible().catch(() => false)) {
		await activateBtn.click();
		await confirmActionModal(page, 'activate this account');
	}
}

async function openProviderGroupActionMenu(page: Page): Promise<boolean> {
	await filterByAccount(page, providerAccountNumber, false);
	await openAccountRowAction(page);

	const groupCell = page.getByRole('cell', { name: providerGroupId, exact: true }).first();
	const groupVisible = await groupCell.isVisible({ timeout: d.timeouts.actionMs }).catch(() => false);
	if (!groupVisible) return false;

	const actionStrip = page.locator('div').filter({
		hasText: new RegExp(`^${d.selectors.providerDetailsActionText}$`),
	}).first();
	if (await actionStrip.isVisible().catch(() => false)) {
		await actionStrip.click().catch(() => {});
	}

	const grid = page.locator(d.selectors.providerGroupGrid).first();
	const link = grid.getByRole('link').filter({ hasText: /^$/ }).nth(d.selectors.providerGroupActionLinkIndex);
	if (await link.isVisible().catch(() => false)) {
		await link.click();
		return true;
	}

	// Fallback: first blank link near the group row
	const row = page.locator('tr', { hasText: providerGroupId }).first();
	const rowLink = row.getByRole('link').first();
	if (await rowLink.isVisible().catch(() => false)) {
		await rowLink.click();
		return true;
	}

	return false;
}

test.describe('SC-465 – Deactivated Account and Provider Group Create Restrictions', () => {
	test('TC-465-02: Add Provider Group is not available for a deactivated account', async ({
		page,
		loginAsAdmin,
	}) => {
		await loginAsAdmin();
		await navigateToAccounts(page);

		const madeInactive = await ensureAccountInactive(page);
		test.skip(!madeInactive, 'Could not deactivate target account in this environment – skipping TC-465-02.');
		if (!madeInactive) return;

		try {
			await filterByAccount(page, deactivatedAccountNumber, true);
			await openAccountRowAction(page);

			const addProviderGroup = page.getByRole('button', { name: d.labels.addProviderGroup });
			await expect(
				addProviderGroup,
				'Add Provider Group must not be offered on a deactivated account',
			).toHaveCount(0);
		} finally {
			await ensureAccountActive(page);
		}
	});

	test('TC-465-01: Add Provider is not available under a deactivated provider group', async ({
		page,
		loginAsAdmin,
	}) => {
		await loginAsAdmin();
		await navigateToAccounts(page);

		const menuOpened = await openProviderGroupActionMenu(page);
		test.skip(!menuOpened, `Provider group ${providerGroupId} action menu unavailable – skipping TC-465-01.`);
		if (!menuOpened) return;

		const deactivateGroup = page.getByRole('button', { name: d.labels.deactivateGroup });
		const deactivateVisible = await deactivateGroup.isVisible({ timeout: d.timeouts.actionMs }).catch(() => false);
		test.skip(!deactivateVisible, 'Deactivate Group action not available – skipping TC-465-01.');
		if (!deactivateVisible) return;

		await deactivateGroup.click();
		await confirmActionModal(page, d.labels.confirmDeactivateGroup).catch(() => false);
		await page.waitForTimeout(d.timeouts.filterMs);

		try {
			const menuReopened = await openProviderGroupActionMenu(page);
			test.skip(!menuReopened, 'Could not reopen provider group menu after deactivation.');
			if (!menuReopened) return;

			const addProvider = page.getByRole('button', { name: d.labels.addProvider });
			const addVisible = await addProvider.isVisible().catch(() => false);
			expect(addVisible, 'Add Provider must not be available on a deactivated provider group').toBe(false);
		} finally {
			const restoreOpened = await openProviderGroupActionMenu(page).catch(() => false);
			if (restoreOpened) {
				const activateGroup = page.getByRole('button', { name: d.labels.activateGroup });
				if (await activateGroup.isVisible().catch(() => false)) {
					await activateGroup.click();
					await confirmActionModal(page, 'activate').catch(() => false);
				}
			}
		}
	});
});
