import test from 'node:test';
import assert from 'node:assert/strict';
import { InputState } from '../dist/js/input.mjs';
import { STORAGE_KEY, readPreferences, writePreferences } from '../dist/js/storage.mjs';
test('zwei Finger können gleichzeitig laufen und springen; Loslassen trennt die Eingaben', () => {
  const input = new InputState(); input.press('finger1', 'right'); input.press('finger2', 'jump');
  assert.deepEqual(input.consume(), { left: false, right: true, jump: true, jumpPressed: true, actionPressed: false });
  input.release('finger2'); assert.equal(input.consume().right, true); assert.equal(input.consume().jump, false);
  input.clear(); assert.equal(input.consume().right, false);
});
test('Tastatur und Touch können dieselbe Aktion unabhängig halten', () => {
  const input = new InputState(); input.press('KeyD', 'right'); input.press('finger1', 'right'); input.release('KeyD');
  assert.equal(input.consume().right, true); input.release('finger1'); assert.equal(input.consume().right, false);
});
test('Pump ist eine einzelne Aktion pro Druck, nicht pro Simulationsframe', () => {
  const input = new InputState(); input.press('KeyE', 'action');
  assert.equal(input.consume().actionPressed, true); assert.equal(input.consume().actionPressed, false);
});
test('Ton und Rekord werden nur unter dem eigenen Spielschlüssel gespeichert', () => {
  const values = new Map([['anderes-spiel', 'bleibt']]);
  const storage = { getItem: k => values.get(k) || null, setItem: (k, v) => values.set(k, v) };
  const settings = { sound: true, bestScore: 12000, bestTime: 302 };
  assert.equal(writePreferences(storage, settings), true); assert.deepEqual(readPreferences(storage), settings);
  assert.equal(values.get('anderes-spiel'), 'bleibt'); assert.ok(values.has(STORAGE_KEY));
});
test('gesperrter oder beschädigter Browser-Speicher verhindert kein Spiel', () => {
  for (const storage of [null, { getItem: () => '{kaputt' }, { getItem: () => '{"bestScore":-4,"bestTime":"x","sound":"ja"}' }]) {
    assert.deepEqual(readPreferences(storage), { sound: false, bestScore: 0, bestTime: 0 });
  }
  assert.equal(writePreferences(null, {}), false);
});
