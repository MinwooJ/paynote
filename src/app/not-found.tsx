import Link from 'next/link'
import { Button } from '@/components/ui/button'

export default function NotFound() {
  return (
    <main className="mx-auto flex min-h-dvh max-w-md flex-col items-center justify-center gap-4 p-6 text-center">
      <h1 className="text-2xl font-semibold">페이지를 찾을 수 없어요</h1>
      <p className="text-muted-foreground">주소를 확인하거나 홈으로 돌아가주세요.</p>
      <Button asChild>
        <Link href="/">홈으로</Link>
      </Button>
    </main>
  )
}
