import { createRef } from 'react'
import { act, fireEvent, render, screen, within } from '@testing-library/react'
import { readFileSync } from 'node:fs'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { MaterialSnackbar } from './MaterialSnackbar'
import { MaterialSnackbarHost } from './MaterialSnackbarHost'
import { MATERIAL_SNACKBAR_DEFAULTS, MaterialSnackbarHostState } from './MaterialSnackbarState'

afterEach(() => { vi.useRealTimers(); vi.restoreAllMocks(); vi.unstubAllGlobals() })
const show = (state: MaterialSnackbarHostState, input: Parameters<MaterialSnackbarHostState['showSnackbar']>[0]) => {
  let promise!: ReturnType<MaterialSnackbarHostState['showSnackbar']>
  act(() => { promise = state.showSnackbar(input) })
  return promise
}

describe('snackbar visuals', () => {
  it('forwards native props and ref, exposes content slots, and leaves announcements to the host', () => {
    const ref = createRef<HTMLDivElement>()
    render(<MaterialSnackbar ref={ref} id="notice" dir="rtl" className="custom" action={<button>Undo</button>} dismissAction={<button>Close</button>} actionOnNewLine>Saved</MaterialSnackbar>)
    expect(ref.current).toHaveAttribute('id', 'notice')
    expect(ref.current).toHaveAttribute('dir', 'rtl')
    expect(ref.current).toHaveAttribute('data-styling-fix', 'false')
    expect(ref.current).toHaveAttribute('data-action-new-line', 'true')
    expect(ref.current).toHaveClass('custom')
    expect(screen.getByRole('button', { name: 'Undo' })).toBeVisible()
    expect(screen.getByRole('button', { name: 'Close' })).toBeVisible()
    expect(screen.queryByRole('status')).toBeNull()
    expect(screen.getByText('Saved')).toHaveAttribute('data-material-typography', 'bodyMedium')
  })

  it('ignores actionOnNewLine without an action and accepts all default overrides', () => {
    const { container } = render(<MaterialSnackbar actionOnNewLine stylingFix shape="8px" containerColor="red" contentColor="white" actionContentColor="yellow" dismissActionContentColor="blue" style={{ '--md-snackbar-max-width': '480px' }}>Saved</MaterialSnackbar>)
    const root = container.firstElementChild as HTMLElement
    expect(root).toHaveAttribute('data-action-new-line', 'false')
    expect(root).toHaveAttribute('data-styling-fix', 'true')
    for (const [name, value] of Object.entries({ shape: '8px', 'container-color': 'red', 'content-color': 'white', 'action-content-color': 'yellow', 'dismiss-content-color': 'blue', 'max-width': '480px' })) {
      expect(root.style.getPropertyValue(`--md-snackbar-${name}`)).toBe(value)
    }
  })

  it('measures multiline baselines again when the content changes', () => {
    let height = 40
    vi.spyOn(HTMLElement.prototype, 'getBoundingClientRect').mockImplementation(function (this: HTMLElement) {
      return { top: this.className === 'material-snackbar__baseline' ? 17 : 0, height: this.className === 'material-snackbar__text' ? height : 0 } as DOMRect
    })
    const original = window.getComputedStyle
    vi.spyOn(window, 'getComputedStyle').mockImplementation(element => {
      const styles = original(element)
      if (element.className === 'material-snackbar__text') Object.defineProperty(styles, 'lineHeight', { value: '20px' })
      return styles
    })
    const { container, rerender } = render(<MaterialSnackbar>Two lines</MaterialSnackbar>)
    const root = container.firstElementChild as HTMLElement
    expect(root).toHaveAttribute('data-multiline', 'true')
    expect(root.style.getPropertyValue('--_snackbar-first-baseline')).toBe('17px')
    expect(root.style.getPropertyValue('--_snackbar-below-last-baseline')).toBe('3px')
    height = 20
    rerender(<MaterialSnackbar>One line</MaterialSnackbar>)
    expect(root).toHaveAttribute('data-multiline', 'false')
  })

  it('pins source geometry, inverse colors, baseline typography, elevation and reduced-motion treatment', () => {
    const css = readFileSync('src/components/MaterialSnackbar.css', 'utf8')
    expect(MATERIAL_SNACKBAR_DEFAULTS).toMatchObject({ maxWidth: 600, singleLineHeight: 48, twoLineHeight: 68, horizontalSpacing: 16, buttonSideSpacing: 8, verticalPadding: 6, updatedVerticalPadding: 14, firstBaseline: 30, outerPadding: 12 })
    for (const token of ['inverse-surface', 'inverse-on-surface', 'inverse-primary', 'corner-extra-small', 'elevation-level3']) expect(css).toContain(`--md-sys-${token.startsWith('inverse') ? 'color-' : token.startsWith('corner') ? 'shape-' : ''}${token}`)
    expect(css).toContain('max-inline-size: calc(var(--_snackbar-max-width) + var(--_snackbar-start) + var(--_snackbar-end))')
    expect(css).toContain('--md-button-leading-space: 12px')
    expect(css).toContain('--md-button-pressed-shape: var(--md-button-resting-shape)')
    expect(css).toContain('--md-icon-button-focus-ring-color: var(--md-snackbar-dismiss-content-color')
    expect(css).toContain('prefers-reduced-motion: reduce')
    expect(css).toContain('forced-colors: active')
  })
})

describe('snackbar queue', () => {
  it('processes FIFO, defaults actions to indefinite, and completes each request once', async () => {
    const state = new MaterialSnackbarHostState(), listener = vi.fn()
    const unsubscribe = state.subscribe(listener)
    const first = state.showSnackbar('First'), firstData = state.currentSnackbarData!
    const second = state.showSnackbar({ message: 'Second', actionLabel: 'Undo' })
    expect(listener).toHaveBeenCalledTimes(1)
    expect(firstData.visuals.duration).toBe('short')
    firstData.dismiss()
    expect(await first).toBe('dismissed')
    expect(state.currentSnackbarData?.visuals).toMatchObject({ message: 'Second', duration: 'indefinite' })
    firstData.performAction()
    state.currentSnackbarData!.performAction()
    expect(await second).toBe('action-performed')
    expect(state.currentSnackbarData).toBeNull()
    expect(listener).toHaveBeenCalledTimes(3)
    unsubscribe()
    void state.showSnackbar('Third')
    expect(listener).toHaveBeenCalledTimes(3)
    state.currentSnackbarData!.dismiss()
  })

  it('cancels a queued request and an active request with AbortSignal', async () => {
    const state = new MaterialSnackbarHostState(), active = new AbortController(), queued = new AbortController()
    const first = state.showSnackbar('First', { signal: active.signal })
    const second = state.showSnackbar('Cancelled', { signal: queued.signal })
    const third = state.showSnackbar('Third')
    const secondRejected = expect(second).rejects.toMatchObject({ name: 'AbortError' })
    queued.abort(); await secondRejected
    expect(state.currentSnackbarData?.visuals.message).toBe('First')
    const firstRejected = expect(first).rejects.toMatchObject({ name: 'AbortError' })
    active.abort(); await firstRejected
    expect(state.currentSnackbarData?.visuals.message).toBe('Third')
    state.currentSnackbarData!.dismiss()
    expect(await third).toBe('dismissed')
    await expect(state.showSnackbar('Already cancelled', { signal: active.signal })).rejects.toMatchObject({ name: 'AbortError' })
    expect(state.currentSnackbarData).toBeNull()
  })
})

describe('snackbar host', () => {
  beforeEach(() => {
    vi.useFakeTimers()
    vi.stubGlobal('matchMedia', () => ({ matches: true, addEventListener: vi.fn(), removeEventListener: vi.fn() }))
  })

  it.each([['short', 4000], ['long', 10000]] as const)('dismisses %s at the AndroidX duration and starts the next timer on display', async (duration, ms) => {
    const state = new MaterialSnackbarHostState()
    render(<MaterialSnackbarHost hostState={state} />)
    const first = show(state, { message: 'First', duration }), second = show(state, 'Second')
    expect(screen.getByRole('status')).toHaveTextContent('First')
    act(() => { vi.advanceTimersByTime(ms - 1) })
    expect(state.currentSnackbarData?.visuals.message).toBe('First')
    act(() => { vi.advanceTimersByTime(1) })
    expect(await first).toBe('dismissed')
    expect(screen.getByRole('status')).toHaveTextContent('Second')
    expect(screen.queryByText('First')).toBeNull()
    act(() => { vi.advanceTimersByTime(4000) })
    expect(await second).toBe('dismissed')
    expect(screen.getByRole('status')).toBeEmptyDOMElement()
  })

  it('keeps action messages indefinite, preserves focus, and returns action and dismiss results', async () => {
    const state = new MaterialSnackbarHostState()
    render(<><button>Trigger</button><MaterialSnackbarHost hostState={state} dismissLabel="Close notice" /></>)
    const trigger = screen.getByRole('button', { name: 'Trigger' }); trigger.focus()
    const action = show(state, { message: 'Removed', actionLabel: 'Undo', withDismissAction: true })
    expect(trigger).toHaveFocus()
    act(() => { vi.advanceTimersByTime(100000) })
    fireEvent.click(screen.getByRole('button', { name: 'Undo' }))
    expect(await action).toBe('action-performed')
    const dismiss = show(state, { message: 'Removed', withDismissAction: true, duration: 'indefinite' })
    fireEvent.click(screen.getByRole('button', { name: 'Close notice' }))
    expect(await dismiss).toBe('dismissed')
  })

  it('pauses the remaining finite timeout during pointer hover and focus', async () => {
    const state = new MaterialSnackbarHostState()
    const { container } = render(<MaterialSnackbarHost hostState={state} />)
    const result = show(state, { message: 'Saved', actionLabel: 'Undo', duration: 'short' })
    const host = container.firstElementChild as HTMLElement
    act(() => { vi.advanceTimersByTime(1000) })
    fireEvent.pointerEnter(host)
    act(() => { vi.advanceTimersByTime(10000) })
    expect(state.currentSnackbarData).not.toBeNull()
    fireEvent.pointerLeave(host)
    const button = screen.getByRole('button', { name: 'Undo' })
    act(() => { button.focus() })
    act(() => { vi.advanceTimersByTime(10000) })
    expect(state.currentSnackbarData).not.toBeNull()
    act(() => { button.blur() })
    act(() => { vi.advanceTimersByTime(2999) })
    expect(state.currentSnackbarData).not.toBeNull()
    act(() => { vi.advanceTimersByTime(1) })
    expect(await result).toBe('dismissed')
  })

  it('supports recommended accessibility timeout, custom content, and local Escape dismissal', async () => {
    const state = new MaterialSnackbarHostState(), recommended = vi.fn(() => 12000)
    render(<MaterialSnackbarHost hostState={state} recommendedTimeoutMillis={recommended} snackbar={data => <MaterialSnackbar snackbarData={data} actionOnNewLine />} />)
    const result = show(state, { message: 'Saved', actionLabel: 'Undo', duration: 'short' })
    expect(recommended).toHaveBeenCalledWith(4000, true)
    act(() => { vi.advanceTimersByTime(11999) })
    expect(state.currentSnackbarData).not.toBeNull()
    fireEvent.keyDown(screen.getByRole('button', { name: 'Undo' }), { key: 'Escape' })
    expect(await result).toBe('dismissed')
  })

  it('can disable interaction pause and cleans up its timer on unmount', async () => {
    const state = new MaterialSnackbarHostState()
    const { container, unmount } = render(<MaterialSnackbarHost hostState={state} pauseOnInteraction={false} />)
    const result = show(state, 'Saved')
    fireEvent.pointerEnter(container.firstElementChild!)
    act(() => { vi.advanceTimersByTime(4000) })
    expect(await result).toBe('dismissed')
    const later = show(state, 'Later')
    unmount()
    act(() => { vi.advanceTimersByTime(20000) })
    expect(state.currentSnackbarData?.visuals.message).toBe('Later')
    state.currentSnackbarData!.dismiss()
    expect(await later).toBe('dismissed')
  })

  it('does not duplicate announcements or put exit content in the accessibility tree', () => {
    vi.stubGlobal('matchMedia', () => ({ matches: false, addEventListener: vi.fn(), removeEventListener: vi.fn() }))
    let frame: FrameRequestCallback | undefined
    vi.stubGlobal('requestAnimationFrame', vi.fn((callback: FrameRequestCallback) => { frame = callback; return 1 }))
    vi.stubGlobal('cancelAnimationFrame', vi.fn())
    const state = new MaterialSnackbarHostState()
    const { container } = render(<MaterialSnackbarHost hostState={state} />)
    void show(state, { message: 'First', actionLabel: 'Undo', withDismissAction: true })
    act(() => { frame?.(performance.now() + 1000) })
    void show(state, 'Second')
    fireEvent.click(screen.getByRole('button', { name: 'Dismiss' }))
    expect(screen.getAllByRole('status')).toHaveLength(1)
    expect(screen.getByRole('status')).toHaveTextContent('Second')
    const exiting = container.querySelector<HTMLElement>('[data-visible="false"]')!
    expect(exiting).toHaveAttribute('aria-hidden', 'true')
    expect(exiting.inert).toBe(true)
    expect(within(exiting).queryByRole('button')).toBeNull()
  })
})
