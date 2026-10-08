import { fireEvent, render, screen, waitFor } from '@testing-library/react'
import { useState } from 'react'
import { describe, expect, it, vi } from 'vitest'

import {
  MaterialFloatingActionButtonMenu,
  MaterialFloatingActionButtonMenuItem,
  MaterialToggleFloatingActionButton,
  type MaterialFabMenuColor,
  type MaterialFabMenuTriggerSize,
} from './MaterialFloatingActionButtonMenu'

const addIcon = <svg data-testid="add-icon" />
const closeIcon = <svg data-testid="close-icon" />

function menuItems() {
  return [
    <MaterialFloatingActionButtonMenuItem icon={<svg />} key="reply">Reply</MaterialFloatingActionButtonMenuItem>,
    <MaterialFloatingActionButtonMenuItem icon={<svg />} key="reply-all">Reply all</MaterialFloatingActionButtonMenuItem>,
    <MaterialFloatingActionButtonMenuItem icon={<svg />} key="forward">Forward</MaterialFloatingActionButtonMenuItem>,
  ]
}

function ControlledMenu({ closeOnItemClick = true }: { closeOnItemClick?: boolean }) {
  const [expanded, setExpanded] = useState(false)

  return (
    <MaterialFloatingActionButtonMenu
      closeIcon={closeIcon}
      closeOnItemClick={closeOnItemClick}
      expanded={expanded}
      icon={addIcon}
      onExpandedChange={setExpanded}
      toggleLabel="Toggle message actions"
    >
      {menuItems()}
    </MaterialFloatingActionButtonMenu>
  )
}

describe('MaterialToggleFloatingActionButton', () => {
  it('uses native button semantics and reports its controlled menu state', () => {
    const onCheckedChange = vi.fn()
    render(
      <MaterialToggleFloatingActionButton
        aria-label="Toggle actions"
        checked={false}
        checkedIcon={closeIcon}
        icon={addIcon}
        onCheckedChange={onCheckedChange}
      />,
    )

    const button = screen.getByRole('button', { name: 'Toggle actions' })
    expect(button).toHaveAttribute('aria-expanded', 'false')
    expect(button).toHaveAttribute('aria-haspopup', 'menu')
    expect(button.closest('[data-material-toggle-fab]')).toHaveAttribute('data-size', 'regular')

    fireEvent.click(button)
    expect(onCheckedChange).toHaveBeenCalledWith(true)
  })

  it.each<MaterialFabMenuTriggerSize>(['regular', 'medium', 'large'])(
    'exposes the %s launcher geometry',
    (size) => {
      const { container } = render(
        <MaterialToggleFloatingActionButton
          aria-label={`${size} actions`}
          checked={false}
          checkedIcon={closeIcon}
          icon={addIcon}
          onCheckedChange={() => undefined}
          size={size}
        />,
      )

      expect(container.querySelector('[data-material-toggle-fab]')).toHaveAttribute(
        'data-size',
        size,
      )
    },
  )

  it.each<MaterialFabMenuColor>(['primary', 'secondary', 'tertiary'])(
    'supports the %s menu color set',
    (color) => {
      const { container } = render(
        <MaterialToggleFloatingActionButton
          aria-label={`${color} actions`}
          checked
          checkedIcon={closeIcon}
          color={color}
          icon={addIcon}
          onCheckedChange={() => undefined}
        />,
      )

      expect(container.querySelector('[data-material-toggle-fab]')).toHaveAttribute(
        'data-color',
        color,
      )
    },
  )

  it('keeps the original launcher footprint while exposing the checked close state', () => {
    const { container } = render(
      <MaterialToggleFloatingActionButton
        aria-label="Toggle actions"
        checked
        checkedIcon={closeIcon}
        icon={addIcon}
        onCheckedChange={() => undefined}
        size="large"
      />,
    )

    const root = container.querySelector('[data-material-toggle-fab]')
    expect(root).toHaveAttribute('data-size', 'large')
    expect(root).toHaveAttribute('data-checked', 'true')
    expect(screen.getByRole('button', { name: 'Toggle actions' })).toHaveAttribute(
      'aria-expanded',
      'true',
    )
  })

  it('removes a hidden launcher from keyboard and accessibility navigation', () => {
    render(
      <MaterialToggleFloatingActionButton
        aria-label="Toggle actions"
        checked={false}
        checkedIcon={closeIcon}
        icon={addIcon}
        onCheckedChange={() => undefined}
        visible={false}
      />,
    )

    const button = screen.getByRole('button', { hidden: true })
    expect(button).toHaveAttribute('aria-hidden', 'true')
    expect(button).toHaveAttribute('tabindex', '-1')
  })
})

describe('MaterialFloatingActionButtonMenu', () => {
  it.each([2, 6])('renders the documented %s-item configuration', (itemCount) => {
    const { container } = render(
      <MaterialFloatingActionButtonMenu
        closeIcon={closeIcon}
        expanded
        icon={addIcon}
        onExpandedChange={() => undefined}
        toggleLabel="Toggle actions"
      >
        {Array.from({ length: itemCount }, (_, index) => (
          <MaterialFloatingActionButtonMenuItem icon={<svg />} key={index}>
            Action {index + 1}
          </MaterialFloatingActionButtonMenuItem>
        ))}
      </MaterialFloatingActionButtonMenu>,
    )

    expect(container.querySelector('[data-material-fab-menu]')).toHaveAttribute(
      'data-item-count',
      String(itemCount),
    )
    expect(screen.getAllByRole('menuitem')).toHaveLength(itemCount)
  })

  it('keeps collapsed items out of the keyboard and accessibility order', () => {
    render(
      <MaterialFloatingActionButtonMenu
        closeIcon={closeIcon}
        expanded={false}
        icon={addIcon}
        onExpandedChange={() => undefined}
        toggleLabel="Toggle message actions"
      >
        {menuItems()}
      </MaterialFloatingActionButtonMenu>,
    )

    const menu = screen.getByRole('menu', { hidden: true })
    expect(menu).toHaveAttribute('aria-hidden', 'true')
    expect(menu).toHaveAttribute('inert')
    for (const item of screen.getAllByRole('menuitem', { hidden: true })) {
      expect(item).toHaveAttribute('tabindex', '-1')
    }
  })

  it('labels an expanded menu and renders the documented item order', () => {
    render(
      <MaterialFloatingActionButtonMenu
        closeIcon={closeIcon}
        expanded
        icon={addIcon}
        menuLabel="Message actions"
        onExpandedChange={() => undefined}
        toggleLabel="Toggle message actions"
      >
        {menuItems()}
      </MaterialFloatingActionButtonMenu>,
    )

    expect(screen.getByRole('menu', { name: 'Message actions' })).not.toHaveAttribute(
      'aria-hidden',
    )
    expect(screen.getAllByRole('menuitem').map((item) => item.textContent)).toEqual([
      'Reply',
      'Reply all',
      'Forward',
    ])
  })

  it('opens and closes through the controlled toggle', () => {
    render(<ControlledMenu />)
    const toggle = screen.getByRole('button', { name: 'Toggle message actions' })

    fireEvent.click(toggle)
    expect(toggle).toHaveAttribute('aria-expanded', 'true')

    fireEvent.click(toggle)
    expect(toggle).toHaveAttribute('aria-expanded', 'false')
  })

  it('closes after an item is activated by default', async () => {
    render(<ControlledMenu />)
    const toggle = screen.getByRole('button', { name: 'Toggle message actions' })
    fireEvent.click(toggle)

    fireEvent.click(await screen.findByRole('menuitem', { name: 'Reply all' }))
    expect(toggle).toHaveAttribute('aria-expanded', 'false')
    expect(toggle).toHaveFocus()
  })

  it('can keep the menu open after item activation', async () => {
    render(<ControlledMenu closeOnItemClick={false} />)
    const toggle = screen.getByRole('button', { name: 'Toggle message actions' })
    fireEvent.click(toggle)

    fireEvent.click(await screen.findByRole('menuitem', { name: 'Reply' }))
    expect(toggle).toHaveAttribute('aria-expanded', 'true')
  })

  it('moves from the toggle to the top item and back with arrow keys', () => {
    render(
      <MaterialFloatingActionButtonMenu
        closeIcon={closeIcon}
        expanded
        icon={addIcon}
        onExpandedChange={() => undefined}
        toggleLabel="Toggle message actions"
      >
        {menuItems()}
      </MaterialFloatingActionButtonMenu>,
    )
    const toggle = screen.getByRole('button', { name: 'Toggle message actions' })
    toggle.focus()

    fireEvent.keyDown(toggle, { key: 'ArrowDown' })
    const firstItem = screen.getByRole('menuitem', { name: 'Reply' })
    expect(firstItem).toHaveFocus()

    fireEvent.keyDown(firstItem, { key: 'ArrowUp' })
    expect(toggle).toHaveFocus()
  })

  it('supports arrow, Home, End, and Escape keyboard navigation', async () => {
    render(<ControlledMenu />)
    const toggle = screen.getByRole('button', { name: 'Toggle message actions' })
    fireEvent.click(toggle)
    await waitFor(() => expect(screen.getAllByRole('menuitem')).toHaveLength(3))
    const items = screen.getAllByRole('menuitem')

    items[0].focus()
    fireEvent.keyDown(items[0], { key: 'End' })
    expect(items[2]).toHaveFocus()

    fireEvent.keyDown(items[2], { key: 'ArrowUp' })
    expect(items[1]).toHaveFocus()

    fireEvent.keyDown(items[1], { key: 'Home' })
    expect(items[0]).toHaveFocus()

    fireEvent.keyDown(items[0], { key: 'Escape' })
    expect(toggle).toHaveAttribute('aria-expanded', 'false')
    expect(toggle).toHaveFocus()
  })

  it('dismisses on an outside pointer interaction by default', () => {
    render(<ControlledMenu />)
    const toggle = screen.getByRole('button', { name: 'Toggle message actions' })
    fireEvent.click(toggle)

    fireEvent.pointerDown(document.body)
    expect(toggle).toHaveAttribute('aria-expanded', 'false')
  })

  it('exposes alignment, count, color, size, and token overrides on the root', () => {
    const { container } = render(
      <MaterialFloatingActionButtonMenu
        alignment="start"
        closeIcon={closeIcon}
        color="tertiary"
        expanded
        icon={addIcon}
        onExpandedChange={() => undefined}
        size="medium"
        style={{ '--md-fab-menu-item-container-height': '64px' }}
        toggleLabel="Toggle message actions"
      >
        {menuItems()}
      </MaterialFloatingActionButtonMenu>,
    )

    const root = container.querySelector('[data-material-fab-menu]')
    expect(root).toHaveAttribute('data-alignment', 'start')
    expect(root).toHaveAttribute('data-item-count', '3')
    expect(root).toHaveAttribute('data-color', 'tertiary')
    expect(root).toHaveAttribute('data-size', 'medium')
    expect(root).toHaveStyle('--md-fab-menu-item-container-height: 64px')
  })
})
