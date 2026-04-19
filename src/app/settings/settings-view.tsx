'use client'

import * as React from 'react'
import { Copy, Download, Save } from 'lucide-react'
import { toast } from 'sonner'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { backupNowAction, exportJsonAction } from './actions'

interface Props {
  initialInfo: { path: string; bytes: number; exists: boolean } | null
}

function formatBytes(n: number): string {
  if (n < 1024) return `${n} B`
  if (n < 1024 * 1024) return `${(n / 1024).toFixed(1)} KB`
  return `${(n / 1024 / 1024).toFixed(1)} MB`
}

export function SettingsView({ initialInfo }: Props) {
  const [pending, startTransition] = React.useTransition()

  const copyPath = async () => {
    if (!initialInfo) return
    try {
      await navigator.clipboard.writeText(initialInfo.path)
      toast.success('경로가 복사되었어요')
    } catch {
      toast.error('복사에 실패했어요')
    }
  }

  const backupNow = () => {
    startTransition(async () => {
      const result = await backupNowAction()
      if (result.ok) {
        toast.success(`백업 완료 · ${formatBytes(result.data.bytes)}`)
      } else {
        toast.error(result.error)
      }
    })
  }

  const exportJson = () => {
    startTransition(async () => {
      const result = await exportJsonAction()
      if (!result.ok) {
        toast.error(result.error)
        return
      }
      const blob = new Blob([result.data.json], { type: 'application/json' })
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = result.data.filename
      document.body.appendChild(a)
      a.click()
      a.remove()
      URL.revokeObjectURL(url)
      toast.success('JSON 내보내기 완료')
    })
  }

  return (
    <main className="mx-auto max-w-3xl p-4 sm:p-6">
      <h1 className="mb-6 text-2xl font-semibold">설정</h1>

      <div className="space-y-4">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base">데이터베이스</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {initialInfo && (
              <>
                <div>
                  <div className="text-xs text-muted-foreground">파일 경로</div>
                  <div className="flex items-center gap-2">
                    <code className="flex-1 break-all rounded bg-muted px-2 py-1 text-xs">
                      {initialInfo.path}
                    </code>
                    <Button variant="ghost" size="icon" onClick={copyPath} aria-label="경로 복사">
                      <Copy className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
                <div>
                  <div className="text-xs text-muted-foreground">크기</div>
                  <div className="text-sm">
                    {initialInfo.exists ? formatBytes(initialInfo.bytes) : '(파일 없음)'}
                  </div>
                </div>
                <p className="text-xs text-muted-foreground">
                  iCloud Drive / Google Drive 동기화 폴더 안에 프로젝트를 두면 자동으로 원격 백업됩니다.
                </p>
              </>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base">백업 & 내보내기</CardTitle>
          </CardHeader>
          <CardContent className="flex flex-wrap gap-2">
            <Button onClick={backupNow} disabled={pending} variant="outline">
              <Save className="h-4 w-4" /> 지금 백업
            </Button>
            <Button onClick={exportJson} disabled={pending} variant="outline">
              <Download className="h-4 w-4" /> JSON 내보내기
            </Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base">테마</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">
              우측 상단 아이콘에서 라이트 / 다크 / 시스템 자동을 전환할 수 있어요.
            </p>
          </CardContent>
        </Card>
      </div>
    </main>
  )
}
