/**
 * Quick DB connectivity probe for the active TEST_ENV.
 * Usage:
 *   node scripts/check-env-db.cjs
 *   node scripts/check-env-db.cjs --env=staging
 */
'use strict';

const { Client } = require('pg');
const path = require('path');

// Minimal inline config mirroring testData/env-config.ts (CJS-friendly).
const ENVIRONMENTS = {
  qa: {
    label: 'QA (qnk1scltweb02)',
    db: {
      user: 'sc_app',
      host: 'Qnk1scltdb02.ict.pulseinc.com',
      database: 'scltdb2',
      password: 'xyP,xii78',
      port: 5432,
    },
  },
  staging: {
    label: 'Staging (scdemo)',
    db: {
      user: 'sc_app',
      host: 'pnk1scstgaio.ict.pulseinc.com',
      database: 'scltdb2',
      password: 'xyP,xii78',
      port: 5432,
    },
  },
};

function normalizeEnv(value) {
  const v = String(value || '').trim().toLowerCase();
  if (v === 'staging' || v === 'scdemo' || v === 's') return 'staging';
  return 'qa';
}

function resolveEnv() {
  const arg = process.argv.find((a) => a.startsWith('--env='));
  if (arg) return normalizeEnv(arg.slice('--env='.length));
  return normalizeEnv(process.env.TEST_ENV || 'qa');
}

async function main() {
  const env = resolveEnv();
  const cfg = ENVIRONMENTS[env];
  console.log(`[check-env-db] Environment: ${cfg.label}`);
  console.log(`[check-env-db] Connecting to ${cfg.db.user}@${cfg.db.host}:${cfg.db.port}/${cfg.db.database} ...`);

  const client = new Client(cfg.db);
  try {
    await client.connect();
    const result = await client.query('SELECT current_database() AS db, inet_server_addr() AS addr, NOW() AS now');
    console.log('[check-env-db] ✓ Connected successfully');
    console.log('[check-env-db]   ', result.rows[0]);
    await client.end();
    process.exit(0);
  } catch (err) {
    console.error('[check-env-db] ✗ Connection failed');
    console.error(`[check-env-db]   ${err.message}`);
    if (env === 'staging') {
      console.error('[check-env-db] Staging DB host is pnk1scstgaio.ict.pulseinc.com:5432.');
      console.error('[check-env-db] Verify VPN/network access to the staging database host, then retry.');
    }
    try { await client.end(); } catch {}
    process.exit(1);
  }
}

main();
