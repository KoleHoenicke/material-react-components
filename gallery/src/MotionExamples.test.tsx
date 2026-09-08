import { act, fireEvent, render, screen } from '@testing-library/react'
import { afterEach, expect, it, vi } from 'vitest'
import { MotionExamples } from './MotionExamples'

afterEach(() => { vi.useRealTimers(); vi.unstubAllGlobals() })
function media(reduced = false) {
  vi.stubGlobal('matchMedia', vi.fn(() => ({ matches: reduced, addEventListener: vi.fn(), removeEventListener: vi.fn() })))
}
it('loops after each duration plus a one-second hold, and stops while paused or hidden', () => {
  vi.useFakeTimers(); media()
  const { container, rerender } = render(<MotionExamples active scheme="expressive" onSchemeChange={() => {}} />)
  const fast = container.querySelector('.motion-tracks .motion-row')!
  act(() => vi.advanceTimersByTime(999))
  expect(fast).toHaveAttribute('data-moved', 'false')
  act(() => vi.advanceTimersByTime(1))
  expect(fast).toHaveAttribute('data-moved', 'true')
  act(() => vi.advanceTimersByTime(1349))
  expect(fast).toHaveAttribute('data-moved', 'true')
  act(() => vi.advanceTimersByTime(1))
  expect(fast).toHaveAttribute('data-moved', 'false')
  fireEvent.click(screen.getByRole('checkbox', { name: 'Pause previews' }))
  act(() => vi.advanceTimersByTime(10000))
  expect(fast).toHaveAttribute('data-moved', 'false')
  fireEvent.click(screen.getByRole('checkbox', { name: 'Pause previews' }))
  act(() => vi.advanceTimersByTime(1000))
  expect(fast).toHaveAttribute('data-moved', 'true')
  rerender(<MotionExamples active={false} scheme="expressive" onSchemeChange={() => {}} />)
  act(() => vi.advanceTimersByTime(10000))
  expect(fast).toHaveAttribute('data-moved', 'true')
})
it('keeps reduced-motion previews still', () => {
  vi.useFakeTimers(); media(true)
  render(<MotionExamples active scheme="expressive" onSchemeChange={() => {}} />)
  expect(vi.getTimerCount()).toBe(0)
})
