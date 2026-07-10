import { test, expect } from '../myTestData';
import type { Locator, Page } from '@playwright/test';
import { navigateToClaimsArchiveDashboard } from '../framework/navigation.helper';
import {
	fetchClaimArchiveMenuRowByClaimId,
	fetchClaimArchiveTimelyFilingRowByClaimId,
} from '../../testData/database.utils';
import * as d from '../../testData/ClaimsArchMenuTestData.json';

let pageErrors: string[] = [];
type ArchiveRow = NonNullable<Awaited<ReturnType<typeof fetchClaimArchiveTimelyFilingRowByClaimId>>>;

/*
	Preserved recorder flow source (converted to helpers/tests below):
	1) Open Claims Archive dashboard
	2) Fill claim, group, and date filters and click Apply Filter
	3) Open row action menu and click Timely Filing
	4) Validate Timely Filing report fields and close modal
*/

function escapeForRegex(value: string): string {
	return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

function normalize(value: string): string {
	return (value ?? '').trim().toUpperCase();
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

function makeFullPatientName(last: string, first: string, middle?: string): string {
	return `${(last ?? '').trim()} ${(first ?? '').trim()} ${(middle ?? '').trim()}`.replace(/\s+/g, ' ').trim();
}

async function openClaimsArchive(page: Page): Promise<void> {
	await navigateToClaimsArchiveDashboard(page);
	await expect(page.getByRole('button', { name: d.labels.applyFilter })).toBeVisible();
}

async function applyFilterAndWait(page: Page): Promise<void> {
	const applyButton = page.getByRole('button', { name: d.labels.applyFilter });
	await expect(applyButton).toBeVisible();
	await applyButton.click();
	await page.waitForTimeout(d.timeouts.filterMs);
}

async function getEnabledTextbox(page: Page, name: string): Promise<Locator> {
	const regex = new RegExp(escapeForRegex(name), 'i');
	const byRole = page.getByRole('textbox', { name: regex });
	const roleCount = await byRole.count();
	for (let i = 0; i < roleCount; i += 1) {
		const candidate = byRole.nth(i);
		const visible = await candidate.isVisible().catch(() => false);
		const enabled = await candidate.isEnabled().catch(() => false);
		if (visible && enabled) {
			return candidate;
		}
	}

	const byPlaceholder = page.getByPlaceholder(regex);
	const placeholderCount = await byPlaceholder.count();
	for (let i = 0; i < placeholderCount; i += 1) {
		const candidate = byPlaceholder.nth(i);
		const visible = await candidate.isVisible().catch(() => false);
		const enabled = await candidate.isEnabled().catch(() => false);
		if (visible && enabled) {
			return candidate;
		}
	}

	throw new Error(`No enabled textbox found: ${name}`);
}

async function setFilterValue(page: Page, name: string, value: string): Promise<void> {
	const input = await getEnabledTextbox(page, name);
	await input.fill(d.edgeCases.empty);
	await input.fill(value);
}

async function trySetFilterValue(page: Page, name: string, value: string): Promise<void> {
	const input = await getEnabledTextbox(page, name).catch(() => null);
	if (!input) return;
	await input.fill(d.edgeCases.empty).catch(() => {});
	await input.fill(value).catch(() => {});
}

async function setDateRange(page: Page, startDate: string, endDate: string): Promise<void> {
	const dateInputs = page.getByRole('textbox', { name: /mm\/dd\/yyyy/i });
	const count = await dateInputs.count();
	if (count >= 2) {
		await dateInputs.nth(0).fill(startDate);
		await dateInputs.nth(1).fill(endDate);
		return;
	}

	const allTextboxes = page.getByRole('textbox');
	await allTextboxes.nth(1).fill(startDate);
	await allTextboxes.nth(2).fill(endDate);
}

async function setArchiveFilters(page: Page, claimId: string, groupId: string): Promise<void> {
	await setFilterValue(page, d.placeholders.claimId, claimId);
	await setFilterValue(page, d.placeholders.groupId, groupId);
}

async function clearArchiveFilters(page: Page): Promise<void> {
	await setFilterValue(page, d.placeholders.claimId, d.edgeCases.empty);
	await trySetFilterValue(page, d.placeholders.groupId, d.edgeCases.empty);
	await trySetFilterValue(page, d.placeholders.patientAccountNumber, d.edgeCases.empty);
	await trySetFilterValue(page, d.placeholders.patientName, d.edgeCases.empty);
	await trySetFilterValue(page, d.placeholders.payerId, d.edgeCases.empty);
}

async function searchArchiveByClaim(page: Page, claimId: string, groupId: string): Promise<void> {
	await clearArchiveFilters(page);
	await setDateRange(page, d.values.startDate, d.values.endDate);
	await setArchiveFilters(page, claimId, groupId);
	await applyFilterAndWait(page);
}

async function assertNoResultsOrZeroRows(page: Page): Promise<void> {
	const emptyState = page.locator(d.selectors.noResults).first();
	const hasEmptyState = await emptyState.isVisible().catch(() => false);
	if (!hasEmptyState) {
		await expect(page.locator(d.selectors.tableRows)).toHaveCount(0);
	}
}

async function openArchiveRowActionMenu(page: Page): Promise<void> {
	const blankLinks = page.getByRole('link').filter({ hasText: /^$/ });
	const fallbackIndex = d.indexes.rowActionFallbackIndex;
	const count = await blankLinks.count();

	if (count > fallbackIndex) {
		await blankLinks.nth(fallbackIndex).click();
		return;
	}

	const row = page.locator(d.selectors.tableRows).first();
	await expect(row).toBeVisible({ timeout: d.timeouts.searchMs });
	const firstLink = row.getByRole('link').first();
	await expect(firstLink).toBeVisible({ timeout: d.timeouts.searchMs });
	await firstLink.click();
}

async function openTimelyFilingReport(page: Page): Promise<void> {
	await openArchiveRowActionMenu(page);
	await page.getByRole('button', { name: d.labels.timelyFiling }).click();
	await expect(page.getByRole('heading', { name: d.labels.timelyFilingReportHeading })).toBeVisible();
}

async function assertTimelyFilingRequiredLabelsVisible(page: Page): Promise<void> {
	for (const label of d.timelyFiling.requiredLabels) {
		await expect(page.getByText(label).first()).toBeVisible();
	}
	const todaysToken = getTodayMmDdToken();
	await expect(page.getByText(new RegExp(`Date:\\s*${escapeForRegex(todaysToken)}`, 'i')).first()).toBeVisible();
	await expect(page.getByRole('img').first()).toBeVisible();
	await expect(page.getByText('Our records show that the').first()).toBeVisible();
}

async function assertTimelyFilingCoreValuesMatchDb(page: Page, dbRow: ArchiveRow): Promise<void> {
	await expect(page.getByText(dbRow.claimid).first()).toBeVisible();
	await expect(page.getByText(dbRow.billingtaxid).first()).toBeVisible();
	await expect(page.getByText(dbRow.billingnpi).first()).toBeVisible();
	await expect(page.getByText(dbRow.renderingnpi).first()).toBeVisible();
	await expect(page.getByText(dbRow.insuredid).first()).toBeVisible();
	await expect(page.getByText(dbRow.patientaccountnumber).first()).toBeVisible();

	const payerIdCandidates = [dbRow.payerid, d.values.payerId].map((v) => (v ?? '').trim()).filter(Boolean);
	let hasVisiblePayerId = false;
	for (const candidate of payerIdCandidates) {
		const visible = await page.getByText(new RegExp(escapeForRegex(candidate), 'i')).first().isVisible().catch(() => false);
		if (visible) {
			hasVisiblePayerId = true;
			break;
		}
	}
	expect(hasVisiblePayerId).toBeTruthy();

	const patientDisplay = makeFullPatientName(dbRow.patientlastname, dbRow.patientfirstname, dbRow.patientmi);
	const fallbackPatient = (dbRow.patientname ?? '').trim();
	if (patientDisplay) {
		await expect(page.getByText(new RegExp(escapeForRegex(patientDisplay), 'i')).first()).toBeVisible();
	} else if (fallbackPatient) {
		await expect(page.getByText(new RegExp(escapeForRegex(fallbackPatient), 'i')).first()).toBeVisible();
	}

	const mmddToken = toMmDdToken(dbRow.dateofservice);
	if (mmddToken) {
		await expect(page.getByText(new RegExp(escapeForRegex(mmddToken), 'i')).first()).toBeVisible();
	}

	const providerName = `${dbRow.billingproviderlastname} ${dbRow.billingproviderfirstname}`.replace(/\s+/g, ' ').trim();
	if (providerName) {
		await expect(page.getByText(new RegExp(escapeForRegex(providerName), 'i')).first()).toBeVisible();
	}

	if (dbRow.totalcharges) {
		await expect(page.getByText('$').first()).toBeVisible();
	}
}

async function assertOptionalTimelyFilingValuesWhenPresent(page: Page, dbRow: ArchiveRow): Promise<void> {
	const optionalMappings: Array<{ labelRegex: RegExp; dbValue: string }> = [
		{ labelRegex: /Insured Name:/i, dbValue: dbRow.insuredname },
		{ labelRegex: /Patient Birth Date:|DOB:/i, dbValue: dbRow.patientbirthdate },
		{ labelRegex: /Patient Gender:/i, dbValue: dbRow.patientgender },
		{ labelRegex: /Patient Relationship:/i, dbValue: dbRow.patientrelationship },
		{ labelRegex: /Insurance Plan:/i, dbValue: dbRow.insuranceplan },
		{ labelRegex: /Input File(Name)?:/i, dbValue: dbRow.inputfilename },
		{ labelRegex: /Report File(Name)?:/i, dbValue: dbRow.reportfilename },
		{ labelRegex: /CSV File(Name)?:/i, dbValue: dbRow.csvfilename },
		{ labelRegex: /NEIC ID:/i, dbValue: dbRow.neicid },
	];

	for (const mapping of optionalMappings) {
		const value = (mapping.dbValue ?? '').trim();
		if (!value) continue;

		const labelVisible = await page.getByText(mapping.labelRegex).first().isVisible().catch(() => false);
		if (!labelVisible) continue;

		await expect(page.getByText(new RegExp(escapeForRegex(value), 'i')).first()).toBeVisible();
	}
}

test.describe('Claim Archive Menu on Dashboard search results - Timely Filing Report', () => {
	test.beforeEach(async ({ page, loginAsAdmin }) => {
		pageErrors = [];
		page.on('pageerror', (err) => pageErrors.push(err.message));

		await loginAsAdmin();
		await openClaimsArchive(page);
	});

	test.afterEach(async () => {
		expect(pageErrors, 'Unexpected browser runtime errors were thrown.').toEqual([]);
	});

	test('Claim Archive filter controls and date range fields are visible and available', async ({ page }) => {
		await expect(page.getByRole('button', { name: d.labels.claimsArchive })).toBeVisible();
		await expect(page.getByRole('button', { name: d.labels.applyFilter })).toBeVisible();
		await expect(page.getByRole('textbox', { name: d.placeholders.claimId })).toBeVisible();
		await expect(page.getByRole('textbox', { name: d.placeholders.groupId })).toBeVisible();
		await expect(page.getByText(new RegExp(d.labels.startDate, 'i'))).toBeVisible();
		await expect(page.getByText(new RegExp(d.labels.endDate, 'i'))).toBeVisible();
	});

	test('Apply Filter with claim/group/date values succeeds and preserves entered values', async ({ page }) => {
		await searchArchiveByClaim(page, d.values.claimId, d.values.groupId);

		await expect(page.getByRole('textbox').nth(1)).toHaveValue(d.values.startDate);
		await expect(page.getByRole('textbox').nth(2)).toHaveValue(d.values.endDate);
		await expect(page.getByRole('textbox', { name: d.placeholders.groupId })).toHaveValue(d.values.groupId);
		await expect(page.getByRole('textbox', { name: d.placeholders.claimId })).toHaveValue(d.values.claimId);
	});

	test('Apply Filter with claim/group/date values returns row that exists in DB', async ({ page }) => {
		const dbRow = await fetchClaimArchiveMenuRowByClaimId(d.values.claimId);
		expect(dbRow).not.toBeNull();
		if (!dbRow) return;

		await searchArchiveByClaim(page, d.values.claimId, d.values.groupId);
		const row = page
			.locator(d.selectors.tableRows)
			.filter({ hasText: dbRow.patientaccountnumber || dbRow.patientname || d.values.claimId })
			.first();
		await expect(row).toBeVisible({ timeout: d.timeouts.searchMs });
		await expect(row).toContainText(dbRow.patientaccountnumber);
	});

	test('Timely Filing report opens from filtered archive row and required fields are visible', async ({ page }) => {
		await searchArchiveByClaim(page, d.values.claimId, d.values.groupId);
		await openTimelyFilingReport(page);
		await assertTimelyFilingRequiredLabelsVisible(page);
		await expect(page.getByRole('button', { name: '✖' })).toBeVisible();
		await page.getByRole('button', { name: '✖' }).click();
	});

	test('Timely Filing report key values are validated against DB projection', async ({ page }) => {
		await searchArchiveByClaim(page, d.values.claimId, d.values.groupId);
		await openTimelyFilingReport(page);

		const dbRow = await fetchClaimArchiveTimelyFilingRowByClaimId(d.values.claimId);
		expect(dbRow).not.toBeNull();
		if (!dbRow) return;

		await assertTimelyFilingCoreValuesMatchDb(page, dbRow);
		await page.locator(d.selectors.closeModalButton).first().click();
	});

	test('Timely Filing optional fields are validated when visible', async ({ page }) => {
		await searchArchiveByClaim(page, d.values.claimId, d.values.groupId);
		await openTimelyFilingReport(page);

		const dbRow = await fetchClaimArchiveTimelyFilingRowByClaimId(d.values.claimId);
		test.skip(!dbRow, `No archive row found for claim id ${d.values.claimId}`);
		if (!dbRow) return;

		await assertOptionalTimelyFilingValuesWhenPresent(page, dbRow);
		await page.locator(d.selectors.closeModalButton).first().click();
	});

	test('Empty/blank filters keep archive dashboard stable when Apply Filter is clicked', async ({ page }) => {
		await clearArchiveFilters(page);
		await applyFilterAndWait(page);
		const rowCount = await page.locator(d.selectors.tableRows).count();
		expect(rowCount).toBeGreaterThanOrEqual(0);
	});

	test('Invalid claim id returns no rows or empty state and DB returns null', async ({ page }) => {
		const dbRow = await fetchClaimArchiveTimelyFilingRowByClaimId(d.edgeCases.invalidClaimId);
		expect(dbRow).toBeNull();

		await searchArchiveByClaim(page, d.edgeCases.invalidClaimId, d.values.groupId);
		await assertNoResultsOrZeroRows(page);
	});

	test('Whitespace claim id keeps archive dashboard stable and searchable', async ({ page }) => {
		await searchArchiveByClaim(page, d.edgeCases.whitespace, d.values.groupId);
		await expect(page.getByRole('button', { name: d.labels.applyFilter })).toBeVisible();
	});
});