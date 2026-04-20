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
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { formatKRW } from '@/lib/currency'
import { isValidMonthKey, monthRange, prevMonth } from '@/lib/month-key'
import { aggregateTrend } from '@/domain/aggregate-trend'
import { calculateSavingsRate } from '@/domain/savings-rate'

type Preset = '6m' | '12m' | '24m' | 'thisYear' | 'lastYear' | 'all' | 'custom'

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
  earliest: string
  latest: string
  today: string
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

function shiftBack(key: string, n: number): string {
  let cur = key
  for (let i = 0; i < n; i++) cur = prevMonth(cur)
  return cur
}

function yearOf(monthId: string): string {
  return monthId.slice(0, 4)
}

export function StatsView({ earliest, today, incomes, expenses }: Props) {
  const [preset, setPreset] = React.useState<Preset>('12m')
  const [customFrom, setCustomFrom] = React.useState<string>(shiftBack(today, 11))
  const [customTo, setCustomTo] = React.useState<string>(today)

  const { from, to } = React.useMemo(() => {
    const currentYear = today.slice(0, 4)
    const lastYear = String(Number(currentYear) - 1)
    switch (preset) {
      case '6m':
        return { from: shiftBack(today, 5), to: today }
      case '12m':
        return { from: shiftBack(today, 11), to: today }
      case '24m':
        return { from: shiftBack(today, 23), to: today }
      case 'thisYear':
        return { from: `${currentYear}-01`, to: today }
      case 'lastYear':
        return { from: `${lastYear}-01`, to: `${lastYear}-12` }
      case 'all':
        return { from: earliest, to: today }
      case 'custom': {
        const f = isValidMonthKey(customFrom) ? customFrom : earliest
        const t = isValidMonthKey(customTo) ? customTo : today
        return f <= t ? { from: f, to: t } : { from: t, to: f }
      }
    }
  }, [preset, customFrom, customTo, earliest, today])

  const monthIds = React.useMemo(() => monthRange(from, to), [from, to])
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
    return aggregateTrend({ from, to, incomesByMonth, expensesByMonth })
  }, [filteredIncomes, filteredExpenses, from, to])

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

  const yearSummary = React.useMemo(() => {
    const byYear = new Map<
      string,
      { income: number; expense: number; months: Set<string> }
    >()
    for (const point of trend) {
      if (!point.hasData) continue
      const y = yearOf(point.monthId)
      const ex = byYear.get(y) ?? { income: 0, expense: 0, months: new Set<string>() }
      ex.income += point.totalIncome
      ex.expense += point.totalExpense
      ex.months.add(point.monthId)
      byYear.set(y, ex)
    }
    return Array.from(byYear.entries())
      .map(([year, { income, expense, months }]) => ({
        year,
        income,
        expense,
        net: income - expense,
        monthsCount: months.size,
        savingsRate: calculateSavingsRate(income, income - expense),
      }))
      .sort((a, b) => b.year.localeCompare(a.year))
  }, [trend])

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

  const topCategories = categoryData.slice(0, 5)
  const hasEnoughData = trend.filter((t) => t.hasData).length >= 2
  const rangeLabel = from === to ? from : `${from} ~ ${to}`

  return (
    <main className="mx-auto max-w-7xl p-4 sm:p-6">
      <header className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-semibold">통계</h1>
          <p className="text-sm text-muted-foreground">{rangeLabel}</p>
        </div>
      </header>

      <PresetBar preset={preset} setPreset={setPreset} />

      {preset === 'custom' && (
        <div className="mb-4 flex flex-wrap items-end gap-3 rounded-md border border-dashed border-border p-3">
          <div className="space-y-1">
            <Label htmlFor="from-month">시작 월</Label>
            <Input
              id="from-month"
              type="month"
              value={customFrom}
              onChange={(e) => setCustomFrom(e.target.value)}
              max={today}
            />
          </div>
          <div className="space-y-1">
            <Label htmlFor="to-month">끝 월</Label>
            <Input
              id="to-month"
              type="month"
              value={customTo}
              onChange={(e) => setCustomTo(e.target.value)}
              max={today}
            />
          </div>
        </div>
      )}

      <section className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-xs text-muted-foreground">총 수입</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="amount text-xl font-semibold">{formatKRW(totals.totalIncome)}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-xs text-muted-foreground">총 지출</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="amount text-xl font-semibold">{formatKRW(totals.totalExpense)}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-xs text-muted-foreground">순잔액</CardTitle>
          </CardHeader>
          <CardContent>
            <div
              className={`amount text-xl font-semibold ${
                totals.netBalance >= 0 ? 'text-positive' : 'text-negative'
              }`}
            >
              {formatKRW(totals.netBalance)}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-xs text-muted-foreground">월 평균 저축률</CardTitle>
          </CardHeader>
          <CardContent>
            <div
              className={`amount text-xl font-semibold ${
                totals.avgSavingsRate >= 0 ? 'text-positive' : 'text-negative'
              }`}
            >
              {totals.avgSavingsRate.toFixed(1)}%
            </div>
            <div className="mt-1 text-xs text-muted-foreground">
              {totals.monthsWithData}개월 기록
            </div>
          </CardContent>
        </Card>
      </section>

      {yearSummary.length > 0 && (
        <Card className="mt-4">
          <CardHeader className="pb-3">
            <CardTitle className="text-base">연도별 합계</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-border text-xs text-muted-foreground">
                    <th className="py-2 text-left font-medium">연도</th>
                    <th className="py-2 text-right font-medium">수입</th>
                    <th className="py-2 text-right font-medium">지출</th>
                    <th className="py-2 text-right font-medium">순잔액</th>
                    <th className="py-2 text-right font-medium">저축률</th>
                    <th className="py-2 text-right font-medium">개월</th>
                  </tr>
                </thead>
                <tbody>
                  {yearSummary.map((y) => (
                    <tr key={y.year} className="border-b border-border/40 last:border-0">
                      <td className="py-2 font-medium">{y.year}</td>
                      <td className="amount py-2 text-right">{formatKRW(y.income)}</td>
                      <td className="amount py-2 text-right">{formatKRW(y.expense)}</td>
                      <td
                        className={`amount py-2 text-right font-medium ${
                          y.net >= 0 ? 'text-positive' : 'text-negative'
                        }`}
                      >
                        {formatKRW(y.net)}
                      </td>
                      <td
                        className={`amount py-2 text-right ${
                          y.savingsRate >= 0 ? 'text-positive' : 'text-negative'
                        }`}
                      >
                        {y.savingsRate.toFixed(1)}%
                      </td>
                      <td className="py-2 text-right text-muted-foreground">{y.monthsCount}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      )}

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
                  <CardTitle className="text-base">지출 TOP 5</CardTitle>
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

function PresetBar({ preset, setPreset }: { preset: Preset; setPreset: (p: Preset) => void }) {
  const options: { value: Preset; label: string }[] = [
    { value: '6m', label: '6개월' },
    { value: '12m', label: '12개월' },
    { value: '24m', label: '24개월' },
    { value: 'thisYear', label: '올해' },
    { value: 'lastYear', label: '작년' },
    { value: 'all', label: '전체' },
    { value: 'custom', label: '직접 지정' },
  ]
  return (
    <div className="mb-4 flex flex-wrap gap-1">
      {options.map((o) => (
        <Button
          key={o.value}
          variant={preset === o.value ? 'default' : 'outline'}
          size="sm"
          onClick={() => setPreset(o.value)}
        >
          {o.label}
        </Button>
      ))}
    </div>
  )
}
