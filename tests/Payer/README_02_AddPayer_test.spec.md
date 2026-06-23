# Test File: `Payer/02_AddPayer_test.spec.ts`

**Module:** Payer — Add Payer  
**Location:** `tests/Payer/02_AddPayer_test.spec.ts`  
**Test Data:** `testData/AddPayerTestData.json`  
**Fixture:** `loginAsAdmin` (via `tests/myTestData.ts`)  
**Navigation Helper:** `navigateToPayer`  
**DB Dependencies:** `fetchPayerByIdAndNeicId`, `deletePayerByIdAndNeicId` (pre-test cleanup)

---

## Test Suite: `Add Payer - Generated Flow Refactor`

| # | Test Name | Type |
|---|-----------|------|
| 1 | Add Payer modal controls are visible and available | Visibility |
| 2 | Add payer flow saves and appears in dashboard search results | Functional |
| 3 | Dashboard invalid name filter returns no rows | Edge Case |
| 4 | Dashboard empty filters execute successfully and keep grid available | Edge Case |
| 5 | Dashboard whitespace filter does not break search | Edge Case |
| 6 | Add payer with only required fields remains functional for iterative runs | Functional |
| 7 | DB cleanup helper removes target payer row when present | Functional / Cleanup |

---

### Test 1 — Modal controls visibility
Opens Add Payer modal and confirms all form fields are visible: SC Insurance ID, Payer ID, Alt Payer ID, Claim Filing dropdown, Active/Legacy checkboxes, Payer Name, Payer Contact, Phone, Billing Indicator dropdown, all service type checkboxes (Professional, Eligibility, ERA, Institutional, Claim Status, Attachments, Allow Bulk Enrollments, Secondary Claims, Batch Claim Status), Notes, Followup Days, and Add Payer button.

### Test 2 — Full add payer and search result validation
Fills all required and optional fields, submits, navigates back to dashboard, searches by payer name, and confirms the new row appears in the grid. Also verifies the DB record was created.

### Test 3 — Invalid name filter returns no rows
Searches by an invalid/non-existing payer name and confirms the grid has zero rows.

### Test 4 — Empty filters keep grid available
Clears all filter inputs, applies filter, and confirms the grid body and Apply Filter button remain visible.

### Test 5 — Whitespace filter does not break search
Fills the name filter with whitespace, applies filter, and confirms the Apply Filter button is still visible and no error state occurs.

### Test 6 — Only required fields — iterative run
Fills only required fields and submits; confirms the new payer appears in dashboard search results.

### Test 7 — DB cleanup helper
Adds a payer via required fields, confirms the DB record exists, deletes it via `deletePayerByIdAndNeicId`, and confirms the record count drops to zero.

---

**Total Tests:** 7  
**Setup:** `beforeEach` runs DB cleanup (`deletePayerByIdAndNeicId`) then calls `loginAsAdmin()`.  
**Helpers:** `openAddPayerModal`, `fillRequiredAddPayerFields`, `fillOptionalAddPayerFields`, `addPayerAndReturnToDashboard`, `searchByDashboardName`, `ensureChecked`
