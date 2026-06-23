# Test File: `Payer/01_Payer_Dshbd_test.spec.ts`

**Module:** Payer Dashboard  
**Location:** `tests/Payer/01_Payer_Dshbd_test.spec.ts`  
**Test Data:** `testData/PayerDshbdTestData.json`  
**Fixture:** `loginAsAdmin` (via `tests/myTestData.ts`)  
**Navigation Helper:** `navigateToPayer`

---

## Test Cases

| # | Test Name | Type |
|---|-----------|------|
| 1 | Payer dashboard control/elements verification test execution | Functional |
| 2 | Payer dashboard — filter inputs and Apply Filter button are visible and interactive | Visibility |
| 3 | Payer dashboard — grid column headers are all visible after applying filter | Visibility |
| 4 | Payer dashboard — filter by Payer ID returns results | Functional |
| 5 | Payer dashboard — filter by Processor ID returns results | Functional |
| 6 | Payer dashboard — filter by Name returns results | Functional |
| 7 | Payer dashboard — Show Inactive Only checkbox can be toggled | Functional |
| 8 | Payer dashboard — invalid Payer ID filter returns no results | Edge Case |
| 9 | Payer dashboard — invalid Processor ID filter returns no results | Edge Case |
| 10 | Payer dashboard — invalid Name filter returns no results | Edge Case |
| 11 | Payer dashboard — empty filter still shows grid results | Edge Case |
| 12 | Payer dashboard — Add Payer link is visible and clickable | Visibility |
| 13 | Payer dashboard — clearing Payer ID filter restores full grid | Functional |

---

### Test 1 — Full dashboard control/elements verification
Verifies all filter form elements (Name, Processor Id, Payer ID, State, Show Inactive Only, Add Payer link, Apply Filter), applies filter, and confirms all grid column headers (Payer name, state, Professional Processor ID, Institutional Processor ID, payer id, claim enrollment) are visible.

### Test 2 — Filter inputs visibility
Confirms all three filter textboxes are visible, empty, and enabled; Apply Filter button is enabled; Show Inactive Only checkbox and Add Payer link are present.

### Test 3 — Column headers visible after filter
Applies the filter and confirms each column header is present in the grid.

### Tests 4–6 — Valid filter searches
Fills each individual filter (Payer ID, Processor ID, Name) with a known valid value, applies filter, and confirms matching rows appear.

### Test 7 — Show Inactive Only toggle
Checks and unchecks the Show Inactive Only checkbox; verifies state changes correctly.

### Tests 8–10 — Invalid filter returns zero rows
Enters non-matching values for each filter and confirms the grid row count is zero.

### Test 11 — Empty filter shows results
Clears all filters and applies; confirms the grid still has rows.

### Test 12 — Add Payer link visible and enabled
Confirms the Add Payer navigation link is visible and enabled.

### Test 13 — Clearing filter restores full grid
Applies Payer ID filter, notes filtered row count, clears filter, applies again, and confirms the full result set is restored.

---

**Total Tests:** 13  
**Helpers:** `applyFilterAndWait`, `clearAndFillFilter`, `navigateAndLoadGrid`, `verifyPayerDashboardElements`
