import { forwardRef, type ButtonHTMLAttributes, type HTMLAttributes, type ReactNode } from 'react'
import { MaterialRipple } from './MaterialRipple'
import './MaterialNavigationBar.css'

export type MaterialNavigationBarProps = HTMLAttributes<HTMLElement> & {
  children: ReactNode
  safeAreaInsets?: boolean
}

/** AndroidX NavigationBar's tall layout, with three to five primary destinations. */
export const MaterialNavigationBar = forwardRef<HTMLElement, MaterialNavigationBarProps>(
  function MaterialNavigationBar({ children, className, safeAreaInsets = true, onKeyDown, ...props }, ref) {
    return (
      <nav {...props} ref={ref} className={['material-navigation-bar', className].filter(Boolean).join(' ')}
        data-material-navigation-bar="" data-safe-area={safeAreaInsets}
        onKeyDown={(event) => {
          onKeyDown?.(event)
          if (event.defaultPrevented || event.altKey || event.ctrlKey || event.metaKey) return
          const items = Array.from(event.currentTarget.querySelectorAll<HTMLButtonElement>('[data-material-navigation-bar-item]:not(:disabled)'))
          const index = items.indexOf(event.target as HTMLButtonElement)
          if (index < 0 || !['ArrowLeft', 'ArrowRight', 'Home', 'End'].includes(event.key)) return
          event.preventDefault()
          const rtl = getComputedStyle(event.currentTarget).direction === 'rtl'
          const step = (event.key === 'ArrowRight' ? 1 : -1) * (rtl ? -1 : 1)
          const next = event.key === 'Home' ? 0 : event.key === 'End' ? items.length - 1 : (index + step + items.length) % items.length
          items[next]?.focus()
        }}
      >{children}</nav>
    )
  },
)

export type MaterialNavigationBarItemProps = Omit<ButtonHTMLAttributes<HTMLButtonElement>, 'children'> & {
  icon: ReactNode
  selectedIcon?: ReactNode
  label?: ReactNode
  selected: boolean
  alwaysShowLabel?: boolean
}

export const MaterialNavigationBarItem = forwardRef<HTMLButtonElement, MaterialNavigationBarItemProps>(
  function MaterialNavigationBarItem({ icon, selectedIcon, label, selected, alwaysShowLabel = true, className, disabled, ...props }, ref) {
    return (
      <button {...props} ref={ref} type="button" disabled={disabled} aria-label={props['aria-label'] ?? (typeof label === 'string' ? label : undefined)} aria-current={selected ? 'page' : undefined}
        className={['material-navigation-bar-item', className].filter(Boolean).join(' ')}
        data-material-navigation-bar-item="" data-selected={selected} data-label-visible={label != null && (alwaysShowLabel || selected)}
      >
        <MaterialRipple disabled={disabled} />
        <span className="material-navigation-bar-item__indicator" aria-hidden="true">
          <span className="material-navigation-bar-item__icon">{selected ? selectedIcon ?? icon : icon}</span>
        </span>
        {label != null ? <span className="material-navigation-bar-item__label" data-material-typography="labelMedium">{label}</span> : null}
      </button>
    )
  },
)
