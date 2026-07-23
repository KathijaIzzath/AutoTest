const { Client } = require('pg');
const cfg = { user:'sc_app', host:'Qnk1scltdb02.ict.pulseinc.com', database:'scltdb2', password:'xyP,xii78', port:5432 };
const today = new Date().toISOString().slice(0,10);

async function run() {
  const c = new Client(cfg);
  await c.connect();

  // Check G00014 records
  const g14 = await c.query(
    'SELECT id, enrollmentstatus, npi, taxid, payer, enrollmenttype, processorid, agreementsentdate::date, agreementdenieddate::date FROM groupenrollment WHERE id=$1',
    ['G00014']
  );
  console.log('G00014 records:', g14.rowCount);
  g14.rows.forEach(r => console.log('  ', JSON.stringify(r)));

  // Check G00017 records
  const g17 = await c.query(
    'SELECT id, enrollmentstatus, npi, taxid, payer, enrollmenttype, processorid, agreementsentdate::date FROM groupenrollment WHERE id=$1',
    ['G00017']
  );
  console.log('G00017 records:', g17.rowCount);
  g17.rows.forEach(r => console.log('  ', JSON.stringify(r)));

  // Show today's date for reference
  console.log('\nToday:', today);

  await c.end();
}
run().catch(e => { console.error(e.message); process.exit(1); });
