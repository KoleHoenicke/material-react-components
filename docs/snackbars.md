# Snackbars

This independent React implementation follows AndroidX Material 3 at revision [`74214dd8855295bf94d0abf938e8a480df01d591`](https://github.com/androidx/androidx/commit/74214dd8855295bf94d0abf938e8a480df01d591). Measurements map dp to CSS pixels. AndroidX has one snackbar appearance for standard and expressive themes; the motion scheme selects the spring physics.

## Usage

```tsx
import {
  Button, SnackbarHost, useSnackbarHostState,
} from '@kolehoenicke/material-react-components'
import '@kolehoenicke/material-react-components/styles.css'

export function Example() {
  const hostState = useSnackbarHostState()
  async function removeItem() {
    // The application performs the operation and handles Undo.
    const result = await hostState.showSnackbar({
      message: 'Item removed', actionLabel: 'Undo', withDismissAction: true,
    })
    if (result === 'action-performed') restoreItem()
  }
  return <>
    <Button onClick={removeItem}>Remove item</Button>
    <SnackbarHost hostState={hostState} />
  </>
}
```

Place the host in your application's bottom layout slot. The package does not create a global portal, viewport overlay, application feedback service, or z-index policy. The default data-based snackbar supplies AndroidX's 12px outer padding. Applications own positioning, navigation and FAB clearance, and safe-area insets.

`Snackbar`, `SnackbarHost`, `SnackbarHostState`, and `useSnackbarHostState` also have `Material`-prefixed equivalents, including `useMaterialSnackbarHostState`.

`showSnackbar('Saved')` uses short duration. An `actionLabel`, including an empty string, defaults to indefinite duration. Explicit `duration` accepts `short`, `long`, or `indefinite`. `withDismissAction` adds a close button. `dismissLabel` on the host localizes its name and native tooltip. The close path matches AndroidX's filled Close icon; `dismissIcon` on `Snackbar` accepts a replacement.

Only one request is active. Subsequent calls wait in FIFO order, and each promise resolves once to `action-performed` or `dismissed`. `currentSnackbarData.performAction()` and `.dismiss()` address the current request. Calling either method on completed data has no effect. `showSnackbar(visuals, { signal })` maps coroutine cancellation to `AbortSignal`; cancellation removes active or queued work and rejects with the signal's reason. Handle that rejection in your application. The state can also be constructed outside React with `new SnackbarHostState()`.

## Visual composition

```tsx
<Snackbar action={<Button variant="text" onClick={retry}>Try again</Button>}
  actionOnNewLine>
  Your connection is unavailable.
</Snackbar>

<SnackbarHost hostState={hostState}
  snackbar={data => <Snackbar snackbarData={data} actionOnNewLine />} />
```

The visual component accepts `children`, `action`, and `dismissAction` slots. Passing `snackbarData` supplies the message, action and close affordance; explicit slots take precedence. Custom slots own their button semantics and callbacks. A standalone snackbar has no timeout or live-region behavior, matching Compose's visual-only overload. Native div attributes, logical `dir`, a forwarded div ref, and typed `MaterialSnackbarStyle` overrides are supported.

## Source layout

At the pinned revision, `ComposeMaterial3Flags.isSnackbarStylingFixEnabled` defaults to `false`. `stylingFix={false}` matches that branch. `stylingFix={true}` exposes AndroidX's updated layout without silently changing the default. Both branches support message-only, inline action, optional dismiss action, and a separate action row. `actionOnNewLine` applies only when there is an action.

| Value | Default AndroidX layout | Updated layout |
| --- | --- | --- |
| Minimum inline-row height | 48px | 48px |
| Two-line inline-row minimum | 68px | Text height plus 28px, normally 68px |
| Text vertical padding | 6px | 14px |
| Start padding | 16px | 16px |
| End padding without close | 8px | 8px |
| Reserved text-end space without close | 8px | 8px |
| End padding and reserved text-end space with close | 0px | 0px |
| Multiline first baseline | 30px from the top | Vertically centered |
| Separate-row text first baseline | 30px from the top | 14px text padding |
| Space below last baseline before separate action row | 12px | 14px text padding |
| Separate action row bottom padding | 2px | 4px |
| Separate action row end padding without close | 8px | 8px |
| Separate-row text end padding | 8px | 16px |
| Data overload outer padding | 12px | 12px |

`ContainerMaxWidth` is 600px. In both inline-row branches, AndroidX applies the 600px cap *after* the outer horizontal layout padding. The visible maximum is therefore 624px without a close button, or 616px with one. The separate-row branch applies the cap before padding and has a 600px visible maximum. The port preserves this implementation detail.

Single-line message and action text are centered. Multiline default-layout text uses a measured first baseline at 30px; controls stay vertically centered. Two lines with a separate 48px action row normally total 112px, or 120px with the styling fix. Browser font measurements recompute on content, wrapping, resize and font-load changes.

The default action uses AndroidX's static `TextButton` overload: 58px minimum width, 40px visual height, 48px interaction height, 12px horizontal content padding, baseline label-large typography and a static round shape. It does not inherit the expressive button's press morph. Close uses a static 40px round icon-button container, a 48px touch target, and a 24px icon.

## Colors, typography and overrides

| Element | System token |
| --- | --- |
| Container | `inverse-surface` |
| Message and close icon | `inverse-on-surface` |
| Action in every enabled interaction state | `inverse-primary` |
| Container shape | `corner-extra-small`, default 4px |
| Shadow | `elevation-level3`, AndroidX elevation 6dp |
| Message | `bodyMedium`, 14px / 20px, regular, 0.2px tracking |
| Action | `labelLarge`, 14px / 20px, medium, 0.1px tracking |

The component uses the package's full typography roles, including font, weight, line height, tracking and variable-font options. It uses the shared elevation shadow and web ripple renderer. Android platform shadow rendering and ripple rasterization are browser adaptations.

Color and shape props are `containerColor`, `contentColor`, `actionContentColor`, `dismissActionContentColor`, and `shape`. Typed CSS overrides inherit into default host content, including custom renderers. Available `--md-snackbar-*` tokens are:

| Suffix | Default |
| --- | --- |
| `container-color`, `content-color`, `action-content-color`, `dismiss-content-color` | System colors above |
| `shape`, `elevation` | System shape and elevation above |
| `max-width` | 600px inner inline-row cap or separate-row outer cap |
| `single-line-height`, `two-line-height` | 48px, 68px |
| `horizontal-spacing`, `button-side-spacing`, `text-end-spacing` | 16px, 8px, 8px |
| `vertical-padding`, `updated-vertical-padding` | 6px, 14px |
| `first-baseline` | 30px |
| `new-line-last-baseline-padding`, `new-line-bottom-padding` | 12px, 2px |
| `updated-action-bottom-padding` | 4px |
| `outer-padding` | 12px for data-based visuals |
| `hidden-scale` | 0.8 from the shared motion theme |

## Motion, timing and accessibility

The host mirrors `FadeInFadeOutWithScale`. Opacity starts at 0 and targets 1 with FastEffects, damping 1 and stiffness 3800. Scale starts at 0.8 and targets 1 with FastSpatial. Expressive uses damping 0.6 and stiffness 800, including overshoot; standard uses damping 0.9 and stiffness 1400. CSS spring attributes and the nearest motion-scheme provider select the values. Analytic animation preserves velocity when interrupted and uses AndroidX's float visibility threshold of 0.01 and velocity threshold of 0.625. Exit targets opacity 0 and scale 0.8. Outgoing content is removed when the opacity spring settles, independently of scale, while the next item can enter in the same layout slot.

Short duration is 4,000ms and long duration is 10,000ms. Each timer starts when its request becomes current, including while the entrance animates. Indefinite requests have no timer. Reduced motion snaps to the target, cancels frames, and responds to live preference changes.

The browser has no Android accessibility-manager timeout API. `recommendedTimeoutMillis(original, containsControls)` supplies an equivalent application policy and can extend a finite duration or return `Infinity`. It never shortens the source duration. By default, the host pauses the remaining finite timeout while pointer-hovered or keyboard-focused. `pauseOnInteraction={false}` selects source timing without that web accessibility adaptation.

The host keeps one polite, atomic status region, with only message text announced. Repeated identical messages replace the announcement child. It does not move focus on entry. Keyboard users can Tab to the action and close buttons, activate them with native Space/Enter behavior, and dismiss with Escape while focus is inside the host. Outgoing items are inert and hidden from assistive technology immediately. `paneTitle` supplies the host label, defaulting to `Snackbar`. Forced colors uses system backgrounds, text and focus colors.

## Verification and limits

Focused tests cover source tokens, baseline measurement, public aliases, composition, cancellation, FIFO order, promise results, durations, hover/focus pause, accessibility timeout, custom hosts, exit semantics, analytic spring samples, interrupted velocity, both schemes and live reduced motion. The gallery covers all layouts and interactive queues.

The component follows the pinned AndroidX implementation's geometry and token relationships. Browser fonts, antialiasing, shadow rasterization and platform accessibility APIs differ from Android; pixel-identical cross-platform rendering is not guaranteed. Custom mixed-size text content should provide its own layout if it requires arbitrary per-line baselines.

## Pinned sources

- [Snackbar.kt](https://github.com/androidx/androidx/blob/74214dd8855295bf94d0abf938e8a480df01d591/compose/material3/material3/src/commonMain/kotlin/androidx/compose/material3/Snackbar.kt)
- [SnackbarHost.kt](https://github.com/androidx/androidx/blob/74214dd8855295bf94d0abf938e8a480df01d591/compose/material3/material3/src/commonMain/kotlin/androidx/compose/material3/SnackbarHost.kt)
- [SnackbarTokens.kt](https://github.com/androidx/androidx/blob/74214dd8855295bf94d0abf938e8a480df01d591/compose/material3/material3/src/commonMain/kotlin/androidx/compose/material3/tokens/SnackbarTokens.kt)
- [ComposeMaterial3Flags.kt](https://github.com/androidx/androidx/blob/74214dd8855295bf94d0abf938e8a480df01d591/compose/material3/material3/src/commonMain/kotlin/androidx/compose/material3/ComposeMaterial3Flags.kt)
- [Button.kt](https://github.com/androidx/androidx/blob/74214dd8855295bf94d0abf938e8a480df01d591/compose/material3/material3/src/commonMain/kotlin/androidx/compose/material3/Button.kt)
- [IconButton.kt](https://github.com/androidx/androidx/blob/74214dd8855295bf94d0abf938e8a480df01d591/compose/material3/material3/src/commonMain/kotlin/androidx/compose/material3/IconButton.kt)
- [MotionScheme.kt](https://github.com/androidx/androidx/blob/74214dd8855295bf94d0abf938e8a480df01d591/compose/material3/material3/src/commonMain/kotlin/androidx/compose/material3/MotionScheme.kt)
