import { fireEvent, render, screen, within } from '@testing-library/react'
import { expect, it, vi } from 'vitest'
import { Gallery } from './Gallery'

it('opens tabs, renders all row/layout combinations, and controls each preview independently', () => {
  window.location.hash = 'tabs'
  window.scrollTo = vi.fn()
  render(<Gallery />)
  expect(screen.getByRole('heading', { name: 'Tabs', level: 2 })).toBeVisible()
  const rowNames = ['Primary fixed', 'Secondary fixed', 'Primary scrollable', 'Secondary scrollable']
  const layouts = ['text', 'icon', 'stacked icon and text', 'leading icon']
  for (const row of rowNames) for (const layout of layouts) {
    const tabs = within(screen.getByRole('tablist', { name: `${row}, ${layout}` })).getAllByRole('tab')
    expect(tabs).toHaveLength(row.includes('scrollable') ? 6 : 3)
  }
  const primary = within(screen.getByRole('tablist', { name: 'Primary fixed, text' }))
  fireEvent.click(primary.getByRole('tab', { name: 'Podcasts' }))
  expect(primary.getByRole('tab', { name: 'Podcasts' })).toHaveAttribute('aria-selected', 'true')
  expect(within(screen.getByRole('tablist', { name: 'Secondary fixed, text' })).getByRole('tab', { name: 'Music' })).toHaveAttribute('aria-selected', 'true')
  const manual = within(screen.getByRole('tablist', { name: 'Manual activation' }))
  expect(manual.getByRole('tab', { name: 'Radio' })).toBeDisabled()
  const music = manual.getByRole('tab', { name: 'Music' })
  music.focus()
  fireEvent.keyDown(music, { key: 'ArrowRight' })
  expect(manual.getByRole('tab', { name: 'Podcasts' })).toHaveFocus()
  expect(music).toHaveAttribute('aria-selected', 'true')
  fireEvent.click(screen.getByRole('switch', { name: 'Right-to-left tabs' }))
  expect(screen.getByRole('tablist', { name: 'Primary fixed, text' }).closest('[dir]')).toHaveAttribute('dir', 'rtl')
})
