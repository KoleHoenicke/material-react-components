import { GallerySelect } from './GallerySelect'
import { GallerySymbol } from './GallerySymbol'
import { useState } from 'react'
import {
  Checkbox,
  IconButton,
  IconToggleButton,
  type MaterialIconButtonSize,
  type MaterialIconButtonVariant,
  type MaterialIconButtonWidth,
} from '../../src'

const sizes: MaterialIconButtonSize[] = ['extra-small', 'small', 'medium', 'large', 'extra-large']
const variants: MaterialIconButtonVariant[] = ['standard', 'filled', 'tonal', 'outlined']
const widths: MaterialIconButtonWidth[] = ['narrow', 'uniform', 'wide']
function Star({ filled = false }: { filled?: boolean }) {
  return <GallerySymbol name="star" filled={filled} />
}

export function IconButtonExamples() {
  const [selected, setSelected] = useState(false)
  const [square, setSquare] = useState(false)
  const [disabled, setDisabled] = useState(false)
  const [width, setWidth] = useState<MaterialIconButtonWidth>('uniform')
  return (
    <div id="icon-buttons">
      <div className="stage-toolbar" style={{ gap: 16, flexWrap: 'wrap' }}>
        <label>
          <Checkbox
            checked={square}
            onChange={(event) => setSquare(event.target.checked)}
          />{' '}
          Square shape
        </label>
        <label>
          <Checkbox
            checked={disabled}
            onChange={(event) => setDisabled(event.target.checked)}
          />{' '}
          Disable icon buttons
        </label>
        <label>
          <Checkbox
            checked={selected}
            onChange={(event) => setSelected(event.target.checked)}
          />{' '}
          Select all toggles
        </label>
        <GallerySelect label="Icon button width" value={width} options={widths} onChange={setWidth} />
      </div>
      <p>
        Each row pairs an action with a controlled toggle. Activate any toggle with a pointer,
        Space, or Enter. Hover for its native tooltip.
      </p>
      <div style={{ display: 'grid', gap: 24 }}>
        {sizes.map((size) => (
          <div key={size}>
            <h3 data-material-typography="titleMedium">{size}</h3>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 24, alignItems: 'start' }}>
              {variants.map((variant) => (
                <div key={variant} style={{ display: 'grid', gap: 8 }}>
                  <span data-material-typography="labelMedium">{variant}</span>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
                    <IconButton
                      aria-label={`${size} ${variant} action`}
                      variant={variant}
                      size={size}
                      width={width}
                      shape={square ? 'square' : 'round'}
                      disabled={disabled}
                    >
                      <Star filled />
                    </IconButton>
                    <IconToggleButton
                      aria-label={`${size} ${variant} favorite`}
                      variant={variant}
                      size={size}
                      width={width}
                      shape={square ? 'square' : 'round'}
                      disabled={disabled}
                      checked={selected}
                      onCheckedChange={setSelected}
                      selectedIcon={<Star filled />}
                    >
                      <Star />
                    </IconToggleButton>
                  </div>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
