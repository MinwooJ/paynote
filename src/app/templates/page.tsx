import { redirect } from 'next/navigation'
import * as accountsQ from '@/db/queries/accounts'
import * as templatesQ from '@/db/queries/templates'
import { AppHeader } from '@/components/app-header'
import { TemplatesView } from './templates-view'

export const dynamic = 'force-dynamic'

export default async function TemplatesPage() {
  const hasAny = await accountsQ.hasAnyAccount()
  if (!hasAny) redirect('/onboarding')

  const [templates, activeAccounts] = await Promise.all([
    templatesQ.listTemplates(),
    accountsQ.listActiveAccounts(),
  ])

  const templatesWithItems = await Promise.all(
    templates.map((t) => templatesQ.getTemplateWithItems(t.id)),
  )
  const filled = templatesWithItems.filter((t) => t !== undefined)

  return (
    <>
      <AppHeader />
      <TemplatesView templates={filled} activeAccounts={activeAccounts} />
    </>
  )
}
