export interface IncomeFlow {
  readonly amount: number
  readonly destinationAccountId: number
}

export interface ExpenseFlow {
  readonly amount: number
  readonly sourceAccountId: number
}

export function calculateAccountDelta(
  input: { incomes: readonly IncomeFlow[]; expenses: readonly ExpenseFlow[] },
  accountId: number,
): number {
  let inSum = 0
  for (const i of input.incomes) {
    if (i.destinationAccountId === accountId) inSum += i.amount
  }
  let outSum = 0
  for (const e of input.expenses) {
    if (e.sourceAccountId === accountId) outSum += e.amount
  }
  return inSum - outSum
}

export function calculateAllAccountDeltas(
  input: { incomes: readonly IncomeFlow[]; expenses: readonly ExpenseFlow[] },
  accountIds: readonly number[],
): Map<number, number> {
  const result = new Map<number, number>()
  for (const id of accountIds) result.set(id, calculateAccountDelta(input, id))
  return result
}
