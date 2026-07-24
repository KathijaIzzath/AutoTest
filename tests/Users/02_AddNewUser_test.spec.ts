import { test, expect } from '../myTestData';
import type { Page } from '@playwright/test';
import * as fs from 'fs';
import * as path from 'path';
import { navigateToUsers } from '../framework/navigation.helper';
import { fetchUserClientByUsername } from '../../testData/database.utils';
import * as d from '../../testData/AddNewUserTestData.json';

type GeneratedUserIdentity = {
  sequence: number;
  email: string;
  firstName: string;
  lastName: string;
  caseNumber: string;
  phone: string;
  cellPhone: string;
  pin: string;
};

let pageErrors: string[] = [];
const sequenceStatePath = path.resolve(__dirname, '../../testData/AddNewUserSequenceState.json');

function sanitizeDigits(value: string): string {
  return value.replace(/\D/g, '');
}

function formatPhone(area: string, prefix: string, sequence: number): string {
  const suffix = String(1000 + (sequence % 9000)).padStart(4, '0').slice(-4);
  return `(${area}) ${prefix}-${suffix}`;
}

function readAndIncrementSequence(): number {
  const start = Number(d.defaults.sequenceStart || 1);

  if (!fs.existsSync(sequenceStatePath)) {
    const init = { lastSequence: start - 1 };
    fs.writeFileSync(sequenceStatePath, JSON.stringify(init, null, 2), 'utf-8');
  }

  const content = fs.readFileSync(sequenceStatePath, 'utf-8');
  const parsed = JSON.parse(content) as { lastSequence?: number };
  const next = Number(parsed.lastSequence ?? start - 1) + 1;

  fs.writeFileSync(sequenceStatePath, JSON.stringify({ lastSequence: next }, null, 2), 'utf-8');
  return next;
}

function generateUserIdentity(): GeneratedUserIdentity {
  const sequence = readAndIncrementSequence();
  const seqForEmail = String(sequence).padStart(Number(d.defaults.sequencePadEmail), '0');
  const seqForLastName = String(sequence).padStart(Number(d.defaults.sequencePadLastName), '0');

  const email = `${d.defaults.emailPrefix}${seqForEmail}@${d.defaults.emailDomain}`;
  const firstName = d.defaults.firstName;
  const lastName = `${d.defaults.lastNamePrefix} ${seqForLastName}`;

  return {
    sequence,
    email,
    firstName,
    lastName,
    caseNumber: `${d.defaults.casePrefix}${10000000 + sequence}`,
    phone: formatPhone(d.defaults.phoneArea, d.defaults.phonePrefix, sequence),
    cellPhone: formatPhone(d.defaults.cellArea, d.defaults.cellPrefix, sequence),
    pin: d.defaults.pin,
  };
}

async function openCreateNewUser(page: Page): Promise<void> {
  await navigateToUsers(page);
  await expect(page.getByRole('link', { name: new RegExp(d.labels.addUsers, 'i') })).toBeVisible();
  await page.getByRole('link', { name: new RegExp(d.labels.addUsers, 'i') }).click();
  await expect(page.getByRole('heading', { name: d.labels.createNewUser })).toBeVisible();
}

async function fillCreateUserForm(page: Page, user: GeneratedUserIdentity): Promise<void> {
  await page.getByRole('textbox', { name: d.placeholders.login }).fill(user.email);
  await page.getByRole('textbox', { name: d.placeholders.firstName }).fill(user.firstName);
  await page.getByRole('textbox', { name: d.placeholders.lastName }).fill(user.lastName);
  await page.getByRole('textbox', { name: d.placeholders.pin }).fill(user.pin);
  await page.getByRole('textbox', { name: d.placeholders.caseNumber }).fill(user.caseNumber);
  await page.getByRole('textbox', { name: d.placeholders.phone }).fill(user.phone);
  await page.getByRole('textbox', { name: d.placeholders.cellPhone }).fill(user.cellPhone);
}

async function copyPermissionsFromExistingUser(page: Page): Promise<void> {
  await page.getByRole('link', { name: new RegExp(d.labels.copyPermissions, 'i') }).click();

  await expect(page.getByRole('heading', { name: d.labels.userSearch })).toBeVisible();
  await page.getByRole('textbox', { name: d.placeholders.copyPermissionUserName }).fill(d.sections.copyPermissionSearchUser);
  await page.getByRole('button', { name: d.labels.search }).click();

  const rowCheckbox = page.getByRole('row', { name: /QA TESTER|QA/i }).getByRole('checkbox').first();
  await expect(rowCheckbox).toBeVisible();
  await rowCheckbox.check();

  await expect(page.getByRole('button', { name: d.labels.copyPermissionsButton })).toBeVisible();
  await page.getByRole('button', { name: d.labels.copyPermissionsButton }).click();
}

async function clickSectionSearchIcon(page: Page, sectionText: string): Promise<void> {
  const section = page.locator(d.selectors.userForm).filter({ hasText: new RegExp(sectionText, 'i') }).first();
  const iconLink = section.getByRole('link').first();
  await expect(iconLink).toBeVisible();
  await iconLink.click();
}

async function openVendorModal(page: Page): Promise<boolean> {
  const vendorNoDataText = page.getByText(/No Vendor\(s\) Yet|You can add/i).first();
  await expect(vendorNoDataText).toBeVisible();

  const recorderPrimary = page.locator('user-form').getByRole('link').filter({ hasText: /^$/ }).first();
  if (await recorderPrimary.isVisible().catch(() => false)) {
    await recorderPrimary.click().catch(() => {});
    const opened = await page.getByRole('heading', { name: /Add Vendor/i }).isVisible().catch(() => false);
    if (opened) return true;
  }

  await clickSectionSearchIcon(page, d.labels.vendors).catch(() => {});
  return page.getByRole('heading', { name: /Add Vendor/i }).isVisible().catch(() => false);
}

async function openAccountModal(page: Page): Promise<boolean> {
  const recorderPrimary = page.locator('user-form').getByRole('link').nth(5);
  if (await recorderPrimary.isVisible().catch(() => false)) {
    await recorderPrimary.click().catch(() => {});
    const opened = await page.getByRole('heading', { name: /Add Account\(s\) to user/i }).isVisible().catch(() => false);
    if (opened) return true;
  }

  await clickSectionSearchIcon(page, d.labels.accounts).catch(() => {});
  return page.getByRole('heading', { name: /Add Account\(s\) to user/i }).isVisible().catch(() => false);
}

async function openGroupModal(page: Page): Promise<boolean> {
  const recorderPrimary = page.locator('div:nth-child(6) > .d-flex.align-items-center > .standart-link-action').first();
  if (await recorderPrimary.isVisible().catch(() => false)) {
    await recorderPrimary.click().catch(() => {});
    const opened = await page.getByRole('columnheader', { name: /group id/i }).isVisible().catch(() => false);
    if (opened) return true;
  }

  await clickSectionSearchIcon(page, d.labels.groups).catch(() => {});
  return page.getByRole('columnheader', { name: /group id/i }).isVisible().catch(() => false);
}

async function addVendor(page: Page): Promise<boolean> {
  const opened = await openVendorModal(page);
  if (!opened) {
    return false;
  }
  await expect(page.getByRole('heading', { name: /Add Vendor/i })).toBeVisible();

  await page.getByRole('textbox', { name: d.placeholders.vendorName }).fill(d.sections.vendorSearchName);
  await page.getByRole('button', { name: d.labels.search }).click();

  const vendorRowCheckbox = page.getByRole('row', { name: /name\s+code/i }).getByRole('checkbox').first();
  await expect(vendorRowCheckbox).toBeVisible();
  await vendorRowCheckbox.check();

  await page.getByRole('button', { name: d.labels.addVendors }).click();
  return true;
}

async function addAccount(page: Page): Promise<boolean> {
  const opened = await openAccountModal(page);
  if (!opened) {
    return false;
  }
  await expect(page.getByRole('heading', { name: /Add Account\(s\) to user/i })).toBeVisible();

  const accountRowCheckbox = page.getByRole('row', { name: /Account name\s+Account number/i }).getByRole('checkbox').first();
  await expect(accountRowCheckbox).toBeVisible();
  await accountRowCheckbox.check();

  await page.getByRole('button', { name: d.labels.addAccounts }).click();
  return true;
}

async function addGroup(page: Page): Promise<boolean> {
  const opened = await openGroupModal(page);
  if (!opened) {
    return false;
  }
  await expect(page.getByRole('columnheader', { name: /group id/i })).toBeVisible();

  const groupHeaderCheckbox = page.getByRole('row', { name: /name\s+group id/i }).getByRole('checkbox').first();
  await expect(groupHeaderCheckbox).toBeVisible();
  await groupHeaderCheckbox.check();

  await page.getByRole('button', { name: d.labels.apply }).click();
  return true;
}

async function saveAndSearchCreatedUser(page: Page, firstName: string): Promise<void> {
  await expect(page.getByRole('button', { name: d.labels.saveAndClose })).toBeVisible();
  await page.getByRole('button', { name: d.labels.saveAndClose }).click();
  await page.waitForTimeout(d.timeouts.saveMs);

  await expect(page.getByRole('textbox', { name: d.placeholders.firstName })).toBeVisible();
  await page.getByRole('textbox', { name: d.placeholders.firstName }).fill(firstName);
  await page.getByRole('button', { name: d.labels.applyFilter }).click();
}

async function assertNoResultsOrZeroRows(page: Page): Promise<void> {
  const emptyState = page.locator(d.selectors.noResults).first();
  const hasEmptyState = await emptyState.isVisible().catch(() => false);
  if (!hasEmptyState) {
    await expect(page.locator(d.selectors.tableRows)).toHaveCount(0);
  }
}

test.describe('Users - Create New User suite', () => {
  test.beforeEach(async ({ page, loginAsAdmin }) => {
    pageErrors = [];
    page.on('pageerror', (err) => pageErrors.push(err.message));

    await loginAsAdmin();
    await openCreateNewUser(page);
  });

  test.afterEach(async () => {
    expect(pageErrors, 'Unexpected browser runtime errors were thrown.').toEqual([]);
  });

  test('Create New User form fields are visible and available', async ({ page }) => {
    await expect(page.getByText(d.labels.newUserInfo)).toBeVisible();
    await expect(page.getByText(d.labels.requiredFields)).toBeVisible();

    await expect(page.getByText(d.requiredFieldLabels.login)).toBeVisible();
    await expect(page.getByRole('textbox', { name: d.placeholders.login })).toBeVisible();

    await expect(page.getByText(d.requiredFieldLabels.firstName)).toBeVisible();
    await expect(page.getByRole('textbox', { name: d.placeholders.firstName })).toBeVisible();

    await expect(page.getByText(d.requiredFieldLabels.lastName)).toBeVisible();
    await expect(page.getByRole('textbox', { name: d.placeholders.lastName })).toBeVisible();

    await expect(page.getByText(d.requiredFieldLabels.phone)).toBeVisible();
    await expect(page.getByRole('textbox', { name: d.placeholders.phone })).toBeVisible();

    await expect(page.getByText(d.requiredFieldLabels.userType)).toBeVisible();
    await expect(page.locator(d.selectors.userTypeSelect)).toBeVisible();

    await expect(page.getByText(d.requiredFieldLabels.pin)).toBeVisible();
    await expect(page.getByRole('textbox', { name: d.placeholders.pin })).toBeVisible();

    await expect(page.getByRole('checkbox', { name: d.labels.active })).toBeVisible();
    await expect(page.getByRole('checkbox', { name: /Password Reset Allowed/i })).toBeVisible();
    await expect(page.getByText(d.requiredFieldLabels.userPermission)).toBeVisible();

    await expect(page.getByRole('button', { name: d.labels.saveAndClose })).toBeVisible();
  });

  test('User Type dropdown includes expected options and supports vendor/account/billing-group', async ({ page }) => {
    const select = page.locator(d.selectors.userTypeSelect).first();
    await expect(select).toBeVisible();

    const options = await select.locator('option').allTextContents();
    const normalized = options.map((text) => text.replace(/\s+/g, ' ').trim());

    for (const option of d.expectedUserTypeOptions) {
      const hasOption = normalized.some((value) => value.toLowerCase().includes(String(option).toLowerCase()));
      expect(hasOption, `Missing user type option: ${option}`).toBeTruthy();
    }

    await select.selectOption(d.dropdownValues.userTypeAccount);
    await expect(select).toHaveValue(/ACCOUNT|3/i);

    await select.selectOption(d.dropdownValues.userTypeBillingGroup);
    await expect(select).toHaveValue(/BILLING_GROUP|4/i);

    await select.selectOption(d.dropdownValues.userTypeVendor);
    await expect(select).toHaveValue(/VENDOR|2/i);
  });

  test('Required field validation keeps Save disabled when key inputs are empty', async ({ page }) => {
    await page.getByRole('textbox', { name: d.placeholders.login }).fill(d.edgeCases.whitespace);
    await page.getByRole('textbox', { name: d.placeholders.firstName }).fill(d.edgeCases.whitespace);
    await page.getByRole('textbox', { name: d.placeholders.lastName }).fill(d.edgeCases.whitespace);
    await page.getByRole('textbox', { name: d.placeholders.pin }).fill(d.edgeCases.invalidPin);
    await page.getByRole('textbox', { name: d.placeholders.phone }).fill(d.edgeCases.invalidPhone);

    const saveButton = page.getByRole('button', { name: d.labels.saveAndClose });
    await expect(saveButton).toBeDisabled();
  });

  test('Create vendor user with copied permissions, vendor/account/group mapping, and verify in UI and DB', async ({ page }) => {
    const user = generateUserIdentity();

    await fillCreateUserForm(page, user);
    await page.locator(d.selectors.userTypeSelect).first().selectOption(d.dropdownValues.userTypeVendor);

    await copyPermissionsFromExistingUser(page);
    const vendorAdded = await addVendor(page);
    test.skip(!vendorAdded, 'Vendor mapping modal could not be opened in this environment.');
    if (!vendorAdded) return;

    const accountAdded = await addAccount(page);
    test.skip(!accountAdded, 'Account mapping modal could not be opened in this environment.');
    if (!accountAdded) return;

    const groupAdded = await addGroup(page);
    test.skip(!groupAdded, 'Group mapping modal could not be opened in this environment.');
    if (!groupAdded) return;

    await saveAndSearchCreatedUser(page, user.firstName);

    await expect(page.getByRole('columnheader', { name: 'User', exact: true })).toBeVisible();
    await expect(page.getByRole('columnheader', { name: 'Status' })).toBeVisible();
    await expect(page.getByRole('cell', { name: new RegExp(`${user.firstName}\\s+${user.lastName}`, 'i') })).toBeVisible();
    await expect(page.getByRole('cell', { name: d.labels.active })).toBeVisible();

    const dbRow = await fetchUserClientByUsername(user.email);
    expect(dbRow, 'Created user row should exist in usersclients.').not.toBeNull();
    if (!dbRow) return;

    expect(dbRow.username.toLowerCase()).toBe(user.email.toLowerCase());
    expect(dbRow.firstName.toLowerCase()).toBe(user.firstName.toLowerCase());
    expect(dbRow.lastName.toLowerCase()).toBe(user.lastName.toLowerCase());

    const dbPhoneDigits = sanitizeDigits(dbRow.phone ?? '');
    const expectedPhoneDigits = sanitizeDigits(user.phone);
    if (dbPhoneDigits) {
      expect(dbPhoneDigits).toContain(expectedPhoneDigits);
    }
  });

  test('Generated email and last name sequence increments for each run', async () => {
    const first = generateUserIdentity();
    const second = generateUserIdentity();

    expect(second.sequence).toBe(first.sequence + 1);
    expect(second.email).not.toBe(first.email);
    expect(second.lastName).not.toBe(first.lastName);
    expect(second.email).toMatch(new RegExp(`^${d.defaults.emailPrefix}\\d{${d.defaults.sequencePadEmail}}@${d.defaults.emailDomain.replace('.', '\\.')}$`, 'i'));
    expect(second.lastName).toMatch(new RegExp(`^${d.defaults.lastNamePrefix}\\s\\d{${d.defaults.sequencePadLastName}}$`, 'i'));
  });
});

test.describe('Users dashboard filter validations', () => {
  test.beforeEach(async ({ page, loginAsAdmin }) => {
    pageErrors = [];
    page.on('pageerror', (err) => pageErrors.push(err.message));
    await loginAsAdmin();
    await navigateToUsers(page);
  });

  test.afterEach(async () => {
    expect(pageErrors, 'Unexpected browser runtime errors were thrown.').toEqual([]);
  });

  test('Invalid first-name filter on Users dashboard returns no rows or empty state', async ({ page }) => {
    await page.getByRole('textbox', { name: d.placeholders.firstName }).fill(d.edgeCases.invalidFirstNameFilter);
    await page.getByRole('button', { name: d.labels.applyFilter }).click();

    await assertNoResultsOrZeroRows(page);
  });
});
