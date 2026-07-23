'use strict';
/**
 * daily-reporter.cjs – Playwright reporter that generates a daily HTML summary
 * at C:\Users\kmohamed\Desktop\Daily Test Execution Summary\
 *
 * Registered in playwright.config.ts as ['./scripts/daily-reporter.cjs']
 * Runs automatically after every test execution.
 * One file per calendar day (overwrites same-day files).
 * Columns: Module | Test Name | Status | Duration
 */

const fs   = require('fs');
const path = require('path');

// ── helpers ────────────────────────────────────────────────────────────────

function msToHuman(ms) {
  if (!ms || ms < 0) return '–';
  if (ms < 1000)  return ms + 'ms';
  if (ms < 60000) return (ms / 1000).toFixed(1) + 's';
  const m = Math.floor(ms / 60000);
  return m + 'm ' + ((ms % 60000) / 1000).toFixed(0) + 's';
}

function statusBadge(status) {
  const styles = {
    passed:      ['#22c55e', 'PASSED'],
    failed:      ['#ef4444', 'FAILED'],
    timedOut:    ['#f97316', 'TIMEOUT'],
    skipped:     ['#f59e0b', 'SKIPPED'],
    interrupted: ['#8b5cf6', 'ABORTED'],
  };
  const [bg, label] = styles[status] || ['#6b7280', (status || '?').toUpperCase()];
  return `<span style="display:inline-block;padding:2px 8px;border-radius:4px;background:${bg};color:#fff;font-size:11px;font-weight:700">${label}</span>`;
}

function buildHtml(moduleMap, overallStatus) {
  const now     = new Date();
  const runDate = now.toLocaleString('en-US', {
    weekday:'long', year:'numeric', month:'long', day:'numeric',
    hour:'2-digit', minute:'2-digit', timeZoneName:'short',
  });

  let totalTests = 0, totalPassed = 0, totalFailed = 0, totalSkipped = 0, totalMs = 0;
  for (const [, tests] of moduleMap) {
    for (const t of tests) {
      totalTests++;
      if      (t.status === 'passed')                       totalPassed++;
      else if (t.status === 'failed' || t.status === 'timedOut') totalFailed++;
      else if (t.status === 'skipped')                      totalSkipped++;
      totalMs += t.durationMs;
    }
  }

  const overallColor = totalFailed > 0 ? '#ef4444' : '#22c55e';
  const overallLabel = totalFailed > 0 ? 'FAILED'  : 'PASSED';

  let tableRows = '';
  for (const [modName, tests] of moduleMap) {
    const mp = tests.filter(t => t.status === 'passed').length;
    const mf = tests.filter(t => t.status === 'failed' || t.status === 'timedOut').length;
    const mMs = tests.reduce((s, t) => s + t.durationMs, 0);

    tableRows += `<tr style="background:#f1f5f9">
      <td colspan="2" style="padding:10px 12px;font-weight:700;color:#1e293b;border-bottom:1px solid #e2e8f0;font-size:13px">
        📁 ${modName.replace(/</g,'&lt;')}
      </td>
      <td style="padding:10px 12px;text-align:center;border-bottom:1px solid #e2e8f0">
        <span style="color:#22c55e;font-weight:600;font-size:12px">${mp} passed</span>
        ${mf > 0 ? `&nbsp;<span style="color:#ef4444;font-weight:600;font-size:12px">${mf} failed</span>` : ''}
      </td>
      <td style="padding:10px 12px;text-align:right;font-weight:600;color:#374151;border-bottom:1px solid #e2e8f0;font-size:12px">${msToHuman(mMs)}</td>
    </tr>`;

    for (const t of tests) {
      const errHtml = t.error
        ? `<br/><span style="font-family:monospace;font-size:10px;color:#dc2626">${t.error.replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/\n/g,'<br/>')}</span>`
        : '';
      tableRows += `<tr>
        <td style="padding:6px 12px 6px 28px;border-bottom:1px solid #f8fafc;color:#374151;font-size:12px">${t.title.replace(/</g,'&lt;')}${errHtml}</td>
        <td style="padding:6px 12px;border-bottom:1px solid #f8fafc"></td>
        <td style="padding:6px 12px;border-bottom:1px solid #f8fafc;text-align:center">${statusBadge(t.status)}</td>
        <td style="padding:6px 12px;border-bottom:1px solid #f8fafc;text-align:right;color:#6b7280;font-size:12px;white-space:nowrap">${msToHuman(t.durationMs)}</td>
      </tr>`;
    }
  }

  const summaryCards = [
    ['Total',    totalTests,              '#1e293b'],
    ['Passed',   totalPassed,             '#22c55e'],
    ['Failed',   totalFailed,             '#ef4444'],
    ['Skipped',  totalSkipped,            '#f59e0b'],
    ['Duration', msToHuman(totalMs),      '#6366f1'],
  ].map(([l,v,c]) => `<div style="flex:1;padding:16px;text-align:center;border-right:1px solid #e2e8f0">
    <div style="font-size:22px;font-weight:700;color:${c}">${v}</div>
    <div style="font-size:11px;color:#64748b;margin-top:3px">${l}</div></div>`).join('');

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8"/>
  <title>AutoTest Daily Report – ${now.toISOString().slice(0,10)}</title>
</head>
<body style="margin:0;padding:0;background:#f1f5f9;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif">
  <div style="max-width:900px;margin:32px auto;background:#fff;border-radius:8px;box-shadow:0 2px 8px rgba(0,0,0,0.08);overflow:hidden">
    <div style="background:#1e293b;padding:24px 32px">
      <h1 style="margin:0;color:#fff;font-size:22px;font-weight:700">AutoTest Daily Execution Summary</h1>
      <p style="margin:4px 0 0;color:#94a3b8;font-size:14px">${runDate}</p>
    </div>
    <div style="background:${overallColor};padding:14px 32px">
      <span style="color:#fff;font-size:16px;font-weight:700">Overall Result: ${overallLabel}</span>
    </div>
    <div style="display:flex;border-bottom:1px solid #e2e8f0">${summaryCards}</div>
    <table style="width:100%;border-collapse:collapse">
      <thead>
        <tr style="background:#f8fafc">
          <th style="padding:10px 12px;text-align:left;color:#475569;font-weight:600;border-bottom:2px solid #e2e8f0;font-size:12px">Module / Test Name</th>
          <th style="padding:10px 12px;border-bottom:2px solid #e2e8f0"></th>
          <th style="padding:10px 12px;text-align:center;color:#475569;font-weight:600;border-bottom:2px solid #e2e8f0;font-size:12px">Status</th>
          <th style="padding:10px 12px;text-align:right;color:#475569;font-weight:600;border-bottom:2px solid #e2e8f0;font-size:12px">Duration</th>
        </tr>
      </thead>
      <tbody>${tableRows}</tbody>
    </table>
    <div style="padding:14px 32px;background:#f8fafc;border-top:1px solid #e2e8f0;text-align:center">
      <p style="margin:0;font-size:11px;color:#94a3b8">AutoTest · ${now.toUTCString()}</p>
    </div>
  </div>
</body>
</html>`;
}

// ── Playwright Reporter class ───────────────────────────────────────────────

class DailyReporter {
  constructor() {
    this._modules = new Map();   // Map<moduleName, Array<TestEntry>>
    this._rootDir = '';
  }

  onBegin(config) {
    this._rootDir = config.rootDir || process.cwd();
  }

  onTestEnd(test, result) {
    try {
      const rel   = path.relative(this._rootDir, test.location.file).replace(/\\/g, '/');
      const parts = rel.split('/');
      let   mod;
      if (parts.length >= 3 && parts[0] === 'tests') {
        mod = parts[1];
      } else {
        mod = path.basename(rel, '.spec.ts').replace(/_test\.spec$/, '').replace(/_spec$/, '');
      }

      if (!this._modules.has(mod)) this._modules.set(mod, []);

      const titlePath = test.titlePath();
      const title     = titlePath.slice(1).join(' › ') || test.title;

      let error = '';
      if (result.status === 'failed' || result.status === 'timedOut') {
        error = (result.errors?.[0]?.message || '').split('\n').slice(0, 3).join('\n');
      }

      this._modules.get(mod).push({
        title,
        status:     result.status,
        durationMs: result.duration,
        error,
      });
    } catch (e) {
      // Non-fatal: never let reporter errors break the test run
    }
  }

  async onEnd(result) {
    if (this._modules.size === 0) return;

    try {
      const OUTPUT_DIR = 'C:\\Users\\kmohamed\\Desktop\\Daily Test Execution Summary';
      fs.mkdirSync(OUTPUT_DIR, { recursive: true });

      // One file per day – overwrite if same day
      const dateStr  = new Date().toISOString().slice(0, 10);
      const outPath  = path.join(OUTPUT_DIR, `test-summary-${dateStr}.html`);
      const html     = buildHtml(this._modules, result.status);
      fs.writeFileSync(outPath, html, 'utf-8');

      // Count totals for console log
      let passed = 0, failed = 0, skipped = 0, total = 0;
      for (const [, tests] of this._modules) {
        for (const t of tests) {
          total++;
          if      (t.status === 'passed')                             passed++;
          else if (t.status === 'failed' || t.status === 'timedOut') failed++;
          else if (t.status === 'skipped')                           skipped++;
        }
      }

      console.log(`[daily-report] ✓ Report saved: ${outPath}`);
      console.log(`[daily-report]   ${total} tests — ${passed} passed | ${failed} failed | ${skipped} skipped`);
    } catch (err) {
      console.warn('[daily-report] Failed to write Desktop report:', err.message);
    }
  }
}

module.exports = DailyReporter;
