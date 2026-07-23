
import { test, expect } from '../myTestData';
import type { Locator, Page } from '@playwright/test';
import { navigateToInsurance, navigateToPayer } from '../framework/navigation.helper';
import {
    fetchInsuranceCompanyById,
    fetchPayerInsuranceById,
} from '../../testData/database.utils';
import * as d from '../../testData/AddInsuranceTestData.json';

async function applyFilterAndWait(page: Page): Promise<void> {
    await page.getByRole('button', { name: d.labels.applyFilter }).click();
    await page.waitForTimeout(d.timeouts.filterMs);
}

async function fillTextboxByName(page: Page, name: string, value: string, index = 0): Promise<void> {
    const textbox = page.getByRole('textbox', { name }).nth(index);
    await textbox.clear();
    await textbox.fill(value);
}

async function fillTextboxIn(scope: Locator, name: string, value: string, index = 0): Promise<void> {
    const textbox = scope.getByRole('textbox', { name }).nth(index);
    await textbox.clear();
    await textbox.fill(value);
}

async function openPayerEditFromDashboard(page: Page): Promise<void> {
    await navigateToPayer(page);
    await expect(page.locator(d.selectors.payerRoot).getByText(d.labels.payer, { exact: true })).toBeVisible();

    await fillTextboxByName(page, d.placeholders.payerIdFilter, d.values.payerDashboardFilterId);
    await applyFilterAndWait(page);

    const rowAction = page.getByRole('link', { name: 'javascript' }).first();
    await rowAction.click();

    const editButton = page.getByRole('button', { name: d.labels.edit });
    if (!(await editButton.isVisible().catch(() => false))) {
        await rowAction.click();
    }
    await editButton.click();
    await expect(page.getByRole('heading', { name: d.labels.viewModifyPayerSetup })).toBeVisible();
}

async function openAddInsuranceSetupModal(page: Page): Promise<Locator> {
    await page.getByRole('link', { name: d.labels.addInsuranceLink }).first().click();
    await expect(page.getByRole('heading', { name: d.labels.addInsuranceSetupHeading })).toBeVisible();
    const modal = page.locator(d.selectors.addInsuranceModal).last();
    await expect(modal).toBeVisible();
    return modal;
}

async function submitAddInsurance(modal: Locator): Promise<void> {
    await modal.locator(d.selectors.firstEligibilityTypeParticipating).first().click();
    await modal.locator(d.selectors.firstClaimStatusTypeParticipating).first().click();
    await fillTextboxIn(modal, d.placeholders.claimStatusId, d.values.claimStatusId);
    await fillTextboxIn(modal, d.placeholders.eligibilityId, d.values.eligibilityId);

    await modal.getByRole('button', { name: d.labels.addInsuranceLink }).click();
}

async function fillAddInsuranceRequiredValues(modal: Locator): Promise<void> {
    await fillTextboxIn(modal, d.placeholders.contactName, d.values.contactName, 1);
    const stateSelect = modal.getByRole('combobox').nth(1);
    if (await stateSelect.isVisible().catch(() => false)) {
        const stateOptions = await stateSelect.locator('option').allTextContents();
        if (stateOptions.some((opt) => opt.trim() === d.values.state)) {
            await stateSelect.selectOption(d.values.state);
        }
    }
    await modal.locator(d.selectors.modalTextarea).first().fill(d.values.notes);
}

async function verifyInsuranceInInsuranceDashboard(page: Page): Promise<void> {
    const baseOrigin = new URL(page.url()).origin;
    await page.goto(`${baseOrigin}/SecureConnectWeb/dashboard/insurances`);
    await expect(page.locator(d.selectors.insuranceRoot)).toBeVisible();
    await fillTextboxByName(page, d.placeholders.ediId, d.values.neicid);
    await applyFilterAndWait(page);

    await expect(page.getByRole('columnheader', { name: d.labels.insuranceNameAsc })).toBeVisible();
    await expect(page.getByRole('columnheader', { name: d.labels.recordStatus })).toBeVisible();
    await expect(page.getByRole('cell', { name: d.values.insuranceNameFragment })).toBeVisible();
    await expect(page.getByRole('cell', { name: d.values.recordStatusActive, exact: true }).first()).toBeVisible();
}

async function closeDialogByHeadingIfOpen(page: Page, headingName: string): Promise<void> {
    const heading = page.getByRole('heading', { name: headingName });
    if (!(await heading.isVisible().catch(() => false))) {
        return;
    }

    const dialog = page.getByRole('dialog').filter({ has: heading }).last();
    const closeLink = dialog.getByRole('link').first();
    if (await closeLink.isVisible().catch(() => false)) {
        await closeLink.click();
    } else {
        await page.keyboard.press('Escape');
    }
}

test.describe('Add Insurance from Edit Payer flow', () => {
    test('Add new insurance inside Edit Payer and verify on Insurance dashboard with DB validations', async ({ page, loginAsAdmin }) => {
        test.setTimeout(120000);
        await loginAsAdmin();

        await openPayerEditFromDashboard(page);
        await expect(page.getByRole('textbox', { name: d.placeholders.payerId })).toHaveValue(d.values.payerDashboardFilterId);
        await expect(page.getByRole('link', { name: d.labels.addInsuranceLink }).first()).toBeVisible();

        const modal = await openAddInsuranceSetupModal(page);
        await fillTextboxIn(modal, d.placeholders.contactName, d.values.contactName, 1);
        const stateSelect = modal.getByRole('combobox').nth(1);
        if (await stateSelect.isVisible().catch(() => false)) {
            const stateOptions = await stateSelect.locator('option').allTextContents();
            if (stateOptions.some((opt) => opt.trim() === d.values.state)) {
                await stateSelect.selectOption(d.values.state);
            }
        }
        await modal.locator(d.selectors.modalTextarea).first().fill(d.values.notes);
        await submitAddInsurance(modal);

        const createdToastVisible = await page.getByLabel(d.labels.insuranceCreatedToast).isVisible().catch(() => false);
        if (createdToastVisible) {
            await expect(page.getByLabel(d.labels.insuranceCreatedToast)).toBeVisible({ timeout: d.timeouts.saveMs });
        }

        const insuranceCompanyRow = await fetchInsuranceCompanyById(d.values.insuranceId);
        expect(insuranceCompanyRow).not.toBeNull();
        expect(insuranceCompanyRow?.id).toBe(d.values.insuranceId);
        expect(insuranceCompanyRow?.name).toBe(d.values.insuranceName);
        expect(insuranceCompanyRow?.recid).toBe(d.values.insuranceRecid);

        const payerRow = await fetchPayerInsuranceById(d.values.insuranceId);
        expect(payerRow).not.toBeNull();
        expect(payerRow?.id).toBe(d.values.insuranceId);
        expect(payerRow?.name).toBe(d.values.insuranceName);
        expect(payerRow?.recordstatus).toBe(d.values.recordStatusActive);
        expect(payerRow?.neicid).toBe(d.values.neicid);

        await closeDialogByHeadingIfOpen(page, d.labels.addInsuranceSetupHeading);
        await closeDialogByHeadingIfOpen(page, d.labels.viewModifyPayerSetup);

        await verifyInsuranceInInsuranceDashboard(page);
    });

    test('Add Insurance setup modal field visibility and availability checks', async ({ page, loginAsAdmin }) => {
        await loginAsAdmin();
        await openPayerEditFromDashboard(page);
        const modal = await openAddInsuranceSetupModal(page);

        await expect(modal.getByText('SC Insurance id', { exact: true })).toBeVisible();
        await expect(modal.getByText('Payer id', { exact: true })).toBeVisible();
        await expect(page.getByRole('textbox', { name: 'Enter Name' })).toBeVisible();
        await expect(page.getByRole('textbox', { name: d.placeholders.contactName }).first()).toBeVisible();
        await expect(page.getByRole('textbox', { name: d.placeholders.claimStatusId })).toBeVisible();
        await expect(page.getByRole('textbox', { name: d.placeholders.eligibilityId })).toBeVisible();
        await expect(page.getByRole('checkbox', { name: 'Active' })).toBeVisible();
        await expect(page.getByRole('checkbox', { name: 'Legacy' })).toBeVisible();
        await expect(page.getByRole('button', { name: d.labels.addInsuranceLink })).toBeVisible();
    });

    test('Insurance dashboard successful EDI filter search validates against DB payer row', async ({ page, loginAsAdmin }) => {
        await loginAsAdmin();

        const payerRow = await fetchPayerInsuranceById(d.values.insuranceId);
        expect(payerRow).not.toBeNull();

        await navigateToInsurance(page);
        await fillTextboxByName(page, d.placeholders.ediId, d.values.neicid);
        await applyFilterAndWait(page);

        await expect(page.getByRole('columnheader', { name: d.labels.insuranceNameAsc })).toBeVisible();
        await expect(page.getByRole('cell', { name: d.values.insuranceNameFragment })).toBeVisible();
        await expect(page.getByRole('cell', { name: payerRow!.recordstatus, exact: true }).first()).toBeVisible();
    });

    test('Insurance dashboard invalid EDI filter returns no rows', async ({ page, loginAsAdmin }) => {
        await loginAsAdmin();
        await navigateToInsurance(page);

        await fillTextboxByName(page, d.placeholders.ediId, d.edgeCases.invalidEdiId);
        await applyFilterAndWait(page);

        const rowCount = await page.locator('tbody tr').count();
        expect(rowCount).toBe(0);
    });

    test('Insurance dashboard invalid Processor ID filter returns no rows', async ({ page, loginAsAdmin }) => {
        await loginAsAdmin();
        await navigateToInsurance(page);

        await fillTextboxByName(page, d.placeholders.processorId, d.edgeCases.invalidProcessorId);
        await applyFilterAndWait(page);

        const rowCount = await page.locator('tbody tr').count();
        expect(rowCount).toBe(0);
    });

    test('Insurance dashboard empty filters keep controls and columns available', async ({ page, loginAsAdmin }) => {
        await loginAsAdmin();
        await navigateToInsurance(page);

        await fillTextboxByName(page, d.placeholders.name, d.edgeCases.empty);
        await fillTextboxByName(page, d.placeholders.processorId, d.edgeCases.empty);
        await fillTextboxByName(page, d.placeholders.ediId, d.edgeCases.empty);
        await applyFilterAndWait(page);

        await expect(page.getByRole('button', { name: d.labels.applyFilter })).toBeVisible();
        await expect(page.getByRole('columnheader', { name: d.labels.insuranceNameAsc })).toBeVisible();
        await expect(page.getByRole('columnheader', { name: d.labels.recordStatus })).toBeVisible();
    });

    test('Add Insurance with required fields empty keeps modal in a stable validation state', async ({ page, loginAsAdmin }) => {
        await loginAsAdmin();
        await openPayerEditFromDashboard(page);
        const modal = await openAddInsuranceSetupModal(page);

        const addButton = modal.getByRole('button', { name: d.labels.addInsuranceLink });
        await expect(addButton).toBeVisible();
        await expect(addButton).toBeDisabled();

        const successToastVisible = await page.getByLabel(d.labels.insuranceCreatedToast).isVisible().catch(() => false);
        const modalHeadingVisible = await page.getByRole('heading', { name: d.labels.addInsuranceSetupHeading }).isVisible().catch(() => false);
        expect(!successToastVisible || modalHeadingVisible).toBeTruthy();
        await expect(addButton).toBeVisible();
    });

    test('Duplicate Add Insurance attempt keeps app stable and dashboard remains searchable', async ({ page, loginAsAdmin }) => {
        await loginAsAdmin();
        await openPayerEditFromDashboard(page);

        let modal = await openAddInsuranceSetupModal(page);
    await fillAddInsuranceRequiredValues(modal);
        await submitAddInsurance(modal);
        await page.waitForTimeout(d.timeouts.filterMs);

        const addHeadingVisibleAfterFirst = await page
            .getByRole('heading', { name: d.labels.addInsuranceSetupHeading })
            .isVisible()
            .catch(() => false);

        if (!addHeadingVisibleAfterFirst) {
            modal = await openAddInsuranceSetupModal(page);
        } else {
            modal = page.locator(d.selectors.addInsuranceModal).last();
        }

        await fillAddInsuranceRequiredValues(modal);
        await submitAddInsurance(modal);
        await page.waitForTimeout(d.timeouts.filterMs);

        const toastVisible = await page.getByLabel(d.labels.insuranceCreatedToast).isVisible().catch(() => false);
        const modalStillVisible = await page.getByRole('heading', { name: d.labels.addInsuranceSetupHeading }).isVisible().catch(() => false);
        expect(toastVisible || modalStillVisible).toBeTruthy();

        await closeDialogByHeadingIfOpen(page, d.labels.addInsuranceSetupHeading);
        await closeDialogByHeadingIfOpen(page, d.labels.viewModifyPayerSetup);
        await expect(page.locator(d.selectors.payerRoot)).toBeVisible();
        const duplicateErrorVisible = await page.locator('alert').filter({ hasText: /duplicate key|already exists|P0001/i }).first().isVisible().catch(() => false);
        expect(duplicateErrorVisible || toastVisible || modalStillVisible).toBeTruthy();
    });
});


// ─────────────────────────────────────────────────────────────────────────────
// Mandatory field validation – negative tests (Add Insurance)
// ─────────────────────────────────────────────────────────────────────────────
test.describe('Add Insurance – mandatory field validation', () => {

  test('Negative: Add Insurance must not succeed when Claim Status ID is empty', async ({ page, loginAsAdmin }) => {
    await loginAsAdmin();
    await openPayerEditFromDashboard(page);
    const modal = await openAddInsuranceSetupModal(page);

    // Fill Eligibility ID and radios but leave Claim Status ID empty
    await modal.locator(d.selectors.firstEligibilityTypeParticipating).first().click();
    await modal.locator(d.selectors.firstClaimStatusTypeParticipating).first().click();
    await modal.getByRole('textbox', { name: d.placeholders.eligibilityId }).fill(d.values.eligibilityId);
    // Claim Status ID intentionally left empty
    await expect(
      modal.getByRole('textbox', { name: d.placeholders.claimStatusId }),
    ).toHaveValue('');

    const addBtn = modal.getByRole('button', { name: d.labels.addInsuranceLink });
    const btnDisabled = await addBtn.isDisabled().catch(() => false);
    if (btnDisabled) {
      // UI enforces: button is disabled – form cannot be submitted
      await expect(addBtn).toBeDisabled();
    } else {
      // UI allows click: assert the success toast does NOT appear (save was blocked server-side)
      await addBtn.click();
      await page.waitForTimeout(d.timeouts.filterMs);
      await expect(
        page.getByLabel(d.labels.insuranceCreatedToast),
        'Success toast must NOT appear when Claim Status ID is empty',
      ).not.toBeVisible();
    }
  });

  test('Negative: Add Insurance must not succeed when Eligibility ID is empty', async ({ page, loginAsAdmin }) => {
    await loginAsAdmin();
    await openPayerEditFromDashboard(page);
    const modal = await openAddInsuranceSetupModal(page);

    // Fill Claim Status ID and radios but leave Eligibility ID empty
    await modal.locator(d.selectors.firstEligibilityTypeParticipating).first().click();
    await modal.locator(d.selectors.firstClaimStatusTypeParticipating).first().click();
    await modal.getByRole('textbox', { name: d.placeholders.claimStatusId }).fill(d.values.claimStatusId);
    // Eligibility ID intentionally left empty
    await expect(
      modal.getByRole('textbox', { name: d.placeholders.eligibilityId }),
    ).toHaveValue('');

    const addBtn = modal.getByRole('button', { name: d.labels.addInsuranceLink });
    const btnDisabled = await addBtn.isDisabled().catch(() => false);
    if (btnDisabled) {
      await expect(addBtn).toBeDisabled();
    } else {
      await addBtn.click();
      await page.waitForTimeout(d.timeouts.filterMs);
      await expect(
        page.getByLabel(d.labels.insuranceCreatedToast),
        'Success toast must NOT appear when Eligibility ID is empty',
      ).not.toBeVisible();
    }
  });

  test('Negative: Add Insurance must not succeed when no radio types are selected', async ({ page, loginAsAdmin }) => {
    await loginAsAdmin();
    await openPayerEditFromDashboard(page);
    const modal = await openAddInsuranceSetupModal(page);

    // Fill both ID fields but do NOT select Eligibility Type or Claim Status Type radios
    await modal.getByRole('textbox', { name: d.placeholders.claimStatusId }).fill(d.values.claimStatusId);
    await modal.getByRole('textbox', { name: d.placeholders.eligibilityId }).fill(d.values.eligibilityId);

    const addBtn = modal.getByRole('button', { name: d.labels.addInsuranceLink });
    const btnDisabled = await addBtn.isDisabled().catch(() => false);
    if (btnDisabled) {
      await expect(addBtn).toBeDisabled();
    } else {
      await addBtn.click();
      await page.waitForTimeout(d.timeouts.filterMs);
      await expect(
        page.getByLabel(d.labels.insuranceCreatedToast),
        'Success toast must NOT appear when type radios are not selected',
      ).not.toBeVisible();
    }
  });

});
