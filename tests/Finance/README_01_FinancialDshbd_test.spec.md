# Test File: `Finance/01_FinancialDshbd_test.spec.ts`

**Module:** Finance — Process Payments / Client Search  
**Location:** `tests/Finance/01_FinancialDshbd_test.spec.ts`  
**Test Data:** `testData/FinancialDshbdTestData.json`, `testData/UserInfo.json`  
**Fixture:** Local `loginAsFinancial` helper (QA user credentials)

---

## Test Cases

| # | Test Name | Type |
|---|-----------|------|
| 1 | Financial navigation sub-menu links are visible | Visibility |
| 2 | Process Payments page form controls and elements are visible | Visibility |
| 3 | Process Payments — search by first name returns results table | Functional |
| 4 | Financial dashboard — process payments, add wallet method, and verify responsible party search | Functional |
| 5 | Process Payments — invalid last name search returns no results | Edge Case |
| 6 | Add Payment Method modal elements are visible and can be dismissed | Visibility / Functional |
| 7 | Client search page — By Patient Name and By Responsible Party sections are visible | Visibility |
| 8 | Client search by Identifier returns Charge Summary heading and patient row | Functional |
| 9 | Client search by Responsible Party ID returns charge summary with action links | Functional |
| 10 | Client search with invalid Identifier returns no Charge Summary | Edge Case |

---

### Test 1 — Financial navigation sub-menu links
Expands the Financial sidebar menu and verifies Process Payments, Payment Analytics, and View Payments links are visible.

### Test 2 — Process Payments form controls
Navigates to Process Payments, confirms By Patient Name and By Responsible Party form sections, input fields, and search buttons are visible.

### Test 3 — Search by first name returns results
Enters a known patient first name, submits search, and confirms the results table appears with the expected patient row.

### Test 4 — Full process payments functional flow
Complete flow: login as financial user, search patient, open charge summary, add wallet method (credit card details), verify responsible party search and Charge Summary heading.

### Test 5 — Invalid last name returns no results
Enters an invalid last name, submits search, and confirms no results are displayed.

### Test 6 — Add Payment Method modal elements
Opens the Add Payment Method modal, verifies card number, expiry, CVV fields and submit/cancel buttons are visible, then dismisses the modal.

### Test 7 — Client search page section visibility
Navigates to Client Search, confirms By Patient Name and By Responsible Party search panels are visible.

### Test 8 — Search by Identifier
Enters a known patient identifier, confirms the Charge Summary heading and patient row appear.

### Test 9 — Search by Responsible Party ID
Enters a known Responsible Party ID, confirms the Charge Summary and action links appear.

### Test 10 — Invalid Identifier returns no Charge Summary
Enters an invalid identifier and confirms the Charge Summary section does not appear.

---

**Total Tests:** 10
