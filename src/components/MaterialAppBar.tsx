import {
  forwardRef,
  useEffect,
  useRef,
  useState,
  type ButtonHTMLAttributes,
  type CSSProperties,
  type HTMLAttributes,
  type ReactNode,
  type RefObject,
} from 'react'

import { MaterialIconButton, type MaterialIconButtonProps } from './MaterialIconButton'
import { MaterialRipple } from './MaterialRipple'
import { MATERIAL_APP_BAR_TIMING } from '../theme/materialMotion'
import './MaterialAppBar.css'

export type MaterialTopAppBarVariant =
  | 'small'
  | 'center-aligned'
  | 'medium'
  | 'medium-flexible'
  | 'large'
  | 'large-flexible'

export type MaterialTopAppBarScrollBehavior =
  | 'none'
  | 'pinned'
  | 'enter-always'
  | 'exit-until-collapsed'

export type MaterialBottomAppBarVariant = 'standard' | 'flexible'
export type MaterialBottomAppBarArrangement =
  | 'start'
  | 'center'
  | 'end'
  | 'space-around'
  | 'space-between'
  | 'space-evenly'
  | 'fixed'

export type MaterialAppBarScrollTarget =
  | HTMLElement
  | Window
  | RefObject<HTMLElement | null>
  | null

type AppBarSlot = ReactNode | ((expanded: boolean) => ReactNode)

export type MaterialTopAppBarStyle = CSSProperties & {
  '--md-top-app-bar-action-color'?: string
  '--md-top-app-bar-collapsed-height'?: string
  '--md-top-app-bar-container-color'?: string
  '--md-top-app-bar-expanded-height'?: string
  '--md-top-app-bar-navigation-color'?: string
  '--md-top-app-bar-safe-area-inline-end'?: string
  '--md-top-app-bar-safe-area-inline-start'?: string
  '--md-top-app-bar-safe-area-top'?: string
  '--md-top-app-bar-scrolled-container-color'?: string
  '--md-top-app-bar-subtitle-color'?: string
  '--md-top-app-bar-title-color'?: string
}

export type MaterialTopAppBarProps = Omit<
  HTMLAttributes<HTMLElement>,
  'children' | 'style' | 'title'
> & {
  /** Navigation control. MaterialAppBarIconButton matches the Android touch target. */
  navigationIcon?: ReactNode
  /** Trailing controls, normally MaterialAppBarIconButton elements. */
  actions?: ReactNode
  /** Controlled collapse value from 0 (expanded) through 1 (collapsed). */
  collapseProgress?: number
  collapsedHeight?: number
  expandedHeight?: number
  onCollapseProgressChange?: (progress: number) => void
  /** Uses CSS safe-area environment insets by default. */
  safeAreaInsets?: boolean
  /** Controlled container-color state. */
  scrolled?: boolean
  scrollBehavior?: MaterialTopAppBarScrollBehavior
  /** Defaults to window when a scroll behavior is selected. */
  scrollTarget?: MaterialAppBarScrollTarget
  style?: MaterialTopAppBarStyle
  subtitle?: AppBarSlot
  title: AppBarSlot
  titleAlignment?: 'center' | 'start'
  variant?: MaterialTopAppBarVariant
}

export type MaterialBottomAppBarStyle = CSSProperties & {
  '--md-bottom-app-bar-container-color'?: string
  '--md-bottom-app-bar-container-elevation'?: string
  '--md-bottom-app-bar-content-color'?: string
  '--md-bottom-app-bar-expanded-height'?: string
  '--md-bottom-app-bar-safe-area-bottom'?: string
  '--md-bottom-app-bar-safe-area-inline-end'?: string
  '--md-bottom-app-bar-safe-area-inline-start'?: string
}

export type MaterialBottomAppBarProps = Omit<
  HTMLAttributes<HTMLElement>,
  'children' | 'style'
> & {
  actions?: ReactNode
  arrangement?: MaterialBottomAppBarArrangement
  children?: ReactNode
  collapseProgress?: number
  expandedHeight?: number
  floatingActionButton?: ReactNode
  onCollapseProgressChange?: (progress: number) => void
  safeAreaInsets?: boolean
  scrollBehavior?: 'none' | 'exit-always'
  scrollTarget?: MaterialAppBarScrollTarget
  style?: MaterialBottomAppBarStyle
  variant?: MaterialBottomAppBarVariant
}

export type MaterialAppBarIconButtonProps = MaterialIconButtonProps

export type MaterialAppBarFabProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  children: ReactNode
}

const DEFAULT_HEIGHTS: Record<MaterialTopAppBarVariant, number> = {
  small: 64,
  'center-aligned': 64,
  medium: 112,
  'medium-flexible': 112,
  large: 152,
  'large-flexible': 120,
}

function clamp(value: number) {
  return Math.min(1, Math.max(0, Number.isFinite(value) ? value : 0))
}

function finiteHeight(value: number | undefined, fallback: number) {
  return value !== undefined && Number.isFinite(value) && value >= 0 ? value : fallback
}

function cubicBezierValue(
  progress: number,
  x1: number,
  y1: number,
  x2: number,
  y2: number,
) {
  const sample = (t: number, a1: number, a2: number) => {
    const inverse = 1 - t
    return 3 * inverse * inverse * t * a1 + 3 * inverse * t * t * a2 + t * t * t
  }
  let low = 0
  let high = 1

  for (let index = 0; index < 12; index += 1) {
    const middle = (low + high) / 2
    if (sample(middle, x1, x2) < progress) low = middle
    else high = middle
  }

  return sample((low + high) / 2, y1, y2)
}

function resolveScrollTarget(target: MaterialAppBarScrollTarget | undefined) {
  if (target && 'current' in target) return target.current
  if (target !== undefined) return target
  return typeof window === 'undefined' ? null : window
}

function scrollTop(target: HTMLElement | Window) {
  return 'scrollY' in target ? target.scrollY : target.scrollTop
}

function addScrollListener(target: HTMLElement | Window, listener: () => void) {
  target.addEventListener('scroll', listener, { passive: true })
  return () => target.removeEventListener('scroll', listener)
}

function useAppBarScroll({
  behavior,
  collapseProgress,
  collapseRange,
  onCollapseProgressChange,
  scrollTarget,
  settleDurationMs,
}: {
  behavior: MaterialTopAppBarScrollBehavior | 'exit-always'
  collapseProgress?: number
  collapseRange: number
  onCollapseProgressChange?: (progress: number) => void
  scrollTarget?: MaterialAppBarScrollTarget
  settleDurationMs: number
}) {
  const [automaticProgress, setAutomaticProgress] = useState(0)
  const [automaticScrolled, setAutomaticScrolled] = useState(false)
  const [settling, setSettling] = useState(false)
  const progressRef = useRef(clamp(collapseProgress ?? 0))

  useEffect(() => {
    progressRef.current = clamp(collapseProgress ?? automaticProgress)
  }, [automaticProgress, collapseProgress])

  useEffect(() => {
    if (behavior === 'none') return

    const target = resolveScrollTarget(scrollTarget)
    if (!target) return

    let previousTop = scrollTop(target)
    let frame = 0
    let settleTimer = 0
    let settleEndTimer = 0

    const commit = (next: number) => {
      const value = clamp(next)
      progressRef.current = value
      if (collapseProgress === undefined) setAutomaticProgress(value)
      onCollapseProgressChange?.(value)
    }

    const update = () => {
      frame = 0
      const nextTop = scrollTop(target)
      const delta = nextTop - previousTop
      previousTop = nextTop
      setAutomaticScrolled(nextTop > 0)
      setSettling(false)

      if (behavior === 'exit-until-collapsed') {
        commit(collapseRange > 0 ? nextTop / collapseRange : 0)
      } else if (behavior === 'enter-always' || behavior === 'exit-always') {
        if (nextTop <= 0) commit(0)
        else commit(progressRef.current + delta / Math.max(1, collapseRange))
      }

      window.clearTimeout(settleTimer)
      if (behavior !== 'pinned') {
        settleTimer = window.setTimeout(() => {
          const current = progressRef.current
          if (current > 0 && current < 1) {
            setSettling(true)
            commit(current < 0.5 ? 0 : 1)
            settleEndTimer = window.setTimeout(
              () => setSettling(false),
              settleDurationMs,
            )
          }
        }, MATERIAL_APP_BAR_TIMING.scrollEndMs)
      }
    }

    const onScroll = () => {
      if (!frame) frame = window.requestAnimationFrame(update)
    }

    setAutomaticScrolled(previousTop > 0)
    if (behavior === 'exit-until-collapsed') {
      commit(collapseRange > 0 ? previousTop / collapseRange : 0)
    }

    const remove = addScrollListener(target, onScroll)
    return () => {
      remove()
      window.cancelAnimationFrame(frame)
      window.clearTimeout(settleTimer)
      window.clearTimeout(settleEndTimer)
    }
  }, [
    behavior,
    collapseProgress,
    collapseRange,
    onCollapseProgressChange,
    scrollTarget,
    settleDurationMs,
  ])

  return {
    progress: clamp(collapseProgress ?? automaticProgress),
    scrolled: automaticScrolled,
    settling,
  }
}

function resolveSlot(slot: AppBarSlot | undefined, expanded: boolean) {
  return typeof slot === 'function' ? slot(expanded) : slot
}

function titleNode(
  title: AppBarSlot,
  subtitle: AppBarSlot | undefined,
  expanded: boolean,
  hidden: boolean,
  variant: MaterialTopAppBarVariant,
) {
  const titleTypography = !expanded
    ? 'titleLarge'
    : variant === 'medium'
      ? 'headlineSmall'
      : variant === 'large-flexible'
        ? 'displaySmall'
        : 'headlineMedium'
  const subtitleTypography = !expanded
    ? 'labelMedium'
    : variant === 'large-flexible'
      ? 'titleMedium'
      : 'labelLarge'

  return (
    <div className="material-top-app-bar__title-block" aria-hidden={hidden || undefined}>
      <div className="material-top-app-bar__title" data-material-typography={titleTypography}>
        {resolveSlot(title, expanded)}
      </div>
      {subtitle !== undefined ? (
        <div
          className="material-top-app-bar__subtitle"
          data-material-typography={subtitleTypography}
        >
          {resolveSlot(subtitle, expanded)}
        </div>
      ) : null}
    </div>
  )
}

export const MaterialTopAppBar = forwardRef<HTMLElement, MaterialTopAppBarProps>(
  function MaterialTopAppBar(
    {
      actions,
      className,
      collapseProgress,
      collapsedHeight = 64,
      expandedHeight,
      navigationIcon,
      onCollapseProgressChange,
      safeAreaInsets = true,
      scrollBehavior = 'none',
      scrollTarget,
      scrolled,
      style,
      subtitle,
      title,
      titleAlignment,
      variant = 'small',
      ...htmlProps
    },
    ref,
  ) {
    const twoRows = !['small', 'center-aligned'].includes(variant)
    const flexible = variant.endsWith('-flexible')
    const defaultExpandedHeight =
      variant === 'medium-flexible' && subtitle !== undefined
        ? 136
        : variant === 'large-flexible' && subtitle !== undefined
          ? 152
          : DEFAULT_HEIGHTS[variant]
    const resolvedExpandedHeight = finiteHeight(expandedHeight, defaultExpandedHeight)
    const resolvedCollapsedHeight =
      scrollBehavior === 'enter-always' && !twoRows
        ? 0
        : finiteHeight(collapsedHeight, 64)

    if (resolvedExpandedHeight < resolvedCollapsedHeight) {
      throw new RangeError('expandedHeight must be greater than or equal to collapsedHeight')
    }

    const { progress, scrolled: observedScrolled, settling } = useAppBarScroll({
      behavior: scrollBehavior,
      collapseProgress,
      collapseRange: resolvedExpandedHeight - resolvedCollapsedHeight,
      onCollapseProgressChange,
      scrollTarget,
      settleDurationMs: MATERIAL_APP_BAR_TIMING.topSettleDurationMs,
    })
    const currentHeight =
      resolvedExpandedHeight -
      (resolvedExpandedHeight - resolvedCollapsedHeight) * progress
    const collapsedTitleHidden = twoRows && progress < 0.5
    const expandedTitleHidden = twoRows && !collapsedTitleHidden
    const alignment =
      titleAlignment ?? (variant === 'center-aligned' ? 'center' : 'start')
    const resolvedScrolled = scrolled ?? (observedScrolled || progress > 0)
    const colorProgress = twoRows
      ? cubicBezierValue(progress, 0.4, 0, 1, 1)
      : resolvedScrolled
        ? 1
        : 0
    const appBarStyle = {
      ...style,
      '--md-top-app-bar-collapsed-height': `${resolvedCollapsedHeight}px`,
      '--md-top-app-bar-collapsed-title-opacity': twoRows
        ? cubicBezierValue(progress, 0.8, 0, 0.8, 0.15)
        : 1,
      '--md-top-app-bar-color-progress': colorProgress,
      '--md-top-app-bar-current-height': `${currentHeight}px`,
      '--md-top-app-bar-expanded-height': `${resolvedExpandedHeight}px`,
      '--md-top-app-bar-expanded-title-opacity': 1 - progress,
      '--md-top-app-bar-progress': progress,
    } as MaterialTopAppBarStyle

    return (
      <header
        {...htmlProps}
        ref={ref}
        className={['material-top-app-bar', className].filter(Boolean).join(' ')}
        style={appBarStyle}
        data-alignment={alignment}
        data-collapse-progress={progress}
        data-flexible={flexible ? 'true' : undefined}
        data-material-top-app-bar=""
        data-safe-area={safeAreaInsets ? 'true' : 'false'}
        data-scrolled={resolvedScrolled ? 'true' : 'false'}
        data-settling={settling ? 'true' : undefined}
        data-two-rows={twoRows ? 'true' : 'false'}
        data-variant={variant}
      >
        <div className="material-top-app-bar__content">
          <div className="material-top-app-bar__row material-top-app-bar__row--top">
            <div className="material-top-app-bar__navigation">{navigationIcon}</div>
            <div className="material-top-app-bar__collapsed-title">
              {titleNode(
                title,
                flexible ? subtitle : undefined,
                false,
                collapsedTitleHidden,
                variant,
              )}
            </div>
            <div className="material-top-app-bar__actions">{actions}</div>
          </div>
          {twoRows ? (
            <div className="material-top-app-bar__row material-top-app-bar__row--expanded">
              {titleNode(
                title,
                flexible ? subtitle : undefined,
                true,
                expandedTitleHidden,
                variant,
              )}
            </div>
          ) : null}
        </div>
      </header>
    )
  },
)

function variantTopAppBar(
  variant: MaterialTopAppBarVariant,
  displayName: string,
) {
  const Component = forwardRef<HTMLElement, Omit<MaterialTopAppBarProps, 'variant'>>(
    (props, ref) => <MaterialTopAppBar {...props} ref={ref} variant={variant} />,
  )
  Component.displayName = displayName
  return Component
}

export const MaterialCenterAlignedTopAppBar = variantTopAppBar(
  'center-aligned',
  'MaterialCenterAlignedTopAppBar',
)
export const MaterialMediumTopAppBar = variantTopAppBar('medium', 'MaterialMediumTopAppBar')
export const MaterialMediumFlexibleTopAppBar = variantTopAppBar(
  'medium-flexible',
  'MaterialMediumFlexibleTopAppBar',
)
export const MaterialLargeTopAppBar = variantTopAppBar('large', 'MaterialLargeTopAppBar')
export const MaterialLargeFlexibleTopAppBar = variantTopAppBar(
  'large-flexible',
  'MaterialLargeFlexibleTopAppBar',
)

export const MaterialBottomAppBar = forwardRef<HTMLElement, MaterialBottomAppBarProps>(
  function MaterialBottomAppBar(
    {
      actions,
      arrangement,
      children,
      className,
      collapseProgress,
      expandedHeight,
      floatingActionButton,
      onCollapseProgressChange,
      safeAreaInsets = true,
      scrollBehavior = 'none',
      scrollTarget,
      style,
      variant = 'standard',
      ...htmlProps
    },
    ref,
  ) {
    const defaultHeight = variant === 'flexible' ? 64 : 80
    const candidateHeight = finiteHeight(expandedHeight, defaultHeight)
    const resolvedHeight = candidateHeight > 0 ? candidateHeight : defaultHeight
    const { progress, settling } = useAppBarScroll({
      behavior: scrollBehavior,
      collapseProgress,
      collapseRange: resolvedHeight,
      onCollapseProgressChange,
      scrollTarget,
      settleDurationMs: MATERIAL_APP_BAR_TIMING.bottomSettleDurationMs,
    })
    const appBarStyle = {
      ...style,
      '--md-bottom-app-bar-current-height': `${resolvedHeight * (1 - progress)}px`,
      '--md-bottom-app-bar-expanded-height': `${resolvedHeight}px`,
      '--md-bottom-app-bar-progress': progress,
    } as MaterialBottomAppBarStyle

    return (
      <footer
        {...htmlProps}
        ref={ref}
        className={['material-bottom-app-bar', className].filter(Boolean).join(' ')}
        style={appBarStyle}
        data-arrangement={arrangement ?? (variant === 'flexible' ? 'space-between' : 'start')}
        data-collapse-progress={progress}
        data-material-bottom-app-bar=""
        data-safe-area={safeAreaInsets ? 'true' : 'false'}
        data-settling={settling ? 'true' : undefined}
        data-variant={variant}
      >
        <div className="material-bottom-app-bar__content">
          <div className="material-bottom-app-bar__actions">{actions ?? children}</div>
          {floatingActionButton ? (
            <div className="material-bottom-app-bar__fab">{floatingActionButton}</div>
          ) : null}
        </div>
      </footer>
    )
  },
)

export const MaterialAppBarIconButton = forwardRef<
  HTMLButtonElement,
  MaterialAppBarIconButtonProps
>(function MaterialAppBarIconButton(
  { className, ...buttonProps },
  ref,
) {
  return (
    <MaterialIconButton
      colorMode="inherit"
      {...buttonProps}
      ref={ref}
      className={['material-app-bar-icon-button', className].filter(Boolean).join(' ')}
      data-material-app-bar-icon-button=""
    />
  )
})

export const MaterialAppBarFab = forwardRef<HTMLButtonElement, MaterialAppBarFabProps>(
  function MaterialAppBarFab(
    { children, className, disabled = false, type = 'button', ...buttonProps },
    ref,
  ) {
    return (
      <button
        {...buttonProps}
        ref={ref}
        className={['material-app-bar-fab', className].filter(Boolean).join(' ')}
        data-material-app-bar-fab=""
        disabled={disabled}
        type={type}
      >
        <MaterialRipple disabled={disabled} />
        <span className="material-app-bar-fab__icon" aria-hidden="true">{children}</span>
      </button>
    )
  },
)
