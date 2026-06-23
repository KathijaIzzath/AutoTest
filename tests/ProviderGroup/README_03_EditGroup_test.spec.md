# Test File: `ProviderGroup/03_EditGroup_test.spec.ts`

**Module:** Provider Groups — Edit Provider Group  
**Location:** `tests/ProviderGroup/03_EditGroup_test.spec.ts`  
**Test Data:** `testData/EditGroupTestData.json`, `testData/UserInfo.json`  
**Fixture:** `loginAsAdmin` (via `tests/myTestData.ts`)  
**Navigation Helper:** `navigateToAccounts`  
**Utilities:** `checkboxState.utils.ts` (`saveCheckboxState`, `loadCheckboxState`)

---

## Test Cases

| # | Test Name | Type |
|---|-----------|------|
| 1 | Edit provider group functionality verification | Functional |
| 2 | Edit provider group details and verify the changes are saved successfully | Functional |
| 3 | Edit Provider Group screen field availability and save action visibility | Visibility |
| 4 | Edit Provider Group account filter invalid value should show empty result | Edge Case |

---

### Test 1 — Edit provider group functionality
Navigates to Accounts, filters by edit-automation account (`SCAutoGroupEdit001`), opens Provider Group `G31927`, clicks Edit Provider Group; sets Fee Schedule, updates Address, toggles all service checkboxes (Claim Status, Eligibility, XML, Generate, Machine Readable, Human Readable, Pulse CSV, 277u, CSV, ERA Summary, Daily Pulse CSV, Human Readable 271, Alphall, New Statements, Combine ERA, RCM), fills Phone, saves the state to `checkboxState.json` via utility, and clicks Save & Close.

### Test 2 — Verify changes saved successfully
Reopens the same Provider Group edit form and asserts each checkbox matches the state saved in `checkboxState.json` from Test 1; confirms Address, Phone, Fee Schedule, and email field values are persisted correctly.

### Test 3 — Field availability and save action visibility
Opens the Edit Provider Group modal and confirms the Edit heading, Fee Schedule label/dropdown, Address textbox, Phone textbox, Claim Status / Eligibility checkboxes, and Save & Close button are all visible and the button is enabled.

### Test 4 — Invalid account filter shows empty result
Enters an invalid account number in the Accounts filter, applies filter, and confirms no cells match and a no-results message appears.

---

**Total Tests:** 4  
**Helpers:** `openEditProviderGroup`, `ensureCheckboxChecked`, `ensureCheckboxUnchecked`, `toggleCheckbox`  
**Notes:** Test 1 and Test 2 are dependent — Test 1 saves checkbox state to disk and Test 2 reads and asserts it.
