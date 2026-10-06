'use client'

import { useId, useState } from 'react'
import { CheckCircle2, Clock } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { agenda, useAgenda } from '@/lib/agenda/store'
import { todayISO } from '@/lib/agenda/dates'
import type { CourtSession, SessionInput, SessionStatus } from '@/lib/agenda/types'
import { cn } from '@/lib/utils'

export const fieldClass = 'h-11 rounded-lg bg-card text-base md:text-sm'

interface SessionFormProps {
  session?: CourtSession | null
  defaults?: Partial<SessionInput>
  onDone: () => void
}

export function SessionForm({ session, defaults, onDone }: SessionFormProps) {
  const { clients } = useAgenda()
  const listId = useId()
  const [values, setValues] = useState<SessionInput>(() => ({
    clientName: session?.clientName ?? defaults?.clientName ?? '',
    caseNumber: session?.caseNumber ?? defaults?.caseNumber ?? '',
    court: session?.court ?? defaults?.court ?? '',
    date: session?.date ?? defaults?.date ?? todayISO(),
    time: session?.time ?? defaults?.time ?? '09:00',
    notes: session?.notes ?? defaults?.notes ?? '',
    status: session?.status ?? defaults?.status ?? 'pending',
  }))
  const [saveClient, setSaveClient] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const set = <K extends keyof SessionInput>(key: K, value: SessionInput[K]) =>
    setValues((v) => ({ ...v, [key]: value }))

  const trimmedName = values.clientName.trim()
  const isNewClient = trimmedName.length > 0 && !clients.some((c) => c.name === trimmedName)

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!trimmedName) return setError('يرجى إدخال اسم الموكل')
    if (!values.date) return setError('يرجى تحديد تاريخ الجلسة')
    const payload: SessionInput = {
      ...values,
      clientName: trimmedName,
      caseNumber: values.caseNumber.trim(),
      court: values.court.trim(),
      notes: values.notes.trim(),
    }
    if (session) agenda.updateSession(session.id, payload)
    else agenda.addSession(payload)
    if (isNewClient && saveClient) agenda.addClient({ name: trimmedName, phone: '', notes: '' })
    onDone()
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-4" noValidate>
      <div className="flex flex-col gap-2">
        <Label htmlFor="s-client">اسم الموكل *</Label>
        <Input
          id="s-client"
          list={listId}
          value={values.clientName}
          onChange={(e) => set('clientName', e.target.value)}
          placeholder="مثال: أحمد محمد"
          className={fieldClass}
          autoComplete="off"
          required
        />
        <datalist id={listId}>
          {clients.map((c) => (
            <option key={c.id} value={c.name} />
          ))}
        </datalist>
        {isNewClient && (
          <label className="flex items-center gap-2 text-sm text-muted-foreground">
            <input
              type="checkbox"
              checked={saveClient}
              onChange={(e) => setSaveClient(e.target.checked)}
              className="size-4 accent-primary"
            />
            إضافة الموكل إلى قائمة الموكلين
          </label>
        )}
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div className="flex flex-col gap-2">
          <Label htmlFor="s-case">رقم القضية</Label>
          <Input
            id="s-case"
            value={values.caseNumber}
            onChange={(e) => set('caseNumber', e.target.value)}
            placeholder="1234 / 2026"
            className={fieldClass}
          />
        </div>
        <div className="flex flex-col gap-2">
          <Label htmlFor="s-court">المحكمة / المكان</Label>
          <Input
            id="s-court"
            value={values.court}
            onChange={(e) => set('court', e.target.value)}
            placeholder="محكمة الاستئناف"
            className={fieldClass}
          />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div className="flex flex-col gap-2">
          <Label htmlFor="s-date">التاريخ *</Label>
          <Input
            id="s-date"
            type="date"
            value={values.date}
            onChange={(e) => set('date', e.target.value)}
            className={fieldClass}
            required
          />
        </div>
        <div className="flex flex-col gap-2">
          <Label htmlFor="s-time">الوقت</Label>
          <Input
            id="s-time"
            type="time"
            value={values.time}
            onChange={(e) => set('time', e.target.value)}
            className={fieldClass}
          />
        </div>
      </div>

      <fieldset className="flex flex-col gap-2">
        <legend className="mb-2 text-sm font-medium">الحالة</legend>
        <div className="grid grid-cols-2 gap-2">
          {(
            [
              { value: 'pending', label: 'قيد الانتظار', icon: Clock },
              { value: 'completed', label: 'منتهية', icon: CheckCircle2 },
            ] as { value: SessionStatus; label: string; icon: typeof Clock }[]
          ).map((opt) => (
            <button
              type="button"
              key={opt.value}
              onClick={() => set('status', opt.value)}
              aria-pressed={values.status === opt.value}
              className={cn(
                'flex h-11 items-center justify-center gap-2 rounded-lg border text-sm font-medium transition-colors',
                values.status === opt.value
                  ? opt.value === 'completed'
                    ? 'border-success bg-success/10 text-success'
                    : 'border-accent bg-accent/15 text-accent-foreground'
                  : 'border-input bg-card text-muted-foreground hover:bg-muted',
              )}
            >
              <opt.icon className="size-4" />
              {opt.label}
            </button>
          ))}
        </div>
      </fieldset>

      <div className="flex flex-col gap-2">
        <Label htmlFor="s-notes">ملاحظات</Label>
        <Textarea
          id="s-notes"
          value={values.notes}
          onChange={(e) => set('notes', e.target.value)}
          placeholder="طلبات الجلسة، المستندات المطلوبة، قرار التأجيل..."
          rows={3}
          className="rounded-lg bg-card text-base md:text-sm"
        />
      </div>

      {error && (
        <p role="alert" className="text-sm font-medium text-destructive">
          {error}
        </p>
      )}

      <div className="flex gap-3 pt-1">
        <Button type="submit" className="h-11 flex-1 text-base">
          {session ? 'حفظ التعديلات' : 'إضافة الجلسة'}
        </Button>
        <Button type="button" variant="outline" className="h-11 px-6" onClick={onDone}>
          إلغاء
        </Button>
      </div>
    </form>
  )
}
