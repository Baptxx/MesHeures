import { fromMinutes } from '@/lib/time'

interface Props {
  label: string
  minutes: number | null
  highlight?: boolean
}

export function DurationRow({ label, minutes, highlight }: Props) {
  return (
    <div className={`flex items-center justify-between py-1.5 ${highlight ? 'font-semibold' : ''}`}>
      <span className="text-xs text-zinc-500 dark:text-zinc-400">{label}</span>
      <span className={`text-sm tabular-nums ${highlight ? 'text-zinc-900 dark:text-zinc-100' : 'text-zinc-700 dark:text-zinc-300'}`}>
        {minutes !== null ? fromMinutes(minutes) : '—'}
      </span>
    </div>
  )
}
