import type { DayEntry } from '@/lib/types'
import { calcDurations, getWeekDays, todayStr, fromMinutes } from '@/lib/time'

const GOAL = 7 * 60
const DAY_LABELS = ['L', 'M', 'M', 'J', 'V']

interface Props {
  entries: Record<string, DayEntry>
}

export function WeekStats({ entries }: Props) {
  const today = todayStr()
  const weekDays = getWeekDays(today)

  // --- Stats semaine ---
  const weekTotals = weekDays.map(date => {
    const e = entries[date]
    if (!e) return null
    return calcDurations(e).total
  })
  const weekFilled = weekTotals.filter(t => t !== null) as number[]
  const weekTotal = weekFilled.reduce((s, t) => s + t, 0)
  const weekAvg = weekFilled.length > 0 ? Math.round(weekTotal / weekFilled.length) : null
  const weekDelta = weekTotal - 5 * GOAL
  const maxBar = Math.max(...weekFilled, GOAL)

  // --- Stats globales ---
  const allEntries = Object.values(entries)
  const allTotals = allEntries
    .map(e => calcDurations(e).total)
    .filter(t => t !== null) as number[]
  const globalTotal = allTotals.reduce((s, t) => s + t, 0)
  const globalDays = allTotals.length
  const globalAvg = globalDays > 0 ? Math.round(globalTotal / globalDays) : null
  const globalDelta = globalTotal - globalDays * GOAL

  return (
    <div className="rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 shadow-sm overflow-hidden">
      {/* ── Semaine ── */}
      <div className="px-4 sm:px-6 pt-4 sm:pt-5 pb-4">
        <h3 className="text-sm font-semibold text-zinc-900 dark:text-zinc-100 mb-4">Cette semaine</h3>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4 mb-5">
          <Stat label="Total" value={weekTotal > 0 ? fromMinutes(weekTotal) : '—'} />
          <Stat label="Jours saisis" value={`${weekFilled.length}/5`} />
          <Stat label="Moyenne/jour" value={weekAvg !== null ? fromMinutes(weekAvg) : '—'} />
          <Stat
            label="Delta objectif semaine"
            value={weekTotal > 0 ? `${weekDelta >= 0 ? '+' : '-'}${fromMinutes(Math.abs(weekDelta))}` : '—'}
            accent={weekTotal > 0 ? (weekDelta >= 0 ? 'positive' : 'negative') : undefined}
          />
        </div>

        {/* Graphique — 3 rangées indépendantes : durées / barres / jours */}

        {/* 1. Durées au-dessus */}
        <div className="flex gap-2 mb-1">
          {weekTotals.map((t, i) => (
            <div key={i} className="flex-1 text-center">
              <span className="text-[10px] tabular-nums" style={{ color: '#a1a1aa' }}>
                {t !== null ? fromMinutes(t) : ''}
              </span>
            </div>
          ))}
        </div>

        {/* 2. Zone barres — hauteur fixe 80px, ligne objectif en haut */}
        <div className="relative flex items-end gap-2" style={{ height: 80 }}>
          <div className="absolute inset-x-0 top-0 border-t border-dashed border-zinc-300 dark:border-zinc-600" />
          {weekDays.map((date, i) => {
            const t = weekTotals[i]
            const isToday = date === today
            const pct = t !== null ? Math.min(t / GOAL, 1) : null
            const barPx = pct !== null ? Math.max(Math.round(pct * 80), 4) : 4
            const bgColor = pct === null
              ? (isToday ? '#bfdbfe' : '#e4e4e7')
              : pct >= 1   ? '#34d399'
              : pct >= 0.85 ? '#fbbf24'
              :               '#f87171'

            return (
              <div
                key={date}
                className="flex-1 rounded-t-sm"
                style={{
                  height: barPx,
                  backgroundColor: bgColor,
                  opacity: t === null ? 0.4 : 1,
                  transition: 'height 0.4s ease',
                }}
              />
            )
          })}
        </div>

        {/* 3. Étiquettes jours */}
        <div className="flex gap-2 mt-1.5">
          {weekDays.map((date, i) => (
            <div key={date} className="flex-1 text-center">
              <span
                className="text-[11px] font-medium"
                style={{ color: date === today ? '#3b82f6' : '#a1a1aa' }}
              >
                {DAY_LABELS[i]}
              </span>
            </div>
          ))}
        </div>

        {/* Légende */}
        <div className="flex items-center gap-4 mt-3">
          <LegendDot color="#34d399" label="≥ 7h" />
          <LegendDot color="#fbbf24" label="≥ 5h58" />
          <LegendDot color="#f87171" label="< 5h58" />
        </div>
      </div>

      {/* ── Global ── */}
      {globalDays > 0 && (
        <div className="px-4 sm:px-6 py-4 border-t border-zinc-100 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-800/40">
          <h3 className="text-sm font-semibold text-zinc-900 dark:text-zinc-100 mb-3">Total global</h3>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4">
            <Stat label="Heures totales" value={fromMinutes(globalTotal)} />
            <Stat label="Jours enregistrés" value={`${globalDays}j`} />
            <Stat label="Moyenne/jour" value={globalAvg !== null ? fromMinutes(globalAvg) : '—'} />
            <Stat
              label="Delta cumulé"
              value={`${globalDelta >= 0 ? '+' : '-'}${fromMinutes(Math.abs(globalDelta))}`}
              accent={globalDelta >= 0 ? 'positive' : 'negative'}
            />
          </div>
        </div>
      )}
    </div>
  )
}

function LegendDot({ color, label }: { color: string; label: string }) {
  return (
    <div className="flex items-center gap-1.5">
      <div style={{ width: 10, height: 10, borderRadius: 2, backgroundColor: color, flexShrink: 0 }} />
      <span className="text-[10px] text-zinc-400 dark:text-zinc-500">{label}</span>
    </div>
  )
}

function Stat({ label, value, accent }: { label: string; value: string; accent?: 'positive' | 'negative' }) {
  const valueColor =
    accent === 'positive'
      ? 'text-emerald-600 dark:text-emerald-400'
      : accent === 'negative'
        ? 'text-red-500 dark:text-red-400'
        : 'text-zinc-900 dark:text-zinc-100'

  return (
    <div>
      <p className="text-xs text-zinc-400 dark:text-zinc-500 mb-0.5">{label}</p>
      <p className={`text-base font-semibold tabular-nums ${valueColor}`}>{value}</p>
    </div>
  )
}
