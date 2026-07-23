/**
 * generate-daily-report.js
 *
 * Reads Playwright's test-results-latest.json and writes a daily HTML summary
 * to C:\Users\kmohamed\Desktop\Daily Test Execution Summary\
 *
 * Columns: Module | Test Name | Status | Duration
 * One file per day (date-only filename) — re-run overwrites the same day's file.
 */

'use strict';

const fs   = require('fs');
const path = require('path');

const ROOT        = path.resolve(__dirname, '..');
const JSON_SOURCE = path.join(ROOT, 'test-results-latest.json');
const OUTPUT_DIR  = 'C:\\Users\\kmohamed\\Desktop\\Daily Test Execution Summary';

// ── helpers ────────────────────────────────────────────────────────────────

function msToHuman(ms) {
  if (!ms || ms < 0) return '–';
  if (ms < 1000)  return ms + 'ms';
  if (ms < 60000) return (ms / 1000).toFixed(1) + 's';
  const m = Math.floor(ms / 60000);
  const s = ((ms % 60000) / 1000).toFixed(0);
  return m + 'm ' + s + 's';
}

function statusBadge(status) {
  const map = {
    passed:      { bg: '#22c55e', label: 'PASSED'  },
    failed:      { bg: '#ef4444', label: 'FAILED'  },
    timedOut:    { bg: '#f97316', label: 'TIMEOUT' },
    skipped:     { bg: '#f59e0b', label: 'SKIPPED' },
    interrupted: { bg: '#8b5cf6', label: 'ABORTED' },
  };
  const { bg, label } = map[status] || { bg: '#6b7280', label: status?.toUpperCase() || '?' };
  return `<span style="display:inline-block;padding:2px 8px;border-radius:4px;
    background:${bg};color:#fff;font-size:11px;font-weight:700">${label}</span>`;
}

// ── parse Playwright JSON ──────────────────────────────────────────────────

function extractTests(suite, moduleName, results) {
  // suite.specs contains individual tests
  if (suite.specs) {
    for (const spec of suite.specs) {
      const testTitle = [suite.title, spec.title].filter(Boolean).join(' › ');
      // Use results[0].status for the actual outcome (passed/failed/skipped/timedOut)
      // test.status is Playwright's combined value ("expected"/"unexpected") not the raw outcome
      const result    = spec.tests?.[0]?.results?.[0] ?? {};
      const rawStatus = result.status ?? 'unknown';
      // Normalize: treat 'interrupted' as 'failed'
      const status = rawStatus === 'interrupted' ? 'failed' : rawStatus;
      const duration  = result.duration ?? 0;
      // Capture first error message if failed
      const errorMsg  = (rawStatus === 'failed' || rawStatus === 'timedOut')
        ? (result.errors?.[0]?.message ?? '').split('\n').slice(0, 3).join('\n')
        : '';
      results.push({ module: moduleName, title: testTitle, status, duration, error: errorMsg });
    }
  }
  // Recurse into child suites
  if (suite.suites) {
    for (const child of suite.suites) {
      const childModule = moduleName || child.title || 'Root';
      extractTests(child, childModule, results);
    }
  }
}

function loadResults() {
  if (!fs.existsSync(JSON_SOURCE)) {
    console.warn('[daily-report] test-results-latest.json not found at', JSON_SOURCE);
    return null;
  }
  try {
    const raw  = JSON.parse(fs.readFileSync(JSON_SOURCE, 'utf-8'));
    const tests = [];
    for (const suite of (raw.suites ?? [])) {
      // Top-level suite title is the file path; derive module name from it
      const rel    = (suite.file || suite.title || '').replace(/\\/g, '/');
      const parts  = rel.split('/');
      let module;
      if (parts.length >= 3 && parts[0] === 'tests') {
        module = parts[1];                          // tests/Module/file.spec.ts → Module
      } else {
        module = path.basename(rel, '.spec.ts');    // tests/file.spec.ts → filename
      }
      extractTests(suite, module, tests);
    }
    return { tests, stats: raw.stats ?? {} };
  } catch (e) {
    console.error('[daily-report] Failed to parse JSON:', e.message);
    return null;
  }
}

// ── build HTML ─────────────────────────────────────────────────────────────

function buildHtml(tests, stats) {
  const now      = new Date();
  const runDate  = now.toLocaleString('en-US', {
    weekday: 'long', year: 'numeric', month: 'long', day: 'numeric',
    hour: '2-digit', minute: '2-digit', timeZoneName: 'short',
  });

  const passed   = tests.filter(t => t.status === 'passed').length;
  const failed   = tests.filter(t => t.status === 'failed' || t.status === 'timedOut').length;
  const skipped  = tests.filter(t => t.status === 'skipped').length;
  const total    = tests.length;
  const totalMs  = tests.reduce((s, t) => s + t.duration, 0);
  const overall  = failed > 0 ? 'FAILED' : 'PASSED';
  const headerBg = failed > 0 ? '#ef4444' : '#22c55e';

  // Group by module
  const byModule = {};
  for (const t of tests) {
    if (!byModule[t.module]) byModule[t.module] = [];
    byModule[t.module].push(t);
  }

  let tableRows = '';
  for (const [mod, modTests] of Object.entries(byModule)) {
    const modPassed = modTests.filter(t => t.status === 'passed').length;
    const modFailed = modTests.filter(t => t.status === 'failed' || t.status === 'timedOut').length;
    const modMs     = modTests.reduce((s, t) => s + t.duration, 0);

    tableRows += `<tr style="background:#f1f5f9">
      <td colspan="2" style="padding:10px 12px;font-weight:700;color:#1e293b;border-bottom:1px solid #e2e8f0;font-size:13px">
        📁 ${mod}
      </td>
      <td style="padding:10px 12px;text-align:center;border-bottom:1px solid #e2e8f0">
        <span style="color:#22c55e;font-weight:600;font-size:12px">${modPassed} passed</span>
        ${modFailed > 0 ? `&nbsp;<span style="color:#ef4444;font-weight:600;font-size:12px">${modFailed} failed</span>` : ''}
      </td>
      <td style="padding:10px 12px;text-align:right;font-weight:600;color:#374151;border-bottom:1px solid #e2e8f0;font-size:12px">${msToHuman(modMs)}</td>
    </tr>`;

    for (const t of modTests) {
      const errorHtml = t.error
        ? `<br/><span style="font-family:monospace;font-size:10px;color:#dc2626">${t.error.replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/\n/g,'<br/>')}</span>`
        : '';
      tableRows += `<tr>
        <td style="padding:6px 12px 6px 28px;border-bottom:1px solid #f8fafc;color:#374151;font-size:12px;width:50%">${t.title.replace(/</g,'&lt;')}${errorHtml}</td>
        <td style="padding:6px 12px;border-bottom:1px solid #f8fafc;font-size:12px;color:#64748b"></td>
        <td style="padding:6px 12px;border-bottom:1px solid #f8fafc;text-align:center">${statusBadge(t.status)}</td>
        <td style="padding:6px 12px;border-bottom:1px solid #f8fafc;text-align:right;color:#6b7280;font-size:12px;white-space:nowrap">${msToHuman(t.duration)}</td>
      </tr>`;
    }
  }

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8"/>
  <meta name="viewport" content="width=device-width,initial-scale=1"/>
  <title>AutoTest Daily Report – ${now.toISOString().slice(0,10)}</title>
</head>
<body style="margin:0;padding:0;background:#f1f5f9;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif">
  <div style="max-width:900px;margin:32px auto;background:#fff;border-radius:8px;box-shadow:0 2px 8px rgba(0,0,0,0.08);overflow:hidden">

    <div style="background:#1e293b;padding:24px 32px">
      <h1 style="margin:0;color:#fff;font-size:22px;font-weight:700">AutoTest Daily Execution Summary</h1>
      <p style="margin:4px 0 0;color:#94a3b8;font-size:14px">${runDate}</p>
    </div>

    <div style="background:${headerBg};padding:14px 32px">
      <span style="color:#fff;font-size:16px;font-weight:700">Overall Result: ${overall}</span>
    </div>

    <div style="display:flex;border-bottom:1px solid #e2e8f0">
      ${[['Total', total, '#1e293b'],['Passed', passed, '#22c55e'],['Failed', failed, '#ef4444'],
         ['Skipped', skipped, '#f59e0b'],['Duration', msToHuman(totalMs), '#6366f1']]
        .map(([l,v,c]) => `<div style="flex:1;padding:16px;text-align:center;border-right:1px solid #e2e8f0">
          <div style="font-size:22px;font-weight:700;color:${c}">${v}</div>
          <div style="font-size:11px;color:#64748b;margin-top:3px">${l}</div></div>`).join('')}
    </div>

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
      <p style="margin:0;font-size:11px;color:#94a3b8">Generated by AutoTest · ${now.toUTCString()}</p>
    </div>
  </div>
</body>
</html>`;
}

// ── main ───────────────────────────────────────────────────────────────────

function run() {
  const data = loadResults();
  if (!data || data.tests.length === 0) {
    console.warn('[daily-report] No test results found – skipping report generation.');
    return;
  }

  fs.mkdirSync(OUTPUT_DIR, { recursive: true });

  // One file per calendar day – re-run on the same day overwrites it
  const dateStr   = new Date().toISOString().slice(0, 10);
  const fileName  = `test-summary-${dateStr}.html`;
  const outPath   = path.join(OUTPUT_DIR, fileName);

  const html = buildHtml(data.tests, data.stats);
  fs.writeFileSync(outPath, html, 'utf-8');

  const { passed, failed, skipped } = data.tests.reduce((acc, t) => {
    if (t.status === 'passed') acc.passed++;
    else if (t.status === 'failed' || t.status === 'timedOut') acc.failed++;
    else acc.skipped++;
    return acc;
  }, { passed: 0, failed: 0, skipped: 0 });

  console.log(`[daily-report] ✓ Report saved: ${outPath}`);
  console.log(`[daily-report]   ${data.tests.length} tests — ${passed} passed | ${failed} failed | ${skipped} skipped`);
}

run();
