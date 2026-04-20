import { redirect } from 'next/navigation'
import * as accountsQ from '@/db/queries/accounts'
import * as itemsQ from '@/db/queries/items'
import * as monthsQ from '@/db/queries/months'
import { AppHeader } from '@/components/app-header'
import { currentMonthKey } from '@/lib/month-key'
import { StatsView } from './stats-view'

export const dynamic = 'force-dynamic'

export default async function StatsPage() {
  const hasAny = await accountsQ.hasAnyAccount()
  if (!hasAny) redirect('/onboarding')

  const allMonths = await monthsQ.listMonthsAsc()
  const earliest = allMonths[0]?.id ?? currentMonthKey()
  const latest = allMonths[allMonths.length - 1]?.id ?? currentMonthKey()

  const monthIds = allMonths.map((m) => m.id)
  const [incomes, expenses] = await Promise.all([
    itemsQ.listIncomesForMonths(monthIds),
    itemsQ.listExpensesForMonths(monthIds),
  ])

  return (
    <>
      <AppHeader />
      <StatsView
        earliest={earliest}
        latest={latest}
        today={currentMonthKey()}
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
