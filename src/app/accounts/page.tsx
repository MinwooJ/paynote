import { redirect } from 'next/navigation'
import * as accountsQ from '@/db/queries/accounts'
import { AppHeader } from '@/components/app-header'
import { AccountsView } from './accounts-view'

export const dynamic = 'force-dynamic'

export default async function AccountsPage() {
  const accounts = await accountsQ.listAllAccounts()
  if (accounts.length === 0) redirect('/onboarding')
  return (
    <>
      <AppHeader />
      <AccountsView accounts={accounts} />
    </>
  )
}
