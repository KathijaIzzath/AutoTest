const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

function getToday() {
  return new Date().toISOString().slice(0, 10);
}

const today = getToday();
const blobDir = path.join(process.cwd(), 'blob-report', today);
const mergedHtmlDir = path.join(process.cwd(), 'playwright-report', 'daily', today);

if (!fs.existsSync(blobDir)) {
  console.error(`No blob report directory found for today: ${blobDir}`);
  process.exit(1);
}

const zipFiles = fs
  .readdirSync(blobDir)
  .filter((name) => name.toLowerCase().endsWith('.zip'));

if (zipFiles.length === 0) {
  console.error(`No blob zip files found in: ${blobDir}`);
  process.exit(1);
}

fs.mkdirSync(mergedHtmlDir, { recursive: true });

execSync(`npx playwright merge-reports --reporter html "${blobDir}"`, {
  stdio: 'inherit',
  env: {
    ...process.env,
    PLAYWRIGHT_HTML_OUTPUT_DIR: mergedHtmlDir,
    PLAYWRIGHT_HTML_OPEN: 'never',
  },
});

console.log(`Merged ${zipFiles.length} blob report(s) from ${blobDir}`);
console.log(`HTML report written to: ${mergedHtmlDir}`);
