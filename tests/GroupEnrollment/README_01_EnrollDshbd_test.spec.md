# Test File: `GroupEnrollment/01_EnrollDshbd_test.spec.ts`

**Module:** Group Enrollment Dashboard  
**Location:** `tests/GroupEnrollment/01_EnrollDshbd_test.spec.ts`  
**Test Data:** `testData/EnrollDshbdTestData.json`, `testData/UserInfo.json`  
**Fixture:** `loginAsAdmin` (via `tests/myTestData.ts`)

---

## Test Cases

| # | Test Name | Type |
|---|-----------|------|
| 1 | Group Enrollment Dashboard elements/controls verification test execution | Functional |
| 2 | Enrollment Dashboard search verification test execution | Functional |
| 3 | Enrollment Sorting results verification test execution | Functional |
| 4 | Enrollment dashboard controls availability quick check | Visibility |
| 5 | Enrollment invalid filter should show no known seeded row | Edge Case |

---

### Test 1 — Dashboard elements/controls verification
Navigates to Group Enrollments, verifies filter labels, filter inputs (Group ID, Agreement Status, Enrollment Type, Payer ID, Payer Name), Apply Filter button, column headers (Group ID, Group Name, NPI, Tax ID, Payer ID, Enrollment Type, Status, Actions), and a known seeded enrollment row.

### Test 2 — Dashboard search verification
Applies various filter combinations (by Group ID, Enrollment Type, Agreement Status, Payer ID, Payer Name) and confirms the correct rows and columns appear in each result set.

### Test 3 — Sorting results verification
Applies filters to produce a result set and verifies column header sort interactions work for relevant columns.

### Test 4 — Dashboard controls availability quick check
Confirms filter textboxes, dropdowns, checkboxes, and Apply Filter button are all visible without applying any filter.

### Test 5 — Invalid filter shows no known seeded row
Enters an invalid Group ID in the filter, applies filter, and confirms the seeded group row is absent.

---

**Total Tests:** 5
