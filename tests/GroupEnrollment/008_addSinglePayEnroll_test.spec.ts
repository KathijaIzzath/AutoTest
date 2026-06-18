import { test, expect } from '../myTestData';
import * as userData from '../../testData/UserInfo.json';
import * as d from '../../testData/SinglePayEnrollTestData.json';

import { existsSingleGroupEnrollment, fetchNPIAndTaxIDForGroupId, getTodaysDateWithFullYear } from '../../testData/database.utils';
// Adding single payer enrollment for groupid G00014

async function openAddGroupEnrollment(page: any) {
  await page.getByRole('link', { name: d.labels.groupEnrollmentsNav }).click();
  await page.getByRole('link', { name: d.labels.addGroupEnrollmentNav }).click();
  await expect(page.getByRole('heading', { name: d.labels.addGroupEnrollmentsHeading })).toBeVisible();
}

async function selectGroupNpiTax(page: any) {
  await page.locator(d.selectors.groupArrow).click();
  await page.getByText(userData.groupEnroll.groupId).click();
  await page.getByRole(d.roles.groupCombobox).nth(1).selectOption(userData.groupEnroll.NPI);
  await page.getByRole(d.roles.groupCombobox).nth(2).selectOption(userData.groupEnroll.taxID);
}

test('Add Single Pay Enrollment ', async ({ page, loginAsAdmin }) => {
  await loginAsAdmin();
  const groupId = userData.groupEnroll.groupId;
  // --- Pre-checks and navigation ---
  const verifyEnrollmentExists = await existsSingleGroupEnrollment(groupId);
  console.log('Existing single enrollment before test:', verifyEnrollmentExists);
  await openAddGroupEnrollment(page);

  // --- Initial dropdown state checks ---
  const npiCombo = page.locator(d.selectors.npiSelect);
await expect(npiCombo).toBeDisabled(); // Checks if disabled
const taxIdCombo = page.locator(d.selectors.taxIdSelect);
await expect(taxIdCombo).toBeDisabled(); // Checks if disabled
  await expect(page.locator('div').filter({ hasText: 'Select Tax Id' }).nth(5)).toBeVisible();
  await expect(page.locator('div').filter({ hasText: 'Select NPI' }).nth(5)).toBeVisible();
  await expect(page.locator('div').filter({ hasText: /^Select NPI$/ })).toBeVisible();
  await expect(page.getByText(d.labels.taxId, { exact: true })).toBeVisible();
  await expect(page.locator('div').filter({ hasText: /^Select Tax Id$/ })).toBeVisible();

  // Check if no option is selected in group dropdown
  const groupDropdown = page.getByRole('combobox').first();
  const selectedText = await groupDropdown.textContent();
  expect(selectedText?.trim()).toBe('');
  // Assert NPI and Tax Id dropdowns are disabled
  await expect(npiCombo).toBeDisabled();
  await expect(taxIdCombo).toBeDisabled();
  
    // --- Fetch NPI and Tax ID Map ---
  const userDataMap = await fetchNPIAndTaxIDForGroupId(groupId);
  // Assign each key-value pair to a constant variable
  const taxid1 = userDataMap && userDataMap.has('082954619') ? '082954619' : undefined;
  const TaxId1text = taxid1 && userDataMap ? userDataMap.get(taxid1) : undefined;
  const taxid2 = userDataMap && userDataMap.has('554625978') ? '554625978' : undefined;
  const TaxId2text = taxid2 && userDataMap ? userDataMap.get(taxid2) : undefined;
  const npi = userDataMap && userDataMap.has('0829876198') ? '0829876198' : undefined;
  const npitext = npi && userDataMap ? userDataMap.get(npi) : undefined;
  const npi2 = userDataMap && userDataMap.has('1528105525') ? '1528105525' : undefined;
  const npitext2 = npi2 && userDataMap ? userDataMap.get(npi2) : undefined;

      // --- UI Interactions and Assertions ---
      // Verify top labels and dropdowns are visible
      // Verify NPI/Tax ID pre-populated on new form
      // Verify and add date and optional fields
      //Verify save and adding 2 enrollments with different types
      // verify Prompt to add another
  await expect(page.getByRole('heading', { name: d.labels.addGroupEnrollmentsHeading })).toBeVisible();
  await expect(page.locator('app-add-group-enrollments-dialog-modal')).toContainText('Group Name');
  await expect(page.locator('app-add-group-enrollments-dialog-modal')).toContainText('N/A');
  await expect(page.getByRole('dialog').getByText(d.labels.groupId, { exact: true })).toBeVisible();
  await expect(page.getByRole('combobox').filter({ hasText: /^$/ })).toBeVisible();
  await expect(page.getByRole('dialog').getByText(d.labels.npi, { exact: true })).toBeVisible();
  await expect(page.locator('div').filter({ hasText: /^Select NPI$/ })).toBeVisible();
  await expect(page.locator('app-add-group-enrollments-dialog-modal')).toContainText('Select NPI');
  await expect(page.getByText(d.labels.taxId, { exact: true })).toBeVisible();
  await expect(page.locator('app-add-group-enrollments-dialog-modal')).toContainText('Select Tax Id');
  await expect(page.locator('div').filter({ hasText: /^Select Tax Id$/ })).toBeVisible();
 
  await expect(page.getByRole('heading', { name: d.labels.addGroupEnrollmentsHeading })).toBeVisible();
  await expect(page.locator('app-add-group-enrollments-dialog-modal')).toContainText('Group Name');  
  await expect(page.locator('app-add-group-enrollments-dialog-modal')).toContainText('N/A');
  await expect(page.getByRole('dialog').getByText(d.labels.groupId, { exact: true })).toBeVisible();
  await expect(page.getByRole('combobox').filter({ hasText: /^$/ })).toBeVisible();
  await expect(page.getByRole('dialog').getByText(d.labels.npi, { exact: true })).toBeVisible();
  await expect(page.locator('div').filter({ hasText: /^Select NPI$/ })).toBeVisible();
  await expect(page.locator('app-add-group-enrollments-dialog-modal')).toContainText('Select NPI');
  await expect(page.getByText(d.labels.taxId, { exact: true })).toBeVisible();
  await expect(page.locator('app-add-group-enrollments-dialog-modal')).toContainText('Select Tax Id');
  await expect(page.locator('div').filter({ hasText: /^Select Tax Id$/ })).toBeVisible();
 // await page.getByText(userData.groupEnroll.groupId).click();
  await selectGroupNpiTax(page);
 
 //await page.getByRole('option', { name: userData.groupEnroll.groupId }).click();
  await expect(page.locator('app-add-group-enrollments-dialog-modal')).toContainText('Select Tax Id ');
await expect(page.getByRole('heading', { name: d.labels.addGroupEnrollmentsHeading })).toBeVisible();
await expect(page.getByText('Group Name')).toBeVisible();
await expect(page.locator('app-add-group-enrollments-modal')).toContainText('LAKIN-KULAS');
await expect(page.getByRole('dialog').getByText(d.labels.groupId)).toBeVisible();
await expect(page.locator('app-add-group-enrollments-modal')).toContainText(userData.groupEnroll.groupId);
await expect(page.getByText(userData.groupEnroll.groupId)).toBeVisible();
await expect(page.getByRole('dialog').getByText(d.labels.npi)).toBeVisible();
await expect(page.getByText(userData.groupEnroll.NPI)).toBeVisible();
await expect(page.locator('app-add-group-enrollments-modal')).toContainText(userData.groupEnroll.NPI);
await expect(page.getByText(d.labels.taxId, { exact: true })).toBeVisible();
await expect(page.getByText(userData.groupEnroll.taxID)).toBeVisible();
await expect(page.locator('app-add-group-enrollments-modal')).toContainText(userData.groupEnroll.taxID);
await expect(page.getByRole('dialog').getByText(d.labels.payer, { exact: true })).toBeVisible();
await expect(page.getByRole('combobox')).toBeVisible();
await expect(page.getByRole('combobox')).toBeVisible();
await page.getByRole('combobox').getByRole('textbox').click();
await page.getByRole('option', { name: userData.groupEnroll.payerName }).click();
await expect(page.getByRole('combobox')).toBeVisible();
await expect(page.getByRole('dialog').getByText(d.labels.enrollmentType)).toBeVisible();
await expect(page.locator('label').filter({ hasText: userData.groupEnroll.enrollmentTypeP })).toBeVisible();
await expect(page.getByRole('checkbox', { name: 'Institutional' })).toBeVisible();
await expect(page.locator('label').filter({ hasText: userData.groupEnroll.enrollmentTypeE })).toBeVisible();
await expect(page.locator('label').filter({ hasText: userData.groupEnroll.enrollmentTypeC })).toBeVisible();
await expect(page.locator('label').filter({ hasText: userData.groupEnroll.enrollmentTypeL })).toBeVisible();
await page.getByRole('checkbox', { name: userData.groupEnroll.enrollmentTypeP }).check();
await page.getByRole('checkbox', { name: userData.groupEnroll.enrollmentTypeL }).check();
await expect(page.getByText(d.labels.followupDate)).toBeVisible();
await page.getByRole('button').filter({ hasText: /^$/ }).click();
await page.getByLabel('Select year').selectOption(d.values.followupYear);
await page.getByText(d.values.followupDay, { exact: true }).click();
await expect(page.getByRole('textbox', { name: d.roles.dateTextbox })).toHaveValue(/\d{2}\/23\/2035/);
await expect(page.getByRole('dialog').getByText(d.labels.caseNumber)).toBeVisible();
await page.getByRole('textbox', { name: d.roles.caseNumberTextbox }).click();
await page.getByRole('textbox', { name: d.roles.caseNumberTextbox }).fill(d.values.caseNumber);
await expect(page.getByRole('textbox', { name: d.roles.caseNumberTextbox })).toBeVisible();
await expect(page.getByText(d.labels.notes)).toBeVisible();
await expect(page.getByRole('textbox', { name: d.roles.notesTextbox })).toBeVisible();
await expect(page.getByText(d.labels.message)).toBeVisible();
await expect(page.getByRole('textbox', { name: d.roles.messageTextbox })).toBeVisible();
await page.getByRole('textbox', { name: d.roles.notesTextbox }).click();
await page.getByRole('textbox', { name: d.roles.notesTextbox }).fill(d.values.notes);
await page.getByRole('textbox', { name: d.roles.messageTextbox }).click();
await page.getByRole('textbox', { name: d.roles.messageTextbox }).fill(d.values.message);
await expect(page.getByText('documents')).toBeVisible();
await expect(page.locator('div').filter({ hasText: /^Eligibility\.pdf$/ })).toBeVisible();
await expect(page.locator('div').filter({ hasText: /^instruction\.pdf$/ })).toBeVisible();
await expect(page.locator('div').filter({ hasText: /^doc5\.pdf$/ })).toBeVisible();
await expect(page.getByRole('link', { name: 'doc4.pdf' })).toBeVisible();
await expect(page.getByRole('link', { name: 'Institutional.pdf' })).toBeVisible();
await page.getByText('documents').click();

await expect(page.getByText('Payer Selection')).toBeVisible();
await expect(page.getByText('id', { exact: true })).toBeVisible();
await expect(page.getByText('1', { exact: true })).toBeVisible();
await expect(page.getByText('Enrollment Type', { exact: true })).toBeVisible();
await expect(page.getByText(userData.groupEnroll.enrollmentTypeP, { exact: true })).toBeVisible();
await expect(page.locator('app-add-group-enrollments-modal')).toContainText(userData.groupEnroll.enrollmentTypeP);
await expect(page.getByText('scId')).toBeVisible();
await expect(page.locator('app-add-group-enrollments-modal')).toContainText(userData.groupEnroll.payerID);
await expect(page.getByText(userData.groupEnroll.payerID, { exact: true })).toBeVisible();
await expect(page.getByText('Processor Id')).toBeVisible();
await expect(page.getByText(userData.groupEnroll.processorId)).toBeVisible();
await expect(page.locator('app-add-group-enrollments-modal')).toContainText(userData.groupEnroll.processorId);
await expect(page.getByRole('button', { name: d.labels.back })).toBeVisible();
await expect(page.getByRole('button', { name: d.labels.save })).toBeVisible();
await page.getByRole('button', { name: d.labels.save }).click();

await expect(page.getByLabel(/Group Enrollment Type \(requiresEnrollment\): \d+ was created successfully!/)).toBeVisible();
await expect(page.getByLabel(/Group Enrollment Type \(eligibilityEnrollment\): \d+ was created successfully!/)).toBeVisible();

await expect(page.getByRole('heading', { name: d.labels.groupEnrollmentSaved })).toBeVisible();
await expect(page.getByRole('heading')).toContainText(d.labels.groupEnrollmentSaved);
await expect(page.locator('app-modal')).toContainText(d.labels.addAnotherPrompt);
await expect(page.getByRole('button', { name: d.labels.no })).toBeVisible();
await expect(page.getByRole('button', { name: d.labels.yes })).toBeVisible();
await expect(page.locator('app-modal')).toContainText(d.labels.no);
await expect(page.locator('app-modal')).toContainText(d.labels.yes);
await page.getByRole('button', { name: d.labels.no }).click();
await expect(page.getByText(d.labels.groupEnrollmentGrid, { exact: true })).toBeVisible();
await expect(page.getByRole('cell', { name: userData.groupEnroll.groupId }).first()).toBeVisible();
await expect(page.getByRole('cell', { name: userData.groupEnroll.NPI }).first()).toBeVisible();
await expect(page.getByRole('cell', { name: userData.groupEnroll.taxID }).first()).toBeVisible();

const payerNameWithoutDash = userData.groupEnroll.payerName.replace(/-/g, '');
await expect(page.getByRole('cell', { name: payerNameWithoutDash }).first()).toBeVisible();

await expect(page.getByRole('cell', { name: userData.groupEnroll.enrollmentTypeL }).first()).toBeVisible();
await expect(page.getByRole('cell', { name: userData.groupEnroll.processorId }).first()).toBeVisible();
await expect(page.getByRole('cell', { name: userData.groupEnroll.enrollmentTypeP }).first()).toBeVisible();
const todaydateYr = await getTodaysDateWithFullYear();
console.log('todaydateYr:', todaydateYr);
await expect(page.getByRole('cell', { name: todaydateYr }).first()).toBeVisible();
await expect(page.getByRole('cell', { name: todaydateYr }).nth(1)).toBeVisible();
});

test('Single payer enrollment modal field visibility and availability checks', async ({ page, loginAsAdmin }) => {
  await loginAsAdmin();
  await openAddGroupEnrollment(page);

  await expect(page.getByRole('heading', { name: d.labels.addGroupEnrollmentsHeading })).toBeVisible();
  await expect(page.getByRole('dialog').getByText(d.labels.groupId, { exact: true })).toBeVisible();
  await expect(page.getByRole('dialog').getByText(d.labels.npi, { exact: true })).toBeVisible();
  await expect(page.getByText(d.labels.taxId, { exact: true })).toBeVisible();
  await expect(page.locator(d.selectors.npiSelect)).toBeDisabled();
  await expect(page.locator(d.selectors.taxIdSelect)).toBeDisabled();
});

test('Single payer enrollment invalid group value should keep dependent dropdowns disabled', async ({ page, loginAsAdmin }) => {
  await loginAsAdmin();
  await openAddGroupEnrollment(page);

  // The invalid group id should not enable dependent dropdowns when not selectable.
  await page.locator(d.selectors.groupArrow).click();
  await expect(page.getByRole('option', { name: d.edgeCases.invalidGroupId })).toHaveCount(0);
  await expect(page.locator(d.selectors.npiSelect)).toBeDisabled();
  await expect(page.locator(d.selectors.taxIdSelect)).toBeDisabled();
});
