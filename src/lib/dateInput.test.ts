import { describe, expect, it } from 'vitest'
import { parseDueInput, toDateInputValue } from './dateInput'

describe('parseDueInput', () => {
  it('returns null for an empty value', () => {
    expect(parseDueInput('')).toBeNull()
  })

  it('parses a date input value as local midnight', () => {
    const ts = parseDueInput('2026-08-26')!
    const d = new Date(ts)
    expect([d.getFullYear(), d.getMonth(), d.getDate(), d.getHours()]).toEqual([
      2026, 7, 26, 0,
    ])
  })

  it.each(['abc', '2026-08', '26/08/2026', '2026-8-26x', 'NaN'])(
    'returns null, never NaN, for malformed input %j',
    (value) => {
      expect(parseDueInput(value)).toBeNull()
    },
  )
})

describe('toDateInputValue', () => {
  it('returns an empty string for null', () => {
    expect(toDateInputValue(null)).toBe('')
  })

  it('round-trips with parseDueInput', () => {
    expect(toDateInputValue(parseDueInput('2026-08-26'))).toBe('2026-08-26')
  })
})
