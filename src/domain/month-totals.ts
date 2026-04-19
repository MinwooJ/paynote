export interface AmountedItem {
  readonly amount: number
}

export interface MonthTotals {
  totalIncome: number
  totalExpense: number
  netBalance: number
}

export function calculateMonthTotals(input: {
  incomes: readonly AmountedItem[]
  expenses: readonly AmountedItem[]
}): MonthTotals {
  const totalIncome = input.incomes.reduce((acc, it) => acc + it.amount, 0)
  const totalExpense = input.expenses.reduce((acc, it) => acc + it.amount, 0)
  return { totalIncome, totalExpense, netBalance: totalIncome - totalExpense }
}
