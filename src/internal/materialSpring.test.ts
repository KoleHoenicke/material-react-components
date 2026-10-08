import { describe, expect, it } from 'vitest'
import { sampleMaterialSpring } from './materialSpring'
import { getMaterialSpringAttributes } from '../theme/materialMotion'

describe('AndroidX analytic spring', () => {
  it('starts at the supplied value and velocity and settles at its target', () => {
    const spring = getMaterialSpringAttributes('spatial', 'default')
    const initial = { value: 10, velocity: 40 }
    expect(sampleMaterialSpring(initial, 100, 0, spring).value).toBeCloseTo(10)
    expect(sampleMaterialSpring(initial, 100, 0, spring).velocity).toBeCloseTo(40)
    expect(sampleMaterialSpring(initial, 100, 2000, spring).value).toBeCloseTo(100, 6)
  })
  it('preserves expressive overshoot and handles a reversal with nonzero velocity', () => {
    const spring = getMaterialSpringAttributes('spatial', 'default')
    const initial = { value: 0, velocity: 0 }
    expect(sampleMaterialSpring(initial, 100, 280, spring).value).toBeGreaterThan(100)
    const interrupted = sampleMaterialSpring(initial, 100, 60, spring)
    expect(sampleMaterialSpring(interrupted, 0, 0, spring).value).toBeCloseTo(interrupted.value, 12)
    expect(sampleMaterialSpring(interrupted, 0, 0, spring).velocity).toBeCloseTo(interrupted.velocity, 12)
    expect(sampleMaterialSpring(interrupted, 0, 5, spring).value).toBeGreaterThan(interrupted.value)
  })
  it.each([1, 1.5])('settles without overshoot for damping %s', dampingRatio => {
    const spring = { dampingRatio, stiffness: 1600 }
    const initial = { value: 0, velocity: 0 }
    expect(sampleMaterialSpring(initial, 1, 50, spring).value).toBeGreaterThan(0)
    expect(sampleMaterialSpring(initial, 1, 50, spring).value).toBeLessThan(1)
    expect(sampleMaterialSpring(initial, 1, 2000, spring).value).toBeCloseTo(1, 6)
  })
})
