# README – 04_PayerRejected_test.spec.ts

**File:** `tests/Analytics_Report/04_PayerRejected_test.spec.ts`  
**Module:** Analytics → Payer Rejection Report (Group Payer Rejection Report)  
**Test data:** `testData/PayerRejTestData.json`  
**DB utilities:** `testData/database.utils.ts`  
**Navigation helper:** `tests/framework/navigation.helper.ts` → `navigateToAnalytics()`

---

## User Story

> The Payer Rejection Report has a 90-day calendar window. The start date defaults to 90 days before today and can only be edited within that window. The report shows claims payer-rejected over the date range, grouped by Practice Name, Account, Payer ID, Payer Name, and Rejection Category.

### Report columns

| Column | Description |
|---|---|
| Practice Name | Provider group name |
| Account | Account number |
| Group ID | Provider group G-number |
| Payer ID | Payer identifier |
| Payer Name | Insurance company name |
| Rejection Reason | Human-readable rejection category/description |
| Claims | Count of payer-rejected claims for this reason |

---

## DB Prerequisite Setup

Before running the full test suite, the following DB updates are required so that test claims appear in the 90-day window:

| Operation | SQL |
|---|---|
| Set claim statuses | `UPDATE claims SET claimstatus = 'A3' WHERE claimid IN (...)` |
| Push claim timestamps | `UPDATE claims SET hintimestamp = NOW()` |
| Push ERA dates | `UPDATE eramain SET dateadded = NOW()` |
| Push remittance dates | `UPDATE remittance SET creationdate = NOW()` |

TC01 runs these updates and verifies the result automatically. The test skips gracefully if the DB is unreachable.

---

## Test Cases

### 0 · DB prerequisite setup

| ID    | Test name | What is validated |
|-------|-----------|-------------------|
| TC01  | DB: update claim statuses and timestamps to today | `setupPayerRejectionData()` runs; claims have status A3, reportid G23496, hintimestamp = today |

### 1 · Navigation and report selection

| ID    | Test name | What is validated |
|-------|-----------|-------------------|
| TC02  | Selecting "Group Payer Rejection Report" shows all report controls | Group search, date pickers, Generate Report button visible |
| TC03  | Dropdown shows Group Payer Rejection Report as selected option | `combobox.nth(1)` has value `payer-rejection` |

### 2 · Report filter controls

| ID    | Test name | What is validated |
|-------|-----------|-------------------|
| TC04  | Group, date pickers, and Generate Report button all visible | All filter controls present |
| TC05  | Date pickers pre-filled with valid dates; start ≤ end | MM/DD/YYYY pattern; `start.getTime() <= end.getTime()` |
| TC06  | Start date defaults to ~90 days ago | Diff = 90 ± 3 days |
| TC07  | End date defaults to today or very recent | Within 3 days of today |
| TC08  | Default date range spans ≤ 90 days | `(end − start) ≤ 90` |

### 3 · Group search

| ID    | Test name | What is validated |
|-------|-----------|-------------------|
| TC09  | Lowercase group ID returns a suggestion (case-insensitive) | `g23496` input produces `G23496 – CUMMERATA INC AND` suggestion |
| TC10  | Selecting a group displays the group tag | Tag visible after click |
| TC11  | Group tag shows correct ID and name | Layout contains `G23496` and `CUMMERATA INC AND SONS` |
| TC12  | Non-existent group ID shows no suggestion | `G99999` suggestion not visible |
| TC13  | Random invalid text shows no suggestion | `ZZZINVALID` suggestion not visible |

### 4 · Report table structure

| ID    | Test name | What is validated |
|-------|-----------|-------------------|
| TC14  | Generate Report renders the data table | `<table>` visible |
| TC15  | All 7 column headers visible | Practice Name, Account, Group ID, Payer ID, Payer Name, Rejection Reason, Claims |
| TC16  | Group ID column matches searched group | Cell with `G23496` visible |
| TC17  | Practice Name column contains group name | `CUMMERATA INC AND SONS` cell visible |
| TC18  | Account column contains account number | `FFC001` cell visible |
| TC19  | Rejection Reason column has non-empty text | `td:nth-child(6)` text length > 0 |
| TC20  | Claims column contains non-negative integers | First 20 `td:nth-child(7)` cells ≥ 0 |
| TC21  | Totals row present with bold formatting | Row with `Totals` and `<strong>` element |
| TC22  | Totals row Claims count is non-negative | `getTotalsClaimsCount()` ≥ 0 |

### 5 · ARIA snapshots

| ID    | Test name | What is validated |
|-------|-----------|-------------------|
| TC23  | `app-analytics` ARIA snapshot matches table structure | Generalized patterns — `\d+` for all counts, `.+` for rejection reason text |
| TC24  | `app-dashboard-layout-component` ARIA snapshot matches full layout | Full layout with dropdown state, group tag, date pickers, table, generalized Totals |

### 6 · Export to Excel

| ID    | Test name | What is validated |
|-------|-----------|-------------------|
| TC25  | Export to Excel button visible after generation | `[title="Export to Excel"]` visible |
| TC26  | Export to Excel triggers a file download | Download event fires; filename matches `\.(xlsx?\|csv\|xls)$` |

### 7 · Custom date range

| ID    | Test name | What is validated |
|-------|-----------|-------------------|
| TC27  | Custom 30-day range generates a valid report | Table visible after custom range |
| TC28  | Same start and end date accepted without errors | Layout visible; no crash |

### 8 · Edge cases

| ID    | Test name | What is validated |
|-------|-----------|-------------------|
| TC29  | Generate Report without selecting a group does not crash | Layout still visible |
| TC30  | Future end date handled gracefully | Layout visible; no exception |

### 9 · DB cross-validation

| ID    | Test name | What is validated |
|-------|-----------|-------------------|
| TC31  | Totals Claims count (UI) vs `fetchPayerRejectionTotals().totalRejected` (DB) | `|UI − DB| ≤ max(5%, 5)` |

> DB tests auto-skip with a descriptive message if the database is unreachable.

### 10 · Error monitoring

| ID    | Test name | What is validated |
|-------|-----------|-------------------|
| TC32  | No console errors during report generation | `console.error` list empty (excl. favicon/404) |
| TC33  | No console errors during Excel export | Same assertion after export |

---

## Reusable helpers (defined in the spec)

| Helper | Purpose |
|--------|---------|
| `openPayerRejectionReport(page)` | Navigate to Analytics and select Group Payer Rejection Report |
| `searchAndSelectGroup(page, query)` | Type query in group search and click first suggestion |
| `getFilterDates(page)` | Read start/end date values from inputs |
| `setDateRange(page, s, e)` | Fill both date-picker inputs |
| `generateReport(page)` | Click Generate Report and wait |
| `getTotalsClaimsCount(page)` | Read the Claims value from the Totals row |
| `todayMMDDYYYY()` | Today as `MM/DD/YYYY` |
| `daysAgoMMDDYYYY(n)` | n days ago as `MM/DD/YYYY` (negative = future) |

## DB utilities added

| Function | Purpose |
|---|---|
| `setupPayerRejectionData(claimIds, status)` | Runs prerequisite updates (timestamps → NOW, claim status → A3) |
| `verifyClaimSetup(claimIds, status, groupId)` | Verifies claims have expected status, reportid, and today's timestamp |
| `fetchPayerRejectionTotals(groupId, start, end)` | Queries DB payer-rejected count for cross-validation |

## Test data file

All group IDs, claim IDs, column headers, selectors, timeouts, and edge-case values are in `testData/PayerRejTestData.json`. No hardcoded strings appear in the spec. All count assertions use dynamic values read from the UI.
