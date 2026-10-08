import { createRef, useState } from 'react'
import { act, fireEvent, render, screen } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'
import {
  getMaterialTextFieldColors, MATERIAL_TEXT_FIELD_DIMENSIONS, MaterialTextField,
  MaterialOutlinedTextField, MaterialFilledTextField, MaterialSecureTextField,
  MaterialOutlinedSecureTextField, MaterialTextFieldDecorator, type MaterialTextFieldElement,
} from './MaterialTextField'

const shell = (input: HTMLElement) => input.closest('.material-text-field')!

describe('AndroidX text field family', () => {
  it.each([['filled', MaterialFilledTextField], ['outlined', MaterialOutlinedTextField]] as const)('renders %s labels and defaults to multiline like Compose', (variant, Component) => {
    render(<Component label="Name" placeholder="Enter name" />)
    const input = screen.getByRole('textbox', { name: 'Name' })
    expect(input.tagName).toBe('TEXTAREA')
    expect(input).toHaveAttribute('rows', '1')
    expect(shell(input)).toHaveAttribute('data-variant', variant)
    expect(shell(input)).toHaveAttribute('data-label-position', variant === 'filled' ? 'inside' : 'cutout')
    expect(shell(input)).toHaveAttribute('data-minimized', 'false')
    fireEvent.focus(input)
    expect(shell(input)).toHaveAttribute('data-minimized', 'true')
    expect(shell(input)).toHaveAttribute('data-focused', 'true')
    fireEvent.change(input, { target: { value: 'Ada' } })
    fireEvent.blur(input)
    expect(input).toHaveValue('Ada')
    expect(shell(input)).toHaveAttribute('data-minimized', 'true')
    fireEvent.change(input, { target: { value: '' } })
    expect(shell(input)).toHaveAttribute('data-minimized', 'false')
  })

  it.each(['inside', 'cutout', 'above', 'attached'] as const)('supports %s labels independently of container style', position => {
    const { rerender } = render(<MaterialTextField singleLine label="Price" labelPosition={{ position, expandedAlignment: 'end', minimizedAlignment: 'center' }} />)
    const input = screen.getByRole('textbox', { name: 'Price' })
    expect(shell(input)).toHaveAttribute('data-label-alignment', position === 'above' ? 'center' : 'end')
    fireEvent.focus(input)
    expect(shell(input)).toHaveAttribute('data-label-alignment', 'center')
    rerender(<MaterialOutlinedTextField singleLine label="Price" labelPosition={position} alwaysMinimizeLabel />)
    expect(shell(input)).toHaveAttribute('data-minimized', 'true')
    expect(shell(screen.getByRole('textbox', { name: 'Price' }))).toHaveAttribute('data-label-position', position === 'attached' ? 'cutout' : position)
  })

  it('keeps affixes hidden from accessibility while the empty label is expanded', () => {
    const { container } = render(<MaterialTextField singleLine label="Amount" prefix="$" suffix="USD" leadingIcon={<svg aria-hidden="true" />} trailingIcon={<button type="button" aria-label="Clear amount">x</button>} />)
    const input = screen.getByRole('textbox', { name: 'Amount' })
    const prefix = container.querySelector('.material-text-field__prefix')!
    expect(prefix).toHaveAttribute('aria-hidden', 'true')
    fireEvent.focus(input)
    expect(prefix).toHaveAttribute('aria-hidden', 'false')
    expect(screen.getByRole('button', { name: 'Clear amount' })).toBeInTheDocument()
    expect(shell(input)).toHaveAttribute('data-leading', 'true')
  })

  it('preserves controlled input semantics and forwards the real native input and attributes', () => {
    const ref = createRef<MaterialTextFieldElement>()
    const change = vi.fn()
    const onValueChange = vi.fn()
    const { rerender } = render(<MaterialTextField singleLine ref={ref} label="Email" value="a@b.co" onChange={change} onValueChange={onValueChange} type="email" name="email" form="profile" autoComplete="email" required />)
    const input = screen.getByRole('textbox', { name: 'Email' })
    expect(ref.current).toBe(input)
    expect(input).toHaveAttribute('type', 'email')
    expect(input).toHaveAttribute('name', 'email')
    expect(input).toHaveAttribute('form', 'profile')
    expect(input).toHaveAttribute('autocomplete', 'email')
    expect(input).toBeRequired()
    fireEvent.change(input, { target: { value: 'next@b.co' } })
    expect(change).toHaveBeenCalledOnce()
    expect(onValueChange).toHaveBeenCalledWith('next@b.co', expect.anything())
    expect(input).toHaveValue('a@b.co')
    rerender(<MaterialTextField singleLine ref={ref} label="Email" value="next@b.co" />)
    expect(input).toHaveValue('next@b.co')
  })

  it('preserves native date-time picker constraints and controlled updates', () => {
    const change = vi.fn()
    const { rerender } = render(<MaterialTextField singleLine label="Ends" type="datetime-local" min="2026-10-08T12:00" required value="2026-10-09T12:00" onValueChange={change} />)
    const input = screen.getByLabelText('Ends')
    expect(input).toHaveAttribute('type', 'datetime-local')
    expect(input).toHaveAttribute('min', '2026-10-08T12:00')
    expect(input).toBeRequired()
    fireEvent.change(input, { target: { value: '2026-10-10T12:00' } })
    expect(change).toHaveBeenCalledWith('2026-10-10T12:00', expect.anything())
    expect(input).toHaveValue('2026-10-09T12:00')
    rerender(<MaterialTextField singleLine label="Ends" type="datetime-local" value="2026-10-10T12:00" />)
    expect(input).toHaveValue('2026-10-10T12:00')
  })

  it('allows controlled multiline editing without swallowing Enter and clamps line limits', () => {
    const ref = createRef<MaterialTextFieldElement>()
    const action = vi.fn()
    function Example() {
      const [value, setValue] = useState('One\nTwo')
      return <MaterialTextField ref={ref} label="Notes" value={value} onValueChange={setValue} minLines={2} maxLines={1} onKeyboardAction={action} />
    }
    render(<Example />)
    const input = screen.getByRole('textbox', { name: 'Notes' })
    expect(ref.current).toBe(input)
    expect(input).toHaveAttribute('rows', '2')
    expect(input).toHaveStyle({ height: '48px' })
    fireEvent.change(input, { target: { value: 'One\nTwo\nThree' } })
    expect(input).toHaveValue('One\nTwo\nThree')
    fireEvent.keyDown(input, { key: 'Enter' })
    expect(action).not.toHaveBeenCalled()
  })

  it('joins supporting and error descriptions with caller ARIA rather than replacing them', () => {
    const { rerender } = render(<MaterialTextField singleLine id="age" label="Age" aria-describedby="hint" aria-errormessage="server-error" supportingText="Use years" isError />)
    const input = screen.getByRole('textbox', { name: 'Age' })
    expect(input).toHaveAttribute('aria-describedby', 'hint age-supporting age-error')
    expect(input).toHaveAttribute('aria-errormessage', 'server-error age-error')
    expect(input).toHaveAttribute('aria-invalid', 'true')
    expect(screen.getByText('Invalid input')).toHaveAttribute('id', 'age-error')
    rerender(<MaterialTextField singleLine id="age" label="Age" supportingText="Use years" isError errorMessage="Enter a valid age" />)
    expect(input).toHaveAccessibleDescription('Use years Enter a valid age')
    rerender(<MaterialTextField singleLine id="age" label="Age" supportingText="Use years" />)
    expect(input).not.toHaveAttribute('aria-invalid')
    expect(input).not.toHaveAttribute('aria-errormessage')
  })

  it('keeps readonly fields focusable, disables inputs natively, and suppresses edits/actions', () => {
    const change = vi.fn()
    const action = vi.fn()
    const { rerender } = render(<MaterialTextField singleLine label="Account" value="123" readOnly onValueChange={change} onKeyboardAction={action} />)
    const input = screen.getByRole('textbox', { name: 'Account' })
    expect(input).toHaveAttribute('readonly')
    expect(input).not.toBeDisabled()
    fireEvent.focus(input)
    expect(shell(input)).toHaveAttribute('data-focused', 'true')
    fireEvent.change(input, { target: { value: '456' } })
    fireEvent.keyDown(input, { key: 'Enter' })
    expect(change).not.toHaveBeenCalled()
    expect(action).not.toHaveBeenCalled()
    rerender(<MaterialTextField singleLine label="Account" value="123" disabled isError />)
    expect(input).toBeDisabled()
    expect(shell(input)).toHaveAttribute('data-focused', 'false')
  })

  it('focuses from blank container space while leaving slot buttons independent', () => {
    render(<MaterialTextField singleLine label="Search" trailingIcon={<button type="button">Clear</button>} />)
    const input = screen.getByRole('textbox', { name: 'Search' })
    fireEvent.click(shell(input).querySelector('.material-text-field__container')!)
    expect(input).toHaveFocus()
    const clear = screen.getByRole('button', { name: 'Clear' })
    clear.focus()
    fireEvent.click(clear)
    expect(clear).toHaveFocus()
  })

  it('runs keyboard actions after native handlers, supports cancellation, and ignores IME Enter', () => {
    const action = vi.fn()
    const { rerender } = render(<MaterialTextField singleLine aria-label="Query" onKeyboardAction={action} />)
    const input = screen.getByRole('textbox', { name: 'Query' })
    fireEvent.keyDown(input, { key: 'Enter' })
    expect(action).toHaveBeenCalledOnce()
    fireEvent.keyDown(input, { key: 'Enter', isComposing: true })
    expect(action).toHaveBeenCalledOnce()
    rerender(<MaterialTextField singleLine aria-label="Query" onKeyboardAction={action} onKeyDown={event => event.preventDefault()} />)
    fireEvent.keyDown(input, { key: 'Enter' })
    expect(action).toHaveBeenCalledOnce()
  })

  it('applies input transformations only to user edits and can reject a change', () => {
    const transform = vi.fn((value: string) => /[^\d]/.test(value) ? null : value)
    const change = vi.fn()
    const { rerender } = render(<MaterialTextField singleLine label="Digits" value="initial" inputTransformation={transform} onValueChange={change} />)
    const input = screen.getByRole('textbox', { name: 'Digits' })
    expect(transform).not.toHaveBeenCalled()
    fireEvent.change(input, { target: { value: 'x' } })
    expect(input).toHaveValue('initial')
    expect(change).not.toHaveBeenCalled()
    fireEvent.change(input, { target: { value: '12' } })
    expect(change).toHaveBeenCalledWith('12', expect.anything())
    rerender(<MaterialTextField singleLine label="Digits" value="programmatic" inputTransformation={transform} />)
    expect(input).toHaveValue('programmatic')
    expect(transform).toHaveBeenCalledTimes(2)
  })

  it('defers transformations until IME composition commits', () => {
    const transform = vi.fn((value: string) => value.toUpperCase())
    const change = vi.fn()
    render(<MaterialTextField singleLine label="Compose" inputTransformation={transform} onValueChange={change} />)
    const input = screen.getByRole('textbox', { name: 'Compose' })
    fireEvent.compositionStart(input)
    fireEvent.change(input, { target: { value: 'あ' } })
    expect(input).toHaveValue('あ')
    expect(transform).not.toHaveBeenCalled()
    expect(change).not.toHaveBeenCalled()
    fireEvent.compositionEnd(input, { data: 'あ' })
    expect(transform).toHaveBeenCalledOnce()
    expect(change).toHaveBeenCalledWith('あ', expect.anything())
    fireEvent.input(input, { target: { value: 'あ' }, inputType: 'insertCompositionText' })
    expect(change).toHaveBeenCalledOnce()
  })

  it('formats the display, maps caret offsets, and serializes the raw form value', () => {
    function Example() {
      const [value, setValue] = useState('1234')
      return <form aria-label="Profile"><MaterialTextField singleLine label="Code" name="code" value={value} onValueChange={setValue} outputTransformation={raw => ({
        text: raw.length > 2 ? `${raw.slice(0, 2)}-${raw.slice(2)}` : raw,
        originalToTransformed: i => i > 2 ? i + 1 : i,
        transformedToOriginal: i => i > 2 ? i - 1 : i,
      })} /></form>
    }
    render(<Example />)
    const input = screen.getByRole('textbox', { name: 'Code' }) as HTMLInputElement
    expect(input).toHaveValue('12-34')
    fireEvent.change(input, { target: { value: '12-345', selectionStart: 6, selectionEnd: 6 } })
    expect(input).toHaveValue('12-345')
    expect(input.selectionStart).toBe(6)
    expect(new FormData(screen.getByRole('form', { name: 'Profile' }) as HTMLFormElement).get('code')).toBe('12345')
    fireEvent.change(input, { target: { value: '12-35', selectionStart: 4, selectionEnd: 4 } })
    expect(input).toHaveValue('12-35')
    // Backspace across the generated hyphen must delete a stored character.
    fireEvent.change(input, { target: { value: '1235', selectionStart: 2, selectionEnd: 2 } })
    expect(input).toHaveValue('13-5')
    expect(input.selectionStart).toBe(1)
  })

  it('resets uncontrolled state and decorations with its native form', async () => {
    render(<form aria-label="Reset"><MaterialTextField singleLine label="Name" defaultValue="Ada" /></form>)
    const input = screen.getByRole('textbox', { name: 'Name' })
    fireEvent.change(input, { target: { value: 'Grace' } })
    await act(async () => { fireEvent.reset(screen.getByRole('form', { name: 'Reset' })) })
    expect(input).toHaveValue('Ada')
  })

  it('preserves input and password values when the form cancels reset', async () => {
    render(<form aria-label="Cancel reset" onReset={event => event.preventDefault()}>
      <MaterialTextField singleLine label="Name" defaultValue="Ada" />
      <MaterialSecureTextField label="Password" defaultValue="initial" />
    </form>)
    const input = screen.getByRole('textbox', { name: 'Name' })
    const password = screen.getByLabelText('Password')
    fireEvent.change(input, { target: { value: 'Grace' } })
    fireEvent.change(password, { target: { value: 'changed' } })
    await act(async () => { fireEvent.reset(screen.getByRole('form', { name: 'Cancel reset' })) })
    expect(input).toHaveValue('Grace')
    expect(password).toHaveValue('changed')
  })

  it('exposes all AndroidX color roles and expressive tonal defaults', () => {
    expect(MATERIAL_TEXT_FIELD_DIMENSIONS).toMatchObject({ minWidth: 280, minHeight: 56, iconSize: 24, iconTargetSize: 48, affixGap: 2 })
    for (const variant of ['filled', 'outlined'] as const) for (const mode of ['default', 'tonal'] as const) {
      expect(Object.keys(getMaterialTextFieldColors(variant, mode))).toHaveLength(43)
    }
    const filled = getMaterialTextFieldColors()
    expect(filled.disabledContainerColor).toBe(filled.unfocusedContainerColor)
    expect(filled.disabledIndicatorColor).toContain('38%')
    const outlined = getMaterialTextFieldColors('outlined')
    expect(outlined.unfocusedContainerColor).toBe('transparent')
    expect(outlined.disabledIndicatorColor).toContain('12%')
    expect(getMaterialTextFieldColors('filled', 'tonal')).toMatchObject({ unfocusedIndicatorColor: 'transparent', errorContainerColor: 'var(--md-sys-color-error-container)' })
    expect(getMaterialTextFieldColors('outlined', 'tonal').focusedIndicatorColor).toBe('var(--md-sys-color-outline-variant)')
  })

  it('maps typed custom colors, dimensions, shapes, padding, and native text styles', () => {
    render(<MaterialTextField singleLine label="Custom" colorMode="tonal" shape="rounded" colors={{ focusedTextColor: 'red', disabledLabelColor: 'gray', textSelectionColors: { backgroundColor: 'pink' } }} contentPadding={{ start: 20, top: 12 }} supportingTextPadding={{ start: 4 }} focusedIndicatorThickness={3} textStyle={{ textAlign: 'center' }} style={{ '--md-text-field-padding-end': '30px' }} />)
    const input = screen.getByRole('textbox', { name: 'Custom' })
    expect(shell(input)).toHaveStyle({ '--md-text-field-focused-text-color': 'red', '--md-text-field-selection-color': 'pink', '--md-text-field-padding-start': '20px', '--md-text-field-padding-top': '12px', '--md-text-field-padding-end': '30px', '--md-text-field-shape': 'var(--md-sys-shape-corner-medium)', '--md-text-field-focused-indicator-thickness': '3px' })
    expect(input).toHaveStyle({ textAlign: 'center' })
  })

  it('offers a reusable decorator with caller-owned editor and a label scope', () => {
    render(<MaterialTextFieldDecorator inputId="custom-editor" value="Text" focused label={scope => scope.minimized ? 'Minimized' : 'Expanded'}><input id="custom-editor" defaultValue="Text" /></MaterialTextFieldDecorator>)
    expect(screen.getByRole('textbox', { name: 'Minimized' })).toHaveValue('Text')
  })
})

it('replaces the default container with a reusable state-aware slot', () => {
  render(<MaterialTextField singleLine label="Custom container" isError container={state => <span data-testid="custom-container">{state.isError ? 'Error container' : 'Container'}</span>} />)
  expect(screen.getByTestId('custom-container')).toHaveTextContent('Error container')
  expect(shell(screen.getByRole('textbox', { name: 'Custom container' }))).toHaveAttribute('data-custom-container', 'true')
})

describe('secure fields', () => {
  it.each([MaterialSecureTextField, MaterialOutlinedSecureTextField])('uses native password semantics, refs, and secure keyboard defaults', Component => {
    const ref = createRef<HTMLInputElement>()
    render(<Component label="Password" ref={ref} defaultValue="secret" />)
    const input = screen.getByLabelText('Password')
    expect(input).toHaveAttribute('type', 'password')
    expect(ref.current).toBe(input)
    expect(input).toHaveAttribute('autocomplete', 'current-password')
    expect(input).toHaveAttribute('spellcheck', 'false')
    expect(fireEvent.copy(input)).toBe(false)
    expect(fireEvent.cut(input)).toBe(false)
  })

  it('supports visible and hidden modes without adding app-owned reveal controls', () => {
    const { rerender } = render(<MaterialSecureTextField label="Password" value="secret" textObfuscationMode="visible" />)
    const input = screen.getByLabelText('Password')
    expect(input).toHaveAttribute('type', 'text')
    expect(screen.queryByRole('button')).not.toBeInTheDocument()
    rerender(<MaterialSecureTextField label="Password" value="secret" textObfuscationMode="hidden" />)
    expect(input).toHaveAttribute('type', 'password')
    expect(shell(input).querySelector('.material-text-field__secure-mask')).toHaveTextContent('••••••')
  })

  it('reveals one inserted code point for 1500ms, masks paste, and hides on blur', () => {
    vi.useFakeTimers()
    try {
      const { container } = render(<MaterialSecureTextField label="Password" textObfuscationMode="reveal-last-typed" />)
      const input = screen.getByLabelText('Password')
      const mask = () => container.querySelector('.material-text-field__secure-mask')!
      fireEvent.change(input, { target: { value: 'a', selectionStart: 1, selectionEnd: 1 } })
      expect(mask()).toHaveTextContent('a')
      act(() => vi.advanceTimersByTime(1499))
      expect(mask()).toHaveTextContent('a')
      act(() => vi.advanceTimersByTime(1))
      expect(mask()).toHaveTextContent('•')
      fireEvent.change(input, { target: { value: 'abc', selectionStart: 3, selectionEnd: 3 } })
      expect(mask()).toHaveTextContent('•••')
      fireEvent.change(input, { target: { value: 'abc😀', selectionStart: 5, selectionEnd: 5 } })
      expect(mask()).toHaveTextContent('•••😀')
      fireEvent.blur(input)
      expect(mask()).toHaveTextContent('••••')
      expect(mask()).toHaveAttribute('aria-hidden', 'true')
    } finally { vi.useRealTimers() }
  })

  it('supports a custom mask code point and rejects revealing controlled edits the parent did not accept', () => {
    const { container } = render(<MaterialSecureTextField label="Password" value="abc" textObfuscationMode="reveal-last-typed" textObfuscationCharacter="*" />)
    fireEvent.change(screen.getByLabelText('Password'), { target: { value: 'abcd', selectionStart: 4, selectionEnd: 4 } })
    expect(container.querySelector('.material-text-field__secure-mask')).toHaveTextContent('***')
    expect(screen.getByLabelText('Password')).toHaveValue('abc')
  })
})
