import { createRef, useState } from 'react'
import { act, fireEvent, render, screen } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'
import { MaterialRadioButton } from './MaterialRadioButton'

describe('MaterialRadioButton', () => {
  it('keeps native labels, refs, required validation and form values', () => {
    const ref = createRef<HTMLInputElement>()
    render(<form aria-label="Delivery"><label htmlFor="radio-email">Email</label>
      <MaterialRadioButton ref={ref} id="radio-email" name="delivery" value="email" required />
    </form>)
    const input = screen.getByRole('radio', { name: 'Email' }) as HTMLInputElement
    const form = screen.getByRole('form') as HTMLFormElement
    expect(ref.current).toBe(input)
    expect(form.checkValidity()).toBe(false)
    fireEvent.click(screen.getByText('Email'))
    expect(input).toBeChecked()
    expect(form.checkValidity()).toBe(true)
    expect(new FormData(form).get('delivery')).toBe('email')
  })

  it('supports a controlled group and calls change only when a new option is selected', () => {
    const changed = vi.fn()
    function Group() {
      const [value, setValue] = useState('calls')
      return <fieldset><legend>Call filter</legend>{['calls', 'missed'].map(option =>
        <label key={option}><MaterialRadioButton name="filter" value={option} checked={value === option}
          onChange={event => { changed(event.currentTarget.value); setValue(event.currentTarget.value) }} />{option}</label>)}</fieldset>
    }
    render(<Group />)
    fireEvent.click(screen.getByRole('radio', { name: 'missed' }))
    expect(screen.getByRole('radio', { name: 'missed' })).toBeChecked()
    expect(screen.getByRole('radio', { name: 'calls' })).not.toBeChecked()
    expect(changed).toHaveBeenCalledTimes(1)
    expect(changed).toHaveBeenCalledWith('missed')
    fireEvent.click(screen.getByRole('radio', { name: 'missed' }))
    expect(changed).toHaveBeenCalledTimes(1)
  })

  it('preserves controlled state when the caller declines a change', () => {
    const changed = vi.fn()
    render(<MaterialRadioButton aria-label="Controlled" checked={false} onChange={changed} />)
    fireEvent.click(screen.getByRole('radio'))
    expect(changed).toHaveBeenCalledTimes(1)
    expect(screen.getByRole('radio')).not.toBeChecked()
    expect(screen.getByRole('radio').parentElement).toHaveAttribute('data-selected', 'false')
  })

  it('synchronizes the animation state of uncontrolled native group peers', () => {
    render(<><MaterialRadioButton aria-label="First" name="native" defaultChecked />
      <MaterialRadioButton aria-label="Second" name="native" /></>)
    fireEvent.click(screen.getByRole('radio', { name: 'Second' }))
    expect(screen.getByRole('radio', { name: 'First' })).not.toBeChecked()
    expect(screen.getByRole('radio', { name: 'First' }).parentElement).toHaveAttribute('data-selected', 'false')
    expect(screen.getByRole('radio', { name: 'Second' }).parentElement).toHaveAttribute('data-selected', 'true')
  })

  it('restores uncontrolled native selection after form reset', async () => {
    render(<form aria-label="Reset group"><MaterialRadioButton aria-label="First" name="reset" defaultChecked />
      <MaterialRadioButton aria-label="Second" name="reset" /></form>)
    fireEvent.click(screen.getByRole('radio', { name: 'Second' }))
    await act(async () => { (screen.getByRole('form') as HTMLFormElement).reset() })
    expect(screen.getByRole('radio', { name: 'First' })).toBeChecked()
    expect(screen.getByRole('radio', { name: 'First' }).parentElement).toHaveAttribute('data-selected', 'true')
    expect(screen.getByRole('radio', { name: 'Second' }).parentElement).toHaveAttribute('data-selected', 'false')
  })

  it('keeps same-named groups in different forms independent', () => {
    render(<><form><MaterialRadioButton aria-label="Form one" name="shared" defaultChecked /></form>
      <form><MaterialRadioButton aria-label="Form two" name="shared" /></form></>)
    fireEvent.click(screen.getByRole('radio', { name: 'Form two' }))
    expect(screen.getByRole('radio', { name: 'Form one' })).toBeChecked()
    expect(screen.getByRole('radio', { name: 'Form two' })).toBeChecked()
  })

  it('disables input, form submission and ripple for both disabled states', () => {
    const { container } = render(<form aria-label="Disabled"><MaterialRadioButton aria-label="Unavailable" name="disabled" defaultChecked disabled /></form>)
    expect(screen.getByRole('radio')).toBeDisabled()
    expect(new FormData(screen.getByRole('form') as HTMLFormElement).has('disabled')).toBe(false)
    expect(container.querySelector('[data-material-ripple]')).toHaveAttribute('data-material-ripple-disabled', 'true')
  })

  it('provides the onClick=null decorative mode without a second accessible control', () => {
    const { container, rerender } = render(<MaterialRadioButton checked interactive={false} />)
    expect(screen.queryByRole('radio')).not.toBeInTheDocument()
    expect(container.querySelector('[data-material-radio-button]')).toHaveAttribute('aria-hidden', 'true')
    expect(container.querySelector('input')).toBeNull()
    expect(container.querySelector('[data-material-ripple]')).toBeNull()
    expect(container.querySelector('[data-material-radio-button]')).toHaveAttribute('data-selected', 'true')
    rerender(<MaterialRadioButton checked={false} interactive={false} />)
    expect(container.querySelector('[data-material-radio-button]')).toHaveAttribute('data-selected', 'false')
  })

  it('preserves inherited native fieldset disabling', () => {
    render(<fieldset disabled><legend>Unavailable group</legend>
      <MaterialRadioButton aria-label="Inherited disabled" name="fieldset" defaultChecked />
    </fieldset>)
    expect(screen.getByRole('radio')).toBeDisabled()
    expect(screen.getByRole('radio')).toBeChecked()
  })

  it('uses the pinned AndroidX geometry and accepts typed token overrides', () => {
    const { container } = render(<MaterialRadioButton aria-label="Tokens" style={{ '--md-radio-button-selected-color': 'red' }} />)
    const root = container.querySelector('[data-material-radio-button]')!
    const styles = getComputedStyle(root)
    expect(styles.getPropertyValue('--md-radio-button-icon-size')).toBe('20px')
    expect(styles.getPropertyValue('--md-radio-button-padding')).toBe('2px')
    expect(styles.getPropertyValue('--md-radio-button-dot-size')).toBe('12px')
    expect(styles.getPropertyValue('--md-radio-button-stroke-width')).toBe('2px')
    expect(styles.getPropertyValue('--md-radio-button-state-layer-size')).toBe('40px')
    expect(styles.getPropertyValue('--md-radio-button-touch-target-size')).toBe('48px')
    expect(styles.getPropertyValue('--md-radio-button-disabled-selected-opacity')).toBe('0.38')
    expect(root).toHaveStyle('--md-radio-button-selected-color: red')
    expect(container.querySelector('svg')).toHaveAttribute('aria-hidden', 'true')
  })
})
