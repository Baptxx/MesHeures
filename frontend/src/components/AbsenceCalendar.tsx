import { useState } from 'react'
import { ChevronLeft, ChevronRight } from 'lucide-react'
import type { Absence, AbsenceType, DayEntry, Settings } from '@/lib/types'
import { getCalendarGrid, dateRange, todayStr, isStarted, isWorkableDay, getHolidayName, DAY_LETTERS } from '@/lib/time'
import { DAY_TYPE_LABELS } from './DayTypeSelector'

const HOLIDAY_COLOR = '#0ea5e9' // sky-500

const TYPE_COLORS: Record<AbsenceType, { bg: string; text: string }> = {
  conge_paye: { bg: '#3b82f6', text: '#fff' },
  rtt: { bg: '#a855f7', text: '#fff' },
  maladie: { bg: '#ef4444', text: '#fff' },
  autre: { bg: '#71717a', text: '#fff' },
}

const APPLY_TYPES: AbsenceType[] = ['conge_paye', 'rtt', 'maladie', 'autre']
const WEEKDAY_HEADERS = [1, 2, 3, 4, 5, 6, 7]

interface Props {
  entries: Record<string, DayEntry>
  absences: Record<string, Absence>
  settings: Settings
  onApply: (date: string, type: AbsenceType) => Promise<void>
  onClear: (date: string) => Promise<void>
}

export function AbsenceCalendar({ entries, absences, settings, onApply, onClear }: Props) {
  const now = new Date()
  const [year, setYear] = useState(now.getFullYear())
  const [month, setMonth] = useState(now.getMonth())
  const [selected, setSelected] = useState<Set<string>>(new Set())
  const [rangeStart, setRangeStart] = useState<string | null>(null)
  const [busy, setBusy] = useState(false)

  const today = todayStr()
  const cells = getCalendarGrid(year, month)
  const monthLabel = new Date(year, month, 1).toLocaleDateString('fr-FR', { month: 'long', year: 'numeric' })
  const applicable = [...selected].filter(d => isWorkableDay(d, settings.workDays))

  const goPrevMonth = () => {
    setSelected(new Set())
    setRangeStart(null)
    if (month === 0) { setYear(y => y - 1); setMonth(11) } else setMonth(m => m - 1)
  }
  const goNextMonth = () => {
    setSelected(new Set())
    setRangeStart(null)
    if (month === 11) { setYear(y => y + 1); setMonth(0) } else setMonth(m => m + 1)
  }

  const handleDayClick = (date: string) => {
    if (rangeStart === null) {
      setRangeStart(date)
      setSelected(new Set([date]))
    } else {
      setSelected(new Set(dateRange(rangeStart, date)))
      setRangeStart(null)
    }
  }

  const clearSelection = () => {
    setSelected(new Set())
    setRangeStart(null)
  }

  const handleApply = async (type: AbsenceType) => {
    if (applicable.length === 0) return
    const hasWorkedData = applicable.some(d => entries[d] && isStarted(entries[d]))
    if (hasWorkedData && !confirm(`${applicable.length} jour(s) sélectionné(s) contiennent déjà des heures pointées, qui seront effacées. Continuer ?`)) {
      return
    }
    setBusy(true)
    try {
      await Promise.all(applicable.map(d => onApply(d, type)))
    } finally {
      setBusy(false)
      clearSelection()
    }
  }

  const handleClear = async () => {
    const dates = [...selected].filter(d => absences[d])
    if (dates.length === 0) { clearSelection(); return }
    setBusy(true)
    try {
      await Promise.all(dates.map(d => onClear(d)))
    } finally {
      setBusy(false)
      clearSelection()
    }
  }

  return (
    <div className="rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 shadow-sm p-4 sm:p-6 space-y-4">
      <div className="flex items-center justify-between">
        <button onClick={goPrevMonth} aria-label="Mois précédent" className="p-2 rounded-lg hover:bg-zinc-100 dark:hover:bg-zinc-800 text-zinc-400 touch-manipulation">
          <ChevronLeft className="w-4 h-4" />
        </button>
        <h3 className="text-sm font-semibold text-zinc-900 dark:text-zinc-100 capitalize">{monthLabel}</h3>
        <button onClick={goNextMonth} aria-label="Mois suivant" className="p-2 rounded-lg hover:bg-zinc-100 dark:hover:bg-zinc-800 text-zinc-400 touch-manipulation">
          <ChevronRight className="w-4 h-4" />
        </button>
      </div>

      <div className="grid grid-cols-7 gap-1">
        {WEEKDAY_HEADERS.map(d => (
          <div key={d} className="text-center text-[10px] font-medium text-zinc-400 py-1">{DAY_LETTERS[d]}</div>
        ))}

        {cells.map(({ date, inMonth }) => {
          const absence = absences[date]
          const worked = entries[date] && isStarted(entries[date])
          const holidayName = getHolidayName(date)
          const isWorkDay = settings.workDays.includes(new Date(date + 'T00:00:00').getDay() || 7)
          const isSelected = selected.has(date)
          const isToday = date === today
          const day = Number(date.slice(-2))

          const style: React.CSSProperties = {}
          let className = 'relative aspect-square flex items-center justify-center text-xs rounded-lg cursor-pointer touch-manipulation transition-colors '

          if (!inMonth) className += 'text-zinc-300 dark:text-zinc-700 '
          else if (!isWorkDay || holidayName) className += 'text-zinc-300 dark:text-zinc-600 '
          else className += 'text-zinc-700 dark:text-zinc-300 '

          if (absence) {
            style.backgroundColor = TYPE_COLORS[absence.type].bg
            style.color = TYPE_COLORS[absence.type].text
          } else if (isSelected) {
            style.backgroundColor = '#18181b'
            style.color = '#fff'
          }
          if (isSelected) {
            style.boxShadow = 'inset 0 0 0 2px #3b82f6'
          }

          return (
            <button
              key={date}
              type="button"
              onClick={() => handleDayClick(date)}
              className={className}
              style={style}
              title={holidayName ?? undefined}
            >
              {isToday && !absence && !isSelected && (
                <span className="absolute inset-0 rounded-lg ring-2 ring-blue-400" />
              )}
              <span className="relative">{day}</span>
              {holidayName && !absence && (
                <span className="absolute top-0.5 right-0.5 w-1.5 h-1.5 rounded-full" style={{ backgroundColor: HOLIDAY_COLOR }} />
              )}
              {worked && !absence && (
                <span className="absolute bottom-0.5 w-1 h-1 rounded-full bg-emerald-500" />
              )}
            </button>
          )
        })}
      </div>

      <div className="flex items-center gap-3 flex-wrap text-[11px] text-zinc-400">
        <LegendDot color={TYPE_COLORS.conge_paye.bg} label="Congé payé" />
        <LegendDot color={TYPE_COLORS.rtt.bg} label="RTT" />
        <LegendDot color={TYPE_COLORS.maladie.bg} label="Maladie" />
        <LegendDot color={TYPE_COLORS.autre.bg} label="Autre" />
        <span className="flex items-center gap-1"><span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />Pointé</span>
        <span className="flex items-center gap-1"><span className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: HOLIDAY_COLOR }} />Férié</span>
      </div>

      {selected.size > 0 && (
        <div className="pt-3 border-t border-zinc-100 dark:border-zinc-800 space-y-2.5">
          <p className="text-xs text-zinc-500 dark:text-zinc-400">
            {applicable.length} jour{applicable.length > 1 ? 's' : ''} ouvré{applicable.length > 1 ? 's' : ''} sélectionné{applicable.length > 1 ? 's' : ''}
            {applicable.length !== selected.size && ` (${selected.size} jours au total, weekends/fériés exclus)`}
          </p>
          <div className="flex gap-1.5 flex-wrap">
            {APPLY_TYPES.map(type => (
              <button
                key={type}
                type="button"
                disabled={busy}
                onClick={() => handleApply(type)}
                className="px-3 py-1.5 rounded-lg text-xs font-medium text-white disabled:opacity-60 touch-manipulation"
                style={{ backgroundColor: TYPE_COLORS[type].bg }}
              >
                {DAY_TYPE_LABELS[type]}
              </button>
            ))}
            <button
              type="button"
              disabled={busy}
              onClick={handleClear}
              className="px-3 py-1.5 rounded-lg text-xs font-medium bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-300 disabled:opacity-60 touch-manipulation"
            >
              Retirer
            </button>
            <button
              type="button"
              onClick={clearSelection}
              className="px-3 py-1.5 rounded-lg text-xs font-medium text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-200 touch-manipulation"
            >
              Annuler
            </button>
          </div>
        </div>
      )}
    </div>
  )
}

function LegendDot({ color, label }: { color: string; label: string }) {
  return (
    <span className="flex items-center gap-1">
      <span style={{ width: 8, height: 8, borderRadius: 2, backgroundColor: color, display: 'inline-block' }} />
      {label}
    </span>
  )
}
