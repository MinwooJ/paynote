import { describe, it, expect } from 'vitest'
import { aggregateTrend } from '@/domain/aggregate-trend'

describe('aggregateTrend', () => {
  it('returns all zero hasData=false when no data', () => {
    const result = aggregateTrend({
      from: '2026-01',
      to: '2026-03',
      incomesByMonth: new Map(),
      expensesByMonth: new Map(),
    })
    expect(result).toHaveLength(3)
    expect(result.every((p) => !p.hasData)).toBe(true)
    expect(result.every((p) => p.totalIncome === 0)).toBe(true)
  })

  it('fills months that have data, leaves gaps false', () => {
    const result = aggregateTrend({
      from: '2025-09',
      to: '2025-11',
      incomesByMonth: new Map([
        ['2025-09', [{ amount: 5_416_000 }]],
        ['2025-11', [{ amount: 5_000_000 }]],
      ]),
      expensesByMonth: new Map([['2025-09', [{ amount: 3_163_000 }]]]),
    })
    expect(result).toHaveLength(3)
    expect(result[0]).toEqual({
      monthId: '2025-09',
      totalIncome: 5_416_000,
      totalExpense: 3_163_000,
      netBalance: 2_253_000,
      hasData: true,
    })
    expect(result[1]?.hasData).toBe(false)
    expect(result[2]).toEqual({
      monthId: '2025-11',
      totalIncome: 5_000_000,
      totalExpense: 0,
      netBalance: 5_000_000,
      hasData: true,
    })
  })

  it('range respects from/to ordering', () => {
    const result = aggregateTrend({
      from: '2025-12',
      to: '2026-02',
      incomesByMonth: new Map(),
      expensesByMonth: new Map(),
    })
    expect(result.map((p) => p.monthId)).toEqual(['2025-12', '2026-01', '2026-02'])
  })

  it('empty result when from > to', () => {
    const result = aggregateTrend({
      from: '2026-05',
      to: '2026-03',
      incomesByMonth: new Map(),
      expensesByMonth: new Map(),
    })
    expect(result).toEqual([])
  })
})
