# Test File: `Payer/03_EditPayer_test.spec.ts`

**Module:** Payer — Edit Payer  
**Location:** `tests/Payer/03_EditPayer_test.spec.ts`  
**Test Data:** `testData/EditPayerTestData.json`  
**Fixture:** `loginAsAdmin` (via `tests/myTestData.ts`)  
**Navigation Helper:** `navigateToPayer`

---

## Test Suite: `Edit Payer - Refactored and Extended Coverage`

| # | Test Name | Type |
|---|-----------|------|
| 1 | Edit payer functionality and successful save preserve existing flow | Functional |
| 2 | Edit payer screen fields are visible and actionable | Visibility |
| 3 | Edit payer invalid filter should return no matching rows | Edge Case |
| 4 | Edit payer empty filter should keep dashboard controls available | Edge Case |
| 5 | Edit payer contact empty value should not show success toast | Edge Case |

---

### Test 1 — Full edit payer functional flow
Filters by Payer ID `SKWA0`, confirms the MEDICAID OF WA row appears, opens the Edit modal, verifies Professional TYPE label is present, reopens edit to reach the enrollment section, confirms Participating option labels and all checkboxes (Allow Bulk Enrollments, Eligibility, Claim Status, Batch Claim Status) and payer contact field are visible. Verifies payer contact has the initial value. Then toggles each Participating option, resets and checks each checkbox (uncheck then check), fills payer contact with the updated value, saves, and confirms the "Payer was updated" toast notification appears.  
**Notes:** A Save button guard is applied before filling payer contact to ensure the edit modal is still open after DOM-intensive checkbox interactions.

### Test 2 — Edit payer screen fields visibility
Filters, opens edit, and confirms Professional TYPE label, all five checkboxes (Allow Bulk Enrollments, Eligibility, Claim Status, Batch Claim Status, Attachments), payer contact textbox, and Save button are visible and enabled.

### Test 3 — Invalid filter returns no rows
Filters by a non-existing Payer ID and confirms the grid row count is zero.

### Test 4 — Empty filter keeps dashboard available
Applies filter with an empty Payer ID value and confirms Apply Filter button and grid body remain visible.

### Test 5 — Empty contact value does not trigger success toast
Opens edit, clears the payer contact field, clicks Save, and confirms the success toast does **not** appear and the Save button remains visible.

---

**Total Tests:** 5  
**Helpers:** `applyFilter`, `openEditFromGrid`, `reopenEditWithExistingFlow`, `clickParticipatingIfPresent`, `resetAndCheck`
