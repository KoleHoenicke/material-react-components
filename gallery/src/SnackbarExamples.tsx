import { useState } from 'react'
import {
  Button, MaterialSnackbarHostState, Snackbar, SnackbarHost, Switch,
  useSnackbarHostState, type MaterialSnackbarStyle,
} from '../../src'
import './SnackbarExamples.css'

export function SnackbarExamples() {
  const state = useSnackbarHostState()
  const [customState] = useState(() => new MaterialSnackbarHostState())
  const [rtl, setRtl] = useState(false), [stylingFix, setStylingFix] = useState(false)
  const [newLine, setNewLine] = useState(false), [result, setResult] = useState('No result yet')
  const action = <Button variant="text" onClick={() => setResult('Preview action performed')}>Undo</Button>
  const tokenStyle: MaterialSnackbarStyle = { '--md-snackbar-max-width': '600px' }
  return <div className="snackbar-examples" dir={rtl ? 'rtl' : 'ltr'}>
    <div className="snackbar-examples__options" data-material-typography="bodyLarge">
      <label><Switch checked={rtl} onChange={event => setRtl(event.currentTarget.checked)} aria-label="Right-to-left snackbars" />Right-to-left</label>
      <label><Switch checked={stylingFix} onChange={event => setStylingFix(event.currentTarget.checked)} aria-label="AndroidX snackbar styling fix" />AndroidX styling fix</label>
      <label><Switch checked={newLine} onChange={event => setNewLine(event.currentTarget.checked)} aria-label="Snackbar action on new line" />Action on new line</label>
    </div>
    <div className="snackbar-examples__previews" aria-label="Snackbar layouts">
      <div><h3 data-material-typography="titleMedium">Message only</h3><Snackbar stylingFix={stylingFix}>Changes saved</Snackbar></div>
      <div><h3 data-material-typography="titleMedium">Inline action</h3><Snackbar stylingFix={stylingFix} action={action} actionOnNewLine={newLine}>Item removed</Snackbar></div>
      <div><h3 data-material-typography="titleMedium">Two lines</h3><Snackbar stylingFix={stylingFix} action={action} actionOnNewLine={newLine}>This item was moved to trash.<br />You can restore it with Undo.</Snackbar></div>
      <div><h3 data-material-typography="titleMedium">Long action on a separate line</h3><Snackbar stylingFix={stylingFix} action={<Button variant="text" onClick={() => setResult('Connection retried')}>Try connecting again</Button>} actionOnNewLine>Your connection is unavailable.<br />Check your settings and try again.</Snackbar></div>
    </div>
    <div className="snackbar-examples__live">
      <h3 data-material-typography="titleLarge">Queue and motion</h3>
      <p data-material-typography="bodyMedium">The host uses AndroidX springs. A message lasts four seconds; an action stays until acted on or dismissed. Hover or keyboard focus pauses a finite timeout.</p>
      <div className="snackbar-examples__buttons">
        <Button onClick={() => { void state.showSnackbar('Changes saved').then(setResult) }}>Show message</Button>
        <Button variant="tonal" onClick={() => { void state.showSnackbar({ message: 'Item removed', actionLabel: 'Undo', withDismissAction: true }).then(setResult) }}>Show action</Button>
        <Button variant="outlined" onClick={() => {
          void state.showSnackbar({ message: 'First queued message', withDismissAction: true }).then(setResult)
          void state.showSnackbar({ message: 'Second queued message', withDismissAction: true }).then(setResult)
        }}>Queue two</Button>
      </div>
      <div className="snackbar-examples__host-stage"><SnackbarHost hostState={state} style={tokenStyle} actionOnNewLine={newLine} stylingFix={stylingFix} /></div>
      <p data-material-typography="bodyMedium" aria-label="Snackbar result">{result}</p>
    </div>
    <div className="snackbar-examples__live">
      <h3 data-material-typography="titleLarge">Custom host content</h3>
      <Button variant="text" onClick={() => { void customState.showSnackbar({ message: 'Download complete', actionLabel: 'Open file', withDismissAction: true }).then(setResult) }}>Show custom snackbar</Button>
      <div className="snackbar-examples__host-stage"><SnackbarHost hostState={customState} snackbar={data => <Snackbar snackbarData={data} stylingFix={stylingFix} actionOnNewLine
        style={{ '--md-snackbar-container-color': 'var(--md-sys-color-secondary-container)', '--md-snackbar-content-color': 'var(--md-sys-color-on-secondary-container)', '--md-snackbar-action-content-color': 'var(--md-sys-color-on-secondary-container)', '--md-snackbar-dismiss-content-color': 'var(--md-sys-color-on-secondary-container)' }} />} /></div>
    </div>
  </div>
}
