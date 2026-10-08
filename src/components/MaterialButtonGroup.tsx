import {
  type ButtonHTMLAttributes,
  type CSSProperties,
  type KeyboardEvent as ReactKeyboardEvent,
  type MouseEvent as ReactMouseEvent,
  type PointerEvent as ReactPointerEvent,
  type ReactNode,
  type TransitionEvent as ReactTransitionEvent,
  useEffect,
  useLayoutEffect,
  useRef,
  useState,
} from 'react'
import {
  MaterialButton,
  type MaterialButtonShape,
  type MaterialButtonSize,
  type MaterialButtonVariant,
} from './MaterialButton'
import './MaterialButtonGroup.css'

type MaterialButtonGroupOptionButtonProps = Omit<
  ButtonHTMLAttributes<HTMLButtonElement>,
  'aria-label' | 'children' | 'disabled' | 'onClick' | 'type'
> & {
  [dataAttribute: `data-${string}`]: string | undefined
}

export type MaterialButtonGroupOption<TValue extends string> = {
  ariaLabel: string
  buttonProps?: MaterialButtonGroupOptionButtonProps
  content: ReactNode
  disabled?: boolean
  iconOnly?: boolean
  leadingIcon?: ReactNode
  selected?: boolean
  title?: string
  value: TValue
}

export type MaterialButtonGroupVariant = 'connected' | 'standard'
export type MaterialButtonGroupSelectionMode = 'multiple' | 'none' | 'single'
export type MaterialButtonGroupWidthInteraction = 'none' | 'push'
export type MaterialButtonGroupActivationTiming = 'after-paint' | 'immediate'

export type MaterialButtonGroupProps<TValue extends string> = {
  activationTiming?: MaterialButtonGroupActivationTiming
  ariaLabel: string
  buttonVariant?: Exclude<MaterialButtonVariant, 'text'>
  className?: string
  fullWidth?: boolean
  itemSizing?: 'content' | 'equal'
  onActiveClick?: (value: TValue) => void
  onChange: (value: TValue) => void
  onOptionClickCapture?: (
    event: ReactMouseEvent<HTMLButtonElement>,
    value: TValue,
    active: boolean,
  ) => boolean | void
  onOptionBlur?: (value: TValue) => void
  onOptionFocus?: (value: TValue) => void
  onOptionPointerEnter?: (value: TValue) => void
  options: readonly MaterialButtonGroupOption<TValue>[]
  selectionMode?: MaterialButtonGroupSelectionMode
  shape?: MaterialButtonShape
  size?: MaterialButtonSize
  value: TValue
  variant?: MaterialButtonGroupVariant
  widthInteraction?: MaterialButtonGroupWidthInteraction
}

const COMPRESSION_LIMITS: Record<MaterialButtonSize, number> = {
  'extra-small': 12,
  small: 16,
  medium: 24,
  large: 48,
  'extra-large': 64,
}

const MIN_QUICK_PRESS_PROGRESS = 0.75
const MIN_DEFERRED_RELEASE_SHAPE_PROGRESS = 0.75

type PendingActivation = {
  activation: () => void
  index: number
}

function expandedWidths(
  widths: readonly number[],
  pressedIndex: number,
  compressionLimit: number,
) {
  if (widths.length < 2) {
    return [...widths]
  }

  const next = [...widths]
  const lastIndex = widths.length - 1

  if (pressedIndex > 0 && pressedIndex < lastIndex) {
    const growthPerNeighbor = Math.min((widths[pressedIndex] * 0.15) / 2, compressionLimit)
    const leftGrowth = Math.min(growthPerNeighbor, widths[pressedIndex - 1])
    const rightGrowth = Math.min(growthPerNeighbor, widths[pressedIndex + 1])
    next[pressedIndex - 1] -= leftGrowth
    next[pressedIndex + 1] -= rightGrowth
    next[pressedIndex] += leftGrowth + rightGrowth
    return next
  }

  const neighborIndex = pressedIndex === 0 ? 1 : lastIndex - 1
  const growth = Math.min(widths[pressedIndex] * 0.15, compressionLimit, widths[neighborIndex])
  next[neighborIndex] -= growth
  next[pressedIndex] += growth
  return next
}

function widthsMatch(
  first: readonly number[] | null,
  second: readonly number[] | null,
) {
  return Boolean(
    first &&
      second &&
      first.length === second.length &&
      first.every((width, index) => Math.abs(width - second[index]) < 0.5),
  )
}

export function MaterialButtonGroup<TValue extends string>({
  activationTiming = 'immediate',
  ariaLabel,
  buttonVariant = 'filled',
  className,
  fullWidth = false,
  itemSizing = 'content',
  onActiveClick,
  onChange,
  onOptionClickCapture,
  onOptionBlur,
  onOptionFocus,
  onOptionPointerEnter,
  options,
  selectionMode = 'single',
  shape = 'round',
  size = 'small',
  value,
  variant = 'standard',
  widthInteraction = 'push',
}: MaterialButtonGroupProps<TValue>) {
  const groupRef = useRef<HTMLDivElement | null>(null)
  const buttonRefs = useRef<Array<HTMLButtonElement | null>>([])
  const restingWidthsRef = useRef<number[] | null>(null)
  const animatedWidthsRef = useRef<number[] | null>(null)
  const pressedIndexRef = useRef<number | null>(null)
  const releaseAnimationFrameRef = useRef<number | null>(null)
  const transitionResetFrameRef = useRef<number | null>(null)
  const activationAnimationFrameRef = useRef<number | null>(null)
  const activationTimeoutRef = useRef<number | null>(null)
  const activationPaintFrameCountRef = useRef(0)
  const pendingActivationRef = useRef<PendingActivation | null>(null)
  const [animatedWidths, setAnimatedWidths] = useState<number[] | null>(null)
  const [pressedIndex, setPressedIndex] = useState<number | null>(null)
  const [rapidPressIndex, setRapidPressIndex] = useState<number | null>(null)
  const selectedIndex =
    selectionMode === 'single'
      ? options.findIndex((option) => option.selected ?? option.value === value)
      : -1
  const tabStopIndex =
    selectedIndex >= 0 ? selectedIndex : options.findIndex((option) => !option.disabled)
  const rootClassName = [
    'material-button-group',
    `material-button-group--${variant}`,
    className,
  ]
    .filter(Boolean)
    .join(' ')

  useEffect(() => {
    if (
      pressedIndex !== null &&
      (options[pressedIndex]?.disabled || widthInteraction === 'none')
    ) {
      pressedIndexRef.current = null
      animatedWidthsRef.current = null
      setPressedIndex(null)
      setRapidPressIndex(null)
      setAnimatedWidths(null)
    }
  }, [options, pressedIndex, widthInteraction])

  useLayoutEffect(() => {
    restingWidthsRef.current = null
    const group = groupRef.current

    if (!group) {
      return
    }

    const scheduledFrames = new Set<number>()
    const measureRestingWidths = () => {
      if (pressedIndexRef.current !== null || animatedWidthsRef.current !== null) {
        return
      }

      const widths = buttonRefs.current.map(
        (button) => button?.getBoundingClientRect().width ?? 0,
      )

      if (widths.length === options.length && widths.every((width) => width > 0)) {
        restingWidthsRef.current = widths
      }
    }
    const scheduleMeasurement = () => {
      const frame = requestAnimationFrame(() => {
        scheduledFrames.delete(frame)
        measureRestingWidths()
      })
      scheduledFrames.add(frame)
    }
    const resizeObserver = new ResizeObserver(scheduleMeasurement)
    resizeObserver.observe(group)
    scheduleMeasurement()

    return () => {
      resizeObserver.disconnect()
      scheduledFrames.forEach((frame) => cancelAnimationFrame(frame))
    }
  }, [options.length, size, variant, fullWidth, itemSizing])

  useEffect(
    () => () => {
      if (transitionResetFrameRef.current !== null) {
        cancelAnimationFrame(transitionResetFrameRef.current)
      }
      if (releaseAnimationFrameRef.current !== null) {
        cancelAnimationFrame(releaseAnimationFrameRef.current)
      }
      if (activationAnimationFrameRef.current !== null) {
        cancelAnimationFrame(activationAnimationFrameRef.current)
      }
      if (activationTimeoutRef.current !== null) {
        window.clearTimeout(activationTimeoutRef.current)
      }
    },
    [],
  )

  function writeWidths(widths: readonly number[]) {
    buttonRefs.current.forEach((button, index) => {
      const width = widths[index]

      if (!button || width === undefined) {
        return
      }

      button.style.setProperty('flex-basis', `${width}px`)
      button.style.setProperty('flex-grow', '0')
      button.style.setProperty('flex-shrink', '0')
      button.style.setProperty('width', `${width}px`)
    })
  }

  function writePressedIndex(index: number | null) {
    buttonRefs.current.forEach((button, buttonIndex) => {
      if (buttonIndex === index) {
        button?.setAttribute('data-pressed', 'true')
      } else {
        button?.removeAttribute('data-pressed')
      }
    })
  }

  function writeRapidPressIndex(index: number | null) {
    buttonRefs.current.forEach((button, buttonIndex) => {
      if (buttonIndex === index) {
        button?.setAttribute('data-rapid-press', 'true')
      } else {
        button?.removeAttribute('data-rapid-press')
      }
    })
  }

  function setWidthTransitionsEnabled(enabled: boolean) {
    buttonRefs.current.forEach((button) => {
      if (enabled) {
        button?.style.removeProperty('transition')
      } else {
        button?.style.setProperty('transition', 'none')
      }
    })
  }

  function lockWidthsWithoutTransition(widths: readonly number[]) {
    setWidthTransitionsEnabled(false)
    writeWidths(widths)
    groupRef.current?.getBoundingClientRect()
    setWidthTransitionsEnabled(true)
  }

  function beginPress(index: number) {
    if (options[index]?.disabled) {
      return
    }

    const rapidPress =
      activationTiming === 'after-paint' &&
      (pendingActivationRef.current !== null || animatedWidthsRef.current !== null)

    if (releaseAnimationFrameRef.current !== null) {
      cancelAnimationFrame(releaseAnimationFrameRef.current)
      releaseAnimationFrameRef.current = null
    }
    pressedIndexRef.current = index
    writePressedIndex(index)
    writeRapidPressIndex(rapidPress ? index : null)
    setPressedIndex(index)
    setRapidPressIndex(rapidPress ? index : null)

    if (widthInteraction === 'none') {
      return
    }

    const measuredWidths = buttonRefs.current.map(
      (button) => button?.getBoundingClientRect().width ?? 0,
    )
    const widths =
      restingWidthsRef.current?.length === measuredWidths.length
        ? [...restingWidthsRef.current]
        : measuredWidths

    if (widths.some((width) => width <= 0)) {
      return
    }

    restingWidthsRef.current ??= [...widths]
    if (animatedWidthsRef.current === null) {
      lockWidthsWithoutTransition(widths)
    }
    const nextWidths = expandedWidths(widths, index, COMPRESSION_LIMITS[size])
    animatedWidthsRef.current = nextWidths
    writeWidths(nextWidths)
    setAnimatedWidths(nextWidths)
  }

  function animateWidthsBackToRest() {
    if (widthInteraction === 'push' && restingWidthsRef.current) {
      const nextWidths = [...restingWidthsRef.current]
      animatedWidthsRef.current = nextWidths
      writeWidths(nextWidths)
      setAnimatedWidths(nextWidths)
      return
    }

    animatedWidthsRef.current = null
    setAnimatedWidths(null)
  }

  function endPress() {
    const releasedIndex = pressedIndexRef.current

    if (releasedIndex === null) {
      return
    }

    pressedIndexRef.current = null
    writePressedIndex(null)
    writeRapidPressIndex(null)
    setPressedIndex(null)
    setRapidPressIndex(null)

    const restingWidths = restingWidthsRef.current
    const pressedWidths = animatedWidthsRef.current

    if (
      widthInteraction !== 'push' ||
      !restingWidths ||
      !pressedWidths ||
      restingWidths.length !== pressedWidths.length
    ) {
      animateWidthsBackToRest()
      return
    }

    const pressedDistance = Math.abs(
      pressedWidths[releasedIndex] - restingWidths[releasedIndex],
    )

    if (pressedDistance < 0.5) {
      animateWidthsBackToRest()
      return
    }

    // AndroidX lets a quick tap reach 75% of its pressed width before returning.
    // This preserves the expressive impulse without imposing a fixed hold duration.
    const continuePressImpulse = () => {
      if (pressedIndexRef.current !== null) {
        releaseAnimationFrameRef.current = null
        return
      }

      const currentWidth =
        buttonRefs.current[releasedIndex]?.getBoundingClientRect().width ??
        restingWidths[releasedIndex]
      const progress =
        Math.abs(currentWidth - restingWidths[releasedIndex]) / pressedDistance

      if (progress >= MIN_QUICK_PRESS_PROGRESS) {
        releaseAnimationFrameRef.current = null
        animateWidthsBackToRest()
        return
      }

      releaseAnimationFrameRef.current = requestAnimationFrame(continuePressImpulse)
    }

    continuePressImpulse()
  }

  function releasedShapeProgress(index: number) {
    if (
      pressedIndexRef.current !== null ||
      buttonRefs.current.some((button) => button?.matches(':active'))
    ) {
      return 0
    }

    const button = buttonRefs.current[index]

    if (!button || variant !== 'standard') {
      return 1
    }

    const style = getComputedStyle(button)
    const currentRadii = [
      style.borderTopLeftRadius,
      style.borderTopRightRadius,
      style.borderBottomRightRadius,
      style.borderBottomLeftRadius,
    ].map(Number.parseFloat)
    const pressedRadius = Number.parseFloat(
      style.getPropertyValue('--md-button-pressed-shape'),
    )
    const restingRadius = Number.parseFloat(
      style.getPropertyValue(
        button.classList.contains('material-button--selected')
          ? '--md-button-selected-shape'
          : '--md-button-resting-shape',
      ),
    )
    const visualInset = Number.parseFloat(
      style.getPropertyValue('--md-button-visual-inset'),
    )
    const visualRadius = Math.max(
      0,
      (button.getBoundingClientRect().height -
        (Number.isFinite(visualInset) ? visualInset * 2 : 0)) /
        2,
    )

    if (
      !Number.isFinite(pressedRadius) ||
      !Number.isFinite(restingRadius) ||
      currentRadii.some((radius) => !Number.isFinite(radius)) ||
      visualRadius <= 0
    ) {
      return 1
    }

    const pressedVisualRadius = Math.min(pressedRadius, visualRadius)
    const restingVisualRadius = Math.min(restingRadius, visualRadius)

    if (restingVisualRadius - pressedVisualRadius < 0.5) {
      return 1
    }

    const currentVisualRadius = Math.min(
      ...currentRadii.map((radius) => Math.min(radius, visualRadius)),
    )

    return Math.max(
      0,
      Math.min(
        1,
        (currentVisualRadius - pressedVisualRadius) /
          (restingVisualRadius - pressedVisualRadius),
      ),
    )
  }

  function schedulePendingActivation() {
    if (
      activationAnimationFrameRef.current !== null ||
      activationTimeoutRef.current !== null ||
      pendingActivationRef.current === null
    ) {
      return
    }

    activationAnimationFrameRef.current = requestAnimationFrame(() => {
      activationAnimationFrameRef.current = null
      activationPaintFrameCountRef.current += 1
      const pendingActivation = pendingActivationRef.current

      if (
        !pendingActivation ||
        activationPaintFrameCountRef.current < 2 ||
        releasedShapeProgress(pendingActivation.index) <
          MIN_DEFERRED_RELEASE_SHAPE_PROGRESS
      ) {
        schedulePendingActivation()
        return
      }

      activationTimeoutRef.current = window.setTimeout(() => {
        activationTimeoutRef.current = null
        const latestPendingActivation = pendingActivationRef.current

        if (
          !latestPendingActivation ||
          releasedShapeProgress(latestPendingActivation.index) <
            MIN_DEFERRED_RELEASE_SHAPE_PROGRESS
        ) {
          schedulePendingActivation()
          return
        }

        pendingActivationRef.current = null
        activationPaintFrameCountRef.current = 0
        latestPendingActivation.activation()
      }, 0)
    })
  }

  function runActivationAfterPaint(activation: () => void, index: number) {
    if (activationTiming === 'immediate') {
      activation()
      return
    }

    pendingActivationRef.current = { activation, index }
    activationPaintFrameCountRef.current = 0

    if (activationTimeoutRef.current !== null) {
      window.clearTimeout(activationTimeoutRef.current)
      activationTimeoutRef.current = null
    }

    schedulePendingActivation()
  }

  function handleWidthTransitionEnd(event: ReactTransitionEvent<HTMLButtonElement>) {
    if (
      event.target === event.currentTarget &&
      event.propertyName === 'width' &&
      pressedIndexRef.current === null &&
      widthsMatch(animatedWidthsRef.current, restingWidthsRef.current) &&
      transitionResetFrameRef.current === null
    ) {
      setWidthTransitionsEnabled(false)
      animatedWidthsRef.current = null
      setAnimatedWidths(null)
      transitionResetFrameRef.current = requestAnimationFrame(() => {
        transitionResetFrameRef.current = null
        setWidthTransitionsEnabled(true)
      })
    }
  }

  function handlePointerDown(event: ReactPointerEvent<HTMLButtonElement>, index: number) {
    if (!event.isPrimary || event.button !== 0) {
      return
    }

    event.currentTarget.setPointerCapture?.(event.pointerId)
    beginPress(index)
  }

  function handlePointerEnd(event: ReactPointerEvent<HTMLButtonElement>) {
    if (event.currentTarget.hasPointerCapture?.(event.pointerId)) {
      event.currentTarget.releasePointerCapture(event.pointerId)
    }
    endPress()
  }

  function handleKeyDown(event: ReactKeyboardEvent<HTMLButtonElement>, index: number) {
    if (
      selectionMode === 'single' &&
      ['ArrowDown', 'ArrowLeft', 'ArrowRight', 'ArrowUp', 'End', 'Home'].includes(event.key)
    ) {
      event.preventDefault()

      const enabledIndices = options.flatMap((option, optionIndex) =>
        option.disabled ? [] : [optionIndex],
      )

      if (enabledIndices.length === 0) {
        return
      }

      const currentPosition = Math.max(0, enabledIndices.indexOf(index))
      const rtl = getComputedStyle(event.currentTarget).direction === 'rtl'
      const previous = event.key === 'ArrowUp' || (event.key === 'ArrowLeft' && !rtl) ||
        (event.key === 'ArrowRight' && rtl)
      const nextIndex =
        event.key === 'Home'
          ? enabledIndices[0]
          : event.key === 'End'
            ? enabledIndices.at(-1)
            : enabledIndices[
                (currentPosition + (previous ? -1 : 1) + enabledIndices.length) %
                  enabledIndices.length
              ]

      if (nextIndex !== undefined) {
        const nextOption = options[nextIndex]

        if (nextOption && !(nextOption.selected ?? nextOption.value === value)) {
          onChange(nextOption.value)
        }
        buttonRefs.current[nextIndex]?.focus()
      }
      return
    }

    if (!event.repeat && (event.key === ' ' || event.key === 'Enter')) {
      beginPress(index)
    }
  }

  function handleKeyUp(event: ReactKeyboardEvent<HTMLButtonElement>) {
    if (event.key === ' ' || event.key === 'Enter') {
      endPress()
    }
  }

  const rootRole = selectionMode === 'single' ? 'radiogroup' : 'group'

  return (
    <div
      ref={groupRef}
      className={rootClassName}
      role={rootRole}
      aria-label={ariaLabel}
      data-activation-timing={activationTiming}
      data-shape={shape}
      data-size={size}
      data-variant={variant}
      data-width-interaction={widthInteraction}
      data-full-width={fullWidth}
      data-item-sizing={itemSizing}
      style={{ '--m3-button-group-item-count': options.length } as CSSProperties}
    >
      {options.map((option, index) => {
        const active = option.selected ?? (selectionMode === 'single' && option.value === value)
        const leading = index === 0
        const trailing = index === options.length - 1
        const single = options.length === 1
        const toggle = selectionMode === 'single' || option.selected !== undefined
        const buttonRole = selectionMode === 'single' ? 'radio' : undefined
        const animatedWidth = animatedWidths?.[index]
        const animationStyle = animatedWidth
          ? {
              flexBasis: `${animatedWidth}px`,
              flexGrow: 0,
              flexShrink: 0,
              width: `${animatedWidth}px`,
            }
          : undefined

        return (
          <MaterialButton
            {...option.buttonProps}
            key={option.value}
            ref={(button) => {
              buttonRefs.current[index] = button
            }}
            className={[
              'material-button-group__button',
              active ? 'material-button-group__button--selected' : '',
              single ? 'material-button-group__button--single' : '',
              leading ? 'material-button-group__button--leading' : '',
              !leading && !trailing ? 'material-button-group__button--middle' : '',
              trailing ? 'material-button-group__button--trailing' : '',
              option.buttonProps?.className,
            ]
              .filter(Boolean)
              .join(' ')}
            role={buttonRole}
            aria-label={option.ariaLabel}
            data-pressed={pressedIndex === index ? 'true' : undefined}
            data-rapid-press={rapidPressIndex === index ? 'true' : undefined}
            disabled={option.disabled}
            iconOnly={option.iconOnly}
            leadingIcon={option.leadingIcon}
            selected={active}
            shape={shape}
            size={size}
            style={{ ...option.buttonProps?.style, ...animationStyle }}
            tabIndex={
              selectionMode === 'single'
                ? index === tabStopIndex
                  ? 0
                  : -1
                : option.buttonProps?.tabIndex
            }
            title={option.title}
            toggle={toggle}
            variant={buttonVariant}
            onPointerDown={(event) => handlePointerDown(event, index)}
            onPointerUp={handlePointerEnd}
            onPointerCancel={handlePointerEnd}
            onLostPointerCapture={endPress}
            onTransitionEnd={handleWidthTransitionEnd}
            onPointerEnter={() => onOptionPointerEnter?.(option.value)}
            onKeyDown={(event) => handleKeyDown(event, index)}
            onKeyUp={handleKeyUp}
            onFocus={() => onOptionFocus?.(option.value)}
            onBlur={() => {
              endPress()
              onOptionBlur?.(option.value)
            }}
            onClickCapture={(event) => {
              onOptionClickCapture?.(event, option.value, active)
            }}
            onClick={() => {
              runActivationAfterPaint(
                () => {
                  if (active) {
                    onActiveClick?.(option.value)
                    return
                  }

                  onChange(option.value)
                },
                index,
              )
            }}
          >
            <span className="material-button-group__content">{option.content}</span>
          </MaterialButton>
        )
      })}
    </div>
  )
}
