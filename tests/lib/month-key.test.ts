import { describe, it, expect } from 'vitest'
import {
  MONTH_KEY_REGEX,
  isValidMonthKey,
  assertValidMonthKey,
  parseMonthKey,
  formatMonthKey,
  currentMonthKey,
  prevMonth,
  nextMonth,
  monthRange,
} from '@/lib/month-key'

describe('MONTH_KEY_REGEX', () => {
  it('accepts valid YYYY-MM', () => {
    expect(MONTH_KEY_REGEX.test('2026-01')).toBe(true)
    expect(MONTH_KEY_REGEX.test('2026-12')).toBe(true)
    expect(MONTH_KEY_REGEX.test('2000-04')).toBe(true)
  })

  it('rejects invalid formats', () => {
    expect(MONTH_KEY_REGEX.test('2026-00')).toBe(false)
    expect(MONTH_KEY_REGEX.test('2026-13')).toBe(false)
    expect(MONTH_KEY_REGEX.test('202604')).toBe(false)
    expect(MONTH_KEY_REGEX.test('26-04')).toBe(false)
    expect(MONTH_KEY_REGEX.test('2026-4')).toBe(false)
    expect(MONTH_KEY_REGEX.test('')).toBe(false)
    expect(MONTH_KEY_REGEX.test('2026/04')).toBe(false)
  })
})

describe('isValidMonthKey / assertValidMonthKey', () => {
  it('isValidMonthKey', () => {
    expect(isValidMonthKey('2026-04')).toBe(true)
    expect(isValidMonthKey('2026-13')).toBe(false)
  })

  it('assertValidMonthKey throws on invalid', () => {
    expect(() => assertValidMonthKey('2026-13')).toThrow()
    expect(() => assertValidMonthKey('2026-04')).not.toThrow()
  })
})

describe('parseMonthKey', () => {
  it('extracts year and month', () => {
    expect(parseMonthKey('2025-09')).toEqual({ year: 2025, month: 9 })
    expect(parseMonthKey('2026-12')).toEqual({ year: 2026, month: 12 })
  })

  it('throws on invalid', () => {
    expect(() => parseMonthKey('2026-13')).toThrow()
  })
})

describe('formatMonthKey', () => {
  it('pads single-digit month', () => {
    expect(formatMonthKey(2026, 4)).toBe('2026-04')
    expect(formatMonthKey(2026, 12)).toBe('2026-12')
  })

  it('rejects out-of-range month', () => {
    expect(() => formatMonthKey(2026, 0)).toThrow()
    expect(() => formatMonthKey(2026, 13)).toThrow()
  })

  it('rejects non-integer', () => {
    expect(() => formatMonthKey(2026, 4.5)).toThrow()
  })
})

describe('currentMonthKey', () => {
  it('derives from provided Date', () => {
    // JS Date 월은 0-index
    expect(currentMonthKey(new Date(2026, 3, 19))).toBe('2026-04')
    expect(currentMonthKey(new Date(2025, 8, 1))).toBe('2025-09')
    expect(currentMonthKey(new Date(2026, 0, 1))).toBe('2026-01')
    expect(currentMonthKey(new Date(2025, 11, 31))).toBe('2025-12')
  })
})

describe('prevMonth / nextMonth', () => {
  it('prevMonth within year', () => {
    expect(prevMonth('2026-04')).toBe('2026-03')
  })

  it('prevMonth crosses year boundary', () => {
    expect(prevMonth('2026-01')).toBe('2025-12')
  })

  it('nextMonth within year', () => {
    expect(nextMonth('2026-04')).toBe('2026-05')
  })

  it('nextMonth crosses year boundary', () => {
    expect(nextMonth('2025-12')).toBe('2026-01')
  })

  it('prev/next are inverse', () => {
    expect(nextMonth(prevMonth('2026-04'))).toBe('2026-04')
    expect(prevMonth(nextMonth('2026-04'))).toBe('2026-04')
  })
})

describe('monthRange', () => {
  it('inclusive ascending within year', () => {
    expect(monthRange('2026-02', '2026-05')).toEqual(['2026-02', '2026-03', '2026-04', '2026-05'])
  })

  it('crosses year boundary', () => {
    expect(monthRange('2025-11', '2026-02')).toEqual(['2025-11', '2025-12', '2026-01', '2026-02'])
  })

  it('single element when from === to', () => {
    expect(monthRange('2026-04', '2026-04')).toEqual(['2026-04'])
  })

  it('empty when from > to', () => {
    expect(monthRange('2026-05', '2026-03')).toEqual([])
  })
})
