import { useId, useState } from 'react'
import {
  FilledTextField, OutlinedTextField, SecureTextField, OutlinedSecureTextField,
  TextField, TextFieldDecorator, IconButton, Switch, Text, type MaterialTextFieldVariant,
  type MaterialTextFieldColorMode, type MaterialTextFieldLabelPosition,
  type MaterialTextFieldAlignment,
} from '../../src'
import { GallerySelect } from './GallerySelect'
import { GallerySymbol } from './GallerySymbol'
import './TextFieldExamples.css'

export function TextFieldExamples() {
  const [value, setValue] = useState('')
  const [variant, setVariant] = useState<MaterialTextFieldVariant>('filled')
  const [colorMode, setColorMode] = useState<MaterialTextFieldColorMode>('default')
  const [position, setPosition] = useState<'attached' | 'inside' | 'cutout' | 'above'>('attached')
  const [alignment, setAlignment] = useState<MaterialTextFieldAlignment>('start')
  const [rounded, setRounded] = useState(false)
  const [disabled, setDisabled] = useState(false)
  const [readOnly, setReadOnly] = useState(false)
  const [error, setError] = useState(false)
  const [alwaysMinimize, setAlwaysMinimize] = useState(false)
  const [singleLine, setSingleLine] = useState(true)
  const [label, setLabel] = useState(true)
  const [icons, setIcons] = useState(true)
  const [affixes, setAffixes] = useState(false)
  const [password, setPassword] = useState('')
  const [visible, setVisible] = useState(false)
  const [notes, setNotes] = useState('')
  const [customValue, setCustomValue] = useState('')
  const [customFocused, setCustomFocused] = useState(false)
  const customInputId = useId()
  const customSupportingId = useId()
  const labelPosition: MaterialTextFieldLabelPosition = { position, minimizedAlignment: alignment, expandedAlignment: alignment }
  return <div className="text-field-examples">
    <article className="specimen specimen--wide">
      <header className="specimen__header"><div><h3 data-material-typography="titleLargeEmphasized">Text field configurator</h3><p data-material-typography="bodyMedium">AndroidX defaults, expressive tonal colors, and every label position.</p></div><code>TextField · FilledTextField · OutlinedTextField</code></header>
      <div className="text-field-examples__config">
        <div className="text-field-examples__preview">
          <TextField fullWidth value={value} onValueChange={setValue} variant={variant} colorMode={colorMode}
            label={label ? 'Label' : undefined} aria-label={label ? undefined : 'Unlabelled example'}
            placeholder="Placeholder" labelPosition={labelPosition} alwaysMinimizeLabel={alwaysMinimize}
            shape={rounded ? 'rounded' : 'default'} disabled={disabled} readOnly={readOnly} isError={error}
            errorMessage="Check this value" supportingText={error ? 'Check this value' : 'Supporting text'}
            singleLine={singleLine} minLines={1} maxLines={4}
            leadingIcon={icons ? <GallerySymbol name="search" /> : undefined}
            trailingIcon={icons ? <IconButton aria-label="Clear text" disabled={disabled || readOnly || !value} onClick={() => setValue('')}><GallerySymbol name="close" /></IconButton> : undefined}
            prefix={affixes ? '$' : undefined} suffix={affixes ? 'USD' : undefined}
          />
        </div>
        <div className="text-field-examples__controls">
          <GallerySelect label="Field variant" value={variant} options={['filled', 'outlined']} onChange={v => setVariant(v as MaterialTextFieldVariant)} />
          <GallerySelect label="Field colors" value={colorMode} options={['default', 'tonal']} onChange={v => setColorMode(v as MaterialTextFieldColorMode)} />
          <GallerySelect label="Label position" value={position} options={['attached', 'inside', 'cutout', 'above']} onChange={v => setPosition(v as typeof position)} />
          <GallerySelect label="Label alignment" value={alignment} options={['start', 'center', 'end']} onChange={v => setAlignment(v as MaterialTextFieldAlignment)} />
          {([
            ['Rounded shape', rounded, setRounded], ['Single line', singleLine, setSingleLine],
            ['Show label', label, setLabel], ['Always minimize label', alwaysMinimize, setAlwaysMinimize],
            ['Show field icons', icons, setIcons], ['Show prefix and suffix', affixes, setAffixes],
            ['Field error', error, setError], ['Field disabled', disabled, setDisabled],
            ['Field read only', readOnly, setReadOnly],
          ] as const).map(([name, checked, setter]) => <label key={name} className="text-field-examples__switch"><span>{name}</span><Switch aria-label={name} checked={checked} onChange={event => setter(event.target.checked)} /></label>)}
        </div>
      </div>
    </article>
    <article className="specimen specimen--wide">
      <header className="specimen__header"><div><h3 data-material-typography="titleLargeEmphasized">Container and state families</h3><p data-material-typography="bodyMedium">Filled and outlined fields with default and expressive tonal color sets. Focus any enabled example to compare its focus state.</p></div><code>TextField</code></header>
      <div className="text-field-examples__matrix">
        {(['filled', 'outlined'] as const).flatMap(variant => (['default', 'tonal'] as const).map(mode => <div key={`${variant}-${mode}`} className="text-field-examples__column">
          <Text variant="titleSmall">{variant === 'filled' ? 'Filled' : 'Outlined'} · {mode === 'tonal' ? 'Tonal' : 'Default'}</Text>
          {(['empty', 'populated', 'error', 'disabled', 'read only'] as const).map(state => <TextField key={state} fullWidth singleLine variant={variant} colorMode={mode} shape={mode === 'tonal' ? 'rounded' : 'default'} labelPosition={mode === 'tonal' ? 'inside' : 'attached'} label={state[0].toUpperCase() + state.slice(1)} defaultValue={state === 'empty' ? '' : 'Input text'} placeholder="Placeholder" supportingText={state === 'error' ? 'Error message' : 'Supporting text'} isError={state === 'error'} disabled={state === 'disabled'} readOnly={state === 'read only'} />)}
        </div>))}
      </div>
    </article>
    <article className="specimen specimen--wide">
      <header className="specimen__header"><div><h3 data-material-typography="titleLargeEmphasized">Label positions and content slots</h3><p data-material-typography="bodyMedium">Floating, inside, cutout, above, and always-minimized labels. Icons occupy 48px slots; affixes use a 2px gap.</p></div><code>FilledTextField · OutlinedTextField</code></header>
      <div className="text-field-examples__grid">
        <FilledTextField fullWidth singleLine label="Amount" prefix="$" suffix="USD" placeholder="0.00" supportingText="Prefix and suffix" />
        <OutlinedTextField fullWidth singleLine label="Website" leadingIcon={<GallerySymbol name="language" />} prefix="https://" placeholder="example.com" supportingText="Leading icon and prefix" />
        <FilledTextField fullWidth singleLine label="Above label" labelPosition="above" placeholder="Placeholder" />
        <OutlinedTextField fullWidth singleLine label="Always minimized" alwaysMinimizeLabel placeholder="Placeholder" />
        <OutlinedTextField fullWidth singleLine label="Inside label" labelPosition="inside" />
        <FilledTextField fullWidth singleLine label="Cutout label" labelPosition="cutout" />
        <OutlinedTextField fullWidth singleLine label="Centered label" labelPosition={{ position: 'cutout', expandedAlignment: 'center', minimizedAlignment: 'center' }} />
        <div dir="rtl"><OutlinedTextField fullWidth singleLine label="حقل نص" placeholder="اكتب هنا" supportingText="نص مساعد" leadingIcon={<GallerySymbol name="search" />} /></div>
      </div>
    </article>
    <article className="specimen specimen--wide">
      <header className="specimen__header"><div><h3 data-material-typography="titleLargeEmphasized">Multiline and input configuration</h3><p data-material-typography="bodyMedium">Growing multiline input, native form attributes, input filtering, and display formatting.</p></div><code>TextField</code></header>
      <div className="text-field-examples__grid">
        <FilledTextField fullWidth label="Notes" value={notes} onValueChange={setNotes} minLines={3} maxLines={5} maxLength={200} supportingText={`${notes.length} / 200`} />
        <OutlinedTextField fullWidth label="Multiline outlined" minLines={3} maxLines={5} defaultValue={'First line\nSecond line\nThird line'} />
        <FilledTextField fullWidth singleLine label="Email address" type="email" name="email" autoComplete="email" inputMode="email" placeholder="name@example.com" />
        <OutlinedTextField fullWidth singleLine label="Digits only" inputMode="numeric" inputTransformation={next => /^\d*$/.test(next) ? next : null} supportingText="Non-numeric edits are rejected" />
        <TextField fullWidth singleLine label="Uppercase input" inputTransformation={next => next.toUpperCase()} supportingText="Input transformation" />
        <TextField fullWidth singleLine label="Formatted code" defaultValue="1234" outputTransformation={raw => ({ text: raw.length > 2 ? `${raw.slice(0, 2)}-${raw.slice(2)}` : raw, originalToTransformed: i => i > 2 ? i + 1 : i, transformedToOriginal: i => i > 2 ? i - 1 : i })} supportingText="Formatting preserves the raw value" />
      </div>
    </article>
    <article className="specimen specimen--wide">
      <header className="specimen__header"><div><h3 data-material-typography="titleLargeEmphasized">Secure text fields</h3><p data-material-typography="bodyMedium">Native password behavior, timed character reveal, and custom obfuscation. Visibility controls belong to the application.</p></div><code>SecureTextField · OutlinedSecureTextField</code></header>
      <div className="text-field-examples__grid">
        <SecureTextField fullWidth label="Password" value={password} onValueChange={setPassword} textObfuscationMode={visible ? 'visible' : 'system'} trailingIcon={<IconButton aria-label={visible ? 'Hide password' : 'Show password'} onClick={() => setVisible(!visible)}><GallerySymbol name={visible ? 'visibility_off' : 'visibility'} /></IconButton>} />
        <OutlinedSecureTextField fullWidth label="Outlined password" textObfuscationMode="hidden" />
        <SecureTextField fullWidth label="Reveal last typed" textObfuscationMode="reveal-last-typed" supportingText="One character for 1.5 seconds" />
        <OutlinedSecureTextField fullWidth label="Custom password mask" textObfuscationCharacter="*" supportingText="Custom obfuscation character" />
      </div>
    </article>
    <article className="specimen specimen--wide">
      <header className="specimen__header"><div><h3 data-material-typography="titleLargeEmphasized">Custom editor decoration</h3><p data-material-typography="bodyMedium">Material labels and supporting text around a controlled native editor.</p></div><code>TextFieldDecorator</code></header>
      <div className="text-field-examples__grid">
        <TextFieldDecorator fullWidth singleLine variant="outlined" inputId={customInputId} supportingTextId={customSupportingId}
          label="Custom editor" value={customValue} focused={customFocused} supportingText={`${customValue.length} characters`}>
          <input className="material-text-field__input" id={customInputId} aria-describedby={customSupportingId} value={customValue}
            placeholder="Type here" onChange={event => setCustomValue(event.currentTarget.value)}
            onFocus={() => setCustomFocused(true)} onBlur={() => setCustomFocused(false)} />
        </TextFieldDecorator>
      </div>
    </article>
  </div>
}
