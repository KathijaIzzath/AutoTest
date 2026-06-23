# Test File: `01_Mainlogin_test.spec.ts`

**Module:** Login  
**Location:** `tests/01_Mainlogin_test.spec.ts`  
**Test Data:** `testData/LoginTestData.json`, `testData/UserInfo.json`  
**Fixture:** `loginAsAdmin` (via `tests/myTestData.ts`)

---

## Test Cases

### Login - Page Title
| # | Test Name | Type |
|---|-----------|------|
| 1 | should have the correct browser tab title | Visibility |

### Login - Field Visibility
| # | Test Name | Type |
|---|-----------|------|
| 2 | should display Welcome and Login headings | Visibility |
| 3 | should display the application logo | Visibility |
| 4 | should display the Username label and input field | Visibility |
| 5 | should display the Password label and input field | Visibility |
| 6 | should display the Forgot password link | Visibility |
| 7 | should display the Log In button | Visibility |
| 8 | should display all login form elements together | Visibility |
| 9 | Username and Password fields should be empty on page load | Visibility |

### Login - Successful Authentication
| # | Test Name | Type |
|---|-----------|------|
| 10 | should log in with valid admin credentials and land on dashboard | Functional |
| 11 | should redirect to dashboard URL after successful login | Functional |
| 12 | should display dashboard heading after login | Functional |

### Login - Invalid Credentials and Edge Cases
| # | Test Name | Type |
|---|-----------|------|
| 13 | should show error or stay on login page with invalid username and password | Edge Case |
| 14 | should stay on login page when submitting with empty username and password | Edge Case |
| 15 | should stay on login page with valid username but wrong password | Edge Case |
| 16 | should stay on login page with wrong username but valid password | Edge Case |
| 17 | should stay on login page when only username is provided | Edge Case |
| 18 | should stay on login page when only password is provided | Edge Case |
| 19 | should not accept SQL injection as valid credentials | Security / Edge Case |
| 20 | should not accept whitespace-only username | Edge Case |
| 21 | should not accept an excessively long username | Edge Case |

### Login - Field Interaction
| # | Test Name | Type |
|---|-----------|------|
| 22 | should accept typed text in the Username field | Interaction |
| 23 | should accept typed text in the Password field | Interaction |
| 24 | should clear Username field when content is deleted | Interaction |
| 25 | Username field should be focusable | Interaction |
| 26 | Password field should be focusable | Interaction |

---

**Total Tests:** 26  
**Setup:** `beforeAll` runs DB setup queries; `beforeEach` navigates to the login page.
