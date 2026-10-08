# Text fields

This independent React implementation follows AndroidX Material 3. Google does not maintain or endorse this package.

## Reference

Source authority: AndroidX revision [`40ff481447ab78cbdc1a316bc7c8ecfca630f19e`](https://github.com/androidx/androidx/tree/40ff481447ab78cbdc1a316bc7c8ecfca630f19e/compose/material3/material3/src/commonMain/kotlin/androidx/compose/material3), inspected October 7, 2026.

- `TextField.kt`, `OutlinedTextField.kt`, and `SecureTextField.kt`: public variants and defaults.
- `TextFieldDefaults.kt`: all four complete color sets, rounded expressive shapes, label positions, padding, and state precedence.
- `internal/TextFieldImpl.kt`: slot geometry, floating label, cutout, affix visibility, typography, and motion roles.
- `tokens/FilledTextFieldTokens.kt`, version `v0_210`, and `tokens/OutlinedTextFieldTokens.kt`, version `v0_103`: generated baseline tokens.
- Foundation `BasicSecureTextField.kt`: secure editing and 1500ms reveal duration.

The color defaults were extracted from the pinned constructors, including every disabled alpha override. Where generated tokens differ from the implementation, this port follows the implementation. AndroidX does not have separate components called "ExpressiveTextField". Its expressive configuration uses `tonalColors`, `roundedShape`, and an inside label on the existing filled/outlined components.

## Components

| Export | AndroidX equivalent | Default label | Input |
| --- | --- | --- | --- |
| `TextField`, `FilledTextField` | `TextField` | Inside | Growing multiline |
| `OutlinedTextField` | `OutlinedTextField` | Cutout | Growing multiline |
| `SecureTextField` | `SecureTextField` | Inside | Single-line password |
| `OutlinedSecureTextField` | `OutlinedSecureTextField` | Cutout | Single-line password |
| `TextFieldDecorator` | Defaults' decorator/decoration box | Depends on variant | Caller-owned editor |

All names have `Material`-prefixed exports. `TextField` accepts `variant="filled" | "outlined"`. Fields forward the actual input/textarea ref; secure fields forward an input ref. Unlike the usual web convention, the default growing multiline behavior matches Compose. Set `singleLine` to render a native input.

```tsx
const [name, setName] = useState('')

<FilledTextField
  singleLine
  label="Name"
  name="name"
  autoComplete="name"
  value={name}
  onValueChange={setName}
/>

<OutlinedTextField
  label="Notes"
  minLines={3}
  maxLines={6}
  supportingText="Additional details"
/>

<TextField
  singleLine
  colorMode="tonal"
  shape="rounded"
  labelPosition="inside"
  label="Expressive field"
/>
```

## Configuration

| Prop | Configuration |
| --- | --- |
| `label` | React content or a callback receiving `minimized` and `focused`. Use `aria-label` or `aria-labelledby` if there is no visible label. |
| `labelPosition` | `attached`, `inside`, `cutout`, or `above`. Attached resolves to inside for filled and cutout for outlined. Both container variants accept every position. |
| Label position object | `{ position, alwaysMinimize, expandedAlignment, minimizedAlignment }`. Alignments are `start`, `center`, or `end` and follow RTL. Above labels always minimize. |
| `alwaysMinimizeLabel` | Keeps attached/inside/cutout labels small even when empty and unfocused. |
| `placeholder` | Native placeholder string. Hidden while the expanded label occupies the input area. |
| `leadingIcon`, `trailingIcon` | Application-owned React content. Mark decorative artwork `aria-hidden`; name interactive buttons. Both slots reserve at least 48px. |
| `prefix`, `suffix` | React content, hidden visually and from accessibility while the label is expanded. Visible affixes have 2px separation from the input. Include their meaning in the field label/description where needed. |
| `supportingText` | Body-small content linked through `aria-describedby`. Applications can compose a counter or validation message here. |
| `isError`, `errorMessage` | Error colors and invalid semantics. An accessible error description defaults to "Invalid input". Existing description/error IDs are retained. |
| `disabled`, `readOnly` | Native semantics. Read-only fields can receive focus and allow selection/copy. Disabled colors take precedence over error and focus. Secure fields follow AndroidX and omit read-only configuration. |
| `singleLine`, `minLines`, `maxLines`, `rows`, `wrap` | Single-line horizontal scrolling or growing textarea with vertical scrolling at the maximum. `rows` aliases the minimum. Invalid maximum values clamp to the minimum. Height recalculates on text, font and width changes. |
| `value`, `defaultValue` | Controlled or uncontrolled stored string. Controlled fields change only when the parent accepts a change. Native form reset restores uncontrolled defaults. Single-line CR/LF characters display as spaces. |
| `onChange`, `onValueChange` | Native change event with the stored value, or stored string plus event. Both run after input transformation. |
| `inputTransformation` | `(proposedValue, { previousValue, selectionStart, selectionEnd, inputType }) => string | null`. Return null to reject the edit. Applies only to user edits, after IME composition commits. |
| `outputTransformation` | Display transformation with explicit UTF-16 caret mappings if length changes. See below. |
| Native input attributes | `type`, `name`, `form`, `autoComplete`, `autoFocus`, `inputMode`, `enterKeyHint`, `autoCapitalize`, `spellCheck`, `required`, `pattern`, `min`, `max`, `step`, `maxLength`, ARIA/data attributes, and native event handlers. Input-specific attributes have native meaning on a single-line input. |
| `onKeyboardAction` | Handles unconsumed, non-composing Enter on editable single-line fields. Use native `onKeyDown` to cancel. Default form submission follows the browser. |
| `onSelect`, `onScroll`, native ref | Selection, scroll and geometry access corresponding to Compose's selection state, scroll state, and layout query. |
| `colorMode` | `default` or `tonal`, independently of variant and motion scheme. |
| `colors` | Every AndroidX color role and state, cursor/error cursor, and selection colors. Final CSS colors include their own alpha. |
| `shape` | `default`, `rounded`, a numeric radius in pixels, or a CSS border-radius string. Rounded uses the medium system corner token. |
| `contentPadding`, `supportingTextPadding` | `{ start, top, end, bottom }`, each in CSS pixels or a CSS length. Logical sides follow RTL. |
| `focusedIndicatorThickness`, `unfocusedIndicatorThickness` | Indicator/outline width overrides, numeric pixels or CSS lengths. |
| `textStyle` | Native editor typography/style override. |
| `container` | Replace the default background/border with application-owned React content or a callback receiving focus, disabled, and error state. |
| `className`, `style`, `fullWidth`, `containerProps` | Wrapper customization. Native input attributes belong to the editor; `containerProps` belong to the wrapper. |

`TextFieldDefaults` and `OutlinedTextFieldDefaults` expose dimensions, default/rounded shapes, color factories, tonal color factories, padding factories, and indicator/border widths. `MATERIAL_TEXT_FIELD_DIMENSIONS` exposes the numeric defaults. `getMaterialTextFieldColors(variant, colorMode)` returns the complete state color object.

`TextFieldDecorator` accepts the same visual configuration plus `inputId`, `value`, `focused`, `disabled`, `singleLine`, `supportingTextId`, and `errorId`. Its children occupy the native editor slot. A custom editor owns focus tracking, value updates, label IDs and accessible descriptions. Decorative duplicate labels and outline legends are hidden from accessibility.

## Geometry and colors

Default width is 280px and container height is at least 56px. Width can shrink in narrow web layouts. Inputs use body large, 16px/24px with 0.5px tracking. Minimized labels and supporting text use body small, 12px/16px with 0.4px tracking. These all read system typography tokens.

Content padding is 16px on every side without an inside label. Inside labels use 8px top/bottom padding plus a 16px small label line, retaining the 56px container. Icons are 24px inside a 48px minimum slot; adjacent content padding subtracts 12px, yielding a 52px text inset with default padding. Supporting text has 16px horizontal inset and 4px top padding. Above labels have 4px horizontal and bottom padding. Cutout fields reserve 8px above the container, and the transparent outline cutout has 4px on each side of the label.

| Color set | Container | Indicator | Focus | Error |
| --- | --- | --- | --- | --- |
| Filled default | Surface-container-highest | On-surface-variant | Primary indicator/label | Error indicator/label/supporting/trailing icon |
| Outlined default | Transparent | Outline | Primary indicator/label | Error indicator/label/supporting/trailing icon |
| Filled tonal | Surface-container | Transparent | On-surface-variant label | Error-container, error label/supporting/trailing icon |
| Outlined tonal | Transparent | Outline-variant | Outline-variant, on-surface-variant label | Error outline/label/supporting/trailing icon |

Default filled shape is 4px top corners and square bottom corners. Default outlined shape is 4px at every corner. Expressive rounded shape is the system medium corner, currently 12px. Resting/focused indicators are 1px/2px; focused thickness also applies in error state.

Baseline disabled text, label, and icons use on-surface at 38%. Filled disabled container stays surface-container-highest, matching `TextFieldDefaults.kt`, although generated tokens also declare a 4% on-surface disabled container. Filled disabled indicator is 38%; outlined disabled outline is 12%. Tonal filled disabled container is surface-container at 38%; tonal outlined disabled outline remains outline-variant. Prefix/suffix and supporting disabled colors follow their respective AndroidX constructors.

Compose resolves colors from enabled, error, and focus. This port follows that order; unused hover token declarations do not add hover styling absent from AndroidX's implementation.

## Display transformations

Return a string for a transformation that preserves length. For inserted formatting, provide the displayed string and both offset functions:

```tsx
<TextField
  singleLine
  name="code"
  label="Code"
  outputTransformation={raw => ({
    text: raw.length > 2 ? `${raw.slice(0, 2)}-${raw.slice(2)}` : raw,
    originalToTransformed: offset => offset > 2 ? offset + 1 : offset,
    transformedToOriginal: offset => offset > 2 ? offset - 1 : offset,
  })}
/>
```

Edits map back to the stored string. Backspace/delete across formatting-only characters advances through stored text. Native form serialization uses a hidden input containing the stored string. Length-changing string-only transformations throw rather than silently misplacing the caret. Applications own offset mappings and native validation rules for formatted input. DOM selection offsets use UTF-16, matching browser input APIs.

## Secure editing

`textObfuscationMode` supports `system`, `hidden`, `visible`, and `reveal-last-typed`. System uses the browser's native password rendering. Hidden uses the masked display layer to suppress platform character reveal. System behavior follows the browser and OS; browser APIs do not expose Android's touch/hardware "show passwords" setting. Visible uses a native text input. Explicit reveal mode displays a single inserted code point for 1500ms; paste/drop and multi-character edits remain masked. Blur, selection navigation, reset, and mode changes hide it. Copy/cut are blocked, including visible mode, matching secure-field editing.

`textObfuscationCharacter` selects a custom mask code point. Custom masks and timed reveal use an accessibility-hidden display layer over a native password input, retaining native form values, autocomplete and editing. That layer draws a caret and selection using the displayed glyph widths. Browser scroll anchoring and password-manager decorations still belong to the native password control. Application-owned trailing buttons can toggle visibility; the package adds no built-in reveal/clear icons.

## Motion, accessibility, and platform adaptations

AndroidX uses FastSpatial for label position/size and indicator thickness, FastEffects for colors/affixes, and SlowEffects for placeholder entry. All values are shared in `src/theme/motion.css` and follow the active Standard/Expressive scheme. Disabled indicators update immediately. Reduced motion removes field transitions and custom caret blinking. Forced colors use system field, highlight, and disabled colors.

Labels use native `label`/`for`; IDs are stable and unique. Native input/textarea controls retain browser focus order, editing, selection, undo, clipboard, IME, validation and form behavior. The field container focuses the editor when clicked; interactive slot controls retain independent focus. Error text is available through accessible descriptions and `aria-errormessage`, without imposing application-level alerts.

Android dp dimensions map to CSS pixels. Native Android springs are represented by the package's CSS motion curves. Font rasterization, mobile keyboards, spellcheck, autofill, selection handles, password masking and scrolling differ by platform. These adaptations prevent a claim of universal pixel identity between a browser and Android rendering. Exposed selection handle color is available to custom editors; native browser handles cannot be styled portably. Label callbacks report the target minimized state; CSS performs interpolation. Framework-specific Compose interaction sources map to native focus/pointer/event handlers and refs on the web.

## Verification

Focused tests cover all variants and label positions, controlled/uncontrolled state, native attributes/refs, line limits, error descriptions, disabled/read-only behavior, input filtering, IME composition, display formatting/caret mapping, form reset, secure modes, timed reveal, and state/customization defaults. The gallery adds a live configurator, state/color matrices, slot/label examples, multiline input and password examples. `pnpm verify` runs type checking, the complete test suite, package/gallery builds and package dry run.
