import type { Metadata, Viewport } from 'next'
import 'pretendard/dist/web/variable/pretendardvariable.css'
import './globals.css'
import { Toaster } from '@/components/ui/toaster'
import { SWRegister } from '@/components/sw-register'

export const metadata: Metadata = {
  title: 'paynote',
  description: '개인용 월별 가계 기록',
  applicationName: 'paynote',
  appleWebApp: {
    capable: true,
    statusBarStyle: 'default',
    title: 'paynote',
  },
  formatDetection: {
    telephone: false,
  },
}

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 5,
  colorScheme: 'light dark',
  themeColor: [
    { media: '(prefers-color-scheme: light)', color: '#ffffff' },
    { media: '(prefers-color-scheme: dark)', color: '#121418' },
  ],
}

const themeInitScript = `
try {
  var t = localStorage.getItem('paynote-theme') || 'system';
  var dark = t === 'dark' || (t === 'system' && matchMedia('(prefers-color-scheme: dark)').matches);
  document.documentElement.classList.toggle('dark', dark);
} catch (e) {}
`

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="ko" suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: themeInitScript }} />
      </head>
      <body className="min-h-dvh bg-background text-foreground antialiased">
        {children}
        <Toaster />
        <SWRegister />
      </body>
    </html>
  )
}
