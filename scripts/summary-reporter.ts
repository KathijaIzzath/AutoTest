import type {
  Reporter,
  TestCase,
  TestResult,
  FullConfig,
  Suite,
  FullResult,
} from '@playwright/test/reporter';
import * as dns from 'dns';
import { promises as dnsPromises } from 'dns';
import * as nodemailer from 'nodemailer';
import * as fs from 'fs';
import * as path from 'path';

interface TestEntry {
  title: string;
  status: 'passed' | 'failed' | 'skipped' | 'timedOut' | 'interrupted';
  durationMs: number;
  error?: string;
}

interface ModuleEntry {
  name: string;
  tests: TestEntry[];
  durationMs: number;
}

function msToHuman(ms: number): string {
  if (ms < 1000) return `${ms}ms`;
  if (ms < 60000) return `${(ms / 1000).toFixed(1)}s`;
  const m = Math.floor(ms / 60000);
  const s = ((ms % 60000) / 1000).toFixed(0);
  return `${m}m ${s}s`;
}

function statusBadge(status: TestEntry['status']): string {
  const map: Record<TestEntry['status'], string> = {
    passed: '#22c55e',
    failed: '#ef4444',
    skipped: '#f59e0b',
    timedOut: '#f97316',
    interrupted: '#8b5cf6',
  };
  const color = map[status] ?? '#6b7280';
  const label = status.charAt(0).toUpperCase() + status.slice(1);
  return `<span style="display:inline-block;padding:2px 8px;border-radius:4px;background:${color};color:#fff;font-size:12px;font-weight:600">${label}</span>`;
}

function buildHtml(modules: ModuleEntry[], overallResult: FullResult['status'], runDate: string): string {
  const totalTests = modules.reduce((s, m) => s + m.tests.length, 0);
  const totalPassed = modules.reduce((s, m) => s + m.tests.filter(t => t.status === 'passed').length, 0);
  const totalFailed = modules.reduce((s, m) => s + m.tests.filter(t => t.status === 'failed' || t.status === 'timedOut').length, 0);
  const totalSkipped = modules.reduce((s, m) => s + m.tests.filter(t => t.status === 'skipped').length, 0);
  const totalDuration = modules.reduce((s, m) => s + m.durationMs, 0);

  const overallColor = overallResult === 'passed' ? '#22c55e' : overallResult === 'failed' ? '#ef4444' : '#f59e0b';

  let moduleRows = '';
  for (const mod of modules) {
    const modPassed = mod.tests.filter(t => t.status === 'passed').length;
    const modFailed = mod.tests.filter(t => t.status === 'failed' || t.status === 'timedOut').length;

    let testRows = '';
    for (const t of mod.tests) {
      const errorHtml = t.error
        ? `<br/><span style="font-family:monospace;font-size:11px;color:#dc2626">${t.error.replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/\n/g, '<br/>')}</span>`
        : '';
      testRows += `
        <tr>
          <td style="padding:6px 12px 6px 28px;border-bottom:1px solid #f1f5f9;color:#374151">${t.title.replace(/</g, '&lt;')}${errorHtml}</td>
          <td style="padding:6px 12px;border-bottom:1px solid #f1f5f9;text-align:center">${statusBadge(t.status)}</td>
          <td style="padding:6px 12px;border-bottom:1px solid #f1f5f9;text-align:right;color:#6b7280;white-space:nowrap">${msToHuman(t.durationMs)}</td>
        </tr>`;
    }

    moduleRows += `
      <tr style="background:#f8fafc">
        <td style="padding:10px 12px;font-weight:700;color:#1e293b;border-bottom:1px solid #e2e8f0">
          📁 ${mod.name.replace(/</g, '&lt;')}
        </td>
        <td style="padding:10px 12px;text-align:center;border-bottom:1px solid #e2e8f0">
          <span style="color:#22c55e;font-weight:600">${modPassed} passed</span>
          ${modFailed > 0 ? `&nbsp;<span style="color:#ef4444;font-weight:600">${modFailed} failed</span>` : ''}
        </td>
        <td style="padding:10px 12px;text-align:right;font-weight:600;color:#374151;border-bottom:1px solid #e2e8f0;white-space:nowrap">${msToHuman(mod.durationMs)}</td>
      </tr>
      ${testRows}`;
  }

  return `<!DOCTYPE html>
<html lang="en">
<head><meta charset="UTF-8"/><meta name="viewport" content="width=device-width,initial-scale=1"/></head>
<body style="margin:0;padding:0;background:#f1f5f9;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif">
  <div style="max-width:800px;margin:32px auto;background:#fff;border-radius:8px;box-shadow:0 2px 8px rgba(0,0,0,0.08);overflow:hidden">

    <!-- Header -->
    <div style="background:#1e293b;padding:24px 32px">
      <h1 style="margin:0;color:#fff;font-size:22px;font-weight:700">AutoTest Execution Summary</h1>
      <p style="margin:4px 0 0;color:#94a3b8;font-size:14px">${runDate}</p>
    </div>

    <!-- Overall status banner -->
    <div style="background:${overallColor};padding:14px 32px">
      <span style="color:#fff;font-size:16px;font-weight:700">
        Overall Result: ${overallResult.toUpperCase()}
      </span>
    </div>

    <!-- Summary cards -->
    <div style="display:flex;gap:0;border-bottom:1px solid #e2e8f0">
      ${[
        ['Total Tests', totalTests, '#1e293b'],
        ['Passed', totalPassed, '#22c55e'],
        ['Failed', totalFailed, '#ef4444'],
        ['Skipped', totalSkipped, '#f59e0b'],
        ['Duration', msToHuman(totalDuration), '#6366f1'],
      ].map(([label, value, color]) => `
      <div style="flex:1;padding:20px;text-align:center;border-right:1px solid #e2e8f0">
        <div style="font-size:24px;font-weight:700;color:${color}">${value}</div>
        <div style="font-size:12px;color:#64748b;margin-top:4px">${label}</div>
      </div>`).join('')}
    </div>

    <!-- Test detail table -->
    <table style="width:100%;border-collapse:collapse;font-size:13px">
      <thead>
        <tr style="background:#f8fafc">
          <th style="padding:10px 12px;text-align:left;color:#475569;font-weight:600;border-bottom:2px solid #e2e8f0">Module / Test</th>
          <th style="padding:10px 12px;text-align:center;color:#475569;font-weight:600;border-bottom:2px solid #e2e8f0">Status</th>
          <th style="padding:10px 12px;text-align:right;color:#475569;font-weight:600;border-bottom:2px solid #e2e8f0">Duration</th>
        </tr>
      </thead>
      <tbody>
        ${moduleRows}
      </tbody>
    </table>

    <!-- Footer -->
    <div style="padding:16px 32px;background:#f8fafc;border-top:1px solid #e2e8f0;text-align:center">
      <p style="margin:0;font-size:12px;color:#94a3b8">Generated by AutoTest · ${new Date().toUTCString()}</p>
    </div>
  </div>
</body>
</html>`;
}

class SummaryEmailReporter implements Reporter {
  private modules = new Map<string, ModuleEntry>();
  private rootDir = '';

  onBegin(config: FullConfig, _suite: Suite): void {
    this.rootDir = config.rootDir;
  }

  onTestEnd(test: TestCase, result: TestResult): void {
    // Derive module name from file path relative to rootDir
    const rel = path.relative(this.rootDir, test.location.file);
    // Group by immediate subfolder under tests/, or "Root" for top-level spec files
    const parts = rel.replace(/\\/g, '/').split('/');
    let moduleName: string;
    if (parts.length >= 3 && parts[0] === 'tests') {
      // tests/ModuleName/file.spec.ts → ModuleName
      moduleName = parts[1];
    } else {
      // tests/file.spec.ts → filename without extension
      moduleName = path.basename(rel, path.extname(rel));
    }

    if (!this.modules.has(moduleName)) {
      this.modules.set(moduleName, { name: moduleName, tests: [], durationMs: 0 });
    }
    const mod = this.modules.get(moduleName)!;

    // Build full test title (skip the file-level suite title which duplicates the module)
    const titlePath = test.titlePath();
    const title = titlePath.slice(1).join(' › ') || test.title;

    const entry: TestEntry = {
      title,
      status: result.status,
      durationMs: result.duration,
    };
    if (result.status === 'failed' || result.status === 'timedOut') {
      const err = result.errors[0];
      if (err?.message) {
        entry.error = err.message.split('\n').slice(0, 3).join('\n');
      }
    }
    mod.tests.push(entry);
    mod.durationMs += result.duration;
  }

  async onEnd(result: FullResult): Promise<void> {
    if (this.modules.size === 0) return;

    const runDate = new Date().toLocaleString('en-US', {
      weekday: 'long', year: 'numeric', month: 'long', day: 'numeric',
      hour: '2-digit', minute: '2-digit', timeZoneName: 'short',
    });

    const modules = Array.from(this.modules.values()).sort((a, b) => a.name.localeCompare(b.name));
    const html = buildHtml(modules, result.status, runDate);

    // Load email config
    const configPath = path.join(this.rootDir, 'scripts', 'email-config.json');
    const emailConfig = JSON.parse(fs.readFileSync(configPath, 'utf-8'));

    const now = new Date();
    const dateStr = now.toISOString().slice(0, 10);
    const timeStr = now.toTimeString().slice(0, 8).replace(/:/g, '-');
    const subject = (emailConfig.subject as string).replace('{date}', dateStr);

    // Always save HTML report to the configured output folder
    const reportDir: string = emailConfig.reportOutputDir ?? this.rootDir;
    fs.mkdirSync(reportDir, { recursive: true });
    const reportFileName = `test-summary-${dateStr}_${timeStr}.html`;
    const reportPath = path.join(reportDir, reportFileName);
    fs.writeFileSync(reportPath, html, 'utf-8');
    console.log(`[summary-reporter] Report saved to: ${reportPath}`);

    // SMTP settings from environment variables
    const smtpHost = process.env.SMTP_HOST;
    const smtpPort = parseInt(process.env.SMTP_PORT ?? '587', 10);
    const smtpUser = process.env.SMTP_USER;
    const smtpPass = process.env.SMTP_PASS;
    const smtpSecure = process.env.SMTP_SECURE === 'true';

    if (!smtpHost) {
      console.warn('[summary-reporter] SMTP_HOST not set — skipping email. Set SMTP_HOST, SMTP_PORT, SMTP_USER, SMTP_PASS environment variables.');
      return;
    }

    // Force IPv4 DNS resolution to avoid ENETUNREACH on IPv6 addresses
    dns.setDefaultResultOrder('ipv4first');
    let smtpIp = smtpHost;
    try {
      const addresses = await dnsPromises.resolve4(smtpHost);
      smtpIp = addresses[0];
      console.log(`[summary-reporter] Resolved ${smtpHost} → ${smtpIp} (IPv4)`);
    } catch {
      console.warn(`[summary-reporter] Could not resolve ${smtpHost} to IPv4, using hostname directly.`);
    }

    const transporter = nodemailer.createTransport({
      host: smtpIp,
      port: smtpPort,
      secure: smtpSecure,
      tls: { servername: smtpHost }, // SNI must match the certificate hostname
      auth: smtpUser && smtpPass ? { user: smtpUser, pass: smtpPass } : undefined,
    });

    try {
      await transporter.sendMail({
        from: emailConfig.sender,
        to: (emailConfig.recipients as string[]).join(', '),
        subject,
        html,
      });
      console.log(`[summary-reporter] Email sent to: ${(emailConfig.recipients as string[]).join(', ')}`);
    } catch (err) {
      console.error('[summary-reporter] Failed to send email:', err);
      console.log(`[summary-reporter] Report is still available at: ${reportPath}`);
    }
  }
}

export default SummaryEmailReporter;
