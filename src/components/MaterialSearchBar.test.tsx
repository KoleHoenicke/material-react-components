import { createRef, useState } from 'react'
import { act, fireEvent, render, renderHook, screen, within } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import {
  MaterialSearchBar, MaterialSearchBarInputField, MaterialDockedSearchBar, MaterialAppBarWithSearch,
  MaterialTopSearchBar, MaterialExpandedFullScreenSearchBar, MaterialExpandedFullScreenContainedSearchBar,
  MaterialExpandedDockedSearchBar, MaterialExpandedDockedSearchBarWithGap, useMaterialSearchBarState,
  useMaterialSearchBarScrollBehavior, getMaterialSearchBarColors, getMaterialContainedSearchBarColors,
  type MaterialExpandedSearchBarProps,
} from './MaterialSearchBar'
import type { MaterialTextFieldElement } from './MaterialTextField'

beforeEach(() => {
  vi.stubGlobal('matchMedia', vi.fn(() => ({ matches: true, addEventListener: vi.fn(), removeEventListener: vi.fn() })))
})
afterEach(() => { vi.restoreAllMocks(); vi.unstubAllGlobals(); vi.useRealTimers() })
function Example({ View = MaterialExpandedDockedSearchBar, onSearch, onDismissRequest, closeOnEscape = true }: {
  View?: (props: MaterialExpandedSearchBarProps) => React.ReactNode
  onSearch?: (value: string) => void
  onDismissRequest?: MaterialExpandedSearchBarProps['onDismissRequest']
  closeOnEscape?: boolean
}) {
  const state = useMaterialSearchBarState()
  const [query, setQuery] = useState('')
  const inputField = <MaterialSearchBarInputField state={state} value={query} onValueChange={setQuery} onSearch={onSearch} aria-label="Places" name="q" />
  return <form data-testid="form"><MaterialSearchBar state={state} inputField={inputField} />
    <View state={state} inputField={inputField} onDismissRequest={onDismissRequest} closeOnEscape={closeOnEscape} aria-label="Places suggestions"><button type="button" onClick={() => { setQuery('Park'); state.animateToCollapsed() }}>Park</button><button type="button" disabled>Unavailable</button></View>
  </form>
}
describe('AndroidX search family', () => {
  it('keeps a collapsed-only filter as an editable searchbox without announcing an absent popup', () => {
    const change = vi.fn(), search = vi.fn()
    render(<MaterialSearchBar inputField={<MaterialSearchBarInputField aria-label="Filter people" value="" onValueChange={change} onSearch={search} />} />)
    const input = screen.getByRole('searchbox', { name: 'Filter people' })
    fireEvent.click(input)
    fireEvent.change(input, { target: { value: 'Ada' } })
    expect(change).toHaveBeenCalledWith('Ada', expect.anything())
    expect(input).toHaveValue('')
    expect(input).not.toHaveAttribute('aria-expanded')
    expect(input).not.toHaveAttribute('aria-haspopup')
    fireEvent.keyDown(input, { key: 'Enter' })
    expect(search).toHaveBeenCalledWith('')
    expect(screen.queryByRole('dialog')).toBeNull()
  })
  it('retains keyboard focus without expanding, expands on Arrow Down, focuses suggestions, and restores focus on Escape', () => {
    const dismiss = vi.fn()
    render(<Example onDismissRequest={dismiss} />)
    const collapsed = screen.getByRole('combobox', { name: 'Places' })
    act(() => collapsed.focus())
    expect(collapsed).toHaveAttribute('aria-expanded', 'false')
    fireEvent.keyDown(collapsed, { key: 'ArrowDown' })
    const popup = screen.getByRole('dialog', { name: 'Places suggestions' })
    const editor = within(popup).getByRole('combobox', { name: 'Places' })
    expect(editor).toHaveFocus()
    expect(document.getElementById(editor.getAttribute('aria-controls')!)).toBe(popup)
    fireEvent.keyDown(editor, { key: 'ArrowDown' })
    const suggestion = within(popup).getByRole('button', { name: 'Park' })
    expect(suggestion).toHaveFocus()
    fireEvent.keyDown(suggestion, { key: 'Escape' })
    expect(dismiss).toHaveBeenCalledWith('escape')
    expect(screen.queryByRole('dialog')).toBeNull()
    expect(collapsed).toHaveFocus()
    expect(collapsed).toHaveAttribute('aria-expanded', 'false')
  })
  it('expands on touch and collapses without reopening when pointer focus is restored', () => {
    render(<Example />)
    const collapsed = screen.getByRole('combobox', { name: 'Places' })
    fireEvent.pointerDown(collapsed, { pointerType: 'touch' })
    act(() => collapsed.focus())
    const popup = screen.getByRole('dialog')
    fireEvent.click(within(popup).getByRole('button', { name: 'Park' }))
    expect(screen.queryByRole('dialog')).toBeNull()
    expect(collapsed).toHaveFocus()
    expect(collapsed).toHaveValue('Park')
  })
  it('expands when typing, preserves a controlled query, and submits once with Enter', () => {
    const search = vi.fn()
    render(<Example onSearch={search} />)
    fireEvent.change(screen.getByRole('combobox', { name: 'Places' }), { target: { value: 'Coffee' } })
    const popup = screen.getByRole('dialog')
    const editor = within(popup).getByRole('combobox', { name: 'Places' })
    expect(editor).toHaveValue('Coffee')
    fireEvent.keyDown(editor, { key: 'Enter' })
    expect(search).toHaveBeenCalledOnce()
    expect(search).toHaveBeenCalledWith('Coffee')
    expect(new FormData(screen.getByTestId('form') as HTMLFormElement).getAll('q')).toEqual(['Coffee'])
  })
  it('does not override a parent that rejects controlled expansion or query changes', () => {
    const changed = vi.fn(), queryChanged = vi.fn()
    function Controlled() {
      const state = useMaterialSearchBarState({ expanded: false, onExpandedChange: changed })
      return <MaterialSearchBar state={state} inputField={<MaterialSearchBarInputField value="Fixed" onValueChange={queryChanged} aria-label="Controlled" />} />
    }
    render(<Controlled />)
    const input = screen.getByRole('combobox')
    fireEvent.keyDown(input, { key: 'ArrowDown' })
    expect(changed).toHaveBeenCalledWith(true)
    expect(input).toHaveAttribute('aria-expanded', 'false')
    fireEvent.change(input, { target: { value: 'Changed' } })
    expect(queryChanged).toHaveBeenCalledWith('Changed', expect.anything())
    expect(input).toHaveValue('Fixed')
  })
  it('commits composition once and ignores search or expansion keys while composing', () => {
    const change = vi.fn(), search = vi.fn(), expansion = vi.fn()
    render(<MaterialSearchBarInputField aria-label="Compose" defaultValue="" onValueChange={change} onSearch={search} expanded={false} onExpandedChange={expansion} />)
    const input = screen.getByRole('combobox')
    fireEvent.keyDown(input, { key: 'ArrowDown' })
    expect(expansion).toHaveBeenCalledWith(true)
    expansion.mockClear()
    fireEvent.compositionStart(input)
    fireEvent.change(input, { target: { value: '検索' } })
    fireEvent.keyDown(input, { key: 'Enter' })
    fireEvent.keyDown(input, { key: 'Enter', isComposing: true })
    fireEvent.keyDown(input, { key: 'ArrowDown', isComposing: true })
    expect(change).not.toHaveBeenCalled()
    expect(search).not.toHaveBeenCalled()
    expect(expansion).not.toHaveBeenCalled()
    fireEvent.compositionEnd(input, { data: '検索', target: { value: '検索' } })
    expect(change).toHaveBeenCalledOnce()
    expect(expansion).toHaveBeenCalledWith(true)
  })
  it('keeps disabled input inert, readonly input focusable, slots, refs, and formatted raw query semantics', () => {
    const change = vi.fn(), expansion = vi.fn(), search = vi.fn()
    const ref = createRef<MaterialTextFieldElement>()
    const { rerender } = render(<MaterialSearchBarInputField ref={ref} aria-label="Query" disabled defaultValue="12" onValueChange={change} onSearch={search} onExpandedChange={expansion} expanded={false} />)
    expect(screen.getByRole('combobox')).toBeDisabled()
    fireEvent.click(screen.getByRole('combobox'))
    expect(expansion).not.toHaveBeenCalled()
    rerender(<MaterialSearchBarInputField ref={ref} aria-label="Query" readOnly defaultValue="12" leadingIcon={<span>Icon</span>} prefix="in:" suffix="Books" />)
    const input = screen.getByRole('searchbox')
    expect(ref.current).toBe(input)
    act(() => input.focus())
    expect(input).toHaveFocus()
    expect(input).toHaveAttribute('readonly')
    expect(screen.getByText('in:')).toBeVisible()
    expect(screen.getByText('Books')).toBeVisible()
    rerender(<MaterialSearchBarInputField aria-label="Query" value="12" onValueChange={change} onSearch={search} inputTransformation={v => /^\d*$/.test(v) ? v : null} outputTransformation={v => v.toUpperCase()} />)
    fireEvent.change(input, { target: { value: '12x' } })
    expect(change).not.toHaveBeenCalled()
    fireEvent.keyDown(input, { key: 'Enter' })
    expect(search).toHaveBeenCalledWith('12')
  })
  it('updates rich placeholder visibility for uncontrolled input', () => {
    render(<MaterialSearchBarInputField aria-label="Query" placeholder={<b>Find places</b>} />)
    expect(screen.getByText('Find places').closest('[data-visible]')).toHaveAttribute('data-visible', 'true')
    fireEvent.change(screen.getByRole('searchbox'), { target: { value: 'Park' } })
    expect(screen.getByText('Find places').closest('[data-visible]')).toHaveAttribute('data-visible', 'false')
  })
  it.each([
    [MaterialExpandedFullScreenSearchBar, 'full-screen', true],
    [MaterialExpandedFullScreenContainedSearchBar, 'contained', false],
    [MaterialExpandedDockedSearchBar, 'docked', true],
    [MaterialExpandedDockedSearchBarWithGap, 'docked-with-gap', false],
  ] as const)('renders %s with its native divider treatment and dismisses', (View, presentation, divider) => {
    const { container } = render(<Example View={View} />)
    fireEvent.click(screen.getByRole('combobox'))
    const dialog = screen.getByRole('dialog')
    expect(dialog).toHaveAttribute('data-presentation', presentation)
    expect(!!dialog.querySelector('.material-search-overlay__divider')).toBe(divider)
    expect(container.querySelector('[data-material-search-bar]')).toHaveAttribute('inert')
    fireEvent.keyDown(within(dialog).getByRole('combobox'), { key: 'Escape' })
    expect(screen.queryByRole('dialog')).toBeNull()
  })
  it('respects escape policy and pointer-origin outside dismissal for docked search', () => {
    const dismiss = vi.fn()
    render(<Example closeOnEscape={false} onDismissRequest={dismiss} />)
    fireEvent.click(screen.getByRole('combobox'))
    const dialog = screen.getByRole('dialog')
    fireEvent.keyDown(within(dialog).getByRole('combobox'), { key: 'Escape' })
    expect(dialog).toHaveAttribute('open')
    expect(dismiss).not.toHaveBeenCalled()
    fireEvent.pointerDown(within(dialog).getByRole('button', { name: 'Park' }))
    fireEvent.click(dialog)
    expect(dialog).toHaveAttribute('open')
    fireEvent.pointerDown(dialog)
    fireEvent.click(dialog)
    expect(dismiss).toHaveBeenCalledWith('outside')
    expect(screen.queryByRole('dialog')).toBeNull()
  })
  it('exposes state operations, reduced-motion snapping, and controlled callbacks', () => {
    const { result } = renderHook(() => useMaterialSearchBarState())
    expect(result.current.currentValue).toBe('collapsed')
    act(() => result.current.animateToExpanded())
    expect(result.current.progress).toBe(1)
    expect(result.current.currentValue).toBe('expanded')
    expect(result.current.isAnimating).toBe(false)
    act(() => result.current.snapTo('collapsed'))
    expect(result.current.progress).toBe(0)
  })
  it('handles both integrated forms and app-bar slots without adding application icons', () => {
    function Legacy() {
      const [expanded, setExpanded] = useState(false)
      const state = useMaterialSearchBarState()
      return <><MaterialDockedSearchBar expanded={expanded} onExpandedChange={setExpanded} inputField={<MaterialSearchBarInputField aria-label="Legacy" />}><button>Result</button></MaterialDockedSearchBar>
        <MaterialAppBarWithSearch state={state} inputField={<MaterialSearchBarInputField aria-label="App" />} navigationIcon={<button>Navigation</button>} actions={<button>Action</button>} />
        <MaterialTopSearchBar state={state} inputField={<MaterialSearchBarInputField aria-label="Top" />} /></>
    }
    render(<Legacy />)
    fireEvent.click(screen.getByRole('combobox', { name: 'Legacy' }))
    expect(screen.getByRole('dialog', { name: 'Search suggestions' })).toBeVisible()
    expect(screen.getByRole('button', { name: 'Navigation' })).toBeVisible()
    expect(screen.getByRole('button', { name: 'Action' })).toBeVisible()
    fireEvent.keyDown(screen.getByRole('combobox', { name: 'Legacy' }), { key: 'Escape' })
    expect(screen.queryByRole('dialog')).toBeNull()
  })
  it('forwards expanded dialog attributes and keeps elevation on the owning app bar', () => {
    function Surfaces() {
      const state = useMaterialSearchBarState({ defaultExpanded: true })
      return <><MaterialAppBarWithSearch data-testid="app" state={state} shadowElevation={3} inputField={<MaterialSearchBarInputField aria-label="App" />} />
        <MaterialExpandedFullScreenSearchBar state={state} inputField={<MaterialSearchBarInputField aria-label="App" />} aria-describedby="search-help" data-testid="expanded"><p id="search-help">Find library books</p></MaterialExpandedFullScreenSearchBar></>
    }
    render(<Surfaces />)
    expect(screen.getByRole('dialog')).toHaveAccessibleDescription('Find library books')
    expect(screen.getByTestId('expanded')).toBe(screen.getByRole('dialog'))
    const app = screen.getByTestId('app')
    expect(app.style.getPropertyValue('--md-search-elevation')).toBe('var(--md-sys-elevation-level3)')
    expect((app.querySelector('[data-material-search-bar]') as HTMLElement).style.getPropertyValue('--md-search-elevation')).toBe('var(--md-sys-elevation-level0)')
  })
  it('follows on-surface leading icons, transparent input containers and contained surface tones', () => {
    const colors = getMaterialSearchBarColors()
    expect(colors.inputFieldColors?.focusedLeadingIconColor).toBe('var(--md-sys-color-on-surface)')
    expect(colors.inputFieldColors?.focusedContainerColor).toBe('transparent')
    expect(colors.inputFieldColors?.disabledTextColor).toContain('38%')
    const contained = getMaterialContainedSearchBarColors(true)
    expect(contained.containerColor).toBe('var(--md-sys-color-surface-container-low)')
    expect(contained.inputFieldColors?.focusedContainerColor).toBe('var(--md-sys-color-surface-container-high)')
  })
  it('hides on upward scroll, reveals on downward scroll, and settles using its own scroll container', () => {
    vi.useFakeTimers()
    const target = document.createElement('div')
    const scrollTargetRef = { current: target }
    const { result, unmount } = renderHook(() => useMaterialSearchBarScrollBehavior({ scrollTargetRef }))
    act(() => { target.scrollTop = 40; target.dispatchEvent(new Event('scroll')) })
    expect(result.current.offset).toBe(-40)
    expect(result.current.scrolled).toBe(true)
    act(() => { target.scrollTop = 20; target.dispatchEvent(new Event('scroll')) })
    expect(result.current.offset).toBe(-20)
    act(() => vi.advanceTimersByTime(150))
    expect(result.current.offset).toBe(0)
    expect(result.current.settling).toBe(true)
    unmount()
  })
})
