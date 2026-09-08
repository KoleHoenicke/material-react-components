export type MaterialMotionScheme = 'expressive' | 'standard'
export type MaterialMotionKind = 'spatial' | 'effects'
export type MaterialMotionSpeed = 'fast' | 'default' | 'slow'
export type MaterialEasingSet = 'emphasized' | 'standard'
export type MaterialTransitionPhase = 'persistent' | 'enter' | 'exit'

export interface MaterialMotionCurve {
  durationMs: number
  easing: `cubic-bezier(${string})`
  controlPoints: readonly [number, number, number, number]
}

export type MaterialMotionPresetGroup = Record<
  MaterialMotionKind,
  Record<MaterialMotionSpeed, MaterialMotionCurve>
>

export interface MaterialSpringAttributes {
  dampingRatio: number
  stiffness: number
}

export type MaterialMotionSpringAttributeGroup = Record<
  MaterialMotionKind,
  Record<MaterialMotionSpeed, MaterialSpringAttributes>
>

export interface MaterialTransitionPair extends MaterialMotionCurve {
  transitionType: 'begin-and-end-on-screen' | 'enter-screen' | 'exit-screen'
}

export const MATERIAL_MOTION_DEFAULT_SCHEME: MaterialMotionScheme = 'expressive'

function curve(
  durationMs: number,
  easing: `cubic-bezier(${string})`,
  controlPoints: readonly [number, number, number, number],
): MaterialMotionCurve {
  return {
    durationMs,
    easing,
    controlPoints,
  }
}

export const MATERIAL_MOTION_PRESETS: Record<MaterialMotionScheme, MaterialMotionPresetGroup> = {
  expressive: {
    spatial: {
      fast: curve(350, 'cubic-bezier(0.42, 1.67, 0.21, 0.90)', [0.42, 1.67, 0.21, 0.9]),
      default: curve(500, 'cubic-bezier(0.38, 1.21, 0.22, 1.00)', [0.38, 1.21, 0.22, 1]),
      slow: curve(650, 'cubic-bezier(0.39, 1.29, 0.35, 0.98)', [0.39, 1.29, 0.35, 0.98]),
    },
    effects: {
      fast: curve(150, 'cubic-bezier(0.31, 0.94, 0.34, 1.00)', [0.31, 0.94, 0.34, 1]),
      default: curve(200, 'cubic-bezier(0.34, 0.80, 0.34, 1.00)', [0.34, 0.8, 0.34, 1]),
      slow: curve(300, 'cubic-bezier(0.34, 0.88, 0.34, 1.00)', [0.34, 0.88, 0.34, 1]),
    },
  },
  standard: {
    spatial: {
      fast: curve(350, 'cubic-bezier(0.27, 1.06, 0.18, 1.00)', [0.27, 1.06, 0.18, 1]),
      default: curve(500, 'cubic-bezier(0.27, 1.06, 0.18, 1.00)', [0.27, 1.06, 0.18, 1]),
      slow: curve(750, 'cubic-bezier(0.27, 1.06, 0.18, 1.00)', [0.27, 1.06, 0.18, 1]),
    },
    effects: {
      fast: curve(150, 'cubic-bezier(0.31, 0.94, 0.34, 1.00)', [0.31, 0.94, 0.34, 1]),
      default: curve(200, 'cubic-bezier(0.34, 0.80, 0.34, 1.00)', [0.34, 0.8, 0.34, 1]),
      slow: curve(300, 'cubic-bezier(0.34, 0.88, 0.34, 1.00)', [0.34, 0.88, 0.34, 1]),
    },
  },
}

export const DEFAULT_MATERIAL_MOTION_PRESETS =
  MATERIAL_MOTION_PRESETS[MATERIAL_MOTION_DEFAULT_SCHEME]

export const MATERIAL_TRANSITION_PAIRS: Record<
  MaterialEasingSet,
  Record<MaterialTransitionPhase, MaterialTransitionPair>
> = {
  emphasized: {
    persistent: {
      ...curve(500, 'cubic-bezier(0.2, 0, 0, 1)', [0.2, 0, 0, 1]),
      transitionType: 'begin-and-end-on-screen',
    },
    enter: {
      ...curve(400, 'cubic-bezier(0.05, 0.7, 0.1, 1.0)', [0.05, 0.7, 0.1, 1]),
      transitionType: 'enter-screen',
    },
    exit: {
      ...curve(200, 'cubic-bezier(0.3, 0.0, 0.8, 0.15)', [0.3, 0, 0.8, 0.15]),
      transitionType: 'exit-screen',
    },
  },
  standard: {
    persistent: {
      ...curve(300, 'cubic-bezier(0.2, 0.0, 0, 1.0)', [0.2, 0, 0, 1]),
      transitionType: 'begin-and-end-on-screen',
    },
    enter: {
      ...curve(250, 'cubic-bezier(0, 0, 0, 1)', [0, 0, 0, 1]),
      transitionType: 'enter-screen',
    },
    exit: {
      ...curve(200, 'cubic-bezier(0.3, 0, 1, 1)', [0.3, 0, 1, 1]),
      transitionType: 'exit-screen',
    },
  },
}

export const MATERIAL_MOTION_SPRING_ATTRIBUTES_BY_SCHEME: Record<
  MaterialMotionScheme,
  MaterialMotionSpringAttributeGroup
> = {
  expressive: {
    spatial: {
      fast: { dampingRatio: 0.6, stiffness: 800 },
      default: { dampingRatio: 0.8, stiffness: 380 },
      slow: { dampingRatio: 0.8, stiffness: 200 },
    },
    effects: {
      fast: { dampingRatio: 1, stiffness: 3800 },
      default: { dampingRatio: 1, stiffness: 1600 },
      slow: { dampingRatio: 1, stiffness: 800 },
    },
  },
  standard: {
    spatial: {
      fast: { dampingRatio: 0.9, stiffness: 1400 },
      default: { dampingRatio: 0.9, stiffness: 700 },
      slow: { dampingRatio: 0.9, stiffness: 300 },
    },
    effects: {
      fast: { dampingRatio: 1, stiffness: 3800 },
      default: { dampingRatio: 1, stiffness: 1600 },
      slow: { dampingRatio: 1, stiffness: 800 },
    },
  },
}

export const DEFAULT_MATERIAL_MOTION_SPRING_ATTRIBUTES =
  MATERIAL_MOTION_SPRING_ATTRIBUTES_BY_SCHEME[MATERIAL_MOTION_DEFAULT_SCHEME]

/** @deprecated Use DEFAULT_MATERIAL_MOTION_SPRING_ATTRIBUTES or getMaterialSpringAttributes. */
export const MATERIAL_MOTION_SPRING_ATTRIBUTES = DEFAULT_MATERIAL_MOTION_SPRING_ATTRIBUTES

export const MATERIAL_RIPPLE_TIMING = {
  hoverFadeMs: 15,
  pressFadeInMs: 105,
  pressFadeOutMs: 375,
  pressGrowMs: 450,
  minimumPressMs: 225,
  touchDelayMs: 150,
  initialOriginScale: 0.2,
  padding: 10,
  softEdgeMinimumSize: 75,
  softEdgeContainerRatio: 0.35,
} as const

export const MATERIAL_APP_BAR_TIMING = {
  scrollEndMs: 140,
  topSettleDurationMs: MATERIAL_MOTION_PRESETS.expressive.effects.default.durationMs,
  bottomSettleDurationMs: MATERIAL_MOTION_PRESETS.expressive.spatial.fast.durationMs,
} as const

export const MATERIAL_PROGRESS_TIMING = {
  linearIndeterminateCycleMs: 1750,
  linearFirstHeadDurationMs: 1000,
  linearFirstHeadDelayMs: 0,
  linearFirstTailDurationMs: 1000,
  linearFirstTailDelayMs: 250,
  linearSecondHeadDurationMs: 850,
  linearSecondHeadDelayMs: 650,
  linearSecondTailDurationMs: 850,
  linearSecondTailDelayMs: 900,
  circularIndeterminateCycleMs: 6000,
  circularAdditionalRotationStepMs: 1500,
  circularAdditionalRotationDurationMs: 300,
  wavyDeterminateDurationMs: 500,
  standardDeterminateSpring: {
    dampingRatio: 1,
    stiffness: 50,
    visibilityThreshold: 0.001,
  },
} as const

export function getMaterialMotionPreset(
  kind: MaterialMotionKind,
  speed: MaterialMotionSpeed,
  scheme: MaterialMotionScheme = MATERIAL_MOTION_DEFAULT_SCHEME,
) {
  return MATERIAL_MOTION_PRESETS[scheme][kind][speed]
}

export function getMaterialSpringAttributes(
  kind: MaterialMotionKind,
  speed: MaterialMotionSpeed,
  scheme: MaterialMotionScheme = MATERIAL_MOTION_DEFAULT_SCHEME,
) {
  return MATERIAL_MOTION_SPRING_ATTRIBUTES_BY_SCHEME[scheme][kind][speed]
}

export function getMaterialTransitionPair(
  easingSet: MaterialEasingSet,
  phase: MaterialTransitionPhase,
) {
  return MATERIAL_TRANSITION_PAIRS[easingSet][phase]
}

/** Rest time between repeated motion demonstrations. */
export const MATERIAL_MOTION_DEMONSTRATION_HOLD_MS = 1000
