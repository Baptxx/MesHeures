import { Scale } from 'lucide-react'
import type { DayEntry, Settings } from '@/lib/types'
import { calcRunningBalance, fromMinutes } from '@/lib/time'

interface Props {
  entries: Record<string, DayEntry>
  settings: Settings
}

export function BalanceCard({ entries, settings }: Props) {
  const balance = calcRunningBalance(entries, settings)
  const positive = balance >= 0

  return (
    <div className="rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 shadow-sm px-4 sm:px-6 py-4 flex items-center justify-between">
      <div className="flex items-center gap-2.5">
        <div className={`p-2 rounded-lg ${positive ? 'bg-emerald-50 dark:bg-emerald-950' : 'bg-red-50 dark:bg-red-950'}`}>
          <Scale className={`w-4 h-4 ${positive ? 'text-emerald-600 dark:text-emerald-400' : 'text-red-500 dark:text-red-400'}`} />
        </div>
        <div>
          <p className="text-sm font-semibold text-zinc-900 dark:text-zinc-100">Solde cumulé</p>
          <p className="text-xs text-zinc-400">Depuis le début du suivi</p>
        </div>
      </div>
      <span className={`text-lg font-bold tabular-nums ${positive ? 'text-emerald-600 dark:text-emerald-400' : 'text-red-500 dark:text-red-400'}`}>
        {positive ? '+' : '-'}{fromMinutes(Math.abs(balance))}
      </span>
    </div>
  )
}
