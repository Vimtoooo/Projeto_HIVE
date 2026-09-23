import { watch } from 'node:fs';
import { spawn } from 'node:child_process';
import { createRequire } from 'node:module';
import { syncLegacy } from './sync-legacy.mjs';
const require = createRequire(import.meta.url);
let timer;
const watchers = ['pages', 'styles', 'scripts', 'images'].map(folder => watch(`src/legacy/${folder}`,  { recursive: true }, () => {
  clearTimeout(timer);
  timer = setTimeout(() => { try { syncLegacy(); } catch (error) { console.error('Falha ao sincronizar telas:', error.message); } }, 120);
}));
const child = spawn(process.execPath, [require.resolve('next/dist/bin/next'), 'dev', '--port', '3001', ...process.argv.slice(2)], { stdio: 'inherit' });
function cleanup() { clearTimeout(timer); watchers.forEach(w => w.close()); }
child.on('exit', code => { cleanup(); process.exitCode = code ?? 1; });
child.on('error', error => { cleanup(); console.error(error.message); process.exitCode = 1; });
for (const signal of ['SIGINT', 'SIGTERM']) process.on(signal, () => { cleanup(); child.kill(signal); });
