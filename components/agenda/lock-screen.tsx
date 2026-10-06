'use client'

import Image from 'next/image'
import { useState } from 'react'
import { ArrowRight, Eye, EyeOff, KeyRound, Loader2, LockKeyhole, ShieldQuestion } from 'lucide-react'
import { Button } from '@/components/ui/button'
import {
  ANSWER_MIN_LENGTH,
  lock,
  normalizeAnswer,
  RECOVERY_QUESTIONS,
  SECRET_MIN_LENGTH,
  useRecoveryQuestion,
} from '@/lib/agenda/lock'
import { ConfirmDialog } from './modal'

const MAX_ATTEMPTS = 5
const COOLDOWN_SECONDS = 30

export function SecretInput({
  id,
  label,
  value,
  onChange,
  autoFocus,
  autoComplete = 'current-password',
}: {
  id: string
  label: string
  value: string
  onChange: (v: string) => void
  autoFocus?: boolean
  autoComplete?: string
}) {
  const [visible, setVisible] = useState(false)
  return (
    <div className="flex flex-col gap-1.5">
      <label htmlFor={id} className="text-sm font-medium">
        {label}
      </label>
      <div className="relative">
        <input
          id={id}
          type={visible ? 'text' : 'password'}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          autoFocus={autoFocus}
          autoComplete={autoComplete}
          dir="ltr"
          className="h-12 w-full rounded-xl border border-input bg-card px-4 pe-12 text-center text-lg tracking-[0.3em] outline-none transition-shadow focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/40"
        />
        <button
          type="button"
          onClick={() => setVisible((v) => !v)}
          className="absolute inset-y-0 end-0 flex w-12 items-center justify-center text-muted-foreground hover:text-foreground"
          aria-label={visible ? 'إخفاء كلمة السر' : 'إظهار كلمة السر'}
        >
          {visible ? <EyeOff className="size-5" aria-hidden="true" /> : <Eye className="size-5" aria-hidden="true" />}
        </button>
      </div>
    </div>
  )
}

const CUSTOM_QUESTION = '__custom__'

export function RecoveryFields({
  question,
  onQuestionChange,
  answer,
  onAnswerChange,
}: {
  question: string
  onQuestionChange: (q: string) => void
  answer: string
  onAnswerChange: (a: string) => void
}) {
  const isPreset = RECOVERY_QUESTIONS.includes(question)
  const [custom, setCustom] = useState(!isPreset && question !== '')
  const fieldClass =
    'h-11 w-full rounded-xl border border-input bg-card px-3 text-sm outline-none transition-shadow focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/40'

  return (
    <fieldset className="flex flex-col gap-3 rounded-xl border border-dashed border-border p-3">
      <legend className="flex items-center gap-1.5 px-1 text-sm font-semibold">
        <ShieldQuestion className="size-4 text-primary" aria-hidden="true" />
        سؤال الاسترداد
      </legend>
      <p className="text-xs leading-relaxed text-muted-foreground">
        إذا نسيت كلمة السر، تجيب على هذا السؤال لتعيين كلمة سر جديدة دون فقدان أي بيانات.
      </p>
      <div className="flex flex-col gap-1.5">
        <label htmlFor="recovery-question" className="text-sm font-medium">
          السؤال
        </label>
        <select
          id="recovery-question"
          value={custom ? CUSTOM_QUESTION : question}
          onChange={(e) => {
            if (e.target.value === CUSTOM_QUESTION) {
              setCustom(true)
              onQuestionChange('')
            } else {
              setCustom(false)
              onQuestionChange(e.target.value)
            }
          }}
          className={fieldClass}
        >
          {RECOVERY_QUESTIONS.map((q) => (
            <option key={q} value={q}>
              {q}
            </option>
          ))}
          <option value={CUSTOM_QUESTION}>سؤال من اختياري…</option>
        </select>
      </div>
      {custom && (
        <div className="flex flex-col gap-1.5">
          <label htmlFor="recovery-custom" className="text-sm font-medium">
            اكتب سؤالك
          </label>
          <input
            id="recovery-custom"
            value={question}
            onChange={(e) => onQuestionChange(e.target.value)}
            className={fieldClass}
          />
        </div>
      )}
      <div className="flex flex-col gap-1.5">
        <label htmlFor="recovery-answer" className="text-sm font-medium">
          الإجابة
        </label>
        <input
          id="recovery-answer"
          value={answer}
          onChange={(e) => onAnswerChange(e.target.value)}
          autoComplete="off"
          className={fieldClass}
        />
      </div>
    </fieldset>
  )
}

export function validateRecovery(question: string, answer: string) {
  if (question.trim().length < 3) return 'يرجى اختيار أو كتابة سؤال الاسترداد.'
  if (normalizeAnswer(answer).length < ANSWER_MIN_LENGTH) return 'يرجى كتابة إجابة سؤال الاسترداد.'
  return ''
}

function SetupForm() {
  const [secret, setSecret] = useState('')
  const [confirm, setConfirm] = useState('')
  const [question, setQuestion] = useState(RECOVERY_QUESTIONS[0])
  const [answer, setAnswer] = useState('')
  const [error, setError] = useState('')
  const [busy, setBusy] = useState(false)

  async function submit(e: React.FormEvent) {
    e.preventDefault()
    if (secret.length < SECRET_MIN_LENGTH) return setError(`يجب ألا تقل كلمة السر عن ${SECRET_MIN_LENGTH} خانات.`)
    if (secret !== confirm) return setError('كلمتا السر غير متطابقتين.')
    const recoveryError = validateRecovery(question, answer)
    if (recoveryError) return setError(recoveryError)
    setBusy(true)
    await lock.setRecovery(question, answer)
    await lock.setSecret(secret)
  }

  return (
    <form onSubmit={submit} className="flex flex-col gap-4">
      <div className="text-center">
        <h1 className="font-serif text-2xl font-bold">تعيين رمز الحماية</h1>
        <p className="mt-1 text-sm leading-relaxed text-muted-foreground">
          اختر رمز PIN أو كلمة سر لحماية بيانات موكليك. سيُطلب منك عند كل فتح للتطبيق.
        </p>
      </div>
      <SecretInput id="new-secret" label="كلمة السر الجديدة" value={secret} onChange={setSecret} autoFocus autoComplete="new-password" />
      <SecretInput id="confirm-secret" label="تأكيد كلمة السر" value={confirm} onChange={setConfirm} autoComplete="new-password" />
      <RecoveryFields question={question} onQuestionChange={setQuestion} answer={answer} onAnswerChange={setAnswer} />
      {error && (
        <p role="alert" className="text-sm font-medium text-destructive">
          {error}
        </p>
      )}
      <Button type="submit" className="h-12 gap-2 text-base" disabled={busy}>
        {busy ? <Loader2 className="animate-spin" /> : <KeyRound />}
        حفظ والدخول
      </Button>
    </form>
  )
}

function useAttemptLimiter(wrongMessage: string) {
  const [attempts, setAttempts] = useState(0)
  const [lockedUntil, setLockedUntil] = useState(0)

  return {
    cooldownError() {
      const remaining = Math.ceil((lockedUntil - Date.now()) / 1000)
      return remaining > 0 ? `محاولات كثيرة. حاول بعد ${remaining} ثانية.` : ''
    },
    fail() {
      const next = attempts + 1
      if (next >= MAX_ATTEMPTS) {
        setAttempts(0)
        setLockedUntil(Date.now() + COOLDOWN_SECONDS * 1000)
        return `محاولات كثيرة خاطئة. تم إيقاف الإدخال لمدة ${COOLDOWN_SECONDS} ثانية.`
      }
      setAttempts(next)
      return `${wrongMessage} المحاولات المتبقية: ${MAX_ATTEMPTS - next}`
    },
  }
}

function RecoverForm({ question, onBack }: { question: string; onBack: () => void }) {
  const [answer, setAnswer] = useState('')
  const [secret, setSecret] = useState('')
  const [confirm, setConfirm] = useState('')
  const [error, setError] = useState('')
  const [busy, setBusy] = useState(false)
  const limiter = useAttemptLimiter('الإجابة غير صحيحة.')

  async function submit(e: React.FormEvent) {
    e.preventDefault()
    if (busy) return
    const cooldown = limiter.cooldownError()
    if (cooldown) return setError(cooldown)
    if (!answer.trim()) return setError('يرجى كتابة الإجابة.')
    if (secret.length < SECRET_MIN_LENGTH) return setError(`يجب ألا تقل كلمة السر عن ${SECRET_MIN_LENGTH} خانات.`)
    if (secret !== confirm) return setError('كلمتا السر غير متطابقتين.')
    setBusy(true)
    const ok = await lock.resetWithRecovery(answer, secret)
    setBusy(false)
    if (!ok) {
      setAnswer('')
      setError(limiter.fail())
    }
  }

  return (
    <form onSubmit={submit} className="flex flex-col gap-4">
      <div className="text-center">
        <h1 className="font-serif text-2xl font-bold">استرداد كلمة السر</h1>
        <p className="mt-1 text-sm leading-relaxed text-muted-foreground">
          أجب عن سؤال الاسترداد ثم اختر كلمة سر جديدة. بياناتك تبقى كما هي.
        </p>
      </div>
      <div className="rounded-xl bg-secondary p-3 text-sm font-medium text-secondary-foreground">{question}</div>
      <div className="flex flex-col gap-1.5">
        <label htmlFor="recover-answer" className="text-sm font-medium">
          إجابتك
        </label>
        <input
          id="recover-answer"
          value={answer}
          onChange={(e) => setAnswer(e.target.value)}
          autoFocus
          autoComplete="off"
          className="h-11 w-full rounded-xl border border-input bg-card px-3 text-sm outline-none transition-shadow focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/40"
        />
      </div>
      <SecretInput id="recover-secret" label="كلمة السر الجديدة" value={secret} onChange={setSecret} autoComplete="new-password" />
      <SecretInput id="recover-confirm" label="تأكيد كلمة السر الجديدة" value={confirm} onChange={setConfirm} autoComplete="new-password" />
      {error && (
        <p role="alert" className="text-sm font-medium text-destructive">
          {error}
        </p>
      )}
      <Button type="submit" className="h-12 gap-2 text-base" disabled={busy}>
        {busy ? <Loader2 className="animate-spin" /> : <KeyRound />}
        تعيين كلمة السر والدخول
      </Button>
      <button type="button" onClick={onBack} className="inline-flex items-center justify-center gap-1 text-sm text-muted-foreground hover:text-foreground">
        <ArrowRight className="size-4" aria-hidden="true" />
        رجوع لشاشة القفل
      </button>
    </form>
  )
}

function UnlockForm() {
  const [secret, setSecret] = useState('')
  const [error, setError] = useState('')
  const [busy, setBusy] = useState(false)
  const [recovering, setRecovering] = useState(false)
  const [noRecovery, setNoRecovery] = useState(false)
  const [confirmReset, setConfirmReset] = useState(false)
  const recoveryQuestion = useRecoveryQuestion()
  const limiter = useAttemptLimiter('كلمة السر غير صحيحة.')

  async function submit(e: React.FormEvent) {
    e.preventDefault()
    if (!secret || busy) return
    const cooldown = limiter.cooldownError()
    if (cooldown) return setError(cooldown)
    setBusy(true)
    const ok = await lock.unlock(secret)
    setBusy(false)
    if (ok) return
    setSecret('')
    setError(limiter.fail())
  }

  if (recovering && recoveryQuestion) {
    return <RecoverForm question={recoveryQuestion} onBack={() => setRecovering(false)} />
  }

  return (
    <>
      <form onSubmit={submit} className="flex flex-col gap-4">
        <div className="text-center">
          <h1 className="font-serif text-2xl font-bold">التطبيق مقفل</h1>
          <p className="mt-1 text-sm text-muted-foreground">أدخل رمز الحماية للمتابعة</p>
        </div>
        <SecretInput id="unlock-secret" label="كلمة السر" value={secret} onChange={setSecret} autoFocus />
        {error && (
          <p role="alert" className="text-sm font-medium text-destructive">
            {error}
          </p>
        )}
        <Button type="submit" className="h-12 gap-2 text-base" disabled={busy || !secret}>
          {busy ? <Loader2 className="animate-spin" /> : <LockKeyhole />}
          فتح التطبيق
        </Button>
        <button
          type="button"
          onClick={() => (recoveryQuestion ? setRecovering(true) : setNoRecovery(true))}
          className="text-sm text-muted-foreground underline-offset-4 hover:text-foreground hover:underline"
        >
          نسيت كلمة السر؟
        </button>
        {noRecovery && (
          <div role="alert" className="flex flex-col gap-2 rounded-xl bg-secondary p-3 text-sm leading-relaxed text-secondary-foreground">
            <p>
              لم يتم إعداد سؤال استرداد لهذا الجهاز بعد، لذلك لا يمكن تغيير كلمة السر بدون الكلمة الحالية. بعد الدخول، أضف سؤال الاسترداد من صفحة الإعدادات.
            </p>
            <button
              type="button"
              onClick={() => setConfirmReset(true)}
              className="self-start text-xs text-muted-foreground underline underline-offset-4 hover:text-destructive"
            >
              حل أخير: إعادة ضبط التطبيق بالكامل
            </button>
          </div>
        )}
      </form>
      <ConfirmDialog
        open={confirmReset}
        title="إعادة ضبط التطبيق"
        message="هذا الخيار الأخير فقط عند عدم وجود سؤال استرداد. سيتم حذف كلمة السر وجميع الجلسات والموكلين من هذا الجهاز نهائياً، ويمكنك بعدها استعادة بياناتك من ملف نسخة احتياطية."
        confirmLabel="حذف كل شيء وإعادة الضبط"
        onConfirm={() => lock.resetAll()}
        onClose={() => setConfirmReset(false)}
      />
    </>
  )
}

export function LockScreen({ mode }: { mode: 'setup' | 'locked' }) {
  return (
    <main className="flex min-h-dvh flex-col items-center justify-center bg-sidebar px-4 py-10">
      <div className="mb-6 flex flex-col items-center gap-3 text-sidebar-foreground">
        <Image src="/app-icon.png" alt="" width={72} height={72} className="rounded-2xl ring-2 ring-sidebar-primary/50" priority />
        <p className="font-serif text-2xl font-bold">أجندة المحامي</p>
      </div>
      <div className="w-full max-w-sm rounded-2xl bg-background p-5 shadow-2xl sm:p-6">
        {mode === 'setup' ? <SetupForm /> : <UnlockForm />}
      </div>
      <p className="mt-6 max-w-sm text-center text-xs leading-relaxed text-sidebar-foreground/60">
        كلمة السر محفوظة بشكل مشفّر (Hash) على هذا الجهاز فقط ولا تُرسل إلى أي خادم.
      </p>
    </main>
  )
}
