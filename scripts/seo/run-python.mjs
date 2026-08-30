import { spawnSync } from 'node:child_process';

const PY = String.raw`C:\Users\barry\OneDrive\Desktop\Google Analytics & Search Console\google-seo-analytics-agent\.venv\Scripts\python.exe`;
const script = process.argv[2];

if (!script) {
  console.error('Usage: node run-python.mjs <script.py> [args...]');
  process.exit(1);
}

const result = spawnSync(PY, [script, ...process.argv.slice(3)], { stdio: 'inherit' });
process.exit(result.status ?? 1);
