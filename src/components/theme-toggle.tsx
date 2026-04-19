'use client'

import * as React from 'react'
import { Moon, Sun, Monitor } from 'lucide-react'
import { Button } from './ui/button'

type Theme = 'light' | 'dark' | 'system'

const STORAGE_KEY = 'paynote-theme'

function applyTheme(theme: Theme) {
  if (typeof window === 'undefined') return
  const root = document.documentElement
  const effectiveDark =
    theme === 'dark' ||
    (theme === 'system' && window.matchMedia('(prefers-color-scheme: dark)').matches)
  root.classList.toggle('dark', effectiveDark)
}

function readInitialTheme(): Theme {
  if (typeof window === 'undefined') return 'system'
  return (localStorage.getItem(STORAGE_KEY) as Theme | null) ?? 'system'
}

export function ThemeToggle() {
  const [theme, setTheme] = React.useState<Theme>(readInitialTheme)

  // 시스템 선호 변화 추적 (theme === 'system' 일 때만)
  React.useEffect(() => {
    if (theme !== 'system') return
    const mq = window.matchMedia('(prefers-color-scheme: dark)')
    const listener = () => applyTheme('system')
    mq.addEventListener('change', listener)
    return () => mq.removeEventListener('change', listener)
  }, [theme])

  const cycle = () => {
    const next: Theme = theme === 'light' ? 'dark' : theme === 'dark' ? 'system' : 'light'
    setTheme(next)
    localStorage.setItem(STORAGE_KEY, next)
    applyTheme(next)
  }

  const Icon = theme === 'dark' ? Moon : theme === 'system' ? Monitor : Sun
  const label =
    theme === 'dark' ? '다크 모드' : theme === 'system' ? '시스템 따름' : '라이트 모드'

  return (
    <Button variant="ghost" size="icon" onClick={cycle} aria-label={`테마 전환 (현재: ${label})`}>
      <Icon className="h-4 w-4" />
    </Button>
  )
}
