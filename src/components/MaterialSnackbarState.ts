/* Adapted from AndroidX SnackbarHost.kt. Apache-2.0.
 * Copyright 2021-2026 The Android Open Source Project. */
import { useState } from 'react'

export type MaterialSnackbarDuration = 'short' | 'long' | 'indefinite'
export type MaterialSnackbarResult = 'action-performed' | 'dismissed'

export interface MaterialSnackbarVisuals {
  message: string
  actionLabel?: string | null
  withDismissAction?: boolean
  duration?: MaterialSnackbarDuration
}

export interface MaterialSnackbarData {
  readonly visuals: Readonly<Required<MaterialSnackbarVisuals>>
  performAction(): void
  dismiss(): void
}

export const MATERIAL_SNACKBAR_DEFAULTS = {
  maxWidth: 600, singleLineHeight: 48, twoLineHeight: 68,
  horizontalSpacing: 16, buttonSideSpacing: 8, textEndSpacing: 8,
  verticalPadding: 6, updatedVerticalPadding: 14, firstBaseline: 30,
  newLineLastBaselinePadding: 12, newLineBottomPadding: 2,
  updatedActionBottomPadding: 4, outerPadding: 12,
  shortDurationMs: 4000, longDurationMs: 10000,
  containerColor: 'var(--md-sys-color-inverse-surface)',
  contentColor: 'var(--md-sys-color-inverse-on-surface)',
  actionContentColor: 'var(--md-sys-color-inverse-primary)',
  dismissActionContentColor: 'var(--md-sys-color-inverse-on-surface)',
  shape: 'var(--md-sys-shape-corner-extra-small)',
} as const

type Request = {
  data: MaterialSnackbarData
  complete(result: MaterialSnackbarResult): void
  cancel(): void
}

/** One active snackbar and a FIFO queue, matching SnackbarHostState's fair mutex. */
export class MaterialSnackbarHostState {
  private queue: Request[] = []
  private listeners = new Set<() => void>()
  get currentSnackbarData(): MaterialSnackbarData | null { return this.queue[0]?.data ?? null }
  getSnapshot = () => this.currentSnackbarData
  subscribe = (listener: () => void) => {
    this.listeners.add(listener)
    return () => { this.listeners.delete(listener) }
  }
  private notify() { this.listeners.forEach(listener => listener()) }

  /** Resolves when acted on or dismissed. An AbortSignal cancels active or queued work. */
  showSnackbar(visuals: MaterialSnackbarVisuals | string, options?: { signal?: AbortSignal }): Promise<MaterialSnackbarResult> {
    const input = typeof visuals === 'string' ? { message: visuals } : visuals
    const resolved = Object.freeze({
      message: input.message, actionLabel: input.actionLabel ?? null,
      withDismissAction: input.withDismissAction ?? false,
      duration: input.duration ?? (input.actionLabel != null ? 'indefinite' : 'short'),
    })
    const signal = options?.signal
    return new Promise((resolve, reject) => {
      if (signal?.aborted) { reject(signal.reason ?? new DOMException('Snackbar cancelled', 'AbortError')); return }
      let settled = false
      const remove = () => {
        signal?.removeEventListener('abort', request.cancel)
        const index = this.queue.indexOf(request)
        if (index >= 0) this.queue.splice(index, 1)
        if (index === 0) this.notify()
      }
      const request: Request = {
        data: { visuals: resolved, performAction: () => request.complete('action-performed'), dismiss: () => request.complete('dismissed') },
        complete: result => {
          // Queued requests have no displayed controls and cannot be completed early.
          if (settled || this.currentSnackbarData !== request.data) return
          settled = true; remove(); resolve(result)
        },
        cancel: () => {
          if (settled) return
          settled = true; remove(); reject(signal?.reason ?? new DOMException('Snackbar cancelled', 'AbortError'))
        },
      }
      signal?.addEventListener('abort', request.cancel, { once: true })
      this.queue.push(request)
      if (this.queue.length === 1) this.notify()
    })
  }
}

export function useMaterialSnackbarHostState() {
  const [state] = useState(() => new MaterialSnackbarHostState())
  return state
}
