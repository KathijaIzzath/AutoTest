# Test File: 02_AddClaimStatus_test_spec.ts

Module: Add Claim Status Routing
Location: tests/ClaimStatus/02_AddClaimStatus_test_spec.ts
Test Data: testData/AddClaimStatusTestData.json
Fixture: loginAsAdmin from tests/myTestData.ts
Navigation Helper: navigateToClaimStatusRouting from tests/framework/navigation.helper.ts

## Test Cases Implemented

| # | Test Name | Type |
|---|-----------|------|
| 1 | Claim Status dashboard controls and filter action are visible and available | Visibility |
| 2 | Add modal from dashboard shows all required fields and controls | Functional |
| 3 | Add modal from search result header shows all required fields and controls | Functional |
| 4 | Apply Filter with full composite values returns DB-matching row | Functional + DB assertion |
| 5 | Add Claim Status from dashboard attempts save and keeps app stable | End-to-end |
| 6 | Add Claim Status with ONLINE value is searchable and matches DB | End-to-end + DB assertion |
| 7 | Add Claim Status from search result header attempts save and keeps app stable | End-to-end |
| 8 | Add with empty required fields does not produce successful save | Edge case |
| 9 | Invalid SC ID filter returns no rows or stable empty state | Edge case + DB assertion |
| 10 | Whitespace SC ID filter keeps dashboard stable and searchable | Edge case |
| 11 | SKNC0 search result rows are validated against DB values for existence and correctness | Functional + DB assertion |

## DB Query Coverage

The suite validates Claim Status Routing rows using:

select id, scid, groupid, processorid, ediid, online_batch, payername, recordstatus, nm1_upper
from sc_app.claimstatus_routing
where scid = 'SKNC0'

And composite validation query path:

select id, scid, groupid, processorid, ediid, online_batch, payername, recordstatus, nm1_upper
from sc_app.claimstatus_routing
where btrim(scid) = :scid
	and btrim(processorid) = :processorid
	and btrim(ediid) = :ediid
	and btrim(groupid) = :groupid

Implemented via:
1. fetchClaimStatusRoutingRowsByScId(scId)
2. fetchClaimStatusRoutingByComposite(scId, processorId, ediId, groupId)
3. deleteClaimStatusRoutingByComposite(scId, processorId, ediId, groupId)

All DB utility functions are in testData/database.utils.ts.

## Reusable Helpers in Spec

1. openClaimStatusDashboard(page)
2. applyFilterAndWait(page)
3. clearDashboardFilters(page)
4. openAddModalFromDashboard(page)
5. openAddModalFromSearchHeader(page)
6. assertAddModalFieldsVisible(page)
7. getOnlineBatchCombobox(page)
8. selectOnlineBatchOption(page, option)
9. assertOnlineBatchFieldAndOptions(page)
10. fillAddForm(page)
11. searchByScId(page, scId)
12. searchByComposite(page)
13. assertSkNc0GridMatchesDb(page)

## Notes

1. Hardcoded values are externalized in testData/AddClaimStatusTestData.json.
2. The suite uses fixture-based login and shared navigation helpers.
3. Browser runtime errors are captured and asserted in afterEach for stability.
4. Add flow supports both entry points: dashboard link and search-header link.
5. Online / Batch dropdown visibility and options (ONLINE, BATCH) are validated in add modal tests.
6. Positive add flow validates post-save UI result row against DB composite values including online_batch.
