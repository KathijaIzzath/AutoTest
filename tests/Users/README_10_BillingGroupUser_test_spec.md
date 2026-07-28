# Test File: Users/10_BillingGroupUser_test_spec.ts

Module: Users - Billing Group User Type
Location: tests/Users/10_BillingGroupUser_test_spec.ts
Test Data: testData/BillingGroupUserTestData.json
Fixture: loginAsAdmin (tests/myTestData.ts)
Navigation Helper: tests/framework/navigation.helper.ts
DB Helpers: fetchUserClientByUsername (testData/database.utils.ts)

## Test Cases

| # | Test Name | Coverage |
|---|-----------|----------|
| 1 | BG-001/002/003/004: Profile setup persists billing-group vendor/account/group assignments and updates after removal | Profile persistence and dependency behavior |
| 2 | BG-005/006/007/008: Header and dashboard DDL context stays scoped for billing group user | Header/context DDL and SC-699/SC-696 alignment |
| 3 | BG-009/010/011: Accounts module enforces account and group visibility boundaries | Accounts restriction (SC-76) |
| 4 | BG-012/013/014/015: Claims searches, pagination path, and context switching do not leak disallowed groups | Claims restriction and leakage checks (SC-408/SC-430/SC-458) |
| 5 | BG-016/017/018: ERA and Group Enrollment respect assigned billing-group scope | ERA + enrollment scoping |
| 6 | BG-019/020/021/022: Financial View Payments and Payment Analytics stay within active-site/group scope | Financial restriction checks (SC-352/SC-438) |
| 7 | BG-023/024: Users module group filter supports allowed groups and blocks privilege escalation | Users module group filter (SC-466) |
| 8 | BG-025/026/027: Analytics module access and provider-group report scope follow permissions and restrictions | Analytics permission and scope behavior |
| 9 | BG-028/029/030: Realtime token ACL dependency and denied group behavior are enforced | Realtime ACL dependency (SC-864) |
|10 | BG-031/032/033: Negative/edge flows (blank search, refresh, pagination) never broaden scope | Regression edge coverage |
|11 | DB sanity: billing-group target user profile exists for regression context | DB baseline guard |

## Notes

- The suite is intentionally environment-safe and will skip when restricted credentials or optional module links are unavailable.
- Populate users.billingGroupUser and other credential sets in testData/BillingGroupUserTestData.json before full runs.
- Configure allowed/disallowed vendor/account/group tokens to match seeded QA data.
- API/UI restriction validation is included by checking captured API payload snippets and visible row data.

Total Tests: 11
