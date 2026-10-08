import { useId, useState } from 'react'
import {
  Badge, LeadingIconTab, PrimaryScrollableTabRow, PrimaryTabIndicator, PrimaryTabRow,
  ScrollableTabRow, SecondaryScrollableTabRow, SecondaryTabIndicator, SecondaryTabRow,
  Switch, Tab, TabPanel, TabRow, type MaterialFixedTabRowProps,
} from '../../src'
import { TabExampleIcon } from './TabExampleIcons'
import './TabExamples.css'

const destinations = [
  { text: 'Music', icon: 'music_note' }, { text: 'Podcasts', icon: 'podcasts' },
  { text: 'Audio books', icon: 'headphones' }, { text: 'Radio', icon: 'radio' },
  { text: 'Downloads', icon: 'download' }, { text: 'Favorites', icon: 'favorite' },
] as const
const rows = [
  { title: 'Primary fixed', Row: PrimaryTabRow, count: 3 },
  { title: 'Secondary fixed', Row: SecondaryTabRow, count: 3 },
  { title: 'Primary scrollable', Row: PrimaryScrollableTabRow, count: 6 },
  { title: 'Secondary scrollable', Row: SecondaryScrollableTabRow, count: 6 },
] as const
const layouts = ['Text', 'Icon', 'Stacked icon and text', 'Leading icon'] as const

function Preview({ Row, title, count, layout }: {
  Row: React.ComponentType<MaterialFixedTabRowProps>; title: string; count: number; layout: typeof layouts[number]
}) {
  const id = useId()
  const [selected, setSelected] = useState(0)
  return <div className="tab-examples__preview">
    <span className="stage-label" data-material-typography="labelMediumEmphasized">{layout}</span>
    <Row selectedTabIndex={selected} aria-label={`${title}, ${layout.toLowerCase()}`}>
      {destinations.slice(0, count).map((item, index) => {
        const props = {
          id: `${id}-tab-${index}`, 'aria-controls': `${id}-panel-${index}`, 'aria-label': item.text,
          selected: selected === index, onClick: () => setSelected(index),
          unselectedContentColor: 'var(--md-sys-color-on-surface-variant)',
          icon: <TabExampleIcon name={item.icon} />,
        }
        return layout === 'Leading icon' ? <LeadingIconTab {...props} key={item.text} text={item.text} /> :
          <Tab {...props} key={item.text} icon={layout === 'Text' ? undefined : props.icon} text={layout === 'Icon' ? undefined : item.text} />
      })}
    </Row>
    {destinations.slice(0, count).map((item, index) =>
      <TabPanel key={item.text} selected={selected === index} id={`${id}-panel-${index}`} aria-labelledby={`${id}-tab-${index}`} className="tab-examples__panel">
        {item.text}
      </TabPanel>,
    )}
  </div>
}

export function TabExamples() {
  const [rtl, setRtl] = useState(false)
  const [manual, setManual] = useState(0)
  const [legacy, setLegacy] = useState(0)
  const [legacyScroll, setLegacyScroll] = useState(0)
  const [custom, setCustom] = useState(0)
  const id = useId()
  return <>
    <label className="tab-examples__direction"><span>Right-to-left layout</span>
      <Switch aria-label="Right-to-left tabs" checked={rtl} onChange={event => setRtl(event.currentTarget.checked)} />
    </label>
    <div className="tab-examples" dir={rtl ? 'rtl' : 'ltr'}>
      {rows.map(({ title, Row, count }) => <article key={title} className="specimen">
        <header className="specimen__header"><div><h3 data-material-typography="titleLarge">{title}</h3></div>
          <code>{title.replace(' fixed', '').replaceAll(' ', '')}TabRow</code>
        </header>
        <div className="specimen__stage">{layouts.map(layout => <Preview key={layout} Row={Row} count={count} title={title} layout={layout} />)}</div>
      </article>)}
      <article className="specimen specimen--wide">
        <header className="specimen__header"><div><h3 data-material-typography="titleLarge">Keyboard and custom content</h3>
          <p data-material-typography="bodyMedium">Arrow keys move focus. This row activates with Enter or Space. Radio is disabled.</p></div>
          <code>Tab · LeadingIconTab · TabPanel</code></header>
        <div className="specimen__stage">
          <SecondaryTabRow selectedTabIndex={manual} activationMode="manual" aria-label="Manual activation">
            {destinations.slice(0, 4).map((item, index) => <Tab key={item.text} id={`${id}-manual-tab-${index}`} aria-controls={`${id}-manual-panel-${index}`}
              text={item.text} selected={manual === index} disabled={index === 3} onClick={() => setManual(index)} />)}
          </SecondaryTabRow>
          {destinations.slice(0, 4).map((item, index) => <TabPanel key={item.text} selected={manual === index} id={`${id}-manual-panel-${index}`} aria-labelledby={`${id}-manual-tab-${index}`} className="tab-examples__panel">{item.text}</TabPanel>)}
          <PrimaryTabRow selectedTabIndex={custom} aria-label="Custom tab content" indicator={({ positions, selectedTabIndex }) =>
            <PrimaryTabIndicator width="100%" height={4} shape={2} title={`Tab width ${positions[selectedTabIndex]?.width ?? 0}`} />}>
            {['Messages', 'Updates', 'Archive'].map((label, index) => <Tab key={label} selected={custom === index} onClick={() => setCustom(index)} aria-label={index === 0 ? 'Messages, 3 unread' : label}>
              <span className="tab-examples__custom-label">{label}{index === 0 && <Badge value={3} />}</span>
            </Tab>)}
          </PrimaryTabRow>
          <div className="tab-examples__indicators" aria-label="Standalone tab indicators"><PrimaryTabIndicator /><SecondaryTabIndicator width={90} /></div>
        </div>
      </article>
      <article className="specimen specimen--wide">
        <header className="specimen__header"><div><h3 data-material-typography="titleLarge">AndroidX legacy rows</h3>
          <p data-material-typography="bodyMedium">Primary content colors with a full-width indicator. Prefer the primary or secondary rows for new code.</p></div>
          <code>TabRow · ScrollableTabRow</code></header>
        <div className="specimen__stage">
          <TabRow selectedTabIndex={legacy} aria-label="Legacy fixed tabs">{destinations.slice(0, 3).map((item, index) => <Tab key={item.text} text={item.text} selected={legacy === index} onClick={() => setLegacy(index)} />)}</TabRow>
          <ScrollableTabRow selectedTabIndex={legacyScroll} aria-label="Legacy scrollable tabs">{destinations.map((item, index) => <Tab key={item.text} text={item.text} selected={legacyScroll === index} onClick={() => setLegacyScroll(index)} />)}</ScrollableTabRow>
        </div>
      </article>
    </div>
  </>
}
