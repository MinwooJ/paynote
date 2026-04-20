'use client'

import * as React from 'react'
import { Plus, X } from 'lucide-react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select } from '@/components/ui/select'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { AmountInput } from '@/components/amount-input'
import { currentMonthKey, isValidMonthKey } from '@/lib/month-key'
import { completeOnboarding } from './actions'

const BANK_PRESETS = [
  '우리은행',
  '국민은행',
  '카카오뱅크',
  '신한은행',
  '농협',
  '하나은행',
  '기업은행',
  '토스뱅크',
]

interface DraftAccount {
  name: string
  role: 'spending' | 'savings'
  openingBalance: number | null
}

function emptyDraft(): DraftAccount {
  return { name: '', role: 'spending', openingBalance: null }
}

export function OnboardingForm() {
  const [drafts, setDrafts] = React.useState<DraftAccount[]>([
    { name: '우리은행', role: 'spending', openingBalance: null },
    { name: '국민은행', role: 'spending', openingBalance: null },
    { name: '카카오뱅크', role: 'savings', openingBalance: null },
  ])
  const [startMonth, setStartMonth] = React.useState<string>(() => currentMonthKey())
  const [pending, startTransition] = React.useTransition()

  const savingsCount = drafts.filter((d) => d.role === 'savings').length
  const canSubmit =
    drafts.length > 0 &&
    drafts.every((d) => d.name.trim().length > 0) &&
    savingsCount === 1 &&
    isValidMonthKey(startMonth)

  const update = (idx: number, patch: Partial<DraftAccount>) => {
    setDrafts((prev) => prev.map((d, i) => (i === idx ? { ...d, ...patch } : d)))
  }

  const remove = (idx: number) => {
    setDrafts((prev) => prev.filter((_, i) => i !== idx))
  }

  const add = () => {
    setDrafts((prev) => [...prev, emptyDraft()])
  }

  const pickPreset = (idx: number, name: string) => {
    update(idx, { name })
  }

  const submit = () => {
    if (!canSubmit) return
    startTransition(async () => {
      const result = await completeOnboarding(
        { ok: 'idle' },
        {
          accounts: drafts.map((d) => ({
            name: d.name.trim(),
            role: d.role,
            openingBalance: d.openingBalance ?? 0,
          })),
          openingBalanceAsOfMonth: startMonth,
        },
      )
      if (result.ok === false) {
        toast.error(result.error)
      }
    })
  }

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault()
        submit()
      }}
      className="space-y-6"
    >
      <Card>
        <CardHeader>
          <CardTitle>기록 시작 월</CardTitle>
          <p className="text-sm text-muted-foreground">
            어느 달부터 기록할지 선택해주세요. 입력한 &ldquo;현재 잔액&rdquo;은 이 달의 1일 기준으로 적용됩니다.
          </p>
        </CardHeader>
        <CardContent className="space-y-2">
          <Label htmlFor="start-month">시작 월</Label>
          <Input
            id="start-month"
            type="month"
            value={startMonth}
            onChange={(e) => setStartMonth(e.target.value)}
            max={currentMonthKey()}
          />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>통장 등록</CardTitle>
          <p className="text-sm text-muted-foreground">
            일상 지출과 저축을 분리해 관리합니다. <strong>저축 통장 정확히 1개</strong>를
            지정해주세요 (예: 카카오뱅크).
          </p>
        </CardHeader>
        <CardContent className="space-y-4">
          {drafts.map((draft, idx) => (
            <div
              key={idx}
              className="space-y-3 rounded-md border border-border p-4"
            >
              <div className="flex items-center justify-between">
                <Label className="text-xs text-muted-foreground">통장 {idx + 1}</Label>
                {drafts.length > 1 && (
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    onClick={() => remove(idx)}
                    aria-label="삭제"
                  >
                    <X className="h-4 w-4" />
                  </Button>
                )}
              </div>

              <div className="grid gap-3 sm:grid-cols-2">
                <div className="space-y-1.5">
                  <Label htmlFor={`name-${idx}`}>이름</Label>
                  <Input
                    id={`name-${idx}`}
                    value={draft.name}
                    onChange={(e) => update(idx, { name: e.target.value })}
                    placeholder="예: 우리은행"
                    autoComplete="off"
                  />
                  <div className="flex flex-wrap gap-1 pt-1">
                    {BANK_PRESETS.map((preset) => (
                      <button
                        key={preset}
                        type="button"
                        onClick={() => pickPreset(idx, preset)}
                        className="rounded-full border border-border px-2 py-0.5 text-xs text-muted-foreground hover:bg-accent hover:text-accent-foreground"
                      >
                        {preset}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="space-y-1.5">
                  <Label htmlFor={`role-${idx}`}>용도</Label>
                  <Select
                    id={`role-${idx}`}
                    value={draft.role}
                    onChange={(e) =>
                      update(idx, { role: e.target.value as DraftAccount['role'] })
                    }
                  >
                    <option value="spending">일상 (spending)</option>
                    <option value="savings">저축 (savings)</option>
                  </Select>
                </div>
              </div>

              <div className="space-y-1.5">
                <Label htmlFor={`balance-${idx}`}>현재 잔액 (선택)</Label>
                <AmountInput
                  id={`balance-${idx}`}
                  value={draft.openingBalance}
                  onValueChange={(n) => update(idx, { openingBalance: n })}
                  placeholder="0 (예: 1,000,000)"
                />
              </div>
            </div>
          ))}

          <Button type="button" variant="outline" onClick={add} className="w-full">
            <Plus className="h-4 w-4" /> 통장 추가
          </Button>
        </CardContent>
      </Card>

      <div className="flex flex-col gap-2">
        {savingsCount !== 1 && (
          <p className="text-sm text-muted-foreground">
            저축 통장을 정확히 1개 지정해주세요. (현재 {savingsCount}개)
          </p>
        )}
        <Button type="submit" disabled={!canSubmit || pending} size="lg">
          {pending ? '설정 중…' : '시작하기'}
        </Button>
      </div>
    </form>
  )
}
