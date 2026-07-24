# Test File: Users/02_AddNewUser_test.spec.ts

Module: Users - Create New User
Location: tests/Users/02_AddNewUser_test.spec.ts
Test Data: testData/AddNewUserTestData.json
Fixture: loginAsAdmin (tests/myTestData.ts)
Navigation Helper: navigateToUsers (tests/framework/navigation.helper.ts)
DB Helper: fetchUserClientByUsername (testData/database.utils.ts)
Sequence State: testData/AddNewUserSequenceState.json

## Test Cases

| # | Test Name | Type |
|---|-----------|------|
| 1 | Create New User form fields are visible and available | Visibility |
| 2 | User Type dropdown includes expected options and supports vendor/account/billing-group | Functional |
| 3 | Required field validation keeps Save disabled when key inputs are empty | Validation |
| 4 | Invalid first-name filter on Users dashboard returns no rows or empty state | Edge Case |
| 5 | Create vendor user with copied permissions, vendor/account/group mapping, and verify in UI and DB | End-to-End + DB assertion |
| 6 | Generated email and last name sequence increments for each run | Utility/Functional |

## Dynamic Data Strategy

- Email generation format: automationtestNNNN@secureconnect.com
- Last name generation format: TestUser NN
- Sequence is persisted in testData/AddNewUserSequenceState.json to keep incrementing across runs.
- Case number and phone values are generated per sequence (no brittle hardcoded values).

## Coverage Notes

- Existing recorder flow is preserved and converted into reusable helpers.
- Hardcoded values were externalized to a properties-style JSON file.
- UI and DB are cross-validated for created user identity.
- Runtime browser errors are asserted as empty after each test.

Total Tests: 6
