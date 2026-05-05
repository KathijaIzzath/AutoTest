
import { test, expect } from './myTestData';
import * as userData from '../testData/UserInfo.json';
import LoginPage from '../testData/LoginPage';
import { deleteProviderAndBillingIdsByGroupId, fetchProviderIdByGroupId } from '../testData/database.utils';


test('Add provider via Accounts dashboard functionality & control/elements verification test execution', async ({ page, loginAsAdmin }) => {
  await deleteProviderAndBillingIdsByGroupId(userData.addProvider.groupeditInAcct);
  await loginAsAdmin();

  await page.getByRole('link', { name: ' Accounts' }).click();
  await page.getByRole('textbox', { name: 'Enter Account Number' }).click();
  await page.getByRole('textbox', { name: 'Enter Account Number' }).fill(userData.addProvider.accountNum);
  await page.getByRole('button', { name: 'Apply Filter' }).click();
  await page.getByRole('link').filter({ hasText: /^$/ }).nth(1).click();
  await expect(page.getByRole('cell', { name: userData.addProvider.groupeditInAcct, exact: true })).toBeVisible();

  await page.locator('div').filter({ hasText: /^Edit Provider GroupDeactivate GroupAdd Provider$/ }).first().click();
  await page.locator('providers-group-grid').getByRole('link').filter({ hasText: /^$/ }).click();
  await page.getByRole('button', { name: 'Add Provider' }).click();
   // await page.getByRole('link').filter({ hasText: /^$/ }).nth(4).click();
    await expect(page.getByRole('heading', { name: 'Add Provider Setup 1/' })).toBeVisible();
    await page.getByRole('textbox', { name: 'Enter First Name' }).click();
    await page.getByRole('textbox', { name: 'Enter First Name' }).fill('Add');
    await page.getByRole('textbox', { name: 'Enter Last Name' }).click();
    await page.getByRole('textbox', { name: 'Enter Last Name' }).fill('Provider01');
    await page.getByRole('textbox', { name: 'Enter Title' }).click();
    await page.getByRole('textbox', { name: 'Enter Title' }).fill('provtitle');
    await page.getByRole('button', { name: 'Next' }).click();
    await page.locator('qualifiers').getByRole('combobox').selectOption('11: Object');
    await page.getByRole('textbox', { name: 'Enter Id' }).click();
    await page.getByRole('textbox', { name: 'Enter Id' }).fill(userData.addProvider.providerTaxID);
    await page.getByRole('button', { name: 'Add Details' }).click();
    await page.locator('qualifiers').getByRole('combobox').selectOption('20: Object');
    await page.getByRole('textbox', { name: 'Enter Id' }).click();
    await page.getByRole('textbox', { name: 'Enter Id' }).fill(userData.addProvider.providerNPI);
    await page.getByRole('button', { name: 'Add Details' }).click();
    await page.getByRole('button', { name: 'Previous' }).click();
    await expect(page.getByText('Contact', { exact: true })).toBeVisible();
    await expect(page.getByRole('textbox', { name: 'Enter Contact' })).toHaveValue('KATHIJA');
    await expect(page.getByRole('textbox', { name: 'Enter Phone' })).toBeVisible();
    await expect(page.getByRole('textbox', { name: 'Enter Phone' })).toHaveValue('(843) 888-2882');
    await expect(page.getByText('* Practice Management')).toBeVisible();
    await expect(page.getByText('* Practice Management Select')).toBeVisible();
    await expect(page.getByText('* certification status')).toBeVisible();
    await expect(page.getByText('* certification status ProductionTest')).toBeVisible();
    await expect(page.getByRole('checkbox', { name: 'ECS' })).toBeVisible();
    await expect(page.getByText('ECS')).toBeVisible();
    await expect(page.getByRole('checkbox', { name: 'ERA' })).toBeVisible();
    await expect(page.getByRole('dialog').getByText('ERA', { exact: true })).toBeVisible();
    await expect(page.getByRole('checkbox', { name: 'Claim Status' })).toBeVisible();
    await expect(page.locator('label').filter({ hasText: 'Claim Status' })).toBeVisible();
    await expect(page.getByRole('checkbox', { name: 'Eligibility' })).toBeVisible();
    await expect(page.getByText('Eligibility', { exact: true })).toBeVisible();
    await expect(page.getByRole('checkbox', { name: 'Statements' })).toBeVisible();
    await expect(page.getByText('Statements')).toBeVisible();
    await expect(page.getByText('* fee schedule')).toBeVisible();
    await expect(page.getByRole('combobox').nth(1)).toBeVisible();
    await expect(page.getByRole('dialog').getByText('email')).toBeVisible();
    await expect(page.getByRole('textbox', { name: 'Enter Email' })).toBeVisible();
    await expect(page.getByRole('textbox', { name: 'Enter Email' })).toHaveValue('kmohamed@harriscomputer.com');
    await expect(page.getByText('Fax')).toBeVisible();
    await expect(page.getByRole('textbox', { name: 'Enter Fax' })).toBeVisible();
    await expect(page.getByText('Title')).toBeVisible();
    await expect(page.getByRole('textbox', { name: 'Enter Title' })).toBeVisible();
    await expect(page.getByText('Phone')).toBeVisible();
    await expect(page.getByRole('textbox', { name: 'Enter Phone' })).toBeVisible();
    await expect(page.getByText('mi', { exact: true })).toBeVisible();
    await expect(page.getByRole('textbox', { name: 'Enter MI' })).toBeVisible();
    await expect(page.getByText('degree')).toBeVisible();
    await expect(page.getByRole('textbox', { name: 'Enter Degree' })).toBeVisible();
    await expect(page.getByText('Address 1')).toBeVisible();
    await expect(page.getByRole('textbox', { name: 'Enter Address' }).first()).toBeVisible();
    await expect(page.getByRole('textbox', { name: 'Enter Address' }).first()).toHaveValue('1150 SILVER FANG ST');
    await expect(page.getByText('address 2')).toBeVisible();
    await expect(page.getByRole('textbox', { name: 'Enter Address' }).nth(1)).toBeVisible();
    await expect(page.getByText('Zip', { exact: true })).toBeVisible();
    await expect(page.getByText('Zip Enter ZIP 76621 ×')).toBeVisible();
    await expect(page.getByRole('dialog').getByText('City', { exact: true })).toBeVisible();
    await expect(page.locator('ng-select').filter({ hasText: 'Enter City ABBOTT ×' }).getByRole('combobox')).toBeVisible();
    await expect(page.getByText('state', { exact: true })).toBeVisible();
    await expect(page.locator('ng-select').filter({ hasText: 'Enter State×TX×' }).getByRole('combobox')).toBeVisible();
    await page.locator('div').filter({ hasText: /^Next$/ }).click();
    await page.getByRole('button', { name: 'Next' }).click();
    await page.getByRole('button', { name: 'Previous' }).click();
    await expect(page.getByRole('button', { name: 'Next' })).toBeVisible();
    await page.getByRole('button', { name: 'Next' }).click();
    await expect(page.getByRole('heading', { name: 'Add Provider ID Information 2/' })).toBeVisible();
    await expect(page.getByText('Identifier', { exact: true })).toBeVisible();
    await expect(page.locator('qualifiers').getByRole('combobox')).toBeVisible();
    await expect(page.getByRole('textbox', { name: 'Enter Id' })).toBeVisible();
    await expect(page.getByRole('columnheader', { name: 'name' })).toBeVisible();
    await expect(page.getByRole('columnheader', { name: 'Id', exact: true })).toBeVisible();
    await expect(page.getByRole('columnheader', { name: 'group id' })).toBeVisible();
    await expect(page.getByRole('cell', { name: 'EI - EIN' })).toBeVisible();
    await expect(page.getByRole('cell', { name: userData.addProvider.providerTaxID })).toBeVisible();
    await expect(page.getByRole('cell', { name: userData.addProvider.groupeditInAcct }).first()).toBeVisible();
    await expect(page.getByRole('cell', { name: 'XX - NPI' })).toBeVisible();
    await expect(page.getByRole('cell', { name: userData.addProvider.providerNPI })).toBeVisible();
    await expect(page.getByRole('cell', { name: userData.addProvider.groupeditInAcct }).nth(1)).toBeVisible();
    await expect(page.locator('.d-flex.align-items-center.justify-content-end').first()).toBeVisible();
    await page.getByRole('row', { name: `XX - NPI ${userData.addProvider.providerNPI} ${userData.addProvider.groupeditInAcct} ` }).getByRole('link').click();
    await expect(page.getByRole('row', { name: `XX - NPI ${userData.addProvider.providerNPI} ${userData.addProvider.groupeditInAcct} ` }).getByRole('link')).toBeVisible();
    await page.getByRole('row', { name: `XX - NPI ${userData.addProvider.providerNPI} ${userData.addProvider.groupeditInAcct} ` }).getByRole('link').click();
    await expect(page.getByRole('button', { name: 'Save' })).toBeVisible();
    await expect(page.getByRole('button', { name: 'Previous' })).toBeVisible();
    await page.getByRole('button', { name: 'Save' }).click();
    console.log('Clicked Save button after adding provider');
    console.log('Waiting for provider to be added and visible in the list...');
 
  await page.waitForTimeout(2000); // 2 second delay
    // Fetch the providerId and organizationname from the database for the added provider
    const providerData = await fetchProviderIdByGroupId(userData.addProvider.groupeditInAcct);
    if (!providerData) throw new Error('Failed to fetch providerId and organizationname from database after adding provider');
    const providerId = providerData.id;
    const organizationname = providerData.organizationname;

    await page.getByRole('cell').filter({ hasText: /^$/ }).nth(1).click();
    // Retry clicking the cell if the column headers are not visible
    let retries = 0;
    const maxRetries = 2;
    while (retries < maxRetries) {
      const nameHeaderVisible = await page.getByRole('columnheader', { name: 'name ' }).isVisible().catch(() => false);
      const providerIdHeaderVisible = await page.getByRole('columnheader', { name: 'provider ID' }).isVisible().catch(() => false);
    await expect(page.getByRole('cell', { name: providerId, exact: true })).toBeVisible();
    await expect(page.getByRole('cell', { name: organizationname, exact: true })).toBeVisible();
    await expect(page.getByRole('cell', { name: providerId, exact: true })).toBeVisible();

 if (nameHeaderVisible && providerIdHeaderVisible) break;
      console.log(`Retrying click on cell, attempt ${retries + 2}`);
      await page.getByRole('cell').filter({ hasText: /^$/ }).nth(1).click();
      await page.waitForTimeout(1000);
      retries++;
    }
  });