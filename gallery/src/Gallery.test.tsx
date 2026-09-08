import { fireEvent, render, screen } from '@testing-library/react'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { Gallery } from './Gallery'

describe('interactive gallery', () => {
  beforeEach(() => { window.location.hash = ''; window.scrollTo = vi.fn() })
  it('renders the full public component surface', () => {
    const { container } = render(<Gallery />)

    const apiLabels = [
      'Button',
      'ButtonGroup',
      'FloatingActionButton · ExtendedFloatingActionButton',
      'FloatingActionButtonMenu · FloatingActionButtonMenuItem · ToggleFloatingActionButton',
      'Menu · MenuItem · MenuGroup · MenuSubmenu',
      'Card',
      'AlertDialog · BasicAlertDialog · FullScreenDialog',
      'Text · MaterialText',
      'Divider · HorizontalDivider · VerticalDivider',
      'Checkbox · CheckboxList · CheckboxListItem',
      'AssistChip · FilterChip · InputChip · SuggestionChip',
      'Ripple',
      'Switch',
      'Slider',
      'RichOptionList',
      'SegmentedActionList',
      'Badge · ListCount',
      'QuantityStepper',
      'LinearProgressIndicator · CircularProgressIndicator',
      'LoadingIndicator',
      'ListTrailingAction',
    ]

    for (const label of apiLabels) {
      expect(screen.getByText(label, { selector: 'code' })).toBeInTheDocument()
    }

    expect(container.querySelectorAll('.app-bar-demo > [data-material-divider]')).toHaveLength(8)
    expect(container.querySelector('.footer-divider')).toHaveAttribute(
      'data-material-divider',
      '',
    )

    fireEvent.click(screen.getByRole('button', { name: 'Dialogs' }))
    fireEvent.click(screen.getByRole('button', { name: 'Open alert dialog' }))
    expect(screen.getByRole('alertdialog', { name: 'Delete file?' })).toBeInTheDocument()
    fireEvent.click(screen.getByRole('button', { name: 'Cancel' }))

    fireEvent.click(screen.getByRole('button', { name: 'Menus' }))
    fireEvent.click(screen.getByRole('switch', { name: 'Open Material menu' }))
    expect(screen.getByRole('menu', { name: 'View options' })).toHaveAttribute(
      'data-open',
      'true',
    )
    fireEvent.click(screen.getByRole('menuitemcheckbox', { name: /Grid view/ }))
    expect(screen.getByRole('menuitemcheckbox', { name: /Grid view/ })).toHaveAttribute(
      'aria-checked',
      'false',
    )
  })

  it('updates the theme and live component values', () => {
    const { container } = render(<Gallery />)
    const root = container.querySelector('.material-react-root')

    expect(root).toHaveAttribute('data-color-scheme', 'light')
    expect(root).toHaveAttribute('data-motion-scheme', 'expressive')
    fireEvent.click(screen.getByRole('link', { name: 'Theme' }))
    fireEvent.click(screen.getByRole('switch', { name: 'Use dark theme' }))
    expect(root).toHaveAttribute('data-color-scheme', 'dark')
    fireEvent.click(screen.getByRole('switch', { name: 'Use expressive motion' }))
    expect(root).toHaveAttribute('data-motion-scheme', 'standard')

    fireEvent.click(screen.getByRole('link', { name: 'Components' }))
    fireEvent.click(screen.getByRole('button', { name: 'Progress & status' }))
    fireEvent.click(screen.getByRole('button', { name: 'Increase Guests' }))
    expect(screen.getByRole('textbox', { name: 'Guests value' })).toHaveValue('4')

    fireEvent.click(screen.getByRole('button', { name: 'FABs' }))
    fireEvent.click(screen.getByRole('switch', { name: 'Expand extended FAB' }))
    expect(screen.getByRole('button', { name: 'Compose' })).toHaveAttribute(
      'data-expanded',
      'false',
    )

    fireEvent.click(screen.getByRole('switch', { name: 'Expand FAB menu' }))
    expect(screen.getByRole('button', { name: 'Toggle create actions' })).toHaveAttribute(
      'aria-expanded',
      'false',
    )
  })
})

it('opens deep links and keeps only the selected family accessible', () => {
  window.location.hash = 'cards'
  render(<Gallery />)
  expect(screen.getByRole('heading', { name: 'Cards', level: 2 })).toBeVisible()
  expect(screen.queryByRole('heading', { name: 'Typography', level: 2 })).not.toBeInTheDocument()
  fireEvent.click(screen.getByRole('link', { name: 'Foundations' }))
  expect(screen.getByRole('heading', { name: 'Typography', level: 2 })).toBeVisible()
  expect(screen.getByRole('link', { name: 'Foundations' })).toHaveAttribute('aria-current', 'page')
  expect(screen.queryByRole('heading', { name: 'Cards', level: 2 })).not.toBeInTheDocument()
  window.location.hash = 'dialogs'
  fireEvent(window, new HashChangeEvent('hashchange'))
  expect(screen.getByRole('heading', { name: 'Dialogs', level: 2 })).toBeVisible()
})
