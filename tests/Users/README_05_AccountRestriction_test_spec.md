# Test File: Users/05_AccountRestriction_test_spec.ts

Module: Users - Account Restriction
Location: tests/Users/05_AccountRestriction_test_spec.ts
Test Data: testData/AccountRestrictionUserTestData.json
Fixture: loginAsAdmin (tests/myTestData.ts)
Navigation Helper: tests/framework/navigation.helper.ts
DB Helpers: fetchUserClientByUsername (testData/database.utils.ts)

## Test Cases

| # | Test Name | Coverage |
|---|-----------|----------|
| 1 | TC-AR-001: Admin can assign one specific account to a user profile and persist on reopen | User profile setup + persistence |
| 2 | TC-AR-002/004: Admin can assign multiple accounts and adding new one keeps existing assignments | Multi-account persistence |
| 3 | TC-AR-003: Previously assigned restricted accounts are visible and reviewable in Edit User | Edit visibility |
| 4 | TC-AR-005: Removing an account removes it from profile persistence and dependent scope | Account removal behavior |
| 5 | TC-AR-006/007: Add Account search supports partial account token and shows account-specific guidance | Lookup + UX guidance |
| 6 | TC-AR-008/009/010/011: Accounts module blank and filtered searches stay within assigned account scope | Accounts enforcement |
| 7 | TC-AR-012/013/014/015: Provider Groups and Add Provider entry points remain restricted by account scope | Provider-group/account dependency |
| 8 | TC-AR-016/017/018/019/020/021: Claims enforcement blocks disallowed account/group leakage in base and targeted searches | Claims enforcement |
| 9 | TC-AR-022/023/024: Claims Archive honors account restriction and does not expose unauthorized action context | Claims Archive enforcement |
|10 | TC-AR-025/026/027: Group Enrollments and lookup paths stay within allowed account scope | Enrollment enforcement |
|11 | TC-AR-028: Users profile reflects saved account restrictions for target user | Users module consistency |
|12 | TC-AR-029: Restricted user can view own profile without privilege escalation | Self-profile boundary |
|13 | TC-AR-030/031/032: View Payments and Payment Analytics stay within allowed scope | Finance enforcement |
|14 | TC-AR-033/034/035: Dashboard vendor/group selectors show authorized options and do not expand scope across modules | Selector + cross-module consistency |
|15 | TC-AR-036/037: Analytics/report-linked views enforce allowed scope where available | Analytics/report restriction |
|16 | TC-AR-038/039/040: Blank searches, relogin session persistence, and UI consistency remain restricted | Boundary + session persistence + UI/API consistency |
|17 | DB sanity: target user profile row exists for cross-module account restriction validation context | DB validation guard |

## Notes

- The suite is designed to be environment-safe with skip guards where restricted credentials, optional modules, or seeded claims are unavailable.
- Configure restricted users in testData/AccountRestrictionUserTestData.json before expecting full cross-module execution.
- Configure allowed/disallowed account and group tokens in testData/AccountRestrictionUserTestData.json to match your environment.
- Optional targeted claim checks (allowedClaimId/disallowedClaimId) run only when values are configured.

Total Tests: 17
