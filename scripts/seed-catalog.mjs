import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { dirname, resolve } from 'node:path';

const scriptsDir = dirname(fileURLToPath(import.meta.url));

function run(scriptName) {
  const scriptPath = resolve(scriptsDir, scriptName);
  const result = spawnSync(process.execPath, [scriptPath], {
    stdio: 'inherit',
    env: process.env,
  });

  if (result.status !== 0) {
    process.exit(result.status ?? 1);
  }
}

console.log('=== Seed brand_catalog ===');
run('seed-brand-catalog.mjs');

console.log('\n=== Seed product_catalog ===');
run('seed-product-catalog.mjs');

console.log('\nКаталоги загружены.');
