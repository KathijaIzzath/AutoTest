import type { Locator, Page } from '@playwright/test';
import { expect } from '@playwright/test';

/**
 * Pattern A/B helper for mandatory-field negatives.
 * Prefer button-disabled; otherwise click and assert no success toast (short timeout, no sleep).
 */
export async function assertSubmitBlockedWithoutRequired(
  page: Page,
  submitButton: Locator,
  successToast: string | RegExp,
  options?: { toastTimeoutMs?: number },
): Promise<void> {
  const toastTimeoutMs = options?.toastTimeoutMs ?? 2500;
  const disabled = await submitButton.isDisabled().catch(() => false);

  if (disabled) {
    await expect(submitButton, 'Submit must stay disabled when a required field is missing').toBeDisabled();
    return;
  }

  await submitButton.click();
  const toast = page.getByLabel(successToast).first();
  await expect(
    toast,
    'Success toast must not appear when a required field is missing',
  ).not.toBeVisible({ timeout: toastTimeoutMs });
}
