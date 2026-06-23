# Test File: `02_LandingDashboard_test.spec.ts`

**Module:** Dashboard  
**Location:** `tests/02_LandingDashboard_test.spec.ts`  
**Test Data:** `testData/DashboardTestData.json`  
**Fixture:** `loginAsAdmin` (via `tests/myTestData.ts`)  
**DB Dependencies:** `getClaimCountForQueueI`, `getClaimErrorCountForQueueI`, `fetchOneGroupEnrollmentByStatus`

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

---

**Total Tests:** 23  
**Setup:** Each test calls `loginAsAdmin()` and `page.reload()` before assertions.
