import Link from 'next/link'
import { currentMonthKey } from '@/lib/month-key'

export function AppHeader() {
  const monthHref = `/months/${currentMonthKey()}`
  return (
    <header className="border-b border-border bg-background/80 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="mx-auto flex max-w-7xl items-center justify-between gap-4 px-4 py-3 sm:px-6">
        <Link href="/" className="font-semibold tracking-tight">
          paynote
        </Link>
        <nav aria-label="주 메뉴">
          <ul className="flex gap-5 text-sm text-muted-foreground">
            <li>
              <Link href={monthHref} className="hover:text-foreground">
                월별
              </Link>
            </li>
            <li>
              <Link href="/stats" className="hover:text-foreground">
                통계
              </Link>
            </li>
            <li>
              <Link href="/accounts" className="hover:text-foreground">
                통장
              </Link>
            </li>
            <li>
              <Link href="/templates" className="hover:text-foreground">
                템플릿
              </Link>
            </li>
            <li>
              <Link href="/settings" className="hover:text-foreground">
                설정
              </Link>
            </li>
          </ul>
        </nav>
      </div>
    </header>
  )
}
