'use strict';

const { spawnSync } = require('child_process');

function parseArgs(argv) {
  const passthrough = [];
  let scope = 'adhoc';
  let dailyRollup = false;

  for (let i = 0; i < argv.length; i += 1) {
    const arg = argv[i];
    if (arg === '--scope') {
      const next = argv[i + 1];
      if (!next || next.startsWith('--')) {
        throw new Error('Missing value for --scope');
      }
      scope = next;
      i += 1;
      continue;
    }

    if (arg === '--daily-rollup') {
      dailyRollup = true;
      continue;
    }

    passthrough.push(arg);
  }

  return { scope, dailyRollup, passthrough };
}

function run() {
  const { scope, dailyRollup, passthrough } = parseArgs(process.argv.slice(2));

  const env = {
    ...process.env,
    AUTOTEST_SCOPE: scope,
    AUTOTEST_DAILY_ROLLUP: dailyRollup ? '1' : '0',
  };

  const cmd = process.platform === 'win32' ? 'npx.cmd' : 'npx';
  const args = ['playwright', 'test', ...passthrough];

  const child = spawnSync(cmd, args, {
    stdio: 'inherit',
    env,
  });

  if (typeof child.status === 'number') {
    process.exit(child.status);
  }

  process.exit(1);
}

run();
