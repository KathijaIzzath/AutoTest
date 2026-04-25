/**
 * Fetches providerId and organizationname from provider table for a given providerGroupId
 * @param providerGroupId - The provider group id to search for
 * @returns An object with providerId and organizationname if found, otherwise null
 */
export async function fetchProviderIdByGroupId(providerGroupId: string): Promise<{ id: string, organizationname: string } | null> {
  const trimmedGroupId = providerGroupId.trim();
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
  const client = new Client(dbConfig);
  try {
    await client.connect();
    console.log('Connected to the database.');

    // Reading from Json where createdaccountnumber is stored and fetching as below.
    const getAccount = 'SELECT isactive FROM account WHERE accountnumber = $1';
    const params = [userData.deactivateAccount.deactivateAccAutoNum];
    const isactive = await executeQuery(getAccount, params);

    console.log(getAccount, params, 'isactive:', isactive);
    return isactive && isactive.length > 0 ? isactive[0].isactive : false;
  } catch (err) {
    console.error('Error executing query or connecting to the database:', err);
    return false;
  } finally {
    await client.end();
    console.log('Database connection closed.');
  }
}

/**
 * Check if an group enrollment exists for a given groupid
 * @returns Boolean indicating if account is active
 */
export async function existsSingleGroupEnrollment(groupId: string): Promise<boolean> {
  const client = new Client(dbConfig);
  try {
    await client.connect();
    console.log('Connected to the database.');

    // Reading from Json where createdaccountnumber is stored and fetching as below.
    const getGroupenrollment = 'SELECT count(*) from groupenrollment where id = $1';
    const params = [groupId];
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
  } finally {
    await client.end();
    console.log('Database connection closed.');
  }
}


/**
 * Check if an group enrollment exists for a given groupid
 * @returns Boolean indicating if account is active
 */
export async function existsBulkGroupEnrollment(groupId: string): Promise<boolean> {
  const client = new Client(dbConfig);
  try {
    await client.connect();
    console.log('Connected to the database.');

    // Reading from Json where createdaccountnumber is stored and fetching as below.
    const getGroupenrollment = 'SELECT count(*) from groupenrollment where id = $1';
    const params = [groupId];
   
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
  } finally {
    await client.end();
    console.log('Database connection closed.');
  }
}
/**
 * Delete providers and billing ids for a given provider group id
 * @param providerGroupId - The provider group id to delete from provider and billingids tables
 */
export async function deleteProviderAndBillingIdsByGroupId(providerGroupId: string): Promise<void> {
  const client = new Client(dbConfig);
  try {
    await client.connect();
    console.log('Connected to the database.');

    // Delete from billingids first due to possible FK constraints
    const deleteBillingIds = 'DELETE FROM billingids WHERE providergroupid = $1';
    const deleteProvider = 'DELETE FROM provider WHERE providergroupid = $1';
    const params = [providerGroupId];

    await executeQuery(deleteBillingIds, params);
    console.log(deleteBillingIds, params, 'Deleted billing ids');

    await executeQuery(deleteProvider, params);
    console.log(deleteProvider, params, 'Deleted providers');
  } catch (err) {
    console.error('Error deleting provider or billing ids:', err);
    throw err;
  } finally {
    await client.end();
    console.log('Database connection closed.');
  }
}
/**
 * Query and store account information from database
 */
export async function fetchNPIAndTaxIDForGroupId(groupId: string){
  const client = new Client(dbConfig);
  try {
    await client.connect();
    console.log('Connected to the database.');

    const userDataMap = new Map<string, string>();

    // Reading from Json where createdaccountnumber is stored and fetching as below.
    const dataPath = path.resolve(__dirname, 'tempuserdata.json');
    const rawData = fs.readFileSync(dataPath, 'utf-8');
    const data = JSON.parse(rawData);
    const acctnum = data.sharedNumber;
    const getBillingIds = 'SELECT billingid, billingidtype FROM billingids WHERE providergroupid = $1';
    const params = [groupId];


    const billingRows = await executeQuery(getBillingIds, params);
    console.log(getBillingIds, params);

    // Store billingid as key and billingidtype as value in the map
    billingRows.forEach((row: { billingid: string, billingidtype: string }) => {
      return userDataMap.set(row.billingid, row.billingidtype);
    });

    console.log(`Stored ${userDataMap.size} records in the map.`);
    console.log(userDataMap);
    console.log(userDataMap.get('1'));
    return userDataMap;
  } catch (err) {
    console.error('Error executing query or connecting to the database:', err);
  } finally {
    await client.end();
    console.log('Database connection closed.');
  }
}
