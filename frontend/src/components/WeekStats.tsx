import { useState } from 'react'
import { ChevronDown } from 'lucide-react'
import type { DayEntry } from '@/lib/types'
import {
  calcDurations, getWeekDays, getMonthWeeks, getYearMonths, todayStr, fromMinutes, formatDay,
  currentMonthLabel, currentYear,
} from '@/lib/time'

const GOAL = 7 * 60
const DAY_LABELS = ['L', 'M', 'M', 'J', 'V']

type Period = 'week' | 'month' | 'year'

interface Props {
  entries: Record<string, DayEntry>
}

export function WeekStats({ entries }: Props) {
  const [period, setPeriod] = useState<Period>('week')
  const today = todayStr()

  return (
    <div className="rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 shadow-sm overflow-hidden">
      {period === 'week' && <WeekView entries={entries} today={today} onPeriodChange={setPeriod} />}
      {period === 'month' && <MonthView entries={entries} today={today} onPeriodChange={setPeriod} />}
      {period === 'year' && <YearView entries={entries} today={today} onPeriodChange={setPeriod} />}

    </div>
  )
}

// ── Dropdown ────────────────────────────────────────────────────────────────

function PeriodDropdown({ value, onChange }: { value: Period; onChange: (p: Period) => void }) {
  return (
    <div className="relative inline-flex items-center">
      <select
        value={value}
        onChange={e => onChange(e.target.value as Period)}
        className="appearance-none bg-transparent text-sm font-semibold text-zinc-900 dark:text-zinc-100 pr-5 cursor-pointer focus:outline-none"
      >
        <option value="week">Cette semaine</option>
        <option value="month">{currentMonthLabel()}</option>
        <option value="year">{currentYear()}</option>
      </select>
      <ChevronDown className="pointer-events-none absolute right-0 w-3.5 h-3.5 text-zinc-400" />
    </div>
  )
}

// ── Vue semaine ──────────────────────────────────────────────────────────────

function WeekView({
  entries, today, onPeriodChange,
}: { entries: Record<string, DayEntry>; today: string; onPeriodChange: (p: Period) => void }) {
  const weekDays = getWeekDays(today)
  const weekTotals = weekDays.map(date => {
    const e = entries[date]
    return e ? calcDurations(e).total : null
  })
  const weekFilled = weekTotals.filter(t => t !== null) as number[]
  const weekTotal = weekFilled.reduce((s, t) => s + t, 0)
  const weekAvg = weekFilled.length > 0 ? Math.round(weekTotal / weekFilled.length) : null
  const weekDelta = weekTotal - 5 * GOAL

  return (
    <div className="px-4 sm:px-6 pt-4 sm:pt-5 pb-4">
      <PeriodDropdown value="week" onChange={onPeriodChange} />

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4 mb-5 mt-4">
        <Stat label="Total" value={weekTotal > 0 ? fromMinutes(weekTotal) : '—'} />
        <Stat label="Jours saisis" value={`${weekFilled.length}/5`} />
        <Stat label="Moyenne/jour" value={weekAvg !== null ? fromMinutes(weekAvg) : '—'} />
        <Stat
          label="Delta objectif"
          value={weekTotal > 0 ? `${weekDelta >= 0 ? '+' : '-'}${fromMinutes(Math.abs(weekDelta))}` : '—'}
          accent={weekTotal > 0 ? (weekDelta >= 0 ? 'positive' : 'negative') : undefined}
        />
      </div>

      {/* Durées */}
      <div className="flex gap-2 mb-1">
        {weekTotals.map((t, i) => (
          <div key={i} className="flex-1 text-center">
            <span className="text-[10px] tabular-nums text-zinc-400">
              {t !== null ? fromMinutes(t) : ''}
            </span>
          </div>
        ))}
      </div>

      {/* Barres */}
      <div className="relative flex items-end gap-2" style={{ height: 80 }}>
        <div className="absolute inset-x-0 top-0 border-t border-dashed border-zinc-300 dark:border-zinc-600" />
        {weekDays.map((date, i) => {
          const t = weekTotals[i]
          const isToday = date === today
          const pct = t !== null ? Math.min(t / GOAL, 1) : null
          const barPx = pct !== null ? Math.max(Math.round(pct * 80), 4) : 4
          const bg = pct === null
            ? (isToday ? '#bfdbfe' : '#e4e4e7')
            : pct >= 1 ? '#34d399' : pct >= 0.85 ? '#fbbf24' : '#f87171'
          return (
            <div
              key={date}
              className="flex-1 rounded-t-sm"
              style={{ height: barPx, backgroundColor: bg, opacity: t === null ? 0.4 : 1, transition: 'height 0.4s ease' }}
            />
          )
        })}
      </div>

      {/* Étiquettes jours */}
      <div className="flex gap-2 mt-1.5">
        {weekDays.map((date, i) => (
          <div key={date} className="flex-1 text-center">
            <span className="text-[11px] font-medium" style={{ color: date === today ? '#3b82f6' : '#a1a1aa' }}>
              {DAY_LABELS[i]}
            </span>
          </div>
        ))}
      </div>

      <div className="flex items-center gap-4 mt-3">
        <LegendDot color="#34d399" label="≥ 7h" />
        <LegendDot color="#fbbf24" label="≥ 5h58" />
        <LegendDot color="#f87171" label="< 5h58" />
      </div>
    </div>
  )
}

// ── Vue mois ─────────────────────────────────────────────────────────────────

function MonthView({
  entries, today, onPeriodChange,
}: { entries: Record<string, DayEntry>; today: string; onPeriodChange: (p: Period) => void }) {
  const weeks = getMonthWeeks(today)

  // Stats par semaine
  const weekStats = weeks.map(({ days, week }) => {
    const totals = days.map(d => {
      const e = entries[d]
      return e ? calcDurations(e).total : null
    })
    const filled = totals.filter(t => t !== null) as number[]
    const total = filled.reduce((s, t) => s + t, 0)
    const delta = total - 5 * GOAL
    return { week, days, totals, filled, total, delta }
  })

  // Stats mois
  const monthTotal = weekStats.reduce((s, w) => s + w.total, 0)
  const weeksWithData = weekStats.filter(w => w.filled.length > 0)
  const monthAvgPerWeek = weeksWithData.length > 0
    ? Math.round(monthTotal / weeksWithData.length)
    : null
  const allDayTotals = weekStats.flatMap(w => w.filled)
  const monthAvgPerDay = allDayTotals.length > 0
    ? Math.round(allDayTotals.reduce((s, t) => s + t, 0) / allDayTotals.length)
    : null
  const monthDelta = monthTotal - weekStats.flatMap(w => w.days).length * GOAL

  const maxWeekTotal = Math.max(...weekStats.map(w => w.total), 5 * GOAL)

  return (
    <div className="px-4 sm:px-6 pt-4 sm:pt-5 pb-4">
      <PeriodDropdown value="month" onChange={onPeriodChange} />

      {/* Récap mensuel */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4 mt-4 mb-5">
        <Stat label="Total mois" value={monthTotal > 0 ? fromMinutes(monthTotal) : '—'} />
        <Stat label="Semaines saisies" value={`${weeksWithData.length}/${weeks.length}`} />
        <Stat label="Moy/semaine" value={monthAvgPerWeek !== null ? fromMinutes(monthAvgPerWeek) : '—'} />
        <Stat label="Moy/jour" value={monthAvgPerDay !== null ? fromMinutes(monthAvgPerDay) : '—'} />
      </div>

      {/* Détail par semaine */}
      <div className="space-y-3">
        {weekStats.map(({ week, days, totals, filled, total, delta }) => {
          const barPct = maxWeekTotal > 0 ? Math.min(total / maxWeekTotal, 1) : 0
          const goalPct = Math.min((5 * GOAL) / maxWeekTotal, 1)
          const deltaColor = filled.length === 0 ? '' : delta >= 0 ? 'text-emerald-600 dark:text-emerald-400' : 'text-red-500 dark:text-red-400'

          return (
            <div key={week} className="rounded-lg border border-zinc-100 dark:border-zinc-800 p-3">
              <div className="flex items-baseline justify-between mb-2">
                <div>
                  <span className="text-xs font-semibold text-zinc-700 dark:text-zinc-300">Sem.{week}</span>
                  <span className="text-xs text-zinc-400 ml-2">
                    {formatDay(days[0])} – {formatDay(days[4])}
                  </span>
                </div>
                <div className="flex items-baseline gap-3">
                  <span className="text-sm font-semibold tabular-nums text-zinc-900 dark:text-zinc-100">
                    {filled.length > 0 ? fromMinutes(total) : '—'}
                  </span>
                  {filled.length > 0 && (
                    <span className={`text-xs font-medium tabular-nums ${deltaColor}`}>
                      {delta >= 0 ? '+' : '-'}{fromMinutes(Math.abs(delta))}
                    </span>
                  )}
                </div>
              </div>

              {/* Barre de progression */}
              <div className="relative h-2 bg-zinc-100 dark:bg-zinc-800 rounded-full overflow-hidden mb-2">
                {/* Ligne objectif */}
                <div
                  className="absolute top-0 bottom-0 w-px bg-zinc-400 dark:bg-zinc-500 z-10"
                  style={{ left: `${goalPct * 100}%` }}
                />
                {barPct > 0 && (
                  <div
                    className="h-full rounded-full transition-all duration-500"
                    style={{
                      width: `${barPct * 100}%`,
                      backgroundColor: delta >= 0 ? '#34d399' : total >= 0.85 * 5 * GOAL ? '#fbbf24' : '#f87171',
                    }}
                  />
                )}
              </div>

              {/* Mini jours */}
              <div className="flex gap-1">
                {days.map((date, i) => {
                  const t = totals[i]
                  const pct = t !== null ? Math.min(t / GOAL, 1) : null
                  const bg = pct === null
                    ? (date === today ? '#bfdbfe' : '#e4e4e7')
                    : pct >= 1 ? '#34d399' : pct >= 0.85 ? '#fbbf24' : '#f87171'
                  return (
                    <div key={date} className="flex-1 flex flex-col items-center gap-0.5">
                      <div
                        className="w-full h-1 rounded-full"
                        style={{ backgroundColor: bg, opacity: t === null ? 0.35 : 1 }}
                      />
                      <span className="text-[9px] text-zinc-400">{DAY_LABELS[i]}</span>
                    </div>
                  )
                })}
              </div>

              <p className="text-[10px] text-zinc-400 mt-1.5">{filled.length}/5 jours saisis</p>
            </div>
          )
        })}
      </div>

      {/* Delta mois */}
      {monthTotal > 0 && (
        <div className="mt-4 flex items-center justify-between text-xs text-zinc-400">
          <span>Delta objectif mois</span>
          <span className={`font-semibold tabular-nums ${monthDelta >= 0 ? 'text-emerald-600 dark:text-emerald-400' : 'text-red-500 dark:text-red-400'}`}>
            {monthDelta >= 0 ? '+' : '-'}{fromMinutes(Math.abs(monthDelta))}
          </span>
        </div>
      )}
    </div>
  )
}

// ── Vue année ────────────────────────────────────────────────────────────────

function YearView({
  entries, onPeriodChange,
}: { entries: Record<string, DayEntry>; today: string; onPeriodChange: (p: Period) => void }) {
  const year = currentYear()
  const months = getYearMonths(year)

  const monthStats = months.map(({ month, label, days }) => {
    const totals = days.map(d => {
      const e = entries[d]
      return e ? calcDurations(e).total : null
    })
    const filled = totals.filter(t => t !== null) as number[]
    const total = filled.reduce((s, t) => s + t, 0)
    const delta = total - days.length * GOAL
    return { month, label, days, filled, total, delta }
  })

  const yearTotal = monthStats.reduce((s, m) => s + m.total, 0)
  const yearFilledDays = monthStats.reduce((s, m) => s + m.filled.length, 0)
  const yearTotalWorkDays = monthStats.reduce((s, m) => s + m.days.length, 0)
  const yearAvgPerDay = yearFilledDays > 0 ? Math.round(yearTotal / yearFilledDays) : null

  // Semaines dans l'année pour la moy/semaine
  const allWeekTotals: number[] = []
  months.forEach(({ days }) => {
    // On groupe les jours par semaine ISO monday
    const byWeek: Record<string, number[]> = {}
    days.forEach(d => {
      const e = entries[d]
      const t = e ? calcDurations(e).total : null
      if (t === null) return
      // lundi de la semaine
      const dd = new Date(d + 'T00:00:00')
      const dow = dd.getDay() || 7
      dd.setDate(dd.getDate() - dow + 1)
      const key = dd.toISOString().slice(0, 10)
      if (!byWeek[key]) byWeek[key] = []
      byWeek[key].push(t)
    })
    Object.values(byWeek).forEach(ts => allWeekTotals.push(ts.reduce((s, t) => s + t, 0)))
  })
  const yearAvgPerWeek = allWeekTotals.length > 0
    ? Math.round(allWeekTotals.reduce((s, t) => s + t, 0) / allWeekTotals.length)
    : null

  const yearDelta = yearTotal - yearFilledDays * GOAL
  const maxMonthTotal = Math.max(...monthStats.map(m => m.total), 1)
  const today = new Date().getMonth()

  return (
    <div className="px-4 sm:px-6 pt-4 sm:pt-5 pb-4">
      <PeriodDropdown value="year" onChange={onPeriodChange} />

      {/* Récap annuel */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4 mt-4 mb-5">
        <Stat label="Total année" value={yearTotal > 0 ? fromMinutes(yearTotal) : '—'} />
        <Stat label="Jours saisis" value={yearFilledDays > 0 ? `${yearFilledDays}/${yearTotalWorkDays}` : '—'} />
        <Stat label="Moy/semaine" value={yearAvgPerWeek !== null ? fromMinutes(yearAvgPerWeek) : '—'} />
        <Stat label="Moy/jour" value={yearAvgPerDay !== null ? fromMinutes(yearAvgPerDay) : '—'} />
      </div>

      {/* Graphique barres mensuelles */}
      <div className="mb-1">
        <div className="relative flex items-end gap-1.5" style={{ height: 64 }}>
          <div className="absolute inset-x-0 top-0 border-t border-dashed border-zinc-200 dark:border-zinc-700" />
          {monthStats.map(({ month, total, filled, delta }) => {
            const pct = total > 0 ? total / maxMonthTotal : 0
            const barPx = pct > 0 ? Math.max(Math.round(pct * 60), 4) : 4
            const bg = filled.length === 0 ? '#e4e4e7'
              : delta >= 0 ? '#34d399'
              : delta >= -2 * 60 ? '#fbbf24'
              : '#f87171'
            const isCurrentMonth = month === today
            return (
              <div key={month} className="flex-1 flex flex-col items-center gap-0">
                <div
                  className="w-full rounded-t-sm transition-all duration-500"
                  style={{
                    height: barPx,
                    backgroundColor: bg,
                    opacity: filled.length === 0 ? 0.3 : 1,
                    outline: isCurrentMonth ? '2px solid #3b82f6' : 'none',
                    outlineOffset: 1,
                  }}
                />
              </div>
            )
          })}
        </div>
        <div className="flex gap-1.5 mt-1">
          {monthStats.map(({ month, label }) => (
            <div key={month} className="flex-1 text-center">
              <span
                className="text-[9px] font-medium"
                style={{ color: month === today ? '#3b82f6' : '#a1a1aa' }}
              >
                {label}
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* Détail par mois */}
      <div className="space-y-2 mt-4">
        {monthStats.filter(m => m.filled.length > 0).map(({ month, label, days, filled, total, delta }) => {
          const deltaColor = delta >= 0 ? 'text-emerald-600 dark:text-emerald-400' : 'text-red-500 dark:text-red-400'
          const barPct = Math.min(total / (days.length * GOAL), 1)
          return (
            <div key={month} className="rounded-lg border border-zinc-100 dark:border-zinc-800 px-3 py-2.5">
              <div className="flex items-center justify-between mb-1.5">
                <span className="text-xs font-semibold text-zinc-700 dark:text-zinc-300 capitalize">{label}</span>
                <div className="flex items-baseline gap-2">
                  <span className="text-sm font-semibold tabular-nums text-zinc-900 dark:text-zinc-100">{fromMinutes(total)}</span>
                  <span className={`text-xs font-medium tabular-nums ${deltaColor}`}>
                    {delta >= 0 ? '+' : '-'}{fromMinutes(Math.abs(delta))}
                  </span>
                </div>
              </div>
              <div className="h-1.5 bg-zinc-100 dark:bg-zinc-800 rounded-full overflow-hidden">
                <div
                  className="h-full rounded-full transition-all duration-500"
                  style={{
                    width: `${barPct * 100}%`,
                    backgroundColor: delta >= 0 ? '#34d399' : barPct >= 0.85 ? '#fbbf24' : '#f87171',
                  }}
                />
              </div>
              <p className="text-[10px] text-zinc-400 mt-1">{filled.length}/{days.length} jours saisis</p>
            </div>
          )
        })}
      </div>

      {yearTotal > 0 && (
        <div className="mt-4 flex items-center justify-between text-xs text-zinc-400">
          <span>Delta objectif année</span>
          <span className={`font-semibold tabular-nums ${yearDelta >= 0 ? 'text-emerald-600 dark:text-emerald-400' : 'text-red-500 dark:text-red-400'}`}>
            {yearDelta >= 0 ? '+' : '-'}{fromMinutes(Math.abs(yearDelta))}
          </span>
        </div>
      )}
    </div>
  )
}

// ── Total global ─────────────────────────────────────────────────────────────

export function WeekSummary({ entries }: { entries: Record<string, DayEntry> }) {
  const today = todayStr()
  const weekDays = getWeekDays(today)
  const totals = weekDays.map(d => {
    const e = entries[d]
    return e ? calcDurations(e).total : null
  })
  const filled = totals.filter(t => t !== null) as number[]
  const weekTotal = filled.reduce((s, t) => s + t, 0)
  const weekDelta = weekTotal - 5 * GOAL
  const weekAvg = filled.length > 0 ? Math.round(weekTotal / filled.length) : null

  if (filled.length === 0) return null

  return (
    <div className="rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 shadow-sm px-4 sm:px-6 py-4">
      <h3 className="text-sm font-semibold text-zinc-900 dark:text-zinc-100 mb-3">Cette semaine</h3>
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4">
        <Stat label="Total" value={fromMinutes(weekTotal)} />
        <Stat label="Jours saisis" value={`${filled.length}/5`} />
        <Stat label="Moyenne/jour" value={weekAvg !== null ? fromMinutes(weekAvg) : '—'} />
        <Stat
          label="Delta objectif"
          value={`${weekDelta >= 0 ? '+' : '-'}${fromMinutes(Math.abs(weekDelta))}`}
          accent={weekDelta >= 0 ? 'positive' : 'negative'}
        />
      </div>
    </div>
  )
}

// ── Helpers UI ────────────────────────────────────────────────────────────────

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
    accent === 'positive' ? 'text-emerald-600 dark:text-emerald-400'
    : accent === 'negative' ? 'text-red-500 dark:text-red-400'
    : 'text-zinc-900 dark:text-zinc-100'
  return (
    <div>
      <p className="text-xs text-zinc-400 dark:text-zinc-500 mb-0.5">{label}</p>
      <p className={`text-base font-semibold tabular-nums ${valueColor}`}>{value}</p>
    </div>
  )
}
