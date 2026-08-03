/**
 * Environment-aware UserInfo accessor.
 * Rewrites all SecureConnect app URLs to the active TEST_ENV origin.
 */
import rawUserData from './UserInfo.json';
import {
  getAccountsDashboardUrl,
  getClientSearchUrl,
  getDashboardUrl,
  getLoginUrl,
  getTestEnv,
  rewriteAppUrl,
} from './env-config';

type JsonValue = string | number | boolean | null | JsonObject | JsonValue[];
interface JsonObject {
  [key: string]: JsonValue;
}

function deepRewriteUrls(value: JsonValue): JsonValue {
  if (typeof value === 'string') {
    return rewriteAppUrl(value);
  }
  if (Array.isArray(value)) {
    return value.map((item) => deepRewriteUrls(item));
  }
  if (value && typeof value === 'object') {
    const out: JsonObject = {};
    for (const [key, child] of Object.entries(value)) {
      out[key] = deepRewriteUrls(child as JsonValue);
    }
    return out;
  }
  return value;
}

const cloned = deepRewriteUrls(rawUserData as unknown as JsonValue) as typeof rawUserData;

// Explicit overrides so login/dashboard paths always match the active env,
// even if UserInfo.json drifts.
cloned.admin = {
  ...cloned.admin,
  url: getLoginUrl(),
  dashboardUrl: getDashboardUrl(),
};

if (cloned.qauser) {
  cloned.qauser = {
    ...cloned.qauser,
    qaurl: getLoginUrl(),
    qadashboardUrl: getDashboardUrl(),
  };
}

cloned.accountsdashboardurl = getAccountsDashboardUrl();

if (cloned.financial) {
  cloned.financial = {
    ...cloned.financial,
    clientsearchUrl: getClientSearchUrl(),
  };
}

if (cloned.staginguser) {
  cloned.staginguser = {
    ...cloned.staginguser,
    stagingurl: getLoginUrl('staging'),
  };
}

console.log(`[user-info] Loaded credentials for TEST_ENV=${getTestEnv()} → ${cloned.admin.url}`);

export default cloned;
export const userData = cloned;
