import { useRef } from 'react'
import { act, render } from '@testing-library/react'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { getMaterialSpringAttributes } from '../theme/materialMotion'
import { sampleMaterialSpring } from './materialSpring'
import { useRadioButtonAnimation } from './useRadioButtonAnimation'
import { readRadioColor } from './radioColor'

afterEach(() => { vi.restoreAllMocks(); vi.unstubAllGlobals() })
function clock() {
  let now = 0, id = 0
  const frames = new Map<number, FrameRequestCallback>()
  const listeners = new Set<() => void>()
  const query = { matches: false, addEventListener: (_: string, cb: () => void) => listeners.add(cb), removeEventListener: (_: string, cb: () => void) => listeners.delete(cb) }
  vi.stubGlobal('matchMedia', () => query)
  vi.spyOn(performance, 'now').mockImplementation(() => now)
  vi.stubGlobal('requestAnimationFrame', (cb: FrameRequestCallback) => { frames.set(++id, cb); return id })
  vi.stubGlobal('cancelAnimationFrame', (key: number) => frames.delete(key))
  return { step: (ms: number) => act(() => { now += ms; const callbacks = [...frames.values()]; frames.clear(); callbacks.forEach(cb => cb(now)) }), reduce: () => act(() => { query.matches = true; listeners.forEach(cb => cb()) }), frames }
}
function Harness({ selected, disabled = false, scheme = 'expressive', color }: { selected: boolean; disabled?: boolean; scheme?: string; color?: string }) {
  const root = useRef<HTMLSpanElement>(null)
  useRadioButtonAnimation(selected, disabled, root)
  return <span ref={root} data-motion-scheme={scheme}>
    <span className="material-radio-button__color-target" style={{ color: color ?? (disabled ? 'rgba(0, 0, 0, 0.38)' : selected ? 'rgb(255, 0, 0)' : 'rgb(0, 0, 255)') }} />
    <svg className="material-radio-button__icon" />
  </span>
}
const radius = (container: HTMLElement) => parseFloat(container.querySelector<SVGElement>('svg')!.style.getPropertyValue('--md-radio-button-animated-dot-radius'))

describe('radio button AndroidX animation', () => {
  it('starts at the selected value without an entry animation', () => {
    const time = clock()
    const { container } = render(<Harness selected />)
    expect(radius(container)).toBe(6)
    expect(time.frames.size).toBe(0)
  })

  it.each(['expressive', 'standard'])('uses the %s FastSpatial spring, including overshoot and interruption velocity', scheme => {
    const time = clock()
    const { container, rerender } = render(<Harness selected={false} scheme={scheme} />)
    rerender(<Harness selected scheme={scheme} />)
    time.step(100)
    const spring = getMaterialSpringAttributes('spatial', 'fast', scheme as 'expressive' | 'standard')
    const incoming = sampleMaterialSpring({ value: 0, velocity: 0 }, 6, 100, spring)
    expect(radius(container)).toBeCloseTo(incoming.value)
    rerender(<Harness selected={false} scheme={scheme} />)
    time.step(10)
    expect(radius(container)).toBeCloseTo(sampleMaterialSpring(incoming, 0, 10, spring).value)
    time.step(1500)
    expect(radius(container)).toBe(0)
    expect(time.frames.size).toBe(0)
  })

  it('animates color in Oklab with the DefaultEffects spring', () => {
    const time = clock()
    const { container, rerender } = render(<Harness selected={false} />)
    const target = container.querySelector<HTMLElement>('.material-radio-button__color-target')!
    const blue = readRadioColor(target)!
    rerender(<Harness selected />)
    const red = readRadioColor(target)!
    time.step(40)
    const color = readRadioColor(container.querySelector('svg') as unknown as HTMLElement)!
    blue.forEach((value, i) => expect(color[i]).toBeCloseTo(sampleMaterialSpring({ value, velocity: 0 }, red[i], 40, getMaterialSpringAttributes('effects', 'default')).value, 5))
    expect(color[0]).not.toBe(red[0])
  })

  it('snaps color in both enabled/disabled directions while keeping radius motion', () => {
    const time = clock()
    const { container, rerender } = render(<Harness selected={false} />)
    rerender(<Harness selected disabled />)
    expect(container.querySelector<SVGElement>('svg')!.style.color).toContain('/ 0.38')
    time.step(40)
    expect(radius(container)).toBeGreaterThan(0)
    expect(radius(container)).toBeLessThan(6)
    rerender(<Harness selected />)
    const color = readRadioColor(container.querySelector('svg') as unknown as HTMLElement)!
    expect(color[3]).toBe(1)
    const red = readRadioColor(container.querySelector<HTMLElement>('.material-radio-button__color-target')!)!
    color.forEach((value, i) => expect(value).toBeCloseTo(red[i], 5))
  })

  it('settles the effects color independently while the spatial radius is still moving', () => {
    const time = clock()
    const { container, rerender } = render(<Harness selected={false} />)
    rerender(<Harness selected />)
    time.step(160)
    const target = readRadioColor(container.querySelector<HTMLElement>('.material-radio-button__color-target')!)!
    const color = readRadioColor(container.querySelector('svg') as unknown as HTMLElement)!
    color.forEach((value, i) => expect(value).toBeCloseTo(target[i], 5))
    expect(radius(container)).toBeGreaterThan(6)
    expect(time.frames.size).toBe(1)
  })

  it('honors live reduced motion and cleans up outstanding animation frames', () => {
    const time = clock()
    const { container, rerender, unmount } = render(<Harness selected={false} />)
    rerender(<Harness selected />)
    time.step(20)
    expect(time.frames.size).toBe(1)
    time.reduce()
    expect(radius(container)).toBe(6)
    expect(time.frames.size).toBe(0)
    unmount()
    expect(time.frames.size).toBe(0)
  })

  it('cancels pending frames when unmounted during a selection animation', () => {
    const time = clock()
    const { rerender, unmount } = render(<Harness selected={false} />)
    rerender(<Harness selected />)
    expect(time.frames.size).toBe(1)
    unmount()
    expect(time.frames.size).toBe(0)
  })
})
