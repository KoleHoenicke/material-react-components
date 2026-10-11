import { useRef } from 'react'
import { act, render } from '@testing-library/react'
import { afterEach, expect, it, vi } from 'vitest'
import { useSnackbarAnimation } from './useSnackbarAnimation'
import { getMaterialSpringAttributes } from '../theme/materialMotion'
import { sampleMaterialSpring } from './materialSpring'

afterEach(() => { vi.restoreAllMocks(); vi.unstubAllGlobals() })
function clock() {
  let now = 0, id = 0
  const frames = new Map<number, FrameRequestCallback>(), listeners = new Set<() => void>()
  const query = { matches: false, addEventListener: (_: string, cb: () => void) => listeners.add(cb), removeEventListener: (_: string, cb: () => void) => listeners.delete(cb) }
  vi.stubGlobal('matchMedia', () => query)
  vi.spyOn(performance, 'now').mockImplementation(() => now)
  vi.stubGlobal('requestAnimationFrame', (cb: FrameRequestCallback) => { frames.set(++id, cb); return id })
  vi.stubGlobal('cancelAnimationFrame', (key: number) => frames.delete(key))
  return { step: (ms: number) => act(() => { now += ms; const callbacks = [...frames.values()]; frames.clear(); callbacks.forEach(cb => cb(now)) }), reduce: () => act(() => { query.matches = true; listeners.forEach(cb => cb()) }), frames, listeners }
}
function Harness({ visible, scheme, onExited }: { visible: boolean; scheme: string; onExited: () => void }) {
  const ref = useRef<HTMLDivElement>(null)
  useSnackbarAnimation(ref, visible, onExited)
  return <div data-motion-scheme={scheme}><div ref={ref} /></div>
}
const scale = (root: HTMLElement) => parseFloat(root.style.transform.slice(6))

it.each(['expressive', 'standard'] as const)('uses AndroidX %s springs and preserves reversal velocity', scheme => {
  const time = clock(), onExited = vi.fn()
  const { container, rerender } = render(<Harness visible scheme={scheme} onExited={onExited} />)
  const root = container.firstElementChild!.firstElementChild as HTMLElement
  expect(root.style.opacity).toBe('0')
  expect(scale(root)).toBe(0.8)
  time.step(40)
  const effects = getMaterialSpringAttributes('effects', 'fast', scheme), spatial = getMaterialSpringAttributes('spatial', 'fast', scheme)
  const alpha = sampleMaterialSpring({ value: 0, velocity: 0 }, 1, 40, effects)
  const size = sampleMaterialSpring({ value: 0.8, velocity: 0 }, 1, 40, spatial)
  expect(Number(root.style.opacity)).toBeCloseTo(alpha.value)
  expect(scale(root)).toBeCloseTo(size.value)
  rerender(<Harness visible={false} scheme={scheme} onExited={onExited} />)
  time.step(10)
  expect(Number(root.style.opacity)).toBeCloseTo(sampleMaterialSpring(alpha, 0, 10, effects).value)
  expect(scale(root)).toBeCloseTo(sampleMaterialSpring(size, 0.8, 10, spatial).value)
  time.step(1000)
  expect(onExited).toHaveBeenCalledTimes(1)
  expect(time.frames.size).toBe(0)
})

it('settles opacity independently, retains expressive scale overshoot, and removes exits at opacity completion', () => {
  const time = clock(), onExited = vi.fn()
  const { container, rerender } = render(<Harness visible scheme="expressive" onExited={onExited} />)
  const root = container.firstElementChild!.firstElementChild as HTMLElement
  time.step(140)
  expect(root.style.opacity).toBe('1')
  expect(scale(root)).toBeGreaterThan(1)
  expect(time.frames.size).toBe(1)
  time.step(1000)
  rerender(<Harness visible={false} scheme="expressive" onExited={onExited} />)
  time.step(140)
  expect(onExited).toHaveBeenCalledTimes(1)
  expect(time.frames.size).toBe(0)
})

it('responds to live reduced motion and cleans up frames and listeners', () => {
  const time = clock(), onExited = vi.fn()
  const { container, rerender, unmount } = render(<Harness visible scheme="expressive" onExited={onExited} />)
  const root = container.firstElementChild!.firstElementChild as HTMLElement
  time.reduce()
  expect(root.style.opacity).toBe('1')
  expect(scale(root)).toBe(1)
  expect(time.frames.size).toBe(0)
  rerender(<Harness visible={false} scheme="expressive" onExited={onExited} />)
  expect(onExited).toHaveBeenCalledTimes(1)
  unmount()
  expect(time.listeners.size).toBe(0)
})
