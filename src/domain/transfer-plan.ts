import { calculateAccountDelta, type ExpenseFlow, type IncomeFlow } from './account-delta'

export interface AccountForPlan {
  readonly id: number
  readonly role: 'spending' | 'savings'
  readonly archivedAt: Date | null
}

export type TransferDirection = 'sweep' | 'cover'

export interface TransferPlanItem {
  readonly fromAccountId: number
  readonly toAccountId: number
  readonly amount: number
  readonly direction: TransferDirection
}

export type TransferPlanError = 'no-savings' | 'multiple-savings'

export type TransferPlanResult =
  | { ok: true; plan: TransferPlanItem[] }
  | { ok: false; error: TransferPlanError }

export function generateTransferPlan(input: {
  accounts: readonly AccountForPlan[]
  incomes: readonly IncomeFlow[]
  expenses: readonly ExpenseFlow[]
}): TransferPlanResult {
  const active = input.accounts.filter((a) => a.archivedAt === null)
  const savings = active.filter((a) => a.role === 'savings')

  if (savings.length === 0) return { ok: false, error: 'no-savings' }
  if (savings.length > 1) return { ok: false, error: 'multiple-savings' }

  const [savingsAccount] = savings
  if (!savingsAccount) return { ok: false, error: 'no-savings' }

  const plan: TransferPlanItem[] = []
  for (const account of active) {
    if (account.role === 'savings') continue
    const delta = calculateAccountDelta(input, account.id)
    if (delta > 0) {
      plan.push({
        fromAccountId: account.id,
        toAccountId: savingsAccount.id,
        amount: delta,
        direction: 'sweep',
      })
    } else if (delta < 0) {
      plan.push({
        fromAccountId: savingsAccount.id,
        toAccountId: account.id,
        amount: -delta,
        direction: 'cover',
      })
    }
  }
  return { ok: true, plan }
}
