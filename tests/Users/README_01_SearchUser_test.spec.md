# Test File: Users/01_SearchUser_test.spec.ts

Module: Users - Search User
Location: tests/Users/01_SearchUser_test.spec.ts
Test Data: testData/SearchUserTestData.json
Fixture: loginAsAdmin (tests/myTestData.ts)
Navigation Helper: navigateToUsers (tests/framework/navigation.helper.ts)
DB Helpers: fetchUserClientByUsername, fetchUserClientsByFilters, fetchAnyInactiveUserClient (testData/database.utils.ts)

## Test Cases

| # | Test Name | Type |
|---|-----------|------|
| 1 | Search User controls are visible and available | Visibility |
| 2 | Apply Filter by first name returns successful search results | Functional |
| 3 | Filter by login returns matching user and DB row exists | Functional + DB assertion |
| 4 | Filter by last name returns matching rows in UI and DB | Functional + DB assertion |
| 5 | Group ID filtering is case-insensitive and returns matching groups | Functional + DB assertion |
| 6 | Status filter Active returns active user rows when selected | Functional |
| 7 | User Type dropdown has vendor/account/billing-group options | Functional |
| 8 | User Type filter vendor returns vendor rows | Functional |
| 9 | User Type filter account returns account rows | Functional |
| 10 | User Type filter billing-group returns billing-group rows | Functional |
| 11 | Vendor dropdown can be selected and filtered without errors | Functional |
| 12 | Apply Filter with empty fields keeps page stable and result grid available | Edge Case |
| 13 | Invalid login returns no results or empty state | Edge Case + DB assertion |
| 14 | Invalid group id returns no results or empty state | Edge Case + DB assertion |
| 15 | Whitespace login does not throw errors and keeps page usable | Edge Case |
| 16 | Inactive or deactivated user does not expose editable actions in search result menu | Security/Permission |
| 17 | User info row displays assigned group for the known login | Functional + DB assertion |
| 18 | Login filter value persists after applying filter | Functional |

## Coverage Notes

- Existing reusable functionality was preserved and expanded instead of removed.
- Hardcoded UI assertions were generalized where practical to avoid brittle checks against changeable numeric/date values.
- UI-to-DB cross-validation is included for login, name, group filtering, and invalid-value no-result behavior.
- Runtime browser errors are asserted as empty after each test.

Total Tests: 18
