# Test File: `Provider/04_ProviderDsh_test.spec.ts`

**Module:** Provider Dashboard (extended coverage)  
**Location:** `tests/Provider/04_ProviderDsh_test.spec.ts`  
**Test Data:** `testData/ProviderPageTestData.json`  
**Fixture:** `loginAsAdmin` (via `tests/myTestData.ts`)  
**Navigation Helper:** `navigateToProviders`

---

## Test Cases

### Provider Dashboard - Filter Fields Visibility
| # | Test Name | Type |
|---|-----------|------|
| 1 | should display all filter form fields on load | Visibility |
| 2 | should display all result table column headers | Visibility |
| 3 | should display default provider results after Apply Filter with no filters | Functional |

### Provider Dashboard - Column Sorting
| # | Test Name | Type |
|---|-----------|------|
| 4 | should sort results by name column | Functional |
| 5 | should sort results by email column | Functional |
| 6 | should sort results by status column | Functional |
| 7 | should sort results by address column | Functional |
| 8 | should sort results by provider ID column | Functional |
| 9 | should sort results by Group ID column | Functional |
| 10 | should sort results by Account Number column | Functional |

### Provider Dashboard - Filter Search
| # | Test Name | Type |
|---|-----------|------|
| 11 | should return matching result when filtering by Provider ID | Functional |
| 12 | should return matching result when filtering by Group ID | Functional |
| 13 | should return matching result when filtering by Account Number | Functional |
| 14 | should return full result set after clearing Account Number filter | Functional |
| 15 | should return matching result when filtering by Practice Management dropdown | Functional |

### Provider Dashboard - Edge Cases
| # | Test Name | Type |
|---|-----------|------|
| 16 | should show results when Apply Filter is clicked with all fields empty | Edge Case |
| 17 | should return no results or show empty state for invalid Provider ID | Edge Case |
| 18 | should return no results or show empty state for invalid Group ID | Edge Case |
| 19 | should return no results or show empty state for invalid Account Number | Edge Case |
| 20 | should retain filter value in Provider ID field after applying filter | Edge Case |
| 21 | Practice Management dropdown should default to empty / unselected | Visibility |

---

**Total Tests:** 21
