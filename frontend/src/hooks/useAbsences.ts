import { useState, useEffect, useCallback } from 'react'
import type { Absence, AbsenceType } from '@/lib/types'
import { fetchAbsences, saveAbsence as apiSave, deleteAbsence as apiDelete } from '@/lib/api'

export function useAbsences(enabled: boolean) {
  const [absences, setAbsences] = useState<Record<string, Absence>>({})
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!enabled) return
    setLoading(true)
    fetchAbsences()
      .then(rows => {
        const map: Record<string, Absence> = {}
        rows.forEach(a => { map[a.date] = a })
        setAbsences(map)
      })
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [enabled])

  const saveAbsence = useCallback(async (date: string, type: AbsenceType) => {
    const saved = await apiSave(date, type)
    setAbsences(prev => ({ ...prev, [date]: saved }))
    return saved
  }, [])

  const deleteAbsence = useCallback(async (date: string) => {
    await apiDelete(date)
    setAbsences(prev => {
      const next = { ...prev }
      delete next[date]
      return next
    })
  }, [])

  // Retire une absence du cache local sans appel API (utilisé quand le serveur
  // l'a déjà supprimée en conséquence d'une autre action, ex: saisir un pointage)
  const clearLocalAbsence = useCallback((date: string) => {
    setAbsences(prev => {
      if (!(date in prev)) return prev
      const next = { ...prev }
      delete next[date]
      return next
    })
  }, [])

  return { absences, loading, saveAbsence, deleteAbsence, clearLocalAbsence }
}
