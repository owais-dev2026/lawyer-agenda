'use client'

import { CalendarPlus, Check, FileText, Landmark, Pencil, RotateCcw, Trash2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { agenda } from '@/lib/agenda/store'
import { formatShortDate, formatTime, relativeDayLabel, todayISO } from '@/lib/agenda/dates'
import type { CourtSession } from '@/lib/agenda/types'
import { cn } from '@/lib/utils'
import type { SessionActions } from './use-session-actions'

interface SessionCardProps {
  session: CourtSession
  actions: SessionActions
  showDate?: boolean
}

export function SessionCard({ session, actions, showDate = false }: SessionCardProps) {
  const completed = session.status === 'completed'
  const overdue = !completed && session.date < todayISO()
  const relative = relativeDayLabel(session.date)

  return (
    <article
      className={cn(
        'group relative flex gap-3 overflow-hidden rounded-xl border bg-card p-4 shadow-sm transition-shadow hover:shadow-md',
        completed && 'bg-muted/60',
      )}
    >
      <span
        className={cn(
          'absolute inset-y-0 right-0 w-1',
          completed ? 'bg-success' : overdue ? 'bg-destructive' : 'bg-accent',
        )}
        aria-hidden="true"
      />
      <div className="flex w-16 shrink-0 flex-col items-center justify-center rounded-lg bg-secondary px-1 py-2 text-center">
        <span className="text-sm font-bold leading-tight text-primary" dir="ltr">
          {formatTime(session.time)}
        </span>
        {showDate && (
          <span className="mt-1 text-[11px] leading-tight text-muted-foreground">
            {relative ?? formatShortDate(session.date)}
          </span>
        )}
      </div>

      <div className="min-w-0 flex-1">
        <div className="flex items-start justify-between gap-2">
          <h3
            className={cn(
              'truncate text-base font-semibold',
              completed && 'text-muted-foreground line-through decoration-1',
            )}
          >
            {session.clientName}
          </h3>
          <span
            className={cn(
              'shrink-0 rounded-full px-2 py-0.5 text-[11px] font-medium',
              completed
                ? 'bg-success/10 text-success'
                : overdue
                  ? 'bg-destructive/10 text-destructive'
                  : 'bg-accent/20 text-accent-foreground',
            )}
          >
            {completed ? 'منتهية' : overdue ? 'تحتاج تحديث' : 'قيد الانتظار'}
          </span>
        </div>

        <dl className="mt-1.5 flex flex-col gap-1 text-sm text-muted-foreground">
          {session.caseNumber && (
            <div className="flex items-center gap-1.5">
              <FileText className="size-3.5 shrink-0" aria-hidden="true" />
              <dt className="sr-only">رقم القضية</dt>
              <dd className="truncate">قضية رقم {session.caseNumber}</dd>
            </div>
          )}
          {session.court && (
            <div className="flex items-center gap-1.5">
              <Landmark className="size-3.5 shrink-0" aria-hidden="true" />
              <dt className="sr-only">المحكمة</dt>
              <dd className="truncate">{session.court}</dd>
            </div>
          )}
        </dl>

        {session.notes && (
          <p className="mt-2 line-clamp-2 rounded-md bg-muted px-2.5 py-1.5 text-sm leading-relaxed text-foreground/80">
            {session.notes}
          </p>
        )}

        <div className="mt-3 flex flex-wrap items-center gap-1.5">
          <Button
            size="sm"
            variant={completed ? 'outline' : 'default'}
            className={cn('h-8 gap-1.5', !completed && 'bg-success text-success-foreground hover:bg-success/90')}
            onClick={() => agenda.toggleSessionStatus(session.id)}
          >
            {completed ? <RotateCcw /> : <Check />}
            {completed ? 'إعادة فتح' : 'إنهاء'}
          </Button>
          <Button size="sm" variant="outline" className="h-8 gap-1.5" onClick={() => actions.openNext(session)}>
            <CalendarPlus />
            جلسة تالية
          </Button>
          <div className="ms-auto flex gap-1">
            <Button
              size="icon-sm"
              variant="ghost"
              onClick={() => actions.openEdit(session)}
              aria-label={`تعديل جلسة ${session.clientName}`}
            >
              <Pencil />
            </Button>
            <Button
              size="icon-sm"
              variant="ghost"
              className="text-destructive hover:bg-destructive/10 hover:text-destructive"
              onClick={() => actions.askDelete(session)}
              aria-label={`حذف جلسة ${session.clientName}`}
            >
              <Trash2 />
            </Button>
          </div>
        </div>
      </div>
    </article>
  )
}
