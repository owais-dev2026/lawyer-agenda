'use client'

import { useState } from 'react'
import { KeyRound, Loader2, LockKeyhole, ShieldQuestion, TriangleAlert } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { lock, RECOVERY_QUESTIONS, SECRET_MIN_LENGTH, useRecoveryQuestion } from '@/lib/agenda/lock'
import { RecoveryFields, SecretInput, validateRecovery } from './lock-screen'
import { Modal } from './modal'
import { SectionTitle } from './page-header'

function ChangeSecretForm({ onDone }: { onDone: () => void }) {
  const [current, setCurrent] = useState('')
  const [next, setNext] = useState('')
  const [confirm, setConfirm] = useState('')
  const [error, setError] = useState('')
  const [busy, setBusy] = useState(false)

  async function submit(e: React.FormEvent) {
    e.preventDefault()
    setError('')
    if (next.length < SECRET_MIN_LENGTH) return setError(`يجب ألا تقل كلمة السر الجديدة عن ${SECRET_MIN_LENGTH} خانات.`)
    if (next !== confirm) return setError('كلمتا السر الجديدتان غير متطابقتين.')
    setBusy(true)
    const ok = await lock.verify(current)
    if (!ok) {
      setBusy(false)
      return setError('كلمة السر الحالية غير صحيحة.')
    }
    await lock.setSecret(next)
    setBusy(false)
    onDone()
  }

  return (
    <form onSubmit={submit} className="flex flex-col gap-4">
      <SecretInput id="current-secret" label="كلمة السر الحالية" value={current} onChange={setCurrent} autoFocus />
      <SecretInput id="next-secret" label="كلمة السر الجديدة" value={next} onChange={setNext} autoComplete="new-password" />
      <SecretInput id="next-confirm" label="تأكيد كلمة السر الجديدة" value={confirm} onChange={setConfirm} autoComplete="new-password" />
      {error && (
        <p role="alert" className="text-sm font-medium text-destructive">
          {error}
        </p>
      )}
      <Button type="submit" className="h-11 gap-2" disabled={busy}>
        {busy ? <Loader2 className="animate-spin" /> : <KeyRound />}
        حفظ كلمة السر الجديدة
      </Button>
    </form>
  )
}

function RecoveryForm({ initialQuestion, onDone }: { initialQuestion: string; onDone: () => void }) {
  const [current, setCurrent] = useState('')
  const [question, setQuestion] = useState(initialQuestion)
  const [answer, setAnswer] = useState('')
  const [error, setError] = useState('')
  const [busy, setBusy] = useState(false)

  async function submit(e: React.FormEvent) {
    e.preventDefault()
    setError('')
    const recoveryError = validateRecovery(question, answer)
    if (recoveryError) return setError(recoveryError)
    setBusy(true)
    if (!(await lock.verify(current))) {
      setBusy(false)
      return setError('كلمة السر الحالية غير صحيحة.')
    }
    await lock.setRecovery(question, answer)
    setBusy(false)
    onDone()
  }

  return (
    <form onSubmit={submit} className="flex flex-col gap-4">
      <SecretInput id="recovery-current" label="كلمة السر الحالية" value={current} onChange={setCurrent} autoFocus />
      <RecoveryFields question={question} onQuestionChange={setQuestion} answer={answer} onAnswerChange={setAnswer} />
      {error && (
        <p role="alert" className="text-sm font-medium text-destructive">
          {error}
        </p>
      )}
      <Button type="submit" className="h-11 gap-2" disabled={busy}>
        {busy ? <Loader2 className="animate-spin" /> : <ShieldQuestion />}
        حفظ سؤال الاسترداد
      </Button>
    </form>
  )
}

function RecoverySettings() {
  const question = useRecoveryQuestion()
  const [open, setOpen] = useState(false)
  const [saved, setSaved] = useState(false)

  return (
    <div className="flex flex-col gap-4 rounded-xl border bg-card p-4 shadow-sm sm:flex-row sm:items-center sm:justify-between">
      <div className="flex min-w-0 items-start gap-3">
        <span className="flex size-10 shrink-0 items-center justify-center rounded-lg bg-primary text-accent">
          <ShieldQuestion className="size-5" aria-hidden="true" />
        </span>
        <div className="min-w-0">
          <p className="font-semibold">سؤال الاسترداد</p>
          {question ? (
            <p className="text-sm text-muted-foreground">
              يُستخدم لإعادة تعيين كلمة السر عند نسيانها دون حذف بياناتك.
              <span className="mt-1 block truncate font-medium text-foreground">{question}</span>
            </p>
          ) : (
            <p className="flex items-start gap-1 text-sm font-medium text-destructive">
              <TriangleAlert className="mt-0.5 size-4 shrink-0" aria-hidden="true" />
              غير مُعدّ. أضفه حتى تتمكن من استرداد كلمة السر إذا نسيتها.
            </p>
          )}
          {saved && (
            <p role="status" className="mt-1 text-sm font-medium text-success">
              تم حفظ سؤال الاسترداد.
            </p>
          )}
        </div>
      </div>
      <Button
        variant={question ? 'outline' : 'default'}
        className="h-10 gap-2"
        onClick={() => {
          setSaved(false)
          setOpen(true)
        }}
      >
        <ShieldQuestion />
        {question ? 'تغيير السؤال' : 'إعداد السؤال'}
      </Button>

      <Modal open={open} onClose={() => setOpen(false)} title="سؤال الاسترداد">
        <RecoveryForm
          initialQuestion={question ?? RECOVERY_QUESTIONS[0]}
          onDone={() => {
            setOpen(false)
            setSaved(true)
          }}
        />
      </Modal>
    </div>
  )
}

export function SecuritySettings() {
  const [open, setOpen] = useState(false)
  const [saved, setSaved] = useState(false)

  return (
    <section>
      <SectionTitle>الأمان</SectionTitle>
      <div className="flex flex-col gap-4 rounded-xl border bg-card p-4 shadow-sm sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-start gap-3">
          <span className="flex size-10 shrink-0 items-center justify-center rounded-lg bg-primary text-accent">
            <LockKeyhole className="size-5" aria-hidden="true" />
          </span>
          <div>
            <p className="font-semibold">رمز حماية التطبيق</p>
            <p className="text-sm text-muted-foreground">يُطلب عند كل فتح جديد للتطبيق.</p>
            {saved && (
              <p role="status" className="mt-1 text-sm font-medium text-success">
                تم تغيير كلمة السر بنجاح.
              </p>
            )}
          </div>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button
            variant="outline"
            className="h-10 gap-2"
            onClick={() => {
              setSaved(false)
              setOpen(true)
            }}
          >
            <KeyRound />
            تغيير كلمة السر
          </Button>
          <Button variant="secondary" className="h-10 gap-2" onClick={() => lock.lockNow()}>
            <LockKeyhole />
            قفل الآن
          </Button>
        </div>
      </div>

      <Modal open={open} onClose={() => setOpen(false)} title="تغيير كلمة السر">
        <ChangeSecretForm
          onDone={() => {
            setOpen(false)
            setSaved(true)
          }}
        />
      </Modal>
      <div className="mt-3">
        <RecoverySettings />
      </div>
    </section>
  )
}
