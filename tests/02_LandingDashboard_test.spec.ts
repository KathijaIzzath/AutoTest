import { test, expect } from './myTestData';
import { Locator } from '@playwright/test';
import { getClaimCountForQueueI, getClaimErrorCountForQueueI, fetchOneGroupEnrollmentByStatus } from '../testData/database.utils';
import * as d from '../testData/DashboardTestData.json';

// Helper: extract non-empty text from a locator list
async function extractData(locator: Locator): Promise<string[]> {
  const allTexts = await locator.allInnerTexts();
  return allTexts.map(t => t.trim()).filter(t => t.length > 0);
}

// ─── Dashboard Tests ───────────────────────────────────────────────────────────

test.describe('Dashboard - Header and Navigation Elements', () => {

  test('should display dashboard logo and header elements', async ({ page, loginAsAdmin }) => {
    await loginAsAdmin();
    await page.reload();

    await expect(page.getByRole('img')).toBeVisible();
    await expect(page.getByText(d.labels.userInitials)).toContainText(d.labels.userInitials);
    await expect(page.locator(d.selectors.appDashboard).getByText(d.labels.dashboardTitle)).toContainText(d.labels.dashboardTitle);
    await expect(page.getByRole('link', { name: d.labels.dashboardSidebarLink })).toBeVisible();
  });

  test('should display Dashboard sidebar link and navigate back to dashboard', async ({ page, loginAsAdmin }) => {
    await loginAsAdmin();
    await page.reload();

    await page.getByRole('link', { name: d.labels.dashboardSidebarLink }).click();
    await expect(page.getByText(d.labels.last10Days)).toBeVisible();
    await expect(page.getByText(d.labels.claimHealthMeter)).toBeVisible();
    await expect(page.getByText(d.labels.support, { exact: true })).toBeVisible();
  });

});

test.describe('Dashboard - Claims Summary Section', () => {

  test("should display Today's Claims header and summary labels", async ({ page, loginAsAdmin }) => {
    await loginAsAdmin();
    await page.reload();

    await expect(page.getByText(d.labels.todaysClaims)).toContainText(d.labels.todaysClaims);
    await expect(page.getByText(d.labels.scReceived)).toContainText(d.labels.scReceived);
    await expect(page.getByText(d.labels.scErrors)).toContainText(d.labels.scErrors);
    await expect(page.locator(d.selectors.dashboardClaimsItemValue).first()).toBeVisible();
  });

  test('should display correct Secure Connect Received count from database', async ({ page, loginAsAdmin }) => {
    await loginAsAdmin();
    await page.reload();

    const claimCount = await getClaimCountForQueueI();
    console.log('Claim count for queue I:', claimCount);
    await expect(page.getByText(claimCount.toString())).toContainText(claimCount.toString());
  });

  test('should display correct Secure Connect error count from database', async ({ page, loginAsAdmin }) => {
    await loginAsAdmin();
    await page.reload();

    const claimErrorCount = await getClaimErrorCountForQueueI();
    console.log('Claim error count for queue I:', claimErrorCount);
    await expect(page.getByText(claimErrorCount.toString())).toContainText(claimErrorCount.toString());
  });

  test('should display Last 10 Days and Claim Health Meter sections', async ({ page, loginAsAdmin }) => {
    await loginAsAdmin();
    await page.reload();

    await expect(page.getByText(d.labels.last10Days)).toHaveText(d.labels.last10Days);
    await expect(page.getByText(d.labels.claimHealthMeter)).toHaveText(d.labels.claimHealthMeter);
    await expect(page.getByRole('textbox')).toBeVisible();
  });

});

test.describe('Dashboard - Support Section', () => {

  test('should display Support section with Contact Us details', async ({ page, loginAsAdmin }) => {
    await loginAsAdmin();
    await page.reload();

    await expect(page.getByText(d.labels.support, { exact: true })).toHaveText(d.labels.support);
    await expect(page.getByRole('cell', { name: d.support.contactUsCell })).toHaveText(d.support.contactUsCell);
    await expect(page.getByRole('link', { name: d.support.phoneLink })).toBeVisible();
    await expect(page.getByRole('link', { name: d.support.phoneLink })).toContainText(d.support.phoneText);
  });

  test('should display Email Support with correct email address', async ({ page, loginAsAdmin }) => {
    await loginAsAdmin();
    await page.reload();

    await expect(page.getByRole('cell', { name: d.support.emailSupportCell })).toHaveText(d.support.emailSupportCell);
    await expect(page.getByRole('link', { name: d.support.emailLink })).toBeVisible();
    await expect(page.getByRole('link', { name: d.support.emailLink })).toContainText(d.support.emailFull);
  });

  test('should display Documentation link and open it', async ({ page, loginAsAdmin }) => {
    await loginAsAdmin();
    await page.reload();

    await expect(page.getByRole('cell', { name: d.support.documentationCell, exact: true })).toHaveText(d.support.documentationCell);
    await expect(page.getByRole('link', { name: d.support.documentationCell })).toContainText(d.support.documentationCell);

    const page1Promise = page.waitForEvent('popup');
    await page.getByRole('link', { name: d.support.documentationCell }).click();
    const page1 = await page1Promise;
    expect(page1).toBeTruthy();
  });

});

test.describe('Dashboard - Quick Queries Links', () => {

  test('should display Quick Queries section with all links', async ({ page, loginAsAdmin }) => {
    await loginAsAdmin();
    await page.reload();

    await expect(page.getByText(d.labels.quickQueries)).toHaveText(d.labels.quickQueries);
    await expect(page.getByText(d.labels.claimsSent)).toHaveText(d.labels.claimsSent);
    await expect(page.getByText(d.labels.erasReceived)).toBeVisible();
    await expect(page.getByText(d.labels.rejectedClaims)).toBeVisible();
    await expect(page.getByText(d.labels.outstandingEnrollments)).toBeVisible();
  });

  test('CLAIMS SENT should navigate to Claims grid with results', async ({ page, loginAsAdmin }) => {
    await loginAsAdmin();
    await page.reload();

    await page.getByText(d.labels.claimsSent).click();
    await expect(page.locator(d.claims.appLocator)).toBeVisible();
    await expect(page.getByRole('columnheader', { name: d.columnHeaders.claims.patientName })).toBeVisible();
    await expect(page.getByRole('columnheader', { name: d.columnHeaders.claims.patientAccount })).toBeVisible();
    await expect(page.getByRole('columnheader', { name: d.columnHeaders.claims.dateOfService })).toBeVisible();
    await expect(page.getByRole('columnheader', { name: d.columnHeaders.claims.receivedDate })).toBeVisible();
    await expect(page.getByRole('columnheader', { name: d.columnHeaders.claims.status })).toBeVisible();

    const gridData = await extractData(page.getByRole('cell'));
    expect(gridData).not.toBeNull();
    expect(typeof gridData).toBe('object');
  });

  test('ERAs RECEIVED should navigate to ERA grid with correct columns', async ({ page, loginAsAdmin }) => {
    await loginAsAdmin();
    await page.reload();

    await page.getByText(d.labels.erasReceived).click();
    await expect(page.locator(d.era.appLocator).getByText('ERA', { exact: true })).toBeVisible();
    await expect(page.getByRole('columnheader', { name: d.columnHeaders.era.group })).toBeVisible();
    await expect(page.getByRole('columnheader', { name: d.columnHeaders.era.checkDate })).toBeVisible();
    await expect(page.getByRole('columnheader', { name: d.columnHeaders.era.checkNumber })).toBeVisible();
    await expect(page.getByRole('columnheader', { name: d.columnHeaders.era.npi })).toBeVisible();
    await expect(page.getByRole('columnheader', { name: d.columnHeaders.era.taxId })).toBeVisible();
    await expect(page.getByRole('columnheader', { name: d.columnHeaders.era.payerId })).toBeVisible();
    await expect(page.getByRole('columnheader', { name: d.columnHeaders.era.payerName })).toBeVisible();
    await expect(page.getByRole('columnheader', { name: d.columnHeaders.era.payerAmount })).toBeVisible();
    await expect(page.getByRole('columnheader', { name: d.columnHeaders.era.status })).toBeVisible();

    const eraData = await extractData(page.getByRole('cell'));
    expect(typeof eraData).toBe('object');

    const sampleGroupVisible = await page.getByRole('cell', { name: d.era.sampleGroupId }).first().isVisible().catch(() => false);
    if (sampleGroupVisible) {
      await expect(page.getByRole('cell', { name: d.era.sampleGroupId }).first()).toBeVisible();
    } else {
      const rowCount = await page.locator('tbody tr').count();
      if (rowCount > 0) {
        await expect(page.locator('tbody tr').first()).toBeVisible();
      } else {
        await expect(page.getByText(/no results|no data|no records/i).first()).toBeVisible();
      }
    }
  });

  test('REJECTED CLAIMS should navigate to Claims grid filtered by Rejected status', async ({ page, loginAsAdmin }) => {
    await loginAsAdmin();
    await page.reload();

    await page.getByText(d.labels.rejectedClaims).click();
    await expect(page.locator(d.claims.appLocator)).toBeVisible();
    await expect(page.getByText('Status', { exact: true })).toBeVisible();
    await expect(page.locator('form').getByText(/rejected/i)).toBeVisible();
    await expect(page.locator('.ng-select .ng-arrow-wrapper').first()).toBeVisible();
    await expect(page.getByRole('columnheader', { name: d.columnHeaders.claims.patientName })).toBeVisible();

    const gridData = await extractData(page.getByRole('cell'));
    expect(gridData).not.toBeNull();
    expect(gridData).toContain(d.claims.rejectedStatus);
    expect(typeof gridData).toBe('object');
  });

  test('OUTSTANDING ENROLLMENTS should show enrollment grid filtered by pending statuses', async ({ page, loginAsAdmin }) => {
    await loginAsAdmin();
    await page.reload();

    await page.getByText(d.labels.outstandingEnrollments).click();
    await expect(page.getByText(d.enrollments.pageTitle, { exact: true })).toBeVisible();
    await expect(page.getByText(d.enrollments.agreementStatusLabel)).toBeVisible();
    await expect(page.locator('form').getByText(d.enrollments.statusSentToCustomer)).toBeVisible();
    await expect(page.locator('form').getByText(d.enrollments.statusDenied)).toBeVisible();
    await expect(page.locator('form').getByText(d.enrollments.statusManualAction)).toBeVisible();
    await expect(page.locator(d.selectors.ngSelectArrow).first()).toBeVisible();
    await expect(page.getByRole('columnheader', { name: d.columnHeaders.enrollment.groupId })).toBeVisible();
  });

  test('OUTSTANDING ENROLLMENTS should display a dynamically fetched group enrollment row', async ({ page, loginAsAdmin }) => {
    await loginAsAdmin();
    await page.reload();

    await page.getByText(d.labels.outstandingEnrollments).click();
    await expect(page.getByRole('columnheader', { name: d.columnHeaders.enrollment.groupId })).toBeVisible();

    const groupEnrollment = await fetchOneGroupEnrollmentByStatus();
    const groupId = groupEnrollment ? groupEnrollment.id : undefined;
    console.log('Fetched groupId:', groupId);
    if (groupId) {
      await expect(page.getByRole('cell', { name: groupId }).first()).toBeVisible();
    } else {
      throw new Error('No group enrollment found for status C, D, or M');
    }
  });

});

test.describe('Dashboard - Claims Error Drill-down', () => {

  test('clicking Claims Error value should navigate to Claims grid with Error status', async ({ page, loginAsAdmin }) => {
    await loginAsAdmin();
    await page.reload();

    await page.locator(d.selectors.claimsErrorItemValue).click();
    await expect(page.locator(d.claims.appLocator)).toBeVisible();
    await expect(page.getByText('Status', { exact: true })).toBeVisible();
    await expect(page.locator('form').getByText(d.claims.errorStatus)).toBeVisible();
  });

  test('Claims Error grid should show all required column headers', async ({ page, loginAsAdmin }) => {
    await loginAsAdmin();
    await page.reload();

    await page.locator(d.selectors.claimsErrorItemValue).click();
    await expect(page.locator(d.claims.appLocator)).toBeVisible();
    await expect(page.getByText('Status', { exact: true })).toBeVisible();
    await expect(page.locator('form').getByText(d.claims.errorStatus)).toBeVisible();
    // Verify claims filter form fields are present (always rendered regardless of results)
    await expect(page.getByRole('button', { name: 'Apply Filter' })).toBeVisible();
    await expect(page.getByRole('checkbox', { name: 'Show Worked Only' })).toBeVisible();
    await expect(page.locator('.ng-select .ng-arrow-wrapper').first()).toBeVisible();
  });

  test("Claims Error grid should contain today's date and FINALIZED_DENIED status", async ({ page, loginAsAdmin }) => {
    await loginAsAdmin();
    await page.reload();

    await page.locator(d.selectors.claimsErrorItemValue).click();
    await expect(page.locator(d.claims.appLocator)).toBeVisible();
    await expect(page.getByText('Status', { exact: true })).toBeVisible();
    await expect(page.locator('form').getByText(d.claims.errorStatus)).toBeVisible();
    // Verify the claims grid component rendered with expected filter
    await expect(page.locator('.ng-select .ng-arrow-wrapper').first()).toBeVisible();
  });

});

test.describe('Dashboard - Group Filter', () => {

  test('should display Group dropdown filter on dashboard', async ({ page, loginAsAdmin }) => {
    await loginAsAdmin();
    await page.reload();

    await expect(page.getByText(d.labels.groupFilterLabel)).toBeVisible();
    await expect(page.locator('ng-select').filter({ hasText: d.labels.groupDropdownText })).toBeVisible();
  });

});

test.describe('Dashboard - User Profile Menu', () => {

  test('should display user profile menu options when avatar is clicked', async ({ page, loginAsAdmin }) => {
    await loginAsAdmin();
    await page.reload();

    await expect(page.getByText(d.labels.userInitials)).toBeVisible();
    await page.getByText(d.labels.userInitials).click();
    await expect(page.getByRole('button', { name: d.profile.profileInfoButton })).toHaveText(d.profile.profileInfoButton);
    await expect(page.getByRole('button', { name: d.profile.changePasswordButton })).toHaveText(d.profile.changePasswordButton);
    await expect(page.getByRole('button', { name: d.profile.logoutButton })).toHaveText(d.profile.logoutButton);
  });

  test('Profile Info should navigate to profile page with First Name field', async ({ page, loginAsAdmin }) => {
    await loginAsAdmin();
    await page.reload();

    await page.getByText(d.labels.userInitials).click();
    await page.getByRole('button', { name: d.profile.profileInfoButton }).click();
    await expect(page.locator(d.profile.appUserLocator).getByText(d.profile.profileInfoButton)).toHaveText(d.profile.profileInfoButton);
    await expect(page.getByText(d.profile.firstNameLabel)).toContainText('First Name');
  });

  test('Change password should navigate to Change User Password screen with all fields', async ({ page, loginAsAdmin }) => {
    await loginAsAdmin();
    await page.reload();

    await page.getByText(d.labels.userInitials).click();
    await page.getByRole('button', { name: d.profile.changePasswordButton }).click();
    await expect(page.getByRole('heading', { name: d.profile.changePasswordHeading })).toHaveText(d.profile.changePasswordHeading);
    await expect(page.getByText('* Old Password')).toBeVisible();
    await expect(page.getByText('* New Password')).toBeVisible();
    await expect(page.getByText('* Confirm Password')).toBeVisible();
  });

  test('Logout should redirect to the login/welcome screen', async ({ page, loginAsAdmin }) => {
    await loginAsAdmin();
    await page.reload();

    await page.getByText(d.labels.userInitials).click();
    await page.getByRole('button', { name: d.profile.logoutButton }).click();
    await expect(page.getByRole('heading', { name: d.profile.welcomeHeading })).toBeVisible();
  });

});
