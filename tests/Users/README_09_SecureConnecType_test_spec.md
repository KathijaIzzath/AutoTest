# Test File: Users/09_SecureConnecType_test_spec.ts

Module: Users - SecureConnect User Type
Location: tests/Users/09_SecureConnecType_test_spec.ts
Test Data: testData/SecureConnectUserTypeTestData.json
Fixture: loginAsAdmin (tests/myTestData.ts)
Navigation Helper: tests/framework/navigation.helper.ts
DB Helpers: fetchUserClientByUsername (testData/database.utils.ts)

## Test Cases

| # | Test Name | Coverage |
|---|-----------|----------|
| 1 | SC-UT-001/002/003/004: Authentication lifecycle enforces active-only access and session safety | Active/deactivated login and session lifecycle |
| 2 | SC-UT-005/006/007/008/009/010/011: Users search, vendor/group filters, row detail, and deactivated edit behavior | Users search and edit boundary |
| 3 | SC-UT-012/013/014/015/016/017/018/019/020: Edit profile persists vendor/account/group and retains guidance text | Profile persistence and dependency behavior |
| 4 | SC-UT-021/022/023/024/025/026: Access-level values and dashboard selectors are populated for expected personas | Access-level and DDL population |
| 5 | SC-UT-027/028/029/030/031/032/033/034: Permission-driven menu/action visibility remains accurate | Claims Correct/ACH/Analytics visibility by permission |
| 6 | SC-UT-035/036/037/038/039/040/041/042: Restriction enforcement across Claims/Accounts/Payments/ERA/Enrollments with API-UI consistency | Cross-module restriction enforcement |
| 7 | SC-UT-043/044/045/046/047/048/049/050/051: Dashboard context and cross-module updates stay synchronized after relogin/lifecycle changes | Context propagation and lifecycle consistency |
| 8 | DB sanity: target user profile row exists for SecureConnect user-type validation context | DB baseline guard |

## Notes

- Suite uses environment-safe skips for optional modules, persona credentials, and feature-flagged paths.
- Populate credential sets in testData/SecureConnectUserTypeTestData.json before full execution.
- Configure allowed/disallowed scope tokens (vendor/account/group) to match QA seed data.
- API/UI consistency checks capture response snippets and ensure unauthorized tokens do not appear.

Total Tests: 8
