# Test File: Users/07_DeactivateUser_test_spec.ts

Module: Users - Deactivate User
Location: tests/Users/07_DeactivateUser_test_spec.ts
Test Data: testData/DeactivateUserTestData.json
Fixture: loginAsAdmin (tests/myTestData.ts)
Navigation Helper: navigateToUsers (tests/framework/navigation.helper.ts)
DB Helper: fetchUserClientByUsername (testData/database.utils.ts)

## Test Cases

| # | Test Name | Type |
|---|-----------|------|
| 1 | Deactivate User controls are visible and available | Visibility |
| 2 | Apply Filter by first name returns target user and matches DB row | Functional + DB assertion |
| 3 | Deactivating user updates status indicator and sets DB active flag to false | End-to-End + DB assertion |
| 4 | Deactivated user is blocked from login and does not receive successful token response | Security + End-to-End |
| 5 | Edit User Info action is not exposed for deactivated user | Security/Permission |
| 6 | Invalid first-name filter returns no rows or empty state | Edge Case |
| 7 | Apply Filter with empty first-name keeps page stable and result grid accessible | Edge Case |
| 8 | Users search returns currently logged-in admin user by login filter | Functional |

## Coverage Notes

- Preserves the original reusable flow: admin login, users search, disable action, logout, disabled-user login attempt.
- All previously hardcoded UI values were externalized to testData/DeactivateUserTestData.json.
- User active state is restored after deactivate-specific tests to support repeatable reruns.
- Runtime browser errors are captured through pageerror and asserted as none at test end.
- Deactivated login flow includes token-endpoint response capture and asserts that no successful token payload is issued.

Total Tests: 8
