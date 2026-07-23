# README – 03_ScRej_Summary_Test_spec.ts

**File:** `tests/Analytics_Report/03_ScRej_Summary_Test_spec.ts`  
**Module:** Analytics → SC Rejection Summary Report (Group SC Rejection Report)  
**Test data:** `testData/ScRejTestData.json`  
**DB utility:** `testData/database.utils.ts` → `fetchScRejectionTotals()`  
**Navigation helper:** `tests/framework/navigation.helper.ts` → `navigateToAnalytics()`

---

## User Story

> The SC Rejection Report has a 90-day calendar window. The start date defaults to 90 days before today. The report shows SecureConnect-rejected claims over the date range, grouped by Practice Name, Account, Payer ID, Payer Name, and SC Rejection Reason. The SC rejection reason is always **"Electronic Claim rejected by third party clearing house."**

### Report columns

| Column | Description |
|---|---|
| Practice Name | Provider group name |
| Account | Account number |
| Group ID | Provider group G-number |
| Payer ID | Payer identifier |
| Payer Name | Insurance company name |
| Rejection Reason | "Electronic Claim rejected by third party clearing house." |
| Claims | Count of SC-rejected claims for this payer |

---

## DB Prerequisite Setup

| Operation | Details |
|---|---|
| Set specific claim statuses to A3 | `setupPayerRejectionData(['G234962207071312193U', 'G234962207071241121F'], 'A3')` |
| Push all timestamps to today | Handled by `setupPayerRejectionData` via `global-setup.ts` |
| Verify | `verifyClaimSetup()` — checks status, reportid, and today's hintimestamp |

TC01 runs these updates and verifies the result. Skips gracefully if DB is unreachable.

---

## Test Cases

### 0 · DB prerequisite setup

| ID | Test | Validation |
|---|---|---|
| TC01 | Update claim statuses and timestamps to today | Claims have status A3, reportid G23496, hintimestamp = today |

### 1 · Navigation and report selection

| ID | Test | Validation |
|---|---|---|
| TC02 | Selecting "Group SC Rejection Report" shows all report controls | Group search, date pickers, Generate Report button visible |
| TC03 | Dropdown shows Group SC Rejection Report as selected | `combobox.nth(1)` = `sc-rejection` |

### 2 · Report filter controls

| ID | Test | Validation |
|---|---|---|
| TC04 | Group, date pickers, Generate Report all visible | All filter controls present |
| TC05 | Date pickers pre-filled with valid dates; start ≤ end | MM/DD/YYYY pattern |
| TC06 | Start date defaults to ~90 days ago | Diff = 90 ± 3 days |
| TC07 | End date defaults to today or very recent | Within 3 days of today |
| TC08 | Default date range ≤ 90 days | (end − start) ≤ 90 |

### 3 · Group search

| ID | Test | Validation |
|---|---|---|
| TC09 | Lowercase group ID returns a suggestion (case-insensitive) | `g23496` → `G23496 – CUMMERATA INC AND` |
| TC10 | Selecting group displays the group tag | Tag visible after click |
| TC11 | Group tag shows correct ID and name | Contains `G23496` and `CUMMERATA INC AND SONS` |
| TC12 | Non-existent group ID shows no suggestion | `G99999` not visible |
| TC13 | Random invalid text shows no suggestion | `ZZZINVALID` not visible |

### 4 · Report table structure

| ID | Test | Validation |
|---|---|---|
| TC14 | Generate Report renders the table | `<table>` visible |
| TC15 | All 7 column headers visible | Practice Name, Account, Group ID, Payer ID, Payer Name, Rejection Reason, Claims |
| TC16 | Group ID column matches searched group | Cell with `G23496` visible |
| TC17 | Practice Name column contains group name | `CUMMERATA INC AND SONS` cell |
| TC18 | Account column contains account number | `FFC001` cell |
| TC19 | Rejection Reason column contains SC rejection text | "Electronic Claim rejected by third party clearing house." |
| TC20 | Claims column contains non-negative integers | `td:nth-child(7)` cells ≥ 0 |
| TC21 | Totals row present with bold formatting | `Totals` label with `<strong>` |
| TC22 | Totals Claims count is non-negative | `getTotalsClaimsCount()` ≥ 0 |

### 5 · ARIA snapshot

| ID | Test | Validation |
|---|---|---|
| TC23 | app-analytics table snapshot with generalized counts | All 7 headers + SC rejection text in tbody + Totals row with bold |

### 6 · Export to Excel

| ID | Test | Validation |
|---|---|---|
| TC24 | Export to Excel button visible after generation | `[title="Export to Excel"]` visible |
| TC25 | Export to Excel triggers file download | Download event fires; filename matches `\.(xlsx?\|csv\|xls)$` |

### 7 · Custom date range

| ID | Test | Validation |
|---|---|---|
| TC26 | Custom 30-day range generates valid report | Table visible after custom range |
| TC27 | Same start and end date accepted | Layout visible; no crash |

### 8 · Edge cases

| ID | Test | Validation |
|---|---|---|
| TC28 | Generate Report disabled when no group selected | Button disabled OR table has 0 rows |
| TC29 | Future end date handled gracefully | Layout visible; no exception |

### 9 · DB cross-validation

| ID | Test | Validation |
|---|---|---|
| TC30 | Totals Claims count (UI) vs `fetchScRejectionTotals().totalRejected` | `|UI − DB| ≤ max(5%, 5)` — skips if discrepancy > 100× UI |

> DB tests skip gracefully when the database is unreachable or the apicategory mapping differs.

### 10 · Error monitoring

| ID | Test | Validation |
|---|---|---|
| TC31 | No console errors during report generation | `console.error` list empty (excl. favicon/404) |
| TC32 | No console errors during Excel export | Same after export click |

---

## Reusable helpers (defined in the spec)

| Helper | Purpose |
|---|---|
| `openScRejectionReport(page)` | Navigate to Analytics and select Group SC Rejection Report |
| `searchAndSelectGroup(page, query)` | Type query in group search and click first suggestion |
| `getFilterDates(page)` | Read current start/end date values from inputs |
| `setDateRange(page, s, e)` | Fill both date-picker inputs |
| `generateReport(page)` | Click Generate Report and wait |
| `getTotalsClaimsCount(page)` | Read Claims value from the Totals row (index 1) |
| `todayMMDDYYYY()` | Today as `MM/DD/YYYY` |
| `daysAgoMMDDYYYY(n)` | n days ago as `MM/DD/YYYY` (negative = future) |

## DB utility added

`fetchScRejectionTotals(groupId, startMMDDYYYY, endMMDDYYYY)` — queries DB for SC-rejected (apicategory = `SC_REJECTED`) claim count within the date range, used by TC30.

## Test data file

All group IDs, names, accounts, column headers, rejection reason text, selectors, timeouts, and edge-case values are in `testData/ScRejTestData.json`. No hardcoded strings in the spec. All numeric assertions use dynamic values read from the UI.
