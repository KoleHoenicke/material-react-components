import {
  Children,
  createContext,
  createElement,
  forwardRef,
  isValidElement,
  useEffect,
  useContext,
  useId,
  useImperativeHandle,
  useLayoutEffect,
  useRef,
  useState,
  type AnchorHTMLAttributes,
  type CSSProperties,
  type DragEventHandler,
  type HTMLAttributes,
  type KeyboardEvent,
  type MouseEvent,
  type MouseEventHandler,
  type PointerEventHandler,
  type ReactNode,
} from 'react'

import { MaterialRipple } from './MaterialRipple'
import {
  MaterialHorizontalDivider,
  type MaterialHorizontalDividerProps,
} from './MaterialDivider'
import './MaterialList.css'

export type MaterialListVariant = 'standard' | 'segmented' | 'baseline'
export type MaterialListSelectionMode = 'none' | 'single' | 'multiple'
export type MaterialListItemLines = 1 | 2 | 3
export type MaterialListItemAlignment = 'auto' | 'center' | 'top'
export type MaterialListItemLeadingType =
  | 'avatar'
  | 'control'
  | 'custom'
  | 'icon'
  | 'image'
  | 'video-large'
  | 'video-small'
export type MaterialListItemTrailingType = 'control' | 'custom' | 'icon' | 'text'

export type MaterialListStyle = CSSProperties & {
  '--md-list-auto-alignment-breakpoint'?: string
  '--md-list-between-space'?: string
  '--md-list-container-color'?: string
  '--md-list-content-padding-block'?: string
  '--md-list-content-padding-inline'?: string
  '--md-list-disabled-content-opacity'?: number | string
  '--md-list-disabled-content-color'?: string
  '--md-list-disabled-selected-container-color'?: string
  '--md-list-disabled-selected-container-opacity'?: string
  '--md-list-divider-color'?: string
  '--md-list-divider-leading-space'?: string
  '--md-list-divider-trailing-space'?: string
  '--md-list-dragged-container-color'?: string
  '--md-list-dragged-content-color'?: string
  '--md-list-dragged-elevation'?: string
  '--md-list-dragged-leading-color'?: string
  '--md-list-dragged-overline-color'?: string
  '--md-list-dragged-shape'?: string
  '--md-list-dragged-state-layer-opacity'?: number | string
  '--md-list-dragged-supporting-color'?: string
  '--md-list-dragged-trailing-color'?: string
  '--md-list-focus-indicator-color'?: string
  '--md-list-focus-indicator-offset'?: string
  '--md-list-focus-indicator-thickness'?: string
  '--md-list-focus-state-layer-opacity'?: number | string
  '--md-list-hover-state-layer-opacity'?: number | string
  '--md-list-item-bottom-space'?: string
  '--md-list-item-container-shape'?: string
  '--md-list-item-focused-shape'?: string
  '--md-list-item-hovered-shape'?: string
  '--md-list-item-pressed-shape'?: string
  '--md-list-item-top-space'?: string
  '--md-list-label-color'?: string
  '--md-list-leading-avatar-color'?: string
  '--md-list-leading-avatar-label-color'?: string
  '--md-list-leading-avatar-size'?: string
  '--md-list-leading-icon-color'?: string
  '--md-list-leading-icon-size'?: string
  '--md-list-leading-image-size'?: string
  '--md-list-leading-space'?: string
  '--md-list-one-line-height'?: string
  '--md-list-overline-color'?: string
  '--md-list-pressed-state-layer-opacity'?: number | string
  '--md-list-segment-gap'?: string
  '--md-list-selected-container-color'?: string
  '--md-list-selected-content-color'?: string
  '--md-list-selected-leading-color'?: string
  '--md-list-selected-overline-color'?: string
  '--md-list-selected-shape'?: string
  '--md-list-selected-supporting-color'?: string
  '--md-list-selected-trailing-color'?: string
  '--md-list-supporting-color'?: string
  '--md-list-three-line-height'?: string
  '--md-list-trailing-icon-color'?: string
  '--md-list-trailing-icon-size'?: string
  '--md-list-trailing-space'?: string
  '--md-list-two-line-height'?: string
}

export type MaterialListProps = Omit<
  HTMLAttributes<HTMLDivElement>,
  'children' | 'onKeyDown' | 'style'
> & {
  ariaLabel?: string
  children: ReactNode
  keyboardNavigation?: boolean
  onKeyDown?: HTMLAttributes<HTMLDivElement>['onKeyDown']
  selectionMode?: MaterialListSelectionMode
  style?: MaterialListStyle
  variant?: MaterialListVariant
}

const MaterialListSelectionContext = createContext<MaterialListSelectionMode>('none')

const focusableSelector = [
  '[data-material-list-primary]',
  'button',
  'a[href]',
  'input',
  'select',
  'textarea',
  '[tabindex]',
].join(',')

function listFocusableElements(root: HTMLElement) {
  return Array.from(root.querySelectorAll<HTMLElement>(focusableSelector)).filter(
    (element, index, elements) =>
      elements.indexOf(element) === index &&
      !element.closest('[inert]') &&
      !element.hasAttribute('disabled') &&
      element.getAttribute('aria-disabled') !== 'true' &&
      element.getAttribute('aria-hidden') !== 'true',
  )
}

export const MaterialList = forwardRef<HTMLDivElement, MaterialListProps>(
  function MaterialList(
    {
      'aria-label': nativeAriaLabel,
      ariaLabel,
      children,
      className,
      keyboardNavigation = true,
      onFocusCapture,
      onKeyDown,
      role,
      selectionMode = 'none',
      variant = 'standard',
      ...divProps
    },
    forwardedRef,
  ) {
    const rootRef = useRef<HTMLDivElement>(null)
    useImperativeHandle(forwardedRef, () => rootRef.current as HTMLDivElement)

    useEffect(() => {
      const root = rootRef.current
      if (!root || !keyboardNavigation) return

      const elements = listFocusableElements(root)
      if (elements.length === 0) return

      const activeElement = elements.find((element) => element.tabIndex === 0)
      const selectedElement = elements.find(
        (element) =>
          element.getAttribute('aria-selected') === 'true' ||
          element.closest('[data-selected="true"]') !== null,
      )
      const entryElement = activeElement ?? selectedElement ?? elements[0]

      elements.forEach((element) => {
        element.tabIndex = element === entryElement ? 0 : -1
      })
    }, [children, keyboardNavigation, selectionMode])

    const moveFocus = (event: KeyboardEvent<HTMLDivElement>) => {
      if (!keyboardNavigation || event.defaultPrevented) return

      const direction =
        event.key === 'ArrowDown' || event.key === 'ArrowRight'
          ? 1
          : event.key === 'ArrowUp' || event.key === 'ArrowLeft'
            ? -1
            : 0
      const isBoundaryKey = event.key === 'Home' || event.key === 'End'

      if (direction === 0 && !isBoundaryKey) return

      const root = rootRef.current
      if (!root) return

      const elements = listFocusableElements(root)
      if (elements.length === 0) return

      const current = document.activeElement instanceof HTMLElement
        ? document.activeElement
        : null
      const currentIndex = current ? elements.indexOf(current) : -1
      const nextIndex = event.key === 'Home'
        ? 0
        : event.key === 'End'
          ? elements.length - 1
          : (currentIndex + direction + elements.length) % elements.length
      const next = elements[nextIndex]

      if (!next) return
      event.preventDefault()
      elements.forEach((element) => {
        element.tabIndex = element === next ? 0 : -1
      })
      next.focus()
    }

    return (
      <div
        {...divProps}
        ref={rootRef}
        aria-label={ariaLabel ?? nativeAriaLabel}
        aria-multiselectable={selectionMode === 'multiple' ? true : undefined}
        className={['material-list', className].filter(Boolean).join(' ')}
        data-keyboard-navigation={keyboardNavigation ? 'true' : 'false'}
        data-material-list=""
        data-selection-mode={selectionMode}
        data-variant={variant}
        role={role ?? (selectionMode === 'none' ? 'list' : 'listbox')}
        onFocusCapture={(event) => {
          if (keyboardNavigation && event.target instanceof HTMLElement) {
            const elements = listFocusableElements(event.currentTarget)
            elements.forEach((element) => {
              element.tabIndex = element === event.target ? 0 : -1
            })
          }
          onFocusCapture?.(event)
        }}
        onKeyDown={(event) => {
          onKeyDown?.(event)
          moveFocus(event)
        }}
      >
        <MaterialListSelectionContext.Provider value={selectionMode}>
          {children}
        </MaterialListSelectionContext.Provider>
      </div>
    )
  },
)

type MaterialListItemBaseProps = Omit<
  HTMLAttributes<HTMLDivElement>,
  | 'children'
  | 'onClick'
  | 'onDragEnd'
  | 'onDragStart'
  | 'onPointerDown'
  | 'onPointerMove'
  | 'onPointerUp'
  | 'style'
>

export type MaterialListItemProps = MaterialListItemBaseProps & {
  ariaLabel?: string
  disabled?: boolean
  download?: AnchorHTMLAttributes<HTMLAnchorElement>['download']
  dragged?: boolean
  draggable?: boolean
  expanded?: boolean
  headline: ReactNode
  href?: string
  hrefLang?: string
  leading?: ReactNode
  leadingType?: MaterialListItemLeadingType
  lines?: MaterialListItemLines
  onClick?: MouseEventHandler<HTMLElement>
  onDraggedChange?: (dragged: boolean) => void
  onDragEnd?: DragEventHandler<HTMLElement>
  onDragStart?: DragEventHandler<HTMLElement>
  onLongPress?: () => void
  onSelectedChange?: (selected: boolean) => void
  overline?: ReactNode
  ping?: string
  referrerPolicy?: AnchorHTMLAttributes<HTMLAnchorElement>['referrerPolicy']
  rel?: string
  selected?: boolean
  /** Overrides the nearest list selection mode for this item. */
  selectionMode?: MaterialListSelectionMode
  style?: MaterialListStyle
  supportingText?: ReactNode
  target?: AnchorHTMLAttributes<HTMLAnchorElement>['target']
  trailing?: ReactNode
  /** Spoken description for abbreviated trailing text on an interactive row. */
  trailingDescription?: string
  trailingType?: MaterialListItemTrailingType
  type?: 'button' | 'reset' | 'submit'
  verticalAlignment?: MaterialListItemAlignment
}

function nodeText(node: ReactNode): string {
  if (typeof node === 'string' || typeof node === 'number') return String(node)
  if (Array.isArray(node)) return node.map(nodeText).filter(Boolean).join(' ')
  if (isValidElement(node)) {
    return nodeText((node.props as { children?: ReactNode }).children)
  }
  return ''
}

function defaultItemLines(
  overline: ReactNode,
  supportingText: ReactNode,
): MaterialListItemLines {
  if (overline != null && supportingText != null) return 3
  if (overline != null || supportingText != null) return 2
  return 1
}

export const MaterialListItem = forwardRef<HTMLDivElement, MaterialListItemProps>(
  function MaterialListItem(
    {
      'aria-controls': ariaControls,
      'aria-current': ariaCurrent,
      'aria-describedby': ariaDescribedBy,
      'aria-details': ariaDetails,
      'aria-haspopup': ariaHasPopup,
      'aria-label': nativeAriaLabel,
      'aria-labelledby': ariaLabelledBy,
      'aria-pressed': ariaPressed,
      ariaLabel,
      className,
      disabled = false,
      download,
      dragged = false,
      draggable = false,
      expanded,
      headline,
      href,
      hrefLang,
      leading,
      leadingType = 'custom',
      lines,
      onClick,
      onContextMenu,
      onDraggedChange,
      onDragEnd,
      onDragStart,
      onLongPress,
      onSelectedChange,
      overline,
      ping,
      referrerPolicy,
      rel,
      role,
      selected = false,
      selectionMode: selectionModeOverride,
      supportingText,
      tabIndex,
      target,
      trailing,
      trailingDescription,
      trailingType = 'custom',
      type = 'button',
      verticalAlignment = 'auto',
      ...divProps
    },
    ref,
  ) {
    const inheritedSelectionMode = useContext(MaterialListSelectionContext)
    const itemRef = useRef<HTMLDivElement>(null)
    useImperativeHandle(ref, () => itemRef.current!, [])
    const trailingId = useId()
    const trailingDescriptionId = useId()
    const describedBy = [
      ariaDescribedBy,
      trailing != null && trailingType === 'text'
        ? trailingDescription ? trailingDescriptionId : trailingId
        : undefined,
    ].filter(Boolean).join(' ') || undefined
    const [supportingMultiline, setSupportingMultiline] = useState(false)
    const [autoAlignment, setAutoAlignment] = useState<'center' | 'top' | undefined>()
    const selectionMode = selectionModeOverride ?? inheritedSelectionMode
    const interactive = href !== undefined || onClick !== undefined || selectionMode !== 'none'
    const explicitAccessibleLabel = ariaLabel ?? nativeAriaLabel
    const accessibleLabel = explicitAccessibleLabel ?? [nodeText(headline), nodeText(supportingText)]
      .filter(Boolean)
      .join(' ')
    const lineCount = lines ?? (supportingMultiline ? 3 : defaultItemLines(overline, supportingText))
    useLayoutEffect(() => {
      const item = itemRef.current
      if (!item) return
      const measure = () => {
        // Hidden panels have no layout; the observer measures them when they become visible.
        const height = item.clientHeight
        if (height === 0) return
        const style = getComputedStyle(item)
        const support = item.querySelector<HTMLElement>('.material-list-item__supporting')
        if (lines == null && support) {
          const lineHeight = Number.parseFloat(getComputedStyle(support).lineHeight)
          setSupportingMultiline(Number.isFinite(lineHeight) && support.offsetHeight > lineHeight * 1.5)
        } else {
          setSupportingMultiline(false)
        }
        // Layout dimensions exclude any scale transform on an entering dialog or parent.
        if (height > 0 && verticalAlignment === 'auto' && item.closest('.material-list')?.getAttribute('data-variant') !== 'baseline') {
          const contentHeight = height
            - Number.parseFloat(style.paddingTop || '0')
            - Number.parseFloat(style.paddingBottom || '0')
          const breakpoint = Number.parseFloat(style.getPropertyValue('--md-list-auto-alignment-breakpoint')) || 60
          setAutoAlignment(contentHeight < breakpoint ? 'center' : 'top')
        } else {
          setAutoAlignment(undefined)
        }
      }
      measure()
      const observer = new ResizeObserver(measure)
      observer.observe(item)
      const content = item.querySelector('.material-list-item__content')
      if (content) observer.observe(content)
      return () => observer.disconnect()
    }, [lines, overline, supportingText, verticalAlignment])
    const longPressTimer = useRef<number | null>(null)
    const longPressTriggered = useRef(false)
    const pointerOrigin = useRef<{ x: number; y: number } | null>(null)

    const cancelLongPress = () => {
      if (longPressTimer.current !== null) {
        window.clearTimeout(longPressTimer.current)
        longPressTimer.current = null
      }
      pointerOrigin.current = null
    }

    useEffect(() => cancelLongPress, [])

    const handlePointerDown: PointerEventHandler<HTMLElement> = (event) => {
      if (!onLongPress || disabled || !event.isPrimary) return
      longPressTriggered.current = false
      pointerOrigin.current = { x: event.clientX, y: event.clientY }
      longPressTimer.current = window.setTimeout(() => {
        longPressTimer.current = null
        longPressTriggered.current = true
        onLongPress()
      }, 500)
    }

    const handlePointerMove: PointerEventHandler<HTMLElement> = (event) => {
      const origin = pointerOrigin.current
      if (!origin) return
      if (Math.hypot(event.clientX - origin.x, event.clientY - origin.y) > 8) {
        cancelLongPress()
      }
    }

    const handleClick: MouseEventHandler<HTMLElement> = (event) => {
      if (disabled || longPressTriggered.current) {
        event.preventDefault()
        longPressTriggered.current = false
        return
      }

      onClick?.(event)
      if (!event.defaultPrevented && selectionMode !== 'none') {
        onSelectedChange?.(!selected)
      }
    }

    const handleDragStart: DragEventHandler<HTMLDivElement> = (event) => {
      onDragStart?.(event)
      if (!event.defaultPrevented && !disabled) onDraggedChange?.(true)
    }

    const handleDragEnd: DragEventHandler<HTMLDivElement> = (event) => {
      onDragEnd?.(event)
      onDraggedChange?.(false)
    }

    const primaryProps = {
      'aria-disabled': href !== undefined && disabled ? true : undefined,
      'aria-controls': ariaControls,
      'aria-current': ariaCurrent,
      'aria-describedby': describedBy,
      'aria-details': ariaDetails,
      'aria-expanded': expanded,
      'aria-haspopup': ariaHasPopup,
      'aria-label': ariaLabelledBy ? undefined : accessibleLabel || undefined,
      'aria-labelledby': ariaLabelledBy,
      'aria-pressed': ariaPressed,
      'aria-selected': selectionMode !== 'none' ? selected : undefined,
      className: 'material-list-item__primary',
      'data-material-list-primary': '',
      disabled: href === undefined ? disabled : undefined,
      download: href !== undefined ? download : undefined,
      href: href !== undefined && !disabled ? href : undefined,
      hrefLang: href !== undefined ? hrefLang : undefined,
      onClick: handleClick,
      onContextMenu: (event: MouseEvent<HTMLElement>) => {
        if (onLongPress && !disabled) {
          event.preventDefault()
          onLongPress()
        }
        onContextMenu?.(event as never)
      },
      onPointerCancel: cancelLongPress,
      onPointerDown: handlePointerDown,
      onPointerLeave: cancelLongPress,
      onPointerMove: handlePointerMove,
      onPointerUp: cancelLongPress,
      ping: href !== undefined ? ping : undefined,
      referrerPolicy: href !== undefined ? referrerPolicy : undefined,
      rel: href !== undefined ? rel : undefined,
      role: selectionMode !== 'none' ? 'option' : undefined,
      tabIndex: href !== undefined && disabled ? -1 : tabIndex,
      target: href !== undefined ? target : undefined,
      type: href === undefined ? type : undefined,
    }

    return (
      <div
        {...divProps}
        ref={itemRef}
        aria-controls={interactive ? undefined : ariaControls}
        aria-current={interactive ? undefined : ariaCurrent}
        aria-describedby={interactive ? undefined : ariaDescribedBy}
        aria-details={interactive ? undefined : ariaDetails}
        aria-haspopup={interactive ? undefined : ariaHasPopup}
        aria-label={
          interactive || ariaLabelledBy ? undefined : explicitAccessibleLabel
        }
        aria-labelledby={interactive ? undefined : ariaLabelledBy}
        aria-pressed={interactive ? undefined : ariaPressed}
        className={['material-list-item', className].filter(Boolean).join(' ')}
        data-disabled={disabled ? 'true' : undefined}
        data-dragged={dragged ? 'true' : undefined}
        data-interactive={interactive ? 'true' : undefined}
        data-lines={lineCount}
        data-material-list-item=""
        data-selected={selected ? 'true' : undefined}
        data-vertical-alignment={verticalAlignment === 'auto' ? autoAlignment ?? 'auto' : verticalAlignment}
        draggable={draggable && !disabled}
        role={role ?? (selectionMode === 'none' ? 'listitem' : 'presentation')}
        onDragEnd={handleDragEnd}
        onDragStart={handleDragStart}
      >
        {interactive ? (
          <>
            {createElement(href !== undefined ? 'a' : 'button', primaryProps as never)}
            <MaterialRipple
              active={dragged}
              activeState="hover"
              disabled={disabled}
              ignoreSelector="button, a, input, select, textarea"
            />
          </>
        ) : null}
        {leading != null ? (
          <span
            aria-hidden={leadingType === 'control' ? undefined : true}
            className="material-list-item__leading"
            data-type={leadingType}
          >
            {leading}
          </span>
        ) : null}
        <span className="material-list-item__content">
          {overline != null ? (
            <span className="material-list-item__overline" data-material-typography="labelSmall">
              {overline}
            </span>
          ) : null}
          <span
            className="material-list-item__headline"
            data-material-typography={selected ? 'bodyLargeEmphasized' : 'bodyLarge'}
          >
            {headline}
          </span>
          {supportingText != null ? (
            <span className="material-list-item__supporting" data-material-typography="bodyMedium">
              {supportingText}
            </span>
          ) : null}
        </span>
        {trailing != null ? (
          <span
            id={trailingId}
            aria-hidden={trailingType === 'icon' ? true : undefined}
            className="material-list-item__trailing"
            data-type={trailingType}
            data-material-typography={trailingType === 'text' ? 'labelSmall' : undefined}
          >
            {trailing}
          </span>
        ) : null}
        {interactive && trailing != null && trailingType === 'text' && trailingDescription ? (
          <span id={trailingDescriptionId} hidden>{trailingDescription}</span>
        ) : null}
      </div>
    )
  },
)

export type MaterialListDividerProps = Omit<
  MaterialHorizontalDividerProps,
  'children' | 'inset' | 'insetEnd' | 'insetStart'
> & {
  inset?: 'content' | 'full'
}

export function MaterialListDivider({
  className,
  inset = 'content',
  ...dividerProps
}: MaterialListDividerProps) {
  return (
    <MaterialHorizontalDivider
      {...dividerProps}
      className={['material-list-divider', className].filter(Boolean).join(' ')}
      data-inset={inset}
      data-material-list-divider=""
      role={dividerProps.role ?? 'separator'}
    />
  )
}

export type MaterialListAvatarProps = Omit<
  HTMLAttributes<HTMLSpanElement>,
  'children'
> & {
  children: ReactNode
}

export function MaterialListAvatar({
  children,
  className,
  ...spanProps
}: MaterialListAvatarProps) {
  return (
    <span
      {...spanProps}
      className={['material-list-avatar', className].filter(Boolean).join(' ')}
      data-material-typography="titleMedium"
      data-material-list-avatar=""
    >
      {children}
    </span>
  )
}

export type MaterialListMediaProps = Omit<
  HTMLAttributes<HTMLSpanElement>,
  'children'
> & {
  children: ReactNode
  type?: 'image' | 'video-large' | 'video-small'
}

export function MaterialListMedia({
  children,
  className,
  type = 'image',
  ...spanProps
}: MaterialListMediaProps) {
  return (
    <span
      {...spanProps}
      className={['material-list-media', className].filter(Boolean).join(' ')}
      data-material-list-media=""
      data-type={type}
    >
      {children}
    </span>
  )
}

function ExpandMoreIcon() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <path d="m7 10 5 5 5-5" />
    </svg>
  )
}

function ExpandLessIcon() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <path d="m7 14 5-5 5 5" />
    </svg>
  )
}

export type MaterialExpandableListProps = Omit<
  MaterialListProps,
  'children' | 'selectionMode'
> & {
  children: ReactNode
  collapsedIcon?: ReactNode
  expanded: boolean
  expandedIcon?: ReactNode
  onExpandedChange: (expanded: boolean) => void
  summary: Omit<
    MaterialListItemProps,
    'expanded' | 'onClick' | 'onSelectedChange' | 'selectionMode' | 'trailing'
  > & {
    trailing?: ReactNode
  }
}

export const MaterialExpandableList = forwardRef<
  HTMLDivElement,
  MaterialExpandableListProps
>(function MaterialExpandableList(
  {
    ariaLabel,
    children,
    className,
    collapsedIcon,
    expanded,
    expandedIcon,
    onExpandedChange,
    summary,
    variant = 'segmented',
    ...listProps
  },
  ref,
) {
  const regionId = useId()
  const regionRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const region = regionRef.current
    if (!region) return
    if (expanded) region.removeAttribute('inert')
    else region.setAttribute('inert', '')
  }, [expanded])

  const disclosureIcon = (
    <span className="material-list-expand-icon" data-expanded={expanded ? 'true' : 'false'}>
      {expanded
        ? expandedIcon ?? <ExpandLessIcon />
        : collapsedIcon ?? <ExpandMoreIcon />}
    </span>
  )

  return (
    <MaterialList
      {...listProps}
      ref={ref}
      ariaLabel={ariaLabel}
      className={['material-list--expandable', className].filter(Boolean).join(' ')}
      data-expanded={expanded ? 'true' : 'false'}
      variant={variant}
    >
      <MaterialListItem
        {...summary}
        expanded={expanded}
        onClick={() => onExpandedChange(!expanded)}
        trailing={summary.trailing ?? disclosureIcon}
        trailingType={summary.trailing ? summary.trailingType : 'icon'}
        aria-controls={regionId}
      />
      <div
        ref={regionRef}
        aria-hidden={expanded ? undefined : true}
        className="material-list-expand-region"
        id={regionId}
        role="group"
      >
        <div className="material-list-expand-region__content">{Children.toArray(children)}</div>
      </div>
    </MaterialList>
  )
})
