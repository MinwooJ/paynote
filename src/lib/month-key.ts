/** YYYY-MM 월 키 유틸. ADR-0004. Date 객체 금지. */

export const MONTH_KEY_REGEX = /^\d{4}-(0[1-9]|1[0-2])$/

export function isValidMonthKey(s: string): boolean {
  return MONTH_KEY_REGEX.test(s)
}

export function assertValidMonthKey(s: string): void {
  if (!isValidMonthKey(s)) {
    throw new Error(`Invalid month key: ${s}`)
  }
}

export function parseMonthKey(key: string): { year: number; month: number } {
  assertValidMonthKey(key)
  return {
    year: Number(key.slice(0, 4)),
    month: Number(key.slice(5, 7)),
  }
}

export function formatMonthKey(year: number, month: number): string {
  if (!Number.isInteger(year) || year < 1 || year > 9999) {
    throw new Error(`Invalid year: ${year}`)
  }
  if (!Number.isInteger(month) || month < 1 || month > 12) {
    throw new Error(`Invalid month: ${month}`)
  }
  return `${year}-${String(month).padStart(2, '0')}`
}

export function currentMonthKey(now: Date = new Date()): string {
  return formatMonthKey(now.getFullYear(), now.getMonth() + 1)
}

export function prevMonth(key: string): string {
  const { year, month } = parseMonthKey(key)
  if (month === 1) return formatMonthKey(year - 1, 12)
  return formatMonthKey(year, month - 1)
}

export function nextMonth(key: string): string {
  const { year, month } = parseMonthKey(key)
  if (month === 12) return formatMonthKey(year + 1, 1)
  return formatMonthKey(year, month + 1)
}

/** inclusive ascending range. from > to 이면 빈 배열. */
export function monthRange(from: string, to: string): string[] {
  assertValidMonthKey(from)
  assertValidMonthKey(to)
  if (from > to) return []
  const result: string[] = []
  let cur = from
  while (cur <= to) {
    result.push(cur)
    cur = nextMonth(cur)
  }
  return result
}
