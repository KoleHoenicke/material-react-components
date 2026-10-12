import { useRef } from 'react'
import { act, render, screen } from '@testing-library/react'
import { afterEach, beforeEach, expect, it, vi } from 'vitest'
import { useTimePickerSpring } from './useTimePickerSpring'
import { sampleMaterialSpring } from './materialSpring'
import { getMaterialSpringAttributes } from '../theme/materialMotion'

let frameTime = 0
let id = 0
let frames: Map<number, FrameRequestCallback>
let reduced = false
let change: () => void
beforeEach(() => {
  frameTime = 0; id = 0; frames = new Map(); reduced = false
  vi.spyOn(performance, 'now').mockImplementation(() => frameTime)
  vi.stubGlobal('requestAnimationFrame', (callback: FrameRequestCallback) => { frames.set(++id, callback); return id })
  vi.stubGlobal('cancelAnimationFrame', (key: number) => frames.delete(key))
  vi.stubGlobal('matchMedia', () => ({ get matches() { return reduced }, addEventListener: (_: string, handler: () => void) => { change = handler }, removeEventListener: vi.fn() }))
})
afterEach(() => { vi.restoreAllMocks(); vi.unstubAllGlobals() })
function tick(milliseconds: number) {
  act(() => { frameTime += milliseconds; const next = [...frames.values()]; frames.clear(); next.forEach(callback => callback(frameTime)) })
}
function Spring({ target, angular = false, snap = false }: { target: number; angular?: boolean; snap?: boolean }) {
  const ref = useRef<HTMLDivElement>(null)
  const spring = useTimePickerSpring(target, ref, 'spatial', 'default', snap, angular)
  return <div ref={ref}><output aria-label="Value">{spring.value}</output><output aria-label="Settled">{String(spring.settled)}</output></div>
}
it('samples AndroidX DefaultSpatial and retains velocity when interrupted', () => {
  const { rerender } = render(<Spring target={0} />)
  rerender(<Spring target={2} />)
  tick(50)
  const first = sampleMaterialSpring({ value: 0, velocity: 0 }, 2, 50, getMaterialSpringAttributes('spatial', 'default', 'expressive'))
  expect(Number(screen.getByLabelText('Value').textContent)).toBeCloseTo(first.value)
  rerender(<Spring target={-1} />)
  tick(20)
  const interrupted = sampleMaterialSpring(first, -1, 20, getMaterialSpringAttributes('spatial', 'default', 'expressive'))
  expect(Number(screen.getByLabelText('Value').textContent)).toBeCloseTo(interrupted.value)
  tick(3000)
  expect(screen.getByLabelText('Value')).toHaveTextContent('-1')
  expect(screen.getByLabelText('Settled')).toHaveTextContent('true')
})
it('takes the shortest dial path and snaps with live reduced-motion changes', () => {
  const { rerender } = render(<Spring target={Math.PI * 2 - 0.1} angular />)
  rerender(<Spring target={0} angular />)
  tick(40)
  expect(Number(screen.getByLabelText('Value').textContent)).toBeGreaterThan(Math.PI * 2 - 0.1)
  act(() => { reduced = true; change() })
  expect(Number(screen.getByLabelText('Value').textContent)).toBeCloseTo(Math.PI * 2)
  expect(screen.getByLabelText('Settled')).toHaveTextContent('true')
  expect(frames.size).toBe(0)
})
it('snaps direct manipulation without scheduling an animation', () => {
  const { rerender } = render(<Spring target={0} />)
  rerender(<Spring target={1} snap />)
  expect(screen.getByLabelText('Value')).toHaveTextContent('1')
  expect(frames.size).toBe(0)
})
