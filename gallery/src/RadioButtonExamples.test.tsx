import { fireEvent, render, screen, within } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import { RadioButtonExamples } from './RadioButtonExamples'

describe('radio button gallery examples', () => {
  it('shows native states and independently controlled sample groups', () => {
    const { container } = render(<RadioButtonExamples />)
    const native = within(screen.getByRole('group', { name: 'Native radio group' }))
    const rows = within(screen.getByRole('group', { name: 'AndroidX sample rows' }))
    fireEvent.click(native.getByRole('radio', { name: 'Missed' }))
    expect(native.getByRole('radio', { name: 'Missed' })).toBeChecked()
    expect(native.getByRole('radio', { name: 'Calls' })).not.toBeChecked()
    expect(rows.getByRole('radio', { name: 'Calls' })).toBeChecked()
    fireEvent.click(rows.getByText('Friends'))
    expect(rows.getByRole('radio', { name: 'Friends' })).toBeChecked()
    expect(rows.getAllByRole('radio')).toHaveLength(3)
    fireEvent.click(screen.getByRole('switch', { name: 'Right-to-left radio buttons' }))
    expect(container.firstElementChild).toHaveAttribute('dir', 'rtl')
  })
})
