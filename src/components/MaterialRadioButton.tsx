/* Geometry and token mapping adapted from AndroidX RadioButton.kt, revision
 * b2dcba37aea417626ed77a230e961f405d893c4c. Apache-2.0.
 * Copyright 2021-2026 The Android Open Source Project. */
import {
  forwardRef, useEffect, useImperativeHandle, useLayoutEffect, useRef, useState,
  type CSSProperties, type InputHTMLAttributes,
} from 'react'
import { useRadioButtonAnimation } from '../internal/useRadioButtonAnimation'
import { MaterialRipple } from './MaterialRipple'
import './MaterialRadioButton.css'

export type MaterialRadioButtonStyle = CSSProperties & {
  '--md-radio-button-icon-size'?: string
  '--md-radio-button-padding'?: string
  '--md-radio-button-stroke-width'?: string
  '--md-radio-button-dot-size'?: string
  '--md-radio-button-state-layer-size'?: string
  '--md-radio-button-touch-target-size'?: string
  '--md-radio-button-selected-color'?: string
  '--md-radio-button-unselected-color'?: string
  '--md-radio-button-disabled-selected-color'?: string
  '--md-radio-button-disabled-unselected-color'?: string
  '--md-radio-button-disabled-selected-opacity'?: number | string
  '--md-radio-button-disabled-unselected-opacity'?: number | string
  '--md-radio-button-state-layer-color'?: string
  '--md-radio-button-hover-state-layer-opacity'?: number | string
  '--md-radio-button-focus-state-layer-opacity'?: number | string
  '--md-radio-button-pressed-state-layer-opacity'?: number | string
}

export type MaterialRadioButtonProps = Omit<InputHTMLAttributes<HTMLInputElement>, 'children' | 'type' | 'style'> & {
  /** False matches AndroidX onClick=null: a 24px decorative control with no input or ripple. */
  interactive?: boolean
  style?: MaterialRadioButtonStyle
}

export const MaterialRadioButton = forwardRef<HTMLInputElement, MaterialRadioButtonProps>(
  function MaterialRadioButton({ checked, defaultChecked, disabled = false, interactive = true, className, style, onChange, ...inputProps }, forwardedRef) {
    const inputRef = useRef<HTMLInputElement>(null)
    const rootRef = useRef<HTMLSpanElement>(null)
    const [uncontrolledChecked, setUncontrolledChecked] = useState(defaultChecked ?? false)
    const selected = checked ?? uncontrolledChecked
    useImperativeHandle(forwardedRef, () => inputRef.current as HTMLInputElement)
    useRadioButtonAnimation(selected, disabled, rootRef, style)
    useLayoutEffect(() => {
      if (interactive && checked === undefined && inputRef.current && inputRef.current.checked !== uncontrolledChecked) setUncontrolledChecked(inputRef.current.checked)
    })
    useEffect(() => {
      if (!interactive || checked !== undefined) return
      let mounted = true
      const sync = () => { if (mounted && inputRef.current) setUncontrolledChecked(inputRef.current.checked) }
      // Native radio groups deselect their peers without firing change on those peers.
      const change = (event: Event) => {
        if (event.target instanceof HTMLInputElement && event.target.type === 'radio') sync()
      }
      const reset = (event: Event) => {
        if (event.target === inputRef.current?.form) queueMicrotask(sync)
      }
      document.addEventListener('change', change)
      document.addEventListener('reset', reset)
      return () => { mounted = false; document.removeEventListener('change', change); document.removeEventListener('reset', reset) }
    }, [checked, interactive])
    return (
      <span ref={rootRef} className={['material-radio-button', className].filter(Boolean).join(' ')}
        data-material-radio-button="" data-selected={selected} data-disabled={disabled}
        data-interactive={interactive} aria-hidden={interactive ? undefined : true} style={style}>
        {interactive && <input {...inputProps} ref={inputRef} type="radio" checked={checked}
          defaultChecked={defaultChecked} disabled={disabled} onChange={event => {
            if (checked === undefined) setUncontrolledChecked(event.currentTarget.checked)
            onChange?.(event)
          }} />}
        {interactive && <MaterialRipple disabled={disabled} unbounded />}
        <span className="material-radio-button__color-target" aria-hidden="true" />
        <svg className="material-radio-button__icon" aria-hidden="true" focusable="false">
          <circle className="material-radio-button__ring" cx="50%" cy="50%" />
          <circle className="material-radio-button__dot" cx="50%" cy="50%" />
        </svg>
      </span>
    )
  },
)
