# Test File: Users/06_VendorRestriction_test_spec.ts

Module: Users - Vendor Restriction
Location: tests/Users/06_VendorRestriction_test_spec.ts
Test Data: testData/VendorRestrictionUserTestData.json
Fixture: loginAsAdmin (tests/myTestData.ts)
Navigation Helper: tests/framework/navigation.helper.ts
DB Helpers: fetchUserClientByUsername (testData/database.utils.ts)

## Test Cases

| # | Test Name | Coverage |
|---|-----------|----------|
| 1 | TC-VR-001: Admin can assign one vendor to user profile and persist | Vendor assignment + persistence |
| 2 | TC-VR-002/003/004: Multi-vendor assignment displays and preserves prior entries | Multi-vendor visibility and preservation |
| 3 | TC-VR-005: Removing a vendor removes its effective downstream visibility | Vendor removal + dependency behavior |
| 4 | TC-VR-006: Disabled/deactivated user profile cannot be modified for vendor restrictions | Disabled-user edit boundary |
| 5 | TC-VR-007/008/009/010/011: Vendor and group selectors stay populated and within authorized scope | Selector population + authorization boundary |
| 6 | TC-VR-012/013/014/015: Accounts searches and inactive filters do not leak disallowed vendor data | Accounts enforcement |
| 7 | TC-VR-016/017/018/019: Provider Groups and dependent lookups honor vendor scope | Provider group/downstream enforcement |
| 8 | TC-VR-020/021/022/023/024/025: Claims searches, pagination path, and first-session restrictions remain scoped | Claims enforcement + first-session behavior |
| 9 | TC-VR-026/027/028: Claims Archive and action-linked context honor vendor restrictions | Claims archive enforcement |
|10 | TC-VR-029/030/031: Group Enrollments and lookups remain limited to assigned vendors | Enrollment enforcement |
|11 | TC-VR-032/033: Users vendor filter and restricted self-profile visibility remain bounded | Users module + self-profile boundary |
|12 | TC-VR-034/035/036/037: Payments and payment analytics remain within vendor scope | Payments + analytics security |
|13 | TC-VR-038/039: Analytics reports and parameterized flows do not expose disallowed vendor scope | Analytics API/UI restriction |
|14 | TC-VR-040/041/042: Blank searches, relogin persistence, and API/UI consistency remain restricted | Boundary + session + API/UI consistency |
|15 | TC-VR-043: Deactivated restricted user cannot log in and access vendor-scoped data | Deactivated-user login rejection |
|16 | DB sanity: target user profile row exists for cross-module vendor restriction validation context | DB validation guard |

## Notes

- Suite is environment-safe and uses skip guards when credentials, optional modules, or seeded data are unavailable.
- Fill users.vendorRestricted, users.accountRestricted, users.billingGroupRestricted, and users.deactivatedRestricted in testData/VendorRestrictionUserTestData.json for full execution.
- Configure vendors.allowedVendorA/vendors.allowedVendorB/vendors.disallowedVendor and group tokens for your environment data.
- Optional allowed/disallowed claim-id checks run only when claim IDs are configured.

Total Tests: 16
