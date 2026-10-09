import { act, renderHook } from '@testing-library/react'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { useMaterialSearchBarState } from '../components/MaterialSearchBar'
import { sampleMaterialSpring } from './materialSpring'
import { getMaterialSpringAttributes } from '../theme/materialMotion'
afterEach(() => { vi.restoreAllMocks(); vi.unstubAllGlobals() })
function clock() {
  let now = 0, id = 0
  const frames = new Map<number, FrameRequestCallback>()
  const listeners = new Set<() => void>()
  const query = { matches: false, addEventListener: (_: string, listener: () => void) => listeners.add(listener), removeEventListener: (_: string, listener: () => void) => listeners.delete(listener) }
  vi.stubGlobal('matchMedia', () => query)
  vi.spyOn(performance, 'now').mockImplementation(() => now)
  vi.stubGlobal('requestAnimationFrame', (callback: FrameRequestCallback) => { frames.set(++id, callback); return id })
  vi.stubGlobal('cancelAnimationFrame', (key: number) => frames.delete(key))
  return { step: (ms: number) => act(() => { now += ms; const callbacks = [...frames.values()]; frames.clear(); callbacks.forEach(callback => callback(now)) }), reduce: () => act(() => { query.matches = true; listeners.forEach(listener => listener()) }), frames }
}
describe('search animation state', () => {
  it('uses the actual AndroidX SlowSpatial/DefaultSpatial springs and preserves velocity when interrupted', () => {
    const time = clock()
    const { result } = renderHook(() => useMaterialSearchBarState())
    act(() => result.current.animateToExpanded())
    time.step(120)
    const incoming = sampleMaterialSpring({ value: 0, velocity: 0 }, 1, 120, getMaterialSpringAttributes('spatial', 'slow'))
    expect(result.current.progress).toBeCloseTo(incoming.value)
    act(() => result.current.animateToCollapsed())
    expect(result.current.progress).toBeCloseTo(incoming.value)
    time.step(10)
    const outgoing = sampleMaterialSpring(incoming, 0, 10, getMaterialSpringAttributes('spatial', 'default'))
    expect(result.current.progress).toBeCloseTo(outgoing.value)
    time.step(1500)
    expect(result.current.progress).toBe(0)
    expect(result.current.isAnimating).toBe(false)
    expect(time.frames.size).toBe(0)
  })
  it('switches off active motion when reduced motion changes and cancels outstanding frames', () => {
    const time = clock()
    const { result, unmount } = renderHook(() => useMaterialSearchBarState())
    act(() => result.current.animateToExpanded())
    time.step(50)
    expect(result.current.isAnimating).toBe(true)
    time.reduce()
    expect(result.current.progress).toBe(1)
    expect(result.current.isAnimating).toBe(false)
    expect(time.frames.size).toBe(0)
    unmount()
  })
  it('retains the legacy 100ms delay and 600ms expansion, and stages contained content after 50ms', () => {
    const time = clock()
    const { result } = renderHook(() => useMaterialSearchBarState({ motion: 'legacy' }))
    act(() => result.current.animateToExpanded())
    time.step(80)
    expect(result.current.progress).toBe(0)
    time.step(20)
    expect(result.current.progress).toBe(0)
    time.step(600)
    expect(result.current.progress).toBe(1)
    const contained = renderHook(() => useMaterialSearchBarState({ motion: 'contained' }))
    act(() => contained.result.current.animateToExpanded())
    time.step(40)
    expect(contained.result.current.progress).toBeGreaterThan(0)
    expect(contained.result.current.contentProgress).toBe(0)
    time.step(60)
    expect(contained.result.current.contentProgress).toBeGreaterThan(0)
    expect(contained.result.current.contentProgress).toBeLessThan(1)
    time.step(1000)
    expect(contained.result.current.contentProgress).toBe(1)
  })
  it('honors the standard motion scheme and snaps only when explicitly requested', () => {
    const time = clock()
    const { result } = renderHook(() => useMaterialSearchBarState())
    const anchor = document.createElement('div')
    anchor.dataset.motionScheme = 'standard'
    result.current.anchorRef.current = anchor
    act(() => result.current.animateToExpanded())
    time.step(100)
    const expected = sampleMaterialSpring({ value: 0, velocity: 0 }, 1, 100, getMaterialSpringAttributes('spatial', 'slow', 'standard'))
    expect(result.current.progress).toBeCloseTo(expected.value)
    act(() => result.current.snapTo('expanded'))
    expect(result.current.progress).toBe(1)
    expect(result.current.isAnimating).toBe(false)
    expect(time.frames.size).toBe(0)
  })
})
