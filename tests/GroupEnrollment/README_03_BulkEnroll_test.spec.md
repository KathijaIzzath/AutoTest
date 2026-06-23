# Test File: `GroupEnrollment/03_BulkEnroll_test.spec.ts`

**Module:** Group Enrollment — Bulk Enrollment  
**Location:** `tests/GroupEnrollment/03_BulkEnroll_test.spec.ts`  
**Test Data:** `testData/BulkEnrollTestData.json`, `testData/UserInfo.json`  
**Fixture:** `loginAsAdmin` (via `tests/myTestData.ts`)

---

## Test Cases

| # | Test Name | Type |
|---|-----------|------|
| 1 | Add Bulk Group Enrollment | Functional |
| 2 | Bulk enrollment modal initial fields availability and disabled dependent dropdowns | Visibility |
| 3 | Bulk enrollment invalid group should not be selectable in group dropdown | Edge Case |

---

### Test 1 — Add Bulk Group Enrollment (full functional flow)
Navigates to Group Enrollments, opens the Bulk Enrollment modal, selects the bulk group by Group ID, selects NPI and Tax ID identifiers, selects enrollment types, chooses payers for each type, submits the bulk enrollment, and verifies the success response.

### Test 2 — Modal initial fields availability
Opens the Bulk Enrollment modal and confirms the Group dropdown, dependent NPI/Tax ID dropdowns, enrollment type selectors, and action buttons are present; verifies that dependent fields are disabled until a valid group is selected.

### Test 3 — Invalid group not selectable
Attempts to enter an invalid group value in the Group dropdown and confirms the downstream dropdowns (NPI, Tax ID) remain in their unselected/disabled state.

---

**Total Tests:** 3  
**Helpers:** `openAddGroupEnrollment`, `selectGroupAndIds`
