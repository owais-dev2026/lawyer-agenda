'use client'

import { AlertTriangle, Briefcase, CalendarCheck, CalendarClock, Gavel, Plus, Users } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { sortSessions, useAgenda } from '@/lib/agenda/store'
import { addDays, formatLongDate, todayISO } from '@/lib/agenda/dates'
import { EmptyState, SectionTitle } from './page-header'
import { SessionCard } from './session-card'
import { useSessionActions } from './use-session-actions'
import type { TabId } from './nav-items'

export function DashboardView({ onNavigate }: { onNavigate: (tab: TabId) => void }) {
  const { sessions, clients } = useAgenda()
  const { actions, modals } = useSessionActions()
  const today = todayISO()
  const weekEnd = addDays(today, 7)

  const todaySessions = sortSessions(sessions.filter((s) => s.date === today))
  const upcoming = sortSessions(sessions.filter((s) => s.date > today && s.date <= weekEnd && s.status === 'pending'))
  const overdue = sortSessions(sessions.filter((s) => s.date < today && s.status === 'pending'), 'desc')
  const activeCases = new Set(
    sessions.filter((s) => s.status === 'pending').map((s) => s.caseNumber || `${s.clientName}`),
  ).size
  const todayPending = todaySessions.filter((s) => s.status === 'pending').length

  const stats = [
    { label: 'جلسات اليوم', value: todaySessions.length, hint: `${todayPending} متبقية`, icon: Gavel },
    { label: 'القضايا النشطة', value: activeCases, hint: 'قضايا قيد المتابعة', icon: Briefcase },
    { label: 'هذا الأسبوع', value: upcoming.length, hint: 'جلسات قادمة', icon: CalendarClock },
    { label: 'الموكلون', value: clients.length, hint: 'موكل مسجل', icon: Users },
  ]

  return (
    <div className="flex flex-col gap-6">
      <section className="relative overflow-hidden rounded-2xl bg-primary p-5 text-primary-foreground shadow-lg md:p-7">
        <div
          className="pointer-events-none absolute -left-10 -top-10 size-40 rounded-full border-[18px] border-accent/15"
          aria-hidden="true"
        />
        <p className="text-sm text-primary-foreground/70">{formatLongDate(today)}</p>
        <h1 className="mt-1 text-balance font-serif text-2xl font-bold md:text-3xl">
          {todaySessions.length > 0
            ? `لديك ${todaySessions.length} ${todaySessions.length === 1 ? 'جلسة' : 'جلسات'} اليوم`
            : 'لا توجد جلسات اليوم'}
        </h1>
        <p className="mt-1 text-sm text-primary-foreground/70">
          {upcoming.length > 0
            ? `و${upcoming.length} جلسات قادمة خلال الأيام السبعة القادمة`
            : 'جدولك خالٍ خلال الأسبوع القادم'}
        </p>
        <Button
          onClick={() => actions.openNew()}
          className="mt-4 h-10 gap-2 bg-accent px-4 text-accent-foreground hover:bg-accent/90"
        >
          <Plus />
          إضافة جلسة
        </Button>
      </section>

      <section aria-label="إحصائيات" className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        {stats.map((s) => (
          <div key={s.label} className="rounded-xl border bg-card p-4 shadow-sm">
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">{s.label}</span>
              <s.icon className="size-4 text-accent" aria-hidden="true" />
            </div>
            <p className="mt-2 text-3xl font-bold text-primary">{s.value}</p>
            <p className="text-xs text-muted-foreground">{s.hint}</p>
          </div>
        ))}
      </section>

      {overdue.length > 0 && (
        <section className="rounded-xl border border-destructive/30 bg-destructive/5 p-4">
          <div className="flex items-start gap-3">
            <AlertTriangle className="mt-0.5 size-5 shrink-0 text-destructive" aria-hidden="true" />
            <div className="flex-1">
              <p className="font-semibold text-destructive">
                {overdue.length} {overdue.length === 1 ? 'جلسة سابقة تحتاج' : 'جلسات سابقة تحتاج'} إلى تحديث
              </p>
              <p className="text-sm text-muted-foreground">
                قم بإنهاء الجلسات المنعقدة أو حدد موعد الجلسة التالية.
              </p>
            </div>
            <Button size="sm" variant="outline" onClick={() => onNavigate('sessions')}>
              عرض
            </Button>
          </div>
        </section>
      )}

      <div className="grid gap-6 lg:grid-cols-2">
        <section>
          <SectionTitle>جلسات اليوم</SectionTitle>
          {todaySessions.length === 0 ? (
            <EmptyState
              icon={CalendarCheck}
              title="لا توجد جلسات اليوم"
              description="استغل وقتك في تحضير مذكرات القضايا القادمة."
            />
          ) : (
            <div className="flex flex-col gap-3">
              {todaySessions.map((s) => (
                <SessionCard key={s.id} session={s} actions={actions} />
              ))}
            </div>
          )}
        </section>

        <section>
          <SectionTitle
            aside={
              <Button variant="link" size="sm" onClick={() => onNavigate('calendar')}>
                التقويم
              </Button>
            }
          >
            المواعيد القادمة
          </SectionTitle>
          {upcoming.length === 0 ? (
            <EmptyState icon={CalendarClock} title="لا توجد مواعيد قادمة" description="خلال الأيام السبعة القادمة." />
          ) : (
            <div className="flex flex-col gap-3">
              {upcoming.slice(0, 5).map((s) => (
                <SessionCard key={s.id} session={s} actions={actions} showDate />
              ))}
              {upcoming.length > 5 && (
                <Button variant="outline" className="h-10" onClick={() => onNavigate('sessions')}>
                  عرض كل الجلسات ({upcoming.length})
                </Button>
              )}
            </div>
          )}
        </section>
      </div>

      {modals}
    </div>
  )
}
