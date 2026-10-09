/* AndroidX Material3, a4a053382fb3deb290b7823590fa8cbc2f59048c. Apache-2.0. */
import { getMaterialTextFieldColors, type MaterialTextFieldColors } from './MaterialTextFieldDefaults'
export type MaterialSearchBarColors = {
  containerColor?: string
  dividerColor?: string
  inputFieldColors?: MaterialTextFieldColors
}
export type MaterialAppBarWithSearchColors = {
  searchBarColors?: MaterialSearchBarColors
  scrolledSearchBarContainerColor?: string
  appBarContainerColor?: string
  scrolledAppBarContainerColor?: string
  appBarNavigationIconColor?: string
  appBarActionIconColor?: string
}
export const MATERIAL_SEARCH_BAR_DIMENSIONS = {
  inputHeight: 56, minWidth: 360, maxWidth: 720, iconSize: 24, iconTargetSize: 48,
  iconOffset: 4, horizontalPadding: 16, verticalPadding: 8,
  appBarHorizontalPadding: 8, appBarVerticalPadding: 4, appBarIconPadding: 4,
  containedHorizontalPadding: 8, dockedMinHeight: 240, dockedMaxHeightRatio: 2 / 3,
  dockedWithGapMaxHeightRatio: 1 / 2, dropdownGap: 2, dropdownRadius: 12, avatarSize: 30,
} as const
export function getMaterialSearchBarInputFieldColors(overrides: MaterialTextFieldColors = {}): MaterialTextFieldColors {
  const colors = { ...getMaterialTextFieldColors('filled') }
  for (const state of ['focused', 'unfocused', 'disabled'] as const) {
    colors[`${state}ContainerColor`] = 'transparent'
    colors[`${state}IndicatorColor`] = 'transparent'
    if (state !== 'disabled') colors[`${state}LeadingIconColor`] = 'var(--md-sys-color-on-surface)'
  }
  return { ...colors, ...overrides }
}
export function getMaterialSearchBarColors(overrides: MaterialSearchBarColors = {}): MaterialSearchBarColors {
  return { containerColor: 'var(--md-sys-color-surface-container-high)', dividerColor: 'var(--md-sys-color-outline)', ...overrides, inputFieldColors: getMaterialSearchBarInputFieldColors(overrides.inputFieldColors) }
}
export function getMaterialContainedSearchBarColors(expanded: boolean, overrides: MaterialSearchBarColors = {}): MaterialSearchBarColors {
  const inputContainer = 'var(--md-sys-color-surface-container-high)'
  return getMaterialSearchBarColors({ containerColor: expanded ? 'var(--md-sys-color-surface-container-low)' : inputContainer, ...overrides,
    inputFieldColors: { focusedContainerColor: inputContainer, unfocusedContainerColor: inputContainer, disabledContainerColor: inputContainer, ...overrides.inputFieldColors } })
}
export function getMaterialAppBarWithSearchColors(overrides: MaterialAppBarWithSearchColors = {}): MaterialAppBarWithSearchColors {
  return { searchBarColors: getMaterialSearchBarColors(), scrolledSearchBarContainerColor: 'var(--md-sys-color-surface-container-highest)',
    appBarContainerColor: 'var(--md-sys-color-surface)', scrolledAppBarContainerColor: 'var(--md-sys-color-surface-container)',
    appBarNavigationIconColor: 'var(--md-sys-color-on-surface)', appBarActionIconColor: 'var(--md-sys-color-on-surface-variant)', ...overrides }
}
