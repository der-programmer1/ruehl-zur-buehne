import assert from 'node:assert/strict';
import { readFile, readdir, access } from 'node:fs/promises';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { spawnSync } from 'node:child_process';
const root = fileURLToPath(new URL('../dist/', import.meta.url));
const html = await readFile(resolve(root, 'index.html'), 'utf8');
assert.match(html, /lang="de"/);
assert.equal((html.match(/<h1\b/g) || []).length, 1);
const ids = [...html.matchAll(/\bid="([^"]+)"/g)].map(m => m[1]);
assert.equal(ids.length, new Set(ids).size);
async function reference(base, ref) {
  if (/^(https:|mailto:|data:|#)/.test(ref)) return;
  assert.ok(!ref.startsWith('/'), `GitHub-Pages-Unterpfad: ${ref}`);
  const target = resolve(dirname(base), ref);
  assert.ok(target === resolve(root) || target.startsWith(root)); await access(target);
}
for (const match of html.matchAll(/\b(?:src|href)="([^"]+)"/g)) await reference(resolve(root, 'index.html'), match[1]);
const css = await readFile(resolve(root, 'style.css'), 'utf8');
for (const match of css.matchAll(/url\(['"]?([^'"\s)]+)['"]?\)/g)) await reference(resolve(root, 'style.css'), match[1]);
for (const file of await readdir(resolve(root, 'js'))) {
  const path = resolve(root, 'js', file);
  const syntax = spawnSync(process.execPath, ['--check', path], { encoding: 'utf8' });
  assert.equal(syntax.status, 0, syntax.stderr);
  const source = await readFile(path, 'utf8');
  for (const match of source.matchAll(/from ['"]([^'"]+)['"]/g)) await reference(path, match[1]);
  for (const match of source.matchAll(/\$\('([^']+)'\)/g)) assert.ok(ids.includes(match[1]), `Fehlendes Element: ${match[1]}`);
}
assert.doesNotMatch(html, /<(?:script|img)\b[^>]*src="https?:/);
console.log('Syntax, lokale Assets, DOM-Verweise und GitHub-Pages-Unterpfade geprüft.');
