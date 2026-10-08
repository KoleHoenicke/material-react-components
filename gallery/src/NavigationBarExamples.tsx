import { useState } from 'react'
import { NavigationBar, NavigationBarItem, Switch } from '../../src'
import { GallerySymbol } from './GallerySymbol'
import './NavigationBarExamples.css'

const destinations = [
  { label: 'Home', icon: 'home' },
  { label: 'Search', icon: 'search' },
  { label: 'Favorites', icon: 'favorite' },
  { label: 'Library', icon: 'collections_bookmark' },
  { label: 'Profile', icon: 'account_circle' },
]

export function NavigationBarExamples() {
  const [rtl, setRtl] = useState(false)
  const [selected, setSelected] = useState([0, 0, 0])
  const examples = [
    { title: 'Three destinations', count: 3, labels: 'always' },
    { title: 'Four destinations, icons only', count: 4, labels: 'none' },
    { title: 'Five destinations, selected label', count: 5, labels: 'selected' },
  ] as const

  return (
    <>
      <label className="navigation-bar-examples__direction">
        <span>Right-to-left layout</span>
        <Switch aria-label="Right-to-left navigation bars" checked={rtl} onChange={event => setRtl(event.currentTarget.checked)} />
      </label>
      <div className="navigation-bar-examples" dir={rtl ? 'rtl' : 'ltr'}>
        {examples.map((example, index) => (
          <div className="navigation-bar-examples__preview" data-destinations={example.count} key={example.title}>
            <span className="stage-label" data-material-typography="labelMediumEmphasized">{example.title}</span>
            <NavigationBar aria-label={example.title} safeAreaInsets={false}>
              {destinations.slice(0, example.count).map((item, itemIndex) => (
                <NavigationBarItem
                  key={item.label}
                  aria-label={item.label}
                  icon={<GallerySymbol name={item.icon} />}
                  selectedIcon={<GallerySymbol name={item.icon} filled />}
                  label={example.labels === 'none' ? undefined : item.label}
                  alwaysShowLabel={example.labels === 'always'}
                  selected={selected[index] === itemIndex}
                  disabled={example.count === 5 && itemIndex === 4}
                  onClick={() => setSelected(current => current.map((value, barIndex) => barIndex === index ? itemIndex : value))}
                />
              ))}
            </NavigationBar>
          </div>
        ))}
      </div>
      <p data-material-typography="bodyMedium">Select a destination or use arrow keys, Home, and End to move focus. Profile is disabled in the five-destination example.</p>
    </>
  )
}
