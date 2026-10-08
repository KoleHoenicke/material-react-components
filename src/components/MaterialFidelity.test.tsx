import { act, render, screen } from '@testing-library/react'
import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { MaterialFloatingActionButtonMenu, MaterialFloatingActionButtonMenuItem } from './MaterialFloatingActionButtonMenu'
import { MaterialLoadingIndicator } from './MaterialLoadingIndicator'
import { MaterialCircularProgressIndicator, MaterialCircularWavyProgressIndicator } from './MaterialProgressIndicator'
import { circularWavyGeometry } from '../internal/circularWavyGeometry'

const css = (name: string) => readFileSync(resolve(process.cwd(), `src/components/${name}.css`), 'utf8')

function animationClock(reduced = false) {
  let callback: FrameRequestCallback | undefined
  vi.spyOn(window.performance, 'now').mockReturnValue(0)
  vi.stubGlobal('matchMedia', vi.fn(() => ({ matches: reduced, addEventListener: vi.fn(), removeEventListener: vi.fn() })))
  vi.stubGlobal('requestAnimationFrame', vi.fn((next: FrameRequestCallback) => { callback = next; return 1 }))
  const cancel = vi.fn()
  vi.stubGlobal('cancelAnimationFrame', cancel)
  return { tick: (ms: number) => act(() => callback?.(ms)), cancel }
}

afterEach(() => { vi.restoreAllMocks(); vi.unstubAllGlobals() })

const angle = (path: Element) => Number(path.getAttribute('transform')?.match(/rotate\(([-\d.]+)/)?.[1])
const angularDistance = (a: number, b: number) => Math.abs(((a - b + 540) % 360 + 360) % 360 - 180)

describe('AndroidX component fidelity regressions', () => {
  it('keeps loading rotation continuous across all seven-shape sequence wraps', () => {
    const clock = animationClock()
    render(<MaterialLoadingIndicator label="Morphing" />)
    const path = screen.getByRole('progressbar').querySelector('path')!
    for (const wrap of [4550, 9100, 13650, 18200]) {
      clock.tick(wrap - 1)
      const before = angle(path)
      clock.tick(wrap)
      expect(angularDistance(angle(path), before)).toBeLessThan(0.2)
    }
  })

  it('stops loading animation under reduced motion and cancels on unmount', () => {
    const clock = animationClock(true)
    const {unmount} = render(<MaterialLoadingIndicator label="Still" />)
    expect(window.requestAnimationFrame).not.toHaveBeenCalled()
    unmount()
    expect(clock.cancel).not.toHaveBeenCalled()
  })

  it('uses the native circular sweep easing and continuous 1500ms rotation steps', () => {
    const clock = animationClock()
    render(<MaterialCircularProgressIndicator label="Circular" />)
    const root = screen.getByRole('progressbar')
    const active = root.querySelector('.material-progress__active')!
    const group = root.querySelector('g')!
    clock.tick(1500)
    expect(Number(active.getAttribute('stroke-dasharray')?.split(' ')[0])).toBeCloseTo(69.718, 2)
    expect(active.getAttribute('transform')).toBe('rotate(0 20 20)')
    for (const boundary of [1500, 3000, 4500, 6000, 12000]) {
      clock.tick(boundary - 1)
      const before = angle(group)
      clock.tick(boundary)
      expect(angularDistance(angle(group), before)).toBeLessThan(0.3)
    }
  })

  it('keeps rounded-star geometry fixed while shifting the visible wavy arc', () => {
    const clock = animationClock()
    render(<MaterialCircularWavyProgressIndicator label="Wavy" />)
    const active = screen.getByRole('progressbar').querySelector('.material-progress__active')!
    const initial = active.getAttribute('d')
    clock.tick(100)
    expect(active.getAttribute('d')).toBe(initial)
    expect(active.getAttribute('stroke-dashoffset')).not.toBe('0')
    expect(active.getAttribute('transform')).not.toBe('rotate(0 24 24)')
    for (const amplitude of [0, 0.25, 0.5, 0.75, 1]) {
      const shape = circularWavyGeometry(48, 4, 9, amplitude)
      expect(shape.path).not.toMatch(/NaN|Infinity/)
      expect(shape.length).toBeGreaterThan(100)
      expect(shape.path).toMatch(/Z$/)
    }
    expect(css('MaterialProgressIndicator')).toMatch(/\.material-progress\s*\{[^}]*overflow: visible;/s)
  })

  it('lets menu density, palette and custom tokens inherit into groups and items', () => {
    const menu = css('MaterialMenu')
    expect(menu).toContain(".material-menu-group[data-token-scope='true']")
    expect(menu).toContain(".material-menu-item[data-token-scope='true']")
    expect(menu).toMatch(/\.material-menu-surface\s*\{[^}]*overflow: visible;/s)
    expect(menu).toMatch(/\.material-menu-surface__scroll\s*\{[^}]*overflow: auto;/s)
    expect(menu).toContain('filter: drop-shadow(var(--md-menu-container-elevation))')
  })

  it('uses primary text-button color and puts focus around the 40dp visual surface', () => {
    const button = css('MaterialButton')
    expect(button).toMatch(/\.material-button--text\s*\{[^}]*--md-button-content-color: var\(--md-sys-color-primary\);/s)
    expect(button).toMatch(/\.material-button:focus-visible::before\s*\{[^}]*outline: 3px solid[^}]*outline-offset: 2px;/s)
    expect(css('MaterialDialog')).toContain('--md-button-focus-indicator-color: var(--md-dialog-focus-indicator-color)')
  })

  it('inherits component state colors instead of resetting them on the ripple', () => {
    const ripple = css('MaterialRipple')
    expect(ripple.match(/\.material-ripple\s*\{([^}]+)\}/)?.[1]).not.toMatch(/--md-ripple-(hover|pressed)-(color|opacity):/)
    expect(ripple).toContain('var(--md-ripple-hover-color, var(--md-sys-color-on-surface))')
    expect(css('MaterialChip')).toContain(".material-chip[data-kind='filter']:not([data-elevated='true'])[data-selected='true']:hover")
    expect(css('MaterialChip')).toMatch(/data-removable='true'[^}]*> \.material-chip__primary\s*\{\s*position: static;/s)
  })

  it('shrinks the FAB pill itself, preserves item content, and inherits the chosen color set', () => {
    const fab = css('MaterialFloatingActionButtonMenu')
    expect(fab).toContain(".material-fab-menu-item[data-token-scope='true']")
    expect(fab).toContain('inline-size: var(--md-fab-menu-item-width, auto)')
    expect(fab).not.toContain('clip-path: inset')
    expect(fab).toMatch(/\.material-fab-menu-item__content\s*\{[^}]*inline-size: max-content;/s)
    expect(fab).toContain('--md-fab-menu-item-container-elevation: var(--md-sys-elevation-level0, none)')
  })

  it('reveals FAB actions bottom first using the SlowEffects spring count', () => {
    const clock = animationClock()
    const example = (expanded: boolean) => <MaterialFloatingActionButtonMenu expanded={expanded}
      icon={<svg />} closeIcon={<svg />} onExpandedChange={() => undefined} toggleLabel="Create">
      {[0, 1, 2].map(i => <MaterialFloatingActionButtonMenuItem key={i} icon={<svg />}>Action {i}</MaterialFloatingActionButtonMenuItem>)}
    </MaterialFloatingActionButtonMenu>
    const {container, rerender, unmount} = render(example(false))
    rerender(example(true))
    const visibility = () => [...container.querySelectorAll('.material-fab-menu__item-slot')].map(e => e.getAttribute('data-visible'))
    clock.tick(30)
    expect(visibility()).toEqual(['false', 'false', 'true'])
    clock.tick(70)
    expect(visibility()).toEqual(['false', 'true', 'true'])
    clock.tick(90)
    expect(visibility()).toEqual(['true', 'true', 'true'])
    unmount()
    expect(clock.cancel).toHaveBeenCalled()
  })

  it('interpolates the FAB close radius to half its final size rather than an oversized pill value', () => {
    const fab = css('MaterialFloatingActionButtonMenu')
    expect(fab).toContain('--md-fab-menu-close-container-shape: calc(var(--md-fab-menu-close-container-size) / 2)')
    expect(fab).not.toMatch(/--md-fab-menu-close-container-shape:[^;]*9999/)
    expect(fab).toContain('border-radius var(--m3-motion-transition-fast-spatial)')
  })

  it('uses the normal trailing icon bounds for an expanded list disclosure', () => {
    const list = css('MaterialList')
    expect(list).toMatch(/\.material-list-expand-icon\s*\{[^}]*inline-size: var\(--md-list-trailing-icon-size\);/s)
    expect(list).not.toContain(".material-list-expand-icon[data-expanded='true'] {")
  })
})
