export interface DayEntry {
  date: string // YYYY-MM-DD
  arrivee: string // HH:mm
  departMidi: string
  ariveeMidi: string
  departSoir: string
}

export type TimeField = keyof Omit<DayEntry, 'date'>

export function emptyEntry(date: string): DayEntry {
  return { date, arrivee: '', departMidi: '', ariveeMidi: '', departSoir: '' }
}

export type AbsenceType = 'conge_paye' | 'rtt' | 'maladie' | 'autre'

export interface Absence {
  date: string // YYYY-MM-DD
  type: AbsenceType
}

export interface Settings {
  dailyGoalMinutes: number
  workDays: number[] // ISO weekday numbers, lundi = 1 ... dimanche = 7
  initialBalanceMinutes: number
  leaveCongePayeAnnualDays: number
  leaveRttAnnualDays: number
  reminderMorningEnabled: boolean
  reminderMorningTime: string // HH:mm
  reminderNoonEnabled: boolean
  reminderNoonTime: string
  reminderEveningEnabled: boolean
  reminderEveningTime: string
}

export interface User {
  id: number
  email: string
}

export type DayRecord =
  | { date: string; kind: 'work'; entry: DayEntry }
  | { date: string; kind: 'absence'; absence: Absence }
