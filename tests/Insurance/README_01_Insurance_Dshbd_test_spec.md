# Test File: `Insurance/01_Insurance_Dshbd_test_spec.ts`

**Module:** Insurance Dashboard  
**Location:** `tests/Insurance/01_Insurance_Dshbd_test_spec.ts`  
**Test Data:** `testData/InsuranceDshbdTestData.json`  
**Fixture:** `loginAsAdmin` from `tests/myTestData.ts`  
**Navigation Helper:** `navigateToInsurance` from `tests/framework/navigation.helper.ts`

## Test Cases

| # | Test Name | Type |
|---|-----------|------|
| 1 | Insurance dashboard controls visibility and availability | Visibility |
| 2 | Insurance filter by Name (upper/lower) returns successful results | Functional |
| 3 | Insurance filter by Processor ID validates DB name and record status | Functional + DB assertion |
| 4 | Insurance filter by EDI ID validates DB name and record status | Functional + DB assertion |
| 5 | Insurance latest DB row can be searched by Processor ID and validated in grid | Functional + DB assertion |
| 6 | Insurance filter by State validates successful search result | Functional |
| 7 | Insurance Show Inactive Only toggle shows inactive then active statuses | Functional |
| 8 | Insurance empty filters keep grid and columns available | Edge case |
| 9 | Insurance invalid Name/Processor/EDI filters return no rows | Edge case |

## DB Query Coverage

The suite includes DB comparison utilities and UI-to-DB validations for these query patterns:

1. `select name,recordstatus from insurancecompany where id = 'Y00009'`
2. `select name,recordstatus from insurancecompany where neicid = '03036'`
3. `select * from insurancecompany order by recid desc` (implemented as latest row fetch and UI validation by processor id)

## Reusable Helpers Used in Spec

1. `openInsuranceDashboard(page)`
2. `applyFilterAndWait(page)`
3. `fillTextboxFilter(page, placeholder, value)`
4. `resetBaseFilters(page)`

## Notes

1. All hardcoded UI values are externalized to `testData/InsuranceDshbdTestData.json`.
2. The suite is designed for iterative runs (filters are reset before empty-filter validation).
3. The tests follow Playwright test runner best practices with fixture login and focused helper methods.
