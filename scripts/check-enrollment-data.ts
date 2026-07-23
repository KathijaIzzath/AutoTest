import { executeQuery } from './testData/database.utils';

(async () => {
  // Check G00014 enrollment records
  const g14 = await executeQuery(
    `SELECT id, reportid, enrollmentstatus, agreementsentdate::date AS sentdate, npi, taxid
     FROM groupenrollment WHERE reportid = $1 LIMIT 5`,
    ['G00014']
  );
  console.log('G00014 records:', g14.length);
  g14.forEach((r: any) => console.log(' ', JSON.stringify(r)));

  // Check G00017 enrollment records
  const g17 = await executeQuery(
    `SELECT id, reportid, enrollmentstatus, agreementsentdate::date AS sentdate
     FROM groupenrollment WHERE reportid = $1 LIMIT 5`,
    ['G00017']
  );
  console.log('G00017 records:', g17.length);
  g17.forEach((r: any) => console.log(' ', JSON.stringify(r)));

  // Check enrollment columns available
  const cols = await executeQuery(
    `SELECT column_name, data_type FROM information_schema.columns
     WHERE table_name = 'groupenrollment' ORDER BY ordinal_position`,
    []
  );
  console.log('\ngroupenrollment columns:');
  cols.forEach((c: any) => console.log(`  ${c.column_name}: ${c.data_type}`));

  process.exit(0);
})().catch((e: any) => { console.error('DB error:', e.message); process.exit(1); });
