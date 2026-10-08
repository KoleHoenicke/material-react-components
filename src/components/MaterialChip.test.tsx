import { fireEvent, render, screen } from '@testing-library/react'
import { createRef } from 'react'
import { readFileSync } from 'node:fs'
import { describe, expect, it, vi } from 'vitest'

import {
  MaterialAssistChip,
  MaterialChip,
  MaterialChipSet,
  MaterialFilterChip,
  MaterialInputChip,
  MaterialSuggestionChip,
  type MaterialChipElement,
} from './MaterialChip'

describe('MaterialChip', () => {
  it('renders assist and suggestion chips as native actions', () => {
    render(
      <>
        <MaterialAssistChip leadingIcon={<span>+</span>}>Add event</MaterialAssistChip>
        <MaterialSuggestionChip elevated>Reply</MaterialSuggestionChip>
      </>,
    )

    const assist = screen.getByRole('button', { name: 'Add event' })
    const suggestion = screen.getByRole('button', { name: 'Reply' })
    expect(assist.closest('[data-material-chip]')).toHaveAttribute('data-kind', 'assist')
    expect(assist.closest('[data-material-chip]')).toHaveAttribute('data-has-leading', 'true')
    expect(suggestion.closest('[data-material-chip]')).toHaveAttribute('data-kind', 'suggestion')
    expect(suggestion.closest('[data-material-chip]')).toHaveAttribute('data-elevated', 'true')
    expect(assist).not.toHaveAttribute('aria-pressed')
  })

  it('keeps filter selection controlled and reports the next value', () => {
    const onSelectedChange = vi.fn()
    const { rerender } = render(
      <MaterialFilterChip selected={false} onSelectedChange={onSelectedChange}>
        Photos
      </MaterialFilterChip>,
    )

    const filter = screen.getByRole('button', { name: 'Photos' })
    fireEvent.click(filter)
    expect(onSelectedChange).toHaveBeenCalledWith(true)
    expect(filter).toHaveAttribute('aria-pressed', 'false')

    rerender(
      <MaterialFilterChip selected onSelectedChange={onSelectedChange}>
        Photos
      </MaterialFilterChip>,
    )
    expect(filter).toHaveAttribute('aria-pressed', 'true')
    expect(filter.closest('[data-material-chip]')).toHaveAttribute('data-selected', 'true')
    expect(filter.querySelector('.material-chip__leading-icon-selected svg')).toBeInTheDocument()
  })

  it('does not report a selection change when the click is canceled', () => {
    const onSelectedChange = vi.fn()
    render(
      <MaterialFilterChip
        onClick={(event) => event.preventDefault()}
        onSelectedChange={onSelectedChange}
      >
        Videos
      </MaterialFilterChip>,
    )

    fireEvent.click(screen.getByRole('button', { name: 'Videos' }))
    expect(onSelectedChange).not.toHaveBeenCalled()
  })

  it('uses an input avatar instead of its leading icon', () => {
    render(
      <MaterialInputChip
        avatar={<img alt="" src="avatar.png" />}
        leadingIcon={<span data-testid="ignored-icon">person</span>}
      >
        Avery
      </MaterialInputChip>,
    )

    const input = screen.getByRole('button', { name: 'Avery' })
    expect(input.querySelector('.material-chip__avatar img')).toBeInTheDocument()
    expect(screen.queryByTestId('ignored-icon')).not.toBeInTheDocument()
    expect(input.closest('[data-material-chip]')).toHaveAttribute('data-avatar', 'true')
  })

  it('gives a removable chip a separate labeled 48px action', () => {
    const onClick = vi.fn()
    const onRemove = vi.fn()
    render(
      <MaterialInputChip onClick={onClick} onRemove={onRemove}>
        Avery
      </MaterialInputChip>,
    )

    const remove = screen.getByRole('button', { name: 'Remove Avery' })
    fireEvent.click(remove)
    expect(onRemove).toHaveBeenCalledOnce()
    expect(onClick).not.toHaveBeenCalled()
    expect(remove.querySelector('.material-chip__remove-touch-target')).toBeInTheDocument()
  })

  it('builds the remove action name from a composed visible label', () => {
    render(
      <MaterialInputChip onRemove={() => undefined}>
        <span>Avery Chen</span>
      </MaterialInputChip>,
    )

    expect(screen.getByRole('button', { name: 'Remove Avery Chen' })).toBeInTheDocument()
  })

  it('supports remove-only input chips without a primary action', () => {
    render(
      <MaterialInputChip removeOnly onRemove={() => undefined}>
        Old address
      </MaterialInputChip>,
    )

    expect(screen.getAllByRole('button')).toHaveLength(1)
    expect(screen.getByRole('button', { name: 'Remove Old address' })).toHaveAttribute('tabindex', '0')
  })

  it('keeps soft-disabled chips discoverable but blocks activation', () => {
    const onClick = vi.fn()
    render(
      <MaterialChip softDisabled onClick={onClick}>
        Copy
      </MaterialChip>,
    )

    const chip = screen.getByRole('button', { name: 'Copy' })
    fireEvent.click(chip)
    expect(chip).not.toBeDisabled()
    expect(chip).toHaveAttribute('aria-disabled', 'true')
    expect(onClick).not.toHaveBeenCalled()
  })

  it('supports disabled links without leaving them in tab order', () => {
    render(
      <MaterialInputChip href="/person/avery" disabled>
        Avery
      </MaterialInputChip>,
    )

    const chip = screen.getByText('Avery').closest('a')
    expect(chip).not.toHaveAttribute('href')
    expect(chip).toHaveAttribute('aria-disabled', 'true')
    expect(chip).toHaveAttribute('tabindex', '-1')
  })

  it('forwards drag state changes and the primary action ref', () => {
    const onDraggedChange = vi.fn()
    const ref = createRef<MaterialChipElement>()
    render(
      <MaterialChip ref={ref} draggable dragged onDraggedChange={onDraggedChange}>
        Move
      </MaterialChip>,
    )

    const chip = screen.getByRole('button', { name: 'Move' })
    fireEvent.dragStart(chip)
    fireEvent.dragEnd(chip)
    expect(onDraggedChange).toHaveBeenNthCalledWith(1, true)
    expect(onDraggedChange).toHaveBeenNthCalledWith(2, false)
    expect(chip.closest('[data-material-chip]')).toHaveAttribute('data-dragged', 'true')
    expect(ref.current).toBe(chip)
  })

  it('exposes expressive shape state and public token overrides', () => {
    render(
      <MaterialFilterChip
        selected
        shapeMode="expressive"
        style={{ '--md-chip-selected-container-shape': '20px' }}
      >
        Expressive
      </MaterialFilterChip>,
    )

    const root = screen.getByRole('button', { name: 'Expressive' }).closest('[data-material-chip]')
    expect(root).toHaveAttribute('data-shape-mode', 'expressive')
    expect(root).toHaveStyle({ '--md-chip-selected-container-shape': '20px' })
  })

  it('bounds the default selected pill to the visual height while retaining shape overrides', () => {
    const stylesheet = document.createElement('style')
    stylesheet.textContent = readFileSync('src/components/MaterialChip.css', 'utf8')
    document.head.append(stylesheet)
    try {
      const { rerender } = render(<MaterialFilterChip selected shapeMode="expressive">Filter</MaterialFilterChip>)
      const root = screen.getByRole('button', { name: 'Filter' }).closest('[data-material-chip]')!
      const selectedShape = () => getComputedStyle(root).getPropertyValue('--md-chip-selected-container-shape').trim()
      expect(selectedShape()).toBe('min(var(--md-sys-shape-corner-full, 9999px), calc(var(--md-chip-container-height) / 2))')
      rerender(<MaterialFilterChip selected shapeMode="expressive" style={{ '--md-chip-selected-container-shape': '10px' }}>Filter</MaterialFilterChip>)
      expect(selectedShape()).toBe('10px')
      rerender(<MaterialFilterChip selected shapeMode="standard">Filter</MaterialFilterChip>)
      expect(selectedShape()).toBe('var(--md-chip-container-shape)')
    } finally {
      stylesheet.remove()
    }
  })
})

describe('MaterialChipSet', () => {
  it('uses toolbar semantics and one initial tab stop', () => {
    render(
      <MaterialChipSet aria-label="Filters">
        <MaterialFilterChip>Docs</MaterialFilterChip>
        <MaterialFilterChip disabled>Slides</MaterialFilterChip>
        <MaterialFilterChip>Sheets</MaterialFilterChip>
      </MaterialChipSet>,
    )

    expect(screen.getByRole('toolbar', { name: 'Filters' })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Docs' })).toHaveAttribute('tabindex', '0')
    expect(screen.getByRole('button', { name: 'Sheets' })).toHaveAttribute('tabindex', '-1')
  })

  it('wraps arrow focus, skips disabled chips, and supports Home and End', () => {
    render(
      <MaterialChipSet aria-label="Filters">
        <MaterialFilterChip>Docs</MaterialFilterChip>
        <MaterialFilterChip disabled>Slides</MaterialFilterChip>
        <MaterialFilterChip>Sheets</MaterialFilterChip>
      </MaterialChipSet>,
    )

    const docs = screen.getByRole('button', { name: 'Docs' })
    const sheets = screen.getByRole('button', { name: 'Sheets' })
    docs.focus()
    fireEvent.keyDown(docs, { key: 'ArrowRight' })
    expect(sheets).toHaveFocus()
    fireEvent.keyDown(sheets, { key: 'ArrowRight' })
    expect(docs).toHaveFocus()
    fireEvent.keyDown(docs, { key: 'End' })
    expect(sheets).toHaveFocus()
    fireEvent.keyDown(sheets, { key: 'Home' })
    expect(docs).toHaveFocus()
  })

  it('moves between a chip primary action and its remove action', () => {
    render(
      <MaterialChipSet aria-label="People">
        <MaterialInputChip onRemove={() => undefined}>Avery</MaterialInputChip>
        <MaterialInputChip onRemove={() => undefined}>Sam</MaterialInputChip>
      </MaterialChipSet>,
    )

    const avery = screen.getByRole('button', { name: 'Avery' })
    const removeAvery = screen.getByRole('button', { name: 'Remove Avery' })
    const sam = screen.getByRole('button', { name: 'Sam' })
    avery.focus()
    fireEvent.keyDown(avery, { key: 'ArrowRight' })
    expect(removeAvery).toHaveFocus()
    fireEvent.keyDown(removeAvery, { key: 'ArrowRight' })
    expect(sam).toHaveFocus()
  })

  it('reverses horizontal navigation in RTL layouts', () => {
    render(
      <MaterialChipSet aria-label="RTL filters" dir="rtl">
        <MaterialFilterChip>First</MaterialFilterChip>
        <MaterialFilterChip>Second</MaterialFilterChip>
      </MaterialChipSet>,
    )

    const first = screen.getByRole('button', { name: 'First' })
    const second = screen.getByRole('button', { name: 'Second' })
    first.focus()
    fireEvent.keyDown(first, { key: 'ArrowLeft' })
    expect(second).toHaveFocus()
    fireEvent.keyDown(second, { key: 'ArrowRight' })
    expect(first).toHaveFocus()
  })
})
