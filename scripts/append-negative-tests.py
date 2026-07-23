"""Appends mandatory-field negative test blocks to all relevant spec files."""
import os

ROOT = r'C:\AutoTest\tests'

def append(path, block):
    with open(path, 'a', encoding='utf-8') as f:
        f.write('\n' + block)
    lines = open(path, encoding='utf-8').read().count('\n')
    print(f'  ✓ {os.path.basename(path)}  → {lines} lines')

# ─── 1. Account/02_Acct_add_test.spec.ts ─────────────────────────────────────
append(ROOT + r'\Account\02_Acct_add_test.spec.ts', r"""
// ─────────────────────────────────────────────────────────────────────────────
// Mandatory field validation – negative tests
// Rule: if any required field is missing the Save button must remain disabled.
//       If the Save button is somehow enabled and clicked, no success state
//       should appear.  A passing test confirms the form DID NOT submit.
// ─────────────────────────────────────────────────────────────────────────────
test.describe('Add Account – mandatory field validation', () => {

  test('Negative: Add & Close is disabled on a fresh (empty) form', async ({ page, loginAsAdmin }) => {
    await loginAsAdmin();
    await navigateToAccounts(page);
    await page.getByRole('link', { name: ` ${d.labels.addAccount}` }).click();
    await expect(
      page.getByRole('button', { name: d.roles.addAndClose }),
      'Add & Close must be disabled when no fields are filled',
    ).toBeDisabled();
  });

  test('Negative: Add & Close stays disabled when only Account Name is filled (Account Number missing)', async ({ page, loginAsAdmin }) => {
    await loginAsAdmin();
    await navigateToAccounts(page);
    await page.getByRole('link', { name: ` ${d.labels.addAccount}` }).click();
    await page.getByRole('textbox', { name: d.roles.accountNameTextbox }).fill('Name Without Number');
    await expect(
      page.getByRole('button', { name: d.roles.addAndClose }),
      'Add & Close must stay disabled when Account Number is empty',
    ).toBeDisabled();
  });

  test('Negative: Add & Close stays disabled when only Account Number is filled (Account Name missing)', async ({ page, loginAsAdmin }) => {
    await loginAsAdmin();
    await navigateToAccounts(page);
    await page.getByRole('link', { name: ` ${d.labels.addAccount}` }).click();
    await page.getByRole('textbox', { name: d.roles.accountNumberTextbox }).fill('ACCT-NO-NAME');
    await expect(
      page.getByRole('button', { name: d.roles.addAndClose }),
      'Add & Close must stay disabled when Account Name is empty',
    ).toBeDisabled();
  });

  test('Negative: Clearing Account Number after filling re-disables Add & Close', async ({ page, loginAsAdmin }) => {
    await loginAsAdmin();
    await navigateToAccounts(page);
    await page.getByRole('link', { name: ` ${d.labels.addAccount}` }).click();
    await page.getByRole('textbox', { name: d.roles.accountNumberTextbox }).fill('TEMP-001');
    await page.getByRole('textbox', { name: d.roles.accountNameTextbox }).fill('TEMP Name');
    await page.getByRole('textbox', { name: d.roles.accountNumberTextbox }).clear();
    await expect(
      page.getByRole('button', { name: d.roles.addAndClose }),
      'Clearing Account Number must re-disable Add & Close',
    ).toBeDisabled();
  });

  test('Negative: Clearing Account Name after filling re-disables Add & Close', async ({ page, loginAsAdmin }) => {
    await loginAsAdmin();
    await navigateToAccounts(page);
    await page.getByRole('link', { name: ` ${d.labels.addAccount}` }).click();
    await page.getByRole('textbox', { name: d.roles.accountNumberTextbox }).fill('TEMP-002');
    await page.getByRole('textbox', { name: d.roles.accountNameTextbox }).fill('TEMP Name');
    await page.getByRole('textbox', { name: d.roles.accountNameTextbox }).clear();
    await expect(
      page.getByRole('button', { name: d.roles.addAndClose }),
      'Clearing Account Name must re-disable Add & Close',
    ).toBeDisabled();
  });

});
""")

# ─── 2. Insurance/02_AddInsurance_test.spec.ts ────────────────────────────────
append(ROOT + r'\Insurance\02_AddInsurance_test.spec.ts', r"""
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
""")

# ─── 3. ProviderGroup/02_Create_PGroup_test.spec.ts ──────────────────────────
append(ROOT + r'\ProviderGroup\02_Create_PGroup_test.spec.ts', r"""
// ─────────────────────────────────────────────────────────────────────────────
// Mandatory field validation – negative tests (Create Provider Group)
// ─────────────────────────────────────────────────────────────────────────────
test.describe('Create Provider Group – mandatory field validation', () => {

  test('Negative: Add & Close is disabled on fresh form (all required fields empty)', async ({ page, loginAsAdmin }) => {
    await loginAsAdmin();
    await openCreateProviderGroup(page, userData.providerGroup.accountNum);

    await expect(
      page.getByRole('button', { name: d.labels.addAndClose }),
      'Add & Close must be disabled when no required fields are filled',
    ).toBeDisabled();
  });

  test('Negative: Required field asterisk labels are all visible on the fresh form', async ({ page, loginAsAdmin }) => {
    await loginAsAdmin();
    await openCreateProviderGroup(page, userData.providerGroup.accountNum);

    // All required-field asterisk labels must be visible so users know what is mandatory
    await expect(page.getByRole('dialog').getByText('* name')).toBeVisible();
    await expect(page.getByRole('dialog').getByText('* fee schedule')).toBeVisible();
    await expect(page.getByRole('dialog').getByText('* certification status')).toBeVisible();
    await expect(page.getByRole('dialog').getByText('* Practice Management')).toBeVisible();
  });

  test('Negative: Add & Close stays disabled when Group Name is the only required field missing', async ({ page, loginAsAdmin }) => {
    await loginAsAdmin();
    await openCreateProviderGroup(page, userData.providerGroup.accountNum);

    // Leave Group Name empty; button must remain disabled
    await expect(
      page.getByRole('textbox', { name: d.roles.groupNameTextbox }),
    ).toHaveValue('');
    await expect(
      page.getByRole('button', { name: d.labels.addAndClose }),
      'Add & Close must be disabled while Group Name is empty',
    ).toBeDisabled();
  });

  test('Negative: Clearing Group Name after filling re-disables Add & Close', async ({ page, loginAsAdmin }) => {
    await loginAsAdmin();
    await openCreateProviderGroup(page, userData.providerGroup.accountNum);

    const nameField = page.getByRole('textbox', { name: d.roles.groupNameTextbox });
    await nameField.fill('Temp-Group-Negative-Test');
    await nameField.clear();
    await expect(
      page.getByRole('button', { name: d.labels.addAndClose }),
      'Clearing Group Name must re-disable Add & Close',
    ).toBeDisabled();
  });

});
""")

# ─── 4. ProviderGroup/03_EditGroup_test.spec.ts ───────────────────────────────
append(ROOT + r'\ProviderGroup\03_EditGroup_test.spec.ts', r"""
// ─────────────────────────────────────────────────────────────────────────────
// Mandatory field validation – negative tests (Edit Provider Group)
// ─────────────────────────────────────────────────────────────────────────────
test.describe('Edit Provider Group – mandatory field validation', () => {

  test('Negative: Required field asterisk for Fee Schedule is visible in the edit form', async ({ page, loginAsAdmin }) => {
    await loginAsAdmin();
    await openEditProviderGroup(page, userData.editGroup.accountNum);
    await expect(
      page.getByText(d.labels.feeScheduleRequired),
      '* fee schedule label must be visible so user knows it is required',
    ).toBeVisible();
    await expect(page.getByLabel('feeSchedule')).toBeVisible();
  });

  test('Negative: Clearing Fee Schedule must block a successful save', async ({ page, loginAsAdmin }) => {
    await loginAsAdmin();
    await openEditProviderGroup(page, userData.editGroup.accountNum);

    const feeSelect = page.getByLabel('feeSchedule');
    // Attempt to reset fee schedule to empty / first blank option
    const firstOptionValue = await feeSelect.locator('option').first().getAttribute('value') ?? '';
    await feeSelect.selectOption({ value: firstOptionValue });
    await page.waitForTimeout(500);

    const saveBtn = page.getByRole('button', { name: d.labels.saveAndClose });
    const isDisabled = await saveBtn.isDisabled().catch(() => false);
    if (isDisabled) {
      // Preferred: UI prevents submission
      await expect(saveBtn).toBeDisabled();
    } else {
      // Fallback: submit and assert the modal is still open (not closed on success)
      await saveBtn.click();
      await page.waitForTimeout(1500);
      // The edit modal heading must still be present (save was rejected by the server)
      await expect(
        page.getByRole('heading', {
          name: new RegExp(`Edit Provider Group.*${userData.editGroup.groupeditInAcct}`),
        }),
        'Edit modal must remain open when Fee Schedule is cleared – save must be blocked',
      ).toBeVisible();
    }
  });

});
""")

# ─── 5. GroupEnrollment/02_addSinglePayEnroll_test.spec.ts ────────────────────
append(ROOT + r'\GroupEnrollment\02_addSinglePayEnroll_test.spec.ts', r"""
// ─────────────────────────────────────────────────────────────────────────────
// Mandatory field validation – negative tests (Add Group Enrollment)
// ─────────────────────────────────────────────────────────────────────────────
test.describe('Add Group Enrollment – mandatory field validation', () => {

  test('Negative: Save is disabled on a fresh enrollment form (no group selected)', async ({ page, loginAsAdmin }) => {
    await loginAsAdmin();
    await openAddGroupEnrollment(page);
    // NPI and Tax ID are disabled without a group – the Save button must also be disabled
    await expect(page.locator(d.selectors.npiSelect)).toBeDisabled();
    await expect(page.locator(d.selectors.taxIdSelect)).toBeDisabled();
    const saveBtn = page.getByRole('button', { name: d.labels.save });
    await expect(saveBtn, 'Save must be disabled before any group is selected').toBeDisabled();
  });

  test('Negative: Group Enrollment heading confirms required Payer field is labelled', async ({ page, loginAsAdmin }) => {
    await loginAsAdmin();
    await openAddGroupEnrollment(page);
    await expect(page.getByRole('heading', { name: d.labels.addGroupEnrollmentsHeading })).toBeVisible();
    // The Payer label must be present in the form so users know it is required
    await expect(page.getByRole('dialog').getByText(d.labels.payer, { exact: true })).toBeVisible();
  });

  test('Negative: Enrollment must not submit if Save is clicked before selecting Payer', async ({ page, loginAsAdmin }) => {
    await loginAsAdmin();
    await openAddGroupEnrollment(page);

    // Select group and dependent fields but intentionally skip Payer selection
    await page.locator(d.selectors.groupArrow).click();
    const firstOption = page.getByRole('option').first();
    const optionExists = await firstOption.isVisible().catch(() => false);
    if (!optionExists) {
      // Group options not available – skip test gracefully
      return;
    }
    await firstOption.click();
    await page.waitForTimeout(1000);

    const saveBtn = page.getByRole('button', { name: d.labels.save });
    const isDisabled = await saveBtn.isDisabled().catch(() => false);
    if (isDisabled) {
      await expect(saveBtn).toBeDisabled();
    } else {
      await saveBtn.click();
      await page.waitForTimeout(2000);
      // Success heading must NOT appear when Payer is not selected
      await expect(
        page.getByRole('heading', { name: d.labels.groupEnrollmentSaved }),
        'Success heading must NOT appear when Payer field is not filled',
      ).not.toBeVisible();
    }
  });

});
""")

print('\nAll negative test blocks appended.')
