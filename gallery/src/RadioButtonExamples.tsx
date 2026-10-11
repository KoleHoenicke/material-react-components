import { useId, useState } from 'react'
import { RadioButton, Switch } from '../../src'
import './RadioButtonExamples.css'

export function RadioButtonExamples() {
  const id = useId()
  const [filter, setFilter] = useState('Calls')
  const [rowFilter, setRowFilter] = useState('Calls')
  const [rtl, setRtl] = useState(false)
  return <div className="radio-examples" dir={rtl ? 'rtl' : 'ltr'}>
    <div className="radio-examples__states" aria-label="Radio button states" data-material-typography="bodyLarge">
      <label><RadioButton name={`${id}-unchecked`} /><span>Unselected</span></label>
      <label><RadioButton name={`${id}-checked`} defaultChecked /><span>Selected</span></label>
      <label><RadioButton disabled /><span>Disabled unselected</span></label>
      <label><RadioButton defaultChecked disabled /><span>Disabled selected</span></label>
    </div>
    <label className="radio-examples__direction" data-material-typography="bodyLarge">
      <Switch aria-label="Right-to-left radio buttons" checked={rtl} onChange={event => setRtl(event.currentTarget.checked)} />
      <span>Right-to-left layout</span>
    </label>
    <div className="radio-examples__groups">
      <fieldset><legend data-material-typography="titleMedium">Native radio group</legend>
        {['Calls', 'Missed', 'Friends'].map(option => <label key={option} className="radio-examples__native" data-material-typography="bodyLarge">
          <RadioButton name={`${id}-filter`} value={option} checked={filter === option} onChange={event => setFilter(event.currentTarget.value)} />
          <span>{option}</span>
        </label>)}
      </fieldset>
      <fieldset><legend data-material-typography="titleMedium">AndroidX sample rows</legend>
        {['Calls', 'Missed', 'Friends'].map(option => <label key={option} className="radio-examples__row" data-material-typography="bodyLarge">
          <input type="radio" name={`${id}-row-filter`} value={option} checked={rowFilter === option} onChange={event => setRowFilter(event.currentTarget.value)} />
          <RadioButton interactive={false} checked={rowFilter === option} />
          <span>{option}</span>
        </label>)}
      </fieldset>
    </div>
  </div>
}
