# Test File: 01_Eligibility_Dshbd_test_spec.ts

Module: Eligibility Routing Dashboard  
Location: tests/Eligibility/01_Eligibility_Dshbd_test_spec.ts  
Test Data: testData/EligibilityDshbdTestData.json  
Fixture: loginAsAdmin from tests/myTestData.ts  
Navigation Helper: navigateToEligibilityRouting from tests/framework/navigation.helper.ts

## Test Cases Implemented

| # | Test Name | Type |
|---|-----------|------|
| 1 | Eligibility dashboard controls, fields, and headers are visible and available | Visibility |
| 2 | Eligibility apply filter with no conditions returns result rows | Functional |
| 3 | Eligibility filter by payer name returns expected row | Functional |
| 4 | Eligibility filter by SC ID validates full row values against DB | Functional + DB assertion |
| 5 | Eligibility filter by processor ID returns expected row | Functional |
| 6 | Eligibility filter by group ID returns expected row | Functional |
| 7 | Eligibility filter by EDI ID returns expected row | Functional |
| 8 | Eligibility Show Inactive Only toggle returns inactive records | Functional |
| 9 | Eligibility invalid filters return no rows or empty state | Edge case |
| 10 | Eligibility empty filters keep results and columns available | Edge case |
| 11 | Eligibility sorting on Payer names and SC Id keeps ordered values | Sorting |
| 12 | Eligibility multi-filter by SC ID, Processor ID, and EDI ID keeps search behavior stable | Functional |
| 13 | Eligibility SC Id sorting toggles between ascending and descending order | Sorting |
| 14 | Eligibility row action and Add Eligibility Routing link are visible | Visibility |

## DB Query Coverage

The suite compares UI data against database values using this query pattern:

select payername, scid, groupid, processorid, ediid, remove_subscriber_address,
remove_subscriber_gender, remove_subscriber_nm1_mi, remove_subscriber_dtp_102,
remove_ref_sy, remove_receiver_ref_0b, remove_prv,
change_receiver_non_person_entity, recordStatus, ediid_qualifier
from eligibility_routing
where scid = 'SX170'

Implemented via: fetchEligibilityRoutingByScId(scId) in testData/database.utils.ts

## Reusable Helpers in Spec

1. openEligibilityDashboard(page)
2. applyFilterAndWait(page)
3. fillFilter(page, fieldLabel, value)
4. clearAllFilters(page)
5. getColumnValues(page, columnIndex)
6. assertColumnSorted(page, headerName, columnIndex)

## Notes

1. Hardcoded values are externalized to testData/EligibilityDshbdTestData.json.
2. Login uses shared login fixture, not inline login steps.
3. The suite supports repeated runs by clearing filter inputs before test actions.
