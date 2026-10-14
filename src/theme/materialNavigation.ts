export type MaterialNavigationPattern = 'shared-axis-z' | 'shared-axis-x' | 'fade-through'
export type MaterialNavigationDirection = 'forward' | 'back'

/** MaterialSharedAxis, MaterialFadeThrough, ScaleProvider and FadeThroughProvider. */
export const MATERIAL_NAVIGATION_MOTION = {
  durationMs: 450, fadeThreshold: 0.35, incomingScale: 0.8, outgoingScale: 1.1,
  fadeThroughScale: 0.92, slideDistance: 30,
} as const

export function getMaterialNavigationKeyframes(
  pattern: MaterialNavigationPattern,
  direction: MaterialNavigationDirection = 'forward',
  reducedMotion = false,
  rtl = false,
): { incoming: Keyframe[]; outgoing: Keyframe[] } {
  const { fadeThreshold, incomingScale, outgoingScale, fadeThroughScale, slideDistance } = MATERIAL_NAVIGATION_MOTION
  let enter = 'none', exit = 'none'
  if (!reducedMotion) {
    if (pattern === 'shared-axis-z') {
      enter = `scale(${direction === 'forward' ? incomingScale : outgoingScale})`
      exit = `scale(${direction === 'forward' ? outgoingScale : incomingScale})`
    } else if (pattern === 'shared-axis-x') {
      const distance = slideDistance * (direction === 'back' ? -1 : 1) * (rtl ? -1 : 1)
      enter = `translateX(${distance}px)`
      exit = `translateX(${-distance}px)`
    } else enter = `scale(${fadeThroughScale})`
  }
  return {
    incoming: [{ transform: enter, opacity: 0, offset: 0 }, { opacity: 0, offset: fadeThreshold }, { transform: 'none', opacity: 1, offset: 1 }],
    outgoing: [{ transform: 'none', opacity: 1, offset: 0 }, { opacity: 0, offset: fadeThreshold }, { transform: exit, opacity: 0, offset: 1 }],
  }
}

export interface MaterialNavigationTransitionOptions {
  /** Return a promise for router navigation; resolve it after the destination commits. */
  update: () => void | Promise<void>
  /** Resolve again after update if navigation replaces the content node. Exclude app/navigation bars. */
  target: () => HTMLElement | null
  pattern?: MaterialNavigationPattern
  direction?: MaterialNavigationDirection
}

type Running = { cancel: () => void }
const running = new WeakMap<Document, Running>()

/** Snapshot-based exits without mounting a second copy of interactive React content.
 * Older webviews use the same incoming motion. A new navigation supersedes a pending snapshot.
 */
export async function runMaterialNavigationTransition({ update, target, pattern = 'shared-axis-z', direction = 'forward' }: MaterialNavigationTransitionOptions): Promise<void> {
  if (typeof document === 'undefined') { await update(); return }
  const doc = document
  running.get(doc)?.cancel()
  let superseded = false
  let transition: ViewTransition | undefined
  const animations: Animation[] = []
  const named = new Map<HTMLElement, string>()
  const name = 'material-navigation-page'
  const root = doc.documentElement
  const oldTarget = target()
  let cleaned = false
  const cleanup = () => {
    if (cleaned) return
    cleaned = true
    for (const [element, original] of named) element.style.viewTransitionName = original
    animations.forEach(animation => animation.cancel())
    if (running.get(doc) === current) {
      delete root.dataset.materialNavigation
      running.delete(doc)
    }
  }
  const current: Running = { cancel: () => { superseded = true; transition?.skipTransition(); cleanup() } }
  running.set(doc, current)
  const reduce = doc.defaultView?.matchMedia('(prefers-reduced-motion: reduce)').matches ?? false
  const style = oldTarget && doc.defaultView?.getComputedStyle(oldTarget)
  const duration = reduce ? 150 : Number.parseFloat(style?.getPropertyValue('--md-sys-motion-duration-long1') || '') || MATERIAL_NAVIGATION_MOTION.durationMs
  const easing = style?.getPropertyValue('--md-sys-motion-easing-emphasized').trim() || 'cubic-bezier(0.2, 0, 0, 1)'
  const frames = getMaterialNavigationKeyframes(pattern, direction, reduce, style?.direction === 'rtl')
  const assignName = (element: HTMLElement | null) => {
    if (!element || named.has(element)) return
    named.set(element, element.style.viewTransitionName)
    element.style.viewTransitionName = name
  }
  try {
    if (!oldTarget || !doc.startViewTransition) {
      await update()
      if (superseded) return
      const incoming = target()
      if (incoming?.animate) {
        animations.push(incoming.animate(frames.incoming, { duration, easing, fill: 'both' }))
        await Promise.all(animations.map(animation => animation.finished))
      }
      return
    }
    assignName(oldTarget)
    root.dataset.materialNavigation = pattern
    transition = doc.startViewTransition(async () => {
      if (superseded) return
      await update()
      if (!superseded) assignName(target())
    })
    try {
      await transition.ready
      if (superseded) return
      animations.push(
        root.animate(frames.outgoing, { duration, easing, fill: 'both', pseudoElement: `::view-transition-old(${name})` }),
        root.animate(frames.incoming, { duration, easing, fill: 'both', pseudoElement: `::view-transition-new(${name})` }),
      )
      await Promise.all(animations.map(animation => animation.finished))
    } catch {
      // Snapshot/animation support differs between embedded browsers. The update still commits.
      transition.skipTransition()
    }
    await transition.updateCallbackDone
    // Keep root overrides until the browser removes the snapshot tree. Removing
    // them earlier restarts the UA crossfade and briefly ghosts persistent chrome.
    await transition.finished
  } catch (error) {
    // Cancellation rejects Animation.finished, but application update failures remain observable.
    if (!(error instanceof Error && error.name === 'AbortError')) throw error
  } finally { cleanup() }
}
