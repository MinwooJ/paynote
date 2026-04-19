import { AppHeader } from '@/components/app-header'
import { SettingsView } from './settings-view'
import { getDbInfoAction } from './actions'

export const dynamic = 'force-dynamic'

export default async function SettingsPage() {
  const info = await getDbInfoAction()
  return (
    <>
      <AppHeader />
      <SettingsView initialInfo={info.ok ? info.data : null} />
    </>
  )
}
