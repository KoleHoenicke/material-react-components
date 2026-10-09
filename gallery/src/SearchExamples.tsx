import { useRef, useState } from 'react'
import {
  SearchBar, DockedSearchBar, SearchBarInputField, SearchBarDefaults, AppBarWithSearch, TopSearchBar,
  ExpandedFullScreenSearchBar, ExpandedFullScreenContainedSearchBar, ExpandedDockedSearchBar, ExpandedDockedSearchBarWithGap,
  useSearchBarState, useContainedSearchBarState, useSearchBarWithGapState, useSearchBarScrollBehavior,
  IconButton, List, ListItem, Switch, Text,
} from '../../src'
import { SearchExampleIcon } from './SearchExampleIcons'
import './SearchExamples.css'
const entries = ['Recent searches', 'Saved places', 'Nearby restaurants', 'Coffee shops', 'Bookshops', 'Libraries', 'Parks', 'Museums']
function SearchExample({ kind, rtl, disabled, readOnly }: { kind: 'full-screen' | 'contained' | 'docked' | 'docked-with-gap'; rtl: boolean; disabled: boolean; readOnly: boolean }) {
  const regular = useSearchBarState()
  const contained = useContainedSearchBarState()
  const withGap = useSearchBarWithGapState()
  const state = kind === 'contained' ? contained : kind === 'docked-with-gap' ? withGap : regular
  const [query, setQuery] = useState('')
  const [submitted, setSubmitted] = useState('')
  const colors = kind === 'contained' ? SearchBarDefaults.containedColors(state.expanded) : SearchBarDefaults.colors()
  const inputField = <SearchBarInputField aria-label={`${kind} search`} state={state} value={query} onValueChange={setQuery}
    disabled={disabled} readOnly={readOnly} placeholder="Search places" onSearch={value => { setSubmitted(value); state.animateToCollapsed() }}
    leadingIcon={state.expanded ? <IconButton colorMode="inherit" aria-label={`Back from ${kind} search`} onClick={state.animateToCollapsed}><SearchExampleIcon name="arrow_back" /></IconButton> : <SearchExampleIcon name="search" />}
    trailingIcon={query ? <IconButton colorMode="inherit" aria-label={`Clear ${kind} search`} disabled={readOnly || disabled} onClick={() => setQuery('')}><SearchExampleIcon name="close" /></IconButton> : <SearchExampleIcon name="mic" />} />
  const Expanded = kind === 'contained' ? ExpandedFullScreenContainedSearchBar : kind === 'docked' ? ExpandedDockedSearchBar : kind === 'docked-with-gap' ? ExpandedDockedSearchBarWithGap : ExpandedFullScreenSearchBar
  const results = entries.filter(entry => entry.toLowerCase().includes(query.toLowerCase()))
  return <article className="specimen specimen--wide" dir={rtl ? 'rtl' : 'ltr'}>
    <header className="specimen__header"><div><h3 data-material-typography="titleLargeEmphasized">{kind === 'full-screen' ? 'Full-screen search' : kind === 'contained' ? 'Contained full-screen search' : kind === 'docked' ? 'Docked search' : 'Docked search with gap'}</h3><p data-material-typography="bodyMedium">{kind === 'contained' ? 'A contained input over a surface-container-low background, without a divider.' : kind === 'docked-with-gap' ? 'Separate 12px results panel, 2px gap, and a scrim.' : kind === 'docked' ? 'A joined 28px corner container with a divider and bounded results.' : 'The input expands from its original position into a full-screen search view.'}</p></div><code>{kind === 'contained' ? 'ExpandedFullScreenContainedSearchBar' : kind === 'docked-with-gap' ? 'ExpandedDockedSearchBarWithGap' : kind === 'docked' ? 'ExpandedDockedSearchBar' : 'ExpandedFullScreenSearchBar'}</code></header>
    <div className="search-examples__stage"><SearchBar state={state} inputField={inputField} colors={colors} /><Text variant="bodySmall">{submitted ? `Searched for "${submitted}"` : 'Click to expand. Tab to focus, then type or press Arrow Down.'}</Text></div>
    <Expanded state={state} inputField={inputField} colors={colors} aria-label={`${kind} search suggestions`} dir={rtl ? 'rtl' : 'ltr'}>
      <List variant="baseline" style={{ '--md-list-container-color': 'transparent' }}>{results.length ? results.map(entry => <ListItem key={entry} leading={<SearchExampleIcon name="history" />} trailing={<SearchExampleIcon name="north_west" />} onClick={() => { setQuery(entry); setSubmitted(entry); state.animateToCollapsed() }} headline={entry} />) : <Text className="search-examples__empty" variant="bodyLarge">No matching places</Text>}</List>
    </Expanded>
  </article>
}
function AppBarExample({ rtl }: { rtl: boolean }) {
  const state = useSearchBarState()
  const [query, setQuery] = useState('')
  const viewport = useRef<HTMLDivElement>(null)
  const behavior = useSearchBarScrollBehavior({ scrollTargetRef: viewport })
  const field = <SearchBarInputField value={query} onValueChange={setQuery} aria-label="App bar search" placeholder="Search library" onSearch={state.animateToCollapsed}
    leadingIcon={<SearchExampleIcon name="search" />} trailingIcon={<IconButton aria-label="Clear app bar search" colorMode="inherit" onClick={() => setQuery('')}><SearchExampleIcon name="close" /></IconButton>} />
  return <article className="specimen specimen--wide" dir={rtl ? 'rtl' : 'ltr'}>
    <header className="specimen__header"><div><h3 data-material-typography="titleLargeEmphasized">App bar with search</h3><p data-material-typography="bodyMedium">64px app bar, navigation and action slots, scroll tones, and enter-always behavior.</p></div><code>AppBarWithSearch</code></header>
    <div ref={viewport} className="search-examples__scroll">
      <AppBarWithSearch state={state} inputField={field} safeAreaInsets={false} scrollBehavior={behavior}
        navigationIcon={<IconButton aria-label="Library menu" colorMode="inherit"><SearchExampleIcon name="menu" /></IconButton>}
        actions={<IconButton aria-label="Library account" colorMode="inherit"><SearchExampleIcon name="account_circle" /></IconButton>} />
      <List variant="baseline">{Array.from({ length: 18 }, (_, i) => <ListItem key={i} leading={<SearchExampleIcon name="book" />} headline={`Library item ${i + 1}`} />)}</List>
    </div>
    <ExpandedFullScreenSearchBar state={state} inputField={field} dir={rtl ? 'rtl' : 'ltr'}>
      <List variant="baseline" style={{ '--md-list-container-color': 'transparent' }}>{entries.map(entry => <ListItem key={entry} onClick={() => { setQuery(entry); state.animateToCollapsed() }} headline={entry} />)}</List>
    </ExpandedFullScreenSearchBar>
  </article>
}
function LegacyExamples() {
  const [query, setQuery] = useState('')
  const [expanded, setExpanded] = useState(false)
  const [fullQuery, setFullQuery] = useState('')
  const [fullExpanded, setFullExpanded] = useState(false)
  const topState = useSearchBarState()
  const [topQuery, setTopQuery] = useState('')
  const topField = <SearchBarInputField aria-label="Transparent top search" placeholder="Transparent top search" value={topQuery} onValueChange={setTopQuery} leadingIcon={<SearchExampleIcon name="search" />} />
  return <article className="specimen specimen--wide">
    <header className="specimen__header"><div><h3 data-material-typography="titleLargeEmphasized">Integrated forms and input slots</h3><p data-material-typography="bodyMedium">Legacy integrated expansion, transparent top search, affixes, and custom placeholder content.</p></div><code>DockedSearchBar · SearchBar · TopSearchBar · SearchBarInputField</code></header>
    <div className="search-examples__matrix">
      <DockedSearchBar expanded={expanded} onExpandedChange={setExpanded} inputField={<SearchBarInputField value={query} onValueChange={setQuery} placeholder="Integrated docked search" aria-label="Integrated docked search" leadingIcon={<SearchExampleIcon name="search" />} onSearch={() => setExpanded(false)} />}>
        <List variant="baseline" style={{ '--md-list-container-color': 'transparent' }}>{entries.slice(0, 4).map(entry => <ListItem key={entry} onClick={() => { setQuery(entry); setExpanded(false) }} headline={entry} />)}</List>
      </DockedSearchBar>
      <SearchBar expanded={fullExpanded} onExpandedChange={setFullExpanded} inputField={<SearchBarDefaults.InputField value={fullQuery} onValueChange={setFullQuery} aria-label="Integrated full-screen search" placeholder="Integrated full-screen search" leadingIcon={<SearchExampleIcon name="search" />} onSearch={() => setFullExpanded(false)} />}>
        <List variant="baseline" style={{ '--md-list-container-color': 'transparent' }}><ListItem onClick={() => setFullExpanded(false)} headline="Close integrated search" /></List>
      </SearchBar>
      <TopSearchBar state={topState} safeAreaInsets={false} inputField={topField} />
      <ExpandedDockedSearchBar state={topState} inputField={topField}><button type="button" onClick={topState.animateToCollapsed}>Close top search</button></ExpandedDockedSearchBar>
      <SearchBarInputField aria-label="Search with affixes" prefix="in:" suffix="Library" placeholder="Title or author" leadingIcon={<SearchExampleIcon name="search" />} />
      <SearchBarInputField aria-label="Custom placeholder search" placeholder={<span>Search <strong>everything</strong></span>} />
      <SearchBarInputField aria-label="Disabled search" disabled value="Disabled search" leadingIcon={<SearchExampleIcon name="search" />} />
      <SearchBarInputField aria-label="Read-only search" readOnly value="Read-only query" leadingIcon={<SearchExampleIcon name="search" />} />
    </div>
  </article>
}
export function SearchExamples() {
  const [rtl, setRtl] = useState(false)
  const [disabled, setDisabled] = useState(false)
  const [readOnly, setReadOnly] = useState(false)
  return <div className="search-examples">
    <div className="search-examples__controls">{([['Right-to-left search', rtl, setRtl], ['Disable search', disabled, setDisabled], ['Read-only search input', readOnly, setReadOnly]] as const).map(([label, checked, setter]) => <label key={label}><span>{label}</span><Switch aria-label={label} checked={checked} onChange={event => setter(event.target.checked)} /></label>)}</div>
    {(['full-screen', 'contained', 'docked', 'docked-with-gap'] as const).map(kind => <SearchExample key={kind} {...{ kind, rtl, disabled, readOnly }} />)}
    <AppBarExample rtl={rtl} /><LegacyExamples />
  </div>
}
