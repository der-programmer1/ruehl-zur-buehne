let atlas;
export async function loadArt() {
  const image = new Image();
  image.src = new URL('../assets/ruhl-atlas.png', import.meta.url).href;
  await image.decode();
  atlas = image;
}

export function drawAtlasRuhl(ctx, x, y, { time = 0, walking = false, airborne = false, facing = 1, attack = false, pose = false, scale = 1, hurt = false } = {}) {
  if (!atlas) return false;
  const frame = pose ? 5 : attack ? 4 : airborne ? 3 : walking ? 1 + Math.floor(time * 9) % 2 : 0;
  const size = 0.19 * scale;
  const breath = pose || airborne ? 0 : walking ? -Math.abs(Math.sin(time * 9)) * 0.8 : Math.sin(time * 2.3) * 0.35;
  ctx.save(); ctx.translate(Math.round(x), Math.round(y + breath)); ctx.scale(facing * size, size);
  ctx.imageSmoothingEnabled = false;
  if (hurt) ctx.globalAlpha *= 0.45;
  ctx.drawImage(atlas, (frame % 3) * 512, Math.floor(frame / 3) * 512, 512, 512, -256, -496, 512, 512);
  ctx.restore();
  return true;
}

export function drawRuhlHead(ctx, x, y, width = 44, angle = -Math.PI / 2) {
  if (!atlas) return;
  ctx.save(); ctx.translate(Math.round(x), Math.round(y)); ctx.rotate(angle); ctx.imageSmoothingEnabled = false;
  ctx.drawImage(atlas, 208, 10, 96, 114, -width / 2, -width * 114 / 192, width, width * 114 / 96);
  ctx.restore();
}

export function drawBenchTorso(ctx, x, y) {
  if (!atlas) return;
  ctx.save(); ctx.translate(x, y); ctx.rotate(-Math.PI / 2); ctx.imageSmoothingEnabled = false;
  ctx.drawImage(atlas, 196, 108, 112, 247, -32, -60, 64, 120);
  ctx.restore();
}

export function drawMuscle(ctx, a, b, width, part = 'upper', far = false) {
  if (!atlas) return;
  const length = Math.hypot(b.x - a.x, b.y - a.y);
  const crops = { upper: [113, 146, 76, 111], lower: [125, 248, 53, 62], thigh: [164, 341, 66, 90], shin: [170, 400, 54, 62] };
  ctx.save(); ctx.translate(a.x, a.y); ctx.rotate(Math.atan2(b.y - a.y, b.x - a.x) - Math.PI / 2);
  const points = [[-width * .32, -3], [width * .32, -3], [width * .53, length * .22], [width * .38, length * .76], [width * .29, length + 3], [-width * .29, length + 3], [-width * .44, length * .7], [-width * .52, length * .24]];
  ctx.beginPath(); points.forEach(([x, y], i) => { if (i) ctx.lineTo(Math.round(x), Math.round(y)); else ctx.moveTo(Math.round(x), Math.round(y)); }); ctx.closePath();
  ctx.fillStyle = '#ae6743'; ctx.fill();
  ctx.save(); ctx.clip(); ctx.imageSmoothingEnabled = false;
  ctx.drawImage(atlas, ...crops[part], -width * .56, -3, width * 1.12, length + 6);
  if (far) { ctx.fillStyle = '#422c2633'; ctx.fillRect(-width, -5, width * 2, length + 10); }
  ctx.restore(); ctx.strokeStyle = '#392924'; ctx.lineWidth = 1.5; ctx.stroke(); ctx.restore();
}

export function drawBenchShoe(ctx, x, y, width = 45) {
  if (!atlas) return;
  ctx.imageSmoothingEnabled = false;
  ctx.drawImage(atlas, 254, 442, 100, 58, x - width / 2, y - width * .58, width, width * .58);
}
