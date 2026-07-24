# Test File: Users/03_EditUserProfile_test_spec.ts

Module: Users - Edit User
Location: tests/Users/03_EditUserProfile_test_spec.ts
Test Data: testData/EditUserProfileTestData.json
Sequence State: testData/EditUserProfileSequenceState.json
Fixture: loginAsAdmin (tests/myTestData.ts)
Navigation Helper: navigateToUsers (tests/framework/navigation.helper.ts)
DB Helpers: fetchUserClientByUsername, fetchAnyInactiveUserClient (testData/database.utils.ts)

## Test Cases

| # | Test Name | Type |
|---|-----------|------|
| 1 | Edit User form fields are visible and available for target user | Visibility |
| 2 | Apply Filter by first name returns target user result row | Functional |
| 3 | Edit User updates only last 4 digits for phone, cellphone and pin, then validates DB and UI | End-to-End + DB assertion |
| 4 | ACPM vendor is added during edit and removed after test completion for rerun stability | Functional + Cleanup |
| 5 | Invalid first-name filter returns no rows or empty state | Edge Case |
| 6 | Deactivated or inactive user does not expose editable action | Security/Permission |
| 7 | Current logged-in user remains searchable in Users module | Functional |

## Dynamic Update Strategy

- Only the last 4 digits are changed for Phone, Cell Phone, and Pin.
- Suffix candidates rotate from testData/EditUserProfileTestData.json.
- Last used candidate is tracked in testData/EditUserProfileSequenceState.json.
- If a candidate already matches current values, the next candidate is selected.

## Vendor Cleanup Strategy

- ACPM vendor is removed if already present before add step.
- ACPM vendor is added for validation.
- ACPM vendor is removed again before test completion so next run can re-add it.

Total Tests: 7
