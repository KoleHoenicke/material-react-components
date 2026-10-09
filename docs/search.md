# Search

This independent React implementation follows AndroidX Material 3 at revision [`a4a053382fb3deb290b7823590fa8cbc2f59048c`](https://github.com/androidx/androidx/commit/a4a053382fb3deb290b7823590fa8cbc2f59048c). It maps dp and sp to CSS pixels and uses this package's Material color, shape, typography and motion systems. Google does not sponsor, endorse or maintain this package.

## Components

Each component and hook also has a `Material`-prefixed export.

| Export | AndroidX reference |
| --- | --- |
| `SearchBar` with `state` | Collapsed search surface, paired with a separate expanded view |
| `ExpandedFullScreenSearchBar` | Full-screen expansion from the collapsed bounds, square expanded surface, divider |
| `ExpandedFullScreenContainedSearchBar` | Full-screen low-tone background, contained high-tone input, no divider |
| `ExpandedDockedSearchBar` | Joined bounded search view, extra-large corners and divider |
| `ExpandedDockedSearchBarWithGap` | Separate search input and results panel, 2px gap, 12px dropdown corners and scrim |
| `AppBarWithSearch` | Search app bar with optional navigation/action slots and enter-always scroll behavior |
| `TopSearchBar` | AndroidX's deprecated transparent app-bar form |
| `SearchBar` with `expanded` and `children` | Integrated full-screen form with the legacy tween motion |
| `DockedSearchBar` | Integrated docked form that expands in document layout with the legacy tween motion |
| `SearchBarInputField`, `SearchBarDefaults.InputField` | Single-line default, multiline option, icons, affixes, native editor, transformations and keyboard action |
| `useSearchBarState` | Controlled or uncontrolled expansion, progress, target/current value, expand, collapse and snap |
| `useContainedSearchBarState` | FastSpatial expansion/collapse with staged content fade |
| `useSearchBarWithGapState` | DefaultSpatial expansion, FastSpatial collapse with staged content fade |
| `useSearchBarScrollBehavior` | Enter-always hiding/revealing, scroll tones and offset settling |
| `SearchBarDefaults` | Shapes, dimensions, input component, palette factories and scroll hook |

The collapsed surface and its expanded view must share one state. Use a controlled query when sharing the input element between them. The input is mounted in each location; its editing state must come from the application rather than two independent `defaultValue` values. Icons, clear/back actions, suggestions, filtering, results, avatars and feedback remain application content.

```tsx
import { useState } from 'react'
import {
  SearchBar, SearchBarInputField, ExpandedDockedSearchBar,
  useSearchBarState,
} from '@kolehoenicke/material-react-components'

export function Search() {
  const state = useSearchBarState()
  const [query, setQuery] = useState('')
  const inputField = <SearchBarInputField
    state={state}
    aria-label="Search library"
    placeholder="Search library"
    value={query}
    onValueChange={setQuery}
    onSearch={value => {
      runSearch(value)
      state.animateToCollapsed()
    }}
  />
  return <>
    <SearchBar state={state} inputField={inputField} />
    <ExpandedDockedSearchBar state={state} inputField={inputField}>
      <button type="button" onClick={() => {
        setQuery('Saved books')
        state.animateToCollapsed()
      }}>Saved books</button>
    </ExpandedDockedSearchBar>
  </>
}
```

For inline filtering of an existing page list, use `SearchBar` with `inputField` and no state or results children. Its input keeps native searchbox semantics without announcing a popup; controlled query callbacks still drive the application list.

For controlled expansion, pass `expanded` and `onExpandedChange` to the state hook. The parent retains authority to accept or reject requests. For contained search, use `useContainedSearchBarState`, `SearchBarDefaults.containedColors(state.expanded)` on the collapsed bar, and `ExpandedFullScreenContainedSearchBar`. For the separate dropdown, use `useSearchBarWithGapState` and `ExpandedDockedSearchBarWithGap`.

## Source measurements

| Property | Implementation value |
| --- | --- |
| Collapsed input height | 56px |
| Preferred input width range | 360–720px, constrained by available space |
| Typography | BodyLarge, 16px/24px, weight 400, tracking 0.5px |
| Input and placeholder colors | OnSurface and OnSurfaceVariant |
| Leading and trailing colors | OnSurface and OnSurfaceVariant |
| Disabled text/icons/affixes | FilledTextField's 38% disabled opacity |
| Container | SurfaceContainerHigh |
| Contained expanded background / input | SurfaceContainerLow / SurfaceContainerHigh |
| Default shadow and tonal elevation | 0, following the implementation rather than generated level-3 tokens |
| Collapsed / docked / expanded full-screen shape | CornerFull / CornerExtraLarge / CornerNone |
| Dropdown shape / gap / scrim | 12px / 2px / Scrim at 32% |
| Icon size / minimum icon target | 24px / 48px |
| Text horizontal padding | 16px without icons, 4px after a 48px icon slot |
| Icon offset | 4px toward the input at each logical edge, making a 24px icon start at 16px |
| Prefix/suffix gap | 2px |
| Full-screen input top/bottom spacing | 8px / 8px, plus safe area |
| Contained input horizontal/top/bottom spacing | 8px / 4px / 8px, plus safe area |
| App-bar search horizontal/vertical padding | 8px / 4px |
| App-bar outer navigation/action padding | 4px |
| Modern docked total minimum/maximum height | 240px / two-thirds of viewport |
| Gap view total maximum height | Half of viewport |
| Legacy docked results minimum/maximum height | 240px / two-thirds of viewport, below the 56px input |
| Search avatar token | 30px, supplied by the application |

Small docked viewports constrain the minimum height. Docked overlays also remain inside the visible viewport at its edges. Full-screen headers can exceed 720px, as in AndroidX's expanded layout. The app-bar search is centered and grows up to 720px while preserving navigation and action space.

`colors` exposes container, divider and all input-field color states. `inputFieldColors`, `containedColors` and `appBarWithSearchColors` return overridable palettes. `shape`, `collapsedShape`, `dropdownShape`, `dropdownGapSize`, `dropdownScrimColor`, `tonalElevation` and `shadowElevation` configure surfaces. `style` accepts typed `--md-search-*` variables for width constraints, input dimensions, focus color and surface overrides. Editor configuration, refs, native form attributes, IME composition and caret-aware input/output transformations use the existing text-field editor.

## Motion and interaction

Expansion uses the analytic AndroidX spring equations and the active theme's standard or expressive spring attributes. Full-screen/default state uses SlowSpatial to expand and DefaultSpatial to collapse. Contained uses FastSpatial in both directions. The gap state uses DefaultSpatial to expand and FastSpatial to collapse. Retargeting keeps spatial velocity. Public progress clamps spring overshoot to the valid layout range.

Contained and gap content fades last 100ms. Enter waits 50ms and uses StandardAccelerate; exit uses StandardDecelerate. Integrated forms retain the legacy 600ms expansion and 350ms collapse, 100ms initial delay, EmphasizedDecelerate enter and AndroidX's `(0, 1, 0, 1)` exit easing. Search input backgrounds use the shared FastEffects token. App-bar color and settling transitions use shared theme motion. Reduced motion immediately completes spatial animation and cancels scheduled frames.

Tab focus leaves search collapsed. Pointer focus/click, longer user edits and Arrow Down request expansion. Arrow Down in an expanded editor focuses the first enabled result control. Enter calls `onSearch` with the raw query, preserves IME composition, and does not submit a surrounding form accidentally. Escape requests collapse. Docked views support outside dismissal with pointer-origin checking, so a drag beginning inside does not dismiss the popup. `closeOnEscape` and `closeOnOutsideClick` configure those policies. Read-only input remains focusable; disabled input cannot request expansion.

Expanded forms use a native modal `dialog` in the browser top layer, with focus containment and restoration to the prior control. The collapsed copy becomes hidden and inert while its expanded copy is visible. The combobox controls the named dialog. Integrated docked results use an inline nonmodal dialog. A shared `name` is removed from the collapsed input while the overlay is active to avoid duplicate form entries. Full-screen expansion locks document scrolling. VisualViewport resize/scroll and ResizeObserver keep results within the visible viewport, including keyboard-driven resizing. Logical offsets and inherited direction preserve RTL. Safe-area insets and forced colors have explicit browser styles.

## Sources and platform differences

Authoritative sources at the pinned revision:

- [SearchBar.kt](https://github.com/androidx/androidx/blob/a4a053382fb3deb290b7823590fa8cbc2f59048c/compose/material3/material3/src/commonMain/kotlin/androidx/compose/material3/SearchBar.kt), including all public search forms and defaults.
- [SearchBarTokens.kt](https://github.com/androidx/androidx/blob/a4a053382fb3deb290b7823590fa8cbc2f59048c/compose/material3/material3/src/commonMain/kotlin/androidx/compose/material3/tokens/SearchBarTokens.kt) and [SearchViewTokens.kt](https://github.com/androidx/androidx/blob/a4a053382fb3deb290b7823590fa8cbc2f59048c/compose/material3/material3/src/commonMain/kotlin/androidx/compose/material3/tokens/SearchViewTokens.kt).
- [SearchBarSamples.kt](https://github.com/androidx/androidx/blob/a4a053382fb3deb290b7823590fa8cbc2f59048c/compose/material3/material3/samples/src/main/java/androidx/compose/material3/samples/SearchBarSamples.kt).

The web port uses native browser selection, focus restoration, scrolling and IME. Android's system predictive-back gesture, platform keyboard interception and spline-fling integration have no direct web equivalent. Escape, caller-provided back controls and native scroll momentum provide the corresponding browser interactions. App-bar settling and color effects use the package's CSS motion approximation; expanded search geometry uses the analytic spring. Native font rasterization and browser compositing can differ even with matching tokens. This is source-backed web validation, not an Android-device pixel-diff or a claim of identical platform services.
