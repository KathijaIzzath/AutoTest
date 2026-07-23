const { Client } = require('pg');
const cfg = { user:'sc_app', host:'Qnk1scltdb02.ict.pulseinc.com', database:'scltdb2', password:'xyP,xii78', port:5432 };
const now = new Date().toISOString();
const today = now.slice(0,10);

async function run(c, label, sql, params) {
  try {
    const r = await c.query(sql, params);
    console.log(`✓ ${label}: ${r.rowCount} row(s)`);
  } catch(e) {
    console.warn(`⚠ ${label}: ${e.message}`);
  }
}

async function main() {
  const c = new Client(cfg);
  await c.connect();
  console.log('Connected. Timestamp:', now);

  await run(c, 'claims hintimestamp+dateofservice → now',
    'UPDATE claims SET hintimestamp=$1, dateofservice=$2', [now, now]);

  await run(c, 'eramain effectivedate → now',
    'UPDATE eramain SET effectivedate=$1', [now]);

  await run(c, 'eramain dateadded → now',
    'UPDATE eramain SET dateadded=$1', [now]);

  await run(c, 'remittance creationdate → now',
    'UPDATE remittance SET creationdate=$1', [now]);

  await run(c, 'groupenrollment dates (all statuses) → now',
    'UPDATE groupenrollment SET agreementSentDate=$1, agreementDeniedDate=$2', [now, now]);

  await run(c, 'G00014 enrollment dates → now',
    'UPDATE groupenrollment SET agreementSentDate=$1, agreementDeniedDate=$2, datelastdbupdate=$3, datesetup=$4 WHERE id=$5', [now, now, now, now, 'G00014']);

  await run(c, 'G00017 enrollment dates → now',
    'UPDATE groupenrollment SET agreementSentDate=$1, agreementDeniedDate=$2, datelastdbupdate=$3, datesetup=$4 WHERE id=$5', [now, now, now, now, 'G00017']);

  await run(c, 'claims A3 status for payer-rejection test claims',
    "UPDATE claims SET claimstatus='A3' WHERE claimid IN ($1,$2)",
    ['G234962207071312193U','G234962207071241121F']);

  // Verify
  const g14 = await c.query('SELECT COUNT(*) AS cnt FROM groupenrollment WHERE id=$1', ['G00014']);
  const g17 = await c.query('SELECT COUNT(*) AS cnt FROM groupenrollment WHERE id=$1', ['G00017']);
  const g14d = await c.query('SELECT agreementsentdate::date AS d FROM groupenrollment WHERE id=$1 LIMIT 1', ['G00014']);
  const g17d = await c.query('SELECT agreementsentdate::date AS d FROM groupenrollment WHERE id=$1 LIMIT 1', ['G00017']);
  console.log(`\nG00014: ${g14.rows[0].cnt} record(s), sentdate=${g14d.rows[0]?.d}`);
  console.log(`G00017: ${g17.rows[0].cnt} record(s), sentdate=${g17d.rows[0]?.d}`);
  console.log(`Today:  ${today}`);
  console.log(g14d.rows[0]?.d === today ? '✓ G00014 date matches today' : '✗ G00014 date mismatch!');
  console.log(g17d.rows[0]?.d === today ? '✓ G00017 date matches today' : '✗ G00017 date mismatch!');

  await c.end();
  console.log('\nAll DB prerequisites updated.');
}
main().catch(e => { console.error(e.message); process.exit(1); });
