'use client'

import * as React from 'react'
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Legend,
  Line,
  LineChart,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { formatKRW } from '@/lib/currency'
import { monthRange, prevMonth } from '@/lib/month-key'
import { aggregateTrend } from '@/domain/aggregate-trend'
import { calculateSavingsRate } from '@/domain/savings-rate'

type Range = 6 | 12 | 24

interface Income {
  monthId: string
  amount: number
}
interface Expense {
  monthId: string
  amount: number
  category: string | null
}

interface Props {
  from: string
  to: string
  incomes: Income[]
  expenses: Expense[]
}

const PIE_COLORS = [
  'hsl(146 30% 55%)',
  'hsl(35 75% 60%)',
  'hsl(210 60% 60%)',
  'hsl(280 40% 60%)',
  'hsl(10 65% 60%)',
  'hsl(180 40% 50%)',
  'hsl(60 60% 55%)',
  'hsl(320 40% 60%)',
]

export function StatsView({ to, incomes, expenses }: Props) {
  const [range, setRange] = React.useState<Range>(12)

  const rangeFrom = React.useMemo(() => {
    let cur = to
    for (let i = 0; i < range - 1; i++) cur = prevMonth(cur)
    return cur
  }, [range, to])

  const monthIds = React.useMemo(() => monthRange(rangeFrom, to), [rangeFrom, to])
  const monthSet = React.useMemo(() => new Set(monthIds), [monthIds])

  const filteredIncomes = React.useMemo(
    () => incomes.filter((i) => monthSet.has(i.monthId)),
    [incomes, monthSet],
  )
  const filteredExpenses = React.useMemo(
    () => expenses.filter((e) => monthSet.has(e.monthId)),
    [expenses, monthSet],
  )

  const trend = React.useMemo(() => {
    const incomesByMonth = new Map<string, { amount: number }[]>()
    for (const i of filteredIncomes) {
      const arr = incomesByMonth.get(i.monthId) ?? []
      arr.push({ amount: i.amount })
      incomesByMonth.set(i.monthId, arr)
    }
    const expensesByMonth = new Map<string, { amount: number }[]>()
    for (const e of filteredExpenses) {
      const arr = expensesByMonth.get(e.monthId) ?? []
      arr.push({ amount: e.amount })
      expensesByMonth.set(e.monthId, arr)
    }
    return aggregateTrend({ from: rangeFrom, to, incomesByMonth, expensesByMonth })
  }, [filteredIncomes, filteredExpenses, rangeFrom, to])

  const totals = React.useMemo(() => {
    const totalIncome = filteredIncomes.reduce((acc, i) => acc + i.amount, 0)
    const totalExpense = filteredExpenses.reduce((acc, e) => acc + e.amount, 0)
    const netBalance = totalIncome - totalExpense
    const monthsWithData = trend.filter((t) => t.hasData).length
    const avgSavingsRate =
      monthsWithData === 0
        ? 0
        : trend
            .filter((t) => t.hasData)
            .reduce((acc, t) => acc + calculateSavingsRate(t.totalIncome, t.netBalance), 0) /
          monthsWithData
    return { totalIncome, totalExpense, netBalance, avgSavingsRate, monthsWithData }
  }, [filteredIncomes, filteredExpenses, trend])

  const categoryData = React.useMemo(() => {
    const map = new Map<string, number>()
    for (const e of filteredExpenses) {
      const cat = e.category ?? '기타'
      map.set(cat, (map.get(cat) ?? 0) + e.amount)
    }
    return Array.from(map.entries())
      .map(([name, value]) => ({ name, value }))
      .sort((a, b) => b.value - a.value)
  }, [filteredExpenses])

  const topExpenseCount = 5

  const topCategories = categoryData.slice(0, topExpenseCount)

  const hasEnoughData = trend.filter((t) => t.hasData).length >= 2

  return (
    <main className="mx-auto max-w-7xl p-4 sm:p-6">
      <header className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <h1 className="text-2xl font-semibold">통계</h1>
        <div className="flex gap-1">
          {([6, 12, 24] as Range[]).map((r) => (
            <Button
              key={r}
              variant={range === r ? 'default' : 'outline'}
              size="sm"
              onClick={() => setRange(r)}
            >
              {r}개월
            </Button>
          ))}
        </div>
      </header>

      <section className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-xs text-muted-foreground">범위 총 수입</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="amount text-2xl font-semibold">{formatKRW(totals.totalIncome)}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-xs text-muted-foreground">범위 총 지출</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="amount text-2xl font-semibold">{formatKRW(totals.totalExpense)}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-xs text-muted-foreground">월 평균 저축률</CardTitle>
          </CardHeader>
          <CardContent>
            <div
              className={`amount text-2xl font-semibold ${
                totals.avgSavingsRate >= 0 ? 'text-positive' : 'text-negative'
              }`}
            >
              {totals.avgSavingsRate.toFixed(1)}%
            </div>
            <div className="mt-1 text-xs text-muted-foreground">
              기록된 {totals.monthsWithData}개월 평균
            </div>
          </CardContent>
        </Card>
      </section>

      {!hasEnoughData && (
        <Card className="mt-4">
          <CardContent className="py-8 text-center text-sm text-muted-foreground">
            추이를 보려면 최소 2개월 이상의 기록이 필요합니다. (현재 {totals.monthsWithData}개월)
          </CardContent>
        </Card>
      )}

      {hasEnoughData && (
        <section className="mt-4 grid gap-4 lg:grid-cols-2">
          <Card className="lg:col-span-2">
            <CardHeader className="pb-3">
              <CardTitle className="text-base">월별 수입·지출·순잔액</CardTitle>
            </CardHeader>
            <CardContent className="h-72">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={trend} margin={{ top: 10, right: 10, bottom: 0, left: -10 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                  <XAxis dataKey="monthId" tick={{ fontSize: 11 }} />
                  <YAxis
                    tickFormatter={(v) => `${Math.round(v / 10000)}만`}
                    tick={{ fontSize: 11 }}
                  />
                  <Tooltip
                    formatter={(v: number) => formatKRW(v)}
                    labelFormatter={(l) => l as string}
                  />
                  <Legend />
                  <Line
                    type="monotone"
                    dataKey="totalIncome"
                    name="수입"
                    stroke="hsl(var(--positive))"
                    strokeWidth={2}
                    dot={{ r: 3 }}
                  />
                  <Line
                    type="monotone"
                    dataKey="totalExpense"
                    name="지출"
                    stroke="hsl(var(--negative))"
                    strokeWidth={2}
                    dot={{ r: 3 }}
                  />
                  <Line
                    type="monotone"
                    dataKey="netBalance"
                    name="순잔액"
                    stroke="hsl(var(--primary))"
                    strokeWidth={2}
                    dot={{ r: 3 }}
                  />
                </LineChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          {categoryData.length > 0 && (
            <>
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-base">지출 카테고리 비중</CardTitle>
                </CardHeader>
                <CardContent className="h-72">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={categoryData}
                        dataKey="value"
                        nameKey="name"
                        cx="50%"
                        cy="50%"
                        outerRadius={90}
                        label={(entry: { name: string }) => entry.name}
                      >
                        {categoryData.map((_, idx) => (
                          <Cell key={idx} fill={PIE_COLORS[idx % PIE_COLORS.length]} />
                        ))}
                      </Pie>
                      <Tooltip formatter={(v: number) => formatKRW(v)} />
                    </PieChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-base">지출 TOP {topExpenseCount}</CardTitle>
                </CardHeader>
                <CardContent className="h-72">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart
                      data={topCategories}
                      layout="vertical"
                      margin={{ top: 5, right: 10, bottom: 5, left: 30 }}
                    >
                      <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                      <XAxis
                        type="number"
                        tickFormatter={(v) => `${Math.round(v / 10000)}만`}
                        tick={{ fontSize: 11 }}
                      />
                      <YAxis dataKey="name" type="category" tick={{ fontSize: 11 }} width={60} />
                      <Tooltip formatter={(v: number) => formatKRW(v)} />
                      <Bar dataKey="value" fill="hsl(var(--primary))" radius={[0, 4, 4, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>
            </>
          )}
        </section>
      )}
    </main>
  )
}
