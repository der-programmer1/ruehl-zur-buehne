import { LEVELS, FLOOR } from './levels.mjs';
import { movingHazards } from './engine.mjs';
import { drawAtlasRuhl } from './art.mjs';
import { drawBenchPress } from './bench-render.mjs';

const C = { yellow: '#f1bd4e', mint: '#96d6bd' };
const rect = (ctx, x, y, w, h, color) => { ctx.fillStyle = color; ctx.fillRect(Math.round(x), Math.round(y), w, h); };
function text(ctx, value, x, y, color = '#d5d7cd', size = 8, align = 'left') {
  ctx.fillStyle = color; ctx.font = `bold ${size}px monospace`; ctx.textAlign = align; ctx.fillText(value, Math.round(x), Math.round(y));
}

export function drawShaker(ctx, x, y, t = 0, scale = 1) {
  ctx.save(); ctx.translate(Math.round(x), Math.round(y + Math.sin(t * 3 + x) * 2)); ctx.scale(scale, scale);
  // A wide sports shaker: flip spout, screw lid, tapered cup and creamy whey.
  rect(ctx, 3, 3, 18, 25, '#172221'); rect(ctx, 5, 28, 14, 3, '#172221');
  rect(ctx, 4, 6, 16, 19, '#d8e7df'); rect(ctx, 6, 25, 12, 4, '#c8b48d');
  rect(ctx, 5, 12, 14, 13, '#dfc69b'); rect(ctx, 6, 12, 12, 2, '#f7dfb2');
  rect(ctx, 5, 22, 14, 3, '#baa17c'); rect(ctx, 6, 7, 3, 15, '#f5f9e4');
  rect(ctx, 18, 7, 2, 17, '#7e9c93');
  for (let n = 0; n < 3; n++) rect(ctx, 15, 8 + n * 3, n % 2 ? 2 : 3, 1, '#6c8b81');
  rect(ctx, 1, 1, 22, 5, '#172221'); rect(ctx, 2, 0, 20, 4, '#df6748');
  rect(ctx, 4, 0, 15, 1, '#ffb278'); rect(ctx, 4, 4, 16, 2, '#9c432f');
  rect(ctx, 6, -4, 8, 4, '#202c29'); rect(ctx, 7, -5, 6, 3, '#ed8660');
  rect(ctx, 15, -5, 6, 2, '#202c29'); rect(ctx, 19, -4, 2, 5, '#ed8660');
  rect(ctx, 3, 15, 18, 8, '#f8efd1'); text(ctx, 'WHEY', 12, 21, '#3f4a39', 6, 'center');
  rect(ctx, 7, 27, 9, 1, '#f9dfb0');
  if (t && Math.sin(t * 3 + x) > 0.6) { rect(ctx, -4, 5, 5, 1, '#f4da91'); rect(ctx, -2, 3, 1, 5, '#f4da91'); }
  ctx.restore();
}

export function drawRuhl(ctx, x, y, options = {}) {
  drawAtlasRuhl(ctx, x, y, options);
}

function dumbbell(ctx, x, y, size = 1, color = '#656a65') {
  ctx.save(); ctx.translate(Math.round(x), Math.round(y)); ctx.scale(size, size);
  rect(ctx, 0, 7, 30, 4, '#989b89'); rect(ctx, 2, 0, 6, 18, color); rect(ctx, 22, 0, 6, 18, color);
  rect(ctx, 0, 3, 3, 12, '#2e3634'); rect(ctx, 28, 3, 3, 12, '#2e3634'); ctx.restore();
}

function background(ctx, s, time) {
  const level = LEVELS[s.level], camera = s.camera;
  rect(ctx, 0, 0, 640, 360, ['#1c2628', '#192b2b', '#262132'][s.level]);
  // Distant brickwork and tall industrial windows.
  for (let row = 0; row < 10; row++) for (let col = -1; col < 13; col++) {
    const x = col * 64 + (row % 2 ? 32 : 0) - Math.floor(camera * 0.12) % 64;
    rect(ctx, x, row * 24 + 36, 62, 1, '#ffffff04'); rect(ctx, x, row * 24 + 36, 1, 23, '#ffffff04');
  }
  for (let i = -1; i < 7; i++) {
    const x = i * 156 - Math.floor(camera * 0.2) % 156;
    rect(ctx, x + 24, 67, 70, 100, '#131c20'); rect(ctx, x + 28, 71, 62, 92, s.level === 2 ? '#393344' : '#2c3e3f');
    rect(ctx, x + 30, 73, 58, 3, '#53605a'); rect(ctx, x + 56, 71, 4, 92, '#161e23'); rect(ctx, x + 28, 116, 62, 5, '#161e23');
    rect(ctx, x + 20, 167, 78, 5, '#4d5751');
    rect(ctx, x + 114, 28, 12, 284, '#121a1f'); rect(ctx, x + 116, 30, 3, 282, '#344044');
  }
  rect(ctx, 0, 20, 640, 8, '#0e171c'); rect(ctx, 0, 28, 640, 3, '#4b5149');
  for (let i = -1; i < 5; i++) {
    const x = i * 210 - Math.floor(camera * 0.35) % 210 + 90;
    rect(ctx, x, 30, 2, 28, '#111b1d'); rect(ctx, x - 20, 55, 42, 6, '#7d8170'); rect(ctx, x - 17, 61, 36, 3, '#eee1a3');
    ctx.fillStyle = '#e6db9d06'; ctx.beginPath(); ctx.moveTo(x - 16, 64); ctx.lineTo(x + 18, 64); ctx.lineTo(x + 90, 305); ctx.lineTo(x - 90, 305); ctx.fill();
  }
  for (let i = -1; i < 6; i++) {
    const x = i * 185 - Math.floor(camera * 0.5) % 185;
    if (s.level === 0) {
      rect(ctx, x + 14, 222, 84, 8, '#3d4947'); rect(ctx, x + 18, 230, 4, 75, '#101b1e'); rect(ctx, x + 90, 230, 4, 75, '#101b1e');
      dumbbell(ctx, x + 24, 207, 0.7, '#485957'); dumbbell(ctx, x + 61, 207, 0.7, '#485957');
      rect(ctx, x + 130, 205, 8, 100, '#3d4947'); rect(ctx, x + 116, 226, 36, 5, '#53615a');
      ctx.fillStyle = '#364746'; ctx.beginPath(); ctx.arc(x + 135, 260, 23, 0, Math.PI * 2); ctx.fill();
      ctx.fillStyle = '#101d20'; ctx.beginPath(); ctx.arc(x + 135, 260, 16, 0, Math.PI * 2); ctx.fill();
    } else if (s.level === 1) {
      rect(ctx, x + 10, 192, 120, 100, '#132323'); rect(ctx, x + 10, 192, 120, 18, '#456759');
      text(ctx, i % 2 ? 'PROTEIN / 100%' : 'MASSE MESSE', x + 70, 204, '#adc4aa', 8, 'center');
      rect(ctx, x + 21, 260, 98, 34, '#2d4942');
      for (let j = 0; j < 4; j++) drawShaker(ctx, x + 32 + j * 22, 236, 0, 0.8);
    } else {
      rect(ctx, x + 16, 48, 112, 258, '#34283b'); rect(ctx, x + 18, 48, 10, 258, '#443047');
      for (let j = 0; j < 6; j++) rect(ctx, x + 23 + j * 18, 48, 4, 255, '#211c2b');
      rect(ctx, x + 145, 100, 20, 120, '#0d1720'); rect(ctx, x + 149, 107, 12, 105, '#77604b');
    }
  }
  // The near wall sign gives each level a distinct identity.
  const signX = 330 - camera * 0.6;
  if (signX > -160 && signX < 650) {
    rect(ctx, signX - 3, 88, 150, 43, '#101b1d'); rect(ctx, signX, 91, 144, 37, '#243331');
    text(ctx, ['KELLER GYM', 'MASSE MESSE', 'ZUR BÜHNE'][s.level], signX + 72, 116, level.color, 16, 'center');
  }
  rect(ctx, 0, 302, 640, 10, '#101a1c');
}

function drawBot(ctx, enemy, time) {
  const { x, y } = enemy;
  rect(ctx, x + 2, y + 8, 20, 15, '#924942'); rect(ctx, x + 4, y + 9, 16, 6, '#c16b55');
  rect(ctx, x + 5, y, 14, 10, '#757e79'); rect(ctx, x + 6, y + 2, 12, 5, '#243536');
  rect(ctx, x + 8, y + 3, 2, 2, C.yellow); rect(ctx, x + 15, y + 3, 2, 2, C.yellow);
  rect(ctx, x + 9, y - 4, 2, 4, '#899c8f'); rect(ctx, x + 8, y - 5, 4, 2, C.yellow);
  const stride = Math.sin(time * 10 + enemy.id) > 0 ? 2 : -2;
  rect(ctx, x + 3 + stride, y + 23, 6, 7, '#344646'); rect(ctx, x + 15 - stride, y + 23, 6, 7, '#344646');
  rect(ctx, x - 3, y + 10, 5, 12, '#697870'); rect(ctx, x + 22, y + 10, 5, 12, '#697870');
}

function goal(ctx, level, time, pump) {
  const x = level.goal - 24;
  if (level.index < 2) {
    rect(ctx, x - 4, 193, 65, 119, '#111b1e'); rect(ctx, x, 197, 57, 115, '#4b6456');
    rect(ctx, x + 4, 202, 49, 110, '#18282a'); rect(ctx, x + 24, 240, 7, 60, '#97ad8b');
    rect(ctx, x - 8, 179, 74, 14, level.color); text(ctx, 'WEITER', x + 28, 189, '#182322', 9, 'center');
  } else {
    rect(ctx, x - 90, 300, 210, 12, '#71545e'); rect(ctx, x - 70, 291, 170, 9, '#ad7783');
    rect(ctx, x - 30, 281, 90, 10, C.yellow); rect(ctx, x - 20, 250, 70, 31, '#614953');
    text(ctx, '1', x + 15, 271, C.yellow, 18, 'center');
    for (const side of [-1, 1]) {
      ctx.save(); ctx.translate(x + 15, 218); ctx.scale(side, 1);
      rect(ctx, 12, -20, 12, 3, '#f6d17a'); rect(ctx, 21, -20, 3, 15, C.yellow); rect(ctx, 13, -7, 10, 3, C.yellow); ctx.restore();
    }
    rect(ctx, x + 3, 195, 24, 21, C.yellow); rect(ctx, x + 6, 195, 5, 17, '#ffdd8f');
    rect(ctx, x + 9, 216, 12, 6, '#ce9140'); rect(ctx, x + 13, 222, 4, 11, C.yellow); rect(ctx, x + 3, 233, 24, 5, C.yellow);
    text(ctx, pump === 100 ? 'E / PUMP: SIEGERPOSE' : '100 PUMP FÜR DIE POSE', x + 15, 162, '#e4d3c5', 8, 'center');
    if (pump === 100) { ctx.globalAlpha = 0.5 + Math.sin(time * 4) * 0.2; rect(ctx, x - 22, 148, 74, 1, C.yellow); ctx.globalAlpha = 1; }
  }
}

export class Renderer {
  constructor(canvas) { this.canvas = canvas; this.ctx = canvas.getContext('2d', { alpha: false }); this.effects = []; this.shake = 0; this.reduced = matchMedia('(prefers-reduced-motion: reduce)').matches; }
  event(event) {
    const { type, x = 320, y = 180 } = event;
    if (['break', 'attack', 'hurt'].includes(type) && !this.reduced) this.shake = type === 'break' ? 5 : 3;
    if (['pickup', 'refill', 'checkpoint', 'break', 'knock', 'jump', 'respawn'].includes(type)) {
      const color = { pickup: '#9ae2bd', refill: '#f1bd4e', checkpoint: '#96d6bd', break: '#bb8d52', knock: '#b77a66', jump: '#727d70', respawn: '#96d6bd' }[type];
      for (let i = 0; i < (type === 'break' ? 20 : 8); i++) this.effects.push({ x, y, vx: (Math.random() - 0.5) * 160, vy: -Math.random() * 140 - 30, life: 0.5 + Math.random() * 0.4, max: 0.9, color, size: type === 'break' ? 4 : 2 });
      const words = { pickup: event.added ? '+25 PUMP' : '+100', refill: '+25 PUMP', checkpoint: 'CHECKPOINT', break: `+${event.amount}`, knock: '+150' }[type];
      if (words) this.effects.push({ x, y: y - 10, vy: -22, vx: 0, life: 1.2, max: 1.2, words, color });
    }
    if (type === 'win') for (let i = 0; i < 110; i++) this.effects.push({ x: 640 * Math.random(), y: -Math.random() * 260, vx: (Math.random() - 0.5) * 70, vy: 30 + Math.random() * 80, life: 5, max: 5, color: [C.yellow, C.mint, '#ce9ce6'][i % 3], size: 3, screen: true });
  }
  draw(s, time, dt, title = false) {
    const ctx = this.ctx, level = LEVELS[s.level], frozen = ['paused', 'dead', 'level-complete'].includes(s.mode);
    if (s.mode === 'bench-press' || (s.mode === 'paused' && s.resumeMode === 'bench-press')) {
      drawBenchPress(ctx, s, this.reduced); return;
    }
    ctx.imageSmoothingEnabled = false;
    ctx.save();
    if (this.shake > 0) { ctx.translate(Math.round((Math.random() - 0.5) * this.shake), Math.round((Math.random() - 0.5) * this.shake)); this.shake *= 0.82; if (this.shake < 0.2) this.shake = 0; }
    background(ctx, s, time);
    ctx.save(); ctx.translate(-Math.round(s.camera), 0);
    for (const ground of level.ground) {
      rect(ctx, ground.x, ground.y, ground.w, ground.h, '#252e2e'); rect(ctx, ground.x, ground.y, ground.w, 5, '#89917b'); rect(ctx, ground.x, ground.y + 5, ground.w, 5, '#404c45');
      for (let x = Math.floor(Math.max(ground.x, s.camera - 24) / 24) * 24; x < Math.min(ground.x + ground.w, s.camera + 665); x += 24) {
        if (x < ground.x) continue;
        rect(ctx, x, FLOOR, Math.min(12, ground.x + ground.w - x), 3, '#c8bd75'); rect(ctx, x + 3, FLOOR + 22, Math.min(2, ground.x + ground.w - x), 18, '#182224');
      }
    }
    for (const p of level.platforms) {
      rect(ctx, p.x, p.y, p.w, 4, '#a2a78b'); rect(ctx, p.x, p.y + 4, p.w, 10, '#40534c');
      for (let x = p.x + 10; x < p.x + p.w - 5; x += 28) rect(ctx, x, p.y + 7, 4, 3, '#17272a');
      rect(ctx, p.x + 10, p.y + 14, 4, FLOOR - p.y - 14, '#273b39');
    }
    for (const [x, label] of level.signs) {
      if (Math.abs(x - s.camera - 320) > 400) continue;
      rect(ctx, x - 10, 173, Math.max(94, label.length * 5.2 + 20), 22, '#142225');
      rect(ctx, x - 10, 173, 3, 22, level.color); text(ctx, label, x, 187, '#a5b2a4', 8);
    }
    for (let i = 0; i < level.checkpoints.length; i++) {
      const x = level.checkpoints[i]; rect(ctx, x, 259, 3, 53, '#778d7c'); rect(ctx, x + 3, 259, 22, 15, i <= s.checkpointIndex ? C.mint : '#465c53');
      if (i <= s.checkpointIndex) text(ctx, '✓', x + 10, 270, '#1b3930', 10);
    }
    for (const station of s.stations) {
      const x = station.x;
      rect(ctx, x - 18, 248, 36, 64, '#172125'); rect(ctx, x - 18, 248, 36, 4, '#dcb45b');
      rect(ctx, x - 14, 256, 28, 30, '#3c564e'); rect(ctx, x - 11, 259, 22, 22, '#233a33');
      drawShaker(ctx, x - 7, 260, 0, 0.8); rect(ctx, x - 13, 291, 17, 10, '#090f12');
      rect(ctx, x + 7, 290, 5, 5, station.cooldown > 0 ? '#b78b4c' : C.mint);
      text(ctx, 'PUMP', x, 242, '#e8cc88', 8, 'center');
      if (Math.abs(s.player.x - x) < 65 && s.pump < 100) text(ctx, 'AUFLADEN …', x, 230, C.yellow, 8, 'center');
    }
    for (const crate of s.crates) if (!crate.broken) {
      for (let y = crate.y; y < crate.y + crate.h; y += 32) {
        rect(ctx, crate.x, y, 32, 32, '#4b3830'); rect(ctx, crate.x + 2, y + 2, 28, 28, '#947044');
        rect(ctx, crate.x + 5, y + 5, 22, 22, '#634c36'); rect(ctx, crate.x + 5, y + 5, 3, 22, '#b28e56');
        for (let n = 0; n < 20; n += 3) rect(ctx, crate.x + 7 + n, y + 7 + n, 4, 4, '#aa8451');
        rect(ctx, crate.x + 2, y + 2, 28, 3, '#c19b60');
        if (crate.gate && y === crate.y) text(ctx, '25', crate.x + 16, y + 22, '#e7d9ac', 9, 'center');
      }
    }
    for (const pickup of s.pickups) if (!pickup.collected && Math.abs(pickup.x - s.camera - 320) < 350) drawShaker(ctx, pickup.x, pickup.y, time);
    for (const enemy of s.enemies) if (enemy.alive && Math.abs(enemy.x - s.camera - 320) < 350) drawBot(ctx, enemy, time);
    for (const hazard of movingHazards(s)) {
      rect(ctx, hazard.x + 12, 31, 2, hazard.y - 29, '#6b776c'); dumbbell(ctx, hazard.x - 2, hazard.y, 1, '#af7961');
      text(ctx, '!', hazard.x + 13, 43, '#dfb86e', 9, 'center');
    }
    goal(ctx, level, time, s.pump);
    const p = s.player;
    rect(ctx, p.x - 5, FLOOR - 2, 36, 3, '#0e151850');
    if (!title) drawRuhl(ctx, p.x + p.w / 2, p.y + p.h, { time: frozen ? 0 : time, walking: Math.abs(p.vx) > 0 && s.mode === 'playing', airborne: !p.grounded, facing: p.facing, attack: p.attack > 0, pose: s.mode === 'won', hurt: p.invulnerable > 0 && Math.floor(time * 12) % 2 === 0 });
    for (const effect of this.effects) {
      if (effect.screen) continue;
      ctx.globalAlpha = Math.min(1, effect.life / 0.25);
      if (effect.words) text(ctx, effect.words, effect.x, effect.y, effect.color, 9, 'center');
      else rect(ctx, effect.x, effect.y, effect.size, effect.size, effect.color);
    }
    ctx.globalAlpha = 1; ctx.restore();
    if (title) {
      const grad = ctx.createLinearGradient(0, 0, 640, 0); grad.addColorStop(0, '#10191df5'); grad.addColorStop(0.55, '#10191d99'); grad.addColorStop(1, '#10191d00');
      ctx.fillStyle = grad; ctx.fillRect(0, 0, 640, 360);
      rect(ctx, 407, 311, 140, 6, '#0e171c'); rect(ctx, 420, 305, 115, 6, '#4d5750');
      drawRuhl(ctx, 478, 302, { time, pose: true, scale: 2.45 });
      text(ctx, 'MARKUS RÜHL', 479, 336, '#abb8a7', 9, 'center');
    }
    for (const effect of this.effects) if (effect.screen) { ctx.globalAlpha = Math.min(1, effect.life); rect(ctx, effect.x, effect.y, effect.size, effect.size * 2, effect.color); }
    ctx.globalAlpha = 1; ctx.restore();
    if (!frozen) for (const effect of this.effects) { effect.life -= dt; effect.x += effect.vx * dt; effect.y += effect.vy * dt; if (!effect.words && !effect.screen) effect.vy += 260 * dt; }
    this.effects = this.effects.filter(e => e.life > 0);
  }
}
