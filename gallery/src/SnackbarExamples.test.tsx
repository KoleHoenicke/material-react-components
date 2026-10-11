import { act, fireEvent, render, screen } from '@testing-library/react'
import { afterEach, expect, it, vi } from 'vitest'
import { SnackbarExamples } from './SnackbarExamples'

afterEach(() => { vi.unstubAllGlobals() })

it('shows every layout and controls direction, source layout, actions, queues and custom content', async () => {
  vi.stubGlobal('matchMedia', () => ({ matches: true, addEventListener: vi.fn(), removeEventListener: vi.fn() }))
  const { container } = render(<SnackbarExamples />)
  expect(container.querySelectorAll('[data-material-snackbar]')).toHaveLength(4)
  fireEvent.click(screen.getByRole('switch', { name: 'Right-to-left snackbars' }))
  expect(container.firstElementChild).toHaveAttribute('dir', 'rtl')
  fireEvent.click(screen.getByRole('switch', { name: 'AndroidX snackbar styling fix' }))
  expect(container.querySelector('[data-material-snackbar]')).toHaveAttribute('data-styling-fix', 'true')
  fireEvent.click(screen.getByRole('switch', { name: 'Snackbar action on new line' }))
  await act(async () => { fireEvent.click(screen.getByRole('button', { name: 'Show action' })) })
  const live = container.querySelector('.snackbar-examples__host-stage [data-material-snackbar]')!
  expect(live).toHaveAttribute('data-action-new-line', 'true')
  await act(async () => { fireEvent.click(screen.getByRole('button', { name: 'Dismiss' })) })
  expect(screen.getByLabelText('Snackbar result')).toHaveTextContent('dismissed')
  fireEvent.click(screen.getByRole('button', { name: 'Queue two' }))
  expect(screen.getAllByRole('status')[0]).toHaveTextContent('First queued message')
  await act(async () => { fireEvent.click(screen.getByRole('button', { name: 'Dismiss' })) })
  expect(screen.getAllByRole('status')[0]).toHaveTextContent('Second queued message')
  fireEvent.click(screen.getByRole('button', { name: 'Show custom snackbar' }))
  expect(screen.getByRole('button', { name: 'Open file' })).toBeVisible()
})
