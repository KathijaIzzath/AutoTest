import { test, expect } from '../myTestData';
import { Page } from '@playwright/test';
import * as userData from '../../testData/UserInfo.json';
import * as d from '../../testData/BulkEnrollTestData.json';
import { existsBulkGroupEnrollment, fetchNPIAndTaxIDForGroupId, fetchProviderGroupById, getTodaysDateWithFullYear } from '../../testData/database.utils';
// Adding Bulk Group enrollment for groupid G00016

async function openAddGroupEnrollment(page: Page) {
  await page.getByRole('link', { name: d.labels.groupEnrollmentsNav }).click();
  await page.getByRole('link', { name: d.labels.addGroupEnrollmentNav }).click();
  await expect(page.getByRole('heading', { name: d.labels.addGroupEnrollmentsHeading })).toBeVisible();
}

async function selectGroupAndIds(page: Page, groupId: string, npi: string, taxId: string) {
  await page.locator(d.selectors.groupArrow).click();
  await page.getByRole('textbox').first().click();
  await page.getByRole('option', { name: new RegExp(groupId) }).first().click();
  await page.getByRole('combobox').nth(1).selectOption(npi);
  await page.getByRole('combobox').nth(2).selectOption(taxId);
}

test('Add Bulk Group Enrollment ', async ({ page, loginAsAdmin }) => {

  // --- Login ---
  await loginAsAdmin();
  const groupId = userData.groupEnroll.bulkgroupId;
  // --- Pre-checks and navigation ---
  const verifyEnrollmentExists = await existsBulkGroupEnrollment(groupId);
  console.log('Existing bulk enrollment before test:', verifyEnrollmentExists);
  await openAddGroupEnrollment(page);

  const group = await fetchProviderGroupById(groupId);
  console.log(group); // { id: 'G00017', name: '...' } or null
  const groupName = group?.name;
  if (!groupName) throw new Error(`No group name found for groupId: ${groupId}`);

  const billingMap = await fetchNPIAndTaxIDForGroupId(groupId);
  const NPI = billingMap?.has(d.values.expectedNpi) ? d.values.expectedNpi : '';
  const TAXID = billingMap?.has(d.values.expectedTaxId) ? d.values.expectedTaxId : '';
  if (!NPI) throw new Error(`NPI value ${d.values.expectedNpi} not found for groupId ${groupId}`);
  if (!TAXID) throw new Error(`TAXID value ${d.values.expectedTaxId} not found for groupId ${groupId}`);

  await expect(page.getByRole('heading', { name: d.labels.addGroupEnrollmentsHeading })).toBeVisible();
  await expect(page.getByRole('dialog').getByText(d.labels.groupId, { exact: true })).toBeVisible();
  await expect(page.getByRole('combobox').filter({ hasText: /^$/ })).toBeVisible();
  await expect(page.getByRole('textbox')).toBeEmpty();
  await expect(page.getByRole('dialog').getByText(d.labels.npi, { exact: true })).toBeVisible();
  await expect(page.locator('div').filter({ hasText: /^Select NPI$/ })).toBeVisible();
  await expect(page.getByText(d.labels.taxId, { exact: true })).toBeVisible();
  await expect(page.locator('div').filter({ hasText: /^Select Tax Id$/ })).toBeVisible();
  await page.getByRole('textbox').click();
  await selectGroupAndIds(page, userData.groupEnroll.bulkgroupId, NPI, TAXID);
  await expect(page.getByRole('heading', { name: d.labels.addGroupEnrollmentsHeading })).toBeVisible();
  await expect(page.getByText(d.labels.groupName)).toBeVisible();
 // await expect(page.getByRole('dialog').getByText('Group ID')).toBeVisible();
  await expect(page.getByText(groupName)).toBeVisible();
  await expect(page.getByText(userData.groupEnroll.bulkgroupId)).toBeVisible();
 // await expect(page.getByRole('dialog').getByText('NPI')).toBeVisible();
  await expect(page.getByText(NPI)).toBeVisible();
  await expect(page.getByText(d.labels.taxId, { exact: true })).toBeVisible();
  await expect(page.getByText(TAXID)).toBeVisible();
  // Debug log and screenshot before assertion
  const payerHeader = page.locator(d.selectors.payerHeader).getByText(d.labels.payer);
  const headerCount = await payerHeader.count();
  console.log('Payer header count:', headerCount);
  await page.screenshot({ path: 'payer-header-before-assertion.png', fullPage: true });
  await expect(payerHeader).toBeVisible();
  await expect(page.getByText(d.labels.enrollmentType, { exact: true })).toBeVisible();
  await expect(page.getByRole('columnheader', { name: d.labels.professional }).getByRole('button')).toBeVisible();
  await expect(page.getByRole('columnheader', { name: d.labels.professional })).toBeVisible();
  await expect(page.getByRole('columnheader', { name: d.labels.institutional }).getByRole('button')).toBeVisible();
  await expect(page.getByRole('columnheader', { name: d.labels.institutional })).toBeVisible();
  await expect(page.getByRole('columnheader', { name: d.labels.era }).getByRole('button')).toBeVisible();
  await expect(page.getByRole('columnheader', { name: d.labels.era })).toBeVisible();
  await expect(page.getByRole('columnheader', { name: d.labels.claimStatus }).getByRole('button')).toBeVisible();
  await expect(page.getByRole('columnheader', { name: d.labels.claimStatus })).toBeVisible();
  await expect(page.getByRole('columnheader', { name: d.labels.eligibility }).getByRole('button')).toBeVisible();
  await expect(page.getByRole('columnheader', { name: d.labels.eligibility })).toBeVisible();
  await expect(page.getByRole('cell', { name: d.values.selectcare })).toBeVisible();
  await expect(page.getByRole('cell').nth(1)).toBeVisible();
  await expect(page.getByRole('cell').nth(2)).toBeVisible();
  await expect(page.getByRole('cell').nth(3)).toBeVisible();
  await expect(page.getByRole('cell').nth(4)).toBeVisible();
  await expect(page.getByRole('cell').nth(5)).toBeVisible();
  await expect(page.getByRole('cell').filter({ hasText: /^$/ }).nth(5)).toBeVisible();
  await expect(page.getByRole('cell', { name: 'S & S HEALTHCARE STRATEGIES' })).toBeVisible();
  await expect(page.getByRole('cell', { name: 'N/A' }).first()).toBeVisible();
  await expect(page.getByRole('cell', { name: 'N/A' }).nth(1)).toBeVisible();
  await expect(page.locator('tr:nth-child(2) > td:nth-child(4)')).toBeVisible();
  await expect(page.getByRole('cell', { name: 'N/A' }).nth(2)).toBeVisible();
  await expect(page.getByRole('cell', { name: 'N/A' }).nth(3)).toBeVisible();
  await expect(page.getByRole('row', { name: 'S & S HEALTHCARE STRATEGIES N' }).getByRole('link')).toBeVisible();
  await expect(page.locator('tr:nth-child(2) > td:nth-child(7)')).toBeVisible();
  await expect(page.getByRole('cell', { name: 'PREFERRED COMMUNITY CHOICE /' })).toBeVisible();
  await expect(page.getByRole('cell', { name: 'N/A' }).nth(4)).toBeVisible();
  await expect(page.getByRole('cell', { name: 'N/A' }).nth(5)).toBeVisible();
  await expect(page.locator('tr:nth-child(3) > td:nth-child(4)')).toBeVisible();
  await expect(page.locator('tr:nth-child(3) > td:nth-child(5)')).toBeVisible();
  await expect(page.locator('tr:nth-child(3) > td:nth-child(6)')).toBeVisible();
  await expect(page.locator('tr:nth-child(3) > td:nth-child(7)')).toBeVisible();
  await expect(page.getByRole('cell', { name: 'JOHN DEERE HEALTH CARE /' })).toBeVisible();
  await expect(page.locator('tr:nth-child(4) > td:nth-child(2)')).toBeVisible();
  await expect(page.locator('tbody')).toContainText('N/A');
  await expect(page.locator('tr:nth-child(4) > td:nth-child(3)')).toBeVisible();
  await expect(page.locator('tbody')).toContainText('N/A');
  await expect(page.locator('tr:nth-child(4) > td:nth-child(4)')).toBeVisible();
  await expect(page.locator('tr:nth-child(4) > td:nth-child(5)')).toBeVisible();
  await expect(page.locator('tbody')).toContainText('N/A');
  await expect(page.locator('tr:nth-child(4) > td:nth-child(6)')).toBeVisible();
  await expect(page.locator('tbody')).toContainText('N/A');
  await expect(page.locator('tr:nth-child(4) > td:nth-child(7)')).toBeVisible();
  await expect(page.getByRole('row', { name: 'JOHN DEERE HEALTH CARE /' }).getByRole('link')).toBeVisible();
  await expect(page.getByRole('cell', { name: 'INTERFACE EAP (IEAP)' })).toBeVisible();
  await expect(page.locator('tr:nth-child(5) > td:nth-child(2)')).toBeVisible();
  await expect(page.locator('tbody')).toContainText('N/A');
  await expect(page.locator('tr:nth-child(5) > td:nth-child(3)')).toBeVisible();
  await expect(page.locator('tbody')).toContainText('N/A');
  await expect(page.locator('tr:nth-child(5) > td:nth-child(4)')).toBeVisible();
  await expect(page.locator('tr:nth-child(5) > td:nth-child(5)')).toBeVisible();
  await expect(page.locator('tr:nth-child(5) > td:nth-child(5)')).toBeVisible();
  await expect(page.locator('tbody')).toContainText('N/A');
  await expect(page.locator('tr:nth-child(5) > td:nth-child(6)')).toBeVisible();
  await expect(page.locator('tbody')).toContainText('N/A');
  await expect(page.locator('tr:nth-child(5) > td:nth-child(7)')).toBeVisible();
  await expect(page.getByRole('row', { name: 'INTERFACE EAP (IEAP) N/A N/A' }).getByRole('link')).toBeVisible();
  await expect(page.getByRole('cell', { name: 'PUERTO RICO SSS MEDICARE' })).toBeVisible();
  await expect(page.locator('tr:nth-child(6) > td:nth-child(2)')).toBeVisible();
  await expect(page.locator('tbody')).toContainText('N/A');
  await expect(page.locator('tr:nth-child(6) > td:nth-child(3)')).toBeVisible();
  await expect(page.locator('tbody')).toContainText('N/A');
  await expect(page.locator('tr:nth-child(6) > td:nth-child(4) > checkbox > .checkbox')).toBeVisible();
  await expect(page.locator('tr:nth-child(6) > td:nth-child(5)')).toBeVisible();
  await expect(page.locator('tbody')).toContainText('N/A');
  await expect(page.locator('tr:nth-child(6) > td:nth-child(6)')).toBeVisible();
  await expect(page.locator('tbody')).toContainText('N/A');
  await expect(page.locator('tr:nth-child(6) > td:nth-child(7) > .add-group-btn')).toBeVisible();
  await expect(page.locator('div').filter({ hasText: 'Enter Payer Name or Id' }).nth(5)).toBeVisible();
  await page.getByRole('textbox').click();
  await expect(page.getByRole('textbox')).toBeEmpty();
  await page.getByRole('option', { name: d.values.payerToAdd }).click();
  await expect(page.getByRole('button', { name: d.labels.addPayer })).toBeVisible();
  await expect(page.getByRole('button', { name: d.labels.save })).toBeVisible();
  await expect(page.getByRole('button', { name: d.labels.back })).toBeVisible();
  await page.getByRole('button', { name: d.labels.addPayer }).click();
  await expect(page.getByRole('cell', { name: d.values.payerCellExpected })).toBeVisible();
  await expect(page.getByRole('cell', { name: d.values.payerCellExpected2 })).toBeVisible();
  await expect(page.locator('tr:nth-child(9) > td:nth-child(7) > .add-group-btn')).toBeVisible();
  await page.locator('tr:nth-child(9) > td:nth-child(7) > .add-group-btn').click();
  await page.getByRole('button', { name: d.labels.save }).click();
  await page.getByRole('heading', { name: d.labels.addGroupEnrollmentsHeading }).click();
  await expect(page.getByText(d.labels.groupName)).toBeVisible();
  await expect(page.getByRole('dialog').getByText(d.labels.groupId)).toBeVisible();
  await expect(page.getByRole('dialog').getByText(d.labels.npi)).toBeVisible();
  await expect(page.getByText(NPI)).toBeVisible();
  await expect(page.getByText(TAXID)).toBeVisible();
  await expect(page.getByText(d.labels.groupEnrollmentRecordsAdded)).toBeVisible();
  await expect(page.getByRole('columnheader', { name: d.labels.recordsFailedHeader })).toBeVisible();
  await expect(page.getByRole('columnheader', { name: d.labels.payer })).toBeVisible();
  await expect(page.getByRole('columnheader', { name: 'Type' })).toBeVisible();
  await expect(page.getByRole('button', { name: d.labels.close })).toBeVisible();
  await page.getByRole('button', { name: d.labels.close }).click();
  await expect(page.getByRole('cell', { name: groupId }).first()).toBeVisible();
  await expect(page.getByRole('cell', { name: groupName }).first()).toBeVisible();
  await expect(page.getByRole('cell', { name: NPI }).first()).toBeVisible();
  await expect(page.getByRole('cell', { name: TAXID }).first()).toBeVisible();
  await expect(page.getByRole('cell', { name: d.values.selectcare }).first()).toBeVisible();
  await expect(page.getByRole('cell', { name: d.values.claimStatusUpper })).toBeVisible();
  await expect(page.getByRole('cell', { name: d.values.processorRelay }).first()).toBeVisible();
  await expect(page.getByRole('cell', { name: d.values.eligibilityUpper })).toBeVisible();
  await expect(page.getByRole('cell', { name: d.values.professionalUpper }).first()).toBeVisible();
  await expect(page.getByRole('cell', { name: 'ERA' }).nth(4)).toBeVisible();

  const expectedNumericCodes = ['73145', '95092', '6831', '95378', '31441', '60280'];
  const codeMatchCount = await page
    .locator('tbody td')
    .filter({ hasText: new RegExp(`^(${expectedNumericCodes.join('|')})$`) })
    .count();
  expect(codeMatchCount).toBeGreaterThan(0);

});

test('Bulk enrollment modal initial fields availability and disabled dependent dropdowns', async ({ page, loginAsAdmin }) => {
  await loginAsAdmin();
  await openAddGroupEnrollment(page);

  await expect(page.getByRole('heading', { name: d.labels.addGroupEnrollmentsHeading })).toBeVisible();
  await expect(page.getByRole('dialog').getByText(d.labels.groupId, { exact: true })).toBeVisible();
  await expect(page.getByRole('dialog').getByText(d.labels.npi, { exact: true })).toBeVisible();
  await expect(page.getByText(d.labels.taxId, { exact: true })).toBeVisible();
  await expect(page.locator(d.selectors.npiSelect)).toBeDisabled();
  await expect(page.locator(d.selectors.taxIdSelect)).toBeDisabled();
});

test('Bulk enrollment invalid group should not be selectable in group dropdown', async ({ page, loginAsAdmin }) => {
  await loginAsAdmin();
  await openAddGroupEnrollment(page);

  await page.locator(d.selectors.groupArrow).click();
  await expect(page.getByRole('option', { name: d.edgeCases.invalidGroupId })).toHaveCount(0);
  await expect(page.locator(d.selectors.npiSelect)).toBeDisabled();
  await expect(page.locator(d.selectors.taxIdSelect)).toBeDisabled();
});