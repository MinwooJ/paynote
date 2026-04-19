import { redirect } from 'next/navigation'
import * as accountsQ from '@/db/queries/accounts'
import * as itemsQ from '@/db/queries/items'
import { AppHeader } from '@/components/app-header'
import { currentMonthKey, monthRange, prevMonth } from '@/lib/month-key'
import { StatsView } from './stats-view'

export const dynamic = 'force-dynamic'

const DEFAULT_MONTHS_BACK = 24

function shiftBack(key: string, n: number): string {
  let cur = key
  for (let i = 0; i < n; i++) cur = prevMonth(cur)
  return cur
}

export default async function StatsPage() {
  const hasAny = await accountsQ.hasAnyAccount()
  if (!hasAny) redirect('/onboarding')

  const to = currentMonthKey()
  const from = shiftBack(to, DEFAULT_MONTHS_BACK - 1)
  const ids = monthRange(from, to)

  const [incomes, expenses] = await Promise.all([
    itemsQ.listIncomesForMonths(ids),
    itemsQ.listExpensesForMonths(ids),
  ])

  return (
    <>
      <AppHeader />
      <StatsView
        from={from}
        to={to}
        incomes={incomes.map((i) => ({ monthId: i.monthId, amount: i.amount }))}
        expenses={expenses.map((e) => ({
          monthId: e.monthId,
          amount: e.amount,
          category: e.category,
        }))}
      />
    </>
  )
}
