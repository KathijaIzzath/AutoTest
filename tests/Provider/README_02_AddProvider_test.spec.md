# Test File: `Provider/02_AddProvider_test.spec.ts`

**Module:** Provider — Add Provider  
**Location:** `tests/Provider/02_AddProvider_test.spec.ts`  
**Test Data:** `testData/AddProviderTestData.json`, `testData/UserInfo.json`  
**Fixture:** `loginAsAdmin` (via `tests/myTestData.ts`)  
**Navigation Helper:** `navigateToAccounts`

---

## Test Cases

| # | Test Name | Type |
|---|-----------|------|
| 1 | Add provider via Accounts dashboard functionality & control/elements verification test execution | Functional |
| 2 | Add Provider step-1 field visibility and availability | Visibility |
| 3 | Accounts invalid filter should show no rows before Add Provider flow | Edge Case |
| 4 | Add Provider with required fields empty keeps dialog in stable validation state | Validation |
| 5 | Duplicate Provider Add Details attempt keeps app stable and does not close setup unexpectedly | Edge Case |

---

### Test 1 — Full Add Provider functional flow
Navigates to Accounts, filters by the automation account (`AUTOMATIONTESTACC01`), opens the account row, navigates to the Provider Group (`G31943`), clicks Add Provider, completes the multi-step provider form (NPI, Tax ID, personal details, certifications, service type checkboxes), and submits; confirms the success state.

### Test 2 — Add Provider step-1 field visibility
Navigates to the Add Provider modal and confirms step-1 form fields (NPI input, Tax ID input, Search/Lookup button) are visible and enabled.

### Test 3 — Invalid account filter shows no rows
Enters an invalid account number in the Accounts filter, applies filter, and confirms no matching rows appear.

### Test 4 — Required fields empty validation stability
Opens Add Provider with clean setup data, clicks Next without entering required first/last name values, and verifies inline required-field validation is displayed while the setup dialog remains open.

### Test 5 — Duplicate Add Details stability
On Provider ID step, adds valid TAX and NPI identifiers, then attempts to add a duplicate TAX identifier and verifies the flow remains stable (duplicate warning or existing-row state) without closing the setup unexpectedly.

---

**Total Tests:** 5  
**Helpers:** `openAccountAndGroup`, `openAddProviderModal`, `addProviderIdentifiers`
