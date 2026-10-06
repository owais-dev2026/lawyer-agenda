'use client'

import { useSyncExternalStore } from 'react'

const LOCK_KEY = 'lawyer-agenda:lock'
const UNLOCKED_KEY = 'lawyer-agenda:unlocked'
const RECOVERY_KEY = 'lawyer-agenda:recovery'
const ITERATIONS = 150_000

type LockRecord = { salt: string; hash: string; iterations: number }
type RecoveryRecord = LockRecord & { question: string }
export type LockStatus = 'loading' | 'setup' | 'locked' | 'unlocked'

export const RECOVERY_QUESTIONS = [
  'ما اسم أول مدرسة درست فيها؟',
  'ما اسم مدينة ولادة والدتك؟',
  'ما اسم أعز صديق في طفولتك؟',
  'ما اسم أول قضية ترافعت فيها؟',
  'ما اسم الجامعة التي تخرجت منها؟',
]

const listeners = new Set<() => void>()
let unlocked = false
let hasLock: boolean | null = null
let recoveryQuestion: string | null | undefined

function emit() {
  listeners.forEach((l) => l())
}

function readRecord(): LockRecord | null {
  try {
    const raw = localStorage.getItem(LOCK_KEY)
    if (!raw) return null
    const parsed = JSON.parse(raw) as LockRecord
    return parsed?.salt && parsed?.hash ? parsed : null
  } catch {
    return null
  }
}

function toB64(bytes: Uint8Array) {
  return btoa(String.fromCharCode(...bytes))
}

function fromB64(b64: string) {
  return Uint8Array.from(atob(b64), (c) => c.charCodeAt(0))
}

async function derive(secret: string, salt: Uint8Array, iterations: number) {
  const key = await crypto.subtle.importKey('raw', new TextEncoder().encode(secret), 'PBKDF2', false, ['deriveBits'])
  const bits = await crypto.subtle.deriveBits(
    { name: 'PBKDF2', hash: 'SHA-256', salt: salt as BufferSource, iterations },
    key,
    256,
  )
  return toB64(new Uint8Array(bits))
}

function timingSafeEqual(a: string, b: string) {
  if (a.length !== b.length) return false
  let diff = 0
  for (let i = 0; i < a.length; i++) diff |= a.charCodeAt(i) ^ b.charCodeAt(i)
  return diff === 0
}

function getStatus(): LockStatus {
  if (hasLock === null) {
    hasLock = readRecord() !== null
    unlocked = sessionStorage.getItem(UNLOCKED_KEY) === '1'
  }
  if (!hasLock) return 'setup'
  return unlocked ? 'unlocked' : 'locked'
}

function markUnlocked() {
  unlocked = true
  sessionStorage.setItem(UNLOCKED_KEY, '1')
}

async function makeRecord(secret: string): Promise<LockRecord> {
  const salt = crypto.getRandomValues(new Uint8Array(16))
  const hash = await derive(secret, salt, ITERATIONS)
  return { salt: toB64(salt), hash, iterations: ITERATIONS }
}

async function matches(secret: string, record: LockRecord) {
  const hash = await derive(secret, fromB64(record.salt), record.iterations)
  return timingSafeEqual(hash, record.hash)
}

function readRecovery(): RecoveryRecord | null {
  try {
    const raw = localStorage.getItem(RECOVERY_KEY)
    if (!raw) return null
    const parsed = JSON.parse(raw) as RecoveryRecord
    return parsed?.question && parsed?.salt && parsed?.hash ? parsed : null
  } catch {
    return null
  }
}

// Answers are compared loosely so small spelling variations in Arabic still match.
export function normalizeAnswer(answer: string) {
  return answer
    .normalize('NFKC')
    .replace(/[\u064B-\u065F\u0670\u0640]/g, '')
    .replace(/[أإآٱ]/g, 'ا')
    .replace(/ة/g, 'ه')
    .replace(/ى/g, 'ي')
    .replace(/\s+/g, ' ')
    .trim()
    .toLowerCase()
}

export const lock = {
  async setSecret(secret: string) {
    localStorage.setItem(LOCK_KEY, JSON.stringify(await makeRecord(secret)))
    hasLock = true
    markUnlocked()
    emit()
  },
  async verify(secret: string) {
    const record = readRecord()
    return record ? matches(secret, record) : false
  },
  async setRecovery(question: string, answer: string) {
    const record: RecoveryRecord = { question: question.trim(), ...(await makeRecord(normalizeAnswer(answer))) }
    localStorage.setItem(RECOVERY_KEY, JSON.stringify(record))
    recoveryQuestion = record.question
    emit()
  },
  async resetWithRecovery(answer: string, newSecret: string) {
    const record = readRecovery()
    if (!record || !(await matches(normalizeAnswer(answer), record))) return false
    await lock.setSecret(newSecret)
    return true
  },
  async unlock(secret: string) {
    const ok = await lock.verify(secret)
    if (ok) {
      markUnlocked()
      emit()
    }
    return ok
  },
  lockNow() {
    unlocked = false
    sessionStorage.removeItem(UNLOCKED_KEY)
    emit()
  },
  resetAll() {
    localStorage.clear()
    sessionStorage.clear()
    window.location.reload()
  },
}

function subscribe(cb: () => void) {
  listeners.add(cb)
  const onStorage = (e: StorageEvent) => {
    if (e.key === LOCK_KEY || e.key === RECOVERY_KEY) {
      hasLock = readRecord() !== null
      recoveryQuestion = readRecovery()?.question ?? null
      cb()
    }
  }
  window.addEventListener('storage', onStorage)
  return () => {
    listeners.delete(cb)
    window.removeEventListener('storage', onStorage)
  }
}

export function useLockStatus(): LockStatus {
  return useSyncExternalStore(subscribe, getStatus, () => 'loading')
}

function getRecoveryQuestion() {
  if (recoveryQuestion === undefined) recoveryQuestion = readRecovery()?.question ?? null
  return recoveryQuestion
}

export function useRecoveryQuestion(): string | null {
  return useSyncExternalStore(subscribe, getRecoveryQuestion, () => null)
}

export const SECRET_MIN_LENGTH = 4
export const ANSWER_MIN_LENGTH = 2
