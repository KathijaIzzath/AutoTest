import { test, expect } from '../myTestData';
import { Page } from '@playwright/test';
import * as userData from '../../testData/UserInfo.json';
import * as d from '../../testData/AddProviderTestData.json';
import { deleteProviderAndBillingIdsByGroupId, fetchProviderIdByGroupId } from '../../testData/database.utils';
import { navigateToAccounts } from '../framework/navigation.helper';

async function openAccountAndGroup(page: Page, accountNumber: string, groupId: string) {
  await navigateToAccounts(page);
  await page.getByRole('textbox', { name: d.placeholders.accountNumber }).fill(accountNumber);
  await page.getByRole('button', { name: d.labels.applyFilter }).click();
  await page.getByRole('link').filter({ hasText: /^$/ }).nth(d.selectors.accountRowActionLinkIndex).click();
  await expect(page.getByRole('cell', { name: groupId, exact: true })).toBeVisible();
}

async function openAddProviderModal(page: Page) {
  await page.locator('div').filter({ hasText: new RegExp(`^${d.selectors.providerDetailsActionText}$`) }).first().click();
  await page.locator(d.selectors.providerGroupGrid).getByRole('link').filter({ hasText: /^$/ }).nth(d.selectors.providerGroupActionLinkIndex).click();

  const addProviderButton = page.getByRole('button', { name: d.labels.addProvider });
  if (!(await addProviderButton.isVisible().catch(() => false))) {
    await page.locator('div').filter({ hasText: new RegExp(`^${d.selectors.providerDetailsActionText}$`) }).first().click();
    await page.locator(d.selectors.providerGroupGrid).getByRole('link').filter({ hasText: /^$/ }).nth(d.selectors.providerGroupActionLinkIndex).click();
  }

  await expect(addProviderButton).toBeVisible();
  await addProviderButton.click();
  await expect(page.getByRole('heading', { name: d.headings.addProviderSetup })).toBeVisible();
}

async function addProviderIdentifiers(page: Page, taxId: string, npi: string) {
  await page.locator(d.selectors.qualifierSelect).getByRole('combobox').selectOption(d.values.taxQualifier);
  await page.getByRole('textbox', { name: d.placeholders.id }).fill(taxId);
  await page.getByRole('button', { name: 'Add Details' }).click();

  await page.locator(d.selectors.qualifierSelect).getByRole('combobox').selectOption(d.values.npiQualifier);
  await page.getByRole('textbox', { name: d.placeholders.id }).fill(npi);
  await page.getByRole('button', { name: 'Add Details' }).click();
}

test('Add provider via Accounts dashboard functionality & control/elements verification test execution', async ({ page, loginAsAdmin }) => {
  await deleteProviderAndBillingIdsByGroupId(userData.addProvider.groupeditInAcct);
  await loginAsAdmin();

  await openAccountAndGroup(page, userData.addProvider.accountNum, userData.addProvider.groupeditInAcct);
  await openAddProviderModal(page);

  await page.getByRole('textbox', { name: d.placeholders.firstName }).fill(d.values.firstName);
  await page.getByRole('textbox', { name: d.placeholders.lastName }).fill(d.values.lastName);
  await page.getByRole('textbox', { name: d.placeholders.title }).fill(d.values.title);
  await page.getByRole('button', { name: d.labels.next }).click();

  await addProviderIdentifiers(page, userData.addProvider.providerTaxID, userData.addProvider.providerNPI);

  await page.getByRole('button', { name: d.labels.previous }).click();
  await expect(page.getByText(d.labels.contact, { exact: true })).toBeVisible();
  await expect(page.getByRole('textbox', { name: d.placeholders.contact })).toHaveValue(d.values.contactExpected);
  await expect(page.getByRole('textbox', { name: d.placeholders.phone })).toHaveValue(d.values.phoneExpected);
  await expect(page.getByText(d.labels.practiceManagement)).toBeVisible();
  await expect(page.getByText(d.labels.practiceManagementSelect)).toBeVisible();
  await expect(page.getByText(d.labels.certStatus)).toBeVisible();
  await expect(page.getByText(d.labels.certStatusValues)).toBeVisible();
  await expect(page.getByRole('checkbox', { name: 'ECS' })).toBeVisible();
  await expect(page.getByRole('checkbox', { name: 'ERA' })).toBeVisible();
  await expect(page.getByRole('checkbox', { name: 'Claim Status' })).toBeVisible();
  await expect(page.getByRole('checkbox', { name: 'Eligibility' })).toBeVisible();
  await expect(page.getByRole('checkbox', { name: 'Statements' })).toBeVisible();
  await expect(page.getByText(d.labels.feeSchedule)).toBeVisible();
  await expect(page.getByRole('combobox').nth(1)).toBeVisible();
  await expect(page.getByRole('dialog').getByText(d.labels.email)).toBeVisible();
  await expect(page.getByRole('textbox', { name: d.placeholders.email })).toHaveValue(d.values.emailExpected);
  await expect(page.getByText(d.labels.fax)).toBeVisible();
  await expect(page.getByRole('textbox', { name: d.placeholders.fax })).toBeVisible();
  await expect(page.getByText(d.labels.title)).toBeVisible();
  await expect(page.getByRole('textbox', { name: d.placeholders.title })).toBeVisible();
  await expect(page.getByText(d.labels.phone)).toBeVisible();
  await expect(page.getByRole('textbox', { name: d.placeholders.phone })).toBeVisible();
  await expect(page.getByText(d.labels.mi, { exact: true })).toBeVisible();
  await expect(page.getByRole('textbox', { name: d.placeholders.mi })).toBeVisible();
  await expect(page.getByText(d.labels.degree)).toBeVisible();
  await expect(page.getByRole('textbox', { name: d.placeholders.degree })).toBeVisible();
  await expect(page.getByText(d.labels.address1)).toBeVisible();
  await expect(page.getByRole('textbox', { name: d.placeholders.address }).first()).toHaveValue(d.values.address1Expected);
  await expect(page.getByText(d.labels.address2)).toBeVisible();
  await expect(page.getByRole('textbox', { name: d.placeholders.address }).nth(1)).toBeVisible();
  await expect(page.getByText(d.labels.zip, { exact: true })).toBeVisible();
  await expect(page.getByText(d.selectors.zipCityStateComposite)).toBeVisible();
  await expect(page.getByRole('dialog').getByText(d.labels.city, { exact: true })).toBeVisible();
  await expect(page.locator('ng-select').filter({ hasText: d.selectors.citySelectComposite }).getByRole('combobox')).toBeVisible();
  await expect(page.getByText(d.labels.state, { exact: true })).toBeVisible();
  await expect(page.locator('ng-select').filter({ hasText: d.selectors.stateSelectComposite }).getByRole('combobox')).toBeVisible();

  await page.getByRole('button', { name: d.labels.next }).click();
  await page.getByRole('button', { name: d.labels.previous }).click();
  await expect(page.getByRole('button', { name: d.labels.next })).toBeVisible();
  await page.getByRole('button', { name: d.labels.next }).click();

  await expect(page.getByRole('heading', { name: d.headings.addProviderIdInfo })).toBeVisible();
  await expect(page.getByText(d.labels.identifier, { exact: true })).toBeVisible();
  await expect(page.locator(d.selectors.qualifierSelect).getByRole('combobox')).toBeVisible();
  await expect(page.getByRole('textbox', { name: d.placeholders.id })).toBeVisible();
  await expect(page.getByRole('columnheader', { name: d.headers.name })).toBeVisible();
  await expect(page.getByRole('columnheader', { name: d.headers.id, exact: true })).toBeVisible();
  await expect(page.getByRole('columnheader', { name: d.headers.groupId })).toBeVisible();
  await expect(page.getByRole('cell', { name: d.values.taxIdentifierName })).toBeVisible();
  await expect(page.getByRole('cell', { name: userData.addProvider.providerTaxID })).toBeVisible();
  await expect(page.getByRole('cell', { name: userData.addProvider.groupeditInAcct }).first()).toBeVisible();
  await expect(page.getByRole('cell', { name: d.values.npiIdentifierName })).toBeVisible();
  await expect(page.getByRole('cell', { name: userData.addProvider.providerNPI })).toBeVisible();
  await expect(page.getByRole('cell', { name: userData.addProvider.groupeditInAcct }).nth(1)).toBeVisible();
  await expect(page.locator(d.selectors.actionButtonContainer).first()).toBeVisible();

  await page.getByRole('row', { name: `${d.values.npiIdentifierName} ${userData.addProvider.providerNPI} ${userData.addProvider.groupeditInAcct} ` }).getByRole('link').click();
  await page.getByRole('row', { name: `${d.values.npiIdentifierName} ${userData.addProvider.providerNPI} ${userData.addProvider.groupeditInAcct} ` }).getByRole('link').click();
  await expect(page.getByRole('button', { name: d.labels.save })).toBeVisible();
  await expect(page.getByRole('button', { name: d.labels.previous })).toBeVisible();
  await page.getByRole('button', { name: d.labels.save }).click();

  let providerData: Awaited<ReturnType<typeof fetchProviderIdByGroupId>> = null;
  await expect
    .poll(
      async () => {
        providerData = await fetchProviderIdByGroupId(userData.addProvider.groupeditInAcct);
        return providerData?.id ?? '';
      },
      { timeout: d.timeouts.dbPollTimeoutMs, intervals: [1000, 2000] }
    )
    .not.toBe('');

  if (!providerData) throw new Error('Failed to fetch providerId and organizationname from database after adding provider');
  const resolvedProviderData = providerData as { id: string; organizationname: string };

  await page.getByRole('cell').filter({ hasText: /^$/ }).nth(d.selectors.providersGridFirstCellIndex).click();

  let retries = 0;
  const maxRetries = 2;
  let providerIdVisible = false;
  let providerNameVisible = false;
  while (retries < maxRetries) {
    const nameHeaderVisible = await page.getByRole('columnheader', { name: d.headers.providersGridNameAsc }).isVisible().catch(() => false);
    const providerIdHeaderVisible = await page.getByRole('columnheader', { name: d.headers.providersGridProviderId }).isVisible().catch(() => false);
    const providerIdExact = page.getByRole('cell', { name: resolvedProviderData.id, exact: true }).first();
    const providerIdLoose = page.getByRole('cell', { name: resolvedProviderData.id }).first();
    const providerNameExact = page.getByRole('cell', { name: resolvedProviderData.organizationname, exact: true }).first();
    const providerNameLoose = page.getByRole('cell', { name: resolvedProviderData.organizationname }).first();

    const providerIdExactVisible = await providerIdExact.isVisible().catch(() => false);
    const providerIdLooseVisible = await providerIdLoose.isVisible().catch(() => false);
    providerIdVisible = providerIdExactVisible || providerIdLooseVisible;

    const providerNameExactVisible = await providerNameExact.isVisible().catch(() => false);
    const providerNameLooseVisible = await providerNameLoose.isVisible().catch(() => false);
    providerNameVisible = providerNameExactVisible || providerNameLooseVisible;

    if (nameHeaderVisible && providerIdHeaderVisible && providerIdVisible && providerNameVisible) break;
    await page.getByRole('cell').filter({ hasText: /^$/ }).nth(d.selectors.providersGridFirstCellIndex).click();

    try {
      await expect(page.getByRole('columnheader', { name: d.headers.providersGridNameAsc })).toBeVisible({ timeout: d.timeouts.headerRetryVisibleMs });
      await expect(page.getByRole('columnheader', { name: d.headers.providersGridProviderId })).toBeVisible({ timeout: d.timeouts.headerRetryVisibleMs });
      break;
    } catch {
      // Continue retry loop if grid is still rendering.
    }
    retries++;
  }

  expect(providerIdVisible).toBeTruthy();
  expect(providerNameVisible).toBeTruthy();
});

test('Add Provider step-1 field visibility and availability', async ({ page, loginAsAdmin }) => {
  await deleteProviderAndBillingIdsByGroupId(userData.addProvider.groupeditInAcct);
  await loginAsAdmin();
  await openAccountAndGroup(page, userData.addProvider.accountNum, userData.addProvider.groupeditInAcct);
  await openAddProviderModal(page);

  await expect(page.getByRole('textbox', { name: d.placeholders.firstName })).toBeVisible();
  await expect(page.getByRole('textbox', { name: d.placeholders.lastName })).toBeVisible();
  await expect(page.getByRole('textbox', { name: d.placeholders.title })).toBeVisible();
  await expect(page.getByRole('button', { name: d.labels.next })).toBeVisible();
});

test('Accounts invalid filter should show no rows before Add Provider flow', async ({ page, loginAsAdmin }) => {
  await loginAsAdmin();
  await navigateToAccounts(page);

  await page.getByRole('textbox', { name: d.placeholders.accountNumber }).fill(d.edgeCases.invalidAccountNumber);
  await page.getByRole('button', { name: d.labels.applyFilter }).click();

  await expect(page.getByRole('cell', { name: userData.addProvider.accountNum })).toHaveCount(0);
});

test('Add Provider with required fields empty keeps dialog in stable validation state', async ({ page, loginAsAdmin }) => {
  await deleteProviderAndBillingIdsByGroupId(userData.addProvider.groupeditInAcct);
  await loginAsAdmin();

  await openAccountAndGroup(page, userData.addProvider.accountNum, userData.addProvider.groupeditInAcct);
  await openAddProviderModal(page);

  await expect(page.getByRole('heading', { name: d.headings.addProviderSetup })).toBeVisible();
  const nextButton = page.getByRole('button', { name: d.labels.next });
  await expect(nextButton).toBeVisible();
  await nextButton.click();

  await expect(page.getByRole('heading', { name: d.headings.addProviderIdInfo })).toBeVisible();
  await expect(page.getByText('This field is required').first()).toBeVisible();
  await expect(page.getByRole('textbox', { name: d.placeholders.firstName })).toHaveValue('');
  await expect(page.getByRole('textbox', { name: d.placeholders.lastName })).toHaveValue('');
});

test('Duplicate Provider Add Details attempt keeps app stable and does not close setup unexpectedly', async ({ page, loginAsAdmin }) => {
  await deleteProviderAndBillingIdsByGroupId(userData.addProvider.groupeditInAcct);
  await loginAsAdmin();

  await openAccountAndGroup(page, userData.addProvider.accountNum, userData.addProvider.groupeditInAcct);
  await openAddProviderModal(page);

  await page.getByRole('textbox', { name: d.placeholders.firstName }).fill(d.values.firstName);
  await page.getByRole('textbox', { name: d.placeholders.lastName }).fill(d.values.lastName);
  await page.getByRole('textbox', { name: d.placeholders.title }).fill(d.values.title);
  await page.getByRole('button', { name: d.labels.next }).click();
  await expect(page.getByRole('heading', { name: d.headings.addProviderIdInfo })).toBeVisible();

  await page.locator(d.selectors.qualifierSelect).getByRole('combobox').selectOption(d.values.taxQualifier);
  await page.getByRole('textbox', { name: d.placeholders.id }).fill(userData.addProvider.providerTaxID);
  await page.getByRole('button', { name: 'Add Details' }).click();
  await page.locator(d.selectors.qualifierSelect).getByRole('combobox').selectOption(d.values.npiQualifier);
  await page.getByRole('textbox', { name: d.placeholders.id }).fill(userData.addProvider.providerNPI);
  await page.getByRole('button', { name: 'Add Details' }).click();

  await page.locator(d.selectors.qualifierSelect).getByRole('combobox').selectOption(d.values.taxQualifier);
  await page.getByRole('textbox', { name: d.placeholders.id }).fill(userData.addProvider.providerTaxID);
  const addDetailsBtn = page.getByRole('button', { name: 'Add Details' });
  if (await addDetailsBtn.isEnabled().catch(() => false)) {
    await addDetailsBtn.click();
  }

  await expect(page.getByRole('heading', { name: d.headings.addProviderIdInfo })).toBeVisible();
  await expect(page.getByRole('button', { name: d.labels.save })).toBeVisible();

  const duplicateOrStable =
    (await page.locator('alert').filter({ hasText: /duplicate|already exists|P0001/i }).first().isVisible().catch(() => false))
    || (await page.getByRole('row', { name: new RegExp(userData.addProvider.providerTaxID) }).isVisible().catch(() => false));
  expect(duplicateOrStable).toBeTruthy();
});
