# Test File: `Account/01_Acct_Dshbd_test.spec.ts`

**Module:** Accounts Dashboard  
**Location:** `tests/Account/01_Acct_Dshbd_test.spec.ts`  
**Test Data:** `testData/AcctDshbdTestData.json`  
**Fixture:** `loginAsAdmin` (via `tests/myTestData.ts`)  
**Navigation Helper:** `navigateToAccounts`

---

## Test Cases

| # | Test Name | Type |
|---|-----------|------|
| 1 | AccountDashboard control/elements verification test execution | Functional |
| 2 | Account Sorting search results control/elements verification test execution | Functional |
| 3 | Account dashboard filter controls visibility and availability | Visibility |
| 4 | Account dashboard invalid filters should not show known seeded account rows | Edge Case |

---

### Test 1 — AccountDashboard control/elements verification
Verifies column headers, seeded account row cells, and filter behavior for Account Number, Account Name, City, State, Vendor, and NPI filters.

### Test 2 — Account Sorting search results
Verifies sorting by column headers (Account Number, Name, State, City, Address, Contact Name) and filtering by Provider Group ID, Provider ID, and Show Inactive Only checkbox.

### Test 3 — Filter controls visibility and availability
Confirms all filter fields (Account Number, Account Name, City, NPI, State dropdown, Vendor dropdown, Show Inactive Only checkbox, Apply Filter button) are visible.

### Test 4 — Invalid filters show no known rows
Fills Account Number, Account Name, and City filters with invalid values and confirms the seeded account cells do not appear.

---

**Total Tests:** 4  
**Helpers:** `openAccountsDashboard`, `applyFilters`, `fillTextboxByName`
