export interface DayEntry {
  date: string // YYYY-MM-DD
  arrivee: string // HH:mm
  departMidi: string
  ariveeMidi: string
  departSoir: string
}

export type TimeField = keyof Omit<DayEntry, 'date'>
