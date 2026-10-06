'use client'

import Image from 'next/image'
import { useState, useSyncExternalStore } from 'react'
import { Wifi, WifiOff } from 'lucide-react'
import { useHydrated } from '@/lib/agenda/store'
import { cn } from '@/lib/utils'
import { BackupView } from './backup-view'
import { CalendarView } from './calendar-view'
import { ClientsView } from './clients-view'
import { DashboardView } from './dashboard-view'
import { NAV_ITEMS, type TabId } from './nav-items'
import { SessionsView } from './sessions-view'

function subscribeOnline(cb: () => void) {
  window.addEventListener('online', cb)
  window.addEventListener('offline', cb)
  return () => {
    window.removeEventListener('online', cb)
    window.removeEventListener('offline', cb)
  }
}

function useOnline() {
  return useSyncExternalStore(
    subscribeOnline,
    () => navigator.onLine,
    () => true,
  )
}

function OnlineBadge({ className }: { className?: string }) {
  const online = useOnline()
  return (
    <span
      className={cn(
        'inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-medium',
        online ? 'bg-success/15 text-success' : 'bg-accent/20 text-accent',
        className,
      )}
    >
      {online ? <Wifi className="size-3.5" aria-hidden="true" /> : <WifiOff className="size-3.5" aria-hidden="true" />}
      {online ? 'متصل' : 'دون اتصال'}
    </span>
  )
}

function Brand({ compact = false }: { compact?: boolean }) {
  return (
    <div className="flex items-center gap-3">
      <Image
        src="/app-icon.png"
        alt=""
        width={compact ? 36 : 44}
        height={compact ? 36 : 44}
        className="rounded-xl ring-1 ring-accent/40"
      />
      <div className="leading-tight">
        <p className={cn('font-serif font-bold', compact ? 'text-lg' : 'text-xl')}>أجندة المحامي</p>
        {!compact && <p className="text-xs text-sidebar-foreground/60">الجلسات · الموكلون · المواعيد</p>}
      </div>
    </div>
  )
}

export function AppShell() {
  const [tab, setTab] = useState<TabId>('dashboard')
  const hydrated = useHydrated()

  const navigate = (next: TabId) => {
    setTab(next)
    window.scrollTo({ top: 0 })
  }

  return (
    <div className="flex min-h-dvh">
      <aside className="hidden w-64 shrink-0 flex-col bg-sidebar text-sidebar-foreground md:sticky md:top-0 md:flex md:h-dvh">
        <div className="border-b border-sidebar-border p-5">
          <Brand />
        </div>
        <nav aria-label="القائمة الرئيسية" className="flex flex-1 flex-col gap-1 p-3">
          {NAV_ITEMS.map((item) => {
            const active = tab === item.id
            return (
              <button
                key={item.id}
                type="button"
                onClick={() => navigate(item.id)}
                aria-current={active ? 'page' : undefined}
                className={cn(
                  'flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors',
                  active
                    ? 'bg-sidebar-accent text-sidebar-accent-foreground'
                    : 'text-sidebar-foreground/70 hover:bg-sidebar-accent/60 hover:text-sidebar-foreground',
                )}
              >
                <item.icon className={cn('size-5', active && 'text-sidebar-primary')} aria-hidden="true" />
                {item.label}
                {active && <span className="ms-auto h-5 w-1 rounded-full bg-sidebar-primary" aria-hidden="true" />}
              </button>
            )
          })}
        </nav>
        <div className="border-t border-sidebar-border p-4">
          <OnlineBadge className={'bg-sidebar-accent'} />
          <p className="mt-2 text-xs leading-relaxed text-sidebar-foreground/50">
            جميع البيانات محفوظة محلياً على هذا الجهاز.
          </p>
        </div>
      </aside>

      <div className="flex min-w-0 flex-1 flex-col">
        <header className="sticky top-0 z-20 flex h-14 items-center justify-between bg-sidebar px-4 text-sidebar-foreground shadow-md md:hidden">
          <Brand compact />
          <OnlineBadge className="bg-sidebar-accent" />
        </header>

        <main className="mx-auto w-full max-w-6xl flex-1 px-4 pb-28 pt-5 md:px-8 md:pb-10 md:pt-8">
          {!hydrated ? (
            <div className="flex flex-col gap-4" aria-busy="true" aria-label="جارٍ التحميل">
              <div className="h-40 animate-pulse rounded-2xl bg-primary/10" />
              <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
                {Array.from({ length: 4 }).map((_, i) => (
                  <div key={i} className="h-24 animate-pulse rounded-xl bg-muted" />
                ))}
              </div>
            </div>
          ) : tab === 'dashboard' ? (
            <DashboardView onNavigate={navigate} />
          ) : tab === 'sessions' ? (
            <SessionsView />
          ) : tab === 'calendar' ? (
            <CalendarView />
          ) : tab === 'clients' ? (
            <ClientsView />
          ) : (
            <BackupView />
          )}
        </main>
      </div>

      <nav
        aria-label="التنقل السفلي"
        className="fixed inset-x-0 bottom-0 z-30 border-t border-sidebar-border bg-sidebar pb-[env(safe-area-inset-bottom)] text-sidebar-foreground md:hidden"
      >
        <ul className="grid grid-cols-5">
          {NAV_ITEMS.map((item) => {
            const active = tab === item.id
            return (
              <li key={item.id}>
                <button
                  type="button"
                  onClick={() => navigate(item.id)}
                  aria-current={active ? 'page' : undefined}
                  className={cn(
                    'relative flex h-16 w-full flex-col items-center justify-center gap-1 text-[11px] font-medium transition-colors',
                    active ? 'text-sidebar-primary' : 'text-sidebar-foreground/60',
                  )}
                >
                  {active && <span className="absolute top-0 h-0.5 w-10 rounded-full bg-sidebar-primary" aria-hidden="true" />}
                  <item.icon className="size-5" aria-hidden="true" />
                  {item.label}
                </button>
              </li>
            )
          })}
        </ul>
      </nav>
    </div>
  )
}
