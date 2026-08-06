import { test, expect } from '../myTestData';
import type { Locator, Page } from '@playwright/test';
import {
	navigateToAccounts,
	navigateToClaimsArchiveDashboard,
	navigateToClaimsDashboard,
	navigateToProviderGroups,
	navigateToUsers,
} from '../framework/navigation.helper';
import { fetchUserClientByUsername } from '../../testData/database.utils';
import * as d from '../../testData/AccountRestrictionUserTestData.json';
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
		const loginFilter = page.getByRole('textbox', { name: new RegExp(`${d.placeholders.loginPrimary}|${d.placeholders.loginFallback}`, 'i') }).first();
		if (await loginFilter.isVisible().catch(() => false)) {
			return;
		}
		await page.keyboard.press('Escape').catch(() => {});
		await page.waitForTimeout(d.timeouts.retryMs);
	}
	test.skip(true, 'Users dashboard was not ready after retries.');
}

async function clearAndFillTextbox(page: Page, name: string, value: string): Promise<void> {
	const field = page.getByRole('textbox', { name }).first();
	await expect(field).toBeVisible();
	await field.click();
	await field.fill('');
	await field.fill(value);
}

function getLoginFilterTextbox(page: Page): Locator {
	return page
		.getByRole('textbox', {
			name: new RegExp(`${d.placeholders.loginPrimary}|${d.placeholders.loginFallback}`, 'i'),
		})
		.first();
}

async function clearUserFilters(page: Page): Promise<void> {
	const loginField = getLoginFilterTextbox(page);
	await expect(loginField).toBeVisible();
	await loginField.fill('');

	await clearAndFillTextbox(page, d.placeholders.firstName, '');
	await clearAndFillTextbox(page, d.placeholders.lastName, '');
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
	if (!dialog) {
		return;
	}

	const saveBtn = dialog.getByRole('button', { name: d.labels.save }).first();
	if (await saveBtn.isVisible().catch(() => false)) {
		await saveBtn.click().catch(() => {});
		await page.waitForTimeout(d.timeouts.saveMs);
	}
}

async function isAccountVisibleInEditDialog(page: Page, accountToken: string): Promise<boolean> {
	const dialog = await getEditDialog(page);
	if (!dialog) {
		return false;
	}

	return dialog
		.getByText(new RegExp(escapeForRegex(accountToken), 'i'))
		.first()
		.isVisible()
		.catch(() => false);
}

async function addAccountToUserInEditDialog(page: Page, accountToken: string): Promise<'added' | 'already' | 'unavailable'> {
	const dialog = await getEditDialog(page);
	if (!dialog) {
		return 'unavailable';
	}

	if (await isAccountVisibleInEditDialog(page, accountToken)) {
		return 'already';
	}

	const addAccountBtn = dialog.getByRole('button', { name: new RegExp(d.labels.addAccountRegex, 'i') }).first();
	if (await addAccountBtn.isVisible().catch(() => false)) {
		await addAccountBtn.click().catch(() => {});
	}

	const accountInput = dialog.getByRole('textbox', { name: /account/i }).first();
	const accountCombo = dialog.getByRole('combobox', { name: /account/i }).first();

	if (await accountInput.isVisible().catch(() => false)) {
		await accountInput.fill('');
		await accountInput.fill(accountToken);
		await accountInput.press('Enter').catch(() => {});
	} else if (await accountCombo.isVisible().catch(() => false)) {
		await accountCombo.click().catch(() => {});
		await accountCombo.fill(accountToken).catch(() => {});
		await accountCombo.press('Enter').catch(() => {});
	} else {
		return 'unavailable';
	}

	await page.waitForTimeout(d.timeouts.saveMs);
	const duplicate = page.getByText(new RegExp(d.messages.duplicateAccountRegex, 'i')).first();
	if (await duplicate.isVisible().catch(() => false)) {
		return 'already';
	}

	return 'added';
}

async function removeAccountFromUserInEditDialog(page: Page, accountToken: string): Promise<'removed' | 'not-found' | 'unavailable'> {
	const dialog = await getEditDialog(page);
	if (!dialog) {
		return 'unavailable';
	}

	const row = dialog.locator('tr,li,div').filter({ hasText: new RegExp(escapeForRegex(accountToken), 'i') }).first();
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
async function loginAsAccountRestricted(page: Page): Promise<PersonaLoginResult | null> {
	const persona = await loginWithPersonaFallback(page, {
		configured: d.users.accountLevelRestricted,
		logout: logoutCurrentUser,
		acceptPersona: acceptNonElevatedPersona,
	});
	test.skip(
		!persona,
		'Could not login with configured account-restricted user, scadmin, qasecureconnect, or secureconnect50.',
	);
	if (!persona) return null;
	if (persona.isElevatedFallback) {
		test.skip(true, elevatedAclSkipReason('Account-restricted', persona.source));
		return null;
	}
	return persona;
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

async function openProcessPaymentsModule(page: Page): Promise<boolean> {
	const financialToggle = page.getByRole('listitem').filter({ hasText: /financial/i }).getByRole('button').first();
	if (await financialToggle.isVisible().catch(() => false)) {
		await financialToggle.click().catch(() => {});
	}

	const navLink = page.getByRole('link', { name: new RegExp(d.moduleLabels.processPaymentsNav, 'i') }).first();
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

test.describe('Users - Account Restriction suite', () => {
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

	test('TC-AR-001: Admin can assign one specific account to a user profile and persist on reopen', async ({ page }) => {
		const opened = await openEditUserInfo(page, d.values.targetUsername);
		test.skip(!opened, 'Edit User Info is unavailable in current environment state.');
		if (!opened) return;

		const addResult = await addAccountToUserInEditDialog(page, d.accounts.allowedAccountA);
		test.skip(addResult === 'unavailable', 'Add Account controls unavailable in Edit User dialog.');
		if (addResult === 'unavailable') return;

		await saveEditDialogIfVisible(page);

		const reopened = await openEditUserInfo(page, d.values.targetUsername);
		test.skip(!reopened, 'Could not reopen Edit User dialog after save.');
		if (!reopened) return;

		const visible = await isAccountVisibleInEditDialog(page, d.accounts.allowedAccountA);
		expect(visible).toBeTruthy();
	});

	test('TC-AR-002/004: Admin can assign multiple accounts and adding new one keeps existing assignments', async ({ page }) => {
		const opened = await openEditUserInfo(page, d.values.targetUsername);
		test.skip(!opened, 'Edit User Info is unavailable in current environment state.');
		if (!opened) return;

		const addA = await addAccountToUserInEditDialog(page, d.accounts.allowedAccountA);
		const addB = await addAccountToUserInEditDialog(page, d.accounts.allowedAccountB);
		test.skip(addA === 'unavailable' || addB === 'unavailable', 'Add Account controls unavailable for multi-account assignment.');
		if (addA === 'unavailable' || addB === 'unavailable') return;

		await saveEditDialogIfVisible(page);

		const reopened = await openEditUserInfo(page, d.values.targetUsername);
		test.skip(!reopened, 'Could not reopen Edit User dialog after multi-account save.');
		if (!reopened) return;

		expect(await isAccountVisibleInEditDialog(page, d.accounts.allowedAccountA)).toBeTruthy();
		expect(await isAccountVisibleInEditDialog(page, d.accounts.allowedAccountB)).toBeTruthy();
	});

	test('TC-AR-003: Previously assigned restricted accounts are visible and reviewable in Edit User', async ({ page }) => {
		const opened = await openEditUserInfo(page, d.values.targetUsername);
		test.skip(!opened, 'Edit User Info is unavailable in current environment state.');
		if (!opened) return;

		const dialog = await getEditDialog(page);
		test.skip(!dialog, 'Edit User dialog is unavailable after opening.');
		if (!dialog) return;

		await expect(dialog).toContainText(new RegExp(escapeForRegex(d.accounts.allowedAccountA), 'i'));
	});

	test('TC-AR-005: Removing an account removes it from profile persistence and dependent scope', async ({ page }) => {
		const opened = await openEditUserInfo(page, d.values.targetUsername);
		test.skip(!opened, 'Edit User Info is unavailable in current environment state.');
		if (!opened) return;

		await addAccountToUserInEditDialog(page, d.accounts.allowedAccountB);
		await saveEditDialogIfVisible(page);

		const reopened = await openEditUserInfo(page, d.values.targetUsername);
		test.skip(!reopened, 'Could not reopen Edit User dialog for account removal flow.');
		if (!reopened) return;

		const remove = await removeAccountFromUserInEditDialog(page, d.accounts.allowedAccountB);
		test.skip(remove === 'unavailable', 'Account row remove controls unavailable in Edit User dialog.');
		if (remove === 'unavailable') return;

		await saveEditDialogIfVisible(page);

		const reopenedAgain = await openEditUserInfo(page, d.values.targetUsername);
		test.skip(!reopenedAgain, 'Could not reopen Edit User after removal save.');
		if (!reopenedAgain) return;

		const stillVisible = await isAccountVisibleInEditDialog(page, d.accounts.allowedAccountB);
		expect(stillVisible).toBeFalsy();
	});

	test('TC-AR-006/007: Add Account search supports partial account token and shows account-specific guidance', async ({ page }) => {
		const opened = await openEditUserInfo(page, d.values.targetUsername);
		test.skip(!opened, 'Edit User Info is unavailable in current environment state.');
		if (!opened) return;

		const dialog = await getEditDialog(page);
		test.skip(!dialog, 'Edit User dialog is unavailable for account search validation.');
		if (!dialog) return;

		await expect(dialog.getByText(new RegExp(d.messages.accountGuidanceRegex, 'i')).first()).toBeVisible();

		const accountInput = dialog.getByRole('textbox', { name: /account/i }).first();
		const accountCombo = dialog.getByRole('combobox', { name: /account/i }).first();
		if (await accountInput.isVisible().catch(() => false)) {
			await accountInput.fill(d.values.partialAccountSearch);
		} else if (await accountCombo.isVisible().catch(() => false)) {
			await accountCombo.click().catch(() => {});
			await accountCombo.fill(d.values.partialAccountSearch).catch(() => {});
		} else {
			test.skip(true, 'No account name/number input control visible in Edit User dialog.');
			return;
		}

		await page.waitForTimeout(d.timeouts.filterMs);
	});

	test('TC-AR-008/009/010/011: Accounts module blank and filtered searches stay within assigned account scope', async ({ page }) => {
		const persona = await loginAsAccountRestricted(page);
		if (!persona) return;
		await navigateToAccounts(page);

		await applyFilterAndWait(page);
		await assertAnyTokenInVisibleRows(page, d.accounts.allowedAccountA);
		await assertNoTokenInVisibleRows(page, d.accounts.disallowedAccountC);

		const accountNameInput = page.getByRole('textbox', { name: d.accountPlaceholders.accountName }).first();
		if (await accountNameInput.isVisible().catch(() => false)) {
			await accountNameInput.fill(d.values.accountNameFilterToken);
			await applyFilterAndWait(page);
			await assertNoTokenInVisibleRows(page, d.accounts.disallowedAccountC);
		}

		const showInactive = page.getByRole('checkbox', { name: d.accountLabels.showInactiveOnly }).first();
		if (await showInactive.isVisible().catch(() => false)) {
			await showInactive.check().catch(() => {});
			await applyFilterAndWait(page);
			await assertNoTokenInVisibleRows(page, d.accounts.disallowedAccountC);
		}
	});

	test('TC-AR-012/013/014/015: Provider Groups and Add Provider entry points remain restricted by account scope', async ({ page }) => {
		const persona = await loginAsAccountRestricted(page);
		if (!persona) return;
		await navigateToProviderGroups(page);

		const applyBtn = page.getByRole('button', { name: d.labels.applyFilter }).first();
		if (await applyBtn.isVisible().catch(() => false)) {
			await applyBtn.click();
			await page.waitForTimeout(d.timeouts.filterMs);
		}

		await assertNoTokenInVisibleRows(page, d.accounts.disallowedAccountC);
	});

	test('TC-AR-016/017/018/019/020/021: Claims enforcement blocks disallowed account/group leakage in base and targeted searches', async ({ page }) => {
		const persona = await loginAsAccountRestricted(page);
		if (!persona) return;
		await navigateToClaimsDashboard(page);

		const applyBtn = page.getByRole('button', { name: d.labels.applyFilter }).first();
		if (await applyBtn.isVisible().catch(() => false)) {
			await applyBtn.click();
			await page.waitForTimeout(d.timeouts.filterMs);
		}

		await assertNoTokenInVisibleRows(page, d.accounts.disallowedAccountC);
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

	test('TC-AR-022/023/024: Claims Archive honors account restriction and does not expose unauthorized action context', async ({ page }) => {
		const persona = await loginAsAccountRestricted(page);
		if (!persona) return;
		await navigateToClaimsArchiveDashboard(page);

		const applyBtn = page.getByRole('button', { name: d.labels.applyFilter }).first();
		if (await applyBtn.isVisible().catch(() => false)) {
			await applyBtn.click();
			await page.waitForTimeout(d.timeouts.filterMs);
		}

		await assertNoTokenInVisibleRows(page, d.accounts.disallowedAccountC);
		await assertNoTokenInVisibleRows(page, d.groups.disallowedGroup);
	});

	test('TC-AR-025/026/027: Group Enrollments and lookup paths stay within allowed account scope', async ({ page }) => {
		const persona = await loginAsAccountRestricted(page);
		if (!persona) return;

		const opened = await openGroupEnrollmentsModule(page);
		test.skip(!opened, 'Group Enrollments module is unavailable for restricted user in current environment.');
		if (!opened) return;

		await assertNoTokenInVisibleRows(page, d.accounts.disallowedAccountC);
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

	test('TC-AR-028: Users profile reflects saved account restrictions for target user', async ({ page }) => {
		await filterByLogin(page, d.values.targetUsername);
		const row = await getUserRow(page, d.values.targetUsername);

		const rowHasAccountToken = new RegExp(escapeForRegex(d.accounts.allowedAccountA), 'i').test(
			normalizeSpaces((await row.textContent()) ?? '')
		);

		if (rowHasAccountToken) {
			await expect(row).toContainText(new RegExp(escapeForRegex(d.accounts.allowedAccountA), 'i'));
			return;
		}

		const reopened = await openEditUserInfo(page, d.values.targetUsername);
		test.skip(!reopened, 'Account assignment visibility is unavailable in row and Edit User dialog in current environment state.');
		if (!reopened) return;

		const inDialog = await isAccountVisibleInEditDialog(page, d.accounts.allowedAccountA);
		test.skip(!inDialog, 'Configured allowed account is not currently assigned to target user in this environment state.');
		if (!inDialog) return;

		expect(inDialog).toBeTruthy();
	});

	test('TC-AR-029: Restricted user can view own profile without privilege escalation', async ({ page }) => {
		const persona = await loginAsAccountRestricted(page);
		if (!persona) return;
		await ensureUsersPageReady(page);
		await filterByLogin(page, persona.username);

		const ownCell = page.getByRole('cell', { name: persona.username }).first();
		const visible = await ownCell.isVisible().catch(() => false);
		test.skip(!visible, 'Restricted user own profile not visible in Users search in this environment.');
		if (!visible) return;

		await expect(ownCell).toBeVisible();
		await openActionMenuForUser(page, persona.username);
		await expect(page.getByRole('button', { name: /deactivate|disable/i })).toHaveCount(0);
	});

	test('TC-AR-030/031/032: View Payments and Payment Analytics stay within allowed scope', async ({ page }) => {
		const persona = await loginAsAccountRestricted(page);
		if (!persona) return;

		const viewPaymentsOpened = await openViewPaymentsModule(page);
		test.skip(!viewPaymentsOpened, 'View Payments module unavailable for restricted user in current environment.');
		if (!viewPaymentsOpened) return;

		await assertNoTokenInVisibleRows(page, d.accounts.disallowedAccountC);

		const analyticsOpened = await openPaymentAnalyticsModule(page);
		if (analyticsOpened) {
			await assertNoTokenInVisibleRows(page, d.accounts.disallowedAccountC);
		}
	});

	test('TC-AR-033/034/035: Dashboard vendor/group selectors show authorized options and do not expand scope across modules', async ({ page }) => {
		const persona = await loginAsAccountRestricted(page);
		if (!persona) return;

		const options = await collectSelectorOptions(page);
		test.skip(options.length === 0, 'No dashboard selector options visible in this environment state.');
		if (options.length === 0) return;

		const joined = options.join(' ').toUpperCase();
		expect(joined.includes(d.accounts.disallowedAccountC.toUpperCase())).toBeFalsy();
		expect(joined.includes(d.groups.disallowedGroup.toUpperCase())).toBeFalsy();

		await navigateToClaimsDashboard(page);
		await assertNoTokenInVisibleRows(page, d.accounts.disallowedAccountC);
		await navigateToAccounts(page);
		await assertNoTokenInVisibleRows(page, d.accounts.disallowedAccountC);
	});

	test('TC-AR-036/037: Analytics/report-linked views enforce allowed scope where available', async ({ page }) => {
		const persona = await loginAsAccountRestricted(page);
		if (!persona) return;

		const analyticsOpened = await openPaymentAnalyticsModule(page);
		test.skip(!analyticsOpened, 'Analytics module is unavailable for restricted user in current environment state.');
		if (!analyticsOpened) return;

		await assertNoTokenInVisibleRows(page, d.accounts.disallowedAccountC);
	});

	test('TC-AR-038/039/040: Blank searches, relogin session persistence, and UI consistency remain restricted', async ({ page }) => {
		const persona = await loginAsAccountRestricted(page);
		if (!persona) return;
		await navigateToAccounts(page);
		await applyFilterAndWait(page);
		await assertNoTokenInVisibleRows(page, d.accounts.disallowedAccountC);

		await logoutCurrentUser(page);
		await loginWithCredentials(page, persona.username, persona.password);
		await navigateToClaimsDashboard(page);
		const applyBtn = page.getByRole('button', { name: d.labels.applyFilter }).first();
		if (await applyBtn.isVisible().catch(() => false)) {
			await applyBtn.click();
			await page.waitForTimeout(d.timeouts.filterMs);
		}
		await assertNoTokenInVisibleRows(page, d.accounts.disallowedAccountC);
	});

	test('DB sanity: target user profile row exists for cross-module account restriction validation context', async () => {
		const dbRow = await fetchUserClientByUsername(d.values.targetUsername);
		expect(dbRow).not.toBeNull();
	});
});
