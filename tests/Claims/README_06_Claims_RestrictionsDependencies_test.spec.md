# Test File: 06_Claims_RestrictionsDependencies_test.spec.ts

Module: Claims Restrictions and Dependencies
Location: tests/Claims/06_Claims_RestrictionsDependencies_test.spec.ts
Test Data: testData/ClaimsRestrictionsDependenciesTestData.json

## Coverage Intent

This suite implements matrix-driven validation for Claims restriction, persona permissions, and cross-module dependency behavior.

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
| SCAdmin baseline claims access works | TC-CLM-001, TC-CLM-006 |
| Persona restrictions enforce scope with no leakage | TC-CLM-002, TC-CLM-003, TC-CLM-004, TC-CLM-007, TC-CLM-008, TC-CLM-009, TC-CLM-010, TC-CLM-011, TC-CLM-012 |
| Role or profile changes reflected after fresh login | TC-CLM-005 |
| Claims Correct permission and dependency matrix | TC-CLM-013, TC-CLM-016, TC-CLM-017, TC-CLM-019 |
| Claims Correct launch and context behavior | TC-CLM-014, TC-CLM-015, TC-CLM-018 |
| Worked toggle and status or indicator behavior | TC-CLM-020, TC-CLM-021, TC-CLM-022, TC-CLM-024 |
| Claims Archive restrictions and retrieval consistency | TC-CLM-025, TC-CLM-026, TC-CLM-027, TC-CLM-028 |
| Dashboard or module context carry-forward stability | TC-CLM-029, TC-CLM-030, TC-CLM-034 |
| Analytics or reporting dependency stability | TC-CLM-031, TC-CLM-032, TC-CLM-033 |
| Inactive user security check | Inactive or disabled user security rule |

## Notes

1. Persona credentials are config-driven and skip-safe when unavailable.
2. Restriction checks use allowed and disallowed tokens to detect leakage.
3. Claims Correct checks are permission-driven and resilient to environment-specific action availability.
4. Dashboard, archive, provider-group, and analytics paths are validated for dependency consistency without hard-failure assumptions.
