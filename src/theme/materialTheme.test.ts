import { describe, expect, it } from 'vitest'
import { argbFromHex, Hct } from '@material/material-color-utilities'
import {
  createMaterialColorScheme,
  createMaterialFidelityColorScheme,
  createMaterialFidelityThemeCssVariables,
  createMaterialThemeCssVariables,
  materialColorRoleNames,
  materialReferencePaletteTones,
} from './materialTheme'

const seed = { primary: '#5b8f34', secondary: '#b8e48d' }

describe('Material theme generation', () => {
  it('generates Material 3 light color roles from a seed', () => {
    const scheme = createMaterialColorScheme(seed)

    expect(scheme.sourceColor).toBe('#5b8f34')
    expect(scheme.accentSoftColor).toBe('#b8e48d')
    expect(scheme.colors).toMatchObject({
      primary: '#396a11',
      onPrimary: '#ffffff',
      primaryContainer: '#b8f38b',
      secondary: '#56624b',
      tertiary: '#386665',
      surface: '#fafaf2',
      onSurface: '#1a1c18',
      accentSoft: '#3f6919',
      accentSoftContainer: '#bff291',
    })
  })

  it('generates fidelity palettes', () => {
    const scheme = createMaterialFidelityColorScheme(seed)

    expect(scheme.colors).toMatchObject({
      primary: '#37680e',
      primaryContainer: '#4e8128',
      secondary: '#4f653d',
      tertiary: '#933b75',
    })
    expect(scheme.referencePalettes.tertiary[90]).toBe('#ffd8eb')
  })

  it.each(['light', 'dark'] as const)('keeps %s page and container surfaces on the current AndroidX tone ladder', (mode) => {
    const { colors } = createMaterialColorScheme(seed, mode)
    const tones = mode === 'light'
      ? { background: 98, surface: 98, surfaceDim: 87, surfaceBright: 98, surfaceContainerLowest: 100, surfaceContainerLow: 96, surfaceContainer: 94, surfaceContainerHigh: 92, surfaceContainerHighest: 90 }
      : { background: 6, surface: 6, surfaceDim: 6, surfaceBright: 24, surfaceContainerLowest: 4, surfaceContainerLow: 10, surfaceContainer: 12, surfaceContainerHigh: 17, surfaceContainerHighest: 22 }
    for (const [role, tone] of Object.entries(tones)) {
      expect(Math.abs(Hct.fromInt(argbFromHex(colors[role])).tone - tone)).toBeLessThan(0.3)
    }
    expect(colors.background).toBe(colors.surface)
    expect(colors.surfaceContainer).not.toBe(colors.surface)
    expect(colors.surfaceContainerHighest).not.toBe(colors.surfaceContainer)
  })

  it('emits public Material and library CSS variables', () => {
    expect(createMaterialThemeCssVariables(seed)).toMatchObject({
      '--mrc-theme-source-color': '#5b8f34',
      '--mrc-theme-accent-soft-source-color': '#b8e48d',
      '--mrc-color-accent-soft': '#3f6919',
      '--md-sys-color-primary': '#396a11',
      '--md-sys-color-surface-container': '#eeeee7',
      '--md-ref-palette-primary-primary40': '#396a11',
    })
  })

  it('emits all supported roles and reference tones', () => {
    const variables = createMaterialFidelityThemeCssVariables(seed, 'dark')

    for (const roleName of materialColorRoleNames) {
      const token = roleName.replace(/[A-Z]/g, (match) => `-${match.toLowerCase()}`)
      expect(variables[`--md-sys-color-${token}`]).toMatch(/^#[0-9a-f]{6}$/)
    }

    for (const tone of materialReferencePaletteTones) {
      expect(variables[`--md-ref-palette-primary-primary${tone}`]).toMatch(/^#[0-9a-f]{6}$/)
    }
  })

  it('normalizes shorthand and missing hash seed colors', () => {
    const short = createMaterialColorScheme({ primary: '#583', secondary: 'be8' })
    const full = createMaterialColorScheme({ primary: '#558833', secondary: '#bbee88' })

    expect(short.sourceColor).toBe('#558833')
    expect(short.accentSoftColor).toBe('#bbee88')
    expect(short.colors.primary).toBe(full.colors.primary)
  })
})
