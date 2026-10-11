import { useLayoutEffect, type RefObject } from 'react'

/** Measure browser font baselines rather than assuming an Android font rasterizer. */
export function useSnackbarLayout(rootRef: RefObject<HTMLDivElement | null>, content: unknown) {
  useLayoutEffect(() => {
    const root = rootRef.current
    if (!root) return
    const text = root.querySelector<HTMLElement>('.material-snackbar__text')!
    const baseline = root.querySelector<HTMLElement>('.material-snackbar__baseline')!
    let active = true
    const measure = () => {
      if (!active) return
      const box = text.getBoundingClientRect()
      const lineHeight = parseFloat(getComputedStyle(text).lineHeight)
      if (!box.height || !lineHeight) return
      const firstBaseline = baseline.getBoundingClientRect().top - box.top
      root.style.setProperty('--_snackbar-first-baseline', `${firstBaseline}px`)
      // Normal text and explicit <br> use the same baseline-based layout as Compose Text.
      const lastBaseline = firstBaseline + Math.max(0, Math.round(box.height / lineHeight) - 1) * lineHeight
      root.style.setProperty('--_snackbar-below-last-baseline', `${box.height - lastBaseline}px`)
      root.dataset.multiline = String(box.height > lineHeight + 1)
    }
    measure()
    const observer = new ResizeObserver(measure)
    observer.observe(text)
    document.fonts?.addEventListener('loadingdone', measure)
    void document.fonts?.ready.then(measure)
    return () => { active = false; observer.disconnect(); document.fonts?.removeEventListener('loadingdone', measure) }
  }, [rootRef, content])
}
