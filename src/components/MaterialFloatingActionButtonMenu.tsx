import {
  Children,
  createContext,
  forwardRef,
  useContext,
  useEffect,
  useId,
  useLayoutEffect,
  useRef,
  type ButtonHTMLAttributes,
  type CSSProperties,
  type HTMLAttributes,
  type KeyboardEvent,
  type MouseEvent,
  type ReactNode,
  type Ref,
} from 'react'

import { useFabMenuStagger } from '../internal/useFabMenuStagger'
import { MaterialRipple } from './MaterialRipple'
import './MaterialFloatingActionButtonMenu.css'

export type MaterialFabMenuColor = 'primary' | 'secondary' | 'tertiary'
export type MaterialFabMenuAlignment = 'center' | 'end' | 'start'
export type MaterialFabMenuTriggerSize = 'large' | 'medium' | 'regular'

export type MaterialFabMenuStyle = CSSProperties & {
  '--md-fab-menu-close-container-color'?: string
  '--md-fab-menu-close-container-elevation'?: string
  '--md-fab-menu-close-container-shape'?: string
  '--md-fab-menu-close-container-size'?: string
  '--md-fab-menu-close-content-color'?: string
  '--md-fab-menu-close-icon-size'?: string
  '--md-fab-menu-close-list-space'?: string
  '--md-fab-menu-focus-indicator-color'?: string
  '--md-fab-menu-focus-indicator-offset'?: string
  '--md-fab-menu-focus-indicator-thickness'?: string
  '--md-fab-menu-focus-state-layer-opacity'?: number | string
  '--md-fab-menu-hover-state-layer-opacity'?: number | string
  '--md-fab-menu-item-between-space'?: string
  '--md-fab-menu-item-container-color'?: string
  '--md-fab-menu-item-container-elevation'?: string
  '--md-fab-menu-item-container-height'?: string
  '--md-fab-menu-item-container-shape'?: string
  '--md-fab-menu-item-content-color'?: string
  '--md-fab-menu-item-icon-label-space'?: string
  '--md-fab-menu-item-icon-size'?: string
  '--md-fab-menu-item-label-font'?: string
  '--md-fab-menu-item-label-line-height'?: string
  '--md-fab-menu-item-label-max-width'?: string
  '--md-fab-menu-item-label-size'?: string
  '--md-fab-menu-item-label-tracking'?: string
  '--md-fab-menu-item-label-weight'?: number | string
  '--md-fab-menu-item-leading-space'?: string
  '--md-fab-menu-item-min-width'?: string
  '--md-fab-menu-item-trailing-space'?: string
  '--md-fab-menu-max-height'?: string
  '--md-fab-menu-padding-bottom'?: string
  '--md-fab-menu-padding-inline'?: string
  '--md-fab-menu-pressed-state-layer-opacity'?: number | string
  '--md-fab-menu-trigger-container-color'?: string
  '--md-fab-menu-trigger-container-shape'?: string
  '--md-fab-menu-trigger-container-size'?: string
  '--md-fab-menu-trigger-content-color'?: string
  '--md-fab-menu-trigger-icon-size'?: string
}

export type MaterialToggleFabStyle = CSSProperties & MaterialFabMenuStyle

type MaterialToggleFabAccessibilityLabel =
  | {
      'aria-label': string
      'aria-labelledby'?: string
    }
  | {
      'aria-label'?: string
      'aria-labelledby': string
    }

export type MaterialToggleFloatingActionButtonProps = Omit<
  ButtonHTMLAttributes<HTMLButtonElement>,
  'children' | 'color' | 'style'
> &
  MaterialToggleFabAccessibilityLabel & {
    checked: boolean
    checkedIcon: ReactNode
    color?: MaterialFabMenuColor
    icon: ReactNode
    onCheckedChange: (checked: boolean) => void
    size?: MaterialFabMenuTriggerSize
    style?: MaterialToggleFabStyle
    visible?: boolean
  }

export type MaterialFloatingActionButtonMenuProps = Omit<
  HTMLAttributes<HTMLDivElement>,
  'children' | 'color' | 'onChange' | 'style'
> & {
  alignment?: MaterialFabMenuAlignment
  children: ReactNode
  closeIcon: ReactNode
  closeOnItemClick?: boolean
  closeOnOutsideClick?: boolean
  color?: MaterialFabMenuColor
  expanded: boolean
  icon: ReactNode
  menuLabel?: string
  onExpandedChange: (expanded: boolean) => void
  size?: MaterialFabMenuTriggerSize
  style?: MaterialFabMenuStyle
  toggleLabel: string
  toggleProps?: Omit<
    MaterialToggleFloatingActionButtonProps,
    'checked' | 'checkedIcon' | 'color' | 'icon' | 'onCheckedChange' | 'size'
  >
  toggleRef?: Ref<HTMLButtonElement>
}

export type MaterialFloatingActionButtonMenuItemProps = Omit<
  ButtonHTMLAttributes<HTMLButtonElement>,
  'children' | 'color' | 'style'
> & {
  children: ReactNode
  icon: ReactNode
  style?: MaterialFabMenuStyle
}

type FabMenuContextValue = {
  closeOnItemClick: boolean
  expanded: boolean
  focusToggle: () => void
  requestClose: () => void
}

const FabMenuContext = createContext<FabMenuContextValue | null>(null)

function assignRef<T>(ref: Ref<T> | undefined, value: T | null) {
  if (typeof ref === 'function') {
    ref(value)
  } else if (ref) {
    ref.current = value
  }
}

function joinClassNames(...classNames: Array<string | undefined>) {
  return classNames.filter(Boolean).join(' ')
}

export const MaterialToggleFloatingActionButton = forwardRef<
  HTMLButtonElement,
  MaterialToggleFloatingActionButtonProps
>(function MaterialToggleFloatingActionButton(
  {
    'aria-hidden': ariaHidden,
    'aria-label': ariaLabel,
    'aria-labelledby': ariaLabelledBy,
    checked,
    checkedIcon,
    className,
    color = 'primary',
    disabled = false,
    icon,
    onCheckedChange,
    onClick,
    size = 'regular',
    style,
    tabIndex,
    type = 'button',
    visible = true,
    ...buttonProps
  },
  ref,
) {
  const menu = useContext(FabMenuContext)
  const handleClick = (event: MouseEvent<HTMLButtonElement>) => {
    onClick?.(event)
    if (!event.defaultPrevented) onCheckedChange(!checked)
  }

  return (
    <span
      className={joinClassNames('material-toggle-fab', className)}
      data-checked={checked ? 'true' : 'false'}
      data-color={color}
      data-material-toggle-fab
      data-token-scope={menu ? undefined : 'true'}
      data-size={size}
      data-visible={visible ? 'true' : 'false'}
      style={style}
    >
      <button
        {...buttonProps}
        ref={ref}
        aria-expanded={checked}
        aria-haspopup="menu"
        aria-hidden={visible ? ariaHidden : true}
        aria-label={ariaLabel}
        aria-labelledby={ariaLabelledBy}
        className="material-toggle-fab__button"
        data-checked={checked ? 'true' : 'false'}
        disabled={disabled}
        onClick={handleClick}
        tabIndex={visible ? tabIndex : -1}
        type={type}
      >
        <MaterialRipple disabled={disabled || !visible} />
        <span className="material-toggle-fab__focus-ring" aria-hidden="true" />
        <span className="material-toggle-fab__icon material-toggle-fab__icon--initial" aria-hidden="true">
          {icon}
        </span>
        <span className="material-toggle-fab__icon material-toggle-fab__icon--checked" aria-hidden="true">
          {checkedIcon}
        </span>
      </button>
    </span>
  )
})

export const MaterialFloatingActionButtonMenu = forwardRef<
  HTMLDivElement,
  MaterialFloatingActionButtonMenuProps
>(function MaterialFloatingActionButtonMenu(
  {
    alignment = 'end',
    children,
    className,
    closeIcon,
    closeOnItemClick = true,
    closeOnOutsideClick = true,
    color = 'primary',
    expanded,
    icon,
    menuLabel,
    onExpandedChange,
    onKeyDown,
    size = 'regular',
    style,
    toggleLabel,
    toggleProps,
    toggleRef,
    ...divProps
  },
  forwardedRef,
) {
  const generatedId = useId()
  const menuId = toggleProps?.['aria-controls'] ?? `${generatedId}-menu`
  const rootRef = useRef<HTMLDivElement | null>(null)
  const internalToggleRef = useRef<HTMLButtonElement | null>(null)
  const wasExpandedRef = useRef(expanded)
  const items = Children.toArray(children)
  const visibleCount = useFabMenuStagger(expanded, items.length, rootRef)

  const requestClose = () => onExpandedChange(false)

  useEffect(() => {
    if (!expanded && wasExpandedRef.current) {
      const activeElement = document.activeElement
      if (
        activeElement instanceof HTMLElement &&
        rootRef.current?.contains(activeElement) &&
        activeElement !== internalToggleRef.current
      ) {
        internalToggleRef.current?.focus()
      }
    }
    wasExpandedRef.current = expanded
  }, [expanded])

  useEffect(() => {
    if (!expanded || !closeOnOutsideClick) return

    const handlePointerDown = (event: PointerEvent) => {
      const target = event.target
      if (target instanceof Node && !rootRef.current?.contains(target)) requestClose()
    }

    document.addEventListener('pointerdown', handlePointerDown)
    return () => document.removeEventListener('pointerdown', handlePointerDown)
  }, [closeOnOutsideClick, expanded, onExpandedChange])

  const focusableItems = () =>
    Array.from(
      rootRef.current?.querySelectorAll<HTMLButtonElement>(
        '[data-material-fab-menu-item]:not(:disabled)',
      ) ?? [],
    )

  const handleKeyDown = (event: KeyboardEvent<HTMLDivElement>) => {
    onKeyDown?.(event)
    if (event.defaultPrevented || !expanded) return

    const toggle = internalToggleRef.current
    const menuItems = focusableItems()
    const target = event.target
    const itemIndex = target instanceof HTMLElement ? menuItems.indexOf(target as HTMLButtonElement) : -1

    if (event.key === 'Escape') {
      event.preventDefault()
      requestClose()
      toggle?.focus()
      return
    }

    if (target === toggle && event.key === 'ArrowDown') {
      event.preventDefault()
      menuItems[0]?.focus()
      return
    }

    if (itemIndex < 0) return

    if (event.key === 'ArrowDown' && itemIndex < menuItems.length - 1) {
      event.preventDefault()
      menuItems[itemIndex + 1]?.focus()
    } else if (event.key === 'ArrowUp') {
      event.preventDefault()
      if (itemIndex === 0) toggle?.focus()
      else menuItems[itemIndex - 1]?.focus()
    } else if (event.key === 'Home') {
      event.preventDefault()
      menuItems[0]?.focus()
    } else if (event.key === 'End') {
      event.preventDefault()
      menuItems.at(-1)?.focus()
    }
  }

  const contextValue: FabMenuContextValue = {
    closeOnItemClick,
    expanded,
    focusToggle: () => internalToggleRef.current?.focus(),
    requestClose,
  }

  return (
    <FabMenuContext.Provider value={contextValue}>
      <div
        {...divProps}
        ref={(node) => {
          rootRef.current = node
          assignRef(forwardedRef, node)
        }}
        className={joinClassNames('material-fab-menu', className)}
        data-alignment={alignment}
        data-color={color}
        data-expanded={expanded ? 'true' : 'false'}
        data-item-count={items.length}
        data-material-fab-menu
        data-size={size}
        onKeyDown={handleKeyDown}
        style={style}
      >
        <MaterialToggleFloatingActionButton
          {...toggleProps}
          ref={(node) => {
            internalToggleRef.current = node
            assignRef(toggleRef, node)
          }}
          aria-controls={menuId}
          aria-label={toggleLabel}
          checked={expanded}
          checkedIcon={closeIcon}
          color={color}
          icon={icon}
          onCheckedChange={onExpandedChange}
          size={size}
        />
        <div
          id={menuId}
          aria-hidden={expanded ? undefined : true}
          aria-label={menuLabel ?? toggleLabel}
          className="material-fab-menu__items"
          data-expanded={expanded ? 'true' : 'false'}
          inert={expanded ? undefined : true}
          role="menu"
        >
          {items.map((item, index) => (
            <div
              className="material-fab-menu__item-slot"
              key={index}
              role="none"
              data-visible={index >= items.length - visibleCount ? 'true' : 'false'}
            >
              {item}
            </div>
          ))}
        </div>
      </div>
    </FabMenuContext.Provider>
  )
})

export const MaterialFloatingActionButtonMenuItem = forwardRef<
  HTMLButtonElement,
  MaterialFloatingActionButtonMenuItemProps
>(function MaterialFloatingActionButtonMenuItem(
  {
    children,
    className,
    disabled = false,
    icon,
    onClick,
    style,
    tabIndex,
    type = 'button',
    ...buttonProps
  },
  ref,
) {
  const contentRef = useRef<HTMLSpanElement>(null)
  useLayoutEffect(() => {
    const content = contentRef.current
    const slot = content?.closest<HTMLElement>('.material-fab-menu__item-slot')
    if (!content || !slot) return
    const measure = () => slot.style.setProperty('--md-fab-menu-item-width', `${content.getBoundingClientRect().width}px`)
    measure()
    const observer = typeof ResizeObserver === 'undefined' ? null : new ResizeObserver(measure)
    observer?.observe(content)
    return () => observer?.disconnect()
  }, [])
  const menu = useContext(FabMenuContext)
  const interactive = menu?.expanded ?? true

  const handleClick = (event: MouseEvent<HTMLButtonElement>) => {
    onClick?.(event)
    if (!event.defaultPrevented && menu?.closeOnItemClick) {
      menu.requestClose()
      menu.focusToggle()
    }
  }

  return (
    <button
      {...buttonProps}
      ref={ref}
      className={joinClassNames('material-fab-menu-item', className)}
      data-material-fab-menu-item
      data-token-scope={menu ? undefined : 'true'}
      disabled={disabled}
      onClick={handleClick}
      role="menuitem"
      style={style}
      tabIndex={interactive ? tabIndex : -1}
      type={type}
    >
      <MaterialRipple disabled={disabled || !interactive} />
      <span className="material-fab-menu-item__focus-ring" aria-hidden="true" />
      <span ref={contentRef} className="material-fab-menu-item__content">
        <span className="material-fab-menu-item__icon" aria-hidden="true">
          {icon}
        </span>
        <span className="material-fab-menu-item__label" data-material-typography="titleMedium">
          {children}
        </span>
      </span>
    </button>
  )
})
