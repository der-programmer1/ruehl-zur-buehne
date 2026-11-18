import { benchPose, BENCH } from './bench.mjs';
import { drawRuhlHead, drawBenchTorso, drawMuscle, drawBenchShoe } from './art.mjs';

const P = { outline: '#241c1b', skin: '#cf8051', light: '#f4b27b', highlight: '#ffd0a2', shadow: '#945333', deep: '#5d3526', shirt: '#26252b', red: '#b83b35', steel: '#b8c5b9', gold: '#f1bd4e' };
const rect = (c, x, y, w, h, color) => { c.fillStyle = color; c.fillRect(Math.round(x), Math.round(y), Math.round(w), Math.round(h)); };
function polygon(c, points, fill, stroke = null, width = 2) {
  c.beginPath(); points.forEach(([x, y], i) => { const px = Math.round(x / 2) * 2, py = Math.round(y / 2) * 2; if (i) c.lineTo(px, py); else c.moveTo(px, py); });
  c.closePath(); c.fillStyle = fill; c.fill();
  if (stroke) { c.strokeStyle = stroke; c.lineWidth = width; c.lineJoin = 'miter'; c.stroke(); }
}
function octagon(c, x, y, rx, ry, color, border = P.outline) {
  polygon(c, [[x - rx * .55, y - ry], [x + rx * .55, y - ry], [x + rx, y - ry * .45], [x + rx, y + ry * .45], [x + rx * .55, y + ry], [x - rx * .55, y + ry], [x - rx, y + ry * .45], [x - rx, y - ry * .45]], color, border);
}
// Two rigid limb segments keep the wrists connected to the moving bar.
function elbow(shoulder, wrist, length, side) {
  const dx = wrist.x - shoulder.x, dy = wrist.y - shoulder.y;
  const distance = Math.max(1, Math.hypot(dx, dy));
  const bend = Math.sqrt(Math.max(0, length * length - distance * distance / 4));
  return { x: (shoulder.x + wrist.x) / 2 - side * dy / distance * bend, y: (shoulder.y + wrist.y) / 2 + side * dx / distance * bend };
}
function arm(c, shoulder, wrist, side, far) {
  const joint = elbow(shoulder, wrist, 58, side);
  drawMuscle(c, shoulder, joint, far ? 27 : 34, 'upper', far);
  drawMuscle(c, joint, wrist, far ? 20 : 24, 'lower', far);
  rect(c, wrist.x - 8, wrist.y + 2, 16, 6, '#29282a');
}
function hand(c, x, y) {
  rect(c, x - 9, y - 5, 18, 14, P.outline); rect(c, x - 7, y - 5, 14, 10, P.skin);
  rect(c, x - 6, y - 5, 12, 3, P.highlight);
  for (let i = 0; i < 3; i++) rect(c, x - 4 + i * 4, y - 3, 1, 6, P.shadow);
}
function plate(c, x, y, count, wobble, front = false) {
  for (let i = count - 1; i >= 0; i--) {
    const px = x + i * (front ? -7 : 7), py = y + Math.sin(i + wobble) * Math.min(1.2, Math.abs(wobble));
    octagon(c, px, py, 8, 31 + i * 1.5, i % 2 ? '#3e5352' : '#263e41', '#111e24');
    rect(c, px - 4, py - 28, 3, 56, '#6c8380'); rect(c, px + 5, py - 20, 2, 40, '#152a31');
    rect(c, px - 4, py - 25, 8, 2, '#9ca78b'); rect(c, px - 4, py + 23, 8, 2, '#182b31');
    rect(c, px - 5, py - 5, 10, 10, '#142329'); rect(c, px - 3, py - 2, 6, 4, '#bcc6af');
  }
}

export function drawBenchPress(c, state, reduced = false) {
  const scene = state.cutscene, t = scene.elapsed, pose = benchPose(t);
  const barY = Math.round(122 + (1 - pose.lift) * 80);
  const breath = Math.sin(t * 3) * .6, pressShake = !reduced && pose.pressing ? Math.sin(t * 65) * .65 * pose.strain : 0;
  c.save(); c.imageSmoothingEnabled = false;
  rect(c, 0, 0, 640, 360, '#101c23');
  for (let x = 0; x < 640; x += 80) {
    rect(c, x, 20, 2, 258, '#294043'); rect(c, x + 5, 20, 1, 258, '#1e3037');
    rect(c, x + 16, 118, 48, 102, '#13282e'); rect(c, x + 18, 120, 44, 98, '#1b3438');
    rect(c, x + 37, 120, 3, 98, '#101e27'); rect(c, x + 18, 167, 44, 4, '#101e27');
  }
  rect(c, 0, 278, 640, 82, '#1e2d30'); rect(c, 0, 278, 640, 3, '#485a53');
  for (let x = -200; x < 900; x += 90) polygon(c, [[320 + (x - 320) * .3, 281], [x, 360], [x + 2, 360], [322 + (x - 320) * .3, 281]], '#142126');
  for (const y of [294, 318, 351]) rect(c, 0, y, 640, 1, '#30423e');
  // Two spotlights and the lit rig isolate the lift from the room.
  for (const x of [154, 472]) {
    rect(c, x - 18, 24, 40, 5, '#bdc9a9');
    polygon(c, [[x - 16, 29], [x + 20, 29], [x + 108, 281], [x - 112, 281]], x < 200 ? '#f2c55e09' : '#94d7bf08');
  }
  c.save();
  if (!reduced) { const zoom = 1 + Math.min(t / BENCH.duration, 1) * .025; c.translate(320, 225); c.scale(zoom, zoom); c.translate(-320, -225); }
  // Rear rack and safety supports.
  for (const x of [193, 445]) {
    rect(c, x, 98, 11, 201, '#101c25'); rect(c, x + 2, 98, 4, 199, '#566b68');
    rect(c, x - 13, 296, 45, 8, '#15242b'); rect(c, x - 8, 296, 34, 3, '#78877c');
    for (let y = 126; y < 270; y += 15) rect(c, x + 6, y, 3, 4, '#101b24');
    rect(c, x + 7, 131, 18, 5, '#8a9b8d'); rect(c, x + 22, 125, 4, 11, '#60766e');
  }
  // Steel frame, thick leather pad, bench legs and shadow.
  rect(c, 173, 304, 306, 4, '#0c161d');
  polygon(c, [[231, 246], [243, 246], [220, 302], [209, 302]], '#526562', '#15242a');
  polygon(c, [[399, 247], [410, 247], [431, 301], [420, 301]], '#526562', '#15242a');
  rect(c, 204, 299, 38, 6, '#748479'); rect(c, 410, 299, 38, 6, '#748479');
  rect(c, 209, 265, 217, 8, '#23373c'); rect(c, 180, 242, 255, 13, '#11181e');
  rect(c, 182, 240, 251, 7, '#8e4742'); rect(c, 184, 240, 247, 3, '#c57158');
  rect(c, 193, 248, 228, 2, '#482b2d');
  const farShoulder = { x: 300, y: 215 + breath }, farWrist = { x: 354, y: barY + 3 };
  arm(c, farShoulder, farWrist, 1, true);
  // Planted legs, shorts and the exaggerated arched body.
  drawMuscle(c, { x: 357, y: 232 }, { x: 405, y: 258 }, 34, 'thigh', true);
  drawMuscle(c, { x: 405, y: 258 }, { x: 430, y: 293 }, 25, 'shin', true);
  drawBenchShoe(c, 436, 304, 46);
  drawMuscle(c, { x: 349, y: 236 }, { x: 381, y: 271 }, 38, 'thigh');
  drawMuscle(c, { x: 381, y: 271 }, { x: 394, y: 299 }, 29, 'shin');
  drawBenchShoe(c, 399, 308, 49);
  drawBenchTorso(c, 294, 218 + breath);
  polygon(c, [[252, 216], [260, 208], [269, 217], [258, 226], [248, 226]], P.skin, P.shadow);
  drawRuhlHead(c, 230, 228 + breath, 38, -Math.PI / 2 - .06);
  // Near shoulder and articulated arm remain in front of the body.
  const shoulder = { x: 271, y: 215 + breath }, wrist = { x: 247, y: barY + 3 };
  arm(c, shoulder, wrist, -1, false);
  // Chrome bar, knurling, heavy plates, collars, then the hands wrapped over it.
  rect(c, 160, barY + pressShake, 327, 7, '#14212a'); rect(c, 160, barY + pressShake, 327, 3, '#c5cdbb');
  rect(c, 167, barY + 3 + pressShake, 314, 2, '#6f8a89');
  for (let x = 253; x <= 366; x += 5) rect(c, x, barY + 1, 2, 2, '#5e7878');
  const count = 2 + scene.level;
  const wobble = pose.pressing && !reduced ? Math.sin(t * 45) * .8 : 0;
  plate(c, 203, barY + 3, count, wobble, true); plate(c, 436, barY + 3, count, wobble);
  rect(c, 169 - scene.level * 7, barY - 5, 5, 17, '#b9bba4'); rect(c, 466 + scene.level * 7, barY - 5, 5, 17, '#b9bba4');
  hand(c, farWrist.x, barY); hand(c, wrist.x, barY);
  // Chalk breath and weight tremor are restrained when reduced motion is requested.
  if (!reduced && pose.pressing) for (let i = 0; i < 8; i++) {
    const progress = (t * 1.8 + i * .13) % 1;
    c.globalAlpha = (1 - progress) * .45;
    rect(c, 238 + i * 3 + progress * 13, 195 - progress * 28 + (i % 3) * 3, 2, 2, '#e5e9cb');
  }
  c.globalAlpha = 1;
  if (pose.finished) {
    rect(c, 276, 156, 91, 25, '#152d2be8');
    c.fillStyle = '#b5e3bd'; c.font = 'bold 11px monospace'; c.textAlign = 'center'; c.fillText('SATZ SITZT!', 321, 173);
  }
  c.restore();
  const progress = Math.min(t / BENCH.duration, 1);
  rect(c, 0, 357, 640, 3, '#253b3b'); rect(c, 0, 357, 640 * progress, 3, '#f1bd4e');
  c.restore();
}
