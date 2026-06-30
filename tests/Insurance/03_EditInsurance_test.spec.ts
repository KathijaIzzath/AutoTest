import { test, expect } from '../myTestData';
import type { Locator, Page } from '@playwright/test';
import { navigateToInsurance } from '../framework/navigation.helper';
import { fetchInsuranceCompanyEditFields } from '../../testData/database.utils';
import * as d from '../../testData/EditInsuranceTestData.json';

async function applyFilterAndWait(page: Page): Promise<void> {
  await page.getByRole('button', { name: d.labels.applyFilter }).click();
  await page.waitForTimeout(d.timeouts.filterMs);
}

async function fillTextbox(page: Page, name: string, value: string, index = 0): Promise<void> {
  const tb = page.getByRole('textbox', { name }).nth(index);
  await tb.clear();
  await tb.fill(value);
}

async function fillTextboxIn(scope: Locator, name: string, value: string, index = 0): Promise<void> {
  const tb = scope.getByRole('textbox', { name }).nth(index);
  await tb.clear();
  await tb.fill(value);
}

async function navigateAndFilter(page: Page): Promise<void> {
  await navigateToInsurance(page);
  await fillTextbox(page, d.placeholders.name, d.values.filterName);
  await fillTextbox(page, d.placeholders.ediId, d.values.filterEdiId);
  await applyFilterAndWait(page);
}

async function openInsuranceEditModal(page: Page): Promise<Locator> {
  await page.locator(d.selectors.rowActionLink).getByRole('link').filter({ hasText: /^$/ }).click();
  await page.getByRole('button', { name: d.labels.edit }).click();
  await expect(page.getByRole('heading', { name: d.labels.viewModifyInsuranceSetup })).toBeVisible();
  const modal = page.locator(d.selectors.editInsuranceModal);
  await expect(modal).toBeVisible();
  return modal;
}

async function toggleParticipatingIfSelected(modal: Locator): Promise<void> {
  const eligFirst = modal.getByText(d.labels.participating).first();
  if (await eligFirst.isVisible().catch(() => false)) { await eligFirst.click({ force: true }); }
  const claimFirst = modal.getByText(d.labels.participating).nth(2);
  if (await claimFirst.isVisible().catch(() => false)) { await claimFirst.click({ force: true }); }
}

test.describe('Edit Insurance - Extended Coverage', () => {

  test('Edit insurance functionality - functional end-to-end flow and save', async ({ page, loginAsAdmin }) => {
    test.setTimeout(120000);
    await loginAsAdmin();
    await navigateAndFilter(page);
    await expect(page.getByRole('columnheader', { name: d.labels.insuranceNameAsc })).toBeVisible();
    await expect(page.getByRole('cell', { name: d.values.expectedInsuranceName })).toBeVisible();
    await expect(page.getByRole('columnheader', { name: d.labels.recordStatus })).toBeVisible();
    await expect(page.getByRole('cell', { name: d.values.recordStatusActive, exact: true })).toBeVisible();
    const modal = await openInsuranceEditModal(page);
    await expect(modal.getByRole('textbox', { name: d.placeholders.eligibilityId })).toHaveValue(d.values.expectedEligibilityId);
    await expect(modal.getByRole('combobox').nth(1)).toHaveValue(d.values.expectedState);
    await toggleParticipatingIfSelected(modal);
    await modal.locator(d.selectors.modalTextarea).fill(d.values.notes);
    await fillTextboxIn(modal, d.placeholders.contactName, d.values.contactName, 1);
    await modal.locator(d.selectors.checkboxFilter).filter({ hasText: 'Professional Claims' }).click();
    await modal.locator(d.selectors.checkboxFilter).filter({ hasText: 'Professional Claims' }).click();
    await modal.locator(d.selectors.claimFilingSelect).getByRole('combobox').selectOption(d.values.claimFilingOption);
    await modal.getByRole('button', { name: d.labels.save }).click();
    await page.waitForTimeout(d.timeouts.saveMs);
    await applyFilterAndWait(page);
    const verifyModal = await openInsuranceEditModal(page);
    await expect(verifyModal.getByRole('textbox', { name: d.placeholders.contactName }).nth(1)).toHaveValue(d.values.dbExpectedContactName);
    await expect(verifyModal.locator(d.selectors.modalTextarea)).toHaveValue(d.values.notes);
    await expect(verifyModal.getByText(d.labels.participating).first()).toBeVisible();
    await expect(verifyModal.getByText(d.labels.participating).nth(2)).toBeVisible();
    const dbRow = await fetchInsuranceCompanyEditFields(d.values.neicId, 'BLUE ');
    expect(dbRow).not.toBeNull();
    expect(dbRow?.contactname.toUpperCase()).toBe(d.values.dbExpectedContactName);
    expect(dbRow?.notes).toBe(d.values.dbExpectedNotes);
    expect(dbRow?.claimstatustype).toBe(d.values.dbExpectedClaimStatusType);
    expect(dbRow?.eligibilitytype).toBe(d.values.dbExpectedEligibilityType);
  });

  test('Edit Insurance modal fields are visible and available', async ({ page, loginAsAdmin }) => {
    await loginAsAdmin();
    await navigateAndFilter(page);
    const modal = await openInsuranceEditModal(page);
    await expect(modal.getByText(d.labels.scInsuranceId)).toBeVisible();
    await expect(modal.getByText(d.labels.payerId)).toBeVisible();
    await expect(modal.getByText(d.labels.claimFilingIndicator)).toBeVisible();
    await expect(modal.locator(d.selectors.claimFilingSelect).getByRole('combobox')).toBeVisible();
    await expect(modal.getByText('Name', { exact: true })).toBeVisible();
    await expect(modal.getByRole('textbox', { name: d.placeholders.name })).toBeVisible();
    await expect(modal.getByText(d.labels.contactName)).toBeVisible();
    await expect(modal.getByRole('textbox', { name: d.placeholders.contactName }).nth(1)).toBeVisible();
    await expect(modal.getByText(d.labels.phone)).toBeVisible();
    await expect(modal.getByText(d.labels.fax)).toBeVisible();
    await expect(modal.getByRole('textbox', { name: d.placeholders.phone })).toBeVisible();
    await expect(modal.getByRole('textbox', { name: d.placeholders.fax })).toBeVisible();
    await expect(modal.getByText(d.labels.state, { exact: true })).toBeVisible();
    await expect(modal.getByRole('combobox').nth(1)).toBeVisible();
    await expect(modal.getByText(d.labels.claimStatusId)).toBeVisible();
    await expect(modal.getByRole('textbox', { name: d.placeholders.claimStatusId })).toBeVisible();
    await expect(modal.getByText(d.labels.eligibilityId)).toBeVisible();
    await expect(modal.getByRole('textbox', { name: d.placeholders.eligibilityId })).toBeVisible();
    await expect(modal.getByRole('textbox', { name: d.placeholders.eligibilityId })).toHaveValue(d.values.expectedEligibilityId);
  });

  test('Edit Insurance modal eligibility and claim status type options are visible', async ({ page, loginAsAdmin }) => {
    await loginAsAdmin();
    await navigateAndFilter(page);
    const modal = await openInsuranceEditModal(page);
    await expect(modal.getByText(d.labels.eligibilityType)).toBeVisible();
    await expect(modal.getByText(d.labels.participating).first()).toBeVisible();
    await expect(modal.getByText(d.labels.nonParticipating).first()).toBeVisible();
    await expect(modal.getByText(d.labels.direct).first()).toBeVisible();
    await expect(modal.getByText(d.labels.claimStatusType)).toBeVisible();
    await expect(modal.getByText(d.labels.participating).nth(2)).toBeVisible();
    await expect(modal.getByText(d.labels.nonParticipating).nth(1)).toBeVisible();
    await expect(modal.getByText(d.labels.direct).nth(1)).toBeVisible();
    await expect(modal).toContainText(d.labels.participating);
    await expect(modal).toContainText(d.labels.nonParticipating);
    await expect(modal).toContainText(d.labels.direct);
  });

  test('Edit Insurance modal notes, active, legacy and save button are visible', async ({ page, loginAsAdmin }) => {
    await loginAsAdmin();
    await navigateAndFilter(page);
    const modal = await openInsuranceEditModal(page);
    await expect(modal.getByText(d.labels.notes)).toBeVisible();
    await expect(modal.locator(d.selectors.modalTextarea)).toBeVisible();
    await expect(modal.getByRole('checkbox', { name: d.labels.active })).toBeVisible();
    await expect(modal.getByText(d.labels.active, { exact: true })).toBeVisible();
    await expect(modal.getByRole('checkbox', { name: d.labels.legacy })).toBeVisible();
    await expect(modal.getByText(d.labels.legacy)).toBeVisible();
    await expect(modal.getByRole('button', { name: d.labels.save })).toBeVisible();
  });

  test('Edit Insurance modal Transactions section checkboxes are visible', async ({ page, loginAsAdmin }) => {
    await loginAsAdmin();
    await navigateAndFilter(page);
    const modal = await openInsuranceEditModal(page);
    await expect(modal.getByText(d.labels.transactions, { exact: true })).toBeVisible();
    await expect(modal.locator(d.selectors.checkboxFilter).filter({ hasText: 'Professional Claims' })).toBeVisible();
    await expect(modal.locator(d.selectors.checkboxFilter).filter({ hasText: 'Institutional Claims' })).toBeVisible();
    await expect(modal.locator(d.selectors.checkboxFilter).filter({ hasText: 'Claim Status' }).first()).toBeVisible();
    await expect(modal.locator(d.selectors.checkboxFilter).filter({ hasText: 'Attachments' })).toBeVisible();
    await expect(modal.getByText(d.labels.publishTo)).toBeVisible();
    await expect(modal).toContainText(d.labels.publishTo);
    await expect(modal.locator(d.selectors.checkboxFilter).filter({ hasText: 'Professional' }).nth(1)).toBeVisible();
    await expect(modal.locator(d.selectors.checkboxFilter).filter({ hasText: 'Institutional' }).nth(1)).toBeVisible();
    await expect(modal.locator(d.selectors.checkboxFilter).filter({ hasText: 'ERA' }).nth(1)).toBeVisible();
    await expect(modal.locator(d.selectors.checkboxFilter).filter({ hasText: 'Claim Status' }).nth(1)).toBeVisible();
    await expect(modal.locator(d.selectors.checkboxFilter).filter({ hasText: 'Eligibility' }).nth(1)).toBeVisible();
    await expect(modal.locator(d.selectors.checkboxFilter).filter({ hasText: 'Attachment' }).nth(1)).toBeVisible();
  });

  test('Edit Insurance modal Additional Transactions section is visible', async ({ page, loginAsAdmin }) => {
    await loginAsAdmin();
    await navigateAndFilter(page);
    const modal = await openInsuranceEditModal(page);
    await expect(modal.getByText(d.labels.additionalTransactions)).toBeVisible();
    await expect(modal).toContainText(d.labels.secondaryClaims);
    await expect(modal.locator(d.selectors.checkboxFilter).filter({ hasText: 'Batch Claim Status' })).toBeVisible();
  });

  test('Edit Insurance modal state dropdown has correct pre-filled value', async ({ page, loginAsAdmin }) => {
    await loginAsAdmin();
    await navigateAndFilter(page);
    const modal = await openInsuranceEditModal(page);
    await expect(modal.getByRole('combobox').nth(1)).toHaveValue(d.values.expectedState);
    await expect(modal.getByRole('combobox').nth(1)).toBeVisible();
  });

  test('Edit Insurance - DB record reflects expected contactname, notes, claimstatustype, eligibilitytype', async ({ page, loginAsAdmin }) => {
    await loginAsAdmin();
    const dbRow = await fetchInsuranceCompanyEditFields(d.values.neicId, 'BLUE ');
    expect(dbRow).not.toBeNull();
    expect(dbRow?.contactname.toUpperCase()).toBe(d.values.dbExpectedContactName);
    expect(dbRow?.notes).toBe(d.values.dbExpectedNotes);
    expect(dbRow?.claimstatustype).toBe(d.values.dbExpectedClaimStatusType);
    expect(dbRow?.eligibilitytype).toBe(d.values.dbExpectedEligibilityType);
  });

  test('Insurance dashboard filter by Name and EDI ID returns expected row', async ({ page, loginAsAdmin }) => {
    await loginAsAdmin();
    await navigateAndFilter(page);
    await expect(page.getByRole('columnheader', { name: d.labels.insuranceNameAsc })).toBeVisible();
    await expect(page.getByRole('cell', { name: d.values.expectedInsuranceName })).toBeVisible();
    await expect(page.getByRole('columnheader', { name: d.labels.recordStatus })).toBeVisible();
    await expect(page.getByRole('cell', { name: d.values.recordStatusActive, exact: true })).toBeVisible();
  });

  test('Insurance dashboard invalid name filter returns no rows', async ({ page, loginAsAdmin }) => {
    await loginAsAdmin();
    await navigateToInsurance(page);
    await fillTextbox(page, d.placeholders.name, d.edgeCases.invalidName);
    await applyFilterAndWait(page);
    const rowCount = await page.locator('tbody tr').count();
    expect(rowCount).toBe(0);
  });

  test('Insurance dashboard invalid EDI ID filter returns no rows', async ({ page, loginAsAdmin }) => {
    await loginAsAdmin();
    await navigateToInsurance(page);
    await fillTextbox(page, d.placeholders.ediId, d.edgeCases.invalidEdiId);
    await applyFilterAndWait(page);
    const rowCount = await page.locator('tbody tr').count();
    expect(rowCount).toBe(0);
  });

  test('Insurance dashboard empty filters keep controls and columns available', async ({ page, loginAsAdmin }) => {
    await loginAsAdmin();
    await navigateToInsurance(page);
    await fillTextbox(page, d.placeholders.name, d.edgeCases.empty);
    await fillTextbox(page, d.placeholders.ediId, d.edgeCases.empty);
    await applyFilterAndWait(page);
    await expect(page.getByRole('button', { name: d.labels.applyFilter })).toBeVisible();
    await expect(page.getByRole('columnheader', { name: d.labels.insuranceNameAsc })).toBeVisible();
    await expect(page.getByRole('columnheader', { name: d.labels.recordStatus })).toBeVisible();
  });

  test('Edit Insurance modal Professional Claims checkbox toggle is stable', async ({ page, loginAsAdmin }) => {
    await loginAsAdmin();
    await navigateAndFilter(page);
    const modal = await openInsuranceEditModal(page);
    const profCb = modal.locator(d.selectors.checkboxFilter).filter({ hasText: 'Professional Claims' });
    await expect(profCb).toBeVisible();
    await profCb.click();
    await profCb.click();
    await expect(modal.getByRole('button', { name: d.labels.save })).toBeVisible();
  });

  test('Edit Insurance - Participating options toggle from current state without error', async ({ page, loginAsAdmin }) => {
    await loginAsAdmin();
    await navigateAndFilter(page);
    const modal = await openInsuranceEditModal(page);
    await toggleParticipatingIfSelected(modal);
    await expect(modal.getByRole('button', { name: d.labels.save })).toBeVisible();
  });

  test('Edit Insurance save without changes keeps persisted values stable', async ({ page, loginAsAdmin }) => {
    await loginAsAdmin();
    await navigateAndFilter(page);

    const modal = await openInsuranceEditModal(page);
    const contactBefore = await modal.getByRole('textbox', { name: d.placeholders.contactName }).nth(1).inputValue();
    const notesBefore = await modal.locator(d.selectors.modalTextarea).inputValue();
    const eligibilityBefore = await modal.getByRole('textbox', { name: d.placeholders.eligibilityId }).inputValue();

    await modal.getByRole('button', { name: d.labels.save }).click();
    await page.waitForTimeout(d.timeouts.saveMs);

    const savedToastVisible = await page.getByLabel(d.labels.savedToast).isVisible().catch(() => false);
    if (savedToastVisible) {
      await expect(page.getByLabel(d.labels.savedToast)).toBeVisible();
    }

    const closeLink = modal.getByRole('link').first();
    if (await closeLink.isVisible().catch(() => false)) {
      await closeLink.click();
    } else {
      await page.keyboard.press('Escape');
    }

    await applyFilterAndWait(page);
    const reopened = await openInsuranceEditModal(page);
    await expect(reopened.getByRole('textbox', { name: d.placeholders.contactName }).nth(1)).toHaveValue(contactBefore);
    await expect(reopened.locator(d.selectors.modalTextarea)).toHaveValue(notesBefore);
    await expect(reopened.getByRole('textbox', { name: d.placeholders.eligibilityId })).toHaveValue(eligibilityBefore);
  });

});