import { benchPose } from './bench.mjs';

export const ARM_LENGTH = 70;

// World axes: X crosses the bench, Y follows the body, Z is height.
// The camera looks down the bench from the feet. The bar stays on the X axis.
export function projectBenchPoint({ x, y, z }) {
  return { x: 320 + x * (1 + y * .0014), y: 278 + y * .43 - z * .72 };
}

function arm(side, barHeight, breath) {
  const shoulder = { x: side * 42, y: -48, z: 80 + breath };
  const wrist = { x: side * 74, y: 0, z: barHeight };
  const delta = { x: wrist.x - shoulder.x, y: wrist.y - shoulder.y, z: wrist.z - shoulder.z };
  const distance = Math.hypot(delta.x, delta.y, delta.z);
  const direction = { x: delta.x / distance, y: delta.y / distance, z: delta.z / distance };
  // Elbows lower beside the pad; forearms stay below the grips, rather than
  // swinging toward the head or stretching sideways along the bar.
  const preferred = { x: side * .25, y: 0, z: -1 };
  const dot = preferred.x * direction.x + preferred.z * direction.z;
  const outward = { x: preferred.x - dot * direction.x, y: -dot * direction.y, z: preferred.z - dot * direction.z };
  const normalLength = Math.hypot(outward.x, outward.y, outward.z);
  const bend = Math.sqrt(Math.max(0, ARM_LENGTH ** 2 - distance ** 2 / 4));
  const elbow = Object.fromEntries(['x', 'y', 'z'].map(axis => [axis,
    (shoulder[axis] + wrist[axis]) / 2 + outward[axis] / normalLength * bend
  ]));
  return { shoulder: projectBenchPoint(shoulder), elbow: projectBenchPoint(elbow), wrist: projectBenchPoint(wrist), world: { shoulder, elbow, wrist } };
}

export function benchGeometry(elapsed) {
  const pose = benchPose(elapsed), breath = Math.sin(elapsed * 3) * .6;
  const barHeight = 90 + pose.lift * 112;
  const head = projectBenchPoint({ x: 0, y: -90, z: 72 + breath });
  const hips = projectBenchPoint({ x: 0, y: 58, z: 70 });
  const bar = {
    left: projectBenchPoint({ x: -170, y: 0, z: barHeight }),
    right: projectBenchPoint({ x: 170, y: 0, z: barHeight }),
    leftPlate: projectBenchPoint({ x: -130, y: 0, z: barHeight }),
    rightPlate: projectBenchPoint({ x: 130, y: 0, z: barHeight }),
    height: barHeight
  };
  const legs = [-1, 1].map(side => ({
    hip: projectBenchPoint({ x: side * 22, y: 58, z: 70 }),
    knee: projectBenchPoint({ x: side * 54, y: 92, z: 44 }),
    foot: projectBenchPoint({ x: side * 69, y: 78, z: 0 }), side
  }));
  return { pose, breath, head, hips, bar, legs, leftArm: arm(-1, barHeight, breath), rightArm: arm(1, barHeight, breath) };
}
