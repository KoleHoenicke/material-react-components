/* Adapted from AndroidX SearchBar.kt. Apache-2.0. See docs/search.md. */
export type SearchBounds = { left: number; top: number; width: number; height: number }
export type SearchPresentation = 'full-screen' | 'contained' | 'docked' | 'docked-with-gap'
const lerp = (a: number, b: number, p: number) => a + (b - a) * p
export function searchGeometry(
  anchor: SearchBounds, viewport: SearchBounds, progress: number,
  presentation: SearchPresentation, contentHeight: number, topInset = 0,
  bottomInset = 0, gap = 2,
) {
  const p = Math.min(1, Math.max(0, progress))
  const full = presentation === 'full-screen' || presentation === 'contained'
  const contained = presentation === 'contained'
  const hasGap = presentation === 'docked-with-gap'
  const headerHeight = anchor.height || 56
  if (full) {
    const surface = contained ? viewport : {
      left: lerp(anchor.left, viewport.left, p), top: lerp(anchor.top, viewport.top, p),
      width: lerp(anchor.width, viewport.width, p), height: lerp(headerHeight, viewport.height, p),
    }
    const inputWidth = lerp(anchor.width, viewport.width - (contained ? 16 : 0), p)
    const center = lerp(anchor.left + anchor.width / 2, surface.left + surface.width / 2, p)
    const input = { left: center - inputWidth / 2, top: lerp(anchor.top, viewport.top, p) + (topInset + (contained ? 4 : 8)) * p, width: inputWidth, height: headerHeight }
    const contentTop = input.top + headerHeight + (contained ? 8 : 8 * p)
    return { surface, input, content: { left: surface.left, top: contentTop, width: surface.width, height: Math.max(0, surface.height - (contentTop - surface.top) - bottomInset) }, radius: 28 * (1 - p) }
  }
  const maximum = viewport.height * (hasGap ? 1 / 2 : 2 / 3)
  const minHeight = Math.min(240, maximum)
  const desired = Math.min(maximum, Math.max(minHeight, headerHeight + contentHeight + (hasGap ? gap : 1)))
  const available = Math.max(headerHeight, viewport.top + viewport.height - Math.max(viewport.top, anchor.top) - bottomInset)
  const height = Math.min(available, lerp(headerHeight, desired, p))
  const width = Math.min(anchor.width, viewport.width)
  const left = Math.max(viewport.left, Math.min(anchor.left, viewport.left + viewport.width - width))
  const top = Math.max(viewport.top, Math.min(anchor.top, viewport.top + viewport.height - height))
  const surface = { left, top, width, height }
  return { surface, input: { left, top, width, height: headerHeight }, content: { left, top: top + headerHeight + (hasGap ? gap : 0), width, height: Math.max(0, height - headerHeight - (hasGap ? gap : 0)) }, radius: 28 }
}
/** Evaluate a CSS cubic bezier by solving its time coordinate, rather than using t as x. */
export function searchEasing(time: number, points: readonly [number, number, number, number]) {
  const x = Math.min(1, Math.max(0, time))
  const [x1, y1, x2, y2] = points
  const cubic = (t: number, a: number, b: number) => 3 * (1 - t) ** 2 * t * a + 3 * (1 - t) * t * t * b + t ** 3
  let lo = 0, hi = 1
  for (let i = 0; i < 24; i++) { const t = (lo + hi) / 2; if (cubic(t, x1, x2) < x) lo = t; else hi = t }
  return x === 0 || x === 1 ? x : cubic((lo + hi) / 2, y1, y2)
}
