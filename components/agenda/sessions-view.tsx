'use client'

import { useDeferredValue, useState } from 'react'
import { Gavel, Plus, Search } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { sortSessions, useAgenda } from '@/lib/agenda/store'
import { formatLongDate, relativeDayLabel, todayISO } from '@/lib/agenda/dates'
import type { CourtSession } from '@/lib/agenda/types'
import { cn } from '@/lib/utils'
import { EmptyState, PageHeader } from './page-header'
import { SessionCard } from './session-card'
import { useSessionActions } from './use-session-actions'

type Range = 'upcoming' | 'past' | 'all'
type StatusFilter = 'all' | 'pending' | 'completed'

const RANGES: { id: Range; label: string }[] = [
  { id: 'upcoming', label: 'القادمة' },
  { id: 'past', label: 'السابقة' },
  { id: 'all', label: 'الكل' },
]
const STATUSES: { id: StatusFilter; label: string }[] = [
  { id: 'all', label: 'كل الحالات' },
  { id: 'pending', label: 'قيد الانتظار' },
  { id: 'completed', label: 'منتهية' },
]

export function SessionsView() {
  const { sessions } = useAgenda()
  const { actions, modals } = useSessionActions()
  const [range, setRange] = useState<Range>('upcoming')
  const [status, setStatus] = useState<StatusFilter>('all')
  const [query, setQuery] = useState('')
  const deferredQuery = useDeferredValue(query.trim().toLowerCase())
  const today = todayISO()

  const filtered = sortSessions(
    sessions.filter((s) => {
      if (range === 'upcoming' && s.date < today) return false
      if (range === 'past' && s.date >= today) return false
      if (status !== 'all' && s.status !== status) return false
      if (!deferredQuery) return true
      return [s.clientName, s.caseNumber, s.court, s.notes].some((f) =>
        f.toLowerCase().includes(deferredQuery),
      )
    }),
    range === 'past' ? 'desc' : 'asc',
  )

  const groups = filtered.reduce<{ date: string; items: CourtSession[] }[]>((acc, s) => {
    const last = acc[acc.length - 1]
    if (last && last.date === s.date) last.items.push(s)
    else acc.push({ date: s.date, items: [s] })
    return acc
  }, [])

  return (
    <div>
      <PageHeader
        title="أجندة الجلسات"
        subtitle={`${sessions.length} جلسة مسجلة`}
        action={
          <Button onClick={() => actions.openNew()} className="h-10 gap-1.5 px-4">
            <Plus />
            <span>جلسة جديدة</span>
          </Button>
        }
      />

      <div className="sticky top-14 z-10 -mx-4 mb-4 flex flex-col gap-3 bg-background/95 px-4 py-2 backdrop-blur md:top-0">
        <div className="relative">
          <Search
            className="pointer-events-none absolute right-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground"
            aria-hidden="true"
          />
          <Input
            type="search"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="ابحث بالموكل، رقم القضية، المحكمة..."
            aria-label="بحث في الجلسات"
            className="h-11 rounded-lg bg-card pr-9 text-base md:text-sm"
          />
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <div role="group" aria-label="الفترة" className="flex rounded-lg bg-secondary p-1">
            {RANGES.map((r) => (
              <button
                key={r.id}
                type="button"
                onClick={() => setRange(r.id)}
                aria-pressed={range === r.id}
                className={cn(
                  'rounded-md px-3 py-1.5 text-sm font-medium transition-colors',
                  range === r.id ? 'bg-card text-primary shadow-sm' : 'text-muted-foreground hover:text-primary',
                )}
              >
                {r.label}
              </button>
            ))}
          </div>
          <div role="group" aria-label="الحالة" className="flex gap-1.5 overflow-x-auto">
            {STATUSES.map((s) => (
              <button
                key={s.id}
                type="button"
                onClick={() => setStatus(s.id)}
                aria-pressed={status === s.id}
                className={cn(
                  'whitespace-nowrap rounded-full border px-3 py-1 text-xs font-medium transition-colors',
                  status === s.id
                    ? 'border-primary bg-primary text-primary-foreground'
                    : 'border-border bg-card text-muted-foreground hover:border-primary/40',
                )}
              >
                {s.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {groups.length === 0 ? (
        <EmptyState
          icon={Gavel}
          title={sessions.length === 0 ? 'لم تتم إضافة أي جلسة بعد' : 'لا توجد نتائج مطابقة'}
          description={
            sessions.length === 0 ? 'ابدأ بإضافة أول جلسة إلى أجندتك.' : 'جرّب تغيير الفلاتر أو كلمات البحث.'
          }
          action={
            sessions.length === 0 && (
              <Button onClick={() => actions.openNew()} className="h-10 gap-1.5">
                <Plus />
                إضافة جلسة
              </Button>
            )
          }
        />
      ) : (
        <div className="flex flex-col gap-6">
          {groups.map((g) => {
            const rel = relativeDayLabel(g.date)
            return (
              <section key={g.date} aria-label={formatLongDate(g.date)}>
                <h2 className="mb-2.5 flex items-center gap-2 text-sm font-semibold text-primary">
                  {rel && (
                    <span className="rounded-md bg-accent px-2 py-0.5 text-xs text-accent-foreground">{rel}</span>
                  )}
                  {formatLongDate(g.date)}
                  <span className="text-xs font-normal text-muted-foreground">({g.items.length})</span>
                </h2>
                <div className="grid gap-3 lg:grid-cols-2">
                  {g.items.map((s) => (
                    <SessionCard key={s.id} session={s} actions={actions} />
                  ))}
                </div>
              </section>
            )
          })}
        </div>
      )}

      {modals}
    </div>
  )
}
