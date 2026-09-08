import { useState } from 'react'
import { Button, MaterialMenu, MaterialSelectableMenuItem } from '../../src'
import { GallerySymbol } from './GallerySymbol'

export function GallerySelect<T extends string>({ label, value, options, onChange }: {
  label: string
  value: T
  options: readonly T[]
  onChange: (value: T) => void
}) {
  const [open, setOpen] = useState(false)
  return <span className="gallery-select">
    <span>{label}</span>
    <MaterialMenu open={open} onOpenChange={setOpen} ariaLabel={label}
      anchor={<Button variant="tonal" aria-label={`${label}: ${value}`} trailingIcon={<GallerySymbol name="expand_more" />}>{value}</Button>}>
      {options.map(option => <MaterialSelectableMenuItem key={option} selected={value === option}
        onClick={() => onChange(option)}>{option}</MaterialSelectableMenuItem>)}
    </MaterialMenu>
  </span>
}
