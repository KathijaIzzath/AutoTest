import { chromium, type Page } from '@playwright/test';
import * as fs from 'fs';
import * as userData from './testData/UserInfo.json';
import { executeQuery } from './testData/database.utils';

const INFRA_STATUS_PATH = 'test-results/infra-status.json';

type AuthStatus = 'ok' | 'degraded' | 'down';

interface InfraStatus {
  generatedAt: string;
  failOnAuthUnavailable: boolean;
  auth: {
    status: AuthStatus;
    attempts: number;
    healthChecks: number;
    usedStorageFallback: boolean;
    message: string;
  };
  db: {
    status: 'ok' | 'warning';
    warnings: string[];
  };
  warnings: string[];
}

function persistInfraStatus(status: InfraStatus): void {
  fs.mkdirSync('test-results', { recursive: true });
  fs.writeFileSync(INFRA_STATUS_PATH, JSON.stringify(status, null, 2), 'utf-8');
}

// ─── DB prerequisite setup ────────────────────────────────────────────────────
// Runs unconditionally before every test suite execution.
// Ensures all timestamps, enrollment records and feature data are current.

async function runDbPrerequisites(): Promise<{ warnings: string[] }> {
  const now = new Date().toISOString();
  console.log('[DB setup] Running prerequisites with timestamp:', now);
  const warnings: string[] = [];

  const run = async (label: string, sql: string, params: any[] = []) => {
    try {
      await executeQuery(sql, params);
      console.log(`[DB setup] ✓ ${label}`);
    } catch (err) {
      const message = `${label} failed (non-fatal): ${(err as Error).message}`;
      console.warn(`[DB setup] ⚠ ${message}`);
      warnings.push(message);
    }
  };

  // ── 1. Claims: push all timestamps to today so 90-day report window contains them ──
  await run('claims hintimestamp + dateofservice → now',
    'UPDATE claims SET hintimestamp = $1, dateofservice = $2', [now, now]);

  // ── 2. ERA: update effective dates ───────────────────────────────────────────
  await run('eramain effectivedate (G26890/TREST) → now',
    'UPDATE eramain SET effectivedate = $1 WHERE id = $2 AND payerid = $3',
    [now, 'G26890', 'TREST']);

  await run('eramain effectivedate (payerid 61101) → now',
    'UPDATE eramain SET effectivedate = $1 WHERE payerid = $2', [now, '61101']);

  await run('eramain dateadded → now',
    'UPDATE eramain SET dateadded = $1', [now]);

  // ── 3. Claims by payer/provider ───────────────────────────────────────────────
  await run('claims hintimestamp (Y00680/P15487) → now',
    'UPDATE claims SET hintimestamp = $1 WHERE payerid = $2 AND providerid = $3',
    [now, 'Y00680', 'P15487']);

  // ── 4. Rejected claims (F2) → today ──────────────────────────────────────────
  await run('claims hintimestamp (claimStatus=F2) → now',
    'UPDATE claims SET hintimestamp = $1 WHERE claimStatus = $2', [now, 'F2']);

  // ── 5. Group enrollment: update agreement dates for C/D/M/P/A statuses ──────
  await run('groupenrollment agreementSentDate+deniedDate (all active statuses) → now',
    `UPDATE groupenrollment
       SET agreementSentDate = $1, agreementDeniedDate = $2
     WHERE enrollmentStatus IN ($3, $4, $5, $6, $7)`,
    [now, now, 'C', 'D', 'M', 'P', 'A']);

  // ── 6. Remittance creation date ───────────────────────────────────────────────
  await run('remittance creationdate → now',
    'UPDATE remittance SET creationdate = $1', [now]);

  // ── 7. Payer-rejection test claims (A3) ──────────────────────────────────────
  const payerRejClaimIds = ['G234962207071312193U', 'G234962207071241121F'];
  const placeholders = payerRejClaimIds.map((_, i) => `$${i + 1}`).join(', ');
  await run(`claims claimstatus=A3 for ${payerRejClaimIds.join(', ')}`,
    `UPDATE claims SET claimstatus = 'A3' WHERE claimid IN (${placeholders})`,
    payerRejClaimIds);

  // ── 8. Ensure G00014 (single-pay enrollment) records have today's dates ───────
  // Column is 'id' (the group G-number), not 'reportid'
  await run('groupenrollment dates for G00014 → now',
    `UPDATE groupenrollment
       SET agreementSentDate = $1, agreementDeniedDate = $2, datelastdbupdate = $3
     WHERE id = $4`,
    [now, now, now, 'G00014']);

  // If G00014 still has no enrollments, warn the operator
  try {
    const g14rows = await executeQuery(
      `SELECT COUNT(*) AS cnt FROM groupenrollment WHERE id = $1`, ['G00014']
    );
    const g14count = Number(g14rows?.[0]?.cnt ?? 0);
    if (g14count === 0) {
      const message = 'No enrollment records found for G00014. Enrollment dashboard tests may fail.';
      console.warn('[DB setup] ⚠ ' + message + ' Ensure G00014 has active groupenrollment rows.');
      warnings.push(message);
    } else {
      console.log(`[DB setup] ✓ G00014 has ${g14count} enrollment record(s)`);
    }
  } catch (err) {
    const message = `Could not verify G00014 enrollments: ${(err as Error).message}`;
    console.warn('[DB setup] ⚠ ' + message);
    warnings.push(message);
  }

  // ── 9. Ensure G00017 (bulk enrollment) records have today's dates ─────────────
  // Column is 'id' (the group G-number), not 'reportid'
  await run('groupenrollment dates for G00017 → now',
    `UPDATE groupenrollment
       SET agreementSentDate = $1, agreementDeniedDate = $2, datelastdbupdate = $3
     WHERE id = $4`,
    [now, now, now, 'G00017']);

  try {
    const g17rows = await executeQuery(
      `SELECT COUNT(*) AS cnt FROM groupenrollment WHERE id = $1`, ['G00017']
    );
    const g17count = Number(g17rows?.[0]?.cnt ?? 0);
    if (g17count === 0) {
      const message = 'No enrollment records found for G00017. Bulk enrollment dashboard tests may fail.';
      console.warn('[DB setup] ⚠ ' + message + ' Ensure G00017 has active groupenrollment rows.');
      warnings.push(message);
    } else {
      console.log(`[DB setup] ✓ G00017 has ${g17count} enrollment record(s)`);
    }
  } catch (err) {
    const message = `Could not verify G00017 enrollments: ${(err as Error).message}`;
    console.warn('[DB setup] ⚠ ' + message);
    warnings.push(message);
  }

  console.log('[DB setup] All prerequisite queries complete.');
  return { warnings };
}


async function submitAdminLogin(page: Page): Promise<void> {
  await page.getByRole('textbox', { name: 'Enter Username' }).click();
  await page.getByRole('textbox', { name: 'Enter Username' }).fill(userData.admin.username);
  await page.getByRole('textbox', { name: 'Enter Password' }).click();
  await page.getByRole('textbox', { name: 'Enter Password' }).fill(userData.admin.password);
  await page.getByRole('button', { name: 'Log In' }).click();
}

async function waitForDashboardReady(page: Page): Promise<boolean> {
  const dashboardUrlPattern = /\/SecureConnectWeb\/dashboard(\/home)?/i;

  const urlReady = await page
    .waitForURL(dashboardUrlPattern, { timeout: 45000 })
    .then(() => true)
    .catch(() => false);
  if (urlReady) {
    return true;
  }

  const claimsLinkReady = await page
    .getByRole('link', { name: /Claims/i })
    .first()
    .isVisible({ timeout: 5000 })
    .catch(() => false);
  if (claimsLinkReady) {
    return true;
  }

  const applyFilterReady = await page
    .getByRole('button', { name: /Apply Filter/i })
    .first()
    .isVisible({ timeout: 5000 })
    .catch(() => false);

  return applyFilterReady;
}

async function verifyAuthHealth(page: Page, url: string): Promise<{ healthy: boolean; checks: number; lastError: string }> {
  let checks = 0;
  let lastError = 'unknown error';

  for (let attempt = 1; attempt <= 3; attempt += 1) {
    checks = attempt;
    try {
      await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 30000 });
      const usernameReady = await page
        .getByRole('textbox', { name: 'Enter Username' })
        .isVisible({ timeout: 5000 })
        .catch(() => false);
      const passwordReady = await page
        .getByRole('textbox', { name: 'Enter Password' })
        .isVisible({ timeout: 5000 })
        .catch(() => false);

      if (usernameReady && passwordReady) {
        return { healthy: true, checks, lastError: '' };
      }

      lastError = 'login form was not visible';
    } catch (error) {
      lastError = (error as Error).message;
    }
  }

  return { healthy: false, checks, lastError };
}

async function globalSetup() {
  const failOnAuthUnavailable = process.env.FAIL_ON_AUTH_UNAVAILABLE === 'true';
  const infraStatus: InfraStatus = {
    generatedAt: new Date().toISOString(),
    failOnAuthUnavailable,
    auth: {
      status: 'ok',
      attempts: 0,
      healthChecks: 0,
      usedStorageFallback: false,
      message: 'Authentication checks not started.',
    },
    db: {
      status: 'ok',
      warnings: [],
    },
    warnings: [],
  };

  // ── Step 1: Run all DB prerequisites first ───────────────────────────────────
  const dbResult = await runDbPrerequisites();
  if (dbResult.warnings.length > 0) {
    infraStatus.db.status = 'warning';
    infraStatus.db.warnings = dbResult.warnings;
    infraStatus.warnings.push(...dbResult.warnings.map((message) => `DB: ${message}`));
  }

  // ── Step 2: Browser login + storageState ─────────────────────────────────────
  const browser = await chromium.launch();
  const page = await browser.newPage();
  console.log('Global setup: opening admin login page');

  const authHealth = await verifyAuthHealth(page, userData.admin.url);
  infraStatus.auth.healthChecks = authHealth.checks;

  if (!authHealth.healthy) {
    infraStatus.auth.status = 'down';
    infraStatus.auth.message = `Auth health-check failed after ${authHealth.checks} attempts: ${authHealth.lastError}`;
    infraStatus.warnings.push(`AUTH: ${infraStatus.auth.message}`);

    const hasExistingStorageState = fs.existsSync('storageState.json');
    if (hasExistingStorageState && !failOnAuthUnavailable) {
      infraStatus.auth.usedStorageFallback = true;
      infraStatus.auth.status = 'degraded';
      infraStatus.auth.message += ' Fallback to existing storageState.json was used.';
      persistInfraStatus(infraStatus);
      console.warn('Global setup: auth health-check failed, reusing existing storageState.json as fallback.');
      await browser.close();
      return;
    }

    persistInfraStatus(infraStatus);
    await browser.close();
    throw new Error(
      failOnAuthUnavailable
        ? `Infrastructure failure: ${infraStatus.auth.message}`
        : `Global setup login is unavailable and no fallback storage state is usable: ${infraStatus.auth.message}`
    );
  }

  let ready = false;
  let lastError: unknown = null;

  for (let attempt = 1; attempt <= 3; attempt += 1) {
    infraStatus.auth.attempts = attempt;
    try {
      await page.goto(userData.admin.url, { waitUntil: 'domcontentloaded' });
      await submitAdminLogin(page);
      ready = await waitForDashboardReady(page);
      if (ready) {
        break;
      }
    } catch (error) {
      lastError = error;
    }
  }

  if (!ready) {
    infraStatus.auth.status = 'down';
    infraStatus.auth.message = `Login failed after ${infraStatus.auth.attempts} attempts. Last error: ${String(lastError ?? 'dashboard did not become ready')}`;
    infraStatus.warnings.push(`AUTH: ${infraStatus.auth.message}`);
    const hasExistingStorageState = fs.existsSync('storageState.json');
    if (hasExistingStorageState && !failOnAuthUnavailable) {
      infraStatus.auth.usedStorageFallback = true;
      infraStatus.auth.status = 'degraded';
      infraStatus.auth.message += ' Fallback to existing storageState.json was used.';
      persistInfraStatus(infraStatus);
      console.warn('Global setup: login retries failed, reusing existing storageState.json as fallback.');
      await browser.close();
      return;
    }

    persistInfraStatus(infraStatus);
    await browser.close();
    throw new Error(
      failOnAuthUnavailable
        ? `Infrastructure failure: ${infraStatus.auth.message}`
        : `Global setup login failed after retries. Last error: ${String(lastError ?? 'dashboard did not become ready')}`
    );
  }

  infraStatus.auth.status = 'ok';
  infraStatus.auth.message = `Login succeeded after ${infraStatus.auth.attempts} attempt(s).`;

  await page.context().storageState({ path: 'storageState.json' });

  // ── Step 3: Verify Analytics feature is deployed in this environment ─────────
  try {
    const analyticsLink = page.getByRole('link', { name: /Analytics/i });
    const analyticsVisible = await analyticsLink.isVisible({ timeout: 5000 }).catch(() => false);
    if (analyticsVisible) {
      console.log('[Feature check] ✓ Analytics menu item is present in the navigation.');
    } else {
      console.warn(
        '[Feature check] ⚠ Analytics menu item NOT found in navigation. ' +
        'Analytics module tests (01_Analytics_Dshbd, 02_ClaimsSummary, 04_PayerRejected, 05_ERASummary) ' +
        'will likely fail in this environment. Verify the Analytics feature is deployed.'
      );
    }
  } catch (err) {
    console.warn('[Feature check] ⚠ Analytics check failed:', (err as Error).message);
  }

  persistInfraStatus(infraStatus);

  await browser.close();
}


export default globalSetup;
