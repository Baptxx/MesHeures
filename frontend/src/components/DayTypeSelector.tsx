import type { AbsenceType } from '@/lib/types'

export type DayType = 'travail' | 'tt' | AbsenceType

export const DAY_TYPE_LABELS: Record<DayType, string> = {
  travail: 'Travail',
  tt: 'Télétravail',
  conge_paye: 'Congé payé',
  rtt: 'RTT',
  maladie: 'Maladie',
  autre: 'Autre',
}

// Types pour lesquels le jour reste "travaillé" (heures pointées, champs affichés)
export function isWorkedDayType(t: DayType): t is 'travail' | 'tt' {
  return t === 'travail' || t === 'tt'
}

const OPTIONS: DayType[] = ['travail', 'tt', 'conge_paye', 'rtt', 'maladie', 'autre']

interface Props {
  value: DayType
  onChange: (value: DayType) => void
}

export function DayTypeSelector({ value, onChange }: Props) {
  return (
    <div className="flex gap-1.5 flex-wrap">
      {OPTIONS.map(opt => (
        <button
          key={opt}
          type="button"
          onClick={() => onChange(opt)}
          className={`px-3 py-1.5 rounded-lg text-xs font-medium border transition-colors touch-manipulation ${
            value === opt
              ? 'bg-zinc-900 dark:bg-zinc-100 text-white dark:text-zinc-900 border-zinc-900 dark:border-zinc-100'
              : 'bg-white dark:bg-zinc-800/50 text-zinc-500 dark:text-zinc-400 border-zinc-200 dark:border-zinc-700'
          }`}
        >
          {DAY_TYPE_LABELS[opt]}
        </button>
      ))}
    </div>
  )
}
