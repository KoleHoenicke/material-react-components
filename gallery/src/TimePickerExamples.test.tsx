import { fireEvent, render, screen, within } from '@testing-library/react'
import { afterEach, beforeEach, expect, it, vi } from 'vitest'
import { TimePickerExamples } from './TimePickerExamples'
beforeEach(() => vi.stubGlobal('matchMedia', () => ({ matches: true, addEventListener: vi.fn(), removeEventListener: vi.fn() })))
afterEach(() => vi.unstubAllGlobals())
it('includes every layout, format, input mode and uncontained variant with independent state', () => {
  render(<TimePickerExamples />)
  expect(screen.getAllByRole('article')).toHaveLength(14)
  const first = within(screen.getByRole('heading', { name: 'Baseline · vertical · 12 hour' }).closest('article')!)
  fireEvent.click(first.getByRole('radio', { name: 'PM' }))
  expect(first.getByLabelText('Baseline · vertical · 12 hour selected time')).toHaveTextContent('19:30')
  expect(screen.getByLabelText('Vibrant · vertical · 12 hour selected time')).toHaveTextContent('07:30')
  const uncontained = within(screen.getByRole('heading', { name: 'Uncontained scroll with mode switch' }).closest('article')!)
  fireEvent.click(uncontained.getByRole('button', { name: 'Switch to text input mode' }))
  expect(uncontained.getByRole('textbox', { name: 'for hour' })).toHaveValue('07')
})
it('switches dialog modes without losing the draft and only confirms valid time', () => {
  render(<TimePickerExamples />)
  fireEvent.click(screen.getByRole('button', { name: 'Baseline dial dialog' }))
  let dialog = within(screen.getByRole('dialog'))
  fireEvent.click(dialog.getByRole('button', { name: 'Switch to text input mode' }))
  dialog = within(screen.getByRole('dialog'))
  fireEvent.change(dialog.getByRole('textbox', { name: 'for hour' }), { target: { value: '99' } })
  expect(dialog.getByRole('button', { name: 'OK' })).toBeDisabled()
  fireEvent.change(dialog.getByRole('textbox', { name: 'for hour' }), { target: { value: '09' } })
  fireEvent.change(dialog.getByRole('textbox', { name: 'for minutes' }), { target: { value: '45' } })
  fireEvent.click(dialog.getByRole('button', { name: 'OK' }))
  expect(screen.getByLabelText('Baseline dial dialog confirmed time')).toHaveTextContent('21:45')
})
