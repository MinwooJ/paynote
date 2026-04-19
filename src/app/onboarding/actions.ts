'use server'

import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { z } from 'zod'
import * as accountsQ from '@/db/queries/accounts'
import { accountRoleSchema } from '@/lib/validators/account'
import { monthKeySchema } from '@/lib/validators/month'
import { currentMonthKey } from '@/lib/month-key'

const onboardingSchema = z.object({
  accounts: z
    .array(
      z.object({
        name: z.string().trim().min(1, '통장 이름을 입력해주세요').max(50),
        role: accountRoleSchema,
        openingBalance: z.number().int().nonnegative('음수는 입력할 수 없어요'),
      }),
    )
    .min(1, '최소 1개 이상의 통장이 필요합니다')
    .refine((xs) => xs.filter((a) => a.role === 'savings').length === 1, {
      message: '저축 통장을 정확히 1개 지정해주세요',
    }),
  openingBalanceAsOfMonth: monthKeySchema.optional(),
})

export type OnboardingState =
  | { ok: true }
  | { ok: false; error: string }
  | { ok: 'idle' }

export async function completeOnboarding(
  _prev: OnboardingState,
  input: unknown,
): Promise<OnboardingState> {
  const parsed = onboardingSchema.safeParse(input)
  if (!parsed.success) {
    const first = parsed.error.issues[0]?.message ?? '입력을 확인해주세요'
    return { ok: false, error: first }
  }

  const asOfMonth = parsed.data.openingBalanceAsOfMonth ?? currentMonthKey()

  for (const a of parsed.data.accounts) {
    await accountsQ.createAccount({
      name: a.name,
      role: a.role,
      openingBalance: a.openingBalance,
      openingBalanceAsOfMonth: asOfMonth,
    })
  }

  revalidatePath('/')
  redirect(`/months/${currentMonthKey()}`)
}
