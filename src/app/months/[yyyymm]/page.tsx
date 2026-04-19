import { notFound, redirect } from 'next/navigation'
import * as accountsQ from '@/db/queries/accounts'
import * as itemsQ from '@/db/queries/items'
import * as monthsQ from '@/db/queries/months'
import { AppHeader } from '@/components/app-header'
import { isValidMonthKey } from '@/lib/month-key'
import { MonthView } from './month-view'

export const dynamic = 'force-dynamic'

interface PageProps {
  params: Promise<{ yyyymm: string }>
}

export default async function MonthPage({ params }: PageProps) {
  const { yyyymm } = await params
  if (!isValidMonthKey(yyyymm)) notFound()

  const hasAny = await accountsQ.hasAnyAccount()
  if (!hasAny) redirect('/onboarding')

  const [month, incomes, expenses, activeAccounts, allAccounts] = await Promise.all([
    monthsQ.ensureMonth(yyyymm),
    itemsQ.listIncomesByMonth(yyyymm),
    itemsQ.listExpensesByMonth(yyyymm),
    accountsQ.listActiveAccounts(),
    accountsQ.listAllAccounts(),
  ])

  return (
    <>
      <AppHeader />
      <MonthView
        monthId={yyyymm}
        month={month}
        initialIncomes={incomes}
        initialExpenses={expenses}
        activeAccounts={activeAccounts}
        allAccounts={allAccounts}
      />
    </>
  )
}
