import { createGame, stepGame, setPaused, retryLevel, advanceLevel } from './engine.mjs';
import { LEVELS } from './levels.mjs';
import { InputState } from './input.mjs';
import { Renderer } from './render.mjs';
import { readPreferences, writePreferences } from './storage.mjs';
import { loadArt } from './art.mjs';
import { finishBench } from './bench.mjs';

const $ = id => document.getElementById(id);
const canvas = $('game');
const renderer = new Renderer(canvas);
const input = new InputState();
let storage;
try { storage = localStorage; } catch { storage = null; }
const preferences = readPreferences(storage);
let game = createGame(); game.mode = 'title';
let lastMode = '', accumulator = 0, lastTime = performance.now(), toastUntil = 0, audioContext;
canvas.tabIndex = 0;
const formatTime = seconds => `${String(Math.floor(seconds / 60)).padStart(2, '0')}:${String(Math.floor(seconds % 60)).padStart(2, '0')}`;
const formatScore = score => String(score).padStart(6, '0');

function updateSound() {
  $('sound').setAttribute('aria-pressed', String(preferences.sound));
  $('sound').setAttribute('aria-label', preferences.sound ? 'Ton ausschalten' : 'Ton einschalten');
  $('sound-waves').setAttribute('d', preferences.sound ? 'M17 7c4 3 4 7 0 10m2-13c7 5 7 11 0 16' : 'm17 9 5 6m0-6-5 6');
}
function unlockAudio() {
  if (!preferences.sound) return;
  try {
    if (!audioContext) audioContext = new (window.AudioContext || window.webkitAudioContext)();
    if (audioContext.state === 'suspended') audioContext.resume().catch(() => {});
  } catch { /* Sound is optional; the game also works without Web Audio. */ }
}
function tone(frequency, duration = 0.1, volume = 0.04, offset = 0, end = frequency) {
  if (!preferences.sound || !audioContext || audioContext.state !== 'running') return;
  const oscillator = audioContext.createOscillator(), gain = audioContext.createGain(), at = audioContext.currentTime + offset;
  oscillator.type = 'square'; oscillator.frequency.setValueAtTime(frequency, at); oscillator.frequency.exponentialRampToValueAtTime(Math.max(20, end), at + duration);
  gain.gain.setValueAtTime(volume, at); gain.gain.exponentialRampToValueAtTime(0.001, at + duration);
  oscillator.connect(gain); gain.connect(audioContext.destination); oscillator.start(at); oscillator.stop(at + duration + 0.02);
}
function sound(type) {
  if (type === 'pickup') { tone(620, 0.075); tone(930, 0.12, 0.025, 0.065); }
  if (type === 'refill') tone(300, 0.1, 0.025, 0, 550);
  if (type === 'jump') tone(150, 0.12, 0.018, 0, 330);
  if (type === 'attack' || type === 'break') tone(100, 0.16, 0.05, 0, 28);
  if (type === 'hurt') tone(140, 0.25, 0.05, 0, 45);
  if (type === 'empty') tone(65, 0.12, 0.02);
  if (type === 'checkpoint' || type === 'complete') { tone(390, 0.1); tone(520, 0.15, 0.03, 0.1); tone(780, 0.2, 0.03, 0.2); }
  if (type === 'win') [260, 330, 390, 520, 650, 780].forEach((f, i) => tone(f, 0.22, 0.03, i * 0.12));
  if (type === 'bench-start') { tone(85, .2, .04, 0, 35); tone(390, .25, .015, .03, 110); }
  if (type === 'bench-rep') { tone(160, .12, .03); tone(360, .18, .018, .08, 180); }
  if (type === 'bench-push') effort();
}

function effort() {
  if (!preferences.sound || !audioContext || audioContext.state !== 'running') return;
  const length = Math.floor(audioContext.sampleRate * .26), buffer = audioContext.createBuffer(1, length, audioContext.sampleRate), data = buffer.getChannelData(0);
  for (let i = 0; i < length; i++) data[i] = (Math.random() * 2 - 1) * Math.sin(Math.PI * i / length);
  const source = audioContext.createBufferSource(), filter = audioContext.createBiquadFilter(), gain = audioContext.createGain();
  source.buffer = buffer; filter.type = 'lowpass'; filter.frequency.value = 900; gain.gain.value = .06;
  source.connect(filter); filter.connect(gain); gain.connect(audioContext.destination); source.start();
}

function toast(message, seconds = 3) {
  $('toast').textContent = message; $('toast').classList.add('visible'); toastUntil = performance.now() + seconds * 1000;
}
function clearControls() {
  input.clear(); document.querySelectorAll('[data-action]').forEach(button => button.classList.remove('pressed'));
}
function start() {
  unlockAudio(); clearControls();
  game = createGame(); renderer.effects = []; accumulator = 0;
  toast('Shakes geben Pump. Mit E machst du Platz. Los geht’s!', 5);
  canvas.focus({ preventScroll: true });
}
function pause() {
  setPaused(game, game.mode !== 'paused'); clearControls(); accumulator = 0;
}
function syncOverlay() {
  const mode = game.mode;
  $('stage').dataset.mode = mode;
  document.body.dataset.bench = String(mode === 'bench-press' || (mode === 'paused' && game.resumeMode === 'bench-press'));
  $('overlay').hidden = ['playing', 'bench-press'].includes(mode);
  $('bench-ui').hidden = mode !== 'bench-press';
  $('pause').disabled = !['playing', 'paused', 'bench-press'].includes(mode);
  $('pause').setAttribute('aria-label', mode === 'paused' ? 'Spiel fortsetzen' : 'Spiel pausieren');
  $('secondary').hidden = !['paused', 'dead'].includes(mode);
  if (mode === 'bench-press') { clearControls(); $('toast').classList.remove('visible'); toastUntil = 0; return; }
  if (mode === 'playing' || mode === 'title') return;
  clearControls();
  const headings = {
    paused: ['KURZ DURCHATMEN.', 'DER PUMP BLEIBT.', 'Deine Massephase wartet auf dich. Weiter geht’s, sobald du bereit bist.', 'WEITERPUMPEN', 'PAUSE / KEINE ZEIT GEHT VERLOREN'],
    dead: ['KURZ GESCHEITERT.', 'NICHT GESCHRUMPFT.', 'Drei Leben verbraucht? Der nächste Versuch beginnt am Anfang dieses Levels.', 'LEVEL NOCH EINMAL', 'NEUER VERSUCH. GLEICHE MASSE.'],
    'level-complete': ['LEVEL GESCHAFFT.', 'MASSE BLEIBT.', LEVELS[Math.min(2, game.level + 1)].intro, 'WEITER ZUM NÄCHSTEN LEVEL', `${formatScore(game.score)} PUNKTE / ${game.shakes} SHAKES`],
    won: ['BÜHNE FREI.', 'POKAL DEIN.', `Volle Masse. Starke Pose. ${game.shakes} Shakes und ${formatTime(game.elapsed)} bis zum Pokal.`, 'NOCH EINE MASSEPHASE', `${formatScore(game.score)} PUNKTE / ${game.health} LEBEN ÜBRIG`]
  };
  const [line1, line2, copy, button, note] = headings[mode];
  $('overlay-kicker').textContent = mode === 'won' ? 'MARKUS RÜHL / SIEGERPOSE' : `${String(game.level + 1).padStart(2, '0')} / ${LEVELS[game.level].name.toUpperCase()}`;
  const em = document.createElement('em'); em.textContent = line2;
  $('overlay-title').replaceChildren(document.createTextNode(line1), document.createElement('br'), em);
  $('overlay-copy').textContent = copy; $('primary').textContent = button; $('overlay-note').textContent = note;
  if (mode === 'won') {
    if (game.score > preferences.bestScore || (game.score === preferences.bestScore && (!preferences.bestTime || game.elapsed < preferences.bestTime))) {
      preferences.bestScore = game.score; preferences.bestTime = game.elapsed; writePreferences(storage, preferences);
      $('overlay-note').textContent += ' / NEUER REKORD!';
    }
  }
  $('primary').focus({ preventScroll: true });
}

function updateHUD() {
  $('score').textContent = formatScore(game.score);
  $('pump-value').textContent = game.pump;
  $('pump-fill').style.width = `${game.pump}%`;
  $('pump-meter').setAttribute('aria-valuenow', String(game.pump));
  $('pump-meter').classList.toggle('full', game.pump === 100);
  $('hearts').textContent = Array.from({ length: 3 }, (_, i) => i < game.health ? '♥' : '♡').join(' ');
  $('hearts').setAttribute('aria-label', `${game.health} von 3 Leben`);
  $('time').textContent = formatTime(game.elapsed);
  $('level-name').textContent = LEVELS[game.level].name.toUpperCase();
  $('stage-number').textContent = String(game.level + 1).padStart(2, '0');
  $('level-hint').textContent = game.level === 2 ? '100 PUMP. EINE POSE. DEIN POKAL.' : LEVELS[game.level].kicker;
  if (game.mode === 'bench-press') {
    $('level-hint').textContent = 'DER LEVEL IST DURCH. DER SATZ NOCH NICHT.';
    $('bench-caption').textContent = `${String(game.level + 1).padStart(2, '0')} / ${LEVELS[game.level].name.toUpperCase()} GESCHAFFT`;
    $('bench-weight').textContent = game.cutscene.weight;
    const reps = `${game.cutscene.repetitions} / 3`;
    if ($('bench-reps').textContent !== reps) $('bench-reps').textContent = reps;
    $('skip-bench').disabled = game.cutscene.elapsed < .9;
    document.querySelectorAll('.rep-lights i').forEach((light, i) => light.classList.toggle('done', i < game.cutscene.repetitions));
  }
  $('best').textContent = preferences.bestScore ? formatScore(preferences.bestScore) : 'NOCH OFFEN';
  document.querySelectorAll('[data-level]').forEach(li => {
    li.classList.toggle('active', Number(li.dataset.level) === game.level);
    li.classList.toggle('done', Number(li.dataset.level) < game.level || game.mode === 'won');
  });
}

$('primary').addEventListener('click', () => {
  unlockAudio();
  if (game.mode === 'title' || game.mode === 'won') start();
  else if (game.mode === 'dead') { retryLevel(game); toast('Neuer Versuch. Dein Pump wartet an den Spendern.', 4); }
  else if (game.mode === 'paused') setPaused(game, false);
  else if (game.mode === 'level-complete') { advanceLevel(game); renderer.effects = []; toast(LEVELS[game.level].intro, 7); }
  clearControls(); canvas.focus({ preventScroll: true });
});
$('secondary').addEventListener('click', start);
$('pause').addEventListener('click', pause);
$('skip-bench').addEventListener('click', () => { if (game.mode === 'bench-press' && game.cutscene.elapsed >= .9) finishBench(game); });
$('sound').addEventListener('click', () => { preferences.sound = !preferences.sound; unlockAudio(); updateSound(); writePreferences(storage, preferences); if (preferences.sound) tone(520); });
const keys = { ArrowLeft: 'left', KeyA: 'left', ArrowRight: 'right', KeyD: 'right', Space: 'jump', ArrowUp: 'jump', KeyW: 'jump', KeyE: 'action' };
window.addEventListener('keydown', event => {
  if (event.target instanceof HTMLInputElement || event.target instanceof HTMLTextAreaElement || event.metaKey || event.ctrlKey || event.altKey) return;
  if (event.code === 'Escape' && ['playing', 'paused', 'bench-press'].includes(game.mode)) { event.preventDefault(); if (!event.repeat) pause(); return; }
  if (keys[event.code] && game.mode === 'playing') { event.preventDefault(); if (!event.repeat) input.press(event.code, keys[event.code]); }
});
window.addEventListener('keyup', event => input.release(event.code));
window.addEventListener('blur', () => { setPaused(game, true); clearControls(); });
document.addEventListener('visibilitychange', () => { if (document.hidden) { setPaused(game, true); clearControls(); } });
for (const button of document.querySelectorAll('[data-action]')) {
  button.addEventListener('pointerdown', event => {
    if (game.mode !== 'playing' || event.button > 0) return;
    event.preventDefault(); button.setPointerCapture(event.pointerId);
    input.press(`pointer-${event.pointerId}`, button.dataset.action); button.classList.add('pressed'); unlockAudio();
  });
  const release = event => { input.release(`pointer-${event.pointerId}`); button.classList.remove('pressed'); };
  button.addEventListener('pointerup', release); button.addEventListener('pointercancel', release); button.addEventListener('lostpointercapture', release);
  button.addEventListener('contextmenu', event => event.preventDefault());
  // Keyboard activation of the accessible touch buttons also works.
  button.addEventListener('keydown', event => {
    if ((event.code === 'Enter' || event.code === 'Space') && game.mode === 'playing') { event.preventDefault(); event.stopPropagation(); input.press(`button-${button.dataset.action}`, button.dataset.action); }
  });
  button.addEventListener('keyup', event => { if (event.code === 'Enter' || event.code === 'Space') { event.stopPropagation(); input.release(`button-${button.dataset.action}`); } });
}

function frame(now) {
  const dt = Math.min((now - lastTime) / 1000, 0.1); lastTime = now;
  if (['playing', 'bench-press'].includes(game.mode)) {
    accumulator += dt;
    while (accumulator >= 1 / 60) { stepGame(game, input.consume(), 1 / 60); accumulator -= 1 / 60; }
  } else accumulator = 0;
  for (const event of game.events.splice(0)) {
    renderer.event(event); sound(event.type);
    if (event.type === 'checkpoint') toast('Checkpoint! Ein Sturz bringt dich hierher zurück.');
    if (event.type === 'empty') toast('Zu wenig Pump. Shake sammeln oder am Spender nachladen.');
    if (event.type === 'need-pump') { if (now > toastUntil) toast('Für die Siegerpose brauchst du 100 Pump. Der Spender steht links.', 4); }
  }
  if (game.mode !== lastMode) { syncOverlay(); lastMode = game.mode; }
  if (now > toastUntil) $('toast').classList.remove('visible');
  renderer.draw(game, now / 1000, dt, game.mode === 'title'); updateHUD();
  requestAnimationFrame(frame);
}

// A read-only snapshot makes automated input and regression checks reproducible.
export function getSnapshot() { return structuredClone(game); }
updateSound(); updateHUD();
const initialButtonText = $('primary').textContent;
$('primary').disabled = true; $('primary').textContent = 'RÜHL MACHT SICH BEREIT …';
await loadArt();
$('primary').disabled = false; $('primary').textContent = initialButtonText;
lastTime = performance.now(); requestAnimationFrame(frame);
