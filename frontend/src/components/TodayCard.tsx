import { useState, useEffect } from 'react'
import { Sunrise, Coffee, Sun, Sunset, Timer, Save, Check } from 'lucide-react'
import type { DayEntry, TimeField } from '@/lib/types'
import { calcDurations, calcTheoreticalDeparture, isComplete, isStarted, formatDate } from '@/lib/time'
import { TimeInput } from './TimeInput'
import { Badge } from './Badge'
import { DurationRow } from './DurationRow'

const GOAL = 7 * 60

interface Props {
  entry: DayEntry
  onSave: (entry: DayEntry) => Promise<DayEntry>
}

export function TodayCard({ entry, onSave }: Props) {
  const [draft, setDraft] = useState<DayEntry>(entry)
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)

  useEffect(() => {
    setDraft(entry)
  }, [entry.date])

  const isDirty =
    draft.arrivee !== entry.arrivee ||
    draft.departMidi !== entry.departMidi ||
    draft.ariveeMidi !== entry.ariveeMidi ||
    draft.departSoir !== entry.departSoir

  const update = (field: TimeField, value: string) => {
    setSaved(false)
    setDraft(prev => ({ ...prev, [field]: value }))
  }

  const handleSave = async () => {
    setSaving(true)
    try {
      await onSave(draft)
      setSaved(true)
      setTimeout(() => setSaved(false), 2000)
    } finally {
      setSaving(false)
    }
  }

  const { matin, pause, apresmidi, total } = calcDurations(draft)
  const theoretical = calcTheoreticalDeparture(draft)
  const variant = isComplete(draft) ? 'complete' : isStarted(draft) ? 'partial' : 'empty'
  const progress = total !== null ? Math.min((total / GOAL) * 100, 100) : 0
  const progressColor =
    progress >= 100 ? 'bg-emerald-500' : progress >= 70 ? 'bg-amber-500' : 'bg-blue-500'
  const theoreticalNote = draft.arrivee && (!draft.departMidi || !draft.ariveeMidi)
    ? 'hors pause'
    : null

  return (
    <div className="rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 shadow-sm overflow-hidden">
      <div className="px-4 sm:px-6 pt-4 sm:pt-5 pb-3 sm:pb-4 border-b border-zinc-100 dark:border-zinc-800 flex items-start justify-between gap-3">
        <div>
          <p className="text-xs font-medium text-zinc-400 dark:text-zinc-500 uppercase tracking-wider mb-1">Aujourd'hui</p>
          <h2 className="text-base sm:text-lg font-semibold text-zinc-900 dark:text-zinc-100 capitalize">
            {formatDate(draft.date)}
          </h2>
        </div>
        <Badge variant={variant} />
      </div>

      <div className="px-4 sm:px-6 py-4 sm:py-5 grid grid-cols-2 gap-3 sm:gap-4">
        <TimeInput label="Arrivée" value={draft.arrivee} onChange={v => update('arrivee', v)} icon={<Sunrise className="w-3.5 h-3.5" />} />
        <TimeInput label="Départ midi" value={draft.departMidi} onChange={v => update('departMidi', v)} icon={<Coffee className="w-3.5 h-3.5" />} />
        <TimeInput label="Arrivée midi" value={draft.ariveeMidi} onChange={v => update('ariveeMidi', v)} icon={<Sun className="w-3.5 h-3.5" />} />
        <TimeInput label="Départ soir" value={draft.departSoir} onChange={v => update('departSoir', v)} icon={<Sunset className="w-3.5 h-3.5" />} />
      </div>

      {theoretical !== null && !isComplete(draft) && (
        <div className="mx-4 sm:mx-6 mb-4 flex items-center justify-between gap-2 px-3 sm:px-4 py-3 rounded-lg bg-blue-50 dark:bg-blue-950/40 border border-blue-100 dark:border-blue-900">
          <div className="flex items-center gap-2 text-blue-700 dark:text-blue-300 min-w-0">
            <Timer className="w-4 h-4 shrink-0" />
            <span className="text-sm font-medium truncate">Départ théorique 7h</span>
            {theoreticalNote && (
              <span className="text-xs text-blue-500 dark:text-blue-400 hidden sm:inline">({theoreticalNote})</span>
            )}
          </div>
          <span className="text-base font-bold tabular-nums text-blue-700 dark:text-blue-300 shrink-0">
            {theoretical}
          </span>
        </div>
      )}

      {(total !== null || (matin !== null && pause !== null)) && (
        <div className="px-4 sm:px-6 space-y-3">
          {total !== null && (
            <div className="w-full bg-zinc-100 dark:bg-zinc-800 rounded-full h-1.5">
              <div className={`h-1.5 rounded-full transition-all duration-500 ${progressColor}`} style={{ width: `${progress}%` }} />
            </div>
          )}
          <div className="divide-y divide-zinc-100 dark:divide-zinc-800">
            <DurationRow label="Matin" minutes={matin} />
            <DurationRow label="Pause déjeuner" minutes={pause} />
            <DurationRow label="Après-midi" minutes={apresmidi} />
            {total !== null && <DurationRow label="Total journée" minutes={total} highlight />}
          </div>
        </div>
      )}

      <div className="px-4 sm:px-6 py-4">
        <button
          onClick={handleSave}
          disabled={saving || (!isDirty && !saved)}
          className={`
            w-full sm:w-auto sm:ml-auto flex items-center justify-center gap-2
            px-4 py-3 sm:py-2 rounded-lg text-sm font-medium transition-all duration-200
            touch-manipulation
            ${saved
              ? 'bg-emerald-500 text-white'
              : isDirty
                ? 'bg-zinc-900 dark:bg-zinc-100 text-white dark:text-zinc-900 hover:bg-zinc-700 dark:hover:bg-zinc-300'
                : 'bg-zinc-100 dark:bg-zinc-800 text-zinc-400 dark:text-zinc-500 cursor-not-allowed'
            }
          `}
        >
          {saved
            ? <><Check className="w-4 h-4" />Enregistré</>
            : saving
              ? <><div className="w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin" />Sauvegarde…</>
              : <><Save className="w-4 h-4" />Enregistrer</>
          }
        </button>
      </div>
    </div>
  )
}
