import assert from 'node:assert/strict';
import { createServer } from 'node:http';
import { readFile, mkdir } from 'node:fs/promises';
import { existsSync } from 'node:fs';
import { resolve, extname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { chromium, webkit } from 'playwright';

const root = fileURLToPath(new URL('../dist/', import.meta.url));
const out = fileURLToPath(new URL('../test-results/', import.meta.url));
await mkdir(out, { recursive: true });
const mount = '/ruehl-zur-buehne/';
const mime = { '.html': 'text/html', '.mjs': 'text/javascript', '.js': 'text/javascript', '.css': 'text/css', '.svg': 'image/svg+xml', '.png': 'image/png', '.ttf': 'font/ttf' };
const live = process.env.RUEHL_LIVE_URL;
const server = live ? null : createServer(async (req, res) => {
  try {
    const pathname = decodeURIComponent(new URL(req.url, 'http://localhost').pathname);
    if (!pathname.startsWith(mount)) throw new Error('outside mount');
    const path = resolve(root, pathname.slice(mount.length) + (pathname.endsWith('/') ? 'index.html' : ''));
    if (!path.startsWith(root)) throw new Error('outside static files');
    res.writeHead(200, { 'Content-Type': mime[extname(path)] || 'application/octet-stream' }); res.end(await readFile(path));
  } catch { res.writeHead(404).end(); }
});
if (server) await new Promise(resolve => server.listen(0, '127.0.0.1', resolve));
const base = live || `http://127.0.0.1:${server.address().port}${mount}`;
const moduleURL = new URL('js/game.mjs', base).href;
const snapshot = page => page.evaluate(async url => (await import(url)).getSnapshot(), moduleURL);
const noOverflow = async page => assert.ok(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth + 1), 'horizontal overflow');
const engines = (process.env.RUEHL_BROWSERS || 'chromium').split(',');

try {
  for (const name of engines) {
    const launcher = { chromium, webkit }[name];
    const executablePath = name === 'chromium' ? process.env.CHROMIUM_EXECUTABLE_PATH || (!process.env.CI && existsSync('/usr/bin/chromium') ? '/usr/bin/chromium' : undefined) : undefined;
    const browser = await launcher.launch({ executablePath });
    try {
      const errors = [], missing = [];
      const context = await browser.newContext({ viewport: { width: 1280, height: 1000 }, reducedMotion: 'reduce' });
      const page = await context.newPage();
      page.on('pageerror', e => errors.push(e.message));
      page.on('response', response => { if (response.status() >= 400 && response.url().startsWith(base)) missing.push(response.url()); });
      await page.goto(base); await page.bringToFront(); await page.evaluate(() => document.fonts.ready);
      await page.evaluate(async url => { window.readGameForTest = (await import(url)).getSnapshot; }, moduleURL);
      await page.getByRole('button', { name: /MASSEPHASE STARTEN/ }).waitFor();
      await noOverflow(page);
      await page.screenshot({ path: `${out}/${name}-01-start.png`, fullPage: true });
      await page.getByRole('button', { name: /MASSEPHASE STARTEN/ }).click();
      await page.keyboard.down('d');
      try {
        await page.waitForFunction(() => window.readGameForTest().player.x > 270, undefined, { timeout: 12000, polling: 100 });
      } catch (error) {
        console.error('Bewegungsdiagnose', name, await snapshot(page), await page.evaluate(() => ({ hidden: document.hidden, focus: document.hasFocus() })));
        throw error;
      }
      await page.keyboard.up('d');
      let s = await snapshot(page); assert.ok(s.player.x > 240); assert.ok(s.shakes >= 1); assert.ok(s.pump >= 25);
      await page.keyboard.down('Space');
      await page.waitForFunction(() => window.readGameForTest().player.y < 245, undefined, { timeout: 5000, polling: 50 });
      s = await snapshot(page); assert.ok(s.player.y < 245, 'jump must lift the player');
      await page.keyboard.up('Space'); await page.waitForTimeout(650);
      const before = (await snapshot(page)).pump;
      await page.keyboard.press('e');
      await page.waitForFunction(before => window.readGameForTest().pump === before - 25, before, { timeout: 5000, polling: 50 });
      assert.equal((await snapshot(page)).pump, before - 25);
      await page.keyboard.press('Escape'); await page.waitForTimeout(80);
      const paused = await snapshot(page); assert.equal(paused.mode, 'paused');
      await page.waitForTimeout(250); assert.equal((await snapshot(page)).elapsed, paused.elapsed);
      await page.getByRole('button', { name: 'WEITERPUMPEN', exact: true }).click();
      await page.keyboard.down('d'); await page.waitForTimeout(1400); await page.keyboard.up('d');
      await page.waitForTimeout(1400);
      await page.screenshot({ path: `${out}/${name}-02-gameplay.png`, fullPage: true });
      await page.locator('canvas').screenshot({ path: `${out}/${name}-game-canvas.png` });
      assert.ok(await page.locator('canvas').evaluate(canvas => {
        const pixels = canvas.getContext('2d').getImageData(0, 0, canvas.width, canvas.height).data;
        const colors = new Set(); for (let i = 0; i < pixels.length; i += 16) colors.add(`${pixels[i]},${pixels[i + 1]},${pixels[i + 2]}`);
        return colors.size > 80;
      }), 'actual pixel scene must be rendered');
      await page.getByRole('button', { name: 'Ton einschalten', exact: true }).click();
      await page.reload(); await page.getByRole('button', { name: 'Ton ausschalten', exact: true }).waitFor();
      await context.close();

      const mobile = await browser.newContext({ viewport: { width: 390, height: 844 }, isMobile: true, hasTouch: true, reducedMotion: 'reduce' });
      const phone = await mobile.newPage(); phone.on('pageerror', e => errors.push(e.message));
      await phone.goto(base); await phone.evaluate(() => document.fonts.ready);
      await noOverflow(phone); await phone.screenshot({ path: `${out}/${name}-03-mobile-start.png`, fullPage: true });
      await phone.getByRole('button', { name: /MASSEPHASE STARTEN/ }).click();
      for (const button of await phone.locator('[data-action]').all()) {
        const box = await button.boundingBox(); assert.ok(box.width >= 44 && box.height >= 44, 'touch targets must be at least 44 pixels');
      }
      if (name === 'chromium') {
        const session = await mobile.newCDPSession(phone);
        const move = await phone.locator('[data-action="right"]').boundingBox(), jump = await phone.locator('[data-action="jump"]').boundingBox();
        await session.send('Input.dispatchTouchEvent', { type: 'touchStart', touchPoints: [
          { x: move.x + move.width / 2, y: move.y + move.height / 2, id: 1 },
          { x: jump.x + jump.width / 2, y: jump.y + jump.height / 2, id: 2 }
        ] });
        await phone.waitForTimeout(180);
        s = await snapshot(phone); assert.ok(s.player.x > 95, 'one finger must keep moving'); assert.ok(s.player.y < 245, 'second finger must jump simultaneously');
        await session.send('Input.dispatchTouchEvent', { type: 'touchEnd', touchPoints: [] });
        await phone.waitForTimeout(100); assert.equal((await snapshot(phone)).player.vx, 0);
      }
      await phone.screenshot({ path: `${out}/${name}-04-mobile-game.png`, fullPage: true });
      await phone.setViewportSize({ width: 844, height: 390 });
      await phone.waitForTimeout(350); await noOverflow(phone);
      assert.ok(await phone.locator('.touch-controls').isVisible(), JSON.stringify(await phone.evaluate(() => ({
        touch: navigator.maxTouchPoints, coarse: matchMedia('(any-pointer: coarse)').matches,
        width: innerWidth, height: innerHeight, controls: getComputedStyle(document.querySelector('.touch-controls')).display
      }))));
      assert.ok(await phone.locator('.stage').evaluate(el => el.getBoundingClientRect().width >= innerWidth - 2), 'landscape game must fill the available width');
      for (const button of await phone.locator('[data-action]').all()) {
        const box = await button.boundingBox(); assert.ok(box.y >= 0 && box.y + box.height <= 391, 'landscape controls must remain inside the screen');
      }
      await phone.screenshot({ path: `${out}/${name}-05-landscape.png`, fullPage: true });
      assert.deepEqual(errors, []); assert.deepEqual(missing, []);
      await mobile.close();
      console.log(`${name}: Start, Tastatur, Sprung, Pump, Pause, Ton, Touch, Größenwechsel und Screenshots bestanden.`);
    } finally { await browser.close(); }
  }
} finally { if (server) await new Promise(resolve => server.close(resolve)); }
