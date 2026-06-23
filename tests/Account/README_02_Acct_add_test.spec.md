# Test File: `Account/02_Acct_add_test.spec.ts`

**Module:** Account — Add  
**Location:** `tests/Account/02_Acct_add_test.spec.ts`  
**Test Data:** `testData/AcctAddTestData.json`, `testData/UserInfo.json`  
**Fixture:** `loginAsAdmin` (via `tests/myTestData.ts`)  
**Navigation Helper:** `navigateToAccounts`  
**DB Dependencies:** `executeQuery` (account existence check and cleanup before add)

---

## Test Cases

| # | Test Name | Type |
|---|-----------|------|
| 1 | Account Add functional, screen control/elements verification test execution | Functional |
| 2 | Created Account Details verification tests execution | Functional |
| 3 | Account Add page required fields and controls visibility/availability check | Visibility |
| 4 | Account Add form should allow typing and clearing mandatory text fields | Interaction |
| 5 | Account filter should handle invalid/non-existing account number gracefully | Edge Case |

---

### Test 1 — Account Add functional verification
Opens the Add Account modal, verifies all form labels and fields (Account Number, Account Name, Practice Management, Tax Exempt Number, Address, Zip/City/State, Credit Card, Expiry, Notes, Contact, Phone, Fax, Email, checkboxes ECS/ERA/Claim Status/Eligibility/Statements), generates a unique account number via DB query, fills required fields, and submits.

### Test 2 — Created Account Details verification
Navigates to the Accounts dashboard, filters by the newly created account number, confirms grid columns and cell values, writes the created account number to `tempuserdata.json`, and verifies the row action buttons (Edit Account, Deactivate Account, Add Provider Group) are accessible.

### Test 3 — Required fields and controls visibility check
Opens the Add Account modal and confirms all required textboxes are visible and editable; verifies the Add & Close button is visible but disabled when fields are empty.

### Test 4 — Typing and clearing mandatory fields
Fills and then clears Account Number and Account Name fields; confirms values update correctly and the submit button returns to disabled state when fields are cleared.

### Test 5 — Invalid account number gracefully handled
Enters a non-existing account number in the filter, applies the filter, and confirms the result row is absent and a no-results indicator appears.

---

**Total Tests:** 5  
**Notes:** Account number is auto-incremented at runtime using a DB query to avoid duplicates across iterative runs.
