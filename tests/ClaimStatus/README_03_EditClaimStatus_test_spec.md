# Test File: 03_EditClaimStatus_test_spec.ts

Module: Edit Claim Status Routing
Location: tests/ClaimStatus/03_EditClaimStatus_test_spec.ts
Test Data: testData/EditClaimStatusTestData.json
Fixture: loginAsAdmin from tests/myTestData.ts
Navigation Helper: navigateToClaimStatusRouting from tests/framework/navigation.helper.ts

## Test Cases Implemented

| # | Test Name | Type |
|---|-----------|------|
| 1 | Claim Status dashboard filters and edit entry are available | Visibility |
| 2 | Edit Claim Status modal fields are visible and available | Functional |
| 3 | Apply filter with SB710I returns DB-matching row in grid | Functional + DB assertion |
| 4 | Diagnostic gate: verify session has edit-enabled permission for Claim Status edit actions | Diagnostic gate |
| 5 | Edit SB710I: update group id to G00012 and validate against DB and UI | End-to-end + DB assertion |
| 6 | Edit SB710I: save with ONLINE and verify payer name on dashboard result | End-to-end + DB assertion |
| 7 | Save with empty required Group ID does not produce successful save | Edge case |
| 8 | Invalid SC ID filter returns no rows or stable empty state | Edge case + DB assertion |
| 9 | Whitespace SC ID filter keeps dashboard stable | Edge case |
| 10 | Cross-check SKNC0 rows against DB values from edit suite | Functional + DB assertion |

## DB Query Coverage

The suite validates Claim Status Routing rows using:

select id, scid, groupid, processorid, ediid, online_batch, payername, recordstatus, nm1_upper
from sc_app.claimstatus_routing
where scid = 'SB710I'

Additional cross-validation query uses scid='SKNC0'.

Composite verification query path used after edit save:

select id, scid, groupid, processorid, ediid, online_batch, payername, recordstatus, nm1_upper
from sc_app.claimstatus_routing
where btrim(scid) = :scid
	and btrim(processorid) = :processorid
	and btrim(ediid) = :ediid
	and btrim(groupid) = :groupid

Implemented DB helpers:
1. fetchClaimStatusRoutingRowsByScId(scId)
2. fetchClaimStatusRoutingByComposite(scId, processorId, ediId, groupId)
3. resetClaimStatusRoutingGroupForEdit(scId, processorId, ediId, baseGroupId, editedGroupId)
4. updateClaimStatusRoutingGroupIdByComposite(scId, processorId, ediId, fromGroupId, toGroupId)
5. deleteClaimStatusRoutingByComposite(scId, processorId, ediId, groupId)

All DB utility functions are in testData/database.utils.ts.

## Reusable Helpers in Spec

1. openClaimStatusDashboard(page)
2. applyFilterAndWait(page)
3. clearDashboardFilters(page)
4. searchByScId(page, scId)
5. searchByCompositeValues(page, scId, groupId, processorId, ediId)
6. clickEditActionForScId(page, scId)
7. assertEditModalFieldsVisible(page)
8. getOnlineBatchComboboxInEditModal(page)
9. assertOnlineBatchFieldAndOptionsInEditModal(page)
10. selectOnlineBatchInEditModal(page, option)
11. fillEditForm(page)
12. saveEditModal(page)
13. ensureBaseRecordForEdit()
14. assertSb710iDbAndUi(page)
15. assertSkNc0GridMatchesDb(page)

## Notes

1. Hardcoded values are externalized in testData/EditClaimStatusTestData.json.
2. The test suite resets SB710I record from edited state back to ROUTE for iterative deterministic runs.
3. Login uses fixture-based authentication and shared navigation helpers.
4. Browser runtime errors are captured and asserted after each test.
5. Online / Batch dropdown field and options (ONLINE, BATCH) are validated in the edit modal.
6. Post-save dashboard row verification includes payer name and online_batch values against DB row.
7. Edit-action tests are conditionally skipped when edit controls are disabled by environment state/permissions to keep reruns deterministic while still validating non-editable visibility flows.
