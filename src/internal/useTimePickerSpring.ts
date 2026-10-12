import { useLayoutEffect, useRef, useState, type RefObject } from 'react'
import { getMaterialSpringAttributes, MATERIAL_TIME_PICKER_MOTION, type MaterialMotionKind, type MaterialMotionSpeed, type MaterialSpringAttributes } from '../theme/materialMotion'
import { sampleMaterialSpring, type MaterialSpringState } from './materialSpring'
import { nearestClockAngle } from './timePickerGeometry'

/** Compose Float Animatable, retaining position and velocity on interruption. */
export function useTimePickerSpring(target: number, root: RefObject<HTMLElement | null>, kind: MaterialMotionKind = 'spatial', speed: MaterialMotionSpeed = 'default', snap = false, angular = false, override?: MaterialSpringAttributes) {
  const current = useRef<MaterialSpringState>({ value: target, velocity: 0 })
  const [result, setResult] = useState({ value: target, settled: true })
  useLayoutEffect(() => {
    const node = root.current
    const styles = node ? getComputedStyle(node) : null
    const scheme = node?.closest('[data-motion-scheme]')?.getAttribute('data-motion-scheme') === 'standard' ? 'standard' : 'expressive'
    const defaults = getMaterialSpringAttributes(kind, speed, scheme)
    const spring = override ?? {
      dampingRatio: parseFloat(styles?.getPropertyValue(`--md-sys-motion-spring-${speed}-${kind}-damping`) ?? '') || defaults.dampingRatio,
      stiffness: parseFloat(styles?.getPropertyValue(`--md-sys-motion-spring-${speed}-${kind}-stiffness`) ?? '') || defaults.stiffness,
    }
    const end = angular ? nearestClockAngle(current.current.value, target) : target
    const initial = { ...current.current }
    const query = window.matchMedia?.('(prefers-reduced-motion: reduce)')
    let frame = 0
    const finish = () => {
      cancelAnimationFrame(frame)
      current.current = { value: end, velocity: 0 }
      setResult({ value: end, settled: true })
    }
    const began = performance.now()
    const tick = (now: number) => {
      if (query?.matches || snap) { finish(); return }
      current.current = sampleMaterialSpring(initial, end, now - began, spring)
      if (Math.abs(current.current.value - end) < MATERIAL_TIME_PICKER_MOTION.visibilityThreshold && Math.abs(current.current.velocity) < MATERIAL_TIME_PICKER_MOTION.velocityThreshold) { finish(); return }
      setResult({ value: current.current.value, settled: false })
      frame = requestAnimationFrame(tick)
    }
    tick(began)
    const changed = () => { if (query?.matches) finish() }
    query?.addEventListener('change', changed)
    return () => { cancelAnimationFrame(frame); query?.removeEventListener('change', changed) }
  }, [target, root, kind, speed, snap, angular, override])
  return result
}
