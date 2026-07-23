# Mandatory Field Validation – Negative Test Convention

**Applies to:** Every test file in `tests/` that covers a form with a Submit / Save / Add / Generate button.

---

## Rule

> **If a mandatory field is not filled, the form must not submit.  
> If it does submit successfully, the test must FAIL.**

Every form spec file **must** include a `test.describe('… mandatory field validation', ...)` block that contains at least the negative tests listed below.

---

## Required test patterns per form type

### Pattern A — Button-disabled enforcement  
*Use when the UI disables the submit button until all required fields are filled.*

```typescript
test.describe('MyScreen – mandatory field validation', () => {

  test('Negative: Submit button is disabled on fresh empty form', async ({ page, loginAsAdmin }) => {
    await loginAsAdmin();
    await openMyForm(page);
    await expect(
      page.getByRole('button', { name: d.labels.submitButton }),
      'Submit must be disabled when no required fields are filled',
    ).toBeDisabled();
  });

  test('Negative: Submit stays disabled when only FieldA is filled (FieldB missing)', async ({ page, loginAsAdmin }) => {
    await loginAsAdmin();
    await openMyForm(page);
    await page.getByRole('textbox', { name: d.placeholders.fieldA }).fill('some value');
    await expect(
      page.getByRole('button', { name: d.labels.submitButton }),
      'Submit must stay disabled when FieldB is still empty',
    ).toBeDisabled();
  });

  test('Negative: Clearing a required field after filling re-disables the Submit button', async ({ page, loginAsAdmin }) => {
    await loginAsAdmin();
    await openMyForm(page);
    const fieldA = page.getByRole('textbox', { name: d.placeholders.fieldA });
    const fieldB = page.getByRole('textbox', { name: d.placeholders.fieldB });
    await fieldA.fill('value A');
    await fieldB.fill('value B');
    await fieldA.clear();
    await expect(
      page.getByRole('button', { name: d.labels.submitButton }),
      'Clearing FieldA must re-disable Submit',
    ).toBeDisabled();
  });

});
```

### Pattern B — No success toast / confirmation  
*Use when the UI does not disable the button but the save is blocked server-side or by validation.*

```typescript
test('Negative: Form must not succeed when RequiredField is empty', async ({ page, loginAsAdmin }) => {
  await loginAsAdmin();
  await openMyForm(page);

  // Fill all OTHER fields, leave RequiredField intentionally empty
  await page.getByRole('textbox', { name: d.placeholders.otherField }).fill('value');

  const submitBtn = page.getByRole('button', { name: d.labels.submitButton });
  const isDisabled = await submitBtn.isDisabled().catch(() => false);

  if (isDisabled) {
    // Preferred: button is disabled — form cannot be submitted
    await expect(submitBtn).toBeDisabled();
  } else {
    // Fallback: click and assert success state did NOT appear
    await submitBtn.click();
    await page.waitForTimeout(d.timeouts.saveMs ?? 3000);
    await expect(
      page.getByLabel(d.labels.successToast),
      'Success toast must NOT appear when RequiredField is empty',
    ).not.toBeVisible();
  }
});
```

### Pattern C — Validation error message  
*Use when the form shows an inline `"This field is required"` message.*

```typescript
test('Negative: Required validation error appears when form submitted with empty FieldA', async ({ page, loginAsAdmin }) => {
  await loginAsAdmin();
  await openMyForm(page);

  await page.getByRole('button', { name: d.labels.submitButton }).click();
  await expect(
    page.getByText('This field is required').first(),
    'Required validation message must appear for FieldA',
  ).toBeVisible();
  await expect(
    page.getByRole('textbox', { name: d.placeholders.fieldA }),
  ).toHaveValue('');
});
```

### Pattern D — Report / filter form (no group = no data rows)  
*Use when the form generates a report. The report table must NOT show data when a mandatory filter (e.g. Group) is missing.*

```typescript
test('Negative: Generate Report without selecting a group must not produce data rows', async ({ page, loginAsAdmin }) => {
  await loginAsAdmin();
  await openMyReport(page);
  await page.getByRole('button', { name: d.labels.generateReport }).click();
  await page.waitForTimeout(d.timeouts.filterMs);

  // Page must not crash
  await expect(page.locator(d.selectors.dashboardLayout)).toBeVisible();

  // If a table appears it must have zero data rows
  const tableVisible = await page.getByRole('table').isVisible().catch(() => false);
  if (tableVisible) {
    const dataRowCount = await page.locator('tbody tr').count();
    expect(
      dataRowCount,
      'No data rows must appear in the report when the Group field is empty',
    ).toBe(0);
  }
});
```

---

## Mandatory fields per screen (current)

| File | Mandatory fields | Pattern used |
|---|---|---|
| `Account/02_Acct_add_test.spec.ts` | Account Number, Account Name | A |
| `Insurance/02_AddInsurance_test.spec.ts` | Claim Status ID, Eligibility ID, Type radios | B |
| `Payer/02_AddPayer_test.spec.ts` | SC Insurance ID, Payer ID, Name, Contact, Phone, Billing Indicator, State, Active checkbox | A ✅ already covered |
| `Payer/03_EditPayer_test.spec.ts` | Payer Contact | B ✅ already covered |
| `Provider/02_AddProvider_test.spec.ts` | First Name, Last Name | C ✅ already covered |
| `ProviderGroup/02_Create_PGroup_test.spec.ts` | Group Name, Fee Schedule, Certification Status, Practice Mgmt | A |
| `ProviderGroup/03_EditGroup_test.spec.ts` | Fee Schedule | B |
| `GroupEnrollment/02_addSinglePayEnroll_test.spec.ts` | Group, Payer, Enrollment Type | A+B |
| `Analytics_Report/02_ClaimsSummary_test.spec.ts` | Group | D |
| `Analytics_Report/04_PayerRejected_test.spec.ts` | Group | D |
| `01_Mainlogin_test.spec.ts` | Username, Password | A ✅ already covered |

---

## Checklist for new form test files

When adding a new form screen test file, complete this checklist before merging:

- [ ] Identify all fields marked `*` (required) in the UI
- [ ] Identify any fields whose absence disables the submit button
- [ ] Add a `test.describe('… mandatory field validation', ...)` block
- [ ] For each mandatory field: add at least one test asserting the form does NOT submit without it
- [ ] Use **Pattern A** when the button disables → assert `toBeDisabled()`
- [ ] Use **Pattern B** when the button stays enabled → assert success toast `not.toBeVisible()`
- [ ] Use **Pattern C** when the form shows inline error messages → assert error text `toBeVisible()`
- [ ] Use **Pattern D** for report/filter forms → assert zero data rows in the table
- [ ] Store all labels, placeholders, and success toast text in the JSON test data file
- [ ] Run `npm run typecheck` to confirm zero errors
