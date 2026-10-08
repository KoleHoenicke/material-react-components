import { render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import { MaterialButton } from './MaterialButton'

describe('MaterialButton', () => {
  it('uses the small filled button configuration by default', () => {
    render(<MaterialButton>Save</MaterialButton>)

    const button = screen.getByRole('button', { name: 'Save' })
    expect(button).toHaveAttribute('data-size', 'small')
    expect(button).toHaveAttribute('data-shape', 'round')
    expect(button).toHaveAttribute('data-variant', 'filled')
    expect(button).toHaveAttribute('data-material-typography', 'labelLarge')
    expect(button).not.toHaveAttribute('aria-pressed')
    expect(button).toHaveAttribute('type', 'button')
  })

  it('exposes toggle selection through native button semantics', () => {
    render(
      <MaterialButton selected toggle variant="tonal">
        Favorite
      </MaterialButton>,
    )

    const button = screen.getByRole('button', { name: 'Favorite' })
    expect(button).toHaveAttribute('aria-pressed', 'true')
    expect(button).toHaveAttribute('data-selected', 'true')
    expect(button).toHaveClass('material-button--selected', 'material-button--toggle')
    expect(button).toHaveAttribute('data-material-typography', 'labelLarge')
  })

  it('uses the size role without emphasis for a secondary action', () => {
    render(<MaterialButton size="medium" variant="tonal">Review</MaterialButton>)

    expect(screen.getByRole('button', { name: 'Review' })).toHaveAttribute(
      'data-material-typography',
      'titleMedium',
    )
  })

  it.each([
    ['extra-small', 'labelLarge'], ['small', 'labelLarge'], ['medium', 'titleMedium'],
    ['large', 'headlineSmall'], ['extra-large', 'headlineLarge'],
  ] as const)('retains the AndroidX %s text role across variant and selection', (size, role) => {
    for (const variant of ['elevated', 'filled', 'outlined', 'text', 'tonal'] as const) {
      const { rerender, unmount } = render(<MaterialButton size={size} variant={variant} toggle>Action</MaterialButton>)
      expect(screen.getByRole('button')).toHaveAttribute('data-material-typography', role)
      rerender(<MaterialButton size={size} variant={variant} toggle selected>Action</MaterialButton>)
      expect(screen.getByRole('button')).toHaveAttribute('data-material-typography', role)
      expect(screen.getByRole('button')).toHaveAttribute('aria-pressed', 'true')
      unmount()
    }
  })

  it('uses radio semantics when composed into a single-select group', () => {
    render(
      <MaterialButton role="radio" selected toggle>
        Board
      </MaterialButton>,
    )

    const button = screen.getByRole('radio', { name: 'Board' })
    expect(button).toHaveAttribute('aria-checked', 'true')
    expect(button).not.toHaveAttribute('aria-pressed')
  })
})
