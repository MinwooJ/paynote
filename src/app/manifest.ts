import type { MetadataRoute } from 'next'

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: 'paynote · 월별 가계 기록',
    short_name: 'paynote',
    description: '매달 수입·지출을 기록하고 이체 권장을 자동 계산하는 개인용 가계 도구',
    start_url: '/',
    display: 'standalone',
    orientation: 'portrait',
    background_color: '#ffffff',
    theme_color: '#6a9883',
    lang: 'ko',
    categories: ['finance', 'productivity'],
    icons: [
      { src: '/icon', sizes: '192x192', type: 'image/png', purpose: 'any' },
      { src: '/icon1', sizes: '512x512', type: 'image/png', purpose: 'any' },
      { src: '/icon1', sizes: '512x512', type: 'image/png', purpose: 'maskable' },
    ],
  }
}
