import { expect, type Locator } from '@playwright/test';

/**
 * Verifies each locator in the list is visible.
 */
export async function verifyElementsVisible(elements: Locator[], timeout = 10000): Promise<void> {
  for (const element of elements) {
    await expect(element).toBeVisible({ timeout });
  }
}

/**
 * Verifies a list of async element checks in sequence.
 */
export async function runElementChecks(checks: Array<() => Promise<void>>): Promise<void> {
  for (const check of checks) {
    await check();
  }
}
