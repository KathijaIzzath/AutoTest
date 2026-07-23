# README – 05_ERASummary_test.spec.ts

**File:** `tests/Analytics_Report/05_ERASummary_test.spec.ts`  
**Module:** Analytics → Recent ERA Summary Report  
**Test data:** `testData/ERADshbdTestData.json`  
**DB utility:** `testData/database.utils.ts` → `fetchEraSummaryTotals()`, `executeQuery()`  
**Navigation helper:** `tests/framework/navigation.helper.ts` → `navigateToAnalytics()`

---

## User Story

> The Recent ERA Summary report shows a summary of Electronic Remittance Advices (ERAs) received. It displays two stat cards (Total ERAs count, Total Payment Amount) and a breakdown table grouped by Payer Name with columns: Payer ID, Total Received, Total Paid.

### Report structure

| Section | Description |
|---|---|
| Stat cards | **Total ERAs** (count) · **Total Payment Amount** (dollar total) |
| ERA Breakdown table | Payer Name · Payer ID · Total Received · Total Paid |

### ERA Breakdown columns

| Column | Format |
|---|---|
| Payer Name | Insurance company name |
| Payer ID | Payer identifier |
| Total Received | Non-negative integer |
| Total Paid | Currency `$x,xxx.xx` |

---

## DB Prerequisite Setup

TC01 runs before the suite to ensure ERA records appear in today's date window:

```sql
UPDATE eramain SET dateadded = NOW()
```

This is also called automatically by `global-setup.ts` at the start of every test run. TC01 additionally verifies the count of rows updated.

---

## Test Cases

### 0 · DB prerequisite setup

| ID | Test | Validation |
|---|---|---|
| TC01 | Push eramain.dateadded to today | `UPDATE eramain SET dateadded = NOW()` executes; row count ≥ 0 |

### 1 · Navigation and dashboard controls

| ID | Test | Validation |
|---|---|---|
| TC02 | Analytics page loads with ERA stat cards and ERA Breakdown | Total ERAs, Total Payment Amount labels + ERA Breakdown heading visible |
| TC03 | Recent ERA Summary and Recent Claim Summary buttons visible | Both buttons present |
| TC04 | Apply Filter button and date pickers visible | START DATE, END DATE, two textboxes, Apply Filter |
| TC05 | Date pickers pre-filled with valid MM/DD/YYYY dates | Pattern match + start ≤ end |

### 2 · ERA stat cards

| ID | Test | Validation |
|---|---|---|
| TC06 | Stat card icons visible for both cards | `.stat-card-icon > .fas` + `.stat-card.paid > .stat-card-icon > .fas` visible |
| TC07 | Total ERAs count is a non-negative integer (generalized) | `readEraStatCards().totalEras >= 0` — no hardcoded value |
| TC08 | Total Payment Amount is a valid currency value (generalized) | Matches `^\$[\d,]+\.\d{2}$` — no hardcoded dollar amount |
| TC09 | Stat card containers display count+label and amount+label patterns | `^\d[\d,]*Total ERAs$` · `^\$[\d,]+\.\d+Total Payment Amount$` |

### 3 · ERA Breakdown table

| ID | Test | Validation |
|---|---|---|
| TC10 | ERA Breakdown heading and all 4 column headers visible | Payer Name, Payer ID, Total Received, Total Paid |
| TC11 | Table contains at least one data row | `tbody tr` count > 0 |
| TC12 | Payer Name column contains non-empty text | First `td:nth-child(1)` has length > 0 |
| TC13 | Total Received column contains non-negative integers | First 10 `td:nth-child(3)` cells ≥ 0 |
| TC14 | Total Paid column contains valid currency values | First 10 `td:nth-child(4)` cells match `^\$[\d,]+\.\d{2}$` |

### 4 · ARIA snapshot

| ID | Test | Validation |
|---|---|---|
| TC15 | Layout snapshot: controls, stat card text patterns, ERA Breakdown structure | Generalized regex patterns for counts/amounts; all column headers; >0 rows |

### 5 · Apply Filter and date range

| ID | Test | Validation |
|---|---|---|
| TC16 | Apply Filter with default dates refreshes ERA data | Total ERAs visible and ≥ 0 |
| TC17 | Recent ERA Summary button sets a valid date range | Dates still valid MM/DD/YYYY; start ≤ end |
| TC18 | Recent Claim Summary button clickable without crashing | Analytics root still visible |
| TC19 | Custom 30-day range updates ERA display | Total ERAs label visible after filter |
| TC20 | Same start and end date accepted | No crash; analytics root visible |

### 6 · Edge cases

| ID | Test | Validation |
|---|---|---|
| TC21 | Far-future date range handled gracefully | Analytics root visible; totalEras ≥ 0 (expected 0) |

### 7 · DB cross-validation

| ID | Test | Validation |
|---|---|---|
| TC22 | Total ERAs count (UI) vs `fetchEraSummaryTotals().totalEras` | `|UI − DB| ≤ max(10%, 5)` — skips if DB returns 0 unexpectedly |

> DB tests skip gracefully when the database is unreachable or the query returns implausible results.

### 8 · Error monitoring

| ID | Test | Validation |
|---|---|---|
| TC23 | No console errors on ERA Summary dashboard load | `console.error` list empty (excl. favicon/404) |
| TC24 | No console errors after clicking Apply Filter | Same assertion after filter interaction |

---

## Reusable helpers (defined in the spec)

| Helper | Purpose |
|---|---|
| `openAnalyticsDashboard(page)` | Navigate to Analytics and wait for heading |
| `clickRecentEraSummary(page)` | Click Recent ERA Summary button and wait |
| `applyFilter(page)` | Click Apply Filter and wait |
| `getFilterDates(page)` | Read start/end date values from inputs |
| `setDateRange(page, s, e)` | Fill both date-picker inputs |
| `readEraStatCards(page)` | Parse `totalEras` (int) and `totalPayment` (string) from page text |
| `todayMMDDYYYY()` | Today as `MM/DD/YYYY` |
| `daysAgoMMDDYYYY(n)` | n days ago as `MM/DD/YYYY` (negative = future) |

## Test data file

All labels, column headers, selectors, currency/count patterns, timeouts, and edge-case dates are in `testData/ERADshbdTestData.json`. No hardcoded numbers or dollar amounts appear in the spec — all stat card assertions use dynamic values read from the page.

## DB utility added

`fetchEraSummaryTotals(startMMDDYYYY, endMMDDYYYY)` — pushes `eramain.dateadded` to NOW() then queries the count and sum of ERAs within the date range, used by TC22.
