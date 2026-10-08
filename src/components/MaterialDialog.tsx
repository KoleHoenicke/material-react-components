import {
  forwardRef,
  useEffect,
  useId,
  useRef,
  useState,
  type AnimationEvent,
  type CSSProperties,
  type DialogHTMLAttributes,
  type MouseEvent,
  type PointerEvent,
  type ReactNode,
  type Ref,
  type RefObject,
  type SyntheticEvent,
  type TransitionEvent,
} from 'react'

import { MaterialAppBarIconButton, MaterialTopAppBar } from './MaterialAppBar'
import { MaterialHorizontalDivider } from './MaterialDivider'
import './MaterialDialog.css'

export type MaterialDialogStyle = CSSProperties & {
  '--md-dialog-action-color'?: string
  '--md-dialog-action-spacing'?: string
  '--md-dialog-container-color'?: string
  '--md-dialog-container-elevation'?: string
  '--md-dialog-container-max-height'?: string
  '--md-dialog-container-max-width'?: string
  '--md-dialog-container-min-width'?: string
  '--md-dialog-container-padding'?: string
  '--md-dialog-container-shape'?: string
  '--md-dialog-focus-indicator-color'?: string
  '--md-dialog-headline-color'?: string
  '--md-dialog-icon-color'?: string
  '--md-dialog-icon-size'?: string
  '--md-dialog-scrim-color'?: string
  '--md-dialog-scrim-opacity'?: number | string
  '--md-dialog-supporting-text-color'?: string
}

export type MaterialDialogDismissReason = 'backdrop' | 'close' | 'escape'

type NativeDialogProps = Omit<
  DialogHTMLAttributes<HTMLDialogElement>,
  | 'aria-describedby'
  | 'aria-label'
  | 'aria-labelledby'
  | 'children'
  | 'onCancel'
  | 'onClick'
  | 'onPointerDown'
  | 'open'
  | 'style'
>

export type MaterialBasicDialogProps = NativeDialogProps & {
  'aria-describedby'?: string
  'aria-label'?: string
  'aria-labelledby'?: string
  children: ReactNode
  closeOnBackdropClick?: boolean
  closeOnEscape?: boolean
  initialFocusRef?: RefObject<HTMLElement | null>
  onDismissRequest: (reason: MaterialDialogDismissReason) => void
  open: boolean
  style?: MaterialDialogStyle
}

export type MaterialAlertDialogAlignment = 'auto' | 'center' | 'start'

export type MaterialAlertDialogProps = Omit<
  MaterialBasicDialogProps,
  'aria-describedby' | 'aria-labelledby' | 'children'
> & {
  actions?: ReactNode
  alignment?: MaterialAlertDialogAlignment
  children?: ReactNode
  confirmButton?: ReactNode
  dismissButton?: ReactNode
  divider?: boolean | ReactNode
  icon?: ReactNode
  supportingText?: ReactNode
  title?: ReactNode
}

export type MaterialFullScreenDialogProps = Omit<
  MaterialBasicDialogProps,
  'aria-labelledby' | 'children'
> & {
  action?: ReactNode
  children: ReactNode
  closeIcon: ReactNode
  closeLabel: string
  divider?: boolean | ReactNode
  headline: ReactNode
  safeAreaInsets?: boolean
  /** Side-entry page motion. The default preserves the standard dialog animation. */
  transition?: 'scale' | 'slide'
}

function assignRef<T>(ref: Ref<T> | undefined, value: T | null) {
  if (typeof ref === 'function') ref(value)
  else if (ref) ref.current = value
}

function joinClassNames(...classNames: Array<string | undefined>) {
  return classNames.filter(Boolean).join(' ')
}

function showDialog(dialog: HTMLDialogElement) {
  if (typeof dialog.showModal === 'function') dialog.showModal()
  else dialog.setAttribute('open', '')
}

function closeDialog(dialog: HTMLDialogElement) {
  if (typeof dialog.close === 'function') dialog.close()
  else dialog.removeAttribute('open')
}

export const MaterialBasicDialog = forwardRef<
  HTMLDialogElement,
  MaterialBasicDialogProps
>(function MaterialBasicDialog(
  {
    'aria-label': ariaLabel,
    'aria-labelledby': ariaLabelledBy,
    children,
    className,
    closeOnBackdropClick = true,
    closeOnEscape = true,
    initialFocusRef,
    onAnimationEnd,
    onClose,
    onTransitionEnd,
    onDismissRequest,
    open,
    style,
    ...dialogProps
  },
  forwardedRef,
) {
  const dialogRef = useRef<HTMLDialogElement | null>(null)
  const previousFocusRef = useRef<HTMLElement | null>(null)
  const backdropPointerRef = useRef(false)
  const phaseRef = useRef<'closed' | 'closing' | 'open'>('closed')
  const exitFallbackRef = useRef<number | undefined>(undefined)
  const [phase, setPhase] = useState<'closed' | 'closing' | 'open'>('closed')
  const [direction, setDirection] = useState<'ltr' | 'rtl'>('ltr')

  const updatePhase = (next: 'closed' | 'closing' | 'open') => {
    phaseRef.current = next
    setPhase(next)
  }

  const finishClose = () => {
    const dialog = dialogRef.current
    if (!dialog || phaseRef.current !== 'closing') return

    window.clearTimeout(exitFallbackRef.current)
    if (dialog.open) closeDialog(dialog)
    updatePhase('closed')

    if (
      previousFocusRef.current?.isConnected &&
      (document.activeElement === document.body || document.activeElement == null)
    ) {
      previousFocusRef.current.focus()
    }
  }

  useEffect(() => {
    const dialog = dialogRef.current
    if (!dialog) return

    window.clearTimeout(exitFallbackRef.current)

    if (open) {
      const resolvedDirection = getComputedStyle(dialog).direction === 'rtl' ? 'rtl' : 'ltr'
      // Set the initial side before showModal paints its starting style.
      dialog.dataset.direction = resolvedDirection
      setDirection(resolvedDirection)
      if (!dialog.open) {
        previousFocusRef.current =
          document.activeElement instanceof HTMLElement ? document.activeElement : null
        showDialog(dialog)
      }
      updatePhase('open')
      queueMicrotask(() => initialFocusRef?.current?.focus())
      return
    }

    if (dialog.open) {
      updatePhase('closing')
      if (dialog.dataset.transition === 'slide' && window.matchMedia?.('(prefers-reduced-motion: reduce)').matches) {
        finishClose()
        return
      }
      exitFallbackRef.current = window.setTimeout(finishClose, 500)
    } else {
      updatePhase('closed')
    }

    return () => window.clearTimeout(exitFallbackRef.current)
  }, [initialFocusRef, open])

  useEffect(
    () => () => {
      window.clearTimeout(exitFallbackRef.current)
    },
    [],
  )

  const handleCancel = (event: SyntheticEvent<HTMLDialogElement>) => {
    event.preventDefault()
    if (closeOnEscape) onDismissRequest('escape')
  }

  const handlePointerDown = (event: PointerEvent<HTMLDialogElement>) => {
    backdropPointerRef.current = event.target === event.currentTarget
  }

  const handleClick = (event: MouseEvent<HTMLDialogElement>) => {
    const backdropClick =
      backdropPointerRef.current && event.target === event.currentTarget
    backdropPointerRef.current = false
    if (backdropClick && closeOnBackdropClick) onDismissRequest('backdrop')
  }

  const handleClose = (event: SyntheticEvent<HTMLDialogElement>) => {
    onClose?.(event)
    if (phaseRef.current !== 'closing' && open) onDismissRequest('close')
  }

  return (
    <dialog
      {...dialogProps}
      aria-label={ariaLabel ?? (ariaLabelledBy == null ? 'Dialog' : undefined)}
      aria-labelledby={ariaLabelledBy}
      ref={(node) => {
        dialogRef.current = node
        assignRef(forwardedRef, node)
      }}
      className={joinClassNames('material-basic-dialog', className)}
      data-material-dialog
      data-state={phase}
      data-direction={direction}
      onAnimationEnd={(event: AnimationEvent<HTMLDialogElement>) => {
        onAnimationEnd?.(event)
        if (event.target === event.currentTarget && !event.pseudoElement && phase === 'closing') finishClose()
      }}
      onTransitionEnd={(event: TransitionEvent<HTMLDialogElement>) => {
        onTransitionEnd?.(event)
        if (event.target === event.currentTarget && event.propertyName === 'transform' && phase === 'closing') finishClose()
      }}
      onCancel={handleCancel}
      onClick={handleClick}
      onClose={handleClose}
      onPointerDown={handlePointerDown}
      style={style}
    >
      {children}
    </dialog>
  )
})

export const MaterialAlertDialog = forwardRef<
  HTMLDialogElement,
  MaterialAlertDialogProps
>(function MaterialAlertDialog(
  {
    'aria-label': ariaLabel,
    actions,
    alignment = 'auto',
    children,
    className,
    confirmButton,
    dismissButton,
    divider = false,
    icon,
    supportingText,
    title,
    ...dialogProps
  },
  ref,
) {
  const titleId = useId()
  const descriptionId = useId()
  const actionContent = actions ?? (
    <>
      {confirmButton}
      {dismissButton}
    </>
  )
  const hasBody = supportingText != null || children != null

  return (
    <MaterialBasicDialog
      {...dialogProps}
      ref={ref}
      aria-describedby={hasBody ? descriptionId : undefined}
      aria-label={title == null ? (ariaLabel ?? 'Dialog') : ariaLabel}
      aria-labelledby={title != null && ariaLabel == null ? titleId : undefined}
      className={joinClassNames('material-alert-dialog', className)}
      data-alignment={alignment}
      data-has-divider={divider ? 'true' : 'false'}
      data-has-icon={icon != null ? 'true' : 'false'}
      role="alertdialog"
    >
      <div className="material-alert-dialog__content">
        {icon != null ? <div className="material-alert-dialog__icon">{icon}</div> : null}
        {title != null ? (
          <div
            className="material-alert-dialog__headline"
            data-material-typography="headlineSmall"
            id={titleId}
          >
            {title}
          </div>
        ) : null}
        {hasBody ? (
          <div className="material-alert-dialog__body" id={descriptionId}>
            {supportingText != null ? (
              <div
                className="material-alert-dialog__supporting-text"
                data-material-typography="bodyMedium"
              >
                {supportingText}
              </div>
            ) : null}
            {children}
          </div>
        ) : null}
        {divider ? (
          typeof divider === 'boolean' ? (
            <MaterialHorizontalDivider />
          ) : (
            divider
          )
        ) : null}
        {actionContent ? (
          <div
            className="material-alert-dialog__actions"
            data-material-typography="labelLarge"
          >
            {actionContent}
          </div>
        ) : null}
      </div>
    </MaterialBasicDialog>
  )
})

export const MaterialFullScreenDialog = forwardRef<
  HTMLDialogElement,
  MaterialFullScreenDialogProps
>(function MaterialFullScreenDialog(
  {
    action,
    children,
    className,
    closeIcon,
    closeLabel,
    divider = false,
    headline,
    onDismissRequest,
    safeAreaInsets = true,
    transition = 'scale',
    ...dialogProps
  },
  ref,
) {
  const titleId = useId()

  return (
    <MaterialBasicDialog
      {...dialogProps}
      ref={ref}
      aria-labelledby={titleId}
      className={joinClassNames('material-full-screen-dialog', className)}
      data-transition={transition}
      onDismissRequest={onDismissRequest}
      role="dialog"
    >
      <div className="material-full-screen-dialog__surface">
        <MaterialTopAppBar
          actions={action}
          className="material-full-screen-dialog__header"
          navigationIcon={
            <MaterialAppBarIconButton
              aria-label={closeLabel}
              onClick={() => onDismissRequest('close')}
            >
              {closeIcon}
            </MaterialAppBarIconButton>
          }
          safeAreaInsets={safeAreaInsets}
          title={<span id={titleId}>{headline}</span>}
        />
        {divider ? (
          typeof divider === 'boolean' ? (
            <MaterialHorizontalDivider />
          ) : (
            divider
          )
        ) : null}
        <div className="material-full-screen-dialog__body">{children}</div>
      </div>
    </MaterialBasicDialog>
  )
})
