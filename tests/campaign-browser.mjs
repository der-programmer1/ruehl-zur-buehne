import assert from 'node:assert/strict';
import { LEVELS } from '../dist/js/levels.mjs';
import { movingHazards } from '../dist/js/engine.mjs';

// The pilot presses the same keys as a player. Only the browser clock is sped up;
// no game state, health, pickups or level exits are edited by this test.
export async function verifyCampaign(browser, base, out, name) {
  const context = await browser.newContext({ viewport: { width: 1280, height: 1000 }, reducedMotion: 'reduce' });
  const page = await context.newPage(), errors = [];
  page.on('pageerror', error => errors.push(error.message));
  try {
    await page.clock.install(); await page.goto(base); await page.bringToFront();
    await page.evaluate(async url => { window.readCampaign = (await import(url)).getSnapshot; }, new URL('js/game.mjs', base).href);
    const now = await page.evaluate(() => Date.now()); await page.clock.pauseAt(now + 100);
    await page.getByRole('button', { name: /MASSEPHASE STARTEN/ }).click({ force: true });
    const read = () => page.evaluate(() => {
      const s = window.readCampaign();
      return { mode: s.mode, level: s.level, health: s.health, pump: s.pump, player: s.player, elapsed: s.elapsed,
        stageTime: s.stageTime, enemies: s.enemies, crates: s.crates, stations: s.stations, cutscene: s.cutscene, score: s.score };
    });
    const held = new Set(); let elapsed = 0, jumpUntil = 0, steps = 0;
    const scenes = new Set();
    async function keys(desired) {
      for (const key of [...held]) if (!desired.includes(key)) { await page.keyboard.up(key); held.delete(key); }
      for (const key of desired) if (!held.has(key)) { await page.keyboard.down(key); held.add(key); }
    }
    async function capture(label) {
      const box = await page.locator('#stage').boundingBox();
      await page.screenshot({ path: `${out}/${name}-${label}.png`, clip: box });
    }
    await page.clock.runFor(50);
    while (steps++ < 12000) {
      const s = await read(), p = s.player, level = LEVELS[s.level], front = p.x + p.w;
      if (s.mode === 'won') {
        assert.deepEqual([...scenes], [0, 1, 2]);
        const saved = await page.evaluate(() => JSON.parse(localStorage.getItem('ruehl-zur-buehne:v1')));
        assert.equal(saved.bestScore, s.score);
        await capture('09-siegerpose'); assert.deepEqual(errors, []);
        console.log(`${name}: komplette Kampagne mit echten Tastatureingaben; drei Bankdrück-Sequenzen, Pause, Wiederholungen und Siegerpose bestanden.`);
        return;
      }
      if (s.mode === 'dead') throw new Error(`Browser-Pilot gestorben: Level ${s.level + 1}, x=${p.x}`);
      if (s.mode === 'bench-press') {
        await keys([]); scenes.add(s.level);
        assert.ok(await page.locator('#bench-ui').isVisible());
        await capture(`bench-${s.level + 1}-start`);
        const frozenTime = s.elapsed;
        if (s.level === 0) {
          await page.keyboard.press('Escape'); await page.clock.runFor(30);
          const paused = await read(); assert.equal(paused.mode, 'paused');
          await page.clock.runFor(400); assert.equal((await read()).cutscene.elapsed, paused.cutscene.elapsed);
          await page.getByRole('button', { name: 'WEITERPUMPEN', exact: true }).click({ force: true });
          await page.clock.runFor(30);
        }
        for (const [target, label] of [[.25, 'oben'], [1.64, 'unten'], [6.8, 'satz']]) {
          const current = await read();
          await page.clock.runFor(Math.max(0, Math.ceil((target - current.cutscene.elapsed) * 1000)));
          await capture(`bench-${s.level + 1}-${label}`);
          if (s.level === 0 && label === 'unten') {
            await page.setViewportSize({ width: 390, height: 844 }); await page.clock.runFor(20);
            assert.ok(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth + 1));
            await page.screenshot({ path: `${out}/${name}-bench-mobile.png`, fullPage: true });
            await page.setViewportSize({ width: 1280, height: 1000 }); await page.clock.runFor(20);
          }
        }
        assert.equal((await read()).cutscene.repetitions, 3);
        assert.equal((await read()).elapsed, frozenTime);
        await page.clock.runFor(1000);
        const finished = await read(); assert.equal(finished.mode, s.level === 2 ? 'won' : 'level-complete');
        continue;
      }
      if (s.mode === 'level-complete') {
        await keys([]);
        await page.getByRole('button', { name: 'WEITER ZUM NÄCHSTEN LEVEL', exact: true }).click({ force: true });
        jumpUntil = 0; await page.clock.runFor(50); continue;
      }
      let right = true, action = false;
      const gate = s.crates.find(c => !c.broken && c.x > p.x - 5 && c.x - front < 64);
      if (gate) { if (s.pump >= 25) action = true; else right = false; }
      const station = s.stations.find(st => Math.abs(p.x + 12 - st.x) < 24);
      if (station && s.pump < 100) right = false;
      const bot = s.enemies.find(e => e.alive && e.x - front > -6 && e.x - front < 55);
      if (bot && s.pump >= 25) action = true;
      const gap = level.gaps.find(([x, w]) => front > x - 34 && p.x < x + w);
      const hazard = movingHazards(s).find(h => h.x - front > 0 && h.x - front < 65);
      if (gap && p.grounded && !held.has('Space')) jumpUntil = elapsed + 650;
      if (hazard && p.grounded) {
        if (hazard.y > 270 && !held.has('Space')) jumpUntil = elapsed + 650;
        else if (elapsed >= jumpUntil) right = false;
      }
      if (s.level === 2 && front > level.goal - 40) { right = s.pump === 100; action = s.pump === 100; }
      await keys([...(right ? ['d'] : []), ...(elapsed < jumpUntil ? ['Space'] : [])]);
      if (action && p.cooldown <= .02) await page.keyboard.press('e');
      await page.clock.runFor(50); elapsed += 50;
    }
    throw new Error(`Kampagne steckt fest: ${JSON.stringify(await read())}`);
  } finally { await context.close(); }
}
