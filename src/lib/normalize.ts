/** 자유 문자열(카테고리 등) 정규화. NFC + trim + 내부 공백 축약. */

export function normalizeCategory(raw: string | null | undefined): string | null {
  if (raw == null) return null
  const trimmed = raw.normalize('NFC').trim().replace(/\s+/g, ' ')
  return trimmed === '' ? null : trimmed
}

/** 동등 비교 시 사용 — 두 카테고리가 같은지 */
export function categoryEquals(a: string | null | undefined, b: string | null | undefined): boolean {
  return normalizeCategory(a) === normalizeCategory(b)
}
