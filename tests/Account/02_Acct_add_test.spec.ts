
import * as userData from '../../testData/UserInfo.json';
import * as d from '../../testData/AcctAddTestData.json';
import { executeQuery } from '../../testData/database.utils';
import * as fs from 'fs';
import * as path from 'path';
import { test, expect } from '../myTestData';
import { navigateToAccounts } from '../framework/navigation.helper';

let currentAccountNumber = parseInt(userData.accountUniqueIncNum); // 1
let newAccountNum = `${d.dynamic.accountNumberPrefix}${String(currentAccountNumber).padStart(d.dynamic.sequencePad, '0')}`;
let acctname = `${d.dynamic.accountNamePrefix}${String(currentAccountNumber).padStart(d.dynamic.sequencePad, '0')}`;

test('Account Add functional, screen control/elements verification test execution', async ({ page, loginAsAdmin }) => {
  await loginAsAdmin();

  await navigateToAccounts(page);
  await page.locator(d.selectors.accountsApp).getByText(d.labels.accounts, { exact: true }).click();
  await expect(page.getByRole('link', { name: ` ${d.labels.addAccount}` })).toBeVisible();
  await expect(page.getByRole('link', { name: ` ${d.labels.addAccount}` })).toContainText(d.labels.addAccount);
  await page.getByRole('link', { name: ` ${d.labels.addAccount}` }).click();

  await expect(page.getByRole('heading', { name: d.labels.createNewAccount })).toBeVisible();
  await expect(page.getByRole('heading', { name: d.labels.createNewAccount })).toHaveText(d.labels.createNewAccount);

  await expect(page.getByText(d.labels.accountNumberRequired)).toBeVisible();
  await expect(page.getByText(d.labels.accountNumberRequired)).toContainText('account number');
  await expect(page.getByText(d.labels.accountNameRequired)).toBeVisible();
  await expect(page.getByText(d.labels.accountNameRequired)).toContainText('account Name');
  await expect(page.getByText(d.labels.practiceManagementRequired)).toBeVisible();
  await expect(page.getByText(d.labels.practiceManagementRequired)).toContainText('Practice Management');
  await expect(page.getByText(d.labels.taxExemptNumber)).toBeVisible();
  await expect(page.getByText(d.labels.taxExemptNumber)).toHaveText(d.labels.taxExemptNumber);
  await expect(page.getByText(d.labels.address1)).toBeVisible();
  await expect(page.getByText(d.labels.address1)).toHaveText(d.labels.address1);
  await expect(page.getByText(d.labels.address2)).toBeVisible();
  await expect(page.getByText(d.labels.address2)).toHaveText(d.labels.address2);
  await expect(page.getByText(d.labels.zip, { exact: true })).toBeVisible();
  await expect(page.getByText(d.labels.zip, { exact: true })).toHaveText(d.labels.zip);
  await expect(page.getByRole('dialog').getByText(d.labels.city, { exact: true })).toBeVisible();
  await expect(page.getByRole('dialog').getByText(d.labels.city, { exact: true })).toHaveText(d.labels.city);
  await expect(page.getByText(d.labels.state, { exact: true })).toBeVisible();
  await expect(page.getByText(d.labels.state, { exact: true })).toHaveText(d.labels.state);
  await expect(page.getByText(d.labels.creditCardNumber)).toBeVisible();
  await expect(page.getByText(d.labels.creditCardNumber)).toHaveText(d.labels.creditCardNumber);
  await expect(page.getByText(d.labels.expiration)).toBeVisible();
  await expect(page.getByText(d.labels.expiration)).toHaveText(d.labels.expiration);
  await expect(page.getByText(d.labels.accountExport)).toBeVisible();
  await expect(page.getByText(d.labels.accountExport)).toHaveText(d.labels.accountExport);
  await expect(page.getByText(d.labels.notes)).toBeVisible();
  await expect(page.getByText(d.labels.notes)).toHaveText(d.labels.notes);
  await expect(page.getByText(d.labels.contact)).toBeVisible();
  await expect(page.getByText(d.labels.contact)).toHaveText(d.labels.contact);
  await expect(page.getByText(d.labels.phone)).toBeVisible();
  await expect(page.getByText(d.labels.phone)).toHaveText(d.labels.phone);
  await expect(page.getByText(d.labels.fax)).toBeVisible();
  await expect(page.getByText(d.labels.fax)).toHaveText(d.labels.fax);
  await expect(page.getByText(d.labels.email)).toBeVisible();
  await expect(page.getByText(d.labels.email)).toHaveText(d.labels.email);
  await expect(page.locator('checkbox').filter({ hasText: d.labels.ecs })).toBeVisible();
  await expect(page.locator('checkbox').filter({ hasText: d.labels.ecs })).toHaveText(d.labels.ecs);
  await expect(page.locator('label').filter({ hasText: d.labels.era })).toBeVisible();
  await expect(page.locator('label').filter({ hasText: d.labels.era })).toHaveText(d.labels.era);
  await expect(page.locator('label').filter({ hasText: d.labels.claimStatus })).toBeVisible();
  await expect(page.locator('label').filter({ hasText: d.labels.claimStatus })).toHaveText(d.labels.claimStatus);
  await expect(page.locator('label').filter({ hasText: d.labels.eligibility })).toBeVisible();
  await expect(page.locator('label').filter({ hasText: d.labels.eligibility })).toHaveText(d.labels.eligibility);
  await expect(page.locator('label').filter({ hasText: d.labels.statements })).toBeVisible();
  await expect(page.locator('label').filter({ hasText: d.labels.statements })).toHaveText(d.labels.statements);

  // Function to get today's date in 'MM/DD/YY' format
  const getTodaysDate = () => {
    const today = new Date();
    const day = String(today.getDate()).padStart(2, '0');
    const month = String(today.getMonth() + 1).padStart(2, '0'); // Month is 0-indexed
    const year = today.getFullYear().toString().slice(-2);
    return `${month}/${day}/${year}`;
  };

  const expectedDate = getTodaysDate();
  console.log('Todays date:', expectedDate);

  await expect(page.getByText(expectedDate).first()).toBeVisible();
  await expect(page.getByText(expectedDate).first()).toHaveText(expectedDate);
  await expect(page.getByText(d.labels.na).first()).toBeVisible();
  await expect(page.getByText(d.labels.na).first()).toHaveText(d.labels.na);
  await expect(page.getByText(d.labels.na).nth(1)).toBeVisible();
  await expect(page.getByText(d.labels.na).nth(1)).toHaveText(d.labels.na);
  await expect(page.getByText(d.labels.na).nth(2)).toBeVisible();
  await expect(page.getByText(d.labels.na).nth(2)).toHaveText(d.labels.na);
  await expect(page.getByText(d.labels.na).nth(3)).toBeVisible();
  await expect(page.getByText(d.labels.na).nth(3)).toHaveText(d.labels.na);
  // Increment the number - generate unique account number on runtime
  // Get the auto-increment number from userinfo.json
  console.log(`New account: ${newAccountNum}`);
  const getacctnum = d.db.getAccountCount;
  const params = [newAccountNum];
  const result = await executeQuery(getacctnum, params);
  console.log('Query result:', result, 'here comes params', params);

  if (result && result.length > 0 && result[0].count > 0) {
    currentAccountNumber++;
    newAccountNum = `${d.dynamic.accountNumberPrefix}${String(currentAccountNumber).padStart(d.dynamic.sequencePad, '0')}`;
    console.log(`Creating account: ${newAccountNum}`);
    acctname = `${d.dynamic.accountNamePrefix}${String(currentAccountNumber).padStart(d.dynamic.sequencePad, '0')}`;
    const deleteaccount = d.db.deleteAccount;
    const deleteParams = [newAccountNum];
    await executeQuery(deleteaccount, deleteParams);
    console.log('Account deleted:', deleteaccount, deleteParams);
  }

  // Using the number in the test
  await expect(page.getByRole('textbox', { name: d.roles.accountNumberTextbox })).toBeVisible();
  await expect(page.getByRole('textbox', { name: d.roles.accountNumberTextbox })).toBeEditable();
  console.log('newAccountNum on dashboard', newAccountNum);
  await page.getByRole('textbox', { name: d.roles.accountNumberTextbox }).fill(newAccountNum);
  await expect(page.getByRole('textbox', { name: d.roles.accountNameTextbox })).toBeVisible();
  await expect(page.getByRole('textbox', { name: d.roles.accountNameTextbox })).toBeEditable();
  console.log('acctname on dashboard', acctname);
  await page.getByRole('textbox', { name: d.roles.accountNameTextbox }).fill(acctname);
  await page.getByRole('dialog').locator(d.selectors.dialogSelect).selectOption(d.values.practiceManagementOption);
  await expect(page.getByRole('textbox', { name: d.roles.taxNumberTextbox })).toBeVisible();
  await page.getByRole('textbox', { name: d.roles.taxNumberTextbox }).fill(d.values.taxNumber);
  await expect(page.getByRole('textbox', { name: d.roles.addressTextbox }).first()).toBeVisible();
  await page.getByRole('textbox', { name: d.roles.addressTextbox }).first().fill(userData.Useraddress.address1);

  await page.locator(d.selectors.zipInput).first().click();
  await page.locator(d.selectors.zipInput).first().fill(d.values.zip);
  await page.getByRole('option', { name: d.values.zipOption }).click();
  await page.locator(d.selectors.cityInput).click();
  await page.getByRole('option', { name: d.values.cityOption }).click();
  await page.locator(d.selectors.stateInput).click();

  await page.getByRole('textbox', { name: d.roles.ccLast4Textbox }).fill(d.values.taxNumber);
  await page.getByRole('textbox', { name: d.roles.expiryTextbox }).click();
  await page.getByRole('textbox', { name: d.roles.expiryTextbox }).fill(d.values.expiryDate);
  await page.getByRole('textbox', { name: d.roles.notesTextbox }).click();
  await page.getByRole('textbox', { name: d.roles.notesTextbox }).fill(d.values.notes);

  await expect(page.getByRole('button', { name: d.roles.addAndClose })).toBeEnabled();
  await expect(page.getByRole('button', { name: d.roles.addAndClose })).toBeVisible();
  await expect(page.getByRole('button', { name: d.roles.addAndClose })).toHaveText(d.roles.addAndClose);
  await page.getByRole('button', { name: d.roles.addAndClose }).click();
});

test('Created Account Details verification tests execution', async ({ page, loginAsAdmin }) => {
  await loginAsAdmin();

  await page.locator(d.selectors.accountsSidebarLink).click();
  await page.goto(userData.accountsdashboardurl);
  await expect(page.locator(d.selectors.accountsApp).getByText(d.labels.accounts, { exact: true })).toBeVisible();
  await expect(page.getByText(d.labels.accountNumberFilter, { exact: true })).toBeVisible();
  await expect(page.getByRole('textbox', { name: d.roles.accountNumberFilterTextbox })).toBeVisible();
  await expect(page.getByRole('textbox', { name: d.roles.accountNumberFilterTextbox })).toBeEditable();
  console.log('newAccountNum on dashboard', newAccountNum);
  await page.getByRole('textbox', { name: d.roles.accountNumberFilterTextbox }).fill(newAccountNum);
  await page.getByRole('button', { name: d.labels.applyFilter }).click();

  await expect(page.getByRole('columnheader', { name: d.columnHeaders.accountNumber })).toBeVisible();
  await expect(page.getByRole('columnheader', { name: d.columnHeaders.name, exact: true })).toBeVisible();
  await expect(page.getByRole('columnheader', { name: d.columnHeaders.state })).toBeVisible();
  await expect(page.getByRole('columnheader', { name: d.columnHeaders.address })).toBeVisible();
  await expect(page.getByRole('columnheader', { name: d.columnHeaders.contactName })).toBeVisible();
  await expect(page.getByRole('cell', { name: newAccountNum }).first()).toBeVisible();
  await expect(page.locator('td').filter({ hasText: acctname })).toBeVisible();
  await expect(page.getByRole('cell', { name: d.values.stateCell })).toBeVisible();

  const fullText = userData.Useraddress.city;
  const extractedSubstring = fullText.substring(0, 6);
  console.log('Extracted string:', extractedSubstring);

  // Writing to json file the created account number
  const dataPath = path.resolve(__dirname, '../tempuserdata.json');
  // Read current data, update, and write back
  const rawData = fs.readFileSync(dataPath, 'utf-8');
  const data = JSON.parse(rawData);
  data.editaccountnumber = newAccountNum;

  console.log('data.editaccountnumber', data.editaccountnumber, 'data', data, 'rawData', rawData);
  fs.writeFileSync(dataPath, JSON.stringify(data, null, 2));

  await expect(page.getByRole('cell', { name: userData.Useraddress.address1 })).toBeVisible();
  await expect(page.getByRole('link').filter({ hasText: /^$/ }).nth(2)).toBeVisible();
  await page.getByRole('link').filter({ hasText: /^$/ }).nth(2).click();
  await expect(page.getByRole('button', { name: d.labels.editAccount })).toBeVisible();
  await expect(page.getByRole('button', { name: d.labels.editAccount })).toHaveText(d.labels.editAccount);
  await page.getByRole('button', { name: d.labels.editAccount }).click();
  await page.getByRole('heading', { name: d.labels.editAccount }).click();
  await page.getByRole('link', { name: d.selectors.javascriptLink }).click();
  await page.getByRole('link').filter({ hasText: /^$/ }).nth(2).click();
  await expect(page.getByRole('button', { name: d.labels.deactivateAccount })).toBeVisible();
  await page.getByRole('button', { name: d.labels.deactivateAccount }).click();
  await page.getByRole('link').click();
  await page.getByRole('link').filter({ hasText: /^$/ }).nth(2).click();
  await expect(page.getByRole('button', { name: d.labels.addProviderGroup })).toBeVisible();
  await page.getByRole('button', { name: d.labels.addProviderGroup }).click();
  await expect(page.getByRole('heading', { name: d.labels.createProviderGroup })).toBeVisible();
  await page.getByRole('link', { name: d.selectors.javascriptLink }).click();
});

test('Account Add page required fields and controls visibility/availability check', async ({ page, loginAsAdmin }) => {
  await loginAsAdmin();
  await navigateToAccounts(page);
  await page.getByRole('link', { name: ` ${d.labels.addAccount}` }).click();

  await expect(page.getByRole('heading', { name: d.labels.createNewAccount })).toBeVisible();
  await expect(page.getByRole('textbox', { name: d.roles.accountNumberTextbox })).toBeVisible();
  await expect(page.getByRole('textbox', { name: d.roles.accountNumberTextbox })).toBeEditable();
  await expect(page.getByRole('textbox', { name: d.roles.accountNameTextbox })).toBeVisible();
  await expect(page.getByRole('textbox', { name: d.roles.accountNameTextbox })).toBeEditable();
  await expect(page.getByRole('textbox', { name: d.roles.taxNumberTextbox })).toBeVisible();
  await expect(page.getByRole('textbox', { name: d.roles.addressTextbox }).first()).toBeVisible();
  await expect(page.getByRole('textbox', { name: d.roles.expiryTextbox })).toBeVisible();
  await expect(page.getByRole('textbox', { name: d.roles.notesTextbox })).toBeVisible();
  await expect(page.getByRole('button', { name: d.roles.addAndClose })).toBeVisible();
  await expect(page.getByRole('button', { name: d.roles.addAndClose })).toBeDisabled();
});

test('Account Add form should allow typing and clearing mandatory text fields', async ({ page, loginAsAdmin }) => {
  await loginAsAdmin();
  await navigateToAccounts(page);
  await page.getByRole('link', { name: ` ${d.labels.addAccount}` }).click();

  const accountNumberInput = page.getByRole('textbox', { name: d.roles.accountNumberTextbox });
  const accountNameInput = page.getByRole('textbox', { name: d.roles.accountNameTextbox });

  await accountNumberInput.fill('TEMP-ACCOUNT-01');
  await accountNameInput.fill('TEMP-ACCOUNT-NAME-01');
  await expect(accountNumberInput).toHaveValue('TEMP-ACCOUNT-01');
  await expect(accountNameInput).toHaveValue('TEMP-ACCOUNT-NAME-01');

  await accountNumberInput.clear();
  await accountNameInput.clear();
  await expect(accountNumberInput).toHaveValue('');
  await expect(accountNameInput).toHaveValue('');
  await expect(page.getByRole('button', { name: d.roles.addAndClose })).toBeDisabled();
});

test('Account filter should handle invalid/non-existing account number gracefully', async ({ page, loginAsAdmin }) => {
  await loginAsAdmin();
  await navigateToAccounts(page);

  await expect(page.getByRole('textbox', { name: d.roles.accountNumberFilterTextbox })).toBeVisible();
  await page.getByRole('textbox', { name: d.roles.accountNumberFilterTextbox }).fill(d.edgeCases.invalidAccountNumber);
  await page.getByRole('button', { name: d.labels.applyFilter }).click();

  await expect(page.getByRole('cell', { name: d.edgeCases.invalidAccountNumber })).toHaveCount(0);
  await expect(page.getByText(d.labels.noResults).first()).toBeVisible();
});


