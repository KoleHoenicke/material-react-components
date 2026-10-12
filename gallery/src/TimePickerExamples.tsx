import { useState } from 'react'
import {
  Button, Switch, TimePicker, TimeInput, TimeScroll, TimePickerDialog, VibrantTimePickerDialog, TimePickerModeToggle,
  type MaterialTimePickerValue, type MaterialTimePickerVariant, type MaterialTimePickerDisplayMode,
} from '../../src'
import './TimePickerExamples.css'

function Preview({ title, variant = 'baseline', layout = 'vertical', is24Hour = false, mode = 'picker', uncontained = false }: {
  title: string; variant?: MaterialTimePickerVariant; layout?: 'vertical' | 'horizontal'; is24Hour?: boolean;
  mode?: MaterialTimePickerDisplayMode; uncontained?: boolean;
}) {
  const [value, setValue] = useState<MaterialTimePickerValue>({ hour: is24Hour ? 19 : 7, minute: 30 })
  const [displayMode, setMode] = useState(mode)
  const [valid, setValid] = useState(true)
  const props = { value, onValueChange: setValue, variant, is24Hour }
  const toggle = uncontained ? <TimePickerModeToggle displayMode={displayMode} alternateMode="scroll" onDisplayModeChange={setMode} /> : undefined
  return <article className="time-examples__preview">
    <h3 data-material-typography="titleMedium">{title}</h3>
    <div className="time-examples__stage" data-variant={variant}>
      {displayMode === 'picker' ? <TimePicker {...props} layoutType={layout} />
        : displayMode === 'input' ? <TimeInput {...props} toggle={toggle} onValidityChange={setValid} />
          : <TimeScroll value={value} onValueChange={setValue} is24Hour={is24Hour} toggle={toggle} />}
    </div>
    <output aria-label={`${title} selected time`} data-material-typography="bodyMedium">{valid ? `${String(value.hour).padStart(2, '0')}:${String(value.minute).padStart(2, '0')}` : 'Enter a valid time'}</output>
  </article>
}
function DialogExample({ vibrant = false, scroll = false }: { vibrant?: boolean; scroll?: boolean }) {
  const [open, setOpen] = useState(false)
  const [value, setValue] = useState({ hour: 19, minute: 30 })
  const [confirmed, setConfirmed] = useState(value)
  const [mode, setMode] = useState<MaterialTimePickerDisplayMode>(scroll ? 'scroll' : 'picker')
  const [valid, setValid] = useState(true)
  const Container = vibrant ? VibrantTimePickerDialog : TimePickerDialog
  const variant = vibrant ? 'vibrant' : 'baseline'
  const title = `${vibrant ? 'Vibrant' : 'Baseline'} ${scroll ? 'scroll' : 'dial'} dialog`
  return <div className="time-examples__dialog-example">
    <Button variant="outlined" onClick={() => { setValue(confirmed); setValid(true); setMode(scroll ? 'scroll' : 'picker'); setOpen(true) }}>{title}</Button>
    <output aria-label={`${title} confirmed time`} data-material-typography="bodyMedium">{String(confirmed.hour).padStart(2, '0')}:{String(confirmed.minute).padStart(2, '0')}</output>
    <Container open={open} onDismissRequest={() => setOpen(false)}
      {...(!vibrant ? { title: mode === 'input' ? 'Enter Time' : 'Select Time' } : {})}
      modeToggleButton={<TimePickerModeToggle displayMode={mode} alternateMode={scroll ? 'scroll' : 'picker'} onDisplayModeChange={next => { setValid(true); setMode(next) }} />}
      dismissButton={<Button variant="text" onClick={() => setOpen(false)}>Cancel</Button>}
      confirmButton={<Button variant="text" disabled={!valid} onClick={() => { setConfirmed(value); setOpen(false) }}>OK</Button>}>
      {mode === 'picker' ? <TimePicker value={value} onValueChange={setValue} variant={variant} layoutType="vertical" />
        : mode === 'input' ? <TimeInput value={value} onValueChange={setValue} onValidityChange={setValid} variant={variant} autoFocus />
          : <TimeScroll value={value} onValueChange={setValue} />}
    </Container>
  </div>
}
export function TimePickerExamples() {
  const [rtl, setRtl] = useState(false)
  return <div className="time-examples" dir={rtl ? 'rtl' : 'ltr'}>
    <p data-material-typography="bodyLarge">AndroidX dial, text input, and scroll input. Select an hour, then minutes. Drag the dial to choose individual minutes.</p>
    <label className="time-examples__direction" data-material-typography="bodyLarge"><Switch aria-label="Right-to-left time pickers" checked={rtl} onChange={event => setRtl(event.currentTarget.checked)} />Right-to-left layout</label>
    <div className="time-examples__dialogs"><DialogExample /><DialogExample vibrant /><DialogExample vibrant scroll /></div>
    <div className="time-examples__grid">
      <Preview title="Baseline · vertical · 12 hour" />
      <Preview title="Baseline · vertical · 24 hour" is24Hour />
      <Preview title="Baseline · horizontal" layout="horizontal" />
      <Preview title="Vibrant · vertical · 12 hour" variant="vibrant" />
      <Preview title="Vibrant · vertical · 24 hour" variant="vibrant" is24Hour />
      <Preview title="Vibrant · horizontal" variant="vibrant" layout="horizontal" />
      <Preview title="Baseline text input · 12 hour" mode="input" />
      <Preview title="Baseline text input · 24 hour" mode="input" is24Hour />
      <Preview title="Vibrant text input · 12 hour" variant="vibrant" mode="input" />
      <Preview title="Vibrant text input · 24 hour" variant="vibrant" mode="input" is24Hour />
      <Preview title="Vibrant scroll input · 12 hour" variant="vibrant" mode="scroll" />
      <Preview title="Vibrant scroll input · 24 hour" variant="vibrant" mode="scroll" is24Hour />
      <Preview title="Uncontained input with mode switch" variant="vibrant" mode="input" uncontained />
      <Preview title="Uncontained scroll with mode switch" variant="vibrant" mode="scroll" uncontained />
    </div>
  </div>
}
