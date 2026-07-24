/**
 * Runs the prerequisite DB updates required before executing the Payer Rejection
 * Report tests.  Updates timestamps to NOW() so that today's claims appear in
 * the 90-day report window and sets the test claim statuses to the expected code.
 *
 * @param claimIds          - Specific claim IDs to set to the payer-rejection status
 * @param payerRejStatus    - Claim status code that maps to a payer rejection reason (e.g. 'A3')
 */
export async function setupPayerRejectionData(
  claimIds: string[],
  payerRejStatus: string = 'A3',
): Promise<void> {
  if (claimIds.length === 0) return;

  const now = new Date().toISOString();
  const placeholders = claimIds.map((_, i) => `$${i + 1}`).join(', ');

  // 1. Set specific claims to the payer-rejection status
  await executeQuery(
    `UPDATE claims SET claimstatus = '${payerRejStatus}' WHERE claimid IN (${placeholders})`,
    claimIds,
  );

  // 2. Push all claim timestamps to now so they appear in today's 90-day window
  await executeQuery(`UPDATE claims SET hintimestamp = $1`, [now]);

  // 3. Push ERA main date
  await executeQuery(`UPDATE eramain SET dateadded = $1`, [now]);

  // 4. Push remittance creation date
  try {
    await executeQuery(`UPDATE remittance SET creationdate = $1`, [now]);
  } catch {
    // remittance table may not exist in all environments
    console.warn('[setupPayerRejectionData] remittance update skipped (table may not exist).');
  }

  console.log(`[setupPayerRejectionData] Setup complete. Timestamps set to: ${now}`);
}

/**
 * Verifies that specific claims exist with the expected status and group in the DB.
 */
export async function verifyClaimSetup(
  claimIds: string[],
  expectedStatus: string,
  expectedGroupId: string,
): Promise<Array<{ claimid: string; claimstatus: string; reportid: string; hintimestamp: string }>> {
  if (claimIds.length === 0) return [];
  const placeholders = claimIds.map((_, i) => `$${i + 1}`).join(', ');
  const query = `
    SELECT claimid, claimstatus, reportid, hintimestamp::text AS hintimestamp
    FROM claims
    WHERE claimid IN (${placeholders});
  `;
  const result = await executeQuery(query, claimIds);
  for (const row of result ?? []) {
    if (row.claimstatus !== expectedStatus) {
      console.warn(`[verifyClaimSetup] ${row.claimid} has status ${row.claimstatus}, expected ${expectedStatus}`);
    }
    if (row.reportid !== expectedGroupId) {
      console.warn(`[verifyClaimSetup] ${row.claimid} has reportid ${row.reportid}, expected ${expectedGroupId}`);
    }
  }
  return result ?? [];
}

/**
 * Returns the total payer-rejected claim count for a group within a MM/DD/YYYY date range.
 * Used to cross-validate the Totals row of the Payer Rejection Report.
 */
export async function fetchPayerRejectionTotals(
  groupId: string,
  startDateMMDDYYYY: string,
  endDateMMDDYYYY: string,
): Promise<{ totalRejected: number }> {
  const toSql = (mmddyyyy: string): string | null => {
    const p = mmddyyyy.split('/');
    if (p.length !== 3) return null;
    return `${p[2]}-${p[0].padStart(2, '0')}-${p[1].padStart(2, '0')}`;
  };
  const start = toSql(startDateMMDDYYYY);
  const end   = toSql(endDateMMDDYYYY);
  if (!start || !end) return { totalRejected: 0 };

  const query = `
    SELECT COUNT(*)::int AS total_rejected
    FROM claims c
    LEFT JOIN remitreason rmt ON c.claimstatus = rmt.code
    WHERE c.reportid = $1
      AND c.hintimestamp::date >= $2::date
      AND c.hintimestamp::date <= $3::date
      AND rmt.apicategory IN ('REJECTED', 'FINALIZED_DENIED');
  `;
  try {
    const result = await executeQuery(query, [groupId, start, end]);
    return { totalRejected: Number(result?.[0]?.total_rejected ?? 0) };
  } catch (err) {
    console.warn('[fetchPayerRejectionTotals] Query failed:', err);
    return { totalRejected: 0 };
  }
}

/**
 * Returns the total SC-rejected claim count for a group within a MM/DD/YYYY date range.
 * Used to cross-validate the Totals row of the SC Rejection Summary Report.
 * SC-rejected claims have remitreason.apicategory = 'SC_REJECTED'.
 */
export async function fetchScRejectionTotals(
  groupId: string,
  startDateMMDDYYYY: string,
  endDateMMDDYYYY: string,
): Promise<{ totalRejected: number }> {
  const toSql = (mmddyyyy: string): string | null => {
    const p = mmddyyyy.split('/');
    if (p.length !== 3) return null;
    return `${p[2]}-${p[0].padStart(2, '0')}-${p[1].padStart(2, '0')}`;
  };
  const start = toSql(startDateMMDDYYYY);
  const end   = toSql(endDateMMDDYYYY);
  if (!start || !end) return { totalRejected: 0 };

  const query = `
    SELECT COUNT(*)::int AS total_rejected
    FROM claims c
    LEFT JOIN remitreason rmt ON c.claimstatus = rmt.code
    WHERE c.reportid = $1
      AND c.hintimestamp::date >= $2::date
      AND c.hintimestamp::date <= $3::date
      AND rmt.apicategory = 'SC_REJECTED';
  `;
  try {
    const result = await executeQuery(query, [groupId, start, end]);
    return { totalRejected: Number(result?.[0]?.total_rejected ?? 0) };
  } catch (err) {
    console.warn('[fetchScRejectionTotals] Query failed:', err);
    return { totalRejected: 0 };
  }
}

/**
 * Returns claim summary totals for a single provider group within a MM/DD/YYYY date range.
 * Mirrors the Totals row shown at the bottom of the Group Claim Summary report.
 *
 * @param groupId           - Provider group G-number  (e.g. 'G23496')
 * @param startDateMMDDYYYY - Start date in MM/DD/YYYY format
 * @param endDateMMDDYYYY   - End date  in MM/DD/YYYY format
 */
export async function fetchClaimSummaryTotals(
  groupId: string,
  startDateMMDDYYYY: string,
  endDateMMDDYYYY: string,
): Promise<{
  claimsSent: number;
  scRejected: number;
  noResponse: number;
  payerRejected: number;
  passed: number;
}> {
  const empty = { claimsSent: 0, scRejected: 0, noResponse: 0, payerRejected: 0, passed: 0 };

  const toSql = (mmddyyyy: string): string | null => {
    const parts = mmddyyyy.split('/');
    if (parts.length !== 3) return null;
    const [mm, dd, yyyy] = parts;
    return `${yyyy}-${mm.padStart(2, '0')}-${dd.padStart(2, '0')}`;
  };

  const start = toSql(startDateMMDDYYYY);
  const end   = toSql(endDateMMDDYYYY);
  if (!start || !end) {
    console.warn('[fetchClaimSummaryTotals] Invalid date format. Expected MM/DD/YYYY.');
    return empty;
  }

  const query = `
    SELECT
      COUNT(*)::int                                                              AS claims_sent,
      COUNT(*) FILTER (WHERE rmt.apicategory = 'SC_REJECTED')::int              AS sc_rejected,
      COUNT(*) FILTER (
        WHERE rmt.apicategory IN ('REJECTED', 'FINALIZED_DENIED')
      )::int                                                                     AS payer_rejected,
      COUNT(*) FILTER (WHERE rmt.code IS NULL)::int                             AS no_response,
      COUNT(*) FILTER (
        WHERE rmt.apicategory IN ('FINALIZED_PAID', 'ACCEPTED')
      )::int                                                                     AS passed
    FROM claims c
    LEFT JOIN remitreason rmt ON c.claimstatus = rmt.code
    WHERE c.reportid = $1
      AND c.hintimestamp::date >= $2::date
      AND c.hintimestamp::date <= $3::date;
  `;

  try {
    const result = await executeQuery(query, [groupId, start, end]);
    if (!result || result.length === 0) return empty;
    const row = result[0];
    return {
      claimsSent:    Number(row.claims_sent    ?? 0),
      scRejected:    Number(row.sc_rejected    ?? 0),
      noResponse:    Number(row.no_response    ?? 0),
      payerRejected: Number(row.payer_rejected ?? 0),
      passed:        Number(row.passed         ?? 0),
    };
  } catch (err) {
    console.warn('[fetchClaimSummaryTotals] Query failed — cross-validation skipped:', err);
    return empty;
  }
}

/**
 * Returns analytics claim summary counts for a given MM/DD/YYYY date range.
 * Used to cross-validate the stat cards shown on the Analytics Dashboard.
 * Mirrors the claim status categories displayed in the UI.
 *
 * @param startDateMMDDYYYY - Start date in MM/DD/YYYY format (read from the UI date picker)
 * @param endDateMMDDYYYY   - End date  in MM/DD/YYYY format (read from the UI date picker)
 */
export async function fetchAnalyticsClaimSummary(
  startDateMMDDYYYY: string,
  endDateMMDDYYYY: string,
): Promise<{
  total: number;
  paid: number;
  accepted: number;
  rejected: number;
  scRejected: number;
  errors: number;
}> {
  const empty = { total: 0, paid: 0, accepted: 0, rejected: 0, scRejected: 0, errors: 0 };

  // Convert MM/DD/YYYY → YYYY-MM-DD for PostgreSQL date literals
  const toSql = (mmddyyyy: string): string | null => {
    const parts = mmddyyyy.split('/');
    if (parts.length !== 3) return null;
    const [mm, dd, yyyy] = parts;
    return `${yyyy}-${mm.padStart(2, '0')}-${dd.padStart(2, '0')}`;
  };

  const start = toSql(startDateMMDDYYYY);
  const end   = toSql(endDateMMDDYYYY);
  if (!start || !end) {
    console.warn('[fetchAnalyticsClaimSummary] Invalid date format. Expected MM/DD/YYYY.');
    return empty;
  }

  const query = `
    SELECT
      COUNT(*)::int                                                           AS total,
      COUNT(*) FILTER (WHERE rmt.apicategory = 'FINALIZED_PAID')::int        AS paid,
      COUNT(*) FILTER (WHERE rmt.apicategory = 'ACCEPTED')::int              AS accepted,
      COUNT(*) FILTER (
        WHERE rmt.apicategory IN ('REJECTED', 'FINALIZED_DENIED')
      )::int                                                                  AS rejected,
      COUNT(*) FILTER (WHERE rmt.apicategory = 'SC_REJECTED')::int           AS sc_rejected,
      COUNT(*) FILTER (
        WHERE rmt.apicategory IN ('ERROR', 'FINALIZED_ERROR', 'CLAIM_ERROR')
      )::int                                                                  AS errors
    FROM claims c
    INNER JOIN files f ON c.reportid = f.id
    LEFT JOIN remitreason rmt ON c.claimstatus = rmt.code
    WHERE f.queue = 'I'
      AND c.hintimestamp::date >= $1::date
      AND c.hintimestamp::date <= $2::date;
  `;

  try {
    const result = await executeQuery(query, [start, end]);
    if (!result || result.length === 0) return empty;
    const row = result[0];
    return {
      total:      Number(row.total       ?? 0),
      paid:       Number(row.paid        ?? 0),
      accepted:   Number(row.accepted    ?? 0),
      rejected:   Number(row.rejected    ?? 0),
      scRejected: Number(row.sc_rejected ?? 0),
      errors:     Number(row.errors      ?? 0),
    };
  } catch (err) {
    console.warn('[fetchAnalyticsClaimSummary] Query failed — cross-validation skipped:', err);
    return empty;
  }
}

/**
 * Fetches id, ecsdate, eradate, claimstatusdate, eligilibitydate, statementdate from provider table for a given providerGroupId
 * @param providerGroupId - The provider group id to search for
 * @returns An array of objects with the requested columns if found, otherwise an empty array
 */
export async function fetchProviderDatesByProviderId(providerId?: string): Promise<Array<{ id: string, ecsdate: string|null, eradate: string|null, claimstatusdate: string|null, eligilibitydate: string|null, statementdate: string|null }>> {
  const trimmedProviderId = (providerId ?? '').trim();
  if (!trimmedProviderId) {
    console.warn('[fetchProviderDatesByProviderId] Empty providerId provided.');
    return [];
  }
  console.log(`[fetchProviderDatesByProviderId] Raw providerId: '${providerId}', Trimmed: '${trimmedProviderId}', Type: ${typeof trimmedProviderId}`);


  const query = `SELECT id, ecsdate, eradate, claimstatusdate, eligilibitydate, statementdate FROM provider WHERE id = $1;`;
  console.log(`[fetchProviderDatesByProviderId] Executing query: ${query} with providerId: '${trimmedProviderId}'`);
  const result = await executeQuery(query, [trimmedProviderId]);
  console.log(`[fetchProviderDatesByProviderId] Query result: ${JSON.stringify(result)}`);
  if (result && result.length > 0) {
    for (const row of result) {
      console.log(`[fetchProviderDatesByProviderId] Row:`, row);
    }
    return result;
  }
  console.log('[fetchProviderDatesByProviderId] No provider found for given providerId.');
  return [];
}
/**
 * Fetches providerId and organizationname from provider table for a given providerGroupId
 * @param providerGroupId - The provider group id to search for
 * @returns An object with providerId and organizationname if found, otherwise null
 */
export async function fetchProviderIdByGroupId(providerGroupId?: string): Promise<{ id: string, organizationname: string } | null> {
  const trimmedGroupId = (providerGroupId ?? '').trim();
  if (!trimmedGroupId) {
    console.warn('[fetchProviderIdByGroupId] Empty providerGroupId provided.');
    return null;
  }
  console.log(`[fetchProviderIdByGroupId] Raw providerGroupId: '${providerGroupId}', Trimmed: '${trimmedGroupId}', Type: ${typeof trimmedGroupId}`);

  // Debug: Print all provider group IDs in the table
  const allGroupIdsQuery = 'SELECT providergroupid FROM provider';
  const allGroupIdsResult = await executeQuery(allGroupIdsQuery);
  const allGroupIds = allGroupIdsResult.map((row: any) => row.providergroupid);
  console.log('[fetchProviderIdByGroupId] All provider group IDs in DB:', allGroupIds);
  if (!allGroupIds.includes(trimmedGroupId)) {
    console.warn(`[fetchProviderIdByGroupId] WARNING: trimmedGroupId '${trimmedGroupId}' not found in provider table group IDs.`);
  }

  const query = `SELECT id , organizationname FROM provider WHERE providergroupid = $1;`;
  console.log(`[fetchProviderIdByGroupId] Executing query: ${query} with providerGroupId: '${trimmedGroupId}'`);
  const result = await executeQuery(query, [trimmedGroupId]);
  console.log(result+`result [fetchProviderIdByGroupId] Query result: ${JSON.stringify(result)}`);
  if (result && result.length > 0) {
    console.log(`[fetchProviderIdByGroupId] Fetched providerId: '${result[0].id}', organizationname: '${result[0].organizationname}'`);
    return { id: result[0].id, organizationname: result[0].organizationname };
  }
  console.log('[fetchProviderIdByGroupId] No provider found for given providerGroupId.');
  return null;
}

/**
 * Fetches provider group id and name from providergroup table for a given group id
 * @param providerGroupId - The provider group id to search for
 * @returns An object with id and name if found, otherwise null
 */
export async function fetchProviderGroupById(providerGroupId?: string): Promise<{ id: string, name: string } | null> {
  const trimmedGroupId = (providerGroupId ?? '').trim();
  if (!trimmedGroupId) {
    console.warn('[fetchProviderGroupById] Empty providerGroupId provided.');
    return null;
  }
  console.log(`[fetchProviderGroupById] Raw providerGroupId: '${providerGroupId}', Trimmed: '${trimmedGroupId}', Type: ${typeof trimmedGroupId}`);

  const query = 'SELECT id, name FROM providergroup WHERE id = $1;';
  console.log(`[fetchProviderGroupById] Executing query: ${query} with providerGroupId: '${trimmedGroupId}'`);
  const result = await executeQuery(query, [trimmedGroupId]);
  console.log(`[fetchProviderGroupById] Query result: ${JSON.stringify(result)}`);

  if (result && result.length > 0) {
    return { id: result[0].id, name: result[0].name };
  }

  console.log('[fetchProviderGroupById] No provider group found for given providerGroupId.');
  return null;
}
/**
 * Fetches one group enrollment with status C, D, or M ordered by datesetup
 */
export async function fetchOneGroupEnrollmentByStatus(): Promise<any | null> {
  const query = `select id from groupenrollment
 where enrollmentStatus in ('C','D','M')
  order by datesetup desc limit 1;
  `;
  const result = await executeQuery(query);
  return result && result.length > 0 ? result[0] : null;
}

/**
 * Returns the count of claim errors for the specified query
 */
export async function getClaimErrorCountForQueueI(): Promise<number> {
  const query = `
    SELECT count(c.*)
    FROM Claims AS c
    inner join Files as f on c.ReportId = f.id
    inner join ProviderGroup as g on c.ReportId = g.id
    inner join Account as a on g.Account = a.AccountNumber
    left join remitreason as rmt on c.claimstatus = rmt.code
    WHERE c.InputFilename = f.Filename
      AND f.queue = 'I'
      AND rmt.apicategory in ('FINALIZED_DENIED','SC_REJECTED','REJECTED');
  `;
  const result = await executeQuery(query);
  return result && result[0] && result[0].count ? Number(result[0].count) : 0;
}
/**
 * Returns the count of claims for the specified query
 */
export async function getClaimCountForQueueI(): Promise<number> {
  const query = `
    SELECT count(c.*)
    FROM Claims AS c
    inner join Files as f on c.ReportId = f.id
    inner join ProviderGroup as g on c.ReportId = g.id
    inner join Account as a on g.Account = a.AccountNumber
    left join remitreason as rmt on c.claimstatus = rmt.code
    WHERE c.InputFilename = f.Filename AND f.queue = 'I';
  `;
  const result = await executeQuery(query);
  // result[0].count may be string depending on pg driver
  return result && result[0] && result[0].count ? Number(result[0].count) : 0;
}

/**
 * Returns the count of claims received in the last 24 hours (notifications panel - Received Claims)
 */
export async function getReceivedClaimsLast24h(): Promise<number> {
  const query = `
    SELECT count(c.*)
    FROM Claims AS c
    INNER JOIN Files AS f ON c.ReportId = f.id
    WHERE f.queue = 'I'
      AND c.hintimestamp >= CURRENT_TIMESTAMP - INTERVAL '24 hours';
  `;
  const result = await executeQuery(query);
  return result && result[0] && result[0].count ? Number(result[0].count) : 0;
}

/**
 * Returns the count of rejected claims in the last 24 hours (notifications panel - Rejected Claims)
 */
export async function getRejectedClaimsLast24h(): Promise<number> {
  const query = `
    SELECT count(c.*)
    FROM Claims AS c
    INNER JOIN Files AS f ON c.ReportId = f.id
    LEFT JOIN remitreason AS rmt ON c.claimstatus = rmt.code
    WHERE f.queue = 'I'
      AND rmt.apicategory IN ('FINALIZED_DENIED','SC_REJECTED','REJECTED')
      AND c.hintimestamp >= CURRENT_TIMESTAMP - INTERVAL '24 hours';
  `;
  const result = await executeQuery(query);
  return result && result[0] && result[0].count ? Number(result[0].count) : 0;
}

/**
 * Returns the most recent ERA rows for dashboard panel comparison (Recent ERAs)
 */
export async function fetchRecentEraRows(): Promise<Array<{ payername: string }>> {
  // eramain has payerid but not status/receiveddate — select only confirmed columns
  const query = `
    SELECT ic.name AS payername
    FROM eramain e
    LEFT JOIN insurancecompany ic ON e.payerid = ic.id
    LIMIT 10;
  `;
  try {
    const result = await executeQuery(query);
    return result && result.length > 0
      ? result.map((r: any) => ({ payername: String(r.payername ?? '') }))
      : [];
  } catch (err) {
    console.warn('[fetchRecentEraRows] Query failed, ERA table may use a different schema:', err);
    return [];
  }
}

/**
 * Returns ERA summary totals (count + total amount) for the active date range.
 * Used to cross-validate the stat cards on the Recent ERA Summary dashboard.
 * Pushes eramain.dateadded to NOW() before querying so today's records are included.
 */
export async function fetchEraSummaryTotals(
  startDateMMDDYYYY: string,
  endDateMMDDYYYY: string,
): Promise<{ totalEras: number; totalPayment: number }> {
  const toSql = (mmddyyyy: string): string | null => {
    const p = mmddyyyy.split('/');
    if (p.length !== 3) return null;
    return `${p[2]}-${p[0].padStart(2, '0')}-${p[1].padStart(2, '0')}`;
  };
  const start = toSql(startDateMMDDYYYY);
  const end   = toSql(endDateMMDDYYYY);
  if (!start || !end) return { totalEras: 0, totalPayment: 0 };

  // First push eramain dateadded to today so the records fall in the window
  try {
    await executeQuery(`UPDATE eramain SET dateadded = $1`, [new Date().toISOString()]);
  } catch (err) {
    console.warn('[fetchEraSummaryTotals] Could not update eramain dateadded:', err);
  }

  const query = `
    SELECT
      COUNT(*)::int                          AS total_eras,
      COALESCE(SUM(e.totalamount), 0)::numeric AS total_payment
    FROM eramain e
    WHERE e.dateadded::date >= $1::date
      AND e.dateadded::date <= $2::date;
  `;
  try {
    const result = await executeQuery(query, [start, end]);
    if (!result || result.length === 0) return { totalEras: 0, totalPayment: 0 };
    return {
      totalEras:    Number(result[0].total_eras     ?? 0),
      totalPayment: Number(result[0].total_payment  ?? 0),
    };
  } catch (err) {
    console.warn('[fetchEraSummaryTotals] Query failed:', err);
    return { totalEras: 0, totalPayment: 0 };
  }
}

import { Client, QueryResult, Pool } from 'pg';
import * as fs from 'fs';
import * as path from 'path';
import userData from '../testData/UserInfo.json';
import { AccountRecord } from './AccountIntf';
import { BillingIdsRecord } from './BillingIdsIntf';

const dbConfig = {
  user: 'sc_app',
  host: 'Qnk1scltdb02.ict.pulseinc.com',
  database: 'scltdb2',
  password: 'xyP,xii78',
  port: 5432,
};

/**
 * Execute a database query with optional parameters
 * @param querys - SQL query string
 * @param params - Optional query parameters
 * @returns Array of query results
 */
export async function executeQuery(querys: string, params?: any[]) {
  const client = new Client(dbConfig);
  try {
    await client.connect();
    const result = await client.query(querys, params);
    await client.end();
    return result.rows;
  } catch (error) {
    console.error('Database query error:', error);
    await client.end();
    throw error;
  }
}

/**
 * Query and store account information from database
 */
async function queryAndStoreAccount() {
  const client = new Client(dbConfig);
  try {
    await client.connect();
    console.log('Connected to the database.');

    const userDataMap = new Map<number, AccountRecord>();

    // Reading from Json where createdaccountnumber is stored and fetching as below.
    const dataPath = path.resolve(__dirname, 'tempuserdata.json');
    const rawData = fs.readFileSync(dataPath, 'utf-8');
    const data = JSON.parse(rawData);
    const acctnum = data.sharedNumber;
    const getAccount = 'SELECT * FROM account WHERE accountnumber = $1';
    const params = [acctnum];

    await executeQuery(getAccount, params);
    console.log(getAccount, params);

    const res = await client.query<AccountRecord>(getAccount);
    console.log(`Stored ${userDataMap.size} records in the map.`);
    console.log(userDataMap.get(1));
  } catch (err) {
    console.error('Error executing query or connecting to the database:', err);
  } finally {
    await client.end();
    console.log('Database connection closed.');
  }
}

/**
 * Get today's date in ISO string format
 * @returns Formatted date string (ISO 8601)
 */
export async function getTodaysDateStringFormat(): Promise<string> {
  try {
    const today = new Date();
    const formattedDate = today.toISOString();
    console.log('today:', today);
    console.log('todays date:', formattedDate);
    return formattedDate;
  } catch (error) {
    console.error('Database query error:', error);
    throw error;
  }
}

/**
 * Get today's date with year in format /DD/YY
 * @returns Formatted date string
 */
export function getTodaysDateWithYr(): string {
  const d = new Date();
  const day = String(d.getDate()).padStart(2, '0');
  const year = d.getFullYear().toString().slice(-2);
  return `/${day}/${year}`;
}

/**
 * Get today's date with year in format /DD/YYYY
 * @returns Formatted date string
 */
export function getTodaysDateWithFullYear(): string {
  const d = new Date();
  const day = String(d.getDate()).padStart(2, '0');
  const year = d.getFullYear().toString();
  return `/${day}/${year}`;
}

/**
 * Get today's date in format MM/DD/YYYY
 * @returns Formatted date string
 */
export function getTodaysDate(): string {
  const today = new Date();
  const month = String(today.getMonth() + 1).padStart(2, '0');
  const day = String(today.getDate()).padStart(2, '0');
  const year = today.getFullYear();
  return `${month}/${day}/${year}`;
}

/**
 * Check if an account is active
 * @returns Boolean indicating if account is active
 */
export async function isActiveAccount(): Promise<boolean> {
  try {
    // Reading from Json where createdaccountnumber is stored and fetching as below.
    const getAccount = 'SELECT isactive FROM account WHERE accountnumber = $1';
    const params = [userData.deactivateAccount.deactivateAccAutoNum];
    const isactive = await executeQuery(getAccount, params);

    console.log(getAccount, params, 'isactive:', isactive);
    return isactive && isactive.length > 0 ? isactive[0].isactive : false;
  } catch (err) {
    console.error('Error executing query or connecting to the database:', err);
    return false;
  }
}

/**
 * Check if an group enrollment exists for a given groupid
 * @returns Boolean indicating if account is active
 */
export async function existsSingleGroupEnrollment(groupId: string): Promise<boolean> {
  const trimmedGroupId = (groupId ?? '').trim();
  if (!trimmedGroupId) {
    console.warn('[existsSingleGroupEnrollment] Empty groupId provided.');
    return false;
  }

  try {
    // Reading from Json where createdaccountnumber is stored and fetching as below.
    const getGroupenrollment = 'SELECT count(*) from groupenrollment where id = $1';
    const params = [trimmedGroupId];
    const param2 = 'ERA';
    const existsEnrollment = await executeQuery(getGroupenrollment, params);

    console.log(getGroupenrollment, params, 'existsEnrollment:', existsEnrollment);
    if(existsEnrollment && existsEnrollment.length > 0) {
      const enrollmentlog = 'Delete from enrollmentlog where seqno in (select seqno from groupenrollment where id = $1)';
      const deleteGroupEnrollment = 'DELETE from groupenrollment where id = $1 and enrollmenttype != $2';
      await executeQuery(enrollmentlog, params);
      await executeQuery(deleteGroupEnrollment, [...params, param2]);
      console.log(deleteGroupEnrollment, params, 'Deleted existing group enrollment');
    }  const rverifyEnrollment = await executeQuery(getGroupenrollment, params);
    return rverifyEnrollment && rverifyEnrollment.length > 0 ? parseInt(rverifyEnrollment[0].count) > 0 : false; 
  } catch (err) {
    console.error('Error executing query or connecting to the database:', err);
    return false;
  }
}


/**
 * Check if an group enrollment exists for a given groupid
 * @returns Boolean indicating if account is active
 */
export async function existsBulkGroupEnrollment(groupId: string): Promise<boolean> {
  const trimmedGroupId = (groupId ?? '').trim();
  if (!trimmedGroupId) {
    console.warn('[existsBulkGroupEnrollment] Empty groupId provided.');
    return false;
  }

  try {
    // Reading from Json where createdaccountnumber is stored and fetching as below.
    const getGroupenrollment = 'SELECT count(*) from groupenrollment where id = $1';
    const params = [trimmedGroupId];
   
    const existsEnrollment = await executeQuery(getGroupenrollment, params);

    console.log(getGroupenrollment, params, 'existsEnrollment:', existsEnrollment);
    if(existsEnrollment && existsEnrollment.length > 0) {
      const enrollmentlog = 'Delete from enrollmentlog where seqno in (select seqno from groupenrollment where id = $1)';
      const deleteGroupEnrollment = 'DELETE from groupenrollment where id = $1';
      await executeQuery(enrollmentlog, params);
      await executeQuery(deleteGroupEnrollment, [...params]);
      console.log(deleteGroupEnrollment, params, 'Deleted existing group enrollment');
    }  const rverifyEnrollment = await executeQuery(getGroupenrollment, params);
    return rverifyEnrollment && rverifyEnrollment.length > 0 ? parseInt(rverifyEnrollment[0].count) > 0 : false; 
  } catch (err) {
    console.error('Error executing query or connecting to the database:', err);
    return false;
  }
}
/**
 * Delete providers and billing ids for a given provider group id
 * @param providerGroupId - The provider group id to delete from provider and billingids tables
 */
export async function deleteProviderAndBillingIdsByGroupId(providerGroupId: string): Promise<void> {
  const trimmedGroupId = (providerGroupId ?? '').trim();
  if (!trimmedGroupId) {
    console.warn('[deleteProviderAndBillingIdsByGroupId] Empty providerGroupId provided.');
    return;
  }

  try {
    // Delete from billingids first due to possible FK constraints
    const deleteBillingIds = 'DELETE FROM billingids WHERE providergroupid = $1';
    const deleteProvider = 'DELETE FROM provider WHERE providergroupid = $1';
    const params = [trimmedGroupId];

    await executeQuery(deleteBillingIds, params);
    console.log(deleteBillingIds, params, 'Deleted billing ids');

    await executeQuery(deleteProvider, params);
    console.log(deleteProvider, params, 'Deleted providers');
  } catch (err) {
    console.error('Error deleting provider or billing ids:', err);
    throw err;
  }
}

/**
 * Fetch payer rows for the given id and neicid from sc_app.payer.
 */
export async function fetchPayerByIdAndNeicId(id: string, neicid: string): Promise<Array<{ id: string; neicid: string }>> {
  const trimmedId = (id ?? '').trim();
  const normalizedNeicid = (neicid ?? '').trim();
  if (!trimmedId || !normalizedNeicid) {
    console.warn('[fetchPayerByIdAndNeicId] Empty id or neicid provided.');
    return [];
  }

  const query = 'SELECT id, neicid FROM sc_app.payer WHERE id = $1 AND btrim(neicid) = $2';
  return executeQuery(query, [trimmedId, normalizedNeicid]);
}

/**
 * Delete payer rows for the given id and neicid from sc_app.payer.
 */
export async function deletePayerByIdAndNeicId(id: string, neicid: string): Promise<number> {
  const trimmedId = (id ?? '').trim();
  const normalizedNeicid = (neicid ?? '').trim();
  if (!trimmedId || !normalizedNeicid) {
    console.warn('[deletePayerByIdAndNeicId] Empty id or neicid provided.');
    return 0;
  }

  const query = 'DELETE FROM sc_app.payer WHERE id = $1 AND btrim(neicid) = $2 RETURNING id';
  const result = await executeQuery(query, [trimmedId, normalizedNeicid]);
  return result.length;
}

/**
 * Fetch insurance company by processor id.
 */
export async function fetchInsuranceByProcessorId(
  id: string
): Promise<{ name: string; recordstatus: string } | null> {
  const trimmedId = (id ?? '').trim();
  if (!trimmedId) {
    console.warn('[fetchInsuranceByProcessorId] Empty id provided.');
    return null;
  }

  const query = 'select name, recordstatus from insurancecompany where id = $1';
  const result = await executeQuery(query, [trimmedId]);
  if (!result || result.length === 0) {
    return null;
  }

  return {
    name: String(result[0].name ?? ''),
    recordstatus: String(result[0].recordstatus ?? ''),
  };
}

/**
 * Fetch insurance company by NEIC id.
 */
export async function fetchInsuranceByNeicId(
  neicid: string
): Promise<{ name: string; recordstatus: string } | null> {
  const trimmedNeicid = (neicid ?? '').trim();
  if (!trimmedNeicid) {
    console.warn('[fetchInsuranceByNeicId] Empty neicid provided.');
    return null;
  }

  const query = 'select name, recordstatus from insurancecompany where neicid = $1';
  const result = await executeQuery(query, [trimmedNeicid]);
  if (!result || result.length === 0) {
    return null;
  }

  return {
    name: String(result[0].name ?? ''),
    recordstatus: String(result[0].recordstatus ?? ''),
  };
}

/**
 * Fetch all insurance rows by NEIC id.
 */
export async function fetchInsuranceRowsByNeicId(
  neicid: string
): Promise<Array<{ name: string; recordstatus: string }>> {
  const trimmedNeicid = (neicid ?? '').trim();
  if (!trimmedNeicid) {
    console.warn('[fetchInsuranceRowsByNeicId] Empty neicid provided.');
    return [];
  }

  const query = 'select name, recordstatus from insurancecompany where neicid = $1';
  const result = await executeQuery(query, [trimmedNeicid]);
  return (result || []).map((row: any) => ({
    name: String(row.name ?? ''),
    recordstatus: String(row.recordstatus ?? ''),
  }));
}

/**
 * Fetch latest insurance companies by recid descending.
 */
export async function fetchLatestInsuranceCompanies(
  limit = 1
): Promise<Array<{ id: string; neicid: string; name: string; recordstatus: string }>> {
  const safeLimit = Number.isFinite(limit) && limit > 0 ? Math.floor(limit) : 1;
  const query =
    'select id, neicid, name, recordstatus from insurancecompany order by recid desc limit $1';
  const result = await executeQuery(query, [safeLimit]);

  return (result || []).map((row: any) => ({
    id: String(row.id ?? ''),
    neicid: String(row.neicid ?? ''),
    name: String(row.name ?? ''),
    recordstatus: String(row.recordstatus ?? ''),
  }));
}

/**
 * Fetch insurancecompany recid/name/id for an insurance id.
 */
export async function fetchInsuranceCompanyById(
  id: string
): Promise<{ recid: number; name: string; id: string } | null> {
  const trimmedId = (id ?? '').trim();
  if (!trimmedId) {
    console.warn('[fetchInsuranceCompanyById] Empty id provided.');
    return null;
  }

  const query = 'select recid, name, id from insurancecompany where id = $1';
  const result = await executeQuery(query, [trimmedId]);
  if (!result || result.length === 0) {
    return null;
  }

  return {
    recid: Number(result[0].recid ?? 0),
    name: String(result[0].name ?? ''),
    id: String(result[0].id ?? ''),
  };
}

/**
 * Fetch payer id/name/recordstatus/neicid for an insurance id from payer.
 */
export async function fetchPayerInsuranceById(
  id: string
): Promise<{ id: string; name: string; recordstatus: string; neicid: string } | null> {
  const trimmedId = (id ?? '').trim();
  if (!trimmedId) {
    console.warn('[fetchPayerInsuranceById] Empty id provided.');
    return null;
  }

  const query = 'select id, name, recordstatus, neicid from payer where id = $1';
  const result = await executeQuery(query, [trimmedId]);
  if (!result || result.length === 0) {
    return null;
  }

  return {
    id: String(result[0].id ?? ''),
    name: String(result[0].name ?? ''),
    recordstatus: String(result[0].recordstatus ?? ''),
    neicid: String(result[0].neicid ?? ''),
  };
}

/**
 * Fetch contactname, notes, claimstatustype, eligibilitytype from insurancecompany
 * where neicid matches and name starts with the provided prefix.
 * Query: select contactname, notes, claimstatustype, eligibilitytype from insurancecompany
 *        where neicid = $1 and name like $2
 */
export async function fetchInsuranceCompanyEditFields(
  neicId: string,
  namePrefix: string
): Promise<{ contactname: string; notes: string; claimstatustype: string; eligibilitytype: string } | null> {
  const trimmedNeicId = (neicId ?? '').trim();
  const trimmedPrefix = (namePrefix ?? '').trim();
  if (!trimmedNeicId || !trimmedPrefix) {
    console.warn('[fetchInsuranceCompanyEditFields] Empty neicId or namePrefix provided.');
    return null;
  }

  const query = `select contactname, notes, claimstatustype, eligibilitytype
                 from insurancecompany
                 where neicid = $1 and name like $2`;
  const result = await executeQuery(query, [trimmedNeicId, `${trimmedPrefix}%`]);
  if (!result || result.length === 0) {
    console.warn(`[fetchInsuranceCompanyEditFields] No row found for neicId='${trimmedNeicId}', namePrefix='${trimmedPrefix}'.`);
    return null;
  }

  return {
    contactname: String(result[0].contactname ?? ''),
    notes: String(result[0].notes ?? ''),
    claimstatustype: String(result[0].claimstatustype ?? ''),
    eligibilitytype: String(result[0].eligibilitytype ?? ''),
  };
}

/**
 * Fetch eligibility routing row for the provided SC ID.
 */
export async function fetchEligibilityRoutingByScId(
  scId: string
): Promise<{
  payername: string;
  scid: string;
  groupid: string;
  processorid: string;
  ediid: string;
  remove_subscriber_address: string;
  remove_subscriber_gender: string;
  remove_subscriber_nm1_mi: string;
  remove_subscriber_dtp_102: string;
  remove_ref_sy: string;
  remove_receiver_ref_0b: string;
  remove_prv: string;
  change_receiver_non_person_entity: string;
  recordstatus: string;
  ediid_qualifier: string;
} | null> {
  const trimmedScId = (scId ?? '').trim();
  if (!trimmedScId) {
    console.warn('[fetchEligibilityRoutingByScId] Empty scId provided.');
    return null;
  }

  const query = `
    select
      payername,
      scid,
      groupid,
      processorid,
      ediid,
      remove_subscriber_address,
      remove_subscriber_gender,
      remove_subscriber_nm1_mi,
      remove_subscriber_dtp_102,
      remove_ref_sy,
      remove_receiver_ref_0b,
      remove_prv,
      change_receiver_non_person_entity,
      recordstatus,
      coalesce(ediid_qualifier, '') as ediid_qualifier
    from eligibility_routing
    where btrim(scid) = $1
    limit 1
  `;
  const result = await executeQuery(query, [trimmedScId]);
  if (!result || result.length === 0) {
    return null;
  }

  return {
    payername: String(result[0].payername ?? '').trim(),
    scid: String(result[0].scid ?? '').trim(),
    groupid: String(result[0].groupid ?? '').trim(),
    processorid: String(result[0].processorid ?? '').trim(),
    ediid: String(result[0].ediid ?? '').trim(),
    remove_subscriber_address: String(result[0].remove_subscriber_address ?? '').trim(),
    remove_subscriber_gender: String(result[0].remove_subscriber_gender ?? '').trim(),
    remove_subscriber_nm1_mi: String(result[0].remove_subscriber_nm1_mi ?? '').trim(),
    remove_subscriber_dtp_102: String(result[0].remove_subscriber_dtp_102 ?? '').trim(),
    remove_ref_sy: String(result[0].remove_ref_sy ?? '').trim(),
    remove_receiver_ref_0b: String(result[0].remove_receiver_ref_0b ?? '').trim(),
    remove_prv: String(result[0].remove_prv ?? '').trim(),
    change_receiver_non_person_entity: String(result[0].change_receiver_non_person_entity ?? '').trim(),
    recordstatus: String(result[0].recordstatus ?? '').trim(),
    ediid_qualifier: String(result[0].ediid_qualifier ?? '').trim(),
  };
}

/**
 * Fetch all eligibility routing rows for a provided SC ID.
 */
export async function fetchEligibilityRoutingRowsByScId(
  scId: string
): Promise<Array<{
  payername: string;
  scid: string;
  groupid: string;
  processorid: string;
  ediid: string;
  recordstatus: string;
}>> {
  const trimmedScId = (scId ?? '').trim();
  if (!trimmedScId) {
    console.warn('[fetchEligibilityRoutingRowsByScId] Empty scId provided.');
    return [];
  }

  const query = `
    select
      payername,
      scid,
      groupid,
      processorid,
      ediid,
      recordstatus
    from eligibility_routing
    where btrim(scid) = $1
  `;
  const result = await executeQuery(query, [trimmedScId]);

  return (result || []).map((row: any) => ({
    payername: String(row.payername ?? '').trim(),
    scid: String(row.scid ?? '').trim(),
    groupid: String(row.groupid ?? '').trim(),
    processorid: String(row.processorid ?? '').trim(),
    ediid: String(row.ediid ?? '').trim(),
    recordstatus: String(row.recordstatus ?? '').trim(),
  }));
}

/**
 * Delete eligibility routing rows for iterative Add Eligibility runs.
 */
export async function deleteEligibilityRoutingByComposite(
  scId: string,
  processorId: string,
  ediId: string,
  groupId: string
): Promise<number> {
  const trimmedScId = (scId ?? '').trim();
  const trimmedProcessorId = (processorId ?? '').trim();
  const trimmedEdiId = (ediId ?? '').trim();
  const trimmedGroupId = (groupId ?? '').trim();

  if (!trimmedScId || !trimmedProcessorId || !trimmedEdiId || !trimmedGroupId) {
    console.warn('[deleteEligibilityRoutingByComposite] Empty key value provided.');
    return 0;
  }

  const query = `
    delete from eligibility_routing
    where btrim(scid) = $1
      and btrim(processorid) = $2
      and btrim(ediid) = $3
      and btrim(groupid) = $4
    returning scid
  `;
  const result = await executeQuery(query, [
    trimmedScId,
    trimmedProcessorId,
    trimmedEdiId,
    trimmedGroupId,
  ]);
  return result.length;
}

/**
 * Fetch claim status routing rows for a provided SC ID.
 */
export async function fetchClaimStatusRoutingRowsByScId(
  scId: string
): Promise<Array<{
  id: number;
  scid: string;
  groupid: string;
  processorid: string;
  ediid: string;
  online_batch: string;
  payername: string;
  recordstatus: string;
  nm1_upper: string;
}>> {
  const trimmedScId = (scId ?? '').trim();
  if (!trimmedScId) {
    console.warn('[fetchClaimStatusRoutingRowsByScId] Empty scId provided.');
    return [];
  }

  const query = `
    select
      id,
      scid,
      groupid,
      processorid,
      ediid,
      online_batch,
      payername,
      recordstatus,
      nm1_upper
    from sc_app.claimstatus_routing
    where btrim(scid) = $1
    order by id
  `;

  const result = await executeQuery(query, [trimmedScId]);
  return (result || []).map((row: any) => ({
    id: Number(row.id ?? 0),
    scid: String(row.scid ?? '').trim(),
    groupid: String(row.groupid ?? '').trim(),
    processorid: String(row.processorid ?? '').trim(),
    ediid: String(row.ediid ?? '').trim(),
    online_batch: String(row.online_batch ?? '').trim(),
    payername: String(row.payername ?? '').trim(),
    recordstatus: String(row.recordstatus ?? '').trim(),
    nm1_upper: String(row.nm1_upper ?? '').trim(),
  }));
}

/**
 * Fetch one claim status routing row for a provided SC ID.
 */
export async function fetchClaimStatusRoutingByScId(
  scId: string
): Promise<{
  id: number;
  scid: string;
  groupid: string;
  processorid: string;
  ediid: string;
  online_batch: string;
  payername: string;
  recordstatus: string;
  nm1_upper: string;
} | null> {
  const rows = await fetchClaimStatusRoutingRowsByScId(scId);
  return rows.length > 0 ? rows[0] : null;
}

/**
 * Fetch a claim status routing row by composite key.
 */
export async function fetchClaimStatusRoutingByComposite(
  scId: string,
  processorId: string,
  ediId: string,
  groupId: string
): Promise<{
  id: number;
  scid: string;
  groupid: string;
  processorid: string;
  ediid: string;
  online_batch: string;
  payername: string;
  recordstatus: string;
  nm1_upper: string;
} | null> {
  const trimmedScId = (scId ?? '').trim();
  const trimmedProcessorId = (processorId ?? '').trim();
  const trimmedEdiId = (ediId ?? '').trim();
  const trimmedGroupId = (groupId ?? '').trim();

  if (!trimmedScId || !trimmedProcessorId || !trimmedEdiId || !trimmedGroupId) {
    console.warn('[fetchClaimStatusRoutingByComposite] Empty key value provided.');
    return null;
  }

  const query = `
    select
      id,
      scid,
      groupid,
      processorid,
      ediid,
      online_batch,
      payername,
      recordstatus,
      nm1_upper
    from sc_app.claimstatus_routing
    where btrim(scid) = $1
      and btrim(processorid) = $2
      and btrim(ediid) = $3
      and btrim(groupid) = $4
    order by id
    limit 1
  `;

  const result = await executeQuery(query, [trimmedScId, trimmedProcessorId, trimmedEdiId, trimmedGroupId]);
  if (!result || result.length === 0) {
    return null;
  }

  const row = result[0];
  return {
    id: Number(row.id ?? 0),
    scid: String(row.scid ?? '').trim(),
    groupid: String(row.groupid ?? '').trim(),
    processorid: String(row.processorid ?? '').trim(),
    ediid: String(row.ediid ?? '').trim(),
    online_batch: String(row.online_batch ?? '').trim(),
    payername: String(row.payername ?? '').trim(),
    recordstatus: String(row.recordstatus ?? '').trim(),
    nm1_upper: String(row.nm1_upper ?? '').trim(),
  };
}

/**
 * Delete claim status routing rows by composite key for iterative reruns.
 */
export async function deleteClaimStatusRoutingByComposite(
  scId: string,
  processorId: string,
  ediId: string,
  groupId: string
): Promise<number> {
  const trimmedScId = (scId ?? '').trim();
  const trimmedProcessorId = (processorId ?? '').trim();
  const trimmedEdiId = (ediId ?? '').trim();
  const trimmedGroupId = (groupId ?? '').trim();

  if (!trimmedScId || !trimmedProcessorId || !trimmedEdiId || !trimmedGroupId) {
    console.warn('[deleteClaimStatusRoutingByComposite] Empty key value provided.');
    return 0;
  }

  const query = `
    delete from sc_app.claimstatus_routing
    where btrim(scid) = $1
      and btrim(processorid) = $2
      and btrim(ediid) = $3
      and btrim(groupid) = $4
    returning id
  `;

  const result = await executeQuery(query, [trimmedScId, trimmedProcessorId, trimmedEdiId, trimmedGroupId]);
  return result.length;
}

/**
 * Update claim status routing group id by composite key.
 */
export async function updateClaimStatusRoutingGroupIdByComposite(
  scId: string,
  processorId: string,
  ediId: string,
  fromGroupId: string,
  toGroupId: string
): Promise<number> {
  const trimmedScId = (scId ?? '').trim();
  const trimmedProcessorId = (processorId ?? '').trim();
  const trimmedEdiId = (ediId ?? '').trim();
  const trimmedFromGroupId = (fromGroupId ?? '').trim();
  const trimmedToGroupId = (toGroupId ?? '').trim();

  if (!trimmedScId || !trimmedProcessorId || !trimmedEdiId || !trimmedFromGroupId || !trimmedToGroupId) {
    console.warn('[updateClaimStatusRoutingGroupIdByComposite] Empty key value provided.');
    return 0;
  }

  const query = `
    update sc_app.claimstatus_routing
    set groupid = $5
    where btrim(scid) = $1
      and btrim(processorid) = $2
      and btrim(ediid) = $3
      and btrim(groupid) = $4
    returning id
  `;

  const result = await executeQuery(query, [
    trimmedScId,
    trimmedProcessorId,
    trimmedEdiId,
    trimmedFromGroupId,
    trimmedToGroupId,
  ]);
  return result.length;
}

/**
 * Ensure claim status routing record is reset to base group id for deterministic edit runs.
 */
export async function resetClaimStatusRoutingGroupForEdit(
  scId: string,
  processorId: string,
  ediId: string,
  baseGroupId: string,
  editedGroupId: string
): Promise<void> {
  const trimmedScId = (scId ?? '').trim();
  const trimmedProcessorId = (processorId ?? '').trim();
  const trimmedEdiId = (ediId ?? '').trim();
  const trimmedBaseGroupId = (baseGroupId ?? '').trim();
  const trimmedEditedGroupId = (editedGroupId ?? '').trim();

  if (!trimmedScId || !trimmedProcessorId || !trimmedEdiId || !trimmedBaseGroupId || !trimmedEditedGroupId) {
    console.warn('[resetClaimStatusRoutingGroupForEdit] Empty key value provided.');
    return;
  }

  // If an edited row exists, normalize it back to base value before test execution.
  await updateClaimStatusRoutingGroupIdByComposite(
    trimmedScId,
    trimmedProcessorId,
    trimmedEdiId,
    trimmedEditedGroupId,
    trimmedBaseGroupId
  );

  // Remove duplicate edited rows if they exist from previous unstable runs.
  await deleteClaimStatusRoutingByComposite(
    trimmedScId,
    trimmedProcessorId,
    trimmedEdiId,
    trimmedEditedGroupId
  );
}

/**
 * Fetch a single claims row by claim ID using the full dashboard query projection.
 */
export async function fetchClaimDashboardRowByClaimId(
  claimId: string
): Promise<{
  claimid: string;
  patientname: string;
  patientaccountnumber: string;
  payerid: string;
  providerfirstname: string;
  providerlastname: string;
  claimstatus: string;
  totalcharges: string;
  worked: string;
  processorid: string;
  inputfilename: string;
  reportfilename: string;
  csvfilename: string;
} | null> {
  const trimmedClaimId = (claimId ?? '').trim();
  if (!trimmedClaimId) {
    console.warn('[fetchClaimDashboardRowByClaimId] Empty claimId provided.');
    return null;
  }

  const query = `
    select
      inputfilename, inputseqnumber, providerid, statusflag, batchstatus, payerid, processorid,
      patientname, dateofservice, patientaccountnumber, modeinfo, hintimestamp, insuredname,
      transmitfilename, totalcharges, inputformat, outputformat, inputclaim, rejecterrors,
      warningerrors, processcode, patientbirthdate, patientgender, patientrelationship,
      insuranceplan, reportid, reportfilename, billed, statementdate, routingmethod,
      payerzipcode, sop, claimid, batchnumber, formattype, outputbatchnumber,
      carrierprocessdate, carrierprocesstime, claimstatus, billingnpi, billingtaxid,
      renderingnpi, providerlastname, providerfirstname, providermi, attachments,
      billingproviderlastname, billingproviderfirstname, billingprovidermi, neicid,
      filename277ca, filename277u, xmlfilename, insuredid, patientlastname,
      patientfirstname, patientmi, ediid2, ediid3, payerresp1, payerresp2, payerresp3,
      paymentfilename, csvfilename, claimstatusfilename, mappedoutput,
      interchangesenderid, applicationsendercode, numberofattachments, worked
    from sc_app.claims
    where btrim(claimid) = $1
    order by hintimestamp desc
    limit 1
  `;

  const rows = await executeQuery(query, [trimmedClaimId]);
  if (!rows || rows.length === 0) {
    return null;
  }

  const row = rows[0];
  return {
    claimid: String(row.claimid ?? '').trim(),
    patientname: String(row.patientname ?? '').trim(),
    patientaccountnumber: String(row.patientaccountnumber ?? '').trim(),
    payerid: String(row.payerid ?? '').trim(),
    providerfirstname: String(row.providerfirstname ?? '').trim(),
    providerlastname: String(row.providerlastname ?? '').trim(),
    claimstatus: String(row.claimstatus ?? '').trim(),
    totalcharges: String(row.totalcharges ?? '').trim(),
    worked: String(row.worked ?? '').trim(),
    processorid: String(row.processorid ?? '').trim(),
    inputfilename: String(row.inputfilename ?? '').trim(),
    reportfilename: String(row.reportfilename ?? '').trim(),
    csvfilename: String(row.csvfilename ?? '').trim(),
  };
}

/**
 * Fetch one claims dashboard row by claim ID for Claims extended menu/read-only validations.
 */
export async function fetchClaimExtendedMenuRowByClaimId(
  claimId: string
): Promise<{
  claimid: string;
  patientname: string;
  patientaccountnumber: string;
  payerid: string;
  providerid: string;
  providerfirstname: string;
  providerlastname: string;
  reportid: string;
  claimstatus: string;
} | null> {
  const trimmedClaimId = (claimId ?? '').trim();
  if (!trimmedClaimId) {
    console.warn('[fetchClaimExtendedMenuRowByClaimId] Empty claimId provided.');
    return null;
  }

  const query = `
    select
      inputfilename, inputseqnumber, providerid, statusflag, batchstatus, payerid, processorid,
      patientname, dateofservice, patientaccountnumber, modeinfo, hintimestamp, insuredname,
      transmitfilename, totalcharges, inputformat, outputformat, inputclaim, rejecterrors,
      warningerrors, processcode, patientbirthdate, patientgender, patientrelationship,
      insuranceplan, reportid, reportfilename, billed, statementdate, routingmethod,
      payerzipcode, sop, claimid, batchnumber, formattype, outputbatchnumber,
      carrierprocessdate, carrierprocesstime, claimstatus, billingnpi, billingtaxid,
      renderingnpi, providerlastname, providerfirstname, providermi, attachments,
      billingproviderlastname, billingproviderfirstname, billingprovidermi, neicid,
      filename277ca, filename277u, xmlfilename, insuredid, patientlastname,
      patientfirstname, patientmi, ediid2, ediid3, payerresp1, payerresp2, payerresp3,
      paymentfilename, csvfilename, claimstatusfilename, mappedoutput,
      interchangesenderid, applicationsendercode, numberofattachments
    from sc_app.claims
    where btrim(claimid) = $1
    order by hintimestamp desc
    limit 1
  `;

  const rows = await executeQuery(query, [trimmedClaimId]);
  if (!rows || rows.length === 0) {
    return null;
  }

  const row = rows[0];
  return {
    claimid: String(row.claimid ?? '').trim(),
    patientname: String(row.patientname ?? '').trim(),
    patientaccountnumber: String(row.patientaccountnumber ?? '').trim(),
    payerid: String(row.payerid ?? '').trim(),
    providerid: String(row.providerid ?? '').trim(),
    providerfirstname: String(row.providerfirstname ?? '').trim(),
    providerlastname: String(row.providerlastname ?? '').trim(),
    reportid: String(row.reportid ?? '').trim(),
    claimstatus: String(row.claimstatus ?? '').trim(),
  };
}

/**
 * Fetch one recent worked claim for show-worked dashboard validation.
 */
export async function fetchOneWorkedClaim(): Promise<{
  claimid: string;
  patientname: string;
  patientaccountnumber: string;
  worked: string;
} | null> {
  const query = `
    select claimid, patientname, patientaccountnumber, worked
    from sc_app.claims
    where worked is true
    order by hintimestamp desc
    limit 1
  `;

  const rows = await executeQuery(query);
  if (!rows || rows.length === 0) {
    return null;
  }

  return {
    claimid: String(rows[0].claimid ?? '').trim(),
    patientname: String(rows[0].patientname ?? '').trim(),
    patientaccountnumber: String(rows[0].patientaccountnumber ?? '').trim(),
    worked: String(rows[0].worked ?? '').trim(),
  };
}

/**
 * Fetch a single claims archive row by claim ID with optional mailbox/group filter.
 */
export async function fetchClaimArchiveDashboardRowByClaimId(
  claimId: string,
  groupId?: string
): Promise<{
  claimid: string;
  patientname: string;
  patientaccountnumber: string;
  payerid: string;
  providerfirstname: string;
  providerlastname: string;
  claimstatus: string;
  totalcharges: string;
  processorid: string;
  inputfilename: string;
  reportfilename: string;
  csvfilename: string;
} | null> {
  const trimmedClaimId = (claimId ?? '').trim();
  const trimmedGroupId = (groupId ?? '').trim();

  if (!trimmedClaimId) {
    console.warn('[fetchClaimArchiveDashboardRowByClaimId] Empty claimId provided.');
    return null;
  }

  const query = `
    select
      inputfilename, inputseqnumber, providerid, statusflag, batchstatus, payerid, processorid,
      patientname, dateofservice, patientaccountnumber, modeinfo, hintimestamp, insuredname,
      transmitfilename, totalcharges, inputformat, outputformat, inputclaim, rejecterrors,
      warningerrors, processcode, patientbirthdate, patientgender, patientrelationship,
      insuranceplan, reportid, reportfilename, billed, statementdate, routingmethod,
      payerzipcode, sop, claimid, batchnumber, formattype, outputbatchnumber,
      carrierprocessdate, carrierprocesstime, claimstatus, billingnpi, billingtaxid,
      renderingnpi, providerlastname, providerfirstname, providermi, attachments,
      billingproviderlastname, billingproviderfirstname, billingprovidermi, neicid,
      filename277ca, filename277u, xmlfilename, insuredid, patientlastname,
      patientfirstname, patientmi, ediid2, ediid3, payerresp1, payerresp2, payerresp3,
      paymentfilename, csvfilename, claimstatusfilename, mappedoutput,
      interchangesenderid, applicationsendercode, numberofattachments
    from sc_app_archive.claims
    where btrim(claimid) = $1
      and ($2 = '' or btrim(reportid) = $2)
    order by hintimestamp desc
    limit 1
  `;

  const rows = await executeQuery(query, [trimmedClaimId, trimmedGroupId]);
  if (!rows || rows.length === 0) {
    return null;
  }

  const row = rows[0];
  return {
    claimid: String(row.claimid ?? '').trim(),
    patientname: String(row.patientname ?? '').trim(),
    patientaccountnumber: String(row.patientaccountnumber ?? '').trim(),
    payerid: String(row.payerid ?? '').trim(),
    providerfirstname: String(row.providerfirstname ?? '').trim(),
    providerlastname: String(row.providerlastname ?? '').trim(),
    claimstatus: String(row.claimstatus ?? '').trim(),
    totalcharges: String(row.totalcharges ?? '').trim(),
    processorid: String(row.processorid ?? '').trim(),
    inputfilename: String(row.inputfilename ?? '').trim(),
    reportfilename: String(row.reportfilename ?? '').trim(),
    csvfilename: String(row.csvfilename ?? '').trim(),
  };
}

/**
 * Fetches the claim ID of any recent valid row from the LIVE claims table (sc_app.claims).
 * The UI Claims Menu dashboard searches this table, so the returned ID is guaranteed
 * to appear in search results. fetchClaimArchiveMenuRowByClaimId will then validate it
 * against the archive; if absent from the archive, tests that rely on it will be skipped.
 */
export async function fetchAnyValidArchiveClaimId(): Promise<string | null> {
  const query = `
    SELECT btrim(claimid) AS claimid
    FROM sc_app.claims
    WHERE claimid IS NOT NULL AND btrim(claimid) != ''
    ORDER BY hintimestamp DESC
    LIMIT 1;
  `;
  try {
    const result = await executeQuery(query);
    return result && result.length > 0 ? String(result[0].claimid) : null;
  } catch (err) {
    console.warn('[fetchAnyValidArchiveClaimId] Query failed:', err);
    return null;
  }
}

/**
 * Fetch one claims archive row by claim ID using the full projection required for Claim Menu validations.
 */
export async function fetchClaimArchiveMenuRowByClaimId(
  claimId: string
): Promise<{
  inputfilename: string;
  inputseqnumber: string;
  providerid: string;
  statusflag: string;
  batchstatus: string;
  payerid: string;
  processorid: string;
  patientname: string;
  dateofservice: string;
  patientaccountnumber: string;
  modeinfo: string;
  hintimestamp: string;
  insuredname: string;
  transmitfilename: string;
  totalcharges: string;
  inputformat: string;
  outputformat: string;
  inputclaim: string;
  rejecterrors: string;
  warningerrors: string;
  processcode: string;
  patientbirthdate: string;
  patientgender: string;
  patientrelationship: string;
  insuranceplan: string;
  reportid: string;
  reportfilename: string;
  billed: string;
  statementdate: string;
  routingmethod: string;
  payerzipcode: string;
  sop: string;
  claimid: string;
  batchnumber: string;
  formattype: string;
  outputbatchnumber: string;
  carrierprocessdate: string;
  carrierprocesstime: string;
  claimstatus: string;
  billingnpi: string;
  billingtaxid: string;
  renderingnpi: string;
  providerlastname: string;
  providerfirstname: string;
  providermi: string;
  attachments: string;
  billingproviderlastname: string;
  billingproviderfirstname: string;
  billingprovidermi: string;
  neicid: string;
  filename277ca: string;
  filename277u: string;
  xmlfilename: string;
  insuredid: string;
  patientlastname: string;
  patientfirstname: string;
  patientmi: string;
  ediid2: string;
  ediid3: string;
  payerresp1: string;
  payerresp2: string;
  payerresp3: string;
  paymentfilename: string;
  csvfilename: string;
  claimstatusfilename: string;
  mappedoutput: string;
  interchangesenderid: string;
  applicationsendercode: string;
  numberofattachments: string;
} | null> {
  const trimmedClaimId = (claimId ?? '').trim();
  if (!trimmedClaimId) {
    console.warn('[fetchClaimArchiveMenuRowByClaimId] Empty claimId provided.');
    return null;
  }

  const query = `
    select
      inputfilename, inputseqnumber, providerid, statusflag, batchstatus, payerid, processorid,
      patientname, dateofservice, patientaccountnumber, modeinfo, hintimestamp, insuredname,
      transmitfilename, totalcharges, inputformat, outputformat, inputclaim, rejecterrors,
      warningerrors, processcode, patientbirthdate, patientgender, patientrelationship,
      insuranceplan, reportid, reportfilename, billed, statementdate, routingmethod,
      payerzipcode, sop, claimid, batchnumber, formattype, outputbatchnumber,
      carrierprocessdate, carrierprocesstime, claimstatus, billingnpi, billingtaxid,
      renderingnpi, providerlastname, providerfirstname, providermi, attachments,
      billingproviderlastname, billingproviderfirstname, billingprovidermi, neicid,
      filename277ca, filename277u, xmlfilename, insuredid, patientlastname,
      patientfirstname, patientmi, ediid2, ediid3, payerresp1, payerresp2, payerresp3,
      paymentfilename, csvfilename, claimstatusfilename, mappedoutput,
      interchangesenderid, applicationsendercode, numberofattachments
    from sc_app_archive.claims
    where btrim(claimid) = $1
    order by hintimestamp desc
    limit 1
  `;

  const rows = await executeQuery(query, [trimmedClaimId]);
  if (!rows || rows.length === 0) {
    return null;
  }

  const row = rows[0];
  const toText = (value: unknown): string => String(value ?? '').trim();

  return {
    inputfilename: toText(row.inputfilename),
    inputseqnumber: toText(row.inputseqnumber),
    providerid: toText(row.providerid),
    statusflag: toText(row.statusflag),
    batchstatus: toText(row.batchstatus),
    payerid: toText(row.payerid),
    processorid: toText(row.processorid),
    patientname: toText(row.patientname),
    dateofservice: toText(row.dateofservice),
    patientaccountnumber: toText(row.patientaccountnumber),
    modeinfo: toText(row.modeinfo),
    hintimestamp: toText(row.hintimestamp),
    insuredname: toText(row.insuredname),
    transmitfilename: toText(row.transmitfilename),
    totalcharges: toText(row.totalcharges),
    inputformat: toText(row.inputformat),
    outputformat: toText(row.outputformat),
    inputclaim: toText(row.inputclaim),
    rejecterrors: toText(row.rejecterrors),
    warningerrors: toText(row.warningerrors),
    processcode: toText(row.processcode),
    patientbirthdate: toText(row.patientbirthdate),
    patientgender: toText(row.patientgender),
    patientrelationship: toText(row.patientrelationship),
    insuranceplan: toText(row.insuranceplan),
    reportid: toText(row.reportid),
    reportfilename: toText(row.reportfilename),
    billed: toText(row.billed),
    statementdate: toText(row.statementdate),
    routingmethod: toText(row.routingmethod),
    payerzipcode: toText(row.payerzipcode),
    sop: toText(row.sop),
    claimid: toText(row.claimid),
    batchnumber: toText(row.batchnumber),
    formattype: toText(row.formattype),
    outputbatchnumber: toText(row.outputbatchnumber),
    carrierprocessdate: toText(row.carrierprocessdate),
    carrierprocesstime: toText(row.carrierprocesstime),
    claimstatus: toText(row.claimstatus),
    billingnpi: toText(row.billingnpi),
    billingtaxid: toText(row.billingtaxid),
    renderingnpi: toText(row.renderingnpi),
    providerlastname: toText(row.providerlastname),
    providerfirstname: toText(row.providerfirstname),
    providermi: toText(row.providermi),
    attachments: toText(row.attachments),
    billingproviderlastname: toText(row.billingproviderlastname),
    billingproviderfirstname: toText(row.billingproviderfirstname),
    billingprovidermi: toText(row.billingprovidermi),
    neicid: toText(row.neicid),
    filename277ca: toText(row.filename277ca),
    filename277u: toText(row.filename277u),
    xmlfilename: toText(row.xmlfilename),
    insuredid: toText(row.insuredid),
    patientlastname: toText(row.patientlastname),
    patientfirstname: toText(row.patientfirstname),
    patientmi: toText(row.patientmi),
    ediid2: toText(row.ediid2),
    ediid3: toText(row.ediid3),
    payerresp1: toText(row.payerresp1),
    payerresp2: toText(row.payerresp2),
    payerresp3: toText(row.payerresp3),
    paymentfilename: toText(row.paymentfilename),
    csvfilename: toText(row.csvfilename),
    claimstatusfilename: toText(row.claimstatusfilename),
    mappedoutput: toText(row.mappedoutput),
    interchangesenderid: toText(row.interchangesenderid),
    applicationsendercode: toText(row.applicationsendercode),
    numberofattachments: toText(row.numberofattachments),
  };
}

/**
 * Fetch one claims archive row by claim ID for Claim Archive Timely Filing report validations.
 */
export async function fetchClaimArchiveTimelyFilingRowByClaimId(
  claimId: string
): Promise<Awaited<ReturnType<typeof fetchClaimArchiveMenuRowByClaimId>>> {
  return fetchClaimArchiveMenuRowByClaimId(claimId);
}

/**
 * Query and store account information from database
 */
export async function fetchNPIAndTaxIDForGroupId(groupId?: string): Promise<Map<string, string>> {
  try {
    const userDataMap = new Map<string, string>();
    const getBillingIds = 'SELECT billingid, billingidtype FROM billingids WHERE providergroupid = $1';
    const trimmedGroupId = (groupId ?? '').trim();
    if (!trimmedGroupId) {
      console.warn('[fetchNPIAndTaxIDForGroupId] Empty groupId provided.');
      return userDataMap;
    }
    const params = [trimmedGroupId];

    const billingRows = await executeQuery(getBillingIds, params);
    console.log(getBillingIds, params);

    // Store billingid as key and billingidtype as value in the map
    billingRows.forEach((row: { billingid: string, billingidtype: string }) => {
      userDataMap.set(row.billingid, row.billingidtype);
    });

    console.log(`Stored ${userDataMap.size} records in the map.`);
    console.log(userDataMap);
    return userDataMap;
  } catch (err) {
    console.error('Error executing query or connecting to the database:', err);
    return new Map<string, string>();
  }
}

export type UsersClientRow = {
  username: string;
  firstName: string;
  lastName: string;
  groupId: string;
  userType: string;
  isActive: boolean;
  phone: string;
  cellPhone: string;
  pin: string;
};

function toUsersClientRow(row: any): UsersClientRow {
  const firstName = String(row.firstname ?? row.first_name ?? '').trim();
  const lastName = String(row.lastname ?? row.last_name ?? '').trim();

  const groupId = String(
    row.groupid ?? row.group_id ?? row.groupnumber ?? row.group_number ?? ''
  ).trim();

  const userType = String(row.usertype ?? row.user_type ?? row.role ?? '').trim();
  const username = String(row.username ?? row.login ?? '').trim();
  const phone = String(row.phone ?? row.phonenumber ?? '').trim();
  const cellPhone = String(row.cellphone ?? row.cell_phone ?? '').trim();
  const pin = String(row.pin ?? row.userpin ?? '').trim();

  const rawActive = row.isactive ?? row.active ?? row.recordstatus ?? row.status;
  const normalized = String(rawActive ?? '').trim().toLowerCase();
  const isActive =
    rawActive === true ||
    normalized === 'true' ||
    normalized === '1' ||
    normalized === 'a' ||
    normalized === 'active';

  return {
    username,
    firstName,
    lastName,
    groupId,
    userType,
    isActive,
    phone,
    cellPhone,
    pin,
  };
}

/**
 * Fetch one usersclients row by username for Search User dashboard validation.
 */
export async function fetchUserClientByUsername(username: string): Promise<UsersClientRow | null> {
  const trimmedUsername = (username ?? '').trim();
  if (!trimmedUsername) {
    console.warn('[fetchUserClientByUsername] Empty username provided.');
    return null;
  }

  const query = `
    select *
    from usersclients
    where lower(btrim(username)) = lower($1)
    limit 1
  `;

  try {
    const rows = await executeQuery(query, [trimmedUsername]);
    if (!rows || rows.length === 0) {
      return null;
    }
    return toUsersClientRow(rows[0]);
  } catch (err) {
    console.warn('[fetchUserClientByUsername] Query failed:', err);
    return null;
  }
}

/**
 * Fetch usersclients rows with optional filters for Search User cross-validation.
 */
export async function fetchUserClientsByFilters(filters: {
  username?: string;
  firstName?: string;
  lastName?: string;
  groupId?: string;
  userType?: string;
  isActive?: boolean;
}): Promise<UsersClientRow[]> {
  const clauses: string[] = [];
  const params: any[] = [];

  const addClause = (sql: string, value: any): void => {
    params.push(value);
    clauses.push(sql.replace('?', `$${params.length}`));
  };

  const username = (filters.username ?? '').trim();
  const firstName = (filters.firstName ?? '').trim();
  const lastName = (filters.lastName ?? '').trim();
  const groupId = (filters.groupId ?? '').trim();
  const userType = (filters.userType ?? '').trim();

  if (username) {
    addClause('lower(btrim(username)) like lower(?)', `%${username}%`);
  }
  if (firstName) {
    addClause('lower(coalesce(firstname, \'\')) like lower(?)', `%${firstName}%`);
  }
  if (lastName) {
    addClause('lower(coalesce(lastname, \'\')) like lower(?)', `%${lastName}%`);
  }
  if (groupId) {
    addClause('lower(coalesce(groupid, \'\')) like lower(?)', `%${groupId}%`);
  }
  if (userType) {
    addClause('upper(coalesce(usertype, \'\')) = upper(?)', userType);
  }
  if (typeof filters.isActive === 'boolean') {
    addClause('coalesce(active, false) = ?', filters.isActive);
  }

  const where = clauses.length > 0 ? `where ${clauses.join(' and ')}` : '';
  const query = `
    select *
    from usersclients
    ${where}
    limit 200
  `;

  try {
    const rows = await executeQuery(query, params);
    return (rows ?? []).map((row: any) => toUsersClientRow(row));
  } catch (err) {
    console.warn('[fetchUserClientsByFilters] Query failed:', err);
    return [];
  }
}

/**
 * Fetch one inactive user from usersclients for edit-restriction validation.
 */
export async function fetchAnyInactiveUserClient(): Promise<UsersClientRow | null> {
  const query = `
    select *
    from usersclients
    where coalesce(active, false) = false
    limit 1
  `;

  try {
    const rows = await executeQuery(query);
    if (!rows || rows.length === 0) {
      return null;
    }
    return toUsersClientRow(rows[0]);
  } catch (err) {
    console.warn('[fetchAnyInactiveUserClient] Query failed:', err);
    return null;
  }
}
