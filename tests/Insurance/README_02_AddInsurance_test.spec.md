# Test File: `Insurance/02_AddInsurance_test.spec.ts`

**Module:** Add New Insurance Company (via Edit Payer screen)  
**Location:** `tests/Insurance/02_AddInsurance_test.spec.ts`  
**Test Data:** `testData/AddInsuranceTestData.json`  
**Fixture:** `loginAsAdmin` from `tests/myTestData.ts`  
**Navigation Helpers:** `navigateToPayer`, `navigateToInsurance`  
**DB Utilities:** `fetchInsuranceCompanyById`, `fetchPayerInsuranceById`

## Test Cases

| # | Test Name | Type |
|---|-----------|------|
| 1 | Add new insurance inside Edit Payer and verify on Insurance dashboard with DB validations | Functional + DB |
| 2 | Add Insurance setup modal field visibility and availability checks | Visibility |
| 3 | Insurance dashboard successful EDI filter search validates against DB payer row | Functional + DB |
| 4 | Insurance dashboard invalid EDI filter returns no rows | Edge case |
| 5 | Insurance dashboard invalid Processor ID filter returns no rows | Edge case |
| 6 | Insurance dashboard empty filters keep controls and columns available | Edge case |

## DB Query Coverage Included

1. `select recid, name, id from insurancecompany where id = 'Y12919'`
2. `select id, name, recordstatus, neicid from payer where id = 'Y12919'`
3. UI assertions are compared against DB values for existence and correct values where applicable.

## Notes

1. Hardcoded values are externalized into `testData/AddInsuranceTestData.json`.
2. Flow validates that insurance id `Y12919` is linked and discoverable from the Insurance dashboard using EDI filter `4171`.
3. The main functional test supports iterative runs by validating DB existence even when creation toast is not shown in already-existing scenarios.
