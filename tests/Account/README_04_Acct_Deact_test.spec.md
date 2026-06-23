# Test File: `Account/04_Acct_Deact_test.spec.ts`

**Module:** Account — Deactivate / Activate  
**Location:** `tests/Account/04_Acct_Deact_test.spec.ts`  
**Test Data:** `testData/AcctDeactTestData.json`, `testData/UserInfo.json`  
**Fixture:** `loginAsAdmin` (via `tests/myTestData.ts`)  
**Navigation Helper:** `navigateToAccounts`  
**DB Dependencies:** `isActiveAccount` (determines test skip conditions)

---

## Test Cases

| # | Test Name | Type |
|---|-----------|------|
| 1 | Deactivate Account, verify Deactivate and Reactivate functionality test execution | Functional (skipped if already inactive) |
| 2 | Acct Activate — Verify Account is deactivated and shows correct status | Functional (skipped if already active) |
| 3 | Deactivate confirmation cancel should keep account in active flow | Functional |
| 4 | Account filter invalid value should show empty result set | Edge Case |

---

### Test 1 — Deactivate Account
Skips if the account is already inactive. Navigates to Accounts, filters by target account, opens row action, clicks Deactivate Account, confirms the action modal, then enables Show Inactive Only filter to confirm the account row appears with Activate Account button.

### Test 2 — Activate Account
Skips if the account is already active. Navigates to Accounts with Show Inactive Only enabled, opens row action, clicks Activate Account, and confirms the action modal.

### Test 3 — Deactivate cancel keeps account active
Filters by target account, opens row action, clicks Deactivate Account, then clicks Cancel in the confirmation modal; verifies the modal is dismissed and the row action still shows either Deactivate or Activate buttons (account state unchanged).

### Test 4 — Invalid filter returns empty result set
Fills the account number filter with an invalid value, applies filter, and confirms no matching cells appear and a no-results message is shown.

---

**Total Tests:** 4 (Tests 1 and 2 are state-conditional and skip based on the live DB account status)  
**Helpers:** `filterByAccount`, `openAccountRowAction`, `confirmActionModal`
