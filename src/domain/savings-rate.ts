/**
 * 저축률 계산. totalIncome ≤ 0 시 0 반환 (div-by-zero 방지).
 * 결과는 소수 1자리 반올림한 %.
 */
export function calculateSavingsRate(totalIncome: number, netBalance: number): number {
  if (totalIncome <= 0) return 0
  return Math.round((netBalance / totalIncome) * 1000) / 10
}
