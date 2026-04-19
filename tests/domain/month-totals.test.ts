import { describe, it, expect } from 'vitest'
import { calculateMonthTotals } from '@/domain/month-totals'

describe('calculateMonthTotals', () => {
  it('both empty', () => {
    expect(calculateMonthTotals({ incomes: [], expenses: [] })).toEqual({
      totalIncome: 0,
      totalExpense: 0,
      netBalance: 0,
    })
  })

  it('income only', () => {
    expect(
      calculateMonthTotals({
        incomes: [{ amount: 5_346_000 }, { amount: 70_000 }],
        expenses: [],
      }),
    ).toEqual({
      totalIncome: 5_416_000,
      totalExpense: 0,
      netBalance: 5_416_000,
    })
  })

  it('expense only', () => {
    expect(
      calculateMonthTotals({
        incomes: [],
        expenses: [{ amount: 800_000 }, { amount: 250_000 }],
      }),
    ).toEqual({
      totalIncome: 0,
      totalExpense: 1_050_000,
      netBalance: -1_050_000,
    })
  })

  it('real 2025-09 memo data (사용자 실측 기반)', () => {
    const incomes = [{ amount: 5_346_000 }, { amount: 70_000 }]
    const expenses = [
      { amount: 450_000 }, // 양평 땅 원금
      { amount: 100_000 }, // 청약
      { amount: 100_000 }, // 부모님 적금
      { amount: 90_000 }, // 통신비+인터넷
      { amount: 90_000 }, // 보험금
      { amount: 1_283_000 }, // 신용카드
      { amount: 800_000 }, // 월세
      { amount: 250_000 }, // 관리비
    ]
    expect(calculateMonthTotals({ incomes, expenses })).toEqual({
      totalIncome: 5_416_000,
      totalExpense: 3_163_000,
      netBalance: 2_253_000, // ← 메모의 2,590,000과 다름 (메모 오차 검증!)
    })
  })

  it('large amounts do not lose precision', () => {
    expect(
      calculateMonthTotals({
        incomes: [{ amount: 1 }],
        expenses: [{ amount: 9_000_000_000 }],
      }),
    ).toEqual({
      totalIncome: 1,
      totalExpense: 9_000_000_000,
      netBalance: -8_999_999_999,
    })
  })

  it('single item edge cases', () => {
    expect(calculateMonthTotals({ incomes: [{ amount: 1 }], expenses: [] })).toEqual({
      totalIncome: 1,
      totalExpense: 0,
      netBalance: 1,
    })
  })
})
