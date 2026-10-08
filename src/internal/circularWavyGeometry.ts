/*
 * CircularShapes and ShapeUtil are adapted from AndroidX Material3 and graphics-shapes.
 * Copyright 2022-2026 The Android Open Source Project
 * Licensed under the Apache License, Version 2.0. See docs/component-fidelity.md.
 */
import {
  circlePolygon, createMorph, createRoundedPolygon, cubicPointOnCurve,
  mergeBounds, morphAsCubics, point, rotatePointDegrees,
  rounding, starVerticesFromNumVertices, transformCubic, type Cubic,
} from './materialShapeGeometry'

const morphs = new Map<number, ReturnType<typeof createMorph>>()
const format = (n: number) => Number(n.toFixed(4)).toString()

export function circularWavyGeometry(size: number, strokeWidth: number, waves: number, amplitude: number) {
  let morph = morphs.get(waves)
  if (!morph) {
    const vertices = starVerticesFromNumVertices(waves, 1, 0.75, 0, 0)
    const polygon = createRoundedPolygon(vertices, rounding(0.35, 0.4),
      vertices.map((_, i) => i % 2 === 0 ? rounding(0.35, 0.4) : rounding(0.5)))
    morph = createMorph(circlePolygon(waves), polygon)
    morphs.set(waves, morph)
  }
  let cubics = morphAsCubics(morph, amplitude)
  const first = cubics[0].points
  const angle = Math.atan2(first[1] - 0.5, first[0] - 0.5) * 180 / Math.PI
  cubics = cubics.map(c => transformCubic(c, p => rotatePointDegrees(p, 270 - angle, point(0.5, 0.5))))
  cubics = cubics.map(c => transformCubic(c, p => point(p.x * (size - strokeWidth), p.y * (size - strokeWidth))))
  const bounds = mergeBounds(cubics)
  cubics = cubics.map(c => transformCubic(c, p => point(
    p.x + size / 2 - (bounds.left + bounds.right) / 2,
    p.y + size / 2 - (bounds.top + bounds.bottom) / 2,
  )))
  return { path: pathFromCubics(cubics), length: cubicLength(cubics) }
}

function cubicLength(cubics: Cubic[]) {
  let length = 0
  for (const cubic of cubics) {
    let previous = cubicPointOnCurve(cubic, 0)
    for (let i = 1; i <= 32; i++) {
      const next = cubicPointOnCurve(cubic, i / 32)
      length += Math.hypot(next.x - previous.x, next.y - previous.y)
      previous = next
    }
  }
  return length
}

function pathFromCubics(cubics: Cubic[]) {
  const first = cubics[0].points
  return [`M ${format(first[0])} ${format(first[1])}`, ...cubics.map(({points:p}) =>
    `C ${p.slice(2).map(format).join(' ')}`), 'Z'].join(' ')
}
