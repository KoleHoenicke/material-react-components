import { describe, expect, it } from 'vitest'
import { searchEasing, searchGeometry } from './searchGeometry'
const anchor = { left: 48, top: 100, width: 360, height: 56 }
const viewport = { left: 0, top: 0, width: 800, height: 900 }
describe('native search layout calculations', () => {
  it('starts a full-screen expansion at the collapsed bounds and finishes with the 72px header', () => {
    expect(searchGeometry(anchor, viewport, 0, 'full-screen', 400).surface).toEqual(anchor)
    const expanded = searchGeometry(anchor, viewport, 1, 'full-screen', 400)
    expect(expanded.surface).toEqual(viewport)
    expect(expanded.input).toEqual({ left: 0, top: 8, width: 800, height: 56 })
    expect(expanded.content.top).toBe(72)
    expect(expanded.radius).toBe(0)
  })
  it('keeps the contained background full-screen while its pill moves to 8px horizontal and 4px vertical padding', () => {
    expect(searchGeometry(anchor, viewport, 0, 'contained', 400).surface).toEqual(viewport)
    const expanded = searchGeometry(anchor, viewport, 1, 'contained', 400)
    expect(expanded.input).toEqual({ left: 8, top: 4, width: 784, height: 56 })
    expect(expanded.content.top).toBe(68)
  })
  it('uses 240px total minimum for modern docked, two-thirds/one-half maximum, and the dropdown gap', () => {
    expect(searchGeometry(anchor, viewport, 1, 'docked', 10).surface.height).toBe(240)
    expect(searchGeometry(anchor, viewport, 1, 'docked', 1000).surface.height).toBe(600)
    const gap = searchGeometry(anchor, viewport, 1, 'docked-with-gap', 1000)
    expect(gap.surface.height).toBe(450)
    expect(gap.content.top).toBe(158)
    expect(gap.content.height).toBe(392)
  })
  it('clamps small viewports and shifted visual viewports without overflowing either edge', () => {
    const small = { left: 0, top: 0, width: 320, height: 180 }
    const g = searchGeometry({ ...anchor, top: 170, left: 300 }, small, 1, 'docked-with-gap', 400)
    expect(g.surface.left).toBe(0)
    expect(g.surface.width).toBe(320)
    expect(g.surface.top + g.surface.height).toBeLessThanOrEqual(180)
    const shifted = searchGeometry(anchor, { ...viewport, left: 20, top: 30 }, 1, 'contained', 400, 24, 12)
    expect(shifted.input.left).toBe(28)
    expect(shifted.input.top).toBe(58)
    expect(shifted.content.height).toBe(796)
  })
  it('solves bezier time coordinates and clamps progress at overshoot boundaries', () => {
    expect(searchEasing(0.5, [0, 0, 1, 1])).toBeCloseTo(0.5)
    expect(searchEasing(0.5, [0, 1, 0, 1])).toBeGreaterThan(0.9)
    expect(searchGeometry(anchor, viewport, 1.1, 'full-screen', 0).radius).toBe(0)
    expect(searchGeometry(anchor, viewport, -0.1, 'full-screen', 0).surface).toEqual(anchor)
  })
})
