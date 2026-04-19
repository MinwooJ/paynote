import { describe, it, expect } from 'vitest'
import { normalizeCategory, categoryEquals } from '@/lib/normalize'

describe('normalizeCategory', () => {
  it('trims surrounding whitespace', () => {
    expect(normalizeCategory('  주거  ')).toBe('주거')
  })

  it('collapses internal whitespace', () => {
    expect(normalizeCategory('주거   비용')).toBe('주거 비용')
    expect(normalizeCategory('a\tb  c')).toBe('a b c')
  })

  it('returns null for empty/whitespace', () => {
    expect(normalizeCategory('')).toBeNull()
    expect(normalizeCategory('   ')).toBeNull()
    expect(normalizeCategory('\t\n')).toBeNull()
    expect(normalizeCategory(null)).toBeNull()
    expect(normalizeCategory(undefined)).toBeNull()
  })

  it('NFC normalizes Hangul', () => {
    const decomposed = '\u1103\u1165' // ㄷㅓ 분리형
    const composed = '더'
    expect(normalizeCategory(decomposed)).toBe(composed)
  })
})

describe('categoryEquals', () => {
  it('equal after normalization', () => {
    expect(categoryEquals('주거', ' 주거 ')).toBe(true)
    expect(categoryEquals('주거', '주거')).toBe(true)
    expect(categoryEquals(null, null)).toBe(true)
    expect(categoryEquals(null, undefined)).toBe(true)
    expect(categoryEquals('', '   ')).toBe(true) // 둘 다 null로 정규화
  })

  it('not equal when content differs', () => {
    expect(categoryEquals('주거', '통신')).toBe(false)
    expect(categoryEquals('주거', null)).toBe(false)
  })
})
