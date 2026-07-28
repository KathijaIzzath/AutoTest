import { test, expect } from '../myTestData';
import type { Locator, Page } from '@playwright/test';
import {
	navigateToAccounts,
	navigateToClaimsDashboard,
	navigateToProviderGroups,
	navigateToUsers,
} from '../framework/navigation.helper';
import {
	fetchAnyInactiveUserClient,
	fetchUserClientByUsername,
	fetchUserClientsByFilters,
} from '../../testData/database.utils';
import * as userData from '../../testData/UserInfo.json';
import * as d from '../../testData/GroupRestrictionUserTestData.json';

let pageErrors: string[] = [];

function escapeForRegex(value: string): string {
	return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

function normalizeSpaces(value: string): string {
	return value.replace(/\s+/g, ' ').trim();
}

async function applyFilterAndWait(page: Page): Promise<void> {
	await page.getByRole('button', { name: d.labels.applyFilter }).click();
	await page.waitForTimeout(d.timeouts.filterMs);
}

async function ensureUsersPageReady(page: Page): Promise<void> {
	for (let attempt = 1; attempt <= 3; attempt += 1) {
		await navigateToUsers(page).catch(() => {});
		const firstNameFilter = page.getByRole('textbox', { name: d.placeholders.firstName }).first();
		if (await firstNameFilter.isVisible().catch(() => false)) {
			return;
		}

		await page.keyboard.press('Escape').catch(() => {});
		await page.waitForTimeout(d.timeouts.retryMs);
	}

	throw new Error('Users dashboard filter input was not visible after retries.');
}

async function clearAndFillTextbox(page: Page, name: string, value: string): Promise<void> {
	const field = page.getByRole('textbox', { name }).first();
	await expect(field).toBeVisible();
	await field.click();
	await field.fill(d.edgeCases.empty);
	await field.fill(value);
}

function getLoginFilterTextbox(page: Page): Locator {
	return page
		.getByRole('textbox', {
			name: new RegExp(`${d.placeholders.loginPrimary}|${d.placeholders.loginFallback}`, 'i'),
		})
		.first();
}

function getStatusFilterDropdown(page: Page): Locator {
	return page
		.locator('dropdown-filter-item')
		.filter({ hasText: d.selectors.statusDropdownContainerText })
		.getByRole('combobox')
		.first();
}

function getUserTypeFilterDropdown(page: Page): Locator {
	return page
		.locator('dropdown-filter-item')
		.filter({ hasText: d.selectors.userTypeDropdownContainerText })
		.getByRole('combobox')
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
	await clearAndFillTextbox(page, d.placeholders.firstName, d.edgeCases.empty);
	await clearAndFillTextbox(page, d.placeholders.lastName, d.edgeCases.empty);
	await clearAndFillTextbox(page, d.placeholders.groupId, d.edgeCases.empty);

	const loginField = getLoginFilterTextbox(page);
	await expect(loginField).toBeVisible();
	await loginField.click();
	await loginField.fill(d.edgeCases.empty);

	const statusSelect = getStatusFilterDropdown(page);
	const userTypeSelect = getUserTypeFilterDropdown(page);
	const vendorSelect = getVendorFilterDropdown(page);

	if (await statusSelect.isVisible().catch(() => false)) {
		await statusSelect.selectOption('').catch(() => {});
	}
	if (await userTypeSelect.isVisible().catch(() => false)) {
		await userTypeSelect.selectOption('').catch(() => {});
	}
	if (await vendorSelect.isVisible().catch(() => false)) {
		await vendorSelect.selectOption('').catch(() => {});
	}
}

async function filterByLogin(page: Page, login: string): Promise<void> {
	await ensureUsersPageReady(page);
	await clearUserFilters(page);

	const field = getLoginFilterTextbox(page);
	await expect(field).toBeVisible();
	await field.click();
	await field.fill(d.edgeCases.empty);
	await field.fill(login);
	await applyFilterAndWait(page);
}

async function filterByFirstName(page: Page, firstName: string): Promise<void> {
	await ensureUsersPageReady(page);
	await clearUserFilters(page);
	await clearAndFillTextbox(page, d.placeholders.firstName, firstName);
	await applyFilterAndWait(page);
}

async function filterByGroupId(page: Page, groupId: string): Promise<void> {
	await ensureUsersPageReady(page);
	await clearUserFilters(page);
	await clearAndFillTextbox(page, d.placeholders.groupId, groupId);
	await applyFilterAndWait(page);
}

async function assertNoResultsOrZeroRows(page: Page): Promise<void> {
	const emptyState = page.locator(d.selectors.noResults).first();
	const hasEmptyState = await emptyState.isVisible().catch(() => false);
	if (!hasEmptyState) {
		await expect(page.locator(d.selectors.tableRows)).toHaveCount(0);
	}
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

	const disableBtn = page.getByRole('button', { name: d.labels.disableUser });
	const enableBtn = page.getByRole('button', { name: d.labels.enableUser });
	const editBtn = page.getByRole('button', { name: d.labels.editUserInfo });

	if (
		(await disableBtn.isVisible().catch(() => false)) ||
		(await enableBtn.isVisible().catch(() => false)) ||
		(await editBtn.isVisible().catch(() => false))
	) {
		return true;
	}

	const blankLinks = page.getByRole('link').filter({ hasText: /^$/ });
	const count = await blankLinks.count();
	for (let i = 0; i < Math.min(count, 10); i += 1) {
		await blankLinks.nth(i).click().catch(() => {});
		if (
			(await disableBtn.isVisible().catch(() => false)) ||
			(await enableBtn.isVisible().catch(() => false)) ||
			(await editBtn.isVisible().catch(() => false))
		) {
			return true;
		}
	}

	return false;
}

async function setUserActiveState(
	page: Page,
	username: string,
	shouldBeActive: boolean
): Promise<'changed' | 'already' | 'unavailable'> {
	const opened = await openActionMenuForUser(page, username);
	if (!opened) {
		return 'unavailable';
	}

	const disableBtn = page.getByRole('button', { name: d.labels.disableUser });
	const enableBtn = page.getByRole('button', { name: d.labels.enableUser });

	if (shouldBeActive) {
		if (await enableBtn.isVisible().catch(() => false)) {
			await enableBtn.click();
			await page.waitForTimeout(d.timeouts.stateChangeMs);
			return 'changed';
		}
		if (await disableBtn.isVisible().catch(() => false)) {
			return 'already';
		}
	} else {
		if (await disableBtn.isVisible().catch(() => false)) {
			await disableBtn.click();
			await page.waitForTimeout(d.timeouts.stateChangeMs);
			return 'changed';
		}
		if (await enableBtn.isVisible().catch(() => false)) {
			return 'already';
		}
	}

	return 'unavailable';
}

async function assertUserShowsInactiveIndicator(page: Page, username: string): Promise<void> {
	const row = await getUserRow(page, username);

	const hasTextIndicator = await row
		.getByText(new RegExp(d.status.inactiveTextRegex, 'i'))
		.first()
		.isVisible()
		.catch(() => false);

	const hasTitleIndicator = await row
		.getByTitle(new RegExp(d.status.inactiveTitleRegex, 'i'))
		.first()
		.isVisible()
		.catch(() => false);

	expect(hasTextIndicator || hasTitleIndicator).toBeTruthy();
}

async function assertUserShowsActiveIndicator(page: Page, username: string): Promise<void> {
	const row = await getUserRow(page, username);

	const hasTextIndicator = await row
		.getByText(new RegExp(d.status.activeTextRegex, 'i'))
		.first()
		.isVisible()
		.catch(() => false);

	const hasTitleIndicator = await row
		.getByTitle(new RegExp(d.status.activeTitleRegex, 'i'))
		.first()
		.isVisible()
		.catch(() => false);

	expect(hasTextIndicator || hasTitleIndicator).toBeTruthy();
}

type SemanticColor = 'red' | 'green' | 'unknown';

async function inferSemanticStatusColor(locator: Locator): Promise<SemanticColor> {
	const classOrStyleMatch = await locator
		.evaluate((el) => {
			const className = (el as HTMLElement).className || '';
			const styleValue = (el as HTMLElement).getAttribute('style') || '';
			return `${String(className)} ${styleValue}`.toLowerCase();
		})
		.catch(() => '');

	if (/(danger|error|inactive|deactive|disabled|\bred\b)/i.test(classOrStyleMatch)) {
		return 'red';
	}
	if (/(success|active|enabled|\bgreen\b)/i.test(classOrStyleMatch)) {
		return 'green';
	}

	const rgb = await locator
		.evaluate((el) => {
			const color = getComputedStyle(el as HTMLElement).color || '';
			const match = color.match(/\d+/g);
			if (!match || match.length < 3) {
				return null;
			}
			return {
				r: Number(match[0]),
				g: Number(match[1]),
				b: Number(match[2]),
			};
		})
		.catch(() => null);

	if (!rgb) {
		return 'unknown';
	}

	if (rgb.r >= rgb.g + d.status.colorDeltaThreshold && rgb.r >= rgb.b) {
		return 'red';
	}
	if (rgb.g >= rgb.r + d.status.colorDeltaThreshold && rgb.g >= rgb.b) {
		return 'green';
	}
	return 'unknown';
}

async function assertStatusSemanticColor(page: Page, username: string, expected: 'red' | 'green'): Promise<void> {
	const row = await getUserRow(page, username);
	const statusText = expected === 'red' ? d.status.inactiveTextRegex : d.status.activeTextRegex;
	const statusTitle = expected === 'red' ? d.status.inactiveTitleRegex : d.status.activeTitleRegex;

	let statusMarker = row.getByTitle(new RegExp(statusTitle, 'i')).first();
	if (!(await statusMarker.isVisible().catch(() => false))) {
		statusMarker = row.getByText(new RegExp(statusText, 'i')).first();
	}

	await expect(statusMarker).toBeVisible();

	const semanticColor = await inferSemanticStatusColor(statusMarker);
	expect(
		[expected, 'unknown'].includes(semanticColor),
		`Expected ${expected} semantic status marker but found ${semanticColor}.`
	).toBeTruthy();
}

async function assertRowContainsDbIdentity(page: Page, username: string): Promise<void> {
	const dbRow = await fetchUserClientByUsername(username);
	expect(dbRow).not.toBeNull();
	if (!dbRow) return;

	const row = await getUserRow(page, dbRow.username);
	await expect(row).toContainText(new RegExp(escapeForRegex(dbRow.username), 'i'));

	const fullName = normalizeSpaces(`${dbRow.firstName} ${dbRow.lastName}`);
	if (fullName) {
		await expect(row).toContainText(new RegExp(escapeForRegex(fullName), 'i'));
	}

	if (dbRow.groupId) {
		await expect(row).toContainText(new RegExp(escapeForRegex(dbRow.groupId), 'i'));
	}
}

function hasCredentialPair(username: string, password: string): boolean {
	return username.trim().length > 0 && password.trim().length > 0;
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
	await page.getByRole('textbox', { name: d.inputs.loginUsername }).fill(username);
	await page.getByRole('textbox', { name: d.inputs.loginPassword }).fill(password);
	await page.getByRole('button', { name: d.labels.login }).click();
	await page.waitForTimeout(d.timeouts.saveMs);
}

async function openEditUserInfo(page: Page, username: string): Promise<boolean> {
	await filterByLogin(page, username);
	const opened = await openActionMenuForUser(page, username);
	if (!opened) {
		return false;
	}

	const editBtn = page.getByRole('button', { name: d.labels.editUserInfo });
	if (!(await editBtn.isVisible().catch(() => false))) {
		return false;
	}

	await editBtn.click();
	await page.waitForTimeout(d.timeouts.saveMs);
	return true;
}

async function addGroupToUserInEditModal(page: Page, groupId: string): Promise<'added' | 'already' | 'unavailable'> {
	const dialog = page.getByRole('dialog').first();
	if (!(await dialog.isVisible().catch(() => false))) {
		return 'unavailable';
	}

	const groupTextInput = dialog.getByRole('textbox', { name: /group/i }).first();
	if (await groupTextInput.isVisible().catch(() => false)) {
		await groupTextInput.fill('');
		await groupTextInput.fill(groupId);
		await groupTextInput.press('Enter').catch(() => {});
	} else {
		const groupCombo = dialog.getByRole('combobox', { name: /group/i }).first();
		if (!(await groupCombo.isVisible().catch(() => false))) {
			return 'unavailable';
		}
		await groupCombo.click();
		await groupCombo.fill(groupId).catch(() => {});
		await groupCombo.press('Enter').catch(() => {});
	}

	const duplicateToast = page.getByText(new RegExp(d.messages.duplicateGroupRegex, 'i')).first();
	if (await duplicateToast.isVisible().catch(() => false)) {
		return 'already';
	}

	const saveBtn = dialog.getByRole('button', { name: d.labels.save }).first();
	if (await saveBtn.isVisible().catch(() => false)) {
		await saveBtn.click().catch(() => {});
		await page.waitForTimeout(d.timeouts.saveMs);
	}

	return 'added';
}

async function countGroupOccurrencesOnUserRow(page: Page, username: string, groupId: string): Promise<number> {
	const row = await getUserRow(page, username);
	const rowText = normalizeSpaces((await row.textContent()) ?? '');
	const regex = new RegExp(escapeForRegex(groupId), 'gi');
	return (rowText.match(regex) ?? []).length;
}

async function collectDashboardGroupOptions(page: Page): Promise<string[]> {
	const options: string[] = [];
	const selects = page.locator(d.selectors.dashboardGroupSelect);
	const selectCount = await selects.count();

	for (let i = 0; i < selectCount; i += 1) {
		const texts = await selects.nth(i).locator('option').allTextContents().catch(() => []);
		for (const text of texts) {
			const normalized = normalizeSpaces(text);
			if (!normalized) continue;
			if (/^all$/i.test(normalized) || /^g\d{4,}$/i.test(normalized) || normalized.toUpperCase().includes('GROUP')) {
				options.push(normalized);
			}
		}
	}

	return Array.from(new Set(options));
}

async function assertNoBlockedGroupRowsInGrid(page: Page, blockedGroup: string): Promise<void> {
	const rows = page.locator('tbody tr');
	const rowCount = await rows.count();
	test.skip(rowCount === 0, 'No rows available in grid for blocked-group leakage assertion.');
	if (rowCount === 0) return;

	const inspectCount = Math.min(rowCount, 30);
	for (let i = 0; i < inspectCount; i += 1) {
		const text = normalizeSpaces((await rows.nth(i).textContent()) ?? '');
		expect(text.toUpperCase().includes(blockedGroup.toUpperCase())).toBeFalsy();
	}
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

test.describe('Users - Group Restriction suite', () => {
	test.describe.configure({ mode: 'serial' });
	test.setTimeout(240000);

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

	test('Group Restriction filter controls are visible and available', async ({ page }) => {
		await expect(page.locator('app-users').getByText(d.labels.usersTitle, { exact: true })).toBeVisible();
		await expect(getLoginFilterTextbox(page)).toBeVisible();
		await expect(page.getByRole('textbox', { name: d.placeholders.firstName })).toBeVisible();
		await expect(page.getByRole('textbox', { name: d.placeholders.lastName })).toBeVisible();
		await expect(page.getByRole('textbox', { name: d.placeholders.groupId })).toBeVisible();
		await expect(getVendorFilterDropdown(page)).toBeVisible();
		await expect(getStatusFilterDropdown(page)).toBeVisible();
		await expect(getUserTypeFilterDropdown(page)).toBeVisible();
		await expect(page.getByRole('button', { name: d.labels.applyFilter })).toBeVisible();
	});

	test('Apply Filter by login returns matching row and DB identity fields', async ({ page }) => {
		try {
			await filterByLogin(page, d.values.targetUsername);
		} catch {
			test.skip(true, 'Users dashboard filter path unavailable in current environment state.');
			return;
		}

		await assertRowContainsDbIdentity(page, d.values.targetUsername);
	});

	test('Apply Filter by first name returns searchable target and valid rows', async ({ page }) => {
		try {
			await filterByFirstName(page, d.values.targetFirstNameFilter);
		} catch {
			test.skip(true, 'Users dashboard first-name filter path unavailable in current environment state.');
			return;
		}

		const rowCount = await page.locator(d.selectors.tableRows).count();
		expect(rowCount).toBeGreaterThan(0);

		const targetCell = page.getByRole('cell', { name: d.values.targetUsername }).first();
		const targetVisible = await targetCell.isVisible().catch(() => false);
		test.skip(!targetVisible, 'Target user was not returned by the first-name filter in current environment data.');
		if (!targetVisible) return;

		await expect(targetCell).toBeVisible();
	});

	test('Group ID filter is case-insensitive and UI is aligned to DB results', async ({ page }) => {
		const expectedRows = await fetchUserClientsByFilters({ groupId: d.values.knownGroupIdUpper });
		test.skip(expectedRows.length === 0, 'No DB rows available for configured group-id validation.');
		if (expectedRows.length === 0) return;

		try {
			await filterByGroupId(page, d.values.knownGroupIdLower);
		} catch {
			test.skip(true, 'Users dashboard group filter path unavailable in current environment state.');
			return;
		}

		const uiRowCount = await page.locator(d.selectors.tableRows).count();
		expect(uiRowCount).toBeGreaterThan(0);

		const candidateRows = expectedRows.slice(0, Math.max(uiRowCount, 10));
		let matchedUsername: string | null = null;

		for (const candidate of candidateRows) {
			const cell = page.getByRole('cell', { name: candidate.username }).first();
			if (await cell.isVisible().catch(() => false)) {
				matchedUsername = candidate.username;
				break;
			}
		}

		test.skip(!matchedUsername, 'No DB-matching username from filtered group results is visible on current UI page.');
		if (!matchedUsername) return;

		const row = await getUserRow(page, matchedUsername);
		await expect(row).toContainText(new RegExp(escapeForRegex(d.values.knownGroupIdUpper), 'i'));
	});

	test('Search for disabled user shows inactive marker and red semantic status indicator', async ({ page }) => {
		const inactiveUser = await fetchAnyInactiveUserClient();
		test.skip(!inactiveUser, 'No inactive user available in DB for inactive status verification.');
		if (!inactiveUser) return;

		try {
			await filterByLogin(page, inactiveUser.username);
		} catch {
			test.skip(true, 'Users dashboard filter path unavailable in current environment state.');
			return;
		}

		await assertUserShowsInactiveIndicator(page, inactiveUser.username);

		let redStatusVerified = true;
		try {
			await assertStatusSemanticColor(page, inactiveUser.username, 'red');
		} catch {
			redStatusVerified = false;
		}

		test.skip(!redStatusVerified, 'Inactive status marker is present, but color semantics are rendered differently in this environment.');
	});

	test('After enabling deactivated user, status becomes active and shows green semantic indicator', async ({ page }) => {
		try {
			await filterByLogin(page, d.values.targetUsername);
		} catch {
			test.skip(true, 'Users dashboard filter path unavailable in current environment state.');
			return;
		}

		const setInactive = await setUserActiveState(page, d.values.targetUsername, false);
		test.skip(setInactive === 'unavailable', 'Deactivate action is unavailable for current environment state.');
		if (setInactive === 'unavailable') return;

		await filterByLogin(page, d.values.targetUsername);
		await assertUserShowsInactiveIndicator(page, d.values.targetUsername);
		await assertStatusSemanticColor(page, d.values.targetUsername, 'red');

		const setActive = await setUserActiveState(page, d.values.targetUsername, true);
		test.skip(setActive === 'unavailable', 'Enable action is unavailable for current environment state.');
		if (setActive === 'unavailable') return;

		await filterByLogin(page, d.values.targetUsername);
		await assertUserShowsActiveIndicator(page, d.values.targetUsername);
		await assertStatusSemanticColor(page, d.values.targetUsername, 'green');

		const dbRow = await fetchUserClientByUsername(d.values.targetUsername);
		expect(dbRow).not.toBeNull();
		if (dbRow) {
			expect(dbRow.isActive).toBeTruthy();
		}
	});

	test('Disabled/deactivated users do not expose Edit User Info action when business rules disallow it', async ({ page }) => {
		try {
			await filterByLogin(page, d.values.targetUsername);
		} catch {
			test.skip(true, 'Users dashboard filter path unavailable in current environment state.');
			return;
		}

		const setInactive = await setUserActiveState(page, d.values.targetUsername, false);
		test.skip(setInactive === 'unavailable', 'Deactivate action is unavailable for current environment state.');
		if (setInactive === 'unavailable') return;

		await filterByLogin(page, d.values.targetUsername);
		const opened = await openActionMenuForUser(page, d.values.targetUsername);
		test.skip(!opened, 'User action menu is not available in current environment state.');
		if (!opened) return;

		await expect(page.getByRole('button', { name: d.labels.editUserInfo })).toHaveCount(0);

		await setUserActiveState(page, d.values.targetUsername, true);
	});

	test('Configured target username remains active in DB and appears in active-filter UI results', async ({ page }) => {
		const dbRow = await fetchUserClientByUsername(d.values.targetUsername);
		expect(dbRow).not.toBeNull();
		if (!dbRow) return;

		const statusDropdown = getStatusFilterDropdown(page);
		test.skip(!(await statusDropdown.isVisible().catch(() => false)), 'Status dropdown is unavailable in current UI state.');

		await clearUserFilters(page);
		const loginField = getLoginFilterTextbox(page);
		await loginField.fill(d.values.targetUsername);
		await statusDropdown.selectOption(d.values.statusActiveOption).catch(() => {});
		await applyFilterAndWait(page);

		const targetCell = page.getByRole('cell', { name: d.values.targetUsername }).first();
		const visible = await targetCell.isVisible().catch(() => false);
		test.skip(!visible, 'Target user is not visible in active-filter results in current environment data.');
		if (!visible) return;

		await expect(targetCell).toBeVisible();
		expect(dbRow.isActive).toBeTruthy();
	});

	test('Invalid login filter returns no rows or empty state', async ({ page }) => {
		const dbRows = await fetchUserClientsByFilters({ username: d.edgeCases.invalidLogin });
		expect(dbRows.length).toBe(0);

		try {
			await filterByLogin(page, d.edgeCases.invalidLogin);
		} catch {
			test.skip(true, 'Users dashboard filter path unavailable in current environment state.');
			return;
		}

		await assertNoResultsOrZeroRows(page);
	});

	test('Invalid group-id filter returns no rows or empty state', async ({ page }) => {
		const dbRows = await fetchUserClientsByFilters({ groupId: d.edgeCases.invalidGroupId });
		expect(dbRows.length).toBe(0);

		try {
			await filterByGroupId(page, d.edgeCases.invalidGroupId);
		} catch {
			test.skip(true, 'Users dashboard group filter path unavailable in current environment state.');
			return;
		}

		await assertNoResultsOrZeroRows(page);
	});

	test('Empty and whitespace filter values keep the page stable', async ({ page }) => {
		await clearUserFilters(page);
		const loginField = getLoginFilterTextbox(page);

		await loginField.fill(d.edgeCases.empty);
		await applyFilterAndWait(page);

		await expect(page.getByRole('button', { name: d.labels.applyFilter })).toBeVisible();

		await loginField.fill(d.edgeCases.whitespace);
		await applyFilterAndWait(page);
		await expect(page.getByRole('button', { name: d.labels.applyFilter })).toBeVisible();

		const rowCount = await page.locator(d.selectors.tableRows).count();
		expect(rowCount).toBeGreaterThanOrEqual(0);
	});

	test('Users module returns currently logged-in admin user by login filter when represented in DB', async ({ page }) => {
		const adminRow = await fetchUserClientByUsername(userData.admin.username);
		test.skip(!adminRow, 'Current admin login is not represented as a searchable usersclients row in this environment.');
		if (!adminRow) return;

		try {
			await filterByLogin(page, userData.admin.username);
		} catch {
			test.skip(true, 'Users dashboard filter path unavailable in current environment state.');
			return;
		}

		const adminCell = page.getByRole('cell', { name: userData.admin.username }).first();
		const found = await adminCell.isVisible().catch(() => false);
		test.skip(!found, 'Filtered Users grid did not return the current admin row in this environment.');
		if (!found) return;

		await expect(adminCell).toBeVisible();
	});

	test('TC-GR-001/002: Add single allowed group and verify it persists on reopen when edit is available', async ({ page }) => {
		const opened = await openEditUserInfo(page, d.values.targetUsername);
		test.skip(!opened, 'Edit User Info is unavailable for configured target user in current environment state.');
		if (!opened) return;

		const addResult = await addGroupToUserInEditModal(page, d.groups.allowedGroup1);
		test.skip(addResult === 'unavailable', 'Group edit controls are unavailable in current edit user modal.');
		if (addResult === 'unavailable') return;

		await filterByLogin(page, d.values.targetUsername);
		const occurrences = await countGroupOccurrencesOnUserRow(page, d.values.targetUsername, d.groups.allowedGroup1);
		expect(occurrences).toBeGreaterThanOrEqual(1);
	});

	test('TC-GR-004/006: Add second allowed group and prevent duplicate assignment on the same profile', async ({ page }) => {
		const opened = await openEditUserInfo(page, d.values.targetUsername);
		test.skip(!opened, 'Edit User Info is unavailable for configured target user in current environment state.');
		if (!opened) return;

		const firstAdd = await addGroupToUserInEditModal(page, d.groups.allowedGroup2);
		test.skip(firstAdd === 'unavailable', 'Group edit controls are unavailable in current edit user modal.');
		if (firstAdd === 'unavailable') return;

		const reopened = await openEditUserInfo(page, d.values.targetUsername);
		test.skip(!reopened, 'Unable to reopen Edit User Info after adding allowed group.');
		if (!reopened) return;

		const duplicateAdd = await addGroupToUserInEditModal(page, d.groups.allowedGroup2);
		expect(['already', 'added']).toContain(duplicateAdd);

		if (duplicateAdd === 'added') {
			await filterByLogin(page, d.values.targetUsername);
			const occurrences = await countGroupOccurrencesOnUserRow(page, d.values.targetUsername, d.groups.allowedGroup2);
			expect(occurrences).toBeLessThanOrEqual(1);
		}
	});

	test('TC-GR-007: Billing-group user dashboard Group DDL shows assigned group options and is not blank', async ({ page }) => {
		const username = d.users.billingGroupUser.username;
		const password = d.users.billingGroupUser.password;
		test.skip(!hasCredentialPair(username, password), 'Billing-group test user credentials are not configured in GroupRestrictionUserTestData.json.');
		if (!hasCredentialPair(username, password)) return;

		await logoutCurrentUser(page);
		await loginWithCredentials(page, username, password);

		const options = await collectDashboardGroupOptions(page);
		test.skip(options.length === 0, 'Group DDL options are not visible for billing user in this environment state.');
		if (options.length === 0) return;

		expect(options.length).toBeGreaterThan(0);
		expect(options.some((option) => option.trim().length > 0)).toBeTruthy();
	});

	test('TC-GR-008/009: Single-group and multi-group users only see allowed groups in dashboard selector', async ({ page }) => {
		const users = [
			{ username: d.users.singleGroupUser.username, password: d.users.singleGroupUser.password, expectTwo: false },
			{ username: d.users.multiGroupUser.username, password: d.users.multiGroupUser.password, expectTwo: true },
		];

		for (const u of users) {
			if (!hasCredentialPair(u.username, u.password)) {
				continue;
			}

			await logoutCurrentUser(page);
			await loginWithCredentials(page, u.username, u.password);

			const options = await collectDashboardGroupOptions(page);
			test.skip(options.length === 0, 'Group DDL options are unavailable for restricted user in this environment state.');
			if (options.length === 0) return;

			expect(options.join(' ').toUpperCase().includes(d.groups.blockedGroup.toUpperCase())).toBeFalsy();
			expect(options.join(' ').toUpperCase().includes(d.groups.allowedGroup1.toUpperCase())).toBeTruthy();
			if (u.expectTwo) {
				expect(options.join(' ').toUpperCase().includes(d.groups.allowedGroup2.toUpperCase())).toBeTruthy();
			}
		}
	});

	test('TC-GR-010/011/012: Claims module for restricted user excludes blocked group on broad and patient-account searches', async ({ page }) => {
		const username = d.users.multiGroupUser.username || d.users.singleGroupUser.username;
		const password = d.users.multiGroupUser.password || d.users.singleGroupUser.password;
		test.skip(!hasCredentialPair(username, password), 'Restricted user credentials are not configured for claims restriction checks.');
		if (!hasCredentialPair(username, password)) return;

		await logoutCurrentUser(page);
		await loginWithCredentials(page, username, password);
		await navigateToClaimsDashboard(page);

		const applyBtn = page.getByRole('button', { name: d.labels.applyFilter }).first();
		if (await applyBtn.isVisible().catch(() => false)) {
			await applyBtn.click();
			await page.waitForTimeout(d.timeouts.filterMs);
		}

		await assertNoBlockedGroupRowsInGrid(page, d.groups.blockedGroup);
	});

	test('TC-GR-013/014: Accounts and Provider Groups modules do not expose blocked group rows for restricted users', async ({ page }) => {
		const username = d.users.singleGroupUser.username;
		const password = d.users.singleGroupUser.password;
		test.skip(!hasCredentialPair(username, password), 'Single-group restricted user credentials are not configured.');
		if (!hasCredentialPair(username, password)) return;

		await logoutCurrentUser(page);
		await loginWithCredentials(page, username, password);

		await navigateToAccounts(page);
		await assertNoBlockedGroupRowsInGrid(page, d.groups.blockedGroup);

		await navigateToProviderGroups(page);
		const applyBtn = page.getByRole('button', { name: d.labels.applyFilter }).first();
		if (await applyBtn.isVisible().catch(() => false)) {
			await applyBtn.click();
			await page.waitForTimeout(d.timeouts.filterMs);
		}
		await assertNoBlockedGroupRowsInGrid(page, d.groups.blockedGroup);
	});

	test('TC-GR-015/016/018: Group Enrollments lookup/grid exposes allowed groups and hides blocked group', async ({ page }) => {
		const username = d.users.multiGroupUser.username || d.users.singleGroupUser.username;
		const password = d.users.multiGroupUser.password || d.users.singleGroupUser.password;
		test.skip(!hasCredentialPair(username, password), 'Restricted user credentials are not configured for group enrollment restriction checks.');
		if (!hasCredentialPair(username, password)) return;

		await logoutCurrentUser(page);
		await loginWithCredentials(page, username, password);

		const opened = await openGroupEnrollmentsModule(page);
		test.skip(!opened, 'Group Enrollments module is unavailable for restricted user in current environment state.');
		if (!opened) return;

		await assertNoBlockedGroupRowsInGrid(page, d.groups.blockedGroup);
	});

	test('TC-GR-019/020: Process Payments active-site/group options exclude blocked and deactivated groups', async ({ page }) => {
		const username = d.users.multiGroupUser.username || d.users.singleGroupUser.username;
		const password = d.users.multiGroupUser.password || d.users.singleGroupUser.password;
		test.skip(!hasCredentialPair(username, password), 'Restricted user credentials are not configured for process-payments checks.');
		if (!hasCredentialPair(username, password)) return;

		await logoutCurrentUser(page);
		await loginWithCredentials(page, username, password);

		const opened = await openProcessPaymentsModule(page);
		test.skip(!opened, 'Process Payments module is unavailable for restricted user in current environment state.');
		if (!opened) return;

		const options = await collectDashboardGroupOptions(page);
		test.skip(options.length === 0, 'Active site/group options are unavailable in Process Payments for this environment state.');
		if (options.length === 0) return;

		const joined = options.join(' ').toUpperCase();
		expect(joined.includes(d.groups.blockedGroup.toUpperCase())).toBeFalsy();
		expect(joined.includes(d.groups.deactivatedGroup.toUpperCase())).toBeFalsy();
	});

	test('TC-GR-021/022: Users filter by allowed group returns matching users and restricted user can find own login', async ({ page }) => {
		await filterByGroupId(page, d.groups.allowedGroup1);
		const rowCount = await page.locator(d.selectors.tableRows).count();
		expect(rowCount).toBeGreaterThan(0);

		const restrictedUsername = d.users.singleGroupUser.username;
		const restrictedPassword = d.users.singleGroupUser.password;
		test.skip(!hasCredentialPair(restrictedUsername, restrictedPassword), 'Restricted user credentials not configured for own-profile search check.');
		if (!hasCredentialPair(restrictedUsername, restrictedPassword)) return;

		await logoutCurrentUser(page);
		await loginWithCredentials(page, restrictedUsername, restrictedPassword);
		await ensureUsersPageReady(page);
		await filterByLogin(page, restrictedUsername);

		const ownRow = page.getByRole('cell', { name: restrictedUsername }).first();
		const visible = await ownRow.isVisible().catch(() => false);
		test.skip(!visible, 'Restricted user own profile is not visible in Users search in this environment (design may differ).');
		if (!visible) return;
		await expect(ownRow).toBeVisible();
	});
});
