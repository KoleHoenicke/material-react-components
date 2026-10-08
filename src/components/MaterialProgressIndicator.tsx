/*
 * Geometry and timing in this file are adapted from AndroidX Material 3
 * ProgressIndicator and WavyProgressIndicator.
 *
 * Copyright 2022-2025 The Android Open Source Project
 * Licensed under the Apache License, Version 2.0.
 */

import {
  useEffect,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
  type ComponentPropsWithoutRef,
  type CSSProperties,
} from 'react'
import { circularWavyGeometry } from '../internal/circularWavyGeometry'
import { MATERIAL_PROGRESS_TIMING } from '../theme/materialMotion'
import './MaterialProgressIndicator.css'

export type MaterialProgressStrokeCap = 'round' | 'butt' | 'square'

type NativeSpanProps = Omit<
  ComponentPropsWithoutRef<'span'>,
  'children' | 'color' | 'role'
>

export type MaterialProgressIndicatorBaseProps = NativeSpanProps & {
  /** Accessible name. `aria-label` or `aria-labelledby` may be used instead. */
  label?: string
  /** Current progress. Omit it for an indeterminate indicator. */
  value?: number
  /** Maximum progress value. */
  max?: number
  /** Forces determinate or indeterminate rendering. Defaults to true when value is omitted. */
  indeterminate?: boolean
  /** Active-indicator color. */
  color?: string
  /** Track color. */
  trackColor?: string
  /** Active stroke width in CSS pixels. */
  strokeWidth?: number
  /** Track stroke width in CSS pixels. */
  trackStrokeWidth?: number
  /** Shape used at stroke ends. */
  strokeLinecap?: MaterialProgressStrokeCap
  /** Visible space between the active indicator and track, excluding rounded caps. */
  gapSize?: number
  /** Uses the AndroidX recommended animation when a determinate value changes. */
  animateProgress?: boolean
}

export type MaterialLinearProgressIndicatorProps = MaterialProgressIndicatorBaseProps & {
  /** SVG and layout width. The Android default is 240. */
  width?: number
  /** SVG and layout height. The Android standard default is 4. */
  height?: number
  /** Stop-indicator size. Set to 0 to hide it. */
  stopSize?: number
  /** Stop-indicator color. */
  stopColor?: string
}

export type MaterialCircularProgressIndicatorProps = MaterialProgressIndicatorBaseProps & {
  /** SVG and layout size. The Android default is 40. */
  size?: number
}

export type MaterialLinearWavyProgressIndicatorProps = MaterialLinearProgressIndicatorProps & {
  /** SVG and layout height. The Android default is 10. */
  height?: number
  /** Wave amplitude, or a function of normalized progress. */
  amplitude?: number | ((progress: number) => number)
  /** Wave length in CSS pixels. Defaults to 40 determinate and 20 indeterminate. */
  wavelength?: number
  /** Wave travel speed in CSS pixels per second. Defaults to one wavelength per second. */
  waveSpeed?: number
}

export type MaterialCircularWavyProgressIndicatorProps =
  MaterialCircularProgressIndicatorProps & {
    /** Wave amplitude, or a function of normalized progress. */
    amplitude?: number | ((progress: number) => number)
    /** Proposed wave length in CSS pixels. Android adjusts the final length to close the shape. */
    wavelength?: number
    /** Wave travel speed in CSS pixels per second. Defaults to one wavelength per second. */
    waveSpeed?: number
  }

type NormalizedProgress = {
  indeterminate: boolean
  max: number
  progress: number
  value: number
}

type Segment = {
  start: number
  end: number
}

const DEFAULT_LINEAR_WIDTH = 240
const DEFAULT_LINEAR_HEIGHT = 4
const DEFAULT_LINEAR_WAVY_HEIGHT = 10
const DEFAULT_CIRCULAR_SIZE = 40
const DEFAULT_CIRCULAR_WAVY_SIZE = 48
const DEFAULT_STROKE_WIDTH = 4
const DEFAULT_GAP_SIZE = 4
const DEFAULT_STOP_SIZE = 4
const DETERMINATE_LINEAR_WAVELENGTH = 40
const INDETERMINATE_LINEAR_WAVELENGTH = 20
const CIRCULAR_WAVELENGTH = 15
const MIN_CIRCULAR_PROGRESS = 0.1
const MAX_CIRCULAR_PROGRESS = 0.87
const TWO_PI = Math.PI * 2
const EPSILON = 0.0001


function clamp(value: number, min: number, max: number) {
  if (Number.isNaN(value)) return min
  return Math.min(max, Math.max(min, value))
}

function formatNumber(value: number) {
  return Number(value.toFixed(3)).toString()
}

function normalizeProgress(
  value: number | undefined,
  maxValue: number | undefined,
  indeterminateValue: boolean | undefined,
): NormalizedProgress {
  const max = Number.isFinite(maxValue) && Number(maxValue) > 0 ? Number(maxValue) : 1
  const indeterminate = indeterminateValue ?? value === undefined
  const safeValue = Number.isFinite(value) ? Number(value) : 0

  return {
    indeterminate,
    max,
    progress: clamp(safeValue / max, 0, 1),
    value: clamp(safeValue, 0, max),
  }
}

function cubicBezierValue(progress: number, x1: number, y1: number, x2: number, y2: number) {
  const target = clamp(progress, 0, 1)
  const sample = (t: number, a: number, b: number) => {
    const inverse = 1 - t
    return 3 * inverse * inverse * t * a + 3 * inverse * t * t * b + t * t * t
  }

  let low = 0
  let high = 1
  for (let index = 0; index < 16; index += 1) {
    const middle = (low + high) / 2
    if (sample(middle, x1, x2) < target) low = middle
    else high = middle
  }

  return sample((low + high) / 2, y1, y2)
}

function usePrefersReducedMotion() {
  const [reducedMotion, setReducedMotion] = useState(() =>
    typeof window === 'undefined'
      ? false
      : window.matchMedia?.('(prefers-reduced-motion: reduce)').matches === true,
  )

  useEffect(() => {
    if (typeof window === 'undefined' || !window.matchMedia) return
    const mediaQuery = window.matchMedia('(prefers-reduced-motion: reduce)')
    const update = () => setReducedMotion(mediaQuery.matches)
    update()
    mediaQuery.addEventListener('change', update)
    return () => mediaQuery.removeEventListener('change', update)
  }, [])

  return reducedMotion
}

function useMeasuredWidth(defaultWidth: number) {
  const rootRef = useRef<HTMLSpanElement | null>(null)
  const [width, setWidth] = useState(defaultWidth)

  useLayoutEffect(() => {
    const element = rootRef.current
    if (!element || typeof ResizeObserver === 'undefined') return

    const update = () => {
      const measuredWidth = element.clientWidth || element.getBoundingClientRect().width
      const nextWidth = Math.max(
        measuredWidth > 0 ? measuredWidth : defaultWidth,
        DEFAULT_LINEAR_HEIGHT,
      )
      setWidth((current) => (Math.abs(current - nextWidth) < 0.1 ? current : nextWidth))
    }
    const observer = new ResizeObserver(update)
    update()
    observer.observe(element)
    return () => observer.disconnect()
  }, [defaultWidth])

  return [rootRef, width] as const
}

function useAnimationElapsed(enabled: boolean) {
  const [elapsed, setElapsed] = useState(0)

  useEffect(() => {
    if (!enabled || typeof window === 'undefined' || !window.requestAnimationFrame) {
      setElapsed(0)
      return
    }

    let frame = 0
    const startedAt = window.performance.now()
    const tick = (now: number) => {
      setElapsed(now - startedAt)
      frame = window.requestAnimationFrame(tick)
    }
    frame = window.requestAnimationFrame(tick)
    return () => window.cancelAnimationFrame(frame)
  }, [enabled])

  return elapsed
}

function useAnimatedProgress(
  target: number,
  enabled: boolean,
  reducedMotion: boolean,
  kind: 'standard' | 'wavy',
) {
  const [value, setValue] = useState(target)
  const valueRef = useRef(target)

  useEffect(() => {
    if (!enabled || reducedMotion || typeof window === 'undefined' || !window.requestAnimationFrame) {
      valueRef.current = target
      setValue(target)
      return
    }

    const start = valueRef.current
    const delta = target - start
    const startedAt = window.performance.now()
    let frame = 0

    const tick = (now: number) => {
      const seconds = Math.max(0, (now - startedAt) / 1000)
      const raw = kind === 'wavy'
        ? clamp(
            (now - startedAt) / MATERIAL_PROGRESS_TIMING.wavyDeterminateDurationMs,
            0,
            1,
          )
        : clamp(
            1 -
              (1 + Math.sqrt(MATERIAL_PROGRESS_TIMING.standardDeterminateSpring.stiffness) * seconds) *
                Math.exp(
                  -Math.sqrt(MATERIAL_PROGRESS_TIMING.standardDeterminateSpring.stiffness) *
                    seconds,
                ),
            0,
            1,
          )
      const next = start + delta * raw
      valueRef.current = next
      setValue(next)

      if (
        raw <
        1 - MATERIAL_PROGRESS_TIMING.standardDeterminateSpring.visibilityThreshold
      ) frame = window.requestAnimationFrame(tick)
      else {
        valueRef.current = target
        setValue(target)
      }
    }

    frame = window.requestAnimationFrame(tick)
    return () => window.cancelAnimationFrame(frame)
  }, [enabled, kind, reducedMotion, target])

  return value
}

function useAnimatedAmplitude(target: number, reducedMotion: boolean) {
  const [value, setValue] = useState(target)
  const valueRef = useRef(target)

  useEffect(() => {
    if (reducedMotion || typeof window === 'undefined' || !window.requestAnimationFrame) {
      valueRef.current = target
      setValue(target)
      return
    }

    const start = valueRef.current
    if (Math.abs(target - start) < EPSILON) return
    const increasing = target > start
    const startedAt = window.performance.now()
    let frame = 0

    const tick = (now: number) => {
      const fraction = clamp(
        (now - startedAt) / MATERIAL_PROGRESS_TIMING.wavyDeterminateDurationMs,
        0,
        1,
      )
      const eased = increasing
        ? cubicBezierValue(fraction, 0.2, 0, 0, 1)
        : cubicBezierValue(fraction, 0.3, 0, 0.8, 0.15)
      const next = start + (target - start) * eased
      valueRef.current = next
      setValue(next)

      if (fraction < 1) frame = window.requestAnimationFrame(tick)
      else {
        valueRef.current = target
        setValue(target)
      }
    }

    frame = window.requestAnimationFrame(tick)
    return () => window.cancelAnimationFrame(frame)
  }, [reducedMotion, target])

  return value
}

function animatedKeyframe(
  elapsed: number,
  delay: number,
  duration: number,
  easing: (value: number) => number,
) {
  if (elapsed <= delay) return 0
  if (elapsed >= delay + duration) return 1
  return easing((elapsed - delay) / duration)
}

function linearIndeterminateSegments(elapsed: number): Segment[] {
  const cycle = elapsed % MATERIAL_PROGRESS_TIMING.linearIndeterminateCycleMs
  const easing = (value: number) => cubicBezierValue(value, 0.3, 0, 0.8, 0.15)
  const firstHead = animatedKeyframe(
    cycle,
    MATERIAL_PROGRESS_TIMING.linearFirstHeadDelayMs,
    MATERIAL_PROGRESS_TIMING.linearFirstHeadDurationMs,
    easing,
  )
  const firstTail = animatedKeyframe(
    cycle,
    MATERIAL_PROGRESS_TIMING.linearFirstTailDelayMs,
    MATERIAL_PROGRESS_TIMING.linearFirstTailDurationMs,
    easing,
  )
  const secondHead = animatedKeyframe(
    cycle,
    MATERIAL_PROGRESS_TIMING.linearSecondHeadDelayMs,
    MATERIAL_PROGRESS_TIMING.linearSecondHeadDurationMs,
    easing,
  )
  const secondTail = animatedKeyframe(
    cycle,
    MATERIAL_PROGRESS_TIMING.linearSecondTailDelayMs,
    MATERIAL_PROGRESS_TIMING.linearSecondTailDurationMs,
    easing,
  )

  return [
    { start: firstTail, end: firstHead },
    { start: secondTail, end: secondHead },
  ].filter((segment) => segment.end - segment.start > EPSILON)
}

function circularIndeterminateFrame(elapsed: number) {
  const cycle = elapsed % MATERIAL_PROGRESS_TIMING.circularIndeterminateCycleMs
  const half = MATERIAL_PROGRESS_TIMING.circularIndeterminateCycleMs / 2
  const sweepProgress = cycle <= half ? cycle / half : (cycle - half) / half
  const easedSweep = cubicBezierValue(sweepProgress, 0.4, 0, 0.2, 1)
  const progress = cycle <= half
    ? MIN_CIRCULAR_PROGRESS + (MAX_CIRCULAR_PROGRESS - MIN_CIRCULAR_PROGRESS) * easedSweep
    : MAX_CIRCULAR_PROGRESS - (MAX_CIRCULAR_PROGRESS - MIN_CIRCULAR_PROGRESS) * easedSweep
  const globalRotation =
    (elapsed / MATERIAL_PROGRESS_TIMING.circularIndeterminateCycleMs) * 1080
  const quarter = Math.floor(
    cycle / MATERIAL_PROGRESS_TIMING.circularAdditionalRotationStepMs,
  )
  const withinQuarter =
    cycle - quarter * MATERIAL_PROGRESS_TIMING.circularAdditionalRotationStepMs
  const rotationProgress = cubicBezierValue(
    clamp(
      withinQuarter / MATERIAL_PROGRESS_TIMING.circularAdditionalRotationDurationMs,
      0,
      1,
    ),
    0.05,
    0.7,
    0.1,
    1,
  )
  const additionalRotation = (quarter + rotationProgress) * 90

  return { progress, rotation: globalRotation + additionalRotation }
}

function progressA11y(
  normalized: NormalizedProgress,
  label: string | undefined,
  ariaLabel: string | undefined,
) {
  if (normalized.indeterminate) {
    return { 'aria-label': ariaLabel ?? label }
  }

  return {
    'aria-label': ariaLabel ?? label,
    'aria-valuemax': normalized.max,
    'aria-valuemin': 0,
    'aria-valuenow': normalized.value,
  }
}

function linePath(start: number, end: number, y: number) {
  if (end - start <= EPSILON) return ''
  return `M ${formatNumber(start)} ${formatNumber(y)} L ${formatNumber(end)} ${formatNumber(y)}`
}

function wavyLinePath(
  start: number,
  end: number,
  centerY: number,
  amplitude: number,
  wavelength: number,
  phase: number,
) {
  if (end - start <= EPSILON) return ''
  if (amplitude <= EPSILON || wavelength <= EPSILON) return linePath(start, end, centerY)

  const yAt = (x: number) =>
    centerY + Math.sin(((x + phase) / wavelength) * TWO_PI) * amplitude
  const slopeAt = (x: number) =>
    Math.cos(((x + phase) / wavelength) * TWO_PI) * amplitude * (TWO_PI / wavelength)
  const segmentLength = wavelength / 8
  const commands = [`M ${formatNumber(start)} ${formatNumber(yAt(start))}`]
  let segmentStart = start

  while (segmentStart < end - EPSILON) {
    const segmentEnd = Math.min(end, segmentStart + segmentLength)
    const controlDistance = (segmentEnd - segmentStart) / 3
    commands.push(
      `C ${formatNumber(segmentStart + controlDistance)} ${formatNumber(
        yAt(segmentStart) + slopeAt(segmentStart) * controlDistance,
      )} ${formatNumber(segmentEnd - controlDistance)} ${formatNumber(
        yAt(segmentEnd) - slopeAt(segmentEnd) * controlDistance,
      )} ${formatNumber(segmentEnd)} ${formatNumber(yAt(segmentEnd))}`,
    )
    segmentStart = segmentEnd
  }

  return commands.join(' ')
}

function trackSegments(
  activeSegments: Segment[],
  width: number,
  inset: number,
  gapSize: number,
) {
  const visible = activeSegments
    .map(({ start, end }) => ({ start: start * width, end: end * width }))
    .filter(({ start, end }) => end - start > EPSILON)
    .sort((a, b) => a.start - b.start)
  if (visible.length === 0) return [{ start: inset, end: width - inset }]

  const spacing = gapSize + inset * 2
  const tracks: Array<{ start: number; end: number }> = []
  let cursor = inset
  for (const segment of visible) {
    const trackEnd = clamp(segment.start - spacing, inset, width - inset)
    if (trackEnd > cursor) tracks.push({ start: cursor, end: trackEnd })
    cursor = Math.max(cursor, clamp(segment.end + spacing, inset, width - inset))
  }
  if (cursor < width - inset) tracks.push({ start: cursor, end: width - inset })
  return tracks
}

function amplitudeFor(
  amplitude: number | ((progress: number) => number) | undefined,
  progress: number,
  indeterminate: boolean,
) {
  if (typeof amplitude === 'function') return clamp(amplitude(progress), 0, 1)
  if (typeof amplitude === 'number') return clamp(amplitude, 0, 1)
  if (indeterminate) return 1
  return progress <= 0.1 || progress >= 0.95 ? 0 : 1
}

function rootStyle(
  style: CSSProperties | undefined,
  values: Record<string, string | number | undefined>,
) {
  return { ...style, ...values } as CSSProperties
}

export function MaterialLinearProgressIndicator({
  'aria-label': ariaLabel,
  animateProgress = false,
  className,
  color,
  gapSize = DEFAULT_GAP_SIZE,
  height = DEFAULT_LINEAR_HEIGHT,
  indeterminate,
  label,
  max,
  stopColor,
  stopSize = DEFAULT_STOP_SIZE,
  strokeLinecap = 'round',
  strokeWidth = DEFAULT_STROKE_WIDTH,
  style,
  trackColor,
  trackStrokeWidth = DEFAULT_STROKE_WIDTH,
  value,
  width,
  ...rest
}: MaterialLinearProgressIndicatorProps) {
  const defaultWidth = width ?? DEFAULT_LINEAR_WIDTH
  const resolvedHeight = Math.max(DEFAULT_LINEAR_HEIGHT, height)
  const normalized = normalizeProgress(value, max, indeterminate)
  const reducedMotion = usePrefersReducedMotion()
  const elapsed = useAnimationElapsed(normalized.indeterminate && !reducedMotion)
  const progress = useAnimatedProgress(
    normalized.progress,
    animateProgress && !normalized.indeterminate,
    reducedMotion,
    'standard',
  )
  const [rootRef, measuredWidth] = useMeasuredWidth(defaultWidth)
  const segments = normalized.indeterminate
    ? reducedMotion
      ? [{ start: 0.2, end: 0.55 }]
      : linearIndeterminateSegments(elapsed)
    : [{ start: 0, end: progress }]
  const inset = strokeLinecap === 'butt' ? 0 : Math.max(strokeWidth, trackStrokeWidth) / 2
  const tracks = trackSegments(segments, measuredWidth, inset, gapSize)
  const baseStopSize = Math.min(trackStrokeWidth, Math.max(0, stopSize))
  const indicatorOffset = baseStopSize === trackStrokeWidth ? 0 : trackStrokeWidth / 4
  const stopStart = measuredWidth - baseStopSize - indicatorOffset
  const progressEnd = measuredWidth * progress + inset
  const visibleStopSize = normalized.indeterminate
    ? 0
    : Math.max(0, baseStopSize - Math.max(0, progressEnd - stopStart))
  const classes = ['material-progress', 'material-linear-progress', className]
    .filter(Boolean)
    .join(' ')

  return (
    <span
      {...rest}
      {...progressA11y(normalized, label, ariaLabel)}
      ref={rootRef}
      role="progressbar"
      className={classes}
      data-indeterminate={normalized.indeterminate || undefined}
      style={rootStyle(style, {
        '--md-linear-progress-width': width === undefined ? undefined : `${width}px`,
        '--md-linear-progress-height':
          height === DEFAULT_LINEAR_HEIGHT ? undefined : `${resolvedHeight}px`,
        '--md-progress-active-color': color,
        '--md-progress-track-color': trackColor,
        '--md-progress-stop-color': stopColor,
      })}
    >
      <svg
        aria-hidden="true"
        className="material-progress__svg material-progress__svg--linear"
        focusable="false"
        viewBox={`0 0 ${formatNumber(measuredWidth)} ${formatNumber(resolvedHeight)}`}
      >
        {tracks.map((track, index) => (
          <path
            className="material-progress__track"
            d={linePath(track.start, track.end, resolvedHeight / 2)}
            key={`track-${index}`}
            strokeLinecap={strokeLinecap}
            strokeWidth={trackStrokeWidth}
            vectorEffect="non-scaling-stroke"
          />
        ))}
        {segments.map((segment, index) => (
          <path
            className="material-progress__active"
            d={linePath(
              clamp(segment.start * measuredWidth, inset, measuredWidth - inset),
              clamp(segment.end * measuredWidth, inset, measuredWidth - inset),
              resolvedHeight / 2,
            )}
            key={`active-${index}`}
            strokeLinecap={strokeLinecap}
            strokeWidth={strokeWidth}
            vectorEffect="non-scaling-stroke"
          />
        ))}
        {visibleStopSize > EPSILON ? (
          strokeLinecap === 'round' ? (
            <circle
              className="material-progress__stop"
              cx={measuredWidth - visibleStopSize / 2 - indicatorOffset}
              cy={resolvedHeight / 2}
              r={visibleStopSize / 2}
            />
          ) : (
            <rect
              className="material-progress__stop"
              height={visibleStopSize}
              width={visibleStopSize}
              x={measuredWidth - visibleStopSize - indicatorOffset}
              y={(resolvedHeight - visibleStopSize) / 2}
            />
          )
        ) : null}
      </svg>
    </span>
  )
}

export function MaterialLinearWavyProgressIndicator({
  'aria-label': ariaLabel,
  amplitude,
  animateProgress = false,
  className,
  color,
  gapSize = DEFAULT_GAP_SIZE,
  height = DEFAULT_LINEAR_WAVY_HEIGHT,
  indeterminate,
  label,
  max,
  stopColor,
  stopSize = DEFAULT_STOP_SIZE,
  strokeLinecap = 'round',
  strokeWidth = DEFAULT_STROKE_WIDTH,
  style,
  trackColor,
  trackStrokeWidth = DEFAULT_STROKE_WIDTH,
  value,
  wavelength: wavelengthValue,
  waveSpeed: waveSpeedValue,
  width,
  ...rest
}: MaterialLinearWavyProgressIndicatorProps) {
  const defaultWidth = width ?? DEFAULT_LINEAR_WIDTH
  const normalized = normalizeProgress(value, max, indeterminate)
  const reducedMotion = usePrefersReducedMotion()
  const progress = useAnimatedProgress(
    normalized.progress,
    animateProgress && !normalized.indeterminate,
    reducedMotion,
    'wavy',
  )
  const wavelength = Math.max(
    EPSILON,
    wavelengthValue ??
      (normalized.indeterminate
        ? INDETERMINATE_LINEAR_WAVELENGTH
        : DETERMINATE_LINEAR_WAVELENGTH),
  )
  const waveSpeed = Math.max(0, waveSpeedValue ?? wavelength)
  const targetAmplitude = amplitudeFor(amplitude, progress, normalized.indeterminate)
  const animatedAmplitude = useAnimatedAmplitude(targetAmplitude, reducedMotion)
  const elapsed = useAnimationElapsed(
    !reducedMotion &&
      (normalized.indeterminate || animatedAmplitude > 0) &&
      (normalized.indeterminate || waveSpeed > 0),
  )
  const [rootRef, measuredWidth] = useMeasuredWidth(defaultWidth)
  const segments = normalized.indeterminate
    ? reducedMotion
      ? [{ start: 0.2, end: 0.55 }]
      : linearIndeterminateSegments(elapsed)
    : [{ start: 0, end: progress }]
  const inset = strokeLinecap === 'butt' ? 0 : Math.max(strokeWidth, trackStrokeWidth) / 2
  const tracks = trackSegments(segments, measuredWidth, inset, gapSize)
  const waveAmplitude = animatedAmplitude * Math.max(0, (height - strokeWidth) / 2)
  const phase = reducedMotion || waveSpeed <= 0 ? 0 : ((elapsed / 1000) * waveSpeed) % wavelength
  const baseStopSize = Math.min(trackStrokeWidth, Math.max(0, stopSize))
  const indicatorOffset = baseStopSize === trackStrokeWidth ? 0 : trackStrokeWidth / 4
  const stopStart = measuredWidth - baseStopSize - indicatorOffset
  const progressEnd = measuredWidth * progress + inset
  const visibleStopSize = normalized.indeterminate
    ? 0
    : Math.max(0, baseStopSize - Math.max(0, progressEnd - stopStart))
  const classes = ['material-progress', 'material-linear-wavy-progress', className]
    .filter(Boolean)
    .join(' ')

  return (
    <span
      {...rest}
      {...progressA11y(normalized, label, ariaLabel)}
      ref={rootRef}
      role="progressbar"
      className={classes}
      data-indeterminate={normalized.indeterminate || undefined}
      style={rootStyle(style, {
        '--md-linear-progress-width': width === undefined ? undefined : `${width}px`,
        '--md-linear-wavy-progress-height':
          height === DEFAULT_LINEAR_WAVY_HEIGHT ? undefined : `${height}px`,
        '--md-progress-active-color': color,
        '--md-progress-track-color': trackColor,
        '--md-progress-stop-color': stopColor,
      })}
    >
      <svg
        aria-hidden="true"
        className="material-progress__svg material-progress__svg--linear"
        focusable="false"
        viewBox={`0 0 ${formatNumber(measuredWidth)} ${formatNumber(height)}`}
      >
        {tracks.map((track, index) => (
          <path
            className="material-progress__track"
            d={linePath(track.start, track.end, height / 2)}
            key={`track-${index}`}
            strokeLinecap={strokeLinecap}
            strokeWidth={trackStrokeWidth}
            vectorEffect="non-scaling-stroke"
          />
        ))}
        {segments.map((segment, index) => {
          const start = clamp(segment.start * measuredWidth, inset, measuredWidth - inset)
          const end = clamp(segment.end * measuredWidth, inset, measuredWidth - inset)
          return (
            <path
              className="material-progress__active"
              d={wavyLinePath(start, end, height / 2, waveAmplitude, wavelength, phase)}
              key={`active-${index}`}
              strokeLinecap={strokeLinecap}
              strokeWidth={strokeWidth}
              vectorEffect="non-scaling-stroke"
            />
          )
        })}
        {visibleStopSize > EPSILON ? (
          strokeLinecap === 'round' ? (
            <circle
              className="material-progress__stop"
              cx={measuredWidth - visibleStopSize / 2 - indicatorOffset}
              cy={height / 2}
              r={visibleStopSize / 2}
            />
          ) : (
            <rect
              className="material-progress__stop"
              height={visibleStopSize}
              width={visibleStopSize}
              x={measuredWidth - visibleStopSize - indicatorOffset}
              y={(height - visibleStopSize) / 2}
            />
          )
        ) : null}
      </svg>
    </span>
  )
}

function circleDash(progress: number, gapFraction: number) {
  const gap = Math.min(progress, gapFraction)
  const start = progress + gap
  const length = Math.max(0, 1 - progress - gap * 2)
  return {
    dashArray: `${formatNumber(length * 100)} ${formatNumber((1 - length) * 100)}`,
    dashOffset: formatNumber(-start * 100),
  }
}

function CircularProgressSvg({
  elapsed,
  gapSize,
  indeterminate,
  progress,
  reducedMotion,
  size,
  strokeLinecap,
  strokeWidth,
  trackStrokeWidth,
  wavy,
  amplitude,
  wavelength,
  waveSpeed,
}: {
  elapsed: number
  gapSize: number
  indeterminate: boolean
  progress: number
  reducedMotion: boolean
  size: number
  strokeLinecap: MaterialProgressStrokeCap
  strokeWidth: number
  trackStrokeWidth: number
  wavy: boolean
  amplitude: number
  wavelength: number
  waveSpeed: number
}) {
  const frame = indeterminate
    ? reducedMotion
      ? { progress: 0.35, rotation: 0 }
      : circularIndeterminateFrame(elapsed)
    : { progress, rotation: 0 }
  const radius = size / 2 - Math.max(strokeWidth, trackStrokeWidth) / 2
  const circumference = TWO_PI * radius
  const adjustedGap = strokeLinecap === 'butt' ? gapSize : gapSize + strokeWidth
  const gapFraction = Math.min(frame.progress, adjustedGap / Math.max(TWO_PI * size / 2, EPSILON))
  const waves = Math.max(5, Math.round(circumference / Math.max(wavelength, EPSILON)))
  const waveOffset = reducedMotion || waveSpeed <= 0 || amplitude <= 0
    ? 0
    : ((elapsed / 1000) * waveSpeed / (Math.max(wavelength, EPSILON) * waves)) % 1
  const waveGeometry = useMemo(
    () => wavy ? circularWavyGeometry(size, strokeWidth, waves, amplitude) : null,
    [amplitude, size, strokeWidth, waves, wavy],
  )
  const wavyGap = (Math.min(frame.progress * (waveGeometry?.length ?? circumference), gapSize)
    + (strokeLinecap === 'butt' ? 0 : Math.max(strokeWidth, trackStrokeWidth))) / Math.max(circumference, EPSILON)
  const track = circleDash(frame.progress, wavy ? wavyGap : gapFraction)
  const activeDash = `${formatNumber(frame.progress * 100)} ${formatNumber(
    (1 - frame.progress) * 100,
  )}`
  const transform = `rotate(${formatNumber(frame.rotation + (wavy && indeterminate ? 90 : 0))} ${formatNumber(size / 2)} ${formatNumber(
    size / 2,
  )})`

  return (
    <svg
      aria-hidden="true"
      className="material-progress__svg material-progress__svg--circular"
      focusable="false"
      viewBox={`0 0 ${formatNumber(size)} ${formatNumber(size)}`}
    >
      <g transform={transform}>
        <circle
          className="material-progress__track"
          cx={size / 2}
          cy={size / 2}
          fill="none"
          pathLength={100}
          r={radius}
          strokeDasharray={track.dashArray}
          strokeDashoffset={track.dashOffset}
          strokeLinecap={strokeLinecap}
          strokeWidth={trackStrokeWidth}
          transform={`rotate(${indeterminate && !wavy ? 0 : -90} ${formatNumber(size / 2)} ${formatNumber(size / 2)})`}
          vectorEffect="non-scaling-stroke"
        />
        {wavy ? (
          <path
            className="material-progress__active"
            d={waveGeometry?.path}
            fill="none"
            pathLength={100}
            strokeDasharray={activeDash}
            strokeDashoffset={formatNumber(-waveOffset * 100)}
            transform={`rotate(${formatNumber(-waveOffset * 360)} ${size / 2} ${size / 2})`}
            strokeLinecap={strokeLinecap}
            strokeWidth={strokeWidth}
            vectorEffect="non-scaling-stroke"
          />
        ) : (
          <circle
            className="material-progress__active"
            cx={size / 2}
            cy={size / 2}
            fill="none"
            pathLength={100}
            r={radius}
            strokeDasharray={activeDash}
            strokeLinecap={strokeLinecap}
            strokeWidth={strokeWidth}
            transform={`rotate(${indeterminate && !wavy ? 0 : -90} ${formatNumber(size / 2)} ${formatNumber(size / 2)})`}
            vectorEffect="non-scaling-stroke"
          />
        )}
      </g>
    </svg>
  )
}

function CircularProgressRoot({
  'aria-label': ariaLabel,
  amplitude,
  animateProgress = false,
  className,
  color,
  gapSize = DEFAULT_GAP_SIZE,
  indeterminate,
  label,
  max,
  size,
  strokeLinecap = 'round',
  strokeWidth = DEFAULT_STROKE_WIDTH,
  style,
  trackColor,
  trackStrokeWidth = DEFAULT_STROKE_WIDTH,
  value,
  wavelength,
  waveSpeed,
  wavy,
  ...rest
}: MaterialCircularWavyProgressIndicatorProps & { wavy: boolean }) {
  const normalized = normalizeProgress(value, max, indeterminate)
  const reducedMotion = usePrefersReducedMotion()
  const progress = useAnimatedProgress(
    normalized.progress,
    animateProgress && !normalized.indeterminate,
    reducedMotion,
    wavy ? 'wavy' : 'standard',
  )
  const resolvedSize = Math.max(
    DEFAULT_STROKE_WIDTH,
    size ?? (wavy ? DEFAULT_CIRCULAR_WAVY_SIZE : DEFAULT_CIRCULAR_SIZE),
  )
  const resolvedWavelength = Math.max(EPSILON, wavelength ?? CIRCULAR_WAVELENGTH)
  const resolvedWaveSpeed = Math.max(0, waveSpeed ?? resolvedWavelength)
  const resolvedAmplitude = wavy
    ? amplitudeFor(amplitude, progress, normalized.indeterminate)
    : 0
  const animatedAmplitude = useAnimatedAmplitude(resolvedAmplitude, reducedMotion)
  const elapsed = useAnimationElapsed(
    !reducedMotion &&
      (normalized.indeterminate || (wavy && animatedAmplitude > 0 && resolvedWaveSpeed > 0)),
  )
  const classes = [
    'material-progress',
    wavy ? 'material-circular-wavy-progress' : 'material-circular-progress',
    className,
  ]
    .filter(Boolean)
    .join(' ')
  return (
    <span
      {...rest}
      {...progressA11y(normalized, label, ariaLabel)}
      role="progressbar"
      className={classes}
      data-indeterminate={normalized.indeterminate || undefined}
      style={rootStyle(style, {
        '--md-circular-progress-size': size === undefined ? undefined : `${resolvedSize}px`,
        '--md-circular-wavy-progress-size': size === undefined ? undefined : `${resolvedSize}px`,
        '--md-progress-active-color': color,
        '--md-progress-track-color': trackColor,
      })}
    >
      <CircularProgressSvg
        amplitude={animatedAmplitude}
        elapsed={elapsed}
        gapSize={Math.max(0, gapSize)}
        indeterminate={normalized.indeterminate}
        progress={progress}
        reducedMotion={reducedMotion}
        size={resolvedSize}
        strokeLinecap={strokeLinecap}
        strokeWidth={Math.max(0, strokeWidth)}
        trackStrokeWidth={Math.max(0, trackStrokeWidth)}
        waveSpeed={resolvedWaveSpeed}
        wavelength={resolvedWavelength}
        wavy={wavy}
      />
    </span>
  )
}

export function MaterialCircularProgressIndicator(props: MaterialCircularProgressIndicatorProps) {
  return <CircularProgressRoot {...props} wavy={false} />
}

export function MaterialCircularWavyProgressIndicator(
  props: MaterialCircularWavyProgressIndicatorProps,
) {
  return <CircularProgressRoot {...props} wavy />
}
