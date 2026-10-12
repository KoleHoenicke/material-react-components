/* Adapted from AndroidX Material3 TimePicker.kt, TimePickerDialog.kt and ScrollField.kt,
 * revision d15bc3d0c69caa87d369676a3ab81a19799a0566. Apache-2.0.
 * Copyright 2023-2026 The Android Open Source Project. */
import {
  forwardRef, useEffect, useId, useLayoutEffect, useRef, useState,
  type CSSProperties, type HTMLAttributes, type KeyboardEvent, type PointerEvent,
  type ReactNode, type Ref, type RefObject,
} from 'react'
import { clockAngle, clockLabels, clockPosition, clockValueAt, displayHour, validateTime, TIME_PICKER_GEOMETRY, type TimePickerValue, type TimePickerSelection } from '../internal/timePickerGeometry'
import { useTimePickerSpring } from '../internal/useTimePickerSpring'
import { MATERIAL_TIME_PICKER_MOTION } from '../theme/materialMotion'
import { MaterialBasicDialog, type MaterialBasicDialogProps } from './MaterialDialog'
import { MaterialIconButton, type MaterialIconButtonProps } from './MaterialIconButton'
import { MaterialRipple } from './MaterialRipple'
import './MaterialTimePicker.css'

export type MaterialTimePickerValue = TimePickerValue
export type MaterialTimePickerSelection = TimePickerSelection
export type MaterialTimePickerVariant = 'baseline' | 'vibrant'
export type MaterialTimePickerLayoutType = 'vertical' | 'horizontal' | 'auto'
export type MaterialTimePickerDisplayMode = 'picker' | 'input' | 'scroll'
export type MaterialTimePickerStyle = CSSProperties & { [key: `--md-time-picker-${string}`]: string | number | undefined }
export type MaterialTimePickerLabels = {
  hour: string; minute: string; hourSelection: string; minuteSelection: string; hourTextField: string; minuteTextField: string;
  period: string; am: string; pm: string; hourError: string; hour24Error: string; minuteError: string;
  hourSuffix: string; hour24Suffix: string; minuteSuffix: string;
}
const defaultLabels: MaterialTimePickerLabels = {
  hour: 'Hour', minute: 'Minute', hourSelection: 'Select hour', minuteSelection: 'Select minutes', hourTextField: 'for hour', minuteTextField: 'for minutes',
  period: 'Select AM or PM', am: 'AM', pm: 'PM', hourError: 'Hour must be 1–12',
  hour24Error: 'Hour must be 0–23', minuteError: 'Minute must be 0–59',
  hourSuffix: "{value} o'clock", hour24Suffix: '{value} hours', minuteSuffix: '{value} minutes',
}
export type MaterialTimePickerProps = Omit<HTMLAttributes<HTMLDivElement>, 'defaultValue' | 'onChange' | 'style' | 'children'> & {
  value?: MaterialTimePickerValue
  defaultValue?: MaterialTimePickerValue
  onValueChange?: (value: MaterialTimePickerValue) => void
  selection?: MaterialTimePickerSelection
  defaultSelection?: MaterialTimePickerSelection
  onSelectionChange?: (selection: MaterialTimePickerSelection) => void
  is24Hour?: boolean
  variant?: MaterialTimePickerVariant
  layoutType?: MaterialTimePickerLayoutType
  /** Turn off for assistive technologies that need to retain the hour dial after activation. */
  autoSwitchToMinute?: boolean
  labels?: Partial<MaterialTimePickerLabels>
  locale?: string
  style?: MaterialTimePickerStyle
}
export type MaterialTimeInputProps = Omit<MaterialTimePickerProps, 'layoutType'> & {
  /** Uncontained vibrant input mode switch, owned by the caller. */
  toggle?: ReactNode
  onValidityChange?: (valid: boolean) => void
  autoFocus?: boolean
}
export type MaterialTimeScrollProps = Omit<MaterialTimePickerProps, 'layoutType' | 'variant'> & { toggle?: ReactNode }

const classes = (...parts: (string | undefined)[]) => parts.filter(Boolean).join(' ')
function assignRef<T>(ref: Ref<T> | undefined, value: T | null) {
  if (typeof ref === 'function') ref(value)
  else if (ref) ref.current = value
}
function useControl(props: MaterialTimePickerProps) {
  const [internalValue, setValue] = useState(props.defaultValue ?? { hour: 0, minute: 0 })
  const [internalSelection, setSelection] = useState(props.defaultSelection ?? 'hour')
  const value = props.value ?? internalValue
  validateTime(value)
  const selection = props.selection ?? internalSelection
  const labels = { ...defaultLabels, ...props.labels }
  const is24Hour = props.is24Hour ?? false
  const format = (number: number, padded = false) => new Intl.NumberFormat(props.locale, { minimumIntegerDigits: padded ? 2 : 1, useGrouping: false }).format(number)
  return {
    value, selection, labels, is24Hour, format,
    select: (next: TimePickerSelection) => { if (props.selection === undefined) setSelection(next); if (selection !== next) props.onSelectionChange?.(next) },
    change: (next: TimePickerValue) => {
      validateTime(next)
      if (props.value === undefined) setValue(next)
      if (value.hour !== next.hour || value.minute !== next.minute) props.onValueChange?.(next)
    },
  }
}
type Control = ReturnType<typeof useControl>

function PeriodButton({ selected, children, onClick }: { selected: boolean; children: ReactNode; onClick: () => void }) {
  const ref = useRef<HTMLButtonElement>(null)
  const [pressed, setPressed] = useState(false)
  const [roundRadius, setRoundRadius] = useState(28)
  useLayoutEffect(() => {
    const measure = () => {
      const rect = ref.current?.getBoundingClientRect()
      if (rect?.width && rect.height) setRoundRadius(Math.min(rect.width, rect.height) / 2)
    }
    measure()
    const observer = new ResizeObserver(measure)
    if (ref.current) observer.observe(ref.current)
    return () => observer.disconnect()
  }, [])
  // ToggleButton's shape spring is FastSpatial. Full rounds are bounded to half the visual height.
  const radius = useTimePickerSpring(selected || pressed ? 12 : roundRadius, ref, 'spatial', 'fast').value
  return <button ref={ref} type="button" role="radio" aria-checked={selected}
    className="material-time-picker__period-button" data-selected={selected}
    style={{ '--md-time-picker-period-animated-radius': `${radius}px` } as CSSProperties}
    data-material-typography="titleMedium" onClick={onClick}
    onPointerDown={() => setPressed(true)} onPointerUp={() => setPressed(false)} onPointerCancel={() => setPressed(false)} onPointerLeave={() => setPressed(false)}
    onKeyDown={event => { if (event.key === ' ' || event.key === 'Enter') setPressed(true) }} onKeyUp={() => setPressed(false)} onBlur={() => setPressed(false)}>
    <MaterialRipple /><span>{children}</span>
  </button>
}
function Period({ control, horizontal = false, toggle, canChange = true }: { control: Control; horizontal?: boolean; toggle?: ReactNode; canChange?: boolean }) {
  const { value, change, labels, is24Hour } = control
  if (is24Hour && toggle == null) return null
  return <div className="material-time-picker__period" role="radiogroup" aria-label={labels.period}
    data-horizontal={horizontal} data-side-control={toggle != null} data-24-hour={is24Hour}
    onKeyDown={event => {
      if (!['ArrowDown', 'ArrowUp', 'ArrowLeft', 'ArrowRight'].includes(event.key)) return
      const buttons = Array.from(event.currentTarget.querySelectorAll<HTMLButtonElement>('[role="radio"]'))
      if (!buttons.length) return
      event.preventDefault()
      const index = buttons.indexOf(document.activeElement as HTMLButtonElement)
      const direction = event.key === 'ArrowUp' || event.key === 'ArrowLeft' ? -1 : 1
      buttons[(index + direction + buttons.length) % buttons.length].focus()
      buttons[(index + direction + buttons.length) % buttons.length].click()
    }}>
    {!is24Hour && <><PeriodButton selected={value.hour < 12} onClick={() => { if (canChange) change({ ...value, hour: value.hour % 12 }) }}>{labels.am}</PeriodButton>
      <PeriodButton selected={value.hour >= 12} onClick={() => { if (canChange) change({ ...value, hour: value.hour % 12 + 12 }) }}>{labels.pm}</PeriodButton></>}
    {toggle != null && <div className="material-time-picker__side-toggle">{toggle}</div>}
  </div>
}

function ClockDisplay({ control, horizontal }: { control: Control; horizontal: boolean }) {
  const { value, selection, select, labels, is24Hour, format } = control
  return <div className="material-time-picker__display" data-horizontal={horizontal}>
    <div className="material-time-picker__numbers" dir="ltr" role="radiogroup" aria-label="Time selection">
      {(['hour', 'minute'] as const).map((part, index) => <div className="material-time-picker__number-part" key={part}>
        {index === 1 && <span className="material-time-picker__separator" aria-hidden="true" data-material-typography="displayLarge">:</span>}
        <button type="button" role="radio" aria-checked={selection === part}
          aria-label={`${part === 'hour' ? labels.hourSelection : labels.minuteSelection}, ${format(part === 'hour' ? displayHour(value.hour, is24Hour) : value.minute)}`}
          className="material-time-picker__selector" data-selected={selection === part} data-part={part}
          data-material-typography="displayLarge" onClick={() => select(part)}>
          <MaterialRipple /><span>{format(part === 'hour' ? displayHour(value.hour, is24Hour) : value.minute, true)}</span>
        </button>
      </div>)}
    </div>
    <Period control={control} horizontal={horizontal} />
  </div>
}

function ClockFace({ control, autoSwitch }: { control: Control; autoSwitch: boolean }) {
  const { value, selection, change, select, is24Hour, format, labels } = control
  const root = useRef<HTMLDivElement>(null)
  const [dialScale, setDialScale] = useState(1)
  useLayoutEffect(() => {
    const measure = () => setDialScale(256 / (root.current?.getBoundingClientRect().width || 256))
    measure()
    const observer = new ResizeObserver(measure)
    if (root.current) observer.observe(root.current)
    return () => observer.disconnect()
  }, [])
  const clipId = useId().replaceAll(':', '')
  const gesture = useRef<{ id: number; x: number; y: number; dragged: boolean } | null>(null)
  const [dragAngle, setDragAngle] = useState<number | null>(null)
  const [snap, setSnap] = useState(false)
  const [pendingAdvance, setPendingAdvance] = useState(false)
  const angleTarget = dragAngle ?? clockAngle(value, selection)
  const angle = useTimePickerSpring(angleTarget, root, 'spatial', 'default', dragAngle != null || snap, true)
  const fraction = useTimePickerSpring(selection === 'minute' ? 1 : 0, root, 'effects').value
  const radius = is24Hour && selection === 'hour' && value.hour >= 12 ? 69 : 101
  const x = 128 + Math.cos(angle.value) * radius
  const y = 128 + Math.sin(angle.value) * radius
  useEffect(() => {
    if (!pendingAdvance || !angle.settled || selection !== 'hour') return
    // Wait for the actual selected angle, including the layout effect that starts a new spring.
    if (Math.abs(Math.sin(angle.value - angleTarget)) > 0.01 || Math.cos(angle.value - angleTarget) < 0) return
    const configured = root.current ? getComputedStyle(root.current).getPropertyValue('--md-time-picker-auto-advance-delay').trim() : ''
    const delay = configured ? parseFloat(configured) * (configured.endsWith('ms') ? 1 : 1000) : MATERIAL_TIME_PICKER_MOTION.autoAdvanceDelayMs
    const timer = window.setTimeout(() => { setPendingAdvance(false); select('minute') }, delay)
    return () => window.clearTimeout(timer)
  }, [pendingAdvance, angle.settled, angle.value, angleTarget, selection, select])
  useEffect(() => { setPendingAdvance(false) }, [selection])
  const pointerValue = (event: PointerEvent<HTMLDivElement>, tap: boolean) => {
    const rect = event.currentTarget.getBoundingClientRect()
    const size = rect.width || 256
    return clockValueAt((event.clientX - rect.left) * 256 / size, (event.clientY - rect.top) * 256 / size, selection, is24Hour, value.hour, tap, 74 * 256 / size)
  }
  const applyPointer = (event: PointerEvent<HTMLDivElement>, tap: boolean) => {
    const next = pointerValue(event, tap)
    change({ ...value, [selection]: next.value })
    setSnap(false)
    if (!tap) setDragAngle(next.angle)
  }
  const selectedLabel = selection === 'hour' ? displayHour(value.hour, is24Hour) : Math.round(value.minute / 5) * 5 % 60
  const currentLabels = clockLabels(selection, is24Hour)
  const describe = (part: TimePickerSelection, number: number) => (part === 'minute' ? labels.minuteSuffix : is24Hour ? labels.hour24Suffix : labels.hourSuffix).replace('{value}', format(number))
  const activate = (number: number, keyboard: boolean) => {
    setSnap(true)
    change({ ...value, [selection]: selection === 'hour' && !is24Hour ? number % 12 + (value.hour >= 12 ? 12 : 0) : number })
    if (!keyboard && autoSwitch && selection === 'hour') setPendingAdvance(true)
  }
  const navigate = (event: KeyboardEvent<HTMLButtonElement>, index: number) => {
    const direction = ['ArrowDown', 'ArrowRight'].includes(event.key) ? 1 : ['ArrowUp', 'ArrowLeft'].includes(event.key) ? -1 : 0
    if (!direction) return
    event.preventDefault()
    const buttons = root.current?.querySelectorAll<HTMLButtonElement>('.material-time-picker__dial-label')
    buttons?.[(index + direction + currentLabels.length) % currentLabels.length]?.focus()
  }
  const textLayer = (part: TimePickerSelection) => clockLabels(part, is24Hour).map(label => {
    const position = clockPosition(label.index, label.radius)
    return <text key={label.value} x={position.x} y={position.y} textAnchor="middle" dominantBaseline="central">{format(label.value)}</text>
  })
  return <div ref={root} className="material-time-picker__dial" role="group" aria-label={selection === 'hour' ? labels.hourSelection : labels.minuteSelection}
    onPointerDown={event => {
      if (event.button !== 0 || event.isPrimary === false) return
      event.preventDefault()
      if (document.activeElement instanceof HTMLElement) document.activeElement.blur()
      setPendingAdvance(false)
      gesture.current = { id: event.pointerId, x: event.clientX, y: event.clientY, dragged: false }
      event.currentTarget.setPointerCapture?.(event.pointerId)
    }}
    onPointerMove={event => {
      const down = gesture.current
      if (!down || down.id !== event.pointerId) return
      if (Math.hypot(event.clientX - down.x, event.clientY - down.y) > 6) down.dragged = true
      if (down.dragged) applyPointer(event, false)
    }}
    onPointerUp={event => {
      const down = gesture.current
      if (!down || down.id !== event.pointerId) return
      gesture.current = null
      applyPointer(event, !down.dragged)
      setDragAngle(null)
      if (selection === 'hour' && autoSwitch) {
        if (down.dragged) select('minute')
        else setPendingAdvance(true)
      }
      event.currentTarget.releasePointerCapture?.(event.pointerId)
    }}
    onPointerCancel={() => { gesture.current = null; setDragAngle(null); setPendingAdvance(false) }}>
    <svg viewBox="0 0 256 256" aria-hidden="true" className="material-time-picker__dial-art" data-material-typography="bodyLarge"
      style={{ fontSize: `calc(var(--md-sys-typescale-body-large-size, 16px) * ${dialScale})`, letterSpacing: `calc(var(--md-sys-typescale-body-large-tracking, 0.5px) * ${dialScale})` }}>
      <defs><clipPath id={clipId}><circle cx={x} cy={y} r="24" /></clipPath></defs>
      <circle className="material-time-picker__handle" cx={x} cy={y} r="24" />
      <g className="material-time-picker__dial-text"><g opacity={1 - fraction}>{textLayer('hour')}</g><g opacity={fraction}>{textLayer('minute')}</g></g>
      <g clipPath={`url(#${clipId})`} className="material-time-picker__dial-selected-text"><g opacity={1 - fraction}>{textLayer('hour')}</g><g opacity={fraction}>{textLayer('minute')}</g></g>
      <line className="material-time-picker__track" x1="128" y1="128" x2={x - Math.cos(angle.value) * 24} y2={y - Math.sin(angle.value) * 24} strokeWidth="2" vectorEffect="non-scaling-stroke" />
      <circle className="material-time-picker__handle" cx="128" cy="128" r={4 * dialScale} />
    </svg>
    <div role="radiogroup" aria-label={selection === 'hour' ? labels.hourSelection : labels.minuteSelection}>
      {currentLabels.map((label, index) => {
        const position = clockPosition(label.index, label.radius)
        return <button key={`${selection}-${label.value}`} type="button" role="radio" aria-label={describe(selection, label.value)} aria-checked={selectedLabel === label.value}
          tabIndex={selectedLabel === label.value ? 0 : -1} className="material-time-picker__dial-label"
          style={{ left: `${position.x / 256 * 100}%`, top: `${position.y / 256 * 100}%` }}
          onKeyDown={event => navigate(event, index)} onClick={event => { if (event.detail === 0) activate(label.value, true) }}><MaterialRipple /></button>
      })}
    </div>
  </div>
}

function useLayoutType(layoutType: MaterialTimePickerLayoutType = 'auto') {
  const [landscape, setLandscape] = useState(() => typeof window !== 'undefined' && (window.matchMedia?.('(orientation: landscape)').matches ?? false))
  useEffect(() => {
    const query = window.matchMedia?.('(orientation: landscape)')
    const change = () => setLandscape(query?.matches ?? false)
    query?.addEventListener('change', change)
    return () => query?.removeEventListener('change', change)
  }, [])
  return layoutType === 'auto' ? landscape ? 'horizontal' : 'vertical' : layoutType
}

export const MaterialTimePicker = forwardRef<HTMLDivElement, MaterialTimePickerProps>(function MaterialTimePicker(props, ref) {
  const control = useControl(props)
  const { value, defaultValue, onValueChange, selection, defaultSelection, onSelectionChange, is24Hour, labels, locale,
    variant = 'baseline', layoutType, autoSwitchToMinute = true, className, style, ...rest } = props
  const layout = useLayoutType(layoutType)
  return <div {...rest} ref={ref} role={rest.role ?? 'group'} aria-label={rest['aria-label'] ?? 'Time picker'}
    className={classes('material-time-picker', className)} data-variant={variant} data-layout={layout} data-24-hour={control.is24Hour} style={style}>
    <ClockDisplay control={control} horizontal={layout === 'horizontal'} />
    <ClockFace control={control} autoSwitch={autoSwitchToMinute} />
  </div>
})

function InputField({ control, part, variant, autoAdvance, autoFocus, onValidityChange }: {
  control: Control; part: TimePickerSelection; variant: MaterialTimePickerVariant; autoAdvance: boolean; autoFocus: boolean;
  onValidityChange: (part: TimePickerSelection, valid: boolean) => void;
}) {
  const { value, is24Hour, format, labels, selection, select, change } = control
  const external = part === 'hour' ? displayHour(value.hour, is24Hour) : value.minute
  const [draft, setDraft] = useState(() => format(external, true))
  const [valid, setValid] = useState(true)
  const emitted = useRef(external)
  const localeKey = propsLocaleKey(format)
  const priorLocale = useRef(localeKey)
  const input = useRef<HTMLInputElement>(null)
  const errorId = useId()
  const selected = selection === part
  useEffect(() => {
    if (external !== emitted.current || priorLocale.current !== localeKey) { setDraft(format(external, true)); setValid(true); onValidityChange(part, true) }
    emitted.current = external
    priorLocale.current = localeKey
  }, [external, is24Hour, localeKey, draft])
  useLayoutEffect(() => {
    // Avoid stealing focus when standalone inputs are mounted into a gallery or another page.
    if (selected && (autoFocus || input.current?.closest('.material-time-input')?.contains(document.activeElement))) {
      input.current?.focus(); input.current?.setSelectionRange(0, 0)
    }
  }, [selected, autoFocus])
  const error = part === 'minute' ? labels.minuteError : is24Hour ? labels.hour24Error : labels.hourError
  const normalizeDigits = (text: string) => text.replace(/[٠-٩۰-۹]/g, character => String(character.charCodeAt(0) - (character >= '۰' ? 0x6f0 : 0x660)))
  return <div className="material-time-picker__input-part">
    <input ref={input} type="text" inputMode="numeric" enterKeyHint={part === 'hour' ? 'next' : 'done'}
      aria-label={part === 'hour' ? labels.hourTextField : labels.minuteTextField} aria-invalid={!valid || undefined}
      aria-describedby={!valid ? errorId : undefined} value={selected ? draft : valid ? format(external, true) : draft}
      className="material-time-picker__input" data-selected={selected} data-invalid={!valid}
      data-material-typography={variant === 'vibrant' ? 'displayLarge' : 'displayMedium'}
      onFocus={() => select(part)}
      onKeyDown={event => {
        if (part === 'hour' && valid && (event.key === ':' || event.key === 'Enter')) { event.preventDefault(); select('minute') }
        if (part === 'minute' && event.key === 'Enter') input.current?.blur()
      }}
      onChange={event => {
        let text = normalizeDigits(event.currentTarget.value)
        if (!/^\d*$/.test(text)) { event.currentTarget.value = draft; return }
        // AndroidX allows replacing a digit in a full field without selecting its contents first.
        if (text.length === 3 && draft.length === 2 && (event.nativeEvent as InputEvent).inputType === 'insertText') {
          text = text.charAt((event.currentTarget.selectionStart ?? 1) - 1)
        }
        if (text.length > 2) { event.currentTarget.value = draft; return }
        setDraft(text)
        const number = Number(text)
        const nextValid = part === 'minute' ? number <= 59 : is24Hour ? number <= 23 : number <= 12
        setValid(nextValid); onValidityChange(part, nextValid)
        if (!nextValid) return
        const hour = is24Hour ? number : number % 12 + (value.hour >= 12 ? 12 : 0)
        emitted.current = part === 'hour' ? displayHour(hour, is24Hour) : number
        change({ ...value, [part]: part === 'hour' ? hour : number })
        if (part === 'hour' && autoAdvance && (text.length === 2 || !is24Hour && number >= 2 && number <= 9)) select('minute')
      }} />
    {(variant === 'baseline' || !valid) && <div id={errorId} className="material-time-picker__support" data-invalid={!valid}
      data-material-typography="bodySmall" aria-live={!valid ? 'polite' : undefined}>{valid ? labels[part] : error}</div>}
  </div>
}
// The formatted zero is a stable key for a live locale change, without effect churn from closures.
function propsLocaleKey(format: Control['format']) { return format(0, true) }

export const MaterialTimeInput = forwardRef<HTMLDivElement, MaterialTimeInputProps>(function MaterialTimeInput(props, ref) {
  const control = useControl(props)
  const validity = useRef({ hour: true, minute: true })
  const [hourValid, setHourValid] = useState(true)
  const { value, defaultValue, onValueChange, selection, defaultSelection, onSelectionChange, is24Hour, labels, locale,
    variant = 'baseline', autoSwitchToMinute = true, toggle, onValidityChange, autoFocus = false, className, style, ...rest } = props
  const report = (part: TimePickerSelection, valid: boolean) => {
    const before = validity.current.hour && validity.current.minute
    validity.current[part] = valid
    if (part === 'hour') setHourValid(valid)
    const after = validity.current.hour && validity.current.minute
    if (after !== before) onValidityChange?.(after)
  }
  return <div {...rest} ref={ref} role={rest.role ?? 'group'} aria-label={rest['aria-label'] ?? 'Time input'}
    className={classes('material-time-picker', 'material-time-input', className)} data-variant={variant}
    data-24-hour={control.is24Hour} data-uncontained={toggle != null} style={style}>
    <div className="material-time-picker__numbers" dir="ltr">
      <InputField control={control} part="hour" variant={variant} autoAdvance={autoSwitchToMinute} autoFocus={autoFocus} onValidityChange={report} />
      <span className="material-time-picker__separator" aria-hidden="true" data-material-typography={variant === 'vibrant' ? 'displayLarge' : 'displayMedium'}>:</span>
      <InputField control={control} part="minute" variant={variant} autoAdvance={false} autoFocus={autoFocus} onValidityChange={report} />
    </div>
    <Period control={control} toggle={toggle} canChange={hourValid} />
  </div>
})

function ScrollItem({ selected, number, offset }: { selected: boolean; number: string; offset: number }) {
  const ref = useRef<HTMLDivElement>(null)
  const selection = useTimePickerSpring(selected ? 1 : 0, ref, 'spatial', 'fast').value
  return <div ref={ref} aria-hidden="true" className="material-time-picker__scroll-item" data-material-typography="displayLargeEmphasized"
    style={{ '--md-time-picker-scroll-fraction': Math.max(0, Math.min(1, selection)), transform: `translateY(${offset}px)` } as CSSProperties}>{number}</div>
}
function ScrollField({ control, part }: { control: Control; part: TimePickerSelection }) {
  const { value, is24Hour, format, labels, change } = control
  const root = useRef<HTMLDivElement>(null)
  const count = part === 'minute' ? 60 : is24Hour ? 24 : 12
  const actualIndex = part === 'minute' ? value.minute : is24Hour ? value.hour : (value.hour % 12 + 11) % 12
  const index = useRef(actualIndex)
  const [page, setPage] = useState(actualIndex)
  const [dragOffset, setDragOffset] = useState<number | null>(null)
  const [fling, setFling] = useState(false)
  const drag = useRef<{ y: number; page: number; id: number; lastY: number; lastTime: number; velocity: number } | null>(null)
  const wheelDelta = useRef(0)
  const { value: animated } = useTimePickerSpring(dragOffset ?? page, root, 'spatial', 'default', dragOffset != null, false,
    fling ? MATERIAL_TIME_PICKER_MOTION.pagerSnapSpring : MATERIAL_TIME_PICKER_MOTION.pagerProgrammaticSpring)
  useEffect(() => {
    if (actualIndex !== (index.current % count + count) % count) {
      const difference = ((actualIndex - index.current % count + count * 1.5) % count) - count / 2
      index.current += difference; setPage(index.current)
    }
  }, [actualIndex, count, page])
  const update = (next: number) => {
    index.current = next; setPage(next)
    const normalized = (next % count + count) % count
    change({ ...value, [part]: part === 'hour' && !is24Hour ? (normalized + 1) % 12 + (value.hour >= 12 ? 12 : 0) : normalized })
  }
  const wheelAction = useRef<(delta: number) => void>(() => {})
  wheelAction.current = delta => {
    setFling(false)
    wheelDelta.current += delta
    if (Math.abs(wheelDelta.current) >= 20) { update(index.current + Math.sign(wheelDelta.current)); wheelDelta.current = 0 }
  }
  useEffect(() => {
    const node = root.current
    const wheel = (event: WheelEvent) => { event.preventDefault(); wheelAction.current(event.deltaY * (event.deltaMode === 1 ? 16 : 1)) }
    node?.addEventListener('wheel', wheel, { passive: false })
    return () => node?.removeEventListener('wheel', wheel)
  }, [])
  const start = Math.floor(animated) - 2
  return <div ref={root} role="spinbutton" tabIndex={0} aria-label={part === 'hour' ? labels.hourSelection : labels.minuteSelection}
    aria-valuemin={part === 'hour' && !is24Hour ? 1 : 0} aria-valuemax={part === 'minute' ? 59 : is24Hour ? 23 : 12}
    aria-valuenow={part === 'minute' ? value.minute : displayHour(value.hour, is24Hour)}
    className="material-time-picker__scroll-field"
    onKeyDown={event => {
      if (['ArrowDown', 'ArrowUp', 'Home', 'End'].includes(event.key)) {
        event.preventDefault()
        setFling(false)
        update(event.key === 'Home' ? 0 : event.key === 'End' ? count - 1 : index.current + (event.key === 'ArrowDown' ? 1 : -1))
      }
    }}
    onPointerDown={event => {
      if (event.button !== 0 || event.isPrimary === false) return
      event.preventDefault(); root.current?.focus()
      drag.current = { y: event.clientY, page: animated, id: event.pointerId, lastY: event.clientY, lastTime: performance.now(), velocity: 0 }; event.currentTarget.setPointerCapture?.(event.pointerId)
    }}
    onPointerMove={event => {
      if (drag.current?.id !== event.pointerId) return
      const now = performance.now(), elapsed = now - drag.current.lastTime
      if (elapsed > 0) drag.current.velocity = (drag.current.lastY - event.clientY) / elapsed * 1000
      drag.current.lastY = event.clientY; drag.current.lastTime = now
      const next = drag.current.page + (drag.current.y - event.clientY) / TIME_PICKER_GEOMETRY.scrollItemHeight
      setDragOffset(next); update(Math.round(next))
    }}
    onPointerUp={event => {
      if (drag.current?.id !== event.pointerId) return
      if (Math.abs(drag.current.y - event.clientY) < 6) {
        setFling(false)
        const rect = event.currentTarget.getBoundingClientRect()
        update(index.current + Math.round((event.clientY - rect.top - rect.height / 2) / TIME_PICKER_GEOMETRY.scrollItemHeight))
      } else {
        setFling(true)
        // PagerDefaults limits a release fling to one additional page.
        if (performance.now() - drag.current.lastTime < 100 && Math.abs(drag.current.velocity) > 125) update(index.current + Math.sign(drag.current.velocity))
      }
      drag.current = null; setDragOffset(null); event.currentTarget.releasePointerCapture?.(event.pointerId)
    }} onPointerCancel={() => { drag.current = null; setDragOffset(null) }}>
    <MaterialRipple />
    {Array.from({ length: 6 }, (_, offset) => {
      const item = start + offset
      const number = (item % count + count) % count
      return <ScrollItem key={item} selected={item === Math.round(animated)} offset={(item - animated) * TIME_PICKER_GEOMETRY.scrollItemHeight}
        number={format(part === 'hour' && !is24Hour ? number + 1 : number, true)} />
    })}
  </div>
}
export const MaterialTimeScroll = forwardRef<HTMLDivElement, MaterialTimeScrollProps>(function MaterialTimeScroll(props, ref) {
  const control = useControl(props)
  const { value, defaultValue, onValueChange, selection, defaultSelection, onSelectionChange, is24Hour, labels, locale,
    autoSwitchToMinute, toggle, className, style, ...rest } = props
  return <div {...rest} ref={ref} role={rest.role ?? 'group'} aria-label={rest['aria-label'] ?? 'Time scroll'}
    className={classes('material-time-picker', 'material-time-scroll', className)} data-variant="vibrant" data-24-hour={control.is24Hour} data-uncontained={toggle != null} style={style}>
    <div className="material-time-picker__numbers" dir="ltr">
      <ScrollField control={control} part="hour" /><span className="material-time-picker__separator" aria-hidden="true" data-material-typography="displayLarge">:</span><ScrollField control={control} part="minute" />
    </div><Period control={control} toggle={toggle} />
  </div>
})

export type MaterialTimePickerDialogProps = Omit<MaterialBasicDialogProps, 'style'> & {
  title?: ReactNode
  confirmButton: ReactNode
  dismissButton?: ReactNode
  modeToggleButton?: ReactNode
  variant?: MaterialTimePickerVariant
  layoutType?: MaterialTimePickerLayoutType
  style?: MaterialTimePickerStyle
}
export const MaterialTimePickerDialog = forwardRef<HTMLDialogElement, MaterialTimePickerDialogProps>(function MaterialTimePickerDialog(
  { children, title = 'Select Time', confirmButton, dismissButton, modeToggleButton, variant = 'baseline', layoutType = 'vertical', className, style, ...props }, ref,
) {
  const titleId = useId()
  const layout = useLayoutType(layoutType)
  return <MaterialBasicDialog {...props} ref={ref} aria-label={props['aria-label'] ?? (variant === 'vibrant' ? 'Select Time' : undefined)}
    aria-labelledby={props['aria-label'] == null && variant === 'baseline' ? titleId : props['aria-labelledby']}
    className={classes('material-time-picker-dialog', className)} data-variant={variant} data-layout={layout} style={style}>
    {variant === 'baseline' && <div id={titleId} className="material-time-picker-dialog__title" data-material-typography="labelMedium">{title}</div>}
    <div className="material-time-picker-dialog__content">{children}</div>
    <div className="material-time-picker-dialog__actions">{modeToggleButton}<span className="material-time-picker-dialog__spacer" />{dismissButton}{confirmButton}</div>
  </MaterialBasicDialog>
})
export const MaterialVibrantTimePickerDialog = forwardRef<HTMLDialogElement, Omit<MaterialTimePickerDialogProps, 'variant' | 'title'>>(function MaterialVibrantTimePickerDialog(props, ref) {
  return <MaterialTimePickerDialog {...props} ref={ref} variant="vibrant" />
})

export type MaterialTimePickerModeToggleProps = Omit<MaterialIconButtonProps, 'children' | 'onClick'> & {
  displayMode: MaterialTimePickerDisplayMode
  alternateMode?: 'picker' | 'scroll'
  onDisplayModeChange: (mode: MaterialTimePickerDisplayMode) => void
  keyboardLabel?: string
  pickerLabel?: string
  scrollLabel?: string
}
export const MaterialTimePickerModeToggle = forwardRef<HTMLButtonElement, MaterialTimePickerModeToggleProps>(function MaterialTimePickerModeToggle(
  { displayMode, alternateMode = 'picker', onDisplayModeChange, keyboardLabel = 'Switch to text input mode', pickerLabel = 'Switch to clock mode', scrollLabel = 'Switch to scroll mode', ...props }, ref,
) {
  const next = displayMode === 'input' ? alternateMode : 'input'
  const label = next === 'input' ? keyboardLabel : next === 'picker' ? pickerLabel : scrollLabel
  // Standard AndroidX filled Keyboard, Schedule and SwipeVertical icons, Apache-2.0.
  const path = next === 'input'
    ? 'M20 5H4c-1.1 0-1.99.9-1.99 2L2 17c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V7c0-1.1-.9-2-2-2zm-9 3h2v2h-2V8zm0 3h2v2h-2v-2zM8 8h2v2H8V8zm0 3h2v2H8v-2zm-1 2H5v-2h2v2zm0-3H5V8h2v2zm9 7H8v-2h8v2zm0-4h-2v-2h2v2zm0-3h-2V8h2v2zm3 3h-2v-2h2v2zm0-3h-2V8h2v2z'
    : next === 'picker'
      ? 'M11.99 2C6.47 2 2 6.48 2 12s4.47 10 9.99 10C17.52 22 22 17.52 22 12S17.52 2 11.99 2zM12 20c-4.42 0-8-3.58-8-8s3.58-8 8-8 8 3.58 8 8-3.58 8-8 8zm.5-13H11v6l5.25 3.15.75-1.23-4.5-2.67z'
      : 'M1 3.5h2.02C1.13 5.82 0 8.78 0 12s1.13 6.18 3.02 8.5H1V22h5v-5H4.5v2.91c-1.86-2.11-3-4.88-3-7.91s1.14-5.79 3-7.91V7H6V2H1v1.5zm12.85 8.12-2.68-5.37c-.37-.74-1.27-1.04-2.01-.67-.75.38-1.05 1.28-.68 2.02l4.81 9.6-3.24.8c-.33.09-.59.33-.7.66L9 19.78l6.19 2.25c.5.17 1.28.02 1.75-.22l5.51-2.75c.89-.45 1.32-1.48 1-2.42l-1.43-4.27c-.27-.82-1.04-1.37-1.9-1.37h-4.56c-.31 0-.62.07-.89.21l-.82.41z'
  return <MaterialIconButton {...props} ref={ref} aria-label={props['aria-label'] ?? label} title={props.title ?? label}
    onClick={() => onDisplayModeChange(next)}><svg viewBox="0 0 24 24" aria-hidden="true" fill="currentColor"><path d={path} /></svg></MaterialIconButton>
})
