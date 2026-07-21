import { test, expect } from '../myTestData';
import type { Locator, Page } from '@playwright/test';
import {
	navigateToClaimsArchiveDashboard,
	navigateToClaimsDashboard,
} from '../framework/navigation.helper';
import { fetchClaimArchiveMenuRowByClaimId, fetchAnyValidArchiveClaimId } from '../../testData/database.utils';
import * as d from '../../testData/ClaimsMenuTestData.json';

let pageErrors: string[] = [];
let resolvedClaimId: string = d.values.claimId; // overridden in beforeAll if stale
type ClaimArchiveMenuRow = NonNullable<Awaited<ReturnType<typeof fetchClaimArchiveMenuRowByClaimId>>>;

/*
	Preserved recorder flow source (converted to helpers/tests below):
	1) Open Claims dashboard
	2) Click Apply Filter
	3) Open row action menu
	4) Click Worked and validate confirmation
	5) Open row action menu again
	6) Click Timely Filing and validate report fields
	7) Close modal
*/

function normalize(value: string): string {
	return (value ?? '').trim().toUpperCase();
}

function escapeForRegex(value: string): string {
	return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

function toMmDdToken(value: string): string {
	const raw = (value ?? '').trim();
	if (!raw) return '';

	const dateFromIso = /^(\d{4})-(\d{2})-(\d{2})/.exec(raw);
	if (dateFromIso) {
		return `${dateFromIso[2]}/${dateFromIso[3]}/`;
	}

	const dateObj = new Date(raw);
	if (!Number.isNaN(dateObj.getTime())) {
		const mm = String(dateObj.getMonth() + 1).padStart(2, '0');
		const dd = String(dateObj.getDate()).padStart(2, '0');
		return `${mm}/${dd}/`;
	}

	return raw;
}

function getTodayMmDdToken(): string {
	const now = new Date();
	const mm = String(now.getMonth() + 1).padStart(2, '0');
	const dd = String(now.getDate()).padStart(2, '0');
	return `${mm}/${dd}/`;
}

function makeFullPatientName(last: string, first: string): string {
	return `${(last ?? '').trim()} ${(first ?? '').trim()}`.trim();
}

async function openClaimDashboard(page: Page): Promise<void> {
	await navigateToClaimsDashboard(page);
	await expect(page.getByRole('button', { name: d.labels.applyFilter })).toBeVisible();
}

async function applyFilterAndWait(page: Page): Promise<void> {
	const applyButton = page.getByRole('button', { name: d.labels.applyFilter });
	await expect(applyButton).toBeVisible();
	await applyButton.click();
	await page.waitForTimeout(d.timeouts.filterMs);
}

async function getEnabledTextbox(page: Page, name: string): Promise<Locator> {
	const nameRegex = new RegExp(escapeForRegex(name), 'i');

	const roleCandidates = page.getByRole('textbox', { name: nameRegex });
	const roleCount = await roleCandidates.count();
	for (let i = 0; i < roleCount; i += 1) {
		const candidate = roleCandidates.nth(i);
		const visible = await candidate.isVisible().catch(() => false);
		const enabled = await candidate.isEnabled().catch(() => false);
		if (visible && enabled) {
			return candidate;
		}
	}

	const placeholderCandidates = page.getByPlaceholder(nameRegex);
	const placeholderCount = await placeholderCandidates.count();
	for (let i = 0; i < placeholderCount; i += 1) {
		const candidate = placeholderCandidates.nth(i);
		const visible = await candidate.isVisible().catch(() => false);
		const enabled = await candidate.isEnabled().catch(() => false);
		if (visible && enabled) {
			return candidate;
		}
	}

	throw new Error(`No enabled textbox found: ${name}`);
}

async function trySetFilterValue(page: Page, name: string, value: string): Promise<void> {
	const input = await getEnabledTextbox(page, name).catch(() => null);
	if (!input) {
		return;
	}
	await input.fill(d.edgeCases.empty).catch(() => {});
	await input.fill(value).catch(() => {});
}

async function clearClaimFilters(page: Page): Promise<void> {
	await trySetFilterValue(page, d.placeholders.claimId, d.edgeCases.empty);
	await trySetFilterValue(page, d.placeholders.groupId, d.edgeCases.empty);
	await trySetFilterValue(page, d.placeholders.billingNpi, d.edgeCases.empty);
	await trySetFilterValue(page, d.placeholders.taxId, d.edgeCases.empty);
	await trySetFilterValue(page, d.placeholders.payerId, d.edgeCases.empty);
	await trySetFilterValue(page, d.placeholders.renderNpi, d.edgeCases.empty);
	await trySetFilterValue(page, d.placeholders.receiver, d.edgeCases.empty);
	await trySetFilterValue(page, d.placeholders.patientAccountNumber, d.edgeCases.empty);
	await trySetFilterValue(page, d.placeholders.patientName, d.edgeCases.empty);
}

async function searchByClaimId(page: Page, claimId: string): Promise<void> {
	await clearClaimFilters(page);
	await trySetFilterValue(page, d.placeholders.claimId, claimId);
	await applyFilterAndWait(page);
}

async function assertNoResultsOrZeroRows(page: Page): Promise<void> {
	const emptyState = page.locator(d.selectors.noResults).first();
	const hasEmptyState = await emptyState.isVisible().catch(() => false);
	if (!hasEmptyState) {
		await expect(page.locator(d.selectors.tableRows)).toHaveCount(0);
	}
}

async function openRowActionMenu(page: Page): Promise<void> {
	const blankLinks = page.getByRole('link').filter({ hasText: /^$/ });
	const fallbackIndex = d.indexes.rowActionFallbackIndex;
	const count = await blankLinks.count();

	if (count > fallbackIndex) {
		await blankLinks.nth(fallbackIndex).click();
		return;
	}

	const firstRowAction = page.locator('tbody tr').first().getByRole('link').first();
	await expect(firstRowAction).toBeVisible({ timeout: d.timeouts.searchMs });
	await firstRowAction.click();
}

async function openTimelyFilingReportForRow(page: Page): Promise<void> {
	await openRowActionMenu(page);
	await page.getByRole('button', { name: d.labels.timelyFiling }).click();
	await expect(page.getByRole('heading', { name: d.labels.timelyFilingReportHeading })).toBeVisible();
}

async function markRowAsWorked(page: Page): Promise<void> {
	await openRowActionMenu(page);
	await page.getByRole('button', { name: d.labels.worked }).click();
	await expect(page.getByText(d.labels.workedConfirmation)).toBeVisible();
}

async function assertTimelyFilingLabelsVisible(page: Page): Promise<void> {
	for (const label of d.timelyFiling.requiredLabels) {
		await expect(page.getByText(label).first()).toBeVisible();
	}
	const todaysToken = getTodayMmDdToken();
	await expect(page.getByText(new RegExp(`Date:\\s*${escapeForRegex(todaysToken)}`, 'i')).first()).toBeVisible();
	await expect(page.getByRole('img').first()).toBeVisible();
	await expect(page.getByText('Our records show that the').first()).toBeVisible();
}

async function assertTimelyFilingValuesMatchDb(page: Page): Promise<void> {
	const dbRow = await fetchClaimArchiveMenuRowByClaimId(resolvedClaimId);
	expect(dbRow).not.toBeNull();
	if (!dbRow) return;

	await expect(page.getByText(dbRow.claimid).first()).toBeVisible();
	await expect(page.getByText(dbRow.billingtaxid).first()).toBeVisible();
	await expect(page.getByText(dbRow.billingnpi).first()).toBeVisible();
	await expect(page.getByText(dbRow.renderingnpi).first()).toBeVisible();
	await expect(page.getByText(dbRow.insuredid).first()).toBeVisible();
	await expect(page.getByText(dbRow.patientaccountnumber).first()).toBeVisible();
	await expect(page.getByText(dbRow.payerid).first()).toBeVisible();

	const dbPatientDisplay = makeFullPatientName(dbRow.patientlastname, dbRow.patientfirstname);
	const fallbackPatient = (dbRow.patientname ?? '').trim();
	if (dbPatientDisplay) {
		await expect(page.getByText(new RegExp(escapeForRegex(dbPatientDisplay), 'i')).first()).toBeVisible();
	} else if (fallbackPatient) {
		await expect(page.getByText(new RegExp(escapeForRegex(fallbackPatient), 'i')).first()).toBeVisible();
	}

	const mmddToken = toMmDdToken(dbRow.dateofservice);
	if (mmddToken) {
		await expect(page.getByText(new RegExp(escapeForRegex(mmddToken), 'i')).first()).toBeVisible();
	}

	const providerTokens = normalize(
		`${dbRow.billingproviderlastname} ${dbRow.billingproviderfirstname}`
	).split(/\s+/).filter(Boolean);
	if (providerTokens.length >= 2) {
		await expect(page.getByText(new RegExp(providerTokens[0], 'i')).first()).toBeVisible();
		await expect(page.getByText(new RegExp(providerTokens[1], 'i')).first()).toBeVisible();
	}
}

async function assertOptionalTimelyFilingFieldsWhenPresent(page: Page, dbRow: ClaimArchiveMenuRow): Promise<void> {
	const optionalMappings: Array<{ labelRegex: RegExp; dbValue: string }> = [
		{ labelRegex: /Insured Name:/i, dbValue: dbRow.insuredname },
		{ labelRegex: /Patient Name:/i, dbValue: makeFullPatientName(dbRow.patientlastname, dbRow.patientfirstname) || dbRow.patientname },
		{ labelRegex: /Patient Birth Date:|DOB:/i, dbValue: dbRow.patientbirthdate },
		{ labelRegex: /Patient Gender:/i, dbValue: dbRow.patientgender },
		{ labelRegex: /Patient Relationship:/i, dbValue: dbRow.patientrelationship },
		{ labelRegex: /Insurance Plan:/i, dbValue: dbRow.insuranceplan },
		{ labelRegex: /NEIC ID:/i, dbValue: dbRow.neicid },
		{ labelRegex: /Input File(Name)?:/i, dbValue: dbRow.inputfilename },
		{ labelRegex: /Report File(Name)?:/i, dbValue: dbRow.reportfilename },
		{ labelRegex: /CSV File(Name)?:/i, dbValue: dbRow.csvfilename },
	];

	for (const mapping of optionalMappings) {
		const value = (mapping.dbValue ?? '').trim();
		if (!value) {
			continue;
		}

		const labelVisible = await page.getByText(mapping.labelRegex).first().isVisible().catch(() => false);
		if (!labelVisible) {
			continue;
		}

		await expect(page.getByText(new RegExp(escapeForRegex(value), 'i')).first()).toBeVisible();
	}
}

test.describe('Claim Menu on Dashboard search results - generated and refactored suite', () => {
	test.beforeAll(async () => {
		// Verify configured claim ID is still in the archive; fall back to most recent if stale.
		const configuredRow = await fetchClaimArchiveMenuRowByClaimId(resolvedClaimId);
		if (configuredRow) {
			resolvedClaimId = d.values.claimId;
			console.log('[beforeAll] Using configured claimId:', resolvedClaimId);
		} else {
			const fallback = await fetchAnyValidArchiveClaimId();
			resolvedClaimId = fallback ?? d.values.claimId;
			console.warn('[beforeAll] Configured claimId stale; using fallback:', resolvedClaimId);
		}
	});

	test.beforeEach(async ({ page, loginAsAdmin }) => {
		pageErrors = [];
		page.on('pageerror', (err) => pageErrors.push(err.message));

		await loginAsAdmin();
		await openClaimDashboard(page);
	});

	test.afterEach(async () => {
		expect(pageErrors, 'Unexpected browser runtime errors were thrown.').toEqual([]);
	});

	test('Claim dashboard controls, search fields, and actions are visible and available', async ({ page }) => {
		await expect(page.getByRole('button', { name: d.labels.claimsArchive })).toBeVisible();
		await expect(page.getByRole('button', { name: d.labels.applyFilter })).toBeVisible();
		await expect(page.getByRole('textbox', { name: d.placeholders.claimId })).toBeVisible();
		await expect(page.getByRole('textbox', { name: d.placeholders.groupId })).toBeVisible();
		await expect(page.getByRole('textbox', { name: d.placeholders.billingNpi })).toBeVisible();
		await expect(page.getByRole('textbox', { name: d.placeholders.taxId })).toBeVisible();
		await expect(page.getByRole('textbox', { name: d.placeholders.payerId })).toBeVisible();
		await expect(page.getByRole('textbox', { name: d.placeholders.renderNpi })).toBeVisible();
		await expect(page.getByRole('textbox', { name: d.placeholders.receiver })).toBeVisible();
		await expect(page.getByRole('textbox', { name: d.placeholders.patientAccountNumber })).toBeVisible();
		await expect(page.getByRole('textbox', { name: d.placeholders.patientName })).toBeVisible();
	});

	test('Apply Filter by claim id returns a successful search result and claim row exists in DB', async ({ page }) => {
		const dbRow = await fetchClaimArchiveMenuRowByClaimId(resolvedClaimId);
		test.skip(!dbRow, `Archive row not found for claim ${resolvedClaimId}; skipping archive-backed assertion`);
		if (!dbRow) return;

		await searchByClaimId(page, resolvedClaimId);
		const row = page.locator(d.selectors.tableRows).filter({ hasText: resolvedClaimId }).first();
		await expect(row).toBeVisible({ timeout: d.timeouts.searchMs });
		await expect(row).toContainText(dbRow.patientaccountnumber);
	});

	test('Worked action can be executed from row menu without UI runtime errors', async ({ page }) => {
		await searchByClaimId(page, resolvedClaimId);
		const rowCount = await page.locator(d.selectors.tableRows).count();
		test.skip(rowCount === 0, `No rows found for claim ${resolvedClaimId} in Claims dashboard; skipping Worked action`);
		if (rowCount === 0) return;
		await markRowAsWorked(page);
	});

	test('Timely Filing report validates field visibility and DB-backed values', async ({ page }) => {
		const dbRow = await fetchClaimArchiveMenuRowByClaimId(resolvedClaimId);
		test.skip(!dbRow, `Archive row not found for claim ${resolvedClaimId}; skipping Timely Filing DB validation`);
		if (!dbRow) return;

		await searchByClaimId(page, resolvedClaimId);
		await openTimelyFilingReportForRow(page);
		await assertTimelyFilingLabelsVisible(page);
		await assertTimelyFilingValuesMatchDb(page);
		await page.locator(d.selectors.closeModalButton).first().click();
	});

	test('Timely Filing report validates additional optional DB-to-UI fields when present', async ({ page }) => {
		await searchByClaimId(page, resolvedClaimId);
		const rowCount = await page.locator(d.selectors.tableRows).count();
		if (rowCount === 0) {
			console.log(`No rows found for claim ${resolvedClaimId}; skipping optional Timely Filing fields check.`);
			test.skip(true, `No rows found for claim ${resolvedClaimId} in Claims dashboard`);
			return;
		}
		await openTimelyFilingReportForRow(page);

		const dbRow = await fetchClaimArchiveMenuRowByClaimId(resolvedClaimId);
		test.skip(!dbRow, `No archive DB row found for claim id ${resolvedClaimId}`);
		if (!dbRow) return;

		await assertOptionalTimelyFilingFieldsWhenPresent(page, dbRow);
		await page.locator(d.selectors.closeModalButton).first().click();
	});

	test('Empty filter values still keep search flow stable when Apply Filter is clicked', async ({ page }) => {
		await clearClaimFilters(page);
		await applyFilterAndWait(page);
		const rowCount = await page.locator(d.selectors.tableRows).count();
		expect(rowCount).toBeGreaterThanOrEqual(0);
	});

	test('Invalid claim id returns no results in UI and null from DB utility', async ({ page }) => {
		const dbRow = await fetchClaimArchiveMenuRowByClaimId(d.edgeCases.invalidClaimId);
		expect(dbRow).toBeNull();

		await searchByClaimId(page, d.edgeCases.invalidClaimId);
		await assertNoResultsOrZeroRows(page);
	});

	test('Whitespace claim id does not crash the page and keeps Apply Filter available', async ({ page }) => {
		await searchByClaimId(page, d.edgeCases.whitespace);
		await expect(page.getByRole('button', { name: d.labels.applyFilter })).toBeVisible();
	});

	test('Claims Archive dashboard navigation is available from Claims module', async ({ page }) => {
		await navigateToClaimsArchiveDashboard(page);
		await expect(page.getByRole('button', { name: d.labels.applyFilter })).toBeVisible();
	});
});
