'use strict';
/**
 * Shared report output path resolution.
 * QA  → <reportOutputDir> (e.g. ...\DailyExecution)
 * Staging → <reportOutputDir>\Staging
 */

const fs = require('fs');
const path = require('path');

function normalizeEnv(value) {
  const v = String(value || '')
    .trim()
    .toLowerCase();
  if (v === 'staging' || v === 'stage' || v === 'stg') return 'staging';
  if (v === 'qa' || v === 'qas' || v === 'quality') return 'qa';
  return '';
}

function getTestEnv() {
  return normalizeEnv(process.env.TEST_ENV) || 'qa';
}

function readConfiguredOutputDir(rootDir) {
  // email-config always lives next to this script's repo root, not Playwright testDir.
  const repoRoot = path.resolve(__dirname, '..');
  const candidates = [
    path.join(repoRoot, 'scripts', 'email-config.json'),
    path.join(rootDir || repoRoot, 'scripts', 'email-config.json'),
  ];
  for (const configPath of candidates) {
    try {
      if (!fs.existsSync(configPath)) continue;
      const parsed = JSON.parse(fs.readFileSync(configPath, 'utf-8'));
      return String(parsed.reportOutputDir || '').trim();
    } catch (err) {
      console.warn('[report-output] Failed to read email-config.json reportOutputDir:', err.message);
    }
  }
  return '';
}

function endsWithEnvFolder(dirPath, folderName) {
  const normalized = String(dirPath || '')
    .replace(/[\\/]+$/, '')
    .replace(/\\/g, '/')
    .toLowerCase();
  return normalized.endsWith(`/${folderName.toLowerCase()}`);
}

/**
 * Resolve the base report directory for the active TEST_ENV.
 * When TEST_ENV=staging, appends a Staging subfolder under DailyExecution (or configured base).
 */
function resolveReportOutputDir(rootDir, options = {}) {
  const repoRoot = path.resolve(__dirname, '..');
  const fromEnv = (
    options.envOverride ||
    process.env.REPORT_OUTPUT_DIR ||
    process.env.DAILY_REPORT_DIR ||
    ''
  ).trim();
  const fromConfig = options.configuredOutputDir || readConfiguredOutputDir(rootDir);
  const chosen = fromEnv || fromConfig;
  const base = chosen
    ? path.isAbsolute(chosen)
      ? chosen
      : path.resolve(repoRoot, chosen)
    : path.join(repoRoot, 'playwright-report', 'daily-summary');

  const testEnv = getTestEnv();
  if (testEnv === 'staging' && !endsWithEnvFolder(base, 'Staging')) {
    return path.join(base, 'Staging');
  }
  return base;
}

module.exports = {
  getTestEnv,
  readConfiguredOutputDir,
  resolveReportOutputDir,
};
