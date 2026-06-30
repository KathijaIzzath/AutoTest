const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

function getToday() {
  return new Date().toISOString().slice(0, 10);
}

const today = getToday();
const reportDir = path.join(process.cwd(), 'playwright-report', 'daily', today);

if (!fs.existsSync(reportDir)) {
  console.error(`Merged report directory not found for today: ${reportDir}`);
  console.error('Run: npm run report:merge:today');
  process.exit(1);
}

execSync(`npx playwright show-report "${reportDir}"`, {
  stdio: 'inherit',
  env: {
    ...process.env,
    PLAYWRIGHT_HTML_OPEN: 'never',
  },
});
