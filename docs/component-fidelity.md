# Component fidelity audit

This audit covers the FAB menu, chip hover states, dialog actions, expandable lists, dropdown menus, and circular progress and loading indicators. AndroidX `androidx-main` was inspected at revision [`40ff481447ab78cbdc1a316bc7c8ecfca630f19e`](https://github.com/androidx/androidx/commit/40ff481447ab78cbdc1a316bc7c8ecfca630f19e). Measurements map dp to CSS pixels.

## Sources

The authoritative implementations are [FloatingActionButtonMenu.kt](https://github.com/androidx/androidx/blob/40ff481447ab78cbdc1a316bc7c8ecfca630f19e/compose/material3/material3/src/commonMain/kotlin/androidx/compose/material3/FloatingActionButtonMenu.kt), [Chip.kt](https://github.com/androidx/androidx/blob/40ff481447ab78cbdc1a316bc7c8ecfca630f19e/compose/material3/material3/src/commonMain/kotlin/androidx/compose/material3/Chip.kt), [Button.kt](https://github.com/androidx/androidx/blob/40ff481447ab78cbdc1a316bc7c8ecfca630f19e/compose/material3/material3/src/commonMain/kotlin/androidx/compose/material3/Button.kt), [Menu.kt](https://github.com/androidx/androidx/blob/40ff481447ab78cbdc1a316bc7c8ecfca630f19e/compose/material3/material3/src/commonMain/kotlin/androidx/compose/material3/Menu.kt), [MenuDefaults.kt](https://github.com/androidx/androidx/blob/40ff481447ab78cbdc1a316bc7c8ecfca630f19e/compose/material3/material3/src/commonMain/kotlin/androidx/compose/material3/MenuDefaults.kt), [LoadingIndicator.kt](https://github.com/androidx/androidx/blob/40ff481447ab78cbdc1a316bc7c8ecfca630f19e/compose/material3/material3/src/commonMain/kotlin/androidx/compose/material3/LoadingIndicator.kt), [ProgressIndicator.kt](https://github.com/androidx/androidx/blob/40ff481447ab78cbdc1a316bc7c8ecfca630f19e/compose/material3/material3/src/commonMain/kotlin/androidx/compose/material3/ProgressIndicator.kt), and [CircularWavyProgressModifiers.kt](https://github.com/androidx/androidx/blob/40ff481447ab78cbdc1a316bc7c8ecfca630f19e/compose/material3/material3/src/commonMain/kotlin/androidx/compose/material3/internal/CircularWavyProgressModifiers.kt), including their generated token files. Shared polygon and morph helpers remain a port of AndroidX graphics-shapes.

## Findings

| Before | After | Why |
| --- | --- | --- |
| Loading rotation restarted with the seven-shape index | Accumulate rotation independently from the shape index | Removes a 180-degree discontinuity every 4,550ms. `MaterialLoadingIndicator.tsx:105` |
| Loading paths centered by exact curve extrema | Center using the control-point bounds | Matches Compose `Path.getBounds()` during the morph and spring overshoot. `MaterialLoadingIndicator.tsx:128` |
| Circular sweep used `(0.2, 0, 0, 1)` | Use AndroidX `(0.4, 0, 0.2, 1)` | Reproduces the 6,000ms expansion/contraction cycle. `MaterialProgressIndicator.tsx:383` |
| Circular indeterminate began at 12 o'clock | Standard begins at 3 o'clock; wavy uses its native extra 90 degrees | Matches each implementation's drawing origin. `MaterialProgressIndicator.tsx:854` |
| Circular wavy geometry was a sampled sine curve | Use a rounded-star/circle morph and an arc offset with counter-rotation | Matches the native shape and wave movement without rebuilding the geometry every animation frame. `internal/circularWavyGeometry.ts:15` |
| Circular stroke bounds were clipped | Allow the SVG stroke to extend to its drawing bounds | Avoids removing anti-aliased stroke edges during rotation. `MaterialProgressIndicator.css:11` |
| FAB pills were revealed with a clip-path; fixed stagger delays | Animate actual pill width with stable contents, driven by the SlowEffects integer-count spring | Matches native layout, reveal order and retargeting; CSS spatial/effects motion still comes from the shared scheme. `MaterialFloatingActionButtonMenu.css:152`, `internal/useFabMenuStagger.ts:10` |
| FAB item tokens reset nested colors and supplied elevation 3 | Inherit the menu palette; use the current implementation's default Surface elevation 0 | Secondary and tertiary sets now reach their items. AndroidX's item implementation does not use the generated elevation-3 token. |
| Removable chip hover ended before the remove button | Anchor the primary state layer to the whole chip | Mirrors AndroidX's single chip surface while preserving independent web removal semantics. |
| Elevated chip rules overrode hover; flat selected filter selector required a nonexistent attribute | Resolve elevation from state tokens and the actual selected/elevated attributes | Elevated hover uses elevation 2; flat selected filter hover uses elevation 1. Hover styling is gated to a hover-capable fine pointer. |
| Ripple defaults reset inherited component colors | Resolve defaults only when a component has not provided a color or opacity | Selected chip, FAB, menu and dialog state layers retain their intended content color. |
| Dialog actions used on-surface-variant and an outline around the 48px touch target | Use primary content color and outline the 40px visual surface | The state shown in the screenshot is focus, not toggle selection. Keyboard focus stays visible. |
| Menu tokens reset on every item; a permanent scrollbar gutter widened dropdowns | Apply defaults at the owning surface and let children inherit density and color | Pointer menus use the native 16px start / 10px end padding, 12px vertical padding and 44px minimum height. |
| Group shadows were clipped by the same element that scrolled | Scroll inside the popup and composite elevation outside it | Preserves standalone 16px group corners, first/last 16px and 8px group corners, 12px selected items, 4px inner corners, 2px group padding and group gap. |
| Expanded list disclosure gained a filled 40px circle | Use the normal trailing-icon slot | AndroidX has no direct expandable-list component. This wrapper composes list items and web disclosure semantics without inventing a filled icon-button surface. |
| Nested popup painted underneath its parent | Give each nested menu a higher stacking level | React portal mount order can place a child before its parent in the DOM. Depth-based stacking preserves the side placement while drawing the child above overlapping parent content and shadows. |
| Supporting-text rows omitted their outer vertical inset | Add 2px above and below those rows | AndroidX uses `DropdownMenuSelectableItemWithSupportTexPadding`; plain rows have no outer vertical inset. |
| FAB radius transitioned from 16/20/28px to 9999px | Interpolate to half the final close-button size, 28px by default | AndroidX `FabFinalCornerRadius` is `FabFinalSize / 2`. An oversized CSS pill radius clamps to a circle almost immediately and stays clamped during most of the reverse transition. |

## Submenu placement and spacing follow-up

Compose Material 3 does not supply a cascading-submenu component at this revision. The web wrapper uses side placement aligned with the parent item, flipping when needed at the viewport edge. AndroidX [AppCompat's CascadingMenuPopup](https://github.com/androidx/androidx/blob/40ff481447ab78cbdc1a316bc7c8ecfca630f19e/appcompat/appcompat/src/main/java/androidx/appcompat/view/menu/CascadingMenuPopup.java) provides the native reference for that placement. The child popup must paint above its ancestors when their bounds or shadows overlap. Web stacking now increases with menu depth; `--md-menu-z-index` sets the base layer.

The unequal gaps are intentional in AndroidX, and were rechecked against `MenuDefaults.kt`, `Menu.kt`, and `GroupedMenuSample`:

| Location | Native value mapped to CSS |
| --- | --- |
| Between menu groups | 2px |
| Top and bottom of a group | 2px each, so facing group content edges are 6px apart including the group gap |
| Between plain item surfaces | 0px |
| Outside a supporting-text item surface | 2px above and below |
| Around a 1px divider | 2px above and below, producing a 5px separator region |
| Between FAB action pills | 4px |
| Between the FAB action stack and close button | 8px for the regular launcher; larger launcher footprints also preserve their native bottom margin |

Fine-pointer menu rows have a 44px minimum and 12px vertical content padding. A 24px trailing icon therefore produces a 48px row. Text or a 20px leading icon can fit in 44px. Those height differences are also native.

## Motion verdict

Approve the repaired paths for the browser implementation. The deliberate width animation on FAB pills is retained because the user's requirement is to reproduce AndroidX's layout animation. It uses the shared spatial curve, preserves the full content width, and retargets via CSS transitions. Reduced motion bypasses the count spring and removes spatial movement through the shared reduced-motion values.

The loading indicator's damping ratio 0.6, stiffness 200, visibility threshold 0.1, 650ms morph interval, and 4,666ms global rotation already matched AndroidX. Its small end-of-spring settle is native behavior and remains. The large seven-shape rotation reset was a separate web-port error.

The FAB radius follow-up is approved for origin, physicality, and interruptibility. Container size and radius retain the shared FastSpatial transition. A browser check sampled forward and reverse transitions for regular, medium, and large launchers at 10 times slower, then tested normal-speed and interrupted toggles. The regular radius moves from 16px to 28px, medium from 20px to 28px, and large stays at 28px while its container shrinks. The small spatial-spring overshoot remains; browser round-rectangle rendering clamps corners to the current bounds, as the native path does.

## Validation and limits

Focused regressions cover rotation boundaries, repeated seven-shape wraps, native sweep values, reduced motion, fixed wavy geometry, the FAB count spring, state-token inheritance, menu scrolling, focus surfaces and disclosure bounds. The live local gallery was inspected for full-width chip hover, dialog action colors and keyboard focus, menu spacing and shadows, submenu navigation, FAB widths and color inheritance, and running circular indicators.

This is a source comparison plus web-browser validation. It is not a pixel-diff against a running Android app. SVG rasterization, native font rendering and Compose-to-CSS spring conversion remain platform differences. Menu elevation is composited with a CSS drop-shadow using the shared single-shadow elevation token; custom multi-shadow box-shadow syntax is not supported by drop-shadow.
