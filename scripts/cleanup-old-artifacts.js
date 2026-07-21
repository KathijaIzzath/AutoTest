/**
 * Deletes test artifacts older than MAX_AGE_DAYS days:
 *   - test-results/run-NNN folders  (by folder mtime)
 *   - blob-report/YYYY-MM-DD/       (by folder name date)
 *   - run-log-*.txt                 (by file mtime)
 *
 * Run manually:  node scripts/cleanup-old-artifacts.js
 * Also called automatically by global-teardown.ts after every test run.
 */

const fs = require('fs');
const path = require('path');

const ROOT = path.resolve(__dirname, '..');
const MAX_AGE_DAYS = 30;
const CUTOFF_MS = MAX_AGE_DAYS * 24 * 60 * 60 * 1000;

function isOlderThanCutoff(dateMs) {
  return Date.now() - dateMs > CUTOFF_MS;
}

function removeDir(dirPath) {
  fs.rmSync(dirPath, { recursive: true, force: true });
  console.log(`[cleanup] Removed directory: ${path.relative(ROOT, dirPath)}`);
}

function removeFile(filePath) {
  fs.unlinkSync(filePath);
  console.log(`[cleanup] Removed file: ${path.relative(ROOT, filePath)}`);
}

let removed = 0;

// --- test-results/run-*/ ---
const testResultsDir = path.join(ROOT, 'test-results');
if (fs.existsSync(testResultsDir)) {
  for (const entry of fs.readdirSync(testResultsDir)) {
    if (!entry.startsWith('run-')) continue;
    const fullPath = path.join(testResultsDir, entry);
    try {
      const stat = fs.statSync(fullPath);
      if (stat.isDirectory() && isOlderThanCutoff(stat.mtimeMs)) {
        removeDir(fullPath);
        removed++;
      }
    } catch {
      // skip entries we cannot stat
    }
  }
}

// --- blob-report/YYYY-MM-DD/ ---
const blobReportDir = path.join(ROOT, 'blob-report');
if (fs.existsSync(blobReportDir)) {
  for (const entry of fs.readdirSync(blobReportDir)) {
    const dateMatch = entry.match(/^(\d{4})-(\d{2})-(\d{2})$/);
    if (!dateMatch) continue;
    const folderDate = new Date(entry).getTime();
    if (isNaN(folderDate)) continue;
    if (isOlderThanCutoff(folderDate)) {
      const fullPath = path.join(blobReportDir, entry);
      try {
        removeDir(fullPath);
        removed++;
      } catch {
        // skip
      }
    }
  }
}

// --- run-log-*.txt and test-summary-*.html in project root ---
for (const entry of fs.readdirSync(ROOT)) {
  if (!/^run-log-.+\.txt$/i.test(entry) && !/^test-summary-\d{4}-\d{2}-\d{2}\.html$/i.test(entry)) continue;
  const fullPath = path.join(ROOT, entry);
  try {
    const stat = fs.statSync(fullPath);
    if (stat.isFile() && isOlderThanCutoff(stat.mtimeMs)) {
      removeFile(fullPath);
      removed++;
    }
  } catch {
    // skip
  }
}

if (removed === 0) {
  console.log(`[cleanup] No artifacts older than ${MAX_AGE_DAYS} days found.`);
} else {
  console.log(`[cleanup] Done. Removed ${removed} artifact(s) older than ${MAX_AGE_DAYS} days.`);
}
