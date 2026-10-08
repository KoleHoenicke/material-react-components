import { act, fireEvent, render, screen } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'
import { MaterialButtonGroup } from './MaterialButtonGroup'

const options = [
  { ariaLabel: 'Show board', content: 'Board', value: 'board' },
  { ariaLabel: 'Show collection', content: 'Collection', value: 'collection' },
] as const

describe('MaterialButtonGroup', () => {
  it('renders an optional leading icon separately from the label without changing its accessible name', () => {
    render(<MaterialButtonGroup ariaLabel="View" onChange={() => undefined} options={[{ ...options[0], leadingIcon: <svg data-testid="leading" /> }]} value="board" />)
    expect(screen.getByRole('radio', { name: 'Show board' })).toContainElement(screen.getByTestId('leading'))
    expect(screen.getByTestId('leading').closest('.material-button__icon')).toHaveAttribute('aria-hidden', 'true')
    expect(screen.getByText('Board')).toHaveClass('material-button-group__content')
  })

  it('keeps compact sizing by default and supports equal-width filled rows without changing selection', () => {
    const { rerender } = render(<MaterialButtonGroup ariaLabel="View" onChange={() => undefined} options={options} value="board" />)
    const group = screen.getByRole('radiogroup', { name: 'View' })
    expect(group).toHaveAttribute('data-full-width', 'false')
    expect(group).toHaveAttribute('data-item-sizing', 'content')
    rerender(<MaterialButtonGroup ariaLabel="View" onChange={() => undefined} options={options} value="board" fullWidth itemSizing="equal" />)
    expect(group).toHaveAttribute('data-full-width', 'true')
    expect(group).toHaveAttribute('data-item-sizing', 'equal')
    expect(screen.getByRole('radio', { name: 'Show board' })).toHaveAttribute('aria-checked', 'true')
  })

  it('conserves a stretched row width during a press and restores flexible sizing after release', () => {
    render(<MaterialButtonGroup ariaLabel="View" onChange={() => undefined} options={options} value="board" fullWidth itemSizing="equal" />)
    const board = screen.getByRole('radio', { name: 'Show board' })
    const collection = screen.getByRole('radio', { name: 'Show collection' })
    const boardRect = vi.spyOn(board, 'getBoundingClientRect').mockReturnValue({ width: 150 } as DOMRect)
    vi.spyOn(collection, 'getBoundingClientRect').mockReturnValue({ width: 150 } as DOMRect)
    fireEvent.pointerDown(board, { button: 0, isPrimary: true, pointerId: 1 })
    expect(board.style.width).toBe('166px')
    expect(collection.style.width).toBe('134px')
    boardRect.mockReturnValue({ width: 166 } as DOMRect)
    fireEvent.pointerUp(board, { button: 0, isPrimary: true, pointerId: 1 })
    expect(board.style.width).toBe('150px')
    expect(collection.style.width).toBe('150px')
    const event = new Event('transitionend', { bubbles: true })
    Object.defineProperty(event, 'propertyName', { value: 'width' })
    fireEvent(board, event)
    expect(board.style.width).toBe('')
    expect(board.style.flexGrow).toBe('')
    expect(collection.style.flexBasis).toBe('')
    vi.restoreAllMocks()
  })

  it('renders a single-select connected group as a radio group', () => {
    render(
      <MaterialButtonGroup
        ariaLabel="View"
        onChange={() => undefined}
        options={options}
        value="board"
        variant="connected"
      />,
    )

    expect(screen.getByRole('radiogroup', { name: 'View' })).toHaveAttribute(
      'data-variant',
      'connected',
    )
    expect(screen.getByRole('radiogroup', { name: 'View' })).toHaveAttribute(
      'data-width-interaction',
      'push',
    )
    expect(screen.getByRole('radio', { name: 'Show board' })).toHaveAttribute(
      'aria-checked',
      'true',
    )
    expect(screen.getByRole('radio', { name: 'Show board' })).toHaveAttribute('tabindex', '0')
    expect(screen.getByRole('radio', { name: 'Show collection' })).toHaveAttribute(
      'aria-checked',
      'false',
    )
    expect(screen.getByRole('radio', { name: 'Show collection' })).toHaveAttribute(
      'tabindex',
      '-1',
    )
  })

  it('changes selection and preserves active-button actions', () => {
    const onActiveClick = vi.fn()
    const onChange = vi.fn()
    render(
      <MaterialButtonGroup
        ariaLabel="View"
        onActiveClick={onActiveClick}
        onChange={onChange}
        options={options}
        value="board"
      />,
    )
    fireEvent.click(screen.getByRole('radio', { name: 'Show board' }))
    expect(onActiveClick).toHaveBeenCalledWith('board')
    expect(onChange).not.toHaveBeenCalled()

    fireEvent.click(screen.getByRole('radio', { name: 'Show collection' }))
    expect(onChange).toHaveBeenCalledWith('collection')

    const board = screen.getByRole('radio', { name: 'Show board' })
    fireEvent.keyDown(board, { key: 'ArrowRight' })
    expect(onChange).toHaveBeenLastCalledWith('collection')
    expect(screen.getByRole('radio', { name: 'Show collection' })).toHaveFocus()
  })

  it('marks a standard group pressed for pointer and keyboard activation', () => {
    render(
      <MaterialButtonGroup
        ariaLabel="Actions"
        onChange={() => undefined}
        options={options}
        selectionMode="multiple"
        value="board"
        variant="standard"
      />,
    )

    const collection = screen.getByRole('button', { name: 'Show collection' })
    expect(collection).not.toHaveAttribute('aria-pressed')
    fireEvent.pointerDown(collection, { button: 0, isPrimary: true, pointerId: 1 })
    expect(collection).toHaveAttribute('data-pressed', 'true')
    fireEvent.pointerUp(collection, { button: 0, isPrimary: true, pointerId: 1 })
    expect(collection).not.toHaveAttribute('data-pressed')

    fireEvent.keyDown(collection, { key: ' ' })
    expect(collection).toHaveAttribute('data-pressed', 'true')
    fireEvent.keyUp(collection, { key: ' ' })
    expect(collection).not.toHaveAttribute('data-pressed')
  })

  it('only exposes pressed semantics for selectable items in a mixed action group', () => {
    render(
      <MaterialButtonGroup
        ariaLabel="Mixed actions"
        onChange={() => undefined}
        options={[
          { ariaLabel: 'Previous', content: 'Previous', value: 'previous' },
          {
            ariaLabel: 'Mirror mode',
            content: 'Mirror',
            selected: true,
            value: 'mirror',
          },
        ]}
        selectionMode="multiple"
        value="previous"
      />,
    )

    expect(screen.getByRole('button', { name: 'Previous' })).not.toHaveAttribute('aria-pressed')
    expect(screen.getByRole('button', { name: 'Mirror mode' })).toHaveAttribute(
      'aria-pressed',
      'true',
    )
  })

  it('can disable neighbor resizing without changing group geometry', () => {
    render(
      <MaterialButtonGroup
        ariaLabel="Static connected group"
        onChange={() => undefined}
        options={options}
        value="board"
        variant="connected"
        widthInteraction="none"
      />,
    )

    expect(screen.getByRole('radiogroup', { name: 'Static connected group' })).toHaveAttribute(
      'data-width-interaction',
      'none',
    )
  })

  it('paints the press response before running the latest deferred activation', () => {
    vi.useFakeTimers()
    const animationFrames: FrameRequestCallback[] = []
    const requestAnimationFrameSpy = vi
      .spyOn(window, 'requestAnimationFrame')
      .mockImplementation((callback) => {
        animationFrames.push(callback)
        return animationFrames.length
      })
    const onActiveClick = vi.fn()
    const onChange = vi.fn()

    render(
      <MaterialButtonGroup
        activationTiming="after-paint"
        ariaLabel="Deferred view"
        onActiveClick={onActiveClick}
        onChange={onChange}
        options={options}
        value="board"
      />,
    )
    animationFrames.length = 0
    expect(screen.getByRole('radiogroup', { name: 'Deferred view' })).toHaveAttribute(
      'data-activation-timing',
      'after-paint',
    )

    fireEvent.click(screen.getByRole('radio', { name: 'Show board' }))
    fireEvent.click(screen.getByRole('radio', { name: 'Show collection' }))

    expect(onActiveClick).not.toHaveBeenCalled()
    expect(onChange).not.toHaveBeenCalled()
    expect(animationFrames).toHaveLength(1)

    act(() => {
      animationFrames[0]?.(performance.now())
    })

    expect(onChange).not.toHaveBeenCalled()
    expect(animationFrames).toHaveLength(2)

    act(() => {
      animationFrames[1]?.(performance.now())
      vi.runAllTimers()
    })

    expect(onActiveClick).not.toHaveBeenCalled()
    expect(onChange).toHaveBeenCalledTimes(1)
    expect(onChange).toHaveBeenCalledWith('collection')

    requestAnimationFrameSpy.mockRestore()
    vi.useRealTimers()
  })

  it('rechecks the latest release shape before a deferred activation runs', () => {
    vi.useFakeTimers()
    const animationFrames: FrameRequestCallback[] = []
    const requestAnimationFrameSpy = vi
      .spyOn(window, 'requestAnimationFrame')
      .mockImplementation((callback) => {
        animationFrames.push(callback)
        return animationFrames.length
      })
    const onActiveClick = vi.fn()
    const onChange = vi.fn()

    render(
      <MaterialButtonGroup
        activationTiming="after-paint"
        ariaLabel="Deferred actions"
        onActiveClick={onActiveClick}
        onChange={onChange}
        options={options}
        value="board"
      />,
    )
    animationFrames.length = 0

    const board = screen.getByRole('radio', { name: 'Show board' })
    const collection = screen.getByRole('radio', { name: 'Show collection' })

    fireEvent.click(collection)
    act(() => {
      animationFrames.shift()?.(performance.now())
      animationFrames.shift()?.(performance.now())
    })
    expect(vi.getTimerCount()).toBeGreaterThan(0)

    fireEvent.pointerDown(board, { button: 0, isPrimary: true, pointerId: 1 })
    expect(board).toHaveAttribute('data-rapid-press', 'true')
    act(() => {
      vi.runOnlyPendingTimers()
    })

    expect(onChange).not.toHaveBeenCalled()
    expect(onActiveClick).not.toHaveBeenCalled()
    expect(animationFrames).toHaveLength(1)

    fireEvent.pointerUp(board, { button: 0, isPrimary: true, pointerId: 1 })
    expect(board).not.toHaveAttribute('data-rapid-press')
    fireEvent.click(board)
    act(() => {
      animationFrames.shift()?.(performance.now())
      animationFrames.shift()?.(performance.now())
      vi.runOnlyPendingTimers()
    })

    expect(onChange).not.toHaveBeenCalled()
    expect(onActiveClick).toHaveBeenCalledTimes(1)
    expect(onActiveClick).toHaveBeenCalledWith('board')

    requestAnimationFrameSpy.mockRestore()
    vi.useRealTimers()
  })
})
