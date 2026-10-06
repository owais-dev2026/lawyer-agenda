'use client'

import { useSyncExternalStore } from 'react'
import type {
  AgendaData,
  Client,
  ClientInput,
  CourtSession,
  SessionInput,
} from './types'

const STORAGE_KEY = 'lawyer-agenda:v1'
const EMPTY: AgendaData = { version: 1, sessions: [], clients: [] }

let cache: AgendaData | null = null
const listeners = new Set<() => void>()

function createId() {
  if (typeof crypto !== 'undefined' && 'randomUUID' in crypto) return crypto.randomUUID()
  return `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 10)}`
}

const str = (v: unknown) => (typeof v === 'string' ? v : '')

export function normalizeData(input: unknown): AgendaData {
  if (!input || typeof input !== 'object') throw new Error('invalid')
  const raw = input as Record<string, unknown>
  if (!Array.isArray(raw.sessions) || !Array.isArray(raw.clients)) throw new Error('invalid')
  const now = new Date().toISOString()

  const sessions: CourtSession[] = raw.sessions
    .filter((s): s is Record<string, unknown> => !!s && typeof s === 'object')
    .map((s): CourtSession => ({
      id: str(s.id) || createId(),
      clientName: str(s.clientName).trim(),
      caseNumber: str(s.caseNumber).trim(),
      court: str(s.court).trim(),
      date: /^\d{4}-\d{2}-\d{2}$/.test(str(s.date)) ? str(s.date) : '',
      time: /^\d{2}:\d{2}$/.test(str(s.time)) ? str(s.time) : '',
      notes: str(s.notes),
      status: s.status === 'completed' ? 'completed' : 'pending',
      createdAt: str(s.createdAt) || now,
      updatedAt: str(s.updatedAt) || now,
    }))
    .filter((s) => s.date && s.clientName)

  const clients: Client[] = raw.clients
    .filter((c): c is Record<string, unknown> => !!c && typeof c === 'object')
    .map((c) => ({
      id: str(c.id) || createId(),
      name: str(c.name).trim(),
      phone: str(c.phone).trim(),
      notes: str(c.notes),
      createdAt: str(c.createdAt) || now,
      updatedAt: str(c.updatedAt) || now,
    }))
    .filter((c) => c.name)

  return { version: 1, sessions, clients }
}

function read(): AgendaData {
  if (cache) return cache
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY)
    cache = raw ? normalizeData(JSON.parse(raw)) : EMPTY
  } catch {
    cache = EMPTY
  }
  return cache
}

function write(next: AgendaData) {
  cache = next
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(next))
  } catch {
    // Storage may be full or disabled; in-memory state still updates for this session.
  }
  listeners.forEach((l) => l())
}

function update(fn: (data: AgendaData) => AgendaData) {
  write(fn(read()))
}

function subscribe(listener: () => void) {
  listeners.add(listener)
  const onStorage = (e: StorageEvent) => {
    if (e.key === STORAGE_KEY) {
      cache = null
      listener()
    }
  }
  window.addEventListener('storage', onStorage)
  return () => {
    listeners.delete(listener)
    window.removeEventListener('storage', onStorage)
  }
}

export function useAgenda(): AgendaData {
  return useSyncExternalStore(subscribe, read, () => EMPTY)
}

export function useHydrated(): boolean {
  return useSyncExternalStore(
    subscribe,
    () => true,
    () => false,
  )
}

export function sortSessions(sessions: CourtSession[], direction: 'asc' | 'desc' = 'asc') {
  const factor = direction === 'asc' ? 1 : -1
  return [...sessions].sort(
    (a, b) => factor * `${a.date}T${a.time || '99:99'}`.localeCompare(`${b.date}T${b.time || '99:99'}`),
  )
}

export const agenda = {
  addSession(input: SessionInput) {
    const now = new Date().toISOString()
    update((d) => ({
      ...d,
      sessions: [...d.sessions, { ...input, id: createId(), createdAt: now, updatedAt: now }],
    }))
  },
  updateSession(id: string, input: Partial<SessionInput>) {
    const now = new Date().toISOString()
    update((d) => ({
      ...d,
      sessions: d.sessions.map((s) => (s.id === id ? { ...s, ...input, updatedAt: now } : s)),
    }))
  },
  toggleSessionStatus(id: string) {
    const now = new Date().toISOString()
    update((d) => ({
      ...d,
      sessions: d.sessions.map((s) =>
        s.id === id
          ? { ...s, status: s.status === 'completed' ? 'pending' : 'completed', updatedAt: now }
          : s,
      ),
    }))
  },
  deleteSession(id: string) {
    update((d) => ({ ...d, sessions: d.sessions.filter((s) => s.id !== id) }))
  },
  addClient(input: ClientInput) {
    const now = new Date().toISOString()
    update((d) => ({
      ...d,
      clients: [...d.clients, { ...input, id: createId(), createdAt: now, updatedAt: now }],
    }))
  },
  updateClient(id: string, input: ClientInput) {
    const now = new Date().toISOString()
    update((d) => {
      const previous = d.clients.find((c) => c.id === id)
      const renamed = previous && previous.name !== input.name
      return {
        ...d,
        clients: d.clients.map((c) => (c.id === id ? { ...c, ...input, updatedAt: now } : c)),
        sessions: renamed
          ? d.sessions.map((s) =>
              s.clientName === previous.name ? { ...s, clientName: input.name, updatedAt: now } : s,
            )
          : d.sessions,
      }
    })
  },
  deleteClient(id: string) {
    update((d) => ({ ...d, clients: d.clients.filter((c) => c.id !== id) }))
  },
  replaceAll(data: AgendaData) {
    write(data)
  },
  mergeAll(data: AgendaData) {
    update((d) => {
      const sessionIds = new Set(d.sessions.map((s) => s.id))
      const clientIds = new Set(d.clients.map((c) => c.id))
      const clientNames = new Set(d.clients.map((c) => c.name))
      return {
        ...d,
        sessions: [...d.sessions, ...data.sessions.filter((s) => !sessionIds.has(s.id))],
        clients: [
          ...d.clients,
          ...data.clients.filter((c) => !clientIds.has(c.id) && !clientNames.has(c.name)),
        ],
      }
    })
  },
  clearAll() {
    write(EMPTY)
  },
}
