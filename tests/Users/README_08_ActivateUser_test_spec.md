# Test File: Users/08_ActivateUser_test_spec.ts

Module: Users - Activate User
Location: tests/Users/08_ActivateUser_test_spec.ts
Test Data: testData/ActivateUserTestData.json
Fixture: loginAsAdmin (tests/myTestData.ts)
Navigation Helper: navigateToUsers (tests/framework/navigation.helper.ts)
DB Helpers: fetchUserClientByUsername, fetchAnyInactiveUserClient (testData/database.utils.ts)

## Test Cases

| # | Test Name | Type |
|---|-----------|------|
| 1 | Activate User controls are visible and available | Visibility |
| 2 | Apply Filter by first name returns target user and matches DB row | Functional + DB assertion |
| 3 | Disabled user appears as not active, enabling updates UI status to active and DB active=true | End-to-End + DB assertion |
| 4 | Enable user action keeps account active for subsequent login workflows | Functional |
| 5 | Inactive/deactivated user does not expose Edit User Info action | Security/Permission |
| 6 | Invalid first-name filter returns no rows or empty state | Edge Case |
| 7 | Empty first-name filter keeps page stable and grid available | Edge Case |
| 8 | Users module returns currently logged-in user in search results | Functional |
| 9 | Any inactive user from DB shows inactive status in UI search when present | Functional + DB assertion |

## Coverage Notes

- Preserves and expands the original recorder flow for activate workflow.
- Removes brittle hardcoded row indexes and ARIA snapshots by using stable role/text-based assertions.
- Externalizes all hardcoded labels/placeholders/values/selectors/timeouts into testData/ActivateUserTestData.json.
- Validates inactive status presence before activation and active status presence after enabling.
- Asserts DB active flag consistency with UI outcomes.
- Captures runtime browser errors and asserts none are thrown.

Total Tests: 9
