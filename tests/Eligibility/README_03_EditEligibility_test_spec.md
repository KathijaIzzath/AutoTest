# Test File: 03_EditEligibility_test_spec.ts

Module: Eligibility Routing Edit  
Location: tests/Eligibility/03_EditEligibility_test_spec.ts  
Test Data: testData/EditEligibilityTestData.json  
Fixture: loginAsAdmin from tests/myTestData.ts  
Navigation Helper: navigateToEligibilityRouting from tests/framework/navigation.helper.ts

## Test Cases Implemented

| # | Test Name | Type |
|---|-----------|------|
| 1 | Edit Eligibility Routing functional flow with successful save and validations | Functional |
| 2 | DB validation confirms edited SX176 record exists with expected values | Functional + DB assertion |
| 3 | Edit modal fields are visible and available | Visibility |
| 4 | Active checkbox is unselected when preselected and then restored | Functional / Checkbox-state |
| 5 | Invalid SC ID filter returns no rows or empty state | Edge case |
| 6 | Empty SC ID filter keeps apply controls and grid available | Edge case |
| 7 | Whitespace SC ID filter does not break behavior | Edge case |
| 8 | Edit save without changes keeps record values stable | Functional / Stability |

## DB Query Coverage

This suite validates edit-screen record existence and updated values through:

select * from eligibility_routing where scid = 'SX176'

Implemented via:
1. fetchEligibilityRoutingRowsByScId(scId)
2. deleteEligibilityRoutingByComposite(...) for reiteration-safe setup

## Reusable Helpers in Spec

1. openEligibilityDashboard(page)
2. applyFilterAndWait(page)
3. searchByScId(page, scId)
4. selectPayerOption(page, optionText, searchText)
5. openRowActionAndEdit(page)
6. closeEditDialog(page)
7. ensureRecordExistsForEdit(page)
8. assertEditDialogFieldsVisible(page)

## Notes

1. Preserved original functional edit path from generated script.
2. All hardcoded values are externalized to testData/EditEligibilityTestData.json.
3. Checkbox handling now explicitly unchecks previously-checked state during the run and restores it.
