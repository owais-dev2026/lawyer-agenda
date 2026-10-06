'use client'

import { useRef, useState } from 'react'
import { FileSpreadsheet, FileText, HardDrive, ShieldCheck, Trash2, Upload, WifiOff } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { agenda, normalizeData, useAgenda } from '@/lib/agenda/store'
import { exportBackup, exportClientsCSV, exportSessionsCSV } from '@/lib/agenda/export'
import type { AgendaData } from '@/lib/agenda/types'
import { ConfirmDialog, Modal } from './modal'
import { PageHeader, SectionTitle } from './page-header'
import { SecuritySettings } from './security-settings'

export function BackupView() {
  const data = useAgenda()
  const fileRef = useRef<HTMLInputElement>(null)
  const [pending, setPending] = useState<AgendaData | null>(null)
  const [message, setMessage] = useState<{ type: 'ok' | 'error'; text: string } | null>(null)
  const [confirmClear, setConfirmClear] = useState(false)

  const size = new Blob([JSON.stringify(data)]).size
  const sizeLabel = size < 1024 ? `${size} بايت` : `${(size / 1024).toFixed(1)} كيلوبايت`

  async function handleFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    e.target.value = ''
    if (!file) return
    try {
      const parsed = normalizeData(JSON.parse(await file.text()))
      setPending(parsed)
      setMessage(null)
    } catch {
      setMessage({ type: 'error', text: 'الملف غير صالح. يرجى اختيار ملف نسخة احتياطية بصيغة JSON صادر من التطبيق.' })
    }
  }

  function applyImport(mode: 'replace' | 'merge') {
    if (!pending) return
    if (mode === 'replace') agenda.replaceAll(pending)
    else agenda.mergeAll(pending)
    setMessage({
      type: 'ok',
      text: `تم استيراد ${pending.sessions.length} جلسة و${pending.clients.length} موكل بنجاح.`,
    })
    setPending(null)
  }

  const exports = [
    {
      title: 'نسخة احتياطية كاملة',
      desc: 'يحفظ ملف للاستعادة + يفتح نسخة للقراءة يمكن حفظها كـ PDF على الهاتف.',
      icon: FileText,
      onClick: () => exportBackup(data),
      primary: true,
    },
    {
      title: 'تصدير الجلسات (CSV)',
      desc: 'جدول يفتح في Excel أو Google Sheets.',
      icon: FileSpreadsheet,
      onClick: () => exportSessionsCSV(data),
    },
    {
      title: 'تصدير الموكلين (CSV)',
      desc: 'قائمة الموكلين وأرقام هواتفهم.',
      icon: FileSpreadsheet,
      onClick: () => exportClientsCSV(data),
    },
  ]

  return (
    <div className="flex flex-col gap-6">
      <PageHeader title="الإعدادات والبيانات" subtitle="الأمان والنسخ الاحتياطي · بياناتك محفوظة على هذا الجهاز فقط" />

      <section className="grid gap-3 rounded-2xl bg-primary p-5 text-primary-foreground sm:grid-cols-3">
        <div className="flex items-center gap-3">
          <HardDrive className="size-5 text-accent" aria-hidden="true" />
          <div>
            <p className="text-xs text-primary-foreground/70">حجم البيانات</p>
            <p className="font-semibold">{sizeLabel}</p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <ShieldCheck className="size-5 text-accent" aria-hidden="true" />
          <div>
            <p className="text-xs text-primary-foreground/70">السجلات</p>
            <p className="font-semibold">
              {data.sessions.length} جلسة · {data.clients.length} موكل
            </p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <WifiOff className="size-5 text-accent" aria-hidden="true" />
          <div>
            <p className="text-xs text-primary-foreground/70">وضع العمل</p>
            <p className="font-semibold">يعمل دون إنترنت</p>
          </div>
        </div>
      </section>

      <p className="rounded-xl border border-accent/40 bg-accent/10 p-4 text-sm leading-relaxed text-accent-foreground">
        عند طلب النسخة الاحتياطية يُحفظ ملف للاستعادة وتُفتح نسخة للقراءة — على الهاتف اختر طباعة ثم «حفظ كـ PDF».
        صدّر دورياً قبل مسح بيانات المتصفح أو تغيير الجهاز.
      </p>

      <SecuritySettings />

      <section>
        <SectionTitle>التصدير</SectionTitle>
        <div className="grid gap-3 md:grid-cols-3">
          {exports.map((x) => (
            <button
              key={x.title}
              type="button"
              onClick={x.onClick}
              className="flex items-start gap-3 rounded-xl border bg-card p-4 text-right shadow-sm transition-colors hover:border-accent hover:bg-accent/5"
            >
              <span
                className={
                  x.primary
                    ? 'flex size-10 shrink-0 items-center justify-center rounded-lg bg-primary text-accent'
                    : 'flex size-10 shrink-0 items-center justify-center rounded-lg bg-secondary text-primary'
                }
              >
                <x.icon className="size-5" aria-hidden="true" />
              </span>
              <span>
                <span className="block font-semibold">{x.title}</span>
                <span className="mt-0.5 block text-sm text-muted-foreground">{x.desc}</span>
              </span>
            </button>
          ))}
        </div>
      </section>

      <section>
        <SectionTitle>الاستيراد</SectionTitle>
        <div className="rounded-xl border bg-card p-4 shadow-sm">
          <p className="text-sm text-muted-foreground">استعادة البيانات من ملف نسخة احتياطية (JSON).</p>
          <input ref={fileRef} type="file" accept="application/json,.json" className="sr-only" onChange={handleFile} aria-label="اختيار ملف النسخة الاحتياطية" />
          <Button variant="outline" className="mt-3 h-10 gap-2" onClick={() => fileRef.current?.click()}>
            <Upload />
            اختيار ملف
          </Button>
          {message && (
            <p
              role="status"
              className={
                message.type === 'ok' ? 'mt-3 text-sm font-medium text-success' : 'mt-3 text-sm font-medium text-destructive'
              }
            >
              {message.text}
            </p>
          )}
        </div>
      </section>

      <section>
        <SectionTitle>منطقة الخطر</SectionTitle>
        <div className="flex flex-col items-start gap-3 rounded-xl border border-destructive/30 bg-card p-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="font-semibold">حذف جميع البيانات</p>
            <p className="text-sm text-muted-foreground">سيتم حذف كل الجلسات والموكلين من هذا الجهاز نهائياً.</p>
          </div>
          <Button variant="destructive" className="h-10 gap-2" onClick={() => setConfirmClear(true)}>
            <Trash2 />
            حذف الكل
          </Button>
        </div>
      </section>

      <Modal open={pending !== null} onClose={() => setPending(null)} title="استيراد البيانات">
        <p className="leading-relaxed">
          يحتوي الملف على <strong>{pending?.sessions.length}</strong> جلسة و<strong>{pending?.clients.length}</strong>{' '}
          موكل. كيف تريد الاستيراد؟
        </p>
        <div className="mt-5 flex flex-col gap-2">
          <Button className="h-11" onClick={() => applyImport('merge')}>
            دمج مع البيانات الحالية
          </Button>
          <Button variant="outline" className="h-11 border-destructive/40 text-destructive" onClick={() => applyImport('replace')}>
            استبدال جميع البيانات الحالية
          </Button>
          <Button variant="ghost" className="h-11" onClick={() => setPending(null)}>
            إلغاء
          </Button>
        </div>
      </Modal>

      <ConfirmDialog
        open={confirmClear}
        title="حذف جميع البيانات"
        message="هل أنت متأكد؟ سيتم حذف جميع الجلسات والموكلين ولا يمكن التراجع. ننصح بتصدير نسخة احتياطية أولاً."
        confirmLabel="نعم، احذف الكل"
        onConfirm={() => agenda.clearAll()}
        onClose={() => setConfirmClear(false)}
      />
    </div>
  )
}
