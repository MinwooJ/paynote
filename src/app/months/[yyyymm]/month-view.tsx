'use client'

import * as React from 'react'
import { toast } from 'sonner'
import { Check } from 'lucide-react'
import type { Account, ExpenseItem, IncomeItem, Month } from '@/db/schema'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { formatKRW } from '@/lib/currency'
import { calculateMonthTotals } from '@/domain/month-totals'
import { calculateAllAccountDeltas } from '@/domain/account-delta'
import { generateTransferPlan } from '@/domain/transfer-plan'
import { calculateSavingsRate } from '@/domain/savings-rate'
import { MonthNav } from './month-nav'
import { IncomeSection } from './income-section'
import { ExpenseSection } from './expense-section'
import { TransferPlanCard } from './transfer-plan-card'
import {
  deleteExpenseAction,
  deleteIncomeAction,
  restoreExpenseAction,
  restoreIncomeAction,
  toggleMonthClosedAction,
} from './actions'

interface Props {
  monthId: string
  month: Month
  initialIncomes: IncomeItem[]
  initialExpenses: ExpenseItem[]
  activeAccounts: Account[]
  allAccounts: Account[]
}

export function MonthView({
  monthId,
  month,
  initialIncomes,
  initialExpenses,
  activeAccounts,
  allAccounts,
}: Props) {
  const incomes = initialIncomes
  const expenses = initialExpenses

  const accountsById = React.useMemo(() => {
    const map = new Map<number, Account>()
    for (const a of allAccounts) map.set(a.id, a)
    return map
  }, [allAccounts])

  const totals = React.useMemo(
    () => calculateMonthTotals({ incomes, expenses }),
    [incomes, expenses],
  )

  const deltas = React.useMemo(
    () =>
      calculateAllAccountDeltas(
        {
          incomes: incomes.map((i) => ({
            amount: i.amount,
            destinationAccountId: i.destinationAccountId,
          })),
          expenses: expenses.map((e) => ({
            amount: e.amount,
            sourceAccountId: e.sourceAccountId,
          })),
        },
        activeAccounts.map((a) => a.id),
      ),
    [incomes, expenses, activeAccounts],
  )

  const planResult = React.useMemo(
    () =>
      generateTransferPlan({
        accounts: activeAccounts.map((a) => ({
          id: a.id,
          role: a.role,
          archivedAt: a.archivedAt,
        })),
        incomes: incomes.map((i) => ({
          amount: i.amount,
          destinationAccountId: i.destinationAccountId,
        })),
        expenses: expenses.map((e) => ({
          amount: e.amount,
          sourceAccountId: e.sourceAccountId,
        })),
      }),
    [activeAccounts, incomes, expenses],
  )

  const savingsRate = calculateSavingsRate(totals.totalIncome, totals.netBalance)
  const isClosed = month.closedAt !== null

  const handleDeleteIncome = async (item: IncomeItem) => {
    const result = await deleteIncomeAction(item.id)
    if (!result.ok) {
      toast.error(result.error)
      return
    }
    toast('항목이 삭제되었어요', {
      action: {
        label: '되돌리기',
        onClick: async () => {
          const restore = await restoreIncomeAction({
            monthId: item.monthId,
            amount: item.amount,
            label: item.label,
            destinationAccountId: item.destinationAccountId,
          })
          if (restore.ok) toast.success('복구되었어요')
          else toast.error(restore.error)
        },
      },
    })
  }

  const handleDeleteExpense = async (item: ExpenseItem) => {
    const result = await deleteExpenseAction(item.id)
    if (!result.ok) {
      toast.error(result.error)
      return
    }
    toast('항목이 삭제되었어요', {
      action: {
        label: '되돌리기',
        onClick: async () => {
          const restore = await restoreExpenseAction({
            monthId: item.monthId,
            amount: item.amount,
            label: item.label,
            category: item.category,
            sourceAccountId: item.sourceAccountId,
          })
          if (restore.ok) toast.success('복구되었어요')
          else toast.error(restore.error)
        },
      },
    })
  }

  const handleToggleClosed = async () => {
    const result = await toggleMonthClosedAction({ id: monthId, closed: !isClosed })
    if (result.ok) {
      toast.success(isClosed ? '확인 해제됨' : '이번 달 확인 완료')
    } else {
      toast.error(result.error)
    }
  }

  return (
    <main className="mx-auto max-w-7xl p-4 pb-24 sm:p-6">
      <header className="mb-6 flex items-center justify-between gap-4">
        <MonthNav monthId={monthId} />
        <Button
          variant={isClosed ? 'secondary' : 'outline'}
          size="sm"
          onClick={handleToggleClosed}
          aria-pressed={isClosed}
        >
          <Check className="h-4 w-4" />
          {isClosed ? '확인 완료 ✓' : '이번 달 확인 완료'}
        </Button>
      </header>

      <div className="grid gap-6 lg:grid-cols-[1fr_22rem]">
        <div className="space-y-6">
          <IncomeSection
            monthId={monthId}
            items={incomes}
            activeAccounts={activeAccounts}
            accountsById={accountsById}
            onDelete={handleDeleteIncome}
          />
          <ExpenseSection
            monthId={monthId}
            items={expenses}
            activeAccounts={activeAccounts}
            accountsById={accountsById}
            onDelete={handleDeleteExpense}
          />
        </div>

        <aside className="space-y-4 lg:sticky lg:top-6 lg:self-start">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base text-muted-foreground">이번 달 요약</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 text-sm">
              <div className="flex items-baseline justify-between">
                <span className="text-muted-foreground">총 수입</span>
                <span className="amount text-base">{formatKRW(totals.totalIncome)}</span>
              </div>
              <div className="flex items-baseline justify-between">
                <span className="text-muted-foreground">총 지출</span>
                <span className="amount text-base">{formatKRW(totals.totalExpense)}</span>
              </div>
              <div className="border-t border-border pt-3">
                <div className="flex items-baseline justify-between">
                  <span className="font-medium">순잔액</span>
                  <span
                    className={`amount text-xl font-semibold ${
                      totals.netBalance >= 0 ? 'text-positive' : 'text-negative'
                    }`}
                  >
                    {formatKRW(totals.netBalance)}
                  </span>
                </div>
                {totals.totalIncome > 0 && (
                  <div className="mt-1 text-xs text-muted-foreground">
                    저축률 {savingsRate.toFixed(1)}%
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          {activeAccounts.length > 0 && (
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-base text-muted-foreground">통장별 순변동</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2 text-sm">
                {activeAccounts.map((a) => {
                  const delta = deltas.get(a.id) ?? 0
                  return (
                    <div key={a.id} className="flex items-baseline justify-between gap-2">
                      <span className="truncate">
                        {a.name}
                        {a.role === 'savings' && (
                          <span className="ml-1 rounded bg-primary/10 px-1 py-0.5 text-[10px] text-primary">
                            저축
                          </span>
                        )}
                      </span>
                      <span
                        className={`amount ${
                          delta > 0
                            ? 'text-positive'
                            : delta < 0
                              ? 'text-negative'
                              : 'text-muted-foreground'
                        }`}
                      >
                        {delta > 0 ? '+' : ''}
                        {formatKRW(delta)}
                      </span>
                    </div>
                  )
                })}
              </CardContent>
            </Card>
          )}

          <TransferPlanCard result={planResult} accountsById={accountsById} />
        </aside>
      </div>
    </main>
  )
}
