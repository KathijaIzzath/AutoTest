# Test File: `02_LandingDashboard_test.spec.ts`

**Module:** Landing Dashboard / Search Results  
**Location:** `tests/02_LandingDashboard_test.spec.ts`  
**Test Data:** `testData/DashboardTestData.json`  
**Fixture:** `loginAsAdmin` (via `tests/myTestData.ts`)  
**DB Dependencies:** `getClaimCountForQueueI`, `getClaimErrorCountForQueueI`, `fetchOneGroupEnrollmentByStatus`, `getReceivedClaimsLast24h`, `getRejectedClaimsLast24h`, `fetchRecentEraRows`

---

## Test Cases

### Dashboard - Header and Navigation Elements
| # | Test Name | Type |
|---|-----------|------|
| 1 | should display dashboard logo and header elements | Visibility |
| 2 | should display Dashboard sidebar link and navigate back to dashboard | Navigation |

### Dashboard - Claims Summary Section
| # | Test Name | Type |
|---|-----------|------|
| 3 | should display Today's Claims header and summary labels | Visibility |
| 4 | should display correct Secure Connect Received count from database | Functional / DB |
| 5 | should display correct Secure Connect error count from database | Functional / DB |
| 6 | should display Last 10 Days and Claim Health Meter sections | Visibility |

### Dashboard - Support Section
| # | Test Name | Type |
|---|-----------|------|
| 7 | should display Support section with Contact Us details | Visibility |
| 8 | should display Email Support with correct email address | Visibility |
| 9 | should display Documentation link and open it | Functional |

### Dashboard - Quick Queries Links
| # | Test Name | Type |
|---|-----------|------|
| 10 | should display Quick Queries section with all links | Visibility |
| 11 | CLAIMS SENT should navigate to Claims grid with results | Navigation / Functional |
| 12 | ERAs RECEIVED should navigate to ERA grid with correct columns | Navigation / Functional |
| 13 | REJECTED CLAIMS should navigate to Claims grid filtered by Rejected status | Navigation / Functional |
| 14 | OUTSTANDING ENROLLMENTS should show enrollment grid filtered by pending statuses | Navigation / Functional |
| 15 | OUTSTANDING ENROLLMENTS should display a dynamically fetched group enrollment row | Functional / DB |

### Dashboard - Claims Error Drill-down
| # | Test Name | Type |
|---|-----------|------|
| 16 | clicking Claims Error value should navigate to Claims grid with Error status | Navigation / Functional |
| 17 | Claims Error grid should show all required column headers | Visibility |
| 18 | Claims Error grid should contain today's date and FINALIZED_DENIED status | Functional |

### Dashboard - Group Filter
| # | Test Name | Type |
|---|-----------|------|
| 19 | should display Group dropdown filter on dashboard | Visibility |

### Dashboard - User Profile Menu
| # | Test Name | Type |
|---|-----------|------|
| 20 | should display user profile menu options when avatar is clicked | Functional |
| 21 | Profile Info should navigate to profile page with First Name field | Navigation |
| 22 | Change password should navigate to Change User Password screen with all fields | Navigation |
| 23 | Logout should redirect to the login/welcome screen | Functional |

### Dashboard - Notifications / Information Panel
| # | Test Name | Type |
|---|-----------|------|
| 24 | should display Information button on the dashboard | Visibility |
| 25 | should open Notifications panel and display Notifications heading with future release message | Functional |
| 26 | Notifications panel should display Today's Claim Totals with Received Claims and Rejected Claims sections | Visibility |
| 27 | Notifications panel Received Claims count should be a valid non-negative integer | Validation |
| 28 | Notifications panel Received Claims count should match database (last 24 h) | Functional / DB |
| 29 | Notifications panel Rejected Claims count should match database (last 24 h) | Functional / DB |
| 30 | Notifications panel should display Claims Breakdown with Total Claims and percentages | Visibility |
| 31 | Notifications panel Outstanding Enrollments section should display correct column headers | Visibility |
| 32 | Notifications panel Outstanding Enrollments rows should match database query | Functional / DB |
| 33 | Notifications panel Recent ERAs section should display correct column headers | Visibility |
| 34 | Notifications panel Recent ERAs rows should match database records | Functional / DB |
| 35 | Notifications panel Recent ERAs amount values should display in currency format | Validation |
| 36 | Notifications panel Outstanding Enrollments submitted dates should use valid date format | Validation |
| 37 | Notifications Received Claims View link should navigate to Claims grid | Navigation / Functional |
| 38 | Notifications Rejected Claims View link should navigate to Claims grid | Navigation / Functional |
| 39 | Notifications Outstanding Enrollments View link should navigate to Group Enrollment page with correct columns | Navigation / Functional |
| 40 | Notifications Recent ERAs View link should navigate to ERA grid with correct columns | Navigation / Functional |
| 41 | Notifications panel should display a More link at the bottom | Visibility |
| 42 | Notifications panel should display Secure Connect Support section | Visibility |
| 43 | Notifications panel support phone and email links should be visible and accessible | Visibility / Functional |
| 44 | Notifications panel View Documentation link should open a new popup tab | Functional |
| 45 | Notifications panel should toggle closed when Information button is clicked again | Functional / Edge Case |
| 46 | Notifications panel should render without page errors | Edge Case / Negative |
| 47 | Group dropdown on dashboard should default to All when no group is selected | Edge Case |

---

**Total Tests:** 47  
**Setup:** Each test calls `loginAsAdmin()` and `page.reload()` before assertions.

---

## Reusable Helpers

| Helper | Description |
|--------|-------------|
| `extractData(locator)` | Extracts non-empty text from a locator list |
| `openNotificationsPanel(page)` | Clicks the Information button and asserts the panel is visible |

---

## Test Data Keys (`testData/DashboardTestData.json`)

| Section | Key | Description |
|---------|-----|-------------|
| `labels` | `userInitials`, `dashboardTitle`, `dashboardSidebarLink`, `last10Days`, `claimHealthMeter`, `support`, `todaysClaims`, `scReceived`, `scErrors`, `quickQueries`, `claimsSent`, `erasReceived`, `rejectedClaims`, `outstandingEnrollments`, `groupFilterLabel`, `groupDropdownText` | Dashboard UI labels |
| `support` | `contactUsCell`, `phoneLink`, `phoneText`, `emailSupportCell`, `emailLink`, `emailFull`, `documentationCell`, `viewDocumentationLink` | Support section values |
| `notifications` | `infoButtonName`, `notificationsHeading`, `futureReleaseText`, `todayClaimTotalsHeading`, `receivedClaimsLabel`, `rejectedClaimsLabel`, `claimsBreakdownLabel`, `totalClaimsLabel`, `outstandingEnrollmentsLabel`, `recentErasLabel`, `viewLinkName`, `moreLinkName`, `supportLabel`, `panelPhoneLink`, `panelEmailLink`, `viewDocumentationLink`, `last24hLabel` | Notifications / Information panel values |
| `columnHeaders.era` | `group`, `checkDate`, `checkNumber`, `npi`, `taxId`, `payerId`, `payerName`, `payerAmount`, `status`, `receivedDate` | ERA grid column headers |
| `columnHeaders.enrollment` | `groupId`, `groupName` | Full enrollment grid column headers |
| `columnHeaders.enrollmentPanel` | `groupId`, `provider`, `payer`, `type`, `submittedDate`, `status` | Panel enrollment table column headers |
| `columnHeaders.recentEra` | `receivedDate`, `payer`, `checkId`, `amount`, `status` | Panel Recent ERAs table column headers |

---

## DB Utility Functions (`testData/database.utils.ts`)

| Function | Query | Purpose |
|----------|-------|---------|
| `getClaimCountForQueueI()` | Claims joined with Files where queue='I' | Secure Connect Received count |
| `getClaimErrorCountForQueueI()` | Claims with error remitreason categories | Secure Connect Error count |
| `fetchOneGroupEnrollmentByStatus()` | groupenrollment with status C/D/M | Outstanding enrollment row |
| `getReceivedClaimsLast24h()` | Claims with Files where queue='I' and datesetup in last 24h | Notification panel Received Claims count |
| `getRejectedClaimsLast24h()` | Claims with rejected remitreason in last 24h | Notification panel Rejected Claims count |
| `fetchRecentEraRows()` | Most recent ERA rows joined with insurancecompany | Notification panel Recent ERAs data |

