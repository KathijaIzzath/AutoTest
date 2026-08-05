# Test File: Account/05_AccountModuleCrossValidation_test.spec.ts

Module: Accounts - SecureConnect module and cross-module validation
Location: tests/Account/05_AccountModuleCrossValidation_test.spec.ts
Test Data: testData/AccountModuleCrossValidationTestData.json
Fixture: loginAsAdmin (tests/myTestData.ts)
Navigation Helpers: tests/framework/navigation.helper.ts
DB Helper: fetchUserClientByUsername (testData/database.utils.ts)

## Coverage Mapping

| # | Test Name | Matrix Coverage |
|---|-----------|------------------|
| 1 | ACC-001/002/006: SCAdmin create/edit entry points and list refresh consistency | UI maintenance baseline |
| 2 | ACC-003/004/005: Account search by name/number and single-vendor baseline behavior | Search and create/edit dependencies |
| 3 | ACC-010: SCAdmin blank search returns account rows | Admin full-search baseline |
| 4 | ACC-011/012/013/014/015: Restricted profile account scope enforcement | Profile restriction enforcement |
| 5 | ACC-020/021/022/023/024: Users profile dependency visibility remains consistent | Account-user profile dependencies |
| 6 | ACC-030/031/032/033: Inactive-state action behavior and blocked maintenance checks | Deactivation behavior (read-only safe) |
| 7 | ACC-XM-001/002/003/004: Claims workflows honor account restriction scope | Claims cross-module scope |
| 8 | ACC-XM-010/011/012: Users module search respects saved account-linked setup | Users cross-module scope |
| 9 | ACC-XM-020/021/022: Provider Group and account dependency scope checks | Provider Group dependency |
|10 | ACC-XM-030/031/032: Group Enrollment lookup respects account-linked restrictions | Group Enrollment dependency |
|11 | ACC-XM-040/041/042/043: Dashboard selectors and ERA flows do not broaden scope | Selector and ERA dependency |
|12 | ACC-NEG-001/002/003/004/005: Boundary checks for blank, partial, relogin persistence, and non-leakage | Boundary and persistence checks |
|13 | ACC-DB-001: Target user row exists for account-linked cross-module validation context | DB sanity context |

## Notes

- This suite is serial and skip-safe for environment variability.
- Restricted profile tests require credentials in testData/AccountModuleCrossValidationTestData.json.
- State mutation is disabled by default (values.allowStateMutation=false) to avoid environment side effects.
- Cross-module checks validate no leakage of disallowed sibling account/group tokens in visible rows.

Total Tests: 13
