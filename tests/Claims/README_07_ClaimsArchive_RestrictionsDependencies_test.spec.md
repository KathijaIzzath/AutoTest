# Test File: 07_ClaimsArchive_RestrictionsDependencies_test.spec.ts

Module: Claims Archive Restrictions and Dependencies
Location: tests/Claims/07_ClaimsArchive_RestrictionsDependencies_test.spec.ts
Test Data: testData/ClaimsArchiveRestrictionsDependenciesTestData.json

## Scope

Matrix-based validation for Claims Archive restrictions, required rules, date logic, action permissions, and cross-module dependencies.

## Persona Matrix Covered

1. SCAdmin baseline
2. Account user
3. Vendor user
4. Billing Group user
5. SecureConnect user
6. Inactive user

## Test Case Mapping

| Grouped Test | Covered Test Cases |
|---|---|
| Archive opens, defaults, prepopulation, and valid search behavior | CA-001, CA-002, CA-003, CA-006, CA-008 |
| Required fields and date-range enforcement behavior | CA-004, CA-005, CA-007 |
| Persona restriction and leakage prevention matrix | CA-009, CA-010, CA-011, CA-012, CA-013, CA-014 |
| Archive action-menu and Timely Filing permission behavior | CA-015, CA-016, CA-017, CA-018 |
| Archive vs live claim consistency path | CA-019 |
| Account or group dependency transitions and scope carry-forward | CA-020, CA-021, CA-022 |
| Archive-linked reporting context path | CA-023 |
| Fresh-session restriction enforcement | CA-024 |
| Inactive user access prevention | Inactive or disabled user rule |

## Notes

1. Suite is skip-safe for environment/auth instability and missing persona credentials.
2. Leakage checks rely on allowed and disallowed token presence in visible result rows.
3. Timely Filing launch is validated only when action availability is present for the selected row.
