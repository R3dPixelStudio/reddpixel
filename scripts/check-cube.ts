import assert from 'node:assert/strict'
import { CUBE_CLEARANCE, innerWorldReveal, isCubeTap, neutralRotation } from '../src/world/cubeInteraction.ts'

for (const z of [14, 8, 4.5, 1, 0, -1, -Math.sqrt(3), -CUBE_CLEARANCE]) {
  assert.equal(innerWorldReveal(z), 0, `The inner world must stay hidden while any part of the cube can be ahead of the camera (z=${z})`)
}
assert.ok(innerWorldReveal(-CUBE_CLEARANCE - .2) > 0)
assert.equal(innerWorldReveal(-4), 1)
assert.equal(innerWorldReveal(-8), 1)
let previous = 0
for (let z = 8; z >= -4; z -= .01) {
  const reveal = innerWorldReveal(z)
  assert.ok(reveal >= previous && reveal >= 0 && reveal <= 1)
  previous = reveal
}
assert.ok(isCubeTap(3 ** 2 + 4 ** 2), 'Ordinary tap jitter should enter the cube')
assert.ok(!isCubeTap(12 ** 2), 'A swipe must not navigate')
assert.ok(!isCubeTap(0, true), 'Cancelled touches must not navigate')
for (const angle of [0, .4, -.4, 5.9, -5.9, 50, -50]) {
  const neutral = neutralRotation(angle)
  assert.ok(Math.abs(neutral) <= Math.PI)
  assert.ok(Math.abs(Math.sin(neutral) - Math.sin(angle)) < 1e-12)
  assert.ok(Math.abs(Math.cos(neutral) - Math.cos(angle)) < 1e-12, 'Navigation must preserve the visible orientation when reducing full turns')
}
console.log('Inner-world crossing, tap/swipe separation and rotation continuity verified.')
