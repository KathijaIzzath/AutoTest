import { test, expect, Locator, Page } from '@playwright/test';
import * as userData from '../testData/UserInfo.json';
import LoginPage from '../testData/LoginPage';
import helperFunction from '../testData/helperFunction';
import { getTodaysDate } from '../testData/database.utils';

test.beforeEach(async ({ browser }) => {
  // Initialize the page instance before each test
  let page: Page;
  page = await browser.newPage();
});

test('Dashboard tests execution', async ({ page }) => {
  let loginPage = new LoginPage(page);
  let helper = new helperFunction();

  // Helper function to extract text content from elements
  async function extractData(locator: Locator): Promise<string[]> {
    const allTexts = await locator.allInnerTexts();
    return allTexts.map(text => text.trim()).filter(text => text.length > 0);
  }

  // Navigate and login
  await loginPage.navigate();
  await loginPage.login(userData.admin.username, userData.admin.password);
  await expect(page).toHaveURL(userData.admin.dashboardUrl);
  await page.reload();

  // Verify dashboard header elements
  await expect(page.getByRole('img')).toBeVisible();
  await expect(page.getByText('SA')).toContainText('SA'); // if logged in user is scadmin
  await expect(page.locator('app-dashboard').getByText('Dashboard')).toContainText('Dashboard');
  await expect(page.getByText('Today\'s Claims')).toContainText('Today\'s Claims');
  await page.reload();

  // Verify dashboard labels and data
  await expect(page.getByText('Secure Connect Received')).toContainText('Secure Connect Received');
  await expect(page.getByText('Secure Connect errors')).toContainText('Secure Connect errors');
  await expect(page.getByRole('textbox')).toBeVisible();
  await expect(page.getByText('Last 10 Days')).toBeVisible();
  await expect(page.getByText('Last 10 Days')).toHaveText('Last 10 Days');
  await expect(page.getByText('Claim Health Meter')).toBeVisible();
  await expect(page.getByText('Claim Health Meter')).toHaveText('Claim Health Meter');
  await expect(page.getByText('Support', { exact: true })).toBeVisible();
  await expect(page.getByText('Support', { exact: true })).toHaveText('Support');

  // Verify Contact Us section
  await expect(page.getByRole('cell', { name: 'Contact Us' })).toBeVisible();
  await expect(page.getByRole('cell', { name: 'Contact Us' })).toHaveText('Contact Us');
  await expect(page.getByRole('link', { name: '-855-734-4668' })).toBeVisible();
  await expect(page.getByRole('link', { name: '-855-734-4668' })).toContainText('855-734-4668');

  // Verify Email Support section
  await expect(page.getByRole('cell', { name: 'Email Support' })).toBeVisible();
  await expect(page.getByRole('cell', { name: 'Email Support' })).toHaveText('Email Support');
  await expect(page.getByRole('link', { name: 'Secureconnect@harriscomputer.' })).toBeVisible();

  // Verify Quick Queries and Claims Sent sections
  await expect(page.getByRole('cell', { name: 'Documentation', exact: true })).toBeVisible();
  await expect(page.getByRole('link', { name: 'Documentation' })).toBeVisible();
  await expect(page.getByText('Quick Queries')).toBeVisible();
  await expect(page.getByText('CLAIMS SENT')).toBeVisible();

  // Verify email address and documentation
  await expect(page.getByRole('link', { name: 'Secureconnect@harriscomputer.' }))
    .toContainText('Secureconnect@harriscomputer.com');
  await expect(page.getByRole('cell', { name: 'Documentation', exact: true })).toHaveText('Documentation');
  await expect(page.getByRole('link', { name: 'Documentation' })).toContainText('Documentation');
  await expect(page.getByText('Quick Queries')).toHaveText('Quick Queries');
  await expect(page.getByText('CLAIMS SENT')).toHaveText('CLAIMS SENT');
  await expect(page.locator('app-dashboard').getByText('Dashboard')).toHaveText('Dashboard');
  await expect(page.getByText('Today\'s Claims')).toHaveText('Today\'s Claims');
  await expect(page.getByText('Support', { exact: true })).toHaveText('Support');
  await expect(page.getByText('58911')).toHaveText('58911');
  await expect(page.getByText('2584')).toHaveText('2584');

  // Verify dashboard links and claim items
  await expect(page.getByRole('link', { name: ' Dashboard' })).toBeVisible();
  await expect(page.locator('app-dashboard').getByText('Dashboard')).toBeVisible();
  await expect(page.getByText('Today\'s Claims')).toBeVisible();
  await expect(page.locator('.dashboard-claims-item-value').first()).toBeVisible();

  // Test Claims Error redirect
  await page.locator('.dashboard-claims-item.errors > .dashboard-claims-item-value').click();
  await expect(page.locator('app-claims').getByText('Claims', { exact: true })).toBeVisible();
  await expect(page.getByText('Status', { exact: true })).toBeVisible();
  await expect(page.getByText('Error')).toBeVisible();
  await expect(page.locator('form').getByText('Error')).toBeVisible();

  // Verify Claims Error grid headers
  await expect(page.locator('.ng-select-multiple > .ng-select-container > .ng-arrow-wrapper')).toBeVisible();
  await expect(page.getByRole('columnheader', { name: 'PATIENT NAME ' })).toBeVisible();
  await expect(page.getByRole('columnheader', { name: 'PATIENT ACCOUNT #' })).toBeVisible();
  await expect(page.getByRole('columnheader', { name: 'DATE OF SERVICE' })).toBeVisible();
  await expect(page.getByRole('columnheader', { name: 'CLAIM ID' })).toBeVisible();
  await expect(page.getByRole('columnheader', { name: 'PROVIDER' })).toBeVisible();
  await expect(page.getByRole('columnheader', { name: 'CHARGES' })).toBeVisible();
  await expect(page.getByRole('columnheader', { name: 'STATUS' })).toBeVisible();

  // Verify Claims Error data
  const date = getTodaysDate();
  console.log('Today\'s date:', date);

  const gridCells = page.getByRole('cell');
  const gridData = await extractData(gridCells);
  console.log('Extracted claims error grid data:', gridData);

  await expect(gridData).not.toBeNull();
  await expect(typeof gridData).toBe('object'); // verifies that data was returned
  await expect(gridData).toContain('FINALIZED_DENIED');
  await expect(gridData).toContain(date);

  // Navigate back to dashboard
  await page.getByRole('link').filter({ hasText: /^$/ }).nth(3).click();
  await expect(page.getByRole('link', { name: ' Dashboard' })).toBeVisible();
  await page.getByRole('link', { name: ' Dashboard' }).click();
  await expect(page.getByText('Last 10 Days')).toBeVisible();
  await expect(page.getByText('Claim Health Meter')).toBeVisible();
  await expect(page.getByText('Support', { exact: true })).toBeVisible();

  // Test Claims Sent
  await page.getByRole('cell', { name: 'Documentation', exact: true }).click();
  const page1Promise = page.waitForEvent('popup');
  await page.getByRole('link', { name: 'Documentation' }).click();
  const page1 = await page1Promise;

  await page.getByText('Quick Queries').click();
  await expect(page.getByText('Quick Queries')).toBeVisible();
  await expect(page.getByText('CLAIMS SENT')).toBeVisible();
  await page.getByText('CLAIMS SENT').click();
  await expect(page.locator('app-claims').getByText('Claims', { exact: true })).toBeVisible();
  await expect(page.getByRole('columnheader', { name: 'CLAIM ID' })).toBeVisible();

  const gridcheckCells = page.getByRole('cell');
  const gridDatacheck = await extractData(gridcheckCells);
  console.log('Extracted claims sent grid data:', gridDatacheck);

  await expect(gridData).not.toBeNull();
  await expect(typeof gridData).toBe('object');

  // Test ERAs Received
  await page.getByRole('link', { name: ' Dashboard' }).click();
  await expect(page.getByText('ERAs RECEIVED')).toBeVisible();
  await page.getByText('ERAs RECEIVED').click();
  await expect(page.locator('app-era').getByText('ERA', { exact: true })).toBeVisible();
  await expect(page.getByRole('columnheader', { name: 'group' })).toBeVisible();
  await expect(page.getByRole('columnheader', { name: 'check date' })).toBeVisible();
  await expect(page.getByRole('columnheader', { name: 'Check Number' })).toBeVisible();
  await expect(page.getByRole('columnheader', { name: 'npi' })).toBeVisible();
  await expect(page.getByRole('columnheader', { name: 'tax id' })).toBeVisible();
  await expect(page.getByRole('columnheader', { name: 'payer id' })).toBeVisible();
  await expect(page.getByRole('columnheader', { name: 'Payer Name' })).toBeVisible();
  await expect(page.getByRole('columnheader', { name: 'Payer amount' })).toBeVisible();
  await expect(page.getByRole('columnheader', { name: 'status' })).toBeVisible();

  const eraGridCells = page.getByRole('cell');
  const eragridData = await extractData(eraGridCells);
  console.log('Extracted era grid data:', eragridData);

  await expect(eragridData).toContain('G30034');
  await expect(typeof eragridData).toBe('object');

  // Test Rejected Claims
  await page.getByRole('link', { name: ' Dashboard' }).click();
  await expect(page.getByText('REJECTED CLAIMS')).toBeVisible();
  await page.getByText('REJECTED CLAIMS').click();
  await expect(page.locator('app-claims').getByText('Claims', { exact: true })).toBeVisible();
  await expect(page.getByText('Status', { exact: true })).toBeVisible();
  await expect(page.getByText('Rejected', { exact: true })).toBeVisible();
  await expect(page.locator('.ng-select-multiple > .ng-select-container > .ng-arrow-wrapper')).toBeVisible();
  await expect(page.getByRole('columnheader', { name: 'CLAIM ID' })).toBeVisible();

  const rejectedClaimsGridCells = page.getByRole('cell');
  const rejectedClaimsgridData = await extractData(rejectedClaimsGridCells);
  console.log('Extracted rejectedClaims grid data:', rejectedClaimsgridData);

  await expect(rejectedClaimsgridData).not.toBeNull();
  await expect(rejectedClaimsgridData).toContain('REJECTED');
  await expect(typeof rejectedClaimsgridData).toBe('object');

  // Test Outstanding Enrollments
  await expect(page.getByRole('link', { name: ' Dashboard' })).toBeVisible();
  await page.getByRole('link', { name: ' Dashboard' }).click();
  await expect(page.getByText('OUTSTANDING ENROLLMENTS')).toBeVisible();
  await page.getByText('OUTSTANDING ENROLLMENTS').click();
  await expect(page.getByText('Group Enrollment', { exact: true })).toBeVisible();
  await expect(page.getByText('Agreement Status')).toBeVisible();
  await expect(page.locator('form').getByText('Sent to Customer')).toBeVisible();
  await expect(page.locator('form').getByText('Denied')).toBeVisible();
  await expect(page.locator('form').getByText('Manual action required')).toBeVisible();
  await expect(page.locator('.ng-select-multiple > .ng-select-container > .ng-arrow-wrapper').first())
    .toBeVisible();
  await expect(page.getByRole('columnheader', { name: 'GROUP ID' })).toBeVisible();
  await expect(page.getByRole('cell', { name: 'G00016' }).first()).toBeVisible();

  // Test Group DDL and Profile
  await expect(page.getByRole('link', { name: ' Dashboard' })).toBeVisible();
  await page.getByRole('link', { name: ' Dashboard' }).click();

  await expect(page.getByText('Group:')).toBeVisible();
  await expect(page.locator('ng-select').filter({ hasText: 'Choose a Group×All×' })).toBeVisible();

  // Verify user profile menu
  await expect(page.getByText('SA')).toBeVisible();
  await page.getByText('SA').click();
  await expect(page.getByRole('button', { name: 'Profile Info' })).toBeVisible();
  await expect(page.getByRole('button', { name: 'Profile Info' })).toHaveText('Profile Info');
  await expect(page.getByRole('button', { name: 'Change password' })).toBeVisible();
  await expect(page.getByRole('button', { name: 'Change password' })).toHaveText('Change password');
  await expect(page.getByRole('button', { name: 'Logout' })).toBeVisible();
  await expect(page.getByRole('button', { name: 'Logout' })).toHaveText('Logout');

  // Test Profile Info navigation
  await expect(page.getByRole('button', { name: 'Profile Info' })).toHaveText('Profile Info');
  await page.getByRole('button', { name: 'Profile Info' }).click();
  await expect(page.locator('app-user').getByText('Profile Info')).toHaveText('Profile Info');
  await expect(page.getByText('* First Name')).toContainText('First Name');
  await page.getByText('SA').click();

  // Test Change Password option
  await page.getByRole('button', { name: 'Change password' }).click();
  await expect(page.getByRole('heading', { name: 'Change User Password' }))
    .toHaveText('Change User Password');
  await expect(page.getByText('* Old Password')).toContainText('Old Password');
  await expect(page.getByText('* New Password')).toContainText('New Password');
  await expect(page.getByText('* Confirm Password')).toContainText('Confirm Password');
  await expect(page.getByRole('heading', { name: 'Change User Password' })).toBeVisible();
  await expect(page.getByText('* Old Password')).toBeVisible();
  await expect(page.getByText('* New Password')).toBeVisible();
  await expect(page.getByText('* Confirm Password')).toBeVisible();
  await page.getByRole('link').first().click();
  await page.locator('app-user').getByText('Profile Info').click();
  await page.getByText('SA').click();

  // Test Logout
  await expect(page.getByRole('button', { name: 'Logout' })).toHaveText('Logout');
  await expect(page.getByRole('button', { name: 'Logout' })).toBeVisible();
  await page.getByRole('button', { name: 'Logout' }).click();
  await expect(page.getByRole('heading', { name: 'Welcome' })).toBeVisible();
});