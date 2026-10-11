/* Snackbar.kt geometry and tokens adapted from AndroidX Material3. Apache-2.0.
 * Copyright 2021-2026 The Android Open Source Project. */
import { forwardRef, useImperativeHandle, useRef, type CSSProperties, type HTMLAttributes, type ReactNode } from 'react'
import { MaterialButton } from './MaterialButton'
import { MaterialIconButton } from './MaterialIconButton'
import { useSnackbarLayout } from '../internal/useSnackbarLayout'
import type { MaterialSnackbarData } from './MaterialSnackbarState'
import './MaterialSnackbar.css'

export type MaterialSnackbarStyle = CSSProperties & {
  [token: `--md-snackbar-${string}`]: string | number | undefined
}

export type MaterialSnackbarProps = Omit<HTMLAttributes<HTMLDivElement>, 'children' | 'style'> & {
  children?: ReactNode
  action?: ReactNode
  dismissAction?: ReactNode
  actionOnNewLine?: boolean
  snackbarData?: MaterialSnackbarData
  /** Matches ComposeMaterial3Flags.isSnackbarStylingFixEnabled, false at the pinned revision. */
  stylingFix?: boolean
  dismissLabel?: string
  dismissIcon?: ReactNode
  containerColor?: string
  contentColor?: string
  actionContentColor?: string
  dismissActionContentColor?: string
  shape?: string
  style?: MaterialSnackbarStyle
}

export const MaterialSnackbar = forwardRef<HTMLDivElement, MaterialSnackbarProps>(function MaterialSnackbar({
  children, action, dismissAction, actionOnNewLine = false, snackbarData,
  stylingFix = false, dismissLabel = 'Dismiss', dismissIcon,
  containerColor, contentColor, actionContentColor, dismissActionContentColor, shape,
  style, className, ...props
}, forwardedRef) {
  const ref = useRef<HTMLDivElement>(null)
  useImperativeHandle(forwardedRef, () => ref.current!, [])
  const content = children ?? snackbarData?.visuals.message
  useSnackbarLayout(ref, content)
  const resolvedAction = action ?? (snackbarData?.visuals.actionLabel != null
    ? <MaterialButton variant="text" className="material-snackbar__action-button" onClick={() => snackbarData.performAction()}>{snackbarData.visuals.actionLabel}</MaterialButton>
    : null)
  const resolvedDismiss = dismissAction ?? (snackbarData?.visuals.withDismissAction
    ? <MaterialIconButton colorMode="inherit" animated={false} aria-label={dismissLabel} title={dismissLabel} onClick={() => snackbarData.dismiss()}>
      {dismissIcon ?? <svg viewBox="0 0 24 24" aria-hidden="true" focusable="false"><path fill="currentColor" d="M19 6.41 17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12Z" /></svg>}
    </MaterialIconButton> : null)
  const newLine = actionOnNewLine && resolvedAction != null
  const tokens: MaterialSnackbarStyle = { ...style }
  for (const [name, value] of Object.entries({ 'container-color': containerColor, 'content-color': contentColor, 'action-content-color': actionContentColor, 'dismiss-content-color': dismissActionContentColor, shape })) {
    if (value !== undefined) tokens[`--md-snackbar-${name}`] = value
  }
  return <div {...props} ref={ref} className={['material-snackbar', className].filter(Boolean).join(' ')} style={tokens}
    data-material-snackbar data-data-layout={snackbarData ? 'true' : undefined}
    data-action-new-line={String(newLine)} data-has-dismiss={String(resolvedDismiss != null)} data-styling-fix={String(stylingFix)}>
    <div className="material-snackbar__surface">
      <div className="material-snackbar__text-box"><div className="material-snackbar__text" data-material-typography="bodyMedium"><span className="material-snackbar__baseline" aria-hidden="true" />{content}</div></div>
      {(resolvedAction != null || resolvedDismiss != null) && <div className="material-snackbar__controls">
        {resolvedAction != null && <div className="material-snackbar__action" data-material-typography="labelLarge">{resolvedAction}</div>}
        {resolvedDismiss != null && <div className="material-snackbar__dismiss">{resolvedDismiss}</div>}
      </div>}
    </div>
  </div>
})
