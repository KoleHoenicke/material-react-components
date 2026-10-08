// Adapted from AndroidX Material 3, Apache-2.0. See docs/text-fields.md.
import {
  createContext, useContext, forwardRef, useEffect, useId, useImperativeHandle, useLayoutEffect, useRef, useState,
  type ChangeEvent, type CSSProperties, type FocusEvent, type HTMLAttributes,
  type InputHTMLAttributes, type KeyboardEvent, type ReactNode, type TextareaHTMLAttributes,
} from 'react'
import {
  getMaterialTextFieldColors, type MaterialTextFieldColors, type MaterialTextFieldColorRole,
  type MaterialTextFieldColorMode, type MaterialTextFieldVariant,
} from './MaterialTextFieldDefaults'
import './MaterialTextField.css'

export * from './MaterialTextFieldDefaults'
export type MaterialTextFieldElement = HTMLInputElement | HTMLTextAreaElement
export type MaterialTextFieldInputType = 'text' | 'email' | 'password' | 'search' | 'tel' | 'url' | 'number' | 'date' | 'datetime-local' | 'month' | 'time' | 'week'
export type MaterialTextFieldCSSProperties = CSSProperties & { [key: `--md-text-field-${string}`]: string | number | undefined }
export type MaterialTextFieldAlignment = 'start' | 'center' | 'end'
export type MaterialTextFieldLabelPosition = 'attached' | 'inside' | 'cutout' | 'above' | {
  position: 'attached' | 'inside' | 'cutout' | 'above'
  alwaysMinimize?: boolean
  expandedAlignment?: MaterialTextFieldAlignment
  minimizedAlignment?: MaterialTextFieldAlignment
}
export interface MaterialTextFieldPadding { start?: number | string; top?: number | string; end?: number | string; bottom?: number | string }
export interface MaterialTextFieldEdit { previousValue: string; selectionStart: number; selectionEnd: number; inputType?: string }
export interface MaterialTextFieldOutput {
  text: string
  /** UTF-16 caret offsets, including offsets inside inserted formatting. */
  originalToTransformed: (offset: number) => number
  transformedToOriginal: (offset: number) => number
}
export interface MaterialTextFieldLabelScope { minimized: boolean; focused: boolean }

export interface MaterialTextFieldDecorationProps {
  variant?: MaterialTextFieldVariant
  colorMode?: MaterialTextFieldColorMode
  label?: ReactNode | ((scope: MaterialTextFieldLabelScope) => ReactNode)
  labelPosition?: MaterialTextFieldLabelPosition
  alwaysMinimizeLabel?: boolean
  leadingIcon?: ReactNode
  trailingIcon?: ReactNode
  prefix?: ReactNode
  suffix?: ReactNode
  supportingText?: ReactNode
  isError?: boolean
  errorMessage?: string
  colors?: MaterialTextFieldColors
  /** Default AndroidX shape, expressive rounded shape, or a CSS border-radius. */
  shape?: 'default' | 'rounded' | string | number
  contentPadding?: MaterialTextFieldPadding
  supportingTextPadding?: MaterialTextFieldPadding
  focusedIndicatorThickness?: number | string
  unfocusedIndicatorThickness?: number | string
  textStyle?: CSSProperties
  /** Replace the default background and border, with state supplied to a render callback. */
  container?: ReactNode | ((state: { focused: boolean; disabled: boolean; isError: boolean }) => ReactNode)
  fullWidth?: boolean
  style?: MaterialTextFieldCSSProperties
  className?: string
}

type NativeInputProps = Omit<InputHTMLAttributes<HTMLInputElement>,
  'children' | 'value' | 'defaultValue' | 'onChange' | 'onFocus' | 'onBlur' | 'onKeyDown' | 'onSelect' | 'style' | 'className' | 'prefix' | 'size' | 'type'>
export type MaterialTextFieldProps = NativeInputProps & MaterialTextFieldDecorationProps & {
  type?: MaterialTextFieldInputType
  value?: string
  defaultValue?: string
  onChange?: (event: ChangeEvent<MaterialTextFieldElement>) => void
  onValueChange?: (value: string, event: ChangeEvent<MaterialTextFieldElement>) => void
  onFocus?: (event: FocusEvent<MaterialTextFieldElement>) => void
  onBlur?: (event: FocusEvent<MaterialTextFieldElement>) => void
  onKeyDown?: (event: KeyboardEvent<MaterialTextFieldElement>) => void
  onSelect?: HTMLAttributes<MaterialTextFieldElement>['onSelect']
  onKeyboardAction?: (event: KeyboardEvent<MaterialTextFieldElement>) => void
  /** Compose defaults to a growing multiline field. Single-line inputs scroll horizontally. */
  singleLine?: boolean
  minLines?: number
  maxLines?: number
  rows?: number
  wrap?: TextareaHTMLAttributes<HTMLTextAreaElement>['wrap']
  inputTransformation?: (value: string, edit: MaterialTextFieldEdit) => string | null
  /** Length-changing formatting must provide both caret offset mappings. */
  outputTransformation?: (value: string) => string | MaterialTextFieldOutput
  containerProps?: Omit<HTMLAttributes<HTMLDivElement>, 'children' | 'className' | 'style'>
}

function length(value: number | string | undefined) { return typeof value === 'number' ? `${value}px` : value }
function joinIds(...values: (string | undefined | false)[]) { return values.filter(Boolean).join(' ') || undefined }
const roles: MaterialTextFieldColorRole[] = ['Text', 'Container', 'Indicator', 'LeadingIcon', 'TrailingIcon', 'Label', 'Placeholder', 'SupportingText', 'Prefix', 'Suffix']
function kebab(value: string) { return value.replace(/[A-Z]/g, letter => `-${letter.toLowerCase()}`) }
function decorationStyle(props: MaterialTextFieldDecorationProps): MaterialTextFieldCSSProperties {
  const defaults = getMaterialTextFieldColors(props.variant, props.colorMode)
  const colors = { ...defaults, ...Object.fromEntries(Object.entries(props.colors ?? {}).filter(([, value]) => value !== undefined)) } as MaterialTextFieldColors
  const style: MaterialTextFieldCSSProperties = {}
  for (const state of ['focused', 'unfocused', 'disabled', 'error'] as const) {
    for (const role of roles) style[`--md-text-field-${state}${kebab(role)}-color`] = colors[`${state}${role}Color`]
  }
  style['--md-text-field-cursor-color'] = colors.cursorColor
  style['--md-text-field-error-cursor-color'] = colors.errorCursorColor
  style['--md-text-field-selection-color'] = props.colors?.textSelectionColors?.backgroundColor ?? defaults.textSelectionColors?.backgroundColor
  style['--md-text-field-selection-handle-color'] = props.colors?.textSelectionColors?.handleColor ?? defaults.textSelectionColors?.handleColor
  if (props.shape !== undefined && props.shape !== 'default') style['--md-text-field-shape'] = props.shape === 'rounded' ? 'var(--md-sys-shape-corner-medium)' : length(props.shape)
  for (const [prefix, padding] of [['padding', props.contentPadding], ['supporting-padding', props.supportingTextPadding]] as const) {
    for (const side of ['start', 'top', 'end', 'bottom'] as const) {
      if (padding?.[side] !== undefined) style[`--md-text-field-${prefix}-${side}`] = length(padding[side])
    }
  }
  if (props.focusedIndicatorThickness !== undefined) style['--md-text-field-focused-indicator-thickness'] = length(props.focusedIndicatorThickness)
  if (props.unfocusedIndicatorThickness !== undefined) style['--md-text-field-unfocused-indicator-thickness'] = length(props.unfocusedIndicatorThickness)
  return { ...style, ...props.style }
}

export type MaterialTextFieldDecoratorProps = MaterialTextFieldDecorationProps & {
  children: ReactNode
  inputId: string
  supportingTextId?: string
  errorId?: string
  value: string
  focused?: boolean
  disabled?: boolean
  singleLine?: boolean
  containerProps?: MaterialTextFieldProps['containerProps']
}
/** Decoration for a custom native editor. The caller owns its value, focus and ARIA wiring. */
export function MaterialTextFieldDecorator({
  children, inputId, supportingTextId, errorId, value, focused = false, disabled = false,
  singleLine = false, variant = 'filled', colorMode = 'default', labelPosition = 'attached',
  alwaysMinimizeLabel = false, label, leadingIcon, trailingIcon, prefix, suffix, supportingText,
  isError = false, errorMessage, fullWidth = false, className, containerProps, container, ...options
}: MaterialTextFieldDecoratorProps) {
  const positionOptions = typeof labelPosition === 'string' ? { position: labelPosition } : labelPosition
  const position = positionOptions.position === 'attached' ? variant === 'filled' ? 'inside' : 'cutout' : positionOptions.position
  const hasLabel = label !== undefined && label !== null && label !== false
  const minimized = position === 'above' || alwaysMinimizeLabel || !!positionOptions.alwaysMinimize || (focused && !disabled) || value.length > 0
  const labelContent = typeof label === 'function' ? label({ minimized, focused }) : label
  const alignment = (minimized ? positionOptions.minimizedAlignment : positionOptions.expandedAlignment) ?? 'start'
  const showAffix = !hasLabel || minimized
  return (
    <div {...containerProps}
      className={['material-text-field', `material-text-field--${variant}`, fullWidth && 'material-text-field--full-width', className].filter(Boolean).join(' ')}
      style={decorationStyle({ ...options, variant, colorMode })}
      data-variant={variant} data-color-mode={colorMode} data-focused={focused && !disabled}
      data-disabled={disabled} data-error={isError} data-label-position={hasLabel ? position : 'none'}
      data-minimized={minimized} data-single-line={singleLine} data-label-alignment={alignment}
      data-custom-container={container != null}
      data-leading={leadingIcon != null} data-trailing={trailingIcon != null}
    >
      {hasLabel && position === 'above' && <label className="material-text-field__above-label" htmlFor={inputId} data-alignment={alignment}>{labelContent}</label>}
      <div className="material-text-field__container" onClick={event => {
        if (disabled) return
        const target = event.target as HTMLElement
        if (target.closest('button, a, input, textarea, select, [contenteditable]')) return
        document.getElementById(inputId)?.focus()
      }}>
        {container != null && <div className="material-text-field__custom-container" aria-hidden="true">{typeof container === 'function' ? container({ focused, disabled, isError }) : container}</div>}
        <fieldset className="material-text-field__outline" aria-hidden="true">
          {hasLabel && position === 'cutout' && <legend><span>{labelContent}</span></legend>}
        </fieldset>
        {leadingIcon != null && <span className="material-text-field__icon material-text-field__icon--leading">{leadingIcon}</span>}
        <div className="material-text-field__body">
          {hasLabel && position === 'inside' && <span className="material-text-field__label-reserve" aria-hidden="true">{labelContent}</span>}
          <div className="material-text-field__row">
            {prefix != null && <span className="material-text-field__prefix" data-visible={showAffix} aria-hidden={!showAffix}>{prefix}</span>}
            <div className="material-text-field__editor">{children}</div>
            {suffix != null && <span className="material-text-field__suffix" data-visible={showAffix} aria-hidden={!showAffix}>{suffix}</span>}
          </div>
        </div>
        {trailingIcon != null && <span className="material-text-field__icon material-text-field__icon--trailing">{trailingIcon}</span>}
        {hasLabel && position !== 'above' && <label className="material-text-field__label" htmlFor={inputId}>{labelContent}</label>}
        <span className="material-text-field__indicator" aria-hidden="true" />
      </div>
      {supportingText != null && <div className="material-text-field__supporting" id={supportingTextId}>{supportingText}</div>}
      {isError && <span className="material-text-field__error-message" id={errorId}>{errorMessage ?? 'Invalid input'}</span>}
    </div>
  )
}

const SecureMaskContext = createContext<{ text: string; scrollLeft: number; selectionStart: number; selectionEnd: number } | null>(null)

const identity = (offset: number) => offset
function output(value: string, transform?: MaterialTextFieldProps['outputTransformation']): MaterialTextFieldOutput {
  const result = transform?.(value) ?? value
  if (typeof result !== 'string') return result
  if (result.length !== value.length) throw new Error('Length-changing outputTransformation requires originalToTransformed and transformedToOriginal caret mappings.')
  return { text: result, originalToTransformed: identity, transformedToOriginal: identity }
}
function unformatEdit(previous: string, display: MaterialTextFieldOutput, next: string, inputType?: string) {
  let start = 0
  while (start < display.text.length && start < next.length && display.text[start] === next[start]) start++
  let end = display.text.length
  let nextEnd = next.length
  while (end > start && nextEnd > start && display.text[end - 1] === next[nextEnd - 1]) { end--; nextEnd-- }
  let rawStart = display.transformedToOriginal(start)
  let rawEnd = display.transformedToOriginal(end)
  // Deleting a formatting-only character must still advance through the stored text.
  if (end > start && nextEnd === start && rawStart === rawEnd) {
    if (inputType === 'deleteContentForward') rawEnd += Array.from(previous.slice(rawEnd))[0]?.length ?? 0
    else rawStart -= Array.from(previous.slice(0, rawStart)).at(-1)?.length ?? 0
  }
  const inserted = next.slice(start, nextEnd)
  return { value: previous.slice(0, rawStart) + inserted + previous.slice(rawEnd), caret: rawStart + inserted.length }
}

export const MaterialTextField = forwardRef<MaterialTextFieldElement, MaterialTextFieldProps>(function MaterialTextField({
  variant = 'filled', colorMode = 'default', label, labelPosition, alwaysMinimizeLabel,
  leadingIcon, trailingIcon, prefix, suffix, supportingText, isError, errorMessage, colors,
  shape, contentPadding, supportingTextPadding, focusedIndicatorThickness, unfocusedIndicatorThickness,
  textStyle, fullWidth, style, className, containerProps, container,
  id, value, defaultValue = '', onChange, onValueChange, onFocus, onBlur, onKeyDown, onSelect,
  onKeyboardAction, singleLine = false, minLines = 1, maxLines, rows, wrap = 'soft',
  inputTransformation, outputTransformation, disabled, readOnly, type = 'text', placeholder,
  name, form, onCompositionStart, onCompositionEnd, onScroll, ...nativeProps
}, forwardedRef) {
  const secureMask = useContext(SecureMaskContext)
  const generatedId = useId()
  const inputId = id ?? `material-text-field-${generatedId}`
  const supportId = `${inputId}-supporting`
  const errorId = `${inputId}-error`
  const inputRef = useRef<MaterialTextFieldElement>(null)
  useImperativeHandle(forwardedRef, () => inputRef.current!, [singleLine])
  const [uncontrolledValue, setUncontrolledValue] = useState(defaultValue)
  const [focused, setFocused] = useState(false)
  const [composition, setComposition] = useState<string | null>(null)
  const composing = useRef(false)
  const compositionCommit = useRef<string | null>(null)
  const pendingSelection = useRef<{ start: number; end: number; raw: string } | null>(null)
  const raw = value ?? uncontrolledValue
  const normalized = singleLine ? raw.replace(/[\r\n]/g, ' ') : raw
  const display = composition !== null ? output(composition) : output(normalized, outputTransformation)
  const safeMinLines = Math.max(1, Math.floor(rows ?? minLines))
  const safeMaxLines = Math.max(safeMinLines, Math.floor(maxLines ?? Number.MAX_SAFE_INTEGER))

  useLayoutEffect(() => {
    const input = inputRef.current
    if (!input) return
    const pending = pendingSelection.current
    if (pending && composition === null) {
      try {
        const accepted = raw === pending.raw
        input.setSelectionRange(display.originalToTransformed(accepted ? pending.start : Math.min(pending.start, raw.length)), display.originalToTransformed(accepted ? pending.end : Math.min(pending.end, raw.length)))
      } catch { /* Some native input types do not expose selection. */ }
      pendingSelection.current = null
    }
    if (input instanceof HTMLTextAreaElement) {
      let previousWidth = -1
      function resize() {
        if (!input) return
        const scrollTop = input.scrollTop
        input.style.height = '0px'
        const lineHeight = parseFloat(getComputedStyle(input).lineHeight) || 24
        input.style.height = `${Math.min(safeMaxLines * lineHeight, Math.max(safeMinLines * lineHeight, input.scrollHeight))}px`
        input.scrollTop = scrollTop
        previousWidth = input.clientWidth
      }
      resize()
      const observer = new ResizeObserver(() => { if (input.clientWidth !== previousWidth) resize() })
      observer.observe(input)
      document.fonts?.addEventListener('loadingdone', resize)
      return () => { observer.disconnect(); document.fonts?.removeEventListener('loadingdone', resize) }
    }
  }, [raw, display.text, composition, safeMinLines, safeMaxLines, textStyle, singleLine])

  useEffect(() => {
    const input = inputRef.current
    const reset = (event: Event) => {
      // Respect a form owner's cancellation after the reset event finishes bubbling.
      queueMicrotask(() => {
        if (event.defaultPrevented) return
        if (value === undefined) setUncontrolledValue(defaultValue)
        setComposition(null)
        composing.current = false
      })
    }
    input?.form?.addEventListener('reset', reset)
    return () => input?.form?.removeEventListener('reset', reset)
  }, [value, defaultValue, form, name])

  function commit(event: ChangeEvent<MaterialTextFieldElement>) {
    if (disabled || readOnly) return
    const input = event.currentTarget
    const editingDisplay = input.value
    const inputType = (event.nativeEvent as InputEvent).inputType
    const edit = outputTransformation ? unformatEdit(normalized, output(normalized, outputTransformation), editingDisplay, inputType) : null
    let next = edit?.value ?? editingDisplay
    if (singleLine) next = next.replace(/[\r\n]/g, ' ')
    const mapped = output(next, outputTransformation)
    const start = Math.min(next.length, edit?.caret ?? mapped.transformedToOriginal(input.selectionStart ?? editingDisplay.length))
    const end = Math.min(next.length, edit?.caret ?? mapped.transformedToOriginal(input.selectionEnd ?? editingDisplay.length))
    const transformed = inputTransformation?.(next, { previousValue: raw, selectionStart: start, selectionEnd: end, inputType })
    if (transformed === null) {
      input.value = display.text
      return
    }
    next = transformed ?? next
    pendingSelection.current = { start: Math.min(start, next.length), end: Math.min(end, next.length), raw: next }
    // Native onChange consumers receive the stored value, just as without a transformation.
    input.value = next
    try { input.setSelectionRange(pendingSelection.current.start, pendingSelection.current.end) } catch { /* Native number/email controls own their caret. */ }
    if (value === undefined) setUncontrolledValue(next)
    onChange?.(event)
    onValueChange?.(next, event)
    // React will restore the controlled display. Uncontrolled state uses the same rendering path.
  }

  const describedBy = joinIds(nativeProps['aria-describedby'], supportingText != null && supportId, !!isError && errorId)
  const shared = {
    ...nativeProps, id: inputId, name: outputTransformation ? undefined : name, form,
    disabled, readOnly, value: display.text, placeholder,
    className: 'material-text-field__input', style: textStyle,
    'aria-describedby': describedBy,
    'aria-invalid': isError ? true : nativeProps['aria-invalid'],
    'aria-errormessage': isError ? joinIds(nativeProps['aria-errormessage'], errorId) : nativeProps['aria-errormessage'],
    onChange: (event: ChangeEvent<MaterialTextFieldElement>) => {
      if (composing.current) { setComposition(event.currentTarget.value); return }
      if (compositionCommit.current === event.currentTarget.value) { compositionCommit.current = null; return }
      compositionCommit.current = null
      commit(event)
    },
    onFocus: (event: FocusEvent<MaterialTextFieldElement>) => { setFocused(true); onFocus?.(event) },
    onBlur: (event: FocusEvent<MaterialTextFieldElement>) => { setFocused(false); onBlur?.(event) },
    onKeyDown: (event: KeyboardEvent<MaterialTextFieldElement>) => {
      onKeyDown?.(event)
      if (!event.defaultPrevented && event.key === 'Enter' && !event.nativeEvent.isComposing && !composing.current && !disabled && !readOnly && singleLine) onKeyboardAction?.(event)
    },
    onSelect,
    onCompositionStart: (event: React.CompositionEvent<MaterialTextFieldElement>) => {
      composing.current = true
      compositionCommit.current = null
      setComposition(event.currentTarget.value)
      onCompositionStart?.(event as React.CompositionEvent<HTMLInputElement>)
    },
    onCompositionEnd: (event: React.CompositionEvent<MaterialTextFieldElement>) => {
      composing.current = false
      setComposition(null)
      compositionCommit.current = event.currentTarget.value
      commit(event as unknown as ChangeEvent<MaterialTextFieldElement>)
      onCompositionEnd?.(event as React.CompositionEvent<HTMLInputElement>)
    },
    onScroll: (event: React.UIEvent<MaterialTextFieldElement>) => onScroll?.(event as React.UIEvent<HTMLInputElement>),
  }
  return <MaterialTextFieldDecorator
    {...{ variant, colorMode, label, labelPosition, alwaysMinimizeLabel, leadingIcon, trailingIcon, prefix, suffix,
      supportingText, isError, errorMessage, colors, shape, contentPadding, supportingTextPadding,
      focusedIndicatorThickness, unfocusedIndicatorThickness, textStyle, fullWidth, style, className, containerProps, container }}
    inputId={inputId} supportingTextId={supportId} errorId={errorId} value={display.text}
    focused={focused} disabled={disabled} singleLine={singleLine}
  >
    {singleLine
      ? <input {...shared as InputHTMLAttributes<HTMLInputElement>} ref={inputRef as React.RefObject<HTMLInputElement>} type={type} />
      : <textarea {...shared as TextareaHTMLAttributes<HTMLTextAreaElement>} ref={inputRef as React.RefObject<HTMLTextAreaElement>} rows={safeMinLines} wrap={wrap} />}
    {secureMask && <span className="material-text-field__secure-mask" aria-hidden="true"><span style={{ ...textStyle, transform: `translateX(${-secureMask.scrollLeft}px)` }}>
      {secureMask.text.slice(0, secureMask.selectionStart)}
      {secureMask.selectionStart === secureMask.selectionEnd
        ? <span className="material-text-field__secure-caret" />
        : <span className="material-text-field__secure-selection">{secureMask.text.slice(secureMask.selectionStart, secureMask.selectionEnd)}</span>}
      {secureMask.text.slice(secureMask.selectionEnd)}
    </span></span>}
    {outputTransformation && name && <input type="hidden" name={name} form={form} value={raw} disabled={disabled} />}
  </MaterialTextFieldDecorator>
})

export const MaterialFilledTextField = forwardRef<MaterialTextFieldElement, Omit<MaterialTextFieldProps, 'variant'>>(function MaterialFilledTextField(props, ref) {
  return <MaterialTextField {...props} variant="filled" ref={ref} />
})
export const MaterialOutlinedTextField = forwardRef<MaterialTextFieldElement, Omit<MaterialTextFieldProps, 'variant'>>(function MaterialOutlinedTextField(props, ref) {
  return <MaterialTextField {...props} variant="outlined" ref={ref} />
})

export type MaterialTextObfuscationMode = 'system' | 'hidden' | 'visible' | 'reveal-last-typed'
export type MaterialSecureTextFieldProps = Omit<MaterialTextFieldProps, 'singleLine' | 'minLines' | 'maxLines' | 'rows' | 'wrap' | 'type' | 'readOnly' | 'outputTransformation'> & {
  textObfuscationMode?: MaterialTextObfuscationMode
  textObfuscationCharacter?: string
}
export const MATERIAL_SECURE_TEXT_FIELD_REVEAL_DURATION_MS = 1500
export const MaterialSecureTextField = forwardRef<HTMLInputElement, MaterialSecureTextFieldProps>(function MaterialSecureTextField({
  textObfuscationMode = 'system', textObfuscationCharacter = '\u2022', value, defaultValue = '',
  onValueChange, onCopy, onCut, onBlur, onScroll, onKeyDown, onSelect, className, autoComplete = 'current-password', ...props
}, ref) {
  const [uncontrolled, setUncontrolled] = useState(defaultValue)
  const [reveal, setReveal] = useState<{ index: number; value: string } | null>(null)
  const [scrollLeft, setScrollLeft] = useState(0)
  const [selection, setSelection] = useState({ start: defaultValue.length, end: defaultValue.length })
  const raw = value ?? uncontrolled
  const timeout = useRef<ReturnType<typeof setTimeout> | undefined>(undefined)
  const inputRef = useRef<HTMLInputElement>(null)
  useImperativeHandle(ref, () => inputRef.current!, [])
  const visible = textObfuscationMode === 'visible'
  const customMask = !visible && (textObfuscationMode === 'hidden' || textObfuscationMode === 'reveal-last-typed' || textObfuscationCharacter !== '\u2022')
  const maskCharacter = Array.from(textObfuscationCharacter)[0] ?? '\u2022'
  function hide() { clearTimeout(timeout.current); setReveal(null) }
  useEffect(() => { hide(); return () => clearTimeout(timeout.current) }, [textObfuscationMode, textObfuscationCharacter])
  useEffect(() => { if (reveal && reveal.value !== raw) hide() }, [raw, reveal])
  useEffect(() => {
    const formElement = inputRef.current?.form
    const reset = (event: Event) => {
      queueMicrotask(() => {
        if (event.defaultPrevented) return
        if (value === undefined) setUncontrolled(defaultValue)
        hide()
      })
    }
    formElement?.addEventListener('reset', reset)
    return () => formElement?.removeEventListener('reset', reset)
  }, [value, defaultValue, props.form])
  const maskCharacters = Array.from(raw).map((char, i) => reveal?.index === i && reveal.value === raw ? char : maskCharacter)
  const maskOffset = (offset: number) => maskCharacters.slice(0, Array.from(raw.slice(0, offset)).length).join('').length
  const mask = customMask ? { text: maskCharacters.join(''), scrollLeft, selectionStart: maskOffset(selection.start), selectionEnd: maskOffset(selection.end) } : null
  return <SecureMaskContext.Provider value={mask}><MaterialTextField {...props} value={raw} singleLine type={visible ? 'text' : 'password'}
    autoComplete={autoComplete} autoCorrect="off" autoCapitalize="none" spellCheck={false}
    ref={inputRef as React.Ref<MaterialTextFieldElement>}
    className={['material-secure-text-field', customMask && 'material-secure-text-field--custom-mask', className].filter(Boolean).join(' ')}
    trailingIcon={props.trailingIcon}
    onValueChange={(next, event) => {
      hide()
      if (value === undefined) setUncontrolled(next)
      const caret = event.currentTarget.selectionStart ?? next.length
      setSelection({ start: caret, end: event.currentTarget.selectionEnd ?? caret })
      let start = 0
      while (start < raw.length && start < next.length && raw[start] === next[start]) start++
      let end = raw.length
      let nextEnd = next.length
      while (end > start && nextEnd > start && raw[end - 1] === next[nextEnd - 1]) { end--; nextEnd-- }
      const inserted = Array.from(next.slice(start, nextEnd)).length
      const inputType = (event.nativeEvent as InputEvent).inputType
      if (textObfuscationMode === 'reveal-last-typed' && inserted === 1 && event.currentTarget.selectionStart === event.currentTarget.selectionEnd && !['insertFromPaste', 'insertFromDrop'].includes(inputType)) {
        setReveal({ index: Array.from(next.slice(0, caret)).length - 1, value: next })
        timeout.current = setTimeout(() => setReveal(null), MATERIAL_SECURE_TEXT_FIELD_REVEAL_DURATION_MS)
      }
      onValueChange?.(next, event)
    }}
    onCopy={event => { event.preventDefault(); onCopy?.(event) }}
    onCut={event => { event.preventDefault(); onCut?.(event) }}
    onBlur={event => { hide(); onBlur?.(event) }}
    onKeyDown={event => { if (event.key.startsWith('Arrow') || ['Home', 'End'].includes(event.key)) hide(); onKeyDown?.(event) }}
    onSelect={event => { const input = event.currentTarget; setSelection({ start: input.selectionStart ?? 0, end: input.selectionEnd ?? 0 }); onSelect?.(event) }}
    onScroll={event => { setScrollLeft(event.currentTarget.scrollLeft); onScroll?.(event) }}
  /></SecureMaskContext.Provider>
})
export const MaterialOutlinedSecureTextField = forwardRef<HTMLInputElement, Omit<MaterialSecureTextFieldProps, 'variant'>>(function MaterialOutlinedSecureTextField(props, ref) {
  return <MaterialSecureTextField {...props} variant="outlined" ref={ref} />
})
