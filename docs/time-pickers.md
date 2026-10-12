# Time pickers

This independent React implementation follows AndroidX revision [`d15bc3d0c69caa87d369676a3ab81a19799a0566`](https://github.com/androidx/androidx/tree/d15bc3d0c69caa87d369676a3ab81a19799a0566), inspected October 12, 2026. The source uses generated v0_210 tokens. Google does not maintain or endorse this package.

## Source

- [TimePicker.kt](https://github.com/androidx/androidx/blob/d15bc3d0c69caa87d369676a3ab81a19799a0566/compose/material3/material3/src/commonMain/kotlin/androidx/compose/material3/TimePicker.kt) defines baseline and vibrant dial, text, scroll and uncontained layouts, state, validation, gestures, and motion.
- [TimePickerTokens.kt](https://github.com/androidx/androidx/blob/d15bc3d0c69caa87d369676a3ab81a19799a0566/compose/material3/material3/src/commonMain/kotlin/androidx/compose/material3/tokens/TimePickerTokens.kt) and [TimeInputTokens.kt](https://github.com/androidx/androidx/blob/d15bc3d0c69caa87d369676a3ab81a19799a0566/compose/material3/material3/src/commonMain/kotlin/androidx/compose/material3/tokens/TimeInputTokens.kt) define baseline sizing, colors and typography.
- [TimePickerDialog.kt](https://github.com/androidx/androidx/blob/d15bc3d0c69caa87d369676a3ab81a19799a0566/compose/material3/material3/src/commonMain/kotlin/androidx/compose/material3/TimePickerDialog.kt) defines dialog slots, padding, and mode toggles.
- [ScrollField.kt](https://github.com/androidx/androidx/blob/d15bc3d0c69caa87d369676a3ab81a19799a0566/compose/material3/material3/src/commonMain/kotlin/androidx/compose/material3/ScrollField.kt), Foundation `Pager.kt`/`PagerState.kt`, and animation-core `SpringSimulation` define scroll typography, selection colors, and spring specifications.
- `ComposeMaterial3Flags.isUpdatedTimepickerToggleEnabled` is **true** in this revision. The current baseline uses separate AM/PM buttons with primary-container selection, surface-container-lowest resting color, 4px gaps, bold selected labels, and FastSpatial shape morphing. The older joined, outlined tertiary-container toggle is behind a runtime flag, rather than a separate current public variant.

## Components

| Export | Variants |
| --- | --- |
| `TimePicker` | `variant="baseline"` or `"vibrant"`; `layoutType="vertical"`, `"horizontal"`, or `"auto"`; 12 or 24 hours |
| `TimeInput` | Baseline or vibrant; 12 or 24 hours; vibrant uncontained input with a `toggle` slot |
| `TimeScroll` | Vibrant; 12 or 24 hours; uncontained scroll input with a `toggle` slot |
| `TimePickerDialog` | Baseline dialog chrome, title, action and mode-toggle slots |
| `VibrantTimePickerDialog` | Vibrant dialog chrome and action slots, without a visible title |
| `TimePickerModeToggle` | Dial/text or scroll/text switching with source icons and accessible labels |

Every component also has a `Material`-prefixed export. Components receive no application imports or feedback behavior.

```tsx
import { useState } from 'react'
import { TimePicker, TimeInput } from '@kolehoenicke/material-react-components'
import '@kolehoenicke/material-react-components/styles.css'

function TimeControls() {
  const [time, setTime] = useState({ hour: 19, minute: 30 })
  return <>
    <TimePicker value={time} onValueChange={setTime}
      variant="vibrant" layoutType="vertical" is24Hour />
    <TimeInput value={time} onValueChange={setTime} is24Hour />
  </>
}
```

Use `MaterialThemeProvider` to supply the package's Material color, shape, typography and motion tokens. Hours in `value` always use 0–23, including 12-hour displays. Minutes use 0–59. `defaultValue` enables uncontrolled use. `selection`, `onSelectionChange` and `defaultSelection` control the active hour/minute field. Value changes remain proposals until a controlled caller accepts them.

Invalid text remains a visible local draft without publishing an invalid time. `onValidityChange` lets callers disable confirmation. Empty text and zero preserve the source's midnight/noon semantics. The hour field advances after two valid digits, or a valid 2–9 in 12-hour mode. Set `autoSwitchToMinute={false}` to retain the field and dial for assistive workflows. Keyboard dial activation retains hours automatically. Set `autoFocus` on text inputs mounted inside a dialog; standalone inputs avoid stealing page focus.

Supply `labels` for translated field, selection, period and error labels. Numeric descriptions use `hourSuffix`, `hour24Suffix` and `minuteSuffix`, with a `{value}` placeholder. `locale` controls digit formatting. Mode toggle labels have separate translation props. Time numbers stay LTR inside RTL layouts, as in the source.

Dialogs receive `open`, `onDismissRequest`, `confirmButton`, optional `dismissButton` and `modeToggleButton`, and caller-owned children. Confirmation and cancellation are caller decisions. Set the dialog's `layoutType` to match horizontal dial children. Keep input dialogs vertical. Use `aria-label` to name a vibrant dialog for the task.

## Geometry and tokens

| Detail | Baseline | Vibrant |
| --- | --- | --- |
| Dial | 256px circle | 256px circle |
| Hour/minute fields | 96 × 80px | 100 × 120px; 132px wide in vertical 24-hour dial |
| Text input fields | 96 × 72px | 100 × 120px |
| Uncontained input/scroll | — | 136px field height, 140px side controls |
| Separator | 24px, offset −4px | 16px, offset −4px |
| Vertical AM/PM | 52 × 80px for dial; 52 × 72px for text | 56 × 120px |
| Horizontal AM/PM | 216 × 38px | 216 × 40px |
| Display-to-dial gap | 36px | 12px vertical, 52px horizontal |
| Field shape | corner-small | corner-large |
| Dial surface | surface-container-highest | surface-container-lowest |
| Selected field | primary-container / on-primary-container | surface-container-lowest / primary, 2px primary outline |
| Dialog surface | surface-container-high | surface-container |
| Dialog padding | 24px portrait | 12px portrait, 24px horizontal |

Dial labels use body-large. Dial selectors use display-large. Baseline text input uses display-medium. AM/PM uses title-medium with bold selected text. Supporting text uses body-small, 7px top spacing and a two-line minimum. The dial has 101px and 69px label radii, a 74px ring threshold, 48px handle, 8px center dot, and 2px track. Selected text is clipped to the moving handle, including during rotation. Minute taps choose five-minute increments; dragging chooses individual minutes.

Token overrides use the typed `MaterialTimePickerStyle` and `--md-time-picker-*` variables, including field, period, dial, selector and dialog colors and shapes. System typography overrides also affect scroll interpolation.

## Motion and browser adaptations

The dial uses analytic DefaultSpatial springs, with shortest-path angular interpolation and velocity preserved on interruption. Hour/minute labels crossfade with DefaultEffects. Direct dragging snaps the hand to the pointer. Hour taps wait for the spring to settle, then wait the source's 100ms delay before switching to minutes. `--md-time-picker-auto-advance-delay` lives in `src/theme/motion.css`. AM/PM colors change directly, matching `ToggleButtonColors`; shapes use FastSpatial. Scroll items interpolate display-medium to display-large-emphasized and outline to on-surface with FastSpatial.

The browser uses CSS pixels for dp, DOM buttons and inputs for Compose semantics, SVG clipping for the selector's compositing, and the package's native HTML dialog for focus containment, Escape, backdrop dismissal and focus restoration. Its modal window animation follows the package's web dialog transition; Android's platform dialog window animation is not portable. Font rasterization, browser selection/caret drawing and virtual keyboards remain platform-specific.

Scroll input uses a small repeating window instead of an Android infinite `VerticalPager`. Pointer release limits flings to one additional page and uses the Foundation 400-stiffness snap spring; keyboard, wheel and item activation use the 1500-stiffness programmatic spring. Browser wheel events and pointer velocity sampling replace Android's spline decay and touch input pipeline, so inertial trajectories are a documented browser adaptation. Small landscape baseline dials use the source's 238px/200px size fallbacks at viewport heights below 384px/330px; CSS overrides can express a caller's tighter container constraint.

Keyboard arrows loop dial focus, activate values with Enter/Space, and navigate AM/PM. Scroll inputs expose spinbutton values and accept arrows, Home, End, pointer dragging and wheel input. Both motion schemes, live reduced motion and forced colors are supported. Visual tokens and component spring roles are ported from the pinned source; this is not a claim of identical Android and browser rendering or platform physics.
