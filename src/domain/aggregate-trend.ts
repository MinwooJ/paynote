import { monthRange } from '../lib/month-key'
import { calculateMonthTotals, type AmountedItem } from './month-totals'

export interface TrendPoint {
  readonly monthId: string
  readonly totalIncome: number
  readonly totalExpense: number
  readonly netBalance: number
  readonly hasData: boolean
}

/**
 * 월 범위에 대해 시계열 포인트 생성.
 * 데이터 없는 달은 hasData=false + 합계 0 (UI에서 갭 처리).
 */
export function aggregateTrend(input: {
  from: string
  to: string
  incomesByMonth: ReadonlyMap<string, readonly AmountedItem[]>
  expensesByMonth: ReadonlyMap<string, readonly AmountedItem[]>
}): TrendPoint[] {
  return monthRange(input.from, input.to).map((monthId) => {
    const incomes = input.incomesByMonth.get(monthId) ?? []
    const expenses = input.expensesByMonth.get(monthId) ?? []
    const hasData = incomes.length > 0 || expenses.length > 0
    if (!hasData) {
      return { monthId, totalIncome: 0, totalExpense: 0, netBalance: 0, hasData: false }
    }
    const { totalIncome, totalExpense, netBalance } = calculateMonthTotals({ incomes, expenses })
    return { monthId, totalIncome, totalExpense, netBalance, hasData: true }
  })
}
