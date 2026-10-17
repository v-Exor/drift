import { readFile, readdir, stat } from 'node:fs/promises';
import { resolve, dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { execFileSync } from 'node:child_process';
const root = fileURLToPath(new URL('..', import.meta.url));
const html = await readFile(join(root, 'index.html'), 'utf8');
const ids = [...html.matchAll(/\bid="([^"]+)"/g)].map(m => m[1]);
if (new Set(ids).size !== ids.length) throw Error('Duplicate HTML IDs');
for (const match of html.matchAll(/(?:src|href)="([^"#][^"]*)"/g)) {
  if (/^https?:/.test(match[1])) continue;
  const path = resolve(root, match[1]);
  if (!(await stat(path)).isFile()) throw Error('Missing asset: ' + match[1]);
}
for (const match of html.matchAll(/href="#([^"]+)"/g)) if (!ids.includes(match[1]) && !['arrow','back','code','play','download','upload','github'].includes(match[1])) throw Error('Missing section: ' + match[1]);
for (const filename of ['app.js', 'processing.js', 'worker.js', 'site-config.js', 'scripts/serve.mjs']) execFileSync(process.execPath, ['--check', join(root, filename)], { stdio: 'pipe' });
for (const name of ['task1', 'task2', 'task3', 'playground', 'questions', 'python', 'objectives', 'conclusion']) if (!ids.includes(name)) throw Error('Missing required section: ' + name);
const config = await readFile(join(root, 'site-config.js'), 'utf8');
if (!config.includes('compilationUrl') || !config.includes('repositoryUrl')) throw Error('Missing URL configuration');
console.log('Static assets, section anchors, syntax, and integration configuration passed.');
