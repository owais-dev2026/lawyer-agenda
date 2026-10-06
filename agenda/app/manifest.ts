import type { MetadataRoute } from 'next'

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: 'أجندة المحامي',
    short_name: 'أجندة المحامي',
    description: 'إدارة جلسات المحاكم والموكلين دون اتصال بالإنترنت',
    start_url: '/',
    display: 'standalone',
    dir: 'rtl',
    lang: 'ar',
    background_color: '#f3ece0',
    theme_color: '#4a3423',
    icons: [{ src: '/app-icon.png', sizes: '512x512', type: 'image/png', purpose: 'any' }],
  }
}
