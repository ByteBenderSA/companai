// Runs the Firestore rules tests inside `firebase emulators:exec`, then makes sure the emulator
// is really gone. On Windows, emulators:exec stops its wrapper but can leave the Java emulator
// running, which blocks the next run (and the e2e tests) with "port taken".
import { execSync, spawnSync } from 'node:child_process';

const PORTS = [8085, 9150, 4400, 4500]; // firestore, firestore websocket, hub, logging

const result = spawnSync(
  'npx firebase emulators:exec --only firestore --project demo-companai "vitest run --config vitest.rules.config.ts"',
  { stdio: 'inherit', shell: true }
);

if (process.platform === 'win32') {
  try {
    const netstat = execSync('netstat -ano -p tcp', { encoding: 'utf8' });
    const pids = new Set();
    for (const line of netstat.split(/\r?\n/)) {
      const cols = line.trim().split(/\s+/);
      if (cols[3] !== 'LISTENING') continue;
      const port = Number(cols[1]?.split(':').pop());
      if (PORTS.includes(port)) pids.add(cols[4]);
    }
    for (const pid of pids) {
      const name = execSync(`tasklist /FI "PID eq ${pid}" /FO CSV /NH`, { encoding: 'utf8' }).split(',')[0]?.replace(/"/g, '');
      // Only ever stop the emulator itself.
      if (name === 'java.exe' || name === 'node.exe') execSync(`taskkill /PID ${pid} /T /F`, { stdio: 'ignore' });
    }
  } catch {
    // Best effort; never mask the test result.
  }
}

process.exit(result.status ?? 1);
