# README – 02_ClaimsSummary_test.spec.ts

**File:** `tests/Analytics_Report/02_ClaimsSummary_test.spec.ts`  
**Module:** Analytics → Claims Summary Report (Group Claim Summary)  
**Test data:** `testData/ClaimsSummaryTestData.json`  
**DB utility:** `testData/database.utils.ts` → `fetchClaimSummaryTotals()`  
**Navigation helper:** `tests/framework/navigation.helper.ts` → `navigateToAnalytics()`

---

## User Story

> The Claim Summary Report has a 90-day calendar window. The start date defaults to 90 days before today and can only be edited within that window. The report shows total claims sent over the date range, including passed, SC rejected, and payer rejected counts — grouped by Practice Name, Account, Payer Name, Payer ID, and Payer Insurance Plan.

### Report columns

| Column | Description |
|---|---|
| Practice Name | Provider group name |
| Account | Account number |
| Group ID | Provider group G-number |
| Payer ID | Payer identifier |
| Insurance Plan | Insurance company name |
| Claims Sent | Total claims submitted |
| SC Rejected | Claims rejected by SecureConnect |
| No Response | Claims with no payer response |
| Payer Rejected | Claims rejected by the payer |
| Passed | Claims accepted/paid |

---

## Test Cases

### 1 · Navigation and report selection

| ID    | Test name | What is validated |
|-------|-----------|-------------------|
| TC01  | Claim Reports section with chart-bar icon visible on Analytics | `Claim Reports` label and `.fas.fa-chart-bar.report-tile-icon` visible |
| TC02  | Selecting "Group Claim Summary" shows report controls | Group search, date pickers, Generate Report button visible |
| TC03  | Claim Reports dropdown shows "Group Claim Summary" as selected | `combobox.nth(1)` has value `claim-summary` |

### 2 · Report filter controls

| ID    | Test name | What is validated |
|-------|-----------|-------------------|
| TC04  | Group label and search textbox visible | `Group` label and `Search group...` input present |
| TC05  | Date pickers visible and pre-filled with valid dates | MM/DD/YYYY pattern; start ≤ end |
| TC06  | Generate Report button visible | Button present after report selection |
| TC07  | Start date defaults to ~90 days ago | Difference = 90 ± 3 days |
| TC08  | End date defaults to today or very recent date | Within 3 days of today |
| TC09  | Default date range spans ≤ 90 days | (end − start) ≤ 90 |

### 3 · Group search

| ID    | Test name | What is validated |
|-------|-----------|-------------------|
| TC10  | Typing a valid group ID shows a matching suggestion | Suggestion appears for `G23496` |
| TC11  | Selecting a group displays the group tag | Tag div with `G23496 – CUMMERATA INC AND SONS` visible |
| TC12  | Selected tag shows correct ID and name | Layout contains both ID and name text |
| TC13  | Non-existent group ID shows no suggestion | `G99999` suggestion not visible |
| TC14  | Random invalid text shows no suggestion | `ZZZINVALID` suggestion not visible |

### 4 · Report table structure

| ID    | Test name | What is validated |
|-------|-----------|-------------------|
| TC15  | Generate Report renders the table | `<table>` and `datepicker.nth(1)` visible |
| TC16  | All 10 column headers visible | Every header in `columnHeaders` array present |
| TC17  | Data rows belong to the searched group | Cell with `G23496` visible |
| TC18  | Practice Name column contains the group name | `CUMMERATA INC AND SONS` cell visible |
| TC19  | Account column contains the account number | `FFC001` cell visible |
| TC20  | Numeric data cells contain non-negative integers | First 30 numeric `<td>` cells pass `parseInt >= 0` |
| TC21  | Totals row present with bold formatting | Row with `Totals` text and `<strong>` element |
| TC22  | Totals row numeric values are non-negative | Columns 5–9 in Totals row all ≥ 0 |
| TC23  | Claims Sent ≥ SC Rejected + No Response + Payer Rejected + Passed | Logical column math validation |

### 5 · Layout snapshot

| ID    | Test name | What is validated |
|-------|-----------|-------------------|
| TC24  | Full ARIA snapshot matches expected structure | Generalized aria snapshot with `\d+` patterns for all counts (no hardcoded numbers) |

### 6 · Export to Excel

| ID    | Test name | What is validated |
|-------|-----------|-------------------|
| TC25  | Export to Excel button visible after generation | `[title="Export to Excel"]` visible |
| TC26  | Export to Excel triggers a file download | Download event fires; filename matches `\.(xlsx?\|csv\|xls)$` |

### 7 · Custom date range

| ID    | Test name | What is validated |
|-------|-----------|-------------------|
| TC27  | Custom 30-day range returns data | Table visible after custom range + Generate Report |
| TC28  | Same start and end date accepted | No crash; layout remains visible |

### 8 · Edge cases

| ID    | Test name | What is validated |
|-------|-----------|-------------------|
| TC29  | Generate Report without selecting a group does not crash | Layout still visible after click |
| TC30  | Future end date handled gracefully | Layout still visible; no exception |

### 9 · DB cross-validation

| ID    | Test name | What is validated |
|-------|-----------|-------------------|
| TC31  | Claims Sent total (UI) vs `fetchClaimSummaryTotals().claimsSent` | Difference ≤ max(5%, 5) |
| TC32  | SC Rejected total (UI) vs `fetchClaimSummaryTotals().scRejected` | Difference ≤ max(5%, 5) |
| TC33  | Payer Rejected total (UI) vs `fetchClaimSummaryTotals().payerRejected` | Difference ≤ max(5%, 5) |

> DB tests auto-skip with a descriptive message if the database is unreachable.

### 10 · Error monitoring

| ID    | Test name | What is validated |
|-------|-----------|-------------------|
| TC34  | No console errors during report generation | `console.error` list empty (excl. favicon/404) |
| TC35  | No console errors during Excel export | Same assertion after export click |

---

## Reusable helpers (defined in the spec)

| Helper | Purpose |
|--------|---------|
| `openClaimsSummaryReport(page)` | Navigate to Analytics and select Group Claim Summary |
| `searchAndSelectGroup(page, id)` | Type group ID and click the first suggestion |
| `getFilterDates(page)` | Read current start/end date values from inputs |
| `setDateRange(page, s, e)` | Fill both date-picker inputs |
| `generateReport(page)` | Click Generate Report and wait |
| `getTotalsCell(page, col)` | Read a numeric value from the Totals row by column index |
| `todayMMDDYYYY()` | Today as `MM/DD/YYYY` |
| `daysAgoMMDDYYYY(n)` | n days ago as `MM/DD/YYYY` (negative n = future) |

## Test data file

All group IDs, names, accounts, column header lists, selectors, timeouts, and edge-case values are stored in `testData/ClaimsSummaryTestData.json`. No hardcoded strings appear in the spec — all numeric assertions use dynamic values read from the UI.

## DB utility added

`fetchClaimSummaryTotals(groupId, startMMDDYYYY, endMMDDYYYY)` in `testData/database.utils.ts` — queries aggregate claim counts (claims_sent, sc_rejected, payer_rejected, no_response, passed) for a single provider group within the supplied date range.
