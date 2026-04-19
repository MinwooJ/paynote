import { describe, it, expect } from 'vitest'
import { generateTransferPlan, type AccountForPlan } from '@/domain/transfer-plan'

const woori: AccountForPlan = { id: 1, role: 'spending', archivedAt: null }
const kookmin: AccountForPlan = { id: 2, role: 'spending', archivedAt: null }
const kakao: AccountForPlan = { id: 3, role: 'savings', archivedAt: null }

describe('generateTransferPlan', () => {
  it('returns no-savings error if no savings account', () => {
    const result = generateTransferPlan({
      accounts: [woori, kookmin],
      incomes: [],
      expenses: [],
    })
    expect(result.ok).toBe(false)
    if (!result.ok) expect(result.error).toBe('no-savings')
  })

  it('returns multiple-savings error if >1 savings', () => {
    const secondSavings: AccountForPlan = { id: 4, role: 'savings', archivedAt: null }
    const result = generateTransferPlan({
      accounts: [woori, kakao, secondSavings],
      incomes: [],
      expenses: [],
    })
    expect(result.ok).toBe(false)
    if (!result.ok) expect(result.error).toBe('multiple-savings')
  })

  it('sweeps positive delta to savings', () => {
    const result = generateTransferPlan({
      accounts: [woori, kakao],
      incomes: [{ amount: 5_000_000, destinationAccountId: woori.id }],
      expenses: [{ amount: 1_000_000, sourceAccountId: woori.id }],
    })
    expect(result.ok).toBe(true)
    if (result.ok) {
      expect(result.plan).toEqual([
        {
          fromAccountId: woori.id,
          toAccountId: kakao.id,
          amount: 4_000_000,
          direction: 'sweep',
        },
      ])
    }
  })

  it('covers negative delta from savings', () => {
    const result = generateTransferPlan({
      accounts: [kookmin, kakao],
      incomes: [],
      expenses: [{ amount: 1_283_000, sourceAccountId: kookmin.id }],
    })
    expect(result.ok).toBe(true)
    if (result.ok) {
      expect(result.plan).toEqual([
        {
          fromAccountId: kakao.id,
          toAccountId: kookmin.id,
          amount: 1_283_000,
          direction: 'cover',
        },
      ])
    }
  })

  it('mixed sweep + cover in same plan (real 2025-09 scenario)', () => {
    const result = generateTransferPlan({
      accounts: [woori, kookmin, kakao],
      incomes: [
        { amount: 5_346_000, destinationAccountId: woori.id },
        { amount: 70_000, destinationAccountId: woori.id },
      ],
      expenses: [
        { amount: 800_000, sourceAccountId: woori.id }, // 월세
        { amount: 250_000, sourceAccountId: woori.id }, // 관리비
        { amount: 450_000, sourceAccountId: woori.id }, // 양평 땅
        { amount: 100_000, sourceAccountId: woori.id }, // 청약
        { amount: 100_000, sourceAccountId: woori.id }, // 부모님 적금
        { amount: 90_000, sourceAccountId: woori.id }, // 통신비
        { amount: 90_000, sourceAccountId: woori.id }, // 보험금
        { amount: 1_283_000, sourceAccountId: kookmin.id }, // 신용카드
      ],
    })
    expect(result.ok).toBe(true)
    if (result.ok) {
      expect(result.plan).toHaveLength(2)
      expect(result.plan).toContainEqual({
        fromAccountId: woori.id,
        toAccountId: kakao.id,
        amount: 3_536_000, // 5,416,000 - 1,880,000 (woori net)
        direction: 'sweep',
      })
      expect(result.plan).toContainEqual({
        fromAccountId: kakao.id,
        toAccountId: kookmin.id,
        amount: 1_283_000,
        direction: 'cover',
      })
    }
  })

  it('skips zero-delta accounts', () => {
    const result = generateTransferPlan({
      accounts: [woori, kakao],
      incomes: [{ amount: 1_000_000, destinationAccountId: woori.id }],
      expenses: [{ amount: 1_000_000, sourceAccountId: woori.id }],
    })
    expect(result.ok).toBe(true)
    if (result.ok) expect(result.plan).toEqual([])
  })

  it('ignores archived accounts', () => {
    const archivedWoori: AccountForPlan = { ...woori, archivedAt: new Date() }
    const result = generateTransferPlan({
      accounts: [archivedWoori, kakao],
      incomes: [{ amount: 999_999, destinationAccountId: woori.id }],
      expenses: [],
    })
    expect(result.ok).toBe(true)
    if (result.ok) expect(result.plan).toEqual([])
  })

  it('works with only savings account (nothing to sweep)', () => {
    const result = generateTransferPlan({
      accounts: [kakao],
      incomes: [{ amount: 100_000, destinationAccountId: kakao.id }],
      expenses: [],
    })
    expect(result.ok).toBe(true)
    if (result.ok) expect(result.plan).toEqual([])
  })
})
