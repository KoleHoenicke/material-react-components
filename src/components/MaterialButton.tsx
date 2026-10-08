import {
  forwardRef,
  type ButtonHTMLAttributes,
  type ReactNode,
} from 'react'
import { MaterialRipple } from './MaterialRipple'
import './MaterialButton.css'

export type MaterialButtonVariant = 'elevated' | 'filled' | 'outlined' | 'text' | 'tonal'
export type MaterialButtonSize = 'extra-large' | 'extra-small' | 'large' | 'medium' | 'small'
export type MaterialButtonShape = 'round' | 'square'

export type MaterialButtonProps = Omit<
  ButtonHTMLAttributes<HTMLButtonElement>,
  'children'
> & {
  children: ReactNode
  iconOnly?: boolean
  leadingIcon?: ReactNode
  selected?: boolean
  shape?: MaterialButtonShape
  size?: MaterialButtonSize
  toggle?: boolean
  trailingIcon?: ReactNode
  variant?: MaterialButtonVariant
}

export const MaterialButton = forwardRef<HTMLButtonElement, MaterialButtonProps>(
  function MaterialButton(
    {
      children,
      className,
      disabled = false,
      iconOnly = false,
      leadingIcon,
      role,
      selected = false,
      shape = 'round',
      size = 'small',
      toggle = false,
      trailingIcon,
      type = 'button',
      variant = 'filled',
      ...buttonProps
    },
    ref,
  ) {
    const radioToggle = toggle && role === 'radio'
    const typographyRole =
      size === 'medium'
        ? 'titleMedium'
        : size === 'large'
          ? 'headlineSmall'
          : size === 'extra-large'
            ? 'headlineLarge'
            : 'labelLarge'

    return (
      <button
        {...buttonProps}
        ref={ref}
        type={type}
        role={role}
        className={[
          'material-button',
          `material-button--${variant}`,
          toggle ? 'material-button--toggle' : '',
          selected ? 'material-button--selected' : '',
          className,
        ]
          .filter(Boolean)
          .join(' ')}
        aria-checked={radioToggle ? selected : buttonProps['aria-checked']}
        aria-pressed={toggle && !radioToggle ? selected : buttonProps['aria-pressed']}
        data-icon-only={iconOnly ? 'true' : undefined}
        data-material-button
        data-material-typography={
          iconOnly ? undefined : typographyRole
        }
        data-selected={toggle ? (selected ? 'true' : 'false') : undefined}
        data-shape={shape}
        data-size={size}
        data-variant={variant}
        disabled={disabled}
      >
        <MaterialRipple disabled={disabled} />
        <span className="material-button__content">
          {leadingIcon ? (
            <span className="material-button__icon material-button__icon--leading" aria-hidden="true">
              {leadingIcon}
            </span>
          ) : null}
          <span className="material-button__label">{children}</span>
          {trailingIcon ? (
            <span className="material-button__icon material-button__icon--trailing" aria-hidden="true">
              {trailingIcon}
            </span>
          ) : null}
        </span>
      </button>
    )
  },
)
