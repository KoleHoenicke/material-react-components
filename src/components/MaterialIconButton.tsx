import {
  forwardRef,
  type ButtonHTMLAttributes,
  type CSSProperties,
  type MouseEvent,
  type ReactNode,
} from 'react'
import { MaterialRipple } from './MaterialRipple'
import './MaterialIconButton.css'

export type MaterialIconButtonVariant = 'standard' | 'filled' | 'tonal' | 'outlined'
export type MaterialIconButtonSize = 'extra-small' | 'small' | 'medium' | 'large' | 'extra-large'
export type MaterialIconButtonWidth = 'narrow' | 'uniform' | 'wide'
export type MaterialIconButtonShape = 'round' | 'square'
export type MaterialIconButtonCSSProperties = CSSProperties & {
  [token: `--md-icon-button-${string}`]: string | number | undefined
}

/** CSS colors, including var() references. Disabled values are final colors, including alpha. */
export type MaterialIconButtonColors = {
  containerColor?: string
  contentColor?: string
  disabledContainerColor?: string
  disabledContentColor?: string
  checkedContainerColor?: string
  checkedContentColor?: string
  outlineColor?: string
  disabledOutlineColor?: string
}

/** CSS corner radii. Pressed shape takes precedence over checked shape, as in AndroidX. */
export type MaterialIconButtonShapes = {
  shape?: string
  pressedShape?: string
  checkedShape?: string
}

/** AndroidX generated icon-button dimensions, in CSS pixels for the web port. */
export const MATERIAL_ICON_BUTTON_SIZES = {
  'extra-small': { height: 32, icon: 20, narrow: 28, uniform: 32, wide: 40, outline: 1 },
  small: { height: 40, icon: 24, narrow: 32, uniform: 40, wide: 52, outline: 1 },
  medium: { height: 56, icon: 24, narrow: 48, uniform: 56, wide: 72, outline: 1 },
  large: { height: 96, icon: 32, narrow: 64, uniform: 96, wide: 128, outline: 2 },
  'extra-large': { height: 136, icon: 40, narrow: 104, uniform: 136, wide: 184, outline: 3 },
} as const

export type MaterialIconButtonProps = Omit<
  ButtonHTMLAttributes<HTMLButtonElement>,
  'children' | 'style'
> & {
  children: ReactNode
  variant?: MaterialIconButtonVariant
  size?: MaterialIconButtonSize
  width?: MaterialIconButtonWidth
  shape?: MaterialIconButtonShape
  /** false uses the resting shape in every state, matching the static Android overload. */
  animated?: boolean
  shapes?: MaterialIconButtonShapes
  colors?: MaterialIconButtonColors
  /** Vibrant uses spec colors; inherit matches Android LocalContentColor for standard/outlined. */
  colorMode?: 'vibrant' | 'inherit'
  toggle?: boolean
  selected?: boolean
  selectedIcon?: ReactNode
  onSelectedChange?: (selected: boolean, event: MouseEvent<HTMLButtonElement>) => void
  style?: MaterialIconButtonCSSProperties
}

const colorTokens: Record<keyof MaterialIconButtonColors, string> = {
  containerColor: 'container-color',
  contentColor: 'content-color',
  disabledContainerColor: 'disabled-container-color',
  disabledContentColor: 'disabled-content-color',
  checkedContainerColor: 'selected-container-color',
  checkedContentColor: 'selected-content-color',
  outlineColor: 'outline-color',
  disabledOutlineColor: 'disabled-outline-color',
}

export const MaterialIconButton = forwardRef<HTMLButtonElement, MaterialIconButtonProps>(
  function MaterialIconButton(
    {
      children,
      variant = 'standard',
      size = 'small',
      width = 'uniform',
      shape = 'round',
      animated = true,
      shapes,
      colors,
      colorMode = 'vibrant',
      toggle = false,
      selected = false,
      selectedIcon,
      onSelectedChange,
      onClick,
      className,
      style,
      disabled = false,
      type = 'button',
      title,
      ...props
    },
    ref,
  ) {
    const dimensions = MATERIAL_ICON_BUTTON_SIZES[size]
    const tokens: MaterialIconButtonCSSProperties = {
      '--md-icon-button-container-height': `${dimensions.height}px`,
      '--md-icon-button-container-width': `${dimensions[width]}px`,
      '--md-icon-button-icon-size': `${dimensions.icon}px`,
      '--md-icon-button-outline-width': `${dimensions.outline}px`,
    }
    for (const key of Object.keys(colorTokens) as (keyof MaterialIconButtonColors)[]) {
      if (colors?.[key] !== undefined) tokens[`--md-icon-button-${colorTokens[key]}`] = colors[key]
    }
    if (shapes?.shape !== undefined) tokens['--md-icon-button-shape'] = shapes.shape
    if (shapes?.pressedShape !== undefined)
      tokens['--md-icon-button-pressed-shape'] = shapes.pressedShape
    if (shapes?.checkedShape !== undefined)
      tokens['--md-icon-button-selected-shape'] = shapes.checkedShape
    return (
      <button
        {...props}
        ref={ref}
        type={type}
        disabled={disabled}
        title={title ?? props['aria-label']}
        className={['material-icon-button', className].filter(Boolean).join(' ')}
        style={{ ...tokens, ...style }}
        data-material-icon-button=""
        data-variant={variant}
        data-size={size}
        data-width={width}
        data-shape={shape}
        data-animated={animated}
        data-color-mode={colorMode}
        data-selected={toggle ? selected : undefined}
        aria-pressed={toggle ? selected : props['aria-pressed']}
        onClick={(event) => {
          onClick?.(event)
          if (toggle && !disabled && !event.defaultPrevented) onSelectedChange?.(!selected, event)
        }}
      >
        <span className="material-icon-button__container" aria-hidden="true" />
        <MaterialRipple disabled={disabled} />
        <span className="material-icon-button__icon" aria-hidden="true">
          {toggle && selected && selectedIcon !== undefined ? selectedIcon : children}
        </span>
      </button>
    )
  },
)

export type MaterialIconToggleButtonProps = Omit<
  MaterialIconButtonProps,
  'toggle' | 'selected' | 'onSelectedChange'
> & {
  checked: boolean
  onCheckedChange: (checked: boolean, event: MouseEvent<HTMLButtonElement>) => void
}

export const MaterialIconToggleButton = forwardRef<
  HTMLButtonElement,
  MaterialIconToggleButtonProps
>(function MaterialIconToggleButton({ checked, onCheckedChange, ...props }, ref) {
  return (
    <MaterialIconButton
      {...props}
      ref={ref}
      toggle
      selected={checked}
      onSelectedChange={onCheckedChange}
    />
  )
})

function actionVariant(variant: MaterialIconButtonVariant) {
  return forwardRef<HTMLButtonElement, Omit<MaterialIconButtonProps, 'variant'>>(
    function IconButtonVariant(props, ref) {
      return <MaterialIconButton {...props} ref={ref} variant={variant} />
    },
  )
}
function toggleVariant(variant: MaterialIconButtonVariant) {
  return forwardRef<HTMLButtonElement, Omit<MaterialIconToggleButtonProps, 'variant'>>(
    function IconToggleButtonVariant(props, ref) {
      return <MaterialIconToggleButton {...props} ref={ref} variant={variant} />
    },
  )
}
export const MaterialFilledIconButton = actionVariant('filled')
export const MaterialFilledTonalIconButton = actionVariant('tonal')
export const MaterialOutlinedIconButton = actionVariant('outlined')
export const MaterialFilledIconToggleButton = toggleVariant('filled')
export const MaterialFilledTonalIconToggleButton = toggleVariant('tonal')
export const MaterialOutlinedIconToggleButton = toggleVariant('outlined')
