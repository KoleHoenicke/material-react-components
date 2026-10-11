/* RadioButton.kt motion adapted from AndroidX Material3. Apache-2.0.
 * Copyright 2021-2026 The Android Open Source Project. */
import { useLayoutEffect, useRef, type CSSProperties, type RefObject } from 'react'
import { getMaterialSpringAttributes, MATERIAL_RADIO_BUTTON_MOTION } from '../theme/materialMotion'
import { sampleMaterialSpring, type MaterialSpringState } from './materialSpring'
import { radioColorCss, readRadioColor, type RadioColor } from './radioColor'

export function useRadioButtonAnimation(
  selected: boolean, disabled: boolean, rootRef: RefObject<HTMLElement | null>, style?: CSSProperties,
) {
  const state = useRef<{
    radius: MaterialSpringState
    color: MaterialSpringState[] | null
    disabled: boolean
  } | null>(null)

  // Read resolved tokens when selection, enabled state, or explicit overrides change.
  useLayoutEffect(() => {
    const root = rootRef.current
    if (!root) return
    const icon = root.querySelector<SVGElement>('.material-radio-button__icon')!
    const targetElement = root.querySelector<HTMLElement>('.material-radio-button__color-target')!
    const styles = getComputedStyle(root)
    const resolvedDotSize = targetElement.getBoundingClientRect().width || parseFloat(styles.getPropertyValue('--md-radio-button-dot-size')) || 12
    const radiusTarget = selected ? resolvedDotSize / 2 : 0
    const colorTarget = readRadioColor(targetElement)
    const query = window.matchMedia?.('(prefers-reduced-motion: reduce)')
    const scheme = root.closest('[data-motion-scheme]')?.getAttribute('data-motion-scheme') === 'standard' ? 'standard' : 'expressive'
    const springToken = (kind: 'spatial' | 'effects', speed: 'fast' | 'default') => {
      const defaults = getMaterialSpringAttributes(kind, speed, scheme)
      return {
        dampingRatio: parseFloat(styles.getPropertyValue(`--md-sys-motion-spring-${speed}-${kind}-damping`)) || defaults.dampingRatio,
        stiffness: parseFloat(styles.getPropertyValue(`--md-sys-motion-spring-${speed}-${kind}-stiffness`)) || defaults.stiffness,
      }
    }
    const spatial = springToken('spatial', 'fast')
    const effects = springToken('effects', 'default')
    const current = state.current ??= {
      radius: { value: radiusTarget, velocity: 0 },
      color: colorTarget?.map(value => ({ value, velocity: 0 })) ?? null,
      disabled,
    }
    // Disabled color snaps immediately. Radius still animates, as in AndroidX.
    if (disabled || current.disabled !== disabled || !current.color) current.color = colorTarget?.map(value => ({ value, velocity: 0 })) ?? null
    current.disabled = disabled
    const initialRadius = { ...current.radius }
    const initialColor = current.color?.map(channel => ({ ...channel })) ?? null
    let frame = 0
    const began = performance.now()
    const write = () => {
      icon.style.setProperty('--md-radio-button-animated-dot-radius', `${current.radius.value}px`)
      if (current.color) icon.style.color = radioColorCss(current.color.map(channel => channel.value) as unknown as RadioColor)
      else icon.style.removeProperty('color')
    }
    const finish = () => {
      cancelAnimationFrame(frame)
      current.radius = { value: radiusTarget, velocity: 0 }
      current.color = colorTarget?.map(value => ({ value, velocity: 0 })) ?? null
      write()
      // Use the original CSS token when settled, preserving gamut and live theme changes.
      icon.style.removeProperty('color')
    }
    const settled = (channel: MaterialSpringState, target: number, threshold: number) =>
      Math.abs(channel.value - target) < threshold && Math.abs(channel.velocity) < threshold * MATERIAL_RADIO_BUTTON_MOTION.velocityThresholdMultiplier
    const tick = (now: number) => {
      if (query?.matches) { finish(); return }
      current.radius = sampleMaterialSpring(initialRadius, radiusTarget, now - began, spatial)
      if (colorTarget && initialColor && !disabled) {
        current.color = initialColor.map((channel, i) => sampleMaterialSpring(channel, colorTarget[i], now - began, effects))
      }
      const radiusSettled = settled(current.radius, radiusTarget, MATERIAL_RADIO_BUTTON_MOTION.radiusVisibilityThreshold)
      const colorSettled = !colorTarget || !current.color || disabled || current.color.every((channel, i) => settled(channel, colorTarget[i], MATERIAL_RADIO_BUTTON_MOTION.colorVisibilityThreshold))
      // Compose runs the two Animatables independently; each snaps at its own threshold.
      if (radiusSettled) current.radius = { value: radiusTarget, velocity: 0 }
      if (colorSettled && colorTarget) current.color = colorTarget.map(value => ({ value, velocity: 0 }))
      if (radiusSettled && colorSettled) { finish(); return }
      write()
      frame = requestAnimationFrame(tick)
    }
    write()
    if (query?.matches || !window.requestAnimationFrame) finish()
    else tick(began)
    const changed = () => { if (query?.matches) finish() }
    query?.addEventListener('change', changed)
    return () => { cancelAnimationFrame(frame); query?.removeEventListener('change', changed) }
  }, [selected, disabled, rootRef, style])
}
