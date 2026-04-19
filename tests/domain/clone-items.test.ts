import { describe, it, expect } from 'vitest'
import { cloneItems, type CloneSourceItem } from '@/domain/clone-items'

describe('cloneItems', () => {
  it('empty input', () => {
    expect(cloneItems({ sourceItems: [], activeAccountIds: new Set([1]) })).toEqual({
      cloned: [],
      skipped: [],
    })
  })

  it('preserves all fields', () => {
    const item: CloneSourceItem = {
      kind: 'expense',
      amount: 800_000,
      label: '월세',
      category: '주거',
      accountId: 1,
    }
    const result = cloneItems({ sourceItems: [item], activeAccountIds: new Set([1]) })
    expect(result.cloned).toHaveLength(1)
    expect(result.cloned[0]).toEqual(item)
    // 새 참조인지 (얕은 복사 확인)
    expect(result.cloned[0]).not.toBe(item)
  })

  it('skips items referring to archived/missing account', () => {
    const items: CloneSourceItem[] = [
      { kind: 'income', amount: 5_000_000, label: '월급', category: null, accountId: 1 },
      { kind: 'expense', amount: 100_000, label: '보험', category: null, accountId: 99 },
    ]
    const result = cloneItems({ sourceItems: items, activeAccountIds: new Set([1]) })
    expect(result.cloned).toHaveLength(1)
    expect(result.cloned[0]?.label).toBe('월급')
    expect(result.skipped).toHaveLength(1)
    expect(result.skipped[0]?.reason).toBe('archived-account')
    expect(result.skipped[0]?.item.label).toBe('보험')
  })

  it('preserves order', () => {
    const items: CloneSourceItem[] = [
      { kind: 'expense', amount: 1, label: 'A', category: null, accountId: 1 },
      { kind: 'expense', amount: 2, label: 'B', category: null, accountId: 1 },
      { kind: 'expense', amount: 3, label: 'C', category: null, accountId: 1 },
    ]
    const result = cloneItems({ sourceItems: items, activeAccountIds: new Set([1]) })
    expect(result.cloned.map((i) => i.label)).toEqual(['A', 'B', 'C'])
  })
})
