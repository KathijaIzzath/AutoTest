/**
 * Multi-environment config for AutoTest.
 *
 * TEST_ENV=qa      → qnk1scltweb02 (default; daily cron always uses this)
 * TEST_ENV=staging → scdemo.pulseinc.com + staging DB (pnk1scstgaio)
 */
export type TestEnvironment = 'qa' | 'staging';

export interface DbConfig {
  user: string;
  host: string;
  database: string;
  password: string;
  port: number;
}

export interface EnvDefinition {
  name: TestEnvironment;
  label: string;
  baseOrigin: string;
  db: DbConfig;
}

const QA_ORIGIN = 'https://qnk1scltweb02.pulseinc.com';
const STAGING_ORIGIN = 'https://scdemo.pulseinc.com';

const ENVIRONMENTS: Record<TestEnvironment, EnvDefinition> = {
  qa: {
    name: 'qa',
    label: 'QA (qnk1scltweb02)',
    baseOrigin: QA_ORIGIN,
    db: {
      user: 'sc_app',
      host: 'Qnk1scltdb02.ict.pulseinc.com',
      database: 'scltdb2',
      password: 'xyP,xii78',
      port: 5432,
    },
  },
  staging: {
    name: 'staging',
    label: 'Staging (scdemo)',
    baseOrigin: STAGING_ORIGIN,
    db: {
      user: 'sc_app',
      host: 'pnk1scstgaio.ict.pulseinc.com',
      database: 'scltdb2',
      password: 'xyP,xii78',
      port: 5432,
    },
  },
};

const KNOWN_ORIGINS = [QA_ORIGIN, STAGING_ORIGIN];

/**
 * Resolve active environment.
 * - Scheduled / default CI runs are forced to QA.
 * - TEST_ENV=staging|scdemo selects staging.
 * - Anything else falls back to QA.
 */
export function getTestEnv(): TestEnvironment {
  // Daily cron and normal CI must never accidentally hit staging.
  if (process.env.GITHUB_EVENT_NAME === 'schedule') {
    return 'qa';
  }

  const forced = (process.env.FORCE_TEST_ENV || '').trim().toLowerCase();
  if (forced === 'qa' || forced === 'staging') {
    return forced;
  }

  const raw = (process.env.TEST_ENV || 'qa').trim().toLowerCase();
  if (raw === 'staging' || raw === 'scdemo') {
    return 'staging';
  }
  return 'qa';
}

export function getEnvDefinition(env: TestEnvironment = getTestEnv()): EnvDefinition {
  return ENVIRONMENTS[env];
}

export function getBaseOrigin(env: TestEnvironment = getTestEnv()): string {
  return getEnvDefinition(env).baseOrigin;
}

export function getDbConfig(env: TestEnvironment = getTestEnv()): DbConfig {
  return { ...getEnvDefinition(env).db };
}

export function getLoginUrl(env: TestEnvironment = getTestEnv()): string {
  return `${getBaseOrigin(env)}/SecureConnectWeb/login`;
}

export function getDashboardUrl(env: TestEnvironment = getTestEnv()): string {
  return `${getBaseOrigin(env)}/SecureConnectWeb/dashboard/home`;
}

export function getAccountsDashboardUrl(env: TestEnvironment = getTestEnv()): string {
  return `${getBaseOrigin(env)}/SecureConnectWeb/dashboard/accounts`;
}

export function getClientSearchUrl(env: TestEnvironment = getTestEnv()): string {
  return `${getBaseOrigin(env)}/SecureConnectWeb/dashboard/client-search`;
}

/** Rewrite any known app origin in a URL to the active environment origin. */
export function rewriteAppUrl(url: string, env: TestEnvironment = getTestEnv()): string {
  if (!url || typeof url !== 'string') return url;
  const origin = getBaseOrigin(env);
  let out = url;
  for (const known of KNOWN_ORIGINS) {
    out = out.split(known).join(origin);
  }
  return out;
}

export function logActiveEnvironment(): void {
  const env = getTestEnv();
  const def = getEnvDefinition(env);
  console.log(`[env] Active test environment: ${def.label}`);
  console.log(`[env] App origin: ${def.baseOrigin}`);
  console.log(`[env] DB: ${def.db.user}@${def.db.host}:${def.db.port}/${def.db.database}`);
}
