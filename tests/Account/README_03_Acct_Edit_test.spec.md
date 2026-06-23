# Test File: `Account/03_Acct_Edit_test.spec.ts`

**Module:** Account — Edit  
**Location:** `tests/Account/03_Acct_Edit_test.spec.ts`  
**Test Data:** `testData/AcctEditTestData.json`, `testData/UserInfo.json`  
**Fixture:** `loginAsAdmin` (via `tests/myTestData.ts`)  
**Navigation Helper:** `navigateToAccounts`  
**DB Dependencies:** `getTodaysDateWithYr`

---

## Test Cases

| # | Test Name | Type |
|---|-----------|------|
| 1 | Edit Newly created Account, verify Edit Screen elements test execution | Functional |
| 2 | Edit existing Account and test Edit Screen elements | Functional |
| 3 | Account Edit modal should show key controls availability before save | Visibility |
| 4 | Accounts filter should handle invalid account number with no-results state | Edge Case |

---

### Test 1 — Edit newly created account
Filters by the first auto-generated account number, opens Edit Account modal, waits for loading overlay to clear, resets and checks Claim Status / Eligibility / Statements checkboxes, clicks today's date rows, fills Email, Phone, Contact, Last 4 Digits, Expiry fields, and saves.

### Test 2 — Edit existing account
Filters by the designated edit-automation account (`EditAccAutoTest001`), opens Edit Account modal, verifies Phone, Email, Claim Status checkbox, date suffix, and key labels (Zip, Contact, Practice Management, ECS, ERA, Date Terminated, Date Setup, Last Updated By); uncheck/recheck Eligibility, fill Contact, and save.

### Test 3 — Modal key controls availability
Filters by the edit-automation account, opens Edit Account modal, confirms Email and Phone textboxes are visible and editable, Claim Status / Eligibility / Statements checkboxes are visible, and Save & Close button is visible and enabled.

### Test 4 — Invalid account number no-results state
Fills the account number filter with an invalid value, applies filter, and confirms the invalid cell has zero occurrences and a no-results message is visible.

---

**Total Tests:** 4
