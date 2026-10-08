import {
  argbFromHex,
  customColor,
  hexFromArgb,
  Hct,
  SchemeFidelity,
  themeFromSourceColor,
  type ColorGroup,
  type DynamicScheme,
  type TonalPalette,
  type Theme,
} from '@material/material-color-utilities'

export type MaterialThemeMode = 'light' | 'dark'
export type MaterialPaletteName = keyof Theme['palettes']

export interface MaterialThemeSeed {
  primary: string
  secondary?: string
}

export interface MaterialColorScheme {
  mode: MaterialThemeMode
  sourceColor: string
  accentSoftColor: string
  colors: Record<string, string>
  referencePalettes: Record<MaterialPaletteName, Record<number, string>>
  cssVariables: Record<string, string>
}

const DEFAULT_SOURCE_COLOR = '#5b8f34'
const CUSTOM_ACCENT_SOFT_NAME = 'accent-soft'

const MATERIAL_BASE_SCHEME_ROLES = [
  'primary',
  'onPrimary',
  'primaryContainer',
  'onPrimaryContainer',
  'secondary',
  'onSecondary',
  'secondaryContainer',
  'onSecondaryContainer',
  'tertiary',
  'onTertiary',
  'tertiaryContainer',
  'onTertiaryContainer',
  'error',
  'onError',
  'errorContainer',
  'onErrorContainer',
  'background',
  'onBackground',
  'surface',
  'onSurface',
  'surfaceVariant',
  'onSurfaceVariant',
  'outline',
  'outlineVariant',
  'shadow',
  'scrim',
  'inverseSurface',
  'inverseOnSurface',
  'inversePrimary',
] as const

const MATERIAL_GENERATED_SCHEME_ROLES = [
  ...MATERIAL_BASE_SCHEME_ROLES,
  'surfaceTint',
  'surfaceDim',
  'surfaceBright',
  'surfaceContainerLowest',
  'surfaceContainerLow',
  'surfaceContainer',
  'surfaceContainerHigh',
  'surfaceContainerHighest',
  'primaryFixed',
  'primaryFixedDim',
  'onPrimaryFixed',
  'onPrimaryFixedVariant',
  'secondaryFixed',
  'secondaryFixedDim',
  'onSecondaryFixed',
  'onSecondaryFixedVariant',
  'tertiaryFixed',
  'tertiaryFixedDim',
  'onTertiaryFixed',
  'onTertiaryFixedVariant',
] as const

export const materialColorRoleNames = MATERIAL_GENERATED_SCHEME_ROLES

export const materialReferencePaletteTones = [
  0,
  4,
  6,
  10,
  12,
  17,
  20,
  22,
  24,
  25,
  30,
  35,
  40,
  50,
  60,
  70,
  80,
  87,
  90,
  92,
  94,
  95,
  96,
  98,
  99,
  100,
] as const

const FIXED_ROLE_TONES = {
  primaryFixed: ['primary', 90],
  primaryFixedDim: ['primary', 80],
  onPrimaryFixed: ['primary', 10],
  onPrimaryFixedVariant: ['primary', 30],
  secondaryFixed: ['secondary', 90],
  secondaryFixedDim: ['secondary', 80],
  onSecondaryFixed: ['secondary', 10],
  onSecondaryFixedVariant: ['secondary', 30],
  tertiaryFixed: ['tertiary', 90],
  tertiaryFixedDim: ['tertiary', 80],
  onTertiaryFixed: ['tertiary', 10],
  onTertiaryFixedVariant: ['tertiary', 30],
} as const

const SURFACE_ROLE_TONES = {
  light: {
    background: 98,
    surface: 98,
    surfaceDim: 87,
    surfaceBright: 98,
    surfaceContainerLowest: 100,
    surfaceContainerLow: 96,
    surfaceContainer: 94,
    surfaceContainerHigh: 92,
    surfaceContainerHighest: 90,
  },
  dark: {
    background: 6,
    surface: 6,
    surfaceDim: 6,
    surfaceBright: 24,
    surfaceContainerLowest: 4,
    surfaceContainerLow: 10,
    surfaceContainer: 12,
    surfaceContainerHigh: 17,
    surfaceContainerHighest: 22,
  },
} as const

const MATERIAL_REFERENCE_PALETTE_ORDER = [
  'primary',
  'secondary',
  'tertiary',
  'neutral',
  'neutralVariant',
  'error',
] as const satisfies readonly MaterialPaletteName[]

function normalizeHexColor(value: string | undefined, fallback = DEFAULT_SOURCE_COLOR) {
  const normalizedValue = value?.trim()

  if (!normalizedValue) {
    return fallback
  }

  const hex = normalizedValue.startsWith('#') ? normalizedValue.slice(1) : normalizedValue

  if (/^[0-9a-f]{6}$/i.test(hex)) {
    return `#${hex.toLowerCase()}`
  }

  if (/^[0-9a-f]{3}$/i.test(hex)) {
    return `#${hex
      .split('')
      .map((digit) => `${digit}${digit}`)
      .join('')
      .toLowerCase()}`
  }

  return fallback
}

function materialRoleToCssVariable(role: string) {
  return `--md-sys-color-${role.replace(/[A-Z]/g, (match) => `-${match.toLowerCase()}`)}`
}

function materialPaletteToCssVariable(paletteName: string, tone: number) {
  const paletteToken = paletteName.replace(/[A-Z]/g, (match) => `-${match.toLowerCase()}`)

  return `--md-ref-palette-${paletteToken}-${paletteToken}${tone}`
}

function colorGroupToHexColors(group: ColorGroup) {
  return {
    color: hexFromArgb(group.color),
    onColor: hexFromArgb(group.onColor),
    colorContainer: hexFromArgb(group.colorContainer),
    onColorContainer: hexFromArgb(group.onColorContainer),
  }
}

function generatedTheme(seed: Required<MaterialThemeSeed>) {
  return themeFromSourceColor(argbFromHex(seed.primary), [
    {
      name: CUSTOM_ACCENT_SOFT_NAME,
      value: argbFromHex(seed.secondary),
      blend: true,
    },
  ])
}

function addCustomAccentSoftColors(
  colors: Record<string, string>,
  sourceColorArgb: number,
  accentSoftArgb: number,
  mode: MaterialThemeMode,
) {
  const group = customColor(sourceColorArgb, {
    name: CUSTOM_ACCENT_SOFT_NAME,
    value: accentSoftArgb,
    blend: true,
  })
  const groupColors = colorGroupToHexColors(group[mode])

  colors.accentSoft = groupColors.color
  colors.onAccentSoft = groupColors.onColor
  colors.accentSoftContainer = groupColors.colorContainer
  colors.onAccentSoftContainer = groupColors.onColorContainer
}

function generatedSchemeColors(theme: Theme, mode: MaterialThemeMode) {
  const schemeJson = theme.schemes[mode].toJSON()
  const colors: Record<string, string> = {}

  for (const role of MATERIAL_BASE_SCHEME_ROLES) {
    colors[role] = hexFromArgb(schemeJson[role])
  }

  colors.surfaceTint = colors.primary

  for (const [role, [paletteName, tone]] of Object.entries(FIXED_ROLE_TONES)) {
    colors[role] = hexFromArgb(theme.palettes[paletteName].tone(tone))
  }

  for (const [role, tone] of Object.entries(SURFACE_ROLE_TONES[mode])) {
    colors[role] = hexFromArgb(theme.palettes.neutral.tone(tone))
  }

  const accentSoftGroup = theme.customColors.find(
    (group) => group.color.name === CUSTOM_ACCENT_SOFT_NAME,
  )

  if (accentSoftGroup) {
    const groupColors = colorGroupToHexColors(accentSoftGroup[mode])

    colors.accentSoft = groupColors.color
    colors.onAccentSoft = groupColors.onColor
    colors.accentSoftContainer = groupColors.colorContainer
    colors.onAccentSoftContainer = groupColors.onColorContainer
  }

  return colors
}

function generatedDynamicSchemeColors(
  scheme: DynamicScheme,
  sourceColorArgb: number,
  accentSoftArgb: number,
  mode: MaterialThemeMode,
) {
  const colors: Record<string, string> = {}
  const roleValues = scheme as unknown as Record<string, number>

  for (const role of MATERIAL_GENERATED_SCHEME_ROLES) {
    colors[role] = hexFromArgb(roleValues[role])
  }

  addCustomAccentSoftColors(colors, sourceColorArgb, accentSoftArgb, mode)

  return colors
}

function generatedReferencePaletteColors(theme: Theme) {
  const palettes = {} as Record<MaterialPaletteName, Record<number, string>>

  for (const paletteName of MATERIAL_REFERENCE_PALETTE_ORDER) {
    const palette = theme.palettes[paletteName] as TonalPalette
    const toneColors: Record<number, string> = {}

    for (const tone of materialReferencePaletteTones) {
      toneColors[tone] = hexFromArgb(palette.tone(tone))
    }

    palettes[paletteName] = toneColors
  }

  return palettes
}

function generatedDynamicReferencePaletteColors(scheme: DynamicScheme) {
  const dynamicPalettes = {
    primary: scheme.primaryPalette,
    secondary: scheme.secondaryPalette,
    tertiary: scheme.tertiaryPalette,
    neutral: scheme.neutralPalette,
    neutralVariant: scheme.neutralVariantPalette,
    error: scheme.errorPalette,
  } as const satisfies Record<MaterialPaletteName, TonalPalette>
  const palettes = {} as Record<MaterialPaletteName, Record<number, string>>

  for (const paletteName of MATERIAL_REFERENCE_PALETTE_ORDER) {
    const palette = dynamicPalettes[paletteName]
    const toneColors: Record<number, string> = {}

    for (const tone of materialReferencePaletteTones) {
      toneColors[tone] = hexFromArgb(palette.tone(tone))
    }

    palettes[paletteName] = toneColors
  }

  return palettes
}

function colorsToCssVariables(colors: Record<string, string>) {
  const cssVariables: Record<string, string> = {}

  for (const [role, color] of Object.entries(colors)) {
    const variableRole = role.replace(/[A-Z]/g, (match) => `-${match.toLowerCase()}`)
    const variableName = role.toLowerCase().includes('accentsoft')
      ? `--mrc-color-${variableRole}`
      : materialRoleToCssVariable(role)

    cssVariables[variableName] = color
  }

  return cssVariables
}

function referencePalettesToCssVariables(
  palettes: Record<MaterialPaletteName, Record<number, string>>,
) {
  const cssVariables: Record<string, string> = {}

  for (const paletteName of MATERIAL_REFERENCE_PALETTE_ORDER) {
    for (const [tone, color] of Object.entries(palettes[paletteName])) {
      cssVariables[materialPaletteToCssVariable(paletteName, Number(tone))] = color
    }
  }

  return cssVariables
}

export function createMaterialColorScheme(
  seed: MaterialThemeSeed,
  mode: MaterialThemeMode = 'light',
): MaterialColorScheme {
  const normalizedSeed = {
    primary: normalizeHexColor(seed.primary),
    secondary: normalizeHexColor(seed.secondary, normalizeHexColor(seed.primary)),
  }
  const theme = generatedTheme(normalizedSeed)
  const colors = generatedSchemeColors(theme, mode)
  const referencePalettes = generatedReferencePaletteColors(theme)

  return {
    mode,
    sourceColor: normalizedSeed.primary,
    accentSoftColor: normalizedSeed.secondary,
    colors,
    referencePalettes,
    cssVariables: {
      '--mrc-theme-source-color': normalizedSeed.primary,
      '--mrc-theme-accent-soft-source-color': normalizedSeed.secondary,
      ...referencePalettesToCssVariables(referencePalettes),
      ...colorsToCssVariables(colors),
    },
  }
}

export function createMaterialFidelityColorScheme(
  seed: MaterialThemeSeed,
  mode: MaterialThemeMode = 'light',
): MaterialColorScheme {
  const normalizedSeed = {
    primary: normalizeHexColor(seed.primary),
    secondary: normalizeHexColor(seed.secondary, normalizeHexColor(seed.primary)),
  }
  const sourceColorArgb = argbFromHex(normalizedSeed.primary)
  const accentSoftArgb = argbFromHex(normalizedSeed.secondary)
  const scheme = new SchemeFidelity(Hct.fromInt(sourceColorArgb), mode === 'dark', 0)
  const colors = generatedDynamicSchemeColors(scheme, sourceColorArgb, accentSoftArgb, mode)
  const referencePalettes = generatedDynamicReferencePaletteColors(scheme)

  return {
    mode,
    sourceColor: normalizedSeed.primary,
    accentSoftColor: normalizedSeed.secondary,
    colors,
    referencePalettes,
    cssVariables: {
      '--mrc-theme-source-color': normalizedSeed.primary,
      '--mrc-theme-accent-soft-source-color': normalizedSeed.secondary,
      ...referencePalettesToCssVariables(referencePalettes),
      ...colorsToCssVariables(colors),
    },
  }
}

export function createMaterialThemeCssVariables(
  seed: MaterialThemeSeed,
  mode: MaterialThemeMode = 'light',
) {
  return createMaterialColorScheme(seed, mode).cssVariables
}

export function createMaterialFidelityThemeCssVariables(
  seed: MaterialThemeSeed,
  mode: MaterialThemeMode = 'light',
) {
  return createMaterialFidelityColorScheme(seed, mode).cssVariables
}
