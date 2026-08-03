# Provider Group Regression and Reference Guide

## Purpose

This document is a working regression and reference set for validating Provider Group behavior across:

- Creation and edit flows
- Activation and deactivation controls
- Profile-based security and restrictions
- Identifier and PM Identifier data quality
- Dashboard filtering and group selection
- Cross-module dependencies and downstream handoffs

## Scope and Jira Coverage

Primary Jira sources reviewed include:

- SC-849, SC-813, SC-799, SC-776, SC-765, SC-745, SC-731, SC-730, SC-698, SC-666, SC-642, SC-631, SC-599, SC-583, SC-550, SC-465, SC-418, SC-417, SC-413, SC-407, SC-403, SC-401, SC-400, SC-323, SC-322, SC-320, SC-297, SC-115, SC-88, SC-79, SC-78, SC-77, SC-75, SC-68, SC-67, SC-63, SC-59, SC-52, SC-17, SC-15, SC-9

Exclusions:

- Finance-only scenarios are not expanded here unless they directly validate Provider Group dependency, restriction, activation state, or configuration handoff.

## Provider Group Rules and Restrictions

| Rule | Validation Intent | Jira Reference |
|---|---|---|
| SCAdmin visibility rule | SCAdmin can access Provider Group records without permission-level group constraints; dashboard group dropdown should populate all groups. | SC-323 |
| Account dependency rule | A Provider Group belongs to an Account; deactivating an Account prevents linked groups from remaining effectively active. | SC-731, SC-88 |
| Activation consistency rule | Activation and deactivation behavior is consistent across Account, Provider Group, and Provider records. | SC-88, SC-15 |
| Deactivated entity protection rule | Users cannot add Provider or Provider Group records under deactivated parent entities. | SC-465, SC-583 |
| Non-SecureConnect restriction | Claims Correct control is disabled for non-SecureConnect user types. | SC-698, SC-642 |
| Identifier data integrity rule | PM Identifier and related identifiers save correctly, remain editable when intended, and allow deletion where supported. | SC-297, SC-115, SC-75, SC-68 |
| Cross-module filter rule | Dashboard Provider Group selection is honored in dependent modules (ERA, Claims, Analytics, Claims Correct). | SC-9, SC-322, SC-849, SC-745 |

## Profile Coverage

| Profile | Expected Provider Group Access Pattern | Key Validation Focus |
|---|---|---|
| SCAdmin | Unrestricted access to all Provider Groups | Dropdown population, create/edit/deactivate, cross-module visibility |
| Vendor | Restricted to assigned vendor/account/group relationships | Allowed visibility only, restricted controls not editable |
| Account | Restricted to assigned accounts and linked groups | Search limitation and downstream filtering |
| Billing Group | Restricted to explicitly assigned Provider Groups | Exact group visibility and module enforcement |

## Test Cases

### 1. Provider Group Creation and Basic Maintenance

| TC ID | Scenario | Profile | Expected Result | Jira Ref |
|---|---|---|---|---|
| PG-001 | Create Provider Group from Account menu | SCAdmin | New Provider Group is created successfully and Add or Save remains enabled. | SC-77, SC-377 |
| PG-002 | Create Provider Group with valid long name | SCAdmin | Boundary-length name saves without validation or disabled-button defect. | SC-63 |
| PG-003 | Add Provider Group under active Account | SCAdmin | Group appears under account and remains editable. | SC-550 |
| PG-004 | Edit Provider Group and save | SCAdmin | Save remains enabled and changes persist after reload. | SC-6 |
| PG-005 | Add Provider from Provider Group flow | SCAdmin | Add Provider screen loads and provider is created successfully. | SC-776, SC-325 |
| PG-006 | Provider add date and feature behavior | SCAdmin | Date and feature controls behave consistently during create flow. | SC-799 |

### 2. Activation, Deactivation, and Parent-Child Controls

| TC ID | Scenario | Profile | Expected Result | Jira Ref |
|---|---|---|---|---|
| PG-010 | Deactivate Provider Group from UI | SCAdmin | Status changes and group is no longer treated as active in search and filters. | SC-15 |
| PG-011 | Prevent Add Provider under deactivated Provider Group | SCAdmin | Add Provider action is blocked or unavailable. | SC-583 |
| PG-012 | Prevent Add Provider Group under deactivated Account | SCAdmin | Child group creation is blocked. | SC-465 |
| PG-013 | Deactivated Account cascades to Provider Groups | SCAdmin | Linked groups do not remain active after parent deactivation. | SC-731, SC-88 |
| PG-014 | Search versus Edit deactivated-group consistency | SCAdmin | Deactivated groups are shown consistently across views. | SC-813 |

### 3. Search, Filtering, and Dashboard Group Selection

| TC ID | Scenario | Profile | Expected Result | Jira Ref |
|---|---|---|---|---|
| PG-020 | Search Provider Group by city | SCAdmin | Results return without internal server errors. | SC-79 |
| PG-021 | Search Provider Group by state | SCAdmin | Results return without internal server errors. | SC-78 |
| PG-022 | Partial filtering | SCAdmin | Partial text filters return expected matching records. | SC-17 |
| PG-023 | SCAdmin dashboard dropdown population | SCAdmin | Provider Group dropdown shows all groups. | SC-323 |
| PG-024 | Dashboard group selection carry-forward | All authorized profiles | Selected group is retained in dependent module queries. | SC-9 |

### 4. Identifier, PM Identifier, and Data Quality

| TC ID | Scenario | Profile | Expected Result | Jira Ref |
|---|---|---|---|---|
| PG-030 | Edit PM Identifier | SCAdmin | PM Identifier remains editable and persists after reload. | SC-297 |
| PG-031 | Modify identifier without UI freeze | SCAdmin | Screen remains responsive and update completes. | SC-115 |
| PG-032 | Add multiple identifier rows | SCAdmin | Multiple rows save successfully and Save remains enabled. | SC-68 |
| PG-033 | Delete identifier row | SCAdmin | Identifier row is removable and delete action is available. | SC-75 |
| PG-034 | Trim whitespace in Group ID | SCAdmin | Leading and trailing spaces are trimmed before persist. | SC-407 |

### 5. Feature Flags, Checkboxes, and Editable Controls

| TC ID | Scenario | Profile | Expected Result | Jira Ref |
|---|---|---|---|---|
| PG-040 | Claims Correct placement and visibility | SCAdmin | UI reflects intended placement, removal, or relocation behavior. | SC-642 |
| PG-041 | Claims Correct disabled for non-SecureConnect | Vendor, Account, Billing Group | Checkbox is disabled or not editable. | SC-698 |
| PG-042 | Claims Correct editable for SCAdmin where supported | SCAdmin | Supported control is editable and saves correctly. | SC-698 |
| PG-043 | Aptarro checkbox save and handoff | SCAdmin | UI value persists and downstream API behavior reflects setting. | SC-400, SC-401 |
| PG-044 | Report switches save | SCAdmin | Toggle states persist after reopen. | SC-320 |
| PG-045 | Batch report and remittance field editability | SCAdmin | Target fields remain editable and save correctly. | SC-67 |
| PG-046 | Parse By Prefix in Glue ERA | SCAdmin | Option exists on Create and Edit and saves correctly. | SC-59 |

### 6. Profile-Based Security and Restrictions

| TC ID | Scenario | Profile | Expected Result | Jira Ref |
|---|---|---|---|---|
| PG-050 | Restricted users see only assigned groups | Vendor, Account, Billing Group | Only authorized Provider Groups are visible. | SC-323, SC-62 |
| PG-051 | Account profile restrictions in group list | Account | Only groups under assigned accounts are shown. | SC-62 |
| PG-052 | Billing Group exact-visibility enforcement | Billing Group | Only explicitly assigned Provider Groups are visible. | SC-9 |

### 7. Cross-Module Dependencies

| TC ID | Dependent Module | Scenario | Expected Result | Jira Ref |
|---|---|---|---|---|
| PG-060 | ERA | Dashboard Provider Group selection respected | ERA query works with selected Provider Group context. | SC-322 |
| PG-061 | Claims | Claims Correct external navigation | Correct external site navigation for eligible group-linked claim. | SC-745 |
| PG-062 | Analytics | Profile security enforcement | UI and API return only authorized group data. | SC-849 |
| PG-063 | Group Enrollment | Enrollment creation from selected group context | Enrollment step opens with group relationship preserved. | SC-666, SC-665 |
| PG-064 | Group Enrollment | Approval and processor validation | No invalid processor ID defect for valid linked data. | SC-822, SC-417 |
| PG-065 | Files Explorer | Provider Group data join | File records include correct group-linked data. | SC-413 |
| PG-066 | API and Client Users | Provider Group insert handoff | Required client user fields populate and API remains stable. | SC-599 |
| PG-067 | API | Dynamic client support | Provider Group APIs support non-CareTracker client contexts. | SC-418 |
| PG-068 | Claims and Aptarro | Aptarro uses selected record group ID | Group ID comes from active record context. | SC-631, SC-403 |
| PG-069 | Account and Provider Group | Date-field alignment | ERA, Statements, Claim Status, and Eligibility dates align across modules. | SC-730 |

## Possible Test Data Referenced from Jira

| Data Type | Possible Test Data | Usage | Jira Ref |
|---|---|---|---|
| Provider Group ID | Group ID with whitespace such as G23734 | Whitespace trimming validation | SC-407 |
| Provider Group ID | Existing active group such as G23734 | Dashboard selection and Claims Correct or Analytics checks | SC-9, SC-849 |
| Provider Group Name | Boundary-length name value around 65 characters | Long-name create validation | SC-63 |
| Provider Group Name | Group with report switches enabled | Report toggle persistence | SC-320 |
| Account | Active account with at least 2 linked groups | Create, edit, search, deactivation cascade | SC-731, SC-813 |
| Account | Deactivated account with active child groups before fix | Cascade deactivation regression | SC-465, SC-731 |
| User Profile | SCAdmin test user | Unrestricted Provider Group access and edit validation | SC-323 |
| User Profile | Vendor user with limited assignment | Restricted search visibility | SC-323 |
| User Profile | Account user with one allowed account | Account-scoped group restriction | SC-62 |
| User Profile | Billing Group user with one explicit group | Exact group security validation | SC-9 |
| Identifier | PM-10001 style value | PM Identifier edit and save regression | SC-297 |
| Identifier | Three distinct identifier rows | Multi-row save validation | SC-68 |
| Search Data | Known city and state values for groups | City and state search validation | SC-79, SC-78 |
| Payer Data | Group-linked payer setup with valid processor ID | Enrollment invalid processor regression | SC-822, SC-417 |
| Claim Data | Claim tied to Claims Correct enabled group | External navigation validation | SC-745 |

## Recommended Regression Checklist

- Validate SCAdmin can view all Provider Groups in dashboard dropdown and search results.
- Validate non-admin profiles only see authorized Provider Groups.
- Validate Provider Group create, edit, and save flows from Account and Provider Group screens.
- Validate deactivation cascades from Account to Provider Group and blocks child actions.
- Validate identifier, PM Identifier, and multi-row save behavior.
- Validate dashboard group selection carries into ERA, Claims, Analytics, and Claims Correct.
- Validate Aptarro and Group Enrollment dependencies use the correct Provider Group context.

## References

- [01 Group Dashboard Test](./01_Group_Dshbd_test.spec.ts)
- [02 Create Provider Group Test](./02_Create_PGroup_test.spec.ts)
- [03 Edit Provider Group Test](./03_EditGroup_test.spec.ts)
- [README 01 Group Dashboard](./README_01_Group_Dshbd_test.spec.md)
- [README 02 Create Provider Group](./README_02_Create_PGroup_test.spec.md)
- [README 03 Edit Provider Group](./README_03_EditGroup_test.spec.md)
