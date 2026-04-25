
import * as userData from '../testData/UserInfo.json';
import { executeQuery } from '../testData/database.utils';
import LoginPage from '../testData/LoginPage';
import * as fs from 'fs';
import * as path from 'path';
import { test, expect } from './myTestData';
import { Locator, Page } from '@playwright/test';

let currentAccountNumber = parseInt(userData.accountUniqueIncNum); // 1
let newAccountNum = `SCAutoAcctNum-0${currentAccountNumber}`;
let acctname = `SCAutoAcct-0${currentAccountNumber}`;

test('Account Add functional, screen control/elements verification test execution', async ({ page, loginAsAdmin }) => {
  await loginAsAdmin();

  await expect(page.getByRole('link', { name: ' Accounts' })).toBeVisible();
  await expect(page.getByRole('link', { name: ' Accounts' })).toContainText('Accounts');
  await page.getByRole('link', { name: ' Accounts' }).click();
  await expect(page.locator('app-accounts').getByText('Accounts', { exact: true })).toHaveText('Accounts');
  await page.locator('app-accounts').getByText('Accounts', { exact: true }).click();
  await expect(page.getByRole('link', { name: ' Add Account' })).toBeVisible();
  await expect(page.getByRole('link', { name: ' Add Account' })).toContainText('Add Account');
  await page.getByRole('link', { name: ' Add Account' }).click();

  await expect(page.getByRole('heading', { name: 'Create New Account' })).toBeVisible();
  await expect(page.getByRole('heading', { name: 'Create New Account' })).toHaveText('Create New Account');

  await expect(page.getByText('* account number')).toBeVisible();
  await expect(page.getByText('* account number')).toContainText('account number');
  await expect(page.getByText('* account Name')).toBeVisible();
  await expect(page.getByText('* account Name')).toContainText('account Name');
  await expect(page.getByText('* Practice Management')).toBeVisible();
  await expect(page.getByText('* Practice Management')).toContainText('Practice Management');
  await expect(page.getByText('Tax exempt number')).toBeVisible();
  await expect(page.getByText('Tax exempt number')).toHaveText('Tax exempt number');
  await expect(page.getByText('Address 1')).toBeVisible();
  await expect(page.getByText('Address 1')).toHaveText('Address 1');
  await expect(page.getByText('address 2')).toBeVisible();
  await expect(page.getByText('address 2')).toHaveText('address 2');
  await expect(page.getByText('Zip', { exact: true })).toBeVisible();
  await expect(page.getByText('Zip', { exact: true })).toHaveText('Zip');
  await expect(page.getByRole('dialog').getByText('City', { exact: true })).toBeVisible();
  await expect(page.getByRole('dialog').getByText('City', { exact: true })).toHaveText('City');
  await expect(page.getByText('state', { exact: true })).toBeVisible();
  await expect(page.getByText('state', { exact: true })).toHaveText('state');
  await expect(page.getByText('credit card number')).toBeVisible();
  await expect(page.getByText('credit card number')).toHaveText('credit card number');
  await expect(page.getByText('expiration')).toBeVisible();
  await expect(page.getByText('expiration')).toHaveText('expiration');
  await expect(page.getByText('Account Export')).toBeVisible();
  await expect(page.getByText('Account Export')).toHaveText('Account Export');
  await expect(page.getByText('Notes')).toBeVisible();
  await expect(page.getByText('Notes')).toHaveText('Notes');
  await expect(page.getByText('Contact')).toBeVisible();
  await expect(page.getByText('Contact')).toHaveText('Contact');
  await expect(page.getByText('Phone')).toBeVisible();
  await expect(page.getByText('Phone')).toHaveText('Phone');
  await expect(page.getByText('Fax')).toBeVisible();
  await expect(page.getByText('Fax')).toHaveText('Fax');
  await expect(page.getByText('email')).toBeVisible();
  await expect(page.getByText('email')).toHaveText('email');
  await expect(page.locator('checkbox').filter({ hasText: 'ECS' })).toBeVisible();
  await expect(page.locator('checkbox').filter({ hasText: 'ECS' })).toHaveText('ECS');
  await expect(page.locator('label').filter({ hasText: 'ERA' })).toBeVisible();
  await expect(page.locator('label').filter({ hasText: 'ERA' })).toHaveText('ERA');
  await expect(page.locator('label').filter({ hasText: 'Claim Status' })).toBeVisible();
  await expect(page.locator('label').filter({ hasText: 'Claim Status' })).toHaveText('Claim Status');
  await expect(page.locator('label').filter({ hasText: 'Eligibility' })).toBeVisible();
  await expect(page.locator('label').filter({ hasText: 'Eligibility' })).toHaveText('Eligibility');
  await expect(page.locator('label').filter({ hasText: 'Statements' })).toBeVisible();
  await expect(page.locator('label').filter({ hasText: 'Statements' })).toHaveText('Statements');

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
  await expect(page.getByText(expectedDate).nth(1)).toBeVisible();
  await expect(page.getByText(expectedDate).nth(1)).toHaveText(expectedDate);
  await expect(page.getByText('N/A').first()).toBeVisible();
  await expect(page.getByText('N/A').first()).toHaveText('N/A');
  await expect(page.getByText('N/A').nth(1)).toBeVisible();
  await expect(page.getByText('N/A').nth(1)).toHaveText('N/A');
  await expect(page.getByText('N/A').nth(2)).toBeVisible();
  await expect(page.getByText('N/A').nth(2)).toHaveText('N/A');

  // Increment the number - generate unique account number on runtime
  // Get the auto-increment number from userinfo.json
  console.log(`New account: ${newAccountNum}`);
  const getacctnum = 'SELECT count(*) FROM account WHERE accountnumber = $1';
  const params = [newAccountNum];
  const result = await executeQuery(getacctnum, params);
  console.log('Query result:', result, 'here comes params', params);

  if (result && result.length > 0 && result[0].count > 0) {
    currentAccountNumber++;
    newAccountNum = `SCAutoAcctNum-${currentAccountNumber}`;
    console.log(`Creating account: ${newAccountNum}`);
    acctname = `SCAutoAcct-${newAccountNum}`;
    const deleteaccount = 'DELETE FROM account WHERE accountnumber = $1';
    const deleteParams = [newAccountNum];
    await executeQuery(deleteaccount, deleteParams);
    console.log('Account deleted:', deleteaccount, deleteParams);
  }

  // Using the number in the test
  await expect(page.getByRole('textbox', { name: 'accountNumber' })).toBeVisible();
  await expect(page.getByRole('textbox', { name: 'accountNumber' })).toBeEditable();
  console.log('newAccountNum on dashboard', newAccountNum);
  await page.getByRole('textbox', { name: 'accountNumber' }).fill(newAccountNum);
  await expect(page.getByRole('textbox', { name: 'Enter Name' })).toBeVisible();
  await expect(page.getByRole('textbox', { name: 'Enter Name' })).toBeEditable();
  console.log('acctname on dashboard', acctname);
  await page.getByRole('textbox', { name: 'Enter Name' }).fill(acctname);
  await page.getByRole('dialog').locator('select').selectOption('TST');
  await expect(page.getByRole('textbox', { name: 'Enter Tax Number' })).toBeVisible();
  await page.getByRole('textbox', { name: 'Enter Tax Number' }).fill('1234');
  await expect(page.getByRole('textbox', { name: 'Enter Address' }).first()).toBeVisible();
  await page.getByRole('textbox', { name: 'Enter Address' }).first().fill(userData.Useraddress.address1);

  await page.locator('.address-wrapper > div > .ng-select-searchable > .ng-select-container > .ng-value-container > .ng-input > input').first().click();
  await page.locator('.address-wrapper > div > .ng-select-searchable > .ng-select-container > .ng-value-container > .ng-input > input').first().fill('75001');
  await page.getByRole('option', { name: '(Addison - TX)' }).click();
  await page.locator('div:nth-child(2) > .ng-select-searchable > .ng-select-container > .ng-value-container > .ng-input > input').click();
  await page.getByRole('option', { name: 'Addison (TX - 75001)' }).click();
  await page.locator('div:nth-child(3) > .ng-select-searchable > .ng-select-container > .ng-value-container > .ng-input > input').click();

  await page.getByRole('textbox', { name: 'Last 4 Digits' }).fill('1234');
  await page.getByRole('textbox', { name: 'Enter expiration date' }).click();
  await page.getByRole('textbox', { name: 'Enter expiration date' }).fill('12/30');
  await page.getByRole('textbox', { name: 'Enter Notes' }).click();
  await page.getByRole('textbox', { name: 'Enter Notes' }).fill('by Company');

  await expect(page.getByRole('button', { name: 'Add & Close' })).toBeEnabled();
  await expect(page.getByRole('button', { name: 'Add & Close' })).toBeVisible();
  await expect(page.getByRole('button', { name: 'Add & Close' })).toHaveText('Add & Close');
  await page.getByRole('button', { name: 'Add & Close' }).click();
});

test('Created Account Details verification tests execution', async ({ page }) => {
  let loginPage = new LoginPage(page);
  await loginPage.navigate();
  await loginPage.login(userData.admin.username, userData.admin.password);

  await page.getByRole('link', { name: ' Accounts' }).click();
  await page.goto(userData.accountsdashboardurl);
  await expect(page.locator('app-accounts').getByText('Accounts', { exact: true })).toBeVisible();
  await expect(page.getByText('Account Number', { exact: true })).toBeVisible();
  await expect(page.getByRole('textbox', { name: 'Enter Account Number' })).toBeVisible();
  await expect(page.getByRole('textbox', { name: 'Enter Account Number' })).toBeEditable();
  console.log('newAccountNum on dashboard', newAccountNum);
  await page.getByRole('textbox', { name: 'Enter Account Number' }).fill(newAccountNum);
  await page.getByRole('button', { name: 'Apply Filter' }).click();

  await expect(page.getByRole('columnheader', { name: 'account number ' })).toBeVisible();
  await expect(page.getByRole('columnheader', { name: 'Name', exact: true })).toBeVisible();
  await expect(page.getByRole('columnheader', { name: 'State' })).toBeVisible();
  await expect(page.getByRole('columnheader', { name: 'Address' })).toBeVisible();
  await expect(page.getByRole('columnheader', { name: 'contact Name' })).toBeVisible();
  await expect(page.getByRole('cell', { name: newAccountNum }).first()).toBeVisible();
  await expect(page.locator('td').filter({ hasText: acctname })).toBeVisible();
  await expect(page.getByRole('cell', { name: 'LA' })).toBeVisible();

  const fullText = userData.Useraddress.city;
  const extractedSubstring = fullText.substring(0, 6);
  console.log('Extracted string:', extractedSubstring);

  // Writing to json file the created account number
  const dataPath = path.resolve(__dirname, 'tempuserdata.json');
  // Read current data, update, and write back
  const rawData = fs.readFileSync(dataPath, 'utf-8');
  const data = JSON.parse(rawData);
  data.editaccountnumber = newAccountNum;

  console.log('data.editaccountnumber', data.editaccountnumber, 'data', data, 'rawData', rawData);
  fs.writeFileSync(dataPath, JSON.stringify(data, null, 2));

  await expect(page.getByRole('cell', { name: userData.Useraddress.address1 })).toBeVisible();
  await expect(page.getByRole('link').filter({ hasText: /^$/ }).nth(2)).toBeVisible();
  await page.getByRole('link').filter({ hasText: /^$/ }).nth(2).click();
  await expect(page.getByRole('button', { name: 'Edit Account' })).toBeVisible();
  await expect(page.getByRole('button', { name: 'Edit Account' })).toHaveText('Edit Account');
  await page.getByRole('button', { name: 'Edit Account' }).click();
  await page.getByRole('heading', { name: 'Edit Account' }).click();
  await page.getByRole('link', { name: 'javascript' }).click();
  await page.getByRole('link').filter({ hasText: /^$/ }).nth(2).click();
  await expect(page.getByRole('button', { name: 'Deactivate Account' })).toBeVisible();
  await page.getByRole('button', { name: 'Deactivate Account' }).click();
  await page.getByRole('link').click();
  await page.getByRole('link').filter({ hasText: /^$/ }).nth(2).click();
  await expect(page.getByRole('button', { name: 'Add Provider Group' })).toBeVisible();
  await page.getByRole('button', { name: 'Add Provider Group' }).click();
  await expect(page.getByRole('heading', { name: 'Create Provider Group' })).toBeVisible();
  await page.getByRole('link', { name: 'javascript' }).click();
});


