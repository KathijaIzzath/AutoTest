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

---

### Test 1 — Full Add Provider functional flow
Navigates to Accounts, filters by the automation account (`AUTOMATIONTESTACC01`), opens the account row, navigates to the Provider Group (`G31943`), clicks Add Provider, completes the multi-step provider form (NPI, Tax ID, personal details, certifications, service type checkboxes), and submits; confirms the success state.

### Test 2 — Add Provider step-1 field visibility
Navigates to the Add Provider modal and confirms step-1 form fields (NPI input, Tax ID input, Search/Lookup button) are visible and enabled.

### Test 3 — Invalid account filter shows no rows
Enters an invalid account number in the Accounts filter, applies filter, and confirms no matching rows appear.

---

**Total Tests:** 3  
**Helpers:** `openAccountAndGroup`, `openAddProviderModal`, `addProviderIdentifiers`
