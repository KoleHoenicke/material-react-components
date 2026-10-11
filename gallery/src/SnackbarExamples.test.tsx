import { act, fireEvent, render, screen, within } from '@testing-library/react'
import { afterEach, beforeEach, expect, it, vi } from 'vitest'
import { SnackbarExamples } from './SnackbarExamples'

afterEach(() => { vi.unstubAllGlobals() })
beforeEach(() => {
  vi.stubGlobal('matchMedia', () => ({ matches: true, addEventListener: vi.fn(), removeEventListener: vi.fn() }))
})

it('shows every layout and controls direction and the source styling flag', () => {
  const { container } = render(<SnackbarExamples />)
  expect(container.querySelectorAll('[data-material-snackbar]')).toHaveLength(4)
  fireEvent.click(screen.getByRole('switch', { name: 'Right-to-left snackbars' }))
  expect(container.firstElementChild).toHaveAttribute('dir', 'rtl')
  fireEvent.click(screen.getByRole('switch', { name: 'AndroidX snackbar styling fix' }))
  expect(container.querySelector('[data-material-snackbar]')).toHaveAttribute('data-styling-fix', 'true')
})

it('shows a separate-row action and reports its dismissal', async () => {
  const { container } = render(<SnackbarExamples />)
  fireEvent.click(screen.getByRole('switch', { name: 'Snackbar action on new line' }))
  fireEvent.click(screen.getByRole('button', { name: 'Show action' }))
  const stage = container.querySelector<HTMLElement>('.snackbar-examples__host-stage')!
  expect(stage.querySelector('[data-material-snackbar]')).toHaveAttribute('data-action-new-line', 'true')
  await act(async () => { fireEvent.click(within(stage).getByRole('button', { name: 'Dismiss' })) })
  expect(screen.getByLabelText('Snackbar result')).toHaveTextContent('dismissed')
})

it('advances the interactive queue in order', async () => {
  const { container } = render(<SnackbarExamples />)
  const stage = within(container.querySelector<HTMLElement>('.snackbar-examples__host-stage')!)
  fireEvent.click(screen.getByRole('button', { name: 'Queue two' }))
  expect(stage.getByRole('status')).toHaveTextContent('First queued message')
  await act(async () => { fireEvent.click(stage.getByRole('button', { name: 'Dismiss' })) })
  expect(stage.getByRole('status')).toHaveTextContent('Second queued message')
})

it('renders the custom host content', () => {
  const { container } = render(<SnackbarExamples />)
  fireEvent.click(screen.getByRole('button', { name: 'Show custom snackbar' }))
  const stage = within(container.querySelectorAll<HTMLElement>('.snackbar-examples__host-stage')[1])
  expect(stage.getByRole('button', { name: 'Open file' })).toBeVisible()
})
