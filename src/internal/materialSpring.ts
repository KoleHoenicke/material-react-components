/* Adapted from AndroidX animation-core SpringSimulation. Apache-2.0.
 * Copyright 2022-2026 The Android Open Source Project. */
import type { MaterialSpringAttributes } from '../theme/materialMotion'

export type MaterialSpringState = { value: number; velocity: number }

/** Analytic spring solution. Velocity is in units per second; interruptions retain it. */
export function sampleMaterialSpring(
  initial: MaterialSpringState, target: number, elapsedMs: number,
  { dampingRatio, stiffness }: MaterialSpringAttributes,
): MaterialSpringState {
  const time = Math.max(0, elapsedMs) / 1000
  const frequency = Math.sqrt(stiffness)
  const displacement = initial.value - target
  if (dampingRatio < 1) {
    const damped = frequency * Math.sqrt(1 - dampingRatio * dampingRatio)
    const decayRate = dampingRatio * frequency
    const coefficient = (initial.velocity + decayRate * displacement) / damped
    const decay = Math.exp(-decayRate * time)
    const cosine = Math.cos(damped * time)
    const sine = Math.sin(damped * time)
    const offset = displacement * cosine + coefficient * sine
    return {
      value: target + decay * offset,
      velocity: decay * (-decayRate * offset + damped * (coefficient * cosine - displacement * sine)),
    }
  }
  if (dampingRatio === 1) {
    const coefficient = initial.velocity + frequency * displacement
    const decay = Math.exp(-frequency * time)
    return {
      value: target + (displacement + coefficient * time) * decay,
      velocity: (coefficient - frequency * (displacement + coefficient * time)) * decay,
    }
  }
  const root = Math.sqrt(dampingRatio * dampingRatio - 1)
  const r1 = -frequency * (dampingRatio - root)
  const r2 = -frequency * (dampingRatio + root)
  const c1 = (initial.velocity - r2 * displacement) / (r1 - r2)
  const c2 = displacement - c1
  return {
    value: target + c1 * Math.exp(r1 * time) + c2 * Math.exp(r2 * time),
    velocity: c1 * r1 * Math.exp(r1 * time) + c2 * r2 * Math.exp(r2 * time),
  }
}
