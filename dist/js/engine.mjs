import { LEVELS, FLOOR } from './levels.mjs';

export const PHYSICS = Object.freeze({ speed: 190, jump: 470, gravity: 1180, maxFall: 700 });
export const overlaps = (a, b) => a.x < b.x + b.w && a.x + a.w > b.x && a.y < b.y + b.h && a.y + a.h > b.y;
const clone = value => structuredClone(value);
const clamp = (n, min, max) => Math.max(min, Math.min(max, n));
const emit = (s, type, data = {}) => s.events.push({ type, ...data });

function snapshot(s, x = s.player.x) {
  return { x, pump: s.pump, score: s.score, shakes: s.shakes, crates: clone(s.crates), pickups: clone(s.pickups), enemies: clone(s.enemies) };
}

export function loadLevel(s, index, pump = s.pump) {
  const level = LEVELS[index];
  Object.assign(s, {
    level: index, mode: 'playing', pump, health: 3, stageTime: 0, camera: 0, checkpointIndex: -1,
    player: { x: 80, y: FLOOR - 48, w: 24, h: 48, vx: 0, vy: 0, facing: 1, grounded: true, coyote: 0.12, buffer: 0, attack: 0, cooldown: 0, invulnerable: 0, knockback: 0 },
    crates: level.crates.map((c, id) => ({ ...c, id, broken: false })),
    pickups: level.shakes.map((p, id) => ({ ...p, id, w: 16, h: 24, collected: false })),
    enemies: level.enemies.map((e, id) => ({ ...e, id, alive: true })),
    stations: level.stations.map(x => ({ x, cooldown: 0 })), events: []
  });
  s.stageStart = snapshot(s, 80);
  s.checkpoint = snapshot(s, 80);
  return s;
}

export function createGame() {
  return loadLevel({ score: 0, shakes: 0, elapsed: 0, pump: 0, events: [] }, 0, 0);
}

export function retryLevel(s) {
  const start = clone(s.stageStart);
  s.score = start.score;
  s.shakes = start.shakes;
  loadLevel(s, s.level, start.pump);
  emit(s, 'retry');
}

export function advanceLevel(s) {
  if (s.mode !== 'level-complete' || s.level >= LEVELS.length - 1) return false;
  loadLevel(s, s.level + 1, s.pump);
  return true;
}

export function setPaused(s, paused) {
  if (paused && s.mode === 'playing') s.mode = 'paused';
  else if (!paused && s.mode === 'paused') s.mode = 'playing';
}

function respawn(s) {
  const cp = s.checkpoint;
  s.pump = cp.pump; s.score = cp.score; s.shakes = cp.shakes;
  s.crates = clone(cp.crates); s.pickups = clone(cp.pickups); s.enemies = clone(cp.enemies);
  Object.assign(s.player, { x: cp.x, y: FLOOR - 48, vx: 0, vy: 0, grounded: true, coyote: 0.12, buffer: 0, knockback: 0, attack: 0, invulnerable: 1.8 });
  emit(s, 'respawn', { x: cp.x, y: FLOOR - 30 });
}

export function hurt(s, pit = false) {
  if (s.mode !== 'playing' || (!pit && s.player.invulnerable > 0)) return false;
  s.health--;
  emit(s, 'hurt', { x: s.player.x, y: s.player.y });
  if (s.health <= 0) { s.mode = 'dead'; return true; }
  if (pit) respawn(s);
  else {
    s.player.invulnerable = 1.8;
    s.player.knockback = 0.2;
    s.player.vy = -190;
    s.player.grounded = false;
  }
  return true;
}

export function attack(s) {
  const p = s.player, level = LEVELS[s.level];
  if (s.mode !== 'playing' || p.cooldown > 0) return false;
  if (s.level === 2 && p.x + p.w >= level.goal - 45 && s.pump === 100) {
    s.score += 500 + s.health * 200;
    s.mode = 'won';
    emit(s, 'win');
    return true;
  }
  if (s.pump < 25) { p.cooldown = 0.25; emit(s, 'empty'); return false; }
  s.pump -= 25; p.attack = 0.25; p.cooldown = 0.42;
  const hitbox = { x: p.facing > 0 ? p.x + p.w - 4 : p.x - 64, y: p.y - 48, w: 68, h: p.h + 56 };
  emit(s, 'attack', { x: p.x + p.w / 2 + p.facing * 38, y: p.y + 20, direction: p.facing });
  for (const crate of s.crates) {
    if (!crate.broken && overlaps(hitbox, crate)) {
      crate.broken = true; s.score += crate.gate ? 250 : 100;
      emit(s, 'break', { x: crate.x + crate.w / 2, y: crate.y + crate.h / 2, amount: crate.gate ? 250 : 100 });
    }
  }
  for (const enemy of s.enemies) {
    if (enemy.alive && overlaps(hitbox, enemy)) {
      enemy.alive = false; s.score += 150;
      emit(s, 'knock', { x: enemy.x, y: enemy.y, direction: p.facing });
    }
  }
  return true;
}

export function movingHazards(s) {
  return LEVELS[s.level].hazards.map(h => ({ ...h, y: h.y - (1 + Math.sin(s.stageTime * 2.2 + h.phase)) * h.travel / 2 }));
}

export function stepGame(s, input = {}, dt = 1 / 60) {
  if (s.mode !== 'playing') return;
  dt = clamp(dt, 0, 1 / 30);
  const p = s.player, level = LEVELS[s.level];
  s.elapsed += dt; s.stageTime += dt;
  for (const prop of ['attack', 'cooldown', 'invulnerable', 'knockback', 'buffer']) p[prop] = Math.max(0, p[prop] - dt);
  p.coyote = p.grounded ? 0.12 : Math.max(0, p.coyote - dt);
  if (input.jumpPressed) p.buffer = 0.14;
  const direction = Number(Boolean(input.right)) - Number(Boolean(input.left));
  if (direction) p.facing = direction;
  p.vx = p.knockback > 0 ? -p.facing * 140 : direction * PHYSICS.speed;
  if (p.buffer > 0 && p.coyote > 0 && p.knockback === 0) {
    p.vy = -PHYSICS.jump; p.grounded = false; p.coyote = 0; p.buffer = 0;
    emit(s, 'jump', { x: p.x, y: p.y + p.h });
  }
  if (!input.jump && p.vy < -190) p.vy = -190;
  if (input.actionPressed) attack(s);
  if (s.mode !== 'playing') return;
  const solids = [...level.ground, ...level.platforms, ...s.crates.filter(c => !c.broken)];
  // Platforms are one-way: running underneath them never catches the player's head.
  const walls = [...level.ground, ...s.crates.filter(c => !c.broken)];
  p.x += p.vx * dt;
  for (const solid of walls) if (overlaps(p, solid)) {
    if (p.vx > 0) p.x = solid.x - p.w;
    else if (p.vx < 0) p.x = solid.x + solid.w;
  }
  p.x = clamp(p.x, 0, level.width - p.w);
  const oldBottom = p.y + p.h;
  p.vy = Math.min(PHYSICS.maxFall, p.vy + PHYSICS.gravity * dt);
  p.y += p.vy * dt; p.grounded = false;
  if (p.vy >= 0) for (const solid of solids) {
    if (p.x < solid.x + solid.w && p.x + p.w > solid.x && oldBottom <= solid.y + 0.1 && p.y + p.h >= solid.y) {
      p.y = solid.y - p.h; p.vy = 0; p.grounded = true;
    }
  }
  if (p.y > 425) { hurt(s, true); return; }
  for (const pickup of s.pickups) if (!pickup.collected && overlaps(p, pickup)) {
    pickup.collected = true; s.shakes++; s.score += 100;
    const added = Math.min(25, 100 - s.pump); s.pump += added;
    emit(s, 'pickup', { x: pickup.x, y: pickup.y, added });
  }
  for (const station of s.stations) {
    station.cooldown = Math.max(0, station.cooldown - dt);
    if (Math.abs(p.x + p.w / 2 - station.x) < 42 && p.grounded && p.y + p.h >= FLOOR - 1 && s.pump < 100 && station.cooldown === 0) {
      s.pump = Math.min(100, s.pump + 25); station.cooldown = 0.9;
      emit(s, 'refill', { x: station.x, y: FLOOR - 60 });
    }
  }
  for (const enemy of s.enemies) {
    if (!enemy.alive) continue;
    enemy.x += enemy.direction * (42 + s.level * 5) * dt;
    if (Math.abs(enemy.x - enemy.home) > enemy.range) {
      enemy.x = enemy.home + Math.sign(enemy.x - enemy.home) * enemy.range;
      enemy.direction *= -1;
    }
    if (overlaps(p, enemy)) {
      if (p.vy > 0 && oldBottom <= enemy.y + 12) {
        enemy.alive = false; p.vy = -280; s.score += 150;
        emit(s, 'knock', { x: enemy.x, y: enemy.y, direction: p.facing });
      } else hurt(s);
    }
  }
  for (const hazard of movingHazards(s)) if (overlaps(p, hazard)) hurt(s);
  if (s.mode !== 'playing') return;
  for (let i = 0; i < level.checkpoints.length; i++) {
    const x = level.checkpoints[i];
    if (i > s.checkpointIndex && p.x >= x && p.x < x + 80 && p.grounded && p.y + p.h >= FLOOR - 1) {
      s.checkpointIndex = i; s.checkpoint = snapshot(s, x);
      emit(s, 'checkpoint', { x, y: FLOOR - 48 });
    }
  }
  if (p.x + p.w >= level.goal) {
    if (s.level < 2) { s.score += 500; s.mode = 'level-complete'; emit(s, 'complete'); }
    else if (s.pump < 100 && Math.floor(s.stageTime * 2) !== Math.floor((s.stageTime - dt) * 2)) emit(s, 'need-pump');
  }
  s.camera += (clamp(p.x - 195, 0, level.width - 640) - s.camera) * Math.min(1, dt * 8);
}
