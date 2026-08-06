/**
 * Sync AutoTest seed rows from QA → staging (staging only).
 * - Inserts missing accounts / providergroups / enrollments for known seed IDs
 * - Updates inactive/mismatched primary analytics group G23496
 *
 * Usage: node scripts/sync-qa-seeds-to-staging.cjs [--dry-run]
 */
'use strict';

const { Client } = require('pg');

const DRY_RUN = process.argv.includes('--dry-run');
/** App tables live in sc_app (not public); other user schemas also have copies. */
const SCHEMA = 'sc_app';

const QA = {
  user: 'sc_app',
  host: 'Qnk1scltdb02.ict.pulseinc.com',
  database: 'scltdb2',
  password: 'xyP,xii78',
  port: 5432,
};

const STAGING = {
  user: 'sc_app',
  host: 'pnk1scstgaio.ict.pulseinc.com',
  database: 'scltdb2',
  password: 'xyP,xii78',
  port: 5432,
};

const SEED = {
  accounts: [
    'FFC001',
    'EditAccAutoTest001',
    'QAACCOUNTAUTOTEST001',
    'SCAUTOPROVTEST001',
    'SCAutoGroupEdit001',
    'SCAUTOGROUPEDIT001',
    'AUTOMATIONTESTACC01',
    'E2ETESTACCOUNT01',
    'ACPM-4414',
    '12345678910',
    'VMCTEST',
    '000VMTEST',
  ],
  groups: [
    'G23496',
    'G00455',
    'G00014',
    'G00017',
    'G29837',
    'G23734',
    'G29515',
    'G31927',
    'G31928',
    'G31943',
    'G31930',
  ],
  /** Force-activate + align display fields from QA when present on staging. */
  forceAlignGroups: ['G23496', 'G23734', 'G00014'],
  claimIds: ['G234962207071312193U', 'G234962207071241121F'],
};

function quoteIdent(name) {
  return `"${String(name).replace(/"/g, '""')}"`;
}

function tableRef(table) {
  return `${quoteIdent(SCHEMA)}.${quoteIdent(table)}`;
}

async function tableColumns(client, table) {
  const r = await client.query(
    `SELECT column_name, data_type, is_nullable, column_default
     FROM information_schema.columns
     WHERE table_schema = $1 AND table_name = $2
     ORDER BY ordinal_position`,
    [SCHEMA, table],
  );
  return r.rows;
}

async function fetchByKey(client, table, keyCol, keyVal) {
  const r = await client.query(
    `SELECT * FROM ${tableRef(table)} WHERE ${quoteIdent(keyCol)} = $1`,
    [keyVal],
  );
  return r.rows[0] || null;
}

async function fetchMany(client, table, keyCol, keyVals) {
  if (!keyVals.length) return [];
  const r = await client.query(
    `SELECT * FROM ${tableRef(table)} WHERE ${quoteIdent(keyCol)} = ANY($1::text[])`,
    [keyVals],
  );
  return r.rows;
}

function pickInsertable(row, cols, { skipDefaults = true } = {}) {
  const out = {};
  const colSet = new Set(cols.map((c) => c.column_name));
  for (const [k, v] of Object.entries(row)) {
    if (!colSet.has(k)) continue;
    const meta = cols.find((c) => c.column_name === k);
    if (skipDefaults && meta?.column_default && /nextval/i.test(String(meta.column_default)) && v == null) {
      continue;
    }
    out[k] = v;
  }
  return out;
}

async function upsertRow(stg, table, keyCol, qaRow, cols, { updateIfExists = false, alignFields = null } = {}) {
  const keyVal = qaRow[keyCol];
  const existing = await fetchByKey(stg, table, keyCol, keyVal);
  if (!existing) {
    const data = pickInsertable(qaRow, cols);
    for (const meta of cols) {
      if (meta.column_default && /nextval/i.test(String(meta.column_default))) {
        delete data[meta.column_name];
      }
    }
    const keys = Object.keys(data);
    if (!keys.length) return { action: 'skip-empty', key: keyVal };
    const placeholders = keys.map((_, i) => `$${i + 1}`);
    const sql = `INSERT INTO ${tableRef(table)} (${keys.map(quoteIdent).join(',')}) VALUES (${placeholders.join(',')})`;
    if (DRY_RUN) {
      console.log(`[dry-run] INSERT ${table}.${keyCol}=${keyVal} cols=${keys.length}`);
      return { action: 'would-insert', key: keyVal };
    }
    await stg.query(sql, keys.map((k) => data[k]));
    console.log(`[ok] INSERT ${table}.${keyCol}=${keyVal}`);
    return { action: 'inserted', key: keyVal };
  }

  if (updateIfExists || alignFields) {
    const fields = alignFields || Object.keys(qaRow).filter((k) => k !== keyCol);
    const sets = [];
    const vals = [];
    for (const f of fields) {
      if (!(f in qaRow)) continue;
      if (!cols.some((c) => c.column_name === f)) continue;
      // Don't overwrite staging PK
      if (f === keyCol) continue;
      sets.push(`${quoteIdent(f)} = $${sets.length + 1}`);
      vals.push(qaRow[f]);
    }
    if (!sets.length) return { action: 'exists', key: keyVal };
    vals.push(keyVal);
    const sql = `UPDATE ${tableRef(table)} SET ${sets.join(', ')} WHERE ${quoteIdent(keyCol)} = $${vals.length}`;
    if (DRY_RUN) {
      console.log(`[dry-run] UPDATE ${table}.${keyCol}=${keyVal} fields=${sets.length}`);
      return { action: 'would-update', key: keyVal };
    }
    await stg.query(sql, vals);
    console.log(`[ok] UPDATE ${table}.${keyCol}=${keyVal} fields=${sets.length}`);
    return { action: 'updated', key: keyVal };
  }

  console.log(`[skip] exists ${table}.${keyCol}=${keyVal}`);
  return { action: 'exists', key: keyVal };
}

async function activateGroup(stg, groupId) {
  // recordstatus 'A' = active in this schema
  const sql = `UPDATE ${tableRef('providergroup')} SET recordstatus = 'A' WHERE id = $1`;
  if (DRY_RUN) {
    console.log(`[dry-run] ACTIVATE providergroup id=${groupId}`);
    return;
  }
  const r = await stg.query(sql, [groupId]);
  console.log(`[ok] ACTIVATE providergroup id=${groupId} rowCount=${r.rowCount}`);
}

async function syncEnrollments(qa, stg, groupId) {
  const qaCols = await tableColumns(qa, 'groupenrollment');
  const stgCols = await tableColumns(stg, 'groupenrollment');
  const qaRows = await fetchMany(qa, 'groupenrollment', 'id', [groupId]);
  if (!qaRows.length) {
    console.log(`[warn] QA has no groupenrollment for ${groupId}`);
    return { inserted: 0 };
  }

  // Determine a uniqueness key beyond group id if possible (payerid + enrollmenttype etc.)
  let inserted = 0;
  for (const row of qaRows) {
    // Check if a similar row already exists on staging
    const whereParts = ['id = $1'];
    const params = [groupId];
    for (const cand of ['payer', 'enrollmenttype', 'enrollmentstatus', 'npi', 'taxid', 'processorid', 'ediid']) {
      if (row[cand] != null && stgCols.some((c) => c.column_name === cand)) {
        params.push(row[cand]);
        whereParts.push(`${quoteIdent(cand)} = $${params.length}`);
      }
    }
    const exists = await stg.query(
      `SELECT 1 FROM ${tableRef('groupenrollment')} WHERE ${whereParts.join(' AND ')} LIMIT 1`,
      params,
    );
    if (exists.rowCount > 0) {
      console.log(`[skip] enrollment exists for ${groupId}`);
      continue;
    }
    // Drop serial/identity PK columns so staging allocates its own
    const data = pickInsertable(row, stgCols);
    for (const meta of stgCols) {
      if (meta.column_default && /nextval/i.test(String(meta.column_default))) {
        delete data[meta.column_name];
      }
    }
    const keys = Object.keys(data);
    if (!keys.length) continue;
    const placeholders = keys.map((_, i) => `$${i + 1}`);
    const sql = `INSERT INTO ${tableRef('groupenrollment')} (${keys.map(quoteIdent).join(',')}) VALUES (${placeholders.join(',')})`;
    if (DRY_RUN) {
      console.log(`[dry-run] INSERT groupenrollment id=${groupId}`);
      inserted += 1;
      continue;
    }
    try {
      await stg.query(sql, keys.map((k) => data[k]));
      console.log(`[ok] INSERT groupenrollment id=${groupId}`);
      inserted += 1;
    } catch (e) {
      console.warn(`[warn] enrollment insert failed for ${groupId}: ${e.message.split('\n')[0]}`);
    }
  }
  return { inserted };
}

async function ensureClaimsA3(stg) {
  const sql = `
    UPDATE ${tableRef('claims')}
       SET claimstatus = 'A3'
     WHERE claimid = ANY($1::text[])
  `;
  if (DRY_RUN) {
    console.log(`[dry-run] UPDATE claims A3 for setup ids`);
    return;
  }
  const r = await stg.query(sql, [SEED.claimIds]);
  console.log(`[ok] claims A3 setup updated rowCount=${r.rowCount}`);
}

async function prepareClient(client) {
  await client.query('SET statement_timeout TO 60000');
  await client.query(`SET search_path TO ${quoteIdent(SCHEMA)}, public`);
}

async function main() {
  console.log(`[sync] QA → staging seed sync ${DRY_RUN ? '(DRY RUN)' : '(APPLY)'} schema=${SCHEMA}`);
  const qa = new Client(QA);
  const stg = new Client(STAGING);
  await qa.connect();
  await stg.connect();
  await prepareClient(qa);
  await prepareClient(stg);

  const summary = { accounts: [], groups: [], enrollments: [], errors: [] };

  try {
    const acctColsQa = await tableColumns(qa, 'account');
    const acctColsStg = await tableColumns(stg, 'account');
    console.log(`[sync] account columns staging=${acctColsStg.length} qa=${acctColsQa.length}`);

    for (const acct of SEED.accounts) {
      try {
        const qaRow = await fetchByKey(qa, 'account', 'accountnumber', acct);
        if (!qaRow) {
          console.log(`[warn] QA missing account ${acct}`);
          summary.accounts.push({ id: acct, action: 'qa-missing' });
          continue;
        }
        const res = await upsertRow(stg, 'account', 'accountnumber', qaRow, acctColsStg, {
          updateIfExists: false,
        });
        // If exists on staging but inactive, activate
        if (res.action === 'exists' && Object.prototype.hasOwnProperty.call(qaRow, 'isactive')) {
          if (DRY_RUN) {
            console.log(`[dry-run] ensure account ${acct} isactive=true`);
          } else {
            await stg.query(
              `UPDATE ${tableRef('account')} SET isactive = true WHERE accountnumber = $1 AND COALESCE(isactive,false) = false`,
              [acct],
            );
          }
        }
        summary.accounts.push({ id: acct, action: res.action });
      } catch (e) {
        console.warn(`[error] account ${acct}: ${e.message.split('\n')[0]}`);
        summary.errors.push(`account ${acct}: ${e.message.split('\n')[0]}`);
      }
    }

    const grpColsQa = await tableColumns(qa, 'providergroup');
    const grpColsStg = await tableColumns(stg, 'providergroup');
    console.log(`[sync] providergroup columns staging=${grpColsStg.length} qa=${grpColsQa.length}`);

    for (const gid of SEED.groups) {
      try {
        const qaRow = await fetchByKey(qa, 'providergroup', 'id', gid);
        if (!qaRow) {
          console.log(`[warn] QA missing providergroup ${gid}`);
          summary.groups.push({ id: gid, action: 'qa-missing' });
          continue;
        }
        // Parent account must exist (FK cst_account → account.accountnumber)
        if (qaRow.account) {
          const parent = await fetchByKey(qa, 'account', 'accountnumber', qaRow.account);
          if (parent) {
            await upsertRow(stg, 'account', 'accountnumber', parent, acctColsStg, {
              updateIfExists: false,
            });
          } else {
            console.log(`[warn] QA missing parent account ${qaRow.account} for group ${gid}`);
          }
        }
        const align = SEED.forceAlignGroups.includes(gid);
        const res = await upsertRow(stg, 'providergroup', 'id', qaRow, grpColsStg, {
          updateIfExists: align,
          alignFields: align
            ? ['name', 'recordstatus', 'streetaddress1', 'streetaddress2', 'city', 'state', 'zipcode', 'account', 'taxid', 'npi']
                .filter((f) => f in qaRow)
            : null,
        });
        // Always ensure analytics primary groups are active on staging
        if (['G23496', 'G23734', 'G00014', 'G00017', 'G00455'].includes(gid)) {
          await activateGroup(stg, gid);
        }
        summary.groups.push({ id: gid, action: res.action });
      } catch (e) {
        console.warn(`[error] group ${gid}: ${e.message.split('\n')[0]}`);
        summary.errors.push(`group ${gid}: ${e.message.split('\n')[0]}`);
      }
    }

    for (const gid of ['G00014', 'G00017']) {
      try {
        const r = await syncEnrollments(qa, stg, gid);
        summary.enrollments.push({ id: gid, ...r });
      } catch (e) {
        console.warn(`[error] enrollment ${gid}: ${e.message.split('\n')[0]}`);
        summary.errors.push(`enrollment ${gid}: ${e.message.split('\n')[0]}`);
      }
    }

    try {
      await ensureClaimsA3(stg);
    } catch (e) {
      summary.errors.push(`claims A3: ${e.message.split('\n')[0]}`);
    }

    console.log('[sync] SUMMARY');
    console.log(JSON.stringify(summary, null, 2));
  } finally {
    await qa.end().catch(() => {});
    await stg.end().catch(() => {});
  }
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
