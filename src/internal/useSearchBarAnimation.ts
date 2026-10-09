import { useLayoutEffect, useRef, useState, type RefObject } from 'react'
import { sampleMaterialSpring } from './materialSpring'
import { searchEasing } from './searchGeometry'
import { getMaterialSpringAttributes, MATERIAL_SEARCH_MOTION, type MaterialMotionScheme } from '../theme/materialMotion'
export type MaterialSearchBarMotion = 'standard' | 'contained' | 'docked-with-gap' | 'legacy'
export function useSearchBarAnimation(expanded: boolean, motion: MaterialSearchBarMotion, anchor: RefObject<HTMLElement | null>, snapVersion: number) {
  const initial = expanded ? 1 : 0
  const [values, setValues] = useState({ progress: initial, contentProgress: initial, isAnimating: false })
  const animation = useRef({ value: initial, velocity: 0, content: initial, target: initial, snapVersion })
  useLayoutEffect(() => {
    let frame = 0
    const query = window.matchMedia?.('(prefers-reduced-motion: reduce)')
    const target = expanded ? 1 : 0
    const current = animation.current
    const scheme: MaterialMotionScheme = anchor.current?.closest('[data-motion-scheme]')?.getAttribute('data-motion-scheme') === 'standard' ? 'standard' : 'expressive'
    const speed = motion === 'contained' ? 'fast' : motion === 'docked-with-gap' ? expanded ? 'default' : 'fast' : expanded ? 'slow' : 'default'
    const spring = getMaterialSpringAttributes('spatial', speed, scheme)
    const start = { value: current.value, velocity: current.velocity }
    const startContent = current.content
    const interrupted = current.value > 0 && current.value < 1
    const immediate = current.snapVersion !== snapVersion
    current.snapVersion = snapVersion
    current.target = target
    const began = performance.now()
    const finish = () => {
      cancelAnimationFrame(frame)
      Object.assign(current, { value: target, velocity: 0, content: target })
      setValues({ progress: target, contentProgress: target, isAnimating: false })
    }
    const tick = (now: number) => {
      if (query?.matches || immediate) { finish(); return }
      const elapsed = now - began
      let sampled
      let settled
      if (motion === 'legacy') {
        const duration = expanded ? MATERIAL_SEARCH_MOTION.legacyExpandMs : MATERIAL_SEARCH_MOTION.legacyCollapseMs
        const delay = interrupted ? 0 : MATERIAL_SEARCH_MOTION.legacyDelayMs
        const t = Math.max(0, elapsed - delay) / duration
        const easing = expanded ? MATERIAL_SEARCH_MOTION.legacyEnterEasing : MATERIAL_SEARCH_MOTION.legacyExitEasing
        sampled = { value: start.value + (target - start.value) * searchEasing(t, easing), velocity: 0 }
        settled = t >= 1
      } else {
        sampled = sampleMaterialSpring(start, target, elapsed, spring)
        settled = Math.abs(sampled.value - target) < MATERIAL_SEARCH_MOTION.visibilityThreshold && Math.abs(sampled.velocity) < MATERIAL_SEARCH_MOTION.velocityThreshold
      }
      current.value = sampled.value
      current.velocity = sampled.velocity
      const delayedContent = motion === 'contained' || motion === 'docked-with-gap'
      const fadeTime = (elapsed - (expanded ? MATERIAL_SEARCH_MOTION.contentEnterDelayMs : 0)) / MATERIAL_SEARCH_MOTION.contentFadeMs
      current.content = delayedContent ? startContent + (target - startContent) * searchEasing(fadeTime, expanded ? MATERIAL_SEARCH_MOTION.contentEnterEasing : MATERIAL_SEARCH_MOTION.contentExitEasing) : Math.min(1, Math.max(0, sampled.value))
      if (settled && (!delayedContent || fadeTime >= 1)) { finish(); return }
      setValues({ progress: Math.min(1, Math.max(0, sampled.value)), contentProgress: current.content, isAnimating: true })
      frame = requestAnimationFrame(tick)
    }
    if (query?.matches || immediate || (Math.abs(start.value - target) < 0.000001 && !start.velocity)) finish()
    else { setValues(v => ({ ...v, isAnimating: true })); frame = requestAnimationFrame(tick) }
    const changed = () => { if (query?.matches) finish() }
    query?.addEventListener('change', changed)
    return () => { cancelAnimationFrame(frame); query?.removeEventListener('change', changed) }
  }, [expanded, motion, anchor, snapVersion])
  return values
}
