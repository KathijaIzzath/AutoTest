/**
 * Sends a mock test execution summary email using the same HTML template
 * as the live reporter. Run with:
 *
 *   node scripts/send-mock-report.js
 *
 * SMTP settings are read from environment variables (or a .env file if
 * dotenv is installed):
 *
 *   SMTP_HOST   – required  e.g. smtp.office365.com
 *   SMTP_PORT   – optional  default 587
 *   SMTP_USER   – optional  SMTP login username
 *   SMTP_PASS   – optional  SMTP login password
 *   SMTP_SECURE – optional  set to "true" for port-465 TLS
 */

'use strict';

const dns      = require('dns').promises;

// Optional: load .env if present
try { require('dotenv').config(); } catch {}

const nodemailer = require('nodemailer');
const fs         = require('fs');
const path       = require('path');

// ─── Mock data ────────────────────────────────────────────────────────────────

const MOCK_MODULES = [
  {
    name: 'Account',
    durationMs: 14320,
    tests: [
      { title: 'should display account overview', status: 'passed', durationMs: 3100 },
      { title: 'should update account details',   status: 'passed', durationMs: 4820 },
      { title: 'should validate required fields',  status: 'failed', durationMs: 2400,
        error: 'expect(received).toBeVisible()\nElement not found: [data-testid="save-btn"]' },
      { title: 'should display account history',  status: 'passed', durationMs: 4000 },
    ],
  },
  {
    name: 'Claims',
    durationMs: 22540,
    tests: [
      { title: 'should load claims dashboard',            status: 'passed', durationMs: 3200 },
      { title: 'should filter claims by date range',      status: 'passed', durationMs: 5800 },
      { title: 'should submit a new claim',               status: 'passed', durationMs: 7100 },
      { title: 'should display claim status badge',       status: 'failed', durationMs: 2900,
        error: 'Timeout 30000ms exceeded waiting for element\n.claim-status-badge' },
      { title: 'should export claims to CSV',             status: 'skipped', durationMs: 0 },
      { title: 'should paginate claims list',             status: 'passed', durationMs: 3540 },
    ],
  },
  {
    name: 'ClaimStatus',
    durationMs: 9870,
    tests: [
      { title: 'should show pending status correctly',   status: 'passed', durationMs: 3200 },
      { title: 'should show approved status correctly',  status: 'passed', durationMs: 3450 },
      { title: 'should show rejected status correctly',  status: 'passed', durationMs: 3220 },
    ],
  },
  {
    name: 'Eligibility',
    durationMs: 17650,
    tests: [
      { title: 'should verify member eligibility',        status: 'passed', durationMs: 5400 },
      { title: 'should handle invalid member ID',         status: 'passed', durationMs: 3100 },
      { title: 'should display eligibility history',      status: 'passed', durationMs: 4800 },
      { title: 'should export eligibility report',        status: 'passed', durationMs: 4350 },
    ],
  },
  {
    name: 'GroupEnrollment',
    durationMs: 31200,
    tests: [
      { title: 'should navigate to group enrollments',   status: 'passed', durationMs: 2800 },
      { title: 'should add single payer enrollment',     status: 'passed', durationMs: 9400 },
      { title: 'should validate NPI field',              status: 'passed', durationMs: 3600 },
      { title: 'should validate Tax ID field',           status: 'passed', durationMs: 3600 },
      { title: 'should save enrollment and confirm',     status: 'passed', durationMs: 7400 },
      { title: 'should cancel enrollment via Back btn',  status: 'passed', durationMs: 4400 },
    ],
  },
  {
    name: 'Insurance',
    durationMs: 13480,
    tests: [
      { title: 'should display insurance dashboard',     status: 'passed', durationMs: 3200 },
      { title: 'should sort by insurance name (asc)',    status: 'passed', durationMs: 4600 },
      { title: 'should filter by payer',                 status: 'timedOut', durationMs: 5680,
        error: 'Test timeout of 60000ms exceeded.' },
    ],
  },
  {
    name: '01_Mainlogin_test',
    durationMs: 5820,
    tests: [
      { title: 'should login with valid credentials',    status: 'passed', durationMs: 5820 },
    ],
  },
  {
    name: '02_LandingDashboard_test',
    durationMs: 8100,
    tests: [
      { title: 'should display dashboard navigation links', status: 'passed', durationMs: 4200 },
      { title: 'should display user greeting',              status: 'passed', durationMs: 3900 },
    ],
  },
];

// ─── Helpers (mirrors summary-reporter.ts) ───────────────────────────────────

function msToHuman(ms) {
  if (ms < 1000)  return `${ms}ms`;
  if (ms < 60000) return `${(ms / 1000).toFixed(1)}s`;
  const m = Math.floor(ms / 60000);
  const s = ((ms % 60000) / 1000).toFixed(0);
  return `${m}m ${s}s`;
}

function statusBadge(status) {
  const map = {
    passed:      '#22c55e',
    failed:      '#ef4444',
    skipped:     '#f59e0b',
    timedOut:    '#f97316',
    interrupted: '#8b5cf6',
  };
  const color = map[status] ?? '#6b7280';
  const label = status.charAt(0).toUpperCase() + status.slice(1);
  return `<span style="display:inline-block;padding:2px 8px;border-radius:4px;background:${color};color:#fff;font-size:12px;font-weight:600">${label}</span>`;
}

function buildHtml(modules, overallResult, runDate) {
  const totalTests    = modules.reduce((s, m) => s + m.tests.length, 0);
  const totalPassed   = modules.reduce((s, m) => s + m.tests.filter(t => t.status === 'passed').length, 0);
  const totalFailed   = modules.reduce((s, m) => s + m.tests.filter(t => t.status === 'failed' || t.status === 'timedOut').length, 0);
  const totalSkipped  = modules.reduce((s, m) => s + m.tests.filter(t => t.status === 'skipped').length, 0);
  const totalDuration = modules.reduce((s, m) => s + m.durationMs, 0);

  const overallColor = overallResult === 'passed' ? '#22c55e' : overallResult === 'failed' ? '#ef4444' : '#f59e0b';

  let moduleRows = '';
  for (const mod of modules) {
    const modPassed = mod.tests.filter(t => t.status === 'passed').length;
    const modFailed = mod.tests.filter(t => t.status === 'failed' || t.status === 'timedOut').length;

    let testRows = '';
    for (const t of mod.tests) {
      const errorHtml = t.error
        ? `<br/><span style="font-family:monospace;font-size:11px;color:#dc2626">${t.error.replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/\n/g,'<br/>')}</span>`
        : '';
      testRows += `
        <tr>
          <td style="padding:6px 12px 6px 28px;border-bottom:1px solid #f1f5f9;color:#374151">${t.title}${errorHtml}</td>
          <td style="padding:6px 12px;border-bottom:1px solid #f1f5f9;text-align:center">${statusBadge(t.status)}</td>
          <td style="padding:6px 12px;border-bottom:1px solid #f1f5f9;text-align:right;color:#6b7280;white-space:nowrap">${msToHuman(t.durationMs)}</td>
        </tr>`;
    }

    moduleRows += `
      <tr style="background:#f8fafc">
        <td style="padding:10px 12px;font-weight:700;color:#1e293b;border-bottom:1px solid #e2e8f0">
          📁 ${mod.name}
        </td>
        <td style="padding:10px 12px;text-align:center;border-bottom:1px solid #e2e8f0">
          <span style="color:#22c55e;font-weight:600">${modPassed} passed</span>
          ${modFailed > 0 ? `&nbsp;<span style="color:#ef4444;font-weight:600">${modFailed} failed</span>` : ''}
        </td>
        <td style="padding:10px 12px;text-align:right;font-weight:600;color:#374151;border-bottom:1px solid #e2e8f0;white-space:nowrap">${msToHuman(mod.durationMs)}</td>
      </tr>
      ${testRows}`;
  }

  const summaryCards = [
    ['Total Tests', totalTests,             '#1e293b'],
    ['Passed',      totalPassed,            '#22c55e'],
    ['Failed',      totalFailed,            '#ef4444'],
    ['Skipped',     totalSkipped,           '#f59e0b'],
    ['Duration',    msToHuman(totalDuration),'#6366f1'],
  ].map(([label, value, color]) => `
    <div style="flex:1;padding:20px;text-align:center;border-right:1px solid #e2e8f0">
      <div style="font-size:24px;font-weight:700;color:${color}">${value}</div>
      <div style="font-size:12px;color:#64748b;margin-top:4px">${label}</div>
    </div>`).join('');

  return `<!DOCTYPE html>
<html lang="en">
<head><meta charset="UTF-8"/><meta name="viewport" content="width=device-width,initial-scale=1"/></head>
<body style="margin:0;padding:0;background:#f1f5f9;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif">
  <div style="max-width:800px;margin:32px auto;background:#fff;border-radius:8px;box-shadow:0 2px 8px rgba(0,0,0,0.08);overflow:hidden">
    <div style="background:#1e293b;padding:24px 32px">
      <h1 style="margin:0;color:#fff;font-size:22px;font-weight:700">AutoTest Execution Summary <span style="font-size:14px;font-weight:400;background:#f59e0b;color:#1e293b;border-radius:4px;padding:2px 8px;margin-left:8px">MOCK</span></h1>
      <p style="margin:4px 0 0;color:#94a3b8;font-size:14px">${runDate}</p>
    </div>
    <div style="background:${overallColor};padding:14px 32px">
      <span style="color:#fff;font-size:16px;font-weight:700">Overall Result: ${overallResult.toUpperCase()}</span>
    </div>
    <div style="display:flex;gap:0;border-bottom:1px solid #e2e8f0">${summaryCards}</div>
    <table style="width:100%;border-collapse:collapse;font-size:13px">
      <thead>
        <tr style="background:#f8fafc">
          <th style="padding:10px 12px;text-align:left;color:#475569;font-weight:600;border-bottom:2px solid #e2e8f0">Module / Test</th>
          <th style="padding:10px 12px;text-align:center;color:#475569;font-weight:600;border-bottom:2px solid #e2e8f0">Status</th>
          <th style="padding:10px 12px;text-align:right;color:#475569;font-weight:600;border-bottom:2px solid #e2e8f0">Duration</th>
        </tr>
      </thead>
      <tbody>${moduleRows}</tbody>
    </table>
    <div style="padding:16px 32px;background:#f8fafc;border-top:1px solid #e2e8f0;text-align:center">
      <p style="margin:0;font-size:12px;color:#94a3b8">Generated by AutoTest · ${new Date().toUTCString()} · This is a mock/test email</p>
    </div>
  </div>
</body>
</html>`;
}

// ─── Main ─────────────────────────────────────────────────────────────────────

async function main() {
  const runDate = new Date().toLocaleString('en-US', {
    weekday: 'long', year: 'numeric', month: 'long', day: 'numeric',
    hour: '2-digit', minute: '2-digit', timeZoneName: 'short',
  });

  // Mock overall result: failed because some tests failed
  const html = buildHtml(MOCK_MODULES, 'failed', runDate);

  const root        = path.resolve(__dirname, '..');
  const configPath  = path.join(root, 'scripts', 'email-config.json');
  const emailConfig = JSON.parse(fs.readFileSync(configPath, 'utf-8'));

  const now     = new Date();
  const dateStr = now.toISOString().slice(0, 10);
  const timeStr = now.toTimeString().slice(0, 8).replace(/:/g, '-');
  const subject = `[MOCK] ${(emailConfig.subject).replace('{date}', dateStr)}`;

  // Always save HTML to the configured output folder
  const reportDir  = emailConfig.reportOutputDir ?? root;
  fs.mkdirSync(reportDir, { recursive: true });
  const htmlOutPath = path.join(reportDir, `test-summary-mock-${dateStr}_${timeStr}.html`);
  fs.writeFileSync(htmlOutPath, html, 'utf-8');
  console.log(`\n[mock-report] HTML report saved: ${htmlOutPath}`);

  const smtpHost   = process.env.SMTP_HOST;
  const smtpPort   = parseInt(process.env.SMTP_PORT ?? '587', 10);
  const smtpUser   = process.env.SMTP_USER;
  const smtpPass   = process.env.SMTP_PASS;
  const smtpSecure = process.env.SMTP_SECURE === 'true';

  if (!smtpHost) {
    console.log('\n[mock-report] SMTP_HOST is not set — email not sent.');
    console.log('[mock-report] To send the email, set these environment variables and re-run:\n');
    console.log('  $env:SMTP_HOST   = "smtp.office365.com"   # your SMTP server');
    console.log('  $env:SMTP_PORT   = "587"                  # usually 587 (STARTTLS) or 465 (SSL)');
    console.log('  $env:SMTP_USER   = "you@harriscomputer.com"');
    console.log('  $env:SMTP_PASS   = "yourpassword"');
    console.log('  npm run email:test\n');
    console.log(`[mock-report] You can preview the report by opening: ${htmlOutPath}\n`);
    return;
  }

  console.log(`\n[mock-report] Sending to: ${emailConfig.recipients.join(', ')}`);
  console.log(`[mock-report] Via SMTP:    ${smtpHost}:${smtpPort}`);

  // Resolve to IPv4 explicitly so nodemailer never picks an IPv6 address
  let smtpIp = smtpHost;
  try {
    const addresses = await dns.resolve4(smtpHost);
    smtpIp = addresses[0];
    console.log(`[mock-report] Resolved ${smtpHost} → ${smtpIp} (IPv4)`);
  } catch {
    console.warn(`[mock-report] Could not resolve ${smtpHost} to IPv4, using hostname directly.`);
  }

  const transporter = nodemailer.createTransport({
    host: smtpIp,
    port: smtpPort,
    secure: smtpSecure,
    tls: { servername: smtpHost }, // SNI must match the certificate hostname
    auth: smtpUser && smtpPass ? { user: smtpUser, pass: smtpPass } : undefined,
  });

  try {
    const info = await transporter.sendMail({
      from: emailConfig.sender,
      to: emailConfig.recipients.join(', '),
      subject,
      html,
    });
    console.log(`[mock-report] ✓ Email sent! Message ID: ${info.messageId}\n`);
  } catch (err) {
    console.error('[mock-report] ✗ Failed to send email:', err.message);
    console.log(`[mock-report] The HTML report is still available at: ${htmlOutPath}\n`);
    process.exit(1);
  }
}

main().catch(err => { console.error(err); process.exit(1); });
