/* Adapted from AndroidX SnackbarHost.kt and animation-core. Apache-2.0.
 * Copyright 2021-2026 The Android Open Source Project. */
import { useLayoutEffect, useRef, type RefObject } from 'react'
import { getMaterialSpringAttributes, MATERIAL_SNACKBAR_MOTION } from '../theme/materialMotion'
import { sampleMaterialSpring, type MaterialSpringState } from './materialSpring'

export function useSnackbarAnimation(ref: RefObject<HTMLDivElement | null>, visible: boolean, onExited: () => void) {
  const state = useRef<{ opacity: MaterialSpringState; scale: MaterialSpringState } | null>(null)
  const callback = useRef(onExited)
  callback.current = onExited
  useLayoutEffect(() => {
    const root = ref.current
    if (!root) return
    root.inert = !visible
    const styles = getComputedStyle(root)
    const hiddenScale = parseFloat(styles.getPropertyValue('--md-snackbar-hidden-scale')) || MATERIAL_SNACKBAR_MOTION.hiddenScale
    const current = state.current ??= {
      opacity: { value: visible ? 0 : 1, velocity: 0 },
      scale: { value: visible ? hiddenScale : 1, velocity: 0 },
    }
    const initial = { opacity: { ...current.opacity }, scale: { ...current.scale } }
    const scheme = root.closest('[data-motion-scheme]')?.getAttribute('data-motion-scheme') === 'standard' ? 'standard' : 'expressive'
    const token = (kind: 'spatial' | 'effects') => {
      const defaults = getMaterialSpringAttributes(kind, 'fast', scheme)
      return {
        dampingRatio: parseFloat(styles.getPropertyValue(`--md-sys-motion-spring-fast-${kind}-damping`)) || defaults.dampingRatio,
        stiffness: parseFloat(styles.getPropertyValue(`--md-sys-motion-spring-fast-${kind}-stiffness`)) || defaults.stiffness,
      }
    }
    const effects = token('effects'), spatial = token('spatial')
    const query = window.matchMedia?.('(prefers-reduced-motion: reduce)')
    const opacityTarget = visible ? 1 : 0, scaleTarget = visible ? 1 : hiddenScale
    const started = performance.now()
    let frame = 0, completed = false
    const write = () => {
      root.style.opacity = String(Math.max(0, Math.min(1, current.opacity.value)))
      root.style.transform = `scale(${current.scale.value})`
    }
    const settled = (value: MaterialSpringState, target: number) =>
      Math.abs(value.value - target) < MATERIAL_SNACKBAR_MOTION.visibilityThreshold && Math.abs(value.velocity) < MATERIAL_SNACKBAR_MOTION.velocityThreshold
    const finish = () => {
      cancelAnimationFrame(frame)
      current.opacity = { value: opacityTarget, velocity: 0 }
      current.scale = { value: scaleTarget, velocity: 0 }
      write()
      if (!visible && !completed) { completed = true; callback.current() }
    }
    const tick = (now: number) => {
      if (query?.matches) { finish(); return }
      current.opacity = sampleMaterialSpring(initial.opacity, opacityTarget, now - started, effects)
      current.scale = sampleMaterialSpring(initial.scale, scaleTarget, now - started, spatial)
      const opacityDone = settled(current.opacity, opacityTarget)
      const scaleDone = settled(current.scale, scaleTarget)
      if (opacityDone) current.opacity = { value: opacityTarget, velocity: 0 }
      if (scaleDone) current.scale = { value: scaleTarget, velocity: 0 }
      // AndroidX removes exiting content when opacity finishes, independently of scale.
      if ((!visible && opacityDone) || (opacityDone && scaleDone)) { finish(); return }
      write(); frame = requestAnimationFrame(tick)
    }
    write()
    if (query?.matches || !window.requestAnimationFrame) finish()
    else tick(started)
    const changed = () => { if (query?.matches) finish() }
    query?.addEventListener('change', changed)
    return () => { cancelAnimationFrame(frame); query?.removeEventListener('change', changed) }
  }, [ref, visible])
}
