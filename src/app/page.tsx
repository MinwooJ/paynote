import { redirect } from 'next/navigation'
import * as accountsQ from '@/db/queries/accounts'
import { currentMonthKey } from '@/lib/month-key'

export const dynamic = 'force-dynamic'

export default async function HomePage() {
  const has = await accountsQ.hasAnyAccount()
  if (!has) redirect('/onboarding')
  redirect(`/months/${currentMonthKey()}`)
}
