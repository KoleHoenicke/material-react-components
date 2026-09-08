import { useEffect, useRef, useState } from 'react'
import { Checkbox, MATERIAL_MOTION_DEMONSTRATION_HOLD_MS, MATERIAL_MOTION_PRESETS, Switch, Text, type MaterialMotionScheme } from '../../src'

function MotionRow({ kind, speed, scheme, running }: {
  kind: 'spatial' | 'effects'; speed: 'fast' | 'default' | 'slow'; scheme: MaterialMotionScheme; running: boolean
}) {
  const row = useRef<HTMLDivElement>(null)
  const [advanced, setAdvanced] = useState(false)
  const duration = MATERIAL_MOTION_PRESETS[scheme][kind][speed].durationMs
  useEffect(() => {
    if (!running) return
    const hold = Number.parseFloat(getComputedStyle(row.current!).getPropertyValue('--m3-motion-demonstration-hold-duration')) || MATERIAL_MOTION_DEMONSTRATION_HOLD_MS
    let timer: ReturnType<typeof setTimeout>
    function advance() {
      setAdvanced(value => !value)
      timer = setTimeout(advance, duration + hold)
    }
    timer = setTimeout(advance, hold)
    return () => clearTimeout(timer)
  }, [duration, running])
  return <div ref={row} className="motion-row" data-moved={advanced} data-highlighted={advanced}>
    <Text variant="labelLarge">{speed === 'default' ? 'Default' : speed === 'fast' ? 'Fast' : 'Slow'} · {duration} ms</Text>
    {kind === 'spatial' ? <div className="motion-track" aria-hidden="true">
      <div className="motion-marker" style={{ transition: `left var(--m3-motion-transition-${speed}-spatial)` }} />
    </div> : <div className="motion-effect" aria-hidden="true" style={{ transition: `background-color var(--m3-motion-transition-${speed}-effects), opacity var(--m3-motion-transition-${speed}-effects)` }} />}
  </div>
}

const speeds = ['fast', 'default', 'slow'] as const

export function MotionExamples({ scheme, onSchemeChange, active }: {
  active: boolean
  scheme: MaterialMotionScheme
  onSchemeChange: (scheme: MaterialMotionScheme) => void
}) {
  const [paused, setPaused] = useState(false)
  const [allowed, setAllowed] = useState(false)
  useEffect(() => {
    if (typeof window.matchMedia !== 'function') return
    const media = window.matchMedia('(prefers-reduced-motion: reduce)')
    const update = () => setAllowed(!media.matches && !document.hidden)
    update()
    media.addEventListener('change', update)
    document.addEventListener('visibilitychange', update)
    return () => { media.removeEventListener('change', update); document.removeEventListener('visibilitychange', update) }
  }, [])
  const running = active && allowed && !paused
  return (
    <div className="motion-examples">
      <div className="motion-heading">
        <Text as="h2" variant="headlineMedium">Motion</Text>
        <label className="mode-control">
          <Text variant="labelLarge">Expressive motion</Text>
          <Switch aria-label="Use expressive motion preview" checked={scheme === 'expressive'} onChange={event => onSchemeChange(event.currentTarget.checked ? 'expressive' : 'standard')} />
        </label>
        <label className="mode-control"><Checkbox checked={paused} onChange={event => setPaused(event.currentTarget.checked)} />Pause previews</label>
      </div>
      <Text as="p" variant="bodyLarge">Compare fast, default, and slow motion. The scheme switch also updates the rest of the gallery.</Text>
      <article className="specimen">
        <header className="specimen__header">
          <Text as="h3" variant="titleLarge">Spatial motion</Text>
          <Text as="p" variant="bodyMedium">Spatial tokens move and resize elements. Each marker moves automatically and rests for one second at each end.</Text>
        </header>
        <div className="specimen__stage motion-tracks">
          {speeds.map(speed => <MotionRow key={speed} kind="spatial" speed={speed} scheme={scheme} running={running} />)}
        </div>
      </article>
      <article className="specimen">
        <header className="specimen__header">
          <Text as="h3" variant="titleLarge">Effects motion</Text>
          <Text as="p" variant="bodyMedium">Effects tokens change color and opacity. Each tile changes automatically, with a one-second pause between transitions.</Text>
        </header>
        <div className="specimen__stage motion-effects">
          {speeds.map(speed => <MotionRow key={speed} kind="effects" speed={speed} scheme={scheme} running={running} />)}
        </div>
      </article>
      <Text as="p" variant="bodyMedium">These examples use the library's CSS motion presets. With reduced motion enabled on your device, the previews stay still. You can also pause them here.</Text>
    </div>
  )
}
