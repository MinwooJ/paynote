import { describe, it, expect } from 'vitest'
import {
  monthKeySchema,
  accountCreateSchema,
  incomeItemCreateSchema,
  expenseItemCreateSchema,
} from '@/lib/validators'

describe('monthKeySchema', () => {
  it('accepts valid', () => {
    expect(monthKeySchema.parse('2026-04')).toBe('2026-04')
  })

  it('rejects invalid', () => {
    expect(monthKeySchema.safeParse('2026-13').success).toBe(false)
    expect(monthKeySchema.safeParse('202604').success).toBe(false)
    expect(monthKeySchema.safeParse('').success).toBe(false)
  })
})

describe('accountCreateSchema', () => {
  const valid = {
    name: '우리은행',
    role: 'spending' as const,
    openingBalance: 1_000_000,
    openingBalanceAsOfMonth: '2026-04',
  }

  it('accepts valid', () => {
    expect(accountCreateSchema.parse(valid)).toEqual(valid)
  })

  it('rejects empty name', () => {
    expect(accountCreateSchema.safeParse({ ...valid, name: '' }).success).toBe(false)
    expect(accountCreateSchema.safeParse({ ...valid, name: '   ' }).success).toBe(false)
  })

  it('rejects negative opening balance', () => {
    expect(accountCreateSchema.safeParse({ ...valid, openingBalance: -1 }).success).toBe(false)
  })

  it('rejects float amount', () => {
    expect(accountCreateSchema.safeParse({ ...valid, openingBalance: 1.5 }).success).toBe(false)
  })

  it('rejects invalid month key', () => {
    expect(
      accountCreateSchema.safeParse({ ...valid, openingBalanceAsOfMonth: '2026/04' }).success,
    ).toBe(false)
  })

  it('rejects invalid role', () => {
    expect(accountCreateSchema.safeParse({ ...valid, role: 'checking' }).success).toBe(false)
  })
})

describe('incomeItemCreateSchema', () => {
  const valid = {
    monthId: '2026-04',
    amount: 5_346_000,
    label: '월급',
    destinationAccountId: 1,
  }

  it('accepts valid', () => {
    expect(incomeItemCreateSchema.parse(valid)).toEqual(valid)
  })

  it('rejects zero amount', () => {
    expect(incomeItemCreateSchema.safeParse({ ...valid, amount: 0 }).success).toBe(false)
  })

  it('rejects negative amount', () => {
    expect(incomeItemCreateSchema.safeParse({ ...valid, amount: -1 }).success).toBe(false)
  })

  it('rejects float amount', () => {
    expect(incomeItemCreateSchema.safeParse({ ...valid, amount: 5_346_000.5 }).success).toBe(false)
  })

  it('rejects empty label after trim', () => {
    expect(incomeItemCreateSchema.safeParse({ ...valid, label: '   ' }).success).toBe(false)
  })

  it('rejects invalid account id', () => {
    expect(incomeItemCreateSchema.safeParse({ ...valid, destinationAccountId: 0 }).success).toBe(
      false,
    )
    expect(incomeItemCreateSchema.safeParse({ ...valid, destinationAccountId: -1 }).success).toBe(
      false,
    )
  })
})

describe('expenseItemCreateSchema', () => {
  const valid = {
    monthId: '2026-04',
    amount: 800_000,
    label: '월세',
    category: '주거',
    sourceAccountId: 1,
  }

  it('accepts valid', () => {
    expect(expenseItemCreateSchema.parse(valid)).toEqual(valid)
  })

  it('accepts null category', () => {
    expect(expenseItemCreateSchema.parse({ ...valid, category: null }).category).toBeNull()
  })

  it('accepts omitted category', () => {
    const { category: _omit, ...noCategory } = valid
    void _omit
    expect(expenseItemCreateSchema.parse(noCategory)).not.toHaveProperty('category.required')
  })

  it('rejects too-long category', () => {
    expect(
      expenseItemCreateSchema.safeParse({ ...valid, category: 'a'.repeat(51) }).success,
    ).toBe(false)
  })
})
