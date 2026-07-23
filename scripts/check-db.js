const { Client } = require('pg');

const cfg = {
  user: 'sc_app',
  host: 'Qnk1scltdb02.ict.pulseinc.com',
  database: 'scltdb2',
  password: 'xyP,xii78',
  port: 5432,
};

async function run() {
  const client = new Client(cfg);
  await client.connect();

  // First: get all column names
  const cols = await client.query(
    `SELECT column_name, data_type
     FROM information_schema.columns
     WHERE table_name = 'groupenrollment'
     ORDER BY ordinal_position`
  );
  console.log('groupenrollment columns:');
  const colNames = cols.rows.map(r => r.column_name);
  cols.rows.forEach(r => console.log(`  ${r.column_name} (${r.data_type})`));

  // Sample a few rows to understand the data
  const sample = await client.query('SELECT * FROM groupenrollment LIMIT 3');
  console.log('\nSample rows:');
  sample.rows.forEach(r => console.log(' ', JSON.stringify(r)));

  await client.end();
}

run().catch(e => { console.error('Error:', e.message); process.exit(1); });

async function run() {
  const client = new Client(cfg);
  await client.connect();

  const g14 = await client.query(
    `SELECT reportid, enrollmentstatus, npi, taxid,
            agreementsentdate::date AS sentdate,
            agreementdenieddate::date AS denieddate
     FROM groupenrollment WHERE reportid = $1 LIMIT 5`,
    ['G00014']
  );
  console.log('G00014 records:', g14.rowCount);
  g14.rows.forEach(r => console.log(' ', JSON.stringify(r)));

  const g17 = await client.query(
    `SELECT reportid, enrollmentstatus,
            agreementsentdate::date AS sentdate
     FROM groupenrollment WHERE reportid = $1 LIMIT 5`,
    ['G00017']
  );
  console.log('G00017 records:', g17.rowCount);
  g17.rows.forEach(r => console.log(' ', JSON.stringify(r)));

  // Get all columns in groupenrollment
  const cols = await client.query(
    `SELECT column_name, data_type, is_nullable
     FROM information_schema.columns
     WHERE table_name = 'groupenrollment'
     ORDER BY ordinal_position`
  );
  console.log('\ngroupenrollment columns:');
  cols.rows.forEach(r => console.log(`  ${r.column_name} (${r.data_type}, nullable:${r.is_nullable})`));

  await client.end();
}

run().catch(e => { console.error('Error:', e.message); process.exit(1); });
