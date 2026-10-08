import { fireEvent, render, screen } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'
import { MaterialNavigationBar, MaterialNavigationBarItem } from './MaterialNavigationBar'

const icon = <svg aria-hidden="true" viewBox="0 0 24 24" />
describe('MaterialNavigationBar', () => {
  it('switches to the supplied selected icon and falls back to the regular icon', () => {
    const outline = <svg data-testid="outline" aria-hidden="true" />
    const filled = <svg data-testid="filled" aria-hidden="true" />
    const { rerender } = render(<MaterialNavigationBarItem icon={outline} selectedIcon={filled} label="Home" selected={false} />)
    expect(screen.getByTestId('outline')).toBeInTheDocument()
    expect(screen.queryByTestId('filled')).not.toBeInTheDocument()

    rerender(<MaterialNavigationBarItem icon={outline} selectedIcon={filled} label="Home" selected />)
    expect(screen.getByTestId('filled')).toBeInTheDocument()
    expect(screen.queryByTestId('outline')).not.toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Home' })).toHaveAttribute('aria-current', 'page')

    rerender(<MaterialNavigationBarItem icon={outline} selectedIcon={filled} label="Home" selected={false} />)
    expect(screen.getByTestId('outline')).toBeInTheDocument()
    expect(screen.queryByTestId('filled')).not.toBeInTheDocument()

    rerender(<MaterialNavigationBarItem icon={outline} label="Home" selected />)
    expect(screen.getByTestId('outline')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Home' })).toHaveAttribute('aria-current', 'page')
  })

  it('marks the current destination without using a selected text-button container', () => {
    const click = vi.fn()
    render(<MaterialNavigationBar aria-label="Main">
      <MaterialNavigationBarItem icon={icon} label="Dashboard" selected onClick={click} />
      <MaterialNavigationBarItem icon={icon} label="Settings" selected={false} />
    </MaterialNavigationBar>)
    expect(screen.getByRole('navigation', { name: 'Main' })).toHaveAttribute('data-safe-area', 'true')
    const item = screen.getByRole('button', { name: 'Dashboard' })
    expect(item).toHaveAttribute('aria-current', 'page')
    expect(item).not.toHaveClass('material-button')
    expect(screen.getByRole('button', { name: 'Settings' })).not.toHaveAttribute('aria-current')
    fireEvent.click(item)
    expect(click).toHaveBeenCalledOnce()
  })
  it('moves focus through enabled destinations and wraps, without changing selection', () => {
    const click = vi.fn()
    render(<MaterialNavigationBar>
      <MaterialNavigationBarItem icon={icon} label="Dashboard" selected onClick={click} />
      <MaterialNavigationBarItem icon={icon} label="Leads" selected={false} disabled />
      <MaterialNavigationBarItem icon={icon} label="Settings" selected={false} onClick={click} />
    </MaterialNavigationBar>)
    const first = screen.getByRole('button', { name: 'Dashboard' })
    const last = screen.getByRole('button', { name: 'Settings' })
    first.focus()
    fireEvent.keyDown(first, { key: 'ArrowRight' })
    expect(last).toHaveFocus()
    fireEvent.keyDown(last, { key: 'ArrowRight' })
    expect(first).toHaveFocus()
    fireEvent.keyDown(first, { key: 'End' })
    expect(last).toHaveFocus()
    expect(click).not.toHaveBeenCalled()
  })
  it('reverses arrow navigation in RTL and honors a prevented key event', () => {
    render(<MaterialNavigationBar style={{ direction: 'rtl' }} onKeyDown={(e) => { if (e.key === 'Home') e.preventDefault() }}>
      <MaterialNavigationBarItem icon={icon} label="One" selected />
      <MaterialNavigationBarItem icon={icon} label="Two" selected={false} />
      <MaterialNavigationBarItem icon={icon} label="Three" selected={false} />
    </MaterialNavigationBar>)
    const first = screen.getByRole('button', { name: 'One' })
    const last = screen.getByRole('button', { name: 'Three' })
    first.focus()
    fireEvent.keyDown(first, { key: 'ArrowRight' })
    expect(last).toHaveFocus()
    fireEvent.keyDown(last, { key: 'Home' })
    expect(last).toHaveFocus()
  })
  it('supports icon-only accessible labels and optional hidden inactive labels', () => {
    render(<MaterialNavigationBar safeAreaInsets={false}>
      <MaterialNavigationBarItem icon={icon} selected aria-label="Dashboard" />
      <MaterialNavigationBarItem icon={icon} label="Settings" selected={false} alwaysShowLabel={false} />
    </MaterialNavigationBar>)
    expect(screen.getByRole('navigation')).toHaveAttribute('data-safe-area', 'false')
    expect(screen.getByRole('button', { name: 'Dashboard' })).toHaveAttribute('type', 'button')
    expect(screen.getByRole('button', { name: 'Settings' })).toHaveAttribute('data-label-visible', 'false')
  })
})
