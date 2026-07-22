import { useState, useMemo } from 'react'
import { ChevronDown } from 'lucide-react'
import type { DayEntry, Absence } from '@/lib/types'
import { getWeekInfo, calcDurations, fromMinutes } from '@/lib/time'
import { HistoryItem } from './HistoryItem'

interface DayRow {
  date: string
  entry?: DayEntry
  absence?: Absence
}

interface WeekGroup {
  key: string        // "2026-W21"
  label: string      // "Semaine 21 · 2026"
  monday: string
  rows: DayRow[]
  total: number | null
}

interface Props {
  history: DayEntry[]
  absences: Absence[]
  onEdit: (date: string) => void
  onDeleteEntry: (date: string) => void
  onDeleteAbsence: (date: string) => void
}

export function HistoryPage({ history, absences, onEdit, onDeleteEntry, onDeleteAbsence }: Props) {
  // Fusionner entrées de travail et absences en une liste unique par date
  const weekGroups = useMemo<WeekGroup[]>(() => {
    const rowsByDate = new Map<string, DayRow>()
    for (const entry of history) rowsByDate.set(entry.date, { date: entry.date, entry })
    for (const absence of absences) rowsByDate.set(absence.date, { date: absence.date, absence })

    const map = new Map<string, WeekGroup>()
    for (const row of rowsByDate.values()) {
      const { week, year, monday } = getWeekInfo(row.date)
      const key = `${year}-W${String(week).padStart(2, '0')}`
      if (!map.has(key)) {
        map.set(key, {
          key,
          label: `Semaine ${week}${year !== new Date().getFullYear() ? ` · ${year}` : ''}`,
          monday,
          rows: [],
          total: null,
        })
      }
      map.get(key)!.rows.push(row)
    }

    for (const group of map.values()) {
      const totals = group.rows
        .map(r => r.entry ? calcDurations(r.entry).total : null)
        .filter(t => t !== null) as number[]
      group.total = totals.length > 0 ? totals.reduce((s, t) => s + t, 0) : null
      group.rows.sort((a, b) => b.date.localeCompare(a.date))
    }

    return [...map.values()].sort((a, b) => b.monday.localeCompare(a.monday))
  }, [history, absences])

  const [selectedKey, setSelectedKey] = useState<string>(() => weekGroups[0]?.key ?? '')

  if (weekGroups.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-zinc-400 dark:text-zinc-600">
        <p className="text-sm">Aucun historique enregistré</p>
      </div>
    )
  }

  const selectedGroup = weekGroups.find(g => g.key === selectedKey) ?? weekGroups[0]

  return (
    <div className="space-y-4">
      {/* Dropdown sélecteur de semaine */}
      <div className="relative">
        <select
          value={selectedKey}
          onChange={e => setSelectedKey(e.target.value)}
          className="
            w-full h-11 pl-4 pr-10 rounded-xl
            border border-zinc-200 dark:border-zinc-700
            bg-white dark:bg-zinc-900
            text-sm font-medium text-zinc-900 dark:text-zinc-100
            focus:outline-none focus:ring-2 focus:ring-zinc-900 dark:focus:ring-zinc-100
            appearance-none cursor-pointer
            transition-colors
          "
        >
          {weekGroups.map(g => (
            <option key={g.key} value={g.key}>
              {g.label}{g.total !== null ? ` — ${fromMinutes(g.total)}` : ''}
            </option>
          ))}
        </select>
        <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-400 pointer-events-none" />
      </div>

      {/* Entrées de la semaine sélectionnée */}
      {selectedGroup && (
        <div className="space-y-2">
          {selectedGroup.rows.map(row => (
            <HistoryItem
              key={row.date}
              date={row.date}
              entry={row.entry}
              absence={row.absence}
              onEdit={() => onEdit(row.date)}
              onDelete={async () => {
                if (!confirm('Supprimer cette entrée ?')) return
                if (row.absence) await onDeleteAbsence(row.date)
                else await onDeleteEntry(row.date)
              }}
            />
          ))}

          {selectedGroup.total !== null && (
            <div className="flex justify-end pt-1">
              <span className="text-xs text-zinc-400 dark:text-zinc-500">
                Total semaine : <span className="font-semibold text-zinc-700 dark:text-zinc-300">{fromMinutes(selectedGroup.total)}</span>
              </span>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
