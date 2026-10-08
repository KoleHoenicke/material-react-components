import { fireEvent, render, screen, waitFor } from '@testing-library/react'
import { createRef } from 'react'
import { describe, expect, it, vi } from 'vitest'

import {
  MaterialAppBarAvatarButton,
  MaterialAppBarFab,
  MaterialAppBarIconButton,
  MaterialBottomAppBar,
  MaterialCenterAlignedTopAppBar,
  MaterialLargeFlexibleTopAppBar,
  MaterialLargeTopAppBar,
  MaterialMediumFlexibleTopAppBar,
  MaterialMediumTopAppBar,
  MaterialTopAppBar,
} from './MaterialAppBar'

function iconButton(label: string) {
  return (
    <MaterialAppBarIconButton aria-label={label}>
      <svg viewBox="0 0 24 24"><path d="M4 12h16" /></svg>
    </MaterialAppBarIconButton>
  )
}

describe('MaterialTopAppBar', () => {
  it('uses the Android small app bar tokens and slots by default', () => {
    render(
      <MaterialTopAppBar
        title="Inbox"
        navigationIcon={iconButton('Open navigation')}
        actions={iconButton('Search')}
      />,
    )

    const appBar = screen.getByRole('banner')
    expect(appBar).toHaveAttribute('data-variant', 'small')
    expect(appBar).toHaveAttribute('data-alignment', 'start')
    expect(appBar).toHaveAttribute('data-safe-area', 'true')
    expect(appBar).toHaveStyle({
      '--md-top-app-bar-collapsed-height': '64px',
      '--md-top-app-bar-current-height': '64px',
      '--md-top-app-bar-expanded-height': '64px',
    })
    expect(screen.getByRole('button', { name: 'Open navigation' })).toHaveAttribute(
      'type',
      'button',
    )
    expect(screen.getByRole('button', { name: 'Search' })).toBeVisible()
    expect(screen.getByText('Inbox')).toBeVisible()
  })

  it('centers the dedicated center-aligned variant', () => {
    render(<MaterialCenterAlignedTopAppBar title="Messages" />)

    expect(screen.getByRole('banner')).toHaveAttribute('data-alignment', 'center')
    expect(screen.getByRole('banner')).toHaveAttribute('data-variant', 'center-aligned')
  })

  it('uses two title rows and the medium 112 to 64 geometry', () => {
    render(<MaterialMediumTopAppBar title="Library" collapseProgress={0.25} />)

    const appBar = screen.getByRole('banner')
    expect(appBar).toHaveAttribute('data-two-rows', 'true')
    expect(appBar).toHaveAttribute('data-collapse-progress', '0.25')
    expect(appBar).toHaveStyle({ '--md-top-app-bar-current-height': '100px' })
    expect(screen.getAllByText('Library')).toHaveLength(2)
  })

  it('uses flexible subtitle heights and state-specific slot content', () => {
    render(
      <MaterialLargeFlexibleTopAppBar
        collapseProgress={1}
        title={(expanded) => (expanded ? 'Expanded title' : 'Compact title')}
        subtitle={(expanded) => (expanded ? 'Expanded subtitle' : 'Compact subtitle')}
      />,
    )

    const appBar = screen.getByRole('banner')
    expect(appBar).toHaveStyle({
      '--md-top-app-bar-current-height': '64px',
      '--md-top-app-bar-expanded-height': '152px',
    })
    expect(screen.getByText('Compact title').closest('[aria-hidden]')).toBeNull()
    expect(screen.getByText('Expanded title').closest('[aria-hidden="true"]')).not.toBeNull()
    expect(screen.getByText('Compact subtitle')).toBeInTheDocument()
  })

  it('matches every Android default expanded height', () => {
    render(
      <>
        <MaterialMediumTopAppBar data-testid="medium" title="Medium" />
        <MaterialMediumFlexibleTopAppBar data-testid="medium-flex" title="Medium flex" />
        <MaterialMediumFlexibleTopAppBar
          data-testid="medium-flex-subtitle"
          title="Medium flex subtitle"
          subtitle="Subtitle"
        />
        <MaterialLargeTopAppBar data-testid="large" title="Large" />
        <MaterialLargeFlexibleTopAppBar data-testid="large-flex" title="Large flex" />
        <MaterialLargeFlexibleTopAppBar
          data-testid="large-flex-subtitle"
          title="Large flex subtitle"
          subtitle="Subtitle"
        />
      </>,
    )

    expect(screen.getByTestId('medium')).toHaveStyle({
      '--md-top-app-bar-expanded-height': '112px',
    })
    expect(screen.getByTestId('medium-flex')).toHaveStyle({
      '--md-top-app-bar-expanded-height': '112px',
    })
    expect(screen.getByTestId('medium-flex-subtitle')).toHaveStyle({
      '--md-top-app-bar-expanded-height': '136px',
    })
    expect(screen.getByTestId('large')).toHaveStyle({
      '--md-top-app-bar-expanded-height': '152px',
    })
    expect(screen.getByTestId('large-flex')).toHaveStyle({
      '--md-top-app-bar-expanded-height': '120px',
    })
    expect(screen.getByTestId('large-flex-subtitle')).toHaveStyle({
      '--md-top-app-bar-expanded-height': '152px',
    })
  })

  it('supports controlled scrolled color state and CSS token overrides', () => {
    render(
      <MaterialTopAppBar
        scrolled
        safeAreaInsets={false}
        title="Settings"
        style={{ '--md-top-app-bar-container-color': 'pink' }}
      />,
    )

    const appBar = screen.getByRole('banner')
    expect(appBar).toHaveAttribute('data-scrolled', 'true')
    expect(appBar).toHaveAttribute('data-safe-area', 'false')
    expect(appBar).toHaveStyle({ '--md-top-app-bar-container-color': 'pink' })
  })

  it('reports exit-until-collapsed progress from an element scroll target', async () => {
    const targetRef = createRef<HTMLDivElement>()
    const onProgress = vi.fn()
    render(
      <>
        <MaterialMediumTopAppBar
          title="Notes"
          scrollBehavior="exit-until-collapsed"
          scrollTarget={targetRef}
          onCollapseProgressChange={onProgress}
        />
        <div ref={targetRef} />
      </>,
    )

    targetRef.current!.scrollTop = 24
    fireEvent.scroll(targetRef.current!)

    await waitFor(() => expect(onProgress).toHaveBeenCalledWith(0.5))
    expect(screen.getByRole('banner')).toHaveAttribute('data-scrolled', 'true')
  })

  it('pins height while updating the scrolled container state', async () => {
    const targetRef = createRef<HTMLDivElement>()
    render(
      <>
        <MaterialTopAppBar title="Pinned" scrollBehavior="pinned" scrollTarget={targetRef} />
        <div ref={targetRef} />
      </>,
    )

    targetRef.current!.scrollTop = 12
    fireEvent.scroll(targetRef.current!)

    await waitFor(() =>
      expect(screen.getByRole('banner')).toHaveAttribute('data-scrolled', 'true'),
    )
    expect(screen.getByRole('banner')).toHaveAttribute('data-collapse-progress', '0')
  })

  it('uses scroll direction for enter-always behavior', async () => {
    const targetRef = createRef<HTMLDivElement>()
    const onProgress = vi.fn()
    render(
      <>
        <MaterialMediumTopAppBar
          title="Directional"
          scrollBehavior="enter-always"
          scrollTarget={targetRef}
          onCollapseProgressChange={onProgress}
        />
        <div ref={targetRef} />
      </>,
    )

    targetRef.current!.scrollTop = 24
    fireEvent.scroll(targetRef.current!)
    await waitFor(() => expect(onProgress).toHaveBeenCalledWith(0.5))

    targetRef.current!.scrollTop = 12
    fireEvent.scroll(targetRef.current!)
    await waitFor(() => expect(onProgress).toHaveBeenCalledWith(0.25))
  })

  it('rejects an expanded height below the collapsed height', () => {
    expect(() =>
      render(<MaterialTopAppBar title="Invalid" collapsedHeight={64} expandedHeight={56} />),
    ).toThrow(RangeError)
  })

  it('falls back to token heights for non-finite custom heights', () => {
    render(<MaterialMediumTopAppBar title="Fallback" expandedHeight={Number.POSITIVE_INFINITY} />)

    expect(screen.getByRole('banner')).toHaveStyle({
      '--md-top-app-bar-expanded-height': '112px',
    })
  })
})

describe('MaterialBottomAppBar', () => {
  it('renders the standard 80 pixel bar with actions and a secondary FAB', () => {
    render(
      <MaterialBottomAppBar
        aria-label="Primary actions"
        actions={iconButton('Archive')}
        floatingActionButton={
          <MaterialAppBarFab aria-label="Compose">
            <svg viewBox="0 0 24 24"><path d="M12 4v16M4 12h16" /></svg>
          </MaterialAppBarFab>
        }
      />,
    )

    const appBar = screen.getByRole('contentinfo', { name: 'Primary actions' })
    expect(appBar).toHaveAttribute('data-variant', 'standard')
    expect(appBar).toHaveAttribute('data-arrangement', 'start')
    expect(appBar).toHaveStyle({
      '--md-bottom-app-bar-current-height': '80px',
      '--md-bottom-app-bar-expanded-height': '80px',
    })
    expect(screen.getByRole('button', { name: 'Compose' })).toHaveAttribute('type', 'button')
  })

  it('supports flexible height, arrangement, and controlled collapse', () => {
    render(
      <MaterialBottomAppBar
        aria-label="Editing actions"
        variant="flexible"
        arrangement="fixed"
        collapseProgress={0.25}
      >
        {iconButton('Edit')}
      </MaterialBottomAppBar>,
    )

    const appBar = screen.getByRole('contentinfo', { name: 'Editing actions' })
    expect(appBar).toHaveAttribute('data-arrangement', 'fixed')
    expect(appBar).toHaveStyle({
      '--md-bottom-app-bar-current-height': '48px',
      '--md-bottom-app-bar-expanded-height': '64px',
    })
  })

  it('falls back to the flexible token for a non-positive height', () => {
    render(
      <MaterialBottomAppBar aria-label="Fallback actions" variant="flexible" expandedHeight={0} />,
    )

    expect(screen.getByRole('contentinfo', { name: 'Fallback actions' })).toHaveStyle({
      '--md-bottom-app-bar-expanded-height': '64px',
    })
  })

  it('collapses the full bottom bar with exit-always scrolling', async () => {
    const targetRef = createRef<HTMLDivElement>()
    const onProgress = vi.fn()
    render(
      <>
        <MaterialBottomAppBar
          aria-label="Scrolling actions"
          scrollBehavior="exit-always"
          scrollTarget={targetRef}
          onCollapseProgressChange={onProgress}
        />
        <div ref={targetRef} />
      </>,
    )

    targetRef.current!.scrollTop = 40
    fireEvent.scroll(targetRef.current!)

    await waitFor(() => expect(onProgress).toHaveBeenCalledWith(0.5))
  })
})


describe('MaterialAppBarAvatarButton', () => {
  it('keeps a photo action accessible without icon/ripple containers and supports refs and disabled state', () => {
    const onClick = vi.fn()
    const ref = createRef<HTMLButtonElement>()
    const { rerender } = render(<MaterialAppBarAvatarButton ref={ref} aria-label="Switch profile" onClick={onClick}>
      <img src="profile.jpg" alt="" />
    </MaterialAppBarAvatarButton>)
    const button = screen.getByRole('button', { name: 'Switch profile' })
    expect(ref.current).toBe(button)
    expect(button).toHaveAttribute('type', 'button')
    expect(button.querySelector('.material-app-bar-avatar-button__avatar')).toBeInTheDocument()
    expect(button.querySelector('.material-ripple, .material-icon-button__container')).toBeNull()
    fireEvent.click(button)
    expect(onClick).toHaveBeenCalledTimes(1)
    rerender(<MaterialAppBarAvatarButton aria-label="Switch profile" onClick={onClick} disabled>AB</MaterialAppBarAvatarButton>)
    expect(button).toBeDisabled()
    fireEvent.click(button)
    expect(onClick).toHaveBeenCalledTimes(1)
  })
})
