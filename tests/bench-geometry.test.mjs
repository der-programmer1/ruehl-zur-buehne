import test from 'node:test';
import assert from 'node:assert/strict';
import { benchGeometry, ARM_LENGTH } from '../dist/js/bench-geometry.mjs';
import { BENCH } from '../dist/js/bench.mjs';

const near = (actual, expected, message) => assert.ok(Math.abs(actual - expected) < 1e-8, `${message}: ${actual} statt ${expected}`);
const length = (a, b) => Math.hypot(a.x - b.x, a.y - b.y, a.z - b.z);

test('die Langhantel liegt in jeder Phase im rechten Winkel zur Körperachse', () => {
  for (let t = 0; t <= BENCH.duration; t += 1 / 60) {
    const g = benchGeometry(t);
    const body = { x: g.hips.x - g.head.x, y: g.hips.y - g.head.y };
    const bar = { x: g.bar.right.x - g.bar.left.x, y: g.bar.right.y - g.bar.left.y };
    near(body.x * bar.x + body.y * bar.y, 0, 'Stange quer zur Wirbelsäule');
    assert.ok(Math.hypot(body.x, body.y) > 50); assert.ok(Math.hypot(bar.x, bar.y) > 300);
  }
});
test('beide Hände umgreifen die Stange außerhalb der Schultern und innerhalb der Scheiben', () => {
  for (let t = 0; t <= BENCH.duration; t += 1 / 60) {
    const g = benchGeometry(t), left = g.leftArm.wrist, right = g.rightArm.wrist;
    near(left.y, g.bar.left.y, 'linke Hand auf Stange'); near(right.y, g.bar.right.y, 'rechte Hand auf Stange');
    assert.ok(g.bar.leftPlate.x < left.x && left.x < g.leftArm.shoulder.x);
    assert.ok(g.rightArm.shoulder.x < right.x && right.x < g.bar.rightPlate.x);
    near(left.x, 640 - right.x, 'symmetrischer Griff');
    for (const arm of [g.leftArm, g.rightArm]) {
      near(length(arm.world.shoulder, arm.world.elbow), ARM_LENGTH, 'Oberarmlänge');
      near(length(arm.world.elbow, arm.world.wrist), ARM_LENGTH, 'Unterarmlänge');
    }
  }
});
test('beim Drücken steigt die Hantel senkrecht auf; Füße und Körperachse bleiben stehen', () => {
  const top = benchGeometry(.25), bottom = benchGeometry(1.64);
  assert.ok(top.bar.left.y < bottom.bar.left.y - 70);
  near(top.bar.left.x, bottom.bar.left.x, 'Stange ohne seitliches Driften');
  assert.deepEqual(top.legs, bottom.legs);
  near(top.head.x, bottom.head.x, 'Kopf auf Bankachse'); near(top.hips.x, bottom.hips.x, 'Hüfte auf Bankachse');
});
test('auf Brusthöhe stehen die Unterarme unter den Griffen, die Ellenbogen neben der Bank', () => {
  const g = benchGeometry(1.64);
  for (const arm of [g.leftArm, g.rightArm]) {
    assert.ok(Math.abs(arm.wrist.x - arm.elbow.x) < 10);
    assert.ok(arm.elbow.y > arm.wrist.y + 20);
    assert.ok(arm.world.wrist.z > arm.world.elbow.z + 50);
  }
});
