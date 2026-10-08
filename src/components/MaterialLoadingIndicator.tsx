/*
 * Geometry and timing in this file are a TypeScript port of the AndroidX Material3
 * LoadingIndicator, MaterialShapes, and graphics-shapes implementations.
 *
 * Copyright 2022-2024 The Android Open Source Project
 * Licensed under the Apache License, Version 2.0.
 */

import { useEffect, useRef, useState, type RefObject } from 'react'
import './MaterialLoadingIndicator.css'

export type MaterialLoadingIndicatorProps = {
  className?: string
  label: string
  variant?: 'contained' | 'standard'
}

import {
  type Point,
  type Cubic,
  point,
  rounding,
  transformCubic,
  mergeBounds,
  calculateScaleFactor,
  createMorph,
  morphAsCubics,
  materialSoftBurst,
  materialCookie9Sided,
  materialPentagon,
  materialPill,
  materialSunny,
  materialCookie4Sided,
  materialOval,
} from '../internal/materialShapeGeometry'

type LoadingIndicatorFrame = { path: string; rotation: number }

const LOADING_INDICATOR_VIEWBOX_SIZE = 48
const LOADING_INDICATOR_CENTER = LOADING_INDICATOR_VIEWBOX_SIZE / 2
const LOADING_INDICATOR_ACTIVE_SIZE = 38
const LOADING_INDICATOR_MORPH_INTERVAL_MS = 650
const LOADING_INDICATOR_GLOBAL_ROTATION_MS = 4666
const LOADING_INDICATOR_SPRING_DAMPING_RATIO = 0.6
const LOADING_INDICATOR_SPRING_STIFFNESS = 200
const LOADING_INDICATOR_SPRING_VISIBILITY_THRESHOLD = 0.1
const FULL_ROTATION = 360
const QUARTER_ROTATION = FULL_ROTATION / 4
const LOADING_INDICATOR_POLYGONS = [
  materialSoftBurst(),
  materialCookie9Sided(),
  materialPentagon(),
  materialPill(),
  materialSunny(),
  materialCookie4Sided(),
  materialOval(),
]
const LOADING_INDICATOR_MORPHS = LOADING_INDICATOR_POLYGONS.map((polygon, index) =>
  createMorph(polygon, LOADING_INDICATOR_POLYGONS[(index + 1) % LOADING_INDICATOR_POLYGONS.length]),
)
const LOADING_INDICATOR_SHAPE_SCALE =
  calculateScaleFactor(LOADING_INDICATOR_POLYGONS) *
  (LOADING_INDICATOR_ACTIVE_SIZE / LOADING_INDICATOR_VIEWBOX_SIZE)
const LOADING_INDICATOR_SPRING_DURATION_MS = calculateSpringDurationMs()
const STATIC_LOADING_INDICATOR_FRAME = createLoadingIndicatorFrame(0)

function calculateSpringDurationMs() {
  // Match FloatSpringSpec.getDurationNanos(). AndroidX normalizes the displacement
  // against the visibility threshold, then uses the underdamped spring envelope.
  const dampingRatio = Math.fround(LOADING_INDICATOR_SPRING_DAMPING_RATIO)
  const stiffness = Math.fround(LOADING_INDICATOR_SPRING_STIFFNESS)
  const visibilityThreshold = Math.fround(LOADING_INDICATOR_SPRING_VISIBILITY_THRESHOLD)
  const rootReal = -dampingRatio * Math.sqrt(stiffness)
  const rootImaginary = Math.sqrt(stiffness) * Math.sqrt(1 - dampingRatio * dampingRatio)
  const initialDisplacement = 1 / visibilityThreshold
  const sineCoefficient = (-rootReal * initialDisplacement) / rootImaginary
  const envelope = Math.sqrt(
    initialDisplacement * initialDisplacement + sineCoefficient * sineCoefficient,
  )

  return Math.trunc((Math.log(1 / envelope) / rootReal) * 1000)
}

function springProgress(elapsedMs: number) {
  // FloatSpringSpec resolves play time to whole milliseconds before evaluating
  // SpringSimulation and returns a Float.
  const elapsedSeconds = Math.floor(elapsedMs) / 1000
  const dampingRatio = Math.fround(LOADING_INDICATOR_SPRING_DAMPING_RATIO)
  const angularFrequency = Math.sqrt(Math.fround(LOADING_INDICATOR_SPRING_STIFFNESS))
  const dampedAngularFrequency =
    angularFrequency * Math.sqrt(Math.max(0, 1 - dampingRatio * dampingRatio))
  const dampingTerm = Math.exp(-dampingRatio * angularFrequency * elapsedSeconds)
  const dampingAdjustment = dampingRatio / Math.sqrt(Math.max(1e-6, 1 - dampingRatio * dampingRatio))

  return Math.fround(
    1 -
      dampingTerm *
        (Math.cos(dampedAngularFrequency * elapsedSeconds) +
          dampingAdjustment * Math.sin(dampedAngularFrequency * elapsedSeconds)),
  )
}

function createLoadingIndicatorFrame(elapsedMs: number): LoadingIndicatorFrame {
  const boundedElapsedMs = Math.max(0, Number.isFinite(elapsedMs) ? elapsedMs : 0)
  const morphCount = Math.floor(boundedElapsedMs / LOADING_INDICATOR_MORPH_INTERVAL_MS)
  const morphIndex = morphCount % LOADING_INDICATOR_MORPHS.length
  const morphElapsed = boundedElapsedMs % LOADING_INDICATOR_MORPH_INTERVAL_MS
  const progress =
    morphElapsed >= LOADING_INDICATOR_SPRING_DURATION_MS ? 1 : springProgress(morphElapsed)
  const morphRotationTargetAngle = ((morphCount + 1) * QUARTER_ROTATION) % FULL_ROTATION
  const globalRotation =
    ((boundedElapsedMs % LOADING_INDICATOR_GLOBAL_ROTATION_MS) /
      LOADING_INDICATOR_GLOBAL_ROTATION_MS) *
    FULL_ROTATION

  return {
    path: pathFromCubics(morphAsCubics(LOADING_INDICATOR_MORPHS[morphIndex], progress)),
    rotation: progress * QUARTER_ROTATION + morphRotationTargetAngle + globalRotation,
  }
}

function pathFromCubics(cubics: Cubic[]) {
  const scale = LOADING_INDICATOR_VIEWBOX_SIZE * LOADING_INDICATOR_SHAPE_SCALE
  const scaledCubics = cubics.map((cubic) =>
    transformCubic(cubic, (pointValue) => point(pointValue.x * scale, pointValue.y * scale)),
  )
  // Compose Path.getBounds uses the control-point hull, including during overshoot.
  const bounds = mergeBounds(scaledCubics)
  const translateX = LOADING_INDICATOR_CENTER - (bounds.left + bounds.right) / 2
  const translateY = LOADING_INDICATOR_CENTER - (bounds.top + bounds.bottom) / 2
  const processedCubics = scaledCubics.map((cubic) =>
    transformCubic(cubic, (pointValue) => point(pointValue.x + translateX, pointValue.y + translateY)),
  )
  const firstCubic = processedCubics[0]

  if (!firstCubic) return ''

  return [
    `M ${formatPathNumber(firstCubic.points[0])} ${formatPathNumber(firstCubic.points[1])}`,
    ...processedCubics.map(
      (cubic) =>
        `C ${formatPathNumber(cubic.points[2])} ${formatPathNumber(cubic.points[3])} ${formatPathNumber(cubic.points[4])} ${formatPathNumber(cubic.points[5])} ${formatPathNumber(cubic.points[6])} ${formatPathNumber(cubic.points[7])}`,
    ),
    'Z',
  ].join(' ')
}

function formatPathNumber(value: number) {
  return Number(value.toFixed(3)).toString()
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
    const updateReducedMotion = () => setReducedMotion(mediaQuery.matches)
    updateReducedMotion()
    mediaQuery.addEventListener('change', updateReducedMotion)

    return () => mediaQuery.removeEventListener('change', updateReducedMotion)
  }, [])

  return reducedMotion
}

function applyLoadingIndicatorFrame(path: SVGPathElement, frame: LoadingIndicatorFrame) {
  path.setAttribute('d', frame.path)
  path.setAttribute(
    'transform',
    `rotate(${formatPathNumber(frame.rotation)} ${LOADING_INDICATOR_CENTER} ${LOADING_INDICATOR_CENTER})`,
  )
}

function useLoadingIndicatorAnimation(
  pathRef: RefObject<SVGPathElement | null>,
  reducedMotion: boolean,
) {
  useEffect(() => {
    const path = pathRef.current

    if (!path) return

    applyLoadingIndicatorFrame(path, STATIC_LOADING_INDICATOR_FRAME)

    if (
      reducedMotion ||
      typeof window === 'undefined' ||
      typeof window.requestAnimationFrame !== 'function'
    )
      return

    let frameId = 0
    const startedAt = window.performance.now()
    const tick = (now: number) => {
      applyLoadingIndicatorFrame(path, createLoadingIndicatorFrame(now - startedAt))
      frameId = window.requestAnimationFrame(tick)
    }

    frameId = window.requestAnimationFrame(tick)

    return () => window.cancelAnimationFrame(frameId)
  }, [pathRef, reducedMotion])
}

export function MaterialLoadingIndicator({
  className,
  label,
  variant = 'contained',
}: MaterialLoadingIndicatorProps) {
  const reducedMotion = usePrefersReducedMotion()
  const pathRef = useRef<SVGPathElement>(null)
  const rootClassName = [
    'material-loading-indicator',
    `material-loading-indicator--${variant}`,
    reducedMotion ? 'material-loading-indicator--reduced-motion' : '',
    className,
  ]
    .filter(Boolean)
    .join(' ')

  useLoadingIndicatorAnimation(pathRef, reducedMotion)

  return (
    <span className={rootClassName} role="progressbar" aria-label={label}>
      <svg
        className="material-loading-indicator__svg"
        viewBox="0 0 48 48"
        focusable="false"
        aria-hidden="true"
      >
        <path
          ref={pathRef}
          className="material-loading-indicator__shape"
          d={STATIC_LOADING_INDICATOR_FRAME.path}
          transform={`rotate(${formatPathNumber(STATIC_LOADING_INDICATOR_FRAME.rotation)} 24 24)`}
        />
      </svg>
    </span>
  )
}
