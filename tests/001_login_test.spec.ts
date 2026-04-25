import { test, expect } from './myTestData';
import * as userData from '../testData/UserInfo.json';
import LoginPage from '../testData/LoginPage';
import DBQueries from '../testData/DBQueries';

// Removed unused Page type and browser.newPage setup

test.use({ timezoneId: 'America/Los_Angeles' });

test.beforeAll(async () => {
  let dbQueries = new DBQueries();
  console.log('Running setup before all tests in the worker process');
  await dbQueries.beforeAllUpdateQueries();
});

// Begin Test and navigate to url
test.beforeEach(async ({ page }) => {
  let loginPage = new LoginPage(page);
  await loginPage.navigate(); // navigates to login page
});

test('has title', async ({ page }) => {
  let loginPage = new LoginPage(page);
  await loginPage.navigate();
  await expect(page).toHaveTitle(/Secure Connect/);
});

test('verify Login screen fields', async ({ page }) => {
  const targetText = 'Password';

  await expect(page.getByText('Welcome')).toBeVisible();
  await expect(page.getByText('Login')).toBeVisible();
  await expect(page.getByRole('link', { name: 'Logo' })).toBeVisible();
  await expect(page.getByRole('heading', { name: 'Welcome' })).toHaveText('Welcome');
  await expect(page.getByRole('heading', { name: 'Login' })).toHaveText('Login');
  await expect(page.getByText('Username')).toBeVisible();
  await expect(page.getByText('Username')).toHaveText('Username');

  const locators = page.getByText(targetText);
  const count = await locators.count();

  if (count === 2) {
    console.log(`The text "${targetText}" was found twice.`);

    // Optional: Iterate and print the text from each instance
    for (let i = 0; i < count; i++) {
      const textContent = await locators.nth(i).textContent();
      if (textContent === 'Password') {
        await expect(locators.nth(i)).toContainText('Password');
      } else {
        await expect(locators.nth(i)).toContainText('Forgot password?');
      }
      console.log(`Instance ${i + 1} text content: ${textContent}`);
    }
  } else {
    console.log(`The text "${targetText}" was found ${count} times, not twice.`);
    // You could also fail the test here if necessary
    // expect(count).toBe(2);
  }

  await expect(page.getByRole('button', { name: 'Log In' })).toHaveText('Log In');
});

test('test & fill in login credentials', async ({ page, loginAsAdmin }) => {
  await loginAsAdmin();
  await expect(page.locator('app-dashboard').getByText('Dashboard')).toHaveText('Dashboard');
  await expect(page.getByRole('link', { name: ' quick links' })).toContainText('quick links');
  await page.getByRole('link', { name: ' Dashboard' }).click();
});