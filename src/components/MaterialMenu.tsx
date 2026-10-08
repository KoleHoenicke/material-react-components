import {
  Children,
  cloneElement,
  createContext,
  forwardRef,
  isValidElement,
  useContext,
  useEffect,
  useId,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
  type AnchorHTMLAttributes,
  type ButtonHTMLAttributes,
  type CSSProperties,
  type HTMLAttributes,
  type KeyboardEvent,
  type MouseEvent,
  type PointerEvent as ReactPointerEvent,
  type ReactElement,
  type ReactNode,
  type Ref,
  type RefObject,
} from 'react'
import { createPortal } from 'react-dom'

import { MaterialHorizontalDivider } from './MaterialDivider'
import { MaterialRipple } from './MaterialRipple'
import './MaterialMenu.css'

export type MaterialMenuVariant = 'baseline' | 'expressive'
export type MaterialMenuColor = 'standard' | 'vibrant'
export type MaterialMenuPlacement = 'above' | 'below' | 'end' | 'left' | 'right' | 'start'
export type MaterialMenuDensity = 'auto' | 'compact' | 'touch' | 0 | -1 | -2 | -3
export type MaterialMenuInitialFocus = 'first' | 'last' | 'menu' | 'none'
export type MaterialMenuDismissReason =
  | 'escape'
  | 'focusout'
  | 'outside-click'
  | 'selection'
  | 'trigger'

export type MaterialMenuOffset = {
  x?: number
  y?: number
}

export type MaterialMenuPoint = {
  x: number
  y: number
}

export type MaterialMenuStyle = CSSProperties & {
  '--md-menu-z-index'?: number | string
  '--md-menu-container-color'?: string
  '--md-menu-container-elevation'?: string
  '--md-menu-container-max-width'?: string
  '--md-menu-container-min-width'?: string
  '--md-menu-container-shape'?: string
  '--md-menu-divider-color'?: string
  '--md-menu-focus-indicator-color'?: string
  '--md-menu-focus-indicator-offset'?: string
  '--md-menu-focus-indicator-thickness'?: string
  '--md-menu-group-container-color'?: string
  '--md-menu-group-gap'?: string
  '--md-menu-group-padding'?: string
  '--md-menu-group-shape'?: string
  '--md-menu-horizontal-margin'?: string
  '--md-menu-item-container-color'?: string
  '--md-menu-item-gap'?: string
  '--md-menu-item-height'?: string
  '--md-menu-item-horizontal-padding'?: string
  '--md-menu-item-label-color'?: string
  '--md-menu-item-leading-icon-color'?: string
  '--md-menu-item-leading-icon-size'?: string
  '--md-menu-item-selected-container-color'?: string
  '--md-menu-item-selected-content-color'?: string
  '--md-menu-item-selected-shape'?: string
  '--md-menu-item-shape'?: string
  '--md-menu-item-supporting-color'?: string
  '--md-menu-item-trailing-color'?: string
  '--md-menu-item-vertical-padding'?: string
  '--md-menu-scrollbar-color'?: string
  '--md-menu-vertical-margin'?: string
}

type MaterialMenuAnchorProps = Record<string, unknown> & {
  'aria-controls'?: string
  'aria-expanded'?: boolean
  'aria-haspopup'?: string
  id?: string
  onClick?: (event: MouseEvent<HTMLElement>) => void
  onKeyDown?: (event: KeyboardEvent<HTMLElement>) => void
}

export type MaterialMenuProps = Omit<
  HTMLAttributes<HTMLSpanElement>,
  'children' | 'color' | 'onChange' | 'style'
> & {
  anchor?: ReactElement<MaterialMenuAnchorProps>
  anchorPoint?: MaterialMenuPoint
  anchorRef?: RefObject<HTMLElement | null>
  ariaLabel?: string
  children: ReactNode
  closeOnFocusOut?: boolean
  closeOnOutsideClick?: boolean
  color?: MaterialMenuColor
  density?: MaterialMenuDensity
  initialFocus?: MaterialMenuInitialFocus
  loopNavigation?: boolean
  motion?: 'instant' | 'material'
  offset?: MaterialMenuOffset
  onOpenChange: (open: boolean, reason: MaterialMenuDismissReason) => void
  open: boolean
  placement?: MaterialMenuPlacement
  portalContainer?: Element | DocumentFragment | null
  restoreFocus?: boolean
  surfaceClassName?: string
  surfaceProps?: Omit<HTMLAttributes<HTMLDivElement>, 'children' | 'role' | 'style'>
  surfaceStyle?: MaterialMenuStyle
  variant?: MaterialMenuVariant
}

export type MaterialMenuItemElement = HTMLAnchorElement | HTMLButtonElement

type SharedMenuItemProps = {
  badge?: ReactNode
  children: ReactNode
  color?: MaterialMenuColor
  keepOpen?: boolean
  leadingIcon?: ReactNode
  selected?: boolean
  selectedLeadingIcon?: ReactNode
  shapePosition?: 'first' | 'last' | 'middle' | 'single'
  style?: MaterialMenuStyle
  supportingText?: ReactNode
  textValue?: string
  trailingIcon?: ReactNode
  trailingText?: ReactNode
  variant?: MaterialMenuVariant
}

export type MaterialMenuItemProps = Omit<
  ButtonHTMLAttributes<HTMLButtonElement>,
  'children' | 'color' | 'disabled' | 'style'
> &
  SharedMenuItemProps & {
    disabled?: boolean
    download?: AnchorHTMLAttributes<HTMLAnchorElement>['download']
    href?: string
    rel?: string
    target?: AnchorHTMLAttributes<HTMLAnchorElement>['target']
  }

export type MaterialCheckableMenuItemProps = Omit<
  MaterialMenuItemProps,
  'aria-checked' | 'onClick' | 'selected'
> & {
  checked: boolean
  onCheckedChange: (checked: boolean) => void
  onClick?: MaterialMenuItemProps['onClick']
}

export type MaterialSelectableMenuItemProps = Omit<
  MaterialMenuItemProps,
  'aria-checked' | 'role'
> & {
  selected: boolean
}

export type MaterialMenuGroupProps = Omit<
  HTMLAttributes<HTMLDivElement>,
  'children' | 'color' | 'style'
> & {
  children: ReactNode
  color?: MaterialMenuColor
  label?: ReactNode
  position?: 'first' | 'last' | 'middle' | 'single'
  style?: MaterialMenuStyle
  variant?: MaterialMenuVariant
}

export type MaterialMenuGroupLabelProps = Omit<
  HTMLAttributes<HTMLDivElement>,
  'children'
> & {
  children: ReactNode
}

export type MaterialMenuDividerProps = Omit<
  HTMLAttributes<HTMLDivElement>,
  'children' | 'color' | 'style'
> & {
  color?: CSSProperties['color']
  style?: MaterialMenuStyle
}

export type MaterialMenuSubmenuProps = Omit<
  MaterialMenuItemProps,
  'aria-expanded' | 'aria-haspopup' | 'keepOpen' | 'onClick' | 'selected' | 'trailingIcon'
> & {
  children: ReactNode
  closeDelay?: number
  itemChildren: ReactNode
  itemProps?: Omit<MaterialMenuItemProps, 'children'>
  onOpenChange?: (open: boolean) => void
  open?: boolean
  openDelay?: number
  submenuLabel?: string
  submenuStyle?: MaterialMenuStyle
}

type MenuTreeContextValue = {
  closeTree: (reason: MaterialMenuDismissReason) => void
  treeId: string
}

type MenuContextValue = {
  color: MaterialMenuColor
  depth: number
  closeMenu: (reason: MaterialMenuDismissReason) => void
  closeTree: (reason: MaterialMenuDismissReason) => void
  open: boolean
  variant: MaterialMenuVariant
}

const MenuTreeContext = createContext<MenuTreeContextValue | null>(null)
const MenuContext = createContext<MenuContextValue | null>(null)
const MenuItemPositionContext = createContext<SharedMenuItemProps['shapePosition']>(undefined)
const MenuGroupPositionContext = createContext<MaterialMenuGroupProps['position']>(undefined)

function joinClassNames(...classNames: Array<string | undefined>) {
  return classNames.filter(Boolean).join(' ')
}

function assignRef<T>(ref: Ref<T> | undefined, value: T | null) {
  if (typeof ref === 'function') ref(value)
  else if (ref) ref.current = value
}

function densityAttribute(density: MaterialMenuDensity) {
  return typeof density === 'number' ? String(density) : density
}

function getMenuItems(surface: HTMLElement | null) {
  if (!surface) return []
  return Array.from(
    surface.querySelectorAll<MaterialMenuItemElement>('[data-material-menu-item]'),
  ).filter((item) => item.closest('[data-material-menu-surface]') === surface)
}

function focusItem(items: MaterialMenuItemElement[], index: number) {
  if (!items.length) return
  const normalized = ((index % items.length) + items.length) % items.length
  items.forEach((item, itemIndex) => {
    item.tabIndex = itemIndex === normalized ? 0 : -1
  })
  items[normalized]?.focus()
}

function getElementText(element: HTMLElement) {
  return element.dataset.textValue?.trim() || element.textContent?.trim() || ''
}

function copyMaterialProperties(from: HTMLElement, to: HTMLElement, style?: MaterialMenuStyle) {
  const computed = window.getComputedStyle(from)
  const explicit = new Set(Object.keys(style ?? {}))

  for (let index = 0; index < computed.length; index += 1) {
    const property = computed.item(index)
    if (
      (property.startsWith('--md-') ||
        property.startsWith('--m3-') ||
        property.startsWith('--material-')) &&
      !explicit.has(property)
    ) {
      to.style.setProperty(property, computed.getPropertyValue(property))
    }
  }

  to.style.colorScheme = computed.colorScheme
  to.style.fontFamily = computed.fontFamily
}

function pointRect(point: MaterialMenuPoint): DOMRect {
  return new DOMRect(point.x, point.y, 0, 0)
}

function menuLength(surface: HTMLElement, property: string, fallback: number) {
  const parsed = Number.parseFloat(window.getComputedStyle(surface).getPropertyValue(property))
  return Number.isFinite(parsed) ? parsed : fallback
}

function calculateTransformOrigin(anchor: DOMRect, menu: DOMRect) {
  let x = 0
  let y = 0

  if (menu.left >= anchor.right) x = 0
  else if (menu.right <= anchor.left) x = 1
  else if (menu.width > 0) {
    const center = (Math.max(anchor.left, menu.left) + Math.min(anchor.right, menu.right)) / 2
    x = (center - menu.left) / menu.width
  }

  if (menu.top >= anchor.bottom) y = 0
  else if (menu.bottom <= anchor.top) y = 1
  else if (menu.height > 0) {
    const center = (Math.max(anchor.top, menu.top) + Math.min(anchor.bottom, menu.bottom)) / 2
    y = (center - menu.top) / menu.height
  }

  return { x, y }
}

function positionSurface(
  surface: HTMLElement,
  anchor: DOMRect,
  placement: MaterialMenuPlacement,
  offset: MaterialMenuOffset,
) {
  const rect = surface.getBoundingClientRect()
  const direction = window.getComputedStyle(surface).direction
  const horizontalMargin = menuLength(surface, '--md-menu-horizontal-margin', 8)
  const verticalMargin = menuLength(surface, '--md-menu-vertical-margin', 48)
  const xOffset = (offset.x ?? 0) * (direction === 'rtl' ? -1 : 1)
  const yOffset = offset.y ?? 0
  const maxX = Math.max(horizontalMargin, window.innerWidth - horizontalMargin - rect.width)
  const maxY = Math.max(verticalMargin, window.innerHeight - verticalMargin - rect.height)
  const belowY = anchor.bottom + yOffset
  const aboveY = anchor.top - rect.height + yOffset
  const alignStartX = direction === 'rtl' ? anchor.right - rect.width - xOffset : anchor.left + xOffset
  const alignEndX = direction === 'rtl' ? anchor.left - xOffset : anchor.right - rect.width + xOffset
  const physicalRightX = anchor.right + xOffset
  const physicalLeftX = anchor.left - rect.width + xOffset

  let left = alignStartX
  let top = belowY

  if (placement === 'above') {
    top = aboveY >= verticalMargin ? aboveY : belowY
  } else if (placement === 'below') {
    top = belowY + rect.height <= window.innerHeight - verticalMargin ? belowY : aboveY
  } else {
    const logicalEnd = placement === 'end'
    const logicalStart = placement === 'start'
    const preferRight =
      placement === 'right' || (logicalEnd && direction !== 'rtl') || (logicalStart && direction === 'rtl')
    const preferredX = preferRight ? physicalRightX : physicalLeftX
    const alternateX = preferRight ? physicalLeftX : physicalRightX
    left =
      preferredX >= horizontalMargin && preferredX + rect.width <= window.innerWidth - horizontalMargin
        ? preferredX
        : alternateX
    top = anchor.top + yOffset
  }

  if (placement === 'above' || placement === 'below') {
    left = alignStartX
    if (left + rect.width > window.innerWidth - horizontalMargin) left = alignEndX
  }

  left = Math.min(maxX, Math.max(horizontalMargin, left))
  top = Math.min(maxY, Math.max(verticalMargin, top))
  surface.style.left = `${Math.round(left)}px`
  surface.style.top = `${Math.round(top)}px`

  const positioned = new DOMRect(left, top, rect.width, rect.height)
  const origin = calculateTransformOrigin(anchor, positioned)
  surface.style.setProperty('--md-menu-transform-origin-x', `${origin.x * 100}%`)
  surface.style.setProperty('--md-menu-transform-origin-y', `${origin.y * 100}%`)
}

function isMarkedElement(child: ReactNode, marker: string) {
  return (
    isValidElement(child) &&
    Boolean((child.type as unknown as { [key: string]: unknown })?.[marker])
  )
}

function positionedChildren(children: ReactNode, marker: string, kind: 'group' | 'item') {
  const array = Children.toArray(children)
  const marked = array.filter((child) => isMarkedElement(child, marker))
  let index = 0

  return array.map((child) => {
    if (!isMarkedElement(child, marker)) return child
    const position =
      marked.length === 1
        ? 'single'
        : index === 0
          ? 'first'
          : index === marked.length - 1
            ? 'last'
            : 'middle'
    index += 1

    return kind === 'group' ? (
      <MenuGroupPositionContext.Provider key={(child as ReactElement).key ?? index} value={position}>
        {child}
      </MenuGroupPositionContext.Provider>
    ) : (
      <MenuItemPositionContext.Provider key={(child as ReactElement).key ?? index} value={position}>
        {child}
      </MenuItemPositionContext.Provider>
    )
  })
}

function MaterialMenuBody({ children, variant }: { children: ReactNode; variant: MaterialMenuVariant }) {
  const hasGroups = Children.toArray(children).some((child) =>
    isMarkedElement(child, '__materialMenuGroup'),
  )

  if (variant === 'expressive' && !hasGroups) {
    return <MaterialMenuGroup>{children}</MaterialMenuGroup>
  }

  return <>{positionedChildren(children, '__materialMenuGroup', 'group')}</>
}

export const MaterialMenu = forwardRef<HTMLSpanElement, MaterialMenuProps>(
  function MaterialMenu(
    {
      anchor,
      anchorPoint,
      anchorRef,
      ariaLabel,
      children,
      className,
      closeOnFocusOut = true,
      closeOnOutsideClick = true,
      color = 'standard',
      density = 'auto',
      initialFocus = 'first',
      loopNavigation = true,
      motion = 'material',
      offset = {},
      onOpenChange,
      open,
      placement = 'below',
      portalContainer,
      restoreFocus = true,
      surfaceClassName,
      surfaceProps,
      surfaceStyle,
      variant = 'expressive',
      ...spanProps
    },
    forwardedRef,
  ) {
    const id = useId()
    const menuId = `material-menu-${id.replaceAll(':', '')}`
    const generatedTreeId = `material-menu-tree-${id.replaceAll(':', '')}`
    const inheritedTree = useContext(MenuTreeContext)
    const parentMenu = useContext(MenuContext)
    const depth = (parentMenu?.depth ?? -1) + 1
    const anchorWrapperRef = useRef<HTMLSpanElement | null>(null)
    const surfaceRef = useRef<HTMLDivElement | null>(null)
    const previousFocusRef = useRef<HTMLElement | null>(null)
    const wasOpenRef = useRef(false)
    const dismissReasonRef = useRef<MaterialMenuDismissReason>('trigger')
    const triggerFocusRef = useRef<'first' | 'last'>('first')
    const typeaheadRef = useRef('')
    const typeaheadTimerRef = useRef<number | undefined>(undefined)

    const closeThisMenu = (reason: MaterialMenuDismissReason) => {
      dismissReasonRef.current = reason
      onOpenChange(false, reason)
    }
    const treeValue = useMemo<MenuTreeContextValue>(
      () =>
        inheritedTree ?? {
          closeTree: (reason) => {
            dismissReasonRef.current = reason
            onOpenChange(false, reason)
          },
          treeId: generatedTreeId,
        },
      [generatedTreeId, inheritedTree, onOpenChange],
    )

    const getAnchor = () => {
      if (anchorPoint) return pointRect(anchorPoint)
      const external = anchorRef?.current
      if (external) return external.getBoundingClientRect()
      return anchorWrapperRef.current?.getBoundingClientRect() ?? new DOMRect()
    }

    const getTrigger = () => {
      if (anchorRef?.current) return anchorRef.current
      return anchorWrapperRef.current?.querySelector<HTMLElement>(
        'button, a[href], input, [tabindex]:not([tabindex="-1"])',
      )
    }

    const updatePosition = () => {
      const surface = surfaceRef.current
      if (!surface) return
      const inheritanceSource = anchorRef?.current ?? anchorWrapperRef.current
      if (inheritanceSource) copyMaterialProperties(inheritanceSource, surface, surfaceStyle)
      positionSurface(surface, getAnchor(), placement, offset)
    }

    useLayoutEffect(() => {
      if (!open) return
      if (!wasOpenRef.current) {
        previousFocusRef.current = document.activeElement instanceof HTMLElement
          ? document.activeElement
          : null
      }
      wasOpenRef.current = true
      updatePosition()

      const items = getMenuItems(surfaceRef.current)
      const requestedFocus = initialFocus === 'first' ? triggerFocusRef.current : initialFocus
      if (requestedFocus === 'first') focusItem(items, 0)
      else if (requestedFocus === 'last') focusItem(items, items.length - 1)
      else if (initialFocus === 'menu') surfaceRef.current?.focus()
      triggerFocusRef.current = 'first'
    }, [initialFocus, open])

    useEffect(() => {
      if (open) return
      if (
        wasOpenRef.current &&
        restoreFocus &&
        dismissReasonRef.current !== 'focusout' &&
        dismissReasonRef.current !== 'outside-click'
      ) {
        const target = getTrigger() ?? previousFocusRef.current
        if (target?.isConnected) target.focus()
      }
      wasOpenRef.current = false
    }, [open, restoreFocus])

    useEffect(() => {
      if (!open) return
      const surface = surfaceRef.current
      const resizeObserver = new ResizeObserver(updatePosition)
      if (surface) resizeObserver.observe(surface)
      if (anchorRef?.current) resizeObserver.observe(anchorRef.current)
      else if (anchorWrapperRef.current) resizeObserver.observe(anchorWrapperRef.current)
      window.addEventListener('resize', updatePosition)
      window.addEventListener('scroll', updatePosition, true)
      return () => {
        resizeObserver.disconnect()
        window.removeEventListener('resize', updatePosition)
        window.removeEventListener('scroll', updatePosition, true)
      }
    }, [open, placement, anchorPoint?.x, anchorPoint?.y, offset.x, offset.y])

    useEffect(() => {
      if (!open || !closeOnOutsideClick) return
      const handlePointerDown = (event: globalThis.PointerEvent) => {
        const target = event.target
        if (!(target instanceof Element)) return
        if (target.closest(`[data-material-menu-tree="${treeValue.treeId}"]`)) return
        treeValue.closeTree('outside-click')
      }
      document.addEventListener('pointerdown', handlePointerDown)
      return () => document.removeEventListener('pointerdown', handlePointerDown)
    }, [closeOnOutsideClick, open, treeValue])

    useEffect(
      () => () => {
        if (typeaheadTimerRef.current !== undefined) window.clearTimeout(typeaheadTimerRef.current)
      },
      [],
    )

    const handleSurfaceKeyDown = (event: KeyboardEvent<HTMLDivElement>) => {
      surfaceProps?.onKeyDown?.(event)
      if (event.defaultPrevented) return
      const items = getMenuItems(surfaceRef.current)
      const activeIndex = document.activeElement instanceof HTMLElement
        ? items.indexOf(document.activeElement as MaterialMenuItemElement)
        : -1

      if (event.key === 'Escape') {
        event.preventDefault()
        closeThisMenu('escape')
        return
      }

      if (event.key === 'Tab') {
        closeThisMenu('focusout')
        return
      }

      if (event.key === 'ArrowDown' || event.key === 'ArrowUp') {
        event.preventDefault()
        const delta = event.key === 'ArrowDown' ? 1 : -1
        let next = activeIndex < 0 ? (delta > 0 ? 0 : items.length - 1) : activeIndex + delta
        if (!loopNavigation) next = Math.max(0, Math.min(items.length - 1, next))
        focusItem(items, next)
        return
      }

      if (event.key === 'Home' || event.key === 'End') {
        event.preventDefault()
        focusItem(items, event.key === 'Home' ? 0 : items.length - 1)
        return
      }

      const opensSubmenu =
        (event.key === 'ArrowRight' && window.getComputedStyle(event.currentTarget).direction !== 'rtl') ||
        (event.key === 'ArrowLeft' && window.getComputedStyle(event.currentTarget).direction === 'rtl')
      const closesSubmenu =
        (event.key === 'ArrowLeft' && window.getComputedStyle(event.currentTarget).direction !== 'rtl') ||
        (event.key === 'ArrowRight' && window.getComputedStyle(event.currentTarget).direction === 'rtl')

      if (opensSubmenu && document.activeElement instanceof HTMLElement) {
        const active = document.activeElement
        if (active.getAttribute('aria-haspopup') === 'menu') {
          event.preventDefault()
          active.click()
        }
        return
      }

      if (closesSubmenu && inheritedTree) {
        event.preventDefault()
        closeThisMenu('escape')
        return
      }

      if (event.key.length === 1 && !event.altKey && !event.ctrlKey && !event.metaKey) {
        typeaheadRef.current += event.key.toLocaleLowerCase()
        if (typeaheadTimerRef.current !== undefined) window.clearTimeout(typeaheadTimerRef.current)
        typeaheadTimerRef.current = window.setTimeout(() => {
          typeaheadRef.current = ''
        }, 500)

        const query = typeaheadRef.current
        const ordered = [...items.slice(activeIndex + 1), ...items.slice(0, activeIndex + 1)]
        const match = ordered.find((item) => getElementText(item).toLocaleLowerCase().startsWith(query))
        if (match) {
          event.preventDefault()
          focusItem(items, items.indexOf(match))
        }
      }
    }

    const handleFocusCapture = (event: React.FocusEvent<HTMLDivElement>) => {
      surfaceProps?.onFocusCapture?.(event)
      const item = event.target instanceof HTMLElement
        ? event.target.closest<MaterialMenuItemElement>('[data-material-menu-item]')
        : null
      if (!item || item.closest('[data-material-menu-surface]') !== surfaceRef.current) return
      getMenuItems(surfaceRef.current).forEach((candidate) => {
        candidate.tabIndex = candidate === item ? 0 : -1
      })
    }

    const handleBlur = (event: React.FocusEvent<HTMLDivElement>) => {
      surfaceProps?.onBlur?.(event)
      if (!closeOnFocusOut || event.defaultPrevented) return
      const next = event.relatedTarget
      if (next instanceof Element && next.closest(`[data-material-menu-tree="${treeValue.treeId}"]`)) {
        return
      }
      treeValue.closeTree('focusout')
    }

    const anchorElement = anchor
      ? cloneElement(anchor, {
          ...anchor.props,
          'aria-controls': menuId,
          'aria-expanded': open,
          'aria-haspopup': 'menu',
          id: anchor.props.id ?? `${menuId}-anchor`,
          onClick: (event: MouseEvent<HTMLElement>) => {
            anchor.props.onClick?.(event)
            if (!event.defaultPrevented) {
              triggerFocusRef.current = 'first'
              onOpenChange(!open, 'trigger')
            }
          },
          onKeyDown: (event: KeyboardEvent<HTMLElement>) => {
            anchor.props.onKeyDown?.(event)
            if (event.defaultPrevented) return
            if (event.key === 'ArrowDown' || event.key === 'ArrowUp') {
              event.preventDefault()
              triggerFocusRef.current = event.key === 'ArrowUp' ? 'last' : 'first'
              onOpenChange(true, 'trigger')
            }
          },
        })
      : null

    const menuContext = useMemo<MenuContextValue>(
      () => ({
        closeMenu: closeThisMenu,
        closeTree: treeValue.closeTree,
        color,
        depth,
        open,
        variant,
      }),
      [color, depth, open, treeValue.closeTree, variant],
    )

    const surface = typeof document === 'undefined' ? null : createPortal(
      <MenuContext.Provider value={menuContext}>
        <div
          {...surfaceProps}
          ref={surfaceRef}
          id={menuId}
          aria-hidden={open ? undefined : true}
          aria-label={ariaLabel}
          aria-labelledby={ariaLabel ? undefined : anchorElement?.props.id}
          className={joinClassNames('material-menu-surface', surfaceClassName)}
          data-color={color}
          data-density={densityAttribute(density)}
          data-menu-depth={depth}
          data-material-menu-surface=""
          data-material-menu-tree={treeValue.treeId}
          data-motion={motion}
          data-open={open ? 'true' : 'false'}
          data-placement={placement}
          data-variant={variant}
          inert={open ? undefined : true}
          onBlur={handleBlur}
          onFocusCapture={handleFocusCapture}
          onKeyDown={handleSurfaceKeyDown}
          role="menu"
          style={{ zIndex: `calc(var(--md-menu-z-index, 1000) + ${depth})`, ...surfaceStyle }}
          tabIndex={initialFocus === 'menu' ? 0 : -1}
        >
          <div className="material-menu-surface__scroll">
            <MaterialMenuBody variant={variant}>{children}</MaterialMenuBody>
          </div>
        </div>
      </MenuContext.Provider>,
      portalContainer ?? document.body,
    )

    return (
      <MenuTreeContext.Provider value={treeValue}>
        {anchorElement ? (
          <span
            {...spanProps}
            ref={(node) => {
              anchorWrapperRef.current = node
              assignRef(forwardedRef, node)
            }}
            className={joinClassNames('material-menu-anchor', className)}
            data-material-menu-anchor=""
            data-material-menu-tree={treeValue.treeId}
          >
            {anchorElement}
          </span>
        ) : null}
        {surface}
      </MenuTreeContext.Provider>
    )
  },
)

export const MaterialMenuItem = forwardRef<MaterialMenuItemElement, MaterialMenuItemProps>(
  function MaterialMenuItem(
    {
      badge,
      children,
      className,
      color,
      disabled = false,
      download,
      href,
      keepOpen = false,
      leadingIcon,
      onClick,
      onKeyDown,
      onPointerEnter,
      onPointerLeave,
      rel,
      role = 'menuitem',
      selected = false,
      selectedLeadingIcon,
      shapePosition,
      style,
      supportingText,
      tabIndex = -1,
      target,
      textValue,
      trailingIcon,
      trailingText,
      type = 'button',
      variant,
      ...elementProps
    },
    forwardedRef,
  ) {
    const menu = useContext(MenuContext)
    const inferredPosition = useContext(MenuItemPositionContext)
    const resolvedVariant = variant ?? menu?.variant ?? 'expressive'
    const resolvedColor = color ?? menu?.color ?? 'standard'
    const resolvedPosition = shapePosition ?? inferredPosition ?? 'single'
    const hasLeading = leadingIcon != null || selectedLeadingIcon != null
    const isLink = href !== undefined

    const activate = (event: MouseEvent<MaterialMenuItemElement>) => {
      if (disabled) {
        event.preventDefault()
        return
      }
      onClick?.(event as MouseEvent<HTMLButtonElement>)
      if (!event.defaultPrevented && !keepOpen) menu?.closeTree('selection')
    }

    const handleKeyDown = (event: KeyboardEvent<MaterialMenuItemElement>) => {
      onKeyDown?.(event as KeyboardEvent<HTMLButtonElement>)
      if (event.defaultPrevented || disabled) return
      if (event.key === 'Enter' || event.key === ' ') {
        event.preventDefault()
        event.currentTarget.click()
      }
    }

    const commonProps = {
      ...elementProps,
      'aria-checked': role === 'menuitemcheckbox' || role === 'menuitemradio' ? selected : undefined,
      'aria-disabled': disabled || undefined,
      className: joinClassNames('material-menu-item', className),
      'data-color': resolvedColor,
      'data-disabled': disabled ? 'true' : 'false',
      'data-material-menu-item': '',
      'data-selected': selected ? 'true' : 'false',
      'data-supporting-text': supportingText != null ? 'true' : undefined,
      'data-shape-position': resolvedPosition,
      'data-text-value': textValue,
      'data-token-scope': !menu && !inferredPosition ? 'true' : undefined,
      'data-variant': resolvedVariant,
      onClick: activate,
      onKeyDown: handleKeyDown,
      onPointerEnter,
      onPointerLeave,
      role,
      style,
      tabIndex,
    }

    const content = (
      <>
        <MaterialRipple disabled={disabled} />
        <span className="material-menu-item__focus-ring" aria-hidden="true" />
        {hasLeading ? (
          <span className="material-menu-item__leading" aria-hidden="true">
            <span className="material-menu-item__leading-icon material-menu-item__leading-icon--default">
              {leadingIcon}
            </span>
            <span className="material-menu-item__leading-icon material-menu-item__leading-icon--selected">
              {selectedLeadingIcon}
            </span>
          </span>
        ) : null}
        <span className="material-menu-item__text">
          <span className="material-menu-item__label">{children}</span>
          {supportingText != null ? (
            <span className="material-menu-item__supporting">{supportingText}</span>
          ) : null}
        </span>
        {trailingIcon != null || badge != null || trailingText != null ? (
          <span className="material-menu-item__trailing" aria-hidden="true">
            {trailingIcon != null ? <span className="material-menu-item__trailing-icon">{trailingIcon}</span> : null}
            {badge != null ? <span className="material-menu-item__badge">{badge}</span> : null}
            {trailingText != null ? <span className="material-menu-item__trailing-text">{trailingText}</span> : null}
          </span>
        ) : null}
      </>
    )

    if (isLink) {
      return (
        <a
          {...(commonProps as AnchorHTMLAttributes<HTMLAnchorElement>)}
          ref={(node) => assignRef(forwardedRef, node)}
          download={download}
          href={disabled ? undefined : href}
          rel={rel}
          target={target}
        >
          {content}
        </a>
      )
    }

    return (
      <button
        {...(commonProps as ButtonHTMLAttributes<HTMLButtonElement>)}
        ref={(node) => assignRef(forwardedRef, node)}
        type={type}
      >
        {content}
      </button>
    )
  },
)

;(MaterialMenuItem as typeof MaterialMenuItem & { __materialMenuItem?: boolean }).__materialMenuItem = true

export const MaterialCheckableMenuItem = forwardRef<
  MaterialMenuItemElement,
  MaterialCheckableMenuItemProps
>(function MaterialCheckableMenuItem(
  { checked, keepOpen = true, onCheckedChange, onClick, ...itemProps },
  ref,
) {
  return (
    <MaterialMenuItem
      {...itemProps}
      ref={ref}
      keepOpen={keepOpen}
      onClick={(event) => {
        onClick?.(event)
        if (!event.defaultPrevented) onCheckedChange(!checked)
      }}
      role="menuitemcheckbox"
      selected={checked}
    />
  )
})

;(MaterialCheckableMenuItem as typeof MaterialCheckableMenuItem & { __materialMenuItem?: boolean }).__materialMenuItem = true

export const MaterialSelectableMenuItem = forwardRef<
  MaterialMenuItemElement,
  MaterialSelectableMenuItemProps
>(function MaterialSelectableMenuItem({ keepOpen = false, selected, ...itemProps }, ref) {
  return (
    <MaterialMenuItem
      {...itemProps}
      ref={ref}
      keepOpen={keepOpen}
      role="menuitemradio"
      selected={selected}
    />
  )
})

;(MaterialSelectableMenuItem as typeof MaterialSelectableMenuItem & { __materialMenuItem?: boolean }).__materialMenuItem = true

export const MaterialMenuGroupLabel = forwardRef<HTMLDivElement, MaterialMenuGroupLabelProps>(
  function MaterialMenuGroupLabel({ children, className, ...divProps }, ref) {
    return (
      <div
        {...divProps}
        ref={ref}
        className={joinClassNames('material-menu-group__label', className)}
        data-material-menu-group-label=""
      >
        {children}
      </div>
    )
  },
)

export const MaterialMenuGroup = forwardRef<HTMLDivElement, MaterialMenuGroupProps>(
  function MaterialMenuGroup(
    {
      children,
      className,
      color,
      label,
      onPointerEnter,
      onPointerLeave,
      position,
      style,
      variant,
      ...divProps
    },
    ref,
  ) {
    const menu = useContext(MenuContext)
    const inferredPosition = useContext(MenuGroupPositionContext)
    const [hoveredOnce, setHoveredOnce] = useState(false)
    const resolvedVariant = variant ?? menu?.variant ?? 'expressive'
    const resolvedColor = color ?? menu?.color ?? 'standard'
    const resolvedPosition = position ?? inferredPosition ?? 'single'

    return (
      <div
        {...divProps}
        ref={ref}
        className={joinClassNames('material-menu-group', className)}
        data-color={resolvedColor}
        data-hovered-once={hoveredOnce ? 'true' : 'false'}
        data-material-menu-group=""
        data-token-scope={menu ? undefined : 'true'}
        data-position={resolvedPosition}
        data-variant={resolvedVariant}
        onPointerEnter={(event) => {
          setHoveredOnce(true)
          onPointerEnter?.(event)
        }}
        onPointerLeave={onPointerLeave}
        role={divProps.role ?? (divProps['aria-label'] || divProps['aria-labelledby'] ? 'group' : 'none')}
        style={style}
      >
        {label != null ? <MaterialMenuGroupLabel>{label}</MaterialMenuGroupLabel> : null}
        <div className="material-menu-group__items" role="none">
          {positionedChildren(children, '__materialMenuItem', 'item')}
        </div>
      </div>
    )
  },
)

;(MaterialMenuGroup as typeof MaterialMenuGroup & { __materialMenuGroup?: boolean }).__materialMenuGroup = true

export const MaterialMenuDivider = forwardRef<HTMLDivElement, MaterialMenuDividerProps>(
  function MaterialMenuDivider({ className, color, style, ...dividerProps }, ref) {
    return (
      <div className={joinClassNames('material-menu-divider', className)} role="none" style={style}>
        <MaterialHorizontalDivider
          {...dividerProps}
          ref={ref}
          color={color ?? 'var(--md-menu-divider-color)'}
          role="separator"
          tabIndex={-1}
        />
      </div>
    )
  },
)

export const MaterialMenuSubmenu = forwardRef<MaterialMenuItemElement, MaterialMenuSubmenuProps>(
  function MaterialMenuSubmenu(
    {
      children,
      closeDelay = 400,
      itemChildren,
      itemProps,
      onOpenChange,
      open: controlledOpen,
      openDelay = 400,
      submenuLabel,
      submenuStyle,
      ...menuItemProps
    },
    forwardedRef,
  ) {
    const parentMenu = useContext(MenuContext)
    const [uncontrolledOpen, setUncontrolledOpen] = useState(false)
    const itemRef = useRef<MaterialMenuItemElement | null>(null)
    const openTimerRef = useRef<number | undefined>(undefined)
    const closeTimerRef = useRef<number | undefined>(undefined)
    const open = controlledOpen ?? uncontrolledOpen

    const setOpen = (next: boolean) => {
      if (controlledOpen === undefined) setUncontrolledOpen(next)
      onOpenChange?.(next)
    }

    const clearTimers = () => {
      if (openTimerRef.current !== undefined) window.clearTimeout(openTimerRef.current)
      if (closeTimerRef.current !== undefined) window.clearTimeout(closeTimerRef.current)
    }

    const scheduleOpen = () => {
      if (closeTimerRef.current !== undefined) window.clearTimeout(closeTimerRef.current)
      if (open) return
      openTimerRef.current = window.setTimeout(() => setOpen(true), openDelay)
    }

    const scheduleClose = () => {
      if (openTimerRef.current !== undefined) window.clearTimeout(openTimerRef.current)
      if (!open) return
      closeTimerRef.current = window.setTimeout(() => setOpen(false), closeDelay)
    }

    useEffect(() => {
      if (!parentMenu?.open && open) setOpen(false)
    }, [parentMenu?.open])

    useEffect(() => clearTimers, [])

    const chevron = (
      <svg viewBox="0 0 24 24" aria-hidden="true">
        <path d="m9 18 6-6-6-6" fill="none" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" />
      </svg>
    )

    return (
      <>
        <MaterialMenuItem
          {...itemProps}
          {...menuItemProps}
          ref={(node) => {
            itemRef.current = node
            assignRef(forwardedRef, node)
          }}
          aria-expanded={open}
          aria-haspopup="menu"
          keepOpen
          onClick={() => setOpen(!open)}
          onPointerEnter={(event: ReactPointerEvent<HTMLButtonElement>) => {
            scheduleOpen()
            itemProps?.onPointerEnter?.(event)
          }}
          onPointerLeave={(event: ReactPointerEvent<HTMLButtonElement>) => {
            scheduleClose()
            itemProps?.onPointerLeave?.(event)
          }}
          selected={open}
          trailingIcon={chevron}
        >
          {itemChildren}
        </MaterialMenuItem>
        <MaterialMenu
          anchorRef={itemRef as RefObject<HTMLElement | null>}
          ariaLabel={submenuLabel}
          closeOnFocusOut={false}
          initialFocus="first"
          onOpenChange={(next) => setOpen(next)}
          open={open}
          placement="end"
          restoreFocus
          surfaceProps={{
            onPointerEnter: clearTimers,
            onPointerLeave: scheduleClose,
          }}
          surfaceStyle={submenuStyle}
          variant={parentMenu?.variant}
          color={parentMenu?.color}
        >
          {children}
        </MaterialMenu>
      </>
    )
  },
)

;(MaterialMenuSubmenu as typeof MaterialMenuSubmenu & { __materialMenuItem?: boolean }).__materialMenuItem = true
