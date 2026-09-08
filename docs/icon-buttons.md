# Icon buttons

This is an independent React implementation of Material 3 Expressive icon buttons. It is not maintained or endorsed by Google.

## Sources and scope

Audited on September 8, 2026 against the rendered Material [overview](https://m3.material.io/components/icon-buttons/overview), [specifications](https://m3.material.io/components/icon-buttons/specs), [guidelines](https://m3.material.io/components/icon-buttons/guidelines), and [web accessibility guidance](https://m3.material.io/components/icon-buttons/accessibility).

The implementation authority is AndroidX revision [`4ce83cc9d92d5b9efec53e706cbdd307c22702de`](https://github.com/androidx/androidx/tree/4ce83cc9d92d5b9efec53e706cbdd307c22702de/compose/material3/material3/src/commonMain/kotlin/androidx/compose/material3):

- `IconButton.kt`: action/toggle state resolution, static and animated shapes, pressed precedence, and non-bouncing `DefaultEffects` shape motion.
- `IconButtonDefaults.kt`: container calculations, inherited and vibrant colors, disabled colors, and outlined toggle borders.
- `tokens/{XSmall,Small,Medium,Large,XLarge}IconButtonTokens.kt`: dimensions, spacing, outline widths, and shape roles.
- `tokens/{IconButton,FilledIconButton,FilledTonalIconButton,OutlinedIconButton}Tokens.kt`: all four color configurations. `IconButtonTokens.kt` declares `StandardIconButtonTokens`.
- `tokens/ShapeTokens.kt`: shared corner radii.

The source files were fetched and checked against that immutable revision. Most generated icon-button token files identify themselves as `14_1_0`; the large size file identifies itself as `v0_11_0`.

## Components and controlled state

`IconButton` defaults to standard colors, small size, uniform width, and an animated round shape. This naming/default follows Compose's `IconButton`; Material's design configurator starts with filled styling instead.

| Action component | Controlled toggle component | Color configuration |
| --- | --- | --- |
| `IconButton` | `IconToggleButton` | Standard, or an explicit `variant` |
| `FilledIconButton` | `FilledIconToggleButton` | Filled |
| `FilledTonalIconButton` | `FilledTonalIconToggleButton` | Tonal |
| `OutlinedIconButton` | `OutlinedIconToggleButton` | Outlined |

Every name also has a `Material`-prefixed export. All components forward a native button ref and HTML button attributes. The default `type` is `button`; use `type="submit"` for form submission. Toggle state is represented by `aria-pressed` on the web.

```tsx
import { useState } from 'react'
import { FilledTonalIconToggleButton } from '@kolehoenicke/material-react-components'

function FavoriteAction() {
  const [checked, setChecked] = useState(false)
  return (
    <FilledTonalIconToggleButton
      aria-label="Favorite"
      checked={checked}
      onCheckedChange={setChecked}
      selectedIcon={<FilledStarIcon />}
      size="medium"
      width="wide"
    >
      <OutlinedStarIcon />
    </FilledTonalIconToggleButton>
  )
}
```

The icons in this example belong to the application. The package does not supply an icon set. Use filled icons for actions, and an outlined/filled pair for toggles. Where a filled glyph is unavailable, the application can change its stroke or font weight when selected. The icon slot is decorative to assistive technology; supply `aria-label` or `aria-labelledby` on the button. Native `title` defaults to `aria-label`, providing a browser tooltip. Set an explicit `title` when using `aria-labelledby`, or `title=""` when composing your own accessible tooltip. A custom tooltip's styling and placement belong to that tooltip component.

`IconButton` also accepts `toggle`, controlled `selected`, and `onSelectedChange`. Its `onClick` runs first; calling `event.preventDefault()` cancels the selection callback. Disabled controls suppress both. Neither API changes selection internally.

## Geometry

Dimensions below are visual container measurements in CSS pixels. The independent hit target reserves at least 48 × 48px, including extra-small and small controls. There is no default pointer-density reduction. Icons remain centered, without typography or label padding.

| Size | Height | Icon | Narrow width | Uniform width | Wide width | Square radius | Pressed radius | Outline |
| --- | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: |
| `extra-small` | 32 | 20 | 28 | 32 | 40 | 12 | 8 | 1 |
| `small` | 40 | 24 | 32 | 40 | 52 | 12 | 8 | 1 |
| `medium` | 56 | 24 | 48 | 56 | 72 | 16 | 12 | 1 |
| `large` | 96 | 32 | 64 | 96 | 128 | 28 | 16 | 2 |
| `extra-large` | 136 | 40 | 104 | 136 | 184 | 28 | 16 | 3 |

Horizontal space on each side is `(width - icon size) / 2`; vertical space is `(height - icon size) / 2`. `MATERIAL_ICON_BUTTON_SIZES` exposes the numeric dimensions. `uniform` is AndroidX's name for the design site's default width.

Round controls use half the shorter visual dimension as the radius. A finite radius preserves a real circle/capsule and makes interpolation meaningful. Round toggles become square when selected; square toggles become round. Both use the same size-specific pressed radius. `animated={false}` keeps the resting shape in every state, corresponding to Compose's static-shape overload. `shapes` independently overrides `shape`, `pressedShape`, and `checkedShape` with CSS border-radius values.

## Colors and states

| Style | Action | Unselected toggle | Selected toggle |
| --- | --- | --- | --- |
| Standard | Transparent / on-surface-variant | Transparent / on-surface-variant | Transparent / primary |
| Filled | Primary / on-primary | Surface-container / on-surface-variant | Primary / on-primary |
| Tonal | Secondary-container / on-secondary-container | Secondary-container / on-secondary-container | Secondary / on-secondary |
| Outlined | Transparent / on-surface-variant, outline-variant border | Same as action | Inverse-surface / inverse-on-surface, no border |

Entries list container/icon roles. Colors use the active theme in light and dark modes. `colorMode="inherit"` matches `LocalContentColor` for standard and outlined controls, including disabled content and outlined borders. The default `vibrant` mode uses the design-token roles above. `AppBarIconButton` uses this implementation with inherited color by default.

Disabled content is on-surface at 38%. Filled and tonal disabled containers use on-surface at 10%. Standard and outlined disabled containers are transparent. Disabled outlined borders use outline-variant at 38%; selected outlined controls have no border, including when disabled. This deliberately follows `IconButtonDefaults.kt`. Its outlined disabled selected container is transparent even though the generated token file also declares a 10% selected disabled container token.

The shared bounded ripple follows the visual container, including its animated corners. Hover opacity is 8%, focus and press are 10%. Keyboard focus also receives a 3px secondary outline with a 2px offset. Disabled styles resolve each color independently rather than applying opacity to the entire button. There is no elevation or shadow.

`colors` accepts CSS colors or variable references for `containerColor`, `contentColor`, `disabledContainerColor`, `disabledContentColor`, `checkedContainerColor`, `checkedContentColor`, `outlineColor`, and `disabledOutlineColor`. These are final colors; include alpha in a custom disabled color. Unlike Compose's `contentColorFor`, CSS does not infer a matching foreground for an arbitrary custom background. Supply both colors and preserve at least 3:1 icon contrast.

## Motion and web adaptations

AndroidX explicitly chooses `DefaultEffects` for icon-button shape changes to prevent bounce. `--m3-motion-icon-button-shape` references the shared default-effects spring curve and duration, following the active Standard or Expressive motion scheme. Colors resolve immediately as in the Android color objects. Ripple timing comes from the package's shared web ripple.

Reduced motion removes shape transitions. Forced colors use system button, selection, disabled, and focus colors. Native buttons supply Tab focus and Enter/Space activation. RTL uses logical dimensions and symmetric spacing without changing icon artwork. An application should supply mirrored artwork for directional icons where required.

CSS pixels map the Android dp measurements to the web. Browser rasterization, CSS-sampled spring curves, the shared web ripple, native tooltip appearance, and web accessibility semantics are platform adaptations. This is not a claim of pixel identity with every Android renderer. Group-level neighbor displacement remains the responsibility of `ButtonGroup`; `Button iconOnly` is the existing regular-button API and is not an alias for this family.

## CSS customization

`MaterialIconButtonCSSProperties` accepts `--md-icon-button-*` properties. The supported tokens are:

- Geometry: `container-height`, `container-width`, `icon-size`, `outline-width`, `minimum-target-size`.
- Shapes: `shape`, `pressed-shape`, `selected-shape`.
- Colors: `container-color`, `content-color`, `selected-container-color`, `selected-content-color`, `disabled-container-color`, `disabled-content-color`, `outline-color`, `disabled-outline-color`.
- Focus: `focus-ring-width`, `focus-ring-color`, `focus-ring-offset`.

Prefix each name with `--md-icon-button-`. Direct `style` tokens override corresponding props. Keep the minimum target at 48px unless the user explicitly selects a denser layout. Component geometry props produce inline tokens; override those through `style`. Shared system colors, shapes, motion, and ripple state tokens remain themeable.

## Verification

Focused React tests cover every size/width token combination, native attributes and refs, decorative icon semantics, controlled updates, selected icon replacement, disabled callbacks, cancellation, configuration overrides, named exports, and app-bar compatibility. Browser checks cover the 120 rendered action/toggle size/width/color combinations, selected colors, square/round shapes, disabled colors, ripple suppression, Space/Enter activation, and light/dark theme rendering. Repository verification runs type checking, all unit tests, package and gallery builds, and the package dry run.
