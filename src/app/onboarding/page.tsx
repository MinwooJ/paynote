import * as accountsQ from '@/db/queries/accounts'
import { redirect } from 'next/navigation'
import { OnboardingForm } from './onboarding-form'
import { currentMonthKey } from '@/lib/month-key'
import { ThemeToggle } from '@/components/theme-toggle'

export const dynamic = 'force-dynamic'

export default async function OnboardingPage() {
  const has = await accountsQ.hasAnyAccount()
  if (has) redirect(`/months/${currentMonthKey()}`)

  return (
    <main className="mx-auto max-w-2xl p-6 sm:p-8">
      <header className="mb-8 flex items-start justify-between gap-4">
        <div>
          <h1 className="text-3xl font-semibold tracking-tight">paynote에 오신 것을 환영합니다</h1>
          <p className="mt-2 text-muted-foreground">
            매달의 수입·지출을 기록하고 &ldquo;남은 돈을 어느 통장에 얼마 보낼지&rdquo; 자동 계산합니다.
            먼저 사용 중인 통장을 등록해주세요.
          </p>
        </div>
        <ThemeToggle />
      </header>
      <OnboardingForm />
    </main>
  )
}
