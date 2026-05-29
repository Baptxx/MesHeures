import { useState, useEffect, useCallback } from 'react'
import type { DayEntry } from '@/lib/types'
import { fetchAllEntries, saveEntry as apiSave, deleteEntry as apiDelete } from '@/lib/api'
import { todayStr } from '@/lib/time'

const EMPTY_ENTRY = (date: string): DayEntry => ({
  date,
  arrivee: '',
  departMidi: '',
  ariveeMidi: '',
  departSoir: '',
})

export function useEntries() {
  const [entries, setEntries] = useState<Record<string, DayEntry>>({})
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    fetchAllEntries()
      .then(rows => {
        const map: Record<string, DayEntry> = {}
        rows.forEach(e => { map[e.date] = e })
        setEntries(map)
      })
      .catch(() => setError('Impossible de contacter le serveur'))
      .finally(() => setLoading(false))
  }, [])

  const saveEntry = useCallback(async (entry: DayEntry) => {
    const saved = await apiSave(entry)
    setEntries(prev => ({ ...prev, [saved.date]: saved }))
    return saved
  }, [])

  const deleteEntry = useCallback(async (date: string) => {
    await apiDelete(date)
    setEntries(prev => {
      const next = { ...prev }
      delete next[date]
      return next
    })
  }, [])

  const today = todayStr()
  const todayEntry: DayEntry = entries[today] ?? EMPTY_ENTRY(today)

  const history = Object.values(entries)
    .filter(e => e.date !== today)
    .sort((a, b) => b.date.localeCompare(a.date))

  return { todayEntry, history, entries, loading, error, saveEntry, deleteEntry }
}
