'use client'

import * as React from 'react'
import { Archive, ArchiveRestore, Check, PiggyBank, Plus } from 'lucide-react'
import { toast } from 'sonner'
import type { Account } from '@/db/schema'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select } from '@/components/ui/select'
import { AmountInput } from '@/components/amount-input'
import { formatKRW } from '@/lib/currency'
import { currentMonthKey } from '@/lib/month-key'
import {
  archiveAccountAction,
  createAccountAction,
  switchSavingsAction,
  updateAccountAction,
} from './actions'

interface Props {
  accounts: Account[]
}

export function AccountsView({ accounts }: Props) {
  const active = accounts.filter((a) => a.archivedAt === null)
  const archived = accounts.filter((a) => a.archivedAt !== null)
  const [showAdd, setShowAdd] = React.useState(false)

  return (
    <main className="mx-auto max-w-3xl p-4 sm:p-6">
      <header className="mb-6 flex items-center justify-between">
        <h1 className="text-2xl font-semibold">통장 관리</h1>
        <Button variant="outline" onClick={() => setShowAdd((s) => !s)}>
          <Plus className="h-4 w-4" />
          새 통장
        </Button>
      </header>

      {showAdd && <AddAccountForm onClose={() => setShowAdd(false)} />}

      <section className="space-y-3">
        <h2 className="text-sm font-medium text-muted-foreground">활성 통장 · {active.length}</h2>
        {active.map((a) => (
          <AccountRow key={a.id} account={a} activeCount={active.length} />
        ))}
      </section>

      {archived.length > 0 && (
        <section className="mt-8 space-y-3">
          <h2 className="text-sm font-medium text-muted-foreground">
            보관된 통장 · {archived.length}
          </h2>
          {archived.map((a) => (
            <AccountRow key={a.id} account={a} activeCount={active.length} />
          ))}
        </section>
      )}
    </main>
  )
}

function AccountRow({ account, activeCount }: { account: Account; activeCount: number }) {
  const [pending, startTransition] = React.useTransition()
  const [editing, setEditing] = React.useState(false)
  const [name, setName] = React.useState(account.name)
  const [openingBalance, setOpeningBalance] = React.useState<number | null>(
    account.openingBalance,
  )

  const saveEdit = () => {
    startTransition(async () => {
      const result = await updateAccountAction({
        id: account.id,
        name: name.trim(),
        openingBalance: openingBalance ?? 0,
      })
      if (result.ok) {
        toast.success('저장되었어요')
        setEditing(false)
      } else {
        toast.error(result.error)
      }
    })
  }

  const makeSavings = () => {
    startTransition(async () => {
      const result = await switchSavingsAction({ newSavingsAccountId: account.id })
      if (result.ok) toast.success(`${account.name}을(를) 저축 통장으로 지정했어요`)
      else toast.error(result.error)
    })
  }

  const archive = () => {
    startTransition(async () => {
      const result = await archiveAccountAction({
        id: account.id,
        archive: account.archivedAt === null,
      })
      if (result.ok) {
        toast.success(account.archivedAt === null ? '보관되었어요' : '복구되었어요')
      } else {
        toast.error(result.error)
      }
    })
  }

  return (
    <Card>
      <CardContent className="flex flex-col gap-3 p-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex-1 space-y-1">
          {editing ? (
            <div className="space-y-2">
              <div className="grid gap-2 sm:grid-cols-[1fr_10rem]">
                <div>
                  <Label htmlFor={`name-${account.id}`} className="text-xs">
                    이름
                  </Label>
                  <Input
                    id={`name-${account.id}`}
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                  />
                </div>
                <div>
                  <Label htmlFor={`bal-${account.id}`} className="text-xs">
                    초기 잔액 (rebase)
                  </Label>
                  <AmountInput
                    id={`bal-${account.id}`}
                    value={openingBalance}
                    onValueChange={setOpeningBalance}
                  />
                </div>
              </div>
              <div className="flex gap-2">
                <Button size="sm" onClick={saveEdit} disabled={pending}>
                  <Check className="h-4 w-4" /> 저장
                </Button>
                <Button size="sm" variant="ghost" onClick={() => setEditing(false)}>
                  취소
                </Button>
              </div>
            </div>
          ) : (
            <>
              <div className="flex items-center gap-2">
                <span className="font-medium">{account.name}</span>
                {account.role === 'savings' && (
                  <span className="rounded bg-primary/10 px-1.5 py-0.5 text-xs text-primary">
                    저축
                  </span>
                )}
                {account.archivedAt !== null && (
                  <span className="rounded bg-muted px-1.5 py-0.5 text-xs text-muted-foreground">
                    보관
                  </span>
                )}
              </div>
              <div className="text-xs text-muted-foreground">
                초기 잔액 {formatKRW(account.openingBalance)} · 기준 월{' '}
                {account.openingBalanceAsOfMonth}
              </div>
            </>
          )}
        </div>

        {!editing && (
          <div className="flex flex-wrap gap-2">
            <Button variant="outline" size="sm" onClick={() => setEditing(true)}>
              편집
            </Button>
            {account.role !== 'savings' && account.archivedAt === null && (
              <Button variant="outline" size="sm" onClick={makeSavings} disabled={pending}>
                <PiggyBank className="h-4 w-4" /> 저축으로
              </Button>
            )}
            {account.archivedAt === null ? (
              <Button
                variant="ghost"
                size="sm"
                onClick={archive}
                disabled={pending || (activeCount <= 1 && account.role === 'spending')}
              >
                <Archive className="h-4 w-4" />
              </Button>
            ) : (
              <Button variant="ghost" size="sm" onClick={archive} disabled={pending}>
                <ArchiveRestore className="h-4 w-4" /> 복구
              </Button>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  )
}

function AddAccountForm({ onClose }: { onClose: () => void }) {
  const [name, setName] = React.useState('')
  const [role, setRole] = React.useState<'spending' | 'savings'>('spending')
  const [openingBalance, setOpeningBalance] = React.useState<number | null>(0)
  const [pending, startTransition] = React.useTransition()

  const submit = () => {
    if (name.trim().length === 0) return
    startTransition(async () => {
      const result = await createAccountAction({
        name: name.trim(),
        role,
        openingBalance: openingBalance ?? 0,
        openingBalanceAsOfMonth: currentMonthKey(),
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
    <Card className="mb-6">
      <CardHeader className="pb-3">
        <CardTitle className="text-base">새 통장 등록</CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        <div className="grid gap-3 sm:grid-cols-[1fr_8rem_10rem]">
          <Input
            placeholder="통장 이름 (예: 토스뱅크)"
            value={name}
            onChange={(e) => setName(e.target.value)}
            autoFocus
          />
          <Select value={role} onChange={(e) => setRole(e.target.value as typeof role)}>
            <option value="spending">일상</option>
            <option value="savings">저축</option>
          </Select>
          <AmountInput
            value={openingBalance}
            onValueChange={setOpeningBalance}
            placeholder="초기 잔액"
          />
        </div>
        <div className="flex gap-2">
          <Button onClick={submit} disabled={pending}>
            추가
          </Button>
          <Button variant="ghost" onClick={onClose}>
            취소
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}
