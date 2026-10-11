/* AndroidX ColorVectorConverter animates alpha and Oklab channels. Apache-2.0.
 * Copyright 2019-2026 The Android Open Source Project. */
export type RadioColor = readonly [number, number, number, number]

/** Reads resolved CSS colors. Relative color syntax normalizes other browser color spaces. */
export function readRadioColor(element: HTMLElement, normalize = true): RadioColor | null {
  const color = getComputedStyle(element).color
  const lab = color.match(/^oklab\(([^)]+)\)$/)
  if (lab) {
    const values = lab[1].replace('/', ' ').trim().split(/\s+/)
    const channel = (value: string, percentScale: number) => parseFloat(value) * (value.endsWith('%') ? percentScale / 100 : 1)
    return [channel(values[0], 1), channel(values[1], 0.4), channel(values[2], 0.4), values[3] ? channel(values[3], 1) : 1]
  }
  const rgb = color.match(/^rgba?\(([^)]+)\)$/)
  if (rgb) {
    const values = rgb[1].replace(/[,/]/g, ' ').trim().split(/\s+/)
    const channels = values.slice(0, 3).map(value => {
      const srgb = parseFloat(value) / (value.endsWith('%') ? 100 : 255)
      return srgb <= 0.04045 ? srgb / 12.92 : ((srgb + 0.055) / 1.055) ** 2.4
    })
    const [r, g, b] = channels
    const l = Math.cbrt(0.4122214708 * r + 0.5363325363 * g + 0.0514459929 * b)
    const m = Math.cbrt(0.2119034982 * r + 0.6806995451 * g + 0.1073969566 * b)
    const s = Math.cbrt(0.0883024619 * r + 0.2817188376 * g + 0.6299787005 * b)
    const alpha = values[3] ? parseFloat(values[3]) / (values[3].endsWith('%') ? 100 : 1) : 1
    return [0.2104542553 * l + 0.793617785 * m - 0.0040720468 * s,
      1.9779984951 * l - 2.428592205 * m + 0.4505937099 * s,
      0.0259040371 * l + 0.7827717662 * m - 0.808675766 * s, alpha]
  }
  if (normalize && color && typeof CSS !== 'undefined' && typeof CSS.supports === 'function' && CSS.supports('color', `oklab(from ${color} l a b / alpha)`)) {
    const previous = element.style.color
    element.style.color = `oklab(from ${color} l a b / alpha)`
    const normalized = readRadioColor(element, false)
    element.style.color = previous
    return normalized
  }
  return null
}

export function radioColorCss(color: RadioColor): string {
  const clamp = (value: number, min: number, max: number) => Math.min(max, Math.max(min, value))
  return `oklab(${clamp(color[0], 0, 1)} ${clamp(color[1], -0.5, 0.5)} ${clamp(color[2], -0.5, 0.5)} / ${clamp(color[3], 0, 1)})`
}
