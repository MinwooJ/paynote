import type { Metadata, Viewport } from 'next'
import 'pretendard/dist/web/variable/pretendardvariable.css'
import './globals.css'

export const metadata: Metadata = {
  title: 'paynote',
  description: '개인용 월별 가계 기록',
  icons: { icon: '/favicon.ico' },
}

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  colorScheme: 'light dark',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="ko" suppressHydrationWarning>
      <body className="min-h-dvh bg-background text-foreground antialiased">{children}</body>
    </html>
  )
}
