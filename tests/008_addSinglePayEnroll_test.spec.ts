
import { test, expect, Locator, Page } from '@playwright/test';
import * as userData from '../testData/UserInfo.json';
import LoginPage from '../testData/LoginPage';
import helperFunction from '../testData/helperFunction';
import { existsGroupEnrollment, existsSingleGroupEnrollment, fetchNPIAndTaxIDForGroupId, getTodaysDateWithFullYear, getTodaysDateWithYr } from '../testData/database.utils';
// Adding single payer enrollment for groupid G00014
let page: Page;

// Setup: runs before each test
test.beforeEach(async ({ browser }) => {
  page = await browser.newPage();
});
test('Add Single Pay Enrollment ', async ({ page }) => {

  // --- Login ---
  const loginPage = new LoginPage(page);
  await loginPage.navigate();
  await loginPage.login(userData.admin.username, userData.admin.password);
  await expect(page).toHaveURL(userData.admin.dashboardUrl);
  const groupId = userData.groupEnroll.groupId;
  // --- Pre-checks and navigation ---
  const verifyEnrollmentExists = await existsSingleGroupEnrollment(groupId);
  await page.getByRole('link', { name: ' Group Enrollments' }).click();
  await page.getByRole('link', { name: ' Add Group Enrollment' }).click();

  // --- Initial dropdown state checks ---
  const initialgroupSelect = page.getByRole('combobox').filter({ hasText: /^$/ });
  const npiCombo = page.locator('select[formcontrolname="npi"]');
await expect(npiCombo).toBeDisabled(); // Checks if disabled
const taxIdCombo = page.locator('select[formcontrolname="taxId"]');
await expect(taxIdCombo).toBeDisabled(); // Checks if disabled
  await expect(page.locator('div').filter({ hasText: 'Select Tax Id' }).nth(5)).toBeVisible();
  await expect(page.locator('div').filter({ hasText: 'Select NPI' }).nth(5)).toBeVisible();
  await expect(page.locator('div').filter({ hasText: /^Select NPI$/ })).toBeVisible();
  await expect(page.getByText('tax id', { exact: true })).toBeVisible();
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
  await expect(page.getByRole('heading', { name: 'Add Group Enrollments' })).toBeVisible();
  await expect(page.locator('app-add-group-enrollments-dialog-modal')).toContainText('Group Name');
  await expect(page.locator('app-add-group-enrollments-dialog-modal')).toContainText('N/A');
  await expect(page.getByRole('dialog').getByText('Group ID', { exact: true })).toBeVisible();
  await expect(page.getByRole('combobox').filter({ hasText: /^$/ })).toBeVisible();
  await expect(page.getByRole('dialog').getByText('NPI', { exact: true })).toBeVisible();
  await expect(page.locator('div').filter({ hasText: /^Select NPI$/ })).toBeVisible();
  await expect(page.locator('app-add-group-enrollments-dialog-modal')).toContainText('Select NPI');
  await expect(page.getByText('tax id', { exact: true })).toBeVisible();
  await expect(page.locator('app-add-group-enrollments-dialog-modal')).toContainText('Select Tax Id');
  await expect(page.locator('div').filter({ hasText: /^Select Tax Id$/ })).toBeVisible();
 
  await expect(page.getByRole('heading', { name: 'Add Group Enrollments' })).toBeVisible();
  await expect(page.locator('app-add-group-enrollments-dialog-modal')).toContainText('Group Name');  
  await expect(page.locator('app-add-group-enrollments-dialog-modal')).toContainText('N/A');
  await expect(page.getByRole('dialog').getByText('Group ID', { exact: true })).toBeVisible();
  await expect(page.getByRole('combobox').filter({ hasText: /^$/ })).toBeVisible();
  await expect(page.getByRole('dialog').getByText('NPI', { exact: true })).toBeVisible();
  await expect(page.locator('div').filter({ hasText: /^Select NPI$/ })).toBeVisible();
  await expect(page.locator('app-add-group-enrollments-dialog-modal')).toContainText('Select NPI');
  await expect(page.getByText('tax id', { exact: true })).toBeVisible();
  await expect(page.locator('app-add-group-enrollments-dialog-modal')).toContainText('Select Tax Id');
  await expect(page.locator('div').filter({ hasText: /^Select Tax Id$/ })).toBeVisible();
 // await page.getByText(userData.groupEnroll.groupId).click();
   await page.locator('.is-invalid > .ng-select-container > .ng-arrow-wrapper').click();
  await page.getByText(userData.groupEnroll.groupId ).click();
 
 //await page.getByRole('option', { name: userData.groupEnroll.groupId }).click();
  await expect(page.locator('app-add-group-enrollments-dialog-modal')).toContainText('Select Tax Id ');
  await page.getByRole('combobox').nth(1).selectOption(userData.groupEnroll.NPI);
  await page.getByRole('combobox').nth(2).selectOption(userData.groupEnroll.taxID);

await expect(page.getByRole('heading', { name: 'Add Group Enrollments' })).toBeVisible();
await expect(page.getByText('Group Name')).toBeVisible();
await expect(page.locator('app-add-group-enrollments-modal')).toContainText('LAKIN-KULAS');
await expect(page.getByRole('dialog').getByText('Group ID')).toBeVisible();
await expect(page.locator('app-add-group-enrollments-modal')).toContainText(userData.groupEnroll.groupId);
await expect(page.getByText(userData.groupEnroll.groupId)).toBeVisible();
await expect(page.getByRole('dialog').getByText('NPI')).toBeVisible();
await expect(page.getByText(userData.groupEnroll.NPI)).toBeVisible();
await expect(page.locator('app-add-group-enrollments-modal')).toContainText(userData.groupEnroll.NPI);
await expect(page.getByText('tax id', { exact: true })).toBeVisible();
await expect(page.getByText(userData.groupEnroll.taxID)).toBeVisible();
await expect(page.locator('app-add-group-enrollments-modal')).toContainText(userData.groupEnroll.taxID);
await expect(page.getByRole('dialog').getByText('Payer', { exact: true })).toBeVisible();
await expect(page.getByRole('combobox')).toBeVisible();
await expect(page.getByRole('combobox')).toBeVisible();
await page.getByRole('combobox').getByRole('textbox').click();
await page.getByRole('option', { name: userData.groupEnroll.payerName }).click();
await expect(page.getByRole('combobox')).toBeVisible();
await expect(page.getByRole('dialog').getByText('enrollment type')).toBeVisible();
await expect(page.locator('label').filter({ hasText: userData.groupEnroll.enrollmentTypeP })).toBeVisible();
await expect(page.getByRole('checkbox', { name: 'Institutional' })).toBeVisible();
await expect(page.locator('label').filter({ hasText: userData.groupEnroll.enrollmentTypeE })).toBeVisible();
await expect(page.locator('label').filter({ hasText: userData.groupEnroll.enrollmentTypeC })).toBeVisible();
await expect(page.locator('label').filter({ hasText: userData.groupEnroll.enrollmentTypeL })).toBeVisible();
await page.getByRole('checkbox', { name: userData.groupEnroll.enrollmentTypeP }).check();
await page.getByRole('checkbox', { name: userData.groupEnroll.enrollmentTypeL }).check();
await expect(page.getByText('Followup Date')).toBeVisible();
await page.getByRole('button').filter({ hasText: /^$/ }).click();
await page.getByLabel('Select year').selectOption('2035');
await page.getByText('23', { exact: true }).click();
await expect(page.getByRole('textbox', { name: 'mm/dd/yyyy' })).toHaveValue('03/23/2035');
await expect(page.getByRole('dialog').getByText('Case Number')).toBeVisible();
await page.getByRole('textbox', { name: 'Enter Case Number' }).click();
await page.getByRole('textbox', { name: 'Enter Case Number' }).fill('case-1234');
await expect(page.getByRole('textbox', { name: 'Enter Case Number' })).toBeVisible();
await expect(page.getByText('Notes')).toBeVisible();
await expect(page.getByRole('textbox', { name: 'Enter Notes' })).toBeVisible();
await expect(page.getByText('Message')).toBeVisible();
await expect(page.getByRole('textbox', { name: 'Enter Message' })).toBeVisible();
await page.getByRole('textbox', { name: 'Enter Notes' }).click();
await page.getByRole('textbox', { name: 'Enter Notes' }).fill('by group');
await page.getByRole('textbox', { name: 'Enter Message' }).click();
await page.getByRole('textbox', { name: 'Enter Message' }).fill('message');
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
await expect(page.getByRole('button', { name: 'Back' })).toBeVisible();
await expect(page.getByRole('button', { name: 'Save' })).toBeVisible();
await page.getByRole('button', { name: 'Save' }).click();

await expect(page.getByLabel(/Group Enrollment Type \(requiresEnrollment\): \d+ was created successfully!/)).toBeVisible();
await expect(page.getByLabel(/Group Enrollment Type \(eligibilityEnrollment\): \d+ was created successfully!/)).toBeVisible();

await expect(page.getByRole('heading', { name: 'Group Enrollment saved.' })).toBeVisible();
await expect(page.getByRole('heading')).toContainText('Group Enrollment saved.');
await expect(page.locator('app-modal')).toContainText('Group Enrollment saved. Do you want to add another Enrollment?');
await expect(page.getByRole('button', { name: 'No' })).toBeVisible();
await expect(page.getByRole('button', { name: 'Yes' })).toBeVisible();
await expect(page.locator('app-modal')).toContainText('No');
await expect(page.locator('app-modal')).toContainText('Yes');
await page.getByRole('button', { name: 'No' }).click();
await expect(page.getByText('Group Enrollment', { exact: true })).toBeVisible();
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
