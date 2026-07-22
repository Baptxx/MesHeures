import type { Absence, AbsenceType, DayEntry, Settings } from '@/lib/types'
import { currentYear } from '@/lib/time'
import { AbsenceCalendar } from './AbsenceCalendar'

interface Props {
  entries: Record<string, DayEntry>
  absences: Record<string, Absence>
  settings: Settings
  onApply: (date: string, type: AbsenceType) => Promise<void>
  onClear: (date: string) => Promise<void>
}

export function CongesPage({ entries, absences, settings, onApply, onClear }: Props) {
  const year = currentYear()
  const absenceList = Object.values(absences)
  const thisYear = absenceList.filter(a => a.date.startsWith(String(year)))

  const countByType = (type: Absence['type']) => thisYear.filter(a => a.type === type).length

  const congePaye = countByType('conge_paye')
  const rtt = countByType('rtt')
  const maladie = countByType('maladie')
  const autre = countByType('autre')

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <QuotaCard label="Congés payés" used={congePaye} allocated={settings.leaveCongePayeAnnualDays} color="#3b82f6" />
        <QuotaCard label="RTT" used={rtt} allocated={settings.leaveRttAnnualDays} color="#a855f7" />
      </div>

      <div className="grid grid-cols-2 gap-4">
        <CountCard label="Maladie" value={maladie} color="#ef4444" />
        <CountCard label="Autre" value={autre} color="#71717a" />
      </div>

      <AbsenceCalendar entries={entries} absences={absences} settings={settings} onApply={onApply} onClear={onClear} />
    </div>
  )
}

function QuotaCard({ label, used, allocated, color }: { label: string; used: number; allocated: number; color: string }) {
  const remaining = allocated - used
  const pct = allocated > 0 ? Math.min(used / allocated, 1) : 0
  return (
    <div className="rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 shadow-sm p-4 sm:p-5">
      <div className="flex items-baseline justify-between mb-2">
        <h3 className="text-sm font-semibold text-zinc-900 dark:text-zinc-100">{label}</h3>
        <span className="text-xs text-zinc-400">{allocated > 0 ? `${allocated} j/an` : 'aucun quota'}</span>
      </div>
      <div className="flex items-baseline gap-2 mb-2">
        <span className="text-2xl font-bold tabular-nums text-zinc-900 dark:text-zinc-100">{remaining}</span>
        <span className="text-xs text-zinc-400">jours restants</span>
      </div>
      {allocated > 0 && (
        <div className="h-1.5 bg-zinc-100 dark:bg-zinc-800 rounded-full overflow-hidden">
          <div className="h-full rounded-full transition-all duration-500" style={{ width: `${pct * 100}%`, backgroundColor: color }} />
        </div>
      )}
      <p className="text-[11px] text-zinc-400 mt-1.5">{used} utilisé{used > 1 ? 's' : ''} cette année</p>
    </div>
  )
}

function CountCard({ label, value, color }: { label: string; value: number; color: string }) {
  return (
    <div className="rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 shadow-sm p-4 sm:p-5">
      <h3 className="text-sm font-semibold text-zinc-900 dark:text-zinc-100 mb-2">{label}</h3>
      <div className="flex items-baseline gap-2">
        <span className="text-2xl font-bold tabular-nums" style={{ color }}>{value}</span>
        <span className="text-xs text-zinc-400">jour{value > 1 ? 's' : ''} cette année</span>
      </div>
    </div>
  )
}
