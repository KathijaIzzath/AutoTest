# Test File: ProviderGroup/04_ProviderGroupRestrictionsDependencies_test.spec.ts

Module: Provider Groups - restrictions, rules, and dependencies
Location: tests/ProviderGroup/04_ProviderGroupRestrictionsDependencies_test.spec.ts
Test Data: testData/ProviderGroupRestrictionsDependenciesTestData.json
Fixture: loginAsAdmin (tests/myTestData.ts)
Navigation Helpers: tests/framework/navigation.helper.ts

## Coverage Mapping

| # | Test Name | Coverage Area | Jira Reference |
|---|-----------|---------------|----------------|
| 1 | PG-001/002/003/004 | Creation and basic maintenance baseline | SC-77, SC-63, SC-550, SC-6 |
| 2 | PG-005/006 | Add Provider flow from Provider Group | SC-776, SC-325, SC-799 |
| 3 | PG-010/011/014 | Activation/deactivation controls | SC-15, SC-583, SC-813 |
| 4 | PG-012/013 | Parent-child account/group deactivation constraints | SC-465, SC-731, SC-88 |
| 5 | PG-020/021/022/023/024 | Search, filter, and dashboard DDL behavior | SC-79, SC-78, SC-17, SC-323, SC-9 |
| 6 | PG-030/031/032/033/034 | Identifier and PM identifier integrity | SC-297, SC-115, SC-68, SC-75, SC-407 |
| 7 | PG-040/041/042/043/044/045/046 | Feature flags and editable control behavior | SC-642, SC-698, SC-400, SC-401, SC-320, SC-67, SC-59 |
| 8 | PG-050/051/052 | Profile-based security restrictions | SC-323, SC-62, SC-9 |
| 9 | PG-060 | ERA dependency for selected provider group | SC-322 |
|10 | PG-061/062/068 | Claims Correct and selected group context consistency | SC-745, SC-849, SC-631, SC-403 |
|11 | PG-063/064/065/066/067/069 | Group Enrollment and API-linked dependency baselines | SC-666, SC-665, SC-822, SC-417, SC-413, SC-599, SC-418, SC-730 |

## Notes

- Suite is serial and skip-safe for environment variability.
- Restricted profile credential checks are data-driven via testData/ProviderGroupRestrictionsDependenciesTestData.json.
- allowStateMutation defaults to false to avoid unintended entity lifecycle side effects.
- Cross-module checks assert no disallowed group/account token leakage in visible rows.

Total Tests: 11
