# Test File: 02_AddEligibility_test_spec.ts

Module: Eligibility Routing Add  
Location: tests/Eligibility/02_AddEligibility_test_spec.ts  
Test Data: testData/AddEligibilityTestData.json  
Fixture: loginAsAdmin from tests/myTestData.ts  
Navigation Helper: navigateToEligibilityRouting from tests/framework/navigation.helper.ts

## Test Cases Implemented

| # | Test Name | Type |
|---|-----------|------|
| 1 | Add Eligibility Routing controls and required fields are visible and available | Visibility |
| 2 | Add Eligibility Routing and search by SC ID validates UI and DB values | Functional + DB assertion |
| 3 | Apply filter with empty values keeps grid available | Edge case |
| 4 | Invalid SC ID filter returns no rows or empty state | Edge case |
| 5 | Whitespace SC ID filter does not break page behavior | Edge case |
| 6 | Add Eligibility with required fields empty should not create success toast | Field validation |
| 7 | Duplicate add attempt keeps application stable and record remains searchable (saved or blocked) | Functional / Stability |
| 8 | SC ID search remains successful and field behavior is stable | Functional |

## DB Query Coverage

The suite validates add + search behavior using these DB operations:

1. Cleanup before run (for reiterative stability):

   delete from eligibility_routing
   where btrim(scid) = 'SX176'
   and btrim(processorid) = 'TDFIC'
   and btrim(ediid) = 'TDFIC'
   and btrim(groupid) = 'ROUTE'

2. Existence and value checks after add:

   select *
   from eligibility_routing
   where scid = 'SX176'

Implemented via:
1. deleteEligibilityRoutingByComposite(...)
2. fetchEligibilityRoutingRowsByScId(scId)

## Reusable Helpers in Spec

1. openEligibilityDashboard(page)
2. applyFilterAndWait(page)
3. clearDashboardFilters(page)
4. openAddEligibilityModal(page)
5. fillRequiredAddEligibilityFields(page)
6. addEligibilityRecord(page)
7. searchByScId(page, scId)
8. prepareCleanCompositeRecord()

## Notes

1. All hardcoded values are externalized to testData/AddEligibilityTestData.json.
2. Login uses shared fixture-based authentication.
3. The suite is resilient for repeated runs by cleaning the target composite row before test execution.
