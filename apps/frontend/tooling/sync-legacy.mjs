import { cpSync, mkdirSync, readFileSync, writeFileSync, readdirSync, rmSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const folders = ['pages', 'styles', 'scripts', 'images'];
export function syncLegacy() {
  for (const folder of folders) {
    const destination = path.resolve(root, 'public', folder);
    // Somente as quatro pastas geradas: nunca remover arquivos-fonte.
    if (destination !== path.join(root, 'public', folder)) throw new Error('Destino inesperado');
    rmSync(destination, { recursive: true, force: true });
    mkdirSync(destination, { recursive: true });
    cpSync(path.join(root, 'src/legacy', folder), destination, { recursive: true, filter: (source) => !source.endsWith('.md') });
  }
  for (const entry of readdirSync(path.join(root, 'public/pages'), { withFileTypes: true })) {
    if (!entry.isFile() || !entry.name.endsWith('.html')) continue;
    const file = path.join(root, 'public/pages', entry.name);
    const html = readFileSync(file, 'utf8');
    writeFileSync(file, html.replace(/<head([^>]*)>/i, '<head$1><script>window.HIVE_API_BASE_URL = "/api";</script>'));
  }
}
if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) syncLegacy();
