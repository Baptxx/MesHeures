import type { DayEntry } from './types'

const BASE = 'http://localhost:3000'

// Convertit le format snake_case de l'API vers le format camelCase du frontend
function fromApi(row: Record<string, string>): DayEntry {
  return {
    date: row.date,
    arrivee: row.arrivee ?? '',
    departMidi: row.depart_midi ?? '',
    ariveeMidi: row.arivee_midi ?? '',
    departSoir: row.depart_soir ?? '',
  }
}

// Convertit le format camelCase du frontend vers le format snake_case de l'API
function toApi(entry: DayEntry) {
  return {
    arrivee: entry.arrivee,
    depart_midi: entry.departMidi,
    arivee_midi: entry.ariveeMidi,
    depart_soir: entry.departSoir,
  }
}

export async function fetchAllEntries(): Promise<DayEntry[]> {
  const res = await fetch(`${BASE}/entries`)
  if (!res.ok) throw new Error('Erreur lors du chargement')
  const rows = await res.json() as Record<string, string>[]
  return rows.map(fromApi)
}

export async function saveEntry(entry: DayEntry): Promise<DayEntry> {
  const res = await fetch(`${BASE}/entries/${entry.date}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(toApi(entry)),
  })
  if (!res.ok) throw new Error('Erreur lors de la sauvegarde')
  return fromApi(await res.json() as Record<string, string>)
}

export async function deleteEntry(date: string): Promise<void> {
  const res = await fetch(`${BASE}/entries/${date}`, { method: 'DELETE' })
  if (!res.ok && res.status !== 404) throw new Error('Erreur lors de la suppression')
}
