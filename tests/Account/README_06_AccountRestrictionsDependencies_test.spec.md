# Test File: Account/06_AccountRestrictionsDependencies_test.spec.ts

Module: Accounts - restrictions and dependency validation
Location: tests/Account/06_AccountRestrictionsDependencies_test.spec.ts
Test Data: testData/AccountRestrictionsDependenciesTestData.json
Fixture: loginAsAdmin (tests/myTestData.ts)
Navigation Helper: tests/framework/navigation.helper.ts

## Coverage Mapping

| # | Test Name | Coverage Area | Jira Ref |
|---|-----------|---------------|----------|
| 1 | ACC-SF-001: SCAdmin blank search returns accounts | Search and filtering | Baseline |
| 2 | ACC-SF-003/004: Search by account name and account number | Search and filtering | SC-768 |
| 3 | ACC-SF-005: Tax ID filtering stays scoped | Search and filtering | SC-693 |
| 4 | ACC-SF-006: Pagination and scrolling does not leak disallowed accounts | Search and filtering | Regression |
| 5 | ACC-CM-001/003: Add account modal required fields and validation baseline | Creation and maintenance | Baseline |
| 6 | ACC-CM-002/004: Edit account entry and linked provider/group action availability | Creation and maintenance | Related dependency |
| 7 | ACC-AD-001/002/003: Deactivation controls and inactive-state rule readiness | Activation and deactivation | SC-731 |
| 8 | ACC-UR-001/002/003/004: Restricted-user entitlement scope persists across relogin | Entitlements | SC-76, SC-2 |
| 9 | ACC-DEP-001: Claims blank search remains in restricted account scope | Cross-module dependency | Restriction themes |
|10 | ACC-DEP-002: ERA and Group Enrollment selectors do not broaden scope | Cross-module dependency | Selector dependency |
|11 | ACC-DEP-003: Provider Groups, Finance links, and Users search remain scoped | Cross-module dependency | Dependency regression |

## Notes

- Restricted profile credentials are intentionally data-driven and skip-safe.
- Deactivation mutation is off by default through limits.allowStateMutation=false.
- Account, group, and Tax ID fixtures are configurable in the data file.
- This suite validates leakage prevention across rows and module transitions with environment-safe guards.

Total Tests: 11
