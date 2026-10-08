import { act, fireEvent, render, screen } from '@testing-library/react'
import { useState } from 'react'
import { afterEach, describe, expect, it, vi } from 'vitest'

import {
  MaterialExpandableList,
  MaterialList,
  MaterialListAvatar,
  MaterialListDivider,
  MaterialListItem,
  MaterialListMedia,
} from './MaterialList'
import { MaterialListTrailingAction } from './MaterialListTrailingAction'

afterEach(() => {
  vi.useRealTimers()
  vi.restoreAllMocks()
  vi.unstubAllGlobals()
})

describe('MaterialList', () => {
  it('exposes trailing metadata as a description while keeping decorative icons hidden', () => {
    const { rerender } = render(<MaterialList>
      <span id="hint">Opens details</span>
      <MaterialListItem headline="Contact" ariaLabel="Open contact" aria-describedby="hint" onClick={() => undefined}
        trailing={<time dateTime="2026-10-07">1h</time>} trailingDescription="Added 1 hour ago" trailingType="text" />
    </MaterialList>)
    const button = screen.getByRole('button', { name: 'Open contact' })
    expect(button).toHaveAccessibleDescription('Opens details Added 1 hour ago')
    expect(screen.getByText('1h').parentElement).not.toHaveAttribute('aria-hidden')
    rerender(<MaterialList><MaterialListItem headline="Contact" onClick={() => undefined} trailing="Yesterday" trailingType="text" /></MaterialList>)
    expect(screen.getByRole('button', { name: 'Contact' })).toHaveAccessibleDescription('Yesterday')
    rerender(<MaterialList><MaterialListItem headline="Contact" onClick={() => undefined} trailing={<svg data-testid="icon" />} trailingType="icon" /></MaterialList>)
    expect(screen.getByTestId('icon').parentElement).toHaveAttribute('aria-hidden', 'true')
    expect(screen.getByRole('button', { name: 'Contact' })).not.toHaveAttribute('aria-describedby')
  })

  it('updates automatic alignment and inferred line count after content resizes, while honoring overrides', () => {
    let notify: ResizeObserverCallback = () => undefined
    vi.stubGlobal('ResizeObserver', class {
      constructor(callback: ResizeObserverCallback) { notify = callback }
      observe() {}
      disconnect() {}
    })
    const { container, rerender } = render(<MaterialList><MaterialListItem headline="Contact" supportingText="Details" /></MaterialList>)
    const item = container.querySelector<HTMLElement>('[data-material-list-item]')!
    const support = screen.getByText('Details')
    Object.assign(item.style, { paddingTop: '10px', paddingBottom: '10px', borderTopWidth: '0px', borderBottomWidth: '0px' })
    support.style.lineHeight = '20px'
    const height = vi.spyOn(item, 'clientHeight', 'get').mockReturnValue(72)
    const supportHeight = vi.spyOn(support, 'offsetHeight', 'get').mockReturnValue(20)
    act(() => notify([], {} as ResizeObserver))
    expect(item).toHaveAttribute('data-vertical-alignment', 'center')
    height.mockReturnValue(88)
    supportHeight.mockReturnValue(40)
    vi.spyOn(item, 'getBoundingClientRect').mockReturnValue({ height: 79.2 } as DOMRect)
    act(() => notify([], {} as ResizeObserver))
    expect(item).toHaveAttribute('data-vertical-alignment', 'top')
    expect(item).toHaveAttribute('data-lines', '3')
    height.mockReturnValue(72)
    supportHeight.mockReturnValue(20)
    act(() => notify([], {} as ResizeObserver))
    expect(item).toHaveAttribute('data-vertical-alignment', 'center')
    expect(item).toHaveAttribute('data-lines', '2')
    rerender(<MaterialList><MaterialListItem headline="Contact" supportingText="Details" lines={3} verticalAlignment="center" /></MaterialList>)
    height.mockReturnValue(100)
    act(() => notify([], {} as ResizeObserver))
    expect(item).toHaveAttribute('data-lines', '3')
    expect(item).toHaveAttribute('data-vertical-alignment', 'center')
  })

  it('renders standard one, two, and three-line slot layouts', () => {
    const { container } = render(
      <MaterialList ariaLabel="Recent files">
        <MaterialListItem headline="One line" />
        <MaterialListItem headline="Two line" supportingText="Supporting text" />
        <MaterialListItem
          headline="Three line"
          overline="Document"
          supportingText="Supporting text"
          leading={<span>draft</span>}
          leadingType="icon"
          trailing="Yesterday"
          trailingType="text"
        />
      </MaterialList>,
    )

    expect(screen.getByRole('list', { name: 'Recent files' })).toHaveAttribute(
      'data-variant',
      'standard',
    )
    expect(container.querySelectorAll('[data-lines="1"]')).toHaveLength(1)
    expect(container.querySelectorAll('[data-lines="2"]')).toHaveLength(1)
    expect(container.querySelectorAll('[data-lines="3"]')).toHaveLength(1)
    expect(screen.getByText('Yesterday')).toHaveAttribute('data-type', 'text')
  })

  it('uses a native button for an action and blocks it when disabled', () => {
    const onClick = vi.fn()
    const { rerender } = render(
      <MaterialList>
        <MaterialListItem
          headline="Open settings"
          supportingText="Application preferences"
          onClick={onClick}
        />
      </MaterialList>,
    )

    fireEvent.click(
      screen.getByRole('button', { name: 'Open settings Application preferences' }),
    )
    expect(onClick).toHaveBeenCalledOnce()

    rerender(
      <MaterialList>
        <MaterialListItem headline="Open settings" disabled onClick={onClick} />
      </MaterialList>,
    )
    expect(screen.getByRole('button', { name: 'Open settings' })).toBeDisabled()
  })

  it('uses link behavior without exposing a destination when disabled', () => {
    const { rerender } = render(
      <MaterialList>
        <MaterialListItem headline="Details" href="/details" />
      </MaterialList>,
    )

    expect(screen.getByRole('link', { name: 'Details' })).toHaveAttribute('href', '/details')

    rerender(
      <MaterialList>
        <MaterialListItem headline="Details" href="/details" disabled />
      </MaterialList>,
    )
    const disabledLink = screen.getByLabelText('Details')
    expect(disabledLink).not.toHaveAttribute('href')
    expect(disabledLink).toHaveAttribute('aria-disabled', 'true')
  })

  it('implements web listbox semantics for single and multiple selection', () => {
    const onSelectedChange = vi.fn()
    render(
      <MaterialList ariaLabel="Choose folders" selectionMode="multiple">
        <MaterialListItem
          headline="Photos"
          selected
          onSelectedChange={onSelectedChange}
        />
      </MaterialList>,
    )

    expect(screen.getByRole('listbox', { name: 'Choose folders' })).toHaveAttribute(
      'aria-multiselectable',
      'true',
    )
    const option = screen.getByRole('option', { name: 'Photos' })
    expect(option).toHaveAttribute('aria-selected', 'true')
    fireEvent.click(option)
    expect(onSelectedChange).toHaveBeenCalledWith(false)
  })

  it('supports an item-level selection override and derives text from nested labels', () => {
    const headline = <><span>Photo</span> <span>folder</span></>
    const { rerender } = render(
      <MaterialList>
        <MaterialListItem headline={headline} selectionMode="single" selected />
      </MaterialList>,
    )

    expect(screen.getByRole('option', { name: 'Photo folder' })).toHaveAttribute(
      'aria-selected',
      'true',
    )

    rerender(
      <MaterialList>
        <MaterialListItem headline={headline} onClick={() => {}} />
      </MaterialList>,
    )
    expect(screen.getByRole('button', { name: 'Photo folder' })).toBeInTheDocument()
  })

  it('wraps arrow, Home, and End focus while skipping disabled items', () => {
    render(
      <MaterialList ariaLabel="Destinations">
        <MaterialListItem headline="First" onClick={() => {}} />
        <MaterialListItem headline="Disabled" disabled onClick={() => {}} />
        <MaterialListItem headline="Last" onClick={() => {}} />
      </MaterialList>,
    )

    const first = screen.getByRole('button', { name: 'First' })
    const last = screen.getByRole('button', { name: 'Last' })
    first.focus()
    fireEvent.keyDown(first, { key: 'ArrowDown' })
    expect(last).toHaveFocus()
    fireEvent.keyDown(last, { key: 'ArrowDown' })
    expect(first).toHaveFocus()
    fireEvent.keyDown(first, { key: 'End' })
    expect(last).toHaveFocus()
    fireEvent.keyDown(last, { key: 'Home' })
    expect(first).toHaveFocus()
  })

  it('keeps secondary actions outside the primary button and in arrow navigation', () => {
    render(
      <MaterialList ariaLabel="Messages">
        <MaterialListItem
          ariaLabel="Open message"
          headline="Avery"
          onClick={() => {}}
          trailing={
            <MaterialListTrailingAction aria-label="Favorite message">
              star
            </MaterialListTrailingAction>
          }
          trailingType="control"
        />
      </MaterialList>,
    )

    const primary = screen.getByRole('button', { name: 'Open message' })
    const secondary = screen.getByRole('button', { name: 'Favorite message' })
    expect(primary).not.toContainElement(secondary)
    primary.focus()
    fireEvent.keyDown(primary, { key: 'ArrowRight' })
    expect(secondary).toHaveFocus()
  })

  it('supports long press without also firing the click action', () => {
    vi.useFakeTimers()
    const onClick = vi.fn()
    const onLongPress = vi.fn()
    render(
      <MaterialList>
        <MaterialListItem
          headline="Selectable"
          onClick={onClick}
          onLongPress={onLongPress}
        />
      </MaterialList>,
    )

    const item = screen.getByRole('button', { name: 'Selectable' })
    fireEvent.pointerDown(item, {
      button: 0,
      clientX: 10,
      clientY: 10,
      isPrimary: true,
      pointerId: 1,
    })
    vi.advanceTimersByTime(500)
    fireEvent.pointerUp(item, { pointerId: 1 })
    fireEvent.click(item)

    expect(onLongPress).toHaveBeenCalledOnce()
    expect(onClick).not.toHaveBeenCalled()
  })

  it('reports native drag state changes', () => {
    const onDraggedChange = vi.fn()
    const { container } = render(
      <MaterialList>
        <MaterialListItem
          draggable
          headline="Move me"
          onDraggedChange={onDraggedChange}
        />
      </MaterialList>,
    )

    const item = container.querySelector('[data-material-list-item]') as HTMLElement
    fireEvent.dragStart(item)
    fireEvent.dragEnd(item)
    expect(onDraggedChange).toHaveBeenNthCalledWith(1, true)
    expect(onDraggedChange).toHaveBeenNthCalledWith(2, false)
  })

  it('supports a large profile portrait while preserving the standard avatar default', () => {
    const { container, rerender } = render(<MaterialListAvatar>KH</MaterialListAvatar>)
    expect(container.querySelector('[data-material-list-avatar]')).toHaveAttribute('data-size', 'standard')
    rerender(<MaterialListAvatar size="large"><img src="profile.jpg" alt="Kole" /></MaterialListAvatar>)
    expect(container.querySelector('[data-material-list-avatar]')).toHaveAttribute('data-size', 'large')
    expect(screen.getByRole('img', { name: 'Kole' })).toHaveAttribute('src', 'profile.jpg')
    expect(container.querySelector('[data-material-list-avatar]')).not.toHaveAttribute('style')
  })

  it('provides exact avatar, media, and divider building blocks', () => {
    const { container } = render(
      <MaterialList>
        <MaterialListItem
          headline="Kole"
          leading={<MaterialListAvatar>KH</MaterialListAvatar>}
          leadingType="avatar"
        />
        <MaterialListDivider inset="full" />
        <MaterialListItem
          headline="Preview"
          leading={
            <MaterialListMedia type="video-large">
              <video aria-label="Preview video" />
            </MaterialListMedia>
          }
          leadingType="video-large"
        />
      </MaterialList>,
    )

    expect(container.querySelector('[data-material-list-avatar]')).toHaveTextContent('KH')
    expect(container.querySelector('[data-material-list-media]')).toHaveAttribute(
      'data-type',
      'video-large',
    )
    expect(container.querySelector('[data-material-list-divider]')).toHaveAttribute(
      'data-inset',
      'full',
    )
    expect(container.querySelector('[data-material-list-divider]')).toHaveClass(
      'material-divider',
    )
    expect(container.querySelector('[data-material-list-divider]')).toHaveAttribute(
      'aria-orientation',
      'horizontal',
    )
  })

  it('uses emphasized type only for a selected item headline', () => {
    render(
      <MaterialList selectionMode="single">
        <MaterialListItem headline="Selected" selected />
        <MaterialListItem headline="Available" />
      </MaterialList>,
    )

    expect(screen.getByText('Selected')).toHaveAttribute(
      'data-material-typography',
      'bodyLargeEmphasized',
    )
    expect(screen.getByText('Available')).toHaveAttribute(
      'data-material-typography',
      'bodyLarge',
    )
  })
})

describe('MaterialExpandableList', () => {
  it('exposes controlled disclosure state and removes collapsed children from focus', () => {
    const onExpandedChange = vi.fn()
    const { container, rerender } = render(
      <MaterialExpandableList
        ariaLabel="Project folders"
        expanded={false}
        onExpandedChange={onExpandedChange}
        summary={{ headline: 'Design files' }}
      >
        <MaterialListItem headline="Mockups" onClick={() => {}} />
      </MaterialExpandableList>,
    )

    const disclosure = screen.getByRole('button', { name: 'Design files' })
    expect(disclosure).toHaveAttribute('aria-expanded', 'false')
    expect(disclosure).toHaveAttribute('aria-controls')
    expect(container.querySelector('[role="group"]')).toHaveAttribute('inert')
    fireEvent.click(disclosure)
    expect(onExpandedChange).toHaveBeenCalledWith(true)

    rerender(
      <MaterialExpandableList
        ariaLabel="Project folders"
        expanded
        onExpandedChange={onExpandedChange}
        summary={{ headline: 'Design files' }}
      >
        <MaterialListItem headline="Mockups" onClick={() => {}} />
      </MaterialExpandableList>,
    )
    expect(screen.getByRole('button', { name: 'Design files' })).toHaveAttribute(
      'aria-expanded',
      'true',
    )
    expect(container.querySelector('[role="group"]')).not.toHaveAttribute('inert')
  })

  it('works as a controlled disclosure in application state', () => {
    function Example() {
      const [expanded, setExpanded] = useState(false)
      return (
        <MaterialExpandableList
          expanded={expanded}
          onExpandedChange={setExpanded}
          summary={{ headline: 'Albums' }}
        >
          <MaterialListItem headline="Favorites" />
        </MaterialExpandableList>
      )
    }

    render(<Example />)
    fireEvent.click(screen.getByRole('button', { name: 'Albums' }))
    expect(screen.getByRole('button', { name: 'Albums' })).toHaveAttribute(
      'aria-expanded',
      'true',
    )
  })
})
