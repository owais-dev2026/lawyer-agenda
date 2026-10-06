'use client'

import { useState } from 'react'
import { CalendarDays, ChevronLeft, ChevronRight, Plus } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { sortSessions, useAgenda } from '@/lib/agenda/store'
import {
  WEEKDAYS_FROM_SATURDAY,
  formatLongDate,
  formatMonthYear,
  toISODate,
  todayISO,
} from '@/lib/agenda/dates'
import { cn } from '@/lib/utils'
import { EmptyState, PageHeader, SectionTitle } from './page-header'
import { SessionCard } from './session-card'
import { useSessionActions } from './use-session-actions'

export function CalendarView() {
  const { sessions } = useAgenda()
  const { actions, modals } = useSessionActions()
  const today = todayISO()
  const [cursor, setCursor] = useState(() => {
    const d = new Date()
    return new Date(d.getFullYear(), d.getMonth(), 1)
  })
  const [selected, setSelected] = useState(today)

  const counts = new Map<string, { total: number; pending: number }>()
  for (const s of sessions) {
    const c = counts.get(s.date) ?? { total: 0, pending: 0 }
    c.total++
    if (s.status === 'pending') c.pending++
    counts.set(s.date, c)
  }

  const year = cursor.getFullYear()
  const month = cursor.getMonth()
  const daysInMonth = new Date(year, month + 1, 0).getDate()
  const leading = (new Date(year, month, 1).getDay() + 1) % 7
  const cells: (string | null)[] = [
    ...Array.from({ length: leading }, () => null),
    ...Array.from({ length: daysInMonth }, (_, i) => toISODate(new Date(year, month, i + 1))),
  ]
  while (cells.length % 7 !== 0) cells.push(null)

  const monthPrefix = toISODate(cursor).slice(0, 7)
  const monthTotal = sessions.filter((s) => s.date.startsWith(monthPrefix)).length
  const daySessions = sortSessions(sessions.filter((s) => s.date === selected))

  const shiftMonth = (delta: number) => setCursor(new Date(year, month + delta, 1))
  const goToday = () => {
    const d = new Date()
    setCursor(new Date(d.getFullYear(), d.getMonth(), 1))
    setSelected(today)
  }

  return (
    <div>
      <PageHeader title="التقويم" subtitle={`${monthTotal} جلسة في هذا الشهر`} />

      <div className="grid gap-6 lg:grid-cols-[minmax(0,1.2fr)_minmax(0,1fr)]">
        <section className="rounded-2xl border bg-card p-4 shadow-sm md:p-5" aria-label="التقويم الشهري">
          <div className="mb-4 flex items-center justify-between gap-2">
            <Button variant="outline" size="icon" onClick={() => shiftMonth(-1)} aria-label="الشهر السابق">
              <ChevronRight />
            </Button>
            <div className="flex flex-col items-center">
              <h2 className="font-serif text-xl font-bold text-primary">{formatMonthYear(cursor)}</h2>
              <button type="button" onClick={goToday} className="text-xs font-medium text-accent-foreground underline-offset-4 hover:underline">
                العودة إلى اليوم
              </button>
            </div>
            <Button variant="outline" size="icon" onClick={() => shiftMonth(1)} aria-label="الشهر التالي">
              <ChevronLeft />
            </Button>
          </div>

          <div className="grid grid-cols-7 gap-1 text-center">
            {WEEKDAYS_FROM_SATURDAY.map((d) => (
              <div key={d} aria-hidden="true" className="pb-2 text-[11px] font-medium text-muted-foreground md:text-xs">
                <span className="md:hidden">{d.replace(/^ال/, '')}</span>
                <span className="hidden md:inline">{d}</span>
              </div>
            ))}
            {cells.map((iso, i) => {
              if (!iso) return <div key={`e-${i}`} aria-hidden="true" />
              const info = counts.get(iso)
              const isSelected = iso === selected
              const isToday = iso === today
              const dayNum = Number(iso.slice(8))
              return (
                <button
                  key={iso}
                  type="button"
                  aria-pressed={isSelected}
                  aria-current={isToday ? 'date' : undefined}
                  aria-label={`${formatLongDate(iso)}${info ? `، ${info.total} جلسة` : ''}`}
                  onClick={() => setSelected(iso)}
                  className={cn(
                    'relative flex aspect-square flex-col items-center justify-center gap-0.5 rounded-lg text-sm font-medium transition-colors',
                    isSelected
                      ? 'bg-primary text-primary-foreground shadow'
                      : info
                        ? 'bg-accent/15 text-primary hover:bg-accent/25'
                        : 'text-foreground hover:bg-muted',
                    isToday && !isSelected && 'ring-2 ring-accent ring-inset',
                  )}
                >
                  <span>{dayNum}</span>
                  {info && (
                    <span
                      className={cn(
                        'min-w-4 rounded-full px-1 text-[10px] leading-4',
                        isSelected
                          ? 'bg-accent text-accent-foreground'
                          : info.pending > 0
                            ? 'bg-accent text-accent-foreground'
                            : 'bg-success text-success-foreground',
                      )}
                    >
                      {info.total}
                    </span>
                  )}
                </button>
              )
            })}
          </div>

          <div className="mt-4 flex flex-wrap items-center gap-4 border-t pt-3 text-xs text-muted-foreground">
            <span className="flex items-center gap-1.5">
              <span className="size-2.5 rounded-full bg-accent" aria-hidden="true" /> جلسات قيد الانتظار
            </span>
            <span className="flex items-center gap-1.5">
              <span className="size-2.5 rounded-full bg-success" aria-hidden="true" /> جلسات منتهية
            </span>
            <span className="flex items-center gap-1.5">
              <span className="size-2.5 rounded-full ring-2 ring-accent" aria-hidden="true" /> اليوم
            </span>
          </div>
        </section>

        <section aria-live="polite">
          <SectionTitle
            aside={
              <Button size="sm" className="h-8 gap-1" onClick={() => actions.openNew({ date: selected })}>
                <Plus />
                إضافة
              </Button>
            }
          >
            {formatLongDate(selected)}
          </SectionTitle>
          {daySessions.length === 0 ? (
            <EmptyState
              icon={CalendarDays}
              title="لا توجد جلسات في هذا اليوم"
              description="اضغط على إضافة لجدولة جلسة جديدة في هذا التاريخ."
            />
          ) : (
            <div className="flex flex-col gap-3">
              {daySessions.map((s) => (
                <SessionCard key={s.id} session={s} actions={actions} />
              ))}
            </div>
          )}
        </section>
      </div>

      {modals}
    </div>
  )
}
