/* Adapted from AndroidX TimePicker.kt. Apache-2.0.
 * Copyright 2023-2026 The Android Open Source Project. */
export type TimePickerValue = { hour: number; minute: number }
export type TimePickerSelection = 'hour' | 'minute'
export const TIME_PICKER_GEOMETRY = {
  dialSize: 256, outerRadius: 101, innerRadius: 69, ringThreshold: 74,
  handleRadius: 24, centerRadius: 4, trackWidth: 2, scrollItemHeight: 200 / 3,
} as const
export function validateTime(value: TimePickerValue) {
  if (!Number.isInteger(value.hour) || value.hour < 0 || value.hour > 23 ||
      !Number.isInteger(value.minute) || value.minute < 0 || value.minute > 59) {
    throw new RangeError('Time picker value must have an integer hour from 0 to 23 and minute from 0 to 59.')
  }
}
export function displayHour(hour: number, is24Hour: boolean) { return is24Hour ? hour : hour % 12 || 12 }
export function clockAngle(value: TimePickerValue, selection: TimePickerSelection) {
  return (selection === 'hour' ? value.hour % 12 / 12 : value.minute / 60) * Math.PI * 2 - Math.PI / 2
}
export function nearestClockAngle(current: number, target: number) {
  let diff = current - target
  while (diff > Math.PI) diff -= Math.PI * 2
  while (diff <= -Math.PI) diff += Math.PI * 2
  return current - diff
}
export function clockValueAt(x: number, y: number, selection: TimePickerSelection, is24Hour: boolean, hour: number, tap: boolean, ringThreshold = 74) {
  const angle = ((Math.atan2(y - 128, x - 128) + Math.PI / 2) + Math.PI * 2) % (Math.PI * 2)
  if (selection === 'minute') return { value: (Math.round(angle / (Math.PI * 2) * (tap ? 12 : 60)) * (tap ? 5 : 1)) % 60, angle: angle - Math.PI / 2 }
  const base = Math.round(angle / (Math.PI * 2) * 12) % 12
  const offset = is24Hour ? (Math.hypot(x - 128, y - 128) < ringThreshold ? 12 : 0) : (hour >= 12 ? 12 : 0)
  return { value: base + offset, angle: angle - Math.PI / 2 }
}
export function clockLabels(selection: TimePickerSelection, is24Hour: boolean) {
  const outer = Array.from({ length: 12 }, (_, index) => ({ value: selection === 'minute' ? index * 5 : index === 0 && !is24Hour ? 12 : index, radius: 101, index }))
  return selection === 'hour' && is24Hour ? [...outer, ...Array.from({ length: 12 }, (_, index) => ({ value: index + 12, radius: 69, index }))] : outer
}
export function clockPosition(index: number, radius: number) {
  const angle = index * Math.PI / 6 - Math.PI / 2
  return { x: 128 + Math.cos(angle) * radius, y: 128 + Math.sin(angle) * radius }
}
