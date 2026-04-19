'use client'

import * as React from 'react'
import { Trash2, Plus } from 'lucide-react'
import { toast } from 'sonner'
import type { Account, ExpenseItem } from '@/db/schema'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Select } from '@/components/ui/select'
import { AmountInput } from '@/components/amount-input'
import { formatKRW } from '@/lib/currency'
import { addExpenseAction } from './actions'

interface Props {
  monthId: string
  items: ExpenseItem[]
  activeAccounts: Account[]
  accountsById: Map<number, Account>
  onDelete: (item: ExpenseItem) => void
}

export function ExpenseSection({ monthId, items, activeAccounts, accountsById, onDelete }: Props) {
  const [showAdd, setShowAdd] = React.useState(false)

  const recentCategories = React.useMemo(() => {
    const set = new Set<string>()
    for (const it of items) if (it.category) set.add(it.category)
    return Array.from(set)
  }, [items])

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-3">
        <CardTitle>지출 · {items.length}건</CardTitle>
        <Button size="sm" variant="outline" onClick={() => setShowAdd((s) => !s)}>
          <Plus className="h-4 w-4" />
          {showAdd ? '닫기' : '항목 추가'}
        </Button>
      </CardHeader>
      <CardContent className="space-y-2">
        {showAdd && (
          <AddExpenseForm
            monthId={monthId}
            activeAccounts={activeAccounts}
            categoryHints={recentCategories}
            onSuccess={() => setShowAdd(false)}
          />
        )}

        {items.length === 0 && !showAdd && (
          <p className="py-6 text-center text-sm text-muted-foreground">
            지출 항목이 아직 없어요. 월세·관리비 등을 추가해주세요.
          </p>
        )}

        {items.map((item) => {
          const account = accountsById.get(item.sourceAccountId)
          return (
            <div
              key={item.id}
              className="flex items-center gap-3 rounded-md border border-border/50 px-3 py-2 hover:bg-accent/50"
            >
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <span className="truncate text-sm font-medium">{item.label}</span>
                  {item.category && (
                    <span className="rounded bg-muted px-1.5 py-0.5 text-[10px] text-muted-foreground">
                      {item.category}
                    </span>
                  )}
                </div>
                <div className="truncate text-xs text-muted-foreground">
                  ← {account?.name ?? '(보관된 통장)'}
                </div>
              </div>
              <div className="amount text-sm font-medium">{formatKRW(item.amount)}</div>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => onDelete(item)}
                aria-label="삭제"
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            </div>
          )
        })}
      </CardContent>
    </Card>
  )
}

function AddExpenseForm({
  monthId,
  activeAccounts,
  categoryHints,
  onSuccess,
}: {
  monthId: string
  activeAccounts: Account[]
  categoryHints: string[]
  onSuccess: () => void
}) {
  const [label, setLabel] = React.useState('')
  const [amount, setAmount] = React.useState<number | null>(null)
  const [category, setCategory] = React.useState('')
  const [accountId, setAccountId] = React.useState<number | null>(
    activeAccounts[0]?.id ?? null,
  )
  const [pending, startTransition] = React.useTransition()

  const canSubmit = label.trim().length > 0 && amount !== null && amount > 0 && accountId !== null

  const submit = () => {
    if (!canSubmit) return
    startTransition(async () => {
      const result = await addExpenseAction({
        monthId,
        amount,
        label: label.trim(),
        category: category.trim() === '' ? null : category.trim(),
        sourceAccountId: accountId,
      })
      if (result.ok) {
        toast.success('추가되었어요')
        setLabel('')
        setAmount(null)
        setCategory('')
        onSuccess()
      } else {
        toast.error(result.error)
      }
    })
  }

  return (
    <div className="space-y-2 rounded-md border border-dashed border-border p-3">
      <div className="grid gap-2 sm:grid-cols-[1fr_8rem_8rem_10rem_auto]">
        <Input
          placeholder="항목 이름 (예: 월세)"
          value={label}
          onChange={(e) => setLabel(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter') {
              e.preventDefault()
              submit()
            }
          }}
        />
        <AmountInput
          value={amount}
          onValueChange={setAmount}
          placeholder="금액"
        />
        <Input
          placeholder="카테고리 (선택)"
          value={category}
          onChange={(e) => setCategory(e.target.value)}
          list="expense-category-hints"
        />
        <datalist id="expense-category-hints">
          {categoryHints.map((c) => (
            <option key={c} value={c} />
          ))}
        </datalist>
        <Select
          value={accountId ?? ''}
          onChange={(e) => setAccountId(Number(e.target.value))}
          aria-label="출금 통장"
        >
          {activeAccounts.map((a) => (
            <option key={a.id} value={a.id}>
              {a.name}
            </option>
          ))}
        </Select>
        <Button onClick={submit} disabled={!canSubmit || pending}>
          {pending ? '저장 중…' : '추가'}
        </Button>
      </div>
    </div>
  )
}
