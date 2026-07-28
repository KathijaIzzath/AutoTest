# Test File: Users/04_GroupRestriction_test_spec.ts

Module: Users - Group Restriction
Location: tests/Users/04_GroupRestriction_test_spec.ts
Test Data: testData/GroupRestrictionUserTestData.json
Fixture: loginAsAdmin (tests/myTestData.ts)
Navigation Helper: navigateToUsers (tests/framework/navigation.helper.ts)
DB Helpers: fetchUserClientByUsername, fetchUserClientsByFilters, fetchAnyInactiveUserClient (testData/database.utils.ts)

## Test Cases

| # | Test Name | Type |
|---|-----------|------|
| 1 | Group Restriction filter controls are visible and available | Visibility |
| 2 | Apply Filter by login returns matching row and DB identity fields | Functional + DB assertion |
| 3 | Apply Filter by first name returns searchable target and valid rows | Functional |
| 4 | Group ID filter is case-insensitive and UI is aligned to DB results | Functional + DB assertion |
| 5 | Search for disabled user shows inactive marker and red semantic status indicator | Functional + Negative |
| 6 | After enabling deactivated user, status becomes active and shows green semantic indicator | End-to-End + DB assertion |
| 7 | Disabled/deactivated users do not expose Edit User Info action when business rules disallow it | Security/Permission |
| 8 | Configured target username remains active in DB and appears in active-filter UI results | Functional + DB assertion |
| 9 | Invalid login filter returns no rows or empty state | Edge Case |
|10 | Invalid group-id filter returns no rows or empty state | Edge Case |
|11 | Empty and whitespace filter values keep the page stable | Edge Case |
|12 | Users module returns currently logged-in admin user by login filter when represented in DB | Functional |
|13 | TC-GR-001/002: Add single allowed group and verify it persists on reopen when edit is available | Functional + Persistence |
|14 | TC-GR-004/006: Add second allowed group and prevent duplicate assignment on the same profile | Functional + Validation |
|15 | TC-GR-007: Billing-group user dashboard Group DDL shows assigned group options and is not blank | Functional + Role Restriction |
|16 | TC-GR-008/009: Single-group and multi-group users only see allowed groups in dashboard selector | Functional + Role Restriction |
|17 | TC-GR-010/011/012: Claims module for restricted user excludes blocked group on broad and patient-account searches | Cross-Module Restriction |
|18 | TC-GR-013/014: Accounts and Provider Groups modules do not expose blocked group rows for restricted users | Cross-Module Restriction |
|19 | TC-GR-015/016/018: Group Enrollments lookup/grid exposes allowed groups and hides blocked group | Cross-Module Restriction |
|20 | TC-GR-019/020: Process Payments active-site/group options exclude blocked and deactivated groups | Cross-Module Restriction |
|21 | TC-GR-021/022: Users filter by allowed group returns matching users and restricted user can find own login | Functional + Restriction |

## Coverage Notes

- Preserves reusable Users dashboard patterns from existing suites (readiness guard, skip-safe environment checks, serial-safe state toggling).
- Externalizes all labels, placeholders, selectors, values, regexes, and timeout settings into testData/GroupRestrictionUserTestData.json.
- Validates inactive/deactivated status in UI and verifies semantic color behavior as red/green without hardcoding absolute RGB values.
- Compares UI search outcomes with usersclients DB results where applicable.
- Includes regression-safe edge cases for invalid, empty, and whitespace filters.
- Captures runtime page errors and asserts none are thrown.
- Adds matrix-aligned TC-GR coverage for user profile group assignment/persistence, duplicate prevention, and cross-module restriction checks.
- Restricted-user flows are configuration-driven through testData/GroupRestrictionUserTestData.json under users.singleGroupUser, users.multiGroupUser, and users.billingGroupUser.
- Group allow/block expectations are configuration-driven through testData/GroupRestrictionUserTestData.json under groups.allowedGroup1, groups.allowedGroup2, groups.blockedGroup, and groups.deactivatedGroup.
- Cross-module tests are guarded with environment-safe skip logic when role access, feature availability, or seeded data is not present.

Total Tests: 21
