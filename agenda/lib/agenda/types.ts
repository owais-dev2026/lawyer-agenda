export type SessionStatus = 'pending' | 'completed'

export interface CourtSession {
  id: string
  clientName: string
  caseNumber: string
  court: string
  date: string
  time: string
  notes: string
  status: SessionStatus
  createdAt: string
  updatedAt: string
}

export interface Client {
  id: string
  name: string
  phone: string
  notes: string
  createdAt: string
  updatedAt: string
}

export interface AgendaData {
  version: 1
  sessions: CourtSession[]
  clients: Client[]
}

export type SessionInput = Omit<CourtSession, 'id' | 'createdAt' | 'updatedAt'>
export type ClientInput = Omit<Client, 'id' | 'createdAt' | 'updatedAt'>
