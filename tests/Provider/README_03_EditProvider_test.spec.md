# Test File: `Provider/03_EditProvider_test.spec.ts`

**Module:** Provider — Edit Provider  
**Location:** `tests/Provider/03_EditProvider_test.spec.ts`  
**Test Data:** `testData/EditProviderTestData.json`  
**Fixture:** `loginAsAdmin` (via `tests/myTestData.ts`)  
**Navigation Helper:** `navigateToProviders`  
**DB Dependencies:** `fetchProviderDatesByProviderId`, `getTodaysDateWithYr`

---

## Test Cases

| # | Test Name | Type |
|---|-----------|------|
| 1 | Edit provider via dashboard functionality & control/elements verification test execution | Functional |
| 2 | Edit provider functionality verification | Functional |
| 3 | Edit provider — verify and check ERA, Claim Status, Eligibility and Statements checkboxes then save | Functional |
| 4 | Edit Provider screen controls visibility and availability | Visibility |
| 5 | Edit Provider invalid filter should show no matching provider row | Edge Case |
| 6 | Edit Provider save without changes keeps persisted values stable | Persistence |

---

### Test 1 — Edit provider functional flow
Applies filter, opens the first provider for edit, captures the Provider ID from the heading, fills Title/Degree/MI, toggles the Certification Status, and toggles Statements / Eligibility / Claim Status / ERA checkboxes (each toggled from current state); saves. Provider ID is stored for subsequent tests.

### Test 2 — Edit provider verification
Reloads the providers list, filters by the captured Provider ID (if available), opens the same provider, reads MI/Degree/Title values and verifies they match expected or edited values, asserts any DB-fetched date cells if present, and reads current checkbox states (Statements, Eligibility, Claim Status).

### Test 3 — Check ERA, Claim Status, Eligibility, Statements and save
Opens the provider edit form, verifies ERA/Claim Status/Eligibility/Statements labels and checkboxes are visible, ensures each checkbox is checked (check if unchecked), confirms all four are in checked state, and saves.

### Test 4 — Screen controls visibility
Opens the edit form and confirms Title, Degree, MI textboxes and ERA/Claim Status/Eligibility/Statements checkboxes and Save button are visible.

### Test 5 — Invalid filter shows no matching row
Enters an invalid Provider ID in the filter, applies filter, and confirms no matching cell appears.

### Test 6 — No-change save and persistence
Opens a provider edit form, captures current Title/Degree/MI values, saves without changing fields, reopens the same provider, and verifies the captured values persist unchanged.

---

**Total Tests:** 6  
**Helpers:** `openProvidersAndApplyFilter`, `openFirstProviderForEdit`, `captureProviderIdFromEditHeading`, `toggleCheckbox`
