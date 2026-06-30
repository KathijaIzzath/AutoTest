# Test File: `Provider/01_Provider_Dshbd_test.spec.ts`

**Module:** Provider Dashboard  
**Location:** `tests/Provider/01_Provider_Dshbd_test.spec.ts`  
**Test Data:** `testData/ProviderDshbdTestData.json`, `testData/UserInfo.json`  
**Fixture:** `loginAsAdmin` (via `tests/myTestData.ts`)  
**Navigation Helper:** `navigateToProviders`

---

## Test Cases

| # | Test Name | Type |
|---|-----------|------|
| 1 | ProviderGroupDashboard control/elements verification test execution | Functional |
| 2 | ProviderGroup search results sort verification test execution | Functional |
| 3 | Provider dashboard filter controls visibility and availability | Visibility |
| 4 | Provider dashboard invalid filters should not show known seeded row | Edge Case |
| 5 | Provider dashboard empty filters should load default grid successfully | Edge Case |
| 6 | Provider dashboard invalid city should not show known seeded row | Edge Case |
| 7 | Provider dashboard Provider ID sorting explicitly toggles ascending and descending | Sorting |

---

### Test 1 — Dashboard control/elements verification
Navigates to Providers, applies filter, and verifies column headers (Name, Provider ID, Group ID, Account Number, email, status, city, address) and a known seeded provider row are visible.

### Test 2 — Sort verification
Applies filters and clicks column headers to verify sort direction indicators and expected first-row values for each sortable column.

### Test 3 — Filter controls visibility
Confirms all filter form fields (Provider ID, Group ID, Account Number, City, Practice Management dropdown, Show Inactive Only checkbox, Apply Filter button) are visible.

### Test 4 — Invalid filters show no known row
Enters invalid values for Provider ID and Group ID filters, applies filter, and confirms the seeded provider row is absent.

### Test 5 — Empty filters load default grid
Clears all filters, applies filter, and confirms the grid body is visible with at least one row.

### Test 6 — Invalid city shows no known row
Enters an invalid city value, applies filter, and confirms the seeded provider row is absent.

### Test 7 — Explicit Provider ID asc/desc sorting
Applies filters, clicks the Provider ID column header twice, and verifies the first click produces a valid sorted order and the second click toggles to the opposite order when sufficient rows are available.

---

**Total Tests:** 7
