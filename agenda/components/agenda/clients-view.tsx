'use client'

import { useDeferredValue, useState } from 'react'
import { CalendarClock, Pencil, Phone, Plus, Search, Trash2, UserPlus, Users } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { agenda, sortSessions, useAgenda } from '@/lib/agenda/store'
import { formatShortDate, todayISO } from '@/lib/agenda/dates'
import type { Client } from '@/lib/agenda/types'
import { ConfirmDialog, Modal } from './modal'
import { EmptyState, PageHeader } from './page-header'
import { fieldClass } from './session-form'

function ClientForm({ client, onDone }: { client: Client | null; onDone: () => void }) {
  const { clients } = useAgenda()
  const [name, setName] = useState(client?.name ?? '')
  const [phone, setPhone] = useState(client?.phone ?? '')
  const [notes, setNotes] = useState(client?.notes ?? '')
  const [error, setError] = useState<string | null>(null)

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    const trimmed = name.trim()
    if (!trimmed) return setError('يرجى إدخال اسم الموكل')
    if (clients.some((c) => c.name === trimmed && c.id !== client?.id)) {
      return setError('يوجد موكل مسجل بنفس الاسم')
    }
    const payload = { name: trimmed, phone: phone.trim(), notes: notes.trim() }
    if (client) agenda.updateClient(client.id, payload)
    else agenda.addClient(payload)
    onDone()
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-4" noValidate>
      <div className="flex flex-col gap-2">
        <Label htmlFor="c-name">اسم الموكل *</Label>
        <Input id="c-name" value={name} onChange={(e) => setName(e.target.value)} className={fieldClass} required />
      </div>
      <div className="flex flex-col gap-2">
        <Label htmlFor="c-phone">رقم الهاتف</Label>
        <Input
          id="c-phone"
          type="tel"
          inputMode="tel"
          dir="ltr"
          value={phone}
          onChange={(e) => setPhone(e.target.value)}
          placeholder="+20 100 000 0000"
          className={`${fieldClass} text-right`}
        />
      </div>
      <div className="flex flex-col gap-2">
        <Label htmlFor="c-notes">ملاحظات</Label>
        <Textarea
          id="c-notes"
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          rows={3}
          placeholder="العنوان، الرقم القومي، نوع التوكيل..."
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
          {client ? 'حفظ التعديلات' : 'إضافة الموكل'}
        </Button>
        <Button type="button" variant="outline" className="h-11 px-6" onClick={onDone}>
          إلغاء
        </Button>
      </div>
    </form>
  )
}

export function ClientsView() {
  const { clients, sessions } = useAgenda()
  const [query, setQuery] = useState('')
  const deferred = useDeferredValue(query.trim().toLowerCase())
  const [editing, setEditing] = useState<Client | null | 'new'>(null)
  const [toDelete, setToDelete] = useState<Client | null>(null)
  const today = todayISO()

  const filtered = clients
    .filter(
      (c) =>
        !deferred ||
        c.name.toLowerCase().includes(deferred) ||
        c.phone.includes(deferred) ||
        c.notes.toLowerCase().includes(deferred),
    )
    .sort((a, b) => a.name.localeCompare(b.name, 'ar'))

  return (
    <div>
      <PageHeader
        title="إدارة الموكلين"
        subtitle={`${clients.length} موكل مسجل`}
        action={
          <Button onClick={() => setEditing('new')} className="h-10 gap-1.5 px-4">
            <UserPlus />
            <span>موكل جديد</span>
          </Button>
        }
      />

      <div className="relative mb-4">
        <Search
          className="pointer-events-none absolute right-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground"
          aria-hidden="true"
        />
        <Input
          type="search"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="ابحث بالاسم أو رقم الهاتف..."
          aria-label="بحث في الموكلين"
          className="h-11 rounded-lg bg-card pr-9 text-base md:text-sm"
        />
      </div>

      {filtered.length === 0 ? (
        <EmptyState
          icon={Users}
          title={clients.length === 0 ? 'لا يوجد موكلون بعد' : 'لا توجد نتائج مطابقة'}
          description={clients.length === 0 ? 'أضف موكليك لتسهيل ربطهم بالجلسات.' : undefined}
          action={
            clients.length === 0 && (
              <Button onClick={() => setEditing('new')} className="h-10 gap-1.5">
                <Plus />
                إضافة موكل
              </Button>
            )
          }
        />
      ) : (
        <ul className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
          {filtered.map((c) => {
            const own = sessions.filter((s) => s.clientName === c.name)
            const next = sortSessions(own.filter((s) => s.date >= today && s.status === 'pending'))[0]
            const cases = new Set(own.map((s) => s.caseNumber).filter(Boolean)).size
            return (
              <li key={c.id} className="flex flex-col rounded-xl border bg-card p-4 shadow-sm">
                <div className="flex items-start gap-3">
                  <div
                    className="flex size-11 shrink-0 items-center justify-center rounded-full bg-primary font-serif text-lg font-bold text-accent"
                    aria-hidden="true"
                  >
                    {c.name.trim().charAt(0)}
                  </div>
                  <div className="min-w-0 flex-1">
                    <h3 className="truncate font-semibold">{c.name}</h3>
                    {c.phone ? (
                      <a
                        href={`tel:${c.phone.replace(/\s/g, '')}`}
                        className="mt-0.5 inline-flex items-center gap-1.5 text-sm text-primary hover:underline"
                      >
                        <Phone className="size-3.5" aria-hidden="true" />
                        <span dir="ltr">{c.phone}</span>
                      </a>
                    ) : (
                      <p className="mt-0.5 text-sm text-muted-foreground">لا يوجد رقم هاتف</p>
                    )}
                  </div>
                  <div className="flex gap-1">
                    <Button size="icon-sm" variant="ghost" onClick={() => setEditing(c)} aria-label={`تعديل ${c.name}`}>
                      <Pencil />
                    </Button>
                    <Button
                      size="icon-sm"
                      variant="ghost"
                      className="text-destructive hover:bg-destructive/10 hover:text-destructive"
                      onClick={() => setToDelete(c)}
                      aria-label={`حذف ${c.name}`}
                    >
                      <Trash2 />
                    </Button>
                  </div>
                </div>
                {c.notes && (
                  <p className="mt-3 line-clamp-2 text-sm leading-relaxed text-muted-foreground">{c.notes}</p>
                )}
                <div className="mt-auto flex flex-wrap items-center gap-2 pt-3 text-xs">
                  <span className="rounded-full bg-secondary px-2.5 py-1 text-secondary-foreground">
                    {own.length} جلسة
                  </span>
                  {cases > 0 && (
                    <span className="rounded-full bg-secondary px-2.5 py-1 text-secondary-foreground">
                      {cases} قضية
                    </span>
                  )}
                  {next && (
                    <span className="inline-flex items-center gap-1 rounded-full bg-accent/20 px-2.5 py-1 text-accent-foreground">
                      <CalendarClock className="size-3" aria-hidden="true" />
                      الجلسة القادمة: {formatShortDate(next.date)}
                    </span>
                  )}
                </div>
              </li>
            )
          })}
        </ul>
      )}

      <Modal
        open={editing !== null}
        onClose={() => setEditing(null)}
        title={editing === 'new' ? 'موكل جديد' : 'تعديل بيانات الموكل'}
      >
        {editing !== null && <ClientForm client={editing === 'new' ? null : editing} onDone={() => setEditing(null)} />}
      </Modal>
      <ConfirmDialog
        open={toDelete !== null}
        title="حذف الموكل"
        message={`هل تريد حذف "${toDelete?.name ?? ''}" من قائمة الموكلين؟ لن يتم حذف الجلسات المرتبطة به.`}
        onConfirm={() => toDelete && agenda.deleteClient(toDelete.id)}
        onClose={() => setToDelete(null)}
      />
    </div>
  )
}
