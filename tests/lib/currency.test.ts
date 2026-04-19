import { describe, it, expect } from 'vitest'
import { formatKRW, parseKRW, formatAmountInput } from '@/lib/currency'

describe('formatKRW', () => {
  it('formats zero', () => {
    expect(formatKRW(0)).toBe('₩0')
  })

  it('formats positive with commas', () => {
    expect(formatKRW(1)).toBe('₩1')
    expect(formatKRW(1_000)).toBe('₩1,000')
    expect(formatKRW(5_346_000)).toBe('₩5,346,000')
    expect(formatKRW(1_000_000_000)).toBe('₩1,000,000,000')
  })

  it('formats negative', () => {
    expect(formatKRW(-100)).toBe('-₩100')
    expect(formatKRW(-5_346_000)).toBe('-₩5,346,000')
  })

  it('truncates non-integers (defense in depth)', () => {
    expect(formatKRW(1000.9)).toBe('₩1,000')
    expect(formatKRW(-1000.9)).toBe('-₩1,000')
  })

  it('handles infinity gracefully', () => {
    expect(formatKRW(Infinity)).toBe('₩0')
    expect(formatKRW(Number.NaN)).toBe('₩0')
  })
})

describe('parseKRW', () => {
  it('parses plain digits', () => {
    expect(parseKRW('5346000')).toBe(5_346_000)
    expect(parseKRW('0')).toBe(0)
  })

  it('parses comma-separated', () => {
    expect(parseKRW('5,346,000')).toBe(5_346_000)
  })

  it('accepts ₩ and 원 suffixes', () => {
    expect(parseKRW('₩5,346,000')).toBe(5_346_000)
    expect(parseKRW('5,346,000원')).toBe(5_346_000)
    expect(parseKRW('₩5,346,000원')).toBe(5_346_000)
  })

  it('parses negative', () => {
    expect(parseKRW('-100')).toBe(-100)
  })

  it('returns null on invalid', () => {
    expect(parseKRW('')).toBeNull()
    expect(parseKRW('abc')).toBeNull()
    expect(parseKRW('1.5')).toBeNull()
    expect(parseKRW('-')).toBeNull()
    expect(parseKRW('1a2')).toBeNull()
  })
})

describe('formatAmountInput', () => {
  it('groups with commas', () => {
    expect(formatAmountInput('5346000')).toBe('5,346,000')
  })

  it('strips non-digits', () => {
    expect(formatAmountInput('abc123')).toBe('123')
    expect(formatAmountInput('5,346,000')).toBe('5,346,000')
    expect(formatAmountInput('₩1,000원')).toBe('1,000')
  })

  it('empty for no digits', () => {
    expect(formatAmountInput('')).toBe('')
    expect(formatAmountInput('abc')).toBe('')
  })

  it('handles leading zeros', () => {
    expect(formatAmountInput('00123')).toBe('123')
  })
})
