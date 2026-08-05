/**
 * Compare key AutoTest seed IDs against staging DB.
 * Usage: node scripts/check-staging-testdata.cjs
 */
'use strict';

const { Client } = require('pg');

const cfg = {
  user: 'sc_app',
  host: 'pnk1scstgaio.ict.pulseinc.com',
  database: 'scltdb2',
  password: 'xyP,xii78',
  port: 5432,
  statement_timeout: 30000,
};

async function main() {
  console.log(`[check] staging db=${cfg.user}@${cfg.host}:${cfg.port}/${cfg.database}`);
  const client = new Client(cfg);
  await client.connect();
  await client.query('SET statement_timeout TO 30000');

  const out = [];
  async function check(label, sql, params = []) {
    try {
      const r = await client.query(sql, params);
      const sample = r.rows.slice(0, 2).map((row) => {
        const slim = {};
        for (const [k, v] of Object.entries(row)) {
          if (['id', 'name', 'groupname', 'accountnumber', 'accountname', 'accountnum', 'isactive', 'active', 'claimid', 'claimstatus', 'reportid', 'username', 'payerid', 'effectivedate', 'cnt'].includes(k.toLowerCase()) || Object.keys(slim).length < 6) {
            slim[k] = v;
          }
        }
        return slim;
      });
      out.push({ label, found: r.rowCount > 0, count: r.rowCount, sample });
    } catch (e) {
      out.push({ label, found: false, error: e.message.split('\n')[0] });
    }
  }

  const groupIds = ['G23496', 'G00455', 'G00014', 'G00017', 'G29837', 'G23734', 'G29515', 'G31927', 'G31928', 'G31943', 'G31930'];
  for (const g of groupIds) {
    await check(`providergroup:${g}`, 'SELECT * FROM providergroup WHERE id = $1 LIMIT 1', [g]);
  }

  const accounts = [
    'FFC001',
    'EditAccAutoTest001',
    'QAACCOUNTAUTOTEST001',
    'SCAUTOPROVTEST001',
    'SCAutoGroupEdit001',
    'AUTOMATIONTESTACC01',
    'VMCTEST',
    '000VMTEST',
    'E2ETESTACCOUNT01',
    'ACPM-4414',
  ];
  for (const a of accounts) {
    await check(
      `account:${a}`,
      'SELECT * FROM account WHERE accountnumber = $1 OR accountname = $1 LIMIT 2',
      [a],
    );
  }

  await check('claims:G23496_prefix_count', "SELECT count(*)::int AS cnt FROM claims WHERE claimid LIKE 'G23496%'");
  await check(
    'claims:setup_A3_ids',
    "SELECT claimid, claimstatus, reportid FROM claims WHERE claimid IN ('G234962207071312193U','G234962207071241121F')",
  );
  await check('enrollment:G00014', "SELECT count(*)::int AS cnt FROM groupenrollment WHERE id = 'G00014'");
  await check('enrollment:G00017', "SELECT count(*)::int AS cnt FROM groupenrollment WHERE id = 'G00017'");
  await check(
    'user:qasecureconnect',
    "SELECT username, active FROM usersclients WHERE lower(btrim(username)) = lower('qasecureconnect@gmail.com') LIMIT 1",
  );
  await check(
    'user:secureconnect50',
    "SELECT username, active FROM usersclients WHERE lower(btrim(username)) = lower('secureconnect50@gmail.com') LIMIT 1",
  );
  await check(
    'eramain:G26890_TREST',
    "SELECT id, payerid FROM eramain WHERE id = 'G26890' AND payerid = 'TREST' LIMIT 1",
  );

  // Missing summary for operator
  const missing = out.filter((x) => x.label.includes(':') && x.found === false && !x.error);
  const errors = out.filter((x) => x.error);
  console.log(JSON.stringify({ missing: missing.map((m) => m.label), errors, details: out }, null, 2));
  await client.end();
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
