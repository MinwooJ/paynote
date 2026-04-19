/** 금액은 원 단위 정수(KRW). ADR-0003. Float·BigInt·Decimal 금지. */

export function formatKRW(amount: number): string {
  if (!Number.isFinite(amount)) return '₩0'
  const truncated = Math.trunc(amount)
  const sign = truncated < 0 ? '-' : ''
  const abs = Math.abs(truncated)
  return `${sign}₩${abs.toLocaleString('ko-KR')}`
}

/** "5,346,000", "₩5,346,000", "5346000원" → 5346000. 유효치 않으면 null. */
export function parseKRW(input: string): number | null {
  const cleaned = input.replace(/[\s,₩원]/g, '')
  if (cleaned === '' || cleaned === '-') return null
  if (!/^-?\d+$/.test(cleaned)) return null
  const n = Number(cleaned)
  return Number.isInteger(n) ? n : null
}

/** 입력 도중 자동 쉼표 포맷. 숫자만 남긴 뒤 그룹핑. */
export function formatAmountInput(raw: string): string {
  const digits = raw.replace(/[^0-9]/g, '')
  if (digits === '') return ''
  return Number(digits).toLocaleString('ko-KR')
}
