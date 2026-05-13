/**
 * Run `node --check` on backend app sources only (excludes node_modules).
 */
import { readdirSync, statSync, existsSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';
import { spawnSync } from 'child_process';

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = join(__dirname, '..');

function walkJs(dir, out) {
  if (!existsSync(dir)) return;
  for (const name of readdirSync(dir)) {
    if (name === 'node_modules') continue;
    const p = join(dir, name);
    let st;
    try {
      st = statSync(p);
    } catch {
      continue;
    }
    if (st.isDirectory()) walkJs(p, out);
    else if (name.endsWith('.js')) out.push(p);
  }
}

const files = [];
for (const rel of ['index.js', 'seed.js']) {
  const p = join(root, rel);
  if (existsSync(p)) files.push(p);
}
walkJs(join(root, 'SRC'), files);

let exitCode = 0;
for (const f of files) {
  const r = spawnSync(process.execPath, ['--check', f], { stdio: 'inherit' });
  if (r.status) exitCode = r.status;
}
process.exit(exitCode);
