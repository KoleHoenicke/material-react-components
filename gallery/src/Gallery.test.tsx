import { fireEvent, render, screen } from '@testing-library/react'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { Gallery } from './Gallery'

describe('interactive gallery', () => {
  beforeEach(() => { window.location.hash = ''; window.scrollTo = vi.fn() })
  it('fills only the selected navigation icon as destinations change', () => {
    render(<Gallery />)
    const components = screen.getByRole('link', { name: 'Components' })
    const foundations = screen.getByRole('link', { name: 'Foundations' })
    const theme = screen.getByRole('link', { name: 'Theme' })
    const symbol = (link: HTMLElement) => link.querySelector('.gallery-symbol')

    expect(symbol(components)).toHaveStyle({ fontVariationSettings: "'FILL' 1" })
    expect(symbol(foundations)).toHaveStyle({ fontVariationSettings: "'FILL' 0" })
    expect(symbol(theme)).toHaveStyle({ fontVariationSettings: "'FILL' 0" })

    fireEvent.click(theme)
    expect(theme).toHaveAttribute('aria-current', 'page')
    expect(symbol(theme)).toHaveStyle({ fontVariationSettings: "'FILL' 1" })
    expect(symbol(components)).toHaveStyle({ fontVariationSettings: "'FILL' 0" })

    window.location.hash = 'motion'
    fireEvent(window, new HashChangeEvent('hashchange'))
    expect(foundations).toHaveAttribute('aria-current', 'page')
    expect(symbol(foundations)).toHaveStyle({ fontVariationSettings: "'FILL' 1" })
    expect(symbol(theme)).toHaveStyle({ fontVariationSettings: "'FILL' 0" })
    expect(symbol(components)).toHaveStyle({ fontVariationSettings: "'FILL' 0" })
  })

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
      'Chip · ChipSet · AssistChip · FilterChip · InputChip · SuggestionChip',
      'NavigationBar · NavigationBarItem',
      'ToggleFloatingActionButton',
      'WavyProgress',
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
    fireEvent.click(screen.getByRole('button', { name: 'Selection' }))
    fireEvent.click(screen.getByRole('button', { name: 'Increase Guests' }))
    expect(screen.getByRole('textbox', { name: 'Guests value' })).toHaveValue('4')

    fireEvent.click(screen.getByRole('button', { name: 'Buttons' }))
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

it('alphabetizes categories, groups buttons, and separates loading and ripple', () => {
  window.location.hash = 'fabs'
  render(<Gallery />)
  const categories = screen.getByRole('toolbar', { name: 'Component categories' })
  const labels = Array.from(categories.querySelectorAll('button')).map(button => button.textContent)
  expect(labels).toEqual(['App bars', 'Badges', 'Buttons', 'Cards', 'Chips', 'Dialogs', 'Dividers', 'Lists', 'Loading & progress', 'Menus', 'Navigation bars', 'Ripple', 'Search', 'Selection', 'Tabs', 'Text fields'])
  for (const name of ['Button', 'Button group', 'Floating action buttons', 'FAB menu', 'Icon buttons']) {
    expect(screen.getByRole('heading', { name, level: 3 })).toBeVisible()
  }
  expect(screen.queryByRole('heading', { name: 'Ripple', level: 3 })).not.toBeInTheDocument()
  fireEvent.click(screen.getByRole('button', { name: 'Loading & progress' }))
  expect(screen.getByRole('heading', { name: 'Loading indicator', level: 3 })).toBeVisible()
  expect(screen.getByRole('heading', { name: 'Progress indicators', level: 3 })).toBeVisible()
  expect(screen.queryByRole('heading', { name: 'Quantity stepper', level: 3 })).not.toBeInTheDocument()
  fireEvent.click(screen.getByRole('button', { name: 'Ripple' }))
  expect(screen.getByRole('button', { name: /Press anywhere/ })).toBeVisible()
})

it('shows motion under foundations and updates previews and the shared scheme', () => {
  window.location.hash = 'motion'
  const { container } = render(<Gallery />)
  expect(screen.getByRole('link', { name: 'Foundations' })).toHaveAttribute('aria-current', 'page')
  expect(screen.getByRole('toolbar', { name: 'Foundation categories' })).toBeVisible()
  expect(screen.queryByRole('button', { name: 'Toggle positions' })).not.toBeInTheDocument()
  expect(screen.queryByRole('button', { name: 'Toggle emphasis' })).not.toBeInTheDocument()
  fireEvent.click(screen.getByRole('switch', { name: 'Use expressive motion preview' }))
  expect(container.querySelector('.material-react-root')).toHaveAttribute('data-motion-scheme', 'standard')
  expect(screen.getByText('Slow · 750 ms')).toBeVisible()
  fireEvent.click(screen.getByRole('button', { name: 'Typography' }))
  expect(screen.getByRole('heading', { name: 'Typography', level: 2 })).toBeVisible()
  expect(screen.queryByRole('button', { name: 'Toggle positions' })).not.toBeInTheDocument()
})


it('opens text fields and exercises configured input and secure visibility', () => {
  window.location.hash = 'text-fields'
  render(<Gallery />)
  expect(screen.getByRole('heading', { name: 'Text fields', level: 2 })).toBeVisible()
  const input = screen.getByRole('textbox', { name: 'Label' })
  fireEvent.change(input, { target: { value: 'Hello' } })
  expect(input).toHaveValue('Hello')
  fireEvent.click(screen.getByRole('button', { name: 'Clear text' }))
  expect(input).toHaveValue('')
  fireEvent.click(screen.getByRole('switch', { name: 'Field error' }))
  expect(input).toHaveAttribute('aria-invalid', 'true')
  fireEvent.click(screen.getByRole('switch', { name: 'Show prefix and suffix' }))
  fireEvent.focus(input)
  expect(screen.getAllByText('USD').length).toBeGreaterThan(0)
  const password = screen.getByLabelText('Password')
  fireEvent.change(password, { target: { value: 'secret' } })
  fireEvent.click(screen.getByRole('button', { name: 'Show password' }))
  expect(password).toHaveAttribute('type', 'text')
  expect(password).toHaveValue('secret')
})
