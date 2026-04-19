'use client'

import * as React from 'react'
import { Copy, ArrowRight } from 'lucide-react'
import { toast } from 'sonner'
import type { Account } from '@/db/schema'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { formatKRW } from '@/lib/currency'
import type { TransferPlanResult } from '@/domain/transfer-plan'

interface Props {
  result: TransferPlanResult
  accountsById: Map<number, Account>
}

export function TransferPlanCard({ result, accountsById }: Props) {
  if (!result.ok) {
    const msg =
      result.error === 'no-savings'
        ? '저축 통장을 지정하면 이체 권장이 나타납니다.'
        : '저축 통장은 1개만 지정해야 합니다.'
    return (
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base text-muted-foreground">이체 권장</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">{msg}</p>
        </CardContent>
      </Card>
    )
  }

  if (result.plan.length === 0) {
    return (
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base text-muted-foreground">이체 권장</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">
            이체 권장 없음 — 통장별 순변동이 모두 0입니다.
          </p>
        </CardContent>
      </Card>
    )
  }

  const copy = async (amount: number) => {
    try {
      await navigator.clipboard.writeText(String(amount))
      toast.success(`${formatKRW(amount)} 복사됨`)
    } catch {
      toast.error('복사에 실패했어요')
    }
  }

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-base text-muted-foreground">
          💸 이체 권장 · {result.plan.length}건
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-2">
        {result.plan.map((p, idx) => {
          const from = accountsById.get(p.fromAccountId)?.name ?? `#${p.fromAccountId}`
          const to = accountsById.get(p.toAccountId)?.name ?? `#${p.toAccountId}`
          const isCover = p.direction === 'cover'
          return (
            <div
              key={idx}
              className="flex items-center gap-2 rounded-md border border-border/50 px-3 py-2"
            >
              <div className="flex-1 min-w-0 text-sm">
                <div className="flex items-center gap-1.5 font-medium">
                  <span className="truncate">{from}</span>
                  <ArrowRight className="h-3 w-3 shrink-0 text-muted-foreground" />
                  <span className="truncate">{to}</span>
                </div>
                <div className="amount text-xs text-muted-foreground">
                  {formatKRW(p.amount)}
                  {isCover && <span className="ml-1 text-negative">(부족분 보충)</span>}
                </div>
              </div>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => copy(p.amount)}
                aria-label="금액 복사"
              >
                <Copy className="h-4 w-4" />
              </Button>
            </div>
          )
        })}
        <p className="pt-1 text-xs text-muted-foreground">
          이 계획을 은행 앱에서 직접 실행하세요. paynote은 실행 기록을 저장하지 않습니다.
        </p>
      </CardContent>
    </Card>
  )
}
