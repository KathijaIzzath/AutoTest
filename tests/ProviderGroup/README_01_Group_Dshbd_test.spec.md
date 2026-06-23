# Test File: `ProviderGroup/01_Group_Dshbd_test.spec.ts`

**Module:** Provider Groups Dashboard  
**Location:** `tests/ProviderGroup/01_Group_Dshbd_test.spec.ts`  
**Test Data:** `testData/GroupDshbdTestData.json`, `testData/UserInfo.json`  
**Fixture:** `loginAsAdmin` (via `tests/myTestData.ts`)  
**Navigation Helper:** `navigateToProviderGroups`

---

## Test Cases

| # | Test Name | Type |
|---|-----------|------|
| 1 | ProviderGroupDashboard control/elements verification test execution | Functional |
| 2 | ProviderGroups Sorting search results control/elements verification test execution | Functional |
| 3 | Provider groups dashboard filter controls visibility and availability | Visibility |
| 4 | Provider groups invalid filters should not show known seeded group row | Edge Case |
| 5 | Provider groups empty filters should load default grid successfully | Edge Case |
| 6 | Provider groups invalid city should not show known seeded group row | Edge Case |

---

### Test 1 — Dashboard control/elements verification
Navigates to Provider Groups, applies filter, verifies column headers (Group ID, Group Name, NPI, Tax ID, City, State, Address, Contact) and a known seeded group row are visible; tests Group ID, Group Name, NPI, and Account Number filter combinations.

### Test 2 — Sorting verification
Applies filter and clicks each sortable column header to verify ascending/descending indicators and correct first-row values for Group ID, Group Name, City, State, Address, and Contact columns.

### Test 3 — Filter controls visibility
Confirms all filter fields (Group ID, Group Name, NPI, Account Number, City, State dropdown, Apply Filter button) are visible without applying any filter.

### Test 4 — Invalid filters show no known row
Enters invalid values for Group ID and Group Name, applies filter, and confirms the seeded group row does not appear.

### Test 5 — Empty filters load default grid
Clears all filters, applies, and confirms the grid loads with at least one visible row.

### Test 6 — Invalid city shows no known row
Enters an invalid city value, applies filter, and confirms the seeded group row is absent.

---

**Total Tests:** 6  
**Helpers:** `openProviderGroupsDashboard`, `applyFilters`, `fillTextboxByName`
