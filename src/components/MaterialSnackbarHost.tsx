/* Adapted from AndroidX SnackbarHost.kt. Apache-2.0.
 * Copyright 2021-2026 The Android Open Source Project. */
import { useEffect, useRef, useState, useSyncExternalStore, type HTMLAttributes, type ReactNode } from 'react'
import { MaterialSnackbar, type MaterialSnackbarStyle } from './MaterialSnackbar'
import { MATERIAL_SNACKBAR_DEFAULTS, type MaterialSnackbarData, type MaterialSnackbarHostState } from './MaterialSnackbarState'
import { useSnackbarAnimation } from '../internal/useSnackbarAnimation'

export type MaterialSnackbarHostProps = Omit<HTMLAttributes<HTMLDivElement>, 'children' | 'style'> & {
  hostState: MaterialSnackbarHostState
  snackbar?: (data: MaterialSnackbarData) => ReactNode
  actionOnNewLine?: boolean
  stylingFix?: boolean
  dismissLabel?: string
  paneTitle?: string
  /** Browser adaptation: pause a finite timeout while hovered or keyboard-focused. */
  pauseOnInteraction?: boolean
  /** Optional equivalent of Android's recommended accessibility timeout. Infinity disables it. */
  recommendedTimeoutMillis?: (original: number, containsControls: boolean) => number
  style?: MaterialSnackbarStyle
}

const emptySnapshot = () => null
type Item = { data: MaterialSnackbarData; id: number }

function AnimatedSnackbar({ item, visible, onExited, children }: {
  item: Item; visible: boolean; onExited: (data: MaterialSnackbarData) => void; children: ReactNode
}) {
  const ref = useRef<HTMLDivElement>(null)
  useSnackbarAnimation(ref, visible, () => onExited(item.data))
  return <div ref={ref} className="material-snackbar-host__item" aria-hidden={visible ? undefined : true} data-visible={String(visible)}>{children}</div>
}

export function MaterialSnackbarHost({
  hostState, snackbar, actionOnNewLine, stylingFix, dismissLabel, paneTitle = 'Snackbar',
  pauseOnInteraction = true, recommendedTimeoutMillis, className, style,
  onFocusCapture, onBlurCapture, onPointerEnter, onPointerLeave, onKeyDown, ...props
}: MaterialSnackbarHostProps) {
  const current = useSyncExternalStore(hostState.subscribe, hostState.getSnapshot, emptySnapshot)
  const [previous, setPrevious] = useState(current)
  const nextId = useRef(0)
  const [items, setItems] = useState<Item[]>(() => current ? [{ data: current, id: nextId.current++ }] : [])
  const [focused, setFocused] = useState(false), [hovered, setHovered] = useState(false)
  const paused = pauseOnInteraction && (focused || hovered)
  const countdown = useRef<{ data: MaterialSnackbarData; remaining: number; total: number } | null>(null)
  if (previous !== current) {
    setPrevious(current)
    setItems(old => current && !old.some(item => item.data === current) ? [...old, { data: current, id: nextId.current++ }] : old)
  }
  const duration = !current || current.visuals.duration === 'indefinite' ? Infinity
    : current.visuals.duration === 'long' ? MATERIAL_SNACKBAR_DEFAULTS.longDurationMs : MATERIAL_SNACKBAR_DEFAULTS.shortDurationMs
  const recommended = duration === Infinity ? Infinity : recommendedTimeoutMillis?.(duration, current?.visuals.actionLabel != null) ?? duration
  // Accessibility recommendations can extend a timeout but cannot make it shorter.
  const timeout = Number.isNaN(recommended) ? duration : Math.max(duration, recommended)
  useEffect(() => { setFocused(false) }, [current])
  useEffect(() => {
    if (!current) { countdown.current = null; return }
    if (countdown.current?.data !== current) countdown.current = { data: current, remaining: timeout, total: timeout }
    else if (countdown.current.total !== timeout) {
      const clock = countdown.current
      clock.remaining = Number.isFinite(clock.total) && Number.isFinite(timeout) ? Math.max(0, clock.remaining + timeout - clock.total) : timeout
      clock.total = timeout
    }
    if (paused || !Number.isFinite(countdown.current.remaining)) return
    const began = Date.now(), clock = countdown.current
    const timer = window.setTimeout(() => current.dismiss(), clock.remaining)
    return () => { clearTimeout(timer); clock.remaining = Math.max(0, clock.remaining - (Date.now() - began)) }
  }, [current, timeout, paused])
  return <div {...props} className={['material-snackbar-host', className].filter(Boolean).join(' ')} style={style}
    aria-label={props['aria-label'] ?? paneTitle}
    onFocusCapture={event => { onFocusCapture?.(event); setFocused(true) }}
    onBlurCapture={event => { onBlurCapture?.(event); if (!event.currentTarget.contains(event.relatedTarget as Node | null)) setFocused(false) }}
    onPointerEnter={event => { onPointerEnter?.(event); setHovered(true) }}
    onPointerLeave={event => { onPointerLeave?.(event); setHovered(false) }}
    onKeyDown={event => { onKeyDown?.(event); if (!event.defaultPrevented && event.key === 'Escape' && current) { event.preventDefault(); current.dismiss() } }}>
    <span className="material-snackbar-host__announcement" role="status" aria-live="polite" aria-atomic="true">{current && <span key={items.find(item => item.data === current)?.id}>{current.visuals.message}</span>}</span>
    {items.map(item => <AnimatedSnackbar key={item.id} item={item} visible={item.data === current}
      onExited={data => setItems(old => old.filter(entry => entry.data !== data))}>
      {snackbar ? snackbar(item.data) : <MaterialSnackbar snackbarData={item.data} actionOnNewLine={actionOnNewLine} stylingFix={stylingFix} dismissLabel={dismissLabel} />}
    </AnimatedSnackbar>)}
  </div>
}
