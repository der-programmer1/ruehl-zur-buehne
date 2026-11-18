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
  for (const match of source.matchAll(/new URL\(['"]([^'"]+)['"],\s*import\.meta\.url\)/g)) await reference(path, match[1]);
  for (const match of source.matchAll(/\$\('([^']+)'\)/g)) assert.ok(ids.includes(match[1]), `Fehlendes Element: ${match[1]}`);
}
const atlas = await readFile(resolve(root, 'assets/ruhl-atlas.png'));
assert.ok(atlas.subarray(0, 8).equals(Buffer.from([137, 80, 78, 71, 13, 10, 26, 10])));
assert.equal(atlas.readUInt32BE(16), 1536, 'Sprite-Atlas: drei Spalten zu je 512 Pixeln');
assert.equal(atlas.readUInt32BE(20), 1024, 'Sprite-Atlas: zwei Reihen zu je 512 Pixeln');
assert.doesNotMatch(html, /<(?:script|img)\b[^>]*src="https?:/);
console.log('Syntax, lokale Assets, DOM-Verweise und GitHub-Pages-Unterpfade geprüft.');
