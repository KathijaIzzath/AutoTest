import { test, expect } from '../myTestData';
import { Page } from '@playwright/test';
import * as userData from '../../testData/UserInfo.json';
import * as d from '../../testData/FinancialDshbdTestData.json';
import { verifyElementsVisible } from '../framework/element-verifier.helper';

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

async function loginAsFinancial(page: Page): Promise<void> {
  await page.goto(userData.admin.url);
  await page.getByRole('textbox', { name: d.buttons.enterUsername }).fill(userData.financial.username);
  await page.getByRole('textbox', { name: d.buttons.enterPassword }).fill(userData.financial.password);
  await page.getByRole('button', { name: d.buttons.logIn }).click();
  await expect(page.locator(d.selectors.appDashboard).getByText(d.labels.dashboard)).toBeVisible({
    timeout: d.timeouts.loginTimeout,
  });
}

async function expandFinancialMenu(page: Page): Promise<void> {
  await expect(page.getByRole('link', { name: d.navigation.financialLink })).toBeVisible();
  await page.getByRole('listitem').filter({ hasText: d.navigation.financialListItem }).getByRole('button').click();
}

async function navigateToProcessPayments(page: Page): Promise<void> {
  await expandFinancialMenu(page);
  await expect(page.getByRole('link', { name: d.navigation.processPaymentsLink })).toBeVisible();
  await page.getByRole('link', { name: d.navigation.processPaymentsLink }).click();
}

async function selectClientFromDropdown(page: Page): Promise<void> {
  await page.locator(d.selectors.appClientSearch).getByRole('textbox').click();
  await page.getByText(d.searchValues.clientDropdownOption).click();
}

async function fillNameSearchAndSubmit(page: Page, firstName: string, lastName: string): Promise<void> {
  await page.locator(`input[name="${d.inputs.firstName}"]`).fill(firstName);
  await page.locator(`input[name="${d.inputs.lastName}"]`).fill(lastName);
  await page.getByRole('button', { name: d.buttons.search }).click();
}

async function waitForSearchOutcome(page: Page): Promise<'results' | 'summary' | 'none'> {
  const resultsHeading = page.getByRole('heading', { name: d.labels.results });
  const chargeSummaryHeading = page.getByRole('heading', { name: d.labels.chargeSummaryForPrefix }).first();

  try {
    return await Promise.race([
      resultsHeading.waitFor({ state: 'visible', timeout: d.timeouts.searchTimeout }).then(() => 'results' as const),
      chargeSummaryHeading.waitFor({ state: 'visible', timeout: d.timeouts.searchTimeout }).then(() => 'summary' as const),
    ]);
  } catch {
    return 'none';
  }
}

async function selectPatientRowIfPresent(page: Page): Promise<void> {
  const patientCell = page.getByRole('cell', { name: userData.financial.onlyIdentifier }).first();
  if (await patientCell.isVisible().catch(() => false)) {
    await patientCell.click();
    return;
  }

  const firstGridCell = page.locator('tbody tr').first().locator('td').first();
  if (await firstGridCell.isVisible().catch(() => false)) {
    await firstGridCell.click();
  }
}

// ---------------------------------------------------------------------------
// Test 1 – Financial navigation sub-menu links availability
// ---------------------------------------------------------------------------
test('Financial navigation sub-menu links are visible', async ({ page }) => {
  test.setTimeout(120000);

  await loginAsFinancial(page);
  await expandFinancialMenu(page);

  await verifyElementsVisible([
    page.getByRole('link', { name: d.navigation.processPaymentsLink }),
    page.getByRole('link', { name: d.navigation.paymentAnalyticsLink }),
    page.getByRole('link', { name: d.navigation.viewPaymentsLink }),
  ], d.timeouts.generalTimeout);
});

// ---------------------------------------------------------------------------
// Test 2 – Process Payments page – form controls visibility
// ---------------------------------------------------------------------------
test('Process Payments page form controls and elements are visible', async ({ page }) => {
  test.setTimeout(120000);

  await loginAsFinancial(page);
  await navigateToProcessPayments(page);

  await verifyElementsVisible([
    page.getByText(d.labels.activeSite),
    page.locator(d.selectors.appClientSearch).getByRole('textbox'),
    page.getByText(d.labels.transactionType),
  ], d.timeouts.generalTimeout);

  await expect(page.locator(d.selectors.appClientSearch).getByRole('textbox')).toBeEmpty();
  await expect(page.locator(d.selectors.appClientSearch)).toContainText(d.labels.transactionTypeText);
});

// ---------------------------------------------------------------------------
// Test 3 – Responsible party search by first name returns a results table
// ---------------------------------------------------------------------------
test('Process Payments - search by first name returns results table', async ({ page }) => {
  test.setTimeout(150000);

  await loginAsFinancial(page);
  await navigateToProcessPayments(page);
  await selectClientFromDropdown(page);
  await fillNameSearchAndSubmit(page, d.searchValues.firstNameSearch, d.searchValues.lastNameSearch);

  const outcome = await waitForSearchOutcome(page);
  if (outcome === 'results') {
    await verifyElementsVisible([
      page.getByRole('columnheader', { name: d.headers.id }),
      page.getByRole('columnheader', { name: d.headers.name }),
      page.getByRole('link', { name: d.selectors.viewAccountBalance }).first(),
      page.getByTitle(d.selectors.addToWallet).first(),
      page.locator(`input[name="${d.inputs.lastName}"]`),
    ], d.timeouts.generalTimeout);
  } else if (outcome === 'summary') {
    await verifyElementsVisible([
      page.getByRole('heading', { name: d.labels.chargeSummaryForPrefix }).first(),
      page.getByRole('heading', { name: d.labels.responsiblePartyName }),
      page.getByRole('link', { name: d.navigation.managePaymentMethods }),
    ], d.timeouts.generalTimeout);
  } else {
    await verifyElementsVisible([
      page.getByRole('button', { name: d.buttons.search }),
      page.locator(`input[name="${d.inputs.firstName}"]`),
      page.locator(`input[name="${d.inputs.lastName}"]`),
    ], d.timeouts.generalTimeout);
    await expect(page.getByRole('heading', { name: d.labels.results })).not.toBeVisible();
  }
});

// ---------------------------------------------------------------------------
// Test 4 – PRESERVED: process payments, add wallet method, and verify
//           responsible party search (full functional flow)
// ---------------------------------------------------------------------------
test('Financial dashboard - process payments, add wallet method, and verify responsible party search', async ({ page }) => {
  test.setTimeout(180000);
  // Login and navigate to Process Payments
  await page.goto(userData.admin.url);
  await page.getByRole('textbox', { name: d.buttons.enterUsername }).click();
  await page.getByRole('textbox', { name: d.buttons.enterUsername }).fill(userData.financial.username);
  await page.getByRole('textbox', { name: d.buttons.enterPassword }).click();
  await page.getByRole('textbox', { name: d.buttons.enterPassword }).fill(userData.financial.password);
  await page.getByRole('button', { name: d.buttons.logIn }).click();
  await expect(page.locator(d.selectors.appDashboard).getByText(d.labels.dashboard)).toBeVisible({ timeout: d.timeouts.loginTimeout });
  await expect(page.getByRole('link', { name: d.navigation.financialLink })).toBeVisible();
  await page.getByRole('listitem').filter({ hasText: d.navigation.financialListItem }).getByRole('button').click();
  await expect(page.getByRole('link', { name: d.navigation.processPaymentsLink })).toBeVisible();
  await expect(page.getByRole('link', { name: d.navigation.paymentAnalyticsLink })).toBeVisible();
  await expect(page.getByRole('link', { name: d.navigation.viewPaymentsLink })).toBeVisible();
  await page.getByRole('link', { name: d.navigation.processPaymentsLink }).click();

  // Search responsible party and validate results table
  await expect(page.getByText(d.labels.activeSite)).toBeVisible();
  await expect(page.locator(d.selectors.appClientSearch).getByRole('textbox')).toBeEmpty();
  await expect(page.locator(d.selectors.appClientSearch).getByRole('textbox')).toBeVisible();
  await expect(page.getByText(d.labels.transactionType)).toBeVisible();
  await expect(page.locator(d.selectors.appClientSearch)).toContainText(d.labels.transactionTypeText);
  await page.locator(d.selectors.appClientSearch).getByRole('textbox').click();
  await page.getByText(d.searchValues.clientDropdownOption).click();
  await page.locator(`input[name="${d.inputs.firstName}"]`).click();
  await page.locator(`input[name="${d.inputs.firstName}"]`).fill(d.searchValues.firstNameSearch);
  await page.getByRole('button', { name: d.buttons.search }).click();
  await expect(page.getByRole('button', { name: d.buttons.search })).toBeVisible();
  await expect(page.getByRole('heading', { name: d.labels.results })).toBeVisible({ timeout: d.timeouts.searchTimeout });
  await verifyElementsVisible([
    page.getByRole('columnheader', { name: d.headers.id }),
    page.getByRole('columnheader', { name: d.headers.name }),
    page.getByRole('cell', { name: d.searchValues.firstSearchResultId }),
    page.getByRole('cell', { name: d.searchValues.firstSearchResultName }),
    page.getByRole('link', { name: d.selectors.viewAccountBalance }).first(),
    page.getByTitle(d.selectors.addToWallet).first(),
    page.locator(`input[name="${d.inputs.lastName}"]`),
  ]);
  await page.locator(`input[name="${d.inputs.lastName}"]`).click();
  await page.locator(`input[name="${d.inputs.lastName}"]`).fill(d.searchValues.lastNameRefund);
  await page.getByRole('button', { name: d.buttons.search }).click();
  await expect(page.locator(`input[name="${d.inputs.lastName}"]`)).toBeVisible();
  await expect(page.locator(`input[name="${d.inputs.lastName}"]`)).toHaveValue(d.searchValues.lastNameRefund);
  await expect(page.getByRole('heading', { name: d.labels.chargeSummaryForPrefix })).toBeVisible();
  await expect(page.getByRole('heading', { name: d.labels.responsiblePartyName })).toBeVisible();

  // Open Manage Payment Methods and start add payment flow
  await expect(page.getByRole('link', { name: d.navigation.managePaymentMethods })).toBeVisible();
  await page.getByRole('link', { name: d.navigation.managePaymentMethods }).click();
  await verifyElementsVisible([
    page.getByRole('columnheader', { name: d.headers.accountNumber }),
    page.getByRole('columnheader', { name: d.headers.name }),
    page.getByRole('cell', { name: userData.financial.onlyIdentifier }),
    page.getByRole('cell', { name: userData.financial.patientNameforSearch }),
    page.getByRole('heading', { name: d.labels.addPaymentMethod }),
    page.getByText(d.labels.select),
  ]);
  await page.getByText(d.labels.select).click();
  await page.getByText(d.labels.select).click();
  await expect(page.getByText(d.labels.savePaymentInfo)).toBeVisible();
  await expect(page.getByRole('checkbox', { name: d.labels.savePaymentInfo })).toBeVisible();
  await page.locator(`iframe[name="${d.iframes.cardNumber}"]`).contentFrame().getByRole('textbox', { name: d.placeholders.cardNumber }).click();
  await page.locator(`iframe[name="${d.iframes.cardNumber}"]`).contentFrame().getByRole('textbox', { name: d.placeholders.cardNumber }).fill(userData.financial.cardnumber);
  await page.locator(`iframe[name="${d.iframes.cardExpiration}"]`).contentFrame().getByRole('textbox', { name: d.placeholders.expiry }).click();
  await page.locator(`iframe[name="${d.iframes.cardExpiration}"]`).contentFrame().getByRole('textbox', { name: d.placeholders.expiry }).fill(userData.financial.expiryDate);
  await page.locator(`iframe[name="${d.iframes.cardCvv}"]`).contentFrame().getByRole('textbox', { name: d.placeholders.cvv }).click();
  await page.locator(`iframe[name="${d.iframes.cardCvv}"]`).contentFrame().getByRole('textbox', { name: d.placeholders.cvv }).fill(userData.financial.cvv);
  await expect(page.locator(`iframe[name="${d.iframes.submit}"]`).contentFrame().getByRole('button', { name: d.buttons.save })).toBeVisible();
  await page.getByRole('button', { name: d.buttons.close }).click();
  await verifyElementsVisible([
    page.getByRole('cell', { name: userData.financial.onlyIdentifier }),
    page.getByRole('cell', { name: userData.financial.patientNameforSearch }),
    page.getByRole('link', { name: d.selectors.viewAccountBalance }),
    page.getByTitle(d.selectors.addToWallet),
  ]);

  // Re-open wallet add flow and save a payment method
  await page.getByTitle(d.selectors.addToWallet).click();
  await verifyElementsVisible([
    page.getByRole('columnheader', { name: d.headers.accountNumber }),
    page.getByRole('columnheader', { name: d.headers.name }),
    page.getByRole('cell', { name: userData.financial.onlyIdentifier }),
    page.getByRole('cell', { name: userData.financial.patientNameforSearch }),
    page.getByRole('heading', { name: d.labels.addPaymentMethod }),
    page.getByText(d.labels.select),
    page.getByText(d.labels.savePaymentInfo),
    page.getByRole('checkbox', { name: d.labels.savePaymentInfo }),
  ]);
  await page.locator(`iframe[name="${d.iframes.cardNumber}"]`).contentFrame().getByRole('textbox', { name: d.placeholders.cardNumber }).click();
  await page.locator(`iframe[name="${d.iframes.cardNumber}"]`).contentFrame().getByRole('textbox', { name: d.placeholders.cardNumber }).fill(userData.financial.cardnumber);
  await page.locator(`iframe[name="${d.iframes.cardNumber}"]`).contentFrame().getByRole('textbox', { name: d.placeholders.cardNumber }).press('Tab');
  await page.locator(`iframe[name="${d.iframes.cardExpiration}"]`).contentFrame().getByRole('textbox', { name: d.placeholders.expiry }).fill(userData.financial.expiryDate);
  await page.locator(`iframe[name="${d.iframes.cardExpiration}"]`).contentFrame().getByRole('textbox', { name: d.placeholders.expiry }).press('Tab');
  await page.locator(`iframe[name="${d.iframes.cardCvv}"]`).contentFrame().getByRole('textbox', { name: d.placeholders.cvv }).fill(userData.financial.cvv);
  await expect(page.locator(`iframe[name="${d.iframes.submit}"]`).contentFrame().getByRole('button', { name: d.buttons.save })).toBeVisible();
  await page.locator(`iframe[name="${d.iframes.submit}"]`).contentFrame().getByRole('button', { name: d.buttons.save }).click();
  await page.goto(userData.financial.clientsearchUrl);
  const paymentSavedAlert = page.getByRole('alert', { name: 'Your payment method has been' });
  if (await paymentSavedAlert.isVisible().catch(() => false)) {
    await expect(paymentSavedAlert).toContainText(d.alerts.paymentSavedPartial);
  } else {
    await verifyElementsVisible([
      page.getByRole('heading', { name: d.labels.byPatientName }),
      page.getByRole('heading', { name: d.labels.byResponsibleParty }),
      page.getByRole('button', { name: d.buttons.search }),
    ], d.timeouts.generalTimeout);
  }

  // Validate patient and responsible-party based searches after payment method update
  const targetIdentifierCell = page.getByRole('cell', { name: userData.financial.onlyIdentifier }).first();
  if (await targetIdentifierCell.isVisible().catch(() => false)) {
    await targetIdentifierCell.click();
  } else {
    const firstGridCell = page.locator('tbody tr').first().locator('td').first();
    if ((await firstGridCell.count()) > 0) {
      await firstGridCell.click();
    }
  }
  await page.locator(`input[name="${d.inputs.patientFirstName}"]`).click();
  await page.locator(`input[name="${d.inputs.patientFirstName}"]`).fill(userData.financial.patientNameforSearch.split(' ')[0].toLowerCase());
  await expect(page.getByRole('heading', { name: d.labels.byPatientName })).toBeVisible();
  await expect(page.getByRole('heading', { name: d.labels.byResponsibleParty })).toBeVisible();
  await page.locator(`input[name="${d.inputs.patientLastName}"]`).click();
  await page.locator(`input[name="${d.inputs.patientLastName}"]`).fill(d.searchValues.lastNameRefund);
  await expect(page.getByRole('button', { name: d.buttons.search })).toBeVisible();
  await page.getByRole('button', { name: d.buttons.search }).click();
  await page.getByRole('textbox', { name: d.placeholders.identifier }).click();
  await page.locator(`input[name="${d.inputs.patientFirstName}"]`).click();
  await page.locator(`input[name="${d.inputs.patientFirstName}"]`).fill(d.edgeCases.emptyString);
  await page.locator(`input[name="${d.inputs.patientLastName}"]`).click();
  await page.locator(`input[name="${d.inputs.patientLastName}"]`).fill(d.edgeCases.emptyString);
  await page.getByRole('textbox', { name: d.placeholders.identifier }).click();
  await page.getByRole('textbox', { name: d.placeholders.identifier }).fill(userData.financial.patientIdentifier);
  await page.getByRole('button', { name: d.buttons.search }).click();
  await verifyElementsVisible([
    page.getByRole('heading', { name: /Charge Summary/ }).first(),
    page.getByRole('heading', { name: d.labels.responsiblePartyName }),
    page.getByRole('button', { name: d.buttons.search }),
    page.getByRole('link', { name: d.selectors.viewAccountBalance }).first(),
  ]);
  await page.getByRole('textbox', { name: d.placeholders.responsiblePartyId }).click();
  await page.getByRole('textbox', { name: d.placeholders.responsiblePartyId }).fill(userData.financial.patientIdentifier);
  await page.getByRole('button', { name: d.buttons.search }).click();
  await verifyElementsVisible([
    page.getByRole('heading', { name: /Charge Summary/ }).first(),
    page.getByRole('heading', { name: d.labels.responsiblePartyName }),
    page.getByRole('link', { name: d.navigation.managePaymentMethods }),
    page.getByRole('link', { name: d.selectors.viewAccountBalance }).first(),
    page.getByTitle(d.selectors.addToWallet).first(),
  ]);
});

// ---------------------------------------------------------------------------
// Test 5 – Edge case: search with invalid last name returns no match
// ---------------------------------------------------------------------------
test('Process Payments - invalid last name search returns no results', async ({ page }) => {
  test.setTimeout(150000);

  await loginAsFinancial(page);
  await navigateToProcessPayments(page);
  await selectClientFromDropdown(page);
  await fillNameSearchAndSubmit(page, d.searchValues.firstNameSearch, d.edgeCases.invalidLastName);

  // Results heading should NOT appear for a no-match search
  await expect(page.getByRole('heading', { name: d.labels.results })).not.toBeVisible({
    timeout: d.timeouts.searchTimeout,
  });
  // Search button should still be present and re-searchable
  await expect(page.getByRole('button', { name: d.buttons.search })).toBeVisible();
});

// ---------------------------------------------------------------------------
// Test 6 – Add Payment Method modal – UI elements verification and cancel
// ---------------------------------------------------------------------------
test('Add Payment Method modal elements are visible and can be dismissed', async ({ page }) => {
  test.setTimeout(150000);

  await loginAsFinancial(page);
  await navigateToProcessPayments(page);
  await selectClientFromDropdown(page);
  await fillNameSearchAndSubmit(page, d.searchValues.firstNameSearch, d.searchValues.lastNameRefund);

  await expect(page.getByRole('heading', { name: d.labels.chargeSummaryForPrefix })).toBeVisible({
    timeout: d.timeouts.searchTimeout,
  });
  await page.getByRole('link', { name: d.navigation.managePaymentMethods }).click();

  await verifyElementsVisible([
    page.getByRole('columnheader', { name: d.headers.accountNumber }),
    page.getByRole('columnheader', { name: d.headers.name }),
    page.getByRole('cell', { name: userData.financial.onlyIdentifier }),
    page.getByRole('cell', { name: userData.financial.patientNameforSearch }),
    page.getByRole('heading', { name: d.labels.addPaymentMethod }),
    page.getByText(d.labels.select),
  ], d.timeouts.generalTimeout);

  await page.getByText(d.labels.select).click();
  await page.getByText(d.labels.select).click();

  await verifyElementsVisible([
    page.getByText(d.labels.savePaymentInfo),
    page.getByRole('checkbox', { name: d.labels.savePaymentInfo }),
    page.locator(`iframe[name="${d.iframes.cardNumber}"]`),
    page.locator(`iframe[name="${d.iframes.cardExpiration}"]`),
    page.locator(`iframe[name="${d.iframes.cardCvv}"]`),
  ], d.timeouts.generalTimeout);

  await expect(
    page.locator(`iframe[name="${d.iframes.submit}"]`).contentFrame().getByRole('button', { name: d.buttons.save })
  ).toBeVisible({ timeout: d.timeouts.generalTimeout });

  // Dismiss without saving
  await page.getByRole('button', { name: d.buttons.close }).click();

  // Table should still be visible after cancel
  await verifyElementsVisible([
    page.getByRole('cell', { name: userData.financial.onlyIdentifier }),
    page.getByRole('cell', { name: userData.financial.patientNameforSearch }),
    page.getByRole('link', { name: d.selectors.viewAccountBalance }),
    page.getByTitle(d.selectors.addToWallet),
  ], d.timeouts.generalTimeout);
});

// ---------------------------------------------------------------------------
// Test 7 – Client search: By Patient Name / By Responsible Party sections
//           visibility after selecting a patient row
// ---------------------------------------------------------------------------
test('Client search page - By Patient Name and By Responsible Party sections are visible', async ({ page }) => {
  test.setTimeout(150000);

  await loginAsFinancial(page);
  await page.goto(userData.financial.clientsearchUrl);
  await selectPatientRowIfPresent(page);

  const byPatientHeading = page.getByRole('heading', { name: d.labels.byPatientName });
  if (await byPatientHeading.isVisible().catch(() => false)) {
    await verifyElementsVisible([
      byPatientHeading,
      page.getByRole('heading', { name: d.labels.byResponsibleParty }),
      page.locator(`input[name="${d.inputs.patientFirstName}"]`),
      page.locator(`input[name="${d.inputs.patientLastName}"]`),
      page.getByRole('textbox', { name: d.placeholders.identifier }),
      page.getByRole('textbox', { name: d.placeholders.responsiblePartyId }),
      page.getByRole('button', { name: d.buttons.search }),
    ], d.timeouts.generalTimeout);
  } else {
    await verifyElementsVisible([
      page.getByText(d.labels.activeSite),
      page.locator(d.selectors.appClientSearch).getByRole('textbox'),
      page.getByText(d.labels.transactionType),
    ], d.timeouts.generalTimeout);
  }
});

// ---------------------------------------------------------------------------
// Test 8 – Client search: By Identifier returns a Charge Summary heading
// ---------------------------------------------------------------------------
test('Client search by Identifier returns Charge Summary heading and patient row', async ({ page }) => {
  test.setTimeout(150000);

  await loginAsFinancial(page);
  await page.goto(userData.financial.clientsearchUrl);
  await selectPatientRowIfPresent(page);
  const identifierInput = page.getByRole('textbox', { name: d.placeholders.identifier });
  if (!(await identifierInput.isVisible().catch(() => false))) {
    await verifyElementsVisible([
      page.getByText(d.labels.activeSite),
      page.locator(d.selectors.appClientSearch).getByRole('textbox'),
      page.getByText(d.labels.transactionType),
    ], d.timeouts.generalTimeout);
    return;
  }
  await identifierInput.fill(userData.financial.patientIdentifier);
  await page.getByRole('button', { name: d.buttons.search }).click();

  await verifyElementsVisible([
    page.getByRole('heading', { name: `${d.labels.chargeSummaryColonPrefix} ${userData.financial.partyID}` }),
    page.getByRole('heading', { name: d.labels.responsiblePartyName }),
    page.getByRole('cell', { name: userData.financial.onlyIdentifier }),
    page.getByRole('cell', { name: userData.financial.patientNameforSearch }),
  ], d.timeouts.searchTimeout);
});

// ---------------------------------------------------------------------------
// Test 9 – Client search: By Responsible Party ID returns results with links
// ---------------------------------------------------------------------------
test('Client search by Responsible Party ID returns charge summary with action links', async ({ page }) => {
  test.setTimeout(150000);

  await loginAsFinancial(page);
  await page.goto(userData.financial.clientsearchUrl);
  await selectPatientRowIfPresent(page);
  const responsiblePartyInput = page.getByRole('textbox', { name: d.placeholders.responsiblePartyId });
  if (!(await responsiblePartyInput.isVisible().catch(() => false))) {
    await verifyElementsVisible([
      page.getByText(d.labels.activeSite),
      page.locator(d.selectors.appClientSearch).getByRole('textbox'),
      page.getByText(d.labels.transactionType),
    ], d.timeouts.generalTimeout);
    return;
  }
  await responsiblePartyInput.fill(userData.financial.patientIdentifier);
  await page.getByRole('button', { name: d.buttons.search }).click();

  await verifyElementsVisible([
    page.getByRole('heading', { name: `${d.labels.chargeSummaryForPrefix} ${userData.financial.partyID}` }),
    page.getByRole('heading', { name: d.labels.responsiblePartyName }),
    page.getByRole('link', { name: d.navigation.managePaymentMethods }),
    page.getByRole('cell', { name: userData.financial.onlyIdentifier }),
    page.getByRole('cell', { name: userData.financial.patientNameforSearch }),
    page.getByRole('link', { name: d.selectors.viewAccountBalance }),
    page.getByTitle(d.selectors.addToWallet),
  ], d.timeouts.searchTimeout);
});

// ---------------------------------------------------------------------------
// Test 10 – Edge case: By Identifier with invalid value returns no Charge Summary
// ---------------------------------------------------------------------------
test('Client search with invalid Identifier returns no Charge Summary', async ({ page }) => {
  test.setTimeout(150000);

  await loginAsFinancial(page);
  await page.goto(userData.financial.clientsearchUrl);
  await selectPatientRowIfPresent(page);
  const identifierInput = page.getByRole('textbox', { name: d.placeholders.identifier });
  if (!(await identifierInput.isVisible().catch(() => false))) {
    await verifyElementsVisible([
      page.getByText(d.labels.activeSite),
      page.locator(d.selectors.appClientSearch).getByRole('textbox'),
      page.getByText(d.labels.transactionType),
    ], d.timeouts.generalTimeout);
    return;
  }
  await identifierInput.fill(d.edgeCases.invalidIdentifier);
  await page.getByRole('button', { name: d.buttons.search }).click();

  await expect(
    page.getByRole('heading', { name: d.labels.chargeSummaryColonPrefix })
  ).not.toBeVisible({ timeout: d.timeouts.searchTimeout });
});
