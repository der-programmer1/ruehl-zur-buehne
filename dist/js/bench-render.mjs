import { BENCH } from './bench.mjs';
import { benchGeometry, projectBenchPoint } from './bench-geometry.mjs';
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
function arm(c, rig, shaded) {
  drawMuscle(c, rig.shoulder, rig.elbow, 32, 'upper', shaded);
  drawMuscle(c, rig.elbow, rig.wrist, 23, 'lower', shaded);
  rect(c, rig.wrist.x - 8, rig.wrist.y + 3, 16, 6, '#29282a');
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

function worldPolygon(c, points, color, outline = null) {
  polygon(c, points.map(([x, y, z]) => { const p = projectBenchPoint({ x, y, z }); return [p.x, p.y]; }), color, outline);
}

function drawBenchAndRack(c) {
  for (const side of [-1, 1]) {
    const x = side * 149;
    const top = projectBenchPoint({ x, y: -87, z: 215 }), bottom = projectBenchPoint({ x, y: -87, z: 0 });
    worldPolygon(c, [[x - 23, -100, 0], [x + 23, -100, 0], [x + 23, -72, 0], [x - 23, -72, 0]], '#526962', '#14232b');
    rect(c, top.x - 6, top.y, 12, bottom.y - top.y, '#101c25');
    rect(c, top.x - 3, top.y, 4, bottom.y - top.y, '#73867b');
    for (let z = 25; z < 200; z += 18) {
      const slot = projectBenchPoint({ x, y: -87, z }); rect(c, slot.x + 1, slot.y, 3, 4, '#101b24');
    }
    worldPolygon(c, [[x - 4, -87, 194], [x + 4, -87, 194], [x + 4, 4, 194], [x - 4, 4, 194]], '#8b9d8e', '#21383c');
    const hook = projectBenchPoint({ x, y: 4, z: 194 }); rect(c, hook.x - 3, hook.y - 7, 6, 12, '#a4ae97');
  }
  // The bench recedes from the feet: its long axis is perpendicular to the bar.
  for (const y of [-100, 78]) {
    const top = projectBenchPoint({ x: 0, y, z: 48 }), bottom = projectBenchPoint({ x: 0, y, z: 0 });
    rect(c, top.x - 5, top.y, 10, bottom.y - top.y, '#354f51');
    rect(c, top.x - 3, top.y, 3, bottom.y - top.y, '#80958a');
    worldPolygon(c, [[-34, y - 10, 0], [34, y - 10, 0], [34, y + 10, 0], [-34, y + 10, 0]], '#697b70', '#14232b');
  }
  worldPolygon(c, [[-39, -185, 52], [39, -185, 52], [39, 79, 52], [-39, 79, 52]], '#914941', '#1c2024');
  worldPolygon(c, [[-39, 79, 52], [39, 79, 52], [39, 79, 43], [-39, 79, 43]], '#542e31', '#1c2024');
  worldPolygon(c, [[-38, -184, 53], [-35, -184, 53], [-35, 78, 53], [-38, 78, 53]], '#cd795b');
  worldPolygon(c, [[-37, -184, 53], [37, -184, 53], [37, -176, 53], [-37, -176, 53]], '#cd795b');
}

export function drawBenchPress(c, state, reduced = false) {
  const scene = state.cutscene, t = scene.elapsed, rig = benchGeometry(t), pose = rig.pose;
  const barY = rig.bar.left.y;
  c.save(); c.imageSmoothingEnabled = false;
  rect(c, 0, 0, 640, 360, '#101c23');
  for (let x = 0; x < 640; x += 80) {
    rect(c, x, 20, 2, 202, '#294043'); rect(c, x + 5, 20, 1, 202, '#1e3037');
    rect(c, x + 16, 118, 48, 90, '#13282e'); rect(c, x + 18, 120, 44, 86, '#1b3438');
    rect(c, x + 37, 120, 3, 86, '#101e27'); rect(c, x + 18, 160, 44, 4, '#101e27');
  }
  rect(c, 0, 220, 640, 140, '#1e2d30'); rect(c, 0, 220, 640, 3, '#485a53');
  for (let x = -200; x < 900; x += 90) polygon(c, [[320 + (x - 320) * .3, 222], [x, 360], [x + 2, 360], [322 + (x - 320) * .3, 222]], '#142126');
  for (const y of [238, 267, 307, 351]) rect(c, 0, y, 640, 1, '#30423e');
  for (const x of [154, 472]) {
    rect(c, x - 18, 24, 40, 5, '#bdc9a9');
    polygon(c, [[x - 16, 29], [x + 20, 29], [x + 108, 281], [x - 112, 281]], x < 200 ? '#f2c55e09' : '#94d7bf08');
  }
  c.save();
  if (!reduced) { const zoom = 1 + Math.min(t / BENCH.duration, 1) * .025; c.translate(320, 225); c.scale(zoom, zoom); c.translate(-320, -225); }
  drawBenchAndRack(c);
  for (const leg of rig.legs) {
    drawMuscle(c, leg.hip, leg.knee, 34, 'thigh', leg.side < 0);
    drawMuscle(c, leg.knee, leg.foot, 26, 'shin', leg.side < 0);
    drawBenchShoe(c, leg.foot.x, leg.foot.y + 4, 43, leg.side < 0);
  }
  const bodyAngle = Math.atan2(rig.hips.y - rig.head.y, rig.hips.x - rig.head.x) - Math.PI / 2;
  drawBenchTorso(c, 320, 233 - rig.breath * .72, { angle: bodyAngle, width: 90, height: 76, front: true });
  drawRuhlHead(c, rig.head.x, rig.head.y, 36, bodyAngle, true);
  arm(c, rig.leftArm, true); arm(c, rig.rightArm, false);
  // The hands and the chrome bar use the same projected grip coordinates.
  rect(c, rig.bar.left.x, barY - 3, rig.bar.right.x - rig.bar.left.x, 7, '#14212a');
  rect(c, rig.bar.left.x, barY - 3, rig.bar.right.x - rig.bar.left.x, 3, '#c5cdbb');
  rect(c, rig.bar.left.x + 7, barY, rig.bar.right.x - rig.bar.left.x - 14, 2, '#6f8a89');
  for (let x = rig.leftArm.wrist.x - 8; x <= rig.rightArm.wrist.x + 8; x += 5) rect(c, x, barY - 2, 2, 2, '#5e7878');
  const count = 2 + scene.level, wobble = pose.pressing && !reduced ? Math.sin(t * 45) * .8 : 0;
  plate(c, rig.bar.leftPlate.x, barY, count, wobble, true); plate(c, rig.bar.rightPlate.x, barY, count, wobble);
  rect(c, rig.bar.leftPlate.x - (count - 1) * 7 - 13, barY - 8, 5, 17, '#b9bba4');
  rect(c, rig.bar.rightPlate.x + (count - 1) * 7 + 8, barY - 8, 5, 17, '#b9bba4');
  hand(c, rig.leftArm.wrist.x, rig.leftArm.wrist.y); hand(c, rig.rightArm.wrist.x, rig.rightArm.wrist.y);
  if (!reduced && pose.pressing) for (let i = 0; i < 8; i++) {
    const progress = (t * 1.8 + i * .13) % 1; c.globalAlpha = (1 - progress) * .45;
    rect(c, rig.head.x + (i - 4) * 3, rig.head.y - 6 - progress * 24, 2, 2, '#e5e9cb');
  }
  c.globalAlpha = 1;
  if (pose.finished) {
    rect(c, 273, 92, 94, 25, '#152d2be8'); c.fillStyle = '#b5e3bd'; c.font = 'bold 11px monospace'; c.textAlign = 'center'; c.fillText('SATZ SITZT!', 320, 109);
  }
  c.restore();
  rect(c, 0, 357, 640, 3, '#253b3b'); rect(c, 0, 357, 640 * Math.min(t / BENCH.duration, 1), 3, '#f1bd4e');
  c.restore();
}
