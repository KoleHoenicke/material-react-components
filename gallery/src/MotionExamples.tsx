import { useState } from 'react'
import { Button, MATERIAL_MOTION_PRESETS, Switch, Text, type MaterialMotionScheme } from '../../src'

const speeds = ['fast', 'default', 'slow'] as const

export function MotionExamples({ scheme, onSchemeChange }: {
  scheme: MaterialMotionScheme
  onSchemeChange: (scheme: MaterialMotionScheme) => void
}) {
  const [moved, setMoved] = useState(false)
  const [highlighted, setHighlighted] = useState(false)
  return (
    <div className="motion-examples">
      <div className="motion-heading">
        <Text as="h2" variant="headlineMedium">Motion</Text>
        <label className="mode-control">
          <Text variant="labelLarge">Expressive motion</Text>
          <Switch aria-label="Use expressive motion preview" checked={scheme === 'expressive'} onChange={event => onSchemeChange(event.currentTarget.checked ? 'expressive' : 'standard')} />
        </label>
      </div>
      <Text as="p" variant="bodyLarge">Compare fast, default, and slow motion. The scheme switch also updates the rest of the gallery.</Text>
      <article className="specimen">
        <header className="specimen__header">
          <Text as="h3" variant="titleLarge">Spatial motion</Text>
          <Text as="p" variant="bodyMedium">Spatial tokens move and resize elements. Toggle the positions to compare how each speed settles.</Text>
          <Button onClick={() => setMoved(value => !value)} aria-pressed={moved}>Toggle positions</Button>
        </header>
        <div className="specimen__stage motion-tracks" data-moved={moved}>
          {speeds.map(speed => (
            <div className="motion-row" key={speed}>
              <Text variant="labelLarge">{speed === 'default' ? 'Default' : speed === 'fast' ? 'Fast' : 'Slow'} · {MATERIAL_MOTION_PRESETS[scheme].spatial[speed].durationMs} ms</Text>
              <div className="motion-track" aria-hidden="true">
                <div className="motion-marker" style={{ transition: `left var(--m3-motion-transition-${speed}-spatial)` }} />
              </div>
            </div>
          ))}
        </div>
      </article>
      <article className="specimen">
        <header className="specimen__header">
          <Text as="h3" variant="titleLarge">Effects motion</Text>
          <Text as="p" variant="bodyMedium">Effects tokens change color and opacity. These transitions use the same timing in both schemes.</Text>
          <Button onClick={() => setHighlighted(value => !value)} aria-pressed={highlighted}>Toggle emphasis</Button>
        </header>
        <div className="specimen__stage motion-effects" data-highlighted={highlighted}>
          {speeds.map(speed => (
            <div className="motion-row" key={speed}>
              <Text variant="labelLarge">{speed === 'default' ? 'Default' : speed === 'fast' ? 'Fast' : 'Slow'} · {MATERIAL_MOTION_PRESETS[scheme].effects[speed].durationMs} ms</Text>
              <div className="motion-effect" aria-hidden="true" style={{ transition: `background-color var(--m3-motion-transition-${speed}-effects), opacity var(--m3-motion-transition-${speed}-effects)` }} />
            </div>
          ))}
        </div>
      </article>
      <Text as="p" variant="bodyMedium">These examples use the library's CSS motion presets. With reduced motion enabled on your device, they switch directly to the final state.</Text>
    </div>
  )
}
