# Test File: `ProviderGroup/02_Create_PGroup_test.spec.ts`

**Module:** Provider Groups — Create Provider Group  
**Location:** `tests/ProviderGroup/02_Create_PGroup_test.spec.ts`  
**Test Data:** `testData/CreatePGroupTestData.json`, `testData/UserInfo.json`  
**Fixture:** `loginAsAdmin` (via `tests/myTestData.ts`)  
**Navigation Helper:** `navigateToAccounts`

---

## Test Cases

| # | Test Name | Type |
|---|-----------|------|
| 1 | Create Provider Group Screen verification and functionality test | Functional |
| 2 | Create Provider Group page field availability and tabs validation | Visibility |
| 3 | Accounts filter invalid account should show no results before Provider Group flow | Edge Case |

---

### Test 1 — Full Create Provider Group functional flow
Navigates to Accounts, filters by the automation account, opens the account row action, clicks Add Provider Group, fills the required fields (Group Name, Fee Schedule, Address, Phone, service type checkboxes, ERA/Claim Status/Eligibility settings), navigates through multi-tab form sections (Claim Status Routing, Eligibility Routing, Statements, ERA), and saves; confirms the success state and the new group row appears.

### Test 2 — Field availability and tabs validation
Opens the Create Provider Group modal and confirms all tabs are accessible, key form fields are visible (Group Name, Fee Schedule dropdown, Address, Phone, Email, service checkboxes), and the Save & Close button is visible and initially disabled until required fields are filled.

### Test 3 — Invalid account filter shows no results
Enters an invalid account number in the Accounts filter before navigating to the Provider Group flow; applies filter and confirms no rows appear.

---

**Total Tests:** 3  
**Helpers:** `filterAccountAndOpenRowAction`, `openCreateProviderGroup`
