import { test, expect } from './myTestData';
import * as userData from '../testData/UserInfo.json';
import LoginPage from '../testData/LoginPage';
import * as td from '../testData/LoginTestData.json';

// DB prerequisites are now run in global-setup.ts before the full suite starts.
// No per-worker beforeAll needed here.

test.use({ timezoneId: 'America/Los_Angeles' });

test.beforeEach(async ({ page }) => {
  const loginPage = new LoginPage(page);
  await loginPage.navigate();
});

// ─── Page Title ───────────────────────────────────────────────────────────────

test.describe('Login - Page Title', () => {

  test('should have the correct browser tab title', async ({ page }) => {
    await expect(page).toHaveTitle(new RegExp(td.page.titleRegex));
  });

});

// ─── Login Screen Field Visibility ───────────────────────────────────────────

test.describe('Login - Field Visibility', () => {

  test('should display Welcome and Login headings', async ({ page }) => {
    await expect(page.getByRole('heading', { name: td.labels.welcome })).toBeVisible();
    await expect(page.getByRole('heading', { name: td.labels.welcome })).toHaveText(td.labels.welcome);
    await expect(page.getByRole('heading', { name: td.labels.login })).toBeVisible();
    await expect(page.getByRole('heading', { name: td.labels.login })).toHaveText(td.labels.login);
  });

  test('should display the application logo', async ({ page }) => {
    await expect(page.getByRole('link', { name: td.links.logo })).toBeVisible();
  });

  test('should display the Username label and input field', async ({ page }) => {
    await expect(page.getByText(td.labels.username)).toBeVisible();
    await expect(page.getByText(td.labels.username)).toHaveText(td.labels.username);
    await expect(page.getByRole('textbox', { name: td.inputs.usernameField })).toBeVisible();
    await expect(page.getByRole('textbox', { name: td.inputs.usernameField })).toBeEnabled();
  });

  test('should display the Password label and input field', async ({ page }) => {
    const locators = page.getByText(td.labels.password);
    const count = await locators.count();
    console.log(`Password text count: ${count}`);
    // Password label appears twice: as a label and within 'Forgot password?'
    for (let i = 0; i < count; i++) {
      const textContent = (await locators.nth(i).textContent()) ?? '';
      if (textContent.trim() === td.labels.password) {
        await expect(locators.nth(i)).toContainText(td.labels.password);
      } else {
        await expect(locators.nth(i)).toContainText(td.labels.forgotPassword);
      }
    }
    await expect(page.getByRole('textbox', { name: td.inputs.passwordField })).toBeVisible();
    await expect(page.getByRole('textbox', { name: td.inputs.passwordField })).toBeEnabled();
  });

  test('should display the Forgot password link', async ({ page }) => {
    await expect(page.getByText(td.labels.forgotPassword)).toBeVisible();
    await expect(page.getByText(td.labels.forgotPassword)).toContainText(td.labels.forgotPassword);
  });

  test('should display the Log In button', async ({ page }) => {
    await expect(page.getByRole('button', { name: td.labels.logInButton })).toBeVisible();
    await expect(page.getByRole('button', { name: td.labels.logInButton })).toHaveText(td.labels.logInButton);
    // Button is disabled until both username and password are filled
    await expect(page.getByRole('button', { name: td.labels.logInButton })).toBeDisabled();
  });

  test('should display all login form elements together', async ({ page }) => {
    await expect(page.getByRole('link', { name: td.links.logo })).toBeVisible();
    await expect(page.getByRole('heading', { name: td.labels.welcome })).toBeVisible();
    await expect(page.getByRole('heading', { name: td.labels.login })).toBeVisible();
    await expect(page.getByText(td.labels.username)).toBeVisible();
    await expect(page.getByRole('textbox', { name: td.inputs.usernameField })).toBeVisible();
    await expect(page.getByRole('textbox', { name: td.inputs.passwordField })).toBeVisible();
    await expect(page.getByText(td.labels.forgotPassword)).toBeVisible();
    await expect(page.getByRole('button', { name: td.labels.logInButton })).toBeVisible();
  });

  test('Username and Password fields should be empty on page load', async ({ page }) => {
    await expect(page.getByRole('textbox', { name: td.inputs.usernameField })).toHaveValue(td.edgeCases.emptyString);
    await expect(page.getByRole('textbox', { name: td.inputs.passwordField })).toHaveValue(td.edgeCases.emptyString);
  });

});

// ─── Successful Login ─────────────────────────────────────────────────────────

test.describe('Login - Successful Authentication', () => {

  test('should log in with valid admin credentials and land on dashboard', async ({ page, loginAsAdmin }) => {
    await loginAsAdmin();
    await expect(page.locator(td.postLogin.appLocator).getByText(td.postLogin.dashboardText)).toHaveText(td.postLogin.dashboardText);
    await expect(page.getByRole('link', { name: td.links.quickLinks })).toContainText('quick links');
    await page.getByRole('link', { name: td.links.dashboard }).click();
    await expect(page.getByRole('link', { name: td.links.dashboard })).toBeVisible();
  });

  test('should redirect to dashboard URL after successful login', async ({ page, loginAsAdmin }) => {
    await loginAsAdmin();
    await expect(page).toHaveURL(userData.admin.dashboardUrl);
  });

  test('should display dashboard heading after login', async ({ page, loginAsAdmin }) => {
    await loginAsAdmin();
    await expect(page.locator(td.postLogin.appLocator).getByText(td.postLogin.dashboardText)).toBeVisible();
  });

});

// ─── Failed Login / Edge Cases ────────────────────────────────────────────────

test.describe('Login - Invalid Credentials and Edge Cases', () => {

  test('should show error or stay on login page with invalid username and password', async ({ page }) => {
    const loginPage = new LoginPage(page);
    await loginPage.login(td.edgeCases.invalidUsername, td.edgeCases.invalidPassword);

    // Should not navigate away to dashboard
    await expect(page).not.toHaveURL(userData.admin.dashboardUrl);

    // Either an error message appears or the login form remains visible
    const errorVisible = await page.getByText(td.errorMessages.invalidCredentials).isVisible().catch(() => false);
    const loginStillVisible = await page.getByRole('button', { name: td.labels.logInButton }).isVisible().catch(() => false);
    expect(errorVisible || loginStillVisible).toBe(true);
  });

  test('should stay on login page when submitting with empty username and password', async ({ page }) => {
    // Button is disabled when both fields are empty - form cannot be submitted
    await expect(page.getByRole('button', { name: td.labels.logInButton })).toBeDisabled();
    await expect(page).not.toHaveURL(userData.admin.dashboardUrl);
    await expect(page.getByRole('button', { name: td.labels.logInButton })).toBeVisible();
  });

  test('should stay on login page with valid username but wrong password', async ({ page }) => {
    const loginPage = new LoginPage(page);
    await loginPage.login(userData.admin.username, td.edgeCases.invalidPassword);
    await expect(page).not.toHaveURL(userData.admin.dashboardUrl);
    await expect(page.getByRole('button', { name: td.labels.logInButton })).toBeVisible();
  });

  test('should stay on login page with wrong username but valid password', async ({ page }) => {
    const loginPage = new LoginPage(page);
    await loginPage.login(td.edgeCases.invalidUsername, userData.admin.password);
    await expect(page).not.toHaveURL(userData.admin.dashboardUrl);
    await expect(page.getByRole('button', { name: td.labels.logInButton })).toBeVisible();
  });

  test('should stay on login page when only username is provided', async ({ page }) => {
    await page.getByRole('textbox', { name: td.inputs.usernameField }).fill(userData.admin.username);
    // Button remains disabled until password is also filled
    await expect(page.getByRole('button', { name: td.labels.logInButton })).toBeDisabled();
    await expect(page).not.toHaveURL(userData.admin.dashboardUrl);
    await expect(page.getByRole('button', { name: td.labels.logInButton })).toBeVisible();
  });

  test('should stay on login page when only password is provided', async ({ page }) => {
    await page.getByRole('textbox', { name: td.inputs.passwordField }).fill(userData.admin.password);
    // Button remains disabled until username is also filled
    await expect(page.getByRole('button', { name: td.labels.logInButton })).toBeDisabled();
    await expect(page).not.toHaveURL(userData.admin.dashboardUrl);
    await expect(page.getByRole('button', { name: td.labels.logInButton })).toBeVisible();
  });

  test('should not accept SQL injection as valid credentials', async ({ page }) => {
    const loginPage = new LoginPage(page);
    await loginPage.login(td.edgeCases.sqlInjection, td.edgeCases.sqlInjection);
    await expect(page).not.toHaveURL(userData.admin.dashboardUrl);
    await expect(page.getByRole('button', { name: td.labels.logInButton })).toBeVisible();
  });

  test('should not accept whitespace-only username', async ({ page }) => {
    const loginPage = new LoginPage(page);
    await loginPage.login(td.edgeCases.whitespaceUsername, userData.admin.password);
    await expect(page).not.toHaveURL(userData.admin.dashboardUrl);
    await expect(page.getByRole('button', { name: td.labels.logInButton })).toBeVisible();
  });

  test('should not accept an excessively long username', async ({ page }) => {
    const loginPage = new LoginPage(page);
    await loginPage.login(td.edgeCases.longString, td.edgeCases.invalidPassword);
    await expect(page).not.toHaveURL(userData.admin.dashboardUrl);
    await expect(page.getByRole('button', { name: td.labels.logInButton })).toBeVisible();
  });

});

// ─── Field Interaction ────────────────────────────────────────────────────────

test.describe('Login - Field Interaction', () => {

  test('should accept typed text in the Username field', async ({ page }) => {
    await page.getByRole('textbox', { name: td.inputs.usernameField }).fill(userData.admin.username);
    await expect(page.getByRole('textbox', { name: td.inputs.usernameField })).toHaveValue(userData.admin.username);
  });

  test('should accept typed text in the Password field', async ({ page }) => {
    await page.getByRole('textbox', { name: td.inputs.passwordField }).fill(userData.admin.password);
    await expect(page.getByRole('textbox', { name: td.inputs.passwordField })).toHaveValue(userData.admin.password);
  });

  test('should clear Username field when content is deleted', async ({ page }) => {
    await page.getByRole('textbox', { name: td.inputs.usernameField }).fill(userData.admin.username);
    await page.getByRole('textbox', { name: td.inputs.usernameField }).fill(td.edgeCases.emptyString);
    await expect(page.getByRole('textbox', { name: td.inputs.usernameField })).toHaveValue(td.edgeCases.emptyString);
  });

  test('Username field should be focusable', async ({ page }) => {
    await page.getByRole('textbox', { name: td.inputs.usernameField }).click();
    await expect(page.getByRole('textbox', { name: td.inputs.usernameField })).toBeFocused();
  });

  test('Password field should be focusable', async ({ page }) => {
    await page.getByRole('textbox', { name: td.inputs.passwordField }).click();
    await expect(page.getByRole('textbox', { name: td.inputs.passwordField })).toBeFocused();
  });

});
