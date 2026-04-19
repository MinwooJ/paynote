'use client'

import * as React from 'react'
import { Plus, Play, Trash2 } from 'lucide-react'
import { toast } from 'sonner'
import type { Account } from '@/db/schema'
import type { TemplateWithItems } from '@/db/queries/templates'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Select } from '@/components/ui/select'
import { AmountInput } from '@/components/amount-input'
import { formatKRW } from '@/lib/currency'
import { currentMonthKey } from '@/lib/month-key'
import {
  addTemplateItemAction,
  applyTemplateAction,
  createTemplateAction,
  deleteTemplateAction,
  deleteTemplateItemAction,
} from './actions'

interface Props {
  templates: TemplateWithItems[]
  activeAccounts: Account[]
}

export function TemplatesView({ templates, activeAccounts }: Props) {
  const [newName, setNewName] = React.useState('')
  const [pending, startTransition] = React.useTransition()

  const createTemplate = () => {
    if (newName.trim().length === 0) return
    startTransition(async () => {
      const result = await createTemplateAction({ name: newName.trim() })
      if (result.ok) {
        toast.success('템플릿을 만들었어요')
        setNewName('')
      } else {
        toast.error(result.error)
      }
    })
  }

  return (
    <main className="mx-auto max-w-4xl p-4 sm:p-6">
      <header className="mb-6 flex items-center justify-between">
        <h1 className="text-2xl font-semibold">고정지출 템플릿</h1>
      </header>

      <Card className="mb-6">
        <CardHeader className="pb-3">
          <CardTitle className="text-base">새 템플릿</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex gap-2">
            <Input
              placeholder="템플릿 이름 (예: 기본 고정지출)"
              value={newName}
              onChange={(e) => setNewName(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  e.preventDefault()
                  createTemplate()
                }
              }}
            />
            <Button onClick={createTemplate} disabled={pending || newName.trim().length === 0}>
              <Plus className="h-4 w-4" /> 만들기
            </Button>
          </div>
        </CardContent>
      </Card>

      {templates.length === 0 ? (
        <p className="py-8 text-center text-sm text-muted-foreground">
          아직 템플릿이 없어요. 매달 반복되는 항목을 모아 하나 만들어보세요.
        </p>
      ) : (
        <div className="space-y-4">
          {templates.map((t) => (
            <TemplateCard key={t.id} template={t} activeAccounts={activeAccounts} />
          ))}
        </div>
      )}
    </main>
  )
}

function TemplateCard({
  template,
  activeAccounts,
}: {
  template: TemplateWithItems
  activeAccounts: Account[]
}) {
  const [adding, setAdding] = React.useState(false)
  const [pending, startTransition] = React.useTransition()

  const apply = () => {
    startTransition(async () => {
      const monthId = currentMonthKey()
      const result = await applyTemplateAction({ templateId: template.id, monthId, mode: 'append' })
      if (result.ok) {
        toast.success(
          `${result.data.cloned}개 항목 적용됨${result.data.skipped > 0 ? ` (${result.data.skipped}개 스킵)` : ''}`,
        )
      } else {
        toast.error(result.error)
      }
    })
  }

  const remove = () => {
    startTransition(async () => {
      const result = await deleteTemplateAction(template.id)
      if (result.ok) toast.success('템플릿이 삭제되었어요')
      else toast.error(result.error)
    })
  }

  const removeItem = (id: number) => {
    startTransition(async () => {
      await deleteTemplateItemAction(id)
    })
  }

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between pb-3">
        <CardTitle>{template.name}</CardTitle>
        <div className="flex gap-2">
          <Button size="sm" variant="outline" onClick={apply} disabled={pending}>
            <Play className="h-4 w-4" /> 이번 달에 적용
          </Button>
          <Button size="sm" variant="ghost" onClick={remove} disabled={pending}>
            <Trash2 className="h-4 w-4" />
          </Button>
        </div>
      </CardHeader>
      <CardContent className="space-y-2">
        {template.items.length === 0 && !adding && (
          <p className="text-sm text-muted-foreground">
            아직 항목이 없어요. 아래 버튼으로 추가해주세요.
          </p>
        )}

        {template.items.map((item) => {
          const account = activeAccounts.find((a) => a.id === item.accountId)
          return (
            <div
              key={item.id}
              className="flex items-center gap-3 rounded-md border border-border/50 px-3 py-2"
            >
              <span
                className={`rounded px-1.5 py-0.5 text-[10px] ${
                  item.kind === 'income'
                    ? 'bg-positive/10 text-positive'
                    : 'bg-muted text-muted-foreground'
                }`}
              >
                {item.kind === 'income' ? '수입' : '지출'}
              </span>
              <div className="flex-1 min-w-0">
                <div className="truncate text-sm font-medium">{item.label}</div>
                <div className="truncate text-xs text-muted-foreground">
                  {item.category ? `${item.category} · ` : ''}
                  {account?.name ?? '(통장 없음)'}
                </div>
              </div>
              <span className="amount text-sm">{formatKRW(item.amount)}</span>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => removeItem(item.id)}
                aria-label="삭제"
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            </div>
          )
        })}

        {adding ? (
          <AddItemForm
            templateId={template.id}
            activeAccounts={activeAccounts}
            onClose={() => setAdding(false)}
          />
        ) : (
          <Button variant="outline" size="sm" onClick={() => setAdding(true)} className="w-full">
            <Plus className="h-4 w-4" /> 항목 추가
          </Button>
        )}
      </CardContent>
    </Card>
  )
}

function AddItemForm({
  templateId,
  activeAccounts,
  onClose,
}: {
  templateId: number
  activeAccounts: Account[]
  onClose: () => void
}) {
  const [kind, setKind] = React.useState<'income' | 'expense'>('expense')
  const [label, setLabel] = React.useState('')
  const [amount, setAmount] = React.useState<number | null>(null)
  const [category, setCategory] = React.useState('')
  const [accountId, setAccountId] = React.useState<number | null>(activeAccounts[0]?.id ?? null)
  const [pending, startTransition] = React.useTransition()

  const submit = () => {
    if (label.trim().length === 0 || !amount || !accountId) return
    startTransition(async () => {
      const result = await addTemplateItemAction({
        templateId,
        kind,
        label: label.trim(),
        amount,
        category: category.trim() === '' ? null : category.trim(),
        accountId,
      })
      if (result.ok) {
        toast.success('추가되었어요')
        onClose()
      } else {
        toast.error(result.error)
      }
    })
  }

  return (
    <div className="space-y-2 rounded-md border border-dashed border-border p-3">
      <div className="grid gap-2 sm:grid-cols-[6rem_1fr_8rem_8rem_10rem_auto]">
        <Select value={kind} onChange={(e) => setKind(e.target.value as typeof kind)}>
          <option value="expense">지출</option>
          <option value="income">수입</option>
        </Select>
        <Input
          placeholder="항목 이름"
          value={label}
          onChange={(e) => setLabel(e.target.value)}
        />
        <AmountInput value={amount} onValueChange={setAmount} placeholder="금액" />
        <Input
          placeholder="카테고리 (선택)"
          value={category}
          onChange={(e) => setCategory(e.target.value)}
        />
        <Select
          value={accountId ?? ''}
          onChange={(e) => setAccountId(Number(e.target.value))}
        >
          {activeAccounts.map((a) => (
            <option key={a.id} value={a.id}>
              {a.name}
            </option>
          ))}
        </Select>
        <div className="flex gap-1">
          <Button onClick={submit} disabled={pending} size="sm">
            저장
          </Button>
          <Button variant="ghost" onClick={onClose} size="sm">
            취소
          </Button>
        </div>
      </div>
    </div>
  )
}
