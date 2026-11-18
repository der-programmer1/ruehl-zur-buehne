import test from 'node:test';
import assert from 'node:assert/strict';
import { createGame, stepGame, attack, loadLevel, hurt, retryLevel, advanceLevel, setPaused, movingHazards } from '../dist/js/engine.mjs';
import { LEVELS, FLOOR } from '../dist/js/levels.mjs';
import { BENCH, finishBench } from '../dist/js/bench.mjs';

test('Shakes geben genau einmal Punkte und höchstens 100 Pump', () => {
  const s = createGame(); s.pump = 90;
  s.player.x = s.pickups[0].x; stepGame(s);
  assert.equal(s.pump, 100); assert.equal(s.score, 100); assert.equal(s.shakes, 1);
  stepGame(s); assert.equal(s.score, 100); assert.equal(s.shakes, 1);
});
test('sichtbarer Kontakt mit Kopf und Schultern der größeren Figur sammelt Shakes ein', () => {
  const s = createGame();
  const pickup = s.pickups.find(p => p.y === LEVELS[0].platforms[0].y - 30);
  s.player.x = pickup.x;
  assert.ok(pickup.y + pickup.h < s.player.y);
  stepGame(s);
  assert.equal(pickup.collected, true);
  assert.equal(s.shakes, 1);
});
test('Pump-Attacke kostet 25 und zerstört eine ganze Pflichtbarriere', () => {
  const s = createGame(), gate = s.crates.find(c => c.gate);
  s.player.x = gate.x - 50; s.pump = 50;
  assert.equal(attack(s), true); assert.equal(s.pump, 25); assert.equal(gate.broken, true); assert.equal(s.score, 250);
  assert.equal(attack(s), false); assert.equal(s.pump, 25);
});
test('ohne Pump wird kein Hindernis zerstört; Spender füllen kostenlos nach', () => {
  const s = createGame();
  assert.equal(attack(s), false); assert.equal(s.pump, 0);
  s.pickups.forEach(p => p.collected = true);
  s.player.x = s.stations[0].x - 12;
  for (let i = 0; i < 240; i++) stepGame(s);
  assert.equal(s.pump, 100); assert.equal(s.score, 0);
});
test('Gegner werden von der Kraftaktion weggeschoben', () => {
  const s = createGame(), enemy = s.enemies[0];
  s.player.x = enemy.x - 45; s.pump = 25;
  attack(s); assert.equal(enemy.alive, false); assert.equal(s.score, 150);
  assert.ok(s.events.some(e => e.type === 'knock'));
});
test('Kisten blockieren die Bewegung bis zur Kraftaktion', () => {
  const s = createGame(), gate = s.crates[0];
  s.player.x = gate.x - s.player.w - 2;
  for (let i = 0; i < 15; i++) stepGame(s, { right: true });
  assert.equal(s.player.x + s.player.w, gate.x);
  s.pump = 25; attack(s); stepGame(s, { right: true });
  assert.ok(s.player.x + s.player.w > gate.x);
});
test('Checkpoints stellen Ressourcen und Einsammelzustand gemeinsam wieder her', () => {
  const s = createGame(); s.player.x = LEVELS[0].checkpoints[0]; s.pump = 50; stepGame(s);
  const cp = structuredClone(s.checkpoint);
  const pickup = s.pickups.find(p => p.x > s.player.x);
  s.player.x = pickup.x; stepGame(s); assert.ok(s.shakes > cp.shakes);
  s.player.y = 500; stepGame(s);
  assert.equal(s.health, 2); assert.equal(s.player.x, cp.x); assert.equal(s.score, cp.score);
  assert.equal(s.pump, cp.pump); assert.deepEqual(s.pickups, cp.pickups);
});
test('Treffer haben eine Schutzzeit; nach drei Treffern ist Level-Neustart möglich', () => {
  const s = createGame(); hurt(s); hurt(s); assert.equal(s.health, 2);
  s.player.invulnerable = 0; hurt(s); s.player.invulnerable = 0; hurt(s);
  assert.equal(s.mode, 'dead'); retryLevel(s); assert.equal(s.mode, 'playing'); assert.equal(s.health, 3); assert.equal(s.player.x, 80);
});
test('Pause friert Physik und Spielzeit ein', () => {
  const s = createGame(); setPaused(s, true); const before = structuredClone(s);
  stepGame(s, { right: true, actionPressed: true }); assert.deepEqual(s, before);
  setPaused(s, false); stepGame(s, { right: true }); assert.ok(s.player.x > before.player.x);
});
test('Levelwechsel erhält Pump und Punkte, füllt Leben auf', () => {
  const s = createGame(); s.player.x = LEVELS[0].goal; s.pump = 75; s.health = 1;
  stepGame(s); assert.equal(s.mode, 'bench-press'); assert.equal(s.score, 500);
  assert.equal(advanceLevel(s), false); finishBench(s); assert.equal(s.mode, 'level-complete');
  advanceLevel(s); assert.equal(s.level, 1); assert.equal(s.pump, 75); assert.equal(s.health, 3);
  hurt(s); retryLevel(s); assert.equal(s.level, 1); assert.equal(s.score, 500);
});
test('Siegerpose erfordert letzte Bühne und volle 100 Pump', () => {
  const s = createGame(); loadLevel(s, 2); s.player.x = LEVELS[2].goal - 20; s.pump = 75;
  attack(s); assert.equal(s.mode, 'playing'); s.player.cooldown = 0; s.pump = 100;
  attack(s); assert.equal(s.mode, 'bench-press'); assert.equal(s.cutscene.outcome, 'won'); assert.equal(s.pump, 100);
  const score = s.score; attack(s); assert.equal(s.score, score);
  finishBench(s); assert.equal(s.mode, 'won'); attack(s); assert.equal(s.score, score);
});
test('jede Pflichtbarriere und das Finale haben erreichbare Spender davor', () => {
  for (const level of LEVELS) for (const x of [...level.gates, ...(level.index === 2 ? [level.goal] : [])]) {
    assert.ok(level.stations.some(station => station < x && x - station <= 250));
    for (const station of level.stations.filter(station => station < x && x - station <= 250)) {
      assert.ok(level.ground.some(g => station > g.x && x < g.x + g.w));
    }
  }
});

// This pilot uses the actual collision, resource, damage and checkpoint simulation.
// It does not teleport, grant pump, skip levels or turn off hazards.
export function playCampaign() {
  const s = createGame(), scenes = new Set(); let ticks = 0, wait = 0, jumping = 0, previousJump = false;
  while (s.mode !== 'won' && ticks < 120000) {
    if (s.mode === 'bench-press') scenes.add(s.level);
    if (s.mode === 'dead') throw new Error(`Pilot gestorben: Level ${s.level + 1}, x=${s.player.x.toFixed(0)}`);
    if (s.mode === 'level-complete') { advanceLevel(s); wait = 0; jumping = 0; previousJump = false; }
    const p = s.player, l = LEVELS[s.level], front = p.x + p.w;
    let right = true, jump = false, actionPressed = false;
    const gate = s.crates.find(c => !c.broken && c.x > p.x - 5 && c.x - front < 64);
    if (gate) {
      if (s.pump >= 25) actionPressed = true;
      else right = false;
    }
    const station = s.stations.find(st => Math.abs(p.x + 12 - st.x) < 24);
    if (station && s.pump < 100) { right = false; wait++; } else wait = 0;
    const gap = l.gaps.find(([x, width]) => front > x - 34 && p.x < x + width);
    const bot = s.enemies.find(e => e.alive && e.x - front > -6 && e.x - front < 55);
    if (bot && s.pump >= 25) actionPressed = true;
    const hazard = movingHazards(s).find(h => h.x - front > 0 && h.x - front < 65);
    if (hazard && p.grounded) {
      if (hazard.y > 270) jumping = 40;
      else right = false;
    }
    if (gap && p.grounded) jumping = 40;
    if (jumping > 0) { jump = true; jumping--; }
    if (s.level === 2 && front > l.goal - 40) { right = s.pump === 100; actionPressed = s.pump === 100; }
    stepGame(s, { right, jump, jumpPressed: jump && !previousJump, actionPressed });
    previousJump = jump; s.events = []; ticks++;
    if (wait > 1000) throw new Error('Spender lädt nicht nach');
  }
  return { state: s, ticks, scenes: [...scenes] };
}
test('alle drei Levels sind mit normalen Bewegungen und Ressourcen durchspielbar', () => {
  const { state, ticks, scenes } = playCampaign();
  assert.equal(state.mode, 'won', `Level ${state.level + 1}, x=${state.player.x}, ${ticks} Frames`);
  assert.equal(state.level, 2); assert.equal(state.pump, 100); assert.ok(state.score > 5000);
  assert.deepEqual(scenes, [0, 1, 2]);
});

test('Bankdrücken zählt drei Wiederholungen und friert Spielzeit, Spieler und Ressourcen ein', () => {
  const s = createGame(); s.player.x = LEVELS[0].goal; stepGame(s);
  const before = structuredClone({ player: s.player, score: s.score, pump: s.pump, elapsed: s.elapsed, health: s.health });
  for (let i = 0; i < Math.ceil(BENCH.duration * 60) + 2; i++) stepGame(s, { right: true, jumpPressed: true, actionPressed: true });
  assert.equal(s.mode, 'level-complete'); assert.equal(s.cutscene.repetitions, 3);
  assert.deepEqual({ player: s.player, score: s.score, pump: s.pump, elapsed: s.elapsed, health: s.health }, before);
  assert.equal(s.events.filter(e => e.type === 'bench-rep').length, 3);
  assert.equal(s.events.filter(e => e.type === 'bench-push').length, 3);
  assert.equal(s.events.filter(e => e.type === 'complete').length, 1);
});
test('Bankdrückanimation lässt sich pausieren und an derselben Stelle fortsetzen', () => {
  const s = createGame(); s.player.x = LEVELS[0].goal; stepGame(s);
  for (let i = 0; i < 45; i++) stepGame(s);
  setPaused(s, true); const elapsed = s.cutscene.elapsed;
  for (let i = 0; i < 60; i++) stepGame(s);
  assert.equal(s.cutscene.elapsed, elapsed); setPaused(s, false);
  assert.equal(s.mode, 'bench-press'); stepGame(s); assert.ok(s.cutscene.elapsed > elapsed);
});
test('Überspringen beendet nur eine aktive Animation und vergibt keinen zusätzlichen Gewinn', () => {
  const s = createGame(); assert.equal(finishBench(s), false);
  loadLevel(s, 2, 100); s.player.x = LEVELS[2].goal; attack(s);
  const score = s.score; assert.equal(finishBench(s), true); assert.equal(s.mode, 'won');
  assert.equal(finishBench(s), false); assert.equal(s.score, score);
  assert.equal(s.events.filter(e => e.type === 'win').length, 1);
});
