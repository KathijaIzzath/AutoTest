# Test File: 01_ClaimStatus_Dshbd_test_spec.ts

Module: Claim Status Routing Dashboard  
Location: tests/ClaimStatus/01_ClaimStatus_Dshbd_test_spec.ts  
Test Data: testData/ClaimStatusDshbdTestData.json  
Fixture: loginAsAdmin from tests/myTestData.ts  
Navigation Helper: navigateToClaimStatusRouting from tests/framework/navigation.helper.ts

## Test Cases Implemented

| # | Test Name | Type |
|---|-----------|------|
| 1 | Claim Status Routing controls, fields, and headers are visible and available | Visibility |
| 2 | Claim Status Routing apply filter without conditions returns stable results grid | Functional |
| 3 | Claim Status Routing filter by payer name returns matching rows | Functional |
| 4 | Claim Status Routing filter by SC ID validates UI row against DB value | Functional + DB assertion |
| 5 | Claim Status Routing filter by processor id returns matching rows | Functional |
| 6 | Claim Status Routing filter by group id returns matching rows | Functional |
| 7 | Claim Status Routing filter by EDI id returns matching rows | Functional |
| 8 | Claim Status Routing Show Inactive Only toggle returns inactive status rows when present | Functional |
| 9 | Claim Status Routing invalid filters return no rows | Edge case |
| 10 | Claim Status Routing empty filters keep dashboard stable and searchable | Edge case |
| 11 | Claim Status Routing sorting toggles on all key headers without errors | Sorting |
| 12 | Claim Status Routing SCID SKSC0 rows are fetched and compared against DB results | End-to-end + DB assertion |

## DB Query Coverage

The suite validates Claim Status Routing rows from DB using:

select id, scid, groupid, processorid, ediid, online_batch, payername, recordstatus, nm1_upper
from sc_app.claimstatus_routing
where scid = 'SKSC0'

Implemented via:
1. fetchClaimStatusRoutingByScId(scId)
2. fetchClaimStatusRoutingRowsByScId(scId)

Both functions are in testData/database.utils.ts.

## Reusable Helpers in Spec

1. openClaimStatusDashboard(page)
2. applyFilterAndWait(page)
3. clearAndFillFilter(page, placeholder, value)
4. clearAllFilters(page)
5. getColumnValues(page, columnIndex)
6. assertHeaderSortToggles(page, headerName, columnIndex)
7. assertGridHeadersVisible(page)

## Notes

1. Hardcoded values are externalized in testData/ClaimStatusDshbdTestData.json.
2. Login uses the shared login fixture.
3. Navigation uses reusable helper from navigation.helper.ts.
4. Test suite asserts no browser runtime page errors in afterEach.
5. Assertions are written to support repeated test runs and variable seeded data states.
