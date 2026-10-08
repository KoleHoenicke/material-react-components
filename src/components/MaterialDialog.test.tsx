import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { fireEvent, render, screen } from '@testing-library/react'
import { useRef, useState } from 'react'
import { describe, expect, it, vi } from 'vitest'

import { MaterialButton } from './MaterialButton'
import {
  MaterialAlertDialog,
  MaterialBasicDialog,
  MaterialFullScreenDialog,
  type MaterialDialogDismissReason,
} from './MaterialDialog'

const closeIcon = <svg data-testid="close-icon" />
const infoIcon = <svg data-testid="info-icon" />
const componentCss = readFileSync(
  resolve(process.cwd(), 'src/components/MaterialDialog.css'),
  'utf8',
)

describe('MaterialBasicDialog', () => {
  it('uses the native modal top layer and exposes custom content', () => {
    const onDismissRequest = vi.fn()
    render(
      <MaterialBasicDialog
        aria-label="Custom settings"
        onDismissRequest={onDismissRequest}
        open
        style={{ '--md-dialog-container-max-width': '420px' }}
      >
        <p>Custom dialog content</p>
      </MaterialBasicDialog>,
    )

    const dialog = screen.getByRole('dialog', { name: 'Custom settings' })
    expect(dialog).toHaveAttribute('open')
    expect(dialog).toHaveAttribute('data-state', 'open')
    expect(dialog).toHaveStyle('--md-dialog-container-max-width: 420px')
    expect(screen.getByText('Custom dialog content')).toBeInTheDocument()
  })

  it('keeps arbitrary custom content accessible when no explicit name is supplied', () => {
    render(
      <MaterialBasicDialog onDismissRequest={() => undefined} open>
        Custom content
      </MaterialBasicDialog>,
    )

    expect(screen.getByRole('dialog', { name: 'Dialog' })).toBeInTheDocument()
  })

  it('requests dismissal for Escape and backdrop presses', () => {
    const onDismissRequest = vi.fn()
    render(
      <MaterialBasicDialog
        aria-label="Dismissible dialog"
        onDismissRequest={onDismissRequest}
        open
      >
        <button type="button">Inside</button>
      </MaterialBasicDialog>,
    )
    const dialog = screen.getByRole('dialog', { name: 'Dismissible dialog' })

    fireEvent(dialog, new Event('cancel', { bubbles: false, cancelable: true }))
    expect(onDismissRequest).toHaveBeenCalledWith('escape')

    fireEvent.pointerDown(dialog)
    fireEvent.click(dialog)
    expect(onDismissRequest).toHaveBeenLastCalledWith('backdrop')

    fireEvent.pointerDown(screen.getByRole('button', { name: 'Inside' }))
    fireEvent.click(screen.getByRole('button', { name: 'Inside' }))
    expect(onDismissRequest).toHaveBeenCalledTimes(2)
  })

  it('can disable platform dismissal requests', () => {
    const onDismissRequest = vi.fn()
    render(
      <MaterialBasicDialog
        aria-label="Required decision"
        closeOnBackdropClick={false}
        closeOnEscape={false}
        onDismissRequest={onDismissRequest}
        open
      >
        Required content
      </MaterialBasicDialog>,
    )
    const dialog = screen.getByRole('dialog', { name: 'Required decision' })

    fireEvent(dialog, new Event('cancel', { bubbles: false, cancelable: true }))
    fireEvent.pointerDown(dialog)
    fireEvent.click(dialog)
    expect(onDismissRequest).not.toHaveBeenCalled()
  })

  it('keeps the dialog mounted for its exit animation before closing it', () => {
    const onAnimationEnd = vi.fn()
    const { rerender } = render(
      <MaterialBasicDialog
        aria-label="Animated dialog"
        onAnimationEnd={onAnimationEnd}
        onDismissRequest={() => undefined}
        open
      >
        Animated content
      </MaterialBasicDialog>,
    )
    const dialog = screen.getByRole('dialog', { name: 'Animated dialog' })

    rerender(
      <MaterialBasicDialog
        aria-label="Animated dialog"
        onAnimationEnd={onAnimationEnd}
        onDismissRequest={() => undefined}
        open={false}
      >
        Animated content
      </MaterialBasicDialog>,
    )

    expect(dialog).toHaveAttribute('open')
    expect(dialog).toHaveAttribute('data-state', 'closing')
    fireEvent.animationEnd(dialog)
    expect(onAnimationEnd).toHaveBeenCalledTimes(1)
    expect(dialog).not.toHaveAttribute('open')
    expect(dialog).toHaveAttribute('data-state', 'closed')
  })

  it('honors an explicit initial focus target', async () => {
    function FocusExample() {
      const focusRef = useRef<HTMLButtonElement>(null)
      return (
        <MaterialBasicDialog
          aria-label="Focus example"
          initialFocusRef={focusRef}
          onDismissRequest={() => undefined}
          open
        >
          <button type="button">First</button>
          <button ref={focusRef} type="button">Preferred</button>
        </MaterialBasicDialog>
      )
    }

    render(<FocusExample />)
    await Promise.resolve()
    expect(screen.getByRole('button', { name: 'Preferred' })).toHaveFocus()
  })

  it('pins the current Material tokens, adaptive sizing, motion, and contrast modes', () => {
    expect(componentCss).toContain('--md-dialog-container-min-width: 280px')
    expect(componentCss).toContain('--md-dialog-container-max-width: 560px')
    expect(componentCss).toContain('--md-dialog-container-shape: var(--md-sys-shape-corner-extra-large, 28px)')
    expect(componentCss).toContain('--md-dialog-icon-size: 24px')
    expect(componentCss).toContain('--md-dialog-scrim-opacity: 0.32')
    expect(componentCss).toContain('transform: scale(0.8)')
    expect(componentCss).toMatch(
      /@media \(pointer: fine\)[\s\S]*--md-dialog-container-padding: 20px[\s\S]*font-size: 20px[\s\S]*line-height: 26px/,
    )
    expect(componentCss).toMatch(/@media \(prefers-reduced-motion: reduce\)/)
    expect(componentCss).toMatch(/@media \(forced-colors: active\)[\s\S]*CanvasText/)
  })
})

describe('MaterialAlertDialog', () => {
  it('labels the alert from its title and describes it with the supporting content', () => {
    render(
      <MaterialAlertDialog
        confirmButton={<MaterialButton variant="text">Accept</MaterialButton>}
        dismissButton={<MaterialButton variant="text">Decline</MaterialButton>}
        icon={infoIcon}
        onDismissRequest={() => undefined}
        open
        supportingText="This action changes the shared file."
        title="Share file?"
      />,
    )

    const dialog = screen.getByRole('alertdialog', { name: 'Share file?' })
    expect(dialog).toHaveAccessibleDescription('This action changes the shared file.')
    expect(dialog).toHaveAttribute('data-has-icon', 'true')
    expect(screen.getByTestId('info-icon').parentElement).toHaveClass(
      'material-alert-dialog__icon',
    )
    expect(screen.getAllByRole('button').map((button) => button.textContent)).toEqual([
      'Accept',
      'Decline',
    ])
  })

  it('supports content, centered presentation, a divider, and custom actions', () => {
    const { container } = render(
      <MaterialAlertDialog
        actions={<MaterialButton variant="text">Done</MaterialButton>}
        alignment="center"
        divider
        onDismissRequest={() => undefined}
        open
        title="Choose an account"
      >
        <div>Account list</div>
      </MaterialAlertDialog>,
    )

    expect(screen.getByRole('alertdialog')).toHaveAttribute('data-alignment', 'center')
    expect(screen.getByText('Account list')).toBeInTheDocument()
    expect(container.querySelector('[data-material-divider]')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Done' })).toBeInTheDocument()
  })

  it('uses a fallback accessible name when the title slot is omitted', () => {
    render(
      <MaterialAlertDialog
        aria-label="Connection warning"
        confirmButton={<button type="button">Retry</button>}
        onDismissRequest={() => undefined}
        open
        supportingText="The server did not respond."
      />,
    )

    expect(screen.getByRole('alertdialog', { name: 'Connection warning' })).toBeInTheDocument()
  })
})

describe('MaterialFullScreenDialog', () => {
  it('renders the complete full-screen anatomy and close affordance', () => {
    const onDismissRequest = vi.fn<(reason: MaterialDialogDismissReason) => void>()
    const { container } = render(
      <MaterialFullScreenDialog
        action={<MaterialButton variant="text">Save</MaterialButton>}
        closeIcon={closeIcon}
        closeLabel="Close editor"
        divider
        headline="New event"
        onDismissRequest={onDismissRequest}
        open
      >
        <label>Event title<input /></label>
      </MaterialFullScreenDialog>,
    )

    expect(screen.getByRole('dialog', { name: 'New event' })).toHaveClass(
      'material-full-screen-dialog',
    )
    expect(screen.getByRole('button', { name: 'Save' })).toBeInTheDocument()
    expect(container.querySelector('[data-material-divider]')).toBeInTheDocument()
    expect(screen.getByLabelText('Event title')).toBeInTheDocument()

    fireEvent.click(screen.getByRole('button', { name: 'Close editor' }))
    expect(onDismissRequest).toHaveBeenCalledWith('close')
  })
})


describe('MaterialFullScreenDialog slide transition', () => {
  it('constrains the page to the viewport and scrolls its body with or without a divider', () => {
    expect(componentCss).toMatch(/\.material-full-screen-dialog \{[^}]*overflow: hidden;/)
    expect(componentCss).toMatch(/\.material-full-screen-dialog__surface \{[^}]*display: flex;[^}]*block-size: 100%;[^}]*min-block-size: 0;/)
    expect(componentCss).toMatch(/\.material-full-screen-dialog__body \{[^}]*flex: 1 1 0;[^}]*min-block-size: 0;[^}]*overflow: auto;/)
  })
  const renderPage = (open: boolean) => <MaterialFullScreenDialog transition="slide" open={open}
    headline="Accounts" closeLabel="Close accounts" closeIcon={closeIcon} onDismissRequest={() => undefined}>
    <button>Profile</button>
  </MaterialFullScreenDialog>

  it('waits for its own transform exit, ignores child transitions, and cancels closing when reopened', () => {
    const { rerender } = render(renderPage(true))
    const dialog = screen.getByRole('dialog', { name: 'Accounts' })
    expect(dialog).toHaveAttribute('data-transition', 'slide')
    const transitionEnd = (target: Element) => {
      const event = new Event('transitionend', { bubbles: true })
      Object.defineProperty(event, 'propertyName', { value: 'transform' })
      fireEvent(target, event)
    }
    rerender(renderPage(false))
    expect(dialog).toHaveAttribute('data-state', 'closing')
    transitionEnd(screen.getByRole('button', { name: 'Profile' }))
    expect(dialog).toHaveAttribute('open')
    rerender(renderPage(true))
    transitionEnd(dialog)
    expect(dialog).toHaveAttribute('open')
    expect(dialog).toHaveAttribute('data-state', 'open')
    rerender(renderPage(false))
    transitionEnd(dialog)
    expect(dialog).not.toHaveAttribute('open')
  })

  it('closes immediately for reduced motion without waiting for a spatial transition', () => {
    const original = window.matchMedia
    window.matchMedia = vi.fn().mockReturnValue({ matches: true })
    try {
      const { rerender } = render(renderPage(true))
      const dialog = screen.getByRole('dialog', { name: 'Accounts' })
      rerender(renderPage(false))
      expect(dialog).not.toHaveAttribute('open')
    } finally {
      window.matchMedia = original
    }
  })

  it('uses shared Material motion tokens, trailing-edge direction, and a motion-free reduced variant', () => {
    expect(componentCss).toContain('transition: transform var(--m3-motion-transition-enter)')
    expect(componentCss).toContain('transition: transform var(--m3-motion-transition-exit)')
    expect(componentCss).toContain('--md-dialog-slide-offset: -100%')
    expect(componentCss).toMatch(/@starting-style[\s\S]*translateX/)
    expect(componentCss).toMatch(/@media \(prefers-reduced-motion: reduce\) \{[\s\S]*data-transition='slide'[\s\S]*transform: none;[\s\S]*transition: none;/)
  })
})


it('records the computed full-screen page direction before opening for bundled CSS fallbacks', () => {
  let openingDirection: string | undefined
  render(<MaterialFullScreenDialog ref={(dialog) => {
    if (dialog) dialog.showModal = () => { openingDirection = dialog.dataset.direction; dialog.setAttribute('open', '') }
  }} transition="slide" open style={{ direction: 'rtl' }}
    headline="RTL accounts" closeLabel="Close accounts" closeIcon={closeIcon} onDismissRequest={() => undefined}>
    Content
  </MaterialFullScreenDialog>)
  expect(openingDirection).toBe('rtl')
  expect(screen.getByRole('dialog', { name: 'RTL accounts' })).toHaveAttribute('data-direction', 'rtl')
  expect(componentCss).toContain("[data-transition='slide'][data-direction='rtl']")
})


it('does not let a backdrop fade finish the dialog container exit early', () => {
  const renderDialog = (open: boolean) => <MaterialBasicDialog open={open} aria-label="Exit timing"
    onDismissRequest={() => undefined}>Content</MaterialBasicDialog>
  const { rerender } = render(renderDialog(true))
  const dialog = screen.getByRole('dialog', { name: 'Exit timing' })
  rerender(renderDialog(false))
  const event = new Event('animationend', { bubbles: true })
  Object.defineProperty(event, 'pseudoElement', { value: '::backdrop' })
  fireEvent(dialog, event)
  expect(dialog).toHaveAttribute('open')
  fireEvent.animationEnd(dialog)
  expect(dialog).not.toHaveAttribute('open')
})
