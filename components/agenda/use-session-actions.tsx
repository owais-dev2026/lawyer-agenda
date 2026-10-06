'use client'

import { useState } from 'react'
import { agenda } from '@/lib/agenda/store'
import { addDays, todayISO } from '@/lib/agenda/dates'
import type { CourtSession, SessionInput } from '@/lib/agenda/types'
import { ConfirmDialog, Modal } from './modal'
import { SessionForm } from './session-form'

type FormState =
  | { mode: 'new'; defaults?: Partial<SessionInput>; title: string }
  | { mode: 'edit'; session: CourtSession }

export interface SessionActions {
  openNew: (defaults?: Partial<SessionInput>) => void
  openEdit: (session: CourtSession) => void
  openNext: (session: CourtSession) => void
  askDelete: (session: CourtSession) => void
}

export function useSessionActions() {
  const [form, setForm] = useState<FormState | null>(null)
  const [toDelete, setToDelete] = useState<CourtSession | null>(null)

  const actions: SessionActions = {
    openNew: (defaults) => setForm({ mode: 'new', defaults, title: 'جلسة جديدة' }),
    openEdit: (session) => setForm({ mode: 'edit', session }),
    openNext: (session) =>
      setForm({
        mode: 'new',
        title: 'تحديد الجلسة التالية',
        defaults: {
          clientName: session.clientName,
          caseNumber: session.caseNumber,
          court: session.court,
          time: session.time,
          date: addDays(session.date > todayISO() ? session.date : todayISO(), 7),
        },
      }),
    askDelete: (session) => setToDelete(session),
  }

  const close = () => setForm(null)

  const modals = (
    <>
      <Modal
        open={form !== null}
        onClose={close}
        title={form?.mode === 'edit' ? 'تعديل الجلسة' : (form?.title ?? '')}
        description={form?.mode === 'edit' ? form.session.clientName : 'أدخل تفاصيل جلسة المحكمة'}
      >
        {form && (
          <SessionForm
            session={form.mode === 'edit' ? form.session : null}
            defaults={form.mode === 'new' ? form.defaults : undefined}
            onDone={close}
          />
        )}
      </Modal>
      <ConfirmDialog
        open={toDelete !== null}
        title="حذف الجلسة"
        message={`هل أنت متأكد من حذف جلسة الموكل "${toDelete?.clientName ?? ''}"؟ لا يمكن التراجع عن هذا الإجراء.`}
        onConfirm={() => toDelete && agenda.deleteSession(toDelete.id)}
        onClose={() => setToDelete(null)}
      />
    </>
  )

  return { actions, modals }
}
