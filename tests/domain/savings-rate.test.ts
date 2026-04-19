import { describe, it, expect } from 'vitest'
import { calculateSavingsRate } from '@/domain/savings-rate'

describe('calculateSavingsRate', () => {
  it('returns 0 when income is 0', () => {
    expect(calculateSavingsRate(0, 0)).toBe(0)
    expect(calculateSavingsRate(0, 1000)).toBe(0)
  })

  it('returns 0 when income is negative (defense)', () => {
    expect(calculateSavingsRate(-100, 50)).toBe(0)
  })

  it('calculates rate correctly (real 2025-09 scenario)', () => {
    // 2,253,000 / 5,416,000 = 0.41598... → 41.6%
    expect(calculateSavingsRate(5_416_000, 2_253_000)).toBe(41.6)
  })

  it('100% rate when netBalance = totalIncome', () => {
    expect(calculateSavingsRate(1_000_000, 1_000_000)).toBe(100)
  })

  it('handles negative net balance', () => {
    expect(calculateSavingsRate(1_000_000, -500_000)).toBe(-50)
  })

  it('0% when no savings', () => {
    expect(calculateSavingsRate(1_000_000, 0)).toBe(0)
  })
})
