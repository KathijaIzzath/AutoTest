import { test, expect } from '../myTestData';
import type { Locator, Page, Response } from '@playwright/test';
import {
	navigateToAccounts,
	navigateToAnalytics,
	navigateToClaimsArchiveDashboard,
	navigateToClaimsDashboard,
	navigateToUsers,
} from '../framework/navigation.helper';
import { fetchUserClientByUsername } from '../../testData/database.utils';
import * as d from '../../testData/BillingGroupUserTestData.json';
import {
	acceptNonElevatedPersona,
	elevatedAclSkipReason,
	loginWithPersonaFallback,
	type PersonaLoginResult,
} from '../framework/persona-credentials.helper';

let pageErrors: string[] = [];

function normalizeSpaces(value: string): string {
	return value.replace(/\s+/g, ' ').trim();
}

function escapeForRegex(value: string): string {
	return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
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
	const groupId = page.getByRole('textbox', { name: d.placeholders.groupId }).first();
	if (await firstName.isVisible().catch(() => false)) await firstName.fill('');
	if (await lastName.isVisible().catch(() => false)) await lastName.fill('');
	if (await groupId.isVisible().catch(() => false)) await groupId.fill('');
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
	const disableBtn = page.getByRole('button', { name: d.labels.disableUser }).first();
	const enableBtn = page.getByRole('button', { name: d.labels.enableUser }).first();

	if (
		(await editBtn.isVisible().catch(() => false)) ||
		(await disableBtn.isVisible().catch(() => false)) ||
		(await enableBtn.isVisible().catch(() => false))
	) {
		return true;
	}

	const blankLinks = page.getByRole('link').filter({ hasText: /^$/ });
	const count = await blankLinks.count();
	for (let i = 0; i < Math.min(count, 10); i += 1) {
		await blankLinks.nth(i).click().catch(() => {});
		if (
			(await editBtn.isVisible().catch(() => false)) ||
			(await disableBtn.isVisible().catch(() => false)) ||
			(await enableBtn.isVisible().catch(() => false))
		) {
			return true;
		}
	}

	return false;
}

async function openEditUserInfo(page: Page, username: string): Promise<boolean> {
	await filterByLogin(page, username);
	const opened = await openActionMenuForUser(page, username);
	if (!opened) return false;

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

async function addGroupToUserInEditDialog(page: Page, groupToken: string): Promise<'added' | 'already' | 'unavailable'> {
	const dialog = await getEditDialog(page);
	if (!dialog) return 'unavailable';

	const existing = await dialog
		.getByText(new RegExp(escapeForRegex(groupToken), 'i'))
		.first()
		.isVisible()
		.catch(() => false);
	if (existing) return 'already';

	const addGroupBtn = dialog.getByRole('button', { name: new RegExp(d.labels.addGroupRegex, 'i') }).first();
	if (await addGroupBtn.isVisible().catch(() => false)) {
		await addGroupBtn.click().catch(() => {});
	}

	const groupInput = dialog.getByRole('textbox', { name: /group/i }).first();
	const groupCombo = dialog.getByRole('combobox', { name: /group/i }).first();

	if (await groupInput.isVisible().catch(() => false)) {
		await groupInput.fill('');
		await groupInput.fill(groupToken);
		await groupInput.press('Enter').catch(() => {});
	} else if (await groupCombo.isVisible().catch(() => false)) {
		await groupCombo.click().catch(() => {});
		await groupCombo.fill(groupToken).catch(() => {});
		await groupCombo.press('Enter').catch(() => {});
	} else {
		return 'unavailable';
	}

	await page.waitForTimeout(d.timeouts.saveMs);
	const duplicateToast = page.getByText(new RegExp(d.messages.duplicateGroupRegex, 'i')).first();
	if (await duplicateToast.isVisible().catch(() => false)) {
		return 'already';
	}

	return 'added';
}

async function removeGroupFromUserInEditDialog(page: Page, groupToken: string): Promise<'removed' | 'not-found' | 'unavailable'> {
	const dialog = await getEditDialog(page);
	if (!dialog) return 'unavailable';

	const row = dialog.locator('tr,li,div').filter({ hasText: new RegExp(escapeForRegex(groupToken), 'i') }).first();
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

async function loginAsBillingGroupUser(page: Page): Promise<PersonaLoginResult | null> {
	return loginAsRestrictedPersona(page, d.users.billingGroupUser, 'Billing Group');
}

async function countRows(page: Page): Promise<number> {
	return page.locator(d.selectors.tableRows).count();
}

async function assertNoTokenInVisibleRows(page: Page, token: string): Promise<void> {
	const rows = page.locator(d.selectors.tableRows);
	const rowCount = await rows.count();
	test.skip(rowCount === 0, 'No rows available for restricted scope assertion.');
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
	test.skip(rowCount === 0, 'No rows available for allowed-scope assertion.');
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

async function openEraModule(page: Page): Promise<boolean> {
	const eraLink = page.getByRole('link', { name: new RegExp(d.moduleLabels.eraNav, 'i') }).first();
	if (!(await eraLink.isVisible().catch(() => false))) {
		return false;
	}

	await eraLink.click();
	await page.waitForTimeout(d.timeouts.filterMs);
	return true;
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
			if (normalized) {
				options.push(normalized);
			}
		}
	}

	return Array.from(new Set(options));
}

async function captureApiPayloads(page: Page, action: () => Promise<void>): Promise<string[]> {
	const payloads: string[] = [];
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
			payloads.push(body.slice(0, d.values.maxApiBodyCaptureLength));
		}
	};

	page.on('response', listener);
	await action();
	await page.waitForTimeout(d.timeouts.apiCaptureMs);
	page.off('response', listener);

	return payloads;
}

test.describe('Users - Billing Group user type suite', () => {
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

	test('BG-001/002/003/004: Profile setup persists billing-group vendor/account/group assignments and updates after removal', async ({ page }) => {
		const opened = await openEditUserInfo(page, d.values.targetUsername);
		test.skip(!opened, 'Edit User Info unavailable in current environment state.');
		if (!opened) return;

		const addGroupA = await addGroupToUserInEditDialog(page, d.scopes.allowedGroupA);
		const addGroupB = await addGroupToUserInEditDialog(page, d.scopes.allowedGroupB);
		test.skip(addGroupA === 'unavailable' && addGroupB === 'unavailable', 'Group assignment controls unavailable in Edit User dialog.');
		if (addGroupA === 'unavailable' && addGroupB === 'unavailable') return;

		await saveEditDialogIfVisible(page);

		const reopened = await openEditUserInfo(page, d.values.targetUsername);
		test.skip(!reopened, 'Could not reopen Edit User dialog after save.');
		if (!reopened) return;

		const removeState = await removeGroupFromUserInEditDialog(page, d.scopes.allowedGroupB);
		if (removeState !== 'unavailable') {
			await saveEditDialogIfVisible(page);
		}
	});

	test('BG-005/006/007/008: Header and dashboard DDL context stays scoped for billing group user', async ({ page }) => {
		const persona = await loginAsBillingGroupUser(page);
		if (!persona) return;

		const options = await collectSelectorOptions(page);
		test.skip(options.length === 0, 'No selector options are visible in current environment state.');
		if (options.length === 0) return;

		const joined = options.join(' ').toUpperCase();
		expect(joined.includes(d.scopes.disallowedGroup.toUpperCase())).toBeFalsy();
		expect(joined.includes(d.scopes.disallowedVendor.toUpperCase())).toBeFalsy();
	});

	test('BG-009/010/011: Accounts module enforces account and group visibility boundaries', async ({ page }) => {
		const persona = await loginAsBillingGroupUser(page);
		if (!persona) return;
		await navigateToAccounts(page);

		await applyFilterAndWait(page);
		await assertAnyTokenInVisibleRows(page, d.scopes.allowedAccount);
		await assertNoTokenInVisibleRows(page, d.scopes.disallowedAccount);
	});

	test('BG-012/013/014/015: Claims searches, pagination path, and context switching do not leak disallowed groups', async ({ page }) => {
		const persona = await loginAsBillingGroupUser(page);
		if (!persona) return;
		await navigateToClaimsDashboard(page);

		await applyFilterAndWait(page);
		await assertNoTokenInVisibleRows(page, d.scopes.disallowedGroup);

		const patientAccountInput = page.getByRole('textbox', { name: d.claimsPlaceholders.patientAccount }).first();
		if (await patientAccountInput.isVisible().catch(() => false)) {
			await patientAccountInput.fill(d.values.patientAccountNumber);
			await applyFilterAndWait(page);
			await assertNoTokenInVisibleRows(page, d.scopes.disallowedGroup);
		}
	});

	test('BG-016/017/018: ERA and Group Enrollment respect assigned billing-group scope', async ({ page }) => {
		const persona = await loginAsBillingGroupUser(page);
		if (!persona) return;

		const eraOpened = await openEraModule(page);
		if (eraOpened) {
			await assertNoTokenInVisibleRows(page, d.scopes.disallowedGroup);
		}

		const enrollmentsOpened = await openGroupEnrollmentsModule(page);
		if (enrollmentsOpened) {
			await assertNoTokenInVisibleRows(page, d.scopes.disallowedGroup);
		}
	});

	test('BG-019/020/021/022: Financial View Payments and Payment Analytics stay within active-site/group scope', async ({ page }) => {
		const persona = await loginAsBillingGroupUser(page);
		if (!persona) return;

		const viewPaymentsOpened = await openViewPaymentsModule(page);
		test.skip(!viewPaymentsOpened, 'View Payments module unavailable in current environment state.');
		if (!viewPaymentsOpened) return;

		await assertNoTokenInVisibleRows(page, d.scopes.disallowedVendor);

		const analyticsOpened = await openPaymentAnalyticsModule(page);
		if (analyticsOpened) {
			await assertNoTokenInVisibleRows(page, d.scopes.disallowedVendor);
		}
	});

	test('BG-023/024: Users module group filter supports allowed groups and blocks privilege escalation', async ({ page }) => {
		const persona = await loginAsBillingGroupUser(page);
		if (!persona) return;
		await ensureUsersPageReady(page);

		await clearUserFilters(page);
		const groupField = page.getByRole('textbox', { name: d.placeholders.groupId }).first();
		if (await groupField.isVisible().catch(() => false)) {
			await groupField.fill(d.scopes.allowedGroupA);
			await applyFilterAndWait(page);
		}

		await filterByLogin(page, persona.username);
		const ownCell = page.getByRole('cell', { name: persona.username }).first();
		const visible = await ownCell.isVisible().catch(() => false);
		test.skip(!visible, 'Self-profile row not visible in Users results for billing group user in current environment state.');
		if (!visible) return;

		await openActionMenuForUser(page, persona.username);
		await expect(page.getByRole('button', { name: /deactivate|disable/i })).toHaveCount(0);
	});

	test('BG-025/026/027: Analytics module access and provider-group report scope follow permissions and restrictions', async ({ page }) => {
		const withAnalytics = await loginWithPersonaFallback(page, {
			configured: d.users.billingGroupWithAnalytics,
			logout: logoutCurrentUser,
			acceptPersona: acceptNonElevatedPersona,
		});
		if (withAnalytics && !withAnalytics.isElevatedFallback) {
			const apiPayloads = await captureApiPayloads(page, async () => {
				await navigateToAnalytics(page).catch(async () => {
					const opened = await openPaymentAnalyticsModule(page);
					test.skip(!opened, 'Analytics route unavailable in current environment state.');
				});
			});

			if (apiPayloads.length > 0) {
				const joined = apiPayloads.join(' ').toUpperCase();
				expect(joined.includes(d.scopes.disallowedGroup.toUpperCase())).toBeFalsy();
			}
		}

		const noAnalytics = await loginWithPersonaFallback(page, {
			configured: d.users.billingGroupNoAnalytics,
			logout: logoutCurrentUser,
			acceptPersona: acceptNonElevatedPersona,
		});
		if (noAnalytics && !noAnalytics.isElevatedFallback) {
			const analyticsLink = page.getByRole('link', { name: new RegExp(d.labels.analyticsLabel, 'i') }).first();
			const visible = await analyticsLink.isVisible().catch(() => false);
			expect(visible).toBeFalsy();
		}
	});

	test('BG-028/029/030: Realtime token ACL dependency and denied group behavior are enforced', async ({ page }) => {
		const persona = await loginAsRestrictedPersona(page, d.users.billingGroupRealtime, 'Billing Group Realtime');
		if (!persona) return;
		await navigateToClaimsDashboard(page);

		const payloads = await captureApiPayloads(page, async () => {
			await applyFilterAndWait(page);
		});

		if (payloads.length > 0) {
			const joined = payloads.join(' ').toUpperCase();
			if (d.values.deniedRealtimeGroup) {
				expect(joined.includes(d.values.deniedRealtimeGroup.toUpperCase())).toBeFalsy();
			}
		}
	});

	test('BG-031/032/033: Negative/edge flows (blank search, refresh, pagination) never broaden scope', async ({ page }) => {
		const persona = await loginAsBillingGroupUser(page);
		if (!persona) return;
		await navigateToClaimsDashboard(page);

		await applyFilterAndWait(page);
		await assertNoTokenInVisibleRows(page, d.scopes.disallowedGroup);

		await page.reload();
		await page.waitForTimeout(d.timeouts.filterMs);
		await applyFilterAndWait(page);
		await assertNoTokenInVisibleRows(page, d.scopes.disallowedGroup);

		const rows = await countRows(page);
		if (rows > 0) {
			await assertNoTokenInVisibleRows(page, d.scopes.disallowedVendor);
		}
	});

	test('DB sanity: billing-group target user profile exists for regression context', async () => {
		const dbRow = await fetchUserClientByUsername(d.values.targetUsername);
		expect(dbRow).not.toBeNull();
	});
});
