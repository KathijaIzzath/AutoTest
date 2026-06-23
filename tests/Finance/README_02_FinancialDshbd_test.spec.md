# Test File: `Finance/02_FinancialDshbd_test.spec.ts`

**Module:** Finance — Process Payments / Client Search (extended / duplicate run)  
**Location:** `tests/Finance/02_FinancialDshbd_test.spec.ts`  
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

> This file mirrors the test suite in `01_FinancialDshbd_test.spec.ts` and is used for iterative / independent run validation of the same Finance module flows.

See [README\_01\_FinancialDshbd\_test.spec.md](README_01_FinancialDshbd_test.spec.md) for full per-test descriptions.

---

**Total Tests:** 10
