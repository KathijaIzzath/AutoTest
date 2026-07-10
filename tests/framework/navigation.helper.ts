import { expect, type Page } from '@playwright/test';

// ─── Sidebar quick-link expansion ─────────────────────────────────────────────

/** Expands the "AccountsProviders" collapsible group in the left sidebar. */
export async function expandAccountsProvidersQuickLinks(page: Page): Promise<void> {
  await page
    .getByRole('listitem')
    .filter({ hasText: 'AccountsProviders' })
    .getByRole('button')
    .click();
}

// ─── Module-specific navigation ───────────────────────────────────────────────

/**
 * Navigates to the Accounts module.
 * The Accounts link is accessible from the sidebar without expanding a group.
 */
export async function navigateToAccounts(page: Page): Promise<void> {
  await expect(page.locator('a[href$="/dashboard/accounts"]')).toBeVisible();
  await page.locator('a[href$="/dashboard/accounts"]').click();
  await expect(page.locator('app-accounts').getByText('Accounts', { exact: true })).toBeVisible();
}

/**
 * Expands the sidebar group and navigates to the Providers module.
 * Uses href-based locator to avoid strict mode violations with similarly-named links.
 */
export async function navigateToProviders(page: Page): Promise<void> {
  await expandAccountsProvidersQuickLinks(page);
  await expect(page.locator('a[href$="/dashboard/providers"]')).toBeVisible();
  await page.locator('a[href$="/dashboard/providers"]').click();
  await expect(page.locator('app-providers').getByText('Providers', { exact: true })).toBeVisible();
}

/**
 * Expands the sidebar group and navigates to the Provider Groups module.
 */
export async function navigateToProviderGroups(page: Page): Promise<void> {
  await expandAccountsProvidersQuickLinks(page);
  await expect(page.locator('a[href$="/dashboard/provider-groups"]')).toBeVisible();
  await page.locator('a[href$="/dashboard/provider-groups"]').click();
  await expect(page.getByText('Provider Groups', { exact: true })).toBeVisible();
}

/**
 * Expands the sidebar group and navigates to the Payer module.
 */
export async function navigateToPayer(page: Page): Promise<void> {
  await expandAccountsProvidersQuickLinks(page);
  const payerLink = page.getByRole('link', { name: /Payer/i }).first();
  await expect(payerLink).toBeVisible();
  await payerLink.click();
  await expect(page.locator('app-payers').getByText('Payer', { exact: true })).toBeVisible();
}

/** Expands the "PayerInsuranceEligibility" collapsible group in the left sidebar. */
export async function expandPayerInsuranceEligibilityQuickLinks(page: Page): Promise<void> {
  await page
    .getByRole('listitem')
    .filter({ hasText: 'PayerInsuranceEligibility' })
    .getByRole('button')
    .click();
}

/** Expands the sidebar group and navigates to the Insurance module. */
export async function navigateToInsurance(page: Page): Promise<void> {
  await expandPayerInsuranceEligibilityQuickLinks(page);
  await expect(page.locator('a[href$="/dashboard/insurances"]')).toBeVisible();
  await page.locator('a[href$="/dashboard/insurances"]').click();
  await expect(page.locator('app-insurances').getByText('Insurance', { exact: true })).toBeVisible();
}

/** Expands the sidebar group and navigates to the Eligibility Routing module. */
export async function navigateToEligibilityRouting(page: Page): Promise<void> {
  await expandPayerInsuranceEligibilityQuickLinks(page);
  await expect(page.locator('a[href$="/dashboard/eligibility-routing"]')).toBeVisible();
  await page.locator('a[href$="/dashboard/eligibility-routing"]').click();
  await expect(page.locator('app-eligibility-routing').getByText('Eligibility Routing', { exact: true })).toBeVisible();
}

/** Expands the sidebar group and navigates to the Claim Status Routing module. */
export async function navigateToClaimStatusRouting(page: Page): Promise<void> {
  await expandPayerInsuranceEligibilityQuickLinks(page);
  const byHref = page.locator('a[href$="/dashboard/claim-status-routing"]').first();
  const byText = page.getByRole('link', { name: /Claims?\s+Status\s+Routing/i }).first();

  if (await byHref.isVisible().catch(() => false)) {
    await byHref.click();
  } else {
    await expect(byText).toBeVisible();
    await byText.click();
  }

  await expect(page.getByText('Claim Status Routing', { exact: true })).toBeVisible();
}

/** Navigates to the Claims dashboard module. */
export async function navigateToClaimsDashboard(page: Page): Promise<void> {
  const byHref = page.locator('a[href$="/dashboard/claims"]').first();
  const byText = page.getByRole('link', { name: /Claims/i }).first();

  if (await byHref.isVisible().catch(() => false)) {
    await byHref.click();
  } else {
    await expect(byText).toBeVisible();
    await byText.click();
  }

  await expect(page.getByRole('button', { name: 'Claims', exact: true })).toBeVisible();
}

/** Navigates to the Claims Archive dashboard from the Claims module. */
export async function navigateToClaimsArchiveDashboard(page: Page): Promise<void> {
  await navigateToClaimsDashboard(page);
  const archiveButton = page.getByRole('button', { name: /Claims Archive/i }).first();
  await expect(archiveButton).toBeVisible();
  await archiveButton.click();

  await expect(page.getByText(/start date/i)).toBeVisible();
  await expect(page.getByRole('button', { name: /Apply Filter/i })).toBeVisible();
}

// ─── Legacy generic helpers ───────────────────────────────────────────────────

/** Clicks any quick-link by name after the sidebar group has been expanded. */
export async function openQuickLink(page: Page, name: string | RegExp): Promise<void> {
  await page.getByRole('link', { name }).first().click();
}

/** One-shot: expands the sidebar group and clicks a module link by name. */
export async function openAccountsProvidersModule(page: Page, moduleName: string | RegExp): Promise<void> {
  await expandAccountsProvidersQuickLinks(page);
  await openQuickLink(page, moduleName);
}
