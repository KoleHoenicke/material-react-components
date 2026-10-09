/* Adapted from AndroidX Material3 SearchBar.kt at a4a053382fb3deb290b7823590fa8cbc2f59048c.
 * Copyright 2022-2026 The Android Open Source Project. Apache-2.0. See docs/search.md. */
import {
  createContext, forwardRef, useCallback, useContext, useEffect, useId, useLayoutEffect, useRef, useState,
  type CSSProperties, type DialogHTMLAttributes, type HTMLAttributes, type ReactNode, type RefObject,
} from 'react'
import { MaterialTextField, type MaterialTextFieldElement, type MaterialTextFieldProps } from './MaterialTextField'
import { getMaterialSearchBarColors, getMaterialContainedSearchBarColors, getMaterialSearchBarInputFieldColors,
  getMaterialAppBarWithSearchColors, type MaterialSearchBarColors, type MaterialAppBarWithSearchColors } from './MaterialSearchBarDefaults'
import { useSearchBarAnimation, type MaterialSearchBarMotion } from '../internal/useSearchBarAnimation'
import { searchGeometry, type SearchBounds, type SearchPresentation } from '../internal/searchGeometry'
import { MATERIAL_APP_BAR_TIMING } from '../theme/materialMotion'
import './MaterialSearchBar.css'
export * from './MaterialSearchBarDefaults'
export type { MaterialSearchBarMotion }
export type MaterialSearchBarStyle = CSSProperties & { [key: `--md-search-${string}`]: string | number | undefined }
export type MaterialSearchBarValue = 'collapsed' | 'expanded'
export type MaterialSearchBarStateOptions = {
  expanded?: boolean
  defaultExpanded?: boolean
  onExpandedChange?: (expanded: boolean) => void
  motion?: MaterialSearchBarMotion
}
export interface MaterialSearchBarState {
  expanded: boolean
  progress: number
  contentProgress: number
  isAnimating: boolean
  currentValue: MaterialSearchBarValue
  targetValue: MaterialSearchBarValue
  inputModeRef: RefObject<'pointer' | 'keyboard'>
  resultsId: string
  anchorRef: RefObject<HTMLDivElement | null>
  panelRef: RefObject<HTMLDivElement | null>
  setExpanded: (expanded: boolean) => void
  animateToExpanded: () => void
  animateToCollapsed: () => void
  snapTo: (value: MaterialSearchBarValue) => void
  /** Internal registration lets a collapsed-only bar stay usable without a results view. */
  hasOverlay: boolean
  registerOverlay: (mounted: boolean) => void
}
export function useMaterialSearchBarState({ expanded: controlled, defaultExpanded = false, onExpandedChange, motion = 'standard' }: MaterialSearchBarStateOptions = {}): MaterialSearchBarState {
  const [local, setLocal] = useState(defaultExpanded)
  const [snapVersion, setSnapVersion] = useState(0)
  const [hasOverlay, registerOverlay] = useState(false)
  const expanded = controlled ?? local
  const anchorRef = useRef<HTMLDivElement>(null)
  const panelRef = useRef<HTMLDivElement>(null)
  const inputModeRef = useRef<'pointer' | 'keyboard'>('keyboard')
  const resultsId = useId()
  const latest = useRef({ controlled, onExpandedChange, expanded })
  latest.current = { controlled, onExpandedChange, expanded }
  const setExpanded = useCallback((next: boolean) => {
    if (next === latest.current.expanded) return
    if (latest.current.controlled === undefined) setLocal(next)
    latest.current.onExpandedChange?.(next)
  }, [])
  const animateToExpanded = useCallback(() => setExpanded(true), [setExpanded])
  const animateToCollapsed = useCallback(() => setExpanded(false), [setExpanded])
  const snapTo = useCallback((value: MaterialSearchBarValue) => { setSnapVersion(v => v + 1); setExpanded(value === 'expanded') }, [setExpanded])
  const animation = useSearchBarAnimation(expanded, motion, anchorRef, snapVersion)
  return { expanded, ...animation, currentValue: expanded || animation.progress > 0 ? 'expanded' : 'collapsed', targetValue: expanded ? 'expanded' : 'collapsed',
    inputModeRef, resultsId, anchorRef, panelRef, setExpanded, animateToExpanded, animateToCollapsed, snapTo, hasOverlay, registerOverlay }
}
export function useMaterialContainedSearchBarState(options: Omit<MaterialSearchBarStateOptions, 'motion'> = {}) {
  return useMaterialSearchBarState({ ...options, motion: 'contained' })
}
export function useMaterialSearchBarWithGapState(options: Omit<MaterialSearchBarStateOptions, 'motion'> = {}) {
  return useMaterialSearchBarState({ ...options, motion: 'docked-with-gap' })
}
const classes = (...values: (string | undefined | false)[]) => values.filter(Boolean).join(' ')
const dimension = (value: number | string | undefined) => typeof value === 'number' ? `${value}px` : value
const SearchContext = createContext<{ state: MaterialSearchBarState; colors?: MaterialSearchBarColors; collapsed?: boolean; staticInput?: boolean; onDismiss?: (reason: 'escape') => void } | null>(null)
export type MaterialSearchBarInputFieldProps = Omit<MaterialTextFieldProps,
  'variant' | 'colorMode' | 'label' | 'labelPosition' | 'alwaysMinimizeLabel' | 'supportingText' | 'isError' | 'errorMessage' | 'type' | 'container' | 'style' | 'onKeyboardAction' | 'placeholder'> & {
  state?: MaterialSearchBarState
  expanded?: boolean
  onExpandedChange?: (expanded: boolean) => void
  onSearch?: (query: string) => void
  placeholder?: ReactNode
  style?: MaterialSearchBarStyle
}
/** Search's input decorator uses TextField's editing, composition and caret-mapping implementation. */
export const MaterialSearchBarInputField = forwardRef<MaterialTextFieldElement, MaterialSearchBarInputFieldProps>(function MaterialSearchBarInputField({
  state: provided, expanded: providedExpanded, onExpandedChange, onSearch, onKeyDown, onValueChange, onFocus,
  className, containerProps, style, colors, placeholder, name, ...props
}, ref) {
  const context = useContext(SearchContext)
  const state = provided ?? (context?.staticInput ? undefined : context?.state)
  const expanded = state?.expanded ?? providedExpanded ?? false
  const localInputMode = useRef<'pointer' | 'keyboard'>('keyboard')
  const inputMode = state?.inputModeRef ?? localInputMode
  const [keyboardFocus, setKeyboardFocus] = useState(inputMode.current === 'keyboard')
  const [uncontrolledRaw, setUncontrolledRaw] = useState(props.defaultValue ?? '')
  const composing = useRef(false)
  const raw = useRef(props.value ?? uncontrolledRaw)
  if (props.value !== undefined) raw.current = props.value
  const expand = () => { if (!props.disabled && !expanded) { if (state) state.setExpanded(true); else onExpandedChange?.(true) } }
  const collapse = () => { if (state) state.setExpanded(false); else onExpandedChange?.(false) }
  return <MaterialTextField {...props} ref={ref} type="search" singleLine={props.singleLine ?? true} enterKeyHint={props.enterKeyHint ?? 'search'}
    role={state || providedExpanded !== undefined ? 'combobox' : props.role}
    aria-label={props['aria-label'] ?? (props['aria-labelledby'] ? undefined : 'Search')}
    aria-expanded={state || providedExpanded !== undefined ? expanded : undefined}
    aria-haspopup={state ? 'dialog' : undefined} aria-controls={state?.hasOverlay || expanded ? state?.resultsId : props['aria-controls']}
    aria-autocomplete={state ? 'list' : props['aria-autocomplete']}
    name={context?.collapsed && state?.hasOverlay && state.currentValue === 'expanded' ? undefined : name}
    placeholder={typeof placeholder === 'string' ? placeholder : undefined}
    colors={getMaterialSearchBarInputFieldColors({ ...context?.colors?.inputFieldColors, ...colors })}
    shape={props.shape ?? 'var(--md-sys-shape-corner-full)'}
    className={classes('material-search-input', className)} style={{ ...style }}
    containerProps={{ ...containerProps, ...{ 'data-search-keyboard': keyboardFocus },
      onPointerDownCapture: event => { containerProps?.onPointerDownCapture?.(event); if (!event.defaultPrevented) { inputMode.current = 'pointer'; setKeyboardFocus(false) } },
      onKeyDownCapture: event => { containerProps?.onKeyDownCapture?.(event); inputMode.current = 'keyboard'; setKeyboardFocus(true) },
      onClick: event => {
        containerProps?.onClick?.(event)
        if (!event.defaultPrevented && !(event.target as HTMLElement).closest('button, a')) expand()
      },
    }}
    onCompositionStart={event => { composing.current = true; props.onCompositionStart?.(event) }}
    onCompositionEnd={event => { composing.current = false; props.onCompositionEnd?.(event) }}
    onFocus={event => { setKeyboardFocus(inputMode.current === 'keyboard'); onFocus?.(event); if (!event.defaultPrevented && inputMode.current === 'pointer' && !state?.anchorRef.current?.dataset.restoringFocus) expand() }}
    onValueChange={(value, event) => { const previousLength = raw.current.length; raw.current = value; setUncontrolledRaw(value); onValueChange?.(value, event); if (value.length > previousLength) expand() }}
    onKeyDown={event => {
      onKeyDown?.(event)
      if (props.disabled || event.defaultPrevented || event.nativeEvent.isComposing || composing.current || event.keyCode === 229) return
      if (event.key === 'ArrowDown' && (state || providedExpanded !== undefined)) {
        event.preventDefault()
        if (!expanded) expand()
        else (state?.panelRef.current ?? (props['aria-controls'] ? document.getElementById(props['aria-controls']) : null))?.querySelector<HTMLElement>('button:not(:disabled), a[href], input:not(:disabled), [tabindex="0"]')?.focus()
      } else if (event.key === 'Escape' && expanded) { event.preventDefault(); if (context?.onDismiss) context.onDismiss('escape'); else collapse() }
      else if (event.key === 'Enter' && (props.singleLine ?? true)) { event.preventDefault(); onSearch?.(raw.current) }
    }}
    container={placeholder != null && typeof placeholder !== 'string' ? <span className="material-search-input__placeholder" data-visible={raw.current.length === 0}>{placeholder}</span> : undefined}
  />
})

type SurfaceProps = Omit<HTMLAttributes<HTMLDivElement>, 'children' | 'style' | 'color'> & {
  inputField: ReactNode
  colors?: MaterialSearchBarColors
  shape?: number | string
  tonalElevation?: number
  shadowElevation?: number
  style?: MaterialSearchBarStyle
}
export type MaterialSearchBarProps = SurfaceProps & MaterialSearchBarStateOptions & {
  state?: MaterialSearchBarState
  /** Supplying results without a state uses the legacy integrated full-screen form. */
  children?: ReactNode
}
function surfaceStyle(colors: MaterialSearchBarColors | undefined, shape: number | string | undefined, tonalElevation: number, shadowElevation: number, style?: MaterialSearchBarStyle): MaterialSearchBarStyle {
  const palette = getMaterialSearchBarColors(colors)
  return { '--md-search-container-color': palette.containerColor, '--md-search-divider-color': palette.dividerColor,
    '--md-search-shape': dimension(shape), '--md-search-elevation': `var(--md-sys-elevation-level${Math.max(0, Math.min(5, Math.round(shadowElevation)))})`,
    // As in Surface, tint only applies when the caller explicitly supplies the surface role.
    ...(tonalElevation > 0 && palette.containerColor === 'var(--md-sys-color-surface)' ? {
      '--md-search-container-color': `color-mix(in srgb, var(--md-sys-color-primary) ${(4.5 * Math.log(tonalElevation + 1) + 2).toFixed(3)}%, var(--md-sys-color-surface))`,
    } : {}), ...style }
}
export const MaterialSearchBar = forwardRef<HTMLDivElement, MaterialSearchBarProps>(function MaterialSearchBar({
  state: suppliedState, expanded, defaultExpanded, onExpandedChange, motion, children,
  inputField, colors, shape, tonalElevation = 0, shadowElevation = 0, className, style, ...props
}, ref) {
  const localState = useMaterialSearchBarState({ expanded, defaultExpanded, onExpandedChange, motion: motion ?? 'legacy' })
  const state = suppliedState ?? localState
  const hidden = state.hasOverlay && state.currentValue === 'expanded'
  return <>
    <SearchContext.Provider value={{ state, colors, collapsed: true, staticInput: !suppliedState && children == null }}>
      <div {...props} className={classes('material-search-bar', className)} style={surfaceStyle(colors, shape, tonalElevation, shadowElevation, style)}
        data-material-search-bar="" data-overlay-active={hidden} aria-hidden={hidden || undefined}
        ref={node => { state.anchorRef.current = node; node?.toggleAttribute('inert', hidden); if (typeof ref === 'function') ref(node); else if (ref) ref.current = node }}>
        {inputField}
      </div>
    </SearchContext.Provider>
    {!suppliedState && children != null && <MaterialExpandedFullScreenSearchBar state={state} inputField={inputField} colors={colors} tonalElevation={tonalElevation} shadowElevation={shadowElevation} collapsedShape={shape}>{children}</MaterialExpandedFullScreenSearchBar>}
  </>
})

export type MaterialExpandedSearchBarProps = Omit<DialogHTMLAttributes<HTMLDialogElement>, 'id' | 'children' | 'style' | 'open' | 'onCancel' | 'onClose'> &
  Pick<SurfaceProps, 'inputField' | 'colors' | 'shape' | 'tonalElevation' | 'shadowElevation' | 'style'> & {
  state: MaterialSearchBarState
  children: ReactNode
  'aria-label'?: string
  collapsedShape?: number | string
  dropdownShape?: number | string
  dropdownGapSize?: number
  dropdownScrimColor?: string
  safeAreaInsets?: boolean
  closeOnEscape?: boolean
  closeOnOutsideClick?: boolean
  onDismissRequest?: (reason: 'escape' | 'outside' | 'close') => void
}
function boundsStyle(bounds: SearchBounds): CSSProperties { return { left: bounds.left, top: bounds.top, width: bounds.width, height: bounds.height } }
function ExpandedSearchBar({
  state, inputField, children, colors: suppliedColors, collapsedShape, shape, dropdownShape, dropdownGapSize = 2,
  dropdownScrimColor, safeAreaInsets = true, closeOnEscape = true, closeOnOutsideClick = true, onDismissRequest,
  tonalElevation = 0, shadowElevation = 0, style, className, presentation, dir, 'aria-label': ariaLabel = 'Search', onKeyDown, onClick, onPointerDown, ...props
}: MaterialExpandedSearchBarProps & { presentation: SearchPresentation }) {
  const full = presentation === 'full-screen' || presentation === 'contained'
  const contained = presentation === 'contained'
  const gap = presentation === 'docked-with-gap'
  const colors = contained ? getMaterialContainedSearchBarColors(true, suppliedColors) : getMaterialSearchBarColors(suppliedColors)
  const dialogRef = useRef<HTMLDialogElement>(null)
  const contentRef = useRef<HTMLDivElement>(null)
  const safeRef = useRef<HTMLSpanElement>(null)
  const previousFocus = useRef<HTMLElement | null>(null)
  const backdropDown = useRef(false)
  const latest = useRef({ state, onDismissRequest, closeOnEscape, closeOnOutsideClick })
  latest.current = { state, onDismissRequest, closeOnEscape, closeOnOutsideClick }
  const active = state.expanded || state.progress > 0 || state.isAnimating
  const [measurement, setMeasurement] = useState({ anchor: { left: 0, top: 0, width: 360, height: 56 }, viewport: { left: 0, top: 0, width: 360, height: 640 }, contentHeight: 0, topInset: 0, bottomInset: 0 })
  useEffect(() => { state.registerOverlay(true); return () => state.registerOverlay(false) }, [state.registerOverlay])
  const dismiss = (reason: 'escape' | 'outside' | 'close') => {
    latest.current.onDismissRequest?.(reason)
    latest.current.state.animateToCollapsed()
  }
  useLayoutEffect(() => {
    if (!active) return
    const measure = () => {
      const anchor = state.anchorRef.current?.getBoundingClientRect()
      const viewport = window.visualViewport
      const safe = safeRef.current ? getComputedStyle(safeRef.current) : null
      setMeasurement({ anchor: anchor && anchor.width ? { left: anchor.left, top: anchor.top, width: anchor.width, height: anchor.height } : { left: 0, top: 0, width: Math.min(window.innerWidth, 360), height: 56 },
        viewport: { left: viewport?.offsetLeft ?? 0, top: viewport?.offsetTop ?? 0, width: viewport?.width ?? window.innerWidth, height: viewport?.height ?? window.innerHeight },
        contentHeight: contentRef.current?.scrollHeight ?? 0, topInset: safeAreaInsets ? parseFloat(safe?.paddingTop ?? '0') || 0 : 0,
        bottomInset: safeAreaInsets ? parseFloat(safe?.paddingBottom ?? '0') || 0 : 0 })
    }
    measure()
    const observer = new ResizeObserver(measure)
    if (state.anchorRef.current) observer.observe(state.anchorRef.current)
    if (contentRef.current) observer.observe(contentRef.current)
    window.addEventListener('resize', measure)
    window.addEventListener('scroll', measure, true)
    window.visualViewport?.addEventListener('resize', measure)
    window.visualViewport?.addEventListener('scroll', measure)
    return () => { observer.disconnect(); window.removeEventListener('resize', measure); window.removeEventListener('scroll', measure, true); window.visualViewport?.removeEventListener('resize', measure); window.visualViewport?.removeEventListener('scroll', measure) }
  }, [active, safeAreaInsets, state.anchorRef])
  useLayoutEffect(() => {
    const dialog = dialogRef.current
    if (!dialog) return
    if (active && !dialog.open) {
      previousFocus.current = document.activeElement instanceof HTMLElement ? document.activeElement : null
      if (typeof dialog.showModal === 'function') dialog.showModal(); else dialog.setAttribute('open', '')
      const input = dialog.querySelector<HTMLInputElement | HTMLTextAreaElement>('input:not(:disabled):not([type="hidden"]), textarea:not(:disabled)')
      const origin = previousFocus.current
      input?.focus({ preventScroll: true })
      if ((origin instanceof HTMLInputElement || origin instanceof HTMLTextAreaElement) && input) input.setSelectionRange(origin.selectionStart, origin.selectionEnd)
    } else if (!active && dialog.open) {
      const anchor = latest.current.state.anchorRef.current
      if (anchor) anchor.dataset.restoringFocus = 'true'
      const focusWasInside = dialog.contains(document.activeElement) || document.activeElement === document.body
      if (typeof dialog.close === 'function') dialog.close(); else dialog.removeAttribute('open')
      if (focusWasInside && previousFocus.current?.isConnected) previousFocus.current.focus({ preventScroll: true })
      if (anchor) delete anchor.dataset.restoringFocus
    }
  }, [active])
  useEffect(() => {
    if (!active || !full) return
    const overflow = document.documentElement.style.overflow
    document.documentElement.style.overflow = 'hidden'
    return () => { document.documentElement.style.overflow = overflow }
  }, [active, full])
  const { surface, input, content, radius } = searchGeometry(measurement.anchor, measurement.viewport, state.progress, presentation, measurement.contentHeight, measurement.topInset, measurement.bottomInset, dropdownGapSize)
  const geometryShape = full ? collapsedShape == null || collapsedShape === 'var(--md-sys-shape-corner-full)' ? `${radius}px` : state.progress < 0.5 ? dimension(collapsedShape) : '0px' : dimension(shape) ?? 'var(--md-sys-shape-corner-extra-large)'
  const pointerDown = (event: React.PointerEvent<HTMLDialogElement>) => { backdropDown.current = !(event.target as HTMLElement).closest('[data-search-interactive]') }
  return <dialog {...props} id={state.resultsId} ref={dialogRef} className={classes('material-search-overlay', className)} aria-label={ariaLabel} data-presentation={presentation}
    dir={dir} data-safe-area={safeAreaInsets} data-expanded={state.expanded} data-progress={state.progress} data-animating={state.isAnimating}
    style={{ ...surfaceStyle(colors, undefined, tonalElevation, shadowElevation, style), '--md-search-scrim-color': dropdownScrimColor } as MaterialSearchBarStyle}
    onCancel={event => { event.preventDefault(); if (latest.current.closeOnEscape) dismiss('escape') }}
    onClose={() => { if (latest.current.state.expanded) dismiss('close') }}
    onPointerDown={event => { onPointerDown?.(event); if (!event.defaultPrevented) pointerDown(event) }}
    onClick={event => { onClick?.(event); if (!event.defaultPrevented && backdropDown.current && !(event.target as HTMLElement).closest('[data-search-interactive]') && closeOnOutsideClick && !full) dismiss('outside'); backdropDown.current = false }}
    onKeyDown={event => {
      onKeyDown?.(event)
      if (!event.defaultPrevented && event.key === 'Escape') { event.preventDefault(); if (closeOnEscape) dismiss('escape') }
    }}>
    <span ref={safeRef} className="material-search-overlay__safe-area" aria-hidden="true" />
    <SearchContext.Provider value={{ state, colors, onDismiss: reason => { if (closeOnEscape) dismiss(reason) } }}>
      <div className="material-search-overlay__surface" data-search-interactive="" aria-hidden="true"
        style={{ ...boundsStyle(surface), borderRadius: geometryShape, opacity: contained ? state.progress : 1, background: gap ? 'transparent' : undefined }} />
      <div className="material-search-overlay__input" data-search-interactive=""
        style={{ ...boundsStyle(input), borderRadius: contained ? dimension(collapsedShape) ?? 'var(--md-sys-shape-corner-full)' : gap ? geometryShape : full ? undefined : `${geometryShape} ${geometryShape} 0 0`, background: gap ? 'var(--md-search-container-color)' : undefined }}>
        {inputField}
      </div>
      <div ref={node => { state.panelRef.current = node }} className="material-search-overlay__results" data-search-interactive=""
        style={{ ...boundsStyle(content), opacity: presentation === 'docked' ? 1 : state.contentProgress, borderRadius: gap ? dimension(dropdownShape) ?? '12px' : full ? undefined : `0 0 ${geometryShape} ${geometryShape}`, background: gap ? 'var(--md-search-container-color)' : undefined }}>
        {!contained && !gap && <div className="material-search-overlay__divider" aria-hidden="true" />}
        <div ref={contentRef} className="material-search-overlay__content" style={{ transform: gap ? `translateY(${-content.height / 2 * (1 - state.progress)}px)` : undefined }}>{children}</div>
      </div>
    </SearchContext.Provider>
  </dialog>
}
export function MaterialExpandedFullScreenSearchBar(props: MaterialExpandedSearchBarProps) { return <ExpandedSearchBar {...props} presentation="full-screen" /> }
export function MaterialExpandedFullScreenContainedSearchBar(props: MaterialExpandedSearchBarProps) { return <ExpandedSearchBar {...props} presentation="contained" /> }
export function MaterialExpandedDockedSearchBar(props: MaterialExpandedSearchBarProps) { return <ExpandedSearchBar {...props} presentation="docked" /> }
export function MaterialExpandedDockedSearchBarWithGap(props: MaterialExpandedSearchBarProps) { return <ExpandedSearchBar {...props} presentation="docked-with-gap" /> }

export type MaterialDockedSearchBarProps = SurfaceProps & Omit<MaterialSearchBarStateOptions, 'motion'> & { children: ReactNode }
/** Legacy integrated docked search expands in document layout, just as Compose's deprecated form. */
export const MaterialDockedSearchBar = forwardRef<HTMLDivElement, MaterialDockedSearchBarProps>(function MaterialDockedSearchBar({
  inputField, children, expanded, defaultExpanded, onExpandedChange, colors, shape = 'var(--md-sys-shape-corner-extra-large)',
  tonalElevation = 0, shadowElevation = 0, style, className, ...props
}, ref) {
  const state = useMaterialSearchBarState({ expanded, defaultExpanded, onExpandedChange, motion: 'legacy' })
  const contentRef = useRef<HTMLDivElement>(null)
  const [height, setHeight] = useState(240)
  useLayoutEffect(() => {
    const measure = () => setHeight(Math.min(window.innerHeight * 2 / 3, Math.max(240, contentRef.current?.scrollHeight ?? 0)))
    measure()
    const observer = new ResizeObserver(measure)
    if (contentRef.current) observer.observe(contentRef.current)
    window.addEventListener('resize', measure)
    return () => { observer.disconnect(); window.removeEventListener('resize', measure) }
  }, [])
  return <SearchContext.Provider value={{ state, colors }}>
    <div {...props} ref={ref} className={classes('material-search-bar', 'material-search-bar--legacy-docked', className)} style={surfaceStyle(colors, shape, tonalElevation, shadowElevation, style)}>
      {inputField}
      <div id={state.resultsId} role="dialog" aria-label="Search suggestions" ref={node => { state.panelRef.current = node; node?.toggleAttribute('inert', !state.expanded) }} hidden={state.currentValue === 'collapsed'}
        className="material-search-bar__inline-results" style={{ height: height * state.progress, opacity: state.progress }}>
        <div className="material-search-overlay__divider" aria-hidden="true" />
        <div ref={contentRef}>{children}</div>
      </div>
    </div>
  </SearchContext.Provider>
})

export type MaterialSearchBarScrollBehaviorOptions = {
  scrollTargetRef?: RefObject<HTMLElement | null>
  canScroll?: boolean
  reverseLayout?: boolean
}
export function useMaterialSearchBarScrollBehavior({ scrollTargetRef, canScroll = true, reverseLayout = false }: MaterialSearchBarScrollBehaviorOptions = {}) {
  const ref = useRef<HTMLDivElement>(null)
  const [offset, setOffset] = useState(0)
  const [scrolled, setScrolled] = useState(false)
  const [settling, setSettling] = useState(false)
  useEffect(() => {
    const target = scrollTargetRef?.current ?? window
    const position = () => target instanceof HTMLElement ? target.scrollTop : window.scrollY
    let previous = position(), current = 0, timer = 0
    const update = () => {
      const next = position()
      setScrolled(next > 0)
      if (canScroll) {
        current = Math.max(-(ref.current?.getBoundingClientRect().height ?? 64), Math.min(0, current + (previous - next) * (reverseLayout ? -1 : 1)))
        setSettling(false); setOffset(current)
        window.clearTimeout(timer)
        timer = window.setTimeout(() => {
          const height = ref.current?.getBoundingClientRect().height ?? 64
          current = Math.abs(current) > height / 2 ? -height : 0
          setSettling(true); setOffset(current)
        }, MATERIAL_APP_BAR_TIMING.scrollEndMs)
      }
      previous = next
    }
    setScrolled(previous > 0)
    target.addEventListener('scroll', update, { passive: true })
    return () => { target.removeEventListener('scroll', update); window.clearTimeout(timer) }
  }, [scrollTargetRef, canScroll, reverseLayout])
  return { ref, offset, scrolled, settling }
}
export type MaterialSearchBarScrollBehavior = ReturnType<typeof useMaterialSearchBarScrollBehavior>
export type MaterialAppBarWithSearchProps = Omit<MaterialSearchBarProps, 'children' | 'colors'> & {
  state: MaterialSearchBarState
  colors?: MaterialAppBarWithSearchColors
  navigationIcon?: ReactNode
  actions?: ReactNode
  safeAreaInsets?: boolean
  contentPadding?: CSSProperties['padding']
  scrollBehavior?: MaterialSearchBarScrollBehavior
}
export const MaterialAppBarWithSearch = forwardRef<HTMLDivElement, MaterialAppBarWithSearchProps>(function MaterialAppBarWithSearch({
  state, inputField, colors: suppliedColors, navigationIcon, actions, safeAreaInsets = true, contentPadding = 0, scrollBehavior,
  className, style, shape, tonalElevation = 0, shadowElevation = 0, ...props
}, ref) {
  const colors = getMaterialAppBarWithSearchColors(suppliedColors)
  const scrolled = scrollBehavior?.scrolled ?? false
  const appBarColor = scrolled ? colors.scrolledAppBarContainerColor : colors.appBarContainerColor
  const transparent = colors.appBarContainerColor === 'transparent'
  const appBarStyle = surfaceStyle({ containerColor: appBarColor }, 0, transparent ? 0 : tonalElevation, transparent ? 0 : shadowElevation)
  const searchColors = { ...colors.searchBarColors, ...(scrolled && colors.scrolledSearchBarContainerColor ? { containerColor: colors.scrolledSearchBarContainerColor } : {}) }
  return <div {...props} ref={node => { if (scrollBehavior) scrollBehavior.ref.current = node; if (typeof ref === 'function') ref(node); else if (ref) ref.current = node }}
    className={classes('material-app-bar-with-search', className)} data-safe-area={safeAreaInsets} data-settling={scrollBehavior?.settling}
    data-scrolled={scrolled} style={{ ...appBarStyle, '--md-search-app-bar-color': appBarStyle['--md-search-container-color'],
      '--md-search-app-bar-navigation-color': colors.appBarNavigationIconColor, '--md-search-app-bar-action-color': colors.appBarActionIconColor,
      transform: scrollBehavior ? `translateY(${scrollBehavior.offset}px)` : undefined, ...style } as MaterialSearchBarStyle}>
    <div className="material-app-bar-with-search__row" style={{ padding: contentPadding }}>
      {navigationIcon != null && <div className="material-app-bar-with-search__navigation">{navigationIcon}</div>}
      <div className="material-app-bar-with-search__search"><MaterialSearchBar state={state} inputField={inputField} colors={searchColors} shape={shape} tonalElevation={transparent ? tonalElevation : 0} shadowElevation={transparent ? shadowElevation : 0} /></div>
      {actions != null && <div className="material-app-bar-with-search__actions">{actions}</div>}
    </div>
  </div>
})
/** AndroidX's deprecated TopSearchBar keeps its transparent app bar. */
export const MaterialTopSearchBar = forwardRef<HTMLDivElement, Omit<MaterialAppBarWithSearchProps, 'colors' | 'navigationIcon' | 'actions'>>(function MaterialTopSearchBar(props, ref) {
  return <MaterialAppBarWithSearch {...props} ref={ref} colors={{ appBarContainerColor: 'transparent', scrolledAppBarContainerColor: 'transparent', scrolledSearchBarContainerColor: undefined }} />
})
export const MaterialSearchBarDefaults = {
  InputField: MaterialSearchBarInputField, InputFieldHeight: 56, TonalElevation: 0, ShadowElevation: 0,
  inputFieldShape: 'var(--md-sys-shape-corner-full)', fullScreenShape: '0px', dockedShape: 'var(--md-sys-shape-corner-extra-large)',
  dockedDropdownShape: '12px', dockedDropdownGapSize: 2, dockedDropdownScrimColor: 'color-mix(in srgb, var(--md-sys-color-scrim) 32%, transparent)',
  colors: getMaterialSearchBarColors, inputFieldColors: getMaterialSearchBarInputFieldColors, containedColors: getMaterialContainedSearchBarColors,
  appBarWithSearchColors: getMaterialAppBarWithSearchColors, enterAlwaysSearchBarScrollBehavior: useMaterialSearchBarScrollBehavior,
} as const
