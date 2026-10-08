import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { fireEvent, render, screen } from '@testing-library/react'
import { useState } from 'react'
import { describe, expect, it, vi } from 'vitest'

import {
  MaterialCheckableMenuItem,
  MaterialMenu,
  MaterialMenuDivider,
  MaterialMenuGroup,
  MaterialMenuItem,
  MaterialMenuSubmenu,
  MaterialSelectableMenuItem,
  type MaterialMenuColor,
  type MaterialMenuVariant,
} from './MaterialMenu'

const checkIcon = <svg data-testid="check-icon" />
const itemIcon = <svg data-testid="item-icon" />

function ControlledMenu({
  color = 'standard',
  variant = 'expressive',
}: {
  color?: MaterialMenuColor
  variant?: MaterialMenuVariant
}) {
  const [open, setOpen] = useState(false)
  const [grid, setGrid] = useState(false)
  const [sort, setSort] = useState('name')

  return (
    <>
      <MaterialMenu
        anchor={<button type="button">View options</button>}
        ariaLabel="View options"
        color={color}
        onOpenChange={setOpen}
        open={open}
        variant={variant}
      >
        <MaterialMenuItem leadingIcon={itemIcon}>Open</MaterialMenuItem>
        <MaterialCheckableMenuItem
          checked={grid}
          leadingIcon={itemIcon}
          onCheckedChange={setGrid}
          selectedLeadingIcon={checkIcon}
        >
          Grid view
        </MaterialCheckableMenuItem>
        <MaterialSelectableMenuItem
          leadingIcon={itemIcon}
          onClick={() => setSort('date')}
          selected={sort === 'date'}
          selectedLeadingIcon={checkIcon}
        >
          Date created
        </MaterialSelectableMenuItem>
        <MaterialMenuItem disabled>Unavailable</MaterialMenuItem>
      </MaterialMenu>
      <button type="button">After menu</button>
    </>
  )
}

describe('MaterialMenu', () => {
  it('connects the trigger to a controlled popup and focuses the first item', () => {
    render(<ControlledMenu />)
    const trigger = screen.getByRole('button', { name: 'View options' })

    expect(trigger).toHaveAttribute('aria-haspopup', 'menu')
    expect(trigger).toHaveAttribute('aria-expanded', 'false')
    fireEvent.click(trigger)

    expect(trigger).toHaveAttribute('aria-expanded', 'true')
    expect(screen.getByRole('menu', { name: 'View options' })).toHaveAttribute(
      'data-variant',
      'expressive',
    )
    expect(screen.getByRole('menuitem', { name: 'Open' })).toHaveFocus()
  })

  it('opens on arrow keys and honors the requested edge focus', () => {
    render(<ControlledMenu />)
    const trigger = screen.getByRole('button', { name: 'View options' })

    fireEvent.keyDown(trigger, { key: 'ArrowUp' })
    const unavailable = screen.getByRole('menuitem', { name: 'Unavailable' })
    expect(unavailable).toHaveFocus()

    fireEvent.keyDown(unavailable, { key: 'Escape' })
    fireEvent.click(trigger)
    expect(screen.getByRole('menuitem', { name: 'Open' })).toHaveFocus()
  })

  it('uses wrapping arrows, Home, End, and printable-key typeahead', () => {
    render(<ControlledMenu />)
    fireEvent.click(screen.getByRole('button', { name: 'View options' }))
    const open = screen.getByRole('menuitem', { name: 'Open' })
    const unavailable = screen.getByRole('menuitem', { name: 'Unavailable' })

    fireEvent.keyDown(open, { key: 'ArrowUp' })
    expect(unavailable).toHaveFocus()
    fireEvent.keyDown(unavailable, { key: 'Home' })
    expect(open).toHaveFocus()
    fireEvent.keyDown(open, { key: 'End' })
    expect(unavailable).toHaveFocus()
    fireEvent.keyDown(unavailable, { key: 'g' })
    expect(screen.getByRole('menuitemcheckbox', { name: 'Grid view' })).toHaveFocus()
  })

  it('keeps multi-select open, closes single-select, and exposes checked semantics', () => {
    render(<ControlledMenu />)
    const trigger = screen.getByRole('button', { name: 'View options' })
    fireEvent.click(trigger)

    const grid = screen.getByRole('menuitemcheckbox', { name: 'Grid view' })
    expect(grid).toHaveAttribute('aria-checked', 'false')
    fireEvent.click(grid)
    expect(grid).toHaveAttribute('aria-checked', 'true')
    expect(trigger).toHaveAttribute('aria-expanded', 'true')

    fireEvent.click(screen.getByRole('menuitemradio', { name: 'Date created' }))
    expect(trigger).toHaveAttribute('aria-expanded', 'false')
    expect(trigger).toHaveFocus()
  })

  it('keeps disabled items focusable but blocks activation', () => {
    const onClick = vi.fn()
    render(
      <MaterialMenuItem disabled onClick={onClick}>
        Share
      </MaterialMenuItem>,
    )
    const item = screen.getByRole('menuitem', { name: 'Share' })

    item.focus()
    expect(item).toHaveFocus()
    expect(item).toHaveAttribute('aria-disabled', 'true')
    expect(item).not.toBeDisabled()
    fireEvent.click(item)
    fireEvent.keyDown(item, { key: 'Enter' })
    expect(onClick).not.toHaveBeenCalled()
  })

  it('supports action links without changing menu semantics', () => {
    render(
      <MaterialMenuItem href="/details" target="_blank" rel="noreferrer">
        Open details
      </MaterialMenuItem>,
    )
    expect(screen.getByRole('menuitem', { name: 'Open details' })).toHaveAttribute(
      'href',
      '/details',
    )
  })

  it.each([
    ['expressive', 'standard'],
    ['expressive', 'vibrant'],
    ['baseline', 'standard'],
  ] as const)('supports the %s %s presentation', (variant, color) => {
    render(<ControlledMenu variant={variant} color={color} />)
    fireEvent.click(screen.getByRole('button', { name: 'View options' }))
    const menu = screen.getByRole('menu', { name: 'View options' })
    expect(menu).toHaveAttribute('data-variant', variant)
    expect(menu).toHaveAttribute('data-color', color)
  })

  it('assigns segmented shapes within groups and keeps dividers out of focus order', () => {
    render(
      <MaterialMenu
        anchor={<button type="button">Edit</button>}
        ariaLabel="Edit"
        onOpenChange={() => undefined}
        open
      >
        <MaterialMenuGroup label="Clipboard">
          <MaterialMenuItem>Cut</MaterialMenuItem>
          <MaterialMenuDivider />
          <MaterialMenuItem>Copy</MaterialMenuItem>
          <MaterialMenuItem>Paste</MaterialMenuItem>
        </MaterialMenuGroup>
        <MaterialMenuGroup label="History">
          <MaterialMenuItem>Undo</MaterialMenuItem>
        </MaterialMenuGroup>
      </MaterialMenu>,
    )

    expect(screen.getByRole('menuitem', { name: 'Cut' })).toHaveAttribute(
      'data-shape-position',
      'first',
    )
    expect(screen.getByRole('menuitem', { name: 'Paste' })).toHaveAttribute(
      'data-shape-position',
      'last',
    )
    expect(screen.getByRole('menuitem', { name: 'Undo' })).toHaveAttribute(
      'data-shape-position',
      'single',
    )
    expect(screen.getByRole('separator')).toHaveAttribute('tabindex', '-1')
  })

  it('uses configurable viewport margins when positioning the popup', () => {
    render(
      <MaterialMenu
        anchor={<button type="button">Open positioned menu</button>}
        ariaLabel="Positioned menu"
        onOpenChange={() => undefined}
        open
        surfaceStyle={{
          '--md-menu-horizontal-margin': '24px',
          '--md-menu-vertical-margin': '64px',
        }}
      >
        <MaterialMenuItem>Action</MaterialMenuItem>
      </MaterialMenu>,
    )

    expect(screen.getByRole('menu', { name: 'Positioned menu' })).toHaveStyle({
      left: '24px',
      top: '64px',
    })
  })

  it('opens a side submenu and closes the complete tree after a child selection', () => {
    function SubmenuExample() {
      const [open, setOpen] = useState(true)
      return (
        <MaterialMenu
          anchor={<button type="button">Format</button>}
          ariaLabel="Format"
          onOpenChange={setOpen}
          open={open}
        >
          <MaterialMenuSubmenu itemChildren="Line spacing" submenuLabel="Line spacing">
            <MaterialMenuItem>Single</MaterialMenuItem>
            <MaterialMenuItem>Double</MaterialMenuItem>
          </MaterialMenuSubmenu>
        </MaterialMenu>
      )
    }

    render(<SubmenuExample />)
    const submenuItem = screen.getByRole('menuitem', { name: 'Line spacing' })
    fireEvent.click(submenuItem)
    expect(submenuItem).toHaveAttribute('aria-expanded', 'true')
    expect(screen.getByRole('menu', { name: 'Line spacing' })).toHaveAttribute(
      'data-placement',
      'end',
    )

    fireEvent.click(screen.getByRole('menuitem', { name: 'Double' }))
    expect(screen.getByRole('button', { name: 'Format' })).toHaveAttribute(
      'aria-expanded',
      'false',
    )
  })

  it('dismisses on Escape and outside pointer input with the expected focus policy', () => {
    render(<ControlledMenu />)
    const trigger = screen.getByRole('button', { name: 'View options' })
    const after = screen.getByRole('button', { name: 'After menu' })
    fireEvent.click(trigger)
    fireEvent.keyDown(screen.getByRole('menuitem', { name: 'Open' }), { key: 'Escape' })
    expect(trigger).toHaveFocus()

    fireEvent.click(trigger)
    after.focus()
    fireEvent.pointerDown(after)
    expect(after).toHaveFocus()
    expect(trigger).toHaveAttribute('aria-expanded', 'false')
  })

  it('keeps source-derived geometry, color, motion, density, and forced-color rules', () => {
    const css = readFileSync(
      resolve(process.cwd(), 'src/components/MaterialMenu.css'),
      'utf8',
    )

    expect(css).toContain('--md-menu-container-min-width: 112px')
    expect(css).toContain('--md-menu-container-max-width: 280px')
    expect(css).toContain('--md-menu-item-height: 48px')
    expect(css).toContain('--md-menu-item-leading-icon-size: 20px')
    expect(css).toContain("[data-density='-3']")
    expect(css).toContain('transform: scale(0.8)')
    expect(css).toContain('var(--m3-motion-transition-fast-spatial)')
    expect(css).toContain("[data-color='vibrant']")
    expect(css).toContain('@media (forced-colors: active)')
  })

  it('stacks every submenu above its ancestors and returns focus one level at a time', () => {
    render(
      <MaterialMenu anchor={<button>Nested actions</button>} ariaLabel="Root actions"
        onOpenChange={() => undefined} open>
        <MaterialMenuSubmenu itemChildren="More" submenuLabel="More actions">
          <MaterialMenuSubmenu itemChildren="Advanced" submenuLabel="Advanced actions">
            <MaterialMenuItem>Leaf action</MaterialMenuItem>
          </MaterialMenuSubmenu>
        </MaterialMenuSubmenu>
      </MaterialMenu>,
    )
    fireEvent.click(screen.getByRole('menuitem', { name: 'More' }))
    fireEvent.click(screen.getByRole('menuitem', { name: 'Advanced' }))
    const menus = ['Root actions', 'More actions', 'Advanced actions'].map(name =>
      screen.getByRole('menu', { name }))
    menus.forEach((menu, depth) => {
      expect(menu).toHaveAttribute('data-menu-depth', String(depth))
      expect(menu.style.zIndex).toBe(`calc(var(--md-menu-z-index, 1000) + ${depth})`)
    })
    fireEvent.keyDown(screen.getByRole('menuitem', { name: 'Leaf action' }), { key: 'ArrowLeft' })
    expect(screen.queryByRole('menu', { name: 'Advanced actions' })).not.toBeInTheDocument()
    expect(screen.getByRole('menuitem', { name: 'Advanced' })).toHaveFocus()
    expect(screen.getByRole('menu', { name: 'More actions' })).toBeInTheDocument()
  })

  it('marks supporting-text rows for the native outer inset without spacing plain rows', () => {
    render(<>
      <MaterialMenuItem supportingText="Details">Two lines</MaterialMenuItem>
      <MaterialMenuItem>One line</MaterialMenuItem>
    </>)
    expect(screen.getByRole('menuitem', { name: 'Two lines Details' }))
      .toHaveAttribute('data-supporting-text', 'true')
    expect(screen.getByRole('menuitem', { name: 'One line' }))
      .not.toHaveAttribute('data-supporting-text')
    const styles = readFileSync(resolve(process.cwd(), 'src/components/MaterialMenu.css'), 'utf8')
    expect(styles).toMatch(/data-variant='expressive'\]\[data-supporting-text='true'\]\s*\{\s*margin-block: 2px;/)
  })
})
