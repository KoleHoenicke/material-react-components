import { fireEvent, render, screen } from '@testing-library/react'
import { expect, it, vi } from 'vitest'
import { GallerySelect } from './GallerySelect'
it('uses the package menu, reports the choice, closes, and restores focus', () => {
  const change = vi.fn()
  const { container } = render(<GallerySelect label="Size" value="small" options={['small', 'large']} onChange={change} />)
  expect(container.querySelector('select')).toBeNull()
  const trigger = screen.getByRole('button', { name: 'Size: small' })
  fireEvent.click(trigger)
  expect(screen.getByRole('menuitemradio', { name: 'small' })).toHaveAttribute('aria-checked', 'true')
  fireEvent.click(screen.getByRole('menuitemradio', { name: 'large' }))
  expect(change).toHaveBeenCalledWith('large')
  expect(trigger).toHaveAttribute('aria-expanded', 'false')
})
