/* Tab geometry and motion adapted from AndroidX Material3, revision
 * 40ff481447ab78cbdc1a316bc7c8ecfca630f19e. Apache-2.0.
 * Copyright 2022-2026 The Android Open Source Project. */
import {
  createContext, forwardRef, useContext, useLayoutEffect, useRef, useState,
  type ButtonHTMLAttributes, type CSSProperties, type HTMLAttributes, type ReactNode,
} from 'react'
import { getMaterialSpringAttributes, MATERIAL_TAB_MOTION } from '../theme/materialMotion'
import { sampleMaterialSpring, type MaterialSpringState } from '../internal/materialSpring'
import { MaterialRipple } from './MaterialRipple'
import './MaterialTabs.css'

export type MaterialTabVariant = 'primary' | 'secondary'
export type MaterialTabStyle = CSSProperties & { [key: `--md-tab-${string}`]: string | number | undefined }
export type MaterialTabRowStyle = CSSProperties & { [key: `--md-tab-row-${string}`]: string | number | undefined }
export type MaterialTabPosition = { left: number; width: number; contentWidth: number }
export type MaterialTabIndicatorScope = {
  positions: readonly MaterialTabPosition[]
  selectedTabIndex: number
  /** The indicator wrapper already animates its position and width. */
  matchContentSize: boolean
}

const TabRowContext = createContext(false)
const classes = (...names: (string | undefined)[]) => names.filter(Boolean).join(' ')

/** Measures Compose's maxIntrinsicWidth without duplicating the accessible label. */
function intrinsicWidth(element: HTMLElement) {
  const previous = element.style.cssText
  element.style.inlineSize = 'max-content'
  element.style.maxInlineSize = 'none'
  element.style.flexShrink = '0'
  const width = element.getBoundingClientRect().width
  element.style.cssText = previous
  return width
}

function tabIntrinsicWidth(tab: HTMLElement) {
  const label = tab.querySelector<HTMLElement>('.material-tab__label')
  const icon = tab.querySelector<HTMLElement>('.material-tab__icon')
  const content = tab.querySelector<HTMLElement>('.material-tab__content')!
  if (tab.dataset.layout === 'custom') return intrinsicWidth(content)
  if (tab.dataset.layout === 'leading') {
    const computed = getComputedStyle(content)
    return (label ? intrinsicWidth(label) : 0) + (icon?.getBoundingClientRect().width ?? 0) +
      (parseFloat(computed.paddingInlineStart) || 0) + (parseFloat(computed.paddingInlineEnd) || 0) + (parseFloat(computed.columnGap) || 8)
  }
  return Math.max(label ? intrinsicWidth(label) : 0, icon?.getBoundingClientRect().width ?? 0)
}

export type MaterialTabProps = Omit<ButtonHTMLAttributes<HTMLButtonElement>, 'children' | 'style'> & {
  selected: boolean
  text?: ReactNode
  icon?: ReactNode
  /** Generic Compose Tab content. Supply text/icon slots for the standard baseline layout. */
  children?: ReactNode
  selectedContentColor?: string
  unselectedContentColor?: string
  style?: MaterialTabStyle
}

type TabImplProps = MaterialTabProps & { leading?: boolean }
const TabImpl = forwardRef<HTMLButtonElement, TabImplProps>(function TabImpl({
  selected, text, icon, children, leading = false, selectedContentColor, unselectedContentColor,
  className, style, disabled, tabIndex, type = 'button', ...props
}, forwardedRef) {
  const inRow = useContext(TabRowContext)
  const rootRef = useRef<HTMLButtonElement | null>(null)
  const stacked = !leading && icon != null && text != null
  const layout = children != null ? 'custom' : leading ? 'leading' : stacked ? 'stacked' : text != null ? 'text' : 'icon'
  useLayoutEffect(() => {
    const root = rootRef.current
    if (!root || leading || children != null) return
    const label = root.querySelector<HTMLElement>('.material-tab__label')
    const iconElement = root.querySelector<HTMLElement>('.material-tab__icon')
    const measure = () => {
      const distance = parseFloat(getComputedStyle(root).getPropertyValue('--md-tab-icon-baseline-distance')) || 20
      const iconHeight = iconElement?.getBoundingClientRect().height ?? 0
      const textHeight = label?.getBoundingClientRect().height ?? 0
      root.style.setProperty('--md-tab-measured-height', `${iconHeight + textHeight + distance}px`)
      if (!stacked || !label) return
      const bounds = label.getBoundingClientRect()
      const first = label.querySelector<HTMLElement>('[data-tab-first-baseline]')!.getBoundingClientRect().top - bounds.top
      const last = label.querySelector<HTMLElement>('[data-tab-last-baseline]')!.getBoundingClientRect().top - bounds.top
      if (!bounds.height) return
      const offset = first === last ? 14 : 6
      root.style.setProperty('--md-tab-label-bottom', `${offset + 3 - (bounds.height - last)}px`)
      root.style.setProperty('--md-tab-icon-bottom', `${offset + 3 + last + distance - first}px`)
    }
    measure()
    const observer = new ResizeObserver(measure)
    if (label) observer.observe(label)
    if (iconElement) observer.observe(iconElement)
    let alive = true
    const fonts = () => { if (alive) measure() }
    document.fonts?.ready.then(fonts)
    document.fonts?.addEventListener('loadingdone', fonts)
    return () => { alive = false; observer.disconnect(); document.fonts?.removeEventListener('loadingdone', fonts) }
  }, [stacked, leading, children, text, icon])
  const colors: MaterialTabStyle = {
    ...selectedContentColor != null ? { '--md-tab-selected-content-color': selectedContentColor } : {},
    ...unselectedContentColor != null ? { '--md-tab-unselected-content-color': unselectedContentColor } : {},
    ...style,
  }
  return (
    <button {...props} ref={node => {
      rootRef.current = node
      if (typeof forwardedRef === 'function') forwardedRef(node)
      else if (forwardedRef) forwardedRef.current = node
    }} type={type} role="tab" aria-selected={selected} disabled={disabled}
      tabIndex={tabIndex ?? (inRow ? selected && !disabled ? 0 : -1 : 0)}
      className={classes('material-tab', className)} style={colors}
      data-material-tab="" data-selected={selected} data-layout={layout}
    >
      <MaterialRipple disabled={disabled} />
      <span className="material-tab__content">
        {children != null ? children : <>
          {icon != null && <span className="material-tab__icon" aria-hidden="true">{icon}</span>}
          {text != null && <span className="material-tab__label" data-material-typography="titleSmall">
            <span data-tab-first-baseline="" aria-hidden="true" />{text}<span data-tab-last-baseline="" aria-hidden="true" />
          </span>}
        </>}
      </span>
    </button>
  )
})

export const MaterialTab = forwardRef<HTMLButtonElement, MaterialTabProps>(function MaterialTab(props, ref) {
  return <TabImpl {...props} ref={ref} />
})
export type MaterialLeadingIconTabProps = MaterialTabProps & { icon: ReactNode; text: ReactNode }
export const MaterialLeadingIconTab = forwardRef<HTMLButtonElement, MaterialLeadingIconTabProps>(function MaterialLeadingIconTab(props, ref) {
  return <TabImpl {...props} leading ref={ref} />
})

export type MaterialTabIndicatorProps = Omit<HTMLAttributes<HTMLSpanElement>, 'color'> & {
  width?: CSSProperties['width']
  height?: CSSProperties['height']
  color?: string
  shape?: CSSProperties['borderRadius']
}
export const MaterialPrimaryTabIndicator = forwardRef<HTMLSpanElement, MaterialTabIndicatorProps>(function MaterialPrimaryTabIndicator({
  width = 24, height, color, shape, className, style, ...props
}, ref) {
  return <span {...props} ref={ref} aria-hidden="true" className={classes('material-tab-indicator', className)}
    data-variant="primary" style={{ width, height, backgroundColor: color, borderRadius: shape, ...style }} />
})
export const MaterialSecondaryTabIndicator = forwardRef<HTMLSpanElement, MaterialTabIndicatorProps>(function MaterialSecondaryTabIndicator({
  width = '100%', height, color, className, style, ...props
}, ref) {
  return <span {...props} ref={ref} aria-hidden="true" className={classes('material-tab-indicator', className)}
    data-variant="secondary" style={{ width, height, backgroundColor: color, ...style }} />
})

export const MaterialTabRowDefaults = {
  primaryContainerColor: 'var(--md-sys-color-surface)',
  secondaryContainerColor: 'var(--md-sys-color-surface)',
  primaryContentColor: 'var(--md-sys-color-primary)',
  secondaryContentColor: 'var(--md-sys-color-on-surface)',
  indicatorColor: 'var(--md-sys-color-primary)',
  indicatorHeight: 3,
  ScrollableTabRowMinTabWidth: 90,
  ScrollableTabRowEdgeStartPadding: 52,
  PrimaryIndicator: MaterialPrimaryTabIndicator,
  SecondaryIndicator: MaterialSecondaryTabIndicator,
} as const

export type MaterialTabRowProps = Omit<HTMLAttributes<HTMLDivElement>, 'children' | 'style'> & {
  children: ReactNode
  selectedTabIndex: number
  variant?: MaterialTabVariant
  scrollable?: boolean
  /** PrimaryTabRow defaults to content; secondary and legacy TabRow default to tab. */
  indicatorSize?: 'content' | 'tab'
  indicator?: ReactNode | ((scope: MaterialTabIndicatorScope) => ReactNode)
  divider?: ReactNode
  containerColor?: string
  contentColor?: string
  edgePadding?: number
  minTabWidth?: number
  /** Automatic activates on arrow focus; manual requires Enter or Space. */
  activationMode?: 'automatic' | 'manual'
  style?: MaterialTabRowStyle
}

/** Controlled TabRow. Pass the same selection to the row and its Tab children. */
export const MaterialTabRow = forwardRef<HTMLDivElement, MaterialTabRowProps>(function MaterialTabRow({
  children, selectedTabIndex, variant = 'primary', scrollable = false, indicatorSize = 'tab',
  indicator, divider, containerColor, contentColor, edgePadding, minTabWidth,
  activationMode = 'automatic', style, className, onKeyDown, onFocus, ...props
}, forwardedRef) {
  const rootRef = useRef<HTMLDivElement | null>(null)
  const viewportRef = useRef<HTMLDivElement>(null)
  const trackRef = useRef<HTMLDivElement>(null)
  const indicatorRef = useRef<HTMLSpanElement>(null)
  const [positions, setPositions] = useState<MaterialTabPosition[]>([])
  const animation = useRef({
    left: { value: 0, velocity: 0 }, width: { value: 0, velocity: 0 },
    scroll: { value: 0, velocity: 0 },
    initialized: false, selected: -1, direction: '',
  })
  const matchContentSize = indicatorSize === 'content'
  useLayoutEffect(() => {
    const root = rootRef.current!
    const track = trackRef.current!
    const viewport = viewportRef.current!
    const layer = indicatorRef.current!
    const query = window.matchMedia?.('(prefers-reduced-motion: reduce)')
    let frame = 0
    let scrollFrame = 0
    let alive = true
    const stopScroll = () => { cancelAnimationFrame(scrollFrame); scrollFrame = 0 }
    const userScroll = () => { stopScroll(); animation.current.scroll = { value: viewport.scrollLeft, velocity: 0 } }
    const tabs = () => Array.from(track.querySelectorAll<HTMLButtonElement>('[data-material-tab]'))
      .filter(tab => tab.closest('[data-material-tab-row]') === root)
    const paint = () => {
      layer.style.transform = `translateX(${animation.current.left.value}px)`
      layer.style.width = `${Math.max(0, animation.current.width.value)}px`
    }
    const measure = () => {
      cancelAnimationFrame(frame)
      const items = tabs()
      const enabled = items.filter(tab => !tab.disabled)
      const focused = enabled.find(tab => tab === document.activeElement)
      const tabStop = focused ?? enabled.find(tab => tab.getAttribute('aria-selected') === 'true') ?? enabled[0]
      items.forEach(tab => { tab.tabIndex = tab === tabStop ? 0 : -1 })
      if (!scrollable && items.length) track.style.setProperty('--md-tab-row-fixed-tab-width', `${Math.floor(viewport.clientWidth / items.length)}px`)
      if (scrollable) items.forEach(tab => tab.style.setProperty('--md-tab-intrinsic-width', `${tabIntrinsicWidth(tab)}px`))
      const bounds = track.getBoundingClientRect()
      const rtl = getComputedStyle(root).direction === 'rtl'
      const nextPositions = items.map(tab => {
        const tabBounds = tab.getBoundingClientRect()
        const intrinsic = tabIntrinsicWidth(tab)
        return {
          left: tabBounds.left - bounds.left,
          width: tabBounds.width,
          contentWidth: Math.max(24, (scrollable ? intrinsic : Math.min(intrinsic, tabBounds.width)) - 32),
        }
      })
      setPositions(previous => JSON.stringify(previous) === JSON.stringify(nextPositions) ? previous : nextPositions)
      const position = nextPositions[selectedTabIndex]
      layer.hidden = !position
      if (!position) { animation.current.initialized = false; return }
      const width = matchContentSize ? position.contentWidth : position.width
      const left = position.left + (position.width - width) / 2
      const state = animation.current
      const scheme = root.closest('[data-motion-scheme]')?.getAttribute('data-motion-scheme') === 'standard' ? 'standard' : 'expressive'
      const spring = getMaterialSpringAttributes('spatial', 'default', scheme)
      const reduced = query?.matches || !window.requestAnimationFrame
      if (!state.initialized || reduced) {
        state.left = { value: left, velocity: 0 }
        state.width = { value: width, velocity: 0 }
        state.initialized = true
        paint()
      } else {
        const initialLeft = { ...state.left }
        const initialWidth = { ...state.width }
        const start = performance.now()
        const tick = (now: number) => {
          state.left = sampleMaterialSpring(initialLeft, left, now - start, spring)
          state.width = sampleMaterialSpring(initialWidth, width, now - start, spring)
          const settled = (value: MaterialSpringState, target: number) =>
            Math.abs(value.value - target) < MATERIAL_TAB_MOTION.visibilityThreshold &&
            Math.abs(value.velocity) < MATERIAL_TAB_MOTION.velocityThreshold
          if (settled(state.left, left) && settled(state.width, width)) {
            state.left = { value: left, velocity: 0 }; state.width = { value: width, velocity: 0 }
          } else frame = requestAnimationFrame(tick)
          paint()
        }
        frame = requestAnimationFrame(tick)
      }
      if (scrollable && (state.selected !== selectedTabIndex || state.direction !== (rtl ? 'rtl' : 'ltr') || reduced)) {
        stopScroll()
        const max = Math.max(0, viewport.scrollWidth - viewport.clientWidth)
        const target = Math.max(0, Math.min(max, position.left - (viewport.clientWidth - position.width) / 2))
        // Browser RTL scrollLeft is negative from the right edge.
        const physicalTarget = rtl ? target - max : target
        if (reduced) { viewport.scrollLeft = physicalTarget; state.scroll = { value: physicalTarget, velocity: 0 } }
        else {
          const initial = { value: viewport.scrollLeft, velocity: state.scroll.velocity }
          const start = performance.now()
          const tick = (now: number) => {
            const value = sampleMaterialSpring(initial, physicalTarget, now - start, spring)
            state.scroll = value
            viewport.scrollLeft = value.value
            if (Math.abs(value.value - physicalTarget) < MATERIAL_TAB_MOTION.visibilityThreshold && Math.abs(value.velocity) < MATERIAL_TAB_MOTION.velocityThreshold) {
              viewport.scrollLeft = physicalTarget
              state.scroll = { value: physicalTarget, velocity: 0 }
            } else scrollFrame = requestAnimationFrame(tick)
          }
          scrollFrame = requestAnimationFrame(tick)
        }
      }
      state.selected = selectedTabIndex
      state.direction = rtl ? 'rtl' : 'ltr'
    }
    measure()
    const observer = new ResizeObserver(measure)
    observer.observe(viewport)
    observer.observe(track)
    tabs().forEach(tab => {
      observer.observe(tab); observer.observe(tab.querySelector('.material-tab__content')!)
      tab.querySelectorAll('.material-tab__label, .material-tab__icon').forEach(element => observer.observe(element))
    })
    const contentObserver = new MutationObserver(records => {
      if (records.some(record => !(record.target instanceof Element ? record.target : record.target.parentElement)?.closest('.material-ripple, .material-tab-row__indicator'))) measure()
    })
    contentObserver.observe(track, { childList: true, subtree: true, characterData: true })
    const themeObserver = new MutationObserver(measure)
    for (let ancestor: HTMLElement | null = root; ancestor; ancestor = ancestor.parentElement) {
      themeObserver.observe(ancestor, { attributes: true, attributeFilter: ['dir', 'data-motion-scheme'] })
    }
    const fonts = () => { if (alive) measure() }
    document.fonts?.ready.then(fonts)
    document.fonts?.addEventListener('loadingdone', fonts)
    query?.addEventListener('change', measure)
    viewport.addEventListener('pointerdown', userScroll)
    viewport.addEventListener('wheel', userScroll, { passive: true })
    return () => {
      alive = false; cancelAnimationFrame(frame); stopScroll(); observer.disconnect(); contentObserver.disconnect(); themeObserver.disconnect()
      document.fonts?.removeEventListener('loadingdone', fonts)
      query?.removeEventListener('change', measure)
      viewport.removeEventListener('pointerdown', userScroll); viewport.removeEventListener('wheel', userScroll)
    }
  }, [children, selectedTabIndex, matchContentSize, scrollable, edgePadding, minTabWidth, variant, style])
  const colors: MaterialTabRowStyle = {
    ...containerColor != null ? { '--md-tab-row-container-color': containerColor } : {},
    ...contentColor != null ? { '--md-tab-row-content-color': contentColor } : {},
    ...edgePadding != null ? { '--md-tab-row-edge-padding': `${Math.max(0, edgePadding)}px` } : {},
    ...minTabWidth != null ? { '--md-tab-row-min-tab-width': `${Math.max(48, minTabWidth)}px` } : {},
    ...style,
  }
  const scope = { positions, selectedTabIndex, matchContentSize }
  const defaultIndicator = matchContentSize ? <MaterialPrimaryTabIndicator width="100%" /> : <MaterialSecondaryTabIndicator />
  return (
    <div {...props} ref={node => {
      rootRef.current = node
      if (typeof forwardedRef === 'function') forwardedRef(node)
      else if (forwardedRef) forwardedRef.current = node
    }} className={classes('material-tab-row', className)} style={colors}
      role="tablist" aria-orientation="horizontal" data-material-tab-row="" data-variant={variant} data-scrollable={scrollable}
      onFocus={event => {
        onFocus?.(event)
        if (event.defaultPrevented) return
        const target = (event.target as HTMLElement).closest<HTMLButtonElement>('[data-material-tab]')
        if (target?.closest('[data-material-tab-row]') !== event.currentTarget) return
        event.currentTarget.querySelectorAll<HTMLButtonElement>('[data-material-tab]').forEach(tab => { tab.tabIndex = tab === target ? 0 : -1 })
      }}
      onKeyDown={event => {
        onKeyDown?.(event)
        if (event.defaultPrevented || event.altKey || event.ctrlKey || event.metaKey || event.shiftKey) return
        if (!['ArrowLeft', 'ArrowRight', 'Home', 'End'].includes(event.key)) return
        const items = Array.from(event.currentTarget.querySelectorAll<HTMLButtonElement>('[data-material-tab]:not(:disabled)'))
          .filter(tab => tab.closest('[data-material-tab-row]') === event.currentTarget)
        const index = items.indexOf(event.target as HTMLButtonElement)
        if (index < 0) return
        event.preventDefault()
        const rtl = getComputedStyle(event.currentTarget).direction === 'rtl'
        const step = (event.key === 'ArrowRight' ? 1 : -1) * (rtl ? -1 : 1)
        const next = event.key === 'Home' ? 0 : event.key === 'End' ? items.length - 1 : (index + step + items.length) % items.length
        items[next]?.focus({ preventScroll: activationMode === 'automatic' })
        if (activationMode === 'automatic') items[next]?.click()
      }}
    >
      <span className="material-tab-row__divider" aria-hidden="true">{divider === undefined ? <span /> : divider}</span>
      <div className="material-tab-row__viewport" ref={viewportRef}>
        <div className="material-tab-row__track" ref={trackRef}>
          <TabRowContext.Provider value>{children}</TabRowContext.Provider>
          <span className="material-tab-row__indicator" ref={indicatorRef} aria-hidden="true">
            {indicator === undefined ? defaultIndicator : typeof indicator === 'function' ? indicator(scope) : indicator}
          </span>
        </div>
      </div>
    </div>
  )
})

export type MaterialFixedTabRowProps = Omit<MaterialTabRowProps, 'variant' | 'scrollable'>
export const MaterialPrimaryTabRow = forwardRef<HTMLDivElement, MaterialFixedTabRowProps>(function MaterialPrimaryTabRow(props, ref) {
  return <MaterialTabRow indicatorSize="content" {...props} variant="primary" scrollable={false} ref={ref} />
})
export const MaterialSecondaryTabRow = forwardRef<HTMLDivElement, MaterialFixedTabRowProps>(function MaterialSecondaryTabRow(props, ref) {
  return <MaterialTabRow {...props} variant="secondary" scrollable={false} ref={ref} />
})
export const MaterialPrimaryScrollableTabRow = forwardRef<HTMLDivElement, MaterialFixedTabRowProps>(function MaterialPrimaryScrollableTabRow(props, ref) {
  return <MaterialTabRow indicatorSize="content" {...props} variant="primary" scrollable ref={ref} />
})
export const MaterialSecondaryScrollableTabRow = forwardRef<HTMLDivElement, MaterialFixedTabRowProps>(function MaterialSecondaryScrollableTabRow(props, ref) {
  return <MaterialTabRow {...props} variant="secondary" scrollable ref={ref} />
})
/** Compose's legacy row: primary content color with a full-width indicator. */
export const MaterialScrollableTabRow = forwardRef<HTMLDivElement, Omit<MaterialTabRowProps, 'scrollable'>>(function MaterialScrollableTabRow(props, ref) {
  return <MaterialTabRow {...props} scrollable ref={ref} />
})

export type MaterialTabPanelProps = HTMLAttributes<HTMLDivElement> & { selected: boolean; keepMounted?: boolean }
/** Web tabpanel semantics. IDs and aria-labelledby connect the caller's tab and panel. */
export const MaterialTabPanel = forwardRef<HTMLDivElement, MaterialTabPanelProps>(function MaterialTabPanel({
  selected, keepMounted = true, children, tabIndex = 0, ...props
}, ref) {
  if (!selected && !keepMounted) return null
  return <div {...props} ref={ref} role="tabpanel" hidden={!selected} tabIndex={tabIndex}>{children}</div>
})
