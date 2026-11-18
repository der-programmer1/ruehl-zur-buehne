export const BENCH = Object.freeze({ lead: 0.65, repDuration: 1.9, repetitions: 3, finish: 1.15, duration: 7.5 });
const clamp = (value, min, max) => Math.max(min, Math.min(max, value));
const ease = value => value * value * (3 - 2 * value);

// A controlled descent, a short pause on the chest, then an explosive press.
// Lift is 1 at lockout and 0 on the chest. The whole body shares this timeline.
export function benchPose(elapsed) {
  const working = Math.max(0, elapsed - BENCH.lead);
  const cycle = clamp(Math.floor(working / BENCH.repDuration), 0, BENCH.repetitions - 1);
  const phase = clamp((working - cycle * BENCH.repDuration) / BENCH.repDuration, 0, 1);
  const completed = clamp(Math.floor(working / BENCH.repDuration), 0, BENCH.repetitions);
  let lift = 1;
  if (phase < 0.46) lift = 1 - ease(phase / 0.46);
  else if (phase < 0.57) lift = 0;
  else if (phase < 0.86) lift = ease((phase - 0.57) / 0.29);
  const finished = completed === BENCH.repetitions;
  if (elapsed < BENCH.lead || finished) lift = 1;
  return { lift, completed, phase, strain: finished ? 0 : 1 - lift, pressing: !finished && phase >= 0.57 && phase < 0.86, finished };
}

export function startBench(s, outcome) {
  s.mode = 'bench-press';
  s.cutscene = { elapsed: 0, outcome, level: s.level, repetitions: 0, weight: [100, 140, 180][s.level] };
  s.events.push({ type: 'bench-start', level: s.level });
}

export function finishBench(s) {
  if (s.mode !== 'bench-press') return false;
  const outcome = s.cutscene.outcome;
  s.cutscene.elapsed = BENCH.duration;
  s.cutscene.repetitions = BENCH.repetitions;
  s.mode = outcome;
  if (outcome === 'won') s.events.push({ type: 'win' });
  else s.events.push({ type: 'complete' });
  return true;
}

export function stepBench(s, dt) {
  const before = s.cutscene.repetitions;
  const wasPressing = benchPose(s.cutscene.elapsed).pressing;
  s.cutscene.elapsed = Math.min(BENCH.duration, s.cutscene.elapsed + dt);
  s.cutscene.repetitions = benchPose(s.cutscene.elapsed).completed;
  if (!wasPressing && benchPose(s.cutscene.elapsed).pressing) s.events.push({ type: 'bench-push' });
  if (s.cutscene.repetitions > before) s.events.push({ type: 'bench-rep', repetition: s.cutscene.repetitions });
  if (s.cutscene.elapsed >= BENCH.duration) finishBench(s);
}
