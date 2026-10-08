/*
 * Geometry and timing in this file are a TypeScript port of the AndroidX Material3
 * LoadingIndicator, MaterialShapes, and graphics-shapes implementations.
 *
 * Copyright 2022-2024 The Android Open Source Project
 * Licensed under the Apache License, Version 2.0.
 */

export type Point = {
  x: number
  y: number
}

type Bounds = {
  left: number
  top: number
  right: number
  bottom: number
}

type CornerRounding = {
  radius: number
  smoothing: number
}

export type Cubic = {
  points: [number, number, number, number, number, number, number, number]
}

type Feature =
  | {
      kind: 'corner'
      cubics: Cubic[]
      convex: boolean
    }
  | {
      kind: 'edge'
      cubics: Cubic[]
    }

export type RoundedPolygon = {
  features: Feature[]
  cubics: Cubic[]
  center: Point
}

type ProgressableFeature = {
  progress: number
  feature: Feature
}

type MeasuredCubic = {
  cubic: Cubic
  measuredSize: number
  startOutlineProgress: number
  endOutlineProgress: number
}

type MeasuredPolygon = {
  cubics: MeasuredCubic[]
  features: ProgressableFeature[]
}

type DoubleMapper = {
  sourceValues: number[]
  targetValues: number[]
}

export type Morph = {
  matches: Array<[Cubic, Cubic]>
}

const DISTANCE_EPSILON = 1e-4
const ANGLE_EPSILON = 1e-6
const PI = Math.PI
const TWO_PI = PI * 2
const ZERO = point(0, 0)
const UNROUNDED = rounding(0)

export function point(x: number, y: number): Point {
  return { x, y }
}

export function rounding(radius: number, smoothing = 0): CornerRounding {
  return { radius, smoothing }
}

function add(a: Point, b: Point): Point {
  return point(a.x + b.x, a.y + b.y)
}

function subtract(a: Point, b: Point): Point {
  return point(a.x - b.x, a.y - b.y)
}

function multiply(pointValue: Point, scalar: number): Point {
  return point(pointValue.x * scalar, pointValue.y * scalar)
}

function divide(pointValue: Point, scalar: number): Point {
  return point(pointValue.x / scalar, pointValue.y / scalar)
}

function distance(x: number, y: number) {
  return Math.sqrt(x * x + y * y)
}

function distanceSquared(x: number, y: number) {
  return x * x + y * y
}

function pointDistance(pointValue: Point) {
  return distance(pointValue.x, pointValue.y)
}

function dotProduct(a: Point, b: Point) {
  return a.x * b.x + a.y * b.y
}

function clockwise(a: Point, b: Point) {
  return a.x * b.y - a.y * b.x > 0
}

function rotate90(pointValue: Point): Point {
  return point(-pointValue.y, pointValue.x)
}

function directionVector(x: number, y: number): Point {
  const d = distance(x, y)
  if (d <= 0) {
    return ZERO
  }

  return point(x / d, y / d)
}

function pointDirection(pointValue: Point) {
  return directionVector(pointValue.x, pointValue.y)
}

function interpolate(start: number, stop: number, fraction: number) {
  return (1 - fraction) * start + fraction * stop
}

function interpolatePoint(start: Point, stop: Point, fraction: number): Point {
  return point(interpolate(start.x, stop.x, fraction), interpolate(start.y, stop.y, fraction))
}

function positiveModulo(numberValue: number, modulo: number) {
  return ((numberValue % modulo) + modulo) % modulo
}

function square(value: number) {
  return value * value
}

function clamp(value: number, min: number, max: number) {
  return Math.min(max, Math.max(min, value))
}

function makeCubic(
  anchor0X: number,
  anchor0Y: number,
  control0X: number,
  control0Y: number,
  control1X: number,
  control1Y: number,
  anchor1X: number,
  anchor1Y: number,
): Cubic {
  return {
    points: [anchor0X, anchor0Y, control0X, control0Y, control1X, control1Y, anchor1X, anchor1Y],
  }
}

function cubicAnchor0(cubic: Cubic): Point {
  return point(cubic.points[0], cubic.points[1])
}

function cubicAnchor1(cubic: Cubic): Point {
  return point(cubic.points[6], cubic.points[7])
}

function cubicControl0(cubic: Cubic): Point {
  return point(cubic.points[2], cubic.points[3])
}

function cubicControl1(cubic: Cubic): Point {
  return point(cubic.points[4], cubic.points[5])
}

export function cubicPointOnCurve(cubic: Cubic, t: number): Point {
  const u = 1 - t

  return point(
    cubic.points[0] * (u * u * u) +
      cubic.points[2] * (3 * t * u * u) +
      cubic.points[4] * (3 * t * t * u) +
      cubic.points[6] * (t * t * t),
    cubic.points[1] * (u * u * u) +
      cubic.points[3] * (3 * t * u * u) +
      cubic.points[5] * (3 * t * t * u) +
      cubic.points[7] * (t * t * t),
  )
}

function cubicZeroLength(cubic: Cubic) {
  return (
    Math.abs(cubic.points[0] - cubic.points[6]) < DISTANCE_EPSILON &&
    Math.abs(cubic.points[1] - cubic.points[7]) < DISTANCE_EPSILON
  )
}

function cubicStraightLine(x0: number, y0: number, x1: number, y1: number): Cubic {
  return makeCubic(
    x0,
    y0,
    interpolate(x0, x1, 1 / 3),
    interpolate(y0, y1, 1 / 3),
    interpolate(x0, x1, 2 / 3),
    interpolate(y0, y1, 2 / 3),
    x1,
    y1,
  )
}

function cubicCircularArc(
  centerX: number,
  centerY: number,
  x0: number,
  y0: number,
  x1: number,
  y1: number,
): Cubic {
  const p0d = directionVector(x0 - centerX, y0 - centerY)
  const p1d = directionVector(x1 - centerX, y1 - centerY)
  const rotatedP0 = rotate90(p0d)
  const rotatedP1 = rotate90(p1d)
  const clockwiseArc = dotProduct(rotatedP0, point(x1 - centerX, y1 - centerY)) >= 0
  const cosa = dotProduct(p0d, p1d)

  if (cosa > 0.999) {
    return cubicStraightLine(x0, y0, x1, y1)
  }

  const k =
    (distance(x0 - centerX, y0 - centerY) *
      4 *
      (Math.sqrt(2 * (1 - cosa)) - Math.sqrt(1 - cosa * cosa))) /
    (3 * (1 - cosa)) *
    (clockwiseArc ? 1 : -1)

  return makeCubic(
    x0,
    y0,
    x0 + rotatedP0.x * k,
    y0 + rotatedP0.y * k,
    x1 - rotatedP1.x * k,
    y1 - rotatedP1.y * k,
    x1,
    y1,
  )
}

function splitCubic(cubic: Cubic, t: number): [Cubic, Cubic] {
  const u = 1 - t
  const pointOnCurve = cubicPointOnCurve(cubic, t)

  return [
    makeCubic(
      cubic.points[0],
      cubic.points[1],
      cubic.points[0] * u + cubic.points[2] * t,
      cubic.points[1] * u + cubic.points[3] * t,
      cubic.points[0] * (u * u) + cubic.points[2] * (2 * u * t) + cubic.points[4] * (t * t),
      cubic.points[1] * (u * u) + cubic.points[3] * (2 * u * t) + cubic.points[5] * (t * t),
      pointOnCurve.x,
      pointOnCurve.y,
    ),
    makeCubic(
      pointOnCurve.x,
      pointOnCurve.y,
      cubic.points[2] * (u * u) + cubic.points[4] * (2 * u * t) + cubic.points[6] * (t * t),
      cubic.points[3] * (u * u) + cubic.points[5] * (2 * u * t) + cubic.points[7] * (t * t),
      cubic.points[4] * u + cubic.points[6] * t,
      cubic.points[5] * u + cubic.points[7] * t,
      cubic.points[6],
      cubic.points[7],
    ),
  ]
}

function reverseCubic(cubic: Cubic): Cubic {
  return makeCubic(
    cubic.points[6],
    cubic.points[7],
    cubic.points[4],
    cubic.points[5],
    cubic.points[2],
    cubic.points[3],
    cubic.points[0],
    cubic.points[1],
  )
}

export function transformCubic(cubic: Cubic, transformPoint: (pointValue: Point) => Point): Cubic {
  const anchor0 = transformPoint(cubicAnchor0(cubic))
  const control0 = transformPoint(cubicControl0(cubic))
  const control1 = transformPoint(cubicControl1(cubic))
  const anchor1 = transformPoint(cubicAnchor1(cubic))

  return makeCubic(
    anchor0.x,
    anchor0.y,
    control0.x,
    control0.y,
    control1.x,
    control1.y,
    anchor1.x,
    anchor1.y,
  )
}

function interpolateCubic(start: Cubic, end: Cubic, progress: number): Cubic {
  return makeCubic(
    interpolate(start.points[0], end.points[0], progress),
    interpolate(start.points[1], end.points[1], progress),
    interpolate(start.points[2], end.points[2], progress),
    interpolate(start.points[3], end.points[3], progress),
    interpolate(start.points[4], end.points[4], progress),
    interpolate(start.points[5], end.points[5], progress),
    interpolate(start.points[6], end.points[6], progress),
    interpolate(start.points[7], end.points[7], progress),
  )
}

function calculateCubicBounds(cubic: Cubic, exact = false): Bounds {
  if (cubicZeroLength(cubic)) {
    return {
      left: cubic.points[0],
      top: cubic.points[1],
      right: cubic.points[0],
      bottom: cubic.points[1],
    }
  }

  let minX = Math.min(cubic.points[0], cubic.points[6])
  let minY = Math.min(cubic.points[1], cubic.points[7])
  let maxX = Math.max(cubic.points[0], cubic.points[6])
  let maxY = Math.max(cubic.points[1], cubic.points[7])

  if (!exact) {
    return {
      left: Math.min(minX, cubic.points[2], cubic.points[4]),
      top: Math.min(minY, cubic.points[3], cubic.points[5]),
      right: Math.max(maxX, cubic.points[2], cubic.points[4]),
      bottom: Math.max(maxY, cubic.points[3], cubic.points[5]),
    }
  }

  const includePoint = (curvePoint: Point) => {
    minX = Math.min(minX, curvePoint.x)
    minY = Math.min(minY, curvePoint.y)
    maxX = Math.max(maxX, curvePoint.x)
    maxY = Math.max(maxY, curvePoint.y)
  }

  const includeAxisExtrema = (
    anchor0: number,
    control0: number,
    control1: number,
    anchor1: number,
  ) => {
    const a = -anchor0 + 3 * control0 - 3 * control1 + anchor1
    const b = 2 * anchor0 - 4 * control0 + 2 * control1
    const c = -anchor0 + control0

    if (Math.abs(a) < DISTANCE_EPSILON) {
      if (b !== 0) {
        const t = (2 * c) / (-2 * b)
        if (t >= 0 && t <= 1) includePoint(cubicPointOnCurve(cubic, t))
      }
      return
    }

    const discriminant = b * b - 4 * a * c
    if (discriminant < 0) return

    const sqrtDiscriminant = Math.sqrt(discriminant)
    const t1 = (-b + sqrtDiscriminant) / (2 * a)
    const t2 = (-b - sqrtDiscriminant) / (2 * a)
    if (t1 >= 0 && t1 <= 1) includePoint(cubicPointOnCurve(cubic, t1))
    if (t2 >= 0 && t2 <= 1) includePoint(cubicPointOnCurve(cubic, t2))
  }

  includeAxisExtrema(cubic.points[0], cubic.points[2], cubic.points[4], cubic.points[6])
  includeAxisExtrema(cubic.points[1], cubic.points[3], cubic.points[5], cubic.points[7])

  return { left: minX, top: minY, right: maxX, bottom: maxY }
}

export function mergeBounds(cubics: Cubic[], exact = false): Bounds {
  let left = Number.POSITIVE_INFINITY
  let top = Number.POSITIVE_INFINITY
  let right = Number.NEGATIVE_INFINITY
  let bottom = Number.NEGATIVE_INFINITY

  for (const cubic of cubics) {
    const bounds = calculateCubicBounds(cubic, exact)
    left = Math.min(left, bounds.left)
    top = Math.min(top, bounds.top)
    right = Math.max(right, bounds.right)
    bottom = Math.max(bottom, bounds.bottom)
  }

  return { left, top, right, bottom }
}

function createPolygon(features: Feature[], center: Point): RoundedPolygon {
  const cubics = flattenPolygonCubics(features, center)

  return { features, cubics, center }
}

function flattenPolygonCubics(features: Feature[], center: Point): Cubic[] {
  const cubics: Cubic[] = []
  let firstCubic: Cubic | null = null
  let lastCubic: Cubic | null = null
  let firstFeatureSplitStart: Cubic[] | null = null
  let firstFeatureSplitEnd: Cubic[] | null = null
  const firstFeature = features[0]

  if (firstFeature?.cubics.length === 3) {
    const centerCubic = firstFeature.cubics[1]
    const [start, end] = splitCubic(centerCubic, 0.5)
    firstFeatureSplitStart = [firstFeature.cubics[0], start]
    firstFeatureSplitEnd = [end, firstFeature.cubics[2]]
  }

  for (let index = 0; index <= features.length; index += 1) {
    let featureCubics: Cubic[] | null

    if (index === 0 && firstFeatureSplitEnd) {
      featureCubics = firstFeatureSplitEnd
    } else if (index === features.length) {
      featureCubics = firstFeatureSplitStart
    } else {
      featureCubics = features[index]?.cubics ?? null
    }

    if (!featureCubics) break

    for (const cubic of featureCubics) {
      if (!cubicZeroLength(cubic)) {
        if (lastCubic) cubics.push(lastCubic)
        lastCubic = cubic
        firstCubic ??= cubic
      } else if (lastCubic) {
        lastCubic = makeCubic(
          lastCubic.points[0],
          lastCubic.points[1],
          lastCubic.points[2],
          lastCubic.points[3],
          lastCubic.points[4],
          lastCubic.points[5],
          cubic.points[6],
          cubic.points[7],
        )
      }
    }
  }

  if (lastCubic && firstCubic) {
    cubics.push(
      makeCubic(
        lastCubic.points[0],
        lastCubic.points[1],
        lastCubic.points[2],
        lastCubic.points[3],
        lastCubic.points[4],
        lastCubic.points[5],
        firstCubic.points[0],
        firstCubic.points[1],
      ),
    )
  } else {
    cubics.push(makeCubic(center.x, center.y, center.x, center.y, center.x, center.y, center.x, center.y))
  }

  return cubics
}

function transformFeature(feature: Feature, transformPoint: (pointValue: Point) => Point): Feature {
  const cubics = feature.cubics.map((cubic) => transformCubic(cubic, transformPoint))

  return feature.kind === 'corner'
    ? { kind: 'corner', cubics, convex: feature.convex }
    : { kind: 'edge', cubics }
}

function transformPolygon(
  polygon: RoundedPolygon,
  transformPoint: (pointValue: Point) => Point,
): RoundedPolygon {
  return createPolygon(
    polygon.features.map((feature) => transformFeature(feature, transformPoint)),
    transformPoint(polygon.center),
  )
}

export function normalizePolygon(polygon: RoundedPolygon): RoundedPolygon {
  const bounds = mergeBounds(polygon.cubics)
  const width = bounds.right - bounds.left
  const height = bounds.bottom - bounds.top
  const side = Math.max(width, height)
  const offsetX = (side - width) / 2 - bounds.left
  const offsetY = (side - height) / 2 - bounds.top

  return transformPolygon(polygon, (pointValue) =>
    point((pointValue.x + offsetX) / side, (pointValue.y + offsetY) / side),
  )
}

function calculateMaxBounds(polygon: RoundedPolygon): Bounds {
  let maxDistSquared = 0

  for (const cubic of polygon.cubics) {
    const anchorDistance = distanceSquared(cubic.points[0] - polygon.center.x, cubic.points[1] - polygon.center.y)
    const middlePoint = cubicPointOnCurve(cubic, 0.5)
    const middleDistance = distanceSquared(middlePoint.x - polygon.center.x, middlePoint.y - polygon.center.y)
    maxDistSquared = Math.max(maxDistSquared, anchorDistance, middleDistance)
  }

  const maxDistance = Math.sqrt(maxDistSquared)

  return {
    left: polygon.center.x - maxDistance,
    top: polygon.center.y - maxDistance,
    right: polygon.center.x + maxDistance,
    bottom: polygon.center.y + maxDistance,
  }
}

export function calculateScaleFactor(polygons: RoundedPolygon[]) {
  let scaleFactor = 1

  for (const polygon of polygons) {
    const bounds = mergeBounds(polygon.cubics)
    const maxBounds = calculateMaxBounds(polygon)
    const scaleX = (bounds.right - bounds.left) / (maxBounds.right - maxBounds.left)
    const scaleY = (bounds.bottom - bounds.top) / (maxBounds.bottom - maxBounds.top)
    scaleFactor = Math.min(scaleFactor, Math.max(scaleX, scaleY))
  }

  return scaleFactor
}

export function createRoundedPolygon(
  vertices: Point[],
  roundingValue: CornerRounding = UNROUNDED,
  perVertexRounding?: CornerRounding[],
  center?: Point,
): RoundedPolygon {
  const n = vertices.length
  const roundedCorners = vertices.map((vertex, index) => {
    const prevVertex = vertices[(index + n - 1) % n]
    const nextVertex = vertices[(index + 1) % n]
    return createRoundedCorner(prevVertex, vertex, nextVertex, perVertexRounding?.[index] ?? roundingValue)
  })

  const cutAdjusts = vertices.map((vertex, index) => {
    const nextVertex = vertices[(index + 1) % n]
    const expectedRoundCut =
      roundedCorners[index].expectedRoundCut + roundedCorners[(index + 1) % n].expectedRoundCut
    const expectedCut = roundedCorners[index].expectedCut + roundedCorners[(index + 1) % n].expectedCut
    const sideSize = pointDistance(subtract(vertex, nextVertex))

    if (expectedRoundCut > sideSize) {
      return [sideSize / expectedRoundCut, 0] as const
    }

    if (expectedCut > sideSize) {
      return [1, (sideSize - expectedRoundCut) / (expectedCut - expectedRoundCut)] as const
    }

    return [1, 1] as const
  })

  const cornerCubics = roundedCorners.map((corner, index) => {
    const allowedCuts = [0, 1].map((delta) => {
      const [roundCutRatio, cutRatio] = cutAdjusts[(index + n - 1 + delta) % n]
      return (
        corner.expectedRoundCut * roundCutRatio +
        (corner.expectedCut - corner.expectedRoundCut) * cutRatio
      )
    })

    return corner.getCubics(allowedCuts[0], allowedCuts[1])
  })

  const features: Feature[] = []

  for (let index = 0; index < n; index += 1) {
    const prevVertex = vertices[(index + n - 1) % n]
    const currentVertex = vertices[index]
    const nextVertex = vertices[(index + 1) % n]
    const isConvex = convex(prevVertex, currentVertex, nextVertex)
    const currentCorner = cornerCubics[index]
    const nextCorner = cornerCubics[(index + 1) % n]
    features.push({ kind: 'corner', cubics: currentCorner, convex: isConvex })
    features.push({
      kind: 'edge',
      cubics: [
        cubicStraightLine(
          currentCorner[currentCorner.length - 1].points[6],
          currentCorner[currentCorner.length - 1].points[7],
          nextCorner[0].points[0],
          nextCorner[0].points[1],
        ),
      ],
    })
  }

  return createPolygon(features, center ?? calculateCenter(vertices))
}

function convex(previous: Point, current: Point, next: Point) {
  return clockwise(subtract(current, previous), subtract(next, current))
}

function calculateCenter(vertices: Point[]): Point {
  const total = vertices.reduce((accumulator, vertex) => add(accumulator, vertex), ZERO)

  return divide(total, vertices.length)
}

function createRoundedCorner(p0: Point, p1: Point, p2: Point, cornerRounding: CornerRounding) {
  const v01 = subtract(p0, p1)
  const v21 = subtract(p2, p1)
  const d01 = pointDistance(v01)
  const d21 = pointDistance(v21)
  let d1 = ZERO
  let d2 = ZERO
  let expectedRoundCut = 0

  if (d01 > 0 && d21 > 0) {
    d1 = divide(v01, d01)
    d2 = divide(v21, d21)
    const cosAngle = clamp(dotProduct(d1, d2), -1, 1)
    const sinAngle = Math.sqrt(Math.max(0, 1 - square(cosAngle)))
    expectedRoundCut =
      sinAngle > 1e-3 ? (cornerRounding.radius * (cosAngle + 1)) / sinAngle : 0
  }

  const expectedCut = (1 + cornerRounding.smoothing) * expectedRoundCut

  return {
    expectedRoundCut,
    expectedCut,
    getCubics(allowedCut0: number, allowedCut1 = allowedCut0): Cubic[] {
      const allowedCut = Math.min(allowedCut0, allowedCut1)

      if (
        expectedRoundCut < DISTANCE_EPSILON ||
        allowedCut < DISTANCE_EPSILON ||
        cornerRounding.radius < DISTANCE_EPSILON
      ) {
        return [cubicStraightLine(p1.x, p1.y, p1.x, p1.y)]
      }

      const actualRoundCut = Math.min(allowedCut, expectedRoundCut)
      const actualSmoothing0 = calculateActualSmoothingValue(allowedCut0, expectedRoundCut, expectedCut, cornerRounding)
      const actualSmoothing1 = calculateActualSmoothingValue(allowedCut1, expectedRoundCut, expectedCut, cornerRounding)
      const actualRadius = (cornerRounding.radius * actualRoundCut) / expectedRoundCut
      const centerDistance = Math.sqrt(square(actualRadius) + square(actualRoundCut))
      const center = add(p1, multiply(pointDirection(divide(add(d1, d2), 2)), centerDistance))
      const circleIntersection0 = add(p1, multiply(d1, actualRoundCut))
      const circleIntersection2 = add(p1, multiply(d2, actualRoundCut))
      const flanking0 = computeFlankingCurve(
        actualRoundCut,
        actualSmoothing0,
        p1,
        p0,
        circleIntersection0,
        circleIntersection2,
        center,
        actualRadius,
      )
      const flanking2 = reverseCubic(
        computeFlankingCurve(
          actualRoundCut,
          actualSmoothing1,
          p1,
          p2,
          circleIntersection2,
          circleIntersection0,
          center,
          actualRadius,
        ),
      )

      return [
        flanking0,
        cubicCircularArc(
          center.x,
          center.y,
          flanking0.points[6],
          flanking0.points[7],
          flanking2.points[0],
          flanking2.points[1],
        ),
        flanking2,
      ]
    },
  }
}

function calculateActualSmoothingValue(
  allowedCut: number,
  expectedRoundCut: number,
  expectedCut: number,
  cornerRounding: CornerRounding,
) {
  if (allowedCut > expectedCut) {
    return cornerRounding.smoothing
  }

  if (allowedCut > expectedRoundCut) {
    return (
      (cornerRounding.smoothing * (allowedCut - expectedRoundCut)) /
      (expectedCut - expectedRoundCut)
    )
  }

  return 0
}

function computeFlankingCurve(
  actualRoundCut: number,
  actualSmoothing: number,
  corner: Point,
  sideStart: Point,
  circleSegmentIntersection: Point,
  otherCircleSegmentIntersection: Point,
  circleCenter: Point,
  actualRadius: number,
): Cubic {
  const sideDirection = pointDirection(subtract(sideStart, corner))
  const curveStart = add(corner, multiply(sideDirection, actualRoundCut * (1 + actualSmoothing)))
  const p = interpolatePoint(
    circleSegmentIntersection,
    divide(add(circleSegmentIntersection, otherCircleSegmentIntersection), 2),
    actualSmoothing,
  )
  const curveEnd = add(
    circleCenter,
    multiply(directionVector(p.x - circleCenter.x, p.y - circleCenter.y), actualRadius),
  )
  const circleTangent = rotate90(subtract(curveEnd, circleCenter))
  const anchorEnd =
    lineIntersection(sideStart, sideDirection, curveEnd, circleTangent) ?? circleSegmentIntersection
  const anchorStart = divide(add(curveStart, multiply(anchorEnd, 2)), 3)

  return makeCubic(curveStart.x, curveStart.y, anchorStart.x, anchorStart.y, anchorEnd.x, anchorEnd.y, curveEnd.x, curveEnd.y)
}

function lineIntersection(p0: Point, d0: Point, p1: Point, d1: Point): Point | null {
  const rotatedD1 = rotate90(d1)
  const denominator = dotProduct(d0, rotatedD1)

  if (Math.abs(denominator) < DISTANCE_EPSILON) return null

  const numerator = dotProduct(subtract(p1, p0), rotatedD1)

  if (Math.abs(denominator) < DISTANCE_EPSILON * Math.abs(numerator)) return null

  return add(p0, multiply(d0, numerator / denominator))
}

function verticesFromNumVertices(
  numVertices: number,
  radius: number,
  centerX: number,
  centerY: number,
) {
  return Array.from({ length: numVertices }, (_, index) =>
    add(radialToCartesian(radius, (TWO_PI * index) / numVertices), point(centerX, centerY)),
  )
}

export function starVerticesFromNumVertices(
  numVerticesPerRadius: number,
  radius: number,
  innerRadius: number,
  centerX: number,
  centerY: number,
) {
  const vertices: Point[] = []

  for (let index = 0; index < numVerticesPerRadius; index += 1) {
    vertices.push(
      add(radialToCartesian(radius, (TWO_PI * index) / numVerticesPerRadius), point(centerX, centerY)),
      add(
        radialToCartesian(innerRadius, (PI * (2 * index + 1)) / numVerticesPerRadius),
        point(centerX, centerY),
      ),
    )
  }

  return vertices
}

function radialToCartesian(radius: number, angleRadians: number, center: Point = ZERO): Point {
  return add(multiply(directionVector(Math.cos(angleRadians), Math.sin(angleRadians)), radius), center)
}

function regularPolygon(
  numVertices: number,
  radius = 1,
  centerX = 0,
  centerY = 0,
  roundingValue: CornerRounding = UNROUNDED,
  perVertexRounding?: CornerRounding[],
) {
  return createRoundedPolygon(
    verticesFromNumVertices(numVertices, radius, centerX, centerY),
    roundingValue,
    perVertexRounding,
    point(centerX, centerY),
  )
}

export function circlePolygon(numVertices = 8, radius = 1, centerX = 0, centerY = 0) {
  const theta = PI / numVertices
  const polygonRadius = radius / Math.cos(theta)

  return regularPolygon(numVertices, polygonRadius, centerX, centerY, rounding(radius))
}

function starPolygon(
  numVerticesPerRadius: number,
  radius = 1,
  innerRadius = 0.5,
  roundingValue: CornerRounding = UNROUNDED,
  centerX = 0,
  centerY = 0,
) {
  return createRoundedPolygon(
    starVerticesFromNumVertices(numVerticesPerRadius, radius, innerRadius, centerX, centerY),
    roundingValue,
    undefined,
    point(centerX, centerY),
  )
}

export function rotatePointDegrees(pointValue: Point, degrees: number, center: Point = ZERO) {
  const angle = (degrees / 360) * TWO_PI
  const offset = subtract(pointValue, center)

  return add(
    point(
      offset.x * Math.cos(angle) - offset.y * Math.sin(angle),
      offset.x * Math.sin(angle) + offset.y * Math.cos(angle),
    ),
    center,
  )
}

function customPolygon(
  pointRounds: Array<{ point: Point; rounding: CornerRounding }>,
  reps: number,
  center: Point = point(0.5, 0.5),
  mirroring = false,
) {
  const actualPoints = repeatCustomPolygonPoints(pointRounds, reps, center, mirroring)

  return createRoundedPolygon(
    actualPoints.map((pointRound) => pointRound.point),
    UNROUNDED,
    actualPoints.map((pointRound) => pointRound.rounding),
    center,
  )
}

function repeatCustomPolygonPoints(
  pointRounds: Array<{ point: Point; rounding: CornerRounding }>,
  reps: number,
  center: Point,
  mirroring: boolean,
) {
  if (!mirroring) {
    return Array.from({ length: pointRounds.length * reps }, (_, index) => {
      const pointRound = pointRounds[index % pointRounds.length]
      return {
        point: rotatePointDegrees(pointRound.point, Math.floor(index / pointRounds.length) * (360 / reps), center),
        rounding: pointRound.rounding,
      }
    })
  }

  const angles = pointRounds.map((pointRound) => {
    const offset = subtract(pointRound.point, center)
    return (Math.atan2(offset.y, offset.x) * 180) / PI
  })
  const distances = pointRounds.map((pointRound) => pointDistance(subtract(pointRound.point, center)))
  const actualReps = reps * 2
  const sectionAngle = 360 / actualReps
  const repeatedPoints: Array<{ point: Point; rounding: CornerRounding }> = []

  for (let repIndex = 0; repIndex < actualReps; repIndex += 1) {
    for (let pointIndex = 0; pointIndex < pointRounds.length; pointIndex += 1) {
      const mirrored = repIndex % 2 === 1
      const sourceIndex = mirrored ? pointRounds.length - 1 - pointIndex : pointIndex

      if (sourceIndex > 0 || !mirrored) {
        const angle =
          (sectionAngle * repIndex +
            (mirrored
              ? sectionAngle - angles[sourceIndex] + 2 * angles[0]
              : angles[sourceIndex])) /
          360 *
          TWO_PI
        repeatedPoints.push({
          point: add(point(Math.cos(angle) * distances[sourceIndex], Math.sin(angle) * distances[sourceIndex]), center),
          rounding: pointRounds[sourceIndex].rounding,
        })
      }
    }
  }

  return repeatedPoints
}

export function materialSoftBurst() {
  return normalizePolygon(
    customPolygon(
      [
        { point: point(0.193, 0.277), rounding: rounding(0.053) },
        { point: point(0.176, 0.055), rounding: rounding(0.053) },
      ],
      10,
    ),
  )
}

export function materialCookie9Sided() {
  return normalizePolygon(transformPolygon(starPolygon(9, 1, 0.8, rounding(0.5)), (pointValue) =>
    rotatePointDegrees(pointValue, -90),
  ))
}

export function materialPentagon() {
  return normalizePolygon(
    customPolygon(
      [
        { point: point(0.5, -0.009), rounding: rounding(0.172) },
        { point: point(1.03, 0.365), rounding: rounding(0.164) },
        { point: point(0.828, 0.97), rounding: rounding(0.169) },
      ],
      1,
      point(0.5, 0.5),
      true,
    ),
  )
}

export function materialPill() {
  return normalizePolygon(
    customPolygon(
      [
        { point: point(0.961, 0.039), rounding: rounding(0.426) },
        { point: point(1.001, 0.428), rounding: UNROUNDED },
        { point: point(1, 0.609), rounding: rounding(1) },
      ],
      2,
      point(0.5, 0.5),
      true,
    ),
  )
}

export function materialSunny() {
  return normalizePolygon(starPolygon(8, 1, 0.8, rounding(0.15)))
}

export function materialCookie4Sided() {
  return normalizePolygon(
    customPolygon(
      [
        { point: point(1.237, 1.236), rounding: rounding(0.258) },
        { point: point(0.5, 0.918), rounding: rounding(0.233) },
      ],
      4,
    ),
  )
}

export function materialOval() {
  return normalizePolygon(
    transformPolygon(
      transformPolygon(circlePolygon(), (pointValue) => point(pointValue.x, pointValue.y * 0.64)),
      (pointValue) => rotatePointDegrees(pointValue, -45),
    ),
  )
}

function measureCubic(cubic: Cubic) {
  return closestProgressTo(cubic, Number.POSITIVE_INFINITY).distance
}

function findCubicCutPoint(cubic: Cubic, measure: number) {
  return closestProgressTo(cubic, measure).progress
}

function closestProgressTo(cubic: Cubic, threshold: number) {
  const segments = 3
  let total = 0
  let remainder = threshold
  let previous = cubicAnchor0(cubic)

  for (let index = 1; index <= segments; index += 1) {
    const progress = index / segments
    const curvePoint = cubicPointOnCurve(cubic, progress)
    const segment = pointDistance(subtract(curvePoint, previous))

    if (segment >= remainder) {
      return {
        progress: progress - (1 - remainder / segment) / segments,
        distance: threshold,
      }
    }

    remainder -= segment
    total += segment
    previous = curvePoint
  }

  return { progress: 1, distance: total }
}

function createMeasuredCubic(
  cubic: Cubic,
  startOutlineProgress: number,
  endOutlineProgress: number,
): MeasuredCubic {
  return {
    cubic,
    measuredSize: measureCubic(cubic),
    startOutlineProgress,
    endOutlineProgress,
  }
}

function measurePolygon(polygon: RoundedPolygon): MeasuredPolygon {
  const cubics: Cubic[] = []
  const featureToCubic: Array<[Feature, number]> = []

  for (const feature of polygon.features) {
    for (let cubicIndex = 0; cubicIndex < feature.cubics.length; cubicIndex += 1) {
      if (feature.kind === 'corner' && cubicIndex === Math.floor(feature.cubics.length / 2)) {
        featureToCubic.push([feature, cubics.length])
      }
      cubics.push(feature.cubics[cubicIndex])
    }
  }

  const measures = [0]
  for (const cubic of cubics) {
    measures.push(measures[measures.length - 1] + measureCubic(cubic))
  }

  const totalMeasure = measures[measures.length - 1]
  const outlineProgress = measures.map((measure) => measure / totalMeasure)
  const features = featureToCubic.map(([feature, cubicIndex]) => ({
    progress: positiveModulo((outlineProgress[cubicIndex] + outlineProgress[cubicIndex + 1]) / 2, 1),
    feature,
  }))

  return createMeasuredPolygon(cubics, features, outlineProgress)
}

function createMeasuredPolygon(
  cubics: Cubic[],
  features: ProgressableFeature[],
  outlineProgress: number[],
): MeasuredPolygon {
  const measuredCubics: MeasuredCubic[] = []
  let startOutlineProgress = 0

  for (let index = 0; index < cubics.length; index += 1) {
    if (outlineProgress[index + 1] - outlineProgress[index] > DISTANCE_EPSILON) {
      measuredCubics.push(createMeasuredCubic(cubics[index], startOutlineProgress, outlineProgress[index + 1]))
      startOutlineProgress = outlineProgress[index + 1]
    }
  }

  const lastMeasuredCubic = measuredCubics[measuredCubics.length - 1]
  if (lastMeasuredCubic) {
    lastMeasuredCubic.endOutlineProgress = 1
  }

  return { cubics: measuredCubics, features }
}

function cutMeasuredCubicAtProgress(
  measuredCubic: MeasuredCubic,
  cutOutlineProgress: number,
): [MeasuredCubic, MeasuredCubic] {
  const boundedCutOutlineProgress = clamp(
    cutOutlineProgress,
    measuredCubic.startOutlineProgress,
    measuredCubic.endOutlineProgress,
  )
  const outlineProgressSize =
    measuredCubic.endOutlineProgress - measuredCubic.startOutlineProgress
  const progressFromStart = boundedCutOutlineProgress - measuredCubic.startOutlineProgress
  const relativeProgress = progressFromStart / outlineProgressSize
  const t = findCubicCutPoint(measuredCubic.cubic, relativeProgress * measuredCubic.measuredSize)
  const [c1, c2] = splitCubic(measuredCubic.cubic, t)

  return [
    createMeasuredCubic(c1, measuredCubic.startOutlineProgress, boundedCutOutlineProgress),
    createMeasuredCubic(c2, boundedCutOutlineProgress, measuredCubic.endOutlineProgress),
  ]
}

function cutAndShift(measuredPolygon: MeasuredPolygon, cuttingPoint: number): MeasuredPolygon {
  if (cuttingPoint < DISTANCE_EPSILON) return measuredPolygon

  const targetIndex = measuredPolygon.cubics.findIndex(
    (cubic) =>
      cuttingPoint >= cubic.startOutlineProgress && cuttingPoint <= cubic.endOutlineProgress,
  )
  const target = measuredPolygon.cubics[targetIndex]
  const [beforeCut, afterCut] = cutMeasuredCubicAtProgress(target, cuttingPoint)
  const retCubics = [afterCut.cubic]

  for (let index = 1; index < measuredPolygon.cubics.length; index += 1) {
    retCubics.push(measuredPolygon.cubics[(index + targetIndex) % measuredPolygon.cubics.length].cubic)
  }

  retCubics.push(beforeCut.cubic)

  const retOutlineProgress = Array.from({ length: measuredPolygon.cubics.length + 2 }, (_, index) => {
    if (index === 0) return 0
    if (index === measuredPolygon.cubics.length + 1) return 1

    const cubicIndex = (targetIndex + index - 1) % measuredPolygon.cubics.length
    return positiveModulo(measuredPolygon.cubics[cubicIndex].endOutlineProgress - cuttingPoint, 1)
  })
  const features = measuredPolygon.features.map((feature) => ({
    progress: positiveModulo(feature.progress - cuttingPoint, 1),
    feature: feature.feature,
  }))

  return createMeasuredPolygon(retCubics, features, retOutlineProgress)
}

function progressInRange(progress: number, progressFrom: number, progressTo: number) {
  return progressTo >= progressFrom
    ? progress >= progressFrom && progress <= progressTo
    : progress >= progressFrom || progress <= progressTo
}

function linearMap(xValues: number[], yValues: number[], x: number) {
  const segmentStartIndex = xValues.findIndex((value, index) =>
    progressInRange(x, value, xValues[(index + 1) % xValues.length]),
  )
  const startIndex = segmentStartIndex >= 0 ? segmentStartIndex : xValues.length - 1
  const endIndex = (startIndex + 1) % xValues.length
  const segmentSizeX = positiveModulo(xValues[endIndex] - xValues[startIndex], 1)
  const segmentSizeY = positiveModulo(yValues[endIndex] - yValues[startIndex], 1)
  const positionInSegment =
    segmentSizeX < 0.001 ? 0.5 : positiveModulo(x - xValues[startIndex], 1) / segmentSizeX

  return positiveModulo(yValues[startIndex] + segmentSizeY * positionInSegment, 1)
}

function createDoubleMapper(mappings: Array<[number, number]>): DoubleMapper {
  return {
    sourceValues: mappings.map((mapping) => mapping[0]),
    targetValues: mappings.map((mapping) => mapping[1]),
  }
}

function doubleMap(mapper: DoubleMapper, x: number) {
  return linearMap(mapper.sourceValues, mapper.targetValues, x)
}

function doubleMapBack(mapper: DoubleMapper, x: number) {
  return linearMap(mapper.targetValues, mapper.sourceValues, x)
}

function progressDistance(progress1: number, progress2: number) {
  const distanceValue = Math.abs(progress1 - progress2)

  return Math.min(distanceValue, 1 - distanceValue)
}

function featureMapper(features1: ProgressableFeature[], features2: ProgressableFeature[]) {
  const filteredFeatures1 = features1.filter((feature) => feature.feature.kind === 'corner')
  const filteredFeatures2 = features2.filter((feature) => feature.feature.kind === 'corner')

  return createDoubleMapper(doFeatureMapping(filteredFeatures1, filteredFeatures2))
}

function doFeatureMapping(features1: ProgressableFeature[], features2: ProgressableFeature[]) {
  const distanceVertices = features1
    .flatMap((feature1) =>
      features2.map((feature2) => ({
        distance: featureDistanceSquared(feature1.feature, feature2.feature),
        feature1,
        feature2,
      })),
    )
    .filter((vertex) => vertex.distance !== Number.POSITIVE_INFINITY)
    .sort((a, b) => a.distance - b.distance)

  if (distanceVertices.length === 0) return [[0, 0], [0.5, 0.5]] as Array<[number, number]>

  if (distanceVertices.length === 1) {
    const feature1 = distanceVertices[0].feature1.progress
    const feature2 = distanceVertices[0].feature2.progress
    return [
      [feature1, feature2],
      [(feature1 + 0.5) % 1, (feature2 + 0.5) % 1],
    ] as Array<[number, number]>
  }

  const mapping: Array<[number, number]> = []
  const usedFeature1 = new Set<ProgressableFeature>()
  const usedFeature2 = new Set<ProgressableFeature>()

  for (const distanceVertex of distanceVertices) {
    if (usedFeature1.has(distanceVertex.feature1) || usedFeature2.has(distanceVertex.feature2)) {
      continue
    }

    const insertionIndex = sortedInsertionIndex(mapping, distanceVertex.feature1.progress)
    const n = mapping.length

    if (n >= 1) {
      const before = mapping[(insertionIndex + n - 1) % n]
      const after = mapping[insertionIndex % n]

      if (
        progressDistance(distanceVertex.feature1.progress, before[0]) < DISTANCE_EPSILON ||
        progressDistance(distanceVertex.feature1.progress, after[0]) < DISTANCE_EPSILON ||
        progressDistance(distanceVertex.feature2.progress, before[1]) < DISTANCE_EPSILON ||
        progressDistance(distanceVertex.feature2.progress, after[1]) < DISTANCE_EPSILON
      ) {
        continue
      }

      if (n > 1 && !progressInRange(distanceVertex.feature2.progress, before[1], after[1])) {
        continue
      }
    }

    mapping.splice(insertionIndex, 0, [
      distanceVertex.feature1.progress,
      distanceVertex.feature2.progress,
    ])
    usedFeature1.add(distanceVertex.feature1)
    usedFeature2.add(distanceVertex.feature2)
  }

  return mapping
}

function sortedInsertionIndex(mapping: Array<[number, number]>, progress: number) {
  let low = 0
  let high = mapping.length

  while (low < high) {
    const middle = Math.floor((low + high) / 2)
    if (mapping[middle][0] < progress) {
      low = middle + 1
    } else {
      high = middle
    }
  }

  return low
}

function featureDistanceSquared(feature1: Feature, feature2: Feature) {
  if (
    feature1.kind === 'corner' &&
    feature2.kind === 'corner' &&
    feature1.convex !== feature2.convex
  ) {
    return Number.POSITIVE_INFINITY
  }

  return pointDistanceSquared(subtract(featureRepresentativePoint(feature1), featureRepresentativePoint(feature2)))
}

function pointDistanceSquared(pointValue: Point) {
  return pointValue.x * pointValue.x + pointValue.y * pointValue.y
}

function featureRepresentativePoint(feature: Feature) {
  const firstCubic = feature.cubics[0]
  const lastCubic = feature.cubics[feature.cubics.length - 1]

  return point(
    (firstCubic.points[0] + lastCubic.points[6]) / 2,
    (firstCubic.points[1] + lastCubic.points[7]) / 2,
  )
}

export function createMorph(start: RoundedPolygon, end: RoundedPolygon): Morph {
  return { matches: matchMorph(normalizePolygon(start), normalizePolygon(end)) }
}

function matchMorph(start: RoundedPolygon, end: RoundedPolygon) {
  const measuredPolygon1 = measurePolygon(start)
  const measuredPolygon2 = measurePolygon(end)
  const doubleMapper = featureMapper(measuredPolygon1.features, measuredPolygon2.features)
  const polygon2CutPoint = doubleMap(doubleMapper, 0)
  const shiftedPolygon2 = cutAndShift(measuredPolygon2, polygon2CutPoint)
  const matches: Array<[Cubic, Cubic]> = []
  let index1 = 0
  let index2 = 0
  let measuredCubic1 = measuredPolygon1.cubics[index1++]
  let measuredCubic2 = shiftedPolygon2.cubics[index2++]

  while (measuredCubic1 && measuredCubic2) {
    const endProgress1 =
      index1 === measuredPolygon1.cubics.length ? 1 : measuredCubic1.endOutlineProgress
    const endProgress2 =
      index2 === shiftedPolygon2.cubics.length
        ? 1
        : doubleMapBack(
            doubleMapper,
            positiveModulo(measuredCubic2.endOutlineProgress + polygon2CutPoint, 1),
          )
    const minProgress = Math.min(endProgress1, endProgress2)
    let segment1 = measuredCubic1
    let segment2 = measuredCubic2

    if (endProgress1 > minProgress + ANGLE_EPSILON) {
      const [cutSegment, remainingSegment] = cutMeasuredCubicAtProgress(measuredCubic1, minProgress)
      segment1 = cutSegment
      measuredCubic1 = remainingSegment
    } else {
      measuredCubic1 = measuredPolygon1.cubics[index1++]
    }

    if (endProgress2 > minProgress + ANGLE_EPSILON) {
      const [cutSegment, remainingSegment] = cutMeasuredCubicAtProgress(
        measuredCubic2,
        positiveModulo(doubleMap(doubleMapper, minProgress) - polygon2CutPoint, 1),
      )
      segment2 = cutSegment
      measuredCubic2 = remainingSegment
    } else {
      measuredCubic2 = shiftedPolygon2.cubics[index2++]
    }

    matches.push([segment1.cubic, segment2.cubic])
  }

  if (measuredCubic1 || measuredCubic2) {
    throw new Error("Expected both loading indicator polygons to be fully matched")
  }

  return matches
}

export function morphAsCubics(morph: Morph, progress: number) {
  const cubics: Cubic[] = []
  let firstCubic: Cubic | null = null
  let lastCubic: Cubic | null = null

  for (const [start, end] of morph.matches) {
    const cubic = interpolateCubic(start, end, progress)
    firstCubic ??= cubic
    if (lastCubic) cubics.push(lastCubic)
    lastCubic = cubic
  }

  if (lastCubic && firstCubic) {
    cubics.push(
      makeCubic(
        lastCubic.points[0],
        lastCubic.points[1],
        lastCubic.points[2],
        lastCubic.points[3],
        lastCubic.points[4],
        lastCubic.points[5],
        firstCubic.points[0],
        firstCubic.points[1],
      ),
    )
  }

  return cubics
}

