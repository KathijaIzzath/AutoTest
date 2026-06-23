# Test File: `GroupEnrollment/02_addSinglePayEnroll_test.spec.ts`

**Module:** Group Enrollment — Add Single Payer Enrollment  
**Location:** `tests/GroupEnrollment/02_addSinglePayEnroll_test.spec.ts`  
**Test Data:** `testData/SinglePayEnrollTestData.json`, `testData/UserInfo.json`  
**Fixture:** `loginAsAdmin` (via `tests/myTestData.ts`)

---

## Test Cases

| # | Test Name | Type |
|---|-----------|------|
| 1 | Add Single Pay Enrollment | Functional |
| 2 | Single payer enrollment modal field visibility and availability checks | Visibility |
| 3 | Single payer enrollment invalid group value should keep dependent dropdowns disabled | Edge Case |

---

### Test 1 — Add Single Pay Enrollment (full functional flow)
Navigates to Group Enrollments, clicks Add Enrollment, selects Group (by Group ID), selects NPI and Tax ID, chooses enrollment type (Professional), selects Payer, fills any additional fields, submits enrollment, and verifies the success confirmation.

### Test 2 — Modal field visibility and availability
Opens the Add Enrollment modal and confirms all form controls are visible: Group dropdown, NPI and Tax ID fields/dropdowns, Enrollment Type dropdown, Payer ID/Name fields, and submit/cancel buttons.

### Test 3 — Invalid group keeps dependents disabled
Enters an invalid / non-existent group value in the Group dropdown and confirms dependent dropdowns (NPI, Tax ID, Enrollment Type) remain disabled or unpopulated.

---

**Total Tests:** 3  
**Helpers:** `openAddGroupEnrollment`, `selectGroupNpiTax`
