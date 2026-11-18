export const FLOOR = 312;
const platform = (x, y, w = 112) => ({ x, y, w, h: 14 });

const definitions = [
  {
    name: 'Keller-Gym', kicker: 'ERST DER PUMP. DANN DER RUHM.', short: 'GYM',
    intro: 'Die Bühne wartet. Sammle Shakes, zerlege die Kisten und bring den Pump ins Rollen.',
    color: '#f1bd4e', width: 5200, gaps: [[1160, 96], [3080, 104], [4180, 96]],
    platforms: [platform(540, 258, 144), platform(748, 204), platform(1350, 256), platform(2460, 252, 160), platform(3180, 254), platform(4390, 254, 144)],
    gates: [1780, 3720, 4820], boxes: [720, 2230, 4540], stations: [1630, 3570, 4670],
    checkpoints: [1550, 3490], enemies: [950, 2380, 3950, 4490], hazards: [2700],
    signs: [[250, 'SHAKES = PUMP'], [650, 'LEERTASTE: SPRUNG'], [1570, 'E: PLATZ MACHEN'], [2820, 'CHECKPOINTS SICHERN DICH']]
  },
  {
    name: 'Messehalle', kicker: 'ZWISCHEN HANTELN UND HINDERNISSEN.', short: 'MESSE',
    intro: 'Die Halle wird voller. Cardio-Bots und pendelnde Hanteln wollen dir den Weg versperren.',
    color: '#8bd3bd', width: 6400, gaps: [[950, 112], [2150, 108], [3380, 112], [5100, 112]],
    platforms: [platform(540, 254, 144), platform(1100, 252), platform(1740, 252, 160), platform(2300, 256), platform(3600, 252, 144), platform(4820, 252), platform(5330, 252, 144)],
    gates: [1490, 3000, 4450, 5960], boxes: [720, 1920, 3750, 5600], stations: [1340, 2850, 4300, 5810],
    checkpoints: [1260, 2770, 4220], enemies: [520, 1820, 2650, 3850, 4750, 5520], hazards: [2450, 5400],
    signs: [[250, 'MESSEHALLE / KEIN UMWEG'], [1250, 'TANKEN. DRÜCKEN. WEITER.'], [3580, 'KOPF HOCH. HANTEL AUCH.']]
  },
  {
    name: 'Backstage', kicker: 'DEIN LETZTER SATZ.', short: 'BÜHNE',
    intro: 'Nur noch bis zur Bühne. Für die Siegerpose brauchst du 100 Pump. Der letzte Spender hilft dir dabei.',
    color: '#c1a4f3', width: 7200, gaps: [[850, 112], [1960, 112], [3280, 112], [4650, 112], [5920, 112]],
    platforms: [platform(490, 252, 144), platform(1050, 254), platform(1700, 254), platform(2140, 250, 144), platform(3460, 252, 144), platform(4800, 252, 144), platform(6110, 252)],
    gates: [1400, 2780, 4190, 5480, 6650], boxes: [730, 2390, 3880, 5160], stations: [1250, 2630, 4040, 5330, 6500, 6860],
    checkpoints: [1170, 3960, 6420], enemies: [550, 1730, 2440, 3730, 4990, 6220], hazards: [2250, 3600, 5740],
    signs: [[250, 'BACKSTAGE / ALLES GEBEN'], [3940, 'DER POKAL WARTET.'], [6810, '100 PUMP + E = SIEGERPOSE']]
  }
];

export const LEVELS = definitions.map((level, index) => {
  let cursor = 0;
  const ground = [];
  for (const [x, width] of level.gaps) {
    ground.push({ x: cursor, y: FLOOR, w: x - cursor, h: 72 });
    cursor = x + width;
  }
  ground.push({ x: cursor, y: FLOOR, w: level.width - cursor, h: 72 });
  const crates = [...level.gates.map(x => ({ x, y: FLOOR - 96, w: 32, h: 96, gate: true })),
    ...level.boxes.map(x => ({ x, y: FLOOR - 32, w: 32, h: 32, gate: false }))];
  const shakes = [{ x: 240, y: FLOOR - 32 }, { x: 305, y: FLOOR - 32 }, { x: 370, y: FLOOR - 32 }];
  for (let x = 490; x < level.width - 220; x += 230) {
    if (level.gaps.some(([gap, w]) => x > gap - 12 && x < gap + w + 16)) continue;
    if (crates.some(crate => Math.abs(x - crate.x) < 55)) continue;
    shakes.push({ x, y: FLOOR - 32 });
  }
  for (const p of level.platforms) {
    shakes.push({ x: p.x + 28, y: p.y - 30 }, { x: p.x + p.w - 34, y: p.y - 30 });
  }
  return {
    ...level, index, ground, crates, shakes, goal: level.width - 120,
    enemies: level.enemies.map((x, i) => ({ x, y: FLOOR - 30, w: 24, h: 30, home: x, range: 56, direction: i % 2 ? -1 : 1 })),
    hazards: level.hazards.map((x, i) => ({ x, y: FLOOR - 25, w: 26, h: 22, phase: i * 1.8, travel: 74 }))
  };
});
