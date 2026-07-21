# README – 01_Analytics_Dshbd_test.spec.ts

**File:** `tests/Analytics_Report/01_Analytics_Dshbd_test.spec.ts`  
**Module:** Analytics Menu & Dashboard  
**Test data:** `testData/AnalyticsDshbdTestData.json`  
**DB utility:** `testData/database.utils.ts` → `fetchAnalyticsClaimSummary()`  
**Navigation helper:** `tests/framework/navigation.helper.ts` → `navigateToAnalytics()`

---

## User Story

> As a user, when I navigate the web UI, I want to see an **"Analytics"** menu item so that I can access reporting functionality.

### Acceptance criteria covered

| # | Criterion |
|---|-----------|
| AC-1 | `Analytics` menu item is labelled correctly and visible in the nav |
| AC-2 | `Analytics` is positioned **between Accounts and Claims** |
| AC-3 | Menu item uses icon class `fas fa-chart-line` (&#xf201;) |

---

## Test Cases

### 1 · Navigation menu

| ID    | Test name | What is validated |
|-------|-----------|-------------------|
| TC01  | Analytics menu item is visible after login | Nav link and list text `Analytics` visible |
| TC02  | Analytics menu item uses the fa-chart-line icon | `.fas.fa-chart-line` element inside the nav link |
| TC03  | Analytics is positioned between Accounts and Claims | Href order: `/accounts` < `/analytics` < `/claims` |
| TC04  | Clicking Analytics navigates to the analytics URL | `page.url()` matches `/analytics/i` |

### 2 · Dashboard layout and controls

| ID    | Test name | What is validated |
|-------|-----------|-------------------|
| TC05  | Page heading and all five report section labels visible | `Analytics` heading + Claim / Enrollment / ERA / Admin / Other sections |
| TC06  | All report dropdowns present and default to "Select Report" | ≥5 comboboxes; nth(1) empty |
| TC07  | Claim Reports dropdown has all expected options | Group Claim Summary, Group Payer Rejection Report, Group SC Rejection Report |
| TC08  | Date picker inputs visible and pre-filled with valid dates | MM/DD/YYYY pattern; start ≤ end |
| TC09  | Apply Filter, Recent Claim Summary, Recent ERA Summary buttons visible | All three buttons present |
| TC10  | Full ARIA layout snapshot matches expected structure | Generalized aria snapshot with regex patterns for counts and percentages |

### 3 · Stat cards

| ID    | Test name | What is validated |
|-------|-----------|-------------------|
| TC11  | All six stat card labels and icons visible | Total Claims, Paid (✓), Accepted (👍), Rejected (✗), SC Rejected (🚫), Errors |
| TC12  | Stat card counts are non-negative integers | All six parsed counts ≥ 0 |
| TC13  | Paid and Accepted cards display a numeric count (generalized) | `^\d+Paid$` / `^\d+Accepted$` container visible — no hardcoded numbers |
| TC14  | Total Claims ≥ sum of categorized claims | Logical consistency check |
| TC15  | Paid and Accepted values match their breakdown table cells | Cell with the same number is visible in the table |

### 4 · Claims Breakdown table

| ID    | Test name | What is validated |
|-------|-----------|-------------------|
| TC16  | Heading and column headers visible | `Claims Breakdown` h3, `Status`, `Count`, `% of Total` |
| TC17  | All five status rows present | Paid, Accepted, Rejected, SC Rejected, Errors row cells |
| TC18  | Zero-count rows show `0.0%` | SC Rejected and Errors percentage when count is 0 |
| TC19  | Paid row percentage is mathematically consistent | `(paid / total × 100).toFixed(1)%` matches cell text |
| TC20  | Pie/donut chart element is rendered | `<path>` element with `Rejected:` text |

### 5 · Apply Filter and date range

| ID    | Test name | What is validated |
|-------|-----------|-------------------|
| TC21  | Apply Filter with default date range displays stats | Total Claims card visible; count ≥ 0 |
| TC22  | Recent Claim Summary sets a valid date range | Dates still valid MM/DD/YYYY after click; start ≤ end |
| TC23  | Recent ERA Summary is clickable without crashing | Analytics root visible after click |
| TC24  | Custom date range (today → today) updates stats | Stats update; no crash |
| TC25  | Same start and end date accepted as valid range | Filter applies; page remains functional |

### 6 · Report dropdown selection

| ID    | Test name | What is validated |
|-------|-----------|-------------------|
| TC26  | Selecting a Claim Report option produces no console errors | Zero significant errors after `selectOption` |
| TC27  | Changing Claim Reports does not affect other dropdowns | Dropdowns at indices 2–5 remain empty/`Select Report` |

### 7 · Edge cases

| ID    | Test name | What is validated |
|-------|-----------|-------------------|
| TC28  | Far-future date range handled gracefully | No crash; analytics root stays visible; total ≥ 0 (expected 0) |

### 8 · DB cross-validation

| ID    | Test name | What is validated |
|-------|-----------|-------------------|
| TC29  | Total Claims UI vs DB | `|UI total − DB total| ≤ max(5% of DB, 5)` |
| TC30  | Paid count UI vs DB | `|UI paid − DB FINALIZED_PAID| ≤ max(5%, 5)` |
| TC31  | Accepted count UI vs DB | `|UI accepted − DB ACCEPTED| ≤ max(5%, 5)` |

> DB tests auto-skip with a descriptive message if the database is unreachable.

### 9 · Error monitoring

| ID    | Test name | What is validated |
|-------|-----------|-------------------|
| TC32  | No unexpected console errors on page load | `console.error` list is empty (excluding favicon/404) |
| TC33  | No unexpected console errors after Apply Filter | Same after filter interaction |

---

## Reusable helpers (defined in the spec)

| Helper | Purpose |
|--------|---------|
| `openAnalyticsDashboard(page)` | Navigate to Analytics and wait for heading |
| `applyFilter(page)` | Click Apply Filter and wait for UI to settle |
| `getFilterDates(page)` | Read current start/end dates from date-picker inputs |
| `setDateRange(page, start, end)` | Fill both date-picker inputs |
| `readStatCardCounts(page)` | Parse all six stat counts from page text content |
| `todayMMDDYYYY()` | Returns today as `MM/DD/YYYY` |

## Shared navigation helper

`navigateToAnalytics(page)` is exported from `tests/framework/navigation.helper.ts` and can be imported by other Analytics test files (02–05).

## DB utility added

`fetchAnalyticsClaimSummary(startMMDDYYYY, endMMDDYYYY)` in `testData/database.utils.ts` — queries claim totals by apicategory within the supplied date range. Called by TC29–31.

## Test data file

All labels, selectors, dropdown options, timeouts, and edge-case values are stored in `testData/AnalyticsDshbdTestData.json`. No hardcoded strings appear in the spec.
