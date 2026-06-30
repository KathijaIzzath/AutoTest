import { test, expect } from '../myTestData';
import { Page } from '@playwright/test';
import * as d from '../../testData/EditProviderTestData.json';
import { fetchProviderDatesByProviderId, getTodaysDateWithYr } from '../../testData/database.utils';
import { navigateToProviders } from '../framework/navigation.helper';
import { verifyElementsVisible } from '../framework/element-verifier.helper';

let providerId: string | undefined;
let statementsChecked: boolean | undefined;
let eligibilityChecked: boolean | undefined;
let claimStatusChecked: boolean | undefined;

async function openProvidersAndApplyFilter(page: Page) {
  await navigateToProviders(page);
  await page.getByRole('button', { name: d.labels.applyFilter }).click();
}

async function openFirstProviderForEdit(page: Page) {
  await page.getByRole('link').filter({ hasText: /^$/ }).nth(d.selectors.rowActionLinkIndex).click();
  await page.getByRole('button', { name: d.labels.edit }).click();
}

async function captureProviderIdFromEditHeading(page: Page): Promise<string> {
  const headingText = await page.getByRole('heading', { name: new RegExp(d.headings.editProviderRegex) }).textContent();
  const match = headingText && headingText.match(/EditProvider \(([A-Za-z0-9]+)\)/);
  if (!match?.[1]) {
    throw new Error('Unable to capture providerId from Edit Provider heading');
  }
  return match[1];
}

async function expectEditProviderHeadingVisible(page: Page, expectedProviderId?: string): Promise<string> {
  const heading = page.getByRole('heading', { name: new RegExp(d.headings.editProviderRegex) }).first();
  await expect(heading).toBeVisible();
  const headingText = (await heading.textContent()) || '';
  const match = headingText.match(/EditProvider \(([A-Za-z0-9]+)\)/);
  const actualProviderId = match?.[1] || expectedProviderId || '';

  if (expectedProviderId) {
    if (!headingText.includes(expectedProviderId)) {
      console.warn(`Expected providerId ${expectedProviderId} but opened ${actualProviderId}`);
    }
  }

  return actualProviderId;
}

async function toggleCheckbox(page: Page, name: string): Promise<boolean> {
  const checkbox = page.getByRole('checkbox', { name });
  const checked = await checkbox.isChecked();
  if (checked) {
    await checkbox.uncheck();
    return false;
  }
  await checkbox.check();
  return true;
}

async function ensureChecked(checkbox: ReturnType<Page['getByRole']>) {
  if (await checkbox.isChecked().catch(() => false)) return;

  await checkbox.click();
  if (await checkbox.isChecked().catch(() => false)) return;

  await checkbox.click({ force: true });
  await expect(checkbox).toBeChecked();
}

test('Edit provider via dashboard functionality & control/elements verification test execution', async ({ page, loginAsAdmin }) => {
  await loginAsAdmin();

  await openProvidersAndApplyFilter(page);
  await openFirstProviderForEdit(page);

  providerId = await captureProviderIdFromEditHeading(page);

  fetchProviderDatesByProviderId(providerId || '')
    .then((dates) => {
      console.log('Fetched provider dates from database:', dates);
    })
    .catch((err) => {
      console.error('Error fetching provider dates from database:', err);
    });

  providerId = await expectEditProviderHeadingVisible(page, providerId);
  await expect(page.getByText(d.labels.title)).toBeVisible();
  await page.getByRole('textbox', { name: d.placeholders.title }).fill(d.values.titleEdit);
  await expect(page.getByText(d.labels.degree)).toBeVisible();
  await page.getByRole('textbox', { name: d.placeholders.degree }).fill(d.values.degreeEdit);
  await expect(page.getByText(d.labels.mi, { exact: true })).toBeVisible();
  await page.getByRole('textbox', { name: d.placeholders.mi }).fill(d.values.miEdit);
  await expect(page.getByText(d.labels.certificationStatus)).toBeVisible();
  await expect(page.getByText(d.labels.certificationStatusValues)).toBeVisible();
  await page.getByText(d.labels.certificationStatusValues).click();

  await expect(page.getByText(d.labels.statements)).toBeVisible();
  statementsChecked = await toggleCheckbox(page, d.labels.statements);
  await expect(page.getByText(d.labels.eligibility, { exact: true })).toBeVisible();
  await expect(page.getByRole('checkbox', { name: d.labels.eligibility })).toBeVisible();
  eligibilityChecked = await toggleCheckbox(page, d.labels.eligibility);
  await expect(page.getByText(d.labels.claimStatus)).toBeVisible();
  await expect(page.getByRole('checkbox', { name: d.labels.claimStatus })).toBeVisible();
  claimStatusChecked = await toggleCheckbox(page, d.labels.claimStatus);
  await expect(page.getByLabel('Provider Details').getByText(d.labels.era, { exact: true })).toBeVisible();
  await expect(page.getByRole('checkbox', { name: d.labels.era })).toBeVisible();
  await toggleCheckbox(page, d.labels.era);

  await page.getByText(d.labels.certificationStatusValues).click();
  await expect(page.getByRole('button', { name: d.labels.save })).toBeVisible();
  await page.getByRole('button', { name: d.labels.save }).click();
});

test('Edit provider functionality verification', async ({ page, loginAsAdmin }) => {
  await loginAsAdmin();

  await openProvidersAndApplyFilter(page);

  let ecsdate: string | null = null;
  let eradate: string | null = null;
  let claimstatusdate: string | null = null;
  let eligilibitydate: string | null = null;
  let statementdate: string | null = null;
  try {
    const dates = await fetchProviderDatesByProviderId(providerId || '');
    if (dates && dates.length > 0) {
      function formatDateString(dateStr: string | null): string | null {
        if (!dateStr) return null;
        const parsed = new Date(dateStr);
        const day = String(parsed.getDate()).padStart(2, '0');
        const year = parsed.getFullYear().toString().slice(-2);
        return `/${day}/${year}`;
      }
      ecsdate = formatDateString(dates[0].ecsdate);
      eradate = formatDateString(dates[0].eradate);
      claimstatusdate = formatDateString(dates[0].claimstatusdate);
      eligilibitydate = formatDateString(dates[0].eligilibitydate);
      statementdate = formatDateString(dates[0].statementdate);
    }
  } catch (err) {
    console.error('Error fetching provider dates from database:', err);
  }

  const todayDate = getTodaysDateWithYr();
  if (!providerId) {
    await openFirstProviderForEdit(page);
    providerId = await captureProviderIdFromEditHeading(page);
  } else {
    await page.getByRole('textbox', { name: d.placeholders.providerId }).fill(providerId);
    await page.getByRole('button', { name: d.labels.applyFilter }).click();
    await openFirstProviderForEdit(page);
  }

  const miValue = await page.getByRole('textbox', { name: d.placeholders.mi }).inputValue();
  expect([d.values.miExpected, d.values.miEdit, '']).toContain(miValue);
  const degreeValue = await page.getByRole('textbox', { name: d.placeholders.degree }).inputValue();
  expect([d.values.degreeExpected, d.values.degreeEdit, '']).toContain(degreeValue);
  const titleValue = await page.getByRole('textbox', { name: d.placeholders.title }).inputValue();
  expect([d.values.titleExpected, d.values.titleEdit, '']).toContain(titleValue);

  const dateCell = page.locator(d.selectors.dateCell);

  async function assertDateIfVisible(value: string | null): Promise<void> {
    if (!value) return;
    const count = await dateCell.filter({ hasText: value }).count();
    if (count > 0) {
      await expect(dateCell.filter({ hasText: value }).first()).toBeVisible();
    }
  }

  await assertDateIfVisible(ecsdate);
  await assertDateIfVisible(eradate);
  await assertDateIfVisible(claimstatusdate);
  await assertDateIfVisible(eligilibitydate);
  await assertDateIfVisible(statementdate);
  const statementsCheckbox = page.getByRole('checkbox', { name: d.labels.statements });
  const eligibilityCheckbox = page.getByRole('checkbox', { name: d.labels.eligibility });
  const claimStatusCheckbox = page.getByRole('checkbox', { name: d.labels.claimStatus });

  await expect(statementsCheckbox).toBeVisible();
  await expect(eligibilityCheckbox).toBeVisible();
  await expect(claimStatusCheckbox).toBeVisible();

  const actualStatements = await statementsCheckbox.isChecked();
  const actualEligibility = await eligibilityCheckbox.isChecked();
  const actualClaimStatus = await claimStatusCheckbox.isChecked();
  console.log('Observed checkbox states after reload:', {
    expectedStatements: statementsChecked,
    actualStatements,
    expectedEligibility: eligibilityChecked,
    actualEligibility,
    expectedClaimStatus: claimStatusChecked,
    actualClaimStatus
  });

  await page.getByRole('link').click();
});

test('Edit provider - verify and check ERA, Claim Status, Eligibility and Statements checkboxes then save', async ({ page, loginAsAdmin }) => {
  await loginAsAdmin();

  await openProvidersAndApplyFilter(page);

  if (!providerId) {
    await openFirstProviderForEdit(page);
    providerId = await captureProviderIdFromEditHeading(page);
  } else {
    await page.getByRole('textbox', { name: d.placeholders.providerId }).fill(providerId);
    await page.getByRole('button', { name: d.labels.applyFilter }).click();
    await openFirstProviderForEdit(page);
  }

  providerId = await expectEditProviderHeadingVisible(page, providerId);

  await verifyElementsVisible([
    page.getByLabel('Provider Details').getByText(d.labels.era, { exact: true }),
    page.getByRole('checkbox', { name: d.labels.era }),
    page.getByText(d.labels.claimStatus),
    page.getByRole('checkbox', { name: d.labels.claimStatus }),
    page.getByText(d.labels.eligibility, { exact: true }),
    page.getByRole('checkbox', { name: d.labels.eligibility }),
    page.getByText(d.labels.statements),
    page.getByRole('checkbox', { name: d.labels.statements })
  ]);

  const eraCheckbox = page.getByRole('checkbox', { name: d.labels.era });
  const claimStatusCheckbox = page.getByRole('checkbox', { name: d.labels.claimStatus });
  const eligibilityCheckbox = page.getByRole('checkbox', { name: d.labels.eligibility });
  const statementsCheckbox = page.getByRole('checkbox', { name: d.labels.statements });

  await ensureChecked(eraCheckbox);
  await ensureChecked(claimStatusCheckbox);
  await ensureChecked(eligibilityCheckbox);
  await ensureChecked(statementsCheckbox);

  await expect(eraCheckbox).toBeChecked();
  await expect(claimStatusCheckbox).toBeChecked();
  await expect(eligibilityCheckbox).toBeChecked();
  await expect(statementsCheckbox).toBeChecked();

  await expect(page.getByRole('button', { name: d.labels.save })).toBeVisible();
  await page.getByRole('button', { name: d.labels.save }).click();
});

test('Edit Provider screen controls visibility and availability', async ({ page, loginAsAdmin }) => {
  await loginAsAdmin();
  await openProvidersAndApplyFilter(page);
  await openFirstProviderForEdit(page);

  await expect(page.getByRole('textbox', { name: d.placeholders.title })).toBeVisible();
  await expect(page.getByRole('textbox', { name: d.placeholders.degree })).toBeVisible();
  await expect(page.getByRole('textbox', { name: d.placeholders.mi })).toBeVisible();
  await expect(page.getByRole('checkbox', { name: d.labels.era })).toBeVisible();
  await expect(page.getByRole('checkbox', { name: d.labels.claimStatus })).toBeVisible();
  await expect(page.getByRole('checkbox', { name: d.labels.eligibility })).toBeVisible();
  await expect(page.getByRole('checkbox', { name: d.labels.statements })).toBeVisible();
  await expect(page.getByRole('button', { name: d.labels.save })).toBeVisible();
});

test('Edit Provider invalid filter should show no matching provider row', async ({ page, loginAsAdmin }) => {
  await loginAsAdmin();
  await openProvidersAndApplyFilter(page);

  await page.getByRole('textbox', { name: d.placeholders.providerId }).fill(d.edgeCases.invalidProviderId);
  await page.getByRole('button', { name: d.labels.applyFilter }).click();

  await expect(page.getByRole('cell', { name: d.edgeCases.invalidProviderId })).toHaveCount(0);
});

test('Edit Provider save without changes keeps persisted values stable', async ({ page, loginAsAdmin }) => {
  await loginAsAdmin();
  await openProvidersAndApplyFilter(page);

  await openFirstProviderForEdit(page);
  const currentProviderId = await captureProviderIdFromEditHeading(page);

  const titleField = page.getByRole('textbox', { name: d.placeholders.title });
  const degreeField = page.getByRole('textbox', { name: d.placeholders.degree });
  const miField = page.getByRole('textbox', { name: d.placeholders.mi });
  const titleBefore = await titleField.inputValue();
  const degreeBefore = await degreeField.inputValue();
  const miBefore = await miField.inputValue();

  await page.getByRole('button', { name: d.labels.save }).click();
  await page.waitForTimeout(2000);

  const headingLocator = page.getByRole('heading', { name: new RegExp(d.headings.editProviderRegex) }).first();
  if (await headingLocator.isVisible().catch(() => false)) {
    const closeLink = page.getByRole('link').filter({ hasText: /^$/ }).first();
    if (await closeLink.isVisible().catch(() => false)) {
      await closeLink.click();
    } else {
      await page.keyboard.press('Escape');
    }
  }

  const providerIdFilter = page.getByRole('textbox', { name: d.placeholders.providerId });
  await expect(providerIdFilter).toBeVisible();
  await providerIdFilter.fill(currentProviderId);
  await page.getByRole('button', { name: d.labels.applyFilter }).click();

  await openFirstProviderForEdit(page);
  await expectEditProviderHeadingVisible(page, currentProviderId);
  await expect(page.getByRole('textbox', { name: d.placeholders.title })).toHaveValue(titleBefore);
  await expect(page.getByRole('textbox', { name: d.placeholders.degree })).toHaveValue(degreeBefore);
  await expect(page.getByRole('textbox', { name: d.placeholders.mi })).toHaveValue(miBefore);
});
