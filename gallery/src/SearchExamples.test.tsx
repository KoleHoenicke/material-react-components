import { fireEvent, render, screen, within } from '@testing-library/react'
import { afterEach, beforeEach, expect, it, vi } from 'vitest'
import { SearchExamples } from './SearchExamples'
beforeEach(() => vi.stubGlobal('matchMedia', () => ({ matches: true, addEventListener: vi.fn(), removeEventListener: vi.fn() })))
afterEach(() => vi.unstubAllGlobals())
it('opens each search family, selects a suggestion, and keeps its query independent', () => {
  render(<SearchExamples />)
  for (const kind of ['full-screen', 'contained', 'docked', 'docked-with-gap']) {
    const input = screen.getByRole('combobox', { name: `${kind} search` })
    fireEvent.keyDown(input, { key: 'ArrowDown' })
    const dialog = screen.getByRole('dialog', { name: `${kind} search suggestions` })
    fireEvent.click(within(dialog).getByRole('button', { name: 'Parks' }))
    expect(screen.queryByRole('dialog')).toBeNull()
    expect(input).toHaveValue('Parks')
  }
  expect(screen.getByRole('combobox', { name: 'App bar search' })).toHaveValue('')
})
it('controls direction, disabled and readonly states without changing unrelated examples', () => {
  render(<SearchExamples />)
  fireEvent.click(screen.getByRole('switch', { name: 'Right-to-left search' }))
  const input = screen.getByRole('combobox', { name: 'docked search' })
  expect(input.closest('[dir]')).toHaveAttribute('dir', 'rtl')
  fireEvent.click(screen.getByRole('switch', { name: 'Disable search' }))
  expect(input).toBeDisabled()
  expect(screen.getByRole('combobox', { name: 'App bar search' })).not.toBeDisabled()
  fireEvent.click(screen.getByRole('switch', { name: 'Disable search' }))
  fireEvent.click(screen.getByRole('switch', { name: 'Read-only search input' }))
  expect(input).toHaveAttribute('readonly')
})
