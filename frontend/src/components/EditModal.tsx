import { useEffect, useState } from 'react'
import { X, Sunrise, Coffee, Sun, Sunset } from 'lucide-react'
import type { DayEntry, TimeField, Absence, AbsenceType } from '@/lib/types'
import { formatDate } from '@/lib/time'
import { TimeInput } from './TimeInput'
import { DayTypeSelector, type DayType } from './DayTypeSelector'

interface Props {
  entry: DayEntry
  absence?: Absence
  onSave: (updated: DayEntry) => Promise<void>
  onSaveAbsence: (date: string, type: AbsenceType) => Promise<void>
  onClose: () => void
}

export function EditModal({ entry, absence, onSave, onSaveAbsence, onClose }: Props) {
  const [draft, setDraft] = useState<DayEntry>(entry)
  const [dayType, setDayType] = useState<DayType>(absence?.type ?? 'travail')
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    const handler = (e: KeyboardEvent) => e.key === 'Escape' && onClose()
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [onClose])

  const update = (field: TimeField, value: string) =>
    setDraft(prev => ({ ...prev, [field]: value }))

  const handleSave = async () => {
    setSaving(true)
    try {
      if (dayType === 'travail') await onSave(draft)
      else await onSaveAbsence(entry.date, dayType)
    } finally {
      setSaving(false)
    }
  }

  return (
    // Backdrop — sur mobile le panneau monte depuis le bas
    <div
      className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/40 backdrop-blur-sm"
      onClick={e => e.target === e.currentTarget && onClose()}
    >
      <div className="w-full sm:max-w-md rounded-t-2xl sm:rounded-xl border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-900 shadow-2xl">
        {/* Poignée mobile */}
        <div className="flex justify-center pt-3 sm:hidden">
          <div className="w-10 h-1 rounded-full bg-zinc-200 dark:bg-zinc-700" />
        </div>

        <div className="flex items-center justify-between px-4 sm:px-6 py-4 border-b border-zinc-100 dark:border-zinc-800">
          <div>
            <p className="text-xs text-zinc-400 dark:text-zinc-500 mb-0.5">Modifier</p>
            <h3 className="text-base font-semibold text-zinc-900 dark:text-zinc-100 capitalize">
              {formatDate(draft.date)}
            </h3>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-md hover:bg-zinc-100 dark:hover:bg-zinc-800 text-zinc-400 transition-colors touch-manipulation"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="px-4 sm:px-6 py-4">
          <DayTypeSelector value={dayType} onChange={setDayType} />
        </div>

        {dayType === 'travail' && (
          <div className="px-4 sm:px-6 pb-4 sm:pb-5 grid grid-cols-2 gap-3 sm:gap-4">
            <TimeInput label="Arrivée" value={draft.arrivee} onChange={v => update('arrivee', v)} icon={<Sunrise className="w-3.5 h-3.5" />} />
            <TimeInput label="Départ midi" value={draft.departMidi} onChange={v => update('departMidi', v)} icon={<Coffee className="w-3.5 h-3.5" />} />
            <TimeInput label="Arrivée midi" value={draft.ariveeMidi} onChange={v => update('ariveeMidi', v)} icon={<Sun className="w-3.5 h-3.5" />} />
            <TimeInput label="Départ soir" value={draft.departSoir} onChange={v => update('departSoir', v)} icon={<Sunset className="w-3.5 h-3.5" />} />
          </div>
        )}

        <div className="flex items-center gap-2 px-4 sm:px-6 pb-6 sm:pb-5">
          <button
            onClick={onClose}
            className="flex-1 sm:flex-none px-4 py-3 sm:py-2 rounded-lg text-sm font-medium text-zinc-600 dark:text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors touch-manipulation border border-zinc-200 dark:border-zinc-700"
          >
            Annuler
          </button>
          <button
            onClick={handleSave}
            disabled={saving}
            className="flex-1 sm:flex-none px-4 py-3 sm:py-2 rounded-lg text-sm font-medium bg-zinc-900 dark:bg-zinc-100 text-white dark:text-zinc-900 hover:bg-zinc-700 dark:hover:bg-zinc-300 transition-colors touch-manipulation disabled:opacity-60"
          >
            {saving ? 'Sauvegarde…' : 'Enregistrer'}
          </button>
        </div>
      </div>
    </div>
  )
}
