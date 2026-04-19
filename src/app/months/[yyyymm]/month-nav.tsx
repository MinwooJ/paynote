'use client'

import Link from 'next/link'
import { useRouter } from 'next/navigation'
import * as React from 'react'
import { ChevronLeft, ChevronRight } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { prevMonth, nextMonth } from '@/lib/month-key'

interface Props {
  monthId: string
}

export function MonthNav({ monthId }: Props) {
  const router = useRouter()
  const prev = prevMonth(monthId)
  const next = nextMonth(monthId)

  React.useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.target instanceof HTMLElement) {
        const tag = e.target.tagName
        if (tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'SELECT') return
      }
      if (e.key === '[') router.push(`/months/${prev}`)
      else if (e.key === ']') router.push(`/months/${next}`)
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [router, prev, next])

  return (
    <nav className="flex items-center gap-2" aria-label="월 이동">
      <Button variant="ghost" size="icon" asChild aria-label="이전 달">
        <Link href={`/months/${prev}`}>
          <ChevronLeft className="h-4 w-4" />
        </Link>
      </Button>
      <div className="text-xl font-semibold tabular-nums" aria-live="polite">
        {monthId}
      </div>
      <Button variant="ghost" size="icon" asChild aria-label="다음 달">
        <Link href={`/months/${next}`}>
          <ChevronRight className="h-4 w-4" />
        </Link>
      </Button>
    </nav>
  )
}
