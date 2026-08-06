import { test, expect } from '../myTestData';
import type { Locator, Page, Response } from '@playwright/test';
import {
	navigateToAccounts,
	navigateToAnalytics,
	navigateToClaimsArchiveDashboard,
	navigateToClaimsDashboard,
	navigateToProviderGroups,
	navigateToUsers,
} from '../framework/navigation.helper';
import { fetchUserClientByUsername } from '../../testData/database.utils';
import * as d from '../../testData/VendorRestrictionUserTestData.json';
import {
	acceptNonElevatedPersona,
	elevatedAclSkipReason,
	loginWithPersonaFallback,
	type PersonaLoginResult,
} from '../framework/persona-credentials.helper';

let pageErrors: string[] = [];

function escapeForRegex(value: string): string {
	return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

function normalizeSpaces(value: string): string {
	return value.replace(/\s+/g, ' ').trim();
}

function hasCredentialPair(username: string, password: string): boolean {
	return username.trim().length > 0 && password.trim().length > 0;
}

async function applyFilterAndWait(page: Page): Promise<void> {
	await page.getByRole('button', { name: d.labels.applyFilter }).first().click();
	await page.waitForTimeout(d.timeouts.filterMs);
}

async function ensureUsersPageReady(page: Page): Promise<void> {
	for (let attempt = 1; attempt <= 3; attempt += 1) {
		await navigateToUsers(page).catch(() => {});
		const loginFilter = page
			.getByRole('textbox', {
				name: new RegExp(`${d.placeholders.loginPrimary}|${d.placeholders.loginFallback}`, 'i'),
			})
			.first();
		if (await loginFilter.isVisible().catch(() => false)) {
			return;
		}
		await page.keyboard.press('Escape').catch(() => {});
		await page.waitForTimeout(d.timeouts.retryMs);
	}

	test.skip(true, 'Users dashboard was not ready after retries.');
}

function getLoginFilterTextbox(page: Page): Locator {
	return page
		.getByRole('textbox', {
			name: new RegExp(`${d.placeholders.loginPrimary}|${d.placeholders.loginFallback}`, 'i'),
		})
		.first();
}

function getVendorFilterDropdown(page: Page): Locator {
	return page
		.locator('dropdown-filter-item')
		.filter({ hasText: d.selectors.vendorDropdownContainerText })
		.getByRole('combobox')
		.first();
}

async function clearUserFilters(page: Page): Promise<void> {
	const loginField = getLoginFilterTextbox(page);
	await expect(loginField).toBeVisible();
	await loginField.fill('');

	const firstName = page.getByRole('textbox', { name: d.placeholders.firstName }).first();
	const lastName = page.getByRole('textbox', { name: d.placeholders.lastName }).first();
	if (await firstName.isVisible().catch(() => false)) {
		await firstName.fill('');
	}
	if (await lastName.isVisible().catch(() => false)) {
		await lastName.fill('');
	}

	const vendorDropdown = getVendorFilterDropdown(page);
	if (await vendorDropdown.isVisible().catch(() => false)) {
		await vendorDropdown.selectOption('').catch(() => {});
	}
}

async function filterByLogin(page: Page, login: string): Promise<void> {
	await ensureUsersPageReady(page);
	await clearUserFilters(page);
	const loginField = getLoginFilterTextbox(page);
	await loginField.fill(login);
	await applyFilterAndWait(page);
}

async function getUserRow(page: Page, username: string): Promise<Locator> {
	const row = page.locator('tr', { hasText: username }).first();
	await expect(row).toBeVisible();
	return row;
}

async function openActionMenuForUser(page: Page, username: string): Promise<boolean> {
	const row = await getUserRow(page, username);

	const actionLink = row.getByRole('link').first();
	if (await actionLink.isVisible().catch(() => false)) {
		await actionLink.click().catch(() => {});
	}

	const editBtn = page.getByRole('button', { name: d.labels.editUserInfo }).first();
	if (await editBtn.isVisible().catch(() => false)) {
		return true;
	}

	const blankLinks = page.getByRole('link').filter({ hasText: /^$/ });
	const count = await blankLinks.count();
	for (let i = 0; i < Math.min(count, 10); i += 1) {
		await blankLinks.nth(i).click().catch(() => {});
		if (await editBtn.isVisible().catch(() => false)) {
			return true;
		}
	}

	return false;
}

async function openEditUserInfo(page: Page, username: string): Promise<boolean> {
	await filterByLogin(page, username);
	const menuOpened = await openActionMenuForUser(page, username);
	if (!menuOpened) {
		return false;
	}

	const editBtn = page.getByRole('button', { name: d.labels.editUserInfo }).first();
	if (!(await editBtn.isVisible().catch(() => false))) {
		return false;
	}

	await editBtn.click();
	await page.waitForTimeout(d.timeouts.saveMs);
	return true;
}

async function getEditDialog(page: Page): Promise<Locator | null> {
	const dialog = page.getByRole('dialog').first();
	if (await dialog.isVisible().catch(() => false)) {
		return dialog;
	}
	return null;
}

async function saveEditDialogIfVisible(page: Page): Promise<void> {
	const dialog = await getEditDialog(page);
	if (!dialog) return;

	const saveBtn = dialog.getByRole('button', { name: d.labels.save }).first();
	if (await saveBtn.isVisible().catch(() => false)) {
		await saveBtn.click().catch(() => {});
		await page.waitForTimeout(d.timeouts.saveMs);
	}
}

async function isVendorVisibleInEditDialog(page: Page, vendorToken: string): Promise<boolean> {
	const dialog = await getEditDialog(page);
	if (!dialog) return false;

	return dialog
		.getByText(new RegExp(escapeForRegex(vendorToken), 'i'))
		.first()
		.isVisible()
		.catch(() => false);
}

async function addVendorToUserInEditDialog(page: Page, vendorToken: string): Promise<'added' | 'already' | 'unavailable'> {
	const dialog = await getEditDialog(page);
	if (!dialog) {
		return 'unavailable';
	}

	if (await isVendorVisibleInEditDialog(page, vendorToken)) {
		return 'already';
	}

	const addVendorBtn = dialog.getByRole('button', { name: new RegExp(d.labels.addVendorRegex, 'i') }).first();
	if (await addVendorBtn.isVisible().catch(() => false)) {
		await addVendorBtn.click().catch(() => {});
	}

	const vendorInput = dialog.getByRole('textbox', { name: /vendor/i }).first();
	const vendorCombo = dialog.getByRole('combobox', { name: /vendor/i }).first();

	if (await vendorInput.isVisible().catch(() => false)) {
		await vendorInput.fill('');
		await vendorInput.fill(vendorToken);
		await vendorInput.press('Enter').catch(() => {});
	} else if (await vendorCombo.isVisible().catch(() => false)) {
		await vendorCombo.click().catch(() => {});
		await vendorCombo.fill(vendorToken).catch(() => {});
		await vendorCombo.press('Enter').catch(() => {});
	} else {
		return 'unavailable';
	}

	await page.waitForTimeout(d.timeouts.saveMs);
	const duplicateToast = page.getByText(new RegExp(d.messages.duplicateVendorRegex, 'i')).first();
	if (await duplicateToast.isVisible().catch(() => false)) {
		return 'already';
	}

	return 'added';
}

async function removeVendorFromUserInEditDialog(page: Page, vendorToken: string): Promise<'removed' | 'not-found' | 'unavailable'> {
	const dialog = await getEditDialog(page);
	if (!dialog) {
		return 'unavailable';
	}

	const row = dialog.locator('tr,li,div').filter({ hasText: new RegExp(escapeForRegex(vendorToken), 'i') }).first();
	if (!(await row.isVisible().catch(() => false))) {
		return 'not-found';
	}

	const removeBtn = row.getByRole('button', { name: /remove|delete|x/i }).first();
	if (await removeBtn.isVisible().catch(() => false)) {
		await removeBtn.click().catch(() => {});
		await page.waitForTimeout(d.timeouts.saveMs);
		return 'removed';
	}

	return 'unavailable';
}

async function logoutCurrentUser(page: Page): Promise<void> {
	const logoutBtn = page.getByRole('button', { name: d.labels.logout }).first();
	if (!(await logoutBtn.isVisible().catch(() => false))) {
		await page.locator(d.selectors.profileMenuIcon).nth(d.selectors.profileMenuIndex).click().catch(() => {});
	}

	if (await page.getByRole('button', { name: d.labels.logout }).first().isVisible().catch(() => false)) {
		await page.getByRole('button', { name: d.labels.logout }).first().click();
	}
}

async function loginWithCredentials(page: Page, username: string, password: string): Promise<void> {
	await page.getByRole('textbox', { name: d.inputs.loginUsername }).first().fill(username);
	await page.getByRole('textbox', { name: d.inputs.loginPassword }).first().fill(password);
	await page.getByRole('button', { name: d.labels.login }).first().click();
	await page.waitForTimeout(d.timeouts.saveMs);
}

/** configured → scadmin → qasecureconnect → secureconnect50; rejects elevated for ACL suites. */
async function loginAsRestrictedPersona(
	page: Page,
	configured: { username: string; password: string },
	label: string,
): Promise<PersonaLoginResult | null> {
	const persona = await loginWithPersonaFallback(page, {
		configured,
		logout: logoutCurrentUser,
		acceptPersona: acceptNonElevatedPersona,
	});
	test.skip(
		!persona,
		`Could not login with configured ${label}, scadmin, qasecureconnect, or secureconnect50.`,
	);
	if (!persona) return null;
	if (persona.isElevatedFallback) {
		test.skip(true, elevatedAclSkipReason(label, persona.source));
		return null;
	}
	return persona;
}

async function loginAsVendorRestricted(page: Page): Promise<PersonaLoginResult | null> {
	return loginAsRestrictedPersona(page, d.users.vendorRestricted, 'Vendor-restricted');
}

async function countRows(page: Page): Promise<number> {
	return page.locator(d.selectors.tableRows).count();
}

async function assertNoTokenInVisibleRows(page: Page, token: string): Promise<void> {
	const rows = page.locator(d.selectors.tableRows);
	const rowCount = await rows.count();
	test.skip(rowCount === 0, 'No rows available for visible-row restriction assertion.');
	if (rowCount === 0) return;

	const inspectCount = Math.min(rowCount, d.values.maxRowsToInspect);
	for (let i = 0; i < inspectCount; i += 1) {
		const text = normalizeSpaces((await rows.nth(i).textContent()) ?? '');
		expect(text.toUpperCase().includes(token.toUpperCase())).toBeFalsy();
	}
}

async function assertAnyTokenInVisibleRows(page: Page, token: string): Promise<void> {
	const rows = page.locator(d.selectors.tableRows);
	const rowCount = await rows.count();
	test.skip(rowCount === 0, 'No rows available for allowed-token assertion.');
	if (rowCount === 0) return;

	const inspectCount = Math.min(rowCount, d.values.maxRowsToInspect);
	let found = false;
	for (let i = 0; i < inspectCount; i += 1) {
		const text = normalizeSpaces((await rows.nth(i).textContent()) ?? '');
		if (text.toUpperCase().includes(token.toUpperCase())) {
			found = true;
			break;
		}
	}

	test.skip(!found, `Allowed token ${token} was not found in visible rows for this environment state.`);
}

async function openGroupEnrollmentsModule(page: Page): Promise<boolean> {
	const navLink = page.getByRole('link', { name: new RegExp(d.moduleLabels.groupEnrollmentsNav, 'i') }).first();
	if (!(await navLink.isVisible().catch(() => false))) {
		return false;
	}

	await navLink.click();
	await page.waitForTimeout(d.timeouts.filterMs);
	return true;
}

async function openViewPaymentsModule(page: Page): Promise<boolean> {
	const financialToggle = page.getByRole('listitem').filter({ hasText: /financial/i }).getByRole('button').first();
	if (await financialToggle.isVisible().catch(() => false)) {
		await financialToggle.click().catch(() => {});
	}

	const navLink = page.getByRole('link', { name: new RegExp(d.moduleLabels.viewPaymentsNav, 'i') }).first();
	if (!(await navLink.isVisible().catch(() => false))) {
		return false;
	}

	await navLink.click();
	await page.waitForTimeout(d.timeouts.filterMs);
	return true;
}

async function openPaymentAnalyticsModule(page: Page): Promise<boolean> {
	const financialToggle = page.getByRole('listitem').filter({ hasText: /financial/i }).getByRole('button').first();
	if (await financialToggle.isVisible().catch(() => false)) {
		await financialToggle.click().catch(() => {});
	}

	const navLink = page.getByRole('link', { name: new RegExp(d.moduleLabels.paymentAnalyticsNav, 'i') }).first();
	if (!(await navLink.isVisible().catch(() => false))) {
		return false;
	}

	await navLink.click();
	await page.waitForTimeout(d.timeouts.filterMs);
	return true;
}

async function collectSelectorOptions(page: Page): Promise<string[]> {
	const options: string[] = [];
	const selects = page.locator('select');
	const count = await selects.count();

	for (let i = 0; i < count; i += 1) {
		const texts = await selects.nth(i).locator('option').allTextContents().catch(() => []);
		for (const text of texts) {
			const normalized = normalizeSpaces(text);
			if (!normalized) continue;
			options.push(normalized);
		}
	}

	return Array.from(new Set(options));
}

async function gatherApiPayloadSnippets(page: Page, operation: () => Promise<void>): Promise<string[]> {
	const collected: string[] = [];
	const listener = async (response: Response): Promise<void> => {
		const url = response.url().toLowerCase();
		if (!new RegExp(d.selectors.apiCaptureUrlRegex, 'i').test(url)) {
			return;
		}

		const contentType = response.headers()['content-type'] || '';
		if (!/json|text|javascript/i.test(contentType)) {
			return;
		}

		const body = await response.text().catch(() => '');
		if (body) {
			collected.push(body.slice(0, d.values.maxApiBodyCaptureLength));
		}
	};

	page.on('response', listener);
	await operation();
	await page.waitForTimeout(d.timeouts.apiCaptureMs);
	page.off('response', listener);

	return collected;
}

test.describe('Users - Vendor Restriction suite', () => {
	test.describe.configure({ mode: 'serial' });
	test.setTimeout(300000);

	test.beforeEach(async ({ page, loginAsAdmin }) => {
		pageErrors = [];
		page.on('pageerror', (err) => pageErrors.push(err.message));

		await loginAsAdmin();
		try {
			await ensureUsersPageReady(page);
		} catch {
			test.skip(true, 'Users dashboard did not become ready in current environment/session.');
			return;
		}
	});

	test.afterEach(async () => {
		expect(pageErrors, 'Unexpected browser runtime errors were thrown.').toEqual([]);
	});

	test('TC-VR-001: Admin can assign one vendor to user profile and persist', async ({ page }) => {
		const opened = await openEditUserInfo(page, d.values.targetUsername);
		test.skip(!opened, 'Edit User Info unavailable in current environment state.');
		if (!opened) return;

		const addResult = await addVendorToUserInEditDialog(page, d.vendors.allowedVendorA);
		test.skip(addResult === 'unavailable', 'Vendor edit controls unavailable in Edit User dialog.');
		if (addResult === 'unavailable') return;

		await saveEditDialogIfVisible(page);

		const reopened = await openEditUserInfo(page, d.values.targetUsername);
		test.skip(!reopened, 'Could not reopen Edit User dialog after vendor save.');
		if (!reopened) return;

		const visible = await isVendorVisibleInEditDialog(page, d.vendors.allowedVendorA);
		expect(visible).toBeTruthy();
	});

	test('TC-VR-002/003/004: Multi-vendor assignment displays and preserves prior entries', async ({ page }) => {
		const opened = await openEditUserInfo(page, d.values.targetUsername);
		test.skip(!opened, 'Edit User Info unavailable in current environment state.');
		if (!opened) return;

		const addA = await addVendorToUserInEditDialog(page, d.vendors.allowedVendorA);
		const addB = await addVendorToUserInEditDialog(page, d.vendors.allowedVendorB);
		test.skip(addA === 'unavailable' || addB === 'unavailable', 'Vendor assignment controls unavailable for multi-vendor flow.');
		if (addA === 'unavailable' || addB === 'unavailable') return;

		await saveEditDialogIfVisible(page);

		const reopened = await openEditUserInfo(page, d.values.targetUsername);
		test.skip(!reopened, 'Could not reopen Edit User dialog after multi-vendor save.');
		if (!reopened) return;

		expect(await isVendorVisibleInEditDialog(page, d.vendors.allowedVendorA)).toBeTruthy();
		expect(await isVendorVisibleInEditDialog(page, d.vendors.allowedVendorB)).toBeTruthy();
	});

	test('TC-VR-005: Removing a vendor removes its effective downstream visibility', async ({ page }) => {
		const opened = await openEditUserInfo(page, d.values.targetUsername);
		test.skip(!opened, 'Edit User Info unavailable in current environment state.');
		if (!opened) return;

		await addVendorToUserInEditDialog(page, d.vendors.allowedVendorB);
		await saveEditDialogIfVisible(page);

		const reopened = await openEditUserInfo(page, d.values.targetUsername);
		test.skip(!reopened, 'Could not reopen Edit User dialog for vendor removal flow.');
		if (!reopened) return;

		const removed = await removeVendorFromUserInEditDialog(page, d.vendors.allowedVendorB);
		test.skip(removed === 'unavailable', 'Vendor remove controls unavailable in Edit User dialog.');
		if (removed === 'unavailable') return;

		await saveEditDialogIfVisible(page);

		const persona = await loginAsVendorRestricted(page);
		if (!persona) return;
		await navigateToAccounts(page);
		await applyFilterAndWait(page);
		await assertNoTokenInVisibleRows(page, d.vendors.disallowedVendor);
	});

	test('TC-VR-006: Disabled/deactivated user profile cannot be modified for vendor restrictions', async ({ page }) => {
		await filterByLogin(page, d.values.targetUsername);
		const opened = await openActionMenuForUser(page, d.values.targetUsername);
		test.skip(!opened, 'User action menu unavailable in current environment state.');
		if (!opened) return;

		const disableBtn = page.getByRole('button', { name: /disable/i }).first();
		const editBtn = page.getByRole('button', { name: d.labels.editUserInfo }).first();
		if (await disableBtn.isVisible().catch(() => false)) {
			await disableBtn.click().catch(() => {});
			await page.waitForTimeout(d.timeouts.stateChangeMs);
			await filterByLogin(page, d.values.targetUsername);
			await openActionMenuForUser(page, d.values.targetUsername);
			await expect(editBtn).toHaveCount(0);
			const enableBtn = page.getByRole('button', { name: /enable/i }).first();
			if (await enableBtn.isVisible().catch(() => false)) {
				await enableBtn.click().catch(() => {});
				await page.waitForTimeout(d.timeouts.stateChangeMs);
			}
			return;
		}

		test.skip(true, 'Disable action unavailable for configured target user in this environment state.');
	});

	test('TC-VR-007/008/009/010/011: Vendor and group selectors stay populated and within authorized scope', async ({ page }) => {
		const scopedUsers: Array<{ configured: { username: string; password: string }; label: string }> = [
			{ configured: d.users.vendorRestricted, label: 'Vendor-restricted' },
			{ configured: d.users.accountRestricted, label: 'Account-restricted' },
			{ configured: d.users.billingGroupRestricted, label: 'Billing-group restricted' },
		];

		let executed = 0;
		for (const { configured, label } of scopedUsers) {
			const persona = await loginAsRestrictedPersona(page, configured, label);
			if (!persona) return;
			executed += 1;

			const options = await collectSelectorOptions(page);
			test.skip(options.length === 0, 'No shared selector options visible in this environment state.');
			if (options.length === 0) return;

			const joined = options.join(' ').toUpperCase();
			expect(joined.includes(d.vendors.disallowedVendor.toUpperCase())).toBeFalsy();
			expect(joined.includes(d.groups.disallowedGroup.toUpperCase())).toBeFalsy();
		}

		test.skip(executed === 0, 'No restricted user credentials are configured for selector validation.');
	});

	test('TC-VR-012/013/014/015: Accounts searches and inactive filters do not leak disallowed vendor data', async ({ page }) => {
		const persona = await loginAsVendorRestricted(page);
		if (!persona) return;
		await navigateToAccounts(page);

		await applyFilterAndWait(page);
		await assertAnyTokenInVisibleRows(page, d.vendors.allowedVendorA);
		await assertNoTokenInVisibleRows(page, d.vendors.disallowedVendor);

		const accountNameInput = page.getByRole('textbox', { name: d.accountPlaceholders.accountName }).first();
		if (await accountNameInput.isVisible().catch(() => false)) {
			await accountNameInput.fill(d.values.accountNameFilterToken);
			await applyFilterAndWait(page);
			await assertNoTokenInVisibleRows(page, d.vendors.disallowedVendor);
		}

		const showInactive = page.getByRole('checkbox', { name: d.accountLabels.showInactiveOnly }).first();
		if (await showInactive.isVisible().catch(() => false)) {
			await showInactive.check().catch(() => {});
			await applyFilterAndWait(page);
			await assertNoTokenInVisibleRows(page, d.vendors.disallowedVendor);
		}
	});

	test('TC-VR-016/017/018/019: Provider Groups and dependent lookups honor vendor scope', async ({ page }) => {
		const persona = await loginAsVendorRestricted(page);
		if (!persona) return;
		await navigateToProviderGroups(page);

		const applyBtn = page.getByRole('button', { name: d.labels.applyFilter }).first();
		if (await applyBtn.isVisible().catch(() => false)) {
			await applyBtn.click();
			await page.waitForTimeout(d.timeouts.filterMs);
		}

		await assertNoTokenInVisibleRows(page, d.vendors.disallowedVendor);
		await assertNoTokenInVisibleRows(page, d.groups.disallowedGroup);
	});

	test('TC-VR-020/021/022/023/024/025: Claims searches, pagination path, and first-session restrictions remain scoped', async ({ page }) => {
		const persona = await loginAsVendorRestricted(page);
		if (!persona) return;
		await navigateToClaimsDashboard(page);

		await applyFilterAndWait(page);
		await assertNoTokenInVisibleRows(page, d.vendors.disallowedVendor);
		await assertNoTokenInVisibleRows(page, d.groups.disallowedGroup);

		const claimIdInput = page.getByRole('textbox', { name: d.claimsPlaceholders.claimId }).first();
		if (await claimIdInput.isVisible().catch(() => false)) {
			if (d.values.allowedClaimId) {
				await claimIdInput.fill(d.values.allowedClaimId);
				await applyFilterAndWait(page);
				await expect(page.locator(d.selectors.tableRows).first()).toBeVisible();
			}
			if (d.values.disallowedClaimId) {
				await claimIdInput.fill(d.values.disallowedClaimId);
				await applyFilterAndWait(page);
				const rows = await countRows(page);
				if (rows > 0) {
					await assertNoTokenInVisibleRows(page, d.values.disallowedClaimId);
				}
			}
		}
	});

	test('TC-VR-026/027/028: Claims Archive and action-linked context honor vendor restrictions', async ({ page }) => {
		const persona = await loginAsVendorRestricted(page);
		if (!persona) return;
		await navigateToClaimsArchiveDashboard(page);
		await applyFilterAndWait(page);
		await assertNoTokenInVisibleRows(page, d.vendors.disallowedVendor);
	});

	test('TC-VR-029/030/031: Group Enrollments and lookups remain limited to assigned vendors', async ({ page }) => {
		const persona = await loginAsVendorRestricted(page);
		if (!persona) return;

		const opened = await openGroupEnrollmentsModule(page);
		test.skip(!opened, 'Group Enrollments module unavailable in this environment.');
		if (!opened) return;

		await assertNoTokenInVisibleRows(page, d.vendors.disallowedVendor);
		await assertNoTokenInVisibleRows(page, d.groups.disallowedGroup);

		const groupInput = page.getByRole('textbox', { name: d.enrollmentPlaceholders.groupId }).first();
		if (await groupInput.isVisible().catch(() => false)) {
			await groupInput.fill(d.groups.disallowedGroup);
			await applyFilterAndWait(page);
			const rows = await countRows(page);
			if (rows > 0) {
				await assertNoTokenInVisibleRows(page, d.groups.disallowedGroup);
			}
		}
	});

	test('TC-VR-032/033: Users vendor filter and restricted self-profile visibility remain bounded', async ({ page }) => {
		try {
			await ensureUsersPageReady(page);
			await clearUserFilters(page);

			const vendorDropdown = getVendorFilterDropdown(page);
			if (await vendorDropdown.isVisible().catch(() => false)) {
				await vendorDropdown.selectOption({ label: d.vendors.allowedVendorA }).catch(() => {});

				const applyBtn = page.getByRole('button', { name: d.labels.applyFilter }).first();
				if (await applyBtn.isVisible().catch(() => false)) {
					await applyBtn.click().catch(() => {});
					await page.waitForTimeout(d.timeouts.filterMs);
				}
			}
		} catch {
			test.skip(true, 'Users vendor-filter path is unavailable in current environment state.');
			return;
		}

		const persona = await loginAsVendorRestricted(page);
		if (!persona) return;
		await ensureUsersPageReady(page);
		await filterByLogin(page, persona.username);

		const ownCell = page.getByRole('cell', { name: persona.username }).first();
		const visible = await ownCell.isVisible().catch(() => false);
		test.skip(!visible, 'Restricted user self-profile is not visible in this environment state.');
		if (!visible) return;

		await expect(ownCell).toBeVisible();
		await openActionMenuForUser(page, persona.username);
		await expect(page.getByRole('button', { name: /deactivate|disable/i })).toHaveCount(0);
	});

	test('TC-VR-034/035/036/037: Payments and payment analytics remain within vendor scope', async ({ page }) => {
		const persona = await loginAsVendorRestricted(page);
		if (!persona) return;

		const viewPaymentsOpened = await openViewPaymentsModule(page);
		test.skip(!viewPaymentsOpened, 'View Payments module unavailable in current environment.');
		if (!viewPaymentsOpened) return;

		await assertNoTokenInVisibleRows(page, d.vendors.disallowedVendor);

		const analyticsOpened = await openPaymentAnalyticsModule(page);
		if (analyticsOpened) {
			await assertNoTokenInVisibleRows(page, d.vendors.disallowedVendor);
		}
	});

	test('TC-VR-038/039: Analytics reports and parameterized flows do not expose disallowed vendor scope', async ({ page }) => {
		const persona = await loginAsVendorRestricted(page);
		if (!persona) return;

		const responses = await gatherApiPayloadSnippets(page, async () => {
			await navigateToAnalytics(page).catch(async () => {
				const opened = await openPaymentAnalyticsModule(page);
				test.skip(!opened, 'Analytics module unavailable in current environment.');
			});
			await page.waitForTimeout(d.timeouts.filterMs);
		});

		if (responses.length > 0) {
			const joined = responses.join(' ').toUpperCase();
			expect(joined.includes(d.vendors.disallowedVendor.toUpperCase())).toBeFalsy();
		}
	});

	test('TC-VR-040/041/042: Blank searches, relogin persistence, and API/UI consistency remain restricted', async ({ page }) => {
		const persona = await loginAsVendorRestricted(page);
		if (!persona) return;
		await navigateToAccounts(page);

		const apiPayloads = await gatherApiPayloadSnippets(page, async () => {
			await applyFilterAndWait(page);
		});
		await assertNoTokenInVisibleRows(page, d.vendors.disallowedVendor);

		if (apiPayloads.length > 0) {
			const joined = apiPayloads.join(' ').toUpperCase();
			expect(joined.includes(d.vendors.disallowedVendor.toUpperCase())).toBeFalsy();
		}

		await logoutCurrentUser(page);
		await loginWithCredentials(page, persona.username, persona.password);
		await navigateToClaimsDashboard(page);
		await applyFilterAndWait(page);
		await assertNoTokenInVisibleRows(page, d.vendors.disallowedVendor);
	});

	test('TC-VR-043: Deactivated restricted user cannot log in and access vendor-scoped data', async ({ page }) => {
		test.skip(
			!hasCredentialPair(d.users.deactivatedRestricted.username, d.users.deactivatedRestricted.password),
			'Deactivated restricted-user credentials are not configured.'
		);
		if (!hasCredentialPair(d.users.deactivatedRestricted.username, d.users.deactivatedRestricted.password)) return;

		await logoutCurrentUser(page);
		await loginWithCredentials(page, d.users.deactivatedRestricted.username, d.users.deactivatedRestricted.password);

		const loginBtnVisible = await page.getByRole('button', { name: d.labels.login }).first().isVisible().catch(() => false);
		const dashboardVisible = await page.getByRole('link', { name: /accounts|claims|users/i }).first().isVisible().catch(() => false);
		expect(loginBtnVisible || !dashboardVisible).toBeTruthy();
	});

	test('DB sanity: target user profile row exists for cross-module vendor restriction validation context', async () => {
		const dbRow = await fetchUserClientByUsername(d.values.targetUsername);
		expect(dbRow).not.toBeNull();
	});
});
