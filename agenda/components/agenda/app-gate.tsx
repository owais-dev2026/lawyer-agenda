'use client'

import { useLockStatus } from '@/lib/agenda/lock'
import { AppShell } from './app-shell'
import { LockScreen } from './lock-screen'

export function AppGate() {
  const status = useLockStatus()

  if (status === 'loading') {
    return <div className="min-h-dvh bg-sidebar" aria-busy="true" aria-label="جارٍ التحميل" />
  }
  if (status === 'setup' || status === 'locked') return <LockScreen mode={status} />
  return <AppShell />
}
