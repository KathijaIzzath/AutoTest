# Test File: `Insurance/03_EditInsurance_test.spec.ts`

**Module:** Edit Insurance Company  
**Location:** `tests/Insurance/03_EditInsurance_test.spec.ts`  
**Test Data:** `testData/EditInsuranceTestData.json`  
**Fixture:** `loginAsAdmin` from `tests/myTestData.ts`  
**Navigation Helper:** `navigateToInsurance`  
**DB Utility:** `fetchInsuranceCompanyEditFields`

## DB Query Coverage

```sql
select contactname, notes, claimstatustype, eligibilitytype
from insurancecompany
where neicid = '03036' and name like 'BLUE %'
```

Expected DB values:
| Column | Expected Value |
|--------|----------------|
| contactname | KATHIJA |
| notes | AUTO TEST |
| claimstatustype | P |
| eligibilitytype | P |

## Test Cases

| # | Test Name | Type |
|---|-----------|------|
| 1 | Edit insurance functionality - functional end-to-end flow and save | Functional + DB |
| 2 | Edit Insurance modal fields are visible and available | Visibility |
| 3 | Edit Insurance modal eligibility and claim status type options are visible | Visibility |
| 4 | Edit Insurance modal notes, active, legacy and save button are visible | Visibility |
| 5 | Edit Insurance modal Transactions section checkboxes are visible | Visibility |
| 6 | Edit Insurance modal Additional Transactions section is visible | Visibility |
| 7 | Edit Insurance modal state dropdown has correct pre-filled value | Functional |
| 8 | Edit Insurance - DB record reflects expected contactname, notes, claimstatustype, eligibilitytype | DB |
| 9 | Insurance dashboard filter by Name and EDI ID returns expected row | Functional |
| 10 | Insurance dashboard invalid name filter returns no rows | Edge case |
| 11 | Insurance dashboard invalid EDI ID filter returns no rows | Edge case |
| 12 | Insurance dashboard empty filters keep controls and columns available | Edge case |
| 13 | Edit Insurance modal Professional Claims checkbox toggle is stable | Stability |
| 14 | Edit Insurance - Participating options toggle from current state without error | Stability |

## Notes

1. All hardcoded values are externalized in `testData/EditInsuranceTestData.json`.
2. The functional test (Test 1) handles iterative runs: if Participating is already selected, it toggles the selection before re-applying — ensuring the test modifies the value and validates the saved state each run.
3. Test 8 is a standalone DB-only assertion that does not require UI navigation.
4. DB values are compared directly against UI-visible field values in Test 1 after save.
