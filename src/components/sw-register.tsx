'use client'

import * as React from 'react'

export function SWRegister() {
  React.useEffect(() => {
    if (typeof window === 'undefined') return
    if (!('serviceWorker' in navigator)) return
    // production에서만 등록 (dev 중 캐시가 HMR 방해하는 것 방지)
    if (process.env.NODE_ENV !== 'production') return
    navigator.serviceWorker.register('/sw.js').catch(() => undefined)
  }, [])
  return null
}
