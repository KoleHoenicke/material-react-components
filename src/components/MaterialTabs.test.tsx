import { createRef, useState } from 'react'
import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { act, fireEvent, render, screen, within } from '@testing-library/react'
import { afterEach, describe, expect, it, vi } from 'vitest'
import {
  MaterialTab, MaterialLeadingIconTab, MaterialTabRow, MaterialScrollableTabRow,
  MaterialPrimaryTabRow, MaterialSecondaryTabRow, MaterialPrimaryScrollableTabRow,
  MaterialSecondaryScrollableTabRow, MaterialTabPanel, MaterialTabRowDefaults,
  MaterialPrimaryTabIndicator, MaterialSecondaryTabIndicator,
} from './MaterialTabs'

afterEach(() => { vi.restoreAllMocks(); vi.unstubAllGlobals() })

function Controlled({ manual = false, rtl = false }: { manual?: boolean; rtl?: boolean }) {
  const [selected, setSelected] = useState(0)
  return <MaterialPrimaryTabRow selectedTabIndex={selected} activationMode={manual ? 'manual' : 'automatic'} style={{ direction: rtl ? 'rtl' : 'ltr' }} aria-label="Media">
    {['Music', 'Radio', 'Podcasts'].map((text, index) => <MaterialTab key={text} selected={selected === index} disabled={index === 1} text={text} onClick={() => setSelected(index)} />)}
  </MaterialPrimaryTabRow>
}

describe('AndroidX tabs', () => {
  it('uses the focus state token and native incoming/outgoing state-layer timings', () => {
    const css = readFileSync(resolve('src/components/MaterialTabs.css'), 'utf8')
    const motion = readFileSync(resolve('src/theme/motion.css'), 'utf8')
    expect(css).toContain('opacity: var(--md-sys-state-focus-state-layer-opacity)')
    expect(css).toContain('transition-duration: var(--md-ripple-focus-opacity-duration)')
    expect(css).toContain('transition: opacity var(--md-ripple-hover-opacity-duration) linear')
    expect(css).toContain('.material-tab:focus-visible .material-ripple__surface::before { opacity: 0; }')
    expect(motion).toContain('--md-ripple-focus-opacity-duration: 45ms')
  })
  it.each([
    [MaterialPrimaryTabRow, 'primary', false, 'primary'],
    [MaterialSecondaryTabRow, 'secondary', false, 'secondary'],
    [MaterialPrimaryScrollableTabRow, 'primary', true, 'primary'],
    [MaterialSecondaryScrollableTabRow, 'secondary', true, 'secondary'],
    [MaterialTabRow, 'primary', false, 'secondary'],
    [MaterialScrollableTabRow, 'primary', true, 'secondary'],
  ] as const)('renders row defaults for %s', (Row, variant, scrollable, indicator) => {
    const { container } = render(<Row selectedTabIndex={0} aria-label="Media"><MaterialTab selected text="Music" /></Row>)
    const row = screen.getByRole('tablist', { name: 'Media' })
    expect(row).toHaveAttribute('aria-orientation', 'horizontal')
    expect(row).toHaveAttribute('data-variant', variant)
    expect(row).toHaveAttribute('data-scrollable', String(scrollable))
    expect(container.querySelector('.material-tab-indicator')).toHaveAttribute('data-variant', indicator)
    expect(screen.getByRole('tab', { name: 'Music' })).toHaveAttribute('aria-selected', 'true')
  })

  it('wraps automatic keyboard selection, skips disabled tabs, and keeps one tab stop', () => {
    render(<Controlled />)
    const music = screen.getByRole('tab', { name: 'Music' })
    const podcasts = screen.getByRole('tab', { name: 'Podcasts' })
    music.focus()
    fireEvent.keyDown(music, { key: 'ArrowRight' })
    expect(podcasts).toHaveFocus()
    expect(podcasts).toHaveAttribute('aria-selected', 'true')
    expect(music.tabIndex).toBe(-1)
    fireEvent.keyDown(podcasts, { key: 'ArrowRight' })
    expect(music).toHaveFocus()
    fireEvent.keyDown(music, { key: 'End' })
    expect(podcasts).toHaveFocus()
    fireEvent.keyDown(podcasts, { key: 'Home' })
    expect(music).toHaveFocus()
    expect(screen.getByRole('tab', { name: 'Radio' })).toBeDisabled()
    expect(screen.getAllByRole('tab').filter(tab => tab.tabIndex === 0)).toEqual([music])
  })

  it('moves focus without selecting in manual mode, and respects RTL', () => {
    render(<Controlled manual rtl />)
    const music = screen.getByRole('tab', { name: 'Music' })
    const podcasts = screen.getByRole('tab', { name: 'Podcasts' })
    music.focus()
    fireEvent.keyDown(music, { key: 'ArrowLeft' })
    expect(podcasts).toHaveFocus()
    expect(music).toHaveAttribute('aria-selected', 'true')
    expect(podcasts).toHaveAttribute('aria-selected', 'false')
    fireEvent.click(podcasts)
    expect(podcasts).toHaveAttribute('aria-selected', 'true')
  })

  it('preserves controlled selection and native button attributes, names and refs', () => {
    const ref = createRef<HTMLButtonElement>()
    const change = vi.fn()
    const { rerender } = render(<MaterialTab ref={ref} id="music-tab" aria-controls="music-panel" selected={false} icon={<svg><title>Decorative note</title></svg>} aria-label="Music" onClick={change} data-example="tab" />)
    const tab = screen.getByRole('tab', { name: 'Music' })
    expect(ref.current).toBe(tab)
    expect(tab).toHaveAttribute('type', 'button')
    expect(tab).toHaveAttribute('aria-controls', 'music-panel')
    expect(tab).toHaveAttribute('data-example', 'tab')
    expect(tab.tabIndex).toBe(0)
    fireEvent.click(tab)
    expect(change).toHaveBeenCalledOnce()
    expect(tab).toHaveAttribute('aria-selected', 'false')
    rerender(<MaterialTab selected aria-label="Music" />)
    expect(tab).toHaveAttribute('aria-selected', 'true')
  })

  it('exposes every content layout, caller colors and custom content', () => {
    const { rerender } = render(<MaterialTab selected text="Music" />)
    expect(screen.getByRole('tab')).toHaveAttribute('data-layout', 'text')
    rerender(<MaterialTab selected icon={<svg />} aria-label="Music" />)
    expect(screen.getByRole('tab')).toHaveAttribute('data-layout', 'icon')
    rerender(<MaterialTab selected icon={<svg />} text="Music" />)
    expect(screen.getByRole('tab')).toHaveAttribute('data-layout', 'stacked')
    rerender(<MaterialLeadingIconTab selected icon={<svg />} text="Music" selectedContentColor="red" unselectedContentColor="blue" style={{ '--md-tab-icon-size': '28px' }} />)
    expect(screen.getByRole('tab')).toHaveAttribute('data-layout', 'leading')
    expect(screen.getByRole('tab')).toHaveStyle({ '--md-tab-selected-content-color': 'red', '--md-tab-unselected-content-color': 'blue', '--md-tab-icon-size': '28px' })
    rerender(<MaterialTab selected><span>Custom content</span></MaterialTab>)
    expect(screen.getByRole('tab', { name: 'Custom content' })).toHaveAttribute('data-layout', 'custom')
  })

  it('lets callers cancel keyboard handling and ignores modified keys', () => {
    const click = vi.fn()
    const { rerender } = render(<MaterialPrimaryTabRow selectedTabIndex={0} onKeyDown={event => event.preventDefault()}><MaterialTab selected text="One" /><MaterialTab selected={false} text="Two" onClick={click} /></MaterialPrimaryTabRow>)
    const one = screen.getByRole('tab', { name: 'One' })
    one.focus()
    fireEvent.keyDown(one, { key: 'ArrowRight' })
    expect(one).toHaveFocus()
    rerender(<MaterialPrimaryTabRow selectedTabIndex={0}><MaterialTab selected text="One" /><MaterialTab selected={false} text="Two" onClick={click} /></MaterialPrimaryTabRow>)
    fireEvent.keyDown(one, { key: 'ArrowRight', ctrlKey: true })
    expect(click).not.toHaveBeenCalled()
  })

  it('falls back to the first enabled tab when selection is disabled or missing', () => {
    render(<MaterialPrimaryTabRow selectedTabIndex={0}><MaterialTab selected disabled text="One" /><MaterialTab selected={false} text="Two" /></MaterialPrimaryTabRow>)
    expect(screen.getByRole('tab', { name: 'One' }).tabIndex).toBe(-1)
    expect(screen.getByRole('tab', { name: 'Two' }).tabIndex).toBe(0)
  })

  it('handles empty rows and out-of-range selections without a stray indicator', () => {
    const { container, rerender } = render(<MaterialPrimaryTabRow selectedTabIndex={0}>{null}</MaterialPrimaryTabRow>)
    expect(container.querySelector('.material-tab-row__indicator')).toHaveAttribute('hidden')
    rerender(<MaterialPrimaryTabRow selectedTabIndex={-1}><MaterialTab selected={false} text="Music" /></MaterialPrimaryTabRow>)
    expect(container.querySelector('.material-tab-row__indicator')).toHaveAttribute('hidden')
  })

  it('supports custom row tokens, indicators and divider suppression', () => {
    const ref = createRef<HTMLDivElement>()
    const { container } = render(<MaterialPrimaryScrollableTabRow ref={ref} aria-label="Custom" selectedTabIndex={0} edgePadding={16} minTabWidth={120} containerColor="transparent" contentColor="red" divider={null}
      indicator={scope => <MaterialSecondaryTabIndicator data-position-count={scope.positions.length} height={5} color="blue" />}>
      <MaterialTab selected text="Music" />
    </MaterialPrimaryScrollableTabRow>)
    expect(ref.current).toBe(screen.getByRole('tablist'))
    expect(ref.current).toHaveStyle({ '--md-tab-row-edge-padding': '16px', '--md-tab-row-min-tab-width': '120px', '--md-tab-row-container-color': 'transparent', '--md-tab-row-content-color': 'red' })
    expect(container.querySelector('.material-tab-row__divider')).toBeEmptyDOMElement()
    expect(container.querySelector('.material-tab-indicator')).toHaveAttribute('data-position-count', '1')
    expect(container.querySelector<HTMLElement>('.material-tab-indicator')!.style.backgroundColor).toBe('blue')
    expect(container.querySelector('.material-tab-indicator')).toHaveStyle({ height: '5px' })
    expect(MaterialTabRowDefaults.ScrollableTabRowMinTabWidth).toBe(90)
    expect(MaterialTabRowDefaults.ScrollableTabRowEdgeStartPadding).toBe(52)
    expect(MaterialTabRowDefaults.indicatorHeight).toBe(3)
    expect(MaterialTabRowDefaults.PrimaryIndicator).toBe(MaterialPrimaryTabIndicator)
  })

  it('keeps inactive panels hidden and supports deliberate unmounting', () => {
    const { rerender } = render(<MaterialTabPanel selected id="music-panel" aria-labelledby="music-tab"><input aria-label="Search music" defaultValue="saved" /></MaterialTabPanel>)
    expect(screen.getByRole('tabpanel')).toHaveAttribute('aria-labelledby', 'music-tab')
    rerender(<MaterialTabPanel selected={false} id="music-panel"><input aria-label="Search music" defaultValue="saved" /></MaterialTabPanel>)
    expect(screen.queryByRole('tabpanel')).not.toBeInTheDocument()
    expect(screen.getByLabelText('Search music')).toHaveValue('saved')
    rerender(<MaterialTabPanel selected={false} keepMounted={false}>Removed</MaterialTabPanel>)
    expect(screen.queryByText('Removed')).not.toBeInTheDocument()
  })
})

const rect = (left: number, top: number, width: number, height: number) => ({ left, top, width, height, right: left + width, bottom: top + height, x: left, y: top, toJSON() {} })
function mockGeometry() {
  vi.spyOn(HTMLElement.prototype, 'getBoundingClientRect').mockImplementation(function (this: HTMLElement) {
    if (this.matches('[data-material-tab]')) {
      const tabs = Array.from(this.parentElement!.querySelectorAll('[data-material-tab]'))
      return rect(tabs.indexOf(this) * 120, 0, 120, 48)
    }
    if (this.matches('.material-tab__label')) return rect(0, 0, this.textContent === 'Long name' ? 102 : 72, 20)
    if (this.matches('.material-tab__icon')) return rect(0, 0, 24, 24)
    return rect(0, 0, 360, 48)
  })
}

describe('tab geometry and motion', () => {
  it('matches content width with the native 24px minimum and secondary full-tab width', () => {
    mockGeometry()
    const { container, rerender } = render(<MaterialPrimaryTabRow selectedTabIndex={0}><MaterialTab selected text="Music" /><MaterialTab selected={false} text="Long name" /></MaterialPrimaryTabRow>)
    const layer = container.querySelector<HTMLElement>('.material-tab-row__indicator')!
    expect(layer.style.width).toBe('40px')
    expect(layer.style.transform).toBe('translateX(40px)')
    rerender(<MaterialSecondaryTabRow selectedTabIndex={1}><MaterialTab selected={false} text="Music" /><MaterialTab selected text="Long name" /></MaterialSecondaryTabRow>)
    expect(container.querySelector('.material-tab-row__indicator')).toHaveStyle({ width: '120px', transform: 'translateX(120px)' })
    rerender(<MaterialPrimaryTabRow selectedTabIndex={0}><MaterialTab selected icon={<svg />} aria-label="Music" /></MaterialPrimaryTabRow>)
    expect(container.querySelector('.material-tab-row__indicator')).toHaveStyle({ width: '24px', transform: 'translateX(48px)' })
  })

  it.each([[20, 15, 15, 12, 37, 64], [40, 15, 35, 4, 49, 84]])('places icon/text by first and last baselines', (height, first, last, bottom, iconBottom, measuredHeight) => {
    vi.spyOn(HTMLElement.prototype, 'getBoundingClientRect').mockImplementation(function (this: HTMLElement) {
      if (this.matches('.material-tab__label')) return rect(0, 40, 72, height)
      if (this.hasAttribute('data-tab-first-baseline')) return rect(0, 40 + first, 0, 0)
      if (this.hasAttribute('data-tab-last-baseline')) return rect(0, 40 + last, 0, 0)
      return rect(0, 0, 24, 24)
    })
    render(<MaterialTab selected icon={<svg />} text="Music" />)
    const tab = screen.getByRole('tab')
    expect(tab.style.getPropertyValue('--md-tab-label-bottom')).toBe(`${bottom}px`)
    expect(tab.style.getPropertyValue('--md-tab-icon-bottom')).toBe(`${iconBottom}px`)
    expect(tab.style.getPropertyValue('--md-tab-measured-height')).toBe(`${measuredHeight}px`)
  })

  it('keeps native extra vertical room for wrapped text without an icon', () => {
    vi.spyOn(HTMLElement.prototype, 'getBoundingClientRect').mockImplementation(function (this: HTMLElement) {
      return rect(0, 0, 100, this.matches('.material-tab__label') ? 40 : 48)
    })
    render(<MaterialTab selected text="A label on two lines" />)
    expect(screen.getByRole('tab').style.getPropertyValue('--md-tab-measured-height')).toBe('60px')
  })

  it('measures leading content before applying scrollable minimum widths', () => {
    mockGeometry()
    const computedStyle = window.getComputedStyle.bind(window)
    vi.spyOn(window, 'getComputedStyle').mockImplementation(element => {
      const style = computedStyle(element)
      if (element.matches('.material-tab__content')) return Object.assign(style, { paddingInlineStart: '16px', paddingInlineEnd: '16px', columnGap: '8px' })
      return style
    })
    render(<MaterialPrimaryScrollableTabRow selectedTabIndex={0}><MaterialLeadingIconTab selected icon={<svg />} text="Long name" /></MaterialPrimaryScrollableTabRow>)
    expect(screen.getByRole('tab').style.getPropertyValue('--md-tab-intrinsic-width')).toBe('166px')
  })

  it('uses integer equal widths for fixed rows, preserving the native trailing remainder', () => {
    vi.spyOn(HTMLElement.prototype, 'clientWidth', 'get').mockReturnValue(326)
    const { container } = render(<MaterialPrimaryTabRow selectedTabIndex={0}>{['One', 'Two', 'Three'].map((text, index) => <MaterialTab key={text} selected={index === 0} text={text} />)}</MaterialPrimaryTabRow>)
    expect(container.querySelector<HTMLElement>('.material-tab-row__track')!.style.getPropertyValue('--md-tab-row-fixed-tab-width')).toBe('108px')
  })

  it('animates selection, retargets without a position jump, and snaps for reduced motion', () => {
    mockGeometry()
    let now = 0
    let callback: FrameRequestCallback | undefined
    let mediaChange: (() => void) | undefined
    const media = { matches: false, addEventListener: (_: string, listener: () => void) => { mediaChange = listener }, removeEventListener: vi.fn() }
    vi.stubGlobal('matchMedia', () => media)
    vi.spyOn(performance, 'now').mockImplementation(() => now)
    vi.stubGlobal('requestAnimationFrame', (fn: FrameRequestCallback) => { callback = fn; return 1 })
    vi.stubGlobal('cancelAnimationFrame', vi.fn())
    const row = (selected: number) => <MaterialPrimaryTabRow selectedTabIndex={selected}><MaterialTab selected={selected === 0} text="Music" /><MaterialTab selected={selected === 1} text="Long name" /></MaterialPrimaryTabRow>
    const { container, rerender, unmount } = render(row(0))
    const layer = container.querySelector<HTMLElement>('.material-tab-row__indicator')!
    rerender(row(1))
    expect(layer.style.transform).toBe('translateX(40px)')
    now = 60
    act(() => callback?.(now))
    const middle = layer.style.transform
    expect(middle).not.toBe('translateX(40px)')
    expect(middle).not.toBe('translateX(145px)')
    rerender(row(0))
    expect(layer.style.transform).toBe(middle)
    media.matches = true
    act(() => mediaChange?.())
    expect(layer.style.transform).toBe('translateX(40px)')
    expect(layer.style.width).toBe('40px')
    unmount()
    expect(media.removeEventListener).toHaveBeenCalled()
  })

  it('centers a controlled scrollable selection and clamps its ends in LTR and RTL', () => {
    mockGeometry()
    vi.stubGlobal('matchMedia', () => ({ matches: true, addEventListener() {}, removeEventListener() {} }))
    vi.spyOn(HTMLElement.prototype, 'scrollWidth', 'get').mockReturnValue(600)
    vi.spyOn(HTMLElement.prototype, 'clientWidth', 'get').mockReturnValue(240)
    const row = (index: number, rtl = false) => <MaterialPrimaryScrollableTabRow selectedTabIndex={index} style={{ direction: rtl ? 'rtl' : 'ltr' }}>
      {Array.from({ length: 5 }, (_, i) => <MaterialTab key={i} selected={index === i} text={`Tab ${i}`} />)}</MaterialPrimaryScrollableTabRow>
    const { container, rerender } = render(row(2))
    const viewport = container.querySelector<HTMLElement>('.material-tab-row__viewport')!
    expect(viewport.scrollLeft).toBe(180)
    rerender(row(4))
    expect(viewport.scrollLeft).toBe(360)
    rerender(row(0))
    expect(viewport.scrollLeft).toBe(0)
    rerender(row(0, true))
    expect(viewport.scrollLeft).toBe(-360)
  })
})
