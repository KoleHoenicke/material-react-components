/*
 * FAB count motion and spring duration are adapted from AndroidX Material3 and animation-core.
 * Copyright 2022-2026 The Android Open Source Project
 * Licensed under the Apache License, Version 2.0.
 */
import { useLayoutEffect, useRef, useState, type RefObject } from 'react'
import { getMaterialSpringAttributes } from '../theme/materialMotion'

/** AndroidX animates the visible item count with SlowEffects and an Int threshold of 1. */
export function useFabMenuStagger(expanded: boolean, count: number, rootRef: RefObject<HTMLElement | null>) {
  const target = expanded ? count : 0
  const [visibleCount, setVisibleCount] = useState(target)
  const state = useRef({ value: target, velocity: 0 })

  useLayoutEffect(() => {
    const query = window.matchMedia?.('(prefers-reduced-motion: reduce)')
    let frame = 0
    const start = () => {
      window.cancelAnimationFrame(frame)
      if (query?.matches || !window.requestAnimationFrame) {
        state.current = { value: target, velocity: 0 }
        setVisibleCount(target)
        return
      }
      const scheme = rootRef.current?.closest('[data-motion-scheme]')?.getAttribute('data-motion-scheme') === 'standard' ? 'standard' : 'expressive'
      const { stiffness } = getMaterialSpringAttributes('effects', 'slow', scheme)
      const frequency = Math.sqrt(stiffness)
      const displacement = Math.round(state.current.value) - target
      const coefficient = state.current.velocity + frequency * displacement
      if (displacement === 0 && state.current.velocity === 0) return
      const duration = estimateCriticalSpringDurationMs(frequency, displacement, state.current.velocity)
      const started = window.performance.now()
      const tick = (now: number) => {
        const seconds = Math.floor(now - started) / 1000
        const decay = Math.exp(-frequency * seconds)
        const offset = (displacement + coefficient * seconds) * decay
        const velocity = (coefficient - frequency * (displacement + coefficient * seconds)) * decay
        const done = now - started >= duration
        state.current = done ? { value: target, velocity: 0 } : { value: target + offset, velocity }
        setVisibleCount(Math.max(0, Math.min(count, Math.round(state.current.value))))
        if (!done) frame = window.requestAnimationFrame(tick)
      }
      frame = window.requestAnimationFrame(tick)
    }
    start()
    query?.addEventListener('change', start)
    return () => { window.cancelAnimationFrame(frame); query?.removeEventListener('change', start) }
  }, [count, rootRef, target])
  return visibleCount
}

// SpringEstimation.estimateCriticallyDamped, with the FAB count's delta of 1.
function estimateCriticalSpringDurationMs(frequency: number, displacement: number, velocity: number) {
  if (displacement === 0 && velocity === 0) return 0
  const r = -frequency
  const c1 = Math.abs(displacement)
  const v0 = displacement < 0 ? -velocity : velocity
  const c2 = v0 - r * c1
  const t1 = Math.log(Math.abs(1 / c1)) / r
  const guess = Math.log(Math.abs(1 / c2))
  let t2 = guess
  for (let i = 0; i <= 5; i++) t2 = guess - Math.log(Math.abs(t2 / r))
  t2 /= r
  let t = !Number.isFinite(t1) ? t2 : !Number.isFinite(t2) ? t1 : Math.max(t1, t2)
  const inflection = -(r * c1 + c2) / (r * c2)
  const xInflection = (c1 + c2 * inflection) * Math.exp(r * inflection)
  let delta = -1
  if (inflection > 0 && -xInflection < 1) {
    if (c2 < 0 && c1 > 0) t = 0
  } else if (inflection > 0) {
    t = -2 / r - c1 / c2
    delta = 1
  }
  for (let i = 0; i < 100; i++) {
    const previous = t
    t -= ((c1 + c2 * t) * Math.exp(r * t) + delta) /
      ((c2 * (r * t + 1) + c1 * r) * Math.exp(r * t))
    if (Math.abs(t - previous) <= 0.001) break
  }
  return Number.isFinite(t) ? Math.max(0, Math.trunc(t * 1000)) : 0
}
