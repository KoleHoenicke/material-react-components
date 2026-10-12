import { describe, expect, it } from 'vitest'
import { clockAngle, clockLabels, clockPosition, clockValueAt, displayHour, nearestClockAngle, validateTime } from './timePickerGeometry'

describe('AndroidX time picker geometry', () => {
  it('uses the outer 101px and inner 69px rings with midnight outside and noon inside', () => {
    expect(clockLabels('hour', true)).toHaveLength(24)
    expect(clockLabels('hour', true)[0]).toEqual({ value: 0, radius: 101, index: 0 })
    expect(clockLabels('hour', true)[12]).toEqual({ value: 12, radius: 69, index: 0 })
    expect(clockPosition(0, 101)).toEqual({ x: 128, y: 27 })
    expect(clockPosition(3, 69)).toEqual({ x: 197, y: 128 })
    expect(clockValueAt(128, 27, 'hour', true, 19, true).value).toBe(0)
    expect(clockValueAt(128, 59, 'hour', true, 7, true).value).toBe(12)
    // Source's 74dp ring threshold stays physical when the dial shrinks.
    expect(clockValueAt(128, 48, 'hour', true, 7, true, 74 * 256 / 200).value).toBe(12)
  })
  it('snaps minute taps to five, while dragging reaches each minute', () => {
    const angle = 7 / 60 * Math.PI * 2 - Math.PI / 2
    const x = 128 + Math.cos(angle) * 101, y = 128 + Math.sin(angle) * 101
    expect(clockValueAt(x, y, 'minute', false, 0, true).value).toBe(5)
    expect(clockValueAt(x, y, 'minute', false, 0, false).value).toBe(7)
    expect(clockValueAt(128, 27, 'minute', false, 0, false).value).toBe(0)
  })
  it('preserves AM/PM and takes the shortest angular path through midnight', () => {
    expect(clockValueAt(229, 128, 'hour', false, 19, true).value).toBe(15)
    expect(displayHour(0, false)).toBe(12)
    expect(displayHour(12, false)).toBe(12)
    expect(displayHour(23, true)).toBe(23)
    const current = clockAngle({ hour: 11, minute: 59 }, 'minute')
    expect(nearestClockAngle(current, clockAngle({ hour: 0, minute: 0 }, 'minute')) - current).toBeCloseTo(Math.PI / 30)
  })
  it('rejects invalid controlled time values rather than silently normalizing', () => {
    expect(() => validateTime({ hour: 24, minute: 0 })).toThrow(RangeError)
    expect(() => validateTime({ hour: 7, minute: 60 })).toThrow(RangeError)
    expect(() => validateTime({ hour: 7.5, minute: 0 })).toThrow(RangeError)
  })
})
