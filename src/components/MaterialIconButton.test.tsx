import { fireEvent, render, screen } from '@testing-library/react'
import { createRef, useState } from 'react'
import { describe, expect, it, vi } from 'vitest'
import {
  MaterialIconButton,
  MaterialIconToggleButton,
  MaterialFilledIconButton,
  MaterialFilledTonalIconButton,
  MaterialOutlinedIconButton,
  MaterialFilledIconToggleButton,
  MaterialFilledTonalIconToggleButton,
  MaterialOutlinedIconToggleButton,
  type MaterialIconButtonSize,
  type MaterialIconButtonWidth,
} from './MaterialIconButton'
import * as library from '../index'

describe('MaterialIconButton', () => {
  it('keeps a native named button, decorative icon, ref, tooltip, and form attributes', () => {
    const ref = createRef<HTMLButtonElement>()
    render(
      <MaterialIconButton ref={ref} aria-label="Favorite" name="action" value="save" form="editor">
        <svg>
          <title>Star</title>
        </svg>
      </MaterialIconButton>,
    )
    const button = screen.getByRole('button', { name: 'Favorite' })
    expect(ref.current).toBe(button)
    expect(button).toHaveAttribute('type', 'button')
    expect(button).toHaveAttribute('title', 'Favorite')
    expect(button).toHaveAttribute('form', 'editor')
    expect(button).not.toHaveAttribute('aria-pressed')
    expect(button.querySelector('.material-icon-button__icon')).toHaveAttribute(
      'aria-hidden',
      'true',
    )
  })

  // Independently transcribed AndroidX tokens: height, icon, narrow/default/wide, outline.
  const sizes: [MaterialIconButtonSize, number, number, number[], number][] = [
    ['extra-small', 32, 20, [28, 32, 40], 1],
    ['small', 40, 24, [32, 40, 52], 1],
    ['medium', 56, 24, [48, 56, 72], 1],
    ['large', 96, 32, [64, 96, 128], 2],
    ['extra-large', 136, 40, [104, 136, 184], 3],
  ]
  const widths: MaterialIconButtonWidth[] = ['narrow', 'uniform', 'wide']
  it.each(sizes)(
    'ports %s geometry without confusing visual size and target size',
    (size, height, icon, values, outline) => {
      const { rerender } = render(<MaterialIconButton aria-label="Action">+</MaterialIconButton>)
      widths.forEach((width, index) => {
        rerender(
          <MaterialIconButton aria-label="Action" size={size} width={width}>
            +
          </MaterialIconButton>,
        )
        expect(screen.getByRole('button')).toHaveStyle({
          '--md-icon-button-container-height': `${height}px`,
          '--md-icon-button-container-width': `${values[index]}px`,
          '--md-icon-button-icon-size': `${icon}px`,
          '--md-icon-button-outline-width': `${outline}px`,
        })
      })
    },
  )
  it('keeps toggle state controlled and changes the supplied icon only after a parent update', () => {
    const onCheckedChange = vi.fn()
    const { rerender } = render(
      <MaterialIconToggleButton
        aria-label="Favorite"
        checked={false}
        onCheckedChange={onCheckedChange}
        selectedIcon="filled"
      >
        outline
      </MaterialIconToggleButton>,
    )
    fireEvent.click(screen.getByRole('button'))
    expect(onCheckedChange).toHaveBeenCalledWith(true, expect.anything())
    expect(screen.getByRole('button')).toHaveAttribute('aria-pressed', 'false')
    expect(screen.getByRole('button')).toHaveTextContent('outline')
    rerender(
      <MaterialIconToggleButton
        aria-label="Favorite"
        checked
        onCheckedChange={onCheckedChange}
        selectedIcon="filled"
      >
        outline
      </MaterialIconToggleButton>,
    )
    expect(screen.getByRole('button')).toHaveAttribute('aria-pressed', 'true')
    expect(screen.getByRole('button')).toHaveTextContent('filled')
  })
  it('supports repeated controlled activation and event cancellation', () => {
    function Example() {
      const [selected, setSelected] = useState(false)
      return (
        <MaterialIconButton
          aria-label="Favorite"
          toggle
          selected={selected}
          onSelectedChange={setSelected}
        >
          +
        </MaterialIconButton>
      )
    }
    const { unmount } = render(<Example />)
    fireEvent.click(screen.getByRole('button'))
    expect(screen.getByRole('button')).toHaveAttribute('aria-pressed', 'true')
    fireEvent.click(screen.getByRole('button'))
    expect(screen.getByRole('button')).toHaveAttribute('aria-pressed', 'false')
    unmount()
    const change = vi.fn()
    render(
      <MaterialIconToggleButton
        aria-label="Favorite"
        checked={false}
        onCheckedChange={change}
        onClick={(event) => event.preventDefault()}
      >
        +
      </MaterialIconToggleButton>,
    )
    fireEvent.click(screen.getByRole('button'))
    expect(change).not.toHaveBeenCalled()
  })
  it('blocks disabled clicks and disables the ripple without fading the whole control', () => {
    const click = vi.fn(),
      change = vi.fn()
    render(
      <MaterialIconToggleButton
        aria-label="Favorite"
        disabled
        checked
        onClick={click}
        onCheckedChange={change}
      >
        +
      </MaterialIconToggleButton>,
    )
    const button = screen.getByRole('button')
    fireEvent.click(button)
    expect(button).toBeDisabled()
    expect(click).not.toHaveBeenCalled()
    expect(change).not.toHaveBeenCalled()
    expect(button.querySelector('[data-material-ripple-disabled]')).toHaveAttribute(
      'data-material-ripple-disabled',
      'true',
    )
  })
  it('passes through keyboard handlers, accessible descriptions and custom styling', () => {
    const key = vi.fn()
    render(
      <MaterialIconButton
        aria-label="Save"
        aria-describedby="help"
        onKeyDown={key}
        title="Save changes"
        className="custom"
        shape="square"
        animated={false}
        shapes={{ shape: '6px', pressedShape: '2px', checkedShape: '10px' }}
        colors={{
          containerColor: 'red',
          checkedContentColor: 'blue',
          disabledOutlineColor: 'gray',
        }}
        style={{ '--md-icon-button-icon-size': '22px' }}
      >
        +
      </MaterialIconButton>,
    )
    const button = screen.getByRole('button')
    fireEvent.keyDown(button, { key: 'Enter' })
    expect(key).toHaveBeenCalledOnce()
    expect(button).toHaveClass('custom')
    expect(button).toHaveAttribute('aria-describedby', 'help')
    expect(button).toHaveAttribute('title', 'Save changes')
    expect(button).toHaveAttribute('data-animated', 'false')
    expect(button).toHaveStyle({
      '--md-icon-button-shape': '6px',
      '--md-icon-button-pressed-shape': '2px',
      '--md-icon-button-selected-shape': '10px',
      '--md-icon-button-container-color': 'red',
      '--md-icon-button-selected-content-color': 'blue',
      '--md-icon-button-disabled-outline-color': 'gray',
      '--md-icon-button-icon-size': '22px',
    })
  })
  it.each([
    [MaterialFilledIconButton, 'filled'],
    [MaterialFilledTonalIconButton, 'tonal'],
    [MaterialOutlinedIconButton, 'outlined'],
  ] as const)('exports action wrapper %s', (Component, variant) => {
    render(<Component aria-label="Action">+</Component>)
    expect(screen.getByRole('button')).toHaveAttribute('data-variant', variant)
    expect(screen.getByRole('button')).not.toHaveAttribute('aria-pressed')
  })
  it.each([
    [MaterialFilledIconToggleButton, 'filled'],
    [MaterialFilledTonalIconToggleButton, 'tonal'],
    [MaterialOutlinedIconToggleButton, 'outlined'],
  ] as const)('exports controlled wrapper %s', (Component, variant) => {
    render(
      <Component aria-label="Action" checked onCheckedChange={() => {}}>
        +
      </Component>,
    )
    expect(screen.getByRole('button')).toHaveAttribute('data-variant', variant)
    expect(screen.getByRole('button')).toHaveAttribute('aria-pressed', 'true')
  })
  it('shares the app-bar control while preserving inherited color and small geometry', () => {
    render(<library.AppBarIconButton aria-label="Back">+</library.AppBarIconButton>)
    const button = screen.getByRole('button', { name: 'Back' })
    expect(button).toHaveAttribute('data-material-icon-button')
    expect(button).toHaveAttribute('data-material-app-bar-icon-button')
    expect(button).toHaveAttribute('data-color-mode', 'inherit')
    expect(button).toHaveAttribute('data-variant', 'standard')
    expect(button).toHaveStyle({
      '--md-icon-button-container-width': '40px',
      '--md-icon-button-icon-size': '24px',
    })
  })

  it('exports public short names', () => {
    expect(library.IconButton).toBe(MaterialIconButton)
    expect(library.IconToggleButton).toBe(MaterialIconToggleButton)
    expect(library.FilledIconButton).toBe(MaterialFilledIconButton)
    expect(library.FilledTonalIconButton).toBe(MaterialFilledTonalIconButton)
    expect(library.OutlinedIconButton).toBe(MaterialOutlinedIconButton)
    expect(library.FilledIconToggleButton).toBe(MaterialFilledIconToggleButton)
    expect(library.FilledTonalIconToggleButton).toBe(MaterialFilledTonalIconToggleButton)
    expect(library.OutlinedIconToggleButton).toBe(MaterialOutlinedIconToggleButton)
  })
})
