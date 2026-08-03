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
  id: string;
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

interface ReporterEmailConfig {
  sender: string;
  recipients: string[];
  subject: string;
  reportOutputDir?: string;
}

interface InfraStatus {
  auth?: {
    status?: 'ok' | 'degraded' | 'down';
    attempts?: number;
    healthChecks?: number;
    usedStorageFallback?: boolean;
    message?: string;
  };
  db?: {
    status?: 'ok' | 'warning';
    warnings?: string[];
  };
  warnings?: string[];
  failOnAuthUnavailable?: boolean;
}

interface CompactRunSummary {
  generatedAt: string;
  runType: 'per-run';
  totals: {
    total: number;
    passed: number;
    failed: number;
    skipped: number;
  };
  durationMs: number;
  playwrightStatus: FullResult['status'];
  infrastructure: {
    authStatus: 'ok' | 'degraded' | 'down' | 'unknown';
    dbStatus: 'ok' | 'warning' | 'unknown';
    warnings: string[];
    failOnAuthUnavailable: boolean;
  };
  build: {
    buildUrl: string | null;
    commitSha: string | null;
  };
  stability?: {
    retryAttempts: number;
    timeoutTests: number;
    flakyTests: number;
    flakeRate: number;
    regressions: string[];
  };
}

interface AttemptEntry {
  testId: string;
  title: string;
  moduleName: string;
  specFile: string;
  retry: number;
  status: TestEntry['status'];
  durationMs: number;
}

interface SpecStabilityMetric {
  specFile: string;
  moduleName: string;
  totalDurationMs: number;
  retryAttempts: number;
  timedOutAttempts: number;
  flakyTests: number;
  tests: number;
  priorityScore: number;
}

interface StabilityThresholds {
  maxFlakeRate: number;
  maxFlakeGrowth: number;
  maxTimeoutTests: number;
  maxRetryAttempts: number;
  slowSpecThresholdMs: number;
  failOnRegression: boolean;
}

interface StabilityAnalysis {
  generatedAt: string;
  totals: {
    tests: number;
    attempts: number;
    retryAttempts: number;
    testsWithRetries: number;
    flakyTests: number;
    timeoutTests: number;
    timedOutAttempts: number;
    flakeRate: number;
  };
  previousRun: {
    flakeRate: number | null;
    flakeRateGrowth: number | null;
    retryAttempts: number | null;
    timeoutTests: number | null;
  };
  thresholds: StabilityThresholds;
  regressions: string[];
  slowestSpecs: SpecStabilityMetric[];
  stabilizationPriorities: string[];
}

function defaultEmailConfig(baseDir: string): ReporterEmailConfig {
  return {
    sender: 'noreply@localhost',
    recipients: [],
    subject: 'AutoTest Summary - {date}',
    reportOutputDir: path.join(baseDir, 'playwright-report', 'daily-summary'),
  };
}

function resolveReportOutputDir(rootDir: string, configuredOutputDir?: string): string {
  const fromEnv = (process.env.REPORT_OUTPUT_DIR ?? '').trim();
  if (fromEnv) {
    return path.isAbsolute(fromEnv) ? fromEnv : path.resolve(rootDir, fromEnv);
  }

  const fromConfig = (configuredOutputDir ?? '').trim();
  if (fromConfig) {
    return path.isAbsolute(fromConfig) ? fromConfig : path.resolve(rootDir, fromConfig);
  }

  return path.join(rootDir, 'playwright-report', 'daily-summary');
}

function resolvePerRunOutputDir(rootDir: string, configuredOutputDir?: string): string {
  return path.join(resolveReportOutputDir(rootDir, configuredOutputDir), 'per-run');
}

function readInfraStatus(rootDir: string): InfraStatus {
  const infraPath = path.join(rootDir, 'test-results', 'infra-status.json');
  if (!fs.existsSync(infraPath)) {
    return {};
  }

  try {
    return JSON.parse(fs.readFileSync(infraPath, 'utf-8')) as InfraStatus;
  } catch (error) {
    console.warn('[summary-reporter] Failed to read infra-status.json:', error);
    return {};
  }
}

function resolveEmailConfigPath(rootDir: string): string | null {
  const candidates = [
    path.join(rootDir, 'scripts', 'email-config.json'),
    path.join(rootDir, '..', 'scripts', 'email-config.json'),
    path.join(process.cwd(), 'scripts', 'email-config.json'),
  ];

  for (const candidate of candidates) {
    if (fs.existsSync(candidate)) {
      return path.resolve(candidate);
    }
  }

  return null;
}

function loadEmailConfig(rootDir: string): ReporterEmailConfig {
  const configPath = resolveEmailConfigPath(rootDir);
  if (!configPath) {
    console.warn('[summary-reporter] email-config.json not found. Falling back to defaults and skipping email delivery.');
    return defaultEmailConfig(rootDir);
  }

  try {
    const parsed = JSON.parse(fs.readFileSync(configPath, 'utf-8')) as Partial<ReporterEmailConfig>;
    const fallback = defaultEmailConfig(rootDir);
    return {
      sender: parsed.sender ?? fallback.sender,
      recipients: Array.isArray(parsed.recipients) ? parsed.recipients : fallback.recipients,
      subject: parsed.subject ?? fallback.subject,
      reportOutputDir: parsed.reportOutputDir ?? fallback.reportOutputDir,
    };
  } catch (error) {
    console.warn('[summary-reporter] Failed to parse email-config.json. Falling back to defaults and skipping email delivery.', error);
    return defaultEmailConfig(rootDir);
  }
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

function summarizeModules(modules: ModuleEntry[]): { totalTests: number; totalPassed: number; totalFailed: number; totalSkipped: number; totalDuration: number } {
  const totalTests = modules.reduce((s, m) => s + m.tests.length, 0);
  const totalPassed = modules.reduce((s, m) => s + m.tests.filter(t => t.status === 'passed').length, 0);
  const totalFailed = modules.reduce((s, m) => s + m.tests.filter(t => t.status === 'failed' || t.status === 'timedOut').length, 0);
  const totalSkipped = modules.reduce((s, m) => s + m.tests.filter(t => t.status === 'skipped').length, 0);
  const totalDuration = modules.reduce((s, m) => s + m.durationMs, 0);
  return { totalTests, totalPassed, totalFailed, totalSkipped, totalDuration };
}

function buildInfraBanner(infraStatus: InfraStatus): string {
  const authStatus = infraStatus.auth?.status ?? 'unknown';
  const dbStatus = infraStatus.db?.status ?? 'unknown';
  const warnings = infraStatus.warnings ?? [];
  const authColor = authStatus === 'ok' ? '#22c55e' : authStatus === 'degraded' ? '#f59e0b' : '#ef4444';
  const dbColor = dbStatus === 'ok' ? '#22c55e' : dbStatus === 'warning' ? '#f59e0b' : '#6b7280';
  const authMessage = infraStatus.auth?.message ?? 'No auth status was captured.';

  const warningsHtml = warnings.length > 0
    ? `<div style="margin-top:8px;color:#991b1b;font-size:12px">Infra warnings: ${warnings.map(w => w.replace(/</g, '&lt;')).join(' | ')}</div>`
    : '<div style="margin-top:8px;color:#166534;font-size:12px">No infrastructure warnings reported.</div>';

  return `
    <div style="padding:12px 32px;background:#f8fafc;border-bottom:1px solid #e2e8f0">
      <span style="display:inline-block;padding:2px 8px;border-radius:4px;background:${authColor};color:#fff;font-size:12px;font-weight:700">Auth: ${authStatus.toUpperCase()}</span>
      <span style="display:inline-block;padding:2px 8px;border-radius:4px;background:${dbColor};color:#fff;font-size:12px;font-weight:700;margin-left:8px">DB: ${dbStatus.toUpperCase()}</span>
      <div style="margin-top:8px;color:#334155;font-size:12px">${authMessage.replace(/</g, '&lt;')}</div>
      ${warningsHtml}
    </div>`;
}

function toNumberEnv(name: string, fallback: number): number {
  const raw = process.env[name];
  if (!raw) {
    return fallback;
  }
  const value = Number(raw);
  return Number.isFinite(value) ? value : fallback;
}

function readStabilityThresholds(): StabilityThresholds {
  return {
    maxFlakeRate: toNumberEnv('FLAKE_RATE_THRESHOLD', 0.05),
    maxFlakeGrowth: toNumberEnv('FLAKE_RATE_GROWTH_THRESHOLD', 0.02),
    maxTimeoutTests: toNumberEnv('MAX_TIMEOUT_TESTS', 3),
    maxRetryAttempts: toNumberEnv('MAX_RETRY_ATTEMPTS', 20),
    slowSpecThresholdMs: toNumberEnv('SLOW_SPEC_THRESHOLD_MS', 120000),
    failOnRegression: process.env.FAIL_ON_FLAKE_REGRESSION === 'true',
  };
}

function readPreviousStabilityAnalysis(reportDir: string): StabilityAnalysis | null {
  const latestPath = path.join(reportDir, 'latest-stability-analysis.json');
  if (!fs.existsSync(latestPath)) {
    return null;
  }

  try {
    return JSON.parse(fs.readFileSync(latestPath, 'utf-8')) as StabilityAnalysis;
  } catch (error) {
    console.warn('[summary-reporter] Failed to parse previous latest-stability-analysis.json:', error);
    return null;
  }
}

function buildStabilityAnalysis(
  attemptsByTestId: Map<string, AttemptEntry[]>,
  thresholds: StabilityThresholds,
  previous: StabilityAnalysis | null,
): StabilityAnalysis {
  const attempts = Array.from(attemptsByTestId.values()).flat();
  const tests = attemptsByTestId.size;
  let retryAttempts = 0;
  let testsWithRetries = 0;
  let flakyTests = 0;
  let timeoutTests = 0;
  let timedOutAttempts = 0;

  const specMap = new Map<string, {
    specFile: string;
    moduleName: string;
    totalDurationMs: number;
    retryAttempts: number;
    timedOutAttempts: number;
    flakyTestIds: Set<string>;
    testIds: Set<string>;
  }>();

  for (const [testId, attemptsForTest] of attemptsByTestId.entries()) {
    const sorted = [...attemptsForTest].sort((a, b) => a.retry - b.retry);
    const retriesForTest = Math.max(0, sorted.length - 1);
    retryAttempts += retriesForTest;
    if (retriesForTest > 0) {
      testsWithRetries += 1;
    }

    const finalAttempt = sorted[sorted.length - 1];
    const hadFailedAttempt = sorted.some((entry) => entry.status === 'failed' || entry.status === 'timedOut' || entry.status === 'interrupted');
    const hadTimeoutAttempt = sorted.some((entry) => entry.status === 'timedOut');
    if (hadTimeoutAttempt) {
      timeoutTests += 1;
    }
    timedOutAttempts += sorted.filter((entry) => entry.status === 'timedOut').length;

    const isFlaky = finalAttempt.status === 'passed' && hadFailedAttempt;
    if (isFlaky) {
      flakyTests += 1;
    }

    for (const attempt of sorted) {
      const metricKey = attempt.specFile;
      if (!specMap.has(metricKey)) {
        specMap.set(metricKey, {
          specFile: attempt.specFile,
          moduleName: attempt.moduleName,
          totalDurationMs: 0,
          retryAttempts: 0,
          timedOutAttempts: 0,
          flakyTestIds: new Set<string>(),
          testIds: new Set<string>(),
        });
      }

      const metric = specMap.get(metricKey)!;
      metric.totalDurationMs += attempt.durationMs;
      metric.testIds.add(testId);
      if (attempt.retry > 0) {
        metric.retryAttempts += 1;
      }
      if (attempt.status === 'timedOut') {
        metric.timedOutAttempts += 1;
      }
      if (isFlaky) {
        metric.flakyTestIds.add(testId);
      }
    }
  }

  const flakeRate = tests > 0 ? flakyTests / tests : 0;
  const previousFlakeRate = previous?.totals.flakeRate ?? null;
  const flakeRateGrowth = previousFlakeRate == null ? null : flakeRate - previousFlakeRate;

  const slowestSpecs = Array.from(specMap.values())
    .map((metric): SpecStabilityMetric => {
      const priorityScore =
        metric.totalDurationMs +
        metric.retryAttempts * 20000 +
        metric.timedOutAttempts * 60000 +
        metric.flakyTestIds.size * 30000;

      return {
        specFile: metric.specFile,
        moduleName: metric.moduleName,
        totalDurationMs: metric.totalDurationMs,
        retryAttempts: metric.retryAttempts,
        timedOutAttempts: metric.timedOutAttempts,
        flakyTests: metric.flakyTestIds.size,
        tests: metric.testIds.size,
        priorityScore,
      };
    })
    .sort((a, b) => b.priorityScore - a.priorityScore)
    .slice(0, 10);

  const regressions: string[] = [];
  if (flakeRate > thresholds.maxFlakeRate) {
    regressions.push(
      `Flake rate ${flakeRate.toFixed(3)} exceeded threshold ${thresholds.maxFlakeRate.toFixed(3)}`,
    );
  }
  if (flakeRateGrowth != null && flakeRateGrowth > thresholds.maxFlakeGrowth) {
    regressions.push(
      `Flake-rate growth ${flakeRateGrowth.toFixed(3)} exceeded threshold ${thresholds.maxFlakeGrowth.toFixed(3)}`,
    );
  }
  if (timeoutTests > thresholds.maxTimeoutTests) {
    regressions.push(
      `Timeout-affected tests ${timeoutTests} exceeded threshold ${thresholds.maxTimeoutTests}`,
    );
  }
  if (retryAttempts > thresholds.maxRetryAttempts) {
    regressions.push(
      `Retry attempts ${retryAttempts} exceeded threshold ${thresholds.maxRetryAttempts}`,
    );
  }
  if (slowestSpecs.some((spec) => spec.totalDurationMs > thresholds.slowSpecThresholdMs)) {
    regressions.push(
      `At least one spec exceeded slow-spec threshold ${thresholds.slowSpecThresholdMs}ms`,
    );
  }

  const stabilizationPriorities = slowestSpecs.slice(0, 5).map((spec, index) => {
    const reasons: string[] = [];
    if (spec.flakyTests > 0) reasons.push(`${spec.flakyTests} flaky`);
    if (spec.timedOutAttempts > 0) reasons.push(`${spec.timedOutAttempts} timeouts`);
    if (spec.retryAttempts > 0) reasons.push(`${spec.retryAttempts} retries`);
    reasons.push(`${msToHuman(spec.totalDurationMs)} runtime`);
    return `${index + 1}. ${spec.moduleName} :: ${spec.specFile} (${reasons.join(', ')})`;
  });

  return {
    generatedAt: new Date().toISOString(),
    totals: {
      tests,
      attempts: attempts.length,
      retryAttempts,
      testsWithRetries,
      flakyTests,
      timeoutTests,
      timedOutAttempts,
      flakeRate,
    },
    previousRun: {
      flakeRate: previousFlakeRate,
      flakeRateGrowth,
      retryAttempts: previous?.totals.retryAttempts ?? null,
      timeoutTests: previous?.totals.timeoutTests ?? null,
    },
    thresholds,
    regressions,
    slowestSpecs,
    stabilizationPriorities,
  };
}

function buildHtml(modules: ModuleEntry[], overallResult: FullResult['status'], runDate: string, infraStatus: InfraStatus): string {
  const { totalTests, totalPassed, totalFailed, totalSkipped, totalDuration } = summarizeModules(modules);

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
      <h1 style="margin:0;color:#fff;font-size:22px;font-weight:700">AutoTest Per-Run Execution Summary</h1>
      <p style="margin:4px 0 0;color:#94a3b8;font-size:14px">${runDate}</p>
    </div>

    ${buildInfraBanner(infraStatus)}

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
  private attemptsByTestId = new Map<string, AttemptEntry[]>();

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
    const testId = `${test.location.file}::${titlePath.join(' › ')}`;

    if (!this.attemptsByTestId.has(testId)) {
      this.attemptsByTestId.set(testId, []);
    }
    this.attemptsByTestId.get(testId)!.push({
      testId,
      title,
      moduleName,
      specFile: rel.replace(/\\/g, '/'),
      retry: result.retry,
      status: result.status,
      durationMs: result.duration,
    });

    const entry: TestEntry = {
      id: testId,
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
    const existingIndex = mod.tests.findIndex((t) => t.id === testId);
    if (existingIndex >= 0) {
      mod.durationMs -= mod.tests[existingIndex].durationMs;
      mod.tests[existingIndex] = entry;
      mod.durationMs += entry.durationMs;
    } else {
      mod.tests.push(entry);
      mod.durationMs += entry.durationMs;
    }
  }

  async onEnd(result: FullResult): Promise<void> {
    if (this.modules.size === 0) return;

    const runDate = new Date().toLocaleString('en-US', {
      weekday: 'long', year: 'numeric', month: 'long', day: 'numeric',
      hour: '2-digit', minute: '2-digit', timeZoneName: 'short',
    });

    const modules = Array.from(this.modules.values()).sort((a, b) => a.name.localeCompare(b.name));
    const infraStatus = readInfraStatus(this.rootDir);
    const html = buildHtml(modules, result.status, runDate, infraStatus);

    // Load email config with resilient path lookup so missing config never fails test runs.
    const emailConfig = loadEmailConfig(this.rootDir);

    const now = new Date();
    const dateStr = now.toISOString().slice(0, 10);
    const timeStr = now.toTimeString().slice(0, 8).replace(/:/g, '-');
    const subject = emailConfig.subject.replace('{date}', dateStr);

    // Always save per-run HTML and compact JSON into the configured output folder.
    const reportDir = resolvePerRunOutputDir(this.rootDir, emailConfig.reportOutputDir);
    fs.mkdirSync(reportDir, { recursive: true });
    const reportFileName = `per-run-summary-${dateStr}_${timeStr}.html`;
    const reportPath = path.join(reportDir, reportFileName);
    fs.writeFileSync(reportPath, html, 'utf-8');
    console.log(`[summary-reporter] Report saved to: ${reportPath}`);

    const thresholds = readStabilityThresholds();
    const previousStability = readPreviousStabilityAnalysis(reportDir);
    const stabilityAnalysis = buildStabilityAnalysis(this.attemptsByTestId, thresholds, previousStability);

    const stabilityFileName = `stability-analysis-${dateStr}_${timeStr}.json`;
    const stabilityPath = path.join(reportDir, stabilityFileName);
    fs.writeFileSync(stabilityPath, JSON.stringify(stabilityAnalysis, null, 2), 'utf-8');
    fs.writeFileSync(
      path.join(reportDir, 'latest-stability-analysis.json'),
      JSON.stringify(stabilityAnalysis, null, 2),
      'utf-8',
    );
    console.log(`[summary-reporter] Stability analysis saved to: ${stabilityPath}`);
    if (stabilityAnalysis.stabilizationPriorities.length > 0) {
      console.log('[summary-reporter] Stabilization priorities:');
      for (const item of stabilityAnalysis.stabilizationPriorities.slice(0, 3)) {
        console.log(`[summary-reporter]   ${item}`);
      }
    }
    if (stabilityAnalysis.regressions.length > 0) {
      console.warn('[summary-reporter] Threshold alerts:');
      for (const message of stabilityAnalysis.regressions) {
        console.warn(`[summary-reporter]   ${message}`);
      }
    }

    const totals = summarizeModules(modules);
    const buildUrl = process.env.GITHUB_SERVER_URL && process.env.GITHUB_REPOSITORY && process.env.GITHUB_RUN_ID
      ? `${process.env.GITHUB_SERVER_URL}/${process.env.GITHUB_REPOSITORY}/actions/runs/${process.env.GITHUB_RUN_ID}`
      : null;
    const compactSummary: CompactRunSummary = {
      generatedAt: new Date().toISOString(),
      runType: 'per-run',
      totals: {
        total: totals.totalTests,
        passed: totals.totalPassed,
        failed: totals.totalFailed,
        skipped: totals.totalSkipped,
      },
      durationMs: totals.totalDuration,
      playwrightStatus: result.status,
      infrastructure: {
        authStatus: infraStatus.auth?.status ?? 'unknown',
        dbStatus: infraStatus.db?.status ?? 'unknown',
        warnings: infraStatus.warnings ?? [],
        failOnAuthUnavailable: infraStatus.failOnAuthUnavailable ?? false,
      },
      build: {
        buildUrl,
        commitSha: process.env.GITHUB_SHA ?? null,
      },
      stability: {
        retryAttempts: stabilityAnalysis.totals.retryAttempts,
        timeoutTests: stabilityAnalysis.totals.timeoutTests,
        flakyTests: stabilityAnalysis.totals.flakyTests,
        flakeRate: stabilityAnalysis.totals.flakeRate,
        regressions: stabilityAnalysis.regressions,
      },
    };

    const summaryFileName = `per-run-summary-${dateStr}_${timeStr}.json`;
    const summaryPath = path.join(reportDir, summaryFileName);
    fs.writeFileSync(summaryPath, JSON.stringify(compactSummary, null, 2), 'utf-8');
    fs.writeFileSync(path.join(reportDir, 'latest-per-run-summary.json'), JSON.stringify(compactSummary, null, 2), 'utf-8');
    console.log(`[summary-reporter] Compact summary saved to: ${summaryPath}`);

    if (thresholds.failOnRegression && stabilityAnalysis.regressions.length > 0) {
      throw new Error(`Flakiness regression threshold exceeded: ${stabilityAnalysis.regressions.join(' | ')}`);
    }

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

    if (!emailConfig.recipients.length) {
      console.warn('[summary-reporter] No recipients configured — skipping email delivery.');
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
        to: emailConfig.recipients.join(', '),
        subject,
        html,
      });
      console.log(`[summary-reporter] Email sent to: ${emailConfig.recipients.join(', ')}`);
    } catch (err) {
      console.error('[summary-reporter] Failed to send email:', err);
      console.log(`[summary-reporter] Report is still available at: ${reportPath}`);
    }
  }
}

export default SummaryEmailReporter;
