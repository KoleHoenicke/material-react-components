import { createRef, useState } from 'react'
import { act, fireEvent, render, screen, within } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { MaterialTimeInput, MaterialTimePicker, MaterialTimePickerDialog, MaterialTimePickerModeToggle, MaterialTimeScroll } from './MaterialTimePicker'

beforeEach(() => {
  vi.stubGlobal('matchMedia', vi.fn((query: string) => ({ matches: query.includes('reduced-motion'), addEventListener: vi.fn(), removeEventListener: vi.fn() })))
})
afterEach(() => { vi.unstubAllGlobals(); vi.useRealTimers() })

describe('MaterialTimePicker', () => {
  it('preserves a controlled value and selection when the caller declines changes', () => {
    const change = vi.fn(), select = vi.fn(), ref = createRef<HTMLDivElement>()
    render(<MaterialTimePicker ref={ref} value={{ hour: 19, minute: 30 }} selection="hour" onValueChange={change} onSelectionChange={select} layoutType="vertical" />)
    fireEvent.click(screen.getByRole('radio', { name: "3 o'clock" }))
    expect(change).toHaveBeenCalledWith({ hour: 15, minute: 30 })
    expect(screen.getByRole('radio', { name: 'Select hour, 7' })).toHaveAttribute('aria-checked', 'true')
    fireEvent.click(screen.getByRole('radio', { name: 'Select minutes, 30' }))
    expect(select).toHaveBeenCalledWith('minute')
    expect(screen.getByRole('radio', { name: 'Select hour, 7' })).toHaveAttribute('aria-checked', 'true')
    expect(ref.current).toHaveAttribute('data-layout', 'vertical')
  })
  it('uses all 24 hours and lets keyboard focus loop from outer to inner rings', () => {
    render(<MaterialTimePicker defaultValue={{ hour: 23, minute: 30 }} is24Hour variant="vibrant" layoutType="vertical" />)
    const midnight = screen.getByRole('radio', { name: '0 hours' })
    const last = screen.getByRole('radio', { name: '23 hours' })
    last.focus(); fireEvent.keyDown(last, { key: 'ArrowRight' })
    expect(midnight).toHaveFocus()
    fireEvent.click(midnight)
    expect(screen.getByRole('radio', { name: 'Select hour, 0' })).toHaveAttribute('aria-checked', 'true')
    expect(screen.queryByRole('radio', { name: 'PM' })).not.toBeInTheDocument()
    expect(screen.queryByRole('radio', { name: '0 minutes' })).not.toBeInTheDocument()
  })
  it('changes AM/PM without losing minutes and supports arrow navigation', () => {
    render(<MaterialTimePicker defaultValue={{ hour: 0, minute: 7 }} />)
    const am = screen.getByRole('radio', { name: 'AM' }), pm = screen.getByRole('radio', { name: 'PM' })
    fireEvent.click(pm)
    expect(pm).toHaveAttribute('aria-checked', 'true')
    expect(screen.getByRole('radio', { name: 'Select minutes, 7' })).toBeInTheDocument()
    pm.focus(); fireEvent.keyDown(pm, { key: 'ArrowDown' })
    expect(am).toHaveFocus()
    expect(am).toHaveAttribute('aria-checked', 'true')
  })
  it('snaps pointer hour taps then advances after the source delay; keyboard activation retains hours', () => {
    vi.useFakeTimers()
    const changed = vi.fn()
    const { container } = render(<MaterialTimePicker defaultValue={{ hour: 7, minute: 30 }} onValueChange={changed} />)
    const dial = container.querySelector('.material-time-picker__dial')!
    fireEvent.pointerDown(dial, { pointerId: 1, isPrimary: true, button: 0, clientX: 229, clientY: 128 })
    fireEvent.pointerUp(dial, { pointerId: 1, isPrimary: true, clientX: 229, clientY: 128 })
    expect(changed).toHaveBeenCalledWith({ hour: 3, minute: 30 })
    act(() => vi.advanceTimersByTime(99))
    expect(screen.getByRole('radio', { name: "3 o'clock" })).toBeInTheDocument()
    act(() => vi.advanceTimersByTime(1))
    expect(screen.getByRole('radio', { name: '0 minutes' })).toBeInTheDocument()
  })
  it('supports individual minute dragging and cancels pending auto-switch on pointer cancellation', () => {
    const changed = vi.fn()
    const { container } = render(<MaterialTimePicker defaultSelection="minute" onValueChange={changed} />)
    const dial = container.querySelector('.material-time-picker__dial')!
    fireEvent.pointerDown(dial, { pointerId: 2, isPrimary: true, button: 0, clientX: 128, clientY: 27 })
    const angle = 7 / 60 * Math.PI * 2 - Math.PI / 2
    fireEvent.pointerMove(dial, { pointerId: 2, isPrimary: true, clientX: 128 + Math.cos(angle) * 101, clientY: 128 + Math.sin(angle) * 101 })
    expect(changed).toHaveBeenLastCalledWith({ hour: 0, minute: 7 })
    fireEvent.pointerCancel(dial, { pointerId: 2 })
    expect(screen.getByRole('radio', { name: 'Select minutes, 7' })).toBeInTheDocument()
  })
  it('resolves localized labels and keeps time numbers LTR inside RTL', () => {
    const { container } = render(<MaterialTimePicker dir="rtl" locale="ar-u-nu-arab" labels={{ hourSelection: 'Hour choice', am: 'Morning' }} />)
    expect(screen.getByRole('radio', { name: 'Morning' })).toBeInTheDocument()
    expect(screen.getByRole('radio', { name: /Hour choice/ })).toHaveTextContent('١٢')
    expect(container.querySelector('.material-time-picker__numbers')).toHaveAttribute('dir', 'ltr')
  })
})

describe('MaterialTimeInput', () => {
  it('shares controlled 24-hour state, advances after two hour digits and accepts individual minutes', () => {
    function Input() {
      const [value, setValue] = useState({ hour: 7, minute: 30 })
      return <MaterialTimeInput value={value} onValueChange={setValue} is24Hour autoFocus />
    }
    render(<Input />)
    const hour = screen.getByRole('textbox', { name: 'for hour' }), minute = screen.getByRole('textbox', { name: 'for minutes' })
    fireEvent.change(hour, { target: { value: '23' } })
    expect(minute).toHaveFocus()
    fireEvent.change(minute, { target: { value: '59' } })
    expect(hour).toHaveValue('23'); expect(minute).toHaveValue('59')
  })
  it('keeps controlled input values when a caller rejects a valid change', () => {
    const change = vi.fn()
    render(<MaterialTimeInput value={{ hour: 7, minute: 30 }} onValueChange={change} autoSwitchToMinute={false} />)
    fireEvent.change(screen.getByRole('textbox', { name: 'for hour' }), { target: { value: '9' } })
    expect(change).toHaveBeenCalledWith({ hour: 9, minute: 30 })
    expect(screen.getByRole('textbox', { name: 'for hour' })).toHaveValue('07')
  })
  it('reports invalid drafts without publishing them, blocks period changes, and recovers', () => {
    const change = vi.fn(), valid = vi.fn()
    render(<MaterialTimeInput defaultValue={{ hour: 7, minute: 30 }} onValueChange={change} onValidityChange={valid} />)
    const hour = screen.getByRole('textbox', { name: 'for hour' })
    fireEvent.change(hour, { target: { value: '99' } })
    expect(hour).toHaveValue('99'); expect(hour).toHaveAttribute('aria-invalid', 'true')
    expect(hour).toHaveAccessibleDescription('Hour must be 1–12')
    expect(valid).toHaveBeenLastCalledWith(false); expect(change).not.toHaveBeenCalled()
    fireEvent.click(screen.getByRole('radio', { name: 'PM' }))
    expect(change).not.toHaveBeenCalled()
    fireEvent.change(hour, { target: { value: '12' } })
    expect(valid).toHaveBeenLastCalledWith(true)
    expect(change).toHaveBeenLastCalledWith({ hour: 0, minute: 30 })
  })
  it('rejects non-digits and overlong pastes; empty and zero input retain AndroidX midnight semantics', () => {
    const change = vi.fn()
    render(<MaterialTimeInput defaultValue={{ hour: 19, minute: 30 }} onValueChange={change} autoSwitchToMinute={false} />)
    const hour = screen.getByRole('textbox', { name: 'for hour' })
    fireEvent.change(hour, { target: { value: 'no' } }); expect(hour).toHaveValue('07')
    fireEvent.change(hour, { target: { value: '123' } }); expect(hour).toHaveValue('07')
    fireEvent.change(hour, { target: { value: '' } }); expect(hour).toHaveValue('')
    expect(change).toHaveBeenLastCalledWith({ hour: 12, minute: 30 })
    fireEvent.change(hour, { target: { value: '0' } }); expect(hour).not.toHaveAttribute('aria-invalid')
  })
  it('synchronizes external values, handles numeric Arabic input and disables automatic advance on request', () => {
    const change = vi.fn()
    const { rerender } = render(<MaterialTimeInput defaultValue={{ hour: 7, minute: 30 }} onValueChange={change} autoSwitchToMinute={false} />)
    fireEvent.change(screen.getByRole('textbox', { name: 'for hour' }), { target: { value: '٩' } })
    expect(change).toHaveBeenCalledWith({ hour: 9, minute: 30 })
    expect(screen.getByRole('textbox', { name: 'for minutes' })).toHaveAttribute('data-selected', 'false')
    rerender(<MaterialTimeInput value={{ hour: 23, minute: 59 }} is24Hour />)
    expect(screen.getByRole('textbox', { name: 'for hour' })).toHaveValue('23')
    expect(screen.getByRole('textbox', { name: 'for minutes' })).toHaveValue('59')
  })
})

describe('MaterialTimeScroll and dialogs', () => {
  it('wraps scrolling and keyboard selection through midnight and respects external values', () => {
    const change = vi.fn()
    const { rerender } = render(<MaterialTimeScroll defaultValue={{ hour: 23, minute: 59 }} is24Hour onValueChange={change} />)
    const hour = screen.getByRole('spinbutton', { name: 'Select hour' }), minute = screen.getByRole('spinbutton', { name: 'Select minutes' })
    fireEvent.keyDown(hour, { key: 'ArrowDown' })
    expect(hour).toHaveAttribute('aria-valuenow', '0')
    fireEvent.wheel(minute, { deltaY: 40 })
    expect(minute).toHaveAttribute('aria-valuenow', '0')
    expect(change).toHaveBeenLastCalledWith({ hour: 0, minute: 0 })
    rerender(<MaterialTimeScroll value={{ hour: 14, minute: 20 }} is24Hour />)
    expect(hour).toHaveAttribute('aria-valuenow', '14'); expect(minute).toHaveAttribute('aria-valuenow', '20')
  })
  it('retains PM during 12-hour scroll and supports uncontained toggle slots', () => {
    const { container } = render(<MaterialTimeScroll defaultValue={{ hour: 23, minute: 30 }} toggle={<button>Input mode</button>} />)
    fireEvent.keyDown(screen.getByRole('spinbutton', { name: 'Select hour' }), { key: 'ArrowDown' })
    expect(screen.getByRole('spinbutton', { name: 'Select hour' })).toHaveAttribute('aria-valuenow', '12')
    expect(screen.getByRole('radio', { name: 'PM' })).toHaveAttribute('aria-checked', 'true')
    expect(screen.getByRole('button', { name: 'Input mode' })).toBeInTheDocument()
    expect(container.firstChild).toHaveAttribute('data-uncontained', 'true')
  })
  it('owns dialog chrome and caller-supplied actions, with accessible title and dismissal', () => {
    const dismiss = vi.fn(), confirm = vi.fn(), ref = createRef<HTMLDialogElement>()
    render(<MaterialTimePickerDialog ref={ref} open onDismissRequest={dismiss} title="Select departure time"
      confirmButton={<button onClick={confirm}>OK</button>} dismissButton={<button>Cancel</button>}><MaterialTimeInput /></MaterialTimePickerDialog>)
    const dialog = screen.getByRole('dialog', { name: 'Select departure time' })
    expect(ref.current).toBe(dialog)
    fireEvent.click(within(dialog).getByRole('button', { name: 'OK' })); expect(confirm).toHaveBeenCalledOnce()
    fireEvent(dialog, new Event('cancel', { bubbles: true, cancelable: true })); expect(dismiss).toHaveBeenCalledWith('escape')
  })
  it('exposes the AndroidX mode toggle with localized names', () => {
    const change = vi.fn()
    const { rerender } = render(<MaterialTimePickerModeToggle displayMode="picker" onDisplayModeChange={change} />)
    fireEvent.click(screen.getByRole('button', { name: 'Switch to text input mode' })); expect(change).toHaveBeenCalledWith('input')
    rerender(<MaterialTimePickerModeToggle displayMode="input" alternateMode="scroll" scrollLabel="Scroll time" onDisplayModeChange={change} />)
    fireEvent.click(screen.getByRole('button', { name: 'Scroll time' })); expect(change).toHaveBeenLastCalledWith('scroll')
  })
})
