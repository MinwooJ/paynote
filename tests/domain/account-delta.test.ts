import { describe, it, expect } from 'vitest'
import { calculateAccountDelta, calculateAllAccountDeltas } from '@/domain/account-delta'

const woori = 1
const kookmin = 2
const kakao = 3

describe('calculateAccountDelta', () => {
  it('empty', () => {
    expect(calculateAccountDelta({ incomes: [], expenses: [] }, woori)).toBe(0)
  })

  it('pure income', () => {
    const delta = calculateAccountDelta(
      {
        incomes: [
          { amount: 5_346_000, destinationAccountId: woori },
          { amount: 70_000, destinationAccountId: woori },
        ],
        expenses: [],
      },
      woori,
    )
    expect(delta).toBe(5_416_000)
  })

  it('income minus expense same account', () => {
    const delta = calculateAccountDelta(
      {
        incomes: [{ amount: 5_416_000, destinationAccountId: woori }],
        expenses: [
          { amount: 800_000, sourceAccountId: woori },
          { amount: 250_000, sourceAccountId: woori },
          { amount: 70_000, sourceAccountId: woori },
        ],
      },
      woori,
    )
    expect(delta).toBe(4_296_000)
  })

  it('excludes other accounts', () => {
    const delta = calculateAccountDelta(
      {
        incomes: [{ amount: 5_000_000, destinationAccountId: woori }],
        expenses: [{ amount: 1_283_000, sourceAccountId: kookmin }],
      },
      kookmin,
    )
    expect(delta).toBe(-1_283_000)
  })

  it('returns 0 for untouched account', () => {
    const delta = calculateAccountDelta(
      {
        incomes: [{ amount: 5_000_000, destinationAccountId: woori }],
        expenses: [{ amount: 1_283_000, sourceAccountId: kookmin }],
      },
      kakao,
    )
    expect(delta).toBe(0)
  })
})

describe('calculateAllAccountDeltas', () => {
  it('returns map covering all requested account ids', () => {
    const deltas = calculateAllAccountDeltas(
      {
        incomes: [{ amount: 5_000_000, destinationAccountId: woori }],
        expenses: [{ amount: 1_000_000, sourceAccountId: kookmin }],
      },
      [woori, kookmin, kakao],
    )
    expect(deltas.get(woori)).toBe(5_000_000)
    expect(deltas.get(kookmin)).toBe(-1_000_000)
    expect(deltas.get(kakao)).toBe(0)
    expect(deltas.size).toBe(3)
  })
})
