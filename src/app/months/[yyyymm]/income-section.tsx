'use client'

import * as React from 'react'
import { Pencil, Trash2, Plus, Check, X } from 'lucide-react'
import { toast } from 'sonner'
import type { Account, IncomeItem } from '@/db/schema'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Select } from '@/components/ui/select'
import { AmountInput } from '@/components/amount-input'
import { formatKRW } from '@/lib/currency'
import { addIncomeAction, updateIncomeAction } from './actions'

interface Props {
  monthId: string
  items: IncomeItem[]
  activeAccounts: Account[]
  accountsById: Map<number, Account>
  onDelete: (item: IncomeItem) => void
}

export function IncomeSection({ monthId, items, activeAccounts, accountsById, onDelete }: Props) {
  const [showAdd, setShowAdd] = React.useState(false)

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-3">
        <CardTitle>수입 · {items.length}건</CardTitle>
        <Button size="sm" variant="outline" onClick={() => setShowAdd((s) => !s)}>
          <Plus className="h-4 w-4" />
          {showAdd ? '닫기' : '항목 추가'}
        </Button>
      </CardHeader>
      <CardContent className="space-y-2">
        {showAdd && (
          <IncomeFormRow
            monthId={monthId}
            activeAccounts={activeAccounts}
            onDone={() => setShowAdd(false)}
            mode="create"
          />
        )}

        {items.length === 0 && !showAdd && (
          <p className="py-6 text-center text-sm text-muted-foreground">
            수입 항목이 아직 없어요. 월급·수당 등을 추가해주세요.
          </p>
        )}

        {items.map((item) => (
          <IncomeRow
            key={item.id}
            item={item}
            activeAccounts={activeAccounts}
            accountsById={accountsById}
            onDelete={onDelete}
          />
        ))}
      </CardContent>
    </Card>
  )
}

function IncomeRow({
  item,
  activeAccounts,
  accountsById,
  onDelete,
}: {
  item: IncomeItem
  activeAccounts: Account[]
  accountsById: Map<number, Account>
  onDelete: (item: IncomeItem) => void
}) {
  const [editing, setEditing] = React.useState(false)

  if (editing) {
    return (
      <IncomeFormRow
        monthId={item.monthId}
        activeAccounts={activeAccounts}
        onDone={() => setEditing(false)}
        mode="edit"
        initial={item}
      />
    )
  }

  const account = accountsById.get(item.destinationAccountId)
  return (
    <div className="flex items-center gap-3 rounded-md border border-border/50 px-3 py-2 hover:bg-accent/50">
      <div
        className="flex-1 min-w-0 cursor-pointer"
        onClick={() => setEditing(true)}
        role="button"
        tabIndex={0}
        onKeyDown={(e) => {
          if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault()
            setEditing(true)
          }
        }}
      >
        <div className="truncate text-sm font-medium">{item.label}</div>
        <div className="truncate text-xs text-muted-foreground">
          → {account?.name ?? '(보관된 통장)'}
        </div>
      </div>
      <div className="amount text-sm font-medium">{formatKRW(item.amount)}</div>
      <Button variant="ghost" size="icon" onClick={() => setEditing(true)} aria-label="편집">
        <Pencil className="h-4 w-4" />
      </Button>
      <Button variant="ghost" size="icon" onClick={() => onDelete(item)} aria-label="삭제">
        <Trash2 className="h-4 w-4" />
      </Button>
    </div>
  )
}

interface FormProps {
  monthId: string
  activeAccounts: Account[]
  onDone: () => void
  mode: 'create' | 'edit'
  initial?: IncomeItem
}

function IncomeFormRow({ monthId, activeAccounts, onDone, mode, initial }: FormProps) {
  const [label, setLabel] = React.useState(initial?.label ?? '')
  const [amount, setAmount] = React.useState<number | null>(initial?.amount ?? null)
  const [accountId, setAccountId] = React.useState<number | null>(
    initial?.destinationAccountId ?? activeAccounts[0]?.id ?? null,
  )
  const [pending, startTransition] = React.useTransition()

  const canSubmit = label.trim().length > 0 && amount !== null && amount > 0 && accountId !== null

  const submit = () => {
    if (!canSubmit) return
    startTransition(async () => {
      if (mode === 'create') {
        const result = await addIncomeAction({
          monthId,
          amount,
          label: label.trim(),
          destinationAccountId: accountId,
        })
        if (result.ok) {
          toast.success('추가되었어요')
          onDone()
        } else {
          toast.error(result.error)
        }
      } else if (initial) {
        const result = await updateIncomeAction({
          id: initial.id,
          monthId,
          amount,
          label: label.trim(),
          destinationAccountId: accountId,
        })
        if (result.ok) {
          toast.success('수정되었어요')
          onDone()
        } else {
          toast.error(result.error)
        }
      }
    })
  }

  const onEnter = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      e.preventDefault()
      submit()
    } else if (e.key === 'Escape') {
      e.preventDefault()
      onDone()
    }
  }

  return (
    <div className="space-y-2 rounded-md border border-dashed border-border p-3">
      <div className="grid gap-2 sm:grid-cols-[1fr_8rem_10rem_auto]">
        <Input
          placeholder="항목 이름 (예: 월급)"
          value={label}
          onChange={(e) => setLabel(e.target.value)}
          onKeyDown={onEnter}
          autoFocus
        />
        <AmountInput
          value={amount}
          onValueChange={setAmount}
          placeholder="금액"
          onKeyDown={onEnter}
        />
        <Select
          value={accountId ?? ''}
          onChange={(e) => setAccountId(Number(e.target.value))}
          aria-label="입금 통장"
          onKeyDown={onEnter}
        >
          {activeAccounts.map((a) => (
            <option key={a.id} value={a.id}>
              {a.name}
              {a.role === 'savings' ? ' (저축)' : ''}
            </option>
          ))}
        </Select>
        <div className="flex gap-1">
          <Button onClick={submit} disabled={!canSubmit || pending} size="sm">
            <Check className="h-4 w-4" />
            {pending ? '저장 중…' : mode === 'create' ? '추가' : '저장'}
          </Button>
          <Button variant="ghost" onClick={onDone} size="sm" aria-label="취소">
            <X className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </div>
  )
}
