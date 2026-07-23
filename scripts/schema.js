const { Client } = require('pg');
const cfg = { user:'sc_app', host:'Qnk1scltdb02.ict.pulseinc.com', database:'scltdb2', password:'xyP,xii78', port:5432 };
async function run() {
  const c = new Client(cfg);
  await c.connect();
  const r = await c.query('SELECT column_name, data_type FROM information_schema.columns WHERE table_name=$1 ORDER BY ordinal_position', ['groupenrollment']);
  console.log('Columns:', r.rows.map(x => x.column_name + ':' + x.data_type).join(', '));
  const s = await c.query('SELECT * FROM groupenrollment LIMIT 2');
  console.log('Row 0:', JSON.stringify(s.rows[0]));
  await c.end();
}
run().catch(e => { console.error(e.message); process.exit(1); });
