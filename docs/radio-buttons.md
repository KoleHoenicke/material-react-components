# Radio buttons

This independent React implementation follows AndroidX Material 3 at revision [`b2dcba37aea417626ed77a230e961f405d893c4c`](https://github.com/androidx/androidx/commit/b2dcba37aea417626ed77a230e961f405d893c4c). Measurements map dp to CSS pixels. `RadioButton` and `MaterialRadioButton` are the same component.

## Usage

Use native labels and give radios in one group the same `name`. Native radios provide Space activation, arrow-key selection, disabled-option skipping, form validation and form submission. The component accepts native input props and forwards its ref to the input.

```tsx
import { useState } from 'react'
import { RadioButton } from '@kolehoenicke/material-react-components'

export function CallFilter() {
  const [value, setValue] = useState('Calls')
  return <fieldset>
    <legend>Call filter</legend>
    {['Calls', 'Missed', 'Friends'].map(option =>
      <label key={option}>
        <RadioButton name="call-filter" value={option}
          checked={value === option}
          onChange={event => setValue(event.currentTarget.value)} />
        {option}
      </label>,
    )}
  </fieldset>
}
```

`defaultChecked` supports uncontrolled forms, including native group deselection and form reset. A controlled `checked` value changes only when the caller updates it. Label typography and space between adjacent radios belong to the caller, as they do in Compose.

## Geometry and colors

| Source value | Web default |
| --- | --- |
| `RadioButtonTokens.IconSize` | 20px |
| `RadioStrokeWidth` | 2px, outer radius 9px with stroke reaching 10px |
| `RadioButtonPadding` | 2px on each side of the icon |
| `RadioButtonDotSize` | 12px nominal, animated radius 0 to 6px |
| Drawn dot radius | Animated radius minus half the stroke, 5px selected |
| `RadioButtonTokens.StateLayerSize` | 40px circle |
| Minimum interactive size | 48px square, with icon and state layer centered |
| No click handler | 24px square, icon plus padding |
| Selected color | `primary` |
| Unselected color | `on-surface-variant` |
| Disabled selected and unselected | `on-surface` with alpha 0.38 |
| Ripple color | `on-surface`, independently of selection, equivalent to default `LocalContentColor` |
| Hover, focus, press opacity | 0.08, 0.10, 0.10 |

The circular geometry follows `drawCircle`, with no expressive shape morph. AndroidX has one public radio button appearance shared by its standard and expressive motion schemes.

`RadioButtonTokens` lists `on-surface` for the unselected hover, focus, and press icon colors. `RadioButton.kt` resolves the icon color using only enabled and selected state. This port follows the implementation and leaves the unselected icon at `on-surface-variant` during those interactions. The ripple adds its state layer separately.

`MaterialRadioButtonStyle` types the `--md-radio-button-*` geometry, color, opacity and state-layer overrides. Use `--md-radio-button-state-layer-color` when a surrounding container supplies a content color different from `on-surface`.

## Motion

The dot radius uses the analytic AndroidX `FastSpatial` spring, including overshoot and velocity preservation on interruption. Expressive uses damping 0.6 and stiffness 800; standard uses damping 0.9 and stiffness 1400. Color animates alpha and Oklab channels with `DefaultEffects`, damping 1 and stiffness 1600. These values come from the shared motion theme and respect the nearest motion-scheme provider.

Color snaps when entering or leaving disabled state. The radius continues to animate when selection changes while disabled. Initial selected controls render at the selected size. Reduced motion snaps to the target and cancels pending frames, including when the preference changes during an animation.

## Parent selection and sample rows

`interactive={false}` maps to Compose's `onClick = null`. It renders the 24px padded decorative icon without an input, ripple, focus target, or accessible name. Supply `checked` from the parent state. The parent must own the accessible radio semantics, selection, keyboard behavior, and touch target. Its ref has no input to reference.

The gallery's AndroidX sample rows use one native input covering each row and a decorative radio button. The row is 56px high, has 16px horizontal padding, and places body-large text 16px after the 24px control, matching `RadioGroupSample`. Those measurements belong to the sample layout.

## Browser adaptations and verification

Native inputs replace Compose selectable semantics. The browser handles group focus and arrow-key behavior. SVG circles replace the Compose canvas. Rasterization, device pixel ratio and color management can differ between browsers and Android.

The press ripple uses the package's shared web ripple renderer with a centered 40px state layer. AndroidX delegates Android press ripples to the platform; the renderer and press timing are a web adaptation. Default focus uses the AndroidX opacity state layer. Windows forced colors uses system text, selection, disabled and focus colors for visibility.

Focused tests cover forms, labels, controlled and uncontrolled groups, reset, disabled and decorative modes, both motion schemes, Oklab color interpolation, interruption velocity, reduced motion, and cleanup. The gallery includes state previews, controlled groups, parent-selectable rows, and RTL.

## Pinned sources

- [RadioButton.kt](https://github.com/androidx/androidx/blob/b2dcba37aea417626ed77a230e961f405d893c4c/compose/material3/material3/src/commonMain/kotlin/androidx/compose/material3/RadioButton.kt)
- [RadioButtonTokens.kt](https://github.com/androidx/androidx/blob/b2dcba37aea417626ed77a230e961f405d893c4c/compose/material3/material3/src/commonMain/kotlin/androidx/compose/material3/tokens/RadioButtonTokens.kt)
- [RadioButtonSamples.kt](https://github.com/androidx/androidx/blob/b2dcba37aea417626ed77a230e961f405d893c4c/compose/material3/material3/samples/src/main/java/androidx/compose/material3/samples/RadioButtonSamples.kt)
- [MotionScheme.kt](https://github.com/androidx/androidx/blob/b2dcba37aea417626ed77a230e961f405d893c4c/compose/material3/material3/src/commonMain/kotlin/androidx/compose/material3/MotionScheme.kt)
- [Ripple.kt](https://github.com/androidx/androidx/blob/b2dcba37aea417626ed77a230e961f405d893c4c/compose/material3/material3/src/commonMain/kotlin/androidx/compose/material3/Ripple.kt)
- [ColorVectorConverter.kt](https://github.com/androidx/androidx/blob/b2dcba37aea417626ed77a230e961f405d893c4c/compose/animation/animation/src/commonMain/kotlin/androidx/compose/animation/ColorVectorConverter.kt)
