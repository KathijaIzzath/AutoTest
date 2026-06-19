import { test, expect } from '../myTestData';
import * as d from '../../testData/EnrollDshbdTestData.json';
import { verifyElementsVisible } from '../framework/element-verifier.helper';

async function openGroupEnrollments(page: Parameters<typeof test>[0] extends never ? never : any) {
  await page.getByRole('link', { name: d.labels.groupEnrollmentsNav }).click();
}

async function applyFilter(page: Parameters<typeof test>[0] extends never ? never : any) {
  await page.getByRole('button', { name: d.labels.applyFilter }).click();
}

async function fillFilter(page: Parameters<typeof test>[0] extends never ? never : any, placeholder: string, value: string) {
  await page.getByRole('textbox', { name: placeholder }).fill(value);
}

async function getVisibleClaimStatusCheckbox(page: Parameters<typeof test>[0] extends never ? never : any) {
  return page.getByRole('checkbox', { name: /Claim\s*Status/i }).first();
}

test('Group Enrollment Dashboard elements/controls verification test execution', async ({ page, loginAsAdmin }) => {
  await loginAsAdmin();
  await openGroupEnrollments(page);

  await openGroupEnrollments(page);
  await expect(page.getByText(d.labels.groupEnrollmentHeader)).toBeVisible();
  await expect(page.getByRole('link', { name: d.labels.addGroupEnrollmentNav })).toBeVisible();
  await verifyElementsVisible([
    page.getByRole('link').filter({ hasText: /^$/ }).nth(d.selectors.emptyLinkFirst),
    page.getByRole('link').filter({ hasText: /^$/ }).nth(d.selectors.emptyLinkSecond),
    page.getByText(d.labels.startDate),
    page.getByRole('textbox', { name: d.placeholders.date }).first(),
    page.getByRole('button').nth(d.selectors.dateButtonStart),
    page.getByText(d.labels.endDate),
    page.getByRole('textbox', { name: d.placeholders.date }).nth(1),
    page.getByRole('button').nth(d.selectors.dateButtonEnd),
    page.getByText(d.labels.agreementStatus),
    page.locator('div').filter({ hasText: new RegExp(`^${d.labels.selectStatus}$`) }).nth(1),
    page.getByText(d.labels.groupId),
    page.getByRole('textbox', { name: d.placeholders.groupId }),
    page.getByText(d.labels.npi),
    page.getByRole('textbox', { name: d.placeholders.npi }),
    page.getByText(d.labels.taxId),
    page.getByRole('textbox', { name: d.placeholders.taxId }),
    page.getByText(d.labels.payerId),
    page.getByRole('textbox', { name: d.placeholders.payerId }),
    page.getByText(d.labels.payerName),
    page.getByRole('textbox', { name: d.placeholders.payerName }),
    page.getByText(d.labels.routingId),
    page.getByRole('textbox', { name: d.placeholders.routingId }),
    page.getByText(d.labels.showLast),
    page.locator('select'),
    page.getByText(d.labels.enrollmentType, { exact: true }),
    page.locator('div').filter({ hasText: new RegExp(`^${d.labels.selectEnrollmentType}$`) }).nth(1),
    page.getByText(d.labels.caseNumber),
    page.getByRole('textbox', { name: d.placeholders.caseNumber }),
    page.getByRole('button', { name: d.labels.applyFilter }),
    page.locator(d.selectors.dropdownToggleButton)
  ]);
});

test(' Enrollment Dashboard search verification test execution', async ({ page, loginAsAdmin }) => {
  await loginAsAdmin();
  await openGroupEnrollments(page);

  await expect(page.getByText(d.labels.groupId)).toBeVisible();
  await expect(page.getByRole('textbox', { name: d.placeholders.groupId })).toBeVisible();
  await fillFilter(page, d.placeholders.groupId, d.values.groupIdPrimary);
  await applyFilter(page);

  await verifyElementsVisible([
    page.getByRole('columnheader', { name: d.headers.groupId }),
    page.getByRole('columnheader', { name: d.headers.groupName }),
    page.getByRole('cell', { name: d.values.groupIdPrimary }).first(),
    page.getByRole('cell', { name: d.values.groupNamePrimary }).first(),
    page.getByRole('columnheader', { name: d.headers.npi }),
    page.getByRole('cell', { name: d.values.npiPrimary }).first(),
    page.getByRole('columnheader', { name: d.headers.taxId }),
    page.getByRole('cell', { name: d.values.taxIdPrimary }).first(),
    page.getByRole('columnheader', { name: d.headers.payerName }),
    page.getByRole('cell', { name: d.values.payerNamePrimary }).first(),
    page.getByRole('columnheader', { name: d.headers.type }),
    page.getByRole('cell', { name: d.values.typeProfessional }),
    page.getByRole('columnheader', { name: d.headers.payerId }),
    page.getByRole('cell', { name: d.values.payerIdPrimary }).first(),
    page.getByRole('columnheader', { name: d.headers.processorId }),
    page.getByRole('cell', { name: d.values.processorRelay }).first(),
    page.getByRole('columnheader', { name: d.headers.routingId }),
    page.getByRole('cell', { name: d.values.routingIdPrimary }),
    page.getByRole('columnheader', { name: d.headers.status })
  ]);

  await expect(page.getByRole('row', { name: ` ${d.values.groupIdPrimary} ${d.values.groupNamePrimary}` }).getByRole('combobox')).toHaveValue(d.values.statusToBeSentCode);
  await expect(page.locator('tbody')).toContainText(d.labels.toBeSent);
  await expect(page.getByRole('columnheader', { name: d.headers.createdDateDesc })).toBeVisible();
  await expect(page.getByRole('cell', { name: d.values.createdDatePrimary }).first()).toBeVisible();

  await fillFilter(page, d.placeholders.npi, d.values.npiPrimary);
  await applyFilter(page);
  await expect(page.getByRole('columnheader', { name: d.headers.npi })).toBeVisible();
  await expect(page.getByRole('cell', { name: d.values.npiPrimary }).first()).toBeVisible();
  await fillFilter(page, d.placeholders.npi, '');

  await fillFilter(page, d.placeholders.taxId, d.values.taxIdPrimary);
  await applyFilter(page);
  await expect(page.getByRole('columnheader', { name: d.headers.taxId })).toBeVisible();
  await expect(page.getByRole('cell', { name: d.values.taxIdPrimary }).first()).toBeVisible();
  await fillFilter(page, d.placeholders.taxId, '');

  await fillFilter(page, d.placeholders.payerId, d.values.payerIdPrimary);
  await applyFilter(page);
  await expect(page.getByRole('columnheader', { name: d.headers.payerId })).toBeVisible();
  await expect(page.getByRole('cell', { name: d.values.payerIdPrimary }).first()).toBeVisible();
  await fillFilter(page, d.placeholders.payerId, '');

  await fillFilter(page, d.placeholders.payerName, d.values.payerNamePrimary);
  await applyFilter(page);
  await expect(page.getByRole('columnheader', { name: d.headers.payerName })).toBeVisible();
  await expect(page.getByRole('cell', { name: d.values.payerNamePrimary }).first()).toBeVisible();
  await fillFilter(page, d.placeholders.payerName, '');

  await fillFilter(page, d.placeholders.routingId, d.values.routingIdSearch);
  await applyFilter(page);
  await expect(page.getByRole('columnheader', { name: d.headers.routingId })).toBeVisible();
  await expect(page.getByRole('cell', { name: d.values.routingIdSearch }).nth(1)).toBeVisible();
  await fillFilter(page, d.placeholders.routingId, '');

  await fillFilter(page, d.placeholders.groupId, '');
  await expect(page.getByText(d.labels.showLast)).toBeVisible();
  await expect(page.locator(d.selectors.showLastFilter).getByRole('combobox')).toBeVisible();
  await page.locator(d.selectors.showLastFilter).getByRole('combobox').selectOption(d.values.showLastOption120);
  await applyFilter(page);
  await expect(page.getByRole('columnheader', { name: d.headers.createdDateDesc })).toBeVisible();
  await expect(page.getByRole('cell', { name: d.values.createdDatePrimary }).first()).toBeVisible();
  await page.getByRole('columnheader', { name: d.headers.createdDateDesc }).click();
  await expect(page.getByRole('cell', { name: new RegExp(d.values.createdYearRegex) }).nth(1)).toBeVisible();
  await page.locator(d.selectors.showLastFilter).getByRole('combobox').selectOption('');

  await page.locator(d.selectors.enrollmentTypeSelect).filter({ hasText: d.labels.selectEnrollmentType }).locator('input[type="text"]').click();
  const eraCheckbox = page.getByRole('checkbox', { name: 'ERA' });
  await expect(eraCheckbox).toBeVisible();
  await eraCheckbox.check();
  await page.keyboard.press('Escape');
  await applyFilter(page);
  await expect(page.getByRole('columnheader', { name: d.headers.type })).toBeVisible();
  await expect(page.getByRole('cell', { name: 'ERA' }).first()).toBeVisible();
  await page.locator('form').getByTitle(d.selectors.clearAllTitle).first().evaluate((el) => (el as HTMLElement).click());

  await page.locator(d.selectors.enrollmentTypeSelect).filter({ hasText: d.labels.selectEnrollmentType }).locator('input[type="text"]').click();
  const claimStatusCheckbox = await getVisibleClaimStatusCheckbox(page);
  await expect(claimStatusCheckbox).toBeVisible();
  await claimStatusCheckbox.check();
  await applyFilter(page);
  await expect(page.getByRole('columnheader', { name: d.headers.type })).toBeVisible();
  await expect(page.locator('tbody')).toContainText(/ERA|CLAIM|ELIGIBILITY|PROFESSIONAL/i);
  await page.locator('form').getByTitle(d.selectors.clearAllTitle).first().evaluate((el) => (el as HTMLElement).click());

  await page.locator(d.selectors.enrollmentTypeSelect).filter({ hasText: d.labels.selectEnrollmentType }).locator('input[type="text"]').click();
  const eligibilityCheckbox = page.getByRole('checkbox', { name: d.labels.eligibility });
  await expect(eligibilityCheckbox).toBeVisible();
  await eligibilityCheckbox.check();
  await applyFilter(page);
  await expect(page.getByRole('columnheader', { name: d.headers.type })).toBeVisible();
  await expect(page.locator('tbody')).toContainText(/ERA|CLAIM|ELIGIBILITY|PROFESSIONAL/i);
  await page.locator('form').getByTitle(d.selectors.clearAllTitle).first().evaluate((el) => (el as HTMLElement).click());

  await page.locator(d.selectors.enrollmentTypeSelect).filter({ hasText: d.labels.selectEnrollmentType }).locator('input[type="text"]').click();
  const professionalCheckbox = page.getByRole('checkbox', { name: 'Professional' });
  await expect(professionalCheckbox).toBeVisible();
  await professionalCheckbox.check();
  await applyFilter(page);
  await expect(page.getByRole('columnheader', { name: d.headers.type })).toBeVisible();
  await expect(page.locator('tbody')).toContainText(/ERA|CLAIM|ELIGIBILITY|PROFESSIONAL/i);
  await page.locator('form').getByTitle(d.selectors.clearAllTitle).first().evaluate((el) => (el as HTMLElement).click());

  await expect(page.getByText(d.labels.agreementStatus)).toBeVisible();

  await page.locator('ng-select').filter({ hasText: d.labels.selectStatus }).locator('input[type="text"]').click();
  await page.getByRole('checkbox', { name: /Sent to Customer/i }).first().check();
  await applyFilter(page);
  await expect(page.getByRole('columnheader', { name: d.headers.status })).toBeVisible();
  await expect(page.locator('tbody')).toContainText(/Sent to Customer|To be sent|Approved|Not applicable/i);

  await page.locator('ng-select').filter({ hasText: d.labels.selectStatus }).locator('input[type="text"]').click();
  await page.getByRole('checkbox', { name: /Approved/i }).first().check();
  await applyFilter(page);
  await expect(page.getByRole('columnheader', { name: d.headers.status })).toBeVisible();
  await expect(page.locator('tbody')).toContainText(/Approved|Sent to Customer|To be sent|Not applicable/i);
  await page.locator('form').getByTitle(d.selectors.clearAllTitle).first().evaluate((el) => (el as HTMLElement).click());

  await page.locator('ng-select').filter({ hasText: d.labels.selectStatus }).locator('input[type="text"]').click();
  await page.getByRole('checkbox', { name: /To be sent/i }).first().check();
  await applyFilter(page);
  await expect(page.getByRole('columnheader', { name: d.headers.status })).toBeVisible();
  await expect(page.locator('tbody')).toContainText(/To be sent|Approved|Sent to Customer|Not applicable/i);
  await page.locator('form').getByTitle(d.selectors.clearAllTitle).first().evaluate((el) => (el as HTMLElement).click());

  await page.locator('ng-select').filter({ hasText: d.labels.selectStatus }).locator('input[type="text"]').click();
  await page.getByRole('checkbox', { name: /Not applicable/i }).first().check();
  await applyFilter(page);
  await expect(page.getByRole('columnheader', { name: d.headers.status })).toBeVisible();
  await expect(page.locator('tbody')).toContainText(/Not applicable|Approved|To be sent|Sent to Customer/i);
});

test(' Enrollment Sorting results verification test execution', async ({ page, loginAsAdmin }) => {
  await loginAsAdmin();
  await openGroupEnrollments(page);

  await applyFilter(page);
  await page.getByRole('columnheader', { name: d.headers.groupId }).click();
  await expect(page.getByRole('cell', { name: d.values.sortGroupIdFirst }).first()).toBeVisible();
  await page.getByRole('columnheader', { name: d.headers.groupName }).click();
  await expect(page.getByRole('cell', { name: d.values.sortGroupNameFirst }).first()).toBeVisible();
  await page.getByRole('columnheader', { name: d.headers.npi }).click();
  await expect(page.getByRole('cell', { name: d.values.sortNpi }).first()).toBeVisible();
  await page.getByRole('columnheader', { name: d.headers.taxId }).click();
  await expect(page.getByRole('cell', { name: d.values.sortTaxId }).first()).toBeVisible();
  await page.getByRole('columnheader', { name: d.headers.payerName }).click();
  await expect(page.getByRole('cell', { name: d.values.sortPayerName }).first()).toBeVisible();
  await page.getByRole('columnheader', { name: d.headers.type }).click();
  await expect(page.getByRole('cell', { name: d.values.sortType }).first()).toBeVisible();
  await page.getByRole('columnheader', { name: d.headers.payerId }).click();
  await expect(page.getByRole('cell', { name: d.values.sortPayerId }).first()).toBeVisible();
  await page.getByRole('columnheader', { name: d.headers.processorId }).click();
  await expect(page.getByRole('cell', { name: d.values.sortProcessorId }).nth(1)).toBeVisible();
  await page.getByRole('columnheader', { name: d.headers.routingId }).click();
  await expect(page.getByRole('cell', { name: d.values.sortRoutingId }).first()).toBeVisible();
  await page.getByRole('columnheader', { name: d.headers.status }).click();
  await expect(page.getByRole('row', { name: d.values.sortStatusRow }).getByRole('combobox')).toBeVisible();
  await page.getByRole('columnheader', { name: d.headers.createdDate }).click();
  await expect(page.getByRole('cell', { name: d.values.sortCreatedDate }).first()).toBeVisible();
  await page.getByRole('columnheader', { name: d.headers.approvedDate }).click();
  await expect(page.getByRole('cell', { name: d.values.sortApprovedDate }).first()).toBeVisible();
  await page.getByRole('columnheader', { name: d.headers.followUpDate }).click();
  await expect(page.getByRole('cell', { name: d.values.sortFollowUpDate }).first()).toBeVisible();
});

test('Enrollment dashboard controls availability quick check', async ({ page, loginAsAdmin }) => {
  await loginAsAdmin();
  await openGroupEnrollments(page);

  await expect(page.getByRole('textbox', { name: d.placeholders.groupId })).toBeVisible();
  await expect(page.getByRole('textbox', { name: d.placeholders.npi })).toBeVisible();
  await expect(page.getByRole('textbox', { name: d.placeholders.taxId })).toBeVisible();
  await expect(page.getByRole('textbox', { name: d.placeholders.payerId })).toBeVisible();
  await expect(page.getByRole('textbox', { name: d.placeholders.payerName })).toBeVisible();
  await expect(page.getByRole('textbox', { name: d.placeholders.routingId })).toBeVisible();
  await expect(page.getByRole('button', { name: d.labels.applyFilter })).toBeVisible();
});

test('Enrollment invalid filter should show no known seeded row', async ({ page, loginAsAdmin }) => {
  await loginAsAdmin();
  await openGroupEnrollments(page);

  await fillFilter(page, d.placeholders.groupId, d.edgeCases.invalidGroupId);
  await fillFilter(page, d.placeholders.payerId, d.edgeCases.invalidPayerId);
  await applyFilter(page);

  await expect(page.getByRole('cell', { name: d.values.groupIdPrimary })).toHaveCount(0);
  await expect(page.getByRole('cell', { name: d.values.payerNamePrimary })).toHaveCount(0);
});
